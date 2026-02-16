import { TipusMaterial } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { prisma } from "../config/database.js";
import { HttpError } from "../utils/http-error.js";

const importSchema = z.object({
  csvContent: z.string().min(1, "El fitxer CSV esta buit"),
  fileName: z.string().min(1).optional(),
  numeroVersio: z.string().min(1).max(32),
  descripcio: z.string().max(2000).optional(),
  delimiter: z.enum([",", ";"]).optional(),
});

interface ParsedRow {
  codi: string;
  nom: string;
  tipus: TipusMaterial;
  preuBaseEurT: number | null;
  factorEmissioA1: number | null;
  fontFactorEmissio: string | null;
}

function normalizeHeader(header: string) {
  return header.trim().toUpperCase();
}

function splitCsvLine(line: string, delimiter: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (const char of line) {

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === delimiter && !inQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
}

function detectDelimiter(headerLine: string, forced?: string) {
  if (forced) {
    return forced;
  }

  const semicolonCount = headerLine.split(";").length;
  const commaCount = headerLine.split(",").length;
  return semicolonCount > commaCount ? ";" : ",";
}

function parseTipusMaterial(value: string): TipusMaterial {
  const normalized = value.trim().toUpperCase();

  if (Object.values(TipusMaterial).includes(normalized as TipusMaterial)) {
    return normalized as TipusMaterial;
  }

  const alias: Record<string, TipusMaterial> = {
    MESCLA: TipusMaterial.MESCLA_BITUMINOSA,
    MESCLA_BITUMINOSA: TipusMaterial.MESCLA_BITUMINOSA,
    MACADAM: TipusMaterial.MACADAM,
    ESTABILITZAT: TipusMaterial.ESTABILITZAT,
    GRAVA: TipusMaterial.GRAVA,
    ALTRE: TipusMaterial.ALTRE,
  };

  const mapped = alias[normalized];
  if (!mapped) {
    throw new Error(`Tipus de material invalid: ${value}`);
  }

  return mapped;
}

function parseOptionalNumber(value: string) {
  if (!value) {
    return null;
  }

  const normalized = value.replace(",", ".");
  const number = Number(normalized);

  if (Number.isNaN(number)) {
    throw new Error(`Valor numeric invalid: ${value}`);
  }

  return number;
}

function parseRows(csvContent: string, delimiter?: string) {
  const lines = csvContent
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length < 2) {
    throw new HttpError(400, "El CSV ha de contenir capcalera i almenys una fila");
  }

  const detectedDelimiter = detectDelimiter(lines[0] ?? ",", delimiter);
  const headers = splitCsvLine(lines[0] ?? "", detectedDelimiter).map(normalizeHeader);

  const indexes = {
    codi: headers.indexOf("CODI") >= 0 ? headers.indexOf("CODI") : headers.indexOf("CODIGO"),
    nom: headers.indexOf("NOM") >= 0 ? headers.indexOf("NOM") : headers.indexOf("NOMBRE"),
    tipus: headers.indexOf("TIPUS") >= 0 ? headers.indexOf("TIPUS") : headers.indexOf("TIPO"),
    preu: headers.indexOf("PREU") >= 0 ? headers.indexOf("PREU") : headers.indexOf("PRECIO"),
    factor: headers.indexOf("FACTOR_EMISSIO_A1"),
    font: headers.indexOf("FONT_FACTOR_EMISSIO"),
  };

  if (indexes.codi < 0 || indexes.nom < 0 || indexes.tipus < 0) {
    throw new HttpError(400, "El CSV ha d'incloure columnes CODI, NOM i TIPUS");
  }

  const rows: ParsedRow[] = [];
  const errors: string[] = [];

  for (let lineIndex = 1; lineIndex < lines.length; lineIndex += 1) {
    const values = splitCsvLine(lines[lineIndex] ?? "", detectedDelimiter);

    try {
      const codi = values[indexes.codi]?.trim();
      const nom = values[indexes.nom]?.trim();
      const tipusRaw = values[indexes.tipus]?.trim();

      if (!codi || !nom || !tipusRaw) {
        throw new Error("Codi, nom o tipus buit");
      }

      rows.push({
        codi,
        nom,
        tipus: parseTipusMaterial(tipusRaw),
        preuBaseEurT: indexes.preu >= 0 ? parseOptionalNumber(values[indexes.preu] ?? "") : null,
        factorEmissioA1: indexes.factor >= 0 ? parseOptionalNumber(values[indexes.factor] ?? "") : null,
        fontFactorEmissio: indexes.font >= 0 ? (values[indexes.font]?.trim() || null) : null,
      });
    } catch (error: unknown) {
      errors.push(`Línia ${lineIndex + 1}: ${(error as Error).message}`);
    }
  }

  if (errors.length > 0) {
    throw new HttpError(400, `S'han detectat errors al CSV: ${errors.join(" | ")}`);
  }

  return rows;
}

export const importService = {
  parseRows,

  async importPrices(payload: unknown, usuariId?: string) {
    const input = importSchema.parse(payload);

    if (input.fileName && !input.fileName.toLowerCase().endsWith(".csv")) {
      throw new HttpError(400, "Nomes s'accepten fitxers CSV en aquest endpoint");
    }

    const rows = parseRows(input.csvContent, input.delimiter);

    return await prisma.$transaction(async (tx) => {
      const version = await tx.versioBaseDades.create({
        data: {
          numero: input.numeroVersio,
          descripcio: input.descripcio ?? `Importacio de preus (${rows.length} registres)`,
          estat: "PUBLICADA",
          dataPublicacio: new Date(),
          fitxersFont: [input.fileName ?? "import.csv"],
          esActual: false,
          ...(usuariId ? { createdBy: { connect: { id: usuariId } } } : {}),
        },
      });

      await tx.material.createMany({
        data: rows.map((row) => ({
          codi: `${row.codi}-${version.numero}`,
          nom: row.nom,
          tipus: row.tipus,
          preuBaseEurT: row.preuBaseEurT,
          factorEmissioA1: row.factorEmissioA1,
          fontFactorEmissio: row.fontFactorEmissio,
          versioBaseDadesId: version.id,
          unitatPreu: "t",
          actiu: true,
        })),
      });

      const createdMaterials = await tx.material.findMany({
        where: { versioBaseDadesId: version.id },
        select: { id: true },
      });

      if (createdMaterials.length > 0) {
        await tx.materialAuditLog.createMany({
          data: createdMaterials.map((material) => ({
            materialId: material.id,
            usuariId: usuariId ?? null,
            accio: "IMPORTAT",
            dadesNoves: { versioId: version.id } as Prisma.InputJsonValue,
          })),
        });
      }

      return {
        version,
        imported: rows.length,
      };
    });
  },
};
