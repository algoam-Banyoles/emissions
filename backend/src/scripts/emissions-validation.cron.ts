import cron from "node-cron";

import { env } from "../config/env.js";
import { emissionsValidationService } from "../services/emissions-validation.service.js";

export function startEmissionsValidationCron() {
  if (!env.ENABLE_EMISSIONS_VALIDATION_CRON) {
    console.log("[validation] Cron desactivat per configuracio");
    return null;
  }

  const task = cron.schedule(env.EMISSIONS_VALIDATION_CRON, async () => {
    try {
      const result = await emissionsValidationService.executeValidation({
        trigger: "cron",
      });
      console.log(
        `[validation] executada (cron) health=${result.summary.healthScore} issues=${result.summary.totalIssues}`,
      );
    } catch (error) {
      console.error("[validation] error en execucio cron", error);
    }
  });

  console.log(`[validation] Cron programat amb expressio '${env.EMISSIONS_VALIDATION_CRON}'`);

  return task;
}
