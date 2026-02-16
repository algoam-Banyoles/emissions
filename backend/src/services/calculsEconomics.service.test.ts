import { describe, expect, it } from "vitest";

import { calculsEconomicsService } from "./calculsEconomics.service.js";

describe("calculsEconomicsService", () => {
  it("calcula cost material i transport basics", () => {
    const material = calculsEconomicsService.calcularCostMaterial("AC16", 5, 70);
    const transport = calculsEconomicsService.calcularCostTransport("AC16", 30, 0.12, 0.12);

    expect(material).toBeGreaterThan(0);
    expect(transport).toBeCloseTo(0.432, 3);
  });

  it("calcula cost total amb desglossament per capa", () => {
    const resultat = calculsEconomicsService.calcularCostTotal({
      estructura: {
        tipologia: "NOVA_CONSTRUCCIO",
        capes: [
          { tipus: "RODAMENT", nom: "AC16", gruixCm: 4, modulElasticMpa: 5200, coeficientPoisson: 0.35 },
          { tipus: "BASE", nom: "AC22", gruixCm: 10, modulElasticMpa: 4200, coeficientPoisson: 0.35 },
        ],
      },
      areaM2: 1000,
      vidaUtilAnys: 20,
      preus: {
        costFabricacioEurT: 18,
      },
      distancies: {
        distanciaGeneralKm: 35,
        tarifaTransportEurTKm: 0.13,
      },
      tarifaPosadaObraEurM2: 7,
    });

    expect(resultat.perCapa).toHaveLength(2);
    expect(resultat.totalEurM2).toBeGreaterThan(resultat.materialEurM2);
    expect(resultat.costAnyVidaUtilEurM2).toBeCloseTo(resultat.totalEurM2 / 20, 6);
  });
});
