import { Router } from "express";

import { projectsController } from "../controllers/projects.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

export const projectsRoutes = Router();

projectsRoutes.use(authMiddleware);

projectsRoutes.get("/", projectsController.list);
projectsRoutes.post("/", projectsController.create);
projectsRoutes.post("/:id/estructures/generar", projectsController.generarEstructures);
projectsRoutes.get("/:id/estructures", projectsController.llistarEstructures);
projectsRoutes.get("/:id/estructures/jobs/:jobId", projectsController.estatGeneracioEstructures);
projectsRoutes.post("/:id/estructures/optimitzacio/ponderacio", projectsController.optimitzarPonderacio);
projectsRoutes.post("/:id/estructures/optimitzacio/pareto", projectsController.optimitzarPareto);
projectsRoutes.post("/:id/estructures/optimitzacio/sensibilitat", projectsController.analisiSensibilitat);
projectsRoutes.post("/:id/bim/export", projectsController.exportarBimIfc);
projectsRoutes.get("/:id", projectsController.getById);
projectsRoutes.put("/:id", projectsController.update);
projectsRoutes.delete("/:id", projectsController.remove);
