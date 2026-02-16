export type MaterialType = "MESCLA_BITUMINOSA" | "MACADAM" | "ESTABILITZAT" | "GRAVA" | "ALTRE";

export interface Material {
  id: string;
  codi: string;
  nom: string;
  tipus: MaterialType;
  descripcio: string | null;
  modulElasticMpa: number | null;
  coeficientPoisson: number | null;
  resistenciaFlexioMpa: number | null;
  resistenciaCompressioMpa: number | null;
  densitatTM3: number | null;
  factorEmissioA1: number | null;
  fontFactorEmissio: string | null;
  preuBaseEurT: number | null;
  unitatPreu: string;
  actiu: boolean;
  versioBaseDadesId: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedMaterials {
  items: Material[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface DataVersion {
  id: string;
  numero: string;
  descripcio: string | null;
  estat: "ESBORRANY" | "PUBLICADA" | "OBSOLETA";
  dataPublicacio: string | null;
  esActual: boolean;
  createdAt: string;
  updatedAt: string;
  materialsCount?: number;
}

export interface VersionComparison {
  fromVersionId: string;
  toVersionId: string;
  summary: {
    created: number;
    updated: number;
    removed: number;
  };
}

export interface ImportPricesPayload {
  csvContent: string;
  fileName?: string;
  numeroVersio: string;
  descripcio?: string;
  delimiter?: "," | ";";
}

export interface MaterialPayload {
  codi: string;
  nom: string;
  tipus: MaterialType;
  descripcio?: string | null;
  modulElasticMpa?: number | null;
  coeficientPoisson?: number | null;
  resistenciaFlexioMpa?: number | null;
  resistenciaCompressioMpa?: number | null;
  densitatTM3?: number | null;
  factorEmissioA1?: number | null;
  fontFactorEmissio?: string | null;
  preuBaseEurT?: number | null;
  unitatPreu?: string;
  actiu?: boolean;
  versioBaseDadesId?: string;
}
