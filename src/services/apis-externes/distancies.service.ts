import { api } from "@/services/api";
import { type Coordinate, type GISRouteResult } from "@/types/gis";

interface OpenRouteSummary {
  distance: number;
  duration: number;
}

interface OpenRouteResponse {
  features?: {
    properties?: {
      summary?: OpenRouteSummary;
    };
    geometry?: {
      coordinates?: number[][];
    };
  }[];
}

export async function calcularRutaORS(origen: Coordinate, desti: Coordinate) {
  const apiKey = import.meta.env["VITE_OPENROUTESERVICE_API_KEY"];

  if (apiKey) {
    const response = await fetch(
      `https://api.openrouteservice.org/v2/directions/driving-hgv?api_key=${apiKey}&start=${origen.lng},${origen.lat}&end=${desti.lng},${desti.lat}`,
    );

    if (response.ok) {
      const data = (await response.json()) as OpenRouteResponse;
      const feature = data.features?.[0];
      const summary = feature?.properties?.summary;
      const geometry = feature?.geometry?.coordinates ?? [];

      if (summary) {
        return {
          distanciaKm: summary.distance / 1000,
          duradaMin: summary.duration / 60,
          geometria: geometry.map((point) => ({ lat: point[1], lng: point[0] })),
        };
      }
    }
  }

  const { data } = await api.post<GISRouteResult>("/gis/distance/carretera", {
    origen,
    desti,
  });
  return {
    distanciaKm: data.summary.distanceKm,
    duradaMin: data.summary.durationSeconds / 60,
    geometria: data.geometry,
  };
}
