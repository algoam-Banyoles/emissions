import {
  CategoriaMaterialEmissio,
  CombustibleTipus,
  EstatVersioBaseDades,
  Prisma,
  TipusCanviEmissio,
  UnitatMesura,
} from "@prisma/client";
import * as XLSX from "xlsx";
import { z } from "zod";

import { prisma } from "../config/database.js";
import { HttpError } from "../utils/http-error.js";

const importCategorySchema = z.enum(["materials", "transport", "combustibles", "equips"]);

export type EmissionsImportCategory = z.infer<typeof importCategorySchema>;

const recognizedSourceKeywords = ["DAP", "SEVE", "MITERD", "EULA", "EPA", "IECA", "ECOINVENT", "OC"];
const minAllowedYear = 2020;
const maxAllowedYear = 2030;

const materialRowSchema = z.object({
  codi_material: z.string().min(1),
  nom: z.string().min(2),
  categoria: z.nativeEnum(CategoriaMaterialEmissio),
  factor_emissio: z.coerce.number(),
  unitat: z.nativeEnum(UnitatMesura),
  font_dades: z.string().min(3),
  any_referencia: z.coerce.number().int(),
  versio_dap: z.string().optional(),
  incertesa_percentatge: z.coerce.number().min(0).max(100).optional(),
  es_credit: z.coerce.boolean().optional(),
});

const transportRowSchema = z.object({
  tipus_vehicle: z.string().min(2),
  capacitat_tonelades: z.coerce.number().positive(),
  factor_emissio: z.coerce.number().min(0),
  unitat: z.nativeEnum(UnitatMesura),
  font_dades: z.string().min(3),
  any_referencia: z.coerce.number().int(),
  combustible: z.nativeEnum(CombustibleTipus),
});

const combustibleRowSchema = z.object({
  nom_combustible: z.nativeEnum(CombustibleTipus),
  poder_calorific_inferior: z.coerce.number().positive(),
  unitat_poder_calorific: z.nativeEnum(UnitatMesura),
  factor_emissio: z.coerce.number().min(0),
  unitat_factor_emissio: z.nativeEnum(UnitatMesura),
  font_dades: z.string().min(3),
  any_referencia: z.coerce.number().int(),
});

const equipRowSchema = z.object({
  nom_equip: z.string().min(2),
  tipus: z.string().min(1),
  factor_emissio: z.coerce.number().min(0),
  rendiment_hores_per_tona: z.coerce.number().min(0),
  unitat: z.nativeEnum(UnitatMesura),
  font_dades: z.string().min(3),
});

const previewOptionsSchema = z.object({
  categoria: importCategorySchema,
  fileName: z.string().min(3),
  fileBuffer: z.instanceof(Buffer),
  delimiter: z.enum([";", ","]).optional(),
});

const importOptionsSchema = previewOptionsSchema.extend({
  confirm: z.literal(true),
  numeroVersio: z.string().min(3).max(64).optional(),
  descripcio: z.string().max(255).optional(),
  usuariId: z.string().min(1),
});

interface ImportValidationIssue {
  row: number;
  field?: string;
  message: string;
}

interface ImportValidationResult<T extends Record<string, unknown>> {
  validRows: T[];
  errors: ImportValidationIssue[];
  warnings: ImportValidationIssue[];
}

interface PreviewResult {
  categoria: EmissionsImportCategory;
  totalRows: number;
  previewRows: Record<string, unknown>[];
  errors: ImportValidationIssue[];
  warnings: ImportValidationIssue[];
  validRows: number;
}

interface ImportResult extends PreviewResult {
  importedRows: number;
  versio: {
    id: string;
    numero: string;
  };
}

function normalizeCellValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
}

function normalizeHeader(header: string): string {
  return header
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replaceAll(/[\u0300-\u036f]/g, "")
    .replaceAll(/[^a-z0-9]+/g, "_")
    .replaceAll(/^_+|_+$/g, "");
}

function parseSpreadsheetRows(options: {
  fileName: string;
  fileBuffer: Buffer;
  delimiter?: ";" | ",";
}): Record<string, string>[] {
  const extension = options.fileName.toLowerCase().split(".").pop() ?? "";
  const isExcel = extension === "xlsx" || extension === "xls";
  const isCsv = extension === "csv";

  if (!isExcel && !isCsv) {
    throw new HttpError(400, "Format no suportat. Usa CSV o XLSX");
  }

  const workbook = isExcel
    ? XLSX.read(options.fileBuffer, { type: "buffer", raw: true })
    : XLSX.read(options.fileBuffer.toString("utf-8"), {
        type: "string",
        raw: true,
        ...(options.delimiter ? { FS: options.delimiter } : {}),
      });

  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new HttpError(400, "No s'ha trobat cap full al fitxer");
  }

  const firstSheet = workbook.Sheets[firstSheetName];
  if (!firstSheet) {
    throw new HttpError(400, "No s'ha pogut llegir el full principal");
  }

  const matrix = XLSX.utils.sheet_to_json<unknown[]>(firstSheet, {
    header: 1,
    raw: false,
    blankrows: false,
    defval: "",
  });

  if (matrix.length < 2) {
    throw new HttpError(400, "El fitxer necessita capcalera i almenys una fila de dades");
  }

  const headers = (matrix[0] ?? []).map((value) => normalizeHeader(normalizeCellValue(value)));
  const duplicatedHeaders = headers.filter((header, index) => header && headers.indexOf(header) !== index);

  if (duplicatedHeaders.length > 0) {
    throw new HttpError(400, `Capcaleres duplicades: ${duplicatedHeaders.join(", ")}`);
  }

  return matrix.slice(1).map((row) => {
    const record: Record<string, string> = {};
    row.forEach((value, index) => {
      const key = headers[index];
      if (!key) {
        return;
      }

      record[key] = normalizeCellValue(value);
    });
    return record;
  });
}

function isRecognizedSource(source: string): boolean {
  const uppercase = source.toUpperCase();
  return recognizedSourceKeywords.some((keyword) => uppercase.includes(keyword));
}

function validateCommonFields(
  row: Record<string, unknown>,
  rowNumber: number,
  yearField: string | null,
  issues: { errors: ImportValidationIssue[]; warnings: ImportValidationIssue[] },
) {
  const source = String(row["font_dades"] ?? "").trim();

  if (!source) {
    issues.errors.push({ row: rowNumber, field: "font_dades", message: "La font de dades es obligatoria" });
  } else if (!isRecognizedSource(source)) {
    issues.errors.push({
      row: rowNumber,
      field: "font_dades",
      message: "La font de dades no es reconeguda (DAP, SEVE, MITERD, EULA, EPA, IECA, Ecoinvent, OC)",
    });
  }

  if (yearField) {
    const year = Number(row[yearField]);
    if (!Number.isFinite(year)) {
      issues.errors.push({ row: rowNumber, field: yearField, message: "Any de referencia invalid" });
    } else if (year < minAllowedYear || year > maxAllowedYear) {
      issues.errors.push({
        row: rowNumber,
        field: yearField,
        message: `L'any de referencia ha d'estar entre ${minAllowedYear} i ${maxAllowedYear}`,
      });
    }
  }
}

function validateMaterials(rows: Record<string, string>[]): ImportValidationResult<z.infer<typeof materialRowSchema>> {
  const errors: ImportValidationIssue[] = [];
  const warnings: ImportValidationIssue[] = [];
  const validRows: z.infer<typeof materialRowSchema>[] = [];
  const seenKeys = new Set<string>();

  rows.forEach((rawRow, index) => {
    const rowNumber = index + 2;
    const normalizedRow = {
      ...rawRow,
      categoria: rawRow["categoria"]?.toUpperCase(),
      unitat: rawRow["unitat"]?.toUpperCase(),
      factor_emissio: rawRow["factor_emissio"],
      any_referencia: rawRow["any_referencia"],
      incertesa_percentatge: rawRow["incertesa_percentatge"],
      es_credit: rawRow["es_credit"] ? ["1", "true", "si", "yes"].includes(rawRow["es_credit"].toLowerCase()) : false,
    };

    const parsed = materialRowSchema.safeParse(normalizedRow);
    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        errors.push({ row: rowNumber, field: issue.path.join("."), message: issue.message });
      });
      return;
    }

    const row = parsed.data;
    validateCommonFields(row, rowNumber, "any_referencia", { errors, warnings });

    const duplicateKey = `${row.codi_material}::${row.nom}`;
    if (seenKeys.has(duplicateKey)) {
      errors.push({ row: rowNumber, field: "codi_material", message: "Registre duplicat dins del fitxer" });
      return;
    }
    seenKeys.add(duplicateKey);

    if (row.factor_emissio < 0) {
      const allowsCredit =
        row.es_credit || row.codi_material.toLowerCase().startsWith("16") || row.nom.toLowerCase().includes("rarx");
      if (!allowsCredit) {
        errors.push({ row: rowNumber, field: "factor_emissio", message: "Valors negatius nomes permesos per credits RARx" });
      } else {
        warnings.push({ row: rowNumber, field: "factor_emissio", message: "Factor negatiu detectat i marcat com a credit" });
      }
    }

    if (!new Set<string>([UnitatMesura.T, UnitatMesura.KG, UnitatMesura.M3]).has(row.unitat)) {
      errors.push({ row: rowNumber, field: "unitat", message: "Unitat no valida per materials (T, KG, M3)" });
    }

    validRows.push(row);
  });

  return { validRows, errors, warnings };
}

function validateTransport(rows: Record<string, string>[]): ImportValidationResult<z.infer<typeof transportRowSchema>> {
  const errors: ImportValidationIssue[] = [];
  const warnings: ImportValidationIssue[] = [];
  const validRows: z.infer<typeof transportRowSchema>[] = [];
  const seenKeys = new Set<string>();

  rows.forEach((rawRow, index) => {
    const rowNumber = index + 2;
    const normalizedRow = {
      ...rawRow,
      combustible: rawRow["combustible"]?.toUpperCase(),
      unitat: rawRow["unitat"]?.toUpperCase() ?? UnitatMesura.T_KM,
      factor_emissio: rawRow["factor_emissio"],
      capacitat_tonelades: rawRow["capacitat_tonelades"],
      any_referencia: rawRow["any_referencia"],
    };

    const parsed = transportRowSchema.safeParse(normalizedRow);
    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        errors.push({ row: rowNumber, field: issue.path.join("."), message: issue.message });
      });
      return;
    }

    const row = parsed.data;
    validateCommonFields(row, rowNumber, "any_referencia", { errors, warnings });

    const duplicateKey = `${row.tipus_vehicle}::${row.combustible}`;
    if (seenKeys.has(duplicateKey)) {
      errors.push({ row: rowNumber, field: "tipus_vehicle", message: "Registre duplicat dins del fitxer" });
      return;
    }
    seenKeys.add(duplicateKey);

    if (row.unitat !== UnitatMesura.T_KM) {
      errors.push({ row: rowNumber, field: "unitat", message: "Unitat no valida per transport (T_KM)" });
    }

    validRows.push(row);
  });

  return { validRows, errors, warnings };
}

function validateCombustibles(rows: Record<string, string>[]): ImportValidationResult<z.infer<typeof combustibleRowSchema>> {
  const errors: ImportValidationIssue[] = [];
  const warnings: ImportValidationIssue[] = [];
  const validRows: z.infer<typeof combustibleRowSchema>[] = [];
  const seenKeys = new Set<string>();

  rows.forEach((rawRow, index) => {
    const rowNumber = index + 2;
    const normalizedRow = {
      ...rawRow,
      nom_combustible: rawRow["nom_combustible"]?.toUpperCase(),
      unitat_poder_calorific: rawRow["unitat_poder_calorific"]?.toUpperCase(),
      unitat_factor_emissio: rawRow["unitat_factor_emissio"]?.toUpperCase(),
      factor_emissio: rawRow["factor_emissio"],
      poder_calorific_inferior: rawRow["poder_calorific_inferior"],
      any_referencia: rawRow["any_referencia"],
    };

    const parsed = combustibleRowSchema.safeParse(normalizedRow);
    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        errors.push({ row: rowNumber, field: issue.path.join("."), message: issue.message });
      });
      return;
    }

    const row = parsed.data;
    validateCommonFields(row, rowNumber, "any_referencia", { errors, warnings });

    if (seenKeys.has(row.nom_combustible)) {
      errors.push({ row: rowNumber, field: "nom_combustible", message: "Registre duplicat dins del fitxer" });
      return;
    }
    seenKeys.add(row.nom_combustible);

    if (!new Set<string>([UnitatMesura.MJ, UnitatMesura.GJ]).has(row.unitat_poder_calorific)) {
      errors.push({ row: rowNumber, field: "unitat_poder_calorific", message: "Unitat PCI no valida (MJ o GJ)" });
    }

    if (!new Set<string>([UnitatMesura.KG, UnitatMesura.GJ]).has(row.unitat_factor_emissio)) {
      errors.push({ row: rowNumber, field: "unitat_factor_emissio", message: "Unitat FE no valida (KG o GJ)" });
    }

    validRows.push(row);
  });

  return { validRows, errors, warnings };
}

function validateEquips(rows: Record<string, string>[]): ImportValidationResult<z.infer<typeof equipRowSchema>> {
  const errors: ImportValidationIssue[] = [];
  const warnings: ImportValidationIssue[] = [];
  const validRows: z.infer<typeof equipRowSchema>[] = [];
  const seenKeys = new Set<string>();

  rows.forEach((rawRow, index) => {
    const rowNumber = index + 2;
    const normalizedRow = {
      ...rawRow,
      unitat: rawRow["unitat"]?.toUpperCase() ?? UnitatMesura.H,
      factor_emissio: rawRow["factor_emissio"],
      rendiment_hores_per_tona: rawRow["rendiment_hores_per_tona"],
    };

    const parsed = equipRowSchema.safeParse(normalizedRow);
    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        errors.push({ row: rowNumber, field: issue.path.join("."), message: issue.message });
      });
      return;
    }

    const row = parsed.data;
    validateCommonFields(row, rowNumber, null, { errors, warnings });

    const duplicateKey = `${row.nom_equip}::${row.tipus}`;
    if (seenKeys.has(duplicateKey)) {
      errors.push({ row: rowNumber, field: "nom_equip", message: "Registre duplicat dins del fitxer" });
      return;
    }
    seenKeys.add(duplicateKey);

    if (row.unitat !== UnitatMesura.H) {
      errors.push({ row: rowNumber, field: "unitat", message: "Unitat no valida per equips (H)" });
    }

    validRows.push(row);
  });

  return { validRows, errors, warnings };
}

function validateByCategory(category: EmissionsImportCategory, rows: Record<string, string>[]) {
  if (category === "materials") {
    return validateMaterials(rows);
  }
  if (category === "transport") {
    return validateTransport(rows);
  }
  if (category === "combustibles") {
    return validateCombustibles(rows);
  }
  return validateEquips(rows);
}

async function createNewVersion(options: {
  tx: Prisma.TransactionClient;
  usuariId: string;
  numeroVersio?: string;
  descripcio?: string;
}) {
  const now = new Date();

  await options.tx.versioBaseDades.updateMany({ where: { esActual: true }, data: { esActual: false } });

  const numeroVersio = options.numeroVersio ?? `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, "0")}.${String(now.getDate()).padStart(2, "0")}.${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;

  return await options.tx.versioBaseDades.create({
    data: {
      numero: numeroVersio,
      descripcio: options.descripcio ?? `Importacio ${now.toISOString()}`,
      estat: EstatVersioBaseDades.PUBLICADA,
      dataPublicacio: now,
      esActual: true,
      createdById: options.usuariId,
    },
    select: { id: true, numero: true },
  });
}

async function ensureNoDatabaseDuplicates(category: EmissionsImportCategory, versionId: string, rows: Record<string, unknown>[]) {
  if (category === "materials") {
    const codes = rows.map((row) => String(row["codi_material"]));
    const count = await prisma.factorEmissioMaterial.count({
      where: { versioBaseDadesId: versionId, codiMaterial: { in: codes } },
    });
    if (count > 0) {
      throw new HttpError(409, "Hi ha codis de material duplicats per aquesta versio");
    }
  }

  if (category === "transport") {
    const vehicles = rows.map((row) => String(row["tipus_vehicle"]));
    const count = await prisma.factorEmissioTransport.count({
      where: { versioBaseDadesId: versionId, tipusVehicle: { in: vehicles } },
    });
    if (count > 0) {
      throw new HttpError(409, "Hi ha tipus de vehicle duplicats per aquesta versio");
    }
  }

  if (category === "combustibles") {
    const combustibles = rows.map((row) => String(row["nom_combustible"]).toUpperCase() as CombustibleTipus);
    const count = await prisma.combustibleFabricacio.count({
      where: { versioBaseDadesId: versionId, nomCombustible: { in: combustibles } },
    });
    if (count > 0) {
      throw new HttpError(409, "Hi ha combustibles duplicats per aquesta versio");
    }
  }
}

async function persistImport(options: {
  tx: Prisma.TransactionClient;
  category: EmissionsImportCategory;
  rows: Record<string, unknown>[];
  versionId: string;
  userId: string;
}) {
  const { tx, category, rows, versionId, userId } = options;

  if (category === "materials") {
    const created = await tx.factorEmissioMaterial.createMany({
      data: rows.map((row) => ({
        codiMaterial: String(row["codi_material"]),
        nom: String(row["nom"]),
        categoria: row["categoria"] as CategoriaMaterialEmissio,
        factorEmissio: Number(row["factor_emissio"]),
        unitat: row["unitat"] as UnitatMesura,
        fontDades: String(row["font_dades"]),
        anyReferencia: Number(row["any_referencia"]),
        versioDap: row["versio_dap"] ? String(row["versio_dap"]) : null,
        incertesaPercentatge: row["incertesa_percentatge"] !== undefined ? Number(row["incertesa_percentatge"]) : null,
        esCredit: Boolean(row["es_credit"]),
        versioBaseDadesId: versionId,
      })),
    });

    await tx.emissionsChangeLog.create({
      data: {
        versioBaseDadesId: versionId,
        usuariId: userId,
        tipusCanvi: TipusCanviEmissio.IMPORTAT,
        entitat: "materials_import",
        registreId: versionId,
        valorsNous: { importedRows: created.count } as Prisma.InputJsonValue,
      },
    });
    return created.count;
  }

  if (category === "transport") {
    const created = await tx.factorEmissioTransport.createMany({
      data: rows.map((row) => ({
        tipusVehicle: String(row["tipus_vehicle"]),
        capacitatTonelades: Number(row["capacitat_tonelades"]),
        factorEmissio: Number(row["factor_emissio"]),
        unitat: row["unitat"] as UnitatMesura,
        fontDades: String(row["font_dades"]),
        anyReferencia: Number(row["any_referencia"]),
        combustible: row["combustible"] as CombustibleTipus,
        versioBaseDadesId: versionId,
      })),
    });

    await tx.emissionsChangeLog.create({
      data: {
        versioBaseDadesId: versionId,
        usuariId: userId,
        tipusCanvi: TipusCanviEmissio.IMPORTAT,
        entitat: "transport_import",
        registreId: versionId,
        valorsNous: { importedRows: created.count } as Prisma.InputJsonValue,
      },
    });
    return created.count;
  }

  if (category === "combustibles") {
    const created = await tx.combustibleFabricacio.createMany({
      data: rows.map((row) => ({
        nomCombustible: row["nom_combustible"] as CombustibleTipus,
        poderCalorificInferior: Number(row["poder_calorific_inferior"]),
        unitatPoderCalorific: row["unitat_poder_calorific"] as UnitatMesura,
        factorEmissio: Number(row["factor_emissio"]),
        unitatFactorEmissio: row["unitat_factor_emissio"] as UnitatMesura,
        fontDades: String(row["font_dades"]),
        anyReferencia: Number(row["any_referencia"]),
        versioBaseDadesId: versionId,
      })),
    });

    await tx.emissionsChangeLog.create({
      data: {
        versioBaseDadesId: versionId,
        usuariId: userId,
        tipusCanvi: TipusCanviEmissio.IMPORTAT,
        entitat: "combustibles_import",
        registreId: versionId,
        valorsNous: { importedRows: created.count } as Prisma.InputJsonValue,
      },
    });
    return created.count;
  }

  const created = await tx.equipPosadaEnObra.createMany({
    data: rows.map((row) => ({
      nomEquip: String(row["nom_equip"]),
      tipus: String(row["tipus"]),
      factorEmissio: Number(row["factor_emissio"]),
      rendimentHoresPerTona: Number(row["rendiment_hores_per_tona"]),
      unitat: row["unitat"] as UnitatMesura,
      fontDades: String(row["font_dades"]),
      versioBaseDadesId: versionId,
    })),
  });

  await tx.emissionsChangeLog.create({
    data: {
      versioBaseDadesId: versionId,
      usuariId: userId,
      tipusCanvi: TipusCanviEmissio.IMPORTAT,
      entitat: "equips_import",
      registreId: versionId,
      valorsNous: { importedRows: created.count } as Prisma.InputJsonValue,
    },
  });
  return created.count;
}

export const emissionsImportService = {
  parseCategory(value: unknown) {
    return importCategorySchema.parse(value);
  },

  async preview(options: unknown): Promise<PreviewResult> {
    const data = previewOptionsSchema.parse(options);
    const parsedRows = parseSpreadsheetRows({
      fileName: data.fileName,
      fileBuffer: data.fileBuffer,
      ...(data.delimiter ? { delimiter: data.delimiter } : {}),
    });

    const result = validateByCategory(data.categoria, parsedRows);

    return {
      categoria: data.categoria,
      totalRows: parsedRows.length,
      previewRows: parsedRows.slice(0, 10),
      errors: result.errors,
      warnings: result.warnings,
      validRows: result.validRows.length,
    };
  },

  async import(options: unknown): Promise<ImportResult> {
    const data = importOptionsSchema.parse(options);

    const preview = await this.preview({
      categoria: data.categoria,
      fileName: data.fileName,
      fileBuffer: data.fileBuffer,
      ...(data.delimiter ? { delimiter: data.delimiter } : {}),
    });

    if (preview.errors.length > 0) {
      throw new HttpError(400, "La importacio te errors. Revisa la previsualitzacio abans de confirmar");
    }

    const parsedRows = parseSpreadsheetRows({
      fileName: data.fileName,
      fileBuffer: data.fileBuffer,
      ...(data.delimiter ? { delimiter: data.delimiter } : {}),
    });
    const validated = validateByCategory(data.categoria, parsedRows);

    if (validated.errors.length > 0) {
      throw new HttpError(400, "No s'ha pogut importar per errors de validacio");
    }

    const version = await prisma.$transaction(async (tx) => {
      const createdVersion = await createNewVersion({
        tx,
        usuariId: data.usuariId,
        ...(data.numeroVersio ? { numeroVersio: data.numeroVersio } : {}),
        ...(data.descripcio ? { descripcio: data.descripcio } : {}),
      });

      await ensureNoDatabaseDuplicates(data.categoria, createdVersion.id, validated.validRows);

      await persistImport({
        tx,
        category: data.categoria,
        rows: validated.validRows,
        versionId: createdVersion.id,
        userId: data.usuariId,
      });

      return createdVersion;
    });

    return {
      ...preview,
      importedRows: validated.validRows.length,
      versio: {
        id: version.id,
        numero: version.numero,
      },
    };
  },
};
