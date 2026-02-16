import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type Certificat } from "@/types/certificat";
import { formatNumber } from "@/utils/locale";

interface LlistaCertificatsProps {
  certificats: Certificat[];
  onRefresh: () => Promise<void>;
  onDownload: (id: string, code: string, lang?: "ca" | "es" | "en" | "fr") => Promise<void>;
  onRevoke: (id: string) => Promise<void>;
  loading: boolean;
}

function badgeClass(estat: Certificat["estat"]) {
  if (estat === "VALID") {
    return "bg-green-100 text-green-800";
  }
  if (estat === "CADUCAT") {
    return "bg-amber-100 text-amber-800";
  }
  return "bg-red-100 text-red-800";
}

export function LlistaCertificats({ certificats, onRefresh, onDownload, onRevoke, loading }: LlistaCertificatsProps) {
  const { t, i18n } = useTranslation();
  const [reportLanguage, setReportLanguage] = useState<"ca" | "es" | "en" | "fr">(
    (i18n.language.split("-")[0] as "ca" | "es" | "en" | "fr") ?? "ca",
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t("certificates.listTitle")}</CardTitle>
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-600">
            {t("language.label")}
            <select
              className="ml-2 h-8 rounded border px-2"
              value={reportLanguage}
              onChange={(event) => setReportLanguage(event.target.value as "ca" | "es" | "en" | "fr")}
            >
              <option value="ca">{t("language.ca")}</option>
              <option value="es">{t("language.es")}</option>
              <option value="en">{t("language.en")}</option>
              <option value="fr">{t("language.fr")}</option>
            </select>
          </label>
          <Button variant="outline" onClick={() => void onRefresh()} disabled={loading}>
            {t("certificates.refresh")}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b bg-slate-50">
              <th className="p-2">{t("certificates.code")}</th>
              <th className="p-2">{t("certificates.project")}</th>
              <th className="p-2">{t("certificates.mix")}</th>
              <th className="p-2">{t("certificates.total")}</th>
              <th className="p-2">{t("certificates.state")}</th>
              <th className="p-2">{t("certificates.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {certificats.map((item) => (
              <tr key={item.id} className="border-b">
                <td className="p-2">{item.codi}</td>
                <td className="p-2">{item.projecteNom}</td>
                <td className="p-2">{item.mesclaNom}</td>
                <td className="p-2">{formatNumber(item.emissions.total, 3)}</td>
                <td className="p-2">
                  <span className={`rounded px-2 py-1 text-xs font-medium ${badgeClass(item.estat)}`}>
                    {t(`certificates.status.${item.estat}`)}
                  </span>
                </td>
                <td className="p-2">
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => void onDownload(item.id, item.codi, reportLanguage)}>
                      {t("certificates.download")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        void Promise.all([
                          onDownload(item.id, item.codi, "ca"),
                          onDownload(item.id, item.codi, "es"),
                          onDownload(item.id, item.codi, "en"),
                          onDownload(item.id, item.codi, "fr"),
                        ]);
                      }}
                    >
                      x4
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={item.estat === "REVOCAT"}
                      onClick={() => void onRevoke(item.id)}
                    >
                      {t("certificates.revoke")}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {certificats.length === 0 && (
              <tr>
                <td className="p-3 text-slate-500" colSpan={6}>{t("certificates.empty")}</td>
              </tr>
            )}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
