import { Router } from "express";

import { adminRoutes } from "./admin.routes.js";
import { authRoutes } from "./auth.routes.js";
import { certificatsRoutes } from "./certificats.routes.js";
import { emissionsAdminRoutes } from "./emissions-admin.routes.js";
import { emissionsRoutes } from "./emissions.routes.js";
import { gisRoutes } from "./gis.routes.js";
import { healthRoutes } from "./health.routes.js";
import { projectsRoutes } from "./projects.routes.js";
import { ubicacionsRoutes } from "./ubicacions.routes.js";

export const apiRouter = Router();

apiRouter.use("/admin", adminRoutes);
apiRouter.use("/admin/emissions", emissionsAdminRoutes);
apiRouter.use("/auth", authRoutes);
apiRouter.use("/certificats", certificatsRoutes);
apiRouter.use("/emissions", emissionsRoutes);
apiRouter.use("/gis", gisRoutes);
apiRouter.use("/health", healthRoutes);
apiRouter.use("/projects", projectsRoutes);
apiRouter.use("/ubicacions", ubicacionsRoutes);
