import crypto from "node:crypto";

import { z } from "zod";

import { env } from "../config/env.js";
import { routeCacheClient } from "../config/redis.js";
import { HttpError } from "../utils/http-error.js";

const coordinateSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export type Coordinate = z.infer<typeof coordinateSchema>;

interface RouteSummary {
  distanceMeters: number;
  distanceKm: number;
  durationSeconds: number;
  provider: "openrouteservice" | "fallback";
  cached: boolean;
}

interface RouteResult {
  id: string;
  origin: Coordinate;
  destination: Coordinate;
  geometry: Coordinate[];
  summary: RouteSummary;
}

interface GeocodeResult {
  label: string;
  lat: number;
  lng: number;
}

const fallbackDistanceFactor = 1.3;

function haversineDistanceMeters(a: Coordinate, b: Coordinate) {
  const radius = 6371000;
  const toRadians = (value: number) => (value * Math.PI) / 180;

  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);

  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
  const y = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));

  return radius * y;
}

function buildCacheKey(origin: Coordinate, destination: Coordinate, profile: string) {
  const rawKey = `${profile}:${origin.lat.toFixed(6)},${origin.lng.toFixed(6)}:${destination.lat.toFixed(6)},${destination.lng.toFixed(6)}`;
  return `gis:route:${crypto.createHash("sha1").update(rawKey).digest("hex")}`;
}

function parseCoordinateArray(coordinates: unknown): Coordinate[] {
  if (!Array.isArray(coordinates)) {
    return [];
  }

  return coordinates
    .map((coord) => {
      if (!Array.isArray(coord) || coord.length < 2) {
        return null;
      }
      const lng = Number(coord[0]);
      const lat = Number(coord[1]);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        return null;
      }
      return { lat, lng };
    })
    .filter((coord): coord is Coordinate => Boolean(coord));
}

async function callOpenRouteService(origin: Coordinate, destination: Coordinate): Promise<RouteResult | null> {
  if (!env.ORS_API_KEY) {
    return null;
  }

  const url = `${env.ORS_BASE_URL}/v2/directions/${env.ORS_PROFILE}/geojson`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: env.ORS_API_KEY,
    },
    body: JSON.stringify({
      coordinates: [
        [origin.lng, origin.lat],
        [destination.lng, destination.lat],
      ],
    }),
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as {
    features?: {
      geometry?: { coordinates?: unknown };
      properties?: { summary?: { distance?: number; duration?: number } };
    }[];
  };

  const feature = payload.features?.[0];
  if (!feature) {
    return null;
  }

  const geometry = parseCoordinateArray(feature.geometry?.coordinates);
  const distanceMeters = Number(feature.properties?.summary?.distance ?? 0);
  const durationSeconds = Number(feature.properties?.summary?.duration ?? 0);

  if (geometry.length < 2 || !Number.isFinite(distanceMeters) || distanceMeters <= 0) {
    return null;
  }

  return {
    id: crypto.randomUUID(),
    origin,
    destination,
    geometry,
    summary: {
      distanceMeters,
      distanceKm: distanceMeters / 1000,
      durationSeconds: Number.isFinite(durationSeconds) ? durationSeconds : 0,
      provider: "openrouteservice",
      cached: false,
    },
  };
}

function fallbackRoute(origin: Coordinate, destination: Coordinate): RouteResult {
  const distanceMeters = haversineDistanceMeters(origin, destination) * fallbackDistanceFactor;
  return {
    id: crypto.randomUUID(),
    origin,
    destination,
    geometry: [origin, destination],
    summary: {
      distanceMeters,
      distanceKm: distanceMeters / 1000,
      durationSeconds: (distanceMeters / 1000 / 60) * 3600,
      provider: "fallback",
      cached: false,
    },
  };
}

async function fetchGeocode(adreca: string): Promise<GeocodeResult[]> {
  const cleanQuery = adreca.trim();
  if (cleanQuery.length < 3) {
    throw new HttpError(400, "La cerca ha de tenir almenys 3 caracters");
  }

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "8");
  url.searchParams.set("q", cleanQuery);

  const response = await fetch(url, {
    headers: {
      "User-Agent": "emissionsv2-geocoder/1.0",
    },
  });

  if (!response.ok) {
    throw new HttpError(502, "No s'ha pogut completar la geocodificacio");
  }

  const data = (await response.json()) as {
    display_name: string;
    lat: string;
    lon: string;
  }[];

  return data.map((item) => ({
    label: item.display_name,
    lat: Number(item.lat),
    lng: Number(item.lon),
  }));
}

async function fetchReverseGeocode(coordinates: Coordinate): Promise<string> {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("lat", String(coordinates.lat));
  url.searchParams.set("lon", String(coordinates.lng));

  const response = await fetch(url, {
    headers: {
      "User-Agent": "emissionsv2-geocoder/1.0",
    },
  });

  if (!response.ok) {
    throw new HttpError(502, "No s'ha pogut completar la geocodificacio inversa");
  }

  const data = (await response.json()) as { display_name?: string };
  if (!data.display_name) {
    throw new HttpError(404, "No s'ha trobat una adreca per les coordenades indicades");
  }

  return data.display_name;
}

export const gisService = {
  parseCoordinate(value: unknown) {
    return coordinateSchema.parse(value);
  },

  async geocodificarAdreca(adreca: string) {
    return await fetchGeocode(adreca);
  },

  async geocodificarInversa(coordenadesInput: unknown) {
    const coordenades = coordinateSchema.parse(coordenadesInput);
    const adreca = await fetchReverseGeocode(coordenades);
    return {
      adreca,
      coordinates: coordenades,
    };
  },

  calcularDistanciaLineal(p1Input: unknown, p2Input: unknown) {
    const p1 = coordinateSchema.parse(p1Input);
    const p2 = coordinateSchema.parse(p2Input);
    const metres = haversineDistanceMeters(p1, p2);

    return {
      metres,
      kilometres: metres / 1000,
      factorFallbackCarretera: fallbackDistanceFactor,
    };
  },

  async calcularDistanciaCarretera(origenInput: unknown, destiInput: unknown): Promise<RouteResult> {
    const origin = coordinateSchema.parse(origenInput);
    const destination = coordinateSchema.parse(destiInput);

    const cacheKey = buildCacheKey(origin, destination, env.ORS_PROFILE);
    const cached = await routeCacheClient.get(cacheKey);

    if (cached) {
      const parsed = JSON.parse(cached) as RouteResult;
      return {
        ...parsed,
        summary: {
          ...parsed.summary,
          cached: true,
        },
      };
    }

    const routeFromProvider = await callOpenRouteService(origin, destination);
    const route = routeFromProvider ?? fallbackRoute(origin, destination);

    await routeCacheClient.setex(cacheKey, env.ROUTE_CACHE_TTL_SECONDS, JSON.stringify(route));

    return route;
  },

  async batchCalcularRutes(origenInput: unknown, destinacionsInput: unknown): Promise<RouteResult[]> {
    const origin = coordinateSchema.parse(origenInput);
    const destinacions = z.array(coordinateSchema).min(1).max(100).parse(destinacionsInput);

    return await Promise.all(destinacions.map(async (destination) => await this.calcularDistanciaCarretera(origin, destination)));
  },

  async calcularRuta(origenInput: unknown, destiInput: unknown): Promise<RouteResult> {
    return await this.calcularDistanciaCarretera(origenInput, destiInput);
  },

  async geocodeAddress(query: string) {
    return await this.geocodificarAdreca(query);
  },
};
