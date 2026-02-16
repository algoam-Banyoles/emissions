import { useCallback, useEffect, useMemo, useState } from "react";

import { ImportModal } from "@/components/forms/ImportModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminMaterials } from "@/hooks/useAdminMaterials";
import { type DataVersion, type VersionComparison } from "@/types/material";

export default function VersionsAdmin() {
  const { listVersions, publishVersion, activateVersion, compareVersions, importPrices, loading, error } =
    useAdminMaterials();
  const [versions, setVersions] = useState<DataVersion[]>([]);
  const [publishNumero, setPublishNumero] = useState("");
  const [publishDesc, setPublishDesc] = useState("");
  const [fromVersion, setFromVersion] = useState("");
  const [toVersion, setToVersion] = useState("");
  const [comparison, setComparison] = useState<VersionComparison | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const refresh = useCallback(async () => {
    const data = await listVersions();
    setVersions(data);
  }, [listVersions]);

  useEffect(() => {
    let cancelled = false;

    void listVersions().then((data) => {
      if (!cancelled) {
        setVersions(data);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [listVersions]);

  const latestVersionId = useMemo(() => versions.find((item) => item.esActual)?.id ?? "", [versions]);

  return (
    <main className="space-y-6 p-6">
      <h1 className="text-2xl font-semibold text-corporate-blue">Administracio de versions</h1>

      <Card>
        <CardHeader>
          <CardTitle>Publicar nova versio</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[1fr_2fr_auto_auto]">
          <input
            className="h-10 rounded-md border px-3 text-sm"
            value={publishNumero}
            onChange={(event) => setPublishNumero(event.target.value)}
            placeholder="Numero (ex. 2026.02)"
          />
          <input
            className="h-10 rounded-md border px-3 text-sm"
            value={publishDesc}
            onChange={(event) => setPublishDesc(event.target.value)}
            placeholder="Descripcio"
          />
          <Button
            className="bg-corporate-green hover:bg-corporate-green/90"
            onClick={() => {
              if (!publishNumero) {
                return;
              }

              const payload: { numero: string; descripcio?: string; esActual?: boolean } = {
                numero: publishNumero,
                esActual: false,
              };

              if (publishDesc) {
                payload.descripcio = publishDesc;
              }

              void publishVersion({
                ...payload,
              }).then(async () => {
                setPublishNumero("");
                setPublishDesc("");
                await refresh();
              });
            }}
          >
            Publicar
          </Button>
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            Importar CSV
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Llista de versions</CardTitle>
        </CardHeader>
        <CardContent>
          {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b">
                  <th className="p-2">Numero</th>
                  <th className="p-2">Estat</th>
                  <th className="p-2">Actual</th>
                  <th className="p-2">Materials</th>
                  <th className="p-2">Publicacio</th>
                  <th className="p-2">Accions</th>
                </tr>
              </thead>
              <tbody>
                {versions.map((version) => (
                  <tr key={version.id} className="border-b">
                    <td className="p-2">{version.numero}</td>
                    <td className="p-2">{version.estat}</td>
                    <td className="p-2">{version.esActual ? "Si" : "No"}</td>
                    <td className="p-2">{version.materialsCount ?? 0}</td>
                    <td className="p-2">
                      {version.dataPublicacio ? new Date(version.dataPublicacio).toLocaleDateString() : "-"}
                    </td>
                    <td className="p-2">
                      <Button
                        variant="outline"
                        disabled={version.esActual || loading}
                        onClick={() => {
                          void activateVersion(version.id).then(refresh);
                        }}
                      >
                        Activar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Comparativa entre versions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-3">
            <select
              className="h-10 rounded-md border px-3 text-sm"
              value={fromVersion}
              onChange={(event) => setFromVersion(event.target.value)}
            >
              <option value="">Versio origen</option>
              {versions.map((version) => (
                <option key={`from-${version.id}`} value={version.id}>
                  {version.numero}
                </option>
              ))}
            </select>
            <select
              className="h-10 rounded-md border px-3 text-sm"
              value={toVersion}
              onChange={(event) => setToVersion(event.target.value)}
            >
              <option value="">Versio desti</option>
              {versions.map((version) => (
                <option key={`to-${version.id}`} value={version.id}>
                  {version.numero}
                </option>
              ))}
            </select>
            <Button
              variant="outline"
              disabled={!fromVersion || !toVersion}
              onClick={() => {
                void compareVersions(fromVersion, toVersion).then(setComparison);
              }}
            >
              Comparar
            </Button>
          </div>

          {comparison && (
            <div className="rounded-md border bg-slate-50 p-3 text-sm">
              <p>Creats: {comparison.summary.created}</p>
              <p>Actualitzats: {comparison.summary.updated}</p>
              <p>Eliminats: {comparison.summary.removed}</p>
              <p className="mt-1 text-xs text-slate-500">Versio activa actual: {latestVersionId || "-"}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <ImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImport={async (payload) => {
          await importPrices(payload);
          await refresh();
        }}
      />
    </main>
  );
}
