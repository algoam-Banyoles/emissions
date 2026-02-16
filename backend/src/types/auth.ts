import { type RolUsuari } from "@prisma/client";

export interface AuthUserPayload {
  userId: string;
  organitzacioId: string;
  rol: RolUsuari;
  email: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}
