import { type Request, type Response } from "express";

import { prisma } from "../config/database.js";

export async function healthController(_req: Request, res: Response) {
  await prisma.$queryRaw`SELECT 1`;

  res.status(200).json({
    status: "ok",
    service: "emissionsv2-backend",
    timestamp: new Date().toISOString(),
  });
}
