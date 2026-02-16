import * as Sentry from "@sentry/node";

import { env } from "./env.js";

let enabled = false;

export function initSentry() {
  if (!env.SENTRY_DSN) {
    return false;
  }

  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    tracesSampleRate: env.NODE_ENV === "production" ? 0.1 : 1,
    sendDefaultPii: false,
  });

  enabled = true;
  return true;
}

export async function flushSentry(timeoutMs = 2000) {
  if (!enabled) {
    return;
  }
  await Sentry.flush(timeoutMs);
}

export function captureError(error: unknown, context?: Record<string, unknown>) {
  if (!enabled) {
    return;
  }

  Sentry.withScope((scope) => {
    if (context) {
      Object.entries(context).forEach(([key, value]) => scope.setExtra(key, value));
    }
    Sentry.captureException(error);
  });
}
