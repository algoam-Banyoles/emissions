import crypto from "node:crypto";

import { RolUsuari } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";

import { prisma } from "../config/database.js";
import { env } from "../config/env.js";
import { type AuthTokens, type AuthUserPayload } from "../types/auth.js";
import { HttpError } from "../utils/http-error.js";

const passwordSchema = z
  .string()
  .min(10, "La contrasenya ha de tenir almenys 10 caracters")
  .regex(/[A-Z]/, "La contrasenya ha d'incloure una majuscula")
  .regex(/[a-z]/, "La contrasenya ha d'incloure una minuscula")
  .regex(/[0-9]/, "La contrasenya ha d'incloure un numero")
  .regex(/[^A-Za-z0-9]/, "La contrasenya ha d'incloure un caracter especial");

const registerSchema = z.object({
  organitzacioNom: z.string().min(2).max(150),
  organitzacioTipus: z.string().max(80).optional(),
  organitzacioNif: z.string().max(20).optional(),
  nom: z.string().min(2).max(120),
  cognoms: z.string().max(120).optional(),
  email: z.email(),
  password: passwordSchema,
});

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

function hashRefreshToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function buildTenantCode(name: string) {
  const base = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 24);

  const suffix = crypto.randomBytes(3).toString("hex");
  return `${base || "tenant"}-${suffix}`;
}

function signAccessToken(payload: AuthUserPayload) {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET as jwt.Secret, { expiresIn: 15 * 60 });
}

function signRefreshToken(payload: AuthUserPayload) {
  const expiresInSeconds = env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60;
  return jwt.sign(payload, env.JWT_REFRESH_SECRET as jwt.Secret, {
    expiresIn: expiresInSeconds,
  });
}

function buildAuthUserPayload(user: {
  id: string;
  email: string;
  rol: RolUsuari;
  organitzacioId: string;
}): AuthUserPayload {
  return {
    userId: user.id,
    organitzacioId: user.organitzacioId,
    rol: user.rol,
    email: user.email,
  };
}

async function persistRefreshToken(refreshToken: string, userId: string) {
  const tokenHash = hashRefreshToken(refreshToken);
  const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({
    data: {
      tokenHash,
      usuariId: userId,
      expiresAt,
    },
  });
}

async function issueTokens(payload: AuthUserPayload): Promise<AuthTokens> {
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  await persistRefreshToken(refreshToken, payload.userId);

  return { accessToken, refreshToken };
}

export const authService = {
  async register(input: unknown) {
    const data = registerSchema.parse(input);

    const existing = await prisma.usuari.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new HttpError(409, "Ja existeix un usuari amb aquest email");
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const created = await prisma.$transaction(async (tx) => {
      const organitzacio = await tx.organitzacio.create({
        data: {
          nom: data.organitzacioNom,
          tipus: data.organitzacioTipus ?? null,
          nif: data.organitzacioNif ?? null,
          codi: buildTenantCode(data.organitzacioNom),
        },
      });

      const usuari = await tx.usuari.create({
        data: {
          email: data.email,
          nom: data.nom,
          cognoms: data.cognoms ?? null,
          passwordHash,
          rol: RolUsuari.ADMIN,
          organitzacioId: organitzacio.id,
        },
      });

      return { organitzacio, usuari };
    });

    const payload = buildAuthUserPayload(created.usuari);
    const tokens = await issueTokens(payload);

    return {
      user: payload,
      organitzacio: {
        id: created.organitzacio.id,
        nom: created.organitzacio.nom,
        codi: created.organitzacio.codi,
      },
      ...tokens,
    };
  },

  async login(input: unknown) {
    const data = loginSchema.parse(input);

    const user = await prisma.usuari.findUnique({
      where: { email: data.email },
      include: { organitzacio: true },
    });

    if (!user || !user.actiu) {
      throw new HttpError(401, "Credencials incorrectes");
    }

    const isValidPassword = await bcrypt.compare(data.password, user.passwordHash);
    if (!isValidPassword) {
      throw new HttpError(401, "Credencials incorrectes");
    }

    const payload = buildAuthUserPayload(user);
    const tokens = await issueTokens(payload);

    return {
      user: payload,
      organitzacio: {
        id: user.organitzacio.id,
        nom: user.organitzacio.nom,
        codi: user.organitzacio.codi,
      },
      ...tokens,
    };
  },

  async refresh(refreshToken: string) {
    if (!refreshToken) {
      throw new HttpError(401, "Refresh token requerit");
    }

    let decoded: AuthUserPayload;
    try {
      decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as AuthUserPayload;
    } catch {
      throw new HttpError(401, "Refresh token invalid");
    }

    const tokenHash = hashRefreshToken(refreshToken);
    const storedToken = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { usuari: true },
    });

    if (!storedToken || storedToken.revokedAt || storedToken.expiresAt < new Date()) {
      throw new HttpError(401, "Refresh token revocat o expirat");
    }

    if (storedToken.usuariId !== decoded.userId || !storedToken.usuari.actiu) {
      throw new HttpError(401, "Sessio no valida");
    }

    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    const payload = buildAuthUserPayload(storedToken.usuari);
    const tokens = await issueTokens(payload);

    return {
      user: payload,
      ...tokens,
    };
  },

  async logout(refreshToken?: string) {
    if (!refreshToken) {
      return;
    }

    const tokenHash = hashRefreshToken(refreshToken);
    await prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  },
};
