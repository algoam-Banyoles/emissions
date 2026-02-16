import { z } from "zod";

export const idiomesSuportats = ["ca", "es", "en", "fr"] as const;

export type Idioma = (typeof idiomesSuportats)[number];

const traduccioSchema = z.object({
  projecteNom: z.string(),
  obraNom: z.string(),
  fabricantNom: z.string(),
  mesclaNom: z.string(),
  tipologiaMescla: z.string(),
  versioMetodologia: z.string(),
  quantitatTones: z.number(),
  signaturaDigital: z.boolean().optional(),
  annexText: z.string().optional(),
  emissions: z.object({
    A1: z.number(),
    A2: z.number(),
    A3: z.number(),
    A4: z.number(),
    A5: z.number(),
    total: z.number(),
    limit: z.number(),
    unitat: z.string(),
  }),
});

export type CertificatTraduccioInput = z.infer<typeof traduccioSchema>;

export const plantillesCertificat = {
  ca: {
    title: "CERTIFICAT AMBIENTAL DE PRODUCTE",
    subtitle: "Calculadora Optimitzadora de Ferms · SaaS",
    cover: "Portada",
    executiveSummary: "Resum executiu",
    totalEmissions: "Emissions totals",
    applicableLimit: "Limit aplicable",
    compliant: "Resultat: COMPLEIX",
    nonCompliant: "Resultat: NO COMPLEIX",
    breakdown: "Desglossament A1-A5",
    chartTitle: "Grafic de contribucio per etapa",
    methodology: "Metodologia",
    methodologyText1: "Aquest certificat ha estat generat amb la metodologia OC 3/2024 per a etapes A1-A5.",
    methodologyText2: "Es fa servir base de dades versionada de factors d'emissio i calcul termodinamic per A3.",
    summaryTable: "Taula resum de resultats",
    annex: "Annex de calcul",
    keyFormulas: "Formules clau:",
    code: "Codi certificat",
    manufacturer: "Fabricant",
    project: "Projecte",
    work: "Obra",
    mix: "Mescla",
    certifiedQuantity: "Quantitat certificada",
    methodologyVersion: "Metodologia",
    digitalSignature: "Signatura digital: ACTIVADA",
    footerCertificate: "Certificat",
    footerPage: "Pagina",
    footerIssueDate: "Data emissio",
    annexPrefix: "Annex de calcul",
  },
  es: {
    title: "CERTIFICADO AMBIENTAL DE PRODUCTO",
    subtitle: "Calculadora Optimizadora de Firmes · SaaS",
    cover: "Portada",
    executiveSummary: "Resumen ejecutivo",
    totalEmissions: "Emisiones totales",
    applicableLimit: "Limite aplicable",
    compliant: "Resultado: CUMPLE",
    nonCompliant: "Resultado: NO CUMPLE",
    breakdown: "Desglose A1-A5",
    chartTitle: "Grafico de contribucion por etapa",
    methodology: "Metodologia",
    methodologyText1: "Este certificado se ha generado con la metodologia OC 3/2024 para etapas A1-A5.",
    methodologyText2: "Se usa base de datos versionada de factores de emision y calculo termodinamico para A3.",
    summaryTable: "Tabla resumen de resultados",
    annex: "Anexo de calculo",
    keyFormulas: "Formulas clave:",
    code: "Codigo certificado",
    manufacturer: "Fabricante",
    project: "Proyecto",
    work: "Obra",
    mix: "Mezcla",
    certifiedQuantity: "Cantidad certificada",
    methodologyVersion: "Metodologia",
    digitalSignature: "Firma digital: ACTIVADA",
    footerCertificate: "Certificado",
    footerPage: "Pagina",
    footerIssueDate: "Fecha emision",
    annexPrefix: "Anexo de calculo",
  },
  en: {
    title: "ENVIRONMENTAL PRODUCT CERTIFICATE",
    subtitle: "Pavement Optimizer Calculator · SaaS",
    cover: "Cover",
    executiveSummary: "Executive summary",
    totalEmissions: "Total emissions",
    applicableLimit: "Applicable limit",
    compliant: "Result: COMPLIANT",
    nonCompliant: "Result: NON-COMPLIANT",
    breakdown: "A1-A5 breakdown",
    chartTitle: "Contribution chart by stage",
    methodology: "Methodology",
    methodologyText1: "This certificate was generated with OC 3/2024 methodology for stages A1-A5.",
    methodologyText2: "A versioned emissions-factor database and A3 thermodynamic model are used.",
    summaryTable: "Results summary table",
    annex: "Calculation annex",
    keyFormulas: "Key formulas:",
    code: "Certificate code",
    manufacturer: "Manufacturer",
    project: "Project",
    work: "Worksite",
    mix: "Mix",
    certifiedQuantity: "Certified quantity",
    methodologyVersion: "Methodology",
    digitalSignature: "Digital signature: ENABLED",
    footerCertificate: "Certificate",
    footerPage: "Page",
    footerIssueDate: "Issue date",
    annexPrefix: "Calculation annex",
  },
  fr: {
    title: "CERTIFICAT ENVIRONNEMENTAL DE PRODUIT",
    subtitle: "Calculateur Optimiseur de Chaussees · SaaS",
    cover: "Couverture",
    executiveSummary: "Resume executif",
    totalEmissions: "Emissions totales",
    applicableLimit: "Limite applicable",
    compliant: "Resultat : CONFORME",
    nonCompliant: "Resultat : NON CONFORME",
    breakdown: "Detail A1-A5",
    chartTitle: "Graphique de contribution par etape",
    methodology: "Methodologie",
    methodologyText1: "Ce certificat a ete genere avec la methodologie OC 3/2024 pour les etapes A1-A5.",
    methodologyText2: "Une base versionnee de facteurs d'emission et un modele thermodynamique A3 sont utilises.",
    summaryTable: "Tableau resume des resultats",
    annex: "Annexe de calcul",
    keyFormulas: "Formules cles :",
    code: "Code certificat",
    manufacturer: "Fabricant",
    project: "Projet",
    work: "Chantier",
    mix: "Melange",
    certifiedQuantity: "Quantite certifiee",
    methodologyVersion: "Methodologie",
    digitalSignature: "Signature numerique : ACTIVEE",
    footerCertificate: "Certificat",
    footerPage: "Page",
    footerIssueDate: "Date emission",
    annexPrefix: "Annexe de calcul",
  },
} as const;

export const traduccioService = {
  traduirCertificat(certificat: unknown, idioma: Idioma) {
    const parsed = traduccioSchema.parse(certificat);
    const plantilla = plantillesCertificat[idioma];

    return {
      plantilla,
      idioma,
      dades: {
        ...parsed,
        annexText: this.traduirAnnex(parsed.annexText ?? "", idioma),
      },
    };
  },

  traduirAnnex(annex: string, idioma: Idioma) {
    const plantilla = plantillesCertificat[idioma];
    const clean = annex.trim();
    if (!clean) {
      return `${plantilla.annexPrefix}.`;
    }
    return `${plantilla.annexPrefix}: ${clean}`;
  },
};
