import { TipologiaMescla } from "@prisma/client";
import { z } from "zod";

export const composicioItemSchema = z
  .object({
    codiMaterial: z.string().min(1),
    quantitatTones: z.number().min(0).optional(),
    percentatge: z.number().min(0).max(100).optional(),
    distanciaKm: z.number().min(0).optional(),
    tipusVehicle: z.string().min(1).optional(),
  })
  .refine(
    (value) => value.quantitatTones !== undefined || value.percentatge !== undefined,
    "Cada component necessita quantitatTones o percentatge",
  );

export const parametresFabricacioSchema = z.object({
  temperaturaInicialC: z.number().min(-30).max(120).default(20),
  temperaturaMesclaC: z.number().min(60).max(250).default(160),
  humitatPercent: z.number().min(0).max(20).default(3),
  perduesCalorPercent: z.number().min(0).max(60).default(15),
  perduesRendimentMJ: z.number().min(0).max(200).default(0),
  combustible: z.enum(["GASOLEO", "FUELOLEO", "GAS_NATURAL"]).default("GASOLEO"),
  fontElectrica: z.enum(["RED", "GRUP"]).default("RED"),
  fontCalentament: z.enum(["CALDERA", "ELECTRIC"]).default("CALDERA"),
});

export const transportMesclaSchema = z.object({
  distanciaKm: z.number().min(0).default(0),
  mermesPercent: z.number().min(0).max(30).default(2),
  tipusVehicle: z.string().min(1).optional(),
});

export const equipInputSchema = z.object({
  nomEquip: z.string().min(1),
  hores: z.number().min(0).optional(),
  horesPerTona: z.number().min(0).optional(),
  tones: z.number().min(0).optional(),
});

export const calculPetjadaInputSchema = z.object({
  totalMesclaTones: z.number().positive().default(1),
  composicio: z.array(composicioItemSchema).min(1),
  parametresFabricacio: parametresFabricacioSchema,
  transportMescla: transportMesclaSchema,
  equips: z.array(equipInputSchema).default([]),
  tipologiaMescla: z.nativeEnum(TipologiaMescla).default(TipologiaMescla.MBC_CONVENCIONAL),
});

export type ComposicioItem = z.infer<typeof composicioItemSchema>;
export type ParametresFabricacio = z.infer<typeof parametresFabricacioSchema>;
export type TransportMesclaInput = z.infer<typeof transportMesclaSchema>;
export type EquipInput = z.infer<typeof equipInputSchema>;
export type CalculPetjadaInput = z.infer<typeof calculPetjadaInputSchema>;

export interface ResultatEtapaA3 {
  total: number;
  desglossament: {
    combustible: number;
    electric: number;
    caldera: number;
    pala: number;
  };
  termodinamic: {
    deltaHMJ: number;
    consumCombustible: number;
  };
}

export interface ResultatPetjadaEmissions {
  versioBaseDades: {
    id: string;
    numero: string;
  };
  unitat: "kg CO2e/t";
  etapes: {
    A1: number;
    A2: number;
    A3: number;
    A4: number;
    A5: number;
  };
  total: number;
  percentatges: {
    A1: number;
    A2: number;
    A3: number;
    A4: number;
    A5: number;
  };
  comparativaNormativa: {
    tipologiaMescla: TipologiaMescla;
    etapa: "A1_A5";
    emissionsTotals: number;
    limit: number;
    compleix: boolean;
    marge: number;
    percentatgeSobreLimit: number;
    nivell: "VERD" | "GROC" | "VERMELL";
    limitsAplicables: {
      tipologiaMescla: TipologiaMescla;
      etapa: string;
      valorLimit: number;
      fontNormativa: string;
      dataEntradaVigor: string;
    }[];
    recomanacions: string[];
  };
  formulas: Record<string, string>;
  fontsDades: {
    A1: string[];
    A2: string[];
    A3: string[];
    A4: string[];
    A5: string[];
  };
}
