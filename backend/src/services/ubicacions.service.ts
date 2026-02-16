import { Prisma, TipusUbicacio } from "@prisma/client";
import { z } from "zod";

import { osmService } from "./osm.service.js";
import { prisma } from "../config/database.js";
import { HttpError } from "../utils/http-error.js";

const ubicacioSchema = z.object({
  nom: z.string().min(2).max(160),
  tipus: z.nativeEnum(TipusUbicacio),
  descripcio: z.string().max(500).optional().nullable(),
  adreca: z.string().max(255).optional().nullable(),
  latitud: z.number().min(-90).max(90),
  longitud: z.number().min(-180).max(180),
  actiu: z.boolean().optional(),
});

const listSchema = z.object({
  tipus: z.nativeEnum(TipusUbicacio).optional(),
  q: z.string().optional(),
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

const nearbySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().positive().max(500).default(50),
  tipus: z.nativeEnum(TipusUbicacio).optional(),
  q: z.string().optional(),
  limit: z.coerce.number().int().positive().max(500).default(200),
});

const importOsmSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  radiusKm: z.number().positive().max(500).default(50),
});

interface Identity {
  organitzacioId: string;
}

function toNumber(value: Prisma.Decimal) {
  return Number(value.toString());
}

function haversineDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const radius = 6371000;
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return radius * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export const ubicacionsService = {
  async list(query: unknown, identity: Identity) {
    const filters = listSchema.parse(query);
    const where: Prisma.UbicacioWhereInput = {
      organitzacioId: identity.organitzacioId,
    };

    if (filters.tipus) {
      where.tipus = filters.tipus;
    }

    if (filters.actiu !== undefined) {
      where.actiu = filters.actiu;
    }

    if (filters.q) {
      where.OR = [
        { nom: { contains: filters.q, mode: Prisma.QueryMode.insensitive } },
        { adreca: { contains: filters.q, mode: Prisma.QueryMode.insensitive } },
      ];
    }

    const rows = await prisma.ubicacio.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return rows.map((row) => ({
      ...row,
      latitud: toNumber(row.latitud),
      longitud: toNumber(row.longitud),
    }));
  },

  async create(payload: unknown, identity: Identity) {
    const data = ubicacioSchema.parse(payload);
    const created = await prisma.ubicacio.create({
      data: {
        nom: data.nom,
        tipus: data.tipus,
        descripcio: data.descripcio ?? null,
        adreca: data.adreca ?? null,
        latitud: data.latitud,
        longitud: data.longitud,
        actiu: data.actiu ?? true,
        organitzacioId: identity.organitzacioId,
      },
    });

    return {
      ...created,
      latitud: toNumber(created.latitud),
      longitud: toNumber(created.longitud),
    };
  },

  async update(id: string, payload: unknown, identity: Identity) {
    const data = ubicacioSchema.partial().refine((value) => Object.keys(value).length > 0);
    const parsed = data.parse(payload);

    const existing = await prisma.ubicacio.findFirst({
      where: { id, organitzacioId: identity.organitzacioId },
      select: { id: true },
    });

    if (!existing) {
      throw new HttpError(404, "Ubicacio no trobada");
    }

    const updated = await prisma.ubicacio.update({
      where: { id },
      data: {
        ...(parsed.nom !== undefined ? { nom: parsed.nom } : {}),
        ...(parsed.tipus !== undefined ? { tipus: parsed.tipus } : {}),
        ...(parsed.descripcio !== undefined ? { descripcio: parsed.descripcio } : {}),
        ...(parsed.adreca !== undefined ? { adreca: parsed.adreca } : {}),
        ...(parsed.latitud !== undefined ? { latitud: parsed.latitud } : {}),
        ...(parsed.longitud !== undefined ? { longitud: parsed.longitud } : {}),
        ...(parsed.actiu !== undefined ? { actiu: parsed.actiu } : {}),
      },
    });

    return {
      ...updated,
      latitud: toNumber(updated.latitud),
      longitud: toNumber(updated.longitud),
    };
  },

  async remove(id: string, identity: Identity) {
    const existing = await prisma.ubicacio.findFirst({
      where: { id, organitzacioId: identity.organitzacioId },
      select: { id: true },
    });

    if (!existing) {
      throw new HttpError(404, "Ubicacio no trobada");
    }

    await prisma.ubicacio.delete({ where: { id } });
  },

  async nearby(query: unknown, identity: Identity) {
    const filters = nearbySchema.parse(query);

    const where: Prisma.UbicacioWhereInput = {
      organitzacioId: identity.organitzacioId,
      actiu: true,
      ...(filters.tipus ? { tipus: filters.tipus } : {}),
      ...(filters.q
        ? {
            OR: [
              { nom: { contains: filters.q, mode: Prisma.QueryMode.insensitive } },
              { adreca: { contains: filters.q, mode: Prisma.QueryMode.insensitive } },
            ],
          }
        : {}),
    };

    const rows = await prisma.ubicacio.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: filters.limit,
    });

    const items = rows
      .map((row) => {
        const latitud = toNumber(row.latitud);
        const longitud = toNumber(row.longitud);
        const distanciaMetres = haversineDistanceMeters(filters.lat, filters.lng, latitud, longitud);
        return {
          ...row,
          latitud,
          longitud,
          distanciaMetres,
          distanciaKm: distanciaMetres / 1000,
        };
      })
      .filter((item) => item.distanciaKm <= filters.radius)
      .sort((a, b) => a.distanciaMetres - b.distanciaMetres);

    return items;
  },

  async importarDesOsm(payload: unknown, identity: Identity) {
    const parsed = importOsmSchema.parse(payload);
    const candidates = await osmService.buscarPedreresOSM(parsed.lat, parsed.lng, parsed.radiusKm);

    let importades = 0;
    let duplicades = 0;

    const importedItems = [] as {
      id: string;
      nom: string;
      latitud: number;
      longitud: number;
      adreca: string | null;
      tipus: TipusUbicacio;
    }[];

    for (const item of candidates) {
      const existing = await prisma.ubicacio.findFirst({
        where: {
          organitzacioId: identity.organitzacioId,
          tipus: TipusUbicacio.PEDRERA,
          nom: item.nom,
          latitud: {
            gte: item.latitud - 0.0001,
            lte: item.latitud + 0.0001,
          },
          longitud: {
            gte: item.longitud - 0.0001,
            lte: item.longitud + 0.0001,
          },
        },
      });

      if (existing) {
        duplicades += 1;
        continue;
      }

      const created = await prisma.ubicacio.create({
        data: {
          nom: item.nom,
          tipus: TipusUbicacio.PEDRERA,
          adreca: item.adreca,
          descripcio: `Importat automàticament des d'OSM (${item.externalId})`,
          latitud: item.latitud,
          longitud: item.longitud,
          organitzacioId: identity.organitzacioId,
          actiu: true,
        },
      });

      importades += 1;
      importedItems.push({
        id: created.id,
        nom: created.nom,
        latitud: toNumber(created.latitud),
        longitud: toNumber(created.longitud),
        adreca: created.adreca ?? null,
        tipus: created.tipus,
      });
    }

    return {
      totalDetectades: candidates.length,
      importades,
      duplicades,
      radiusKm: parsed.radiusKm,
      items: importedItems,
    };
  },
};
