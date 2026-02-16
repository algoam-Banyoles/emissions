import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminMaterials } from "@/hooks/useAdminMaterials";
import { type Material, type MaterialPayload, type MaterialType } from "@/types/material";

const materialTypes: MaterialType[] = ["MESCLA_BITUMINOSA", "MACADAM", "ESTABILITZAT", "GRAVA", "ALTRE"];

const emptyMaterial: MaterialPayload = {
  codi: "",
  nom: "",
  tipus: "ALTRE",
  preuBaseEurT: null,
  factorEmissioA1: null,
};

export default function MaterialsAdmin() {
  const { listMaterials, createMaterial, updateMaterial, deleteMaterial, loading, error } = useAdminMaterials();
  const [items, setItems] = useState<Material[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [nomFilter, setNomFilter] = useState("");
  const [tipusFilter, setTipusFilter] = useState<MaterialType | "">("");
  const [selected, setSelected] = useState<Material | null>(null);
  const [createDraft, setCreateDraft] = useState<MaterialPayload>(emptyMaterial);

  const filters = useMemo(
    () => ({
      page,
      pageSize: 15,
      ...(nomFilter ? { nom: nomFilter } : {}),
      ...(tipusFilter ? { tipus: tipusFilter } : {}),
    }),
    [page, nomFilter, tipusFilter],
  );

  const refresh = useCallback(async () => {
    const response = await listMaterials(filters);
    setItems(response.items);
    setTotalPages(response.pagination.totalPages);
  }, [filters, listMaterials]);

  useEffect(() => {
    let cancelled = false;

    void listMaterials(filters).then((response) => {
      if (cancelled) {
        return;
      }

      setItems(response.items);
      setTotalPages(response.pagination.totalPages);
    });

    return () => {
      cancelled = true;
    };
  }, [filters, listMaterials]);

  return (
    <main className="space-y-6 p-6">
      <h1 className="text-2xl font-semibold text-corporate-blue">Administracio de materials</h1>

      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <input
            className="h-10 rounded-md border px-3 text-sm"
            value={nomFilter}
            placeholder="Cerca per nom"
            onChange={(event) => {
              setPage(1);
              setNomFilter(event.target.value);
            }}
          />
          <select
            className="h-10 rounded-md border px-3 text-sm"
            value={tipusFilter}
            onChange={(event) => {
              setPage(1);
              setTipusFilter(event.target.value as MaterialType | "");
            }}
          >
            <option value="">Tots els tipus</option>
            {materialTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <div className="text-right text-sm text-slate-500">{loading ? "Carregant..." : `${items.length} registres`}</div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Taula editable</CardTitle>
          </CardHeader>
          <CardContent>
            {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="p-2">Codi</th>
                    <th className="p-2">Nom</th>
                    <th className="p-2">Tipus</th>
                    <th className="p-2">Preu €/t</th>
                    <th className="p-2">Actiu</th>
                    <th className="p-2">Accions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((material) => (
                    <tr key={material.id} className="border-b">
                      <td className="p-2">{material.codi}</td>
                      <td className="p-2">
                        <input
                          className="h-8 w-full rounded border px-2"
                          defaultValue={material.nom}
                          onBlur={(event) => {
                            if (event.target.value !== material.nom) {
                              void updateMaterial(material.id, { nom: event.target.value }).then(refresh);
                            }
                          }}
                        />
                      </td>
                      <td className="p-2">{material.tipus}</td>
                      <td className="p-2">
                        <input
                          className="h-8 w-28 rounded border px-2"
                          defaultValue={material.preuBaseEurT ?? ""}
                          type="number"
                          step="0.01"
                          onBlur={(event) => {
                            const next = event.target.value === "" ? null : Number(event.target.value);
                            if (next !== material.preuBaseEurT) {
                              void updateMaterial(material.id, { preuBaseEurT: next }).then(refresh);
                            }
                          }}
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="checkbox"
                          checked={material.actiu}
                          onChange={(event) => {
                            void updateMaterial(material.id, { actiu: event.target.checked }).then(refresh);
                          }}
                        />
                      </td>
                      <td className="p-2">
                        <div className="flex gap-2">
                          <button
                            className="text-corporate-blue hover:underline"
                            onClick={() => setSelected(material)}
                            type="button"
                          >
                            Propietats
                          </button>
                          <button
                            className="text-red-600 hover:underline"
                            onClick={() => {
                              void deleteMaterial(material.id).then(refresh);
                            }}
                            type="button"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
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
              <Button
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage((current) => current + 1)}
              >
                Seguent
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Editor de propietats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {selected ? (
              <>
                <label className="text-sm">
                  <span className="mb-1 block text-slate-600">Factor emissio A1</span>
                  <input
                    className="h-10 w-full rounded-md border px-3"
                    defaultValue={selected.factorEmissioA1 ?? ""}
                    type="number"
                    step="0.0001"
                    onBlur={(event) => {
                      const value = event.target.value === "" ? null : Number(event.target.value);
                      void updateMaterial(selected.id, { factorEmissioA1: value }).then(refresh);
                    }}
                  />
                </label>
                <label className="text-sm">
                  <span className="mb-1 block text-slate-600">Font factor emissio</span>
                  <input
                    className="h-10 w-full rounded-md border px-3"
                    defaultValue={selected.fontFactorEmissio ?? ""}
                    onBlur={(event) => {
                      const value = event.target.value || null;
                      void updateMaterial(selected.id, { fontFactorEmissio: value }).then(refresh);
                    }}
                  />
                </label>
                <label className="text-sm">
                  <span className="mb-1 block text-slate-600">Module elastic (MPa)</span>
                  <input
                    className="h-10 w-full rounded-md border px-3"
                    defaultValue={selected.modulElasticMpa ?? ""}
                    type="number"
                    onBlur={(event) => {
                      const value = event.target.value === "" ? null : Number(event.target.value);
                      void updateMaterial(selected.id, { modulElasticMpa: value }).then(refresh);
                    }}
                  />
                </label>
                <label className="text-sm">
                  <span className="mb-1 block text-slate-600">Descripcio</span>
                  <textarea
                    className="min-h-20 w-full rounded-md border px-3 py-2"
                    defaultValue={selected.descripcio ?? ""}
                    onBlur={(event) => {
                      const value = event.target.value || null;
                      void updateMaterial(selected.id, { descripcio: value }).then(refresh);
                    }}
                  />
                </label>
              </>
            ) : (
              <p className="text-sm text-slate-500">Selecciona un material per editar propietats.</p>
            )}

            <hr className="my-2" />

            <p className="text-sm font-medium text-slate-700">Crear material nou</p>
            <input
              className="h-10 w-full rounded-md border px-3 text-sm"
              placeholder="Codi"
              value={createDraft.codi}
              onChange={(event) => setCreateDraft((current) => ({ ...current, codi: event.target.value }))}
            />
            <input
              className="h-10 w-full rounded-md border px-3 text-sm"
              placeholder="Nom"
              value={createDraft.nom}
              onChange={(event) => setCreateDraft((current) => ({ ...current, nom: event.target.value }))}
            />
            <select
              className="h-10 w-full rounded-md border px-3 text-sm"
              value={createDraft.tipus}
              onChange={(event) =>
                setCreateDraft((current) => ({ ...current, tipus: event.target.value as MaterialType }))
              }
            >
              {materialTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <input
              className="h-10 w-full rounded-md border px-3 text-sm"
              placeholder="Preu base €/t"
              type="number"
              value={createDraft.preuBaseEurT ?? ""}
              onChange={(event) =>
                setCreateDraft((current) => ({
                  ...current,
                  preuBaseEurT: event.target.value === "" ? null : Number(event.target.value),
                }))
              }
            />
            <Button
              className="w-full bg-corporate-green hover:bg-corporate-green/90"
              onClick={() => {
                void createMaterial(createDraft).then(async () => {
                  setCreateDraft(emptyMaterial);
                  await refresh();
                });
              }}
            >
              Crear material
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
