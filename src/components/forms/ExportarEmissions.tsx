import { useState } from "react";

import { Button } from "@/components/ui/button";
import { type EmissionsExportRequest, type EmissionsResource } from "@/types/emissions-admin";
import { type DataVersion } from "@/types/material";

interface ExportarEmissionsProps {
  versions: DataVersion[];
  loading: boolean;
  onExport: (params: EmissionsExportRequest) => Promise<{ data: ArrayBuffer; fileName: string }>;
}

const categories: { key: EmissionsResource; label: string }[] = [
  { key: "materials", label: "Materials" },
  { key: "transport", label: "Transport" },
  { key: "combustibles", label: "Combustibles" },
  { key: "electric", label: "Electric" },
  { key: "equips", label: "Equips" },
  { key: "limits", label: "Limits" },
  { key: "constants", label: "Constants" },
];

export function ExportarEmissions({ versions, loading, onExport }: ExportarEmissionsProps) {
  const [categoria, setCategoria] = useState<EmissionsResource>("materials");
  const [versio, setVersio] = useState<string>("");
  const [format, setFormat] = useState<"csv" | "xlsx">("csv");

  return (
    <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="text-base font-semibold text-corporate-blue">Exportar Emissions</h3>

      <div className="grid gap-3 md:grid-cols-4">
        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Categoria</span>
          <select
            value={categoria}
            className="h-10 w-full rounded-md border px-3"
            onChange={(event) => setCategoria(event.target.value as EmissionsResource)}
          >
            {categories.map((item) => (
              <option key={item.key} value={item.key}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Versio</span>
          <select
            value={versio}
            className="h-10 w-full rounded-md border px-3"
            onChange={(event) => setVersio(event.target.value)}
          >
            <option value="">Activa</option>
            {versions.map((version) => (
              <option key={version.id} value={version.id}>
                {version.numero} {version.esActual ? "(activa)" : ""}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Format</span>
          <select
            value={format}
            className="h-10 w-full rounded-md border px-3"
            onChange={(event) => setFormat(event.target.value as "csv" | "xlsx")}
          >
            <option value="csv">CSV</option>
            <option value="xlsx">XLSX</option>
          </select>
        </label>

        <div className="flex items-end">
          <Button
            className="w-full"
            variant="outline"
            disabled={loading}
            onClick={() => {
              void onExport({
                categoria,
                format,
                ...(versio ? { versio } : {}),
              }).then(({ data, fileName }) => {
                const blob = new Blob([data], {
                  type:
                    format === "xlsx"
                      ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                      : "text/csv;charset=utf-8",
                });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = fileName;
                link.click();
                URL.revokeObjectURL(url);
              });
            }}
          >
            Descarregar
          </Button>
        </div>
      </div>
    </div>
  );
}
