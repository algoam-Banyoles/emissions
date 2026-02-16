ALTER TABLE "Projecte"
ADD COLUMN "categoriaTransitAuto" TEXT,
ADD COLUMN "categoriaTransitManual" TEXT,
ADD COLUMN "usaCategoriaManual" BOOLEAN NOT NULL DEFAULT false;
