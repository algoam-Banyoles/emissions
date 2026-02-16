import { describe, expect, it } from "vitest";

import { optimitzacioService } from "./optimitzacio.service.js";

const structures = [
  {
    id: "s1",
    gruixTotalCm: 28,
    capes: [
      { tipus: "RODAMENT", gruixCm: 4 },
      { tipus: "BASE", gruixCm: 10 },
      { tipus: "SUBBASE", gruixCm: 14 },
    ],
    verificacio: {
      ratios: { fatiga: 0.55, aixecament: 0.6 },
      deformacions: { deformacioSuperficialMm: 9 },
    },
    emissions: {
      totalKgT: 52,
      kgM2: 31,
    },
  },
  {
    id: "s2",
    gruixTotalCm: 24,
    capes: [
      { tipus: "RODAMENT", gruixCm: 4 },
      { tipus: "BASE", gruixCm: 8 },
      { tipus: "SUBBASE", gruixCm: 12 },
    ],
    verificacio: {
      ratios: { fatiga: 0.72, aixecament: 0.75 },
      deformacions: { deformacioSuperficialMm: 12 },
    },
    emissions: {
      totalKgT: 45,
      kgM2: 26,
    },
  },
  {
    id: "s3",
    gruixTotalCm: 34,
    capes: [
      { tipus: "RODAMENT", gruixCm: 5 },
      { tipus: "INTERMEDIA", gruixCm: 8 },
      { tipus: "BASE", gruixCm: 11 },
      { tipus: "SUBBASE", gruixCm: 10 },
    ],
    verificacio: {
      ratios: { fatiga: 0.41, aixecament: 0.48 },
      deformacions: { deformacioSuperficialMm: 8 },
    },
    emissions: {
      totalKgT: 60,
      kgM2: 37,
    },
  },
  {
    id: "s4",
    gruixTotalCm: 26,
    capes: [
      { tipus: "RODAMENT", gruixCm: 4 },
      { tipus: "BASE", gruixCm: 9 },
      { tipus: "SUBBASE", gruixCm: 13 },
    ],
    verificacio: {
      ratios: { fatiga: 0.63, aixecament: 0.66 },
      deformacions: { deformacioSuperficialMm: 10 },
    },
    emissions: {
      totalKgT: 49,
      kgM2: 28,
    },
  },
];

describe("optimitzacioService.optimitzarPonderacio", () => {
  it("retorna una millor solucio i ranking ordenat", () => {
    const result = optimitzacioService.optimitzarPonderacio(structures, {
      estructural: 0.5,
      emissions: 0.3,
      economic: 0.2,
    });

    expect(result.millor).toBeDefined();
    expect(result.ranking.length).toBe(structures.length);
    expect(result.ranking[0]?.weightedScore).toBeLessThanOrEqual(result.ranking[1]?.weightedScore ?? Number.POSITIVE_INFINITY);
  });
});

describe("optimitzacioService.optimitzarPareto", () => {
  it("troba frontera no dominada", () => {
    const result = optimitzacioService.optimitzarPareto(structures);

    expect(result.noDominades.length).toBeGreaterThan(0);
    expect(result.fronts.length).toBeGreaterThan(0);
    expect(result.resum.totalSolucions).toBe(structures.length);
  });
});

describe("optimitzacioService.analisiSensibilitat", () => {
  it("genera matriu de sensibilitat i solucions robustes", () => {
    const result = optimitzacioService.analisiSensibilitat(structures, {
      increment: 0.25,
      robustThresholdPercent: 20,
    });

    expect(result.totalEscenaris).toBeGreaterThan(0);
    expect(result.matriuResultats.length).toBe(result.totalEscenaris);
    expect(result.solucionsRobustes.length).toBeGreaterThan(0);
  });
});

describe("optimitzacioService amb costos precomputats", () => {
  it("prioritza costos quan hi ha camp costos disponible", () => {
    const withCosts = structures.map((item, index) => ({
      ...item,
      costos: {
        totalEurM2: index === 1 ? 20 : 50 + index,
        costAnyVidaUtilEurM2: index === 1 ? 1 : 3 + index,
      },
    }));

    const result = optimitzacioService.optimitzarPonderacio(withCosts, {
      estructural: 0,
      emissions: 0,
      economic: 1,
    });

    expect(result.millor.id).toBe("s2");
  });
});
