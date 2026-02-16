import { Button } from "@/components/ui/button";
import { type EmissionsHistoryItem } from "@/types/emissions-admin";

interface HistorialCanvisProps {
  items: EmissionsHistoryItem[];
  onRevert: (logId: string) => Promise<void>;
}

export function HistorialCanvis({ items, onRevert }: HistorialCanvisProps) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="rounded-md border p-3">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-corporate-blue">
                {item.tipusCanvi} · {item.entitat}
              </p>
              <p className="text-xs text-slate-500">
                {new Date(item.createdAt).toLocaleString()} · {item.usuari?.email ?? "sistema"}
              </p>
            </div>
            {item.entitat.startsWith("backup_") && (
              <Button
                variant="outline"
                onClick={() => {
                  void onRevert(item.id);
                }}
              >
                Revertir
              </Button>
            )}
          </div>

          <div className="grid gap-2 md:grid-cols-2">
            <div>
              <p className="text-xs font-medium text-slate-600">Abans</p>
              <pre className="max-h-32 overflow-auto rounded bg-slate-50 p-2 text-xs">
                {JSON.stringify(item.valorsAnteriors, null, 2)}
              </pre>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-600">Despres</p>
              <pre className="max-h-32 overflow-auto rounded bg-slate-50 p-2 text-xs">
                {JSON.stringify(item.valorsNous, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      ))}

      {!items.length && <p className="text-sm text-slate-500">No hi ha canvis registrats.</p>}
    </div>
  );
}
