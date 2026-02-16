import {
  type CapaFirme,
  capaFirmeSchema,
  type DadesFonament,
  dadesFonamentSchema,
  type DadesTransitNEC,
  dadesTransitNecSchema,
  type RestriccionsCombinacio,
  type ResultatVerificacio,
  resultatVerificacioSchema,
  type TipologiaFirme,
} from "../types/estructural.js";

const DEFAULT_CONTACT_RADIUS_M = 0.15;
const DEFAULT_WHEEL_LOAD_N = 50000;

function growthFactor(annualGrowthPercent: number, years: number) {
  const g = annualGrowthPercent / 100;
  if (g === 0) {
    return years;
  }

  return (Math.pow(1 + g, years) - 1) / g;
}

function generateThicknessValues(min: number, max: number, step: number) {
  const values: number[] = [];
  for (let value = min; value <= max + 1e-9; value += step) {
    values.push(Number(value.toFixed(2)));
  }
  return values;
}

function equivalentModulusMpa(capes: CapaFirme[]) {
  const totalThickness = capes.reduce((sum, capa) => sum + capa.gruixCm, 0);
  const weighted = capes.reduce((sum, capa) => sum + capa.modulElasticMpa * capa.gruixCm, 0);
  return weighted / totalThickness;
}

function bituminousEquivalentModulusMpa(capes: CapaFirme[]) {
  const asphaltLayers = capes.filter((capa) => capa.tipus === "RODAMENT" || capa.tipus === "INTERMEDIA" || capa.tipus === "BASE");
  if (asphaltLayers.length === 0) {
    return equivalentModulusMpa(capes);
  }

  return equivalentModulusMpa(asphaltLayers);
}

function surfaceStress(contactRadiusM: number, wheelLoadN: number) {
  return wheelLoadN / (Math.PI * contactRadiusM * contactRadiusM);
}

function computeStrainsMicro(capes: CapaFirme[], fons: DadesFonament) {
  const zMeters = capes.reduce((sum, capa) => sum + capa.gruixCm, 0) / 100;
  const eEquivalent = equivalentModulusMpa(capes) * 1_000_000;
  const eAsphalt = bituminousEquivalentModulusMpa(capes) * 1_000_000;
  const eSubgrade = fons.modulElasticMpa * 1_000_000;
  const sigma = surfaceStress(DEFAULT_CONTACT_RADIUS_M, DEFAULT_WHEEL_LOAD_N);

  const attenuation = Math.exp(-zMeters / (DEFAULT_CONTACT_RADIUS_M + 0.04));
  const epsilonTraccio = (sigma / eAsphalt) * attenuation;
  const epsilonCompressio = (sigma / eSubgrade) * (1 / (1 + zMeters * 4));

  return {
    epsilonTraccioMicro: epsilonTraccio * 1_000_000,
    epsilonCompressioMicro: epsilonCompressio * 1_000_000,
    modulEquivalentMpa: eEquivalent / 1_000_000,
    gruixTotalCm: zMeters * 100,
  };
}

function calculateFatigueCyclesAdmissibles(epsilonTraccioMicro: number, modulusMpa: number) {
  const epsilon = Math.max(epsilonTraccioMicro, 1);
  const e = Math.max(modulusMpa, 1);
  return 1.2e12 * Math.pow(1 / epsilon, 3.8) * Math.pow(1 / e, 0.2);
}

function calculateRuttingCyclesAdmissibles(epsilonCompressioMicro: number) {
  const epsilon = Math.max(epsilonCompressioMicro, 1);
  return 2.0e19 * Math.pow(1 / epsilon, 4.2);
}

function computeSurfaceDeformationMm(epsilonCompressioMicro: number, gruixTotalCm: number) {
  return (epsilonCompressioMicro / 1_000_000) * (gruixTotalCm / 100) * 1000 * 2.5;
}

function defaultRestrictionsFor(tipologia: TipologiaFirme): RestriccionsCombinacio {
  if (tipologia === "REFORC") {
    return {
      capes: [
        { tipus: "RODAMENT", gruixMinCm: 3, gruixMaxCm: 7, pasCm: 0.5, modulElasticMpa: 5000, nom: "Capa de rodament" },
        { tipus: "BASE", gruixMinCm: 6, gruixMaxCm: 14, pasCm: 0.5, modulElasticMpa: 4200, nom: "Capa base" },
      ],
      limitCombinacions: 50000,
    };
  }

  if (tipologia === "RECICLATGE") {
    return {
      capes: [
        { tipus: "RODAMENT", gruixMinCm: 4, gruixMaxCm: 8, pasCm: 0.5, modulElasticMpa: 4600, nom: "Capa de rodament" },
        { tipus: "BASE", gruixMinCm: 8, gruixMaxCm: 18, pasCm: 0.5, modulElasticMpa: 3400, nom: "Capa reciclada" },
        { tipus: "SUBBASE", gruixMinCm: 12, gruixMaxCm: 24, pasCm: 0.5, modulElasticMpa: 2500, nom: "Subbase" },
      ],
      limitCombinacions: 100000,
    };
  }

  if (tipologia === "AUTL") {
    return {
      capes: [
        { tipus: "RODAMENT", gruixMinCm: 3.5, gruixMaxCm: 6.5, pasCm: 0.5, modulElasticMpa: 5500, nom: "AUTL rodament" },
        { tipus: "INTERMEDIA", gruixMinCm: 5, gruixMaxCm: 10, pasCm: 0.5, modulElasticMpa: 4800, nom: "AUTL intermedia" },
        { tipus: "BASE", gruixMinCm: 8, gruixMaxCm: 16, pasCm: 0.5, modulElasticMpa: 4300, nom: "AUTL base" },
      ],
      limitCombinacions: 100000,
    };
  }

  return {
    capes: [
      { tipus: "RODAMENT", gruixMinCm: 4, gruixMaxCm: 8, pasCm: 0.5, modulElasticMpa: 5200, nom: "Capa de rodament" },
      { tipus: "INTERMEDIA", gruixMinCm: 6, gruixMaxCm: 12, pasCm: 0.5, modulElasticMpa: 4700, nom: "Capa intermedia" },
      { tipus: "BASE", gruixMinCm: 10, gruixMaxCm: 20, pasCm: 0.5, modulElasticMpa: 4200, nom: "Capa base" },
      { tipus: "SUBBASE", gruixMinCm: 15, gruixMaxCm: 30, pasCm: 0.5, modulElasticMpa: 2600, nom: "Capa subbase" },
    ],
    limitCombinacions: 150000,
  };
}

export const calculsEstructuralsService = {
  /**
   * NEC = 365 * IMD * (%VP/100) * FD * FE * FC
   * FC = ((1 + g)^n - 1) / g  si g > 0; altrament FC = n
   */
  calcularNEC(dadesTransit: DadesTransitNEC): number {
    const data = dadesTransitNecSchema.parse(dadesTransit);
    const vp = data.percentatgePesants / 100;
    const fc = growthFactor(data.creixementAnualPercent, data.anysProjecte);

    return 365 * data.imd * vp * data.factorDistribucio * data.factorEquivalencia * fc;
  },

  /**
   * Model multicapa simplificat tipus BISAR:
   * - Obtencio d'un modul equivalent per capes
   * - Estimacio de deformacions de traccio/compressio
   * - Verificacio per fatiga i aixecament
   */
  verificarEstructura(capesInput: CapaFirme[], necInput: number, fonsInput: DadesFonament): ResultatVerificacio {
    const capes = capesInput.map((capa) => capaFirmeSchema.parse(capa));
    const nec = Math.max(Number(necInput), 0);
    const fons = dadesFonamentSchema.parse(fonsInput);

    if (capes.length === 0) {
      throw new Error("L'estructura ha de tenir almenys una capa");
    }

    const strains = computeStrainsMicro(capes, fons);
    const ciclesFatiga = calculateFatigueCyclesAdmissibles(strains.epsilonTraccioMicro, strains.modulEquivalentMpa);
    const ciclesAixecament = calculateRuttingCyclesAdmissibles(strains.epsilonCompressioMicro);
    const deformacioSuperficialMm = computeSurfaceDeformationMm(strains.epsilonCompressioMicro, strains.gruixTotalCm);

    const ratioFatiga = nec / Math.max(ciclesFatiga, 1);
    const ratioAixecament = nec / Math.max(ciclesAixecament, 1);
    const viable = ratioFatiga <= 1 && ratioAixecament <= 1 && deformacioSuperficialMm <= 25;

    const result = {
      viable,
      ratios: {
        fatiga: ratioFatiga,
        aixecament: ratioAixecament,
      },
      deformacions: {
        epsilonTraccioMicro: strains.epsilonTraccioMicro,
        epsilonCompressioMicro: strains.epsilonCompressioMicro,
        deformacioSuperficialMm,
      },
      valorsAdmissibles: {
        ciclesFatigaAdmissibles: ciclesFatiga,
        ciclesAixecamentAdmissibles: ciclesAixecament,
      },
      detalls: {
        nec,
        gruixTotalCm: strains.gruixTotalCm,
        modulEquivalentMpa: strains.modulEquivalentMpa,
      },
    } satisfies ResultatVerificacio;

    return resultatVerificacioSchema.parse(result);
  },

  /**
   * Genera totes les combinacions de capes amb pas de 0.5 cm (o el pas configurat).
   */
  generarCombinacionsCapes(
    tipologia: TipologiaFirme,
    restriccions?: RestriccionsCombinacio,
  ): CapaFirme[][] {
    const baseRestrictions = restriccions ?? defaultRestrictionsFor(tipologia);
    const caps = baseRestrictions.capes;
    const maxCombinations = baseRestrictions.limitCombinacions ?? 150000;

    if (caps.length === 0) {
      return [];
    }

    const valuesByLayer = caps.map((item) => {
      const step = item.pasCm || 0.5;
      if (step <= 0) {
        throw new Error("El pas de gruix ha de ser positiu");
      }
      if (item.gruixMinCm > item.gruixMaxCm) {
        throw new Error("gruixMinCm no pot ser superior a gruixMaxCm");
      }
      return generateThicknessValues(item.gruixMinCm, item.gruixMaxCm, step);
    });

    const combinations: CapaFirme[][] = [];

    const backtrack = (layerIndex: number, current: CapaFirme[]) => {
      if (combinations.length >= maxCombinations) {
        return;
      }

      if (layerIndex === caps.length) {
        combinations.push([...current]);
        return;
      }

      const layer = caps[layerIndex];
      const values = valuesByLayer[layerIndex];
      if (!layer || !values) {
        return;
      }

      for (const thickness of values) {
        current.push({
          tipus: layer.tipus,
          nom: layer.nom ?? layer.tipus,
          gruixCm: thickness,
          modulElasticMpa: layer.modulElasticMpa,
          coeficientPoisson: layer.coeficientPoisson ?? 0.35,
        });
        backtrack(layerIndex + 1, current);
        current.pop();

        if (combinations.length >= maxCombinations) {
          break;
        }
      }
    };

    backtrack(0, []);

    return combinations;
  },
};
