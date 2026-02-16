import { z } from "zod";

import { HttpError } from "../utils/http-error.js";

const overpassElementSchema = z.object({
  id: z.number(),
  lat: z.number().optional(),
  lon: z.number().optional(),
  center: z
    .object({
      lat: z.number(),
      lon: z.number(),
    })
    .optional(),
  tags: z.record(z.string(), z.string()).optional(),
});

const overpassResponseSchema = z.object({
  elements: z.array(overpassElementSchema).default([]),
});

export interface OsmNearbyLocation {
  externalId: string;
  nom: string;
  latitud: number;
  longitud: number;
  adreca: string | null;
  tipus: "PEDRERA";
  font: "OSM_OVERPASS";
}

function normalizeLocationName(tags?: Record<string, string>) {
  if (!tags) {
    return "Pedrera";
  }
  return tags.name ?? tags.operator ?? tags.brand ?? "Pedrera";
}

export const osmService = {
  async buscarPedreresOSM(lat: number, lng: number, radiusKm: number): Promise<OsmNearbyLocation[]> {
    const radiusMeters = Math.round(radiusKm * 1000);
    const query = `
[out:json];
(
  node["industry"="quarry"](around:${radiusMeters},${lat},${lng});
  way["industry"="quarry"](around:${radiusMeters},${lat},${lng});
);
out center tags;
`;

    const response = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=UTF-8",
        "User-Agent": "emissionsv2-osm-import/1.0",
      },
      body: query,
    });

    if (!response.ok) {
      throw new HttpError(502, "No s'han pogut obtenir dades d'OSM");
    }

    const payload = overpassResponseSchema.parse(await response.json());

    return payload.elements
      .map((element) => {
        const latitud = element.lat ?? element.center?.lat;
        const longitud = element.lon ?? element.center?.lon;
        if (latitud === undefined || longitud === undefined) {
          return null;
        }
        const name = normalizeLocationName(element.tags);
        const adreca = [element.tags?.["addr:street"], element.tags?.["addr:city"]].filter(Boolean).join(", ");
        return {
          externalId: `osm-${element.id}`,
          nom: name,
          latitud,
          longitud,
          adreca: adreca.length > 0 ? adreca : null,
          tipus: "PEDRERA" as const,
          font: "OSM_OVERPASS" as const,
        };
      })
      .filter((item): item is OsmNearbyLocation => item !== null);
  },
};

