import crypto from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

import PDFDocument from "pdfkit";
import { z } from "zod";

import { traduccioService, type Idioma } from "./traduccio.service.js";
import { HttpError } from "../utils/http-error.js";

const certificatInputSchema = z.object({
  projecteNom: z.string().min(1),
  obraNom: z.string().min(1),
  fabricantNom: z.string().min(1),
  mesclaNom: z.string().min(1),
  tipologiaMescla: z.string().min(1),
  versioMetodologia: z.string().default("OC 3/2024"),
  quantitatTones: z.number().positive().default(1),
  emissions: z.object({
    A1: z.number(),
    A2: z.number(),
    A3: z.number(),
    A4: z.number(),
    A5: z.number(),
    total: z.number(),
    limit: z.number().positive().default(70),
    unitat: z.string().default("kg CO2e/t"),
  }),
  annexText: z.string().default("Annex de calcul complet seguint la metodologia oficial."),
  signaturaDigital: z.boolean().optional(),
  idioma: z.enum(["ca", "es", "en", "fr"]).default("ca"),
});

export type CertificatInput = z.infer<typeof certificatInputSchema>;

interface Identity {
  organitzacioId: string;
  userId: string;
  email: string;
}

export interface CertificatRecord {
  id: string;
  codi: string;
  organitzacioId: string;
  projecteNom: string;
  obraNom: string;
  fabricantNom: string;
  mesclaNom: string;
  tipologiaMescla: string;
  estat: "VALID" | "CADUCAT" | "REVOCAT";
  dataEmissio: string;
  dataCaducitat: string;
  versioMetodologia: string;
  quantitatTones: number;
  emissions: CertificatInput["emissions"];
  annexText: string;
  signaturaDigital: boolean;
  idioma: "ca" | "es" | "en" | "fr";
  pdfPath: string;
  pdfUrl: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface GeneratedCertificat {
  codi: string;
  input: CertificatInput;
  pdfBuffer: Buffer;
}

interface CertificatsIndexFile {
  items: CertificatRecord[];
}

function toLocale(language: CertificatInput["idioma"]) {
  switch (language) {
    case "es":
      return "es-ES";
    case "en":
      return "en-US";
    case "fr":
      return "fr-FR";
    case "ca":
    default:
      return "ca-ES";
  }
}

function round(value: number, decimals = 4) {
  return Number(value.toFixed(decimals));
}

function todayIso() {
  return new Date().toISOString();
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function inferEstat(record: CertificatRecord): CertificatRecord["estat"] {
  if (record.estat === "REVOCAT") {
    return "REVOCAT";
  }
  if (new Date(record.dataCaducitat).getTime() < Date.now()) {
    return "CADUCAT";
  }
  return "VALID";
}

function getStorageBaseDir() {
  return process.env["CERTIFICATS_STORAGE_DIR"] ?? path.join(process.cwd(), "storage", "certificats");
}

function getIndexPath() {
  return path.join(getStorageBaseDir(), "index.json");
}

async function ensureStorage() {
  await fs.mkdir(getStorageBaseDir(), { recursive: true });
  const indexPath = getIndexPath();
  try {
    await fs.access(indexPath);
  } catch {
    const empty: CertificatsIndexFile = { items: [] };
    await fs.writeFile(indexPath, JSON.stringify(empty, null, 2), "utf8");
  }
}

async function readIndex(): Promise<CertificatsIndexFile> {
  await ensureStorage();
  const raw = await fs.readFile(getIndexPath(), "utf8");
  const parsed = JSON.parse(raw) as Partial<CertificatsIndexFile>;
  const items: CertificatRecord[] = (parsed.items ?? []).map((item: Partial<CertificatRecord>) => ({
    id: item.id ?? "",
    codi: item.codi ?? "",
    organitzacioId: item.organitzacioId ?? "",
    projecteNom: item.projecteNom ?? "",
    obraNom: item.obraNom ?? "",
    fabricantNom: item.fabricantNom ?? "",
    mesclaNom: item.mesclaNom ?? "",
    tipologiaMescla: item.tipologiaMescla ?? "",
    estat: item.estat ?? "VALID",
    dataEmissio: item.dataEmissio ?? todayIso(),
    dataCaducitat: item.dataCaducitat ?? todayIso(),
    versioMetodologia: item.versioMetodologia ?? "OC 3/2024",
    quantitatTones: item.quantitatTones ?? 0,
    emissions: item.emissions ?? {
      A1: 0,
      A2: 0,
      A3: 0,
      A4: 0,
      A5: 0,
      total: 0,
      limit: 70,
      unitat: "kg CO2e/t",
    },
    annexText: item.annexText ?? "Annex de calcul complet seguint la metodologia oficial.",
    signaturaDigital: item.signaturaDigital ?? false,
    idioma: item.idioma ?? "ca",
    pdfPath: item.pdfPath ?? "",
    pdfUrl: item.pdfUrl ?? "",
    createdBy: item.createdBy ?? "",
    createdAt: item.createdAt ?? todayIso(),
    updatedAt: item.updatedAt ?? todayIso(),
  }));
  return { items };
}

async function writeIndex(index: CertificatsIndexFile) {
  await ensureStorage();
  await fs.writeFile(getIndexPath(), JSON.stringify(index, null, 2), "utf8");
}

function drawContributionBars(doc: PDFKit.PDFDocument, emissions: CertificatInput["emissions"]) {
  const baseX = 70;
  let y = doc.y + 8;
  const barW = 260;
  const rows: { label: string; value: number }[] = [
    { label: "A1", value: emissions.A1 },
    { label: "A2", value: emissions.A2 },
    { label: "A3", value: emissions.A3 },
    { label: "A4", value: emissions.A4 },
    { label: "A5", value: emissions.A5 },
  ];

  for (const row of rows) {
    const pct = emissions.total > 0 ? Math.max(0, row.value / emissions.total) : 0;
    doc.font("Helvetica").fontSize(10).fillColor("#1e3a5f").text(row.label, baseX, y);
    doc.rect(baseX + 28, y + 3, barW, 10).stroke("#cbd5e1");
    doc.rect(baseX + 28, y + 3, barW * pct, 10).fill("#2d8a4e");
    doc.fillColor("#334155").fontSize(9).text(`${round(row.value, 3)} (${round(pct * 100, 1)}%)`, baseX + 300, y);
    y += 20;
  }
  doc.moveDown(2);
}

function drawFooterPages(
  doc: PDFKit.PDFDocument,
  codi: string,
  language: CertificatInput["idioma"],
  tx: ReturnType<typeof traduccioService.traduirCertificat>["plantilla"],
) {
  const range = doc.bufferedPageRange();
  for (let index = 0; index < range.count; index += 1) {
    doc.switchToPage(index);
    doc.font("Helvetica").fontSize(8).fillColor("#64748b");
    doc.text(`${tx.footerCertificate} ${codi} · ${tx.footerPage} ${index + 1}/${range.count}`, 50, doc.page.height - 40, {
      align: "center",
      width: doc.page.width - 100,
    });
    doc.text(`${tx.footerIssueDate}: ${new Date().toLocaleDateString(toLocale(language))}`, 50, doc.page.height - 28, {
      align: "center",
      width: doc.page.width - 100,
    });
  }
}

async function buildPdfBuffer(input: CertificatInput, codi: string): Promise<Buffer> {
  const translated = traduccioService.traduirCertificat(input, input.idioma);
  const tx = translated.plantilla;
  const annexText = translated.dades.annexText ?? input.annexText;
  return await new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    const doc = new PDFDocument({ margin: 50, size: "A4", bufferPages: true });

    doc.on("data", (chunk: Uint8Array) => {
      chunks.push(Buffer.from(chunk));
    });
    doc.on("end", () => {
      resolve(Buffer.concat(chunks));
    });
    doc.on("error", reject);

    doc.rect(0, 0, doc.page.width, 90).fill("#1e3a5f");
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(20).text(tx.title, 50, 28);
    doc.font("Helvetica").fontSize(11).text(tx.subtitle, 50, 58);

    doc.moveDown(4);
    doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(14).text(tx.cover);
    doc.moveDown(0.6);
    doc.font("Helvetica").fontSize(11);
    doc.text(`${tx.code}: ${codi}`);
    doc.text(`${tx.manufacturer}: ${input.fabricantNom}`);
    doc.text(`${tx.project}: ${input.projecteNom}`);
    doc.text(`${tx.work}: ${input.obraNom}`);
    doc.text(`${tx.mix}: ${input.mesclaNom} (${input.tipologiaMescla})`);
    doc.text(`${tx.certifiedQuantity}: ${input.quantitatTones} t`);
    doc.text(`${tx.methodologyVersion}: ${input.versioMetodologia}`);
    if (input.signaturaDigital) {
      doc.fillColor("#2d8a4e").text(tx.digitalSignature);
      doc.fillColor("#0f172a");
    }

    doc.addPage();
    doc.font("Helvetica-Bold").fontSize(14).fillColor("#1e3a5f").text(tx.executiveSummary);
    doc.moveDown(0.5);
    doc.font("Helvetica").fontSize(11).fillColor("#0f172a");
    doc.text(`${tx.totalEmissions}: ${round(input.emissions.total, 4)} ${input.emissions.unitat}`);
    doc.text(`${tx.applicableLimit}: ${round(input.emissions.limit, 4)} ${input.emissions.unitat}`);
    const compleix = input.emissions.total <= input.emissions.limit;
    doc.fillColor(compleix ? "#2d8a4e" : "#b91c1c").text(compleix ? tx.compliant : tx.nonCompliant);
    doc.fillColor("#0f172a").moveDown();

    doc.font("Helvetica-Bold").text(tx.breakdown);
    doc.moveDown(0.4);
    const rows: { etapa: string; value: number }[] = [
      { etapa: "A1", value: input.emissions.A1 },
      { etapa: "A2", value: input.emissions.A2 },
      { etapa: "A3", value: input.emissions.A3 },
      { etapa: "A4", value: input.emissions.A4 },
      { etapa: "A5", value: input.emissions.A5 },
    ];
    for (const row of rows) {
      doc.font("Helvetica").text(`${row.etapa}: ${round(row.value, 4)} ${input.emissions.unitat}`);
    }

    doc.moveDown();
    doc.font("Helvetica-Bold").text(tx.chartTitle);
    drawContributionBars(doc, input.emissions);

    doc.addPage();
    doc.font("Helvetica-Bold").fontSize(14).fillColor("#1e3a5f").text(tx.methodology);
    doc.moveDown(0.5);
    doc.font("Helvetica").fontSize(11).fillColor("#0f172a");
    doc.text(tx.methodologyText1);
    doc.text(tx.methodologyText2);
    doc.moveDown();
    doc.font("Helvetica-Bold").text(tx.summaryTable);
    doc.moveDown(0.4);
    doc.font("Helvetica");
    doc.text(`A1: ${round(input.emissions.A1, 4)} ${input.emissions.unitat}`);
    doc.text(`A2: ${round(input.emissions.A2, 4)} ${input.emissions.unitat}`);
    doc.text(`A3: ${round(input.emissions.A3, 4)} ${input.emissions.unitat}`);
    doc.text(`A4: ${round(input.emissions.A4, 4)} ${input.emissions.unitat}`);
    doc.text(`A5: ${round(input.emissions.A5, 4)} ${input.emissions.unitat}`);
    doc.text(`TOTAL: ${round(input.emissions.total, 4)} ${input.emissions.unitat}`);

    doc.addPage();
    doc.font("Helvetica-Bold").fontSize(14).fillColor("#1e3a5f").text(tx.annex);
    doc.moveDown(0.6);
    doc.font("Helvetica").fontSize(10).fillColor("#0f172a");
    doc.text(annexText, { align: "justify" });
    doc.moveDown();
    doc.text(tx.keyFormulas);
    doc.text("E_total = E_A1 + E_A2 + E_A3 + E_A4 + E_A5");
    doc.text("E_A1 = Σ (m_i × FE_i)");
    doc.text("E_A2 = Σ (m_i × d_i × FE_transport)");
    doc.text("E_A3 = E_combustible + E_electric + E_caldera + E_pala");
    doc.text("E_A4 = m_mb × d × FE_transport");
    doc.text("E_A5 = Σ (hores_equip_i × FE_equip_i)");

    drawFooterPages(doc, codi, input.idioma, tx);
    doc.end();
  });
}

export const certificatsService = {
  parseInput(input: unknown): CertificatInput {
    return certificatInputSchema.parse(input);
  },

  async generarCertificat(dadesCertificat: unknown): Promise<GeneratedCertificat> {
    const parsed = this.parseInput(dadesCertificat);
    const codi = `CERT-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const pdfBuffer = await buildPdfBuffer(parsed, codi);
    return {
      codi,
      input: parsed,
      pdfBuffer,
    };
  },

  async guardarCertificat(certificat: GeneratedCertificat, identity: Identity): Promise<CertificatRecord> {
    await ensureStorage();
    const now = new Date();
    const expiry = addDays(now, 365);
    const id = crypto.randomUUID();
    const fileName = `${id}.pdf`;
    const filePath = path.join(getStorageBaseDir(), fileName);

    await fs.writeFile(filePath, certificat.pdfBuffer);

    const record: CertificatRecord = {
      id,
      codi: certificat.codi,
      organitzacioId: identity.organitzacioId,
      projecteNom: certificat.input.projecteNom,
      obraNom: certificat.input.obraNom,
      fabricantNom: certificat.input.fabricantNom,
      mesclaNom: certificat.input.mesclaNom,
      tipologiaMescla: certificat.input.tipologiaMescla,
      estat: "VALID",
      dataEmissio: now.toISOString(),
      dataCaducitat: expiry.toISOString(),
      versioMetodologia: certificat.input.versioMetodologia,
      quantitatTones: certificat.input.quantitatTones,
      emissions: certificat.input.emissions,
      annexText: certificat.input.annexText,
      signaturaDigital: certificat.input.signaturaDigital ?? false,
      idioma: certificat.input.idioma,
      pdfPath: filePath,
      pdfUrl: `/api/certificats/${id}/pdf`,
      createdBy: identity.userId,
      createdAt: todayIso(),
      updatedAt: todayIso(),
    };

    const index = await readIndex();
    index.items.push(record);
    await writeIndex(index);
    return record;
  },

  async llistarCertificats(identity: Identity): Promise<CertificatRecord[]> {
    const index = await readIndex();
    return index.items
      .filter((item) => item.organitzacioId === identity.organitzacioId)
      .map((item) => ({ ...item, estat: inferEstat(item) }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async obtenirCertificat(id: string, identity: Identity): Promise<CertificatRecord> {
    const index = await readIndex();
    const found = index.items.find((item) => item.id === id && item.organitzacioId === identity.organitzacioId);
    if (!found) {
      throw new HttpError(404, "Certificat no trobat");
    }
    return { ...found, estat: inferEstat(found) };
  },

  async obtenirPdfBuffer(id: string, identity: Identity): Promise<{ record: CertificatRecord; buffer: Buffer }> {
    const record = await this.obtenirCertificat(id, identity);
    const buffer = await fs.readFile(record.pdfPath);
    return { record, buffer };
  },

  async obtenirPdfBufferIdioma(
    id: string,
    identity: Identity,
    idioma: Idioma,
  ): Promise<{ record: CertificatRecord; buffer: Buffer }> {
    const record = await this.obtenirCertificat(id, identity);
    const input: CertificatInput = {
      projecteNom: record.projecteNom,
      obraNom: record.obraNom,
      fabricantNom: record.fabricantNom,
      mesclaNom: record.mesclaNom,
      tipologiaMescla: record.tipologiaMescla,
      versioMetodologia: record.versioMetodologia,
      quantitatTones: record.quantitatTones,
      emissions: record.emissions,
      annexText: record.annexText,
      signaturaDigital: record.signaturaDigital,
      idioma,
    };
    const buffer = await buildPdfBuffer(input, record.codi);
    return { record, buffer };
  },

  async revocarCertificat(id: string, identity: Identity): Promise<CertificatRecord> {
    const index = await readIndex();
    const pos = index.items.findIndex((item) => item.id === id && item.organitzacioId === identity.organitzacioId);
    if (pos < 0) {
      throw new HttpError(404, "Certificat no trobat");
    }

    const current = index.items[pos];
    if (!current) {
      throw new HttpError(404, "Certificat no trobat");
    }

    const updated: CertificatRecord = {
      ...current,
      estat: "REVOCAT",
      updatedAt: todayIso(),
    };
    index.items[pos] = updated;
    await writeIndex(index);
    return updated;
  },
};
