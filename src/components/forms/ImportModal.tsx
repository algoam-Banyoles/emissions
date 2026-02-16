import { useMemo, useState } from "react";
import * as XLSX from "xlsx";

import { Button } from "@/components/ui/button";
import { type ImportPricesPayload } from "@/types/material";

interface ImportPreviewRow {
  codi: string;
  nom: string;
  tipus: string;
  preu: string;
}

interface ImportModalProps {
  open: boolean;
  onClose: () => void;
  onImport: (payload: ImportPricesPayload) => Promise<void>;
}

function parsePreview(content: string) {
  const lines = content
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return { rows: [], error: "El fitxer no te prou files" };
  }

  const delimiter = (lines[0] ?? "").includes(";") ? ";" : ",";
  const headers = (lines[0] ?? "")
    .split(delimiter)
    .map((value) => value.trim().toUpperCase());

  const codiIndex = headers.findIndex((header) => header === "CODI" || header === "CODIGO");
  const nomIndex = headers.findIndex((header) => header === "NOM" || header === "NOMBRE");
  const tipusIndex = headers.findIndex((header) => header === "TIPUS" || header === "TIPO");
  const preuIndex = headers.findIndex((header) => header === "PREU" || header === "PRECIO");

  if (codiIndex < 0 || nomIndex < 0 || tipusIndex < 0) {
    return { rows: [], error: "Calen columnes CODI, NOM i TIPUS" };
  }

  const rows: ImportPreviewRow[] = lines.slice(1, 6).map((line) => {
    const cols = line.split(delimiter);
    return {
      codi: cols[codiIndex]?.trim() ?? "",
      nom: cols[nomIndex]?.trim() ?? "",
      tipus: cols[tipusIndex]?.trim() ?? "",
      preu: preuIndex >= 0 ? (cols[preuIndex]?.trim() ?? "") : "",
    };
  });

  return { rows, error: null };
}

export function ImportModal({ open, onClose, onImport }: ImportModalProps) {
  const [fileName, setFileName] = useState<string>("");
  const [csvContent, setCsvContent] = useState<string>("");
  const [numeroVersio, setNumeroVersio] = useState("");
  const [descripcio, setDescripcio] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const preview = useMemo(() => parsePreview(csvContent), [csvContent]);

  if (!open) {
    return null;
  }

  const handleFile = async (file: File) => {
    setFileName(file.name);

    let text = "";
    const lowerName = file.name.toLowerCase();

    if (lowerName.endsWith(".xlsx") || lowerName.endsWith(".xls")) {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const firstSheet = workbook.SheetNames[0];

      if (!firstSheet) {
        setCsvContent("");
        return;
      }

      text = XLSX.utils.sheet_to_csv(workbook.Sheets[firstSheet], { FS: ";" });
    } else {
      text = await file.text();
    }

    setCsvContent(text);

    if (!numeroVersio) {
      const today = new Date();
      const month = String(today.getMonth() + 1).padStart(2, "0");
      setNumeroVersio(`${today.getFullYear()}.${month}`);
    }
  };

  const canImport =
    numeroVersio.trim().length > 0 && csvContent.trim().length > 0 && preview.error === null && !submitting;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-4xl rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-corporate-blue">Importar preus (CSV)</h3>
          <Button variant="ghost" onClick={onClose}>
            Tancar
          </Button>
        </div>

        <div
          className="rounded-lg border-2 border-dashed border-slate-300 p-6 text-center"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            const dropped = event.dataTransfer.files?.[0];
            if (dropped) {
              void handleFile(dropped);
            }
          }}
        >
          <p className="text-sm text-slate-600">Arrossega un CSV o selecciona fitxer</p>
          <input
            className="mx-auto mt-3 block"
            type="file"
            accept=".csv,.txt,.xlsx,.xls"
            onChange={(event) => {
              const selected = event.target.files?.[0];
              if (selected) {
                void handleFile(selected);
              }
            }}
          />
          {fileName && <p className="mt-2 text-xs text-slate-500">Fitxer: {fileName}</p>}
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="text-sm">
            <span className="mb-1 block text-slate-600">Numero de versio</span>
            <input
              className="h-10 w-full rounded-md border px-3"
              value={numeroVersio}
              onChange={(event) => setNumeroVersio(event.target.value)}
              placeholder="2026.01"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-slate-600">Descripcio</span>
            <input
              className="h-10 w-full rounded-md border px-3"
              value={descripcio}
              onChange={(event) => setDescripcio(event.target.value)}
              placeholder="Actualitzacio trimestral"
            />
          </label>
        </div>

        <div className="mt-4 rounded-md border p-3">
          <p className="mb-2 text-sm font-medium text-slate-700">Preview</p>
          {preview.error ? (
            <p className="text-sm text-red-600">{preview.error}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="p-2">Codi</th>
                    <th className="p-2">Nom</th>
                    <th className="p-2">Tipus</th>
                    <th className="p-2">Preu</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.map((row, index) => (
                    <tr key={`${row.codi}-${index}`} className="border-b">
                      <td className="p-2">{row.codi}</td>
                      <td className="p-2">{row.nom}</td>
                      <td className="p-2">{row.tipus}</td>
                      <td className="p-2">{row.preu}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel·lar
          </Button>
          <Button
            disabled={!canImport}
            className="bg-corporate-green hover:bg-corporate-green/90"
            onClick={() => {
              if (!canImport) {
                return;
              }

              setSubmitting(true);
              const payload: ImportPricesPayload = {
                csvContent,
                fileName: fileName.toLowerCase().endsWith(".csv")
                  ? fileName
                  : fileName.replace(/\.[^/.]+$/, ".csv"),
                numeroVersio,
                delimiter: csvContent.includes(";") ? ";" : ",",
              };

              if (descripcio) {
                payload.descripcio = descripcio;
              }

              void onImport({
                ...payload,
              }).finally(() => {
                setSubmitting(false);
                onClose();
              });
            }}
          >
            {submitting ? "Important..." : "Importar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
