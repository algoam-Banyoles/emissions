import { beforeEach, describe, expect, it, vi } from "vitest";

const cacheState = vi.hoisted(() => ({
  storage: new Map<string, string>(),
}));

vi.mock("../config/env.js", () => ({
  env: {
    ORS_API_KEY: "test-key",
    ORS_BASE_URL: "https://ors.test",
    ORS_PROFILE: "driving-car",
    ROUTE_CACHE_TTL_SECONDS: 60,
  },
}));

vi.mock("../config/redis.js", () => ({
  routeCacheClient: {
    get: vi.fn(async (key: string) => cacheState.storage.get(key) ?? null),
    setex: vi.fn(async (key: string, _seconds: number, value: string) => {
      cacheState.storage.set(key, value);
    }),
  },
}));

import { gisService } from "./gis.service.js";

describe("gisService", () => {
  beforeEach(() => {
    cacheState.storage.clear();
    vi.restoreAllMocks();
  });

  it("calcula ruta amb OpenRouteService", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          features: [
            {
              geometry: { coordinates: [[2.1, 41.3], [2.2, 41.4]] },
              properties: { summary: { distance: 12000, duration: 900 } },
            },
          ],
        }),
        { status: 200 },
      ),
    );

    const route = await gisService.calcularRuta({ lat: 41.3, lng: 2.1 }, { lat: 41.4, lng: 2.2 });

    expect(route.summary.provider).toBe("openrouteservice");
    expect(route.summary.distanceKm).toBeCloseTo(12);
    expect(route.geometry).toHaveLength(2);
    expect(route.summary.cached).toBe(false);
  });

  it("retorna ruta cachejada en segona crida", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          features: [
            {
              geometry: { coordinates: [[2.1, 41.3], [2.2, 41.4]] },
              properties: { summary: { distance: 1000, duration: 100 } },
            },
          ],
        }),
        { status: 200 },
      ),
    );

    const first = await gisService.calcularRuta({ lat: 41.3, lng: 2.1 }, { lat: 41.4, lng: 2.2 });
    const second = await gisService.calcularRuta({ lat: 41.3, lng: 2.1 }, { lat: 41.4, lng: 2.2 });

    expect(first.summary.cached).toBe(false);
    expect(second.summary.cached).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("usa fallback si ORS falla", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}", { status: 500 }));

    const route = await gisService.calcularDistanciaCarretera({ lat: 41.3, lng: 2.1 }, { lat: 41.4, lng: 2.2 });

    expect(route.summary.provider).toBe("fallback");
    expect(route.geometry).toHaveLength(2);
    expect(route.summary.distanceKm).toBeGreaterThan(0);
  });

  it("calcula distancia lineal en metres", () => {
    const result = gisService.calcularDistanciaLineal({ lat: 41.3, lng: 2.1 }, { lat: 41.4, lng: 2.2 });
    expect(result.metres).toBeGreaterThan(0);
    expect(result.kilometres).toBeGreaterThan(0);
    expect(result.factorFallbackCarretera).toBeCloseTo(1.3);
  });

  it("geocodifica inversa", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          display_name: "Carrer de Prova 123, Barcelona",
        }),
        { status: 200 },
      ),
    );

    const result = await gisService.geocodificarInversa({ lat: 41.387, lng: 2.168 });
    expect(result.adreca).toContain("Barcelona");
    expect(result.coordinates.lat).toBeCloseTo(41.387);
  });

  it("calcula rutes en batch", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(
      async () =>
        new Response(
          JSON.stringify({
            features: [
              {
                geometry: { coordinates: [[2.1, 41.3], [2.2, 41.4]] },
                properties: { summary: { distance: 12000, duration: 900 } },
              },
            ],
          }),
          { status: 200 },
        ),
    );

    const routes = await gisService.batchCalcularRutes(
      { lat: 41.3, lng: 2.1 },
      [
        { lat: 41.4, lng: 2.2 },
        { lat: 41.45, lng: 2.25 },
      ],
    );

    expect(routes).toHaveLength(2);
    expect(routes[0]?.summary.distanceMeters).toBeGreaterThan(0);
  });
});
