import { prisma } from "../config/database.js";
import { emissionsValidationService } from "../services/emissions-validation.service.js";

async function run() {
  await prisma.$connect();
  const result = await emissionsValidationService.executeValidation({ trigger: "manual" });
  console.log(JSON.stringify(result.summary, null, 2));
  await prisma.$disconnect();
}

void run();
