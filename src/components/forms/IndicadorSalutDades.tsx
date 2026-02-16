import { type EmissionsValidationSummary } from "@/types/emissions-admin";

interface IndicadorSalutDadesProps {
  summary: EmissionsValidationSummary;
}

function getStatusColor(healthScore: number) {
  if (healthScore >= 85) {
    return "bg-emerald-500";
  }
  if (healthScore >= 65) {
    return "bg-amber-500";
  }
  return "bg-red-500";
}

function getStatusLabel(healthScore: number) {
  if (healthScore >= 85) {
    return "Salut alta";
  }
  if (healthScore >= 65) {
    return "Salut mitjana";
  }
  return "Salut baixa";
}

export function IndicadorSalutDades({ summary }: IndicadorSalutDadesProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-3">
        <span className={`h-3 w-3 rounded-full ${getStatusColor(summary.healthScore)}`} />
        <h3 className="text-base font-semibold text-corporate-blue">{getStatusLabel(summary.healthScore)}</h3>
      </div>
      <p className="mt-2 text-sm text-slate-600">Indicador de salut de la base de dades</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <div className="rounded border p-3">
          <p className="text-xs text-slate-500">Salut</p>
          <p className="text-lg font-semibold">{summary.healthScore.toFixed(1)}%</p>
        </div>
        <div className="rounded border p-3">
          <p className="text-xs text-slate-500">Cobertura</p>
          <p className="text-lg font-semibold">{summary.coveragePercentage.toFixed(1)}%</p>
        </div>
        <div className="rounded border p-3">
          <p className="text-xs text-slate-500">Problemes</p>
          <p className="text-lg font-semibold">{summary.totalIssues}</p>
        </div>
      </div>
    </div>
  );
}
