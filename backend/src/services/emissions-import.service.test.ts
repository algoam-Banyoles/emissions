import { describe, expect, it, vi, beforeEach } from "vitest";

const prismaMocks = vi.hoisted(() => ({
  prisma: {
    factorEmissioMaterial: { count: vi.fn(async () => 0) },
    factorEmissioTransport: { count: vi.fn(async () => 0) },
    combustibleFabricacio: { count: vi.fn(async () => 0) },
    $transaction: vi.fn(),
  },
}));

vi.mock("../config/database.js", () => prismaMocks);

import { emissionsImportService } from "./emissions-import.service.js";

describe("emissionsImportService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna preview valida per materials", async () => {
    const csv = [
      "codi_material;nom;categoria;factor_emissio;unitat;font_dades;any_referencia;es_credit",
      "10a;arido_natural;ARIDS;4.48;T;DAP FdA AN;2022;false",
    ].join("\n");

    const result = await emissionsImportService.preview({
      categoria: "materials",
      fileName: "materials.csv",
      fileBuffer: Buffer.from(csv, "utf-8"),
      delimiter: ";",
    });

    expect(result.errors).toHaveLength(0);
    expect(result.validRows).toBe(1);
    expect(result.previewRows).toHaveLength(1);
  });

  it("detecta error si hi ha factor negatiu no credit", async () => {
    const csv = [
      "codi_material;nom;categoria;factor_emissio;unitat;font_dades;any_referencia",
      "14a;betun_convencional;BETUMS;-272;T;DAP REPSOL;2022",
    ].join("\n");

    const result = await emissionsImportService.preview({
      categoria: "materials",
      fileName: "materials.csv",
      fileBuffer: Buffer.from(csv, "utf-8"),
      delimiter: ";",
    });

    expect(result.errors.some((issue) => issue.field === "factor_emissio")).toBe(true);
  });

  it("importa dades i crea versio", async () => {
    const createdVersion = { id: "v-new", numero: "2026.02.16.1000" };

    prismaMocks.prisma.$transaction.mockImplementation(async (callback: (tx: Record<string, unknown>) => Promise<unknown>) => {
      const tx = {
        versioBaseDades: {
          updateMany: vi.fn(async () => ({ count: 1 })),
          create: vi.fn(async () => createdVersion),
        },
        factorEmissioMaterial: {
          createMany: vi.fn(async () => ({ count: 1 })),
        },
        factorEmissioTransport: { createMany: vi.fn(async () => ({ count: 0 })) },
        combustibleFabricacio: { createMany: vi.fn(async () => ({ count: 0 })) },
        equipPosadaEnObra: { createMany: vi.fn(async () => ({ count: 0 })) },
        emissionsChangeLog: {
          create: vi.fn(async () => ({ id: "log-1" })),
        },
      };

      return await callback(tx);
    });

    const csv = [
      "codi_material;nom;categoria;factor_emissio;unitat;font_dades;any_referencia;es_credit",
      "10a;arido_natural;ARIDS;4.48;T;DAP FdA AN;2022;false",
    ].join("\n");

    const result = await emissionsImportService.import({
      categoria: "materials",
      fileName: "materials.csv",
      fileBuffer: Buffer.from(csv, "utf-8"),
      delimiter: ";",
      confirm: true,
      usuariId: "u-admin",
    });

    expect(result.importedRows).toBe(1);
    expect(result.versio.id).toBe("v-new");
  });
});
