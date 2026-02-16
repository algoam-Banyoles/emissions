import crypto from "node:crypto";

import { CombustibleTipus, Prisma, RolUsuari, TipusCanviEmissio, UnitatMesura } from "@prisma/client";
import nodemailer from "nodemailer";

import { prisma } from "../config/database.js";
import { env } from "../config/env.js";

export type ValidationSeverity = "error" | "warning" | "info";
export type ValidationTrigger = "manual" | "import" | "cron";

export interface ValidationIssue {
  id: string;
  rule: string;
  severity: ValidationSeverity;
  message: string;
  entityType?: string;
  entityId?: string;
  suggestion?: string;
  fixPath?: string;
}

export interface ValidationSummary {
  totalIssues: number;
  errors: number;
  warnings: number;
  info: number;
  healthScore: number;
  coveragePercentage: number;
  missingMaterials: string[];
}

export interface ValidationRunResult {
  runId: string;
  trigger: ValidationTrigger;
  version: { id: string; numero: string };
  executedAt: string;
  summary: ValidationSummary;
  issues: ValidationIssue[];
  alertEmailSent: boolean;
}

const recognizedSourceKeywords = ["DAP", "SEVE", "MITERD", "EULA", "EPA", "IECA", "ECOINVENT", "OC"];
const expectedMaterialCodes = [
  "10a",
  "10b",
  "11a",
  "11b",
  "12a",
  "12b",
  "12c",
  "13",
  "14a",
  "14b",
  "14c",
  "14d",
  "14e",
  "14f",
  "14g",
  "14h",
  "15",
  "16a",
  "16b",
  "16c",
  "17",
  "18",
  "19a",
  "19b",
  "19c",
  "19d",
];
const expectedTransportVehicles = [
  "camion_semirremolque_40t_bascualnte",
  "camion_rigido_18t",
  "camion_cisterna_40t",
];
const expectedEquips = [
  "silo_transferencia",
  "extendedora",
  "compactador_tandem_11t",
  "compactador_tandem_15t",
  "compactador_neumaticos_35t",
  "minibarredora",
  "fresadora_2_2m",
  "fresadora_1m",
  "fresadora_0_35m",
  "recicladora",
  "camion_bascualnte_40t",
  "camion_3ejes_14t",
  "camion_cisterna_obra",
  "compactador_neumaticos_21t",
];

function makeIssue(issue: Omit<ValidationIssue, "id">): ValidationIssue {
  return { id: crypto.randomUUID(), ...issue };
}

function sourceLooksValid(source: string) {
  const upper = source.toUpperCase();
  return recognizedSourceKeywords.some((keyword) => upper.includes(keyword));
}

function clamp(num: number, min: number, max: number) {
  return Math.min(max, Math.max(min, num));
}

async function sendAlertEmail(result: ValidationRunResult) {
  const recipientsFromEnv = env.ALERT_EMAIL_TO
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);

  const adminUsers = recipientsFromEnv.length
    ? []
    : await prisma.usuari.findMany({
        where: {
          actiu: true,
          rol: {
            in: [RolUsuari.ADMIN, RolUsuari.ADMIN_EMISSIONS],
          },
        },
        select: { email: true },
      });

  const recipients = recipientsFromEnv.length
    ? recipientsFromEnv
    : adminUsers.map((user) => user.email).filter(Boolean);

  if (recipients.length === 0) {
    return false;
  }

  if (!env.SMTP_HOST) {
    console.warn("[validation] ALERT_EMAIL_TO/administradors disponibles pero SMTP_HOST no configurat");
    return false;
  }

  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    ...(env.SMTP_USER && env.SMTP_PASS
      ? {
          auth: {
            user: env.SMTP_USER,
            pass: env.SMTP_PASS,
          },
        }
      : {}),
  });

  const topIssues = result.issues.slice(0, 20);
  const subject = `[Emissions] Alerta qualitat dades (${result.summary.errors} errors, ${result.summary.warnings} warnings)`;
  const text = [
    `Salut dades: ${result.summary.healthScore}%`,
    `Cobertura materials: ${result.summary.coveragePercentage.toFixed(2)}%`,
    `Problemes detectats: ${result.summary.totalIssues}`,
    "",
    "Llista resum:",
    ...topIssues.map((issue) => `- [${issue.severity}] ${issue.message}`),
    "",
    "Revisa /admin/emissions/validacio per al detall i correccions.",
  ].join("\n");

  await transporter.sendMail({
    from: env.SMTP_FROM,
    to: recipients.join(","),
    subject,
    text,
  });

  return true;
}

function extractStoredRun(log: { id: string; createdAt: Date; valorsNous: Prisma.JsonValue | null }) {
  const data = (log.valorsNous ?? null) as Record<string, unknown> | null;
  if (!data) {
    return null;
  }

  const summary = (data["summary"] ?? null) as ValidationSummary | null;
  const issues = (data["issues"] ?? []) as ValidationIssue[];
  const version = (data["version"] ?? null) as { id: string; numero: string } | null;
  const trigger = (data["trigger"] ?? "manual") as ValidationTrigger;

  if (!summary || !version) {
    return null;
  }

  return {
    runId: log.id,
    trigger,
    version,
    executedAt: log.createdAt.toISOString(),
    summary,
    issues,
    alertEmailSent: Boolean(data["alertEmailSent"]),
  } satisfies ValidationRunResult;
}

export const emissionsValidationService = {
  async executeValidation(options?: { trigger?: ValidationTrigger; initiatedBy?: string }) {
    const trigger = options?.trigger ?? "manual";
    const currentYear = new Date().getFullYear();
    const staleYear = currentYear - 3;

    const activeVersion = await prisma.versioBaseDades.findFirst({
      where: { esActual: true },
      orderBy: { createdAt: "desc" },
      select: { id: true, numero: true },
    });

    if (!activeVersion) {
      const emptyResult: ValidationRunResult = {
        runId: crypto.randomUUID(),
        trigger,
        version: { id: "none", numero: "none" },
        executedAt: new Date().toISOString(),
        summary: {
          totalIssues: 1,
          errors: 1,
          warnings: 0,
          info: 0,
          healthScore: 0,
          coveragePercentage: 0,
          missingMaterials: [],
        },
        issues: [
          makeIssue({
            rule: "version.active.exists",
            severity: "error",
            message: "No hi ha versio activa de base de dades",
            fixPath: "/admin/versions",
          }),
        ],
        alertEmailSent: false,
      };

      return emptyResult;
    }

    const [materials, transports, combustibles, equips, catalogMaterials] = await prisma.$transaction([
      prisma.factorEmissioMaterial.findMany({ where: { versioBaseDadesId: activeVersion.id, actiu: true } }),
      prisma.factorEmissioTransport.findMany({ where: { versioBaseDadesId: activeVersion.id, actiu: true } }),
      prisma.combustibleFabricacio.findMany({ where: { versioBaseDadesId: activeVersion.id, actiu: true } }),
      prisma.equipPosadaEnObra.findMany({ where: { versioBaseDadesId: activeVersion.id, actiu: true } }),
      prisma.material.findMany({ where: { actiu: true }, select: { id: true, codi: true, nom: true } }),
    ]);

    const issues: ValidationIssue[] = [];

    const materialCodes = new Set(materials.map((material) => material.codiMaterial.toLowerCase()));
    const transportTypes = new Set(transports.map((transport) => transport.tipusVehicle));
    const combustibleTypes = new Set(combustibles.map((combustible) => combustible.nomCombustible));
    const equipsNames = new Set(equips.map((equip) => equip.nomEquip));

    for (const code of expectedMaterialCodes) {
      if (!materialCodes.has(code)) {
        issues.push(
          makeIssue({
            rule: "completeness.material.a1",
            severity: "error",
            message: `Falta factor A1 per al material basic ${code}`,
            entityType: "FactorEmissioMaterial",
            entityId: code,
            fixPath: "/admin/emissions?tab=materials",
          }),
        );
      }
    }

    for (const vehicle of expectedTransportVehicles) {
      if (!transportTypes.has(vehicle)) {
        issues.push(
          makeIssue({
            rule: "completeness.transport.a2_a4",
            severity: "error",
            message: `Falta factor de transport per al vehicle ${vehicle}`,
            entityType: "FactorEmissioTransport",
            entityId: vehicle,
            fixPath: "/admin/emissions?tab=transport",
          }),
        );
      }
    }

    for (const combustible of [CombustibleTipus.GASOLEO, CombustibleTipus.FUELOLEO, CombustibleTipus.GAS_NATURAL]) {
      if (!combustibleTypes.has(combustible)) {
        issues.push(
          makeIssue({
            rule: "completeness.combustibles.a3",
            severity: "error",
            message: `Falta combustible basic ${combustible} amb PCI i FE`,
            entityType: "CombustibleFabricacio",
            entityId: combustible,
            fixPath: "/admin/emissions?tab=combustibles",
          }),
        );
      }
    }

    for (const equipName of expectedEquips) {
      if (!equipsNames.has(equipName)) {
        issues.push(
          makeIssue({
            rule: "completeness.equips.a5",
            severity: "warning",
            message: `Falta equip basic A5 ${equipName}`,
            entityType: "EquipPosadaEnObra",
            entityId: equipName,
            fixPath: "/admin/emissions?tab=equips",
          }),
        );
      }
    }

    for (const material of materials) {
      if (!material.esCredit && material.factorEmissio < 0) {
        issues.push(
          makeIssue({
            rule: "coherence.material.non_negative",
            severity: "error",
            message: `Material ${material.codiMaterial} te factor negatiu sense marcar com a credit`,
            entityType: "FactorEmissioMaterial",
            entityId: material.id,
            fixPath: "/admin/emissions?tab=materials",
          }),
        );
      }

      if (material.esCredit && material.factorEmissio >= 0) {
        issues.push(
          makeIssue({
            rule: "coherence.material.credit_negative",
            severity: "warning",
            message: `Material ${material.codiMaterial} marcat com a credit pero no te valor negatiu`,
            entityType: "FactorEmissioMaterial",
            entityId: material.id,
          }),
        );
      }

      if (material.factorEmissio < -1500 || material.factorEmissio > 1500) {
        issues.push(
          makeIssue({
            rule: "coherence.material.range",
            severity: "warning",
            message: `Material ${material.codiMaterial} amb factor fora de rang raonable`,
            entityType: "FactorEmissioMaterial",
            entityId: material.id,
          }),
        );
      }

      if (!new Set<string>([UnitatMesura.T, UnitatMesura.KG, UnitatMesura.M3]).has(material.unitat)) {
        issues.push(
          makeIssue({
            rule: "coherence.material.unit",
            severity: "error",
            message: `Material ${material.codiMaterial} amb unitat inconsistent ${material.unitat}`,
            entityType: "FactorEmissioMaterial",
            entityId: material.id,
          }),
        );
      }

      if (!sourceLooksValid(material.fontDades)) {
        issues.push(
          makeIssue({
            rule: "coherence.source.valid",
            severity: "error",
            message: `Font de dades no reconeguda per material ${material.codiMaterial}`,
            entityType: "FactorEmissioMaterial",
            entityId: material.id,
          }),
        );
      }

      if (material.anyReferencia > currentYear) {
        issues.push(
          makeIssue({
            rule: "temporal.reference_year",
            severity: "error",
            message: `Material ${material.codiMaterial} te any de referencia futur (${material.anyReferencia})`,
            entityType: "FactorEmissioMaterial",
            entityId: material.id,
          }),
        );
      }

      if (material.anyReferencia < staleYear) {
        issues.push(
          makeIssue({
            rule: "temporal.obsolete_source",
            severity: "warning",
            message: `Material ${material.codiMaterial} amb font potencialment obsoleta (${material.anyReferencia})`,
            entityType: "FactorEmissioMaterial",
            entityId: material.id,
          }),
        );
      }
    }

    for (const transport of transports) {
      if (transport.factorEmissio < 0 || transport.factorEmissio > 1) {
        issues.push(
          makeIssue({
            rule: "coherence.transport.range",
            severity: "warning",
            message: `Transport ${transport.tipusVehicle} amb factor fora de rang [0,1]`,
            entityType: "FactorEmissioTransport",
            entityId: transport.id,
          }),
        );
      }
      if (transport.unitat !== UnitatMesura.T_KM) {
        issues.push(
          makeIssue({
            rule: "coherence.transport.unit",
            severity: "error",
            message: `Transport ${transport.tipusVehicle} ha d'usar unitat T_KM`,
            entityType: "FactorEmissioTransport",
            entityId: transport.id,
          }),
        );
      }
      if (transport.anyReferencia > currentYear) {
        issues.push(
          makeIssue({
            rule: "temporal.reference_year",
            severity: "error",
            message: `Transport ${transport.tipusVehicle} te any de referencia futur (${transport.anyReferencia})`,
            entityType: "FactorEmissioTransport",
            entityId: transport.id,
          }),
        );
      }
      if (transport.anyReferencia < staleYear) {
        issues.push(
          makeIssue({
            rule: "temporal.obsolete_source",
            severity: "warning",
            message: `Transport ${transport.tipusVehicle} amb font obsoleta (${transport.anyReferencia})`,
            entityType: "FactorEmissioTransport",
            entityId: transport.id,
          }),
        );
      }
    }

    for (const combustible of combustibles) {
      if (combustible.factorEmissio < 0 || combustible.factorEmissio > 200) {
        issues.push(
          makeIssue({
            rule: "coherence.combustible.range",
            severity: "warning",
            message: `Combustible ${combustible.nomCombustible} amb factor emissio fora de rang`,
            entityType: "CombustibleFabricacio",
            entityId: combustible.id,
          }),
        );
      }
      if (combustible.poderCalorificInferior <= 0 || combustible.poderCalorificInferior > 100) {
        issues.push(
          makeIssue({
            rule: "coherence.combustible.pci",
            severity: "error",
            message: `Combustible ${combustible.nomCombustible} amb PCI invalid`,
            entityType: "CombustibleFabricacio",
            entityId: combustible.id,
          }),
        );
      }
      if (!new Set<string>([UnitatMesura.MJ, UnitatMesura.GJ]).has(combustible.unitatPoderCalorific)) {
        issues.push(
          makeIssue({
            rule: "coherence.combustible.pci_unit",
            severity: "error",
            message: `Combustible ${combustible.nomCombustible} amb unitat PCI inconsistent`,
            entityType: "CombustibleFabricacio",
            entityId: combustible.id,
          }),
        );
      }
      if (!new Set<string>([UnitatMesura.KG, UnitatMesura.GJ]).has(combustible.unitatFactorEmissio)) {
        issues.push(
          makeIssue({
            rule: "coherence.combustible.fe_unit",
            severity: "error",
            message: `Combustible ${combustible.nomCombustible} amb unitat FE inconsistent`,
            entityType: "CombustibleFabricacio",
            entityId: combustible.id,
          }),
        );
      }
      if (combustible.anyReferencia > currentYear) {
        issues.push(
          makeIssue({
            rule: "temporal.reference_year",
            severity: "error",
            message: `Combustible ${combustible.nomCombustible} te any de referencia futur (${combustible.anyReferencia})`,
            entityType: "CombustibleFabricacio",
            entityId: combustible.id,
          }),
        );
      }
      if (combustible.anyReferencia < staleYear) {
        issues.push(
          makeIssue({
            rule: "temporal.obsolete_source",
            severity: "warning",
            message: `Combustible ${combustible.nomCombustible} amb font obsoleta (${combustible.anyReferencia})`,
            entityType: "CombustibleFabricacio",
            entityId: combustible.id,
          }),
        );
      }
    }

    for (const equip of equips) {
      if (equip.factorEmissio < 0 || equip.factorEmissio > 500) {
        issues.push(
          makeIssue({
            rule: "coherence.equip.range",
            severity: "warning",
            message: `Equip ${equip.nomEquip} amb factor fora de rang`,
            entityType: "EquipPosadaEnObra",
            entityId: equip.id,
          }),
        );
      }
      if (equip.unitat !== UnitatMesura.H) {
        issues.push(
          makeIssue({
            rule: "coherence.equip.unit",
            severity: "error",
            message: `Equip ${equip.nomEquip} ha d'usar unitat H`,
            entityType: "EquipPosadaEnObra",
            entityId: equip.id,
          }),
        );
      }
      if (!sourceLooksValid(equip.fontDades)) {
        issues.push(
          makeIssue({
            rule: "coherence.source.valid",
            severity: "error",
            message: `Font no reconeguda per equip ${equip.nomEquip}`,
            entityType: "EquipPosadaEnObra",
            entityId: equip.id,
          }),
        );
      }
    }

    const missingMaterials = catalogMaterials
      .filter((material) => !materialCodes.has(material.codi.toLowerCase()))
      .map((material) => `${material.codi} (${material.nom})`);

    const coveragePercentage = catalogMaterials.length
      ? ((catalogMaterials.length - missingMaterials.length) / catalogMaterials.length) * 100
      : 100;

    if (coveragePercentage < 95) {
      issues.push(
        makeIssue({
          rule: "coverage.materials.threshold",
          severity: "warning",
          message: `Cobertura de materials baixa (${coveragePercentage.toFixed(2)}%)`,
          fixPath: "/admin/emissions?tab=materials",
          suggestion: "Revisa i completa factors per tots els materials actius",
        }),
      );
    }

    for (const missing of missingMaterials.slice(0, 30)) {
      issues.push(
        makeIssue({
          rule: "coverage.materials.missing",
          severity: "info",
          message: `Material sense factor d'emissio: ${missing}`,
          fixPath: "/admin/emissions?tab=materials",
        }),
      );
    }

    const errors = issues.filter((issue) => issue.severity === "error").length;
    const warnings = issues.filter((issue) => issue.severity === "warning").length;
    const info = issues.filter((issue) => issue.severity === "info").length;
    const healthScore = clamp(100 - errors * 6 - warnings * 2 - info * 0.5, 0, 100);

    const summary: ValidationSummary = {
      totalIssues: issues.length,
      errors,
      warnings,
      info,
      healthScore,
      coveragePercentage,
      missingMaterials,
    };

    const runPayload: Omit<ValidationRunResult, "runId"> = {
      trigger,
      version: activeVersion,
      executedAt: new Date().toISOString(),
      summary,
      issues,
      alertEmailSent: false,
    };

    let alertEmailSent = false;
    if (summary.errors > 0 || summary.warnings > 0) {
      try {
        alertEmailSent = await sendAlertEmail({ runId: "pending", ...runPayload });
      } catch (error) {
        console.error("[validation] error enviant alerta email", error);
      }
    }

    const persisted = await prisma.emissionsChangeLog.create({
      data: {
        versioBaseDadesId: activeVersion.id,
        usuariId: options?.initiatedBy ?? null,
        tipusCanvi: TipusCanviEmissio.MODIFICAT,
        entitat: "validation_run",
        registreId: crypto.randomUUID(),
        valorsNous: {
          ...runPayload,
          alertEmailSent,
        } as unknown as Prisma.InputJsonValue,
      },
      select: { id: true, createdAt: true },
    });

    return {
      runId: persisted.id,
      ...runPayload,
      executedAt: persisted.createdAt.toISOString(),
      alertEmailSent,
    } satisfies ValidationRunResult;
  },

  async getLatestValidation() {
    const latest = await prisma.emissionsChangeLog.findFirst({
      where: { entitat: "validation_run" },
      orderBy: { createdAt: "desc" },
      select: { id: true, createdAt: true, valorsNous: true },
    });

    if (!latest) {
      return null;
    }

    return extractStoredRun(latest);
  },

  async getValidationHistory(limit = 20) {
    const logs = await prisma.emissionsChangeLog.findMany({
      where: { entitat: "validation_run" },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: { id: true, createdAt: true, valorsNous: true },
    });

    return logs.map((log) => extractStoredRun(log)).filter((run): run is ValidationRunResult => Boolean(run));
  },
};
