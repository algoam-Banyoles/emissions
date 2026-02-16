import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { type EmissionsResource } from "@/types/emissions-admin";

const baseSchema = z.object({
  nom: z.string().min(2, "Nom obligatori"),
  factorEmissio: z.number().optional(),
  fontDades: z.string().min(3, "Font obligatoria"),
  anyReferencia: z.number().int().min(1900).max(new Date().getFullYear() + 1),
});

const resourceFields: Record<EmissionsResource, string[]> = {
  materials: ["codiMaterial", "nom", "categoria", "factorEmissio", "unitat", "fontDades", "anyReferencia"],
  transport: ["tipusVehicle", "capacitatTonelades", "factorEmissio", "combustible", "fontDades", "anyReferencia"],
  combustibles: ["nomCombustible", "poderCalorificInferior", "unitatPoderCalorific", "factorEmissio", "unitatFactorEmissio", "fontDades", "anyReferencia"],
  electric: ["tipusConsum", "consumKwhPerTona", "factorEmissioRed", "factorEmissioGrupo", "fontDades", "anyReferencia"],
  equips: ["nomEquip", "tipus", "factorEmissio", "rendimentHoresPerTona", "fontDades", "anyReferencia"],
  limits: ["tipologiaMescla", "etapa", "valorLimit", "fontNormativa", "dataEntradaVigor"],
  constants: ["nomMaterial", "calorEspecific", "temperaturaReferencia", "fontDades", "anyReferencia"],
};

interface FactorEmissioFormProps {
  open: boolean;
  resource: EmissionsResource;
  initialValue?: Record<string, unknown>;
  onClose: () => void;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
}

export function FactorEmissioForm({
  open,
  resource,
  initialValue,
  onClose,
  onSubmit,
}: FactorEmissioFormProps) {
  const schema = useMemo(() => baseSchema.partial(), []);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<Record<string, unknown>>({
    resolver: zodResolver(schema),
    defaultValues: initialValue ?? {},
  });
  const [preview, setPreview] = useState<Record<string, unknown>>(initialValue ?? {});

  if (!open) {
    return null;
  }

  const fields = resourceFields[resource];

  const renderField = (field: string) => {
    if (field.includes("factor") || field.includes("valor") || field.includes("consum") || field.includes("capacitat") || field.includes("any") || field.includes("temperatura") || field.includes("poder") || field.includes("rendiment") || field.includes("calor")) {
      return (
        <input
          className="h-10 w-full rounded-md border px-3 text-sm"
          type="number"
          step="any"
          {...register(field, { setValueAs: (value) => (value === "" ? undefined : Number(value)) })}
        />
      );
    }

    if (field.includes("data")) {
      return <input className="h-10 w-full rounded-md border px-3 text-sm" type="date" {...register(field)} />;
    }

    return <input className="h-10 w-full rounded-md border px-3 text-sm" {...register(field)} />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-4xl rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-corporate-blue">Factor d'emissio ({resource})</h3>
          <Button variant="ghost" onClick={onClose}>
            Tancar
          </Button>
        </div>

        <form
          className="grid gap-4 md:grid-cols-2"
          onChange={() => setPreview(getValues())}
          onSubmit={handleSubmit(async (values) => {
            await onSubmit(values);
            onClose();
          })}
        >
          {fields.map((field) => (
            <label key={field} className="text-sm">
              <span className="mb-1 block text-slate-600">
                {field}
              </span>
              {renderField(field)}
              <p className="mt-1 text-xs text-slate-500">
                {field === "fontDades" ? "Font oficial obligatoria" : "Valor del camp"}
              </p>
              {errors[field] && <p className="text-xs text-red-600">{String(errors[field]?.message ?? "Valor invalid")}</p>}
            </label>
          ))}

          <div className="md:col-span-2 rounded-md border bg-slate-50 p-3">
            <p className="mb-1 text-sm font-medium">Preview del factor</p>
            <pre className="max-h-40 overflow-auto text-xs text-slate-700">{JSON.stringify(preview, null, 2)}</pre>
          </div>

          <div className="md:col-span-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel·lar
            </Button>
            <Button type="submit" className="bg-corporate-green hover:bg-corporate-green/90" disabled={isSubmitting}>
              {isSubmitting ? "Guardant..." : "Guardar"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
