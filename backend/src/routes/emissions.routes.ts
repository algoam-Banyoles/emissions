import { Router } from "express";

import { emissionsController } from "../controllers/emissions.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

export const emissionsRoutes = Router();

emissionsRoutes.use(authMiddleware);
emissionsRoutes.post("/calcular", emissionsController.calcularPetjada);
