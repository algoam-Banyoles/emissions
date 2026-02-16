import { type EstructuraViable } from "@/types/project";

export interface OptimizationWeights {
  estructural: number;
  emissions: number;
  economic: number;
}

export interface WeightedRankingRow {
  id: string;
  weightedScore: number;
  objectives: {
    estructural: number;
    emissions: number;
    economic: number;
  };
  normalized: {
    estructural: number;
    emissions: number;
    economic: number;
  };
  estructura: EstructuraViable;
}

export interface WeightedOptimizationResult {
  pesos: OptimizationWeights;
  millor: WeightedRankingRow;
  ranking: WeightedRankingRow[];
  justificacio: string;
}

export interface ParetoRow extends WeightedRankingRow {
  crowdingDistance: number;
  rank: number;
}

export interface ParetoOptimizationResult {
  noDominades: ParetoRow[];
  fronts: ParetoRow[][];
  resum: {
    totalSolucions: number;
    noDominades: number;
    fronts: number;
  };
}

export interface SensibilitatResult {
  increment: number;
  totalEscenaris: number;
  matriuResultats: {
    pesos: OptimizationWeights;
    millorId: string;
    score: number;
  }[];
  solucionsRobustes: {
    id: string;
    aparicions: number;
    percentatge: number;
  }[];
}
