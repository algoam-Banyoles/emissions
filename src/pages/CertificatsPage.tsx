import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { GeneradorCertificat } from "@/components/forms/GeneradorCertificat";
import { LlistaCertificats } from "@/components/forms/LlistaCertificats";
import { MainLayout } from "@/components/layout/main-layout";
import { useCertificats } from "@/hooks/useCertificats";
import { type Certificat } from "@/types/certificat";

export default function CertificatsPage() {
  const { t } = useTranslation();
  const { list, revoke, downloadPdf, loading, error } = useCertificats();
  const [certificats, setCertificats] = useState<Certificat[]>([]);

  const refresh = useCallback(async () => {
    const items = await list();
    setCertificats(items);
  }, [list]);

  useEffect(() => {
    let cancelled = false;
    void list().then((items) => {
      if (!cancelled) {
        setCertificats(items);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [list]);

  return (
    <MainLayout>
      <section className="space-y-6">
        <h1 className="text-2xl font-semibold text-corporate-blue">{t("certificates.pageTitle")}</h1>
        {error && <p className="text-sm text-red-600">{error}</p>}

        <GeneradorCertificat
          onCreated={(created) => {
            setCertificats((current) => [created, ...current]);
          }}
        />

        <LlistaCertificats
          certificats={certificats}
          loading={loading}
          onRefresh={refresh}
          onDownload={async (id, code, lang) => await downloadPdf(id, code, lang)}
          onRevoke={async (id) => {
            const updated = await revoke(id);
            setCertificats((current) => current.map((item) => (item.id === id ? updated : item)));
          }}
        />
      </section>
    </MainLayout>
  );
}
