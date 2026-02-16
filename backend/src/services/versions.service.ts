import { EstatVersioBaseDades, Prisma, type VersioBaseDades } from "@prisma/client";
import { z } from "zod";

import { prisma } from "../config/database.js";
import { HttpError } from "../utils/http-error.js";

const publishVersionSchema = z.object({
  numero: z.string().min(1).max(32),
  descripcio: z.string().max(2000).optional().nullable(),
  fitxersFont: z.array(z.string().min(1)).optional(),
  esActual: z.boolean().optional(),
  sourceVersionId: z.string().min(1).optional(),
});

export type PublishVersionInput = z.infer<typeof publishVersionSchema>;

function mapVersion(version: VersioBaseDades & { _count?: { materials: number } }) {
  const materialsCount = version._count?.materials;

  return {
    ...version,
    ...(materialsCount !== undefined ? { materialsCount } : {}),
  };
}

async function setActiveVersion(tx: Prisma.TransactionClient, versionId: string) {
  await tx.versioBaseDades.updateMany({
    data: { esActual: false },
    where: { esActual: true },
  });

  await tx.versioBaseDades.update({
    where: { id: versionId },
    data: { esActual: true },
  });
}

export const versionsService = {
  async list() {
    const versions = await prisma.versioBaseDades.findMany({
      include: { _count: { select: { materials: true } } },
      orderBy: [{ dataPublicacio: "desc" }, { createdAt: "desc" }],
    });

    return versions.map(mapVersion);
  },

  async publish(input: unknown, createdById?: string) {
    const data = publishVersionSchema.parse(input);

    try {
      return await prisma.$transaction(async (tx) => {
        const version = await tx.versioBaseDades.create({
          data: {
            numero: data.numero,
            descripcio: data.descripcio ?? null,
            estat: EstatVersioBaseDades.PUBLICADA,
            dataPublicacio: new Date(),
            esActual: data.esActual ?? false,
            ...(data.fitxersFont ? { fitxersFont: data.fitxersFont } : {}),
            ...(createdById ? { createdBy: { connect: { id: createdById } } } : {}),
          },
          include: { _count: { select: { materials: true } } },
        });

        if (data.sourceVersionId) {
          const sourceMaterials = await tx.material.findMany({
            where: { versioBaseDadesId: data.sourceVersionId },
          });

          if (sourceMaterials.length > 0) {
            await tx.material.createMany({
              data: sourceMaterials.map((material) => ({
                codi: `${material.codi}-${version.numero}`,
                nom: material.nom,
                tipus: material.tipus,
                descripcio: material.descripcio,
                modulElasticMpa: material.modulElasticMpa,
                coeficientPoisson: material.coeficientPoisson,
                resistenciaFlexioMpa: material.resistenciaFlexioMpa,
                resistenciaCompressioMpa: material.resistenciaCompressioMpa,
                densitatTM3: material.densitatTM3,
                factorEmissioA1: material.factorEmissioA1,
                fontFactorEmissio: material.fontFactorEmissio,
                preuBaseEurT: material.preuBaseEurT,
                unitatPreu: material.unitatPreu,
                actiu: material.actiu,
                versioBaseDadesId: version.id,
              })),
            });
          }
        }

        if (version.esActual) {
          await setActiveVersion(tx, version.id);
        }

        return mapVersion(version);
      });
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new HttpError(409, "Ja existeix una versio amb aquest numero");
      }
      throw error;
    }
  },

  async activate(versionId: string) {
    const version = await prisma.versioBaseDades.findUnique({ where: { id: versionId } });
    if (!version) {
      throw new HttpError(404, "Versio no trobada");
    }

    await prisma.$transaction(async (tx) => {
      await tx.versioBaseDades.update({
        where: { id: versionId },
        data: {
          estat: EstatVersioBaseDades.PUBLICADA,
          dataPublicacio: version.dataPublicacio ?? new Date(),
        },
      });
      await setActiveVersion(tx, versionId);
    });

    const refreshed = await prisma.versioBaseDades.findUnique({
      where: { id: versionId },
      include: { _count: { select: { materials: true } } },
    });

    if (!refreshed) {
      throw new HttpError(404, "Versio no trobada");
    }

    return mapVersion(refreshed);
  },

  async compare(fromVersionId: string, toVersionId: string) {
    const [fromItems, toItems] = await Promise.all([
      prisma.material.findMany({ where: { versioBaseDadesId: fromVersionId } }),
      prisma.material.findMany({ where: { versioBaseDadesId: toVersionId } }),
    ]);

    const fromByCode = new Map(fromItems.map((item) => [item.codi, item]));
    const toByCode = new Map(toItems.map((item) => [item.codi, item]));

    const created = toItems.filter((item) => !fromByCode.has(item.codi)).length;
    const removed = fromItems.filter((item) => !toByCode.has(item.codi)).length;

    let updated = 0;
    for (const item of toItems) {
      const previous = fromByCode.get(item.codi);
      if (!previous) {
        continue;
      }

      if (
        previous.nom !== item.nom ||
        previous.preuBaseEurT !== item.preuBaseEurT ||
        previous.factorEmissioA1 !== item.factorEmissioA1 ||
        previous.actiu !== item.actiu
      ) {
        updated += 1;
      }
    }

    return {
      fromVersionId,
      toVersionId,
      summary: {
        created,
        updated,
        removed,
      },
    };
  },
};
