import bcrypt from "bcryptjs";
import { PrismaClient, RolUsuari } from "@prisma/client";

const prisma = new PrismaClient();

const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@emissions.local";
const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "Admin1234!";
const adminNom = process.env.SEED_ADMIN_NOM ?? "Admin";
const adminCognoms = process.env.SEED_ADMIN_COGNOMS ?? "Sistema";

const orgNom = process.env.SEED_ORG_NOM ?? "Organitzacio Demo";
const orgCodi = process.env.SEED_ORG_CODI ?? "org-demo-admin";
const orgTipus = process.env.SEED_ORG_TIPUS ?? "constructora";
const orgNif = process.env.SEED_ORG_NIF ?? null;

async function seedAdmin() {
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const organitzacio = await prisma.organitzacio.upsert({
    where: { codi: orgCodi },
    update: {
      nom: orgNom,
      tipus: orgTipus,
      nif: orgNif,
    },
    create: {
      nom: orgNom,
      codi: orgCodi,
      tipus: orgTipus,
      nif: orgNif,
    },
  });

  const admin = await prisma.usuari.upsert({
    where: { email: adminEmail },
    update: {
      nom: adminNom,
      cognoms: adminCognoms,
      rol: RolUsuari.ADMIN,
      actiu: true,
      organitzacioId: organitzacio.id,
      passwordHash,
    },
    create: {
      email: adminEmail,
      nom: adminNom,
      cognoms: adminCognoms,
      rol: RolUsuari.ADMIN,
      actiu: true,
      organitzacioId: organitzacio.id,
      passwordHash,
    },
  });

  console.log("[seed:admin] Usuari admin preparat correctament:");
  console.log(`- email: ${admin.email}`);
  console.log(`- password: ${adminPassword}`);
  console.log(`- organitzacio: ${organitzacio.nom} (${organitzacio.codi})`);
}

seedAdmin()
  .catch((error) => {
    console.error("[seed:admin] Error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

