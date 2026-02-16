import { Prisma, TipusMaterial } from "@prisma/client";
import { z } from "zod";

import { prisma } from "../config/database.js";
import { HttpError } from "../utils/http-error.js";

const materialInputSchema = z.object({
  codi: z.string().min(1).max(64),
  nom: z.string().min(2).max(200),
  tipus: z.nativeEnum(TipusMaterial),
  descripcio: z.string().max(4000).optional().nullable(),
  modulElasticMpa: z.number().positive().optional().nullable(),
  coeficientPoisson: z.number().min(0).max(0.6).optional().nullable(),
  resistenciaFlexioMpa: z.number().min(0).optional().nullable(),
  resistenciaCompressioMpa: z.number().min(0).optional().nullable(),
  densitatTM3: z.number().min(0).optional().nullable(),
  factorEmissioA1: z.number().optional().nullable(),
  fontFactorEmissio: z.string().max(255).optional().nullable(),
  preuBaseEurT: z.number().min(0).optional().nullable(),
  unitatPreu: z.string().min(1).max(16).optional(),
  actiu: z.boolean().optional(),
  versioBaseDadesId: z.string().min(1).optional(),
});

const materialUpdateSchema = materialInputSchema
  .omit({ codi: true })
  .partial()
  .refine((value) => Object.keys(value).length > 0, "Cal enviar almenys un camp a actualitzar");

const listMaterialsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  nom: z.string().optional(),
  tipus: z.nativeEnum(TipusMaterial).optional(),
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

function buildWhere(input: z.infer<typeof listMaterialsSchema>): Prisma.MaterialWhereInput {
  const where: Prisma.MaterialWhereInput = {};

  if (input.nom) {
    where.nom = { contains: input.nom, mode: Prisma.QueryMode.insensitive };
  }

  if (input.tipus) {
    where.tipus = input.tipus;
  }

  if (input.versioBaseDadesId) {
    where.versioBaseDadesId = input.versioBaseDadesId;
  }

  if (input.actiu !== undefined) {
    where.actiu = input.actiu;
  }

  return where;
}

async function resolveVersionId(inputVersionId?: string) {
  if (inputVersionId) {
    const version = await prisma.versioBaseDades.findUnique({ where: { id: inputVersionId } });
    if (!version) {
      throw new HttpError(400, "La versio de base de dades indicada no existeix");
    }
    return version.id;
  }

  const activeVersion = await prisma.versioBaseDades.findFirst({
    where: { esActual: true },
    orderBy: { createdAt: "desc" },
  });

  if (activeVersion) {
    return activeVersion.id;
  }

  const fallbackVersion = await prisma.versioBaseDades.create({
    data: {
      numero: `init-${new Date().toISOString().slice(0, 10)}`,
      descripcio: "Versio inicial generada automaticament",
      esActual: true,
      estat: "PUBLICADA",
      dataPublicacio: new Date(),
    },
  });

  return fallbackVersion.id;
}

async function createAuditLog(params: {
  materialId: string;
  usuariId: string | undefined;
  accio: "CREAT" | "ACTUALITZAT" | "ELIMINAT";
  dadesAnteriors?: unknown;
  dadesNoves?: unknown;
}) {
  await prisma.materialAuditLog.create({
    data: {
      materialId: params.materialId,
      usuariId: params.usuariId ?? null,
      accio: params.accio,
      dadesAnteriors: (params.dadesAnteriors ?? null) as
        | Prisma.InputJsonValue
        | Prisma.NullableJsonNullValueInput,
      dadesNoves: (params.dadesNoves ?? null) as
        | Prisma.InputJsonValue
        | Prisma.NullableJsonNullValueInput,
    },
  });
}

export const materialsService = {
  async list(query: unknown) {
    const input = listMaterialsSchema.parse(query);
    const where = buildWhere(input);
    const skip = (input.page - 1) * input.pageSize;

    const [items, total] = await prisma.$transaction([
      prisma.material.findMany({
        where,
        include: { versioBaseDades: true },
        skip,
        take: input.pageSize,
        orderBy: { updatedAt: "desc" },
      }),
      prisma.material.count({ where }),
    ]);

    return {
      items,
      pagination: {
        page: input.page,
        pageSize: input.pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / input.pageSize)),
      },
    };
  },

  async getById(id: string) {
    const material = await prisma.material.findUnique({
      where: { id },
      include: {
        versioBaseDades: true,
        auditories: {
          include: { usuari: { select: { id: true, email: true } } },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });

    if (!material) {
      throw new HttpError(404, "Material no trobat");
    }

    return material;
  },

  async create(payload: unknown, usuariId?: string) {
    const input = materialInputSchema.parse(payload);
    const versionId = await resolveVersionId(input.versioBaseDadesId);

    try {
      const material = await prisma.material.create({
        data: {
          codi: input.codi,
          nom: input.nom,
          tipus: input.tipus,
          descripcio: input.descripcio ?? null,
          modulElasticMpa: input.modulElasticMpa ?? null,
          coeficientPoisson: input.coeficientPoisson ?? null,
          resistenciaFlexioMpa: input.resistenciaFlexioMpa ?? null,
          resistenciaCompressioMpa: input.resistenciaCompressioMpa ?? null,
          densitatTM3: input.densitatTM3 ?? null,
          factorEmissioA1: input.factorEmissioA1 ?? null,
          fontFactorEmissio: input.fontFactorEmissio ?? null,
          preuBaseEurT: input.preuBaseEurT ?? null,
          unitatPreu: input.unitatPreu ?? "t",
          actiu: input.actiu ?? true,
          versioBaseDadesId: versionId,
        },
      });

      await createAuditLog({
        materialId: material.id,
        usuariId,
        accio: "CREAT",
        dadesNoves: material,
      });

      return material;
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new HttpError(409, "Ja existeix un material amb aquest codi");
      }
      throw error;
    }
  },

  async update(id: string, payload: unknown, usuariId?: string) {
    const input = materialUpdateSchema.parse(payload);

    const existing = await prisma.material.findUnique({ where: { id } });
    if (!existing) {
      throw new HttpError(404, "Material no trobat");
    }

    const versionId = await resolveVersionId(input.versioBaseDadesId ?? existing.versioBaseDadesId);

    const updateData: Prisma.MaterialUpdateInput = {};
    if (input.nom !== undefined) updateData.nom = input.nom;
    if (input.tipus !== undefined) updateData.tipus = input.tipus;
    if (input.descripcio !== undefined) updateData.descripcio = input.descripcio;
    if (input.modulElasticMpa !== undefined) updateData.modulElasticMpa = input.modulElasticMpa;
    if (input.coeficientPoisson !== undefined) updateData.coeficientPoisson = input.coeficientPoisson;
    if (input.resistenciaFlexioMpa !== undefined) updateData.resistenciaFlexioMpa = input.resistenciaFlexioMpa;
    if (input.resistenciaCompressioMpa !== undefined) {
      updateData.resistenciaCompressioMpa = input.resistenciaCompressioMpa;
    }
    if (input.densitatTM3 !== undefined) updateData.densitatTM3 = input.densitatTM3;
    if (input.factorEmissioA1 !== undefined) updateData.factorEmissioA1 = input.factorEmissioA1;
    if (input.fontFactorEmissio !== undefined) updateData.fontFactorEmissio = input.fontFactorEmissio;
    if (input.preuBaseEurT !== undefined) updateData.preuBaseEurT = input.preuBaseEurT;
    if (input.unitatPreu !== undefined) updateData.unitatPreu = input.unitatPreu;
    if (input.actiu !== undefined) updateData.actiu = input.actiu;
    updateData.versioBaseDades = { connect: { id: versionId } };

    try {
      const updated = await prisma.material.update({
        where: { id },
        data: updateData,
      });

      await createAuditLog({
        materialId: updated.id,
        usuariId,
        accio: "ACTUALITZAT",
        dadesAnteriors: existing,
        dadesNoves: updated,
      });

      return updated;
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new HttpError(409, "Ja existeix un material amb aquest codi");
      }
      throw error;
    }
  },

  async remove(id: string, usuariId?: string) {
    const existing = await prisma.material.findUnique({ where: { id } });
    if (!existing) {
      throw new HttpError(404, "Material no trobat");
    }

    await prisma.$transaction(async (tx) => {
      await tx.materialAuditLog.create({
        data: {
          materialId: id,
          usuariId: usuariId ?? null,
          accio: "ELIMINAT",
          dadesAnteriors: existing as Prisma.InputJsonValue,
        },
      });

      await tx.material.delete({ where: { id } });
    });
  },
};
