import express from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";

vi.mock("../middlewares/auth.middleware.js", () => ({
  authMiddleware: (
    req: { auth?: { organitzacioId: string; userId: string; rol: string; email: string } },
    _res: unknown,
    next: () => void,
  ) => {
    req.auth = {
      userId: "u-test",
      organitzacioId: "org-1",
      rol: "ADMIN",
      email: "test@org.com",
    };
    next();
  },
}));

vi.mock("../services/gis.service.js", () => ({
  gisService: {
    calcularRuta: vi.fn(async () => ({ id: "r-1", summary: { distanceKm: 1 } })),
    geocodificarAdreca: vi.fn(async () => [{ label: "Barcelona", lat: 41.38, lng: 2.17 }]),
    geocodificarInversa: vi.fn(async () => ({ adreca: "Barcelona", coordinates: { lat: 41.38, lng: 2.17 } })),
    calcularDistanciaLineal: vi.fn(() => ({ metres: 1200, kilometres: 1.2, factorFallbackCarretera: 1.3 })),
    calcularDistanciaCarretera: vi.fn(async () => ({ id: "r-2", summary: { distanceKm: 2 } })),
    batchCalcularRutes: vi.fn(async () => [{ id: "r-3", summary: { distanceKm: 3 } }]),
  },
}));

import { gisRoutes } from "./gis.routes.js";

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/gis", gisRoutes);
  app.use((error: { statusCode?: number; message?: string }, _req: unknown, res: { status: (code: number) => { json: (payload: unknown) => void } }) => {
    res.status(error.statusCode ?? 500).json({ message: error.message ?? "error" });
  });
  return app;
}

describe("gis routes", () => {
  it("respon endpoints nous", async () => {
    const app = buildApp();

    const geocode = await request(app).get("/api/gis/geocode").query({ q: "Barcelona" });
    expect(geocode.status).toBe(200);

    const reverse = await request(app).get("/api/gis/reverse-geocode").query({ lat: 41.38, lng: 2.17 });
    expect(reverse.status).toBe(200);

    const lineal = await request(app).post("/api/gis/distance/lineal").send({ origen: { lat: 41.3, lng: 2.1 }, desti: { lat: 41.4, lng: 2.2 } });
    expect(lineal.status).toBe(200);

    const carretera = await request(app).post("/api/gis/distance/carretera").send({ origen: { lat: 41.3, lng: 2.1 }, desti: { lat: 41.4, lng: 2.2 } });
    expect(carretera.status).toBe(200);

    const batch = await request(app)
      .post("/api/gis/routes/batch")
      .send({ origen: { lat: 41.3, lng: 2.1 }, destinacions: [{ lat: 41.4, lng: 2.2 }] });
    expect(batch.status).toBe(200);
  });
});
