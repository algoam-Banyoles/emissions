import { EtapaEmissions, TipologiaMescla, type LimitNormatiuEmissions } from "@prisma/client";

import { prisma } from "../config/database.js";

const defaultLimitByTipologia: Record<TipologiaMescla, number> = {
  MBC_CONVENCIONAL: 70,
  MBC_AMB_RA: 60,
  MBT: 55,
  AUTL: 45,
  ALTRE: 70,
};

export interface LimitAplicable {
  tipologiaMescla: TipologiaMescla;
  etapa: EtapaEmissions;
  valorLimit: number;
  fontNormativa: string;
  dataEntradaVigor: string;
}

export interface ResultatVerificacioNormativa {
  tipologiaMescla: TipologiaMescla;
  etapa: "A1_A5";
  emissionsTotals: number;
  limit: number;
  compleix: boolean;
  marge: number;
  percentatgeSobreLimit: number;
  nivell: "VERD" | "GROC" | "VERMELL";
  limitsAplicables: LimitAplicable[];
  recomanacions: string[];
}

function round(value: number, decimals = 6) {
  return Number(value.toFixed(decimals));
}

function toLimitAplicable(limit: Pick<LimitNormatiuEmissions, "tipologiaMescla" | "etapa" | "valorLimit" | "fontNormativa" | "dataEntradaVigor">): LimitAplicable {
  return {
    tipologiaMescla: limit.tipologiaMescla,
    etapa: limit.etapa,
    valorLimit: round(limit.valorLimit),
    fontNormativa: limit.fontNormativa,
    dataEntradaVigor: limit.dataEntradaVigor.toISOString(),
  };
}

function inferNivell(percentatgeSobreLimit: number): ResultatVerificacioNormativa["nivell"] {
  if (percentatgeSobreLimit <= 90) {
    return "VERD";
  }
  if (percentatgeSobreLimit <= 100) {
    return "GROC";
  }
  return "VERMELL";
}

function buildRecomanacions(params: {
  compleix: boolean;
  percentatgeSobreLimit: number;
  tipologiaMescla: TipologiaMescla;
}): string[] {
  if (params.compleix && params.percentatgeSobreLimit <= 90) {
    return ["Compliment robust. Mantenir composicio i cadena logistica actual."];
  }

  if (params.compleix) {
    return [
      "Marge de compliment ajustat. Revisar distancies de transport A2/A4.",
      "Optimitzar consum energetic A3 (temperatures i perdues de calor).",
    ];
  }

  return [
    "Reduir components amb factor A1 elevat (betum/ciment) i prioritzar alternatives baixes en carboni.",
    "Reduir distancies de transport A2/A4 o canviar tipus de vehicle mes eficient.",
    `Avaluar tipologia ${params.tipologiaMescla} i condicions de fabricacio per incrementar el marge de compliment.`,
  ];
}

export const verificacioNormativaService = {
  async obtenirLimits(tipologia: TipologiaMescla): Promise<LimitAplicable[]> {
    const versio = await prisma.versioBaseDades.findFirst({
      where: { esActual: true },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });

    if (!versio) {
      return [
        {
          tipologiaMescla: tipologia,
          etapa: EtapaEmissions.A1_A5,
          valorLimit: defaultLimitByTipologia[tipologia] ?? 70,
          fontNormativa: "OC 3/2024 (fallback)",
          dataEntradaVigor: new Date("2024-01-01T00:00:00.000Z").toISOString(),
        },
      ];
    }

    const found = await prisma.limitNormatiuEmissions.findMany({
      where: {
        versioBaseDadesId: versio.id,
        actiu: true,
        tipologiaMescla: tipologia,
      },
      orderBy: [{ etapa: "asc" }, { dataEntradaVigor: "desc" }],
    });

    if (found.length > 0) {
      return found.map(toLimitAplicable);
    }

    return [
      {
        tipologiaMescla: tipologia,
        etapa: EtapaEmissions.A1_A5,
        valorLimit: defaultLimitByTipologia[tipologia] ?? 70,
        fontNormativa: "OC 3/2024 (fallback)",
        dataEntradaVigor: new Date("2024-01-01T00:00:00.000Z").toISOString(),
      },
    ];
  },

  verificarComplimentOC3(params: {
    emissionsTotals: number;
    tipologiaMescla: TipologiaMescla;
    limitsAplicables: LimitAplicable[];
  }): ResultatVerificacioNormativa {
    const a1a5 =
      params.limitsAplicables.find((limit) => limit.etapa === EtapaEmissions.A1_A5) ??
      params.limitsAplicables[0] ?? {
        tipologiaMescla: params.tipologiaMescla,
        etapa: EtapaEmissions.A1_A5,
        valorLimit: defaultLimitByTipologia[params.tipologiaMescla] ?? 70,
        fontNormativa: "OC 3/2024 (fallback)",
        dataEntradaVigor: new Date("2024-01-01T00:00:00.000Z").toISOString(),
      };

    const limit = round(a1a5.valorLimit);
    const emissionsTotals = round(params.emissionsTotals);
    const compleix = emissionsTotals <= limit;
    const marge = round(limit - emissionsTotals);
    const percentatgeSobreLimit = limit > 0 ? round((emissionsTotals / limit) * 100, 4) : 0;
    const nivell = inferNivell(percentatgeSobreLimit);
    const recomanacions = buildRecomanacions({
      compleix,
      percentatgeSobreLimit,
      tipologiaMescla: params.tipologiaMescla,
    });

    return {
      tipologiaMescla: params.tipologiaMescla,
      etapa: "A1_A5",
      emissionsTotals,
      limit,
      compleix,
      marge,
      percentatgeSobreLimit,
      nivell,
      limitsAplicables: params.limitsAplicables,
      recomanacions,
    };
  },
};
