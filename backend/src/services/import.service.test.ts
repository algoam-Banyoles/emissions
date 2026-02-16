import { describe, expect, it, vi, beforeEach } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    versioBaseDades: {
      create: vi.fn(),
    },
    material: {
      createMany: vi.fn(),
      findMany: vi.fn(),
    },
    materialAuditLog: {
      createMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("../config/database.js", () => ({
  prisma: prismaMock,
}));

import { importService } from "./import.service.js";

describe("importService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("parseja CSV valid", () => {
    const rows = importService.parseRows(
      [
        "CODI;NOM;TIPUS;PREU;FACTOR_EMISSIO_A1;FONT_FACTOR_EMISSIO",
        "MAT-001;Material A;MESCLA_BITUMINOSA;12.4;22.1;DAP TEST",
      ].join("\n"),
      ";",
    );

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      codi: "MAT-001",
      nom: "Material A",
      tipus: "MESCLA_BITUMINOSA",
      preuBaseEurT: 12.4,
      factorEmissioA1: 22.1,
    });
  });

  it("retorna error si falten columnes obligatories", () => {
    expect(() => importService.parseRows("NOM;TIPUS\nMaterial A;GRAVA", ";")).toThrow();
  });

  it("importa preus i crea nova versio", async () => {
    prismaMock.$transaction.mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        versioBaseDades: {
          create: vi.fn().mockResolvedValue({ id: "v1", numero: "2026.1" }),
        },
        material: {
          createMany: vi.fn().mockResolvedValue({ count: 1 }),
          findMany: vi.fn().mockResolvedValue([{ id: "m1" }]),
        },
        materialAuditLog: {
          createMany: vi.fn().mockResolvedValue({ count: 1 }),
        },
      };

      const result = await cb(tx);

      expect(tx.versioBaseDades.create).toHaveBeenCalledOnce();
      expect(tx.material.createMany).toHaveBeenCalledOnce();
      expect(tx.materialAuditLog.createMany).toHaveBeenCalledOnce();

      return result;
    });

    const result = await importService.importPrices({
      csvContent: ["CODI;NOM;TIPUS;PREU", "MAT-001;Material A;GRAVA;35.4"].join("\n"),
      fileName: "preus.csv",
      numeroVersio: "2026.1",
      descripcio: "Import test",
      delimiter: ";",
    });

    expect(result.imported).toBe(1);
    expect(result.version.id).toBe("v1");
  });
});
