import { Router } from "express";

import { materialsController } from "../controllers/materials.controller.js";
import { adminRoleMiddleware } from "../middlewares/admin.middleware.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

export const adminRoutes = Router();

adminRoutes.use(authMiddleware, adminRoleMiddleware);

adminRoutes.get("/materials", materialsController.listMaterials);
adminRoutes.post("/materials", materialsController.createMaterial);
adminRoutes.get("/materials/:id", materialsController.getMaterial);
adminRoutes.put("/materials/:id", materialsController.updateMaterial);
adminRoutes.delete("/materials/:id", materialsController.removeMaterial);

adminRoutes.get("/versions", materialsController.listVersions);
adminRoutes.post("/versions", materialsController.publishVersion);
adminRoutes.post("/versions/:id/activate", materialsController.activateVersion);
adminRoutes.get("/versions/compare", materialsController.compareVersions);

adminRoutes.post("/importar-preus", materialsController.importPrices);
