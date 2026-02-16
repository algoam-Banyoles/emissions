import { EtiquetaEmissions } from "@/components/forms/EtiquetaEmissions";
import { type EstructuraViable } from "@/types/project";

interface ComparadorEstructuresProps {
  estructures: EstructuraViable[];
}

export function ComparadorEstructures({ estructures }: ComparadorEstructuresProps) {
  if (estructures.length < 2) {
    return (
      <div className="rounded-md border p-3 text-sm text-slate-600">
        Selecciona almenys dues estructures per comparar.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b bg-slate-50">
              <th className="p-2">Estructura</th>
              <th className="p-2">Gruix total (cm)</th>
              <th className="p-2">Ratio fatiga</th>
              <th className="p-2">Ratio aixecament</th>
              <th className="p-2">Deformacio (mm)</th>
              <th className="p-2">Emissions totals (kg/t)</th>
              <th className="p-2">Emissions (kg/m2)</th>
              <th className="p-2">Nivell</th>
              <th className="p-2">Cost total (EUR/m2)</th>
              <th className="p-2">Cost anual (EUR/m2/any)</th>
            </tr>
          </thead>
          <tbody>
            {estructures.map((estructura) => (
              <tr key={estructura.id} className="border-b">
                <td className="p-2">{estructura.id.slice(0, 8)}</td>
                <td className="p-2">{estructura.gruixTotalCm.toFixed(1)}</td>
                <td className="p-2">{estructura.verificacio.ratios.fatiga.toFixed(3)}</td>
                <td className="p-2">{estructura.verificacio.ratios.aixecament.toFixed(3)}</td>
                <td className="p-2">{estructura.verificacio.deformacions.deformacioSuperficialMm.toFixed(2)}</td>
                <td className="p-2">{estructura.emissions?.totalKgT?.toFixed(3) ?? "-"}</td>
                <td className="p-2">{estructura.emissions?.kgM2?.toFixed(3) ?? "-"}</td>
                <td className="p-2">
                  <EtiquetaEmissions
                    {...(estructura.emissions?.nivell ? { nivell: estructura.emissions.nivell } : {})}
                    {...(estructura.emissions?.totalKgT !== undefined ? { valorKgT: estructura.emissions.totalKgT } : {})}
                  />
                </td>
                <td className="p-2">{estructura.costos?.totalEurM2?.toFixed(2) ?? "-"}</td>
                <td className="p-2">{estructura.costos?.costAnyVidaUtilEurM2?.toFixed(3) ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-md border p-3">
        <p className="mb-2 text-sm font-medium text-corporate-blue">Grafic comparatiu de gruixos</p>
        <div className="space-y-2">
          {estructures.map((estructura) => (
            <div key={`${estructura.id}-bar`} className="flex items-center gap-2 text-xs">
              <span className="w-16 shrink-0">{estructura.id.slice(0, 6)}</span>
              <div className="h-3 flex-1 rounded bg-slate-200">
                <div
                  className="h-full rounded bg-corporate-green"
                  style={{ width: `${Math.min(100, (estructura.gruixTotalCm / 80) * 100)}%` }}
                />
              </div>
              <span className="w-12 text-right">{estructura.gruixTotalCm.toFixed(1)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-md border p-3">
        <p className="mb-2 text-sm font-medium text-corporate-blue">Grafic comparatiu d'emissions totals (kg/t)</p>
        <div className="space-y-2">
          {estructures.map((estructura) => {
            const value = estructura.emissions?.totalKgT ?? 0;
            return (
              <div key={`${estructura.id}-emissions-bar`} className="flex items-center gap-2 text-xs">
                <span className="w-16 shrink-0">{estructura.id.slice(0, 6)}</span>
                <div className="h-3 flex-1 rounded bg-slate-200">
                  <div
                    className="h-full rounded bg-corporate-blue"
                    style={{ width: `${Math.min(100, (value / 90) * 100)}%` }}
                  />
                </div>
                <span className="w-14 text-right">{value.toFixed(2)}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-md border p-3">
        <p className="mb-2 text-sm font-medium text-corporate-blue">Grafic comparatiu de costos totals (EUR/m2)</p>
        <div className="space-y-2">
          {estructures.map((estructura) => {
            const value = estructura.costos?.totalEurM2 ?? 0;
            return (
              <div key={`${estructura.id}-cost-bar`} className="flex items-center gap-2 text-xs">
                <span className="w-16 shrink-0">{estructura.id.slice(0, 6)}</span>
                <div className="h-3 flex-1 rounded bg-slate-200">
                  <div
                    className="h-full rounded bg-amber-600"
                    style={{ width: `${Math.min(100, (value / 120) * 100)}%` }}
                  />
                </div>
                <span className="w-14 text-right">{value.toFixed(2)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
