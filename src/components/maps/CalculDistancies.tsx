import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { useGIS } from "@/hooks/useGIS";
import { type Coordinate, type GISRouteResult, type Ubicacio } from "@/types/gis";

interface CalculDistanciesProps {
  ubicacions: Ubicacio[];
  onDistancesChange?: (data: {
    distanciaMaterialsKm: number;
    distanciaMesclaKm: number;
    routes: GISRouteResult[];
  }) => void;
}

function toCoordinate(ubicacio: Ubicacio): Coordinate {
  return { lat: ubicacio.latitud, lng: ubicacio.longitud };
}

export function CalculDistancies({ ubicacions, onDistancesChange }: CalculDistanciesProps) {
  const { batchCalcularRutes, loading } = useGIS();
  const [origenId, setOrigenId] = useState(ubicacions[0]?.id ?? "");
  const [destiIds, setDestiIds] = useState<string[]>(
    ubicacions.slice(1, 4).map((item) => item.id),
  );
  const [routes, setRoutes] = useState<GISRouteResult[]>([]);

  const [distanciaMaterialsKm, setDistanciaMaterialsKm] = useState(25);
  const [distanciaMesclaKm, setDistanciaMesclaKm] = useState(35);

  const origin = useMemo(
    () => ubicacions.find((item) => item.id === origenId) ?? null,
    [origenId, ubicacions],
  );
  const destins = useMemo(
    () => ubicacions.filter((item) => destiIds.includes(item.id)),
    [destiIds, ubicacions],
  );

  const calculate = async () => {
    if (!origin || destins.length === 0) {
      return;
    }

    const response = await batchCalcularRutes(
      toCoordinate(origin),
      destins.map(toCoordinate),
    );

    setRoutes(response);

    const kms = response.map((item) => item.summary.distanceKm);
    const avg = kms.reduce((acc, value) => acc + value, 0) / Math.max(1, kms.length);
    const max = Math.max(...kms);

    setDistanciaMaterialsKm(Number(avg.toFixed(3)));
    setDistanciaMesclaKm(Number(max.toFixed(3)));

    onDistancesChange?.({
      distanciaMaterialsKm: Number(avg.toFixed(3)),
      distanciaMesclaKm: Number(max.toFixed(3)),
      routes: response,
    });
  };

  return (
    <div className="space-y-4 rounded-md border p-4">
      <div className="grid gap-3 md:grid-cols-3">
        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Origen</span>
          <select className="h-10 w-full rounded-md border px-3" value={origenId} onChange={(event) => setOrigenId(event.target.value)}>
            <option value="">Selecciona origen</option>
            {ubicacions.map((item) => (
              <option key={item.id} value={item.id}>{item.nom}</option>
            ))}
          </select>
        </label>

        <label className="text-sm md:col-span-2">
          <span className="mb-1 block text-slate-600">Destinacions</span>
          <div className="grid max-h-28 grid-cols-2 gap-1 overflow-auto rounded-md border p-2 text-xs">
            {ubicacions
              .filter((item) => item.id !== origenId)
              .map((item) => (
                <label key={item.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={destiIds.includes(item.id)}
                    onChange={(event) => {
                      setDestiIds((current) =>
                        event.target.checked
                          ? [...current, item.id]
                          : current.filter((id) => id !== item.id),
                      );
                    }}
                  />
                  {item.nom}
                </label>
              ))}
          </div>
        </label>
      </div>

      <Button disabled={!origin || destins.length === 0 || loading} onClick={() => void calculate()}>
        Calcular distancies (batch)
      </Button>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Distancia materials (km)</span>
          <input
            className="h-10 w-full rounded-md border px-3"
            type="number"
            value={distanciaMaterialsKm}
            onChange={(event) => {
              const value = Number(event.target.value) || 0;
              setDistanciaMaterialsKm(value);
              onDistancesChange?.({ distanciaMaterialsKm: value, distanciaMesclaKm, routes });
            }}
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Distancia mescla (km)</span>
          <input
            className="h-10 w-full rounded-md border px-3"
            type="number"
            value={distanciaMesclaKm}
            onChange={(event) => {
              const value = Number(event.target.value) || 0;
              setDistanciaMesclaKm(value);
              onDistancesChange?.({ distanciaMaterialsKm, distanciaMesclaKm: value, routes });
            }}
          />
        </label>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b bg-slate-50">
              <th className="p-2">Ruta</th>
              <th className="p-2">Distancia (km)</th>
              <th className="p-2">Provider</th>
              <th className="p-2">Cache</th>
            </tr>
          </thead>
          <tbody>
            {routes.map((route, index) => (
              <tr key={route.id} className="border-b">
                <td className="p-2">
                  {origin?.nom ?? "Origen"}
                  {" -> "}
                  {destins[index]?.nom ?? `Desti ${index + 1}`}
                </td>
                <td className="p-2">{route.summary.distanceKm.toFixed(3)}</td>
                <td className="p-2">{route.summary.provider}</td>
                <td className="p-2">{route.summary.cached ? "Si" : "No"}</td>
              </tr>
            ))}
            {routes.length === 0 && (
              <tr>
                <td className="p-3 text-slate-500" colSpan={4}>Encara no hi ha resultats de batch.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
