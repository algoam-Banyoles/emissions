import { type SensibilitatResult } from "@/types/optimization";

interface AnalisiSensibilitatProps {
  resultat: SensibilitatResult;
}

export function AnalisiSensibilitat({ resultat }: AnalisiSensibilitatProps) {
  return (
    <div className="space-y-3 rounded-lg border p-4">
      <p className="text-sm text-slate-600">
        Escenaris:
        {" "}
        <strong>{resultat.totalEscenaris}</strong>
        {" · "}
        Increment:
        {" "}
        <strong>{resultat.increment}</strong>
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b">
              <th className="p-2">Pes estructural</th>
              <th className="p-2">Pes emissions</th>
              <th className="p-2">Pes economic</th>
              <th className="p-2">Millor solucio</th>
              <th className="p-2">Score</th>
            </tr>
          </thead>
          <tbody>
            {resultat.matriuResultats.slice(0, 20).map((row, index) => (
              <tr key={`${row.millorId}-${index}`} className="border-b">
                <td className="p-2">{row.pesos.estructural.toFixed(2)}</td>
                <td className="p-2">{row.pesos.emissions.toFixed(2)}</td>
                <td className="p-2">{row.pesos.economic.toFixed(2)}</td>
                <td className="p-2">{row.millorId}</td>
                <td className="p-2">{row.score.toFixed(4)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-corporate-blue">Solucions robustes</p>
        <div className="space-y-2">
          {resultat.solucionsRobustes.map((row) => (
            <div key={row.id} className="flex items-center gap-3 text-sm">
              <span className="w-24">{row.id.slice(0, 8)}</span>
              <div className="h-2 flex-1 rounded bg-slate-200">
                <div className="h-full rounded bg-corporate-green" style={{ width: `${Math.min(100, row.percentatge)}%` }} />
              </div>
              <span className="w-16 text-right">{row.percentatge.toFixed(1)}%</span>
            </div>
          ))}
          {resultat.solucionsRobustes.length === 0 && <p className="text-sm text-slate-500">No hi ha solucions robustes amb el llindar actual.</p>}
        </div>
      </div>
    </div>
  );
}
