import { type Request, type Response } from "express";
import { z } from "zod";

import { emissionsAdminService } from "../services/emissions-admin.service.js";
import { emissionsExportService } from "../services/emissions-export.service.js";
import { emissionsImportService } from "../services/emissions-import.service.js";
import { emissionsValidationService } from "../services/emissions-validation.service.js";
import { HttpError } from "../utils/http-error.js";

function getUserId(req: Request) {
  if (!req.auth) {
    throw new HttpError(401, "No autoritzat");
  }

  return req.auth.userId;
}

function parseResource(req: Request) {
  return emissionsAdminService.parseResource(req.params["resource"]);
}

function parseBoolean(value: unknown, fallback = false) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return value.toLowerCase() === "true";
  }

  return fallback;
}

export const emissionsAdminController = {
  async list(req: Request, res: Response) {
    const resource = parseResource(req);
    const result = await emissionsAdminService.list(resource, req.query);
    res.status(200).json(result);
  },

  async importFactors(req: Request, res: Response) {
    const categoria = emissionsImportService.parseCategory(req.body?.categoria);
    const file = req.file;

    if (!file) {
      throw new HttpError(400, "Fitxer obligatori");
    }

    const isConfirm = parseBoolean(req.body?.confirm, false);
    const delimiter = req.body?.delimiter === ";" || req.body?.delimiter === "," ? req.body.delimiter : undefined;

    if (!isConfirm) {
      const preview = await emissionsImportService.preview({
        categoria,
        fileName: file.originalname,
        fileBuffer: file.buffer,
        ...(delimiter ? { delimiter } : {}),
      });
      res.status(200).json({ mode: "preview", ...preview });
      return;
    }

    const imported = await emissionsImportService.import({
      categoria,
      fileName: file.originalname,
      fileBuffer: file.buffer,
      ...(delimiter ? { delimiter } : {}),
      confirm: true,
      numeroVersio: req.body?.numeroVersio as string | undefined,
      descripcio: req.body?.descripcio as string | undefined,
      usuariId: getUserId(req),
    });

    let validation = null;
    try {
      validation = await emissionsValidationService.executeValidation({
        trigger: "import",
        initiatedBy: getUserId(req),
      });
    } catch (error) {
      console.error("[validation] error executant validacio post-import", error);
    }

    res.status(201).json({ mode: "imported", ...imported, validation });
  },

  async exportFactors(req: Request, res: Response) {
    const categoria = emissionsExportService.parseCategory(req.query["categoria"]);
    const format = emissionsExportService.parseFormat(req.query["format"] ?? "csv");
    const result = await emissionsExportService.export({
      categoria,
      format,
      versio: typeof req.query["versio"] === "string" ? req.query["versio"] : undefined,
      usuariEmail: req.auth?.email,
    });

    res.setHeader("Content-Type", result.mimeType);
    res.setHeader("Content-Disposition", `attachment; filename=${result.fileName}`);
    res.status(200).send(result.content);
  },

  async create(req: Request, res: Response) {
    const resource = parseResource(req);
    const created = await emissionsAdminService.create(resource, req.body, getUserId(req));
    res.status(201).json(created);
  },

  async update(req: Request, res: Response) {
    const resource = parseResource(req);
    const { id } = z.object({ id: z.string().min(1) }).parse(req.params);
    const updated = await emissionsAdminService.update(resource, id, req.body, getUserId(req));
    res.status(200).json(updated);
  },

  async remove(req: Request, res: Response) {
    const resource = parseResource(req);
    const { id } = z.object({ id: z.string().min(1) }).parse(req.params);
    await emissionsAdminService.remove(resource, id, getUserId(req));
    res.status(204).send();
  },

  async bulkUpdateVersion(req: Request, res: Response) {
    const resource = parseResource(req);
    const result = await emissionsAdminService.bulkUpdateVersion(resource, req.body, getUserId(req));
    res.status(200).json(result);
  },

  async exportCsv(req: Request, res: Response) {
    const resource = parseResource(req);
    const ids = typeof req.query["ids"] === "string"
      ? req.query["ids"].split(",").filter(Boolean)
      : undefined;

    const csv = await emissionsAdminService.exportCsv(resource, ids);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=emissions-${resource}-${new Date().toISOString().slice(0, 10)}.csv`,
    );
    res.status(200).send(csv);
  },

  async listHistory(req: Request, res: Response) {
    const result = await emissionsAdminService.listHistory(req.query);
    res.status(200).json(result);
  },

  async runValidation(req: Request, res: Response) {
    const result = await emissionsValidationService.executeValidation({
      trigger: "manual",
      initiatedBy: getUserId(req),
    });
    res.status(200).json(result);
  },

  async getLatestValidation(_req: Request, res: Response) {
    const latest = await emissionsValidationService.getLatestValidation();
    res.status(200).json(latest);
  },

  async getValidationHistory(req: Request, res: Response) {
    const { limit } = z.object({ limit: z.coerce.number().int().positive().max(100).default(20) }).parse(req.query);
    const history = await emissionsValidationService.getValidationHistory(limit);
    res.status(200).json(history);
  },

  async revert(req: Request, res: Response) {
    const payload = {
      logId: req.params["logId"],
      confirm: req.body?.confirm,
    };
    const result = await emissionsAdminService.revert(payload, getUserId(req));
    res.status(200).json(result);
  },
};
