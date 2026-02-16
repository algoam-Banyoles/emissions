import { useCallback, useState } from "react";

import { api } from "@/services/api";
import {
  type EmissionsBulkVersionPayload,
  type EmissionsExportRequest,
  type EmissionsHistoryItem,
  type EmissionsImportCategory,
  type EmissionsImportPreviewResponse,
  type EmissionsListResponse,
  type EmissionsResource,
  type EmissionsValidationRun,
} from "@/types/emissions-admin";
import { type DataVersion } from "@/types/material";

interface EmissionsListFilters {
  page?: number;
  pageSize?: number;
  q?: string;
  versioBaseDadesId?: string;
  actiu?: boolean;
}

export function useEmissionsAdmin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const withState = useCallback(async <T,>(action: () => Promise<T>, errorMessage: string) => {
    setLoading(true);
    setError(null);
    try {
      return await action();
    } catch {
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const listFactors = useCallback(
    async (resource: EmissionsResource, filters: EmissionsListFilters = {}) =>
      await withState(
        async () => {
          const { data } = await api.get<EmissionsListResponse>(`/admin/emissions/${resource}`, {
            params: filters,
          });
          return data;
        },
        "No s'han pogut carregar els factors",
      ),
    [withState],
  );

  const createFactor = useCallback(
    async (resource: EmissionsResource, payload: Record<string, unknown>) =>
      await withState(
        async () => {
          const { data } = await api.post(`/admin/emissions/${resource}`, payload);
          return data;
        },
        "No s'ha pogut crear el factor",
      ),
    [withState],
  );

  const updateFactor = useCallback(
    async (resource: EmissionsResource, id: string, payload: Record<string, unknown>) =>
      await withState(
        async () => {
          const { data } = await api.put(`/admin/emissions/${resource}/${id}`, payload);
          return data;
        },
        "No s'ha pogut actualitzar el factor",
      ),
    [withState],
  );

  const deleteFactor = useCallback(
    async (resource: EmissionsResource, id: string) =>
      await withState(
        async () => {
          await api.delete(`/admin/emissions/${resource}/${id}`);
        },
        "No s'ha pogut eliminar el factor",
      ),
    [withState],
  );

  const bulkUpdateVersion = useCallback(
    async (resource: EmissionsResource, payload: EmissionsBulkVersionPayload) =>
      await withState(
        async () => {
          const { data } = await api.post(`/admin/emissions/${resource}/bulk/update-version`, payload);
          return data;
        },
        "No s'ha pogut aplicar l'accio massiva",
      ),
    [withState],
  );

  const exportCsv = useCallback(
    async (resource: EmissionsResource, ids: string[]) =>
      await withState(
        async () => {
          const { data } = await api.get<string>(`/admin/emissions/${resource}/export`, {
            params: ids.length > 0 ? { ids: ids.join(",") } : {},
            responseType: "text",
          });
          return data;
        },
        "No s'ha pogut exportar el CSV",
      ),
    [withState],
  );

  const listHistory = useCallback(
    async (resource?: EmissionsResource) =>
      await withState(
        async () => {
          const { data } = await api.get<EmissionsListResponse<EmissionsHistoryItem>>(
            "/admin/emissions/history",
            {
              params: resource ? { resource } : {},
            },
          );
          return data;
        },
        "No s'ha pogut carregar l'historial",
      ),
    [withState],
  );

  const revertHistory = useCallback(
    async (logId: string) =>
      await withState(
        async () => {
          const { data } = await api.post(`/admin/emissions/history/${logId}/revert`, {
            confirm: true,
          });
          return data;
        },
        "No s'ha pogut revertir el canvi",
      ),
    [withState],
  );

  const listVersions = useCallback(
    async () =>
      await withState(
        async () => {
          const { data } = await api.get<DataVersion[]>("/admin/versions");
          return data;
        },
        "No s'han pogut carregar les versions",
      ),
    [withState],
  );

  const previewImport = useCallback(
    async (categoria: EmissionsImportCategory, file: File, delimiter?: ";" | ",") =>
      await withState(
        async () => {
          const formData = new FormData();
          formData.append("categoria", categoria);
          formData.append("file", file);
          formData.append("confirm", "false");
          if (delimiter) {
            formData.append("delimiter", delimiter);
          }

          const { data } = await api.post<EmissionsImportPreviewResponse>("/admin/emissions/importar", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          return data;
        },
        "No s'ha pogut previsualitzar la importacio",
      ),
    [withState],
  );

  const importFactors = useCallback(
    async (params: {
      categoria: EmissionsImportCategory;
      file: File;
      delimiter?: ";" | ",";
      numeroVersio?: string;
      descripcio?: string;
    }) =>
      await withState(
        async () => {
          const formData = new FormData();
          formData.append("categoria", params.categoria);
          formData.append("file", params.file);
          formData.append("confirm", "true");
          if (params.delimiter) {
            formData.append("delimiter", params.delimiter);
          }
          if (params.numeroVersio) {
            formData.append("numeroVersio", params.numeroVersio);
          }
          if (params.descripcio) {
            formData.append("descripcio", params.descripcio);
          }

          const { data } = await api.post<EmissionsImportPreviewResponse>("/admin/emissions/importar", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          return data;
        },
        "No s'ha pogut completar la importacio",
      ),
    [withState],
  );

  const exportFactors = useCallback(
    async (params: EmissionsExportRequest) =>
      await withState(
        async () => {
          const { data, headers } = await api.get<ArrayBuffer>("/admin/emissions/exportar", {
            params,
            responseType: "arraybuffer",
          });
          return {
            data,
            fileName:
              String(headers["content-disposition"] ?? "")
                .replace("attachment; filename=", "")
                .replaceAll('"', "") || `emissions-${params.categoria}.${params.format}`,
          };
        },
        "No s'ha pogut exportar el fitxer",
      ),
    [withState],
  );

  const runValidation = useCallback(
    async () =>
      await withState(
        async () => {
          const { data } = await api.post<EmissionsValidationRun>("/admin/emissions/validacio/executar");
          return data;
        },
        "No s'ha pogut executar la validacio",
      ),
    [withState],
  );

  const getLatestValidation = useCallback(
    async () =>
      await withState(
        async () => {
          const { data } = await api.get<EmissionsValidationRun | null>("/admin/emissions/validacio/ultima");
          return data;
        },
        "No s'ha pogut carregar l'ultima validacio",
      ),
    [withState],
  );

  const getValidationHistory = useCallback(
    async (limit = 20) =>
      await withState(
        async () => {
          const { data } = await api.get<EmissionsValidationRun[]>("/admin/emissions/validacio/historial", {
            params: { limit },
          });
          return data;
        },
        "No s'ha pogut carregar l'historial de validacions",
      ),
    [withState],
  );

  return {
    loading,
    error,
    listFactors,
    createFactor,
    updateFactor,
    deleteFactor,
    bulkUpdateVersion,
    exportCsv,
    listHistory,
    previewImport,
    importFactors,
    exportFactors,
    runValidation,
    getLatestValidation,
    getValidationHistory,
    revertHistory,
    listVersions,
  };
}
