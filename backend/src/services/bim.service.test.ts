import { describe, expect, it } from "vitest";

import { bimService } from "./bim.service.js";

describe("bimService", () => {
  it("exporta IFC4 amb entitats principals", () => {
    const result = bimService.exportarAIFC(
      {
        id: "p-1",
        codi: "PRJ-001",
        nom: "Projecte Demo",
        descripcio: "Desc",
      },
      {
        nom: "Estructura 1",
        capes: [
          { tipus: "RODAMENT", nom: "AC16", gruixCm: 4, modulElasticMpa: 5200, coeficientPoisson: 0.35 },
          { tipus: "BASE", nom: "AC22", gruixCm: 10, modulElasticMpa: 4200, coeficientPoisson: 0.35 },
        ],
        emissions: { A1: 20, A2: 5, A3: 10, A4: 4, A5: 3, totalKgT: 42, kgM2: 18 },
        costos: { totalEurM2: 55, costAnyVidaUtilEurM2: 2.7 },
      },
    );

    expect(result.fileName.endsWith(".ifc")).toBe(true);
    expect(result.content).toContain("FILE_SCHEMA(('IFC4'))");
    expect(result.content).toContain("IFCPROJECT");
    expect(result.content).toContain("IFCBUILDING");
    expect(result.content).toContain("IFCBUILDINGSTOREY");
    expect(result.content).toContain("IFCBUILDINGELEMENTPROXY");
    expect(result.content).toContain("IFCPROPERTYSET");
  });
});
