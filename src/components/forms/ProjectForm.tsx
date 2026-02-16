import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { ModalUbicacions } from "@/components/ubicacions/ModalUbicacions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type Project, type ProjectStatus } from "@/types/project";
import { calcularCategoriaTransit, type CategoriaTransit } from "@/utils/calculsTransit";

interface FormValues {
  codi: string;
  nom: string;
  descripcio?: string | undefined;
  estat: "ESBORRANY" | "ACTIU" | "COMPLETAT" | "ARXIUAT";
  imd?: number | undefined;
  percentatgeVp?: number | undefined;
  categoriaTransitManual?: CategoriaTransit | undefined;
  usaCategoriaManual: boolean;
  tipusTracat?: string | undefined;
  zonaClimatica?: string | undefined;
  vidaUtil?: number | undefined;
  creixementAnual?: number | undefined;
  latitud?: number | undefined;
  longitud?: number | undefined;
}

interface ProjectFormProps {
  open: boolean;
  title: string;
  initialValue?: Project;
  onClose: () => void;
  onSubmit: (values: FormValues) => Promise<void>;
}

function normalizeFormValues(values: FormValues): FormValues {
  const normalized: FormValues = {
    codi: values.codi,
    nom: values.nom,
    estat: values.estat,
    usaCategoriaManual: values.usaCategoriaManual,
  };

  if (values.descripcio) normalized.descripcio = values.descripcio;
  if (values.tipusTracat) normalized.tipusTracat = values.tipusTracat;
  if (values.zonaClimatica) normalized.zonaClimatica = values.zonaClimatica;
  if (values.imd !== undefined) normalized.imd = values.imd;
  if (values.percentatgeVp !== undefined) normalized.percentatgeVp = values.percentatgeVp;
  normalized.usaCategoriaManual = values.usaCategoriaManual;
  if (values.categoriaTransitManual) normalized.categoriaTransitManual = values.categoriaTransitManual;
  if (values.vidaUtil !== undefined) normalized.vidaUtil = values.vidaUtil;
  if (values.creixementAnual !== undefined) normalized.creixementAnual = values.creixementAnual;
  if (values.latitud !== undefined) normalized.latitud = values.latitud;
  if (values.longitud !== undefined) normalized.longitud = values.longitud;

  return normalized;
}

export function ProjectForm({ open, title, initialValue, onClose, onSubmit }: ProjectFormProps) {
  const { t } = useTranslation();
  const [ubicacionsModalOpen, setUbicacionsModalOpen] = useState(false);
  const [ubicacionsSeleccionades, setUbicacionsSeleccionades] = useState<string[]>([]);
  const projectSchema = useMemo(
    () =>
      z.object({
        codi: z.string().min(2, t("projectForm.validation.codeRequired")),
        nom: z.string().min(2, t("projectForm.validation.nameRequired")),
        descripcio: z.string().optional(),
        estat: z.enum(["ESBORRANY", "ACTIU", "COMPLETAT", "ARXIUAT"]),
        imd: z.number().int().positive().optional(),
        percentatgeVp: z.number().min(0).max(100).optional(),
        categoriaTransitManual: z.enum(["TT1", "TT2", "TT3", "TT4", "TT5"]).optional(),
        usaCategoriaManual: z.boolean().default(false),
        tipusTracat: z.string().optional(),
        zonaClimatica: z.string().optional(),
        vidaUtil: z.number().int().positive().optional(),
        creixementAnual: z.number().min(0).max(100).optional(),
        latitud: z.number().min(-90).max(90).optional(),
        longitud: z.number().min(-180).max(180).optional(),
      }),
    [t],
  );

  const numberRegisterOptions = {
    setValueAs: (value: string) => (value === "" ? undefined : Number(value)),
  };

  const defaultValues = useMemo<FormValues>(
    () => ({
      codi: initialValue?.codi ?? "",
      nom: initialValue?.nom ?? "",
      descripcio: initialValue?.descripcio ?? "",
      estat: initialValue?.estat ?? "ESBORRANY",
      imd: initialValue?.imd ?? undefined,
      percentatgeVp: initialValue?.percentatgeVp ?? undefined,
      categoriaTransitManual: initialValue?.categoriaTransitManual ?? undefined,
      usaCategoriaManual: initialValue?.usaCategoriaManual ?? false,
      tipusTracat: initialValue?.tipusTracat ?? "",
      zonaClimatica: initialValue?.zonaClimatica ?? "",
      vidaUtil: initialValue?.vidaUtil ?? undefined,
      creixementAnual: initialValue?.creixementAnual ?? undefined,
      latitud: initialValue?.latitud ?? undefined,
      longitud: initialValue?.longitud ?? undefined,
    }),
    [initialValue],
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    control,
    getValues,
    setValue,
  } = useForm<FormValues>({
    resolver: zodResolver(projectSchema) as never,
    values: defaultValues,
  });

  const imd = useWatch({ control, name: "imd" });
  const percentatgeVp = useWatch({ control, name: "percentatgeVp" });
  const usaCategoriaManual = useWatch({ control, name: "usaCategoriaManual" });
  const latitud = useWatch({ control, name: "latitud" });
  const longitud = useWatch({ control, name: "longitud" });

  const categoriaTransitAuto = useMemo(() => {
    if (imd === undefined || percentatgeVp === undefined) {
      return "-";
    }
    return calcularCategoriaTransit(imd, percentatgeVp);
  }, [imd, percentatgeVp]);

  const submitWithStatus = async (status: ProjectStatus) => {
    setValue("estat", status);
    await handleSubmit(async (values) => {
      await onSubmit(normalizeFormValues(values));
      onClose();
    })();
  };

  if (!open) {
    return null;
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
        <div className="w-full max-w-3xl rounded-xl bg-white p-6 shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-corporate-blue">{title}</h3>
            <Button variant="ghost" onClick={onClose}>
              {t("projectForm.close")}
            </Button>
          </div>
          <form className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="codi">{t("projectForm.code")}</Label>
              <Input id="codi" {...register("codi")} />
              {errors.codi && <p className="text-xs text-red-600">{errors.codi.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="nom">{t("projectForm.name")}</Label>
              <Input id="nom" {...register("nom")} />
              {errors.nom && <p className="text-xs text-red-600">{errors.nom.message}</p>}
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="descripcio">{t("projectForm.description")}</Label>
              <Input id="descripcio" {...register("descripcio")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estat">{t("projectForm.status")}</Label>
              <select
                id="estat"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                {...register("estat")}
              >
                <option value="ESBORRANY">{t("projects.status.DRAFT")}</option>
                <option value="ACTIU">{t("projects.status.ACTIVE")}</option>
                <option value="COMPLETAT">{t("projects.status.COMPLETED")}</option>
                <option value="ARXIUAT">{t("projects.status.ARCHIVED")}</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="imd">{t("projectForm.imd")}</Label>
              <Input id="imd" type="number" {...register("imd", numberRegisterOptions)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="percentatgeVp">{t("projectForm.vp")}</Label>
              <Input
                id="percentatgeVp"
                type="number"
                step="0.1"
                {...register("percentatgeVp", numberRegisterOptions)}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>{t("projectForm.transitAutoCategory", "Categoria transit automatica")}</Label>
              <Input disabled value={categoriaTransitAuto} />
            </div>
            <div className="flex items-center gap-2 md:col-span-2">
              <input id="usaCategoriaManual" type="checkbox" {...register("usaCategoriaManual")} />
              <Label htmlFor="usaCategoriaManual">
                {t("projectForm.useManualTransitCategory", "Seleccionar categoria manualment")}
              </Label>
            </div>
            {usaCategoriaManual && (
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="categoriaTransitManual">
                  {t("projectForm.transitManualCategory", "Categoria transit manual")}
                </Label>
                <select
                  id="categoriaTransitManual"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  {...register("categoriaTransitManual")}
                >
                  <option value="">-</option>
                  <option value="TT1">TT1</option>
                  <option value="TT2">TT2</option>
                  <option value="TT3">TT3</option>
                  <option value="TT4">TT4</option>
                  <option value="TT5">TT5</option>
                </select>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="tipusTracat">{t("projectForm.layoutType")}</Label>
              <Input id="tipusTracat" {...register("tipusTracat")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zonaClimatica">{t("projectForm.climateZone")}</Label>
              <Input id="zonaClimatica" {...register("zonaClimatica")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vidaUtil">{t("projectForm.life")}</Label>
              <Input id="vidaUtil" type="number" {...register("vidaUtil", numberRegisterOptions)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="creixementAnual">{t("projectForm.growth")}</Label>
              <Input
                id="creixementAnual"
                type="number"
                step="0.1"
                {...register("creixementAnual", numberRegisterOptions)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="latitud">{t("projectForm.lat")}</Label>
              <Input
                id="latitud"
                type="number"
                step="0.0000001"
                {...register("latitud", numberRegisterOptions)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="longitud">{t("projectForm.lng")}</Label>
              <Input
                id="longitud"
                type="number"
                step="0.0000001"
                {...register("longitud", numberRegisterOptions)}
              />
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 md:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-corporate-blue">Ubicacions del projecte</p>
                  <p className="text-xs text-slate-600">
                    {ubicacionsSeleccionades.length > 0
                      ? ubicacionsSeleccionades.join(" · ")
                      : "Cap ubicacio seleccionada encara"}
                  </p>
                </div>
                <Button type="button" variant="outline" onClick={() => setUbicacionsModalOpen(true)}>
                  Gestionar ubicacions
                </Button>
              </div>
            </div>
            <div className="flex gap-2 md:col-span-2">
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => void submitWithStatus("ESBORRANY")}
              >
                {t("projectForm.saveDraft")}
              </Button>
              <Button
                type="button"
                disabled={isSubmitting}
                className="bg-corporate-green hover:bg-corporate-green/90"
                onClick={() => void submitWithStatus(getValues("estat"))}
              >
                {isSubmitting ? t("projectForm.saving") : t("projectForm.save")}
              </Button>
            </div>
          </form>
        </div>
      </div>
      <ModalUbicacions
        open={ubicacionsModalOpen}
        obra={latitud !== undefined && longitud !== undefined ? { lat: latitud, lng: longitud } : null}
        onClose={() => setUbicacionsModalOpen(false)}
        onSelectForProject={(ubicacio) => {
          setValue("latitud", ubicacio.latitud);
          setValue("longitud", ubicacio.longitud);
          setUbicacionsSeleccionades((current) => {
            const next = [ubicacio.nom, ...current.filter((name) => name !== ubicacio.nom)];
            return next.slice(0, 3);
          });
          setUbicacionsModalOpen(false);
        }}
      />
    </>
  );
}
