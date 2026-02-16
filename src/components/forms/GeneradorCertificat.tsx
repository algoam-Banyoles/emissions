import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCertificats } from "@/hooks/useCertificats";
import { type Certificat, type GenerarCertificatPayload } from "@/types/certificat";

interface GeneradorCertificatProps {
  onCreated: (certificat: Certificat) => void;
}

const defaultPayload: GenerarCertificatPayload = {
  projecteNom: "Projecte demostracio",
  obraNom: "Obra tram nord",
  fabricantNom: "Fabricant Demo, SL",
  mesclaNom: "MBC-16 Surf",
  tipologiaMescla: "MBC_CONVENCIONAL",
  quantitatTones: 1250,
  versioMetodologia: "OC 3/2024",
  annexText: "Annex de calcul generat automaticament.",
  signaturaDigital: false,
  emissions: {
    A1: 24,
    A2: 7,
    A3: 11,
    A4: 6,
    A5: 4,
    total: 52,
    limit: 70,
    unitat: "kg CO2e/t",
  },
};

export function GeneradorCertificat({ onCreated }: GeneradorCertificatProps) {
  const { t, i18n } = useTranslation();
  const { generate, loading, error } = useCertificats();
  const [progress, setProgress] = useState(0);
  const [payload, setPayload] = useState<GenerarCertificatPayload>(defaultPayload);
  const [reportLanguage, setReportLanguage] = useState<"ca" | "es" | "en" | "fr">(
    (i18n.language.split("-")[0] as "ca" | "es" | "en" | "fr") ?? "ca",
  );

  const compleix = useMemo(() => payload.emissions.total <= payload.emissions.limit, [payload]);

  const handleGenerate = async () => {
    setProgress(20);
    const timer = window.setInterval(() => {
      setProgress((current) => (current < 90 ? current + 10 : current));
    }, 140);

    try {
      const created = await generate({
        ...payload,
        idioma: reportLanguage,
      });
      setProgress(100);
      onCreated(created);
    } finally {
      window.clearInterval(timer);
      window.setTimeout(() => setProgress(0), 1200);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{t("certificates.generatorTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="text-sm">
            <span className="mb-1 block text-slate-600">{t("language.label")}</span>
            <select
              className="h-10 rounded-md border px-3"
              value={reportLanguage}
              onChange={(event) => setReportLanguage(event.target.value as "ca" | "es" | "en" | "fr")}
            >
              <option value="ca">{t("language.ca")}</option>
              <option value="es">{t("language.es")}</option>
              <option value="en">{t("language.en")}</option>
              <option value="fr">{t("language.fr")}</option>
            </select>
          </label>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block text-slate-600">{t("certificates.manufacturer", { lng: reportLanguage })}</span>
              <input className="h-10 w-full rounded-md border px-3" value={payload.fabricantNom} onChange={(event) => setPayload((current) => ({ ...current, fabricantNom: event.target.value }))} />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-slate-600">{t("certificates.project", { lng: reportLanguage })}</span>
              <input className="h-10 w-full rounded-md border px-3" value={payload.projecteNom} onChange={(event) => setPayload((current) => ({ ...current, projecteNom: event.target.value }))} />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-slate-600">{t("certificates.work", { lng: reportLanguage })}</span>
              <input className="h-10 w-full rounded-md border px-3" value={payload.obraNom} onChange={(event) => setPayload((current) => ({ ...current, obraNom: event.target.value }))} />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-slate-600">{t("certificates.mix", { lng: reportLanguage })}</span>
              <input className="h-10 w-full rounded-md border px-3" value={payload.mesclaNom} onChange={(event) => setPayload((current) => ({ ...current, mesclaNom: event.target.value }))} />
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <label className="text-sm">
              <span className="mb-1 block text-slate-600">A1</span>
              <input className="h-10 w-full rounded-md border px-3" type="number" value={payload.emissions.A1} onChange={(event) => setPayload((current) => ({ ...current, emissions: { ...current.emissions, A1: Number(event.target.value) } }))} />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-slate-600">A2</span>
              <input className="h-10 w-full rounded-md border px-3" type="number" value={payload.emissions.A2} onChange={(event) => setPayload((current) => ({ ...current, emissions: { ...current.emissions, A2: Number(event.target.value) } }))} />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-slate-600">A3</span>
              <input className="h-10 w-full rounded-md border px-3" type="number" value={payload.emissions.A3} onChange={(event) => setPayload((current) => ({ ...current, emissions: { ...current.emissions, A3: Number(event.target.value) } }))} />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-slate-600">A4</span>
              <input className="h-10 w-full rounded-md border px-3" type="number" value={payload.emissions.A4} onChange={(event) => setPayload((current) => ({ ...current, emissions: { ...current.emissions, A4: Number(event.target.value) } }))} />
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <label className="text-sm">
              <span className="mb-1 block text-slate-600">A5</span>
              <input className="h-10 w-full rounded-md border px-3" type="number" value={payload.emissions.A5} onChange={(event) => setPayload((current) => ({ ...current, emissions: { ...current.emissions, A5: Number(event.target.value) } }))} />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-slate-600">Total</span>
              <input className="h-10 w-full rounded-md border px-3" type="number" value={payload.emissions.total} onChange={(event) => setPayload((current) => ({ ...current, emissions: { ...current.emissions, total: Number(event.target.value) } }))} />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-slate-600">Limit</span>
              <input className="h-10 w-full rounded-md border px-3" type="number" value={payload.emissions.limit} onChange={(event) => setPayload((current) => ({ ...current, emissions: { ...current.emissions, limit: Number(event.target.value) } }))} />
            </label>
            <label className="mt-7 flex items-center gap-2 text-sm">
              <input type="checkbox" checked={payload.signaturaDigital ?? false} onChange={(event) => setPayload((current) => ({ ...current, signaturaDigital: event.target.checked }))} />
              Signatura digital
            </label>
          </div>

          <div className="space-y-1">
            <div className="h-2 overflow-hidden rounded bg-slate-200">
              <div className="h-full bg-corporate-blue" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-xs text-slate-600">
              {progress > 0 ? t("certificates.progress", { value: progress }) : t("certificates.ready")}
            </p>
          </div>

          <Button className="bg-corporate-green hover:bg-corporate-green/90" disabled={loading} onClick={() => void handleGenerate()}>
            {loading ? t("certificates.generating", { lng: reportLanguage }) : t("certificates.generate", { lng: reportLanguage })}
          </Button>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("certificates.previewTitle", { lng: reportLanguage })}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p><span className="font-medium">{t("certificates.manufacturer", { lng: reportLanguage })}:</span> {payload.fabricantNom}</p>
          <p><span className="font-medium">{t("certificates.project", { lng: reportLanguage })}:</span> {payload.projecteNom}</p>
          <p><span className="font-medium">{t("certificates.work", { lng: reportLanguage })}:</span> {payload.obraNom}</p>
          <p><span className="font-medium">{t("certificates.mix", { lng: reportLanguage })}:</span> {payload.mesclaNom}</p>
          <p className={compleix ? "text-corporate-green" : "text-red-600"}>
            {t("certificates.regulatoryResult", { lng: reportLanguage })}: {compleix ? t("certificates.compliant", { lng: reportLanguage }) : t("certificates.nonCompliant", { lng: reportLanguage })}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
