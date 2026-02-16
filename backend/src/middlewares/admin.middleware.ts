import { RolUsuari } from "@prisma/client";
import { type NextFunction, type Request, type Response } from "express";

import { HttpError } from "../utils/http-error.js";

export function adminRoleMiddleware(req: Request, _res: Response, next: NextFunction) {
  if (!req.auth) {
    return next(new HttpError(401, "No autoritzat"));
  }

  if (req.auth.rol !== RolUsuari.ADMIN) {
    return next(new HttpError(403, "Permisos d'administrador requerits"));
  }

  return next();
}

export function emissionsAdminRoleMiddleware(req: Request, _res: Response, next: NextFunction) {
  if (!req.auth) {
    return next(new HttpError(401, "No autoritzat"));
  }

  if (req.auth.rol !== "ADMIN_EMISSIONS") {
    return next(new HttpError(403, "Permisos admin_emissions requerits"));
  }

  return next();
}
