import { TipusConsumElectric, type UnitatMesura } from "@prisma/client";

import { verificacioNormativaService } from "./verificacioNormativa.service.js";
import { prisma } from "../config/database.js";
import {
  calculPetjadaInputSchema,
  type CalculPetjadaInput,
  type ComposicioItem,
  type EquipInput,
  type ParametresFabricacio,
  type ResultatEtapaA3,
  type ResultatPetjadaEmissions,
  type TransportMesclaInput,
} from "../types/emissions.js";
import { HttpError } from "../utils/http-error.js";

interface ActiveVersionData {
  id: string;
  numero: string;
}

interface Dataset {
  versio: ActiveVersionData;
  materials: Awaited<ReturnType<typeof prisma.factorEmissioMaterial.findMany>>;
  transport: Awaited<ReturnType<typeof prisma.factorEmissioTransport.findMany>>;
  constants: Awaited<ReturnType<typeof prisma.constantCalorifica.findMany>>;
  combustibles: Awaited<ReturnType<typeof prisma.combustibleFabricacio.findMany>>;
  electric: Awaited<ReturnType<typeof prisma.consumElectric.findMany>>;
  equips: Awaited<ReturnType<typeof prisma.equipPosadaEnObra.findMany>>;
  limits: Awaited<ReturnType<typeof prisma.limitNormatiuEmissions.findMany>>;
}

const FORMULES = {
  A1: "E_A1 = Σ (m_i × FE_i)",
  A2: "E_A2 = Σ (m_i × d_i × FE_transport)",
  A3: "ΔH = Σ(m_i × Ce_i × ΔT_i) + m_aigua × C_W; D_c = (1/(1-p)) × ((ΔH + P)/PCI)",
  A4: "E_A4 = m_mb × d × FE_transport",
  A5: "E_A5 = Σ (hores_equip_i × FE_equip_i)",
  TOTAL: "E_total = E_A1 + E_A2 + E_A3 + E_A4 + E_A5",
} as const;

const DEFAULT_TRANSPORT_CODE = "20/40";
const DEFAULT_PALA_HINT = "30";

function findByCodeHint<T extends { codiMaterial?: string; nom?: string }>(items: T[], code: string): T | null {
  const normalized = code.toLowerCase();
  for (const item of items) {
    const codiMaterial = item.codiMaterial?.toLowerCase() ?? "";
    const nom = item.nom?.toLowerCase() ?? "";
    if (codiMaterial === normalized || nom.includes(`[${normalized}]`) || nom.startsWith(`${normalized} `)) {
      return item;
    }
  }
  return null;
}

function findTransportFactor(
  items: Dataset["transport"],
  tipusVehicle?: string,
) {
  if (tipusVehicle) {
    const normalized = tipusVehicle.toLowerCase();
    const exact = items.find((item) => item.tipusVehicle.toLowerCase() === normalized);
    if (exact) {
      return exact;
    }
    const partial = items.find((item) => item.tipusVehicle.toLowerCase().includes(normalized));
    if (partial) {
      return partial;
    }
  }

  const defaultByCode = items.find((item) => item.tipusVehicle.includes(`[${DEFAULT_TRANSPORT_CODE}]`));
  if (defaultByCode) {
    return defaultByCode;
  }

  const first = items[0];
  if (!first) {
    throw new HttpError(400, "No hi ha factors de transport actius");
  }
  return first;
}

function findConstantValue(constants: Dataset["constants"], hint: string, fallback: number) {
  const normalized = hint.toLowerCase();
  const item = constants.find((row) => row.nomMaterial.toLowerCase().includes(normalized));
  return item?.calorEspecific ?? fallback;
}

function normalizeMaterialMass(item: ComposicioItem, totalMesclaTones: number) {
  if (item.quantitatTones !== undefined) {
    return item.quantitatTones;
  }
  return ((item.percentatge ?? 0) / 100) * totalMesclaTones;
}

function round(value: number, digits = 6) {
  return Number(value.toFixed(digits));
}

function computeCombustibleEmissions(options: {
  consumCombustible: number;
  pci: number;
  factorEmissio: number;
  unitatFactor: UnitatMesura;
}) {
  if (options.unitatFactor === "KG") {
    return options.consumCombustible * options.factorEmissio;
  }

  if (options.unitatFactor === "GJ") {
    const energiaGJ = (options.consumCombustible * options.pci) / 1000;
    return energiaGJ * options.factorEmissio;
  }

  if (options.unitatFactor === "MJ") {
    const energiaMJ = options.consumCombustible * options.pci;
    return energiaMJ * options.factorEmissio;
  }

  return options.consumCombustible * options.factorEmissio;
}

function calculatePercentages(etapes: ResultatPetjadaEmissions["etapes"], total: number) {
  if (total <= 0) {
    return { A1: 0, A2: 0, A3: 0, A4: 0, A5: 0 };
  }

  return {
    A1: round((etapes.A1 / total) * 100, 4),
    A2: round((etapes.A2 / total) * 100, 4),
    A3: round((etapes.A3 / total) * 100, 4),
    A4: round((etapes.A4 / total) * 100, 4),
    A5: round((etapes.A5 / total) * 100, 4),
  };
}

async function getActiveDataset(): Promise<Dataset> {
  const versio = await prisma.versioBaseDades.findFirst({
    where: { esActual: true },
    orderBy: { createdAt: "desc" },
    select: { id: true, numero: true },
  });

  if (!versio) {
    throw new HttpError(400, "No hi ha versio activa de base de dades d'emissions");
  }

  const [materials, transport, constants, combustibles, electric, equips, limits] = await Promise.all([
    prisma.factorEmissioMaterial.findMany({ where: { versioBaseDadesId: versio.id, actiu: true } }),
    prisma.factorEmissioTransport.findMany({ where: { versioBaseDadesId: versio.id, actiu: true } }),
    prisma.constantCalorifica.findMany({ where: { versioBaseDadesId: versio.id, actiu: true } }),
    prisma.combustibleFabricacio.findMany({ where: { versioBaseDadesId: versio.id, actiu: true } }),
    prisma.consumElectric.findMany({ where: { versioBaseDadesId: versio.id, actiu: true } }),
    prisma.equipPosadaEnObra.findMany({ where: { versioBaseDadesId: versio.id, actiu: true } }),
    prisma.limitNormatiuEmissions.findMany({ where: { versioBaseDadesId: versio.id, actiu: true } }),
  ]);

  return { versio, materials, transport, constants, combustibles, electric, equips, limits };
}

function assertMaterialsExist(
  composicio: ComposicioItem[],
  factors: Dataset["materials"],
) {
  for (const item of composicio) {
    const factor = findByCodeHint(factors, item.codiMaterial);
    if (!factor) {
      throw new HttpError(400, `No existeix factor d'emissio A1 per al material ${item.codiMaterial}`);
    }
  }
}

export const calculsEmissionsService = {
  parseInput(input: unknown): CalculPetjadaInput {
    return calculPetjadaInputSchema.parse(input);
  },

  async calcularEmissionsA1(composicioInput: ComposicioItem[], totalMesclaTones = 1): Promise<number> {
    const dataset = await getActiveDataset();
    assertMaterialsExist(composicioInput, dataset.materials);

    let emissions = 0;
    for (const item of composicioInput) {
      const factor = findByCodeHint(dataset.materials, item.codiMaterial);
      if (!factor) {
        continue;
      }
      const massa = normalizeMaterialMass(item, totalMesclaTones);
      emissions += massa * factor.factorEmissio;
    }
    return round(emissions);
  },

  async calcularEmissionsA2(composicioInput: ComposicioItem[], totalMesclaTones = 1): Promise<number> {
    const dataset = await getActiveDataset();
    assertMaterialsExist(composicioInput, dataset.materials);

    let emissions = 0;
    for (const item of composicioInput) {
      const massa = normalizeMaterialMass(item, totalMesclaTones);
      const distancia = item.distanciaKm ?? 0;
      if (distancia <= 0 || massa <= 0) {
        continue;
      }
      const transportFactor = findTransportFactor(dataset.transport, item.tipusVehicle);
      emissions += massa * distancia * transportFactor.factorEmissio;
    }

    return round(emissions);
  },

  async calcularEmissionsA3(
    composicioInput: ComposicioItem[],
    parametresFabricacioInput: ParametresFabricacio,
    totalMesclaTones = 1,
  ): Promise<ResultatEtapaA3> {
    const dataset = await getActiveDataset();
    assertMaterialsExist(composicioInput, dataset.materials);

    const parametres = parametresFabricacioInput;
    const deltaT = Math.max(parametres.temperaturaMesclaC - parametres.temperaturaInicialC, 0);

    let massaArids = 0;
    let massaBetum = 0;
    let massaRa = 0;

    for (const item of composicioInput) {
      const factor = findByCodeHint(dataset.materials, item.codiMaterial);
      if (!factor) {
        continue;
      }

      const massa = normalizeMaterialMass(item, totalMesclaTones);
      if (factor.categoria === "BETUMS" || factor.categoria === "EMULSIONS") {
        massaBetum += massa;
      } else if (factor.categoria === "RA") {
        massaRa += massa;
      } else {
        massaArids += massa;
      }
    }

    const massaAigua = ((massaArids + massaRa) * parametres.humitatPercent) / 100;
    const ceArids = findConstantValue(dataset.constants, "aridos_naturales", 0.835);
    const ceRa = findConstantValue(dataset.constants, "ra", 0.89161);
    const ceBetum = findConstantValue(dataset.constants, "betun", 2.093);
    const ceAigua = findConstantValue(dataset.constants, "aigua", 4.184);
    const calorVaporitzacioMjKg = findConstantValue(dataset.constants, "calor_vaporitzacio", 2.25);

    const deltaHKj =
      (massaArids * 1000 * ceArids * deltaT) +
      (massaRa * 1000 * ceRa * deltaT) +
      (massaBetum * 1000 * ceBetum * deltaT) +
      (massaAigua * 1000 * ceAigua * deltaT) +
      (massaAigua * 1000 * calorVaporitzacioMjKg);
    const deltaHMJ = deltaHKj / 1000;

    const combustible = dataset.combustibles.find((item) => item.nomCombustible === parametres.combustible);
    if (!combustible) {
      throw new HttpError(400, `No s'ha trobat combustible actiu ${parametres.combustible}`);
    }

    const p = parametres.perduesCalorPercent / 100;
    if (p >= 1) {
      throw new HttpError(400, "El percentatge de perdues de calor ha de ser menor que 100%");
    }

    const consumCombustible = ((deltaHMJ + parametres.perduesRendimentMJ) / Math.max(1 - p, 0.01)) / combustible.poderCalorificInferior;
    const eCombustible = computeCombustibleEmissions({
      consumCombustible,
      pci: combustible.poderCalorificInferior,
      factorEmissio: combustible.factorEmissio,
      unitatFactor: combustible.unitatFactorEmissio,
    });

    const motorsCentral = dataset.electric.find((item) => item.tipusConsum === TipusConsumElectric.MOTORS_CENTRAL);
    const calentament = dataset.electric.find((item) => item.tipusConsum === TipusConsumElectric.CALENTAMENT_LIGANTS);
    if (!motorsCentral || !calentament) {
      throw new HttpError(400, "Falten consums electrics actius per al calcul A3");
    }

    const feElectric = parametres.fontElectrica === "RED" ? motorsCentral.factorEmissioRed : motorsCentral.factorEmissioGrupo;
    const eElectric = motorsCentral.consumKwhPerTona * feElectric * totalMesclaTones;

    const eCaldera =
      parametres.fontCalentament === "CALDERA"
        ? calentament.consumKwhPerTona * calentament.factorEmissioGrupo * totalMesclaTones
        : calentament.consumKwhPerTona * feElectric * totalMesclaTones;

    const pala = dataset.equips.find((item) => item.nomEquip.includes(`[${DEFAULT_PALA_HINT}]`)) ?? dataset.equips.find((item) => item.tipus === "A3_PALA");
    if (!pala) {
      throw new HttpError(400, "No existeix factor d'equip de pala carregadora (A3)");
    }
    const ePala = pala.factorEmissio * pala.rendimentHoresPerTona * totalMesclaTones;

    const total = eCombustible + eElectric + eCaldera + ePala;

    return {
      total: round(total),
      desglossament: {
        combustible: round(eCombustible),
        electric: round(eElectric),
        caldera: round(eCaldera),
        pala: round(ePala),
      },
      termodinamic: {
        deltaHMJ: round(deltaHMJ),
        consumCombustible: round(consumCombustible),
      },
    };
  },

  async calcularEmissionsA4(
    transportMescla: TransportMesclaInput,
    totalMesclaTones = 1,
  ): Promise<number> {
    const dataset = await getActiveDataset();
    const factor = findTransportFactor(dataset.transport, transportMescla.tipusVehicle);
    const massaTransportada = totalMesclaTones * (1 + transportMescla.mermesPercent / 100);
    const emissions = massaTransportada * transportMescla.distanciaKm * factor.factorEmissio;
    return round(emissions);
  },

  async calcularEmissionsA5(equipsInput: EquipInput[], totalMesclaTones = 1): Promise<number> {
    const dataset = await getActiveDataset();
    if (equipsInput.length === 0) {
      return 0;
    }

    let total = 0;
    for (const equipInput of equipsInput) {
      const normalizedName = equipInput.nomEquip.toLowerCase();
      const equip = dataset.equips.find((item) => item.nomEquip.toLowerCase().includes(normalizedName));
      if (!equip) {
        throw new HttpError(400, `No s'ha trobat factor d'equip per ${equipInput.nomEquip}`);
      }

      const tones = equipInput.tones ?? totalMesclaTones;
      const hores = equipInput.hores ?? (equipInput.horesPerTona ?? equip.rendimentHoresPerTona) * tones;
      total += hores * equip.factorEmissio;
    }
    return round(total);
  },

  async calcularPetjadaTotal(input: unknown): Promise<ResultatPetjadaEmissions> {
    const payload = this.parseInput(input);
    const dataset = await getActiveDataset();

    assertMaterialsExist(payload.composicio, dataset.materials);

    let a1 = 0;
    let a2 = 0;
    const fontsA1 = new Set<string>();
    const fontsA2 = new Set<string>();

    for (const component of payload.composicio) {
      const material = findByCodeHint(dataset.materials, component.codiMaterial);
      if (!material) {
        continue;
      }

      const massa = normalizeMaterialMass(component, payload.totalMesclaTones);
      a1 += massa * material.factorEmissio;
      fontsA1.add(material.fontDades);

      const distancia = component.distanciaKm ?? 0;
      if (distancia > 0 && massa > 0) {
        const factorTransport = findTransportFactor(dataset.transport, component.tipusVehicle);
        a2 += massa * distancia * factorTransport.factorEmissio;
        fontsA2.add(factorTransport.fontDades);
      }
    }

    const a3 = await this.calcularEmissionsA3(payload.composicio, payload.parametresFabricacio, payload.totalMesclaTones);
    const a4 = await this.calcularEmissionsA4(payload.transportMescla, payload.totalMesclaTones);
    const a5 = await this.calcularEmissionsA5(payload.equips, payload.totalMesclaTones);

    const etapes = {
      A1: round(a1),
      A2: round(a2),
      A3: a3.total,
      A4: a4,
      A5: a5,
    };
    const total = round(etapes.A1 + etapes.A2 + etapes.A3 + etapes.A4 + etapes.A5);
    const limitsTipologia =
      dataset.limits.filter((item) => item.tipologiaMescla === payload.tipologiaMescla) ??
      [];
    const limitsAplicables =
      limitsTipologia.length > 0
        ? limitsTipologia.map((item) => ({
            tipologiaMescla: item.tipologiaMescla,
            etapa: item.etapa,
            valorLimit: item.valorLimit,
            fontNormativa: item.fontNormativa,
            dataEntradaVigor: item.dataEntradaVigor.toISOString(),
          }))
        : await verificacioNormativaService.obtenirLimits(payload.tipologiaMescla);

    const comparativaNormativa = verificacioNormativaService.verificarComplimentOC3({
      emissionsTotals: total,
      tipologiaMescla: payload.tipologiaMescla,
      limitsAplicables,
    });

    return {
      versioBaseDades: dataset.versio,
      unitat: "kg CO2e/t",
      etapes,
      total,
      percentatges: calculatePercentages(etapes, total),
      comparativaNormativa,
      formulas: FORMULES,
      fontsDades: {
        A1: [...fontsA1],
        A2: [...fontsA2],
        A3: [
          ...dataset.combustibles.map((item) => item.fontDades),
          ...dataset.electric.map((item) => item.fontDades),
          ...dataset.constants.map((item) => item.fontDades),
          ...dataset.equips.filter((item) => item.tipus === "A3_PALA").map((item) => item.fontDades),
        ],
        A4: [findTransportFactor(dataset.transport, payload.transportMescla.tipusVehicle).fontDades],
        A5: dataset.equips.filter((item) => item.tipus === "A5").map((item) => item.fontDades),
      },
    };
  },
};
