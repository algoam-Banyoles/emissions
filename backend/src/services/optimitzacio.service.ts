import { z } from "zod";

const layerCostByType: Record<string, number> = {
  RODAMENT: 4.8,
  INTERMEDIA: 4.1,
  BASE: 3.6,
  SUBBASE: 2.9,
  FONAMENT: 2.4,
};

const verificacioSchema = z.object({
  ratios: z.object({
    fatiga: z.number(),
    aixecament: z.number(),
  }),
  deformacions: z.object({
    deformacioSuperficialMm: z.number(),
  }),
});

const estructuraSchema = z.object({
  id: z.string().min(1),
  gruixTotalCm: z.number().positive(),
  capes: z.array(
    z.object({
      tipus: z.string().min(1),
      gruixCm: z.number().positive(),
    }),
  ),
  verificacio: verificacioSchema,
  emissions: z
    .object({
      totalKgT: z.number().min(0),
      kgM2: z.number().min(0),
    })
    .optional(),
  costos: z
    .object({
      totalEurM2: z.number().nonnegative(),
      costAnyVidaUtilEurM2: z.number().nonnegative(),
    })
    .optional(),
});

const pesosSchema = z.object({
  estructural: z.number().min(0),
  emissions: z.number().min(0),
  economic: z.number().min(0),
});

const analisiOptionsSchema = z
  .object({
    increment: z.number().positive().max(1).optional(),
    robustThresholdPercent: z.number().min(0).max(100).optional(),
  })
  .optional();

interface Objectives {
  estructural: number;
  emissions: number;
  economic: number;
}

interface ObjectiveExtremes {
  estructural: { min: number; max: number };
  emissions: { min: number; max: number };
  economic: { min: number; max: number };
}

interface Candidate {
  id: string;
  raw: z.infer<typeof estructuraSchema>;
  objectives: Objectives;
  normalized: Objectives;
}

interface WeightedRankingRow {
  id: string;
  weightedScore: number;
  objectives: Objectives;
  normalized: Objectives;
  estructura: z.infer<typeof estructuraSchema>;
}

interface ParetoRow extends WeightedRankingRow {
  crowdingDistance: number;
  rank: number;
}

function round(value: number, decimals = 6) {
  return Number(value.toFixed(decimals));
}

function normalizeWeights(input: z.infer<typeof pesosSchema>) {
  const sum = input.estructural + input.emissions + input.economic;
  if (sum <= 0) {
    return { estructural: 1 / 3, emissions: 1 / 3, economic: 1 / 3 };
  }

  return {
    estructural: input.estructural / sum,
    emissions: input.emissions / sum,
    economic: input.economic / sum,
  };
}

function objectiveEstructural(estructura: z.infer<typeof estructuraSchema>) {
  const ratioFatiga = Math.max(0, estructura.verificacio.ratios.fatiga);
  const ratioAixecament = Math.max(0, estructura.verificacio.ratios.aixecament);
  const deformacioNorm = Math.max(0, estructura.verificacio.deformacions.deformacioSuperficialMm / 25);

  return ratioFatiga * 0.45 + ratioAixecament * 0.45 + deformacioNorm * 0.1;
}

function objectiveEmissions(estructura: z.infer<typeof estructuraSchema>) {
  if (estructura.emissions) {
    return Math.max(0, estructura.emissions.totalKgT);
  }
  return 45 + estructura.gruixTotalCm * 0.45;
}

function objectiveEconomic(estructura: z.infer<typeof estructuraSchema>) {
  if (estructura.costos?.totalEurM2 !== undefined) {
    return Math.max(0, estructura.costos.totalEurM2);
  }
  let cost = 0;
  for (const capa of estructura.capes) {
    const unitCost = layerCostByType[capa.tipus.toUpperCase()] ?? 3.2;
    cost += unitCost * capa.gruixCm;
  }
  return cost;
}

function computeObjectives(estructuraInput: z.infer<typeof estructuraSchema>): Objectives {
  return {
    estructural: objectiveEstructural(estructuraInput),
    emissions: objectiveEmissions(estructuraInput),
    economic: objectiveEconomic(estructuraInput),
  };
}

function computeExtremes(candidates: { objectives: Objectives }[]): ObjectiveExtremes {
  return {
    estructural: {
      min: Math.min(...candidates.map((item) => item.objectives.estructural)),
      max: Math.max(...candidates.map((item) => item.objectives.estructural)),
    },
    emissions: {
      min: Math.min(...candidates.map((item) => item.objectives.emissions)),
      max: Math.max(...candidates.map((item) => item.objectives.emissions)),
    },
    economic: {
      min: Math.min(...candidates.map((item) => item.objectives.economic)),
      max: Math.max(...candidates.map((item) => item.objectives.economic)),
    },
  };
}

function normalizeValue(value: number, min: number, max: number) {
  if (max <= min) {
    return 0;
  }
  return (value - min) / (max - min);
}

function enrichCandidates(estructures: z.infer<typeof estructuraSchema>[]): Candidate[] {
  const withObjectives = estructures.map((estructura) => ({
    id: estructura.id,
    raw: estructura,
    objectives: computeObjectives(estructura),
  }));
  const extremes = computeExtremes(withObjectives);

  return withObjectives.map((item) => ({
    ...item,
    normalized: {
      estructural: normalizeValue(item.objectives.estructural, extremes.estructural.min, extremes.estructural.max),
      emissions: normalizeValue(item.objectives.emissions, extremes.emissions.min, extremes.emissions.max),
      economic: normalizeValue(item.objectives.economic, extremes.economic.min, extremes.economic.max),
    },
  }));
}

function weightedScore(normalized: Objectives, weights: ReturnType<typeof normalizeWeights>) {
  return (
    normalized.estructural * weights.estructural +
    normalized.emissions * weights.emissions +
    normalized.economic * weights.economic
  );
}

function dominates(a: Candidate, b: Candidate) {
  const allLeq =
    a.normalized.estructural <= b.normalized.estructural &&
    a.normalized.emissions <= b.normalized.emissions &&
    a.normalized.economic <= b.normalized.economic;
  const anyLt =
    a.normalized.estructural < b.normalized.estructural ||
    a.normalized.emissions < b.normalized.emissions ||
    a.normalized.economic < b.normalized.economic;
  return allLeq && anyLt;
}

function fastNonDominatedSort(candidates: Candidate[]) {
  const dominationSets = new Map<string, Set<string>>();
  const dominatedCount = new Map<string, number>();
  const byId = new Map(candidates.map((item) => [item.id, item]));
  const fronts: string[][] = [[]];

  for (const p of candidates) {
    dominationSets.set(p.id, new Set<string>());
    dominatedCount.set(p.id, 0);

    for (const q of candidates) {
      if (p.id === q.id) {
        continue;
      }
      if (dominates(p, q)) {
        dominationSets.get(p.id)?.add(q.id);
      } else if (dominates(q, p)) {
        dominatedCount.set(p.id, (dominatedCount.get(p.id) ?? 0) + 1);
      }
    }

    if ((dominatedCount.get(p.id) ?? 0) === 0) {
      fronts[0]?.push(p.id);
    }
  }

  let i = 0;
  while ((fronts[i]?.length ?? 0) > 0) {
    const next: string[] = [];
    for (const pId of fronts[i] ?? []) {
      for (const qId of dominationSets.get(pId) ?? []) {
        dominatedCount.set(qId, (dominatedCount.get(qId) ?? 1) - 1);
        if ((dominatedCount.get(qId) ?? 0) === 0) {
          next.push(qId);
        }
      }
    }
    i += 1;
    fronts[i] = next;
  }

  return {
    fronts: fronts.filter((front) => front.length > 0).map((front) =>
      front.map((id) => byId.get(id)).filter((item): item is Candidate => item !== undefined),
    ),
  };
}

function crowdingDistance(front: Candidate[]) {
  const distance = new Map(front.map((item) => [item.id, 0]));
  const metrics: (keyof Objectives)[] = ["estructural", "emissions", "economic"];

  for (const metric of metrics) {
    const sorted = [...front].sort((a, b) => a.normalized[metric] - b.normalized[metric]);
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    if (!first || !last) {
      continue;
    }

    distance.set(first.id, Number.POSITIVE_INFINITY);
    distance.set(last.id, Number.POSITIVE_INFINITY);

    const span = last.normalized[metric] - first.normalized[metric];
    if (span <= 0) {
      continue;
    }

    for (let index = 1; index < sorted.length - 1; index += 1) {
      const previous = sorted[index - 1];
      const current = sorted[index];
      const next = sorted[index + 1];
      if (!previous || !current || !next) {
        continue;
      }
      const gain = (next.normalized[metric] - previous.normalized[metric]) / span;
      distance.set(current.id, (distance.get(current.id) ?? 0) + gain);
    }
  }

  return distance;
}

function toWeightedRow(candidate: Candidate, weights: ReturnType<typeof normalizeWeights>): WeightedRankingRow {
  return {
    id: candidate.id,
    weightedScore: round(weightedScore(candidate.normalized, weights)),
    objectives: {
      estructural: round(candidate.objectives.estructural),
      emissions: round(candidate.objectives.emissions),
      economic: round(candidate.objectives.economic),
    },
    normalized: {
      estructural: round(candidate.normalized.estructural),
      emissions: round(candidate.normalized.emissions),
      economic: round(candidate.normalized.economic),
    },
    estructura: candidate.raw,
  };
}

export const optimitzacioService = {
  optimitzarPonderacio(
    estructuresInput: unknown,
    pesosInput: unknown,
  ) {
    const estructures = z.array(estructuraSchema).min(1).parse(estructuresInput);
    const pesos = normalizeWeights(pesosSchema.parse(pesosInput));
    const candidates = enrichCandidates(estructures);

    const ranking = candidates
      .map((candidate) => toWeightedRow(candidate, pesos))
      .sort((a, b) => a.weightedScore - b.weightedScore);

    const millor = ranking[0];
    if (!millor) {
      throw new Error("No s'ha pogut determinar una solucio optima");
    }

    return {
      pesos,
      millor,
      ranking,
      justificacio: `Solucio ${millor.id} amb score ponderat minim ${millor.weightedScore.toFixed(4)}`,
    };
  },

  optimitzarPareto(estructuresInput: unknown) {
    const estructures = z.array(estructuraSchema).min(1).parse(estructuresInput);
    const candidates = enrichCandidates(estructures);
    const sorted = fastNonDominatedSort(candidates);

    const fronts = sorted.fronts.map((front, index) => {
      const distances = crowdingDistance(front);
      return front
        .map((candidate): ParetoRow => ({
          ...toWeightedRow(candidate, { estructural: 1 / 3, emissions: 1 / 3, economic: 1 / 3 }),
          crowdingDistance: round(distances.get(candidate.id) ?? 0),
          rank: index + 1,
        }))
        .sort((a, b) => b.crowdingDistance - a.crowdingDistance);
    });

    return {
      noDominades: fronts[0] ?? [],
      fronts,
      resum: {
        totalSolucions: estructures.length,
        noDominades: (fronts[0] ?? []).length,
        fronts: fronts.length,
      },
    };
  },

  analisiSensibilitat(
    estructuresInput: unknown,
    optionsInput?: unknown,
  ) {
    const estructures = z.array(estructuraSchema).min(1).parse(estructuresInput);
    const options = analisiOptionsSchema.parse(optionsInput ?? {});
    const increment = options?.increment ?? 0.1;

    const results: {
      pesos: { estructural: number; emissions: number; economic: number };
      millorId: string;
      score: number;
    }[] = [];

    for (let wEstructural = 0; wEstructural <= 1 + 1e-9; wEstructural += increment) {
      for (let wEmissions = 0; wEmissions <= 1 - wEstructural + 1e-9; wEmissions += increment) {
        const wEconomic = 1 - wEstructural - wEmissions;
        if (wEconomic < -1e-9) {
          continue;
        }
        const weights = {
          estructural: round(Math.max(0, wEstructural), 4),
          emissions: round(Math.max(0, wEmissions), 4),
          economic: round(Math.max(0, wEconomic), 4),
        };
        const best = this.optimitzarPonderacio(estructures, weights).millor;
        results.push({
          pesos: weights,
          millorId: best.id,
          score: best.weightedScore,
        });
      }
    }

    const freq = new Map<string, number>();
    for (const row of results) {
      freq.set(row.millorId, (freq.get(row.millorId) ?? 0) + 1);
    }
    const total = results.length;
    const robustThreshold = ((options?.robustThresholdPercent ?? 15) / 100) * total;
    const solucionsRobustes = Array.from(freq.entries())
      .filter(([, count]) => count >= robustThreshold)
      .map(([id, count]) => ({
        id,
        aparicions: count,
        percentatge: round((count / total) * 100, 2),
      }))
      .sort((a, b) => b.aparicions - a.aparicions);

    return {
      increment,
      totalEscenaris: total,
      matriuResultats: results,
      solucionsRobustes,
    };
  },

  objectius(estructuraInput: unknown) {
    const estructura = estructuraSchema.parse(estructuraInput);
    return computeObjectives(estructura);
  },
};


