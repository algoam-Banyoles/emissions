import {
  CategoriaMaterialEmissio,
  CombustibleTipus,
  EtapaEmissions,
  PrismaClient,
  TipologiaMescla,
  TipusCanviEmissio,
  TipusConsumElectric,
  UnitatMesura,
} from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const version = await prisma.versioBaseDades.upsert({
    where: { numero: "2024.1" },
    update: {
      descripcio: "Versio base emissions OC 3/2024",
      estat: "PUBLICADA",
      esActual: true,
      dataPublicacio: new Date("2024-01-01T00:00:00.000Z"),
      fitxersFont: ["OC_3_2024_base.csv"],
    },
    create: {
      numero: "2024.1",
      descripcio: "Versio base emissions OC 3/2024",
      estat: "PUBLICADA",
      esActual: true,
      dataPublicacio: new Date("2024-01-01T00:00:00.000Z"),
      fitxersFont: ["OC_3_2024_base.csv"],
    },
  });

  await prisma.versioBaseDades.updateMany({
    where: { id: { not: version.id }, esActual: true },
    data: { esActual: false },
  });

  await prisma.$transaction([
    prisma.factorEmissioMaterial.deleteMany({ where: { versioBaseDadesId: version.id } }),
    prisma.factorEmissioTransport.deleteMany({ where: { versioBaseDadesId: version.id } }),
    prisma.constantCalorifica.deleteMany({ where: { versioBaseDadesId: version.id } }),
    prisma.combustibleFabricacio.deleteMany({ where: { versioBaseDadesId: version.id } }),
    prisma.consumElectric.deleteMany({ where: { versioBaseDadesId: version.id } }),
    prisma.equipPosadaEnObra.deleteMany({ where: { versioBaseDadesId: version.id } }),
    prisma.limitNormatiuEmissions.deleteMany({ where: { versioBaseDadesId: version.id } }),
  ]);

  await prisma.factorEmissioMaterial.createMany({
    data: [
      {
        codiMaterial: "14a",
        nom: "Betum convencional",
        categoria: CategoriaMaterialEmissio.BETUMS,
        factorEmissio: 272.0,
        unitat: UnitatMesura.T,
        fontDades: "DAP REPSOL (2020)",
        anyReferencia: 2020,
        versioDap: "2020",
        incertesaPercentatge: 5.0,
        esCredit: false,
        actiu: true,
        versioBaseDadesId: version.id,
      },
      {
        codiMaterial: "16a",
        nom: "RARx 100% CaCO3",
        categoria: CategoriaMaterialEmissio.RA,
        factorEmissio: -141.0,
        unitat: UnitatMesura.T,
        fontDades: "DAP CIRTEC (2024)",
        anyReferencia: 2024,
        versioDap: "2024",
        incertesaPercentatge: 8.0,
        esCredit: true,
        actiu: true,
        versioBaseDadesId: version.id,
      },
    ],
  });

  await prisma.factorEmissioTransport.createMany({
    data: [
      {
        tipusVehicle: "camion_semirremolque_28t",
        capacitatTonelades: 28,
        factorEmissio: 0.0849,
        unitat: UnitatMesura.T_KM,
        fontDades: "SEVE V4.0 (2022)",
        anyReferencia: 2022,
        combustible: CombustibleTipus.GASOLEO,
        actiu: true,
        versioBaseDadesId: version.id,
      },
    ],
  });

  await prisma.constantCalorifica.createMany({
    data: [
      {
        nomMaterial: "arids_naturals",
        calorEspecific: 0.835,
        unitat: UnitatMesura.KG,
        temperaturaReferencia: 20,
        fontDades: "OC 3/2024",
        actiu: true,
        versioBaseDadesId: version.id,
      },
    ],
  });

  await prisma.combustibleFabricacio.createMany({
    data: [
      {
        nomCombustible: CombustibleTipus.GASOLEO,
        poderCalorificInferior: 43.0,
        unitatPoderCalorific: UnitatMesura.MJ,
        factorEmissio: 3.17,
        unitatFactorEmissio: UnitatMesura.KG,
        fontDades: "SEVE V4.0 (2022)",
        anyReferencia: 2022,
        actiu: true,
        versioBaseDadesId: version.id,
      },
      {
        nomCombustible: CombustibleTipus.GAS_NATURAL,
        poderCalorificInferior: 48.31,
        unitatPoderCalorific: UnitatMesura.MJ,
        factorEmissio: 70.19,
        unitatFactorEmissio: UnitatMesura.KG,
        fontDades: "Inventaris GEI + Ecoinvent",
        anyReferencia: 2024,
        actiu: true,
        versioBaseDadesId: version.id,
      },
    ],
  });

  await prisma.consumElectric.createMany({
    data: [
      {
        tipusConsum: TipusConsumElectric.MOTORS_CENTRAL,
        consumKwhPerTona: 1.5,
        factorEmissioRed: 0.283,
        factorEmissioGrupo: 0.84956,
        fontDades: "MITERD 2024 / EPA 2010",
        anyReferencia: 2024,
        actiu: true,
        versioBaseDadesId: version.id,
      },
      {
        tipusConsum: TipusConsumElectric.CALENTAMENT_LIGANTS,
        consumKwhPerTona: 0.5,
        factorEmissioRed: 0.283,
        factorEmissioGrupo: 0.94466,
        fontDades: "MITERD 2024 / EPA 2010",
        anyReferencia: 2024,
        actiu: true,
        versioBaseDadesId: version.id,
      },
    ],
  });

  await prisma.equipPosadaEnObra.createMany({
    data: [
      {
        nomEquip: "extendedora",
        tipus: "extendit",
        factorEmissio: 117.085,
        rendimentHoresPerTona: 0.008,
        unitat: UnitatMesura.H,
        fontDades: "SEVE Eco-comparateur 4.0",
        actiu: true,
        versioBaseDadesId: version.id,
      },
    ],
  });

  await prisma.limitNormatiuEmissions.createMany({
    data: [
      {
        tipologiaMescla: TipologiaMescla.MBC_CONVENCIONAL,
        etapa: EtapaEmissions.A1_A5,
        valorLimit: 70.0,
        unitat: UnitatMesura.T,
        fontNormativa: "OC 3/2024",
        dataEntradaVigor: new Date("2024-01-01T00:00:00.000Z"),
        actiu: true,
        versioBaseDadesId: version.id,
      },
    ],
  });

  await prisma.emissionsChangeLog.create({
    data: {
      versioBaseDadesId: version.id,
      tipusCanvi: TipusCanviEmissio.IMPORTAT,
      entitat: "SeedEmissions",
      registreId: "2024.1",
      valorsNous: {
        materialsA1: 2,
        transportsA2A4: 1,
        combustiblesA3: 2,
      },
    },
  });

  console.log(`Seed emissions completat per a la versio ${version.numero}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
