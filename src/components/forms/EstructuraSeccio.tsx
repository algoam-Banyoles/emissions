import { type EstructuraViable } from "@/types/project";

interface EstructuraSeccioProps {
  estructura: EstructuraViable;
}

const layerColors: Record<string, string> = {
  RODAMENT: "#1e3a5f",
  INTERMEDIA: "#2563eb",
  BASE: "#2d8a4e",
  SUBBASE: "#64748b",
  FONAMENT: "#334155",
};

export function EstructuraSeccio({ estructura }: EstructuraSeccioProps) {
  const totalThickness = estructura.capes.reduce((sum, capa) => sum + capa.gruixCm, 0);

  return (
    <div className="space-y-2 rounded-md border p-3">
      <p className="text-xs text-slate-600">Gruix total: {estructura.gruixTotalCm.toFixed(1)} cm</p>
      <div className="flex h-36 w-full items-end overflow-hidden rounded border bg-slate-100">
        {estructura.capes.map((capa, index) => {
          const heightPct = (capa.gruixCm / totalThickness) * 100;
          return (
            <div
              key={`${estructura.id}-${index}`}
              className="relative flex-1 border-r border-white/50"
              style={{
                height: `${heightPct}%`,
                background: layerColors[capa.tipus] ?? "#94a3b8",
              }}
              title={`${capa.nom} (${capa.gruixCm} cm)`}
            >
              <span className="absolute bottom-1 left-1 text-[10px] font-medium text-white">
                {capa.tipus}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
