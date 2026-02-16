import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type EmissionsCalculResponse } from "@/types/emissions-calcul";

interface DesglossamentEmissionsProps {
  resultat: EmissionsCalculResponse;
}

const etapes: (keyof EmissionsCalculResponse["etapes"])[] = ["A1", "A2", "A3", "A4", "A5"];

export function DesglossamentEmissions({ resultat }: DesglossamentEmissionsProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Desglossament detallat A1-A5</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b">
                <th className="p-2">Etapa</th>
                <th className="p-2">Emissions (kg CO2e/t)</th>
                <th className="p-2">% contribucio</th>
              </tr>
            </thead>
            <tbody>
              {etapes.map((etapa) => (
                <tr key={etapa} className="border-b">
                  <td className="p-2 font-medium">{etapa}</td>
                  <td className="p-2">{resultat.etapes[etapa].toFixed(4)}</td>
                  <td className="p-2">{resultat.percentatges[etapa].toFixed(2)}%</td>
                </tr>
              ))}
              <tr className="bg-slate-50">
                <td className="p-2 font-semibold">TOTAL</td>
                <td className="p-2 font-semibold">{resultat.total.toFixed(4)}</td>
                <td className="p-2 font-semibold">100%</td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Formules utilitzades</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {Object.entries(resultat.formulas).map(([key, value]) => (
            <p key={key}>
              <span className="font-medium">{key}:</span> {value}
            </p>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Fonts de dades</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {etapes.map((etapa) => (
            <div key={`fonts-${etapa}`}>
              <p className="font-medium">{etapa}</p>
              {resultat.fontsDades[etapa].length === 0 ? (
                <p className="text-slate-500">Sense fonts registrades per aquesta etapa</p>
              ) : (
                <ul className="list-disc pl-5 text-slate-600">
                  {resultat.fontsDades[etapa].slice(0, 6).map((font) => (
                    <li key={`${etapa}-${font}`}>{font}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
