import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../middlewares/auth.middleware.js", () => ({
  authMiddleware: (
    req: { auth?: { organitzacioId: string; userId: string; rol: string; email: string } },
    _res: unknown,
    next: () => void,
  ) => {
    req.auth = {
      userId: "u-test",
      organitzacioId: "org-test",
      rol: "ADMIN",
      email: "test@org.com",
    };
    next();
  },
}));

import { certificatsRoutes } from "./certificats.routes.js";
import { languageMiddleware } from "../middlewares/language.middleware.js";

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use(languageMiddleware);
  app.use("/api/certificats", certificatsRoutes);
  app.use((error: { statusCode?: number; message?: string }, _req: unknown, res: { status: (code: number) => { json: (payload: unknown) => void } }) => {
    res.status(error.statusCode ?? 500).json({ message: error.message ?? "error" });
  });
  return app;
}

const payload = {
  projecteNom: "Projecte API",
  obraNom: "Obra API",
  fabricantNom: "Fabricant API",
  mesclaNom: "MBC API",
  tipologiaMescla: "MBC_CONVENCIONAL",
  quantitatTones: 1200,
  emissions: {
    A1: 22,
    A2: 7,
    A3: 12,
    A4: 6,
    A5: 4,
    total: 51,
    limit: 70,
    unitat: "kg CO2e/t",
  },
};

describe("certificats routes", () => {
  beforeEach(async () => {
    const dir = path.join(os.tmpdir(), `cert-routes-${Date.now()}-${Math.random().toString(16).slice(2)}`);
    process.env["CERTIFICATS_STORAGE_DIR"] = dir;
    await fs.rm(dir, { recursive: true, force: true });
  });

  it("genera, llista, descarrega i revoca", async () => {
    const app = buildApp();

    const created = await request(app).post("/api/certificats/generar").set("Accept-Language", "en").send(payload);
    expect(created.status).toBe(201);
    expect(created.body.id).toBeDefined();
    expect(created.body.idioma).toBe("en");

    const list = await request(app).get("/api/certificats");
    expect(list.status).toBe(200);
    expect(list.body.items).toHaveLength(1);

    const id = created.body.id as string;

    const download = await request(app).get(`/api/certificats/${id}/pdf?lang=fr`);
    expect(download.status).toBe(200);
    expect(download.headers["content-type"]).toContain("application/pdf");
    expect(download.headers["content-disposition"]).toContain("-fr.pdf");

    const revoke = await request(app).post(`/api/certificats/${id}/revocar`);
    expect(revoke.status).toBe(200);
    expect(revoke.body.estat).toBe("REVOCAT");
  });
});
