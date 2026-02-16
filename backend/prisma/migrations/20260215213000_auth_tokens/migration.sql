-- AlterTable
ALTER TABLE "Usuari" ADD COLUMN "passwordHash" TEXT;

-- Backfill default empty hash for existing rows before making column required
UPDATE "Usuari" SET "passwordHash" = '' WHERE "passwordHash" IS NULL;

-- AlterTable
ALTER TABLE "Usuari" ALTER COLUMN "passwordHash" SET NOT NULL;

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "usuariId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshToken_usuariId_revokedAt_idx" ON "RefreshToken"("usuariId", "revokedAt");

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_usuariId_fkey" FOREIGN KEY ("usuariId") REFERENCES "Usuari"("id") ON DELETE CASCADE ON UPDATE CASCADE;
