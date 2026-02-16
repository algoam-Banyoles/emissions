import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

import { beforeEach, describe, expect, it } from "vitest";

import { certificatsService } from "./certificats.service.js";

const identity = {
  userId: "u-1",
  organitzacioId: "org-1",
  email: "user@org.com",
};

const payload = {
  projecteNom: "Projecte Test",
  obraNom: "Obra Test",
  fabricantNom: "Fabricant SA",
  mesclaNom: "MBC-16",
  tipologiaMescla: "MBC_CONVENCIONAL",
  quantitatTones: 1500,
  emissions: {
    A1: 25,
    A2: 8,
    A3: 12,
    A4: 6,
    A5: 5,
    total: 56,
    limit: 70,
    unitat: "kg CO2e/t",
  },
};

describe("certificatsService", () => {
  beforeEach(async () => {
    const dir = path.join(os.tmpdir(), `certificats-test-${Date.now()}-${Math.random().toString(16).slice(2)}`);
    process.env["CERTIFICATS_STORAGE_DIR"] = dir;
    await fs.rm(dir, { recursive: true, force: true });
  });

  it("genera, guarda i recupera un certificat PDF", async () => {
    const generated = await certificatsService.generarCertificat(payload);
    expect(generated.pdfBuffer.byteLength).toBeGreaterThan(1024);

    const saved = await certificatsService.guardarCertificat(generated, identity);
    expect(saved.id).toBeTruthy();
    expect(saved.estat).toBe("VALID");

    const listed = await certificatsService.llistarCertificats(identity);
    expect(listed).toHaveLength(1);

    const fetched = await certificatsService.obtenirCertificat(saved.id, identity);
    expect(fetched.codi).toBe(saved.codi);

    const pdf = await certificatsService.obtenirPdfBuffer(saved.id, identity);
    expect(pdf.buffer.byteLength).toBeGreaterThan(1024);
  });

  it("permet revocar certificat", async () => {
    const generated = await certificatsService.generarCertificat(payload);
    const saved = await certificatsService.guardarCertificat(generated, identity);

    const revoked = await certificatsService.revocarCertificat(saved.id, identity);
    expect(revoked.estat).toBe("REVOCAT");

    const fetched = await certificatsService.obtenirCertificat(saved.id, identity);
    expect(fetched.estat).toBe("REVOCAT");
  });
});
