import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    usuari: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    organitzacio: {
      create: vi.fn(),
    },
    refreshToken: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("../config/database.js", () => ({
  prisma: prismaMock,
}));

vi.mock("../config/env.js", () => ({
  env: {
    NODE_ENV: "test",
    PORT: 4000,
    DATABASE_URL: "postgresql://test",
    CORS_ORIGIN: "http://localhost:5173",
    JWT_ACCESS_SECRET: "access-secret-access-secret-access-secret",
    JWT_REFRESH_SECRET: "refresh-secret-refresh-secret-refresh-",
    ACCESS_TOKEN_TTL: "15m",
    REFRESH_TOKEN_TTL_DAYS: 7,
  },
}));

import { authService } from "./auth.service.js";

describe("authService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("valida fortalesa de contrasenya al registre", async () => {
    await expect(
      authService.register({
        organitzacioNom: "Org Test",
        nom: "Usuari",
        email: "user@test.com",
        password: "123",
      }),
    ).rejects.toBeTruthy();
  });

  it("retorna error en login amb credencials incorrectes", async () => {
    const validHash = await bcrypt.hash("Password1!", 10);
    prismaMock.usuari.findUnique.mockResolvedValue({
      id: "u1",
      email: "user@test.com",
      nom: "Test",
      cognoms: null,
      rol: "ADMIN",
      actiu: true,
      passwordHash: validHash,
      organitzacioId: "o1",
      organitzacio: { id: "o1", nom: "Org", codi: "org-1" },
    });

    await expect(
      authService.login({
        email: "user@test.com",
        password: "BadPassword1!",
      }),
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it("registra organitzacio+usuari i genera tokens", async () => {
    prismaMock.usuari.findUnique.mockResolvedValue(null);
    prismaMock.$transaction.mockImplementation(async (cb: (tx: unknown) => unknown) => {
      const tx = {
        organitzacio: {
          create: vi.fn().mockResolvedValue({
            id: "o1",
            nom: "Org Test",
            codi: "org-test-123",
          }),
        },
        usuari: {
          create: vi.fn().mockResolvedValue({
            id: "u1",
            email: "user@test.com",
            rol: "ADMIN",
            organitzacioId: "o1",
          }),
        },
      };

      return await cb(tx);
    });
    prismaMock.refreshToken.create.mockResolvedValue({});

    const result = await authService.register({
      organitzacioNom: "Org Test",
      nom: "Usuari",
      email: "user@test.com",
      password: "Password1!",
    });

    expect(result.accessToken).toBeTypeOf("string");
    expect(result.refreshToken).toBeTypeOf("string");
    expect(prismaMock.refreshToken.create).toHaveBeenCalledOnce();
  });

  it("no refresca si el token esta revocat", async () => {
    const refreshToken = jwt.sign(
      {
        userId: "u1",
        organitzacioId: "o1",
        rol: "ADMIN",
        email: "user@test.com",
      },
      "refresh-secret-refresh-secret-refresh-",
      { expiresIn: "7d" },
    );

    prismaMock.refreshToken.findUnique.mockResolvedValue({
      id: "rt1",
      tokenHash: "hash",
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: new Date(),
      usuariId: "u1",
      usuari: {
        id: "u1",
        email: "user@test.com",
        rol: "ADMIN",
        actiu: true,
        organitzacioId: "o1",
      },
    });

    await expect(authService.refresh(refreshToken)).rejects.toMatchObject({ statusCode: 401 });
  });
});
