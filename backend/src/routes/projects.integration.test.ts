import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

interface ProjectRecord {
  id: string;
  codi: string;
  nom: string;
  descripcio: string | null;
  estat: "ESBORRANY" | "ACTIU" | "COMPLETAT" | "ARXIUAT";
  organitzacioId: string;
  imd: number | null;
  percentatgeVp: number | null;
  tipusTracat: string | null;
  zonaClimatica: string | null;
  vidaUtil: number | null;
  creixementAnual: number | null;
  latitud: number | null;
  longitud: number | null;
  createdAt: Date;
  updatedAt: Date;
}

const state = vi.hoisted(() => {
  const projects: ProjectRecord[] = [];

  return {
    projects,
  };
});

function matchesWhere(project: ProjectRecord, where: Record<string, unknown>) {
  if (where.organitzacioId && project.organitzacioId !== where.organitzacioId) {
    return false;
  }

  const nom = where.nom as { contains?: string } | undefined;
  if (nom?.contains && !project.nom.toLowerCase().includes(nom.contains.toLowerCase())) {
    return false;
  }

  if (where.estat && project.estat !== where.estat) {
    return false;
  }

  const createdAt = where.createdAt as { gte?: Date; lte?: Date } | undefined;
  if (createdAt?.gte && project.createdAt < createdAt.gte) {
    return false;
  }
  if (createdAt?.lte && project.createdAt > createdAt.lte) {
    return false;
  }

  if (where.id && project.id !== where.id) {
    return false;
  }

  return true;
}

const prismaMock = vi.hoisted(() => ({
  prisma: {
    projecte: {
      findMany: vi.fn(async (params: Record<string, unknown>) => {
        const where = (params.where ?? {}) as Record<string, unknown>;
        const skip = (params.skip as number | undefined) ?? 0;
        const take = (params.take as number | undefined) ?? 10;

        return state.projects.filter((item) => matchesWhere(item, where)).slice(skip, skip + take);
      }),
      count: vi.fn(async (params: Record<string, unknown>) => {
        const where = (params.where ?? {}) as Record<string, unknown>;
        return state.projects.filter((item) => matchesWhere(item, where)).length;
      }),
      create: vi.fn(async (params: Record<string, unknown>) => {
        const data = params.data as Record<string, unknown>;
        const now = new Date();
        const created: ProjectRecord = {
          id: `p-${state.projects.length + 1}`,
          codi: data.codi as string,
          nom: data.nom as string,
          descripcio: (data.descripcio as string | null | undefined) ?? null,
          estat: ((data.estat as ProjectRecord["estat"] | undefined) ?? "ESBORRANY"),
          organitzacioId: ((data.organitzacio as { connect?: { id?: string } } | undefined)?.connect?.id ??
            "org-1") as string,
          imd: (data.imd as number | null | undefined) ?? null,
          percentatgeVp: (data.percentatgeVp as number | null | undefined) ?? null,
          tipusTracat: (data.tipusTracat as string | null | undefined) ?? null,
          zonaClimatica: (data.zonaClimatica as string | null | undefined) ?? null,
          vidaUtil: (data.vidaUtil as number | null | undefined) ?? null,
          creixementAnual: (data.creixementAnual as number | null | undefined) ?? null,
          latitud: (data.latitud as number | null | undefined) ?? null,
          longitud: (data.longitud as number | null | undefined) ?? null,
          createdAt: now,
          updatedAt: now,
        };
        state.projects.push(created);
        return created;
      }),
      findFirst: vi.fn(async (params: Record<string, unknown>) => {
        const where = (params.where ?? {}) as Record<string, unknown>;
        return state.projects.find((item) => matchesWhere(item, where)) ?? null;
      }),
      update: vi.fn(async (params: Record<string, unknown>) => {
        const id = (params.where as { id: string }).id;
        const data = params.data as Record<string, unknown>;
        const existingIndex = state.projects.findIndex((item) => item.id === id);
        const existing = state.projects[existingIndex];
        if (!existing) {
          return null;
        }
        const updated: ProjectRecord = {
          ...existing,
          ...data,
          updatedAt: new Date(),
        };
        state.projects[existingIndex] = updated;
        return updated;
      }),
      delete: vi.fn(async (params: Record<string, unknown>) => {
        const id = (params.where as { id: string }).id;
        const index = state.projects.findIndex((item) => item.id === id);
        if (index >= 0) {
          state.projects.splice(index, 1);
        }
      }),
    },
    $transaction: vi.fn(async (operations: Promise<unknown>[]) => {
      return await Promise.all(operations);
    }),
  },
}));

vi.mock("../config/database.js", () => prismaMock);

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

import { projectsRoutes } from "./projects.routes.js";

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/projects", projectsRoutes);
  app.use((error: { statusCode?: number; message?: string }, _req: unknown, res: { status: (code: number) => { json: (payload: unknown) => void } }) => {
    res.status(error.statusCode ?? 500).json({ message: error.message ?? "error" });
  });
  return app;
}

describe("projects routes integration", () => {
  beforeEach(() => {
    state.projects.length = 0;
    state.projects.push(
      {
        id: "p-1",
        codi: "PRJ-001",
        nom: "Projecte Alpha",
        descripcio: "desc",
        estat: "ESBORRANY",
        organitzacioId: "org-1",
        imd: 1000,
        percentatgeVp: 10,
        tipusTracat: "TT2",
        zonaClimatica: "ZC2",
        vidaUtil: 20,
        creixementAnual: 2.5,
        latitud: 41.23,
        longitud: 2.11,
        createdAt: new Date("2025-01-01T00:00:00.000Z"),
        updatedAt: new Date("2025-01-01T00:00:00.000Z"),
      },
      {
        id: "p-2",
        codi: "PRJ-002",
        nom: "Projecte Beta",
        descripcio: "desc",
        estat: "ACTIU",
        organitzacioId: "org-2",
        imd: null,
        percentatgeVp: null,
        tipusTracat: null,
        zonaClimatica: null,
        vidaUtil: null,
        creixementAnual: null,
        latitud: null,
        longitud: null,
        createdAt: new Date("2025-01-02T00:00:00.000Z"),
        updatedAt: new Date("2025-01-02T00:00:00.000Z"),
      },
    );
  });

  it("llista nomes projectes de la mateixa organitzacio", async () => {
    const app = buildApp();
    const response = await request(app).get("/api/projects");

    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(1);
    expect(response.body.items[0].organitzacioId).toBe("org-1");
  });

  it("crea un projecte amb estat esborrany", async () => {
    const app = buildApp();
    const response = await request(app).post("/api/projects").send({
      codi: "PRJ-003",
      nom: "Projecte Nou",
      imd: 1200,
    });

    expect(response.status).toBe(201);
    expect(response.body.estat).toBe("ESBORRANY");
    expect(response.body.organitzacioId).toBe("org-1");
  });

  it("no permet llegir un projecte d'una altra organitzacio", async () => {
    const app = buildApp();
    const response = await request(app).get("/api/projects/p-2");

    expect(response.status).toBe(404);
  });

  it("actualitza i elimina projecte", async () => {
    const app = buildApp();
    const update = await request(app).put("/api/projects/p-1").send({
      estat: "ACTIU",
      nom: "Projecte Alpha Updated",
    });

    expect(update.status).toBe(200);
    expect(update.body.estat).toBe("ACTIU");

    const del = await request(app).delete("/api/projects/p-1");
    expect(del.status).toBe(204);

    const afterDelete = await request(app).get("/api/projects/p-1");
    expect(afterDelete.status).toBe(404);
  });

  it("genera estructures viables en mode sincron", async () => {
    const app = buildApp();
    const response = await request(app)
      .post("/api/projects/p-1/estructures/generar")
      .send({
        asynchronous: false,
        page: 1,
        pageSize: 10,
        tipologia: "REFORC",
        modulFonamentMpa: 250,
        capes: [
          { tipus: "RODAMENT", gruixMinCm: 5, gruixMaxCm: 6, pasCm: 0.5, modulElasticMpa: 5200, nom: "CR" },
          { tipus: "BASE", gruixMinCm: 10, gruixMaxCm: 12, pasCm: 0.5, modulElasticMpa: 4200, nom: "CB" },
        ],
      });

    expect(response.status).toBe(200);
    expect(response.body.mode).toBe("sync");
    expect(response.body.pagination).toBeDefined();
    expect(Array.isArray(response.body.items)).toBe(true);
  });

  it("admet mode asincron i consulta l'estat del job", async () => {
    const app = buildApp();
    const start = await request(app)
      .post("/api/projects/p-1/estructures/generar")
      .send({
        asynchronous: true,
        page: 1,
        pageSize: 10,
        tipologia: "NOVA_CONSTRUCCIO",
        limitCombinacions: 50,
        capes: [
          { tipus: "RODAMENT", gruixMinCm: 4, gruixMaxCm: 5, pasCm: 0.5, modulElasticMpa: 5200, nom: "CR" },
          { tipus: "BASE", gruixMinCm: 8, gruixMaxCm: 10, pasCm: 0.5, modulElasticMpa: 4200, nom: "CB" },
        ],
      });

    expect(start.status).toBe(200);
    expect(start.body.mode).toBe("async");
    expect(start.body.jobId).toBeDefined();

    const jobId = start.body.jobId as string;

    let statusResponse = await request(app).get(`/api/projects/p-1/estructures/jobs/${jobId}`);
    let attempts = 0;
    while (statusResponse.body.status !== "completed" && statusResponse.body.status !== "failed" && attempts < 20) {
      await new Promise((resolve) => setTimeout(resolve, 20));
      statusResponse = await request(app).get(`/api/projects/p-1/estructures/jobs/${jobId}`);
      attempts += 1;
    }

    expect(statusResponse.status).toBe(200);
    expect(["completed", "failed", "processing", "queued"]).toContain(statusResponse.body.status);
  });

  it("retorna estructures amb emissions via endpoint de consulta", async () => {
    const app = buildApp();
    const generated = await request(app)
      .post("/api/projects/p-1/estructures/generar")
      .send({
        asynchronous: false,
        page: 1,
        pageSize: 5,
        tipologia: "REFORC",
        capes: [
          { tipus: "RODAMENT", gruixMinCm: 5, gruixMaxCm: 6, pasCm: 0.5, modulElasticMpa: 5200, nom: "CR" },
          { tipus: "BASE", gruixMinCm: 10, gruixMaxCm: 11, pasCm: 0.5, modulElasticMpa: 4200, nom: "CB" },
        ],
      });

    expect(generated.status).toBe(200);
    expect(generated.body.mode).toBe("sync");

    const response = await request(app)
      .get("/api/projects/p-1/estructures")
      .query({ incloureEmissions: true, page: 1, pageSize: 5 });

    expect(response.status).toBe(200);
    expect(response.body.mode).toBe("sync");
    expect(Array.isArray(response.body.items)).toBe(true);
    if (response.body.items.length > 0) {
      expect(response.body.items[0].emissions).toBeDefined();
      expect(typeof response.body.items[0].emissions.totalKgT).toBe("number");
      expect(response.body.items[0].costos).toBeDefined();
      expect(typeof response.body.items[0].costos.totalEurM2).toBe("number");
    }
  });

  it("exporta una estructura a IFC", async () => {
    const app = buildApp();
    const response = await request(app)
      .post("/api/projects/p-1/bim/export")
      .send({
        estructura: {
          nom: "Estructura IFC",
          capes: [
            { tipus: "RODAMENT", nom: "AC16", gruixCm: 4, modulElasticMpa: 5200, coeficientPoisson: 0.35 },
            { tipus: "BASE", nom: "AC22", gruixCm: 10, modulElasticMpa: 4200, coeficientPoisson: 0.35 },
          ],
          emissions: { A1: 20, A2: 5, A3: 10, A4: 4, A5: 3, totalKgT: 42, kgM2: 18 },
          costos: { totalEurM2: 55, costAnyVidaUtilEurM2: 2.7 },
        },
      });

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain("application/x-step");
    expect(response.text).toContain("FILE_SCHEMA(('IFC4'))");
  });
});
