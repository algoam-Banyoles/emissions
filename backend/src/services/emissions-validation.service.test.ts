import { CombustibleTipus, UnitatMesura } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.hoisted(() => {
  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
  process.env.JWT_ACCESS_SECRET = "test-secret-test-secret-test-secret-1234";
  process.env.JWT_REFRESH_SECRET = "test-refresh-test-refresh-test-refresh-12";
});

const state = vi.hoisted(() => ({
  latestPayload: null as Record<string, unknown> | null,
}));

const prismaMock = vi.hoisted(() => ({
  prisma: {
    versioBaseDades: {
      findFirst: vi.fn(),
    },
    factorEmissioMaterial: {
      findMany: vi.fn(),
    },
    factorEmissioTransport: {
      findMany: vi.fn(),
    },
    combustibleFabricacio: {
      findMany: vi.fn(),
    },
    equipPosadaEnObra: {
      findMany: vi.fn(),
    },
    material: {
      findMany: vi.fn(),
    },
    usuari: {
      findMany: vi.fn(),
    },
    emissionsChangeLog: {
      create: vi.fn(async ({ data }: { data: { valorsNous?: Record<string, unknown> } }) => {
        state.latestPayload = (data.valorsNous ?? null) as Record<string, unknown> | null;
        return { id: "log-1", createdAt: new Date("2026-02-15T10:00:00.000Z") };
      }),
      findFirst: vi.fn(async () =>
        state.latestPayload
          ? { id: "log-1", createdAt: new Date("2026-02-15T10:00:00.000Z"), valorsNous: state.latestPayload }
          : null,
      ),
      findMany: vi.fn(async () =>
        state.latestPayload
          ? [{ id: "log-1", createdAt: new Date("2026-02-15T10:00:00.000Z"), valorsNous: state.latestPayload }]
          : [],
      ),
    },
    $transaction: vi.fn(async (ops: Promise<unknown>[]) => await Promise.all(ops)),
  },
}));

const nodemailerMock = vi.hoisted(() => ({
  sendMail: vi.fn(async () => ({})),
}));

vi.mock("../config/database.js", () => prismaMock);
vi.mock("nodemailer", () => ({
  default: {
    createTransport: vi.fn(() => ({ sendMail: nodemailerMock.sendMail })),
  },
}));

import { emissionsValidationService } from "./emissions-validation.service.js";

describe("emissionsValidationService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.latestPayload = null;

    prismaMock.prisma.versioBaseDades.findFirst.mockResolvedValue({ id: "v1", numero: "2024.1" });
    prismaMock.prisma.factorEmissioMaterial.findMany.mockResolvedValue([]);
    prismaMock.prisma.factorEmissioTransport.findMany.mockResolvedValue([]);
    prismaMock.prisma.combustibleFabricacio.findMany.mockResolvedValue([]);
    prismaMock.prisma.equipPosadaEnObra.findMany.mockResolvedValue([]);
    prismaMock.prisma.material.findMany.mockResolvedValue([]);
    prismaMock.prisma.usuari.findMany.mockResolvedValue([]);
  });

  it("detecta errors de completesa quan falten factors basics", async () => {
    const result = await emissionsValidationService.executeValidation({ trigger: "manual", initiatedBy: "u1" });

    expect(result.summary.errors).toBeGreaterThan(0);
    expect(result.issues.some((issue) => issue.rule === "completeness.material.a1")).toBe(true);
    expect(result.issues.some((issue) => issue.rule === "completeness.transport.a2_a4")).toBe(true);
  });

  it("detecta factor negatiu invalid i unitats incoherents", async () => {
    prismaMock.prisma.factorEmissioMaterial.findMany.mockResolvedValue([
      {
        id: "m1",
        codiMaterial: "14a",
        nom: "betun_convencional",
        factorEmissio: -10,
        esCredit: false,
        unitat: UnitatMesura.L,
        fontDades: "DAP REPSOL",
        anyReferencia: 2024,
      },
    ]);
    prismaMock.prisma.factorEmissioTransport.findMany.mockResolvedValue([
      {
        id: "t1",
        tipusVehicle: "camion_semirremolque_40t_bascualnte",
        factorEmissio: 2,
        unitat: UnitatMesura.KG,
        fontDades: "SEVE",
        anyReferencia: 2024,
      },
    ]);
    prismaMock.prisma.combustibleFabricacio.findMany.mockResolvedValue([
      {
        id: "c1",
        nomCombustible: CombustibleTipus.GASOLEO,
        poderCalorificInferior: -1,
        unitatPoderCalorific: UnitatMesura.KG,
        factorEmissio: -2,
        unitatFactorEmissio: UnitatMesura.T,
        anyReferencia: 2024,
      },
    ]);

    const result = await emissionsValidationService.executeValidation({ trigger: "manual" });

    expect(result.issues.some((issue) => issue.rule === "coherence.material.non_negative")).toBe(true);
    expect(result.issues.some((issue) => issue.rule === "coherence.material.unit")).toBe(true);
    expect(result.issues.some((issue) => issue.rule === "coherence.transport.unit")).toBe(true);
    expect(result.issues.some((issue) => issue.rule === "coherence.combustible.pci")).toBe(true);
  });

  it("calcula cobertura i historial", async () => {
    prismaMock.prisma.factorEmissioMaterial.findMany.mockResolvedValue([
      {
        id: "m1",
        codiMaterial: "mat-001",
        nom: "mat",
        factorEmissio: 10,
        esCredit: false,
        unitat: UnitatMesura.T,
        fontDades: "DAP TEST",
        anyReferencia: 2021,
      },
    ]);
    prismaMock.prisma.material.findMany.mockResolvedValue([
      { id: "a", codi: "mat-001", nom: "Material 1" },
      { id: "b", codi: "mat-002", nom: "Material 2" },
    ]);

    const run = await emissionsValidationService.executeValidation({ trigger: "manual" });
    const latest = await emissionsValidationService.getLatestValidation();
    const history = await emissionsValidationService.getValidationHistory(10);

    expect(run.summary.coveragePercentage).toBeLessThan(100);
    expect(run.summary.missingMaterials.length).toBe(1);
    expect(latest?.runId).toBeDefined();
    expect(history.length).toBe(1);
  });
});
