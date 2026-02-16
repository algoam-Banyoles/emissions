-- CreateEnum
CREATE TYPE "TipusUbicacio" AS ENUM ('OBRA', 'PLANTA', 'PEDRERA', 'ALTRE');

-- CreateTable
CREATE TABLE "Ubicacio" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "tipus" "TipusUbicacio" NOT NULL,
    "descripcio" TEXT,
    "adreca" TEXT,
    "latitud" DECIMAL(10,7) NOT NULL,
    "longitud" DECIMAL(10,7) NOT NULL,
    "organitzacioId" TEXT NOT NULL,
    "actiu" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ubicacio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Ubicacio_organitzacioId_tipus_actiu_idx" ON "Ubicacio"("organitzacioId", "tipus", "actiu");

-- CreateIndex
CREATE INDEX "Ubicacio_nom_idx" ON "Ubicacio"("nom");

-- AddForeignKey
ALTER TABLE "Ubicacio" ADD CONSTRAINT "Ubicacio_organitzacioId_fkey" FOREIGN KEY ("organitzacioId") REFERENCES "Organitzacio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
