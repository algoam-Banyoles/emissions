import { type NextFunction, type Request, type Response } from "express";

import { HttpError } from "../utils/http-error.js";

export function notFoundMiddleware(_req: Request, _res: Response, next: NextFunction) {
  next(new HttpError(404, "Ruta no trobada"));
}
