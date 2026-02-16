export type EstatCertificat = "VALID" | "CADUCAT" | "REVOCAT";

export interface CertificatEmissions {
  A1: number;
  A2: number;
  A3: number;
  A4: number;
  A5: number;
  total: number;
  limit: number;
  unitat: string;
}

export interface Certificat {
  id: string;
  codi: string;
  organitzacioId: string;
  projecteNom: string;
  obraNom: string;
  fabricantNom: string;
  mesclaNom: string;
  tipologiaMescla: string;
  estat: EstatCertificat;
  dataEmissio: string;
  dataCaducitat: string;
  versioMetodologia: string;
  quantitatTones: number;
  emissions: CertificatEmissions;
  signaturaDigital: boolean;
  idioma?: "ca" | "es" | "en" | "fr";
  pdfPath: string;
  pdfUrl: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface GenerarCertificatPayload {
  projecteNom: string;
  obraNom: string;
  fabricantNom: string;
  mesclaNom: string;
  tipologiaMescla: string;
  versioMetodologia?: string;
  quantitatTones: number;
  emissions: CertificatEmissions;
  annexText?: string;
  signaturaDigital?: boolean;
  idioma?: "ca" | "es" | "en" | "fr";
}

export interface LlistaCertificatsResponse {
  items: Certificat[];
}
