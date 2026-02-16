import { useCallback, useState } from "react";

import { api } from "@/services/api";
import {
  type OptimizationWeights,
  type ParetoOptimizationResult,
  type SensibilitatResult,
  type WeightedOptimizationResult,
} from "@/types/optimization";
import {
  type EstructuresGenerationResponse,
  type PaginatedProjects,
  type Project,
  type ProjectDetail,
  type ProjectStatus,
  type TransitCategory,
  type TipologiaFirme,
} from "@/types/project";

export interface ProjectFilters {
  page?: number;
  pageSize?: number;
  nom?: string;
  estat?: ProjectStatus;
  dateFrom?: string;
  dateTo?: string;
}

export interface ProjectPayload {
  codi: string;
  nom: string;
  descripcio?: string | null | undefined;
  estat?: ProjectStatus | undefined;
  imd?: number | null | undefined;
  percentatgeVp?: number | null | undefined;
  categoriaTransitManual?: TransitCategory | null | undefined;
  usaCategoriaManual?: boolean | undefined;
  tipusTracat?: string | null | undefined;
  zonaClimatica?: string | null | undefined;
  vidaUtil?: number | null | undefined;
  creixementAnual?: number | null | undefined;
  latitud?: number | null | undefined;
  longitud?: number | null | undefined;
}

export interface EstructuresCapaRestriccioPayload {
  tipus: "RODAMENT" | "INTERMEDIA" | "BASE" | "SUBBASE" | "FONAMENT";
  gruixMinCm: number;
  gruixMaxCm: number;
  pasCm: number;
  modulElasticMpa: number;
  nom?: string;
}

export interface EstructuresRestriccionsPayload {
  tipologia: TipologiaFirme;
  page?: number;
  pageSize?: number;
  asynchronous?: boolean;
  maxGruixTotalCm?: number;
  limitCombinacions?: number;
  modulFonamentMpa?: number;
  distanciaMaterialsKm?: number;
  distanciaMesclaKm?: number;
  areaM2?: number;
  vidaUtilAnys?: number;
  tarifaTransportEurTKm?: number;
  tarifaFabricacioEurT?: number;
  tarifaPosadaObraEurM2?: number;
  preuMaterialPerTipus?: Partial<Record<"RODAMENT" | "INTERMEDIA" | "BASE" | "SUBBASE" | "FONAMENT", number>>;
  materialsPermesos?: string[];
  capes?: EstructuresCapaRestriccioPayload[];
}

export interface EstructuresLlistatFilters {
  page?: number;
  pageSize?: number;
  incloureEmissions?: boolean;
  nivellEmissions?: "BAIX" | "MITJA" | "ALT";
  maxEmissionsKgT?: number;
  minCostEurM2?: number;
  maxCostEurM2?: number;
}

export function useProjects() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleError = (message: string) => {
    setError(message);
  };

  const listProjects = useCallback(async (filters: ProjectFilters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<PaginatedProjects>("/projects", { params: filters });
      return data;
    } catch {
      handleError("No s'han pogut carregar els projectes");
      throw new Error("No s'han pogut carregar els projectes");
    } finally {
      setLoading(false);
    }
  }, []);

  const getProject = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<ProjectDetail>(`/projects/${id}`);
      return data;
    } catch {
      handleError("No s'ha pogut carregar el projecte");
      throw new Error("No s'ha pogut carregar el projecte");
    } finally {
      setLoading(false);
    }
  }, []);

  const createProject = useCallback(async (payload: ProjectPayload) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post<Project>("/projects", payload);
      return data;
    } catch {
      handleError("No s'ha pogut crear el projecte");
      throw new Error("No s'ha pogut crear el projecte");
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProject = useCallback(async (id: string, payload: Partial<ProjectPayload>) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.put<Project>(`/projects/${id}`, payload);
      return data;
    } catch {
      handleError("No s'ha pogut actualitzar el projecte");
      throw new Error("No s'ha pogut actualitzar el projecte");
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteProject = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await api.delete(`/projects/${id}`);
    } catch {
      handleError("No s'ha pogut eliminar el projecte");
      throw new Error("No s'ha pogut eliminar el projecte");
    } finally {
      setLoading(false);
    }
  }, []);

  const generarEstructures = useCallback(async (id: string, restriccions: EstructuresRestriccionsPayload) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post<EstructuresGenerationResponse>(`/projects/${id}/estructures/generar`, restriccions);
      return data;
    } catch {
      handleError("No s'han pogut generar estructures");
      throw new Error("No s'han pogut generar estructures");
    } finally {
      setLoading(false);
    }
  }, []);

  const obtenirEstatGeneracio = useCallback(async (id: string, jobId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<EstructuresGenerationResponse>(`/projects/${id}/estructures/jobs/${jobId}`);
      return data;
    } catch {
      handleError("No s'ha pogut obtenir l'estat de generacio");
      throw new Error("No s'ha pogut obtenir l'estat de generacio");
    } finally {
      setLoading(false);
    }
  }, []);

  const llistarEstructures = useCallback(async (id: string, filters: EstructuresLlistatFilters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<EstructuresGenerationResponse>(`/projects/${id}/estructures`, { params: filters });
      return data;
    } catch {
      handleError("No s'han pogut carregar estructures");
      throw new Error("No s'han pogut carregar estructures");
    } finally {
      setLoading(false);
    }
  }, []);

  const optimitzarPonderacio = useCallback(async (id: string, estructures: unknown[], pesos: OptimizationWeights) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post<WeightedOptimizationResult>(`/projects/${id}/estructures/optimitzacio/ponderacio`, {
        estructures,
        pesos,
      });
      return data;
    } catch {
      handleError("No s'ha pogut executar optimitzacio ponderada");
      throw new Error("No s'ha pogut executar optimitzacio ponderada");
    } finally {
      setLoading(false);
    }
  }, []);

  const optimitzarPareto = useCallback(async (id: string, estructures: unknown[]) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post<ParetoOptimizationResult>(`/projects/${id}/estructures/optimitzacio/pareto`, {
        estructures,
      });
      return data;
    } catch {
      handleError("No s'ha pogut calcular frontera de Pareto");
      throw new Error("No s'ha pogut calcular frontera de Pareto");
    } finally {
      setLoading(false);
    }
  }, []);

  const analisiSensibilitat = useCallback(async (id: string, estructures: unknown[], options?: { increment?: number; robustThresholdPercent?: number }) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post<SensibilitatResult>(`/projects/${id}/estructures/optimitzacio/sensibilitat`, {
        estructures,
        options,
      });
      return data;
    } catch {
      handleError("No s'ha pogut executar analisi de sensibilitat");
      throw new Error("No s'ha pogut executar analisi de sensibilitat");
    } finally {
      setLoading(false);
    }
  }, []);

  const exportarBimIfc = useCallback(async (id: string, estructura: unknown, fileName = "export.ifc") => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post(`/projects/${id}/bim/export`, { estructura }, { responseType: "blob" });
      const blob = new Blob([response.data], { type: "application/x-step" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      handleError("No s'ha pogut exportar l'arxiu IFC");
      throw new Error("No s'ha pogut exportar l'arxiu IFC");
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    listProjects,
    getProject,
    createProject,
    updateProject,
    deleteProject,
    generarEstructures,
    obtenirEstatGeneracio,
    llistarEstructures,
    optimitzarPonderacio,
    optimitzarPareto,
    analisiSensibilitat,
    exportarBimIfc,
  };
}
