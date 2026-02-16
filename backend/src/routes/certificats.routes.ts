import { Router } from "express";

import { certificatsController } from "../controllers/certificats.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

export const certificatsRoutes = Router();

certificatsRoutes.use(authMiddleware);

certificatsRoutes.post("/generar", certificatsController.generar);
certificatsRoutes.get("/", certificatsController.llistar);
certificatsRoutes.get("/:id", certificatsController.obtenir);
certificatsRoutes.get("/:id/pdf", certificatsController.descarregarPdf);
certificatsRoutes.post("/:id/revocar", certificatsController.revocar);
