import crypto from "node:crypto";

import { TipologiaMescla } from "@prisma/client";
import { z } from "zod";

import { calculsEconomicsService, type CostTotalResult } from "./calculsEconomics.service.js";
import { calculsEmissionsService } from "./calculsEmissions.service.js";
import { calculsEstructuralsService } from "./calculsEstructurals.service.js";
import { prisma } from "../config/database.js";
import { type CapaFirme, type RestriccionsCombinacio, type TipologiaFirme } from "../types/estructural.js";
import { HttpError } from "../utils/http-error.js";

const processThreshold = 4000;
const cacheTtlMs = 10 * 60 * 1000;

const restrictionsSchema = z.object({
  tipologia: z.enum(["NOVA_CONSTRUCCIO", "REFORC", "RECICLATGE", "AUTL"]).default("NOVA_CONSTRUCCIO"),
  maxGruixTotalCm: z.number().positive().optional(),
  limitCombinacions: z.number().int().positive().max(250000).optional(),
  materialsPermesos: z.array(z.string().min(1)).optional(),
  modulFonamentMpa: z.number().positive().default(250),
  distanciaMaterialsKm: z.number().min(0).default(25),
  distanciaMesclaKm: z.number().min(0).default(35),
  areaM2: z.number().positive().default(1),
  vidaUtilAnys: z.number().int().positive().default(20),
  tarifaTransportEurTKm: z.number().nonnegative().default(0.11),
  tarifaFabricacioEurT: z.number().nonnegative().default(17),
  tarifaPosadaObraEurM2: z.number().nonnegative().default(6.5),
  preuMaterialPerTipus: z
    .object({
      RODAMENT: z.number().nonnegative().optional(),
      INTERMEDIA: z.number().nonnegative().optional(),
      BASE: z.number().nonnegative().optional(),
      SUBBASE: z.number().nonnegative().optional(),
      FONAMENT: z.number().nonnegative().optional(),
    })
    .optional(),
  capes: z
    .array(
      z.object({
        tipus: z.enum(["RODAMENT", "INTERMEDIA", "BASE", "SUBBASE", "FONAMENT"]),
        gruixMinCm: z.number().positive(),
        gruixMaxCm: z.number().positive(),
        pasCm: z.number().positive().default(0.5),
        modulElasticMpa: z.number().positive(),
        coeficientPoisson: z.number().min(0.05).max(0.49).optional(),
        nom: z.string().optional(),
      }),
    )
    .optional(),
  asynchronous: z.boolean().default(false),
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(200).default(20),
});

const listGeneratedSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(200).default(20),
  incloureEmissions: z
    .union([z.boolean(), z.enum(["true", "false"])])
    .optional()
    .transform((value) => {
      if (typeof value === "string") {
        return value === "true";
      }
      return value ?? false;
    }),
  nivellEmissions: z.enum(["BAIX", "MITJA", "ALT"]).optional(),
  maxEmissionsKgT: z.coerce.number().positive().optional(),
  minCostEurM2: z.coerce.number().nonnegative().optional(),
  maxCostEurM2: z.coerce.number().nonnegative().optional(),
  distanciaMaterialsKm: z.coerce.number().min(0).optional(),
  distanciaMesclaKm: z.coerce.number().min(0).optional(),
});

interface Identity {
  organitzacioId: string;
}

interface EstructuraEmissions {
  totalKgT: number;
  kgM2: number;
  nivell: "BAIX" | "MITJA" | "ALT";
  distanciaMaterialsKm: number;
  distanciaMesclaKm: number;
}

interface EstructuraViable {
  id: string;
  capes: CapaFirme[];
  gruixTotalCm: number;
  verificacio: ReturnType<typeof calculsEstructuralsService.verificarEstructura>;
  emissions?: EstructuraEmissions;
  costos?: CostTotalResult;
}

interface GenerationResult {
  mode: "sync";
  cacheHit: boolean;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  items: EstructuraViable[];
  meta: {
    combinacionsTotals: number;
    viablesTotals: number;
  };
}

interface GenerationAsyncAccepted {
  mode: "async";
  jobId: string;
  status: "queued" | "processing";
  progress: number;
}

interface GenerationAsyncDone {
  mode: "async";
  jobId: string;
  status: "completed";
  progress: number;
  result: GenerationResult;
}

interface GenerationAsyncFailed {
  mode: "async";
  jobId: string;
  status: "failed";
  progress: number;
  error: string;
}

type GenerationAsyncStatus = GenerationAsyncAccepted | GenerationAsyncDone | GenerationAsyncFailed;

interface JobRecord {
  id: string;
  key: string;
  status: "queued" | "processing" | "completed" | "failed";
  progress: number;
  createdAt: number;
  page: number;
  pageSize: number;
  result?: GenerationResult;
  error?: string;
}

interface StoredEstructuraRow {
  estructura_id: string;
  tipologia: string;
  gruix_total_cm: number;
  capes_json: string | CapaFirme[];
  verificacio_json: string | ReturnType<typeof calculsEstructuralsService.verificarEstructura>;
  emissions_total_kg_t: number;
  emissions_kg_m2: number;
  emissions_nivell: "BAIX" | "MITJA" | "ALT";
  distancia_materials_km: number;
  distancia_mescla_km: number;
  costos_json: string | CostTotalResult | null;
}

const resultsCache = new Map<string, { createdAt: number; value: EstructuraViable[]; combinacionsTotals: number }>();
const jobs = new Map<string, JobRecord>();
let emissionsTableEnsured = false;

function cleanupCache() {
  const now = Date.now();
  for (const [key, value] of resultsCache.entries()) {
    if (now - value.createdAt > cacheTtlMs) {
      resultsCache.delete(key);
    }
  }
}

function toHash(value: unknown) {
  return crypto.createHash("sha1").update(JSON.stringify(value)).digest("hex");
}

function toPaginatedResult(items: EstructuraViable[], page: number, pageSize: number, combinacionsTotals: number, cacheHit: boolean): GenerationResult {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  const paged = items.slice(start, start + pageSize);

  return {
    mode: "sync",
    cacheHit,
    pagination: { page, pageSize, total, totalPages },
    items: paged,
    meta: {
      combinacionsTotals,
      viablesTotals: total,
    },
  };
}

function computeTrafficFactors(projecte: {
  imd: number | null;
  percentatgeVp: number | null;
  tipusTracat: string | null;
  vidaUtil: number | null;
  creixementAnual: number | null;
}) {
  const factorDistribucio = projecte.tipusTracat?.toUpperCase().includes("DOBLE") ? 0.5 : 0.6;
  const factorEquivalencia = 1.2;

  return {
    imd: projecte.imd ?? 10000,
    percentatgePesants: projecte.percentatgeVp ?? 10,
    factorDistribucio,
    factorEquivalencia,
    anysProjecte: projecte.vidaUtil ?? 20,
    creixementAnualPercent: projecte.creixementAnual ?? 2,
  };
}

function mapTipologiaToMescla(tipologia: TipologiaFirme): TipologiaMescla {
  if (tipologia === "AUTL") {
    return TipologiaMescla.AUTL;
  }
  if (tipologia === "RECICLATGE") {
    return TipologiaMescla.MBC_AMB_RA;
  }
  return TipologiaMescla.MBC_CONVENCIONAL;
}

function inferEmissionLevel(valueKgT: number): "BAIX" | "MITJA" | "ALT" {
  if (valueKgT <= 45) {
    return "BAIX";
  }
  if (valueKgT <= 65) {
    return "MITJA";
  }
  return "ALT";
}

function computeLayerMasses(capes: CapaFirme[], tipologia: TipologiaFirme) {
  const densityTM3 = 2.4;
  let totalMass = 0;
  let bitumMass = 0;
  let aridMass = 0;
  let raMass = 0;

  for (const capa of capes) {
    const layerMass = densityTM3 * (capa.gruixCm / 100);
    totalMass += layerMass;

    const bitumPercent =
      capa.tipus === "RODAMENT"
        ? 5.5
        : capa.tipus === "INTERMEDIA"
          ? 4.8
          : capa.tipus === "BASE"
            ? 4.2
            : 0;

    const layerBitum = layerMass * (bitumPercent / 100);
    const layerSolid = Math.max(0, layerMass - layerBitum);

    bitumMass += layerBitum;

    if (tipologia === "RECICLATGE" && (capa.tipus === "BASE" || capa.tipus === "SUBBASE")) {
      const raRatio = 0.2;
      const layerRa = layerSolid * raRatio;
      raMass += layerRa;
      aridMass += Math.max(0, layerSolid - layerRa);
    } else {
      aridMass += layerSolid;
    }
  }

  return {
    totalMass,
    bitumMass,
    aridMass,
    raMass,
  };
}

async function calculateEstructuraEmissions(params: {
  capes: CapaFirme[];
  tipologia: TipologiaFirme;
  distanciaMaterialsKm: number;
  distanciaMesclaKm: number;
}): Promise<EstructuraEmissions> {
  const masses = computeLayerMasses(params.capes, params.tipologia);
  const totalMass = Math.max(masses.totalMass, 0.0001);

  const composicio = [
    {
      codiMaterial: "10a",
      quantitatTones: masses.aridMass,
      distanciaKm: params.distanciaMaterialsKm,
      tipusVehicle: "20/40",
    },
    {
      codiMaterial: "14a",
      quantitatTones: masses.bitumMass,
      distanciaKm: params.distanciaMaterialsKm,
      tipusVehicle: "22",
    },
  ];

  if (masses.raMass > 0) {
    composicio.push({
      codiMaterial: "13",
      quantitatTones: masses.raMass,
      distanciaKm: params.distanciaMaterialsKm,
      tipusVehicle: "20/40",
    });
  }

  const resultat = await calculsEmissionsService.calcularPetjadaTotal({
    totalMesclaTones: totalMass,
    composicio,
    parametresFabricacio: {
      temperaturaInicialC: 20,
      temperaturaMesclaC: 160,
      humitatPercent: 2.5,
      perduesCalorPercent: 15,
      perduesRendimentMJ: 5,
      combustible: "GASOLEO",
      fontElectrica: "RED",
      fontCalentament: "CALDERA",
    },
    transportMescla: {
      distanciaKm: params.distanciaMesclaKm,
      mermesPercent: 2,
      tipusVehicle: "20/40",
    },
    equips: [
      { nomEquip: "extendedora", horesPerTona: 0.008, tones: totalMass },
      { nomEquip: "compactador_tandem_11t", horesPerTona: 0.008, tones: totalMass },
    ],
    tipologiaMescla: mapTipologiaToMescla(params.tipologia),
  });

  const kgM2 = resultat.total;
  const totalKgT = kgM2 / totalMass;

  return {
    totalKgT: Number(totalKgT.toFixed(6)),
    kgM2: Number(kgM2.toFixed(6)),
    nivell: inferEmissionLevel(totalKgT),
    distanciaMaterialsKm: params.distanciaMaterialsKm,
    distanciaMesclaKm: params.distanciaMesclaKm,
  };
}

function calculateEstructuraCosts(params: {
  capes: CapaFirme[];
  tipologia: TipologiaFirme;
  distanciaMaterialsKm: number;
  areaM2: number;
  vidaUtilAnys: number;
  tarifaTransportEurTKm: number;
  tarifaFabricacioEurT: number;
  tarifaPosadaObraEurM2: number;
  preuMaterialPerTipus?: Partial<Record<CapaFirme["tipus"], number | undefined>>;
}): CostTotalResult {
  const preus = {
    costFabricacioEurT: params.tarifaFabricacioEurT,
    ...(params.preuMaterialPerTipus ? { preuMaterialPerTipus: params.preuMaterialPerTipus } : {}),
  };

  return calculsEconomicsService.calcularCostTotal({
    estructura: {
      capes: params.capes,
      tipologia: params.tipologia,
    },
    preus,
    distancies: {
      distanciaGeneralKm: params.distanciaMaterialsKm,
      tarifaTransportEurTKm: params.tarifaTransportEurTKm,
    },
    areaM2: params.areaM2,
    vidaUtilAnys: params.vidaUtilAnys,
    tarifaPosadaObraEurM2: params.tarifaPosadaObraEurM2,
  });
}

async function ensureEmissionsTable() {
  if (emissionsTableEnsured) {
    return;
  }

  if (!("$executeRawUnsafe" in prisma)) {
    emissionsTableEnsured = true;
    return;
  }

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS estructura_emissions (
      id TEXT PRIMARY KEY,
      projecte_id TEXT NOT NULL,
      estructura_id TEXT NOT NULL,
      tipologia TEXT NOT NULL,
      gruix_total_cm DOUBLE PRECISION NOT NULL,
      capes_json JSONB NOT NULL,
      verificacio_json JSONB NOT NULL,
      emissions_total_kg_t DOUBLE PRECISION NOT NULL,
      emissions_kg_m2 DOUBLE PRECISION NOT NULL,
      emissions_nivell TEXT NOT NULL,
      distancia_materials_km DOUBLE PRECISION NOT NULL,
      distancia_mescla_km DOUBLE PRECISION NOT NULL,
      costos_json JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE estructura_emissions
    ADD COLUMN IF NOT EXISTS costos_json JSONB;
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_estructura_emissions_projecte ON estructura_emissions(projecte_id);
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_estructura_emissions_nivell ON estructura_emissions(emissions_nivell);
  `);

  emissionsTableEnsured = true;
}

async function persistEstructures(params: {
  projecteId: string;
  tipologia: TipologiaFirme;
  items: EstructuraViable[];
}) {
  if (!("$executeRawUnsafe" in prisma)) {
    return;
  }

  await ensureEmissionsTable();

  for (const item of params.items) {
    if (!item.emissions) {
      continue;
    }
    const storageId = `${params.projecteId}:${item.id}`;
    await prisma.$executeRawUnsafe(
      `
        INSERT INTO estructura_emissions (
          id,
          projecte_id,
          estructura_id,
          tipologia,
          gruix_total_cm,
          capes_json,
          verificacio_json,
          emissions_total_kg_t,
          emissions_kg_m2,
          emissions_nivell,
          distancia_materials_km,
          distancia_mescla_km,
          costos_json,
          updated_at
        ) VALUES (
          $1,$2,$3,$4,$5,$6::jsonb,$7::jsonb,$8,$9,$10,$11,$12,$13::jsonb,NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          tipologia = EXCLUDED.tipologia,
          gruix_total_cm = EXCLUDED.gruix_total_cm,
          capes_json = EXCLUDED.capes_json,
          verificacio_json = EXCLUDED.verificacio_json,
          emissions_total_kg_t = EXCLUDED.emissions_total_kg_t,
          emissions_kg_m2 = EXCLUDED.emissions_kg_m2,
          emissions_nivell = EXCLUDED.emissions_nivell,
          distancia_materials_km = EXCLUDED.distancia_materials_km,
          distancia_mescla_km = EXCLUDED.distancia_mescla_km,
          costos_json = EXCLUDED.costos_json,
          updated_at = NOW();
      `,
      storageId,
      params.projecteId,
      item.id,
      params.tipologia,
      item.gruixTotalCm,
      JSON.stringify(item.capes),
      JSON.stringify(item.verificacio),
      item.emissions.totalKgT,
      item.emissions.kgM2,
      item.emissions.nivell,
      item.emissions.distanciaMaterialsKm,
      item.emissions.distanciaMesclaKm,
      JSON.stringify(item.costos ?? null),
    );
  }
}

async function loadStoredEstructures(params: {
  projecteId: string;
  page: number;
  pageSize: number;
  nivellEmissions?: "BAIX" | "MITJA" | "ALT";
  maxEmissionsKgT?: number;
  minCostEurM2?: number;
  maxCostEurM2?: number;
}): Promise<{ total: number; items: EstructuraViable[] }> {
  if (!("$queryRawUnsafe" in prisma)) {
    return { total: 0, items: [] };
  }

  await ensureEmissionsTable();

  const filters: string[] = ["projecte_id = $1"];
  const values: (string | number)[] = [params.projecteId];

  if (params.nivellEmissions) {
    filters.push(`emissions_nivell = $${values.length + 1}`);
    values.push(params.nivellEmissions);
  }

  if (params.maxEmissionsKgT !== undefined) {
    filters.push(`emissions_total_kg_t <= $${values.length + 1}`);
    values.push(params.maxEmissionsKgT);
  }

  if (params.minCostEurM2 !== undefined) {
    filters.push(`(costos_json->>'totalEurM2')::double precision >= $${values.length + 1}`);
    values.push(params.minCostEurM2);
  }

  if (params.maxCostEurM2 !== undefined) {
    filters.push(`(costos_json->>'totalEurM2')::double precision <= $${values.length + 1}`);
    values.push(params.maxCostEurM2);
  }

  const whereSql = filters.join(" AND ");
  const countRows = (await prisma.$queryRawUnsafe(
    `SELECT COUNT(*)::int AS total FROM estructura_emissions WHERE ${whereSql}`,
    ...values,
  )) as { total: number }[];
  const total = countRows[0]?.total ?? 0;

  if (total === 0) {
    return { total: 0, items: [] };
  }

  const offset = (params.page - 1) * params.pageSize;
  const rows = (await prisma.$queryRawUnsafe(
    `
      SELECT
        estructura_id,
        tipologia,
        gruix_total_cm,
        capes_json,
        verificacio_json,
        emissions_total_kg_t,
        emissions_kg_m2,
        emissions_nivell,
        distancia_materials_km,
        distancia_mescla_km,
        costos_json
      FROM estructura_emissions
      WHERE ${whereSql}
      ORDER BY gruix_total_cm ASC
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `,
    ...values,
    params.pageSize,
    offset,
  )) as StoredEstructuraRow[];

  const items: EstructuraViable[] = rows.map((row) => {
    const capes =
      typeof row.capes_json === "string" ? (JSON.parse(row.capes_json) as CapaFirme[]) : row.capes_json;
    const verificacio =
      typeof row.verificacio_json === "string"
        ? (JSON.parse(row.verificacio_json) as ReturnType<typeof calculsEstructuralsService.verificarEstructura>)
        : row.verificacio_json;
    const costos =
      typeof row.costos_json === "string"
        ? (JSON.parse(row.costos_json) as CostTotalResult)
        : row.costos_json ?? undefined;

    return {
      id: row.estructura_id,
      capes,
      gruixTotalCm: Number(row.gruix_total_cm),
      verificacio,
      emissions: {
        totalKgT: Number(row.emissions_total_kg_t),
        kgM2: Number(row.emissions_kg_m2),
        nivell: row.emissions_nivell,
        distanciaMaterialsKm: Number(row.distancia_materials_km),
        distanciaMesclaKm: Number(row.distancia_mescla_km),
      },
      ...(costos ? { costos } : {}),
    };
  });

  return { total, items };
}

function estimateCombinations(restriccions: z.infer<typeof restrictionsSchema>) {
  if (!restriccions.capes || restriccions.capes.length === 0) {
    return 5000;
  }

  return restriccions.capes
    .map((capa) => Math.floor((capa.gruixMaxCm - capa.gruixMinCm) / capa.pasCm) + 1)
    .reduce((acc, value) => acc * Math.max(1, value), 1);
}

function filterByRestrictions(items: CapaFirme[][], restriccions: z.infer<typeof restrictionsSchema>) {
  return items.filter((capes) => {
    const totalThickness = capes.reduce((sum, capa) => sum + capa.gruixCm, 0);

    if (restriccions.maxGruixTotalCm !== undefined && totalThickness > restriccions.maxGruixTotalCm) {
      return false;
    }

    if (restriccions.materialsPermesos && restriccions.materialsPermesos.length > 0) {
      const permitted = new Set(restriccions.materialsPermesos.map((item) => item.toLowerCase()));
      if (!capes.every((capa) => permitted.has(capa.nom.toLowerCase()) || permitted.has(capa.tipus.toLowerCase()))) {
        return false;
      }
    }

    return true;
  });
}

async function generateAllViables(params: {
  tipologia: TipologiaFirme;
  restriccions: z.infer<typeof restrictionsSchema>;
  nec: number;
  fonsModulMpa: number;
}): Promise<{
  viables: EstructuraViable[];
  combinacionsTotals: number;
}> {
  const combinacioRestriccions: RestriccionsCombinacio | undefined = params.restriccions.capes
    ? {
        capes: params.restriccions.capes.map((capa) => ({
          tipus: capa.tipus,
          gruixMinCm: capa.gruixMinCm,
          gruixMaxCm: capa.gruixMaxCm,
          pasCm: capa.pasCm,
          modulElasticMpa: capa.modulElasticMpa,
          ...(capa.coeficientPoisson !== undefined ? { coeficientPoisson: capa.coeficientPoisson } : {}),
          ...(capa.nom !== undefined ? { nom: capa.nom } : {}),
        })),
        ...(params.restriccions.limitCombinacions ? { limitCombinacions: params.restriccions.limitCombinacions } : {}),
      }
    : undefined;

  const generated = calculsEstructuralsService.generarCombinacionsCapes(params.tipologia, combinacioRestriccions);
  const filtered = filterByRestrictions(generated, params.restriccions);

  const viables: EstructuraViable[] = [];

  for (const capes of filtered) {
    const verificacio = calculsEstructuralsService.verificarEstructura(capes, params.nec, {
      modulElasticMpa: params.fonsModulMpa,
      coeficientPoisson: 0.4,
    });

    if (verificacio.viable) {
      const gruixTotalCm = capes.reduce((sum, capa) => sum + capa.gruixCm, 0);
      const structureSignature = toHash({
        tipologia: params.tipologia,
        capes: capes.map((capa) => ({
          tipus: capa.tipus,
          gruixCm: capa.gruixCm,
          modulElasticMpa: capa.modulElasticMpa,
          coeficientPoisson: capa.coeficientPoisson,
        })),
      }).slice(0, 16);

      let emissions: EstructuraEmissions | undefined;
      let costos: CostTotalResult | undefined;
      try {
        emissions = await calculateEstructuraEmissions({
          capes,
          tipologia: params.tipologia,
          distanciaMaterialsKm: params.restriccions.distanciaMaterialsKm,
          distanciaMesclaKm: params.restriccions.distanciaMesclaKm,
        });
      } catch {
        emissions = {
          totalKgT: 0,
          kgM2: 0,
          nivell: "BAIX",
          distanciaMaterialsKm: params.restriccions.distanciaMaterialsKm,
          distanciaMesclaKm: params.restriccions.distanciaMesclaKm,
        };
      }
      try {
        costos = calculateEstructuraCosts({
          capes,
          tipologia: params.tipologia,
          distanciaMaterialsKm: params.restriccions.distanciaMaterialsKm,
          areaM2: params.restriccions.areaM2,
          vidaUtilAnys: params.restriccions.vidaUtilAnys,
          tarifaTransportEurTKm: params.restriccions.tarifaTransportEurTKm,
          tarifaFabricacioEurT: params.restriccions.tarifaFabricacioEurT,
          tarifaPosadaObraEurM2: params.restriccions.tarifaPosadaObraEurM2,
          ...(params.restriccions.preuMaterialPerTipus
            ? { preuMaterialPerTipus: params.restriccions.preuMaterialPerTipus }
            : {}),
        });
      } catch {
        costos = undefined;
      }

      viables.push({
        id: structureSignature,
        capes,
        gruixTotalCm,
        verificacio,
        emissions,
        ...(costos ? { costos } : {}),
      });
    }
  }

  viables.sort((a, b) => a.gruixTotalCm - b.gruixTotalCm);

  return {
    viables,
    combinacionsTotals: filtered.length,
  };
}

async function loadProject(projecteId: string, identity: Identity) {
  const projecte = await prisma.projecte.findFirst({
    where: {
      id: projecteId,
      organitzacioId: identity.organitzacioId,
    },
    select: {
      id: true,
      imd: true,
      percentatgeVp: true,
      tipusTracat: true,
      vidaUtil: true,
      creixementAnual: true,
    },
  });

  return projecte;
}

export const generadorEstructuresService = {
  async generarEstructuresViables(projecteId: string, restriccionsInput: unknown, identity: Identity): Promise<GenerationResult | GenerationAsyncAccepted> {
    cleanupCache();

    const restriccions = restrictionsSchema.parse(restriccionsInput ?? {});

    const projecte = await loadProject(projecteId, identity);
    if (!projecte) {
      throw new HttpError(404, "Projecte no trobat");
    }

    const traffic = computeTrafficFactors(projecte);
    const nec = calculsEstructuralsService.calcularNEC(traffic);

    const keyBase = toHash({ projecteId, restriccions: { ...restriccions, page: undefined, pageSize: undefined, asynchronous: undefined }, nec });
    const cacheKey = `estructures:${keyBase}`;

    const cached = resultsCache.get(cacheKey);
    if (cached && Date.now() - cached.createdAt <= cacheTtlMs) {
      return toPaginatedResult(cached.value, restriccions.page, restriccions.pageSize, cached.combinacionsTotals, true);
    }

    const estimated = estimateCombinations(restriccions);
    const shouldAsync = restriccions.asynchronous || estimated > processThreshold;

    if (shouldAsync) {
      const existingJob = Array.from(jobs.values()).find(
        (job): job is JobRecord & { status: "queued" | "processing" } =>
          job.key === cacheKey && (job.status === "queued" || job.status === "processing"),
      );
      if (existingJob) {
        return {
          mode: "async",
          jobId: existingJob.id,
          status: existingJob.status,
          progress: existingJob.progress,
        };
      }

      const jobId = crypto.randomUUID();
      jobs.set(jobId, {
        id: jobId,
        key: cacheKey,
        status: "queued",
        progress: 0,
        createdAt: Date.now(),
        page: restriccions.page,
        pageSize: restriccions.pageSize,
      });

      setTimeout(async () => {
        const job = jobs.get(jobId);
        if (!job) {
          return;
        }

        job.status = "processing";
        job.progress = 20;

        try {
          const generated = await generateAllViables({
            tipologia: restriccions.tipologia,
            restriccions,
            nec,
            fonsModulMpa: restriccions.modulFonamentMpa,
          });

          job.progress = 90;

          resultsCache.set(cacheKey, {
            createdAt: Date.now(),
            value: generated.viables,
            combinacionsTotals: generated.combinacionsTotals,
          });
          await persistEstructures({
            projecteId,
            tipologia: restriccions.tipologia,
            items: generated.viables,
          });

          job.result = toPaginatedResult(generated.viables, job.page, job.pageSize, generated.combinacionsTotals, false);
          job.status = "completed";
          job.progress = 100;
        } catch (error) {
          job.status = "failed";
          job.error = error instanceof Error ? error.message : "Error processant estructures";
          job.progress = 100;
        }
      }, 10);

      return {
        mode: "async",
        jobId,
        status: "queued",
        progress: 0,
      };
    }

    const generated = await generateAllViables({
      tipologia: restriccions.tipologia,
      restriccions,
      nec,
      fonsModulMpa: restriccions.modulFonamentMpa,
    });

    resultsCache.set(cacheKey, {
      createdAt: Date.now(),
      value: generated.viables,
      combinacionsTotals: generated.combinacionsTotals,
    });
    await persistEstructures({
      projecteId,
      tipologia: restriccions.tipologia,
      items: generated.viables,
    });

    return toPaginatedResult(generated.viables, restriccions.page, restriccions.pageSize, generated.combinacionsTotals, false);
  },

  async llistarEstructuresGenerades(projecteId: string, queryInput: unknown, identity: Identity): Promise<GenerationResult> {
    const query = listGeneratedSchema.parse(queryInput ?? {});
    const projecte = await loadProject(projecteId, identity);
    if (!projecte) {
      throw new HttpError(404, "Projecte no trobat");
    }

    const stored = await loadStoredEstructures({
      projecteId,
      page: query.page,
      pageSize: query.pageSize,
      ...(query.nivellEmissions ? { nivellEmissions: query.nivellEmissions } : {}),
      ...(query.maxEmissionsKgT !== undefined ? { maxEmissionsKgT: query.maxEmissionsKgT } : {}),
      ...(query.minCostEurM2 !== undefined ? { minCostEurM2: query.minCostEurM2 } : {}),
      ...(query.maxCostEurM2 !== undefined ? { maxCostEurM2: query.maxCostEurM2 } : {}),
    });

    if (stored.total > 0) {
      const totalPages = Math.max(1, Math.ceil(stored.total / query.pageSize));
      return {
        mode: "sync",
        cacheHit: false,
        pagination: {
          page: query.page,
          pageSize: query.pageSize,
          total: stored.total,
          totalPages,
        },
        items: query.incloureEmissions ? stored.items : stored.items.map(({ emissions: _ignored, ...item }) => item),
        meta: {
          combinacionsTotals: stored.total,
          viablesTotals: stored.total,
        },
      };
    }

    const cacheEntry = Array.from(resultsCache.values()).at(-1);
    if (!cacheEntry) {
      return {
        mode: "sync",
        cacheHit: false,
        pagination: { page: query.page, pageSize: query.pageSize, total: 0, totalPages: 1 },
        items: [],
        meta: { combinacionsTotals: 0, viablesTotals: 0 },
      };
    }

    return toPaginatedResult(
      query.incloureEmissions ? cacheEntry.value : cacheEntry.value.map(({ emissions: _ignored, ...item }) => item),
      query.page,
      query.pageSize,
      cacheEntry.combinacionsTotals,
      true,
    );
  },

  async getGenerationJobStatus(projecteId: string, jobId: string, identity: Identity): Promise<GenerationAsyncStatus> {
    const projecte = await loadProject(projecteId, identity);
    if (!projecte) {
      throw new HttpError(404, "Projecte no trobat");
    }

    const job = jobs.get(jobId);
    if (!job) {
      throw new HttpError(404, "Job no trobat");
    }

    if (job.status === "completed" && job.result) {
      return {
        mode: "async",
        jobId: job.id,
        status: "completed",
        progress: job.progress,
        result: job.result,
      };
    }

    if (job.status === "failed") {
      return {
        mode: "async",
        jobId: job.id,
        status: "failed",
        progress: job.progress,
        error: job.error ?? "Error desconegut",
      };
    }

    if (job.status === "completed") {
      return {
        mode: "async",
        jobId: job.id,
        status: "failed",
        progress: job.progress,
        error: "Resultat de job no disponible",
      };
    }

    return {
      mode: "async",
      jobId: job.id,
      status: job.status,
      progress: job.progress,
    };
  },
};
