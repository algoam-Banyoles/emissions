import * as XLSX from "xlsx";
import { z } from "zod";

import { prisma } from "../config/database.js";
import { HttpError } from "../utils/http-error.js";

const exportCategorySchema = z.enum([
  "materials",
  "transport",
  "combustibles",
  "electric",
  "equips",
  "limits",
  "constants",
]);

const exportFormatSchema = z.enum(["csv", "xlsx"]);

export type EmissionsExportCategory = z.infer<typeof exportCategorySchema>;
export type EmissionsExportFormat = z.infer<typeof exportFormatSchema>;

const exportOptionsSchema = z.object({
  categoria: exportCategorySchema,
  versio: z.string().optional(),
  format: exportFormatSchema.default("csv"),
  usuariEmail: z.string().optional(),
});

interface ExportResult {
  fileName: string;
  mimeType: string;
  content: Buffer;
}

function getTodayStamp() {
  return new Date().toISOString().slice(0, 10);
}

function escapeCsvValue(value: unknown): string {
  const text = String(value ?? "");
  if (text.includes(",") || text.includes("\n") || text.includes('"')) {
    return `"${text.replaceAll('"', '""')}"`;
  }

  return text;
}

async function resolveVersionId(versionId?: string) {
  if (versionId) {
    const version = await prisma.versioBaseDades.findUnique({
      where: { id: versionId },
      select: { id: true, numero: true },
    });

    if (!version) {
      throw new HttpError(404, "Versio no trobada");
    }

    return version;
  }

  const active = await prisma.versioBaseDades.findFirst({
    where: { esActual: true },
    orderBy: { createdAt: "desc" },
    select: { id: true, numero: true },
  });

  if (!active) {
    throw new HttpError(400, "No hi ha versio activa");
  }

  return active;
}

async function fetchRows(category: EmissionsExportCategory, versioBaseDadesId: string) {
  if (category === "materials") {
    return await prisma.factorEmissioMaterial.findMany({ where: { versioBaseDadesId }, orderBy: { codiMaterial: "asc" } });
  }

  if (category === "transport") {
    return await prisma.factorEmissioTransport.findMany({ where: { versioBaseDadesId }, orderBy: { tipusVehicle: "asc" } });
  }

  if (category === "combustibles") {
    return await prisma.combustibleFabricacio.findMany({ where: { versioBaseDadesId }, orderBy: { nomCombustible: "asc" } });
  }

  if (category === "electric") {
    return await prisma.consumElectric.findMany({ where: { versioBaseDadesId }, orderBy: { tipusConsum: "asc" } });
  }

  if (category === "equips") {
    return await prisma.equipPosadaEnObra.findMany({ where: { versioBaseDadesId }, orderBy: { nomEquip: "asc" } });
  }

  if (category === "limits") {
    return await prisma.limitNormatiuEmissions.findMany({ where: { versioBaseDadesId }, orderBy: { tipologiaMescla: "asc" } });
  }

  return await prisma.constantCalorifica.findMany({ where: { versioBaseDadesId }, orderBy: { nomMaterial: "asc" } });
}

function rowsToCsv(rows: Record<string, unknown>[], metadata: Record<string, string>) {
  if (rows.length === 0) {
    return "";
  }

  const firstRow = rows[0];
  if (!firstRow) {
    return "";
  }
  const headers = Object.keys(firstRow);
  const comments = [
    `# export_date=${metadata["exportDate"]}`,
    `# version=${metadata["version"]}`,
    `# user=${metadata["user"]}`,
    "# note=Les fonts de dades consten a la columna fontDades",
  ];

  const csvRows = [headers.join(",")];
  rows.forEach((row) => {
    csvRows.push(headers.map((header) => escapeCsvValue(row[header])).join(","));
  });

  return [...comments, ...csvRows].join("\n");
}

function rowsToXlsx(rows: Record<string, unknown>[], metadata: Record<string, string>) {
  const workbook = XLSX.utils.book_new();
  const rowsSheet = XLSX.utils.json_to_sheet(rows);
  const metadataSheet = XLSX.utils.json_to_sheet([
    { key: "export_date", value: metadata["exportDate"] },
    { key: "version", value: metadata["version"] },
    { key: "user", value: metadata["user"] },
    { key: "note", value: "Les fonts de dades consten a la columna fontDades" },
  ]);

  XLSX.utils.book_append_sheet(workbook, rowsSheet, "factors");
  XLSX.utils.book_append_sheet(workbook, metadataSheet, "metadata");

  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}

export const emissionsExportService = {
  parseCategory(value: unknown) {
    return exportCategorySchema.parse(value);
  },

  parseFormat(value: unknown) {
    return exportFormatSchema.parse(value);
  },

  async export(options: unknown): Promise<ExportResult> {
    const data = exportOptionsSchema.parse(options);
    const version = await resolveVersionId(data.versio);

    const dbRows = await fetchRows(data.categoria, version.id);
    const rows = dbRows as Record<string, unknown>[];

    const metadata = {
      exportDate: new Date().toISOString(),
      version: version.numero,
      user: data.usuariEmail ?? "desconegut",
    };

    if (data.format === "csv") {
      const csv = rowsToCsv(rows, metadata);
      return {
        fileName: `emissions-${data.categoria}-${version.numero}-${getTodayStamp()}.csv`,
        mimeType: "text/csv; charset=utf-8",
        content: Buffer.from(csv, "utf-8"),
      };
    }

    const content = rowsToXlsx(rows, metadata);
    return {
      fileName: `emissions-${data.categoria}-${version.numero}-${getTodayStamp()}.xlsx`,
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      content: Buffer.from(content),
    };
  },
};
