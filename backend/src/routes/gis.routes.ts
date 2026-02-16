import { Router } from "express";

import { gisController } from "../controllers/gis.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

export const gisRoutes = Router();

gisRoutes.use(authMiddleware);

gisRoutes.get("/geocode", gisController.geocode);
gisRoutes.get("/reverse-geocode", gisController.reverseGeocode);
gisRoutes.post("/distance/lineal", gisController.distanciaLineal);
gisRoutes.post("/distance/carretera", gisController.distanciaCarretera);
gisRoutes.post("/routes/batch", gisController.batchRutes);
gisRoutes.post("/route", gisController.calcularRuta);
