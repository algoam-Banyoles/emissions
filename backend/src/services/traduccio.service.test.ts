import { describe, expect, it } from "vitest";

import { traduccioService } from "./traduccio.service.js";

const input = {
  projecteNom: "Projecte Test",
  obraNom: "Obra Test",
  fabricantNom: "Fabricant",
  mesclaNom: "MBC",
  tipologiaMescla: "MBC",
  versioMetodologia: "OC 3/2024",
  quantitatTones: 100,
  emissions: {
    A1: 1,
    A2: 1,
    A3: 1,
    A4: 1,
    A5: 1,
    total: 5,
    limit: 70,
    unitat: "kg CO2e/t",
  },
  annexText: "Text base",
};

describe("traduccioService", () => {
  it("traduiex certificat i annex en angles", () => {
    const result = traduccioService.traduirCertificat(input, "en");

    expect(result.plantilla.title).toContain("ENVIRONMENTAL");
    expect(result.dades.annexText).toContain("Calculation annex");
  });

  it("aplica prefix d'annex buit", () => {
    const annex = traduccioService.traduirAnnex("", "ca");
    expect(annex).toBe("Annex de calcul.");
  });
});
