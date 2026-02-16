import { describe, expect, it, vi, beforeEach } from "vitest";

const prismaMocks = vi.hoisted(() => ({
  prisma: {
    versioBaseDades: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    factorEmissioMaterial: {
      findMany: vi.fn(),
    },
    factorEmissioTransport: { findMany: vi.fn() },
    combustibleFabricacio: { findMany: vi.fn() },
    consumElectric: { findMany: vi.fn() },
    equipPosadaEnObra: { findMany: vi.fn() },
    limitNormatiuEmissions: { findMany: vi.fn() },
    constantCalorifica: { findMany: vi.fn() },
  },
}));

vi.mock("../config/database.js", () => prismaMocks);

import { emissionsExportService } from "./emissions-export.service.js";

describe("emissionsExportService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMocks.prisma.versioBaseDades.findFirst.mockResolvedValue({ id: "v1", numero: "2024.1" });
    prismaMocks.prisma.factorEmissioMaterial.findMany.mockResolvedValue([
      {
        id: "m1",
        codiMaterial: "10a",
        nom: "arido_natural",
        categoria: "ARIDS",
        factorEmissio: 4.48,
        unitat: "T",
        fontDades: "DAP FdA AN",
        anyReferencia: 2022,
      },
    ]);
  });

  it("exporta CSV de materials", async () => {
    const result = await emissionsExportService.export({
      categoria: "materials",
      format: "csv",
      usuariEmail: "admin@test.com",
    });

    expect(result.fileName.endsWith(".csv")).toBe(true);
    expect(result.mimeType).toContain("text/csv");

    const text = result.content.toString("utf-8");
    expect(text).toContain("# version=2024.1");
    expect(text).toContain("codiMaterial");
    expect(text).toContain("arido_natural");
  });

  it("exporta XLSX de materials", async () => {
    const result = await emissionsExportService.export({
      categoria: "materials",
      format: "xlsx",
    });

    expect(result.fileName.endsWith(".xlsx")).toBe(true);
    expect(result.mimeType).toContain("spreadsheetml");
    expect(result.content.length).toBeGreaterThan(100);
  });
});
