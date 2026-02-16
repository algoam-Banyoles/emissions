import { type Request, type Response } from "express";
import { z } from "zod";

import { certificatsService } from "../services/certificats.service.js";
import { HttpError } from "../utils/http-error.js";

function getIdentity(req: Request) {
  if (!req.auth) {
    throw new HttpError(401, "No autoritzat");
  }

  return {
    userId: req.auth.userId,
    organitzacioId: req.auth.organitzacioId,
    email: req.auth.email,
  };
}

export const certificatsController = {
  async generar(req: Request, res: Response) {
    const generated = await certificatsService.generarCertificat({
      ...req.body,
      idioma: req.language ?? "ca",
    });
    const record = await certificatsService.guardarCertificat(generated, getIdentity(req));
    res.status(201).json(record);
  },

  async llistar(req: Request, res: Response) {
    const items = await certificatsService.llistarCertificats(getIdentity(req));
    res.status(200).json({ items });
  },

  async obtenir(req: Request, res: Response) {
    const { id } = z.object({ id: z.string().min(1) }).parse(req.params);
    const item = await certificatsService.obtenirCertificat(id, getIdentity(req));
    res.status(200).json(item);
  },

  async descarregarPdf(req: Request, res: Response) {
    const { id } = z.object({ id: z.string().min(1) }).parse(req.params);
    const { lang } = z
      .object({
        lang: z.enum(["ca", "es", "en", "fr"]).optional(),
      })
      .parse(req.query);
    const selectedLang = lang ?? req.language ?? "ca";
    const { record, buffer } = await certificatsService.obtenirPdfBufferIdioma(id, getIdentity(req), selectedLang);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${record.codi}-${selectedLang}.pdf"`);
    res.status(200).send(buffer);
  },

  async revocar(req: Request, res: Response) {
    const { id } = z.object({ id: z.string().min(1) }).parse(req.params);
    const item = await certificatsService.revocarCertificat(id, getIdentity(req));
    res.status(200).json(item);
  },
};
