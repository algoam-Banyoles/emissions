import { type Request, type Response } from "express";
import { z } from "zod";

import { importService } from "../services/import.service.js";
import { materialsService } from "../services/materials.service.js";
import { versionsService } from "../services/versions.service.js";
import { HttpError } from "../utils/http-error.js";

function getAdminUserId(req: Request) {
  if (!req.auth) {
    throw new HttpError(401, "No autoritzat");
  }

  return req.auth.userId;
}

export const materialsController = {
  async listMaterials(req: Request, res: Response) {
    const result = await materialsService.list(req.query);
    res.status(200).json(result);
  },

  async getMaterial(req: Request, res: Response) {
    const { id } = z.object({ id: z.string().min(1) }).parse(req.params);
    const material = await materialsService.getById(id);
    res.status(200).json(material);
  },

  async createMaterial(req: Request, res: Response) {
    const material = await materialsService.create(req.body, getAdminUserId(req));
    res.status(201).json(material);
  },

  async updateMaterial(req: Request, res: Response) {
    const { id } = z.object({ id: z.string().min(1) }).parse(req.params);
    const material = await materialsService.update(id, req.body, getAdminUserId(req));
    res.status(200).json(material);
  },

  async removeMaterial(req: Request, res: Response) {
    const { id } = z.object({ id: z.string().min(1) }).parse(req.params);
    await materialsService.remove(id, getAdminUserId(req));
    res.status(204).send();
  },

  async listVersions(_req: Request, res: Response) {
    const versions = await versionsService.list();
    res.status(200).json(versions);
  },

  async publishVersion(req: Request, res: Response) {
    const version = await versionsService.publish(req.body, getAdminUserId(req));
    res.status(201).json(version);
  },

  async activateVersion(req: Request, res: Response) {
    const { id } = z.object({ id: z.string().min(1) }).parse(req.params);
    const version = await versionsService.activate(id);
    res.status(200).json(version);
  },

  async compareVersions(req: Request, res: Response) {
    const query = z.object({ from: z.string().min(1), to: z.string().min(1) }).parse(req.query);
    const result = await versionsService.compare(query.from, query.to);
    res.status(200).json(result);
  },

  async importPrices(req: Request, res: Response) {
    const result = await importService.importPrices(req.body, getAdminUserId(req));
    res.status(201).json(result);
  },
};
