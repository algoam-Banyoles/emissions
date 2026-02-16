import { Router } from "express";
import multer from "multer";

import { emissionsAdminController } from "../controllers/emissions-admin.controller.js";
import { emissionsAdminRoleMiddleware } from "../middlewares/admin.middleware.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

export const emissionsAdminRoutes = Router();
const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } });

emissionsAdminRoutes.use(authMiddleware, emissionsAdminRoleMiddleware);

emissionsAdminRoutes.get("/history", emissionsAdminController.listHistory);
emissionsAdminRoutes.post("/history/:logId/revert", emissionsAdminController.revert);
emissionsAdminRoutes.get("/validacio/ultima", emissionsAdminController.getLatestValidation);
emissionsAdminRoutes.get("/validacio/historial", emissionsAdminController.getValidationHistory);
emissionsAdminRoutes.post("/validacio/executar", emissionsAdminController.runValidation);
emissionsAdminRoutes.post("/importar", upload.single("file"), emissionsAdminController.importFactors);
emissionsAdminRoutes.get("/exportar", emissionsAdminController.exportFactors);

emissionsAdminRoutes.get("/:resource", emissionsAdminController.list);
emissionsAdminRoutes.post("/:resource", emissionsAdminController.create);
emissionsAdminRoutes.put("/:resource/:id", emissionsAdminController.update);
emissionsAdminRoutes.delete("/:resource/:id", emissionsAdminController.remove);

emissionsAdminRoutes.post("/:resource/bulk/update-version", emissionsAdminController.bulkUpdateVersion);
emissionsAdminRoutes.get("/:resource/export", emissionsAdminController.exportCsv);
