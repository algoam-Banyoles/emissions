import crypto from "node:crypto";

import {
  CategoriaMaterialEmissio,
  CombustibleTipus,
  EtapaEmissions,
  Prisma,
  TipologiaMescla,
  TipusCanviEmissio,
  TipusConsumElectric,
  UnitatMesura,
} from "@prisma/client";
import { z } from "zod";

import { prisma } from "../config/database.js";
import { HttpError } from "../utils/http-error.js";

const currentYear = new Date().getFullYear();

const idSchema = z.string().min(1);
const resourceSchema = z.enum([
  "materials",
  "transport",
  "combustibles",
  "electric",
  "equips",
  "limits",
  "constants",
]);

export type EmissionsResource = z.infer<typeof resourceSchema>;

const listSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  q: z.string().optional(),
  versioBaseDadesId: z.string().optional(),
  actiu: z
    .union([z.boolean(), z.enum(["true", "false"])])
    .optional()
    .transform((value) => {
      if (typeof value === "string") {
        return value === "true";
      }
      return value;
    }),
});

const materialCreateSchema = z.object({
  codiMaterial: z.string().min(1).max(64),
  nom: z.string().min(2).max(200),
  categoria: z.nativeEnum(CategoriaMaterialEmissio),
  factorEmissio: z.number(),
  unitat: z.string().min(1).max(16),
  fontDades: z.string().min(3).max(255),
  anyReferencia: z.number().int().min(1900).max(currentYear + 1),
  versioDap: z.string().max(64).optional().nullable(),
  incertesaPercentatge: z.number().min(0).max(100).optional().nullable(),
  esCredit: z.boolean().optional(),
  versioBaseDadesId: z.string().min(1).optional(),
  actiu: z.boolean().optional(),
});

const transportCreateSchema = z.object({
  tipusVehicle: z.string().min(2).max(150),
  capacitatTonelades: z.number().positive(),
  factorEmissio: z.number().min(0),
  unitat: z.string().min(1).max(16).optional(),
  fontDades: z.string().min(3).max(255),
  anyReferencia: z.number().int().min(1900).max(currentYear + 1),
  combustible: z.nativeEnum(CombustibleTipus),
  versioBaseDadesId: z.string().min(1).optional(),
  actiu: z.boolean().optional(),
});

const combustibleCreateSchema = z.object({
  nomCombustible: z.nativeEnum(CombustibleTipus),
  poderCalorificInferior: z.number().positive(),
  unitatPoderCalorific: z.string().min(1).max(16),
  factorEmissio: z.number().min(0),
  unitatFactorEmissio: z.string().min(1).max(16),
  fontDades: z.string().min(3).max(255),
  anyReferencia: z.number().int().min(1900).max(currentYear + 1),
  versioBaseDadesId: z.string().min(1).optional(),
  actiu: z.boolean().optional(),
});

const electricCreateSchema = z.object({
  tipusConsum: z.nativeEnum(TipusConsumElectric),
  consumKwhPerTona: z.number().min(0),
  factorEmissioRed: z.number().min(0),
  factorEmissioGrupo: z.number().min(0),
  fontDades: z.string().min(3).max(255),
  anyReferencia: z.number().int().min(1900).max(currentYear + 1),
  versioBaseDadesId: z.string().min(1).optional(),
  actiu: z.boolean().optional(),
});

const equipCreateSchema = z.object({
  nomEquip: z.string().min(2).max(150),
  tipus: z.string().min(1).max(80),
  factorEmissio: z.number().min(0),
  rendimentHoresPerTona: z.number().min(0),
  unitat: z.string().min(1).max(16).optional(),
  fontDades: z.string().min(3).max(255),
  versioBaseDadesId: z.string().min(1).optional(),
  actiu: z.boolean().optional(),
});

const limitCreateSchema = z.object({
  tipologiaMescla: z.nativeEnum(TipologiaMescla),
  etapa: z.nativeEnum(EtapaEmissions),
  valorLimit: z.number().min(0),
  unitat: z.string().min(1).max(16).optional(),
  fontNormativa: z.string().min(3).max(255),
  dataEntradaVigor: z.coerce.date(),
  versioBaseDadesId: z.string().min(1).optional(),
  actiu: z.boolean().optional(),
});

const constantCreateSchema = z.object({
  nomMaterial: z.string().min(2).max(120),
  calorEspecific: z.number().min(0),
  unitat: z.string().min(1).max(16).optional(),
  temperaturaReferencia: z.number().optional().nullable(),
  fontDades: z.string().min(3).max(255),
  versioBaseDadesId: z.string().min(1).optional(),
  actiu: z.boolean().optional(),
});

const bulkVersionSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
  versioBaseDadesId: z.string().min(1),
  confirm: z.literal(true),
});

const historyQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  resource: z.string().optional(),
  registreId: z.string().optional(),
});

const revertSchema = z.object({
  logId: z.string().min(1),
  confirm: z.literal(true),
});

interface CreateSchemas {
  materials: typeof materialCreateSchema;
  transport: typeof transportCreateSchema;
  combustibles: typeof combustibleCreateSchema;
  electric: typeof electricCreateSchema;
  equips: typeof equipCreateSchema;
  limits: typeof limitCreateSchema;
  constants: typeof constantCreateSchema;
}

const createSchemas: CreateSchemas = {
  materials: materialCreateSchema,
  transport: transportCreateSchema,
  combustibles: combustibleCreateSchema,
  electric: electricCreateSchema,
  equips: equipCreateSchema,
  limits: limitCreateSchema,
  constants: constantCreateSchema,
};

async function resolveVersionId(inputVersionId?: string) {
  if (inputVersionId) {
    const version = await prisma.versioBaseDades.findUnique({ where: { id: inputVersionId } });
    if (!version) {
      throw new HttpError(400, "La versio indicada no existeix");
    }
    return version.id;
  }

  const activeVersion = await prisma.versioBaseDades.findFirst({
    where: { esActual: true },
    orderBy: { createdAt: "desc" },
  });

  if (!activeVersion) {
    throw new HttpError(400, "No hi ha versio activa");
  }

  return activeVersion.id;
}

function createWhere(resource: EmissionsResource, filters: z.infer<typeof listSchema>) {
  const where: Record<string, unknown> = {};

  if (filters.versioBaseDadesId) {
    where.versioBaseDadesId = filters.versioBaseDadesId;
  }

  if (filters.actiu !== undefined) {
    where.actiu = filters.actiu;
  }

  if (filters.q) {
    if (resource === "materials") {
      where.OR = [
        { codiMaterial: { contains: filters.q, mode: Prisma.QueryMode.insensitive } },
        { nom: { contains: filters.q, mode: Prisma.QueryMode.insensitive } },
      ];
    } else if (resource === "transport") {
      where.tipusVehicle = { contains: filters.q, mode: Prisma.QueryMode.insensitive };
    } else if (resource === "combustibles") {
      where.nomCombustible = { equals: filters.q.toUpperCase() };
    } else if (resource === "electric") {
      where.tipusConsum = { equals: filters.q.toUpperCase() };
    } else if (resource === "equips") {
      where.OR = [
        { nomEquip: { contains: filters.q, mode: Prisma.QueryMode.insensitive } },
        { tipus: { contains: filters.q, mode: Prisma.QueryMode.insensitive } },
      ];
    } else if (resource === "limits") {
      where.OR = [
        { tipologiaMescla: { equals: filters.q.toUpperCase() } },
        { fontNormativa: { contains: filters.q, mode: Prisma.QueryMode.insensitive } },
      ];
    } else {
      where.nomMaterial = { contains: filters.q, mode: Prisma.QueryMode.insensitive };
    }
  }

  return where;
}

function csvEscape(value: unknown): string {
  const text = String(value ?? "");
  if (text.includes(",") || text.includes("\n") || text.includes('"')) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

async function createAuditLog(params: {
  usuariId: string;
  versioBaseDadesId: string;
  tipusCanvi: TipusCanviEmissio;
  entitat: string;
  registreId: string;
  anteriors?: unknown;
  nous?: unknown;
}) {
  await prisma.emissionsChangeLog.create({
    data: {
      versioBaseDadesId: params.versioBaseDadesId,
      usuariId: params.usuariId,
      tipusCanvi: params.tipusCanvi,
      entitat: params.entitat,
      registreId: params.registreId,
      valorsAnteriors: (params.anteriors ?? null) as Prisma.InputJsonValue,
      valorsNous: (params.nous ?? null) as Prisma.InputJsonValue,
    },
  });
}

function normalizeUnit(unit: string | undefined, fallback: UnitatMesura): UnitatMesura {
  if (!unit) {
    return fallback;
  }

  const normalized = unit.toUpperCase();
  if ((Object.values(UnitatMesura) as string[]).includes(normalized)) {
    return normalized as UnitatMesura;
  }
  return fallback;
}

function pruneUndefined<T extends Record<string, unknown>>(payload: T) {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(payload)) {
    if (value !== undefined) {
      result[key] = value;
    }
  }

  return result;
}

async function assertNoDuplicates(resource: EmissionsResource, payload: Record<string, unknown>, recordId?: string) {
  if (resource === "materials") {
    const existing = await prisma.factorEmissioMaterial.findFirst({
      where: {
        codiMaterial: payload["codiMaterial"] as string,
        versioBaseDadesId: payload["versioBaseDadesId"] as string,
        ...(recordId ? { id: { not: recordId } } : {}),
      },
      select: { id: true },
    });

    if (existing) {
      throw new HttpError(409, "Ja existeix un factor de material per codi i versio");
    }
  }

  if (resource === "transport") {
    const existing = await prisma.factorEmissioTransport.findFirst({
      where: {
        tipusVehicle: payload["tipusVehicle"] as string,
        versioBaseDadesId: payload["versioBaseDadesId"] as string,
        ...(recordId ? { id: { not: recordId } } : {}),
      },
      select: { id: true },
    });

    if (existing) {
      throw new HttpError(409, "Ja existeix un factor de transport per tipus i versio");
    }
  }
}

async function findExisting(resource: EmissionsResource, id: string) {
  switch (resource) {
    case "materials":
      return await prisma.factorEmissioMaterial.findUnique({ where: { id } });
    case "transport":
      return await prisma.factorEmissioTransport.findUnique({ where: { id } });
    case "combustibles":
      return await prisma.combustibleFabricacio.findUnique({ where: { id } });
    case "electric":
      return await prisma.consumElectric.findUnique({ where: { id } });
    case "equips":
      return await prisma.equipPosadaEnObra.findUnique({ where: { id } });
    case "limits":
      return await prisma.limitNormatiuEmissions.findUnique({ where: { id } });
    case "constants":
      return await prisma.constantCalorifica.findUnique({ where: { id } });
  }
}

export const emissionsAdminService = {
  parseResource(resource: unknown) {
    return resourceSchema.parse(resource);
  },

  async list(resource: EmissionsResource, query: unknown) {
    const filters = listSchema.parse(query);
    const where = createWhere(resource, filters);
    const skip = (filters.page - 1) * filters.pageSize;

    if (resource === "materials") {
      const [items, total] = await prisma.$transaction([
        prisma.factorEmissioMaterial.findMany({ where, skip, take: filters.pageSize, orderBy: { updatedAt: "desc" } }),
        prisma.factorEmissioMaterial.count({ where }),
      ]);
      return { items, pagination: { page: filters.page, pageSize: filters.pageSize, total, totalPages: Math.max(1, Math.ceil(total / filters.pageSize)) } };
    }
    if (resource === "transport") {
      const [items, total] = await prisma.$transaction([
        prisma.factorEmissioTransport.findMany({ where, skip, take: filters.pageSize, orderBy: { updatedAt: "desc" } }),
        prisma.factorEmissioTransport.count({ where }),
      ]);
      return { items, pagination: { page: filters.page, pageSize: filters.pageSize, total, totalPages: Math.max(1, Math.ceil(total / filters.pageSize)) } };
    }
    if (resource === "combustibles") {
      const [items, total] = await prisma.$transaction([
        prisma.combustibleFabricacio.findMany({ where, skip, take: filters.pageSize, orderBy: { updatedAt: "desc" } }),
        prisma.combustibleFabricacio.count({ where }),
      ]);
      return { items, pagination: { page: filters.page, pageSize: filters.pageSize, total, totalPages: Math.max(1, Math.ceil(total / filters.pageSize)) } };
    }
    if (resource === "electric") {
      const [items, total] = await prisma.$transaction([
        prisma.consumElectric.findMany({ where, skip, take: filters.pageSize, orderBy: { updatedAt: "desc" } }),
        prisma.consumElectric.count({ where }),
      ]);
      return { items, pagination: { page: filters.page, pageSize: filters.pageSize, total, totalPages: Math.max(1, Math.ceil(total / filters.pageSize)) } };
    }
    if (resource === "equips") {
      const [items, total] = await prisma.$transaction([
        prisma.equipPosadaEnObra.findMany({ where, skip, take: filters.pageSize, orderBy: { updatedAt: "desc" } }),
        prisma.equipPosadaEnObra.count({ where }),
      ]);
      return { items, pagination: { page: filters.page, pageSize: filters.pageSize, total, totalPages: Math.max(1, Math.ceil(total / filters.pageSize)) } };
    }
    if (resource === "limits") {
      const [items, total] = await prisma.$transaction([
        prisma.limitNormatiuEmissions.findMany({ where, skip, take: filters.pageSize, orderBy: { updatedAt: "desc" } }),
        prisma.limitNormatiuEmissions.count({ where }),
      ]);
      return { items, pagination: { page: filters.page, pageSize: filters.pageSize, total, totalPages: Math.max(1, Math.ceil(total / filters.pageSize)) } };
    }

    const [items, total] = await prisma.$transaction([
      prisma.constantCalorifica.findMany({ where, skip, take: filters.pageSize, orderBy: { updatedAt: "desc" } }),
      prisma.constantCalorifica.count({ where }),
    ]);
    return { items, pagination: { page: filters.page, pageSize: filters.pageSize, total, totalPages: Math.max(1, Math.ceil(total / filters.pageSize)) } };
  },

  async create(resource: EmissionsResource, payload: unknown, usuariId: string) {
    const versionId = await resolveVersionId((payload as { versioBaseDadesId?: string }).versioBaseDadesId);

    if (resource === "materials") {
      const data = materialCreateSchema.parse(payload);
      const createPayload = pruneUndefined({
        codiMaterial: data.codiMaterial,
        nom: data.nom,
        categoria: data.categoria,
        factorEmissio: data.factorEmissio,
        versioBaseDadesId: versionId,
        unitat: normalizeUnit(data.unitat, UnitatMesura.T),
        fontDades: data.fontDades,
        anyReferencia: data.anyReferencia,
        versioDap: data.versioDap ?? null,
        incertesaPercentatge: data.incertesaPercentatge ?? null,
        esCredit: data.esCredit ?? false,
        actiu: data.actiu ?? true,
      });
      await assertNoDuplicates(resource, createPayload);
      const created = await prisma.factorEmissioMaterial.create({
        data: createPayload as Prisma.FactorEmissioMaterialUncheckedCreateInput,
      });
      await createAuditLog({ usuariId, versioBaseDadesId: versionId, tipusCanvi: TipusCanviEmissio.CREAT, entitat: resource, registreId: created.id, nous: created });
      return created;
    }

    if (resource === "transport") {
      const data = transportCreateSchema.parse(payload);
      const createPayload = pruneUndefined({
        tipusVehicle: data.tipusVehicle,
        capacitatTonelades: data.capacitatTonelades,
        factorEmissio: data.factorEmissio,
        versioBaseDadesId: versionId,
        unitat: normalizeUnit(data.unitat, UnitatMesura.T_KM),
        fontDades: data.fontDades,
        anyReferencia: data.anyReferencia,
        combustible: data.combustible,
        actiu: data.actiu ?? true,
      });
      await assertNoDuplicates(resource, createPayload);
      const created = await prisma.factorEmissioTransport.create({
        data: createPayload as Prisma.FactorEmissioTransportUncheckedCreateInput,
      });
      await createAuditLog({ usuariId, versioBaseDadesId: versionId, tipusCanvi: TipusCanviEmissio.CREAT, entitat: resource, registreId: created.id, nous: created });
      return created;
    }

    if (resource === "combustibles") {
      const data = combustibleCreateSchema.parse(payload);
      const created = await prisma.combustibleFabricacio.create({
        data: pruneUndefined({
          nomCombustible: data.nomCombustible,
          poderCalorificInferior: data.poderCalorificInferior,
          factorEmissio: data.factorEmissio,
          fontDades: data.fontDades,
          anyReferencia: data.anyReferencia,
          versioBaseDadesId: versionId,
          unitatPoderCalorific: normalizeUnit(data.unitatPoderCalorific, UnitatMesura.MJ),
          unitatFactorEmissio: normalizeUnit(data.unitatFactorEmissio, UnitatMesura.KG),
          actiu: data.actiu ?? true,
        }) as Prisma.CombustibleFabricacioUncheckedCreateInput,
      });
      await createAuditLog({ usuariId, versioBaseDadesId: versionId, tipusCanvi: TipusCanviEmissio.CREAT, entitat: resource, registreId: created.id, nous: created });
      return created;
    }

    if (resource === "electric") {
      const data = electricCreateSchema.parse(payload);
      const created = await prisma.consumElectric.create({
        data: pruneUndefined({
          tipusConsum: data.tipusConsum,
          consumKwhPerTona: data.consumKwhPerTona,
          factorEmissioRed: data.factorEmissioRed,
          factorEmissioGrupo: data.factorEmissioGrupo,
          fontDades: data.fontDades,
          anyReferencia: data.anyReferencia,
          versioBaseDadesId: versionId,
          actiu: data.actiu ?? true,
        }) as Prisma.ConsumElectricUncheckedCreateInput,
      });
      await createAuditLog({ usuariId, versioBaseDadesId: versionId, tipusCanvi: TipusCanviEmissio.CREAT, entitat: resource, registreId: created.id, nous: created });
      return created;
    }

    if (resource === "equips") {
      const data = equipCreateSchema.parse(payload);
      const created = await prisma.equipPosadaEnObra.create({
        data: pruneUndefined({
          nomEquip: data.nomEquip,
          tipus: data.tipus,
          factorEmissio: data.factorEmissio,
          rendimentHoresPerTona: data.rendimentHoresPerTona,
          fontDades: data.fontDades,
          versioBaseDadesId: versionId,
          unitat: normalizeUnit(data.unitat, UnitatMesura.H),
          actiu: data.actiu ?? true,
        }) as Prisma.EquipPosadaEnObraUncheckedCreateInput,
      });
      await createAuditLog({ usuariId, versioBaseDadesId: versionId, tipusCanvi: TipusCanviEmissio.CREAT, entitat: resource, registreId: created.id, nous: created });
      return created;
    }

    if (resource === "limits") {
      const data = limitCreateSchema.parse(payload);
      const created = await prisma.limitNormatiuEmissions.create({
        data: pruneUndefined({
          tipologiaMescla: data.tipologiaMescla,
          etapa: data.etapa,
          valorLimit: data.valorLimit,
          fontNormativa: data.fontNormativa,
          dataEntradaVigor: data.dataEntradaVigor,
          versioBaseDadesId: versionId,
          unitat: normalizeUnit(data.unitat, UnitatMesura.T),
          actiu: data.actiu ?? true,
        }) as Prisma.LimitNormatiuEmissionsUncheckedCreateInput,
      });
      await createAuditLog({ usuariId, versioBaseDadesId: versionId, tipusCanvi: TipusCanviEmissio.CREAT, entitat: resource, registreId: created.id, nous: created });
      return created;
    }

    const data = constantCreateSchema.parse(payload);
    const created = await prisma.constantCalorifica.create({
      data: pruneUndefined({
        nomMaterial: data.nomMaterial,
        calorEspecific: data.calorEspecific,
        temperaturaReferencia: data.temperaturaReferencia ?? null,
        fontDades: data.fontDades,
        versioBaseDadesId: versionId,
        unitat: normalizeUnit(data.unitat, UnitatMesura.KG),
        actiu: data.actiu ?? true,
      }) as Prisma.ConstantCalorificaUncheckedCreateInput,
    });
    await createAuditLog({ usuariId, versioBaseDadesId: versionId, tipusCanvi: TipusCanviEmissio.CREAT, entitat: resource, registreId: created.id, nous: created });
    return created;
  },

  async update(resource: EmissionsResource, id: string, payload: unknown, usuariId: string) {
    const existing = await findExisting(resource, id);
    if (!existing) {
      throw new HttpError(404, "Factor no trobat");
    }

    const schema = createSchemas[resource].partial();
    const parsed = schema.parse(payload) as Record<string, unknown>;

    const versionId = await resolveVersionId((parsed["versioBaseDadesId"] as string | undefined) ?? (existing as { versioBaseDadesId: string }).versioBaseDadesId);
    parsed.versioBaseDadesId = versionId;

    if (resource === "materials" && parsed["unitat"]) {
      parsed["unitat"] = normalizeUnit(parsed["unitat"] as string, UnitatMesura.T);
    }
    if (resource === "transport" && parsed["unitat"]) {
      parsed["unitat"] = normalizeUnit(parsed["unitat"] as string, UnitatMesura.T_KM);
    }
    if (resource === "combustibles") {
      if (parsed["unitatPoderCalorific"]) {
        parsed["unitatPoderCalorific"] = normalizeUnit(parsed["unitatPoderCalorific"] as string, UnitatMesura.MJ);
      }
      if (parsed["unitatFactorEmissio"]) {
        parsed["unitatFactorEmissio"] = normalizeUnit(parsed["unitatFactorEmissio"] as string, UnitatMesura.KG);
      }
    }
    if (resource === "equips" && parsed["unitat"]) {
      parsed["unitat"] = normalizeUnit(parsed["unitat"] as string, UnitatMesura.H);
    }
    if (resource === "limits" && parsed["unitat"]) {
      parsed["unitat"] = normalizeUnit(parsed["unitat"] as string, UnitatMesura.T);
    }
    if (resource === "constants" && parsed["unitat"]) {
      parsed["unitat"] = normalizeUnit(parsed["unitat"] as string, UnitatMesura.KG);
    }

    await assertNoDuplicates(resource, { ...existing, ...parsed }, id);

    let updated: unknown;
    if (resource === "materials") {
      updated = await prisma.factorEmissioMaterial.update({ where: { id }, data: pruneUndefined(parsed) });
    } else if (resource === "transport") {
      updated = await prisma.factorEmissioTransport.update({ where: { id }, data: pruneUndefined(parsed) });
    } else if (resource === "combustibles") {
      updated = await prisma.combustibleFabricacio.update({ where: { id }, data: pruneUndefined(parsed) });
    } else if (resource === "electric") {
      updated = await prisma.consumElectric.update({ where: { id }, data: pruneUndefined(parsed) });
    } else if (resource === "equips") {
      updated = await prisma.equipPosadaEnObra.update({ where: { id }, data: pruneUndefined(parsed) });
    } else if (resource === "limits") {
      updated = await prisma.limitNormatiuEmissions.update({ where: { id }, data: pruneUndefined(parsed) });
    } else {
      updated = await prisma.constantCalorifica.update({ where: { id }, data: pruneUndefined(parsed) });
    }

    await createAuditLog({
      usuariId,
      versioBaseDadesId: versionId,
      tipusCanvi: TipusCanviEmissio.MODIFICAT,
      entitat: resource,
      registreId: id,
      anteriors: existing,
      nous: updated,
    });

    return updated;
  },

  async remove(resource: EmissionsResource, id: string, usuariId: string) {
    const existing = await findExisting(resource, id);
    if (!existing) {
      throw new HttpError(404, "Factor no trobat");
    }

    const versionId = (existing as { versioBaseDadesId: string }).versioBaseDadesId;

    let updated: unknown;
    if (resource === "materials") {
      updated = await prisma.factorEmissioMaterial.update({ where: { id }, data: { actiu: false } });
    } else if (resource === "transport") {
      updated = await prisma.factorEmissioTransport.update({ where: { id }, data: { actiu: false } });
    } else if (resource === "combustibles") {
      updated = await prisma.combustibleFabricacio.update({ where: { id }, data: { actiu: false } });
    } else if (resource === "electric") {
      updated = await prisma.consumElectric.update({ where: { id }, data: { actiu: false } });
    } else if (resource === "equips") {
      updated = await prisma.equipPosadaEnObra.update({ where: { id }, data: { actiu: false } });
    } else if (resource === "limits") {
      updated = await prisma.limitNormatiuEmissions.update({ where: { id }, data: { actiu: false } });
    } else {
      updated = await prisma.constantCalorifica.update({ where: { id }, data: { actiu: false } });
    }

    await createAuditLog({
      usuariId,
      versioBaseDadesId: versionId,
      tipusCanvi: TipusCanviEmissio.ELIMINAT,
      entitat: resource,
      registreId: id,
      anteriors: existing,
      nous: updated,
    });
  },

  async bulkUpdateVersion(resource: EmissionsResource, payload: unknown, usuariId: string) {
    const data = bulkVersionSchema.parse(payload);
    const version = await prisma.versioBaseDades.findUnique({ where: { id: data.versioBaseDadesId } });
    if (!version) {
      throw new HttpError(400, "Versio no trobada");
    }

    const backupId = `backup-${resource}-${crypto.randomUUID()}`;

    if (resource === "materials") {
      const before = await prisma.factorEmissioMaterial.findMany({ where: { id: { in: data.ids } } });
      await createAuditLog({ usuariId, versioBaseDadesId: version.id, tipusCanvi: TipusCanviEmissio.IMPORTAT, entitat: `backup_${resource}`, registreId: backupId, anteriors: before });
      await prisma.factorEmissioMaterial.updateMany({ where: { id: { in: data.ids } }, data: { versioBaseDadesId: version.id } });
    } else if (resource === "transport") {
      const before = await prisma.factorEmissioTransport.findMany({ where: { id: { in: data.ids } } });
      await createAuditLog({ usuariId, versioBaseDadesId: version.id, tipusCanvi: TipusCanviEmissio.IMPORTAT, entitat: `backup_${resource}`, registreId: backupId, anteriors: before });
      await prisma.factorEmissioTransport.updateMany({ where: { id: { in: data.ids } }, data: { versioBaseDadesId: version.id } });
    } else if (resource === "combustibles") {
      const before = await prisma.combustibleFabricacio.findMany({ where: { id: { in: data.ids } } });
      await createAuditLog({ usuariId, versioBaseDadesId: version.id, tipusCanvi: TipusCanviEmissio.IMPORTAT, entitat: `backup_${resource}`, registreId: backupId, anteriors: before });
      await prisma.combustibleFabricacio.updateMany({ where: { id: { in: data.ids } }, data: { versioBaseDadesId: version.id } });
    } else if (resource === "electric") {
      const before = await prisma.consumElectric.findMany({ where: { id: { in: data.ids } } });
      await createAuditLog({ usuariId, versioBaseDadesId: version.id, tipusCanvi: TipusCanviEmissio.IMPORTAT, entitat: `backup_${resource}`, registreId: backupId, anteriors: before });
      await prisma.consumElectric.updateMany({ where: { id: { in: data.ids } }, data: { versioBaseDadesId: version.id } });
    } else if (resource === "equips") {
      const before = await prisma.equipPosadaEnObra.findMany({ where: { id: { in: data.ids } } });
      await createAuditLog({ usuariId, versioBaseDadesId: version.id, tipusCanvi: TipusCanviEmissio.IMPORTAT, entitat: `backup_${resource}`, registreId: backupId, anteriors: before });
      await prisma.equipPosadaEnObra.updateMany({ where: { id: { in: data.ids } }, data: { versioBaseDadesId: version.id } });
    } else if (resource === "limits") {
      const before = await prisma.limitNormatiuEmissions.findMany({ where: { id: { in: data.ids } } });
      await createAuditLog({ usuariId, versioBaseDadesId: version.id, tipusCanvi: TipusCanviEmissio.IMPORTAT, entitat: `backup_${resource}`, registreId: backupId, anteriors: before });
      await prisma.limitNormatiuEmissions.updateMany({ where: { id: { in: data.ids } }, data: { versioBaseDadesId: version.id } });
    } else {
      const before = await prisma.constantCalorifica.findMany({ where: { id: { in: data.ids } } });
      await createAuditLog({ usuariId, versioBaseDadesId: version.id, tipusCanvi: TipusCanviEmissio.IMPORTAT, entitat: `backup_${resource}`, registreId: backupId, anteriors: before });
      await prisma.constantCalorifica.updateMany({ where: { id: { in: data.ids } }, data: { versioBaseDadesId: version.id } });
    }

    return {
      updatedIds: data.ids,
      versioBaseDadesId: version.id,
      backupLogId: backupId,
    };
  },

  async exportCsv(resource: EmissionsResource, ids?: string[]) {
    const where = ids?.length ? { id: { in: ids } } : {};

    const rows =
      resource === "materials"
        ? await prisma.factorEmissioMaterial.findMany({ where })
        : resource === "transport"
          ? await prisma.factorEmissioTransport.findMany({ where })
          : resource === "combustibles"
            ? await prisma.combustibleFabricacio.findMany({ where })
            : resource === "electric"
              ? await prisma.consumElectric.findMany({ where })
              : resource === "equips"
                ? await prisma.equipPosadaEnObra.findMany({ where })
                : resource === "limits"
                  ? await prisma.limitNormatiuEmissions.findMany({ where })
                  : await prisma.constantCalorifica.findMany({ where });

    if (!rows.length) {
      return "";
    }

    const headers = Object.keys(rows[0] as Record<string, unknown>);
    const lines = [headers.join(",")];

    for (const row of rows as Record<string, unknown>[]) {
      const values = headers.map((header) => csvEscape(row[header]));
      lines.push(values.join(","));
    }

    return lines.join("\n");
  },

  async listHistory(query: unknown) {
    const data = historyQuerySchema.parse(query);
    const skip = (data.page - 1) * data.pageSize;

    const where: Prisma.EmissionsChangeLogWhereInput = {};
    if (data.resource) {
      where.entitat = { contains: data.resource, mode: Prisma.QueryMode.insensitive };
    }
    if (data.registreId) {
      where.registreId = data.registreId;
    }

    const [items, total] = await prisma.$transaction([
      prisma.emissionsChangeLog.findMany({
        where,
        include: { usuari: { select: { id: true, email: true } }, versioBaseDades: { select: { id: true, numero: true } } },
        orderBy: { createdAt: "desc" },
        skip,
        take: data.pageSize,
      }),
      prisma.emissionsChangeLog.count({ where }),
    ]);

    return {
      items,
      pagination: {
        page: data.page,
        pageSize: data.pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / data.pageSize)),
      },
    };
  },

  async revert(payload: unknown, usuariId: string) {
    const data = revertSchema.parse(payload);

    const log = await prisma.emissionsChangeLog.findUnique({ where: { id: data.logId } });
    if (!log) {
      throw new HttpError(404, "Log no trobat");
    }

    if (!log.entitat.startsWith("backup_")) {
      throw new HttpError(400, "Nomes es poden revertir backups de canvis massius");
    }

    const resource = log.entitat.replace("backup_", "") as EmissionsResource;
    const previousRecords = log.valorsAnteriors as unknown;

    if (!Array.isArray(previousRecords) || previousRecords.length === 0) {
      throw new HttpError(400, "El backup no te dades per revertir");
    }

    for (const row of previousRecords as Record<string, unknown>[]) {
      const rowId = idSchema.parse(row["id"]);
      const updateData = { ...row };
      delete updateData["id"];
      delete updateData["createdAt"];
      delete updateData["updatedAt"];

      if (resource === "materials") {
        await prisma.factorEmissioMaterial.update({ where: { id: rowId }, data: updateData });
      } else if (resource === "transport") {
        await prisma.factorEmissioTransport.update({ where: { id: rowId }, data: updateData });
      } else if (resource === "combustibles") {
        await prisma.combustibleFabricacio.update({ where: { id: rowId }, data: updateData });
      } else if (resource === "electric") {
        await prisma.consumElectric.update({ where: { id: rowId }, data: updateData });
      } else if (resource === "equips") {
        await prisma.equipPosadaEnObra.update({ where: { id: rowId }, data: updateData });
      } else if (resource === "limits") {
        await prisma.limitNormatiuEmissions.update({ where: { id: rowId }, data: updateData });
      } else {
        await prisma.constantCalorifica.update({ where: { id: rowId }, data: updateData });
      }
    }

    await createAuditLog({
      usuariId,
      versioBaseDadesId: log.versioBaseDadesId,
      tipusCanvi: TipusCanviEmissio.MODIFICAT,
      entitat: `revert_${resource}`,
      registreId: log.id,
      nous: { revertedRows: (previousRecords as unknown[]).length },
    });

    return { revertedLogId: log.id, resource, rows: (previousRecords as unknown[]).length };
  },
};
