import { type Request, type Response } from "express";

import { calculsEmissionsService } from "../services/calculsEmissions.service.js";

export const emissionsController = {
  async calcularPetjada(req: Request, res: Response) {
    const resultat = await calculsEmissionsService.calcularPetjadaTotal(req.body);
    res.status(200).json(resultat);
  },
};
