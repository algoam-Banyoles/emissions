import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { useProjects } from "@/hooks/useProjects";
import { type EstructuraViable } from "@/types/project";

interface ExportadorBIMProps {
  projectId: string;
}

export function ExportadorBIM({ projectId }: ExportadorBIMProps) {
  const { t } = useTranslation();
  const { llistarEstructures, exportarBimIfc, loading, error } = useProjects();
  const [estructures, setEstructures] = useState<EstructuraViable[]>([]);
  const [selectedId, setSelectedId] = useState("");

  useEffect(() => {
    void llistarEstructures(projectId, { page: 1, pageSize: 100, incloureEmissions: true }).then((response) => {
      if (response.mode !== "sync") {
        return;
      }

      setEstructures(response.items);
      if (response.items[0]) {
        setSelectedId(response.items[0].id);
      }
    });
  }, [llistarEstructures, projectId]);

  const selected = useMemo(
    () => estructures.find((item) => item.id === selectedId) ?? null,
    [estructures, selectedId],
  );

  return (
    <div className="space-y-4 rounded-md border p-4">
      <h3 className="text-base font-semibold text-corporate-blue">{t("bim.title")}</h3>

      <label className="text-sm">
        <span className="mb-1 block text-slate-600">{t("bim.structureToExport")}</span>
        <select className="h-10 w-full rounded-md border px-3" value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>
          {estructures.map((item) => (
            <option key={item.id} value={item.id}>
              {item.id.slice(0, 8)} · Gruix {item.gruixTotalCm.toFixed(1)} cm
            </option>
          ))}
        </select>
      </label>

      <Button
        disabled={!selected || loading}
        onClick={() => {
          if (!selected) {
            return;
          }

          void exportarBimIfc(projectId, selected, `projecte-${projectId}-estructura-${selected.id.slice(0, 8)}.ifc`);
        }}
      >
        {t("bim.downloadIfc")}
      </Button>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="rounded-md border bg-slate-50 p-3 text-xs text-slate-700">
        <p className="font-medium">{t("bim.compatibility")}</p>
        <p>{t("bim.revit")}</p>
        <p>{t("bim.archicad")}</p>
        <p>{t("bim.tekla")}</p>
        <p>{t("bim.freecad")}</p>
      </div>
    </div>
  );
}
