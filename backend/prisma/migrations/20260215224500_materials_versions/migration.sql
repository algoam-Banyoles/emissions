-- CreateEnum
CREATE TYPE "EstatVersioBaseDades" AS ENUM ('ESBORRANY', 'PUBLICADA', 'OBSOLETA');

-- CreateEnum
CREATE TYPE "TipusMaterial" AS ENUM ('MESCLA_BITUMINOSA', 'MACADAM', 'ESTABILITZAT', 'GRAVA', 'ALTRE');

-- AlterTable
ALTER TABLE "VersioBaseDades"
  ADD COLUMN "estat" "EstatVersioBaseDades" NOT NULL DEFAULT 'ESBORRANY',
  ADD COLUMN "fitxersFont" JSONB,
  ADD COLUMN "createdById" TEXT;

ALTER TABLE "VersioBaseDades"
  ALTER COLUMN "dataPublicacio" DROP NOT NULL,
  ALTER COLUMN "dataPublicacio" DROP DEFAULT;

UPDATE "VersioBaseDades"
SET "estat" = 'PUBLICADA',
    "dataPublicacio" = COALESCE("dataPublicacio", CURRENT_TIMESTAMP)
WHERE "numero" IS NOT NULL;

-- CreateTable
CREATE TABLE "Material" (
    "id" TEXT NOT NULL,
    "codi" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "tipus" "TipusMaterial" NOT NULL,
    "descripcio" TEXT,
    "modulElasticMpa" DOUBLE PRECISION,
    "coeficientPoisson" DOUBLE PRECISION,
    "resistenciaFlexioMpa" DOUBLE PRECISION,
    "resistenciaCompressioMpa" DOUBLE PRECISION,
    "densitatTM3" DOUBLE PRECISION,
    "factorEmissioA1" DOUBLE PRECISION,
    "fontFactorEmissio" TEXT,
    "preuBaseEurT" DOUBLE PRECISION,
    "unitatPreu" TEXT NOT NULL DEFAULT 't',
    "actiu" BOOLEAN NOT NULL DEFAULT true,
    "versioBaseDadesId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialAuditLog" (
    "id" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "usuariId" TEXT,
    "accio" TEXT NOT NULL,
    "dadesAnteriors" JSONB,
    "dadesNoves" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MaterialAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Material_codi_key" ON "Material"("codi");

-- CreateIndex
CREATE INDEX "Material_nom_idx" ON "Material"("nom");

-- CreateIndex
CREATE INDEX "Material_tipus_actiu_idx" ON "Material"("tipus", "actiu");

-- CreateIndex
CREATE INDEX "Material_versioBaseDadesId_idx" ON "Material"("versioBaseDadesId");

-- CreateIndex
CREATE INDEX "MaterialAuditLog_materialId_createdAt_idx" ON "MaterialAuditLog"("materialId", "createdAt");

-- AddForeignKey
ALTER TABLE "VersioBaseDades" ADD CONSTRAINT "VersioBaseDades_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Usuari"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Material" ADD CONSTRAINT "Material_versioBaseDadesId_fkey" FOREIGN KEY ("versioBaseDadesId") REFERENCES "VersioBaseDades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialAuditLog" ADD CONSTRAINT "MaterialAuditLog_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialAuditLog" ADD CONSTRAINT "MaterialAuditLog_usuariId_fkey" FOREIGN KEY ("usuariId") REFERENCES "Usuari"("id") ON DELETE SET NULL ON UPDATE CASCADE;
