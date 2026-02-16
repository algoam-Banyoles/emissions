import { useEffect, useMemo, useState } from "react";

import { DesglossamentEmissions } from "@/components/forms/DesglossamentEmissions";
import { IndicadorCompliment } from "@/components/forms/IndicadorCompliment";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEmissionsCalculator } from "@/hooks/useEmissionsCalculator";
import { type EmissionsCalculRequest, type EmissionsCalculResponse } from "@/types/emissions-calcul";

const defaultPayload: EmissionsCalculRequest = {
  totalMesclaTones: 1,
  composicio: [
    { codiMaterial: "10a", percentatge: 94.5, distanciaKm: 25, tipusVehicle: "20/40" },
    { codiMaterial: "14a", percentatge: 5.5, distanciaKm: 120, tipusVehicle: "22" },
  ],
  parametresFabricacio: {
    temperaturaInicialC: 20,
    temperaturaMesclaC: 160,
    humitatPercent: 2.5,
    perduesCalorPercent: 15,
    perduesRendimentMJ: 5,
    combustible: "GASOLEO",
    fontElectrica: "RED",
    fontCalentament: "CALDERA",
  },
  transportMescla: {
    distanciaKm: 35,
    mermesPercent: 2,
    tipusVehicle: "20/40",
  },
  equips: [{ nomEquip: "extendedora", horesPerTona: 0.008 }],
  tipologiaMescla: "MBC_CONVENCIONAL",
};

interface CalculadoraEmissionsProps {
  distanciaMaterialsKm?: number;
  distanciaMesclaKm?: number;
}

function parseNumber(value: string, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function CalculadoraEmissions({ distanciaMaterialsKm, distanciaMesclaKm }: CalculadoraEmissionsProps) {
  const { loading, error, calcular } = useEmissionsCalculator();
  const [payload, setPayload] = useState<EmissionsCalculRequest>(defaultPayload);
  const [resultat, setResultat] = useState<EmissionsCalculResponse | null>(null);

  const validComposicio = useMemo(
    () =>
      payload.composicio.every(
        (item) =>
          item.codiMaterial.trim() !== "" &&
          ((item.percentatge ?? 0) > 0 || (item.quantitatTones ?? 0) > 0),
      ),
    [payload.composicio],
  );

  const effectivePayload = useMemo(() => {
    const nextComposicio =
      distanciaMaterialsKm !== undefined
        ? payload.composicio.map((item) => ({
            ...item,
            distanciaKm: distanciaMaterialsKm,
          }))
        : payload.composicio;

    const nextTransportMescla =
      distanciaMesclaKm !== undefined
        ? {
            ...payload.transportMescla,
            distanciaKm: distanciaMesclaKm,
          }
        : payload.transportMescla;

    return {
      ...payload,
      composicio: nextComposicio,
      transportMescla: nextTransportMescla,
    };
  }, [distanciaMaterialsKm, distanciaMesclaKm, payload]);

  const calcularAra = async () => {
    if (!validComposicio) {
      return;
    }
    const data = await calcular(effectivePayload);
    setResultat(data);
  };

  useEffect(() => {
    if (!validComposicio) {
      return;
    }
    const timer = window.setTimeout(() => {
      void calcular(effectivePayload).then(setResultat).catch(() => undefined);
    }, 450);
    return () => window.clearTimeout(timer);
  }, [calcular, effectivePayload, validComposicio]);

  const updateComposicio = (index: number, key: keyof EmissionsCalculRequest["composicio"][number], value: string) => {
    setPayload((current) => ({
      ...current,
      composicio: current.composicio.map((item, itemIndex) => {
        if (itemIndex !== index) {
          return item;
        }
        if (key === "codiMaterial" || key === "tipusVehicle") {
          return { ...item, [key]: value };
        }
        return { ...item, [key]: parseNumber(value, 0) };
      }),
    }));
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Calculadora d'Emissions A1-A5 (OC 3/2024)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <label className="text-sm">
              <span className="mb-1 block text-slate-600">Tones de mescla</span>
              <input
                className="h-10 w-full rounded-md border px-3"
                type="number"
                value={payload.totalMesclaTones}
                onChange={(event) =>
                  setPayload((current) => ({ ...current, totalMesclaTones: parseNumber(event.target.value, 1) }))
                }
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-slate-600">Distancia A4 (km)</span>
              <input
                className="h-10 w-full rounded-md border px-3"
                type="number"
                value={payload.transportMescla.distanciaKm}
                onChange={(event) =>
                  setPayload((current) => ({
                    ...current,
                    transportMescla: { ...current.transportMescla, distanciaKm: parseNumber(event.target.value, 0) },
                  }))
                }
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-slate-600">Mermes (%)</span>
              <input
                className="h-10 w-full rounded-md border px-3"
                type="number"
                value={payload.transportMescla.mermesPercent}
                onChange={(event) =>
                  setPayload((current) => ({
                    ...current,
                    transportMescla: { ...current.transportMescla, mermesPercent: parseNumber(event.target.value, 0) },
                  }))
                }
              />
            </label>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Composicio i transport A2</p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="p-2">Codi material</th>
                    <th className="p-2">%</th>
                    <th className="p-2">Distancia (km)</th>
                    <th className="p-2">Vehicle</th>
                    <th className="p-2">Accio</th>
                  </tr>
                </thead>
                <tbody>
                  {payload.composicio.map((item, index) => (
                    <tr key={`${item.codiMaterial}-${index}`} className="border-b">
                      <td className="p-2">
                        <input
                          className="h-9 w-full rounded border px-2"
                          value={item.codiMaterial}
                          onChange={(event) => updateComposicio(index, "codiMaterial", event.target.value)}
                        />
                      </td>
                      <td className="p-2">
                        <input
                          className="h-9 w-full rounded border px-2"
                          type="number"
                          value={item.percentatge ?? ""}
                          onChange={(event) => updateComposicio(index, "percentatge", event.target.value)}
                        />
                      </td>
                      <td className="p-2">
                        <input
                          className="h-9 w-full rounded border px-2"
                          type="number"
                          value={item.distanciaKm ?? ""}
                          onChange={(event) => updateComposicio(index, "distanciaKm", event.target.value)}
                        />
                      </td>
                      <td className="p-2">
                        <input
                          className="h-9 w-full rounded border px-2"
                          value={item.tipusVehicle ?? ""}
                          onChange={(event) => updateComposicio(index, "tipusVehicle", event.target.value)}
                        />
                      </td>
                      <td className="p-2">
                        <button
                          className="text-red-600 hover:underline"
                          type="button"
                          onClick={() =>
                            setPayload((current) => ({
                              ...current,
                              composicio: current.composicio.filter((_, itemIndex) => itemIndex !== index),
                            }))
                          }
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setPayload((current) => ({
                  ...current,
                  composicio: [...current.composicio, { codiMaterial: "", percentatge: 0, distanciaKm: 0 }],
                }))
              }
            >
              Afegir material
            </Button>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <label className="text-sm">
              <span className="mb-1 block text-slate-600">Temp. inicial (C)</span>
              <input
                className="h-10 w-full rounded-md border px-3"
                type="number"
                value={payload.parametresFabricacio.temperaturaInicialC}
                onChange={(event) =>
                  setPayload((current) => ({
                    ...current,
                    parametresFabricacio: {
                      ...current.parametresFabricacio,
                      temperaturaInicialC: parseNumber(event.target.value, 20),
                    },
                  }))
                }
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-slate-600">Temp. mescla (C)</span>
              <input
                className="h-10 w-full rounded-md border px-3"
                type="number"
                value={payload.parametresFabricacio.temperaturaMesclaC}
                onChange={(event) =>
                  setPayload((current) => ({
                    ...current,
                    parametresFabricacio: {
                      ...current.parametresFabricacio,
                      temperaturaMesclaC: parseNumber(event.target.value, 160),
                    },
                  }))
                }
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-slate-600">Humitat (%)</span>
              <input
                className="h-10 w-full rounded-md border px-3"
                type="number"
                value={payload.parametresFabricacio.humitatPercent}
                onChange={(event) =>
                  setPayload((current) => ({
                    ...current,
                    parametresFabricacio: {
                      ...current.parametresFabricacio,
                      humitatPercent: parseNumber(event.target.value, 0),
                    },
                  }))
                }
              />
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <label className="text-sm">
              <span className="mb-1 block text-slate-600">Combustible</span>
              <select
                className="h-10 w-full rounded-md border px-3"
                value={payload.parametresFabricacio.combustible}
                onChange={(event) =>
                  setPayload((current) => ({
                    ...current,
                    parametresFabricacio: {
                      ...current.parametresFabricacio,
                      combustible: event.target.value as EmissionsCalculRequest["parametresFabricacio"]["combustible"],
                    },
                  }))
                }
              >
                <option value="GASOLEO">Gasoleo</option>
                <option value="FUELOLEO">Fueloleo</option>
                <option value="GAS_NATURAL">Gas natural</option>
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-slate-600">Font electrica</span>
              <select
                className="h-10 w-full rounded-md border px-3"
                value={payload.parametresFabricacio.fontElectrica}
                onChange={(event) =>
                  setPayload((current) => ({
                    ...current,
                    parametresFabricacio: {
                      ...current.parametresFabricacio,
                      fontElectrica: event.target.value as EmissionsCalculRequest["parametresFabricacio"]["fontElectrica"],
                    },
                  }))
                }
              >
                <option value="RED">Xarxa</option>
                <option value="GRUP">Grup electrògen</option>
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-slate-600">Calentament</span>
              <select
                className="h-10 w-full rounded-md border px-3"
                value={payload.parametresFabricacio.fontCalentament}
                onChange={(event) =>
                  setPayload((current) => ({
                    ...current,
                    parametresFabricacio: {
                      ...current.parametresFabricacio,
                      fontCalentament: event.target.value as EmissionsCalculRequest["parametresFabricacio"]["fontCalentament"],
                    },
                  }))
                }
              >
                <option value="CALDERA">Caldera</option>
                <option value="ELECTRIC">Electric</option>
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-slate-600">Tipologia</span>
              <select
                className="h-10 w-full rounded-md border px-3"
                value={payload.tipologiaMescla}
                onChange={(event) =>
                  setPayload((current) => ({
                    ...current,
                    tipologiaMescla: event.target.value as EmissionsCalculRequest["tipologiaMescla"],
                  }))
                }
              >
                <option value="MBC_CONVENCIONAL">MBC convencional</option>
                <option value="MBC_AMB_RA">MBC amb RA</option>
                <option value="MBT">MBT</option>
                <option value="AUTL">AUTL</option>
                <option value="ALTRE">Altre</option>
              </select>
            </label>
          </div>

          <div className="flex items-center gap-3">
            <Button className="bg-corporate-green hover:bg-corporate-green/90" onClick={() => void calcularAra()} disabled={loading}>
              {loading ? "Calculant..." : "Recalcular"}
            </Button>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
        </CardContent>
      </Card>

      {resultat && (
        <Card>
          <CardHeader>
            <CardTitle>Contribucio per etapa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(resultat.percentatges).map(([etapa, valor]) => (
              <div key={`bar-${etapa}`} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{etapa}</span>
                  <span>{valor.toFixed(2)}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded bg-slate-200">
                  <div className="h-full bg-corporate-blue" style={{ width: `${Math.min(100, Math.max(0, valor))}%` }} />
                </div>
              </div>
            ))}
            <div className="rounded-md border p-3 text-sm">
              <p className="font-medium">Total: {resultat.total.toFixed(4)} kg CO2e/t</p>
              <p className={resultat.comparativaNormativa.compleix ? "text-corporate-green" : "text-red-600"}>
                Limit {resultat.comparativaNormativa.tipologiaMescla}: {resultat.comparativaNormativa.limit.toFixed(2)} kg CO2e/t
                {" · "}
                {resultat.comparativaNormativa.compleix ? "Compleix" : "No compleix"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {resultat && <IndicadorCompliment comparativa={resultat.comparativaNormativa} />}

      {resultat && <DesglossamentEmissions resultat={resultat} />}
    </div>
  );
}
