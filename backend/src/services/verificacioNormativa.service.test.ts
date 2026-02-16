import { EtapaEmissions, TipologiaMescla } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => {
  const state = {
    versio: { id: "v-1" },
    limits: [
      {
        id: "l-1",
        tipologiaMescla: "MBC_CONVENCIONAL",
        etapa: "A1_A5",
        valorLimit: 70,
        unitat: "T",
        fontNormativa: "OC 3/2024",
        dataEntradaVigor: new Date("2024-01-01T00:00:00.000Z"),
        actiu: true,
        versioBaseDadesId: "v-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  };

  const prismaMock = {
    prisma: {
      versioBaseDades: {
        findFirst: vi.fn(async () => state.versio),
      },
      limitNormatiuEmissions: {
        findMany: vi.fn(async () => state.limits),
      },
    },
  };

  return { prismaMock, state };
});

vi.mock("../config/database.js", () => prismaMock);

import { verificacioNormativaService } from "./verificacioNormativa.service.js";

describe("verificacioNormativaService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("obte limits aplicables per tipologia", async () => {
    const limits = await verificacioNormativaService.obtenirLimits(TipologiaMescla.MBC_CONVENCIONAL);
    expect(limits.length).toBeGreaterThan(0);
    expect(limits[0]?.etapa).toBe(EtapaEmissions.A1_A5);
  });

  it("verifica compliment i calcula marge/percentatge", () => {
    const result = verificacioNormativaService.verificarComplimentOC3({
      emissionsTotals: 63,
      tipologiaMescla: TipologiaMescla.MBC_CONVENCIONAL,
      limitsAplicables: [
        {
          tipologiaMescla: TipologiaMescla.MBC_CONVENCIONAL,
          etapa: EtapaEmissions.A1_A5,
          valorLimit: 70,
          fontNormativa: "OC 3/2024",
          dataEntradaVigor: "2024-01-01T00:00:00.000Z",
        },
      ],
    });

    expect(result.compleix).toBe(true);
    expect(result.marge).toBe(7);
    expect(result.percentatgeSobreLimit).toBeCloseTo(90, 3);
    expect(result.nivell).toBe("VERD");
    expect(result.recomanacions.length).toBeGreaterThan(0);
  });

  it("retorna semafor vermell quan supera el limit", () => {
    const result = verificacioNormativaService.verificarComplimentOC3({
      emissionsTotals: 80,
      tipologiaMescla: TipologiaMescla.MBC_CONVENCIONAL,
      limitsAplicables: [
        {
          tipologiaMescla: TipologiaMescla.MBC_CONVENCIONAL,
          etapa: EtapaEmissions.A1_A5,
          valorLimit: 70,
          fontNormativa: "OC 3/2024",
          dataEntradaVigor: "2024-01-01T00:00:00.000Z",
        },
      ],
    });

    expect(result.compleix).toBe(false);
    expect(result.nivell).toBe("VERMELL");
    expect(result.recomanacions.some((text) => text.toLowerCase().includes("reduir"))).toBe(true);
  });
});
