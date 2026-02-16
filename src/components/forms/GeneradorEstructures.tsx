import { useMemo, useState } from "react";

import { CalculadoraEconomica } from "@/components/forms/CalculadoraEconomica";
import { ComparadorEstructures } from "@/components/forms/ComparadorEstructures";
import { EstructuraSeccio } from "@/components/forms/EstructuraSeccio";
import { Optimitzador } from "@/components/forms/Optimitzador";
import { Button } from "@/components/ui/button";
import { type ParetoOptimizationResult, type SensibilitatResult, type WeightedOptimizationResult } from "@/types/optimization";
import { type EstructuresGenerationResponse, type EstructuraViable, type TipologiaFirme } from "@/types/project";

interface GeneradorEstructuresProps {
  loading: boolean;
  onGenerar: (payload: {
    tipologia: TipologiaFirme;
    maxGruixTotalCm?: number;
    limitCombinacions?: number;
    modulFonamentMpa?: number;
    areaM2?: number;
    vidaUtilAnys?: number;
    tarifaTransportEurTKm?: number;
    tarifaFabricacioEurT?: number;
    tarifaPosadaObraEurM2?: number;
    preuMaterialPerTipus?: Partial<Record<"RODAMENT" | "INTERMEDIA" | "BASE" | "SUBBASE" | "FONAMENT", number>>;
    asynchronous?: boolean;
    page?: number;
    pageSize?: number;
    materialsPermesos?: string[];
  }) => Promise<EstructuresGenerationResponse>;
  onPollJob: (jobId: string) => Promise<EstructuresGenerationResponse>;
  onOptimitzarPonderacio: (estructures: EstructuraViable[], pesos: { estructural: number; emissions: number; economic: number }) => Promise<WeightedOptimizationResult>;
  onOptimitzarPareto: (estructures: EstructuraViable[]) => Promise<ParetoOptimizationResult>;
  onAnalisiSensibilitat: (estructures: EstructuraViable[], options?: { increment?: number; robustThresholdPercent?: number }) => Promise<SensibilitatResult>;
}

export function GeneradorEstructures({
  loading,
  onGenerar,
  onPollJob,
  onOptimitzarPonderacio,
  onOptimitzarPareto,
  onAnalisiSensibilitat,
}: GeneradorEstructuresProps) {
  const [tipologia, setTipologia] = useState<TipologiaFirme>("NOVA_CONSTRUCCIO");
  const [materialsPermesos, setMaterialsPermesos] = useState("");
  const [maxGruixTotalCm, setMaxGruixTotalCm] = useState("");
  const [limitCombinacions, setLimitCombinacions] = useState("50000");
  const [modulFonamentMpa, setModulFonamentMpa] = useState("250");
  const [distanciaMaterialsKm, setDistanciaMaterialsKm] = useState("25");
  const [distanciaMesclaKm, setDistanciaMesclaKm] = useState("35");
  const [areaM2, setAreaM2] = useState("1000");
  const [vidaUtilAnys, setVidaUtilAnys] = useState("20");
  const [tarifaTransportEurTKm, setTarifaTransportEurTKm] = useState("0.11");
  const [tarifaFabricacioEurT, setTarifaFabricacioEurT] = useState("17");
  const [tarifaPosadaObraEurM2, setTarifaPosadaObraEurM2] = useState("6.5");
  const [preuRodament, setPreuRodament] = useState("68");
  const [preuIntermedia, setPreuIntermedia] = useState("60");
  const [preuBase, setPreuBase] = useState("52");
  const [preuSubbase, setPreuSubbase] = useState("38");
  const [preuFonament, setPreuFonament] = useState("30");
  const [asynchronous, setAsynchronous] = useState(true);
  const [nivellEmissionsFiltre, setNivellEmissionsFiltre] = useState<"" | "BAIX" | "MITJA" | "ALT">("");
  const [maxEmissionsKgT, setMaxEmissionsKgT] = useState("");
  const [minCostEurM2, setMinCostEurM2] = useState("");
  const [maxCostEurM2, setMaxCostEurM2] = useState("");

  const [progress, setProgress] = useState(0);
  const [items, setItems] = useState<EstructuraViable[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [metaText, setMetaText] = useState("Sense resultats");

  const filteredItems = useMemo(
    () =>
      items.filter((item) => {
        if (nivellEmissionsFiltre && item.emissions?.nivell !== nivellEmissionsFiltre) {
          return false;
        }
        if (maxEmissionsKgT && item.emissions && item.emissions.totalKgT > Number(maxEmissionsKgT)) {
          return false;
        }
        if (minCostEurM2 && item.costos && item.costos.totalEurM2 < Number(minCostEurM2)) {
          return false;
        }
        if (maxCostEurM2 && item.costos && item.costos.totalEurM2 > Number(maxCostEurM2)) {
          return false;
        }
        return true;
      }),
    [items, maxEmissionsKgT, maxCostEurM2, minCostEurM2, nivellEmissionsFiltre],
  );

  const selectedStructures = useMemo(
    () => filteredItems.filter((item) => selectedIds.includes(item.id)),
    [filteredItems, selectedIds],
  );

  const isAsyncResponse = (response: EstructuresGenerationResponse): response is Exclude<EstructuresGenerationResponse, { mode: "sync" }> =>
    response.mode === "async";

  const handleGenerate = async () => {
    setProgress(5);
    const response = await onGenerar({
      tipologia,
      asynchronous,
      page: 1,
      pageSize: 20,
      ...(maxGruixTotalCm ? { maxGruixTotalCm: Number(maxGruixTotalCm) } : {}),
      ...(limitCombinacions ? { limitCombinacions: Number(limitCombinacions) } : {}),
      ...(modulFonamentMpa ? { modulFonamentMpa: Number(modulFonamentMpa) } : {}),
      ...(distanciaMaterialsKm ? { distanciaMaterialsKm: Number(distanciaMaterialsKm) } : {}),
      ...(distanciaMesclaKm ? { distanciaMesclaKm: Number(distanciaMesclaKm) } : {}),
      ...(areaM2 ? { areaM2: Number(areaM2) } : {}),
      ...(vidaUtilAnys ? { vidaUtilAnys: Number(vidaUtilAnys) } : {}),
      ...(tarifaTransportEurTKm ? { tarifaTransportEurTKm: Number(tarifaTransportEurTKm) } : {}),
      ...(tarifaFabricacioEurT ? { tarifaFabricacioEurT: Number(tarifaFabricacioEurT) } : {}),
      ...(tarifaPosadaObraEurM2 ? { tarifaPosadaObraEurM2: Number(tarifaPosadaObraEurM2) } : {}),
      preuMaterialPerTipus: {
        RODAMENT: Number(preuRodament),
        INTERMEDIA: Number(preuIntermedia),
        BASE: Number(preuBase),
        SUBBASE: Number(preuSubbase),
        FONAMENT: Number(preuFonament),
      },
      ...(materialsPermesos
        ? {
            materialsPermesos: materialsPermesos
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean),
          }
        : {}),
    });

    if (response.mode === "sync") {
      setProgress(100);
      setItems(response.items);
      setSelectedIds([]);
      setMetaText(`Combinacions: ${response.meta.combinacionsTotals} | Viables: ${response.meta.viablesTotals}`);
      return;
    }

    if (response.status === "failed") {
      setProgress(100);
      setItems([]);
      setMetaText(response.error);
      return;
    }

    let current: EstructuresGenerationResponse = response;
    setProgress(current.progress);

    while (isAsyncResponse(current) && (current.status === "queued" || current.status === "processing")) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      current = await onPollJob(current.jobId);
      if (isAsyncResponse(current)) {
        setProgress(current.progress);
      }
    }

    if (isAsyncResponse(current) && current.status === "completed") {
      setItems(current.result.items);
      setSelectedIds([]);
      setMetaText(`Combinacions: ${current.result.meta.combinacionsTotals} | Viables: ${current.result.meta.viablesTotals}`);
      return;
    }

    if (isAsyncResponse(current) && current.status === "failed") {
      setItems([]);
      setMetaText(current.error);
      return;
    }

    if (current.mode === "sync") {
      setProgress(100);
      setItems(current.items);
      setSelectedIds([]);
      setMetaText(`Combinacions: ${current.meta.combinacionsTotals} | Viables: ${current.meta.viablesTotals}`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Tipologia</span>
          <select className="h-10 w-full rounded-md border px-3" value={tipologia} onChange={(event) => setTipologia(event.target.value as TipologiaFirme)}>
            <option value="NOVA_CONSTRUCCIO">Nova construccio</option>
            <option value="REFORC">Reforc</option>
            <option value="RECICLATGE">Reciclatge</option>
            <option value="AUTL">AUTL</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Gruix total maxim (cm)</span>
          <input className="h-10 w-full rounded-md border px-3" value={maxGruixTotalCm} onChange={(event) => setMaxGruixTotalCm(event.target.value)} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Limit combinacions</span>
          <input className="h-10 w-full rounded-md border px-3" value={limitCombinacions} onChange={(event) => setLimitCombinacions(event.target.value)} />
        </label>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <label className="text-sm md:col-span-2">
          <span className="mb-1 block text-slate-600">Materials/capes permesos (coma separada)</span>
          <input
            className="h-10 w-full rounded-md border px-3"
            placeholder="RODAMENT, INTERMEDIA, BASE"
            value={materialsPermesos}
            onChange={(event) => setMaterialsPermesos(event.target.value)}
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Modul fons (MPa)</span>
          <input className="h-10 w-full rounded-md border px-3" value={modulFonamentMpa} onChange={(event) => setModulFonamentMpa(event.target.value)} />
        </label>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Distancia materials (km)</span>
          <input className="h-10 w-full rounded-md border px-3" value={distanciaMaterialsKm} onChange={(event) => setDistanciaMaterialsKm(event.target.value)} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Distancia mescla (km)</span>
          <input className="h-10 w-full rounded-md border px-3" value={distanciaMesclaKm} onChange={(event) => setDistanciaMesclaKm(event.target.value)} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Filtre nivell emissions</span>
          <select className="h-10 w-full rounded-md border px-3" value={nivellEmissionsFiltre} onChange={(event) => setNivellEmissionsFiltre(event.target.value as "" | "BAIX" | "MITJA" | "ALT")}>
            <option value="">Tots</option>
            <option value="BAIX">Baix</option>
            <option value="MITJA">Mitja</option>
            <option value="ALT">Alt</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Max emissions (kg/t)</span>
          <input className="h-10 w-full rounded-md border px-3" value={maxEmissionsKgT} onChange={(event) => setMaxEmissionsKgT(event.target.value)} />
        </label>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Area projecte (m2)</span>
          <input className="h-10 w-full rounded-md border px-3" value={areaM2} onChange={(event) => setAreaM2(event.target.value)} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Vida util (anys)</span>
          <input className="h-10 w-full rounded-md border px-3" value={vidaUtilAnys} onChange={(event) => setVidaUtilAnys(event.target.value)} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Min cost (EUR/m2)</span>
          <input className="h-10 w-full rounded-md border px-3" value={minCostEurM2} onChange={(event) => setMinCostEurM2(event.target.value)} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Max cost (EUR/m2)</span>
          <input className="h-10 w-full rounded-md border px-3" value={maxCostEurM2} onChange={(event) => setMaxCostEurM2(event.target.value)} />
        </label>
      </div>

      <div className="grid gap-3 md:grid-cols-5">
        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Preu rodament (EUR/t)</span>
          <input className="h-10 w-full rounded-md border px-3" value={preuRodament} onChange={(event) => setPreuRodament(event.target.value)} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Preu intermedia (EUR/t)</span>
          <input className="h-10 w-full rounded-md border px-3" value={preuIntermedia} onChange={(event) => setPreuIntermedia(event.target.value)} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Preu base (EUR/t)</span>
          <input className="h-10 w-full rounded-md border px-3" value={preuBase} onChange={(event) => setPreuBase(event.target.value)} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Preu subbase (EUR/t)</span>
          <input className="h-10 w-full rounded-md border px-3" value={preuSubbase} onChange={(event) => setPreuSubbase(event.target.value)} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Preu fonament (EUR/t)</span>
          <input className="h-10 w-full rounded-md border px-3" value={preuFonament} onChange={(event) => setPreuFonament(event.target.value)} />
        </label>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Tarifa transport (EUR/t·km)</span>
          <input
            className="h-10 w-full rounded-md border px-3"
            value={tarifaTransportEurTKm}
            onChange={(event) => setTarifaTransportEurTKm(event.target.value)}
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Tarifa fabricacio (EUR/t)</span>
          <input className="h-10 w-full rounded-md border px-3" value={tarifaFabricacioEurT} onChange={(event) => setTarifaFabricacioEurT(event.target.value)} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Tarifa posada obra (EUR/m2)</span>
          <input className="h-10 w-full rounded-md border px-3" value={tarifaPosadaObraEurM2} onChange={(event) => setTarifaPosadaObraEurM2(event.target.value)} />
        </label>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={asynchronous} onChange={(event) => setAsynchronous(event.target.checked)} />
        Processament asincron
      </label>

      <Button className="bg-corporate-green hover:bg-corporate-green/90" disabled={loading} onClick={() => void handleGenerate()}>
        Generar estructures viables
      </Button>

      <div className="space-y-1">
        <div className="h-2 overflow-hidden rounded bg-slate-200">
          <div className="h-full bg-corporate-blue" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-xs text-slate-600">{metaText}</p>
        <p className="text-xs text-slate-500">Mostrant {filteredItems.length} estructures despres de filtres d'emissions</p>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {filteredItems.map((item) => (
          <div key={item.id} className="space-y-2 rounded-lg border p-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selectedIds.includes(item.id)}
                onChange={(event) => {
                  setSelectedIds((current) =>
                    event.target.checked ? [...current, item.id] : current.filter((id) => id !== item.id),
                  );
                }}
              />
              Estructura {item.id.slice(0, 8)}
            </label>
            <p className="text-xs text-slate-600">
              Ratios: F={item.verificacio.ratios.fatiga.toFixed(3)} | A={item.verificacio.ratios.aixecament.toFixed(3)}
            </p>
            <p className="text-xs text-slate-600">
              Emissions: {item.emissions?.totalKgT?.toFixed(3) ?? "-"} kg/t | {item.emissions?.kgM2?.toFixed(3) ?? "-"} kg/m2
            </p>
            <p className="text-xs text-slate-600">
              Cost: {item.costos?.totalEurM2?.toFixed(2) ?? "-"} EUR/m2 | {item.costos?.costAnyVidaUtilEurM2?.toFixed(3) ?? "-"} EUR/m2/any
            </p>
            <EstructuraSeccio estructura={item} />
          </div>
        ))}
      </div>

      <ComparadorEstructures estructures={selectedStructures} />
      <CalculadoraEconomica estructures={selectedStructures.length > 0 ? selectedStructures : filteredItems} />

      <Optimitzador
        loading={loading}
        estructures={selectedStructures.length > 0 ? selectedStructures : filteredItems}
        onOptimitzarPonderacio={onOptimitzarPonderacio}
        onOptimitzarPareto={onOptimitzarPareto}
        onAnalisiSensibilitat={onAnalisiSensibilitat}
      />
    </div>
  );
}
