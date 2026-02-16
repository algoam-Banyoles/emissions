export type ProjectStatus = "ESBORRANY" | "ACTIU" | "COMPLETAT" | "ARXIUAT";
export type TransitCategory = "TT1" | "TT2" | "TT3" | "TT4" | "TT5";

export interface Project {
  id: string;
  codi: string;
  nom: string;
  descripcio: string | null;
  estat: ProjectStatus;
  organitzacioId: string;
  imd: number | null;
  percentatgeVp: number | null;
  categoriaTransitAuto?: TransitCategory | null;
  categoriaTransitManual?: TransitCategory | null;
  usaCategoriaManual?: boolean;
  tipusTracat: string | null;
  zonaClimatica: string | null;
  vidaUtil: number | null;
  creixementAnual: number | null;
  latitud: number | null;
  longitud: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectActivity {
  id: string;
  tipus: string;
  timestamp: string;
  descripcio: string;
}

export interface ProjectDetail extends Project {
  activitats: ProjectActivity[];
}

export interface PaginatedProjects {
  items: Project[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export type TipologiaFirme = "NOVA_CONSTRUCCIO" | "REFORC" | "RECICLATGE" | "AUTL";
export type TipusCapa = "RODAMENT" | "INTERMEDIA" | "BASE" | "SUBBASE" | "FONAMENT";

export interface CapaFirme {
  tipus: TipusCapa;
  nom: string;
  gruixCm: number;
  modulElasticMpa: number;
  coeficientPoisson: number;
}

export interface EstructuraVerificacio {
  viable: boolean;
  ratios: {
    fatiga: number;
    aixecament: number;
  };
  deformacions: {
    epsilonTraccioMicro: number;
    epsilonCompressioMicro: number;
    deformacioSuperficialMm: number;
  };
}

export interface EstructuraViable {
  id: string;
  capes: CapaFirme[];
  gruixTotalCm: number;
  verificacio: EstructuraVerificacio;
  emissions?: {
    totalKgT: number;
    kgM2: number;
    nivell: "BAIX" | "MITJA" | "ALT";
    distanciaMaterialsKm: number;
    distanciaMesclaKm: number;
  };
  costos?: {
    materialEurM2: number;
    transportEurM2: number;
    fabricacioEurM2: number;
    posadaObraEurM2: number;
    totalEurM2: number;
    costAnyVidaUtilEurM2: number;
    areaM2: number;
    vidaUtilAnys: number;
    perCapa: {
      tipus: TipusCapa;
      nom: string;
      gruixCm: number;
      massaTones: number;
      distanciaKm: number;
      preuMaterialEurT: number;
      costMaterialEurM2: number;
      costTransportEurM2: number;
      costTotalEurM2: number;
    }[];
  };
}

export interface EstructuresSyncResponse {
  mode: "sync";
  cacheHit: boolean;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  items: EstructuraViable[];
  meta: {
    combinacionsTotals: number;
    viablesTotals: number;
  };
}

export interface EstructuresAsyncAccepted {
  mode: "async";
  jobId: string;
  status: "queued" | "processing";
  progress: number;
}

export interface EstructuresAsyncCompleted {
  mode: "async";
  jobId: string;
  status: "completed";
  progress: number;
  result: EstructuresSyncResponse;
}

export interface EstructuresAsyncFailed {
  mode: "async";
  jobId: string;
  status: "failed";
  progress: number;
  error: string;
}

export type EstructuresGenerationResponse =
  | EstructuresSyncResponse
  | EstructuresAsyncAccepted
  | EstructuresAsyncCompleted
  | EstructuresAsyncFailed;
