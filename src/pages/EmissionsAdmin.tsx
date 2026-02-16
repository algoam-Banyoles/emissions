import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { ExportarEmissions } from "@/components/forms/ExportarEmissions";
import { FactorEmissioForm } from "@/components/forms/FactorEmissioForm";
import { HistorialCanvis } from "@/components/forms/HistorialCanvis";
import { ImportarEmissions } from "@/components/forms/ImportarEmissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEmissionsAdmin } from "@/hooks/useEmissionsAdmin";
import { type EmissionsHistoryItem, type EmissionsResource } from "@/types/emissions-admin";
import { type DataVersion } from "@/types/material";

const tabs: { key: EmissionsResource; label: string }[] = [
  { key: "materials", label: "Materials" },
  { key: "transport", label: "Transport" },
  { key: "combustibles", label: "Combustibles" },
  { key: "electric", label: "Electric" },
  { key: "equips", label: "Equips" },
  { key: "limits", label: "Limits" },
  { key: "constants", label: "Constants" },
];

type SortDirection = "asc" | "desc";

export default function EmissionsAdmin() {
  const {
    loading,
    error,
    listFactors,
    createFactor,
    updateFactor,
    deleteFactor,
    bulkUpdateVersion,
    exportCsv,
    exportFactors,
    importFactors,
    listHistory,
    revertHistory,
    listVersions,
    previewImport,
  } = useEmissionsAdmin();

  const [resource, setResource] = useState<EmissionsResource>("materials");
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [history, setHistory] = useState<EmissionsHistoryItem[]>([]);
  const [versions, setVersions] = useState<DataVersion[]>([]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [targetVersionId, setTargetVersionId] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Record<string, unknown> | undefined>();
  const [sortKey, setSortKey] = useState<string>("updatedAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const activeVersion = useMemo(() => versions.find((item) => item.esActual), [versions]);

  useEffect(() => {
    let cancelled = false;

    void Promise.all([
      listFactors(resource, { page, pageSize: 20, q: query }),
      listHistory(resource),
      listVersions(),
    ]).then(([factors, historyRes, versionsRes]) => {
      if (cancelled) {
        return;
      }

      setItems(factors.items as Record<string, unknown>[]);
      setTotalPages(factors.pagination.totalPages);
      setHistory(historyRes.items);
      setVersions(versionsRes);

      const currentActive = versionsRes.find((item) => item.esActual);
      if (currentActive && !targetVersionId) {
        setTargetVersionId(currentActive.id);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [listFactors, listHistory, listVersions, page, query, resource, targetVersionId]);

  const loadData = useCallback(async () => {
    const [factors, historyRes, versionsRes] = await Promise.all([
      listFactors(resource, { page, pageSize: 20, q: query }),
      listHistory(resource),
      listVersions(),
    ]);

    setItems(factors.items as Record<string, unknown>[]);
    setTotalPages(factors.pagination.totalPages);
    setHistory(historyRes.items);
    setVersions(versionsRes);

    const currentActive = versionsRes.find((item) => item.esActual);
    if (currentActive && !targetVersionId) {
      setTargetVersionId(currentActive.id);
    }
  }, [listFactors, listHistory, listVersions, page, query, resource, targetVersionId]);

  const sortedItems = useMemo(() => {
    const copy = [...items];
    copy.sort((a, b) => {
      const left = a[sortKey];
      const right = b[sortKey];
      const leftText = String(left ?? "").toLowerCase();
      const rightText = String(right ?? "").toLowerCase();

      if (leftText < rightText) {
        return sortDirection === "asc" ? -1 : 1;
      }
      if (leftText > rightText) {
        return sortDirection === "asc" ? 1 : -1;
      }
      return 0;
    });
    return copy;
  }, [items, sortDirection, sortKey]);

  const columns = useMemo(() => {
    if (!items.length) {
      return ["id"];
    }

    return Object.keys(items[0]).filter((column) =>
      ["id", "codiMaterial", "nom", "tipusVehicle", "nomEquip", "factorEmissio", "fontDades", "actiu", "updatedAt"].includes(column),
    );
  }, [items]);

  const toggleSort = (column: string) => {
    if (sortKey === column) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(column);
    setSortDirection("asc");
  };

  const toggleSelection = (id: string) => {
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  const handleExportCsv = async () => {
    const csv = await exportCsv(resource, selectedIds);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `emissions-${resource}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-corporate-blue">Gestio de Factors d'Emissio</h1>
          <p className="text-sm text-slate-600">
            Versio activa: <span className="font-medium">{activeVersion?.numero ?? "-"}</span>
          </p>
        </div>
        <Button
          className="bg-corporate-green hover:bg-corporate-green/90"
          onClick={() => {
            setEditingItem(undefined);
            setFormOpen(true);
          }}
        >
          Nou factor
        </Button>
      </div>
      <div>
        <Link className="text-sm text-corporate-blue underline" to="/admin/emissions/validacio">
          Obrir validacio i qualitat de dades
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <Button
              key={tab.key}
              variant={resource === tab.key ? "default" : "outline"}
              className={resource === tab.key ? "bg-corporate-blue hover:bg-corporate-blue/90" : ""}
              onClick={() => {
                setResource(tab.key);
                setPage(1);
                setSelectedIds([]);
              }}
            >
              {tab.label}
            </Button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Filtres i accions massives</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[2fr_1fr_1fr_auto_auto]">
          <input
            className="h-10 rounded-md border px-3 text-sm"
            value={query}
            placeholder="Cercar per nom o codi"
            onChange={(event) => {
              setPage(1);
              setQuery(event.target.value);
            }}
          />
          <select
            className="h-10 rounded-md border px-3 text-sm"
            value={targetVersionId}
            onChange={(event) => setTargetVersionId(event.target.value)}
          >
            <option value="">Selecciona versio</option>
            {versions.map((version) => (
              <option key={version.id} value={version.id}>
                {version.numero}
              </option>
            ))}
          </select>
          <Button
            variant="outline"
            disabled={selectedIds.length === 0 || !targetVersionId}
            onClick={() => {
              if (!window.confirm("Aquesta accio modifica multipls factors i creara backup automatic. Continuar?")) {
                return;
              }

              void bulkUpdateVersion(resource, {
                ids: selectedIds,
                versioBaseDadesId: targetVersionId,
                confirm: true,
              }).then(async () => {
                setSelectedIds([]);
                await loadData();
              });
            }}
          >
            Actualitzar versio
          </Button>
          <Button variant="outline" disabled={selectedIds.length === 0} onClick={() => void handleExportCsv()}>
            Exportar CSV
          </Button>
          <div className="text-right text-sm text-slate-500">{loading ? "Carregant..." : `${items.length} registres`}</div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <ImportarEmissions
          loading={loading}
          onPreview={previewImport}
          onImport={importFactors}
          onImported={() => void loadData()}
        />
        <ExportarEmissions
          loading={loading}
          versions={versions}
          onExport={async (params) => await exportFactors(params)}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Taula editable</CardTitle>
        </CardHeader>
        <CardContent>
          {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b">
                  <th className="p-2">Sel</th>
                  {columns.map((column) => (
                    <th
                      key={column}
                      className="cursor-pointer p-2"
                      onClick={() => toggleSort(column)}
                    >
                      {column}
                    </th>
                  ))}
                  <th className="p-2">Accions</th>
                </tr>
              </thead>
              <tbody>
                {sortedItems.map((item) => {
                  const id = String(item["id"] ?? "");
                  return (
                    <tr key={id} className="border-b">
                      <td className="p-2">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(id)}
                          onChange={() => toggleSelection(id)}
                        />
                      </td>
                      {columns.map((column) => (
                        <td key={`${id}-${column}`} className="p-2">
                          {String(item[column] ?? "")}
                        </td>
                      ))}
                      <td className="p-2">
                        <div className="flex gap-2">
                          <button
                            className="text-corporate-blue hover:underline"
                            onClick={() => {
                              setEditingItem(item);
                              setFormOpen(true);
                            }}
                            type="button"
                          >
                            Editar
                          </button>
                          <button
                            className="text-red-600 hover:underline"
                            onClick={() => {
                              if (!window.confirm("Confirmes eliminacio logica del factor?")) {
                                return;
                              }
                              void deleteFactor(resource, id).then(loadData);
                            }}
                            type="button"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <Button variant="outline" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>
              Anterior
            </Button>
            <span className="text-sm text-slate-600">
              Pagina {page} de {totalPages}
            </span>
            <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)}>
              Seguent
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historial de canvis</CardTitle>
        </CardHeader>
        <CardContent>
          <HistorialCanvis
            items={history}
            onRevert={async (logId) => {
              if (!window.confirm("Vols revertir aquest backup?")) {
                return;
              }
              await revertHistory(logId);
              await loadData();
            }}
          />
        </CardContent>
      </Card>

      <FactorEmissioForm
        open={formOpen}
        resource={resource}
        {...(editingItem ? { initialValue: editingItem } : {})}
        onClose={() => setFormOpen(false)}
        onSubmit={async (payload) => {
          if (editingItem?.["id"]) {
            await updateFactor(resource, String(editingItem["id"]), payload);
          } else {
            await createFactor(resource, payload);
          }
          await loadData();
        }}
      />
    </main>
  );
}
