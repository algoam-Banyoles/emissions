import {
  CategoriaMaterialEmissio,
  CombustibleTipus,
  EtapaEmissions,
  PrismaClient,
  TipologiaMescla,
  TipusCanviEmissio,
  TipusConsumElectric,
  UnitatMesura,
} from "@prisma/client";

const prisma = new PrismaClient();

const VERSION_NUMBER = "2024.1";
const VERSION_DESCRIPTION =
  "Versio inicial amb factors d'emissio OC 3/2024 i Excel EFAPAVE";

const LIMITS_SOURCE = "OC 3/2024";

interface A1Record {
  codi: string;
  codiMaterial: string;
  nom: string;
  categoria: CategoriaMaterialEmissio;
  factor: number;
  unitat: UnitatMesura;
  font: string;
  any: number;
  versioDap?: string;
  incertesa?: number;
  esCredit?: boolean;
  notes?: string;
}

interface TransportRecord {
  codi: string;
  tipusVehicle: string;
  capacitat: number;
  factor: number;
  font: string;
  any: number;
  combustible: CombustibleTipus;
  notes?: string;
}

interface ConstantRecord {
  codi: string;
  nomMaterial: string;
  calorEspecific: number;
  unitat: UnitatMesura;
  font: string;
  temperaturaReferencia?: number;
  notes?: string;
}

interface FuelRecord {
  codi: string;
  nomCombustible: CombustibleTipus;
  pci: number;
  unitatPci: UnitatMesura;
  fe: number;
  unitatFe: UnitatMesura;
  font: string;
  any: number;
}

interface ElectricRecord {
  codi: string;
  tipusConsum: TipusConsumElectric;
  consumKwhPerTona: number;
  factorEmissioRed: number;
  factorEmissioGrupo: number;
  font: string;
  any: number;
  notes?: string;
}

interface EquipmentRecord {
  codi: string;
  nomEquip: string;
  tipus: string;
  factor: number;
  rendiment: number;
  font: string;
  notes?: string;
}

// A1 - Produccio de materials (26)
const A1_FACTORS: A1Record[] = [
  // Arids (codis 10a, 10b, 11a, 11b)
  {
    codi: "10a",
    codiMaterial: "arido_natural_10a",
    nom: "Arido natural",
    categoria: CategoriaMaterialEmissio.ARIDS,
    factor: 4.48,
    unitat: UnitatMesura.T,
    font: "DAP FdA (AN, 2022)",
    any: 2022,
    versioDap: "2022",
  },
  {
    codi: "10b",
    codiMaterial: "arido_siderurgico_10b",
    nom: "Arido siderurgico",
    categoria: CategoriaMaterialEmissio.ARIDS,
    factor: 3.69,
    unitat: UnitatMesura.T,
    font: "DAP FdA (AA, 2022)",
    any: 2022,
    versioDap: "2022",
  },
  {
    codi: "11a",
    codiMaterial: "arido_natural_11a",
    nom: "Arido natural (MBT)",
    categoria: CategoriaMaterialEmissio.ARIDS,
    factor: 4.48,
    unitat: UnitatMesura.T,
    font: "DAP FdA (AN, 2022)",
    any: 2022,
    versioDap: "2022",
  },
  {
    codi: "11b",
    codiMaterial: "arido_siderurgico_11b",
    nom: "Arido siderurgico (MBT)",
    categoria: CategoriaMaterialEmissio.ARIDS,
    factor: 3.69,
    unitat: UnitatMesura.T,
    font: "DAP FdA (AA, 2022)",
    any: 2022,
    versioDap: "2022",
  },

  // Pols mineral (codis 12a, 12b, 12c)
  {
    codi: "12a",
    codiMaterial: "polvo_caco3_12a",
    nom: "Polvo mineral CaCO3",
    categoria: CategoriaMaterialEmissio.ARIDS,
    factor: 4.48,
    unitat: UnitatMesura.T,
    font: "DAP FdA (AN, 2022)",
    any: 2022,
    versioDap: "2022",
  },
  {
    codi: "12b",
    codiMaterial: "polvo_caoh2_12b",
    nom: "Polvo mineral CaCO3+Ca(OH)2",
    categoria: CategoriaMaterialEmissio.CIMENTS,
    factor: 300.32,
    unitat: UnitatMesura.T,
    font: "DAP EULA (2024)",
    any: 2024,
    versioDap: "2024",
  },
  {
    codi: "12c",
    codiMaterial: "polvo_cemento_12c",
    nom: "Polvo mineral cemento",
    categoria: CategoriaMaterialEmissio.CIMENTS,
    factor: 427.8,
    unitat: UnitatMesura.T,
    font: "DAP IECA (CEM III, 2023)",
    any: 2023,
    versioDap: "2023",
  },

  // RA (codi 13)
  {
    codi: "13",
    codiMaterial: "ra_tratado_13",
    nom: "RA tratado y acopiado en central",
    categoria: CategoriaMaterialEmissio.RA,
    factor: 2.16,
    unitat: UnitatMesura.T,
    font: "DAP FdA (AN, 2023)",
    any: 2023,
    versioDap: "2023",
  },

  // Betums (codis 14a-14d)
  {
    codi: "14a",
    codiMaterial: "betun_convencional_14a",
    nom: "Betun convencional",
    categoria: CategoriaMaterialEmissio.BETUMS,
    factor: 272.0,
    unitat: UnitatMesura.T,
    font: "DAP REPSOL (2020)",
    any: 2020,
    versioDap: "2020",
  },
  {
    codi: "14b",
    codiMaterial: "betun_pnfvu_14b",
    nom: "Betun mejorado con PNFVU",
    categoria: CategoriaMaterialEmissio.BETUMS,
    factor: 254.0,
    unitat: UnitatMesura.T,
    font: "DAP REPSOL (2020)",
    any: 2020,
    versioDap: "2020",
  },
  {
    codi: "14c",
    codiMaterial: "betun_pmb_14c",
    nom: "Betun PMB modificado con polimeros",
    categoria: CategoriaMaterialEmissio.BETUMS,
    factor: 465.0,
    unitat: UnitatMesura.T,
    font: "DAP REPSOL (2020)",
    any: 2020,
    versioDap: "2020",
  },
  {
    codi: "14d",
    codiMaterial: "betun_pmb_caucho_14d",
    nom: "Betun PMB 45/80-65 con caucho",
    categoria: CategoriaMaterialEmissio.BETUMS,
    factor: 359.5,
    unitat: UnitatMesura.T,
    font: "Deduccio hibrida",
    any: 2024,
    notes: "Valor deduit.",
  },

  // Emulsions (codis 14e-14h)
  {
    codi: "14e",
    codiMaterial: "emulsion_c60b4_14e",
    nom: "Emulsion bituminosa C60 B4 MBC",
    categoria: CategoriaMaterialEmissio.EMULSIONS,
    factor: 227.0,
    unitat: UnitatMesura.T,
    font: "DAP REPSOL (2020)",
    any: 2020,
    versioDap: "2020",
  },
  {
    codi: "14f",
    codiMaterial: "emulsion_c65b4_14f",
    nom: "Emulsion bituminosa C65 B4 MBC",
    categoria: CategoriaMaterialEmissio.EMULSIONS,
    factor: 227.0,
    unitat: UnitatMesura.T,
    font: "DAP REPSOL (2020)",
    any: 2020,
    versioDap: "2020",
  },
  {
    codi: "14g",
    codiMaterial: "emulsion_c60b5_14g",
    nom: "Emulsion bituminosa C60 B5 REC",
    categoria: CategoriaMaterialEmissio.EMULSIONS,
    factor: 227.0,
    unitat: UnitatMesura.T,
    font: "DAP REPSOL (2020)",
    any: 2020,
    versioDap: "2020",
  },
  {
    codi: "14h",
    codiMaterial: "emulsion_c65b5_14h",
    nom: "Emulsion bituminosa C65 B5 REC",
    categoria: CategoriaMaterialEmissio.EMULSIONS,
    factor: 227.0,
    unitat: UnitatMesura.T,
    font: "DAP REPSOL (2020)",
    any: 2020,
    versioDap: "2020",
  },

  // Fibres i aditius (codis 15, 17)
  {
    codi: "15",
    codiMaterial: "fibras_celulosa_15",
    nom: "Fibras de celulosa",
    categoria: CategoriaMaterialEmissio.FIBRES,
    factor: 229.0,
    unitat: UnitatMesura.T,
    font: "LCA TOPCEL, CFF",
    any: 2024,
  },
  {
    codi: "17",
    codiMaterial: "aditivo_semicalefacto_17",
    nom: "Aditivo estandar para mezclas semicalientes",
    categoria: CategoriaMaterialEmissio.ADDITIUS,
    factor: 1190.0,
    unitat: UnitatMesura.T,
    font: "SEVE V4.0 (2022)",
    any: 2022,
  },

  // RARx (codis 16a, 16b, 16c) - credits negatius
  {
    codi: "16a",
    codiMaterial: "rarx_caco3_16a",
    nom: "RARx 100% CaCO3",
    categoria: CategoriaMaterialEmissio.RA,
    factor: -141.0,
    unitat: UnitatMesura.T,
    font: "DAP CIRTEC (2024)",
    any: 2024,
    versioDap: "2024",
    esCredit: true,
    notes: "Credit per reutilitzacio de pneumatics.",
  },
  {
    codi: "16b",
    codiMaterial: "rarx_caoh2_16b",
    nom: "RARx CaCO3+Ca(OH)2",
    categoria: CategoriaMaterialEmissio.RA,
    factor: -59.6,
    unitat: UnitatMesura.T,
    font: "DAP CIRTEC (2024)",
    any: 2024,
    versioDap: "2024",
    esCredit: true,
    notes: "Credit per reutilitzacio de pneumatics.",
  },
  {
    codi: "16c",
    codiMaterial: "rarx_tyrexol_16c",
    nom: "Polvo NFVU pretratado tipo Tyrexol",
    categoria: CategoriaMaterialEmissio.RA,
    factor: -1060.3,
    unitat: UnitatMesura.T,
    font: "Draft EPD RENECAL (2025)",
    any: 2025,
    versioDap: "draft-2025",
    esCredit: true,
    notes: "Credit per reutilitzacio de pneumatics.",
  },

  // PVC (codi 18) - valor pendent
  {
    codi: "18",
    codiMaterial: "pvc_filler_18",
    nom: "PVC como filler o modificador",
    categoria: CategoriaMaterialEmissio.ALTRES,
    factor: 0.0,
    unitat: UnitatMesura.T,
    font: "Pendent d'assignar valor i font",
    any: 2025,
    notes: "Valor provisional.",
  },

  // Conglomerants hidraulics (codis 19a-19d)
  {
    codi: "19a",
    codiMaterial: "cal_hidratada_19a",
    nom: "Cal hidratada tipo CL-90-S",
    categoria: CategoriaMaterialEmissio.CIMENTS,
    factor: 892.0,
    unitat: UnitatMesura.T,
    font: "EULA (2024)",
    any: 2024,
    versioDap: "2024",
  },
  {
    codi: "19b",
    codiMaterial: "cemento_cem_i_19b",
    nom: "Cemento tipo CEM I",
    categoria: CategoriaMaterialEmissio.CIMENTS,
    factor: 778.0,
    unitat: UnitatMesura.T,
    font: "DAP IECA (2023)",
    any: 2023,
    versioDap: "2023",
  },
  {
    codi: "19c",
    codiMaterial: "cemento_cem_ii_19c",
    nom: "Cemento tipo CEM II",
    categoria: CategoriaMaterialEmissio.CIMENTS,
    factor: 649.8,
    unitat: UnitatMesura.T,
    font: "DAP IECA (2023)",
    any: 2023,
    versioDap: "2023",
  },
  {
    codi: "19d",
    codiMaterial: "cemento_cem_iii_19d",
    nom: "Cemento tipo CEM III",
    categoria: CategoriaMaterialEmissio.CIMENTS,
    factor: 427.8,
    unitat: UnitatMesura.T,
    font: "DAP IECA (2023)",
    any: 2023,
    versioDap: "2023",
  },
];

// A2/A4 - Transport (3)
const TRANSPORT_FACTORS: TransportRecord[] = [
  {
    codi: "20/40",
    tipusVehicle: "camion_semirremolque_40t_bascualnte",
    capacitat: 28,
    factor: 0.0849,
    font: "SEVE V4.0 (2022)",
    any: 2022,
    combustible: CombustibleTipus.GASOLEO,
    notes: "Us: Arids, RA i mescla bituminosa",
  },
  {
    codi: "21",
    tipusVehicle: "camion_rigido_18t",
    capacitat: 9,
    factor: 0.17,
    font: "SEVE V4.0 (2022)",
    any: 2022,
    combustible: CombustibleTipus.GASOLEO,
    notes: "Us: Fibras, PNFVU i aditius",
  },
  {
    codi: "22",
    tipusVehicle: "camion_cisterna_40t",
    capacitat: 24,
    factor: 0.0881,
    font: "SEVE V4.0 (2022)",
    any: 2022,
    combustible: CombustibleTipus.GASOLEO,
    notes: "Us: Betum i pols mineral",
  },
];

// A3 - Constants calorifiques (6)
const CALOR_CONSTANTS: ConstantRecord[] = [
  { codi: "A3-01", nomMaterial: "aridos_naturales", calorEspecific: 0.835, unitat: UnitatMesura.KG, font: "OC 3/2024", temperaturaReferencia: 20 },
  { codi: "A3-02", nomMaterial: "arido_siderurgico", calorEspecific: 0.78, unitat: UnitatMesura.KG, font: "OC 3/2024", temperaturaReferencia: 20 },
  { codi: "A3-03", nomMaterial: "betun", calorEspecific: 2.093, unitat: UnitatMesura.KG, font: "OC 3/2024", temperaturaReferencia: 20 },
  { codi: "A3-04", nomMaterial: "RA", calorEspecific: 0.89161, unitat: UnitatMesura.KG, font: "OC 3/2024", temperaturaReferencia: 20 },
  { codi: "A3-05", nomMaterial: "aigua", calorEspecific: 4.184, unitat: UnitatMesura.KG, font: "OC 3/2024", temperaturaReferencia: 20 },
  { codi: "A3-06", nomMaterial: "calor_vaporitzacio", calorEspecific: 2.25, unitat: UnitatMesura.MJ, font: "OC 3/2024", notes: "C_W" },
];

// A3 - Combustibles (3)
const FUEL_FACTORS: FuelRecord[] = [
  { codi: "31", nomCombustible: CombustibleTipus.GASOLEO, pci: 43.0, unitatPci: UnitatMesura.MJ, fe: 3.17, unitatFe: UnitatMesura.KG, font: "SEVE V4.0 (2022)", any: 2022 },
  { codi: "32", nomCombustible: CombustibleTipus.FUELOLEO, pci: 40.4, unitatPci: UnitatMesura.MJ, fe: 93.2, unitatFe: UnitatMesura.GJ, font: "Informe Inventaris GEI + Ecoinvent 3.11", any: 2024 },
  { codi: "33", nomCombustible: CombustibleTipus.GAS_NATURAL, pci: 48.31, unitatPci: UnitatMesura.MJ, fe: 70.19, unitatFe: UnitatMesura.GJ, font: "Informe Inventaris GEI + Ecoinvent 3.12", any: 2024 },
];

// A3 - Consum electric (3)
const ELECTRIC_FACTORS: ElectricRecord[] = [
  {
    codi: "34b",
    tipusConsum: TipusConsumElectric.MOTORS_CENTRAL,
    consumKwhPerTona: 1.5,
    factorEmissioRed: 0.283,
    factorEmissioGrupo: 0.84956,
    font: "MITERD 2024 / EPA 2010",
    any: 2024,
  },
  {
    codi: "34a",
    tipusConsum: TipusConsumElectric.ALTRE,
    consumKwhPerTona: 0,
    factorEmissioRed: 0,
    factorEmissioGrupo: 0.84956,
    font: "EPA 2010",
    any: 2010,
    notes: "Grup electrogen",
  },
  {
    codi: "34c",
    tipusConsum: TipusConsumElectric.CALENTAMENT_LIGANTS,
    consumKwhPerTona: 0.5,
    factorEmissioRed: 0.283,
    factorEmissioGrupo: 0.94466,
    font: "EPA 2010",
    any: 2010,
    notes: "FE caldera representat a factorEmissioGrupo",
  },
];

// A3 - Pala carregadora (1)
const A3_PALA: EquipmentRecord[] = [
  {
    codi: "30",
    nomEquip: "pala_carregadora",
    tipus: "A3_PALA",
    factor: 71.78,
    rendiment: 0.0129,
    font: "SEVE Eco-comparateur 4.0",
  },
];

// A5 - Equips posada en obra (14, inclou compactador 21t per compatibilitat)
const A5_EQUIPMENT: EquipmentRecord[] = [
  { codi: "50", nomEquip: "silo_transferencia", tipus: "A5", factor: 147.8, rendiment: 0.008, font: "SEVE Eco-comparateur 4.0" },
  { codi: "51", nomEquip: "extendedora", tipus: "A5", factor: 117.085, rendiment: 0.008, font: "SEVE Eco-comparateur 4.0" },
  { codi: "52", nomEquip: "compactador_tandem_11t", tipus: "A5", factor: 34.0, rendiment: 0.008, font: "SEVE Eco-comparateur 4.0" },
  { codi: "53", nomEquip: "compactador_tandem_15t", tipus: "A5", factor: 51.18, rendiment: 0.004, font: "SEVE Eco-comparateur 4.0" },
  { codi: "54", nomEquip: "compactador_neumaticos_35t", tipus: "A5", factor: 65.8676, rendiment: 0.004, font: "Deduccio/compactador 21t" },
  { codi: "54b", nomEquip: "compactador_neumaticos_21t", tipus: "A5", factor: 55.82, rendiment: 0.008, font: "SEVE Eco-comparateur 4.0", notes: "Compatibilitat" },
  { codi: "55", nomEquip: "minibarredora", tipus: "A5", factor: 25.043, rendiment: 0.004, font: "OC 4/2023" },
  { codi: "56", nomEquip: "fresadora_2_2m", tipus: "A5", factor: 266.4, rendiment: 0.004, font: "SEVE Eco-comparateur 4.0" },
  { codi: "57a", nomEquip: "fresadora_1m", tipus: "A5", factor: 124.35714, rendiment: 0.001, font: "SEVE Eco-comparateur 4.0" },
  { codi: "57b", nomEquip: "fresadora_0_35m", tipus: "A5", factor: 30.44286, rendiment: 0.004, font: "SEVE Eco-comparateur 4.0" },
  { codi: "58", nomEquip: "recicladora", tipus: "A5", factor: 386.9, rendiment: 0.004, font: "SEVE Eco-comparateur 4.0" },
  { codi: "59a", nomEquip: "camion_bascualnte_40t", tipus: "A5", factor: 159.2, rendiment: 0.001, font: "SEVE Eco-comparateur 4.0" },
  { codi: "59b", nomEquip: "camion_3ejes_14t", tipus: "A5", factor: 122.05714, rendiment: 0.004, font: "SEVE Eco-comparateur 4.0" },
  { codi: "59c", nomEquip: "camion_cisterna_obra", tipus: "A5", factor: 159.2, rendiment: 0.001, font: "SEVE Eco-comparateur 4.0" },
];

// Limits normatius (4)
const NORMATIVE_LIMITS = [
  { tipologia: TipologiaMescla.MBC_CONVENCIONAL, etapa: EtapaEmissions.A1_A5, valor: 70.0 },
  { tipologia: TipologiaMescla.MBC_AMB_RA, etapa: EtapaEmissions.A1_A5, valor: 60.0 },
  { tipologia: TipologiaMescla.MBT, etapa: EtapaEmissions.A1_A5, valor: 55.0 },
  { tipologia: TipologiaMescla.AUTL, etapa: EtapaEmissions.A1_A5, valor: 45.0 },
] as const;

function assertNonEmpty(value: string, message: string) {
  if (!value.trim()) {
    throw new Error(message);
  }
}

function assertFiniteNumber(value: number, message: string) {
  if (!Number.isFinite(value)) {
    throw new Error(message);
  }
}

function validateInputData() {
  console.log("[seed:emissions] Validant datasets d'entrada...");

  if (A1_FACTORS.length !== 26) {
    throw new Error(`A1 ha de tenir 26 registres i en te ${A1_FACTORS.length}`);
  }
  if (TRANSPORT_FACTORS.length !== 3) {
    throw new Error(`A2/A4 ha de tenir 3 registres i en te ${TRANSPORT_FACTORS.length}`);
  }
  if (CALOR_CONSTANTS.length !== 6) {
    throw new Error(`Constants calorifiques han de ser 6 i en son ${CALOR_CONSTANTS.length}`);
  }
  if (FUEL_FACTORS.length !== 3) {
    throw new Error(`Combustibles han de ser 3 i en son ${FUEL_FACTORS.length}`);
  }
  if (ELECTRIC_FACTORS.length !== 3) {
    throw new Error(`Consums electrics han de ser 3 i en son ${ELECTRIC_FACTORS.length}`);
  }
  if (A3_PALA.length !== 1) {
    throw new Error(`A3 pala ha de ser 1 registre i en te ${A3_PALA.length}`);
  }
  if (A5_EQUIPMENT.length !== 14) {
    throw new Error(`A5 equips han de ser 14 i en son ${A5_EQUIPMENT.length}`);
  }

  const totalFactors =
    A1_FACTORS.length +
    TRANSPORT_FACTORS.length +
    CALOR_CONSTANTS.length +
    FUEL_FACTORS.length +
    ELECTRIC_FACTORS.length +
    A3_PALA.length +
    A5_EQUIPMENT.length;

  if (totalFactors !== 56) {
    throw new Error(`Total de factors ha de ser 56 i es ${totalFactors}`);
  }

  const requiredA1Codes = new Set([
    "10a", "10b", "11a", "11b", "12a", "12b", "12c", "13",
    "14a", "14b", "14c", "14d", "14e", "14f", "14g", "14h",
    "15", "16a", "16b", "16c", "17", "18", "19a", "19b", "19c", "19d",
  ]);
  const presentA1Codes = new Set(A1_FACTORS.map((item) => item.codi));
  for (const code of requiredA1Codes) {
    if (!presentA1Codes.has(code)) {
      throw new Error(`Falta codi A1 obligatori: ${code}`);
    }
  }

  const requiredTransportCodes = new Set(["20/40", "21", "22"]);
  const presentTransportCodes = new Set(TRANSPORT_FACTORS.map((item) => item.codi));
  for (const code of requiredTransportCodes) {
    if (!presentTransportCodes.has(code)) {
      throw new Error(`Falta codi transport obligatori: ${code}`);
    }
  }

  const requiredFuelCodes = new Set(["31", "32", "33"]);
  const presentFuelCodes = new Set(FUEL_FACTORS.map((item) => item.codi));
  for (const code of requiredFuelCodes) {
    if (!presentFuelCodes.has(code)) {
      throw new Error(`Falta codi combustible obligatori: ${code}`);
    }
  }

  const requiredElectricCodes = new Set(["34a", "34b", "34c"]);
  const presentElectricCodes = new Set(ELECTRIC_FACTORS.map((item) => item.codi));
  for (const code of requiredElectricCodes) {
    if (!presentElectricCodes.has(code)) {
      throw new Error(`Falta codi electric obligatori: ${code}`);
    }
  }

  const requiredPalaCodes = new Set(["30"]);
  const presentPalaCodes = new Set(A3_PALA.map((item) => item.codi));
  for (const code of requiredPalaCodes) {
    if (!presentPalaCodes.has(code)) {
      throw new Error(`Falta codi pala obligatori: ${code}`);
    }
  }

  const requiredA5Codes = new Set([
    "50",
    "51",
    "52",
    "53",
    "54",
    "54b",
    "55",
    "56",
    "57a",
    "57b",
    "58",
    "59a",
    "59b",
    "59c",
  ]);
  const presentA5Codes = new Set(A5_EQUIPMENT.map((item) => item.codi));
  for (const code of requiredA5Codes) {
    if (!presentA5Codes.has(code)) {
      throw new Error(`Falta codi A5 obligatori: ${code}`);
    }
  }

  for (const item of A1_FACTORS) {
    assertNonEmpty(item.codi, `Codi buit a A1: ${item.nom}`);
    assertNonEmpty(item.codiMaterial, `codiMaterial buit a A1: ${item.codi}`);
    assertNonEmpty(item.font, `Font buida a A1: ${item.codi}`);
    assertFiniteNumber(item.factor, `Factor invalid a A1: ${item.codi}`);
    if (item.factor < 0 && !item.esCredit) {
      throw new Error(`Factor negatiu sense credit explicit a A1: ${item.codi}`);
    }
  }

  for (const item of TRANSPORT_FACTORS) {
    assertNonEmpty(item.codi, `Codi buit a transport: ${item.tipusVehicle}`);
    assertNonEmpty(item.font, `Font buida a transport: ${item.codi}`);
    assertFiniteNumber(item.factor, `Factor invalid a transport: ${item.codi}`);
    assertFiniteNumber(item.capacitat, `Capacitat invalida a transport: ${item.codi}`);
    if (item.factor < 0 || item.capacitat <= 0) {
      throw new Error(`Valors invalids a transport: ${item.codi}`);
    }
  }

  for (const item of [...CALOR_CONSTANTS, ...FUEL_FACTORS, ...ELECTRIC_FACTORS, ...A3_PALA, ...A5_EQUIPMENT]) {
    assertNonEmpty(item.codi, `Codi buit en dataset: ${JSON.stringify(item)}`);
    if ("font" in item) {
      assertNonEmpty(item.font, `Font buida a codi: ${item.codi}`);
    }
  }

  console.log("[seed:emissions] Validacio d'entrada correcta (56 factors + 4 limits).");
}

async function seedEmissions() {
  validateInputData();

  console.log(`[seed:emissions] Preparant versio ${VERSION_NUMBER}...`);

  const version = await prisma.versioBaseDades.upsert({
    where: { numero: VERSION_NUMBER },
    update: {
      descripcio: VERSION_DESCRIPTION,
      estat: "PUBLICADA",
      dataPublicacio: new Date(),
      esActual: true,
      fitxersFont: ["OC_3_2024", "Excel_EFAPAVE_v4"],
    },
    create: {
      numero: VERSION_NUMBER,
      descripcio: VERSION_DESCRIPTION,
      estat: "PUBLICADA",
      dataPublicacio: new Date(),
      esActual: true,
      fitxersFont: ["OC_3_2024", "Excel_EFAPAVE_v4"],
    },
  });

  await prisma.versioBaseDades.updateMany({
    where: {
      id: { not: version.id },
      esActual: true,
    },
    data: { esActual: false },
  });

  console.log("[seed:emissions] Esborrant dades anteriors de la versio per garantir idempotencia...");
  await prisma.$transaction([
    prisma.emissionsChangeLog.deleteMany({ where: { versioBaseDadesId: version.id, entitat: "SeedEmissions" } }),
    prisma.factorEmissioMaterial.deleteMany({ where: { versioBaseDadesId: version.id } }),
    prisma.factorEmissioTransport.deleteMany({ where: { versioBaseDadesId: version.id } }),
    prisma.constantCalorifica.deleteMany({ where: { versioBaseDadesId: version.id } }),
    prisma.combustibleFabricacio.deleteMany({ where: { versioBaseDadesId: version.id } }),
    prisma.consumElectric.deleteMany({ where: { versioBaseDadesId: version.id } }),
    prisma.equipPosadaEnObra.deleteMany({ where: { versioBaseDadesId: version.id } }),
    prisma.limitNormatiuEmissions.deleteMany({ where: { versioBaseDadesId: version.id } }),
  ]);

  console.log("[seed:emissions] Inserint A1 (26 factors materials)...");
  await prisma.factorEmissioMaterial.createMany({
    data: A1_FACTORS.map((item) => ({
      codiMaterial: item.codi,
      nom: `${item.codiMaterial} [${item.codi}]`,
      categoria: item.categoria,
      factorEmissio: item.factor,
      unitat: item.unitat,
      fontDades: item.notes ? `${item.font} | ${item.notes}` : item.font,
      anyReferencia: item.any,
      versioDap: item.versioDap ?? null,
      incertesaPercentatge: item.incertesa ?? null,
      esCredit: item.esCredit ?? false,
      actiu: true,
      versioBaseDadesId: version.id,
    })),
  });

  console.log("[seed:emissions] Inserint A2/A4 (3 factors transport)...");
  await prisma.factorEmissioTransport.createMany({
    data: TRANSPORT_FACTORS.map((item) => ({
      tipusVehicle: `${item.tipusVehicle} [${item.codi}]`,
      capacitatTonelades: item.capacitat,
      factorEmissio: item.factor,
      unitat: UnitatMesura.T_KM,
      fontDades: item.notes ? `${item.font} | ${item.notes}` : item.font,
      anyReferencia: item.any,
      combustible: item.combustible,
      actiu: true,
      versioBaseDadesId: version.id,
    })),
  });

  console.log("[seed:emissions] Inserint A3 constants (6), combustibles (3), electric (3), pala (1)...");
  await prisma.constantCalorifica.createMany({
    data: CALOR_CONSTANTS.map((item) => ({
      nomMaterial: `${item.nomMaterial} [${item.codi}]`,
      calorEspecific: item.calorEspecific,
      unitat: item.unitat,
      temperaturaReferencia: item.temperaturaReferencia ?? null,
      fontDades: item.notes ? `${item.font} | ${item.notes}` : item.font,
      actiu: true,
      versioBaseDadesId: version.id,
    })),
  });

  await prisma.combustibleFabricacio.createMany({
    data: FUEL_FACTORS.map((item) => ({
      nomCombustible: item.nomCombustible,
      poderCalorificInferior: item.pci,
      unitatPoderCalorific: item.unitatPci,
      factorEmissio: item.fe,
      unitatFactorEmissio: item.unitatFe,
      fontDades: `${item.font} | codi ${item.codi}`,
      anyReferencia: item.any,
      actiu: true,
      versioBaseDadesId: version.id,
    })),
  });

  await prisma.consumElectric.createMany({
    data: ELECTRIC_FACTORS.map((item) => ({
      tipusConsum: item.tipusConsum,
      consumKwhPerTona: item.consumKwhPerTona,
      factorEmissioRed: item.factorEmissioRed,
      factorEmissioGrupo: item.factorEmissioGrupo,
      fontDades: item.notes ? `${item.font} | ${item.notes} | codi ${item.codi}` : `${item.font} | codi ${item.codi}`,
      anyReferencia: item.any,
      actiu: true,
      versioBaseDadesId: version.id,
    })),
  });

  await prisma.equipPosadaEnObra.createMany({
    data: [...A3_PALA, ...A5_EQUIPMENT].map((item) => ({
      nomEquip: `${item.nomEquip} [${item.codi}]`,
      tipus: item.tipus,
      factorEmissio: item.factor,
      rendimentHoresPerTona: item.rendiment,
      unitat: UnitatMesura.H,
      fontDades: item.notes ? `${item.font} | ${item.notes}` : item.font,
      actiu: true,
      versioBaseDadesId: version.id,
    })),
  });

  console.log("[seed:emissions] Inserint limits normatius (4)...");
  await prisma.limitNormatiuEmissions.createMany({
    data: NORMATIVE_LIMITS.map((item) => ({
      tipologiaMescla: item.tipologia,
      etapa: item.etapa,
      valorLimit: item.valor,
      unitat: UnitatMesura.T,
      fontNormativa: LIMITS_SOURCE,
      dataEntradaVigor: new Date("2024-01-01T00:00:00.000Z"),
      actiu: true,
      versioBaseDadesId: version.id,
    })),
  });

  const [countA1, countTransport, countConstants, countFuels, countElectric, countEquipment, countLimits] =
    await Promise.all([
      prisma.factorEmissioMaterial.count({ where: { versioBaseDadesId: version.id } }),
      prisma.factorEmissioTransport.count({ where: { versioBaseDadesId: version.id } }),
      prisma.constantCalorifica.count({ where: { versioBaseDadesId: version.id } }),
      prisma.combustibleFabricacio.count({ where: { versioBaseDadesId: version.id } }),
      prisma.consumElectric.count({ where: { versioBaseDadesId: version.id } }),
      prisma.equipPosadaEnObra.count({ where: { versioBaseDadesId: version.id } }),
      prisma.limitNormatiuEmissions.count({ where: { versioBaseDadesId: version.id } }),
    ]);

  const totalInsertedFactors =
    countA1 + countTransport + countConstants + countFuels + countElectric + countEquipment;

  const expectedEquipment = A3_PALA.length + A5_EQUIPMENT.length;
  if (countA1 !== 26 || countTransport !== 3 || countConstants !== 6 || countFuels !== 3 || countElectric !== 3) {
    throw new Error("Comptatges incorrectes en factors d'emissio inserits");
  }
  if (countEquipment !== expectedEquipment) {
    throw new Error(`Comptatge d'equips incorrecte: esperat ${expectedEquipment}, actual ${countEquipment}`);
  }
  if (totalInsertedFactors !== 56) {
    throw new Error(`Total de factors inserits incorrecte: esperat 56, actual ${totalInsertedFactors}`);
  }
  if (countLimits !== 4) {
    throw new Error(`Comptatge de limits incorrecte: esperat 4, actual ${countLimits}`);
  }

  await prisma.emissionsChangeLog.create({
    data: {
      versioBaseDadesId: version.id,
      tipusCanvi: TipusCanviEmissio.IMPORTAT,
      entitat: "SeedEmissions",
      registreId: VERSION_NUMBER,
      valorsNous: {
        totals: {
          factors: totalInsertedFactors,
          limits: countLimits,
        },
        detall: {
          A1: countA1,
          A2A4: countTransport,
          A3Constants: countConstants,
          A3Combustibles: countFuels,
          A3Electric: countElectric,
          A3Pala: A3_PALA.length,
          A5: A5_EQUIPMENT.length,
        },
      },
    },
  });

  console.log("[seed:emissions] Seed completat correctament.");
  console.log(`[seed:emissions] Resum versio ${VERSION_NUMBER}:`);
  console.log(`  - A1 materials: ${countA1}`);
  console.log(`  - A2/A4 transport: ${countTransport}`);
  console.log(`  - A3 constants: ${countConstants}`);
  console.log(`  - A3 combustibles: ${countFuels}`);
  console.log(`  - A3 consum electric: ${countElectric}`);
  console.log(`  - Equips (A3 pala + A5): ${countEquipment}`);
  console.log(`  - Limits normatius: ${countLimits}`);
  console.log(`  - Total factors oficials: ${totalInsertedFactors}`);
}

seedEmissions()
  .catch((error) => {
    console.error("[seed:emissions] Error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
