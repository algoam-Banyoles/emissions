export type EmissionsResource =
  | "materials"
  | "transport"
  | "combustibles"
  | "electric"
  | "equips"
  | "limits"
  | "constants";

export interface EmissionsPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface EmissionsListResponse<T = Record<string, unknown>> {
  items: T[];
  pagination: EmissionsPagination;
}

export interface EmissionsHistoryItem {
  id: string;
  versioBaseDadesId: string;
  usuariId: string | null;
  tipusCanvi: string;
  entitat: string;
  registreId: string;
  valorsAnteriors: unknown;
  valorsNous: unknown;
  createdAt: string;
  usuari?: {
    id: string;
    email: string;
  };
  versioBaseDades?: {
    id: string;
    numero: string;
  };
}

export interface EmissionsBulkVersionPayload {
  ids: string[];
  versioBaseDadesId: string;
  confirm: true;
}

export type EmissionsImportCategory = "materials" | "transport" | "combustibles" | "equips";

export interface EmissionsImportIssue {
  row: number;
  field?: string;
  message: string;
}

export interface EmissionsImportPreviewResponse {
  mode: "preview" | "imported";
  categoria: EmissionsImportCategory;
  totalRows: number;
  previewRows: Record<string, unknown>[];
  errors: EmissionsImportIssue[];
  warnings: EmissionsImportIssue[];
  validRows: number;
  importedRows?: number;
  versio?: {
    id: string;
    numero: string;
  };
}

export interface EmissionsExportRequest {
  categoria: EmissionsResource;
  versio?: string;
  format: "csv" | "xlsx";
}

export type ValidationSeverity = "error" | "warning" | "info";
export type ValidationTrigger = "manual" | "import" | "cron";

export interface EmissionsValidationIssue {
  id: string;
  rule: string;
  severity: ValidationSeverity;
  message: string;
  entityType?: string;
  entityId?: string;
  suggestion?: string;
  fixPath?: string;
}

export interface EmissionsValidationSummary {
  totalIssues: number;
  errors: number;
  warnings: number;
  info: number;
  healthScore: number;
  coveragePercentage: number;
  missingMaterials: string[];
}

export interface EmissionsValidationRun {
  runId: string;
  trigger: ValidationTrigger;
  version: {
    id: string;
    numero: string;
  };
  executedAt: string;
  summary: EmissionsValidationSummary;
  issues: EmissionsValidationIssue[];
  alertEmailSent: boolean;
}
