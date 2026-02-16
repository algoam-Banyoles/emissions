export interface EmissionsComposicioItem {
  codiMaterial: string;
  quantitatTones?: number;
  percentatge?: number;
  distanciaKm?: number;
  tipusVehicle?: string;
}

export interface EmissionsParametresFabricacio {
  temperaturaInicialC: number;
  temperaturaMesclaC: number;
  humitatPercent: number;
  perduesCalorPercent: number;
  perduesRendimentMJ: number;
  combustible: "GASOLEO" | "FUELOLEO" | "GAS_NATURAL";
  fontElectrica: "RED" | "GRUP";
  fontCalentament: "CALDERA" | "ELECTRIC";
}

export interface EmissionsEquipInput {
  nomEquip: string;
  hores?: number;
  horesPerTona?: number;
  tones?: number;
}

export interface EmissionsCalculRequest {
  totalMesclaTones: number;
  composicio: EmissionsComposicioItem[];
  parametresFabricacio: EmissionsParametresFabricacio;
  transportMescla: {
    distanciaKm: number;
    mermesPercent: number;
    tipusVehicle?: string;
  };
  equips: EmissionsEquipInput[];
  tipologiaMescla: "MBC_CONVENCIONAL" | "MBC_AMB_RA" | "MBT" | "AUTL" | "ALTRE";
}

export interface EmissionsCalculResponse {
  versioBaseDades: {
    id: string;
    numero: string;
  };
  unitat: "kg CO2e/t";
  etapes: {
    A1: number;
    A2: number;
    A3: number;
    A4: number;
    A5: number;
  };
  total: number;
  percentatges: {
    A1: number;
    A2: number;
    A3: number;
    A4: number;
    A5: number;
  };
  comparativaNormativa: {
    tipologiaMescla: string;
    etapa: "A1_A5";
    emissionsTotals: number;
    limit: number;
    compleix: boolean;
    marge: number;
    percentatgeSobreLimit: number;
    nivell: "VERD" | "GROC" | "VERMELL";
    limitsAplicables: {
      tipologiaMescla: string;
      etapa: string;
      valorLimit: number;
      fontNormativa: string;
      dataEntradaVigor: string;
    }[];
    recomanacions: string[];
  };
  formulas: Record<string, string>;
  fontsDades: {
    A1: string[];
    A2: string[];
    A3: string[];
    A4: string[];
    A5: string[];
  };
}
