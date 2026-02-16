import { useMemo, useState } from "react";

import { type ParetoOptimizationResult } from "@/types/optimization";

interface FronteraParetoProps {
  resultat: ParetoOptimizationResult;
}

type AxisKey = "estructural" | "emissions" | "economic";

function scale(values: number[], value: number, minPx: number, maxPx: number) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max <= min) {
    return (minPx + maxPx) / 2;
  }
  return minPx + ((value - min) / (max - min)) * (maxPx - minPx);
}

export function FronteraPareto({ resultat }: FronteraParetoProps) {
  const [xAxis, setXAxis] = useState<AxisKey>("emissions");
  const [yAxis, setYAxis] = useState<AxisKey>("economic");

  const points = useMemo(() => {
    return resultat.noDominades.map((item) => ({
      id: item.id,
      x: item.objectives[xAxis],
      y: item.objectives[yAxis],
      rank: item.rank,
      crowdingDistance: item.crowdingDistance,
    }));
  }, [resultat.noDominades, xAxis, yAxis]);

  const xValues = points.map((point) => point.x);
  const yValues = points.map((point) => point.y);

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Eix X</span>
          <select className="h-9 rounded-md border px-3" value={xAxis} onChange={(event) => setXAxis(event.target.value as AxisKey)}>
            <option value="estructural">Estructural</option>
            <option value="emissions">Emissions</option>
            <option value="economic">Economic</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Eix Y</span>
          <select className="h-9 rounded-md border px-3" value={yAxis} onChange={(event) => setYAxis(event.target.value as AxisKey)}>
            <option value="estructural">Estructural</option>
            <option value="emissions">Emissions</option>
            <option value="economic">Economic</option>
          </select>
        </label>
      </div>

      <div className="rounded-md border bg-slate-50 p-2">
        <svg viewBox="0 0 520 300" className="h-[300px] w-full">
          <line x1={50} y1={250} x2={480} y2={250} stroke="#94a3b8" strokeWidth={1} />
          <line x1={50} y1={30} x2={50} y2={250} stroke="#94a3b8" strokeWidth={1} />

          {points.map((point) => {
            const cx = scale(xValues, point.x, 60, 470);
            const cy = 250 - scale(yValues, point.y, 0, 210);
            return (
              <g key={point.id}>
                <circle cx={cx} cy={cy} r={6} fill="#1e3a5f">
                  <title>
                    {point.id} · {xAxis}:{point.x.toFixed(3)} · {yAxis}:{point.y.toFixed(3)} · crowding:
                    {" "}
                    {point.crowdingDistance.toFixed(3)}
                  </title>
                </circle>
                <text x={cx + 8} y={cy - 8} fontSize="10" fill="#334155">
                  {point.id.slice(0, 6)}
                </text>
              </g>
            );
          })}

          <text x={260} y={290} textAnchor="middle" fontSize="12" fill="#334155">{xAxis}</text>
          <text x={14} y={140} textAnchor="middle" fontSize="12" fill="#334155" transform="rotate(-90 14 140)">{yAxis}</text>
        </svg>
      </div>
    </div>
  );
}
