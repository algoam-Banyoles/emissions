export type TipusUbicacio = "OBRA" | "PLANTA" | "PEDRERA" | "ALTRE";

export interface Coordinate {
  lat: number;
  lng: number;
}

export interface Ubicacio {
  id: string;
  nom: string;
  tipus: TipusUbicacio;
  descripcio: string | null;
  adreca: string | null;
  latitud: number;
  longitud: number;
  organitzacioId: string;
  actiu: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GeocodeResult {
  label: string;
  lat: number;
  lng: number;
}

export interface ReverseGeocodeResult {
  adreca: string;
  coordinates: Coordinate;
}

export interface GISRouteResult {
  id: string;
  origin: Coordinate;
  destination: Coordinate;
  geometry: Coordinate[];
  summary: {
    distanceMeters: number;
    distanceKm: number;
    durationSeconds: number;
    provider: "openrouteservice" | "fallback";
    cached: boolean;
  };
}

export interface LinearDistanceResult {
  metres: number;
  kilometres: number;
  factorFallbackCarretera: number;
}
