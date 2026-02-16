import { describe, expect, it } from "vitest";

import { calculsEstructuralsService } from "./calculsEstructurals.service.js";

describe("calculsEstructuralsService.calcularNEC", () => {
  it("calcula NEC amb creixement positiu", () => {
    const nec = calculsEstructuralsService.calcularNEC({
      imd: 12000,
      percentatgePesants: 12,
      factorDistribucio: 0.6,
      factorEquivalencia: 1.4,
      anysProjecte: 20,
      creixementAnualPercent: 2,
    });

    expect(nec).toBeCloseTo(10727385.96, 0);
  });

  it("calcula NEC sense creixement (FC = anys)", () => {
    const nec = calculsEstructuralsService.calcularNEC({
      imd: 10000,
      percentatgePesants: 10,
      factorDistribucio: 0.5,
      factorEquivalencia: 1,
      anysProjecte: 10,
      creixementAnualPercent: 0,
    });

    expect(nec).toBeCloseTo(1825000, 0);
  });
});

describe("calculsEstructuralsService.verificarEstructura", () => {
  it("detecta estructura viable per NEC moderat i capes robustes", () => {
    const nec = calculsEstructuralsService.calcularNEC({
      imd: 6000,
      percentatgePesants: 8,
      factorDistribucio: 0.55,
      factorEquivalencia: 1.1,
      anysProjecte: 15,
      creixementAnualPercent: 1,
    });

    const result = calculsEstructuralsService.verificarEstructura(
      [
        { tipus: "RODAMENT", nom: "CR", gruixCm: 6, modulElasticMpa: 5200, coeficientPoisson: 0.35 },
        { tipus: "INTERMEDIA", nom: "CI", gruixCm: 8, modulElasticMpa: 4700, coeficientPoisson: 0.35 },
        { tipus: "BASE", nom: "CB", gruixCm: 14, modulElasticMpa: 4200, coeficientPoisson: 0.35 },
        { tipus: "SUBBASE", nom: "CS", gruixCm: 22, modulElasticMpa: 2600, coeficientPoisson: 0.35 },
      ],
      nec,
      { modulElasticMpa: 250, coeficientPoisson: 0.4 },
    );

    expect(result.viable).toBe(true);
    expect(result.ratios.fatiga).toBeLessThanOrEqual(1);
    expect(result.ratios.aixecament).toBeLessThanOrEqual(1);
    expect(result.deformacions.deformacioSuperficialMm).toBeLessThan(25);
  });

  it("detecta estructura no viable en cas de capes massa febles", () => {
    const result = calculsEstructuralsService.verificarEstructura(
      [
        { tipus: "RODAMENT", nom: "CR", gruixCm: 3, modulElasticMpa: 1500, coeficientPoisson: 0.35 },
        { tipus: "BASE", nom: "CB", gruixCm: 4, modulElasticMpa: 1200, coeficientPoisson: 0.35 },
      ],
      30_000_000,
      { modulElasticMpa: 60, coeficientPoisson: 0.42 },
    );

    expect(result.viable).toBe(false);
    expect(result.ratios.fatiga > 1 || result.ratios.aixecament > 1 || result.deformacions.deformacioSuperficialMm > 25).toBe(true);
  });
});

describe("calculsEstructuralsService.generarCombinacionsCapes", () => {
  it("genera totes les combinacions amb pas de 0.5 cm", () => {
    const combinations = calculsEstructuralsService.generarCombinacionsCapes("REFORC", {
      capes: [
        { tipus: "RODAMENT", gruixMinCm: 3, gruixMaxCm: 4, pasCm: 0.5, modulElasticMpa: 5000, nom: "CR" },
        { tipus: "BASE", gruixMinCm: 6, gruixMaxCm: 7, pasCm: 0.5, modulElasticMpa: 4000, nom: "CB" },
      ],
    });

    // (3,3.5,4) x (6,6.5,7) = 9
    expect(combinations).toHaveLength(9);
    expect(combinations[0]).toHaveLength(2);
    expect(combinations[0]?.[0]?.gruixCm).toBe(3);
    expect(combinations[8]?.[1]?.gruixCm).toBe(7);
  });

  it("respecta limit de combinacions", () => {
    const combinations = calculsEstructuralsService.generarCombinacionsCapes("NOVA_CONSTRUCCIO", {
      capes: [
        { tipus: "RODAMENT", gruixMinCm: 4, gruixMaxCm: 10, pasCm: 0.5, modulElasticMpa: 5000 },
        { tipus: "BASE", gruixMinCm: 8, gruixMaxCm: 16, pasCm: 0.5, modulElasticMpa: 4000 },
        { tipus: "SUBBASE", gruixMinCm: 12, gruixMaxCm: 20, pasCm: 0.5, modulElasticMpa: 2500 },
      ],
      limitCombinacions: 100,
    });

    expect(combinations.length).toBeLessThanOrEqual(100);
  });
});
