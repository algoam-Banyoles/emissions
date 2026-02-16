import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.hoisted(() => {
  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
  process.env.JWT_ACCESS_SECRET = "test-secret-test-secret-test-secret-1234";
  process.env.JWT_REFRESH_SECRET = "test-refresh-test-refresh-test-refresh-12";
});

interface VersionRecord {
  id: string;
  numero: string;
  esActual: boolean;
}

interface MaterialFactorRecord {
  id: string;
  codiMaterial: string;
  nom: string;
  categoria: string;
  factorEmissio: number;
  unitat: string;
  fontDades: string;
  anyReferencia: number;
  versioBaseDadesId: string;
  actiu: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface TransportFactorRecord {
  id: string;
  tipusVehicle: string;
  capacitatTonelades: number;
  factorEmissio: number;
  unitat: string;
  fontDades: string;
  anyReferencia: number;
  combustible: string;
  versioBaseDadesId: string;
  actiu: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const state = vi.hoisted(() => ({
  versions: [] as VersionRecord[],
  materials: [] as MaterialFactorRecord[],
  transport: [] as TransportFactorRecord[],
}));

const prismaMock = vi.hoisted(() => ({
  prisma: {
    versioBaseDades: {
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) => state.versions.find((v) => v.id === where.id) ?? null),
      findFirst: vi.fn(async () => state.versions.find((v) => v.esActual) ?? null),
    },
    factorEmissioMaterial: {
      findMany: vi.fn(async () => state.materials),
      count: vi.fn(async () => state.materials.length),
      findFirst: vi.fn(async ({ where }: { where: { codiMaterial: string; versioBaseDadesId: string; id?: { not: string } } }) =>
        state.materials.find((item) => item.codiMaterial === where.codiMaterial && item.versioBaseDadesId === where.versioBaseDadesId && (!where.id?.not || item.id !== where.id.not)) ?? null,
      ),
      create: vi.fn(async ({ data }: { data: Omit<MaterialFactorRecord, "id" | "createdAt" | "updatedAt"> }) => {
        const now = new Date();
        const created: MaterialFactorRecord = {
          id: `m-${state.materials.length + 1}`,
          ...data,
          createdAt: now,
          updatedAt: now,
        };
        state.materials.push(created);
        return created;
      }),
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) => state.materials.find((item) => item.id === where.id) ?? null),
      update: vi.fn(async ({ where, data }: { where: { id: string }; data: Partial<MaterialFactorRecord> }) => {
        const index = state.materials.findIndex((item) => item.id === where.id);
        const existing = state.materials[index];
        if (!existing) {
          return null;
        }
        const updated: MaterialFactorRecord = { ...existing, ...data, updatedAt: new Date() };
        state.materials[index] = updated;
        return updated;
      }),
      updateMany: vi.fn(async () => ({ count: 0 })),
    },
    factorEmissioTransport: {
      findMany: vi.fn(async () => state.transport),
      count: vi.fn(async () => state.transport.length),
      findFirst: vi.fn(async ({ where }: { where: { tipusVehicle: string; versioBaseDadesId: string; id?: { not: string } } }) =>
        state.transport.find((item) => item.tipusVehicle === where.tipusVehicle && item.versioBaseDadesId === where.versioBaseDadesId && (!where.id?.not || item.id !== where.id.not)) ?? null,
      ),
      create: vi.fn(async ({ data }: { data: Omit<TransportFactorRecord, "id" | "createdAt" | "updatedAt"> }) => {
        const now = new Date();
        const created: TransportFactorRecord = { id: `t-${state.transport.length + 1}`, ...data, createdAt: now, updatedAt: now };
        state.transport.push(created);
        return created;
      }),
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) => state.transport.find((item) => item.id === where.id) ?? null),
      update: vi.fn(async ({ where, data }: { where: { id: string }; data: Partial<TransportFactorRecord> }) => {
        const index = state.transport.findIndex((item) => item.id === where.id);
        const existing = state.transport[index];
        if (!existing) {
          return null;
        }
        const updated: TransportFactorRecord = { ...existing, ...data, updatedAt: new Date() };
        state.transport[index] = updated;
        return updated;
      }),
      updateMany: vi.fn(async () => ({ count: 0 })),
    },
    combustibleFabricacio: { findMany: vi.fn(async () => []), count: vi.fn(async () => 0), findUnique: vi.fn(async () => null), create: vi.fn(), update: vi.fn(), updateMany: vi.fn(async () => ({ count: 0 })) },
    consumElectric: { findMany: vi.fn(async () => []), count: vi.fn(async () => 0), findUnique: vi.fn(async () => null), create: vi.fn(), update: vi.fn(), updateMany: vi.fn(async () => ({ count: 0 })) },
    equipPosadaEnObra: { findMany: vi.fn(async () => []), count: vi.fn(async () => 0), findUnique: vi.fn(async () => null), create: vi.fn(), update: vi.fn(), updateMany: vi.fn(async () => ({ count: 0 })) },
    limitNormatiuEmissions: { findMany: vi.fn(async () => []), count: vi.fn(async () => 0), findUnique: vi.fn(async () => null), create: vi.fn(), update: vi.fn(), updateMany: vi.fn(async () => ({ count: 0 })) },
    constantCalorifica: { findMany: vi.fn(async () => []), count: vi.fn(async () => 0), findUnique: vi.fn(async () => null), create: vi.fn(), update: vi.fn(), updateMany: vi.fn(async () => ({ count: 0 })) },
    emissionsChangeLog: { create: vi.fn(async () => ({})), findUnique: vi.fn(async () => null), findMany: vi.fn(async () => []), count: vi.fn(async () => 0) },
    $transaction: vi.fn(async (ops: Promise<unknown>[]) => await Promise.all(ops)),
  },
}));

vi.mock("../config/database.js", () => prismaMock);
vi.mock("../middlewares/auth.middleware.js", () => ({
  authMiddleware: (req: { auth?: { userId: string; organitzacioId: string; rol: string; email: string } }, _res: unknown, next: () => void) => {
    req.auth = {
      userId: "u-admin-emissions",
      organitzacioId: "org-1",
      rol: "ADMIN_EMISSIONS",
      email: "emissions@admin.com",
    };
    next();
  },
}));
vi.mock("../middlewares/admin.middleware.js", () => ({
  emissionsAdminRoleMiddleware: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

import { emissionsAdminRoutes } from "./emissions-admin.routes.js";

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/admin/emissions", emissionsAdminRoutes);
  app.use((error: { statusCode?: number; message?: string }, _req: unknown, res: { status: (code: number) => { json: (payload: unknown) => void } }) => {
    res.status(error.statusCode ?? 500).json({ message: error.message ?? "error" });
  });
  return app;
}

describe("emissions admin routes", () => {
  beforeEach(() => {
    state.versions.length = 0;
    state.materials.length = 0;
    state.transport.length = 0;

    state.versions.push({ id: "v1", numero: "2024.1", esActual: true });
  });

  it("fa CRUD logic de materials", async () => {
    const app = buildApp();

    const created = await request(app).post("/api/admin/emissions/materials").send({
      codiMaterial: "14a",
      nom: "betun_convencional",
      categoria: "BETUMS",
      factorEmissio: 272,
      unitat: "T",
      fontDades: "DAP REPSOL",
      anyReferencia: 2020,
    });

    expect(created.status).toBe(201);
    expect(created.body.codiMaterial).toBe("14a");

    const listed = await request(app).get("/api/admin/emissions/materials");
    expect(listed.status).toBe(200);
    expect(listed.body.items).toHaveLength(1);

    const updated = await request(app).put(`/api/admin/emissions/materials/${created.body.id}`).send({
      factorEmissio: 275,
      fontDades: "DAP REPSOL 2021",
    });
    expect(updated.status).toBe(200);
    expect(updated.body.factorEmissio).toBe(275);

    const removed = await request(app).delete(`/api/admin/emissions/materials/${created.body.id}`);
    expect(removed.status).toBe(204);

    const listedAfter = await request(app).get("/api/admin/emissions/materials");
    expect(listedAfter.body.items[0].actiu).toBe(false);
  });

  it("fa CRUD logic de transport", async () => {
    const app = buildApp();

    const created = await request(app).post("/api/admin/emissions/transport").send({
      tipusVehicle: "camion_semirremolque_40t_bascualnte",
      capacitatTonelades: 28,
      factorEmissio: 0.0849,
      fontDades: "SEVE V4.0",
      anyReferencia: 2022,
      combustible: "GASOLEO",
    });

    expect(created.status).toBe(201);

    const updated = await request(app).put(`/api/admin/emissions/transport/${created.body.id}`).send({
      factorEmissio: 0.09,
      fontDades: "SEVE V4.1",
    });

    expect(updated.status).toBe(200);
    expect(updated.body.factorEmissio).toBe(0.09);

    const listed = await request(app).get("/api/admin/emissions/transport");
    expect(listed.status).toBe(200);
    expect(listed.body.items).toHaveLength(1);
  });
});
