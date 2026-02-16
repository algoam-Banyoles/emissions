import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { type EmissionsImportCategory, type EmissionsImportPreviewResponse } from "@/types/emissions-admin";

interface ImportarEmissionsProps {
  loading: boolean;
  onPreview: (categoria: EmissionsImportCategory, file: File, delimiter?: ";" | ",") => Promise<EmissionsImportPreviewResponse>;
  onImport: (params: {
    categoria: EmissionsImportCategory;
    file: File;
    delimiter?: ";" | ",";
    numeroVersio?: string;
    descripcio?: string;
  }) => Promise<EmissionsImportPreviewResponse>;
  onImported?: () => void;
}

const templates: { key: EmissionsImportCategory; label: string; expectedColumns: string[] }[] = [
  {
    key: "materials",
    label: "Materials (A1)",
    expectedColumns: ["codi_material", "nom", "categoria", "factor_emissio", "unitat", "font_dades", "any_referencia"],
  },
  {
    key: "transport",
    label: "Transport (A2/A4)",
    expectedColumns: ["tipus_vehicle", "capacitat_tonelades", "factor_emissio", "unitat", "font_dades", "any_referencia", "combustible"],
  },
  {
    key: "combustibles",
    label: "Combustibles (A3)",
    expectedColumns: ["nom_combustible", "poder_calorific_inferior", "unitat_poder_calorific", "factor_emissio", "unitat_factor_emissio", "font_dades", "any_referencia"],
  },
  {
    key: "equips",
    label: "Equips (A5)",
    expectedColumns: ["nom_equip", "tipus", "factor_emissio", "rendiment_hores_per_tona", "unitat", "font_dades"],
  },
];

export function ImportarEmissions({ loading, onPreview, onImport, onImported }: ImportarEmissionsProps) {
  const [categoria, setCategoria] = useState<EmissionsImportCategory>("materials");
  const [delimiter, setDelimiter] = useState<";" | ",">(";");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<EmissionsImportPreviewResponse | null>(null);
  const [numeroVersio, setNumeroVersio] = useState("");
  const [descripcio, setDescripcio] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const currentTemplate = useMemo(() => templates.find((item) => item.key === categoria), [categoria]);

  const handlePreview = async () => {
    if (!file) {
      return;
    }

    const result = await onPreview(
      categoria,
      file,
      file.name.toLowerCase().endsWith(".csv") ? delimiter : undefined,
    );
    setPreview(result);
  };

  const handleImport = async () => {
    if (!file || !preview || preview.errors.length > 0 || preview.validRows === 0) {
      return;
    }

    setSubmitting(true);
    try {
      await onImport({
        categoria,
        file,
        ...(file.name.toLowerCase().endsWith(".csv") ? { delimiter } : {}),
        ...(numeroVersio.trim() ? { numeroVersio: numeroVersio.trim() } : {}),
        ...(descripcio.trim() ? { descripcio: descripcio.trim() } : {}),
      });
      setPreview(null);
      setFile(null);
      setNumeroVersio("");
      setDescripcio("");
      onImported?.();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="text-base font-semibold text-corporate-blue">Importar Emissions</h3>

      <div className="grid gap-3 md:grid-cols-3">
        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Plantilla</span>
          <select
            value={categoria}
            className="h-10 w-full rounded-md border px-3"
            onChange={(event) => setCategoria(event.target.value as EmissionsImportCategory)}
          >
            {templates.map((item) => (
              <option key={item.key} value={item.key}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Fitxer CSV/XLSX</span>
          <input
            type="file"
            className="h-10 w-full rounded-md border px-3 py-2"
            accept=".csv,.xlsx,.xls"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Separador CSV</span>
          <select
            value={delimiter}
            className="h-10 w-full rounded-md border px-3"
            onChange={(event) => setDelimiter(event.target.value as ";" | ",")}
          >
            <option value=";">Punt i coma (;)</option>
            <option value=",">Coma (,)</option>
          </select>
        </label>
      </div>

      <div className="text-xs text-slate-500">
        Camps esperats: {currentTemplate?.expectedColumns.join(", ")}
      </div>

      <div className="text-xs text-slate-500">
        Plantilles:
        {" "}
        <a className="underline" href={`/templates/emissions/${categoria}-template.csv`} target="_blank" rel="noreferrer">
          CSV
        </a>
        {" | "}
        <a className="underline" href={`/templates/emissions/${categoria}-template.xlsx`} target="_blank" rel="noreferrer">
          XLSX
        </a>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Numero de versio (opcional)</span>
          <input
            value={numeroVersio}
            onChange={(event) => setNumeroVersio(event.target.value)}
            className="h-10 w-full rounded-md border px-3"
            placeholder="2026.03"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Descripcio (opcional)</span>
          <input
            value={descripcio}
            onChange={(event) => setDescripcio(event.target.value)}
            className="h-10 w-full rounded-md border px-3"
            placeholder="Importacio factors emissions"
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" disabled={!file || loading} onClick={() => void handlePreview()}>
          Preview
        </Button>
        <Button
          className="bg-corporate-green hover:bg-corporate-green/90"
          disabled={!preview || preview.errors.length > 0 || preview.validRows === 0 || submitting || loading}
          onClick={() => void handleImport()}
        >
          {submitting ? "Important..." : "Importar definitivament"}
        </Button>
      </div>

      {preview && (
        <div className="space-y-2 rounded-md border border-slate-200 p-3 text-sm">
          <p>
            Files totals: <strong>{preview.totalRows}</strong> | Valides: <strong>{preview.validRows}</strong> | Errors: <strong>{preview.errors.length}</strong> | Warnings: <strong>{preview.warnings.length}</strong>
          </p>

          <div className="h-2 w-full overflow-hidden rounded bg-slate-200">
            <div
              className="h-full bg-corporate-green"
              style={{ width: `${preview.totalRows > 0 ? Math.round((preview.validRows / preview.totalRows) * 100) : 0}%` }}
            />
          </div>

          {preview.errors.length > 0 && (
            <div className="rounded border border-red-200 bg-red-50 p-2 text-red-700">
              {preview.errors.slice(0, 10).map((issue, index) => (
                <p key={`${issue.row}-${issue.field}-${index}`}>
                  Fila {issue.row}{issue.field ? ` (${issue.field})` : ""}: {issue.message}
                </p>
              ))}
            </div>
          )}

          {preview.previewRows.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b">
                    {Object.keys(preview.previewRows[0]).map((key) => (
                      <th key={key} className="p-1">
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.previewRows.map((row, index) => (
                    <tr key={`preview-${index}`} className="border-b">
                      {Object.keys(preview.previewRows[0]).map((key) => (
                        <td key={`${index}-${key}`} className="p-1">
                          {String(row[key] ?? "")}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
