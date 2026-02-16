import { app } from "./app.js";
import { prisma } from "./config/database.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { flushSentry, initSentry } from "./config/sentry.js";
import { startEmissionsValidationCron } from "./scripts/emissions-validation.cron.js";

async function bootstrap() {
  try {
    initSentry();
    await prisma.$connect();

    app.listen(env.PORT, () => {
      logger.info(`Backend disponible a http://localhost:${env.PORT}`);
    });

    startEmissionsValidationCron();
  } catch (error) {
    logger.error("Error inicialitzant backend", { error });
    await flushSentry();
    process.exit(1);
  }
}

void bootstrap();
