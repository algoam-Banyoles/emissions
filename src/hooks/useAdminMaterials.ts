import { useCallback, useState } from "react";

import { api } from "@/services/api";
import {
  type DataVersion,
  type ImportPricesPayload,
  type Material,
  type MaterialPayload,
  type PaginatedMaterials,
  type VersionComparison,
} from "@/types/material";

interface MaterialsFilters {
  page?: number;
  pageSize?: number;
  nom?: string;
  tipus?: string;
  versioBaseDadesId?: string;
  actiu?: boolean;
}

export function useAdminMaterials() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listMaterials = useCallback(async (filters: MaterialsFilters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<PaginatedMaterials>("/admin/materials", { params: filters });
      return data;
    } catch {
      setError("No s'han pogut carregar els materials");
      throw new Error("No s'han pogut carregar els materials");
    } finally {
      setLoading(false);
    }
  }, []);

  const createMaterial = useCallback(async (payload: MaterialPayload) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post<Material>("/admin/materials", payload);
      return data;
    } catch {
      setError("No s'ha pogut crear el material");
      throw new Error("No s'ha pogut crear el material");
    } finally {
      setLoading(false);
    }
  }, []);

  const updateMaterial = useCallback(async (id: string, payload: Partial<MaterialPayload>) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.put<Material>(`/admin/materials/${id}`, payload);
      return data;
    } catch {
      setError("No s'ha pogut actualitzar el material");
      throw new Error("No s'ha pogut actualitzar el material");
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteMaterial = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await api.delete(`/admin/materials/${id}`);
    } catch {
      setError("No s'ha pogut eliminar el material");
      throw new Error("No s'ha pogut eliminar el material");
    } finally {
      setLoading(false);
    }
  }, []);

  const listVersions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<DataVersion[]>("/admin/versions");
      return data;
    } catch {
      setError("No s'han pogut carregar les versions");
      throw new Error("No s'han pogut carregar les versions");
    } finally {
      setLoading(false);
    }
  }, []);

  const publishVersion = useCallback(
    async (payload: { numero: string; descripcio?: string; esActual?: boolean }) => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.post<DataVersion>("/admin/versions", payload);
        return data;
      } catch {
        setError("No s'ha pogut publicar la versio");
        throw new Error("No s'ha pogut publicar la versio");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const activateVersion = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post<DataVersion>(`/admin/versions/${id}/activate`);
      return data;
    } catch {
      setError("No s'ha pogut activar la versio");
      throw new Error("No s'ha pogut activar la versio");
    } finally {
      setLoading(false);
    }
  }, []);

  const compareVersions = useCallback(async (from: string, to: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<VersionComparison>("/admin/versions/compare", {
        params: { from, to },
      });
      return data;
    } catch {
      setError("No s'han pogut comparar les versions");
      throw new Error("No s'han pogut comparar les versions");
    } finally {
      setLoading(false);
    }
  }, []);

  const importPrices = useCallback(async (payload: ImportPricesPayload) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post<{ version: DataVersion; imported: number }>(
        "/admin/importar-preus",
        payload,
      );
      return data;
    } catch {
      setError("No s'ha pogut importar el fitxer");
      throw new Error("No s'ha pogut importar el fitxer");
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    listMaterials,
    createMaterial,
    updateMaterial,
    deleteMaterial,
    listVersions,
    publishVersion,
    activateVersion,
    compareVersions,
    importPrices,
  };
}
