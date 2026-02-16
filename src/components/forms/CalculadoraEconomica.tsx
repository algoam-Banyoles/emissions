import { useMemo, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type EstructuraViable } from "@/types/project";

interface CalculadoraEconomicaProps {
  estructures: EstructuraViable[];
}

function round(value: number, decimals = 4) {
  return Number(value.toFixed(decimals));
}

export function CalculadoraEconomica({ estructures }: CalculadoraEconomicaProps) {
  const [factorMaterials, setFactorMaterials] = useState("1");
  const [factorTransport, setFactorTransport] = useState("1");
  const [factorFabricacio, setFactorFabricacio] = useState("1");
  const [factorPosada, setFactorPosada] = useState("1");

  const factors = useMemo(
    () => ({
      materials: Number(factorMaterials) || 1,
      transport: Number(factorTransport) || 1,
      fabricacio: Number(factorFabricacio) || 1,
      posada: Number(factorPosada) || 1,
    }),
    [factorFabricacio, factorMaterials, factorPosada, factorTransport],
  );

  const adjusted = useMemo(
    () =>
      estructures
        .filter((estructura) => estructura.costos)
        .map((estructura) => {
          const costos = estructura.costos;
          if (!costos) {
            return null;
          }

          const material = costos.materialEurM2 * factors.materials;
          const transport = costos.transportEurM2 * factors.transport;
          const fabricacio = costos.fabricacioEurM2 * factors.fabricacio;
          const posada = costos.posadaObraEurM2 * factors.posada;
          const total = material + transport + fabricacio + posada;

          return {
            id: estructura.id,
            material: round(material),
            transport: round(transport),
            fabricacio: round(fabricacio),
            posada: round(posada),
            total: round(total),
            anual: round(total / Math.max(1, costos.vidaUtilAnys)),
            perCapa: costos.perCapa,
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null),
    [estructures, factors],
  );

  if (adjusted.length === 0) {
    return (
      <div className="rounded-md border p-3 text-sm text-slate-600">
        Genera estructures per visualitzar la calculadora economica.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Calculadora economica</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <label className="text-sm">
            <span className="mb-1 block text-slate-600">Factor materials</span>
            <input className="h-10 w-full rounded-md border px-3" value={factorMaterials} onChange={(event) => setFactorMaterials(event.target.value)} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-slate-600">Factor transport</span>
            <input className="h-10 w-full rounded-md border px-3" value={factorTransport} onChange={(event) => setFactorTransport(event.target.value)} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-slate-600">Factor fabricacio</span>
            <input className="h-10 w-full rounded-md border px-3" value={factorFabricacio} onChange={(event) => setFactorFabricacio(event.target.value)} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-slate-600">Factor posada en obra</span>
            <input className="h-10 w-full rounded-md border px-3" value={factorPosada} onChange={(event) => setFactorPosada(event.target.value)} />
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Desglossament de costos</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b bg-slate-50">
                <th className="p-2">Estructura</th>
                <th className="p-2">Materials (EUR/m2)</th>
                <th className="p-2">Transport (EUR/m2)</th>
                <th className="p-2">Fabricacio (EUR/m2)</th>
                <th className="p-2">Posada en obra (EUR/m2)</th>
                <th className="p-2">Total (EUR/m2)</th>
                <th className="p-2">Cost anual (EUR/m2/any)</th>
              </tr>
            </thead>
            <tbody>
              {adjusted.map((row) => (
                <tr key={row.id} className="border-b">
                  <td className="p-2">{row.id.slice(0, 8)}</td>
                  <td className="p-2">{row.material.toFixed(2)}</td>
                  <td className="p-2">{row.transport.toFixed(2)}</td>
                  <td className="p-2">{row.fabricacio.toFixed(2)}</td>
                  <td className="p-2">{row.posada.toFixed(2)}</td>
                  <td className="p-2 font-medium">{row.total.toFixed(2)}</td>
                  <td className="p-2">{row.anual.toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Grafic costos per capa (EUR/m2)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {adjusted.map((row) => (
            <div key={`${row.id}-layers`} className="space-y-1">
              <p className="text-sm font-medium text-corporate-blue">Estructura {row.id.slice(0, 8)}</p>
              {row.perCapa.map((capa, index) => (
                <div key={`${row.id}-${capa.tipus}-${index}`} className="flex items-center gap-2 text-xs">
                  <span className="w-20 shrink-0">{capa.tipus}</span>
                  <div className="h-3 flex-1 rounded bg-slate-200">
                    <div
                      className="h-full rounded bg-corporate-green"
                      style={{ width: `${Math.min(100, (capa.costTotalEurM2 / 40) * 100)}%` }}
                    />
                  </div>
                  <span className="w-14 text-right">{capa.costTotalEurM2.toFixed(2)}</span>
                </div>
              ))}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
