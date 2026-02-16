import { useState } from "react";

import { AnalisiSensibilitat } from "@/components/forms/AnalisiSensibilitat";
import { FronteraPareto } from "@/components/forms/FronteraPareto";
import { Button } from "@/components/ui/button";
import { type ParetoOptimizationResult, type SensibilitatResult, type WeightedOptimizationResult } from "@/types/optimization";
import { type EstructuraViable } from "@/types/project";

interface OptimitzadorProps {
  loading: boolean;
  estructures: EstructuraViable[];
  onOptimitzarPonderacio: (estructures: EstructuraViable[], pesos: { estructural: number; emissions: number; economic: number }) => Promise<WeightedOptimizationResult>;
  onOptimitzarPareto: (estructures: EstructuraViable[]) => Promise<ParetoOptimizationResult>;
  onAnalisiSensibilitat: (estructures: EstructuraViable[], options?: { increment?: number; robustThresholdPercent?: number }) => Promise<SensibilitatResult>;
}

type Criteri = "estructural" | "emissions" | "economic" | "combinat";

export function Optimitzador({
  loading,
  estructures,
  onOptimitzarPonderacio,
  onOptimitzarPareto,
  onAnalisiSensibilitat,
}: OptimitzadorProps) {
  const [criteri, setCriteri] = useState<Criteri>("combinat");
  const [pesEstructural, setPesEstructural] = useState(33);
  const [pesEmissions, setPesEmissions] = useState(33);
  const [pesEconomic, setPesEconomic] = useState(34);
  const [weightedResult, setWeightedResult] = useState<WeightedOptimizationResult | null>(null);
  const [paretoResult, setParetoResult] = useState<ParetoOptimizationResult | null>(null);
  const [sensibilitatResult, setSensibilitatResult] = useState<SensibilitatResult | null>(null);

  const runOptimization = async () => {
    if (estructures.length === 0) {
      return;
    }

    const preset =
      criteri === "estructural"
        ? { estructural: 1, emissions: 0, economic: 0 }
        : criteri === "emissions"
          ? { estructural: 0, emissions: 1, economic: 0 }
          : criteri === "economic"
            ? { estructural: 0, emissions: 0, economic: 1 }
            : {
                estructural: pesEstructural / 100,
                emissions: pesEmissions / 100,
                economic: pesEconomic / 100,
              };

    const [weighted, pareto, sensibilitat] = await Promise.all([
      onOptimitzarPonderacio(estructures, preset),
      onOptimitzarPareto(estructures),
      onAnalisiSensibilitat(estructures, { increment: 0.2, robustThresholdPercent: 20 }),
    ]);

    setWeightedResult(weighted);
    setParetoResult(pareto);
    setSensibilitatResult(sensibilitat);
  };

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="grid gap-3 md:grid-cols-4">
        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Criteri</span>
          <select className="h-10 w-full rounded-md border px-3" value={criteri} onChange={(event) => setCriteri(event.target.value as Criteri)}>
            <option value="estructural">Estructural</option>
            <option value="emissions">Emissions</option>
            <option value="economic">Economic</option>
            <option value="combinat">Combinat</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Pes estructural ({pesEstructural}%)</span>
          <input type="range" min={0} max={100} value={pesEstructural} className="w-full" disabled={criteri !== "combinat"} onChange={(event) => setPesEstructural(Number(event.target.value))} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Pes emissions ({pesEmissions}%)</span>
          <input type="range" min={0} max={100} value={pesEmissions} className="w-full" disabled={criteri !== "combinat"} onChange={(event) => setPesEmissions(Number(event.target.value))} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Pes economic ({pesEconomic}%)</span>
          <input type="range" min={0} max={100} value={pesEconomic} className="w-full" disabled={criteri !== "combinat"} onChange={(event) => setPesEconomic(Number(event.target.value))} />
        </label>
      </div>

      <Button className="bg-corporate-blue hover:bg-corporate-blue/90" disabled={loading || estructures.length === 0} onClick={() => void runOptimization()}>
        {loading ? "Optimitzant..." : "Executar optimitzacio"}
      </Button>

      {weightedResult && (
        <div className="rounded-md border p-3 text-sm">
          <p className="font-medium text-corporate-blue">Millor solucio: {weightedResult.millor.id}</p>
          <p>{weightedResult.justificacio}</p>
          <p>
            Score:
            {" "}
            <strong>{weightedResult.millor.weightedScore.toFixed(4)}</strong>
          </p>
        </div>
      )}

      {paretoResult && <FronteraPareto resultat={paretoResult} />}
      {sensibilitatResult && <AnalisiSensibilitat resultat={sensibilitatResult} />}
    </div>
  );
}
