import winston from "winston";

import { env } from "./env.js";

const devFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp(),
  winston.format.printf(({ level, message, timestamp, ...meta }) => {
    const metaText = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
    return `${timestamp} ${level}: ${String(message)}${metaText}`;
  }),
);

const prodFormat = winston.format.combine(winston.format.timestamp(), winston.format.json());

export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  format: env.NODE_ENV === "production" ? prodFormat : devFormat,
  defaultMeta: {
    service: "emissionsv2-backend",
    environment: env.NODE_ENV,
  },
  transports: [new winston.transports.Console()],
});
