import { type Request, type Response } from "express";
import { z } from "zod";

import { gisService } from "../services/gis.service.js";

const routeSchema = z.object({
  origen: z.object({ lat: z.number(), lng: z.number() }),
  desti: z.object({ lat: z.number(), lng: z.number() }),
});

const batchRouteSchema = z.object({
  origen: z.object({ lat: z.number(), lng: z.number() }),
  destinacions: z.array(z.object({ lat: z.number(), lng: z.number() })).min(1),
});

const geocodeSchema = z.object({
  q: z.string().min(3),
});

const reverseSchema = z.object({
  lat: z.coerce.number(),
  lng: z.coerce.number(),
});

export const gisController = {
  async calcularRuta(req: Request, res: Response) {
    const payload = routeSchema.parse(req.body);
    const route = await gisService.calcularRuta(payload.origen, payload.desti);
    res.status(200).json(route);
  },

  async geocode(req: Request, res: Response) {
    const { q } = geocodeSchema.parse(req.query);
    const results = await gisService.geocodificarAdreca(q);
    res.status(200).json(results);
  },

  async reverseGeocode(req: Request, res: Response) {
    const { lat, lng } = reverseSchema.parse(req.query);
    const result = await gisService.geocodificarInversa({ lat, lng });
    res.status(200).json(result);
  },

  async distanciaLineal(req: Request, res: Response) {
    const payload = routeSchema.parse(req.body);
    const result = gisService.calcularDistanciaLineal(payload.origen, payload.desti);
    res.status(200).json(result);
  },

  async distanciaCarretera(req: Request, res: Response) {
    const payload = routeSchema.parse(req.body);
    const route = await gisService.calcularDistanciaCarretera(payload.origen, payload.desti);
    res.status(200).json(route);
  },

  async batchRutes(req: Request, res: Response) {
    const payload = batchRouteSchema.parse(req.body);
    const routes = await gisService.batchCalcularRutes(payload.origen, payload.destinacions);
    res.status(200).json(routes);
  },
};
