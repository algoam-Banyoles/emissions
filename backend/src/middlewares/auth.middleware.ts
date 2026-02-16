import { type NextFunction, type Request, type Response } from "express";
import jwt from "jsonwebtoken";

import { env } from "../config/env.js";
import { type AuthUserPayload } from "../types/auth.js";
import { HttpError } from "../utils/http-error.js";

export function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new HttpError(401, "Token d'acces requerit"));
  }

  const token = authHeader.slice("Bearer ".length).trim();

  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as AuthUserPayload;
    req.auth = {
      userId: decoded.userId,
      organitzacioId: decoded.organitzacioId,
      rol: decoded.rol,
      email: decoded.email,
    };
    return next();
  } catch {
    return next(new HttpError(401, "Token invalid o expirat"));
  }
}
