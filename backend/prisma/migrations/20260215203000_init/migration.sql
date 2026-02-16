-- CreateEnum
CREATE TYPE "RolUsuari" AS ENUM ('ADMIN', 'PROJECTISTA', 'FABRICANT', 'LECTOR');

-- CreateEnum
CREATE TYPE "EstatProjecte" AS ENUM ('ESBORRANY', 'ACTIU', 'COMPLETAT', 'ARXIUAT');

-- CreateTable
CREATE TABLE "Organitzacio" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "tipus" TEXT,
    "nif" TEXT,
    "codi" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organitzacio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Usuari" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "cognoms" TEXT,
    "rol" "RolUsuari" NOT NULL DEFAULT 'PROJECTISTA',
    "actiu" BOOLEAN NOT NULL DEFAULT true,
    "organitzacioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuari_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Projecte" (
    "id" TEXT NOT NULL,
    "codi" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "descripcio" TEXT,
    "estat" "EstatProjecte" NOT NULL DEFAULT 'ESBORRANY',
    "organitzacioId" TEXT NOT NULL,
    "imd" INTEGER,
    "percentatgeVp" DOUBLE PRECISION,
    "tipusTracat" TEXT,
    "zonaClimatica" TEXT,
    "vidaUtil" INTEGER,
    "creixementAnual" DOUBLE PRECISION,
    "latitud" DECIMAL(10,7),
    "longitud" DECIMAL(10,7),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Projecte_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VersioBaseDades" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "descripcio" TEXT,
    "dataPublicacio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "esActual" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VersioBaseDades_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organitzacio_nif_key" ON "Organitzacio"("nif");

-- CreateIndex
CREATE UNIQUE INDEX "Organitzacio_codi_key" ON "Organitzacio"("codi");

-- CreateIndex
CREATE UNIQUE INDEX "Usuari_email_key" ON "Usuari"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Projecte_codi_key" ON "Projecte"("codi");

-- CreateIndex
CREATE INDEX "Projecte_organitzacioId_estat_idx" ON "Projecte"("organitzacioId", "estat");

-- CreateIndex
CREATE INDEX "Projecte_nom_idx" ON "Projecte"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "VersioBaseDades_numero_key" ON "VersioBaseDades"("numero");

-- AddForeignKey
ALTER TABLE "Usuari" ADD CONSTRAINT "Usuari_organitzacioId_fkey" FOREIGN KEY ("organitzacioId") REFERENCES "Organitzacio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Projecte" ADD CONSTRAINT "Projecte_organitzacioId_fkey" FOREIGN KEY ("organitzacioId") REFERENCES "Organitzacio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
