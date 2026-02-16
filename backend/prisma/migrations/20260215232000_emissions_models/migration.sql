-- CreateEnum
CREATE TYPE "CategoriaMaterialEmissio" AS ENUM ('ARIDS', 'BETUMS', 'EMULSIONS', 'ADDITIUS', 'CIMENTS', 'RA', 'FIBRES', 'ALTRES');

-- CreateEnum
CREATE TYPE "UnitatMesura" AS ENUM ('KG', 'T', 'M3', 'L', 'KWH', 'H', 'T_KM', 'MJ', 'GJ');

-- CreateEnum
CREATE TYPE "CombustibleTipus" AS ENUM ('GASOLEO', 'FUELOLEO', 'GAS_NATURAL', 'ALTRE');

-- CreateEnum
CREATE TYPE "TipusConsumElectric" AS ENUM ('MOTORS_CENTRAL', 'CALENTAMENT_LIGANTS', 'ALTRE');

-- CreateEnum
CREATE TYPE "EtapaEmissions" AS ENUM ('A1', 'A2', 'A3', 'A4', 'A5', 'A1_A5');

-- CreateEnum
CREATE TYPE "TipologiaMescla" AS ENUM ('MBC_CONVENCIONAL', 'MBC_AMB_RA', 'MBT', 'AUTL', 'ALTRE');

-- CreateEnum
CREATE TYPE "TipusCanviEmissio" AS ENUM ('CREAT', 'MODIFICAT', 'ELIMINAT', 'IMPORTAT', 'ACTIVACIO_VERSIO');

-- CreateTable
CREATE TABLE "FactorEmissioMaterial" (
    "id" TEXT NOT NULL,
    "codiMaterial" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "categoria" "CategoriaMaterialEmissio" NOT NULL,
    "factorEmissio" DOUBLE PRECISION NOT NULL,
    "unitat" "UnitatMesura" NOT NULL,
    "fontDades" TEXT NOT NULL,
    "anyReferencia" INTEGER NOT NULL,
    "versioDap" TEXT,
    "incertesaPercentatge" DOUBLE PRECISION,
    "esCredit" BOOLEAN NOT NULL DEFAULT false,
    "actiu" BOOLEAN NOT NULL DEFAULT true,
    "versioBaseDadesId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FactorEmissioMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FactorEmissioTransport" (
    "id" TEXT NOT NULL,
    "tipusVehicle" TEXT NOT NULL,
    "capacitatTonelades" DOUBLE PRECISION NOT NULL,
    "factorEmissio" DOUBLE PRECISION NOT NULL,
    "unitat" "UnitatMesura" NOT NULL DEFAULT 'T_KM',
    "fontDades" TEXT NOT NULL,
    "anyReferencia" INTEGER NOT NULL,
    "combustible" "CombustibleTipus" NOT NULL,
    "actiu" BOOLEAN NOT NULL DEFAULT true,
    "versioBaseDadesId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FactorEmissioTransport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConstantCalorifica" (
    "id" TEXT NOT NULL,
    "nomMaterial" TEXT NOT NULL,
    "calorEspecific" DOUBLE PRECISION NOT NULL,
    "unitat" "UnitatMesura" NOT NULL DEFAULT 'KG',
    "temperaturaReferencia" DOUBLE PRECISION,
    "fontDades" TEXT NOT NULL,
    "actiu" BOOLEAN NOT NULL DEFAULT true,
    "versioBaseDadesId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConstantCalorifica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CombustibleFabricacio" (
    "id" TEXT NOT NULL,
    "nomCombustible" "CombustibleTipus" NOT NULL,
    "poderCalorificInferior" DOUBLE PRECISION NOT NULL,
    "unitatPoderCalorific" "UnitatMesura" NOT NULL DEFAULT 'MJ',
    "factorEmissio" DOUBLE PRECISION NOT NULL,
    "unitatFactorEmissio" "UnitatMesura" NOT NULL DEFAULT 'KG',
    "fontDades" TEXT NOT NULL,
    "anyReferencia" INTEGER NOT NULL,
    "actiu" BOOLEAN NOT NULL DEFAULT true,
    "versioBaseDadesId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CombustibleFabricacio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsumElectric" (
    "id" TEXT NOT NULL,
    "tipusConsum" "TipusConsumElectric" NOT NULL,
    "consumKwhPerTona" DOUBLE PRECISION NOT NULL,
    "factorEmissioRed" DOUBLE PRECISION NOT NULL,
    "factorEmissioGrupo" DOUBLE PRECISION NOT NULL,
    "fontDades" TEXT NOT NULL,
    "anyReferencia" INTEGER NOT NULL,
    "actiu" BOOLEAN NOT NULL DEFAULT true,
    "versioBaseDadesId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConsumElectric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EquipPosadaEnObra" (
    "id" TEXT NOT NULL,
    "nomEquip" TEXT NOT NULL,
    "tipus" TEXT NOT NULL,
    "factorEmissio" DOUBLE PRECISION NOT NULL,
    "rendimentHoresPerTona" DOUBLE PRECISION NOT NULL,
    "unitat" "UnitatMesura" NOT NULL DEFAULT 'H',
    "fontDades" TEXT NOT NULL,
    "actiu" BOOLEAN NOT NULL DEFAULT true,
    "versioBaseDadesId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EquipPosadaEnObra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LimitNormatiuEmissions" (
    "id" TEXT NOT NULL,
    "tipologiaMescla" "TipologiaMescla" NOT NULL,
    "etapa" "EtapaEmissions" NOT NULL,
    "valorLimit" DOUBLE PRECISION NOT NULL,
    "unitat" "UnitatMesura" NOT NULL DEFAULT 'T',
    "fontNormativa" TEXT NOT NULL,
    "dataEntradaVigor" TIMESTAMP(3) NOT NULL,
    "actiu" BOOLEAN NOT NULL DEFAULT true,
    "versioBaseDadesId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LimitNormatiuEmissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmissionsChangeLog" (
    "id" TEXT NOT NULL,
    "versioBaseDadesId" TEXT NOT NULL,
    "usuariId" TEXT,
    "tipusCanvi" "TipusCanviEmissio" NOT NULL,
    "entitat" TEXT NOT NULL,
    "registreId" TEXT NOT NULL,
    "valorsAnteriors" JSONB,
    "valorsNous" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmissionsChangeLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FactorEmissioMaterial_codiMaterial_versioBaseDadesId_key" ON "FactorEmissioMaterial"("codiMaterial", "versioBaseDadesId");

-- CreateIndex
CREATE INDEX "FactorEmissioMaterial_categoria_actiu_idx" ON "FactorEmissioMaterial"("categoria", "actiu");

-- CreateIndex
CREATE INDEX "FactorEmissioMaterial_versioBaseDadesId_actiu_idx" ON "FactorEmissioMaterial"("versioBaseDadesId", "actiu");

-- CreateIndex
CREATE INDEX "FactorEmissioTransport_tipusVehicle_actiu_idx" ON "FactorEmissioTransport"("tipusVehicle", "actiu");

-- CreateIndex
CREATE INDEX "FactorEmissioTransport_versioBaseDadesId_actiu_idx" ON "FactorEmissioTransport"("versioBaseDadesId", "actiu");

-- CreateIndex
CREATE INDEX "ConstantCalorifica_nomMaterial_actiu_idx" ON "ConstantCalorifica"("nomMaterial", "actiu");

-- CreateIndex
CREATE INDEX "ConstantCalorifica_versioBaseDadesId_actiu_idx" ON "ConstantCalorifica"("versioBaseDadesId", "actiu");

-- CreateIndex
CREATE UNIQUE INDEX "CombustibleFabricacio_nomCombustible_versioBaseDadesId_key" ON "CombustibleFabricacio"("nomCombustible", "versioBaseDadesId");

-- CreateIndex
CREATE INDEX "CombustibleFabricacio_versioBaseDadesId_actiu_idx" ON "CombustibleFabricacio"("versioBaseDadesId", "actiu");

-- CreateIndex
CREATE UNIQUE INDEX "ConsumElectric_tipusConsum_versioBaseDadesId_key" ON "ConsumElectric"("tipusConsum", "versioBaseDadesId");

-- CreateIndex
CREATE INDEX "ConsumElectric_versioBaseDadesId_actiu_idx" ON "ConsumElectric"("versioBaseDadesId", "actiu");

-- CreateIndex
CREATE INDEX "EquipPosadaEnObra_tipus_actiu_idx" ON "EquipPosadaEnObra"("tipus", "actiu");

-- CreateIndex
CREATE INDEX "EquipPosadaEnObra_versioBaseDadesId_actiu_idx" ON "EquipPosadaEnObra"("versioBaseDadesId", "actiu");

-- CreateIndex
CREATE INDEX "LimitNormatiuEmissions_tipologiaMescla_etapa_actiu_idx" ON "LimitNormatiuEmissions"("tipologiaMescla", "etapa", "actiu");

-- CreateIndex
CREATE INDEX "LimitNormatiuEmissions_versioBaseDadesId_actiu_idx" ON "LimitNormatiuEmissions"("versioBaseDadesId", "actiu");

-- CreateIndex
CREATE INDEX "EmissionsChangeLog_versioBaseDadesId_createdAt_idx" ON "EmissionsChangeLog"("versioBaseDadesId", "createdAt");

-- CreateIndex
CREATE INDEX "EmissionsChangeLog_entitat_registreId_idx" ON "EmissionsChangeLog"("entitat", "registreId");

-- AddForeignKey
ALTER TABLE "FactorEmissioMaterial" ADD CONSTRAINT "FactorEmissioMaterial_versioBaseDadesId_fkey" FOREIGN KEY ("versioBaseDadesId") REFERENCES "VersioBaseDades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FactorEmissioTransport" ADD CONSTRAINT "FactorEmissioTransport_versioBaseDadesId_fkey" FOREIGN KEY ("versioBaseDadesId") REFERENCES "VersioBaseDades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConstantCalorifica" ADD CONSTRAINT "ConstantCalorifica_versioBaseDadesId_fkey" FOREIGN KEY ("versioBaseDadesId") REFERENCES "VersioBaseDades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CombustibleFabricacio" ADD CONSTRAINT "CombustibleFabricacio_versioBaseDadesId_fkey" FOREIGN KEY ("versioBaseDadesId") REFERENCES "VersioBaseDades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsumElectric" ADD CONSTRAINT "ConsumElectric_versioBaseDadesId_fkey" FOREIGN KEY ("versioBaseDadesId") REFERENCES "VersioBaseDades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipPosadaEnObra" ADD CONSTRAINT "EquipPosadaEnObra_versioBaseDadesId_fkey" FOREIGN KEY ("versioBaseDadesId") REFERENCES "VersioBaseDades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LimitNormatiuEmissions" ADD CONSTRAINT "LimitNormatiuEmissions_versioBaseDadesId_fkey" FOREIGN KEY ("versioBaseDadesId") REFERENCES "VersioBaseDades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmissionsChangeLog" ADD CONSTRAINT "EmissionsChangeLog_versioBaseDadesId_fkey" FOREIGN KEY ("versioBaseDadesId") REFERENCES "VersioBaseDades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmissionsChangeLog" ADD CONSTRAINT "EmissionsChangeLog_usuariId_fkey" FOREIGN KEY ("usuariId") REFERENCES "Usuari"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Checks for data quality and validation
ALTER TABLE "FactorEmissioMaterial" ADD CONSTRAINT "FactorEmissioMaterial_factor_nonnegative_or_credit" CHECK ("factorEmissio" >= 0 OR "esCredit" = true);
ALTER TABLE "FactorEmissioMaterial" ADD CONSTRAINT "FactorEmissioMaterial_any_referencia_range" CHECK ("anyReferencia" >= 1900 AND "anyReferencia" <= 2100);

ALTER TABLE "FactorEmissioTransport" ADD CONSTRAINT "FactorEmissioTransport_factor_nonnegative" CHECK ("factorEmissio" >= 0);
ALTER TABLE "FactorEmissioTransport" ADD CONSTRAINT "FactorEmissioTransport_capacitat_positive" CHECK ("capacitatTonelades" > 0);
ALTER TABLE "FactorEmissioTransport" ADD CONSTRAINT "FactorEmissioTransport_any_referencia_range" CHECK ("anyReferencia" >= 1900 AND "anyReferencia" <= 2100);
ALTER TABLE "FactorEmissioTransport" ADD CONSTRAINT "FactorEmissioTransport_unitat_consistent" CHECK ("unitat" = 'T_KM');

ALTER TABLE "ConstantCalorifica" ADD CONSTRAINT "ConstantCalorifica_calor_nonnegative" CHECK ("calorEspecific" >= 0);

ALTER TABLE "CombustibleFabricacio" ADD CONSTRAINT "CombustibleFabricacio_pci_positive" CHECK ("poderCalorificInferior" > 0);
ALTER TABLE "CombustibleFabricacio" ADD CONSTRAINT "CombustibleFabricacio_factor_nonnegative" CHECK ("factorEmissio" >= 0);
ALTER TABLE "CombustibleFabricacio" ADD CONSTRAINT "CombustibleFabricacio_any_referencia_range" CHECK ("anyReferencia" >= 1900 AND "anyReferencia" <= 2100);

ALTER TABLE "ConsumElectric" ADD CONSTRAINT "ConsumElectric_values_nonnegative" CHECK ("consumKwhPerTona" >= 0 AND "factorEmissioRed" >= 0 AND "factorEmissioGrupo" >= 0);
ALTER TABLE "ConsumElectric" ADD CONSTRAINT "ConsumElectric_any_referencia_range" CHECK ("anyReferencia" >= 1900 AND "anyReferencia" <= 2100);

ALTER TABLE "EquipPosadaEnObra" ADD CONSTRAINT "EquipPosadaEnObra_values_nonnegative" CHECK ("factorEmissio" >= 0 AND "rendimentHoresPerTona" >= 0);
ALTER TABLE "EquipPosadaEnObra" ADD CONSTRAINT "EquipPosadaEnObra_unitat_consistent" CHECK ("unitat" = 'H');

ALTER TABLE "LimitNormatiuEmissions" ADD CONSTRAINT "LimitNormatiuEmissions_limit_nonnegative" CHECK ("valorLimit" >= 0);
