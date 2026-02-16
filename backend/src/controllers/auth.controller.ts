import { type Request, type Response } from "express";

import { env } from "../config/env.js";
import { authService } from "../services/auth.service.js";

const REFRESH_COOKIE_NAME = "refreshToken";

function setRefreshCookie(res: Response, refreshToken: string) {
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
    path: "/api/auth",
  });
}

function clearRefreshCookie(res: Response) {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api/auth",
  });
}

export const authController = {
  async register(req: Request, res: Response) {
    const result = await authService.register(req.body);
    setRefreshCookie(res, result.refreshToken);

    res.status(201).json({
      accessToken: result.accessToken,
      user: result.user,
      organitzacio: result.organitzacio,
    });
  },

  async login(req: Request, res: Response) {
    const result = await authService.login(req.body);
    setRefreshCookie(res, result.refreshToken);

    res.status(200).json({
      accessToken: result.accessToken,
      user: result.user,
      organitzacio: result.organitzacio,
    });
  },

  async refresh(req: Request, res: Response) {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
    const result = await authService.refresh(refreshToken ?? "");

    setRefreshCookie(res, result.refreshToken);

    res.status(200).json({
      accessToken: result.accessToken,
      user: result.user,
    });
  },

  async logout(req: Request, res: Response) {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
    await authService.logout(refreshToken);
    clearRefreshCookie(res);

    res.status(200).json({ message: "Sessio tancada correctament" });
  },
};
