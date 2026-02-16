import { type Request, type Response } from "express";
import { z } from "zod";

import { ubicacionsService } from "../services/ubicacions.service.js";
import { HttpError } from "../utils/http-error.js";

function getIdentity(req: Request) {
  if (!req.auth) {
    throw new HttpError(401, "No autoritzat");
  }

  return {
    organitzacioId: req.auth.organitzacioId,
  };
}

export const ubicacionsController = {
  async list(req: Request, res: Response) {
    const items = await ubicacionsService.list(req.query, getIdentity(req));
    res.status(200).json(items);
  },

  async create(req: Request, res: Response) {
    const created = await ubicacionsService.create(req.body, getIdentity(req));
    res.status(201).json(created);
  },

  async nearby(req: Request, res: Response) {
    const items = await ubicacionsService.nearby(req.query, getIdentity(req));
    res.status(200).json(items);
  },

  async importarOsm(req: Request, res: Response) {
    const result = await ubicacionsService.importarDesOsm(req.body, getIdentity(req));
    res.status(201).json(result);
  },

  async update(req: Request, res: Response) {
    const { id } = z.object({ id: z.string().min(1) }).parse(req.params);
    const updated = await ubicacionsService.update(id, req.body, getIdentity(req));
    res.status(200).json(updated);
  },

  async remove(req: Request, res: Response) {
    const { id } = z.object({ id: z.string().min(1) }).parse(req.params);
    await ubicacionsService.remove(id, getIdentity(req));
    res.status(204).send();
  },
};
