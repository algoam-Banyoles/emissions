import "express-serve-static-core";

declare module "express-serve-static-core" {
  interface Request {
    auth?: {
      userId: string;
      organitzacioId: string;
      rol: string;
      email: string;
    };
    language?: "ca" | "es" | "en" | "fr";
  }
}
