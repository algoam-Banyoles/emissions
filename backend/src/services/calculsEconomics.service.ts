import { z } from "zod";

import { type CapaFirme, type TipologiaFirme, type TipusCapa } from "../types/estructural.js";

const areaMinM2 = 1;
const densityTM3 = 2.4;

const priceByLayerTypeDefault: Record<TipusCapa, number> = {
  RODAMENT: 68,
  INTERMEDIA: 60,
  BASE: 52,
  SUBBASE: 38,
  FONAMENT: 30,
};

const fabricationByTipologiaDefault: Record<TipologiaFirme, number> = {
  NOVA_CONSTRUCCIO: 19,
  REFORC: 17,
  RECICLATGE: 15,
  AUTL: 18,
};

const defaultsSchema = z
  .object({
    areaM2: z.number().positive().default(1),
    vidaUtilAnys: z.number().positive().default(20),
    tarifaTransportEurTKm: z.number().nonnegative().default(0.11),
    tarifaPosadaObraEurM2: z.number().nonnegative().default(6.5),
    costFabricacioEurT: z.number().nonnegative().default(17),
    preuMaterialPerTipus: z
      .object({
        RODAMENT: z.number().nonnegative().optional(),
        INTERMEDIA: z.number().nonnegative().optional(),
        BASE: z.number().nonnegative().optional(),
        SUBBASE: z.number().nonnegative().optional(),
        FONAMENT: z.number().nonnegative().optional(),
      })
      .optional(),
  })
  .optional();

export interface CostCapaResult {
  tipus: TipusCapa;
  nom: string;
  gruixCm: number;
  massaTones: number;
  distanciaKm: number;
  preuMaterialEurT: number;
  costMaterialEurM2: number;
  costTransportEurM2: number;
  costTotalEurM2: number;
}

export interface CostTotalResult {
  materialEurM2: number;
  transportEurM2: number;
  fabricacioEurM2: number;
  posadaObraEurM2: number;
  totalEurM2: number;
  costAnyVidaUtilEurM2: number;
  areaM2: number;
  vidaUtilAnys: number;
  perCapa: CostCapaResult[];
}

export interface CostTotalInput {
  estructura: {
    capes: CapaFirme[];
    tipologia: TipologiaFirme;
  };
  preus?: {
    costFabricacioEurT?: number;
    preuMaterialPerTipus?: Partial<Record<TipusCapa, number | undefined>>;
  };
  distancies?: {
    perTipusCapaKm?: Partial<Record<TipusCapa, number | undefined>>;
    distanciaGeneralKm?: number;
    tarifaTransportEurTKm?: number;
  };
  areaM2?: number;
  vidaUtilAnys?: number;
  tarifaPosadaObraEurM2?: number;
}

function round(value: number, decimals = 6) {
  return Number(value.toFixed(decimals));
}

function layerMassTonesPerM2(gruixCm: number) {
  return densityTM3 * (gruixCm / 100);
}

function mergePreuMaterialPerTipus(
  overrides?: Partial<Record<TipusCapa, number | undefined>>,
): Record<TipusCapa, number> {
  return {
    RODAMENT: overrides?.RODAMENT ?? priceByLayerTypeDefault.RODAMENT,
    INTERMEDIA: overrides?.INTERMEDIA ?? priceByLayerTypeDefault.INTERMEDIA,
    BASE: overrides?.BASE ?? priceByLayerTypeDefault.BASE,
    SUBBASE: overrides?.SUBBASE ?? priceByLayerTypeDefault.SUBBASE,
    FONAMENT: overrides?.FONAMENT ?? priceByLayerTypeDefault.FONAMENT,
  };
}

export const calculsEconomicsService = {
  calcularCostMaterial(_material: string, gruixCm: number, preuEurT: number) {
    const massa = layerMassTonesPerM2(gruixCm);
    return round(massa * preuEurT);
  },

  calcularCostTransport(_material: string, distanciaKm: number, tarifaEurTKm: number, massaTones = 1) {
    return round(massaTones * distanciaKm * tarifaEurTKm);
  },

  calcularCostFabricacio(tipusMescla: TipologiaFirme, volumTones: number, costFabricacioEurT?: number) {
    const tarifa = costFabricacioEurT ?? fabricationByTipologiaDefault[tipusMescla] ?? 17;
    return round(volumTones * tarifa);
  },

  calcularCostPosadaEnObra(gruixTotalCm: number, areaM2: number, tarifaPosadaObraEurM2 = 6.5) {
    const factorGruix = Math.max(0.6, Math.min(2.5, gruixTotalCm / 25));
    return round(areaM2 * tarifaPosadaObraEurM2 * factorGruix);
  },

  calcularCostTotal(input: CostTotalInput): CostTotalResult {
    const parsedDefaults = defaultsSchema.parse({
      areaM2: input.areaM2,
      vidaUtilAnys: input.vidaUtilAnys,
      tarifaTransportEurTKm: input.distancies?.tarifaTransportEurTKm,
      tarifaPosadaObraEurM2: input.tarifaPosadaObraEurM2,
      costFabricacioEurT: input.preus?.costFabricacioEurT,
      preuMaterialPerTipus: input.preus?.preuMaterialPerTipus,
    });

    const areaM2 = parsedDefaults?.areaM2 ?? 1;
    const vidaUtilAnys = parsedDefaults?.vidaUtilAnys ?? 20;
    const tarifaTransportEurTKm = parsedDefaults?.tarifaTransportEurTKm ?? 0.11;
    const tarifaPosadaObraEurM2 = parsedDefaults?.tarifaPosadaObraEurM2 ?? 6.5;
    const costFabricacioEurT = parsedDefaults?.costFabricacioEurT ?? 17;
    const preusCapa = mergePreuMaterialPerTipus(parsedDefaults?.preuMaterialPerTipus);
    const distanciaGeneralKm = Math.max(0, input.distancies?.distanciaGeneralKm ?? 25);

    const perCapa = input.estructura.capes.map((capa) => {
      const massaM2 = layerMassTonesPerM2(capa.gruixCm);
      const distanciaKm = Math.max(0, input.distancies?.perTipusCapaKm?.[capa.tipus] ?? distanciaGeneralKm);
      const preuMaterialEurT = preusCapa[capa.tipus] ?? 50;
      const costMaterialEurM2 = this.calcularCostMaterial(capa.nom, capa.gruixCm, preuMaterialEurT);
      const costTransportEurM2 = this.calcularCostTransport(capa.nom, distanciaKm, tarifaTransportEurTKm, massaM2);

      return {
        tipus: capa.tipus,
        nom: capa.nom,
        gruixCm: capa.gruixCm,
        massaTones: round(massaM2),
        distanciaKm: round(distanciaKm),
        preuMaterialEurT: round(preuMaterialEurT),
        costMaterialEurM2,
        costTransportEurM2,
        costTotalEurM2: round(costMaterialEurM2 + costTransportEurM2),
      } satisfies CostCapaResult;
    });

    const materialEurM2 = round(perCapa.reduce((sum, capa) => sum + capa.costMaterialEurM2, 0));
    const transportEurM2 = round(perCapa.reduce((sum, capa) => sum + capa.costTransportEurM2, 0));

    const volumTones = round(perCapa.reduce((sum, capa) => sum + capa.massaTones, 0) * areaM2);
    const fabricacioTotal = this.calcularCostFabricacio(input.estructura.tipologia, volumTones, costFabricacioEurT);
    const fabricacioEurM2 = round(fabricacioTotal / Math.max(areaM2, areaMinM2));

    const gruixTotalCm = input.estructura.capes.reduce((sum, capa) => sum + capa.gruixCm, 0);
    const posadaTotal = this.calcularCostPosadaEnObra(gruixTotalCm, areaM2, tarifaPosadaObraEurM2);
    const posadaObraEurM2 = round(posadaTotal / Math.max(areaM2, areaMinM2));

    const totalEurM2 = round(materialEurM2 + transportEurM2 + fabricacioEurM2 + posadaObraEurM2);
    const costAnyVidaUtilEurM2 = round(totalEurM2 / Math.max(1, vidaUtilAnys));

    return {
      materialEurM2,
      transportEurM2,
      fabricacioEurM2,
      posadaObraEurM2,
      totalEurM2,
      costAnyVidaUtilEurM2,
      areaM2,
      vidaUtilAnys,
      perCapa,
    };
  },
};
