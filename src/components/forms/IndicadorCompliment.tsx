import { type EmissionsCalculResponse } from "@/types/emissions-calcul";

interface IndicadorComplimentProps {
  comparativa: EmissionsCalculResponse["comparativaNormativa"];
}

function colorByNivell(nivell: IndicadorComplimentProps["comparativa"]["nivell"]) {
  if (nivell === "VERD") {
    return {
      dot: "bg-green-500",
      text: "text-green-700",
      box: "border-green-200 bg-green-50",
      label: "Verd",
    };
  }

  if (nivell === "GROC") {
    return {
      dot: "bg-amber-500",
      text: "text-amber-700",
      box: "border-amber-200 bg-amber-50",
      label: "Groc",
    };
  }

  return {
    dot: "bg-red-500",
    text: "text-red-700",
    box: "border-red-200 bg-red-50",
    label: "Vermell",
  };
}

export function IndicadorCompliment({ comparativa }: IndicadorComplimentProps) {
  const colors = colorByNivell(comparativa.nivell);

  return (
    <div className={`space-y-3 rounded-md border p-3 ${colors.box}`}>
      <div className="flex items-center gap-2">
        <span className={`inline-block h-3 w-3 rounded-full ${colors.dot}`} />
        <p className={`text-sm font-medium ${colors.text}`}>
          Compliment normatiu {colors.label}: {comparativa.compleix ? "Compleix" : "No compleix"}
        </p>
      </div>

      <p className="text-sm text-slate-700">
        Emissions {comparativa.etapa}: {comparativa.emissionsTotals.toFixed(3)} kg CO2e/t · Limit: {comparativa.limit.toFixed(3)} kg CO2e/t · Marge: {comparativa.marge.toFixed(3)} kg CO2e/t
      </p>

      <div className="space-y-1 text-xs text-slate-600">
        <p className="font-medium">Limits aplicables:</p>
        {comparativa.limitsAplicables.map((limit) => (
          <p key={`${limit.tipologiaMescla}-${limit.etapa}-${limit.dataEntradaVigor}`}>
            {limit.tipologiaMescla} · {limit.etapa} · {limit.valorLimit.toFixed(3)} · {limit.fontNormativa} · {new Date(limit.dataEntradaVigor).toLocaleDateString("ca-ES")}
          </p>
        ))}
      </div>

      {!comparativa.compleix && (
        <div className="rounded border border-red-200 bg-red-100 p-2 text-xs text-red-700">
          <p className="font-medium">Alerta: el calcul supera el limit normatiu.</p>
          <ul className="mt-1 list-disc pl-4">
            {comparativa.recomanacions.map((text, index) => (
              <li key={`${index}-${text}`}>{text}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
