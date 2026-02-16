import { useEffect, useMemo, useState } from "react";

import { IndicadorSalutDades } from "@/components/forms/IndicadorSalutDades";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEmissionsAdmin } from "@/hooks/useEmissionsAdmin";
import { type EmissionsValidationRun } from "@/types/emissions-admin";

export default function ValidacioEmissions() {
  const { loading, error, runValidation, getLatestValidation, getValidationHistory } = useEmissionsAdmin();

  const [latest, setLatest] = useState<EmissionsValidationRun | null>(null);
  const [history, setHistory] = useState<EmissionsValidationRun[]>([]);

  useEffect(() => {
    let active = true;
    void (async () => {
      const [latestRun, historyRuns] = await Promise.all([getLatestValidation(), getValidationHistory(25)]);
      if (!active) {
        return;
      }
      setLatest(latestRun);
      setHistory(historyRuns);
    })();

    return () => {
      active = false;
    };
  }, [getLatestValidation, getValidationHistory]);

  const reloadValidationData = async () => {
    const [latestRun, historyRuns] = await Promise.all([getLatestValidation(), getValidationHistory(25)]);
    setLatest(latestRun);
    setHistory(historyRuns);
  };

  const issuesBySeverity = useMemo(() => {
    if (!latest) {
      return { error: 0, warning: 0, info: 0 };
    }

    return {
      error: latest.issues.filter((item) => item.severity === "error").length,
      warning: latest.issues.filter((item) => item.severity === "warning").length,
      info: latest.issues.filter((item) => item.severity === "info").length,
    };
  }, [latest]);

  return (
    <main className="space-y-6 p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-corporate-blue">Validacio de Dades d'Emissions</h1>
          <p className="text-sm text-slate-600">Control de qualitat, coherencia i cobertura dels factors A1-A5</p>
        </div>
        <Button
          className="bg-corporate-green hover:bg-corporate-green/90"
          disabled={loading}
          onClick={() => {
            void runValidation().then(async (result) => {
              setLatest(result);
              await reloadValidationData();
            });
          }}
        >
          Executar validacio manual
        </Button>
      </div>

      {latest ? <IndicadorSalutDades summary={latest.summary} /> : null}

      <Card>
        <CardHeader>
          <CardTitle>Ultima validacio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {!latest && <p className="text-slate-500">Encara no hi ha validacions registrades.</p>}
          {latest && (
            <>
              <p>
                Data: <strong>{new Date(latest.executedAt).toLocaleString()}</strong> | Trigger: <strong>{latest.trigger}</strong> |
                Versio: <strong>{latest.version.numero}</strong>
              </p>
              <p>
                Errors: <strong className="text-red-600">{issuesBySeverity.error}</strong> | Warnings: <strong className="text-amber-600">{issuesBySeverity.warning}</strong> | Info: <strong>{issuesBySeverity.info}</strong>
              </p>
              <p>
                Alerta email: <strong>{latest.alertEmailSent ? "enviada" : "no enviada"}</strong>
              </p>
              {latest.issues.length > 0 && (
                <div className="space-y-2 rounded-md border p-3">
                  {latest.issues.map((issue) => (
                    <div key={issue.id} className="rounded border p-2">
                      <p className="text-sm font-medium">
                        [{issue.severity}] {issue.message}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-500">
                        <span>Regla: {issue.rule}</span>
                        {issue.entityType && <span>Entitat: {issue.entityType}</span>}
                        {issue.entityId && <span>ID: {issue.entityId}</span>}
                        {issue.fixPath && (
                          <a href={issue.fixPath} className="underline">
                            Corregir
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historic de validacions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b">
                  <th className="p-2">Data</th>
                  <th className="p-2">Trigger</th>
                  <th className="p-2">Versio</th>
                  <th className="p-2">Salut</th>
                  <th className="p-2">Errors</th>
                  <th className="p-2">Warnings</th>
                  <th className="p-2">Info</th>
                </tr>
              </thead>
              <tbody>
                {history.map((run) => (
                  <tr key={run.runId} className="border-b">
                    <td className="p-2">{new Date(run.executedAt).toLocaleString()}</td>
                    <td className="p-2">{run.trigger}</td>
                    <td className="p-2">{run.version.numero}</td>
                    <td className="p-2">{run.summary.healthScore.toFixed(1)}%</td>
                    <td className="p-2 text-red-600">{run.summary.errors}</td>
                    <td className="p-2 text-amber-600">{run.summary.warnings}</td>
                    <td className="p-2">{run.summary.info}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
