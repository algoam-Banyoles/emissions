import { Router } from "express";
import rateLimit from "express-rate-limit";

import { authController } from "../controllers/auth.controller.js";

const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Massa intents de login. Torna-ho a provar en uns minuts.",
  },
});

export const authRoutes = Router();

authRoutes.post("/register", authController.register);
authRoutes.post("/login", loginRateLimit, authController.login);
authRoutes.post("/refresh", authController.refresh);
authRoutes.post("/logout", authController.logout);
