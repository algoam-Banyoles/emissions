import { type Request, type Response } from "express";
import { z } from "zod";

import { bimService } from "../services/bim.service.js";
import { generadorEstructuresService } from "../services/generadorEstructures.service.js";
import { optimitzacioService } from "../services/optimitzacio.service.js";
import { projectsService } from "../services/projects.service.js";
import { HttpError } from "../utils/http-error.js";

function getIdentity(req: Request) {
  if (!req.auth) {
    throw new HttpError(401, "No autoritzat");
  }

  return {
    organitzacioId: req.auth.organitzacioId,
  };
}

export const projectsController = {
  async list(req: Request, res: Response) {
    const result = await projectsService.list(req.query, getIdentity(req));
    res.status(200).json(result);
  },

  async create(req: Request, res: Response) {
    const project = await projectsService.create(req.body, getIdentity(req));
    res.status(201).json(project);
  },

  async getById(req: Request, res: Response) {
    const { id } = z.object({ id: z.string().min(1) }).parse(req.params);
    const project = await projectsService.getById(id, getIdentity(req));
    res.status(200).json(project);
  },

  async update(req: Request, res: Response) {
    const { id } = z.object({ id: z.string().min(1) }).parse(req.params);
    const project = await projectsService.update(id, req.body, getIdentity(req));
    res.status(200).json(project);
  },

  async remove(req: Request, res: Response) {
    const { id } = z.object({ id: z.string().min(1) }).parse(req.params);
    await projectsService.remove(id, getIdentity(req));
    res.status(204).send();
  },

  async generarEstructures(req: Request, res: Response) {
    const { id } = z.object({ id: z.string().min(1) }).parse(req.params);
    const result = await generadorEstructuresService.generarEstructuresViables(id, req.body, getIdentity(req));

    res.status(200).json(result);
  },

  async estatGeneracioEstructures(req: Request, res: Response) {
    const { id, jobId } = z.object({ id: z.string().min(1), jobId: z.string().min(1) }).parse(req.params);
    const status = await generadorEstructuresService.getGenerationJobStatus(id, jobId, getIdentity(req));

    res.status(200).json(status);
  },

  async llistarEstructures(req: Request, res: Response) {
    const { id } = z.object({ id: z.string().min(1) }).parse(req.params);
    const result = await generadorEstructuresService.llistarEstructuresGenerades(id, req.query, getIdentity(req));
    res.status(200).json(result);
  },

  async optimitzarPonderacio(req: Request, res: Response) {
    const { id } = z.object({ id: z.string().min(1) }).parse(req.params);
    await projectsService.getById(id, getIdentity(req));
    const payload = z
      .object({
        estructures: z.array(z.unknown()).min(1),
        pesos: z.object({
          estructural: z.number().min(0),
          emissions: z.number().min(0),
          economic: z.number().min(0),
        }),
      })
      .parse(req.body);

    const result = optimitzacioService.optimitzarPonderacio(payload.estructures, payload.pesos);
    res.status(200).json(result);
  },

  async optimitzarPareto(req: Request, res: Response) {
    const { id } = z.object({ id: z.string().min(1) }).parse(req.params);
    await projectsService.getById(id, getIdentity(req));
    const payload = z.object({ estructures: z.array(z.unknown()).min(1) }).parse(req.body);

    const result = optimitzacioService.optimitzarPareto(payload.estructures);
    res.status(200).json(result);
  },

  async analisiSensibilitat(req: Request, res: Response) {
    const { id } = z.object({ id: z.string().min(1) }).parse(req.params);
    await projectsService.getById(id, getIdentity(req));
    const payload = z
      .object({
        estructures: z.array(z.unknown()).min(1),
        options: z
          .object({
            increment: z.number().positive().max(1).optional(),
            robustThresholdPercent: z.number().min(0).max(100).optional(),
          })
          .optional(),
      })
      .parse(req.body);

    const result = optimitzacioService.analisiSensibilitat(payload.estructures, payload.options);
    res.status(200).json(result);
  },

  async exportarBimIfc(req: Request, res: Response) {
    const { id } = z.object({ id: z.string().min(1) }).parse(req.params);
    const projecte = await projectsService.getById(id, getIdentity(req));
    const payload = z.object({ estructura: z.unknown() }).parse(req.body);

    const file = bimService.exportarAIFC(
      {
        id: projecte.id,
        codi: projecte.codi,
        nom: projecte.nom,
        descripcio: projecte.descripcio,
      },
      payload.estructura,
    );

    res.setHeader("Content-Type", file.mimeType);
    res.setHeader("Content-Disposition", `attachment; filename="${file.fileName}"`);
    res.status(200).send(file.content);
  },
};
