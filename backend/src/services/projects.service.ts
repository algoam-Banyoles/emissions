import { EstatProjecte, Prisma } from "@prisma/client";
import { z } from "zod";

import { prisma } from "../config/database.js";
import { calcularCategoriaTransit } from "../utils/calculsTransit.js";
import { HttpError } from "../utils/http-error.js";

const categoriaTransitSchema = z.enum(["TT1", "TT2", "TT3", "TT4", "TT5"]);

const projectInputSchema = z.object({
  codi: z.string().min(2).max(64),
  nom: z.string().min(2).max(160),
  descripcio: z.string().max(2000).optional().nullable(),
  estat: z.nativeEnum(EstatProjecte).optional(),
  imd: z.number().int().positive().optional().nullable(),
  percentatgeVp: z.number().min(0).max(100).optional().nullable(),
  categoriaTransitManual: categoriaTransitSchema.optional().nullable(),
  usaCategoriaManual: z.boolean().optional(),
  tipusTracat: z.string().max(20).optional().nullable(),
  zonaClimatica: z.string().max(20).optional().nullable(),
  vidaUtil: z.number().int().positive().max(100).optional().nullable(),
  creixementAnual: z.number().min(0).max(100).optional().nullable(),
  latitud: z.number().min(-90).max(90).optional().nullable(),
  longitud: z.number().min(-180).max(180).optional().nullable(),
});

const projectUpdateSchema = projectInputSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  "Cal enviar almenys un camp a actualitzar",
);

const listProjectsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(10),
  nom: z.string().optional(),
  estat: z.nativeEnum(EstatProjecte).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});

interface ProjectIdentity {
  organitzacioId: string;
}

function buildWhere(input: z.infer<typeof listProjectsSchema>, organitzacioId: string): Prisma.ProjecteWhereInput {
  const where: Prisma.ProjecteWhereInput = { organitzacioId };

  if (input.nom) {
    where.nom = {
      contains: input.nom,
      mode: Prisma.QueryMode.insensitive,
    };
  }

  if (input.estat) {
    where.estat = input.estat;
  }

  if (input.dateFrom || input.dateTo) {
    where.createdAt = {};
    if (input.dateFrom) {
      where.createdAt.gte = new Date(input.dateFrom);
    }
    if (input.dateTo) {
      where.createdAt.lte = new Date(input.dateTo);
    }
  }

  return where;
}

function buildActivity(projecte: {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  const activities = [
    {
      id: `${projecte.id}-created`,
      tipus: "PROJECTE_CREAT",
      timestamp: projecte.createdAt.toISOString(),
      descripcio: "Creacio del projecte",
    },
  ];

  if (projecte.updatedAt.getTime() !== projecte.createdAt.getTime()) {
    activities.push({
      id: `${projecte.id}-updated`,
      tipus: "PROJECTE_ACTUALITZAT",
      timestamp: projecte.updatedAt.toISOString(),
      descripcio: "Actualitzacio de dades del projecte",
    });
  }

  return activities;
}

function calcularCategoriaTransitAutoNullable(imd: number | null, percentatgeVp: number | null) {
  if (imd === null || percentatgeVp === null) {
    return null;
  }

  return calcularCategoriaTransit(imd, percentatgeVp);
}

function resolveTransitFields(input: {
  imd?: number | null;
  percentatgeVp?: number | null;
  categoriaTransitManual?: "TT1" | "TT2" | "TT3" | "TT4" | "TT5" | null;
  usaCategoriaManual?: boolean;
}) {
  const categoriaTransitAuto = calcularCategoriaTransitAutoNullable(
    input.imd ?? null,
    input.percentatgeVp ?? null,
  );

  const usaCategoriaManual = input.usaCategoriaManual ?? false;
  const categoriaTransitManual =
    usaCategoriaManual ? (input.categoriaTransitManual ?? categoriaTransitAuto) : null;

  return {
    categoriaTransitAuto,
    categoriaTransitManual,
    usaCategoriaManual,
  };
}

export const projectsService = {
  async list(query: unknown, identity: ProjectIdentity) {
    const input = listProjectsSchema.parse(query);
    const where = buildWhere(input, identity.organitzacioId);
    const skip = (input.page - 1) * input.pageSize;

    const [items, total] = await prisma.$transaction([
      prisma.projecte.findMany({
        where,
        skip,
        take: input.pageSize,
        orderBy: { createdAt: "desc" },
      }),
      prisma.projecte.count({ where }),
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

  async create(data: unknown, identity: ProjectIdentity) {
    const input = projectInputSchema.parse(data);
    const transit = resolveTransitFields({
      imd: input.imd ?? null,
      percentatgeVp: input.percentatgeVp ?? null,
      categoriaTransitManual: input.categoriaTransitManual ?? null,
      usaCategoriaManual: input.usaCategoriaManual ?? false,
    });
    const createData: Prisma.ProjecteCreateInput = {
      codi: input.codi,
      nom: input.nom,
      estat: input.estat ?? EstatProjecte.ESBORRANY,
      organitzacio: {
        connect: { id: identity.organitzacioId },
      },
      descripcio: input.descripcio ?? null,
      imd: input.imd ?? null,
      percentatgeVp: input.percentatgeVp ?? null,
      categoriaTransitAuto: transit.categoriaTransitAuto,
      categoriaTransitManual: transit.categoriaTransitManual,
      usaCategoriaManual: transit.usaCategoriaManual,
      tipusTracat: input.tipusTracat ?? null,
      zonaClimatica: input.zonaClimatica ?? null,
      vidaUtil: input.vidaUtil ?? null,
      creixementAnual: input.creixementAnual ?? null,
      latitud: input.latitud ?? null,
      longitud: input.longitud ?? null,
    };

    try {
      return await prisma.projecte.create({
        data: createData,
      });
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new HttpError(409, "El codi de projecte ja existeix");
      }
      throw error;
    }
  },

  async getById(projectId: string, identity: ProjectIdentity) {
    const project = await prisma.projecte.findFirst({
      where: {
        id: projectId,
        organitzacioId: identity.organitzacioId,
      },
    });

    if (!project) {
      throw new HttpError(404, "Projecte no trobat");
    }

    return {
      ...project,
      activitats: buildActivity(project),
    };
  },

  async update(projectId: string, data: unknown, identity: ProjectIdentity) {
    const input = projectUpdateSchema.parse(data);
    const existing = await prisma.projecte.findFirst({
      where: {
        id: projectId,
        organitzacioId: identity.organitzacioId,
      },
      select: {
        id: true,
        imd: true,
        percentatgeVp: true,
        categoriaTransitManual: true,
        usaCategoriaManual: true,
      },
    });

    if (!existing) {
      throw new HttpError(404, "Projecte no trobat");
    }

    const nextImd = input.imd !== undefined ? input.imd : existing.imd;
    const nextPercentatgeVp =
      input.percentatgeVp !== undefined ? input.percentatgeVp : existing.percentatgeVp;
    const nextUsaCategoriaManual =
      input.usaCategoriaManual !== undefined ? input.usaCategoriaManual : existing.usaCategoriaManual;
    const nextCategoriaTransitManual =
      input.categoriaTransitManual !== undefined
        ? input.categoriaTransitManual
        : existing.categoriaTransitManual;
    const transit = resolveTransitFields({
      imd: nextImd,
      percentatgeVp: nextPercentatgeVp,
      categoriaTransitManual: nextCategoriaTransitManual as "TT1" | "TT2" | "TT3" | "TT4" | "TT5" | null,
      usaCategoriaManual: nextUsaCategoriaManual,
    });

    const updateData: Prisma.ProjecteUpdateInput = {};

    if (input.codi !== undefined) updateData.codi = input.codi;
    if (input.nom !== undefined) updateData.nom = input.nom;
    if (input.descripcio !== undefined) updateData.descripcio = input.descripcio;
    if (input.estat !== undefined) updateData.estat = input.estat;
    if (input.imd !== undefined) updateData.imd = input.imd;
    if (input.percentatgeVp !== undefined) updateData.percentatgeVp = input.percentatgeVp;
    if (input.categoriaTransitManual !== undefined) {
      updateData.categoriaTransitManual = input.categoriaTransitManual;
    }
    if (input.usaCategoriaManual !== undefined) {
      updateData.usaCategoriaManual = input.usaCategoriaManual;
    }
    updateData.categoriaTransitAuto = transit.categoriaTransitAuto;
    updateData.categoriaTransitManual = transit.categoriaTransitManual;
    updateData.usaCategoriaManual = transit.usaCategoriaManual;
    if (input.tipusTracat !== undefined) updateData.tipusTracat = input.tipusTracat;
    if (input.zonaClimatica !== undefined) updateData.zonaClimatica = input.zonaClimatica;
    if (input.vidaUtil !== undefined) updateData.vidaUtil = input.vidaUtil;
    if (input.creixementAnual !== undefined) updateData.creixementAnual = input.creixementAnual;
    if (input.latitud !== undefined) updateData.latitud = input.latitud;
    if (input.longitud !== undefined) updateData.longitud = input.longitud;

    try {
      return await prisma.projecte.update({
        where: { id: projectId },
        data: updateData,
      });
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new HttpError(409, "El codi de projecte ja existeix");
      }
      throw error;
    }
  },

  async remove(projectId: string, identity: ProjectIdentity) {
    const existing = await prisma.projecte.findFirst({
      where: {
        id: projectId,
        organitzacioId: identity.organitzacioId,
      },
      select: { id: true },
    });

    if (!existing) {
      throw new HttpError(404, "Projecte no trobat");
    }

    await prisma.projecte.delete({
      where: { id: projectId },
    });
  },
};
