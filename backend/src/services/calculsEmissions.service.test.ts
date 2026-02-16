import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => {
  const state = {
    versio: { id: "v-1", numero: "2024.1" },
    materials: [
      {
        id: "m-10a",
        codiMaterial: "10a",
        nom: "arido_natural_10a [10a]",
        categoria: "ARIDS",
        factorEmissio: 4.48,
        unitat: "T",
        fontDades: "DAP FdA (AN, 2022)",
        anyReferencia: 2022,
        versioBaseDadesId: "v-1",
        actiu: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "m-14a",
        codiMaterial: "14a",
        nom: "betun_convencional_14a [14a]",
        categoria: "BETUMS",
        factorEmissio: 272,
        unitat: "T",
        fontDades: "DAP REPSOL (2020)",
        anyReferencia: 2020,
        versioBaseDadesId: "v-1",
        actiu: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "m-13",
        codiMaterial: "13",
        nom: "ra_tratado_13 [13]",
        categoria: "RA",
        factorEmissio: 2.16,
        unitat: "T",
        fontDades: "DAP FdA (AN, 2023)",
        anyReferencia: 2023,
        versioBaseDadesId: "v-1",
        actiu: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    transport: [
      {
        id: "t-20",
        tipusVehicle: "camion_semirremolque_40t_bascualnte [20/40]",
        capacitatTonelades: 28,
        factorEmissio: 0.0849,
        unitat: "T_KM",
        fontDades: "SEVE V4.0 (2022)",
        anyReferencia: 2022,
        combustible: "GASOLEO",
        versioBaseDadesId: "v-1",
        actiu: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    constants: [
      {
        id: "c-1",
        nomMaterial: "aridos_naturales [A3-01]",
        calorEspecific: 0.835,
        unitat: "KG",
        temperaturaReferencia: 20,
        fontDades: "OC 3/2024",
        actiu: true,
        versioBaseDadesId: "v-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "c-2",
        nomMaterial: "betun [A3-03]",
        calorEspecific: 2.093,
        unitat: "KG",
        temperaturaReferencia: 20,
        fontDades: "OC 3/2024",
        actiu: true,
        versioBaseDadesId: "v-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "c-3",
        nomMaterial: "RA [A3-04]",
        calorEspecific: 0.89161,
        unitat: "KG",
        temperaturaReferencia: 20,
        fontDades: "OC 3/2024",
        actiu: true,
        versioBaseDadesId: "v-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "c-4",
        nomMaterial: "aigua [A3-05]",
        calorEspecific: 4.184,
        unitat: "KG",
        temperaturaReferencia: 20,
        fontDades: "OC 3/2024",
        actiu: true,
        versioBaseDadesId: "v-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "c-5",
        nomMaterial: "calor_vaporitzacio [A3-06]",
        calorEspecific: 2.25,
        unitat: "MJ",
        temperaturaReferencia: null,
        fontDades: "OC 3/2024",
        actiu: true,
        versioBaseDadesId: "v-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    combustibles: [
      {
        id: "f-31",
        nomCombustible: "GASOLEO",
        poderCalorificInferior: 43,
        unitatPoderCalorific: "MJ",
        factorEmissio: 3.17,
        unitatFactorEmissio: "KG",
        fontDades: "SEVE V4.0 (2022)",
        anyReferencia: 2022,
        actiu: true,
        versioBaseDadesId: "v-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    electric: [
      {
        id: "e-34b",
        tipusConsum: "MOTORS_CENTRAL",
        consumKwhPerTona: 1.5,
        factorEmissioRed: 0.283,
        factorEmissioGrupo: 0.84956,
        fontDades: "MITERD 2024",
        anyReferencia: 2024,
        actiu: true,
        versioBaseDadesId: "v-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "e-34c",
        tipusConsum: "CALENTAMENT_LIGANTS",
        consumKwhPerTona: 0.5,
        factorEmissioRed: 0.283,
        factorEmissioGrupo: 0.94466,
        fontDades: "EPA 2010",
        anyReferencia: 2010,
        actiu: true,
        versioBaseDadesId: "v-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    equips: [
      {
        id: "q-30",
        nomEquip: "pala_carregadora [30]",
        tipus: "A3_PALA",
        factorEmissio: 71.78,
        rendimentHoresPerTona: 0.0129,
        unitat: "H",
        fontDades: "SEVE Eco-comparateur 4.0",
        actiu: true,
        versioBaseDadesId: "v-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "q-51",
        nomEquip: "extendedora [51]",
        tipus: "A5",
        factorEmissio: 117.085,
        rendimentHoresPerTona: 0.008,
        unitat: "H",
        fontDades: "SEVE Eco-comparateur 4.0",
        actiu: true,
        versioBaseDadesId: "v-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    limits: [
      {
        id: "l-1",
        tipologiaMescla: "MBC_CONVENCIONAL",
        etapa: "A1_A5",
        valorLimit: 70,
        unitat: "T",
        fontNormativa: "OC 3/2024",
        dataEntradaVigor: new Date("2024-01-01"),
        actiu: true,
        versioBaseDadesId: "v-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  };

  const prismaMock = {
    prisma: {
      versioBaseDades: {
        findFirst: vi.fn(async () => state.versio),
      },
      factorEmissioMaterial: {
        findMany: vi.fn(async () => state.materials),
      },
      factorEmissioTransport: {
        findMany: vi.fn(async () => state.transport),
      },
      constantCalorifica: {
        findMany: vi.fn(async () => state.constants),
      },
      combustibleFabricacio: {
        findMany: vi.fn(async () => state.combustibles),
      },
      consumElectric: {
        findMany: vi.fn(async () => state.electric),
      },
      equipPosadaEnObra: {
        findMany: vi.fn(async () => state.equips),
      },
      limitNormatiuEmissions: {
        findMany: vi.fn(async () => state.limits),
      },
    },
  };

  return { prismaMock };
});

vi.mock("../config/database.js", () => prismaMock);

import { calculsEmissionsService } from "./calculsEmissions.service.js";

describe("calculsEmissionsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calcula A1 amb composicio per percentatge", async () => {
    const result = await calculsEmissionsService.calcularEmissionsA1(
      [
        { codiMaterial: "10a", percentatge: 94.5 },
        { codiMaterial: "14a", percentatge: 5.5 },
      ],
      1,
    );

    expect(result).toBeCloseTo(19.1936, 4);
  });

  it("calcula A2 amb distancia i factor de transport", async () => {
    const result = await calculsEmissionsService.calcularEmissionsA2(
      [
        { codiMaterial: "10a", percentatge: 95, distanciaKm: 35 },
        { codiMaterial: "14a", percentatge: 5, distanciaKm: 120 },
      ],
      1,
    );

    expect(result).toBeCloseTo(3.332325, 6);
  });

  it("calcula A3 amb model termodinamic i desglossament", async () => {
    const result = await calculsEmissionsService.calcularEmissionsA3(
      [
        { codiMaterial: "10a", percentatge: 93 },
        { codiMaterial: "14a", percentatge: 5 },
        { codiMaterial: "13", percentatge: 2 },
      ],
      {
        temperaturaInicialC: 20,
        temperaturaMesclaC: 160,
        humitatPercent: 3,
        perduesCalorPercent: 15,
        perduesRendimentMJ: 5,
        combustible: "GASOLEO",
        fontElectrica: "RED",
        fontCalentament: "CALDERA",
      },
      1,
    );

    expect(result.total).toBeGreaterThan(0);
    expect(result.desglossament.combustible).toBeGreaterThan(0);
    expect(result.termodinamic.deltaHMJ).toBeGreaterThan(0);
  });

  it("calcula A4 amb mermes", async () => {
    const result = await calculsEmissionsService.calcularEmissionsA4(
      { distanciaKm: 40, mermesPercent: 2 },
      1,
    );

    expect(result).toBeCloseTo(3.46392, 5);
  });

  it("calcula A5 amb hores per tona", async () => {
    const result = await calculsEmissionsService.calcularEmissionsA5(
      [{ nomEquip: "extendedora", horesPerTona: 0.008 }],
      1,
    );

    expect(result).toBeCloseTo(0.93668, 5);
  });

  it("calcula petjada total i compara amb limit normatiu", async () => {
    const result = await calculsEmissionsService.calcularPetjadaTotal({
      totalMesclaTones: 1,
      composicio: [
        { codiMaterial: "10a", percentatge: 94.5, distanciaKm: 25 },
        { codiMaterial: "14a", percentatge: 5.5, distanciaKm: 120 },
      ],
      parametresFabricacio: {
        temperaturaInicialC: 20,
        temperaturaMesclaC: 160,
        humitatPercent: 2.5,
        perduesCalorPercent: 15,
        perduesRendimentMJ: 5,
        combustible: "GASOLEO",
        fontElectrica: "RED",
        fontCalentament: "CALDERA",
      },
      transportMescla: {
        distanciaKm: 35,
        mermesPercent: 2,
      },
      equips: [{ nomEquip: "extendedora", horesPerTona: 0.008 }],
      tipologiaMescla: "MBC_CONVENCIONAL",
    });

    expect(result.total).toBeGreaterThan(0);
    expect(result.percentatges.A1 + result.percentatges.A2 + result.percentatges.A3 + result.percentatges.A4 + result.percentatges.A5).toBeCloseTo(100, 2);
    expect(result.comparativaNormativa.limit).toBe(70);
  });

  it("llenca error si no existeix material", async () => {
    await expect(
      calculsEmissionsService.calcularEmissionsA1([{ codiMaterial: "99x", percentatge: 100 }], 1),
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});
