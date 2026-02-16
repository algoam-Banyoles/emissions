import { type NextFunction, type Request, type Response } from "express";

const supported = ["ca", "es", "en", "fr"] as const;

type SupportedLanguage = (typeof supported)[number];

function normalizeLanguage(input: string | undefined): SupportedLanguage {
  if (!input) {
    return "ca";
  }

  const value = input.toLowerCase().split(",")[0]?.trim().split("-")[0];
  if (value && supported.includes(value as SupportedLanguage)) {
    return value as SupportedLanguage;
  }

  return "ca";
}

export function languageMiddleware(req: Request, res: Response, next: NextFunction) {
  const fromQuery = typeof req.query["lang"] === "string" ? req.query["lang"] : undefined;
  const fromHeader = typeof req.headers["x-language"] === "string" ? req.headers["x-language"] : undefined;
  const fromAccept = typeof req.headers["accept-language"] === "string" ? req.headers["accept-language"] : undefined;

  const language = normalizeLanguage(fromQuery ?? fromHeader ?? fromAccept);

  req.language = language;
  res.setHeader("Content-Language", language);

  next();
}

export type { SupportedLanguage };
