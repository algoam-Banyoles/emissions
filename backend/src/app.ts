import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";

import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import { languageMiddleware } from "./middlewares/language.middleware.js";
import { notFoundMiddleware } from "./middlewares/not-found.middleware.js";
import { apiRouter } from "./routes/index.js";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  }),
);
app.use(compression());
app.use(cookieParser());
app.use(
  morgan(env.NODE_ENV === "production" ? "combined" : "dev", {
    stream: {
      write: (message) => {
        logger.http(message.trim());
      },
    },
  }),
);
app.use(languageMiddleware);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/", (_req, res) => {
  res.status(200).json({
    name: "emissionsv2-backend",
    status: "running",
  });
});

app.use("/api", apiRouter);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export { app };
