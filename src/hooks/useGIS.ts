import { useCallback, useState } from "react";

import { api } from "@/services/api";
import {
  type Coordinate,
  type GeocodeResult,
  type GISRouteResult,
  type LinearDistanceResult,
  type ReverseGeocodeResult,
  type Ubicacio,
} from "@/types/gis";

interface ListUbicacionsFilters {
  tipus?: string;
  q?: string;
  actiu?: boolean;
}

export function useGIS() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const withState = useCallback(async <T,>(action: () => Promise<T>, message: string) => {
    setLoading(true);
    setError(null);
    try {
      return await action();
    } catch {
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const geocodeAddress = useCallback(
    async (query: string) =>
      await withState(
        async () => {
          const { data } = await api.get<GeocodeResult[]>("/gis/geocode", {
            params: { q: query },
          });
          return data;
        },
        "No s'ha pogut geocodificar l'adreca",
      ),
    [withState],
  );

  const calcularRuta = useCallback(
    async (origen: Coordinate, desti: Coordinate) =>
      await withState(
        async () => {
          const { data } = await api.post<GISRouteResult>("/gis/distance/carretera", { origen, desti });
          return data;
        },
        "No s'ha pogut calcular la ruta",
      ),
    [withState],
  );

  const calcularDistanciaLineal = useCallback(
    async (origen: Coordinate, desti: Coordinate) =>
      await withState(
        async () => {
          const { data } = await api.post<LinearDistanceResult>("/gis/distance/lineal", { origen, desti });
          return data;
        },
        "No s'ha pogut calcular la distancia lineal",
      ),
    [withState],
  );

  const geocodeReverse = useCallback(
    async (coords: Coordinate) =>
      await withState(
        async () => {
          const { data } = await api.get<ReverseGeocodeResult>("/gis/reverse-geocode", {
            params: coords,
          });
          return data;
        },
        "No s'ha pogut geocodificar inversament",
      ),
    [withState],
  );

  const batchCalcularRutes = useCallback(
    async (origen: Coordinate, destinacions: Coordinate[]) =>
      await withState(
        async () => {
          const { data } = await api.post<GISRouteResult[]>("/gis/routes/batch", { origen, destinacions });
          return data;
        },
        "No s'han pogut calcular les rutes en batch",
      ),
    [withState],
  );

  const listUbicacions = useCallback(
    async (filters: ListUbicacionsFilters = {}) =>
      await withState(
        async () => {
          const { data } = await api.get<Ubicacio[]>("/ubicacions", { params: filters });
          return data;
        },
        "No s'han pogut carregar les ubicacions",
      ),
    [withState],
  );

  const createUbicacio = useCallback(
    async (payload: Omit<Ubicacio, "id" | "organitzacioId" | "createdAt" | "updatedAt">) =>
      await withState(
        async () => {
          const { data } = await api.post<Ubicacio>("/ubicacions", payload);
          return data;
        },
        "No s'ha pogut crear la ubicacio",
      ),
    [withState],
  );

  return {
    loading,
    error,
    geocodeAddress,
    geocodeReverse,
    calcularRuta,
    calcularDistanciaLineal,
    batchCalcularRutes,
    listUbicacions,
    createUbicacio,
  };
}
