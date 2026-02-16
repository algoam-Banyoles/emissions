import { api } from "@/services/api";
import { type TipusUbicacio, type Ubicacio } from "@/types/gis";

export interface OSMRawResult {
  elements: {
    id: number;
    lat?: number;
    lon?: number;
    center?: { lat: number; lon: number };
    tags?: Record<string, string>;
  }[];
}

export interface NearbyUbicacio extends Ubicacio {
  distanciaMetres: number;
  distanciaKm: number;
}

export interface OSMImportResult {
  totalDetectades: number;
  importades: number;
  duplicades: number;
  radiusKm: number;
  items: {
    id: string;
    nom: string;
    latitud: number;
    longitud: number;
    adreca: string | null;
    tipus: TipusUbicacio;
  }[];
}

export async function buscarPedreresOSM(lat: number, lng: number, radiusKm: number) {
  const query = `
[out:json];
(
  node["industry"="quarry"](around:${radiusKm * 1000},${lat},${lng});
  way["industry"="quarry"](around:${radiusKm * 1000},${lat},${lng});
);
out center;
`;

  const response = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    body: query,
  });

  if (!response.ok) {
    throw new Error("No s'han pogut consultar les pedreres d'OSM");
  }

  return (await response.json()) as OSMRawResult;
}

export async function importarPedreresOSM(lat: number, lng: number, radiusKm: number) {
  const { data } = await api.post<OSMImportResult>("/ubicacions/importar-osm", {
    lat,
    lng,
    radiusKm,
  });
  return data;
}

export async function obtenirUbicacionsProperes(
  lat: number,
  lng: number,
  radiusKm: number,
  filters: { tipus?: TipusUbicacio; q?: string; limit?: number } = {},
) {
  const { data } = await api.get<NearbyUbicacio[]>("/ubicacions/nearby", {
    params: {
      lat,
      lng,
      radius: radiusKm,
      ...filters,
    },
  });
  return data;
}
