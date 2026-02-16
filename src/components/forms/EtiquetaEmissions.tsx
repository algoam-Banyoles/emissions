interface EtiquetaEmissionsProps {
  nivell?: "BAIX" | "MITJA" | "ALT";
  valorKgT?: number;
}

function getStyles(nivell?: "BAIX" | "MITJA" | "ALT") {
  if (nivell === "BAIX") {
    return "border-green-300 bg-green-50 text-green-700";
  }
  if (nivell === "MITJA") {
    return "border-amber-300 bg-amber-50 text-amber-700";
  }
  if (nivell === "ALT") {
    return "border-red-300 bg-red-50 text-red-700";
  }
  return "border-slate-300 bg-slate-50 text-slate-700";
}

export function EtiquetaEmissions({ nivell, valorKgT }: EtiquetaEmissionsProps) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${getStyles(nivell)}`}>
      <span>{nivell ?? "N/A"}</span>
      {valorKgT !== undefined && <span>{valorKgT.toFixed(2)} kg/t</span>}
    </span>
  );
}
