import { Router } from "express";

import { ubicacionsController } from "../controllers/ubicacions.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

export const ubicacionsRoutes = Router();

ubicacionsRoutes.use(authMiddleware);

ubicacionsRoutes.get("/", ubicacionsController.list);
ubicacionsRoutes.get("/nearby", ubicacionsController.nearby);
ubicacionsRoutes.post("/importar-osm", ubicacionsController.importarOsm);
ubicacionsRoutes.post("/", ubicacionsController.create);
ubicacionsRoutes.put("/:id", ubicacionsController.update);
ubicacionsRoutes.delete("/:id", ubicacionsController.remove);
