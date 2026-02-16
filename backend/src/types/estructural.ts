import { z } from "zod";

export const tipusCapaSchema = z.enum(["RODAMENT", "INTERMEDIA", "BASE", "SUBBASE", "FONAMENT"]);
export type TipusCapa = z.infer<typeof tipusCapaSchema>;

export const tipologiaFirmeSchema = z.enum(["NOVA_CONSTRUCCIO", "REFORC", "RECICLATGE", "AUTL"]);
export type TipologiaFirme = z.infer<typeof tipologiaFirmeSchema>;

export const capaFirmeSchema = z.object({
  tipus: tipusCapaSchema,
  nom: z.string().min(1),
  gruixCm: z.number().positive(),
  modulElasticMpa: z.number().positive(),
  coeficientPoisson: z.number().min(0.05).max(0.49).default(0.35),
});

export type CapaFirme = z.infer<typeof capaFirmeSchema>;

export const estructuraFirmeSchema = z.object({
  tipologia: tipologiaFirmeSchema,
  capes: z.array(capaFirmeSchema).min(1),
});

export type EstructuraFirme = z.infer<typeof estructuraFirmeSchema>;

export const dadesTransitNecSchema = z.object({
  imd: z.number().positive(),
  percentatgePesants: z.number().min(0).max(100),
  factorDistribucio: z.number().positive(),
  factorEquivalencia: z.number().positive(),
  anysProjecte: z.number().int().positive(),
  creixementAnualPercent: z.number().min(0).max(100).default(0),
});

export type DadesTransitNEC = z.infer<typeof dadesTransitNecSchema>;

export const dadesFonamentSchema = z.object({
  modulElasticMpa: z.number().positive(),
  coeficientPoisson: z.number().min(0.05).max(0.49).default(0.35),
  cbr: z.number().positive().optional(),
});

export type DadesFonament = z.infer<typeof dadesFonamentSchema>;

export const resultatVerificacioSchema = z.object({
  viable: z.boolean(),
  ratios: z.object({
    fatiga: z.number(),
    aixecament: z.number(),
  }),
  deformacions: z.object({
    epsilonTraccioMicro: z.number(),
    epsilonCompressioMicro: z.number(),
    deformacioSuperficialMm: z.number(),
  }),
  valorsAdmissibles: z.object({
    ciclesFatigaAdmissibles: z.number(),
    ciclesAixecamentAdmissibles: z.number(),
  }),
  detalls: z.object({
    nec: z.number(),
    gruixTotalCm: z.number(),
    modulEquivalentMpa: z.number(),
  }),
});

export type ResultatVerificacio = z.infer<typeof resultatVerificacioSchema>;

export interface RestriccioCapa {
  tipus: TipusCapa;
  gruixMinCm: number;
  gruixMaxCm: number;
  pasCm: number;
  modulElasticMpa: number;
  coeficientPoisson?: number;
  nom?: string;
}

export interface RestriccionsCombinacio {
  capes: RestriccioCapa[];
  limitCombinacions?: number;
}
