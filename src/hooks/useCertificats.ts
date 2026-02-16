import { useCallback, useState } from "react";

import i18n from "@/i18n/config";
import { api } from "@/services/api";
import { type Certificat, type GenerarCertificatPayload, type LlistaCertificatsResponse } from "@/types/certificat";

export function useCertificats() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (payload: GenerarCertificatPayload) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post<Certificat>("/certificats/generar", payload);
      return data;
    } catch {
      setError(i18n.t("certificates.errors.generate"));
      throw new Error(i18n.t("certificates.errors.generate"));
    } finally {
      setLoading(false);
    }
  }, []);

  const list = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<LlistaCertificatsResponse>("/certificats");
      return data.items;
    } catch {
      setError(i18n.t("certificates.errors.list"));
      throw new Error(i18n.t("certificates.errors.list"));
    } finally {
      setLoading(false);
    }
  }, []);

  const getById = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<Certificat>(`/certificats/${id}`);
      return data;
    } catch {
      setError(i18n.t("certificates.errors.get"));
      throw new Error(i18n.t("certificates.errors.get"));
    } finally {
      setLoading(false);
    }
  }, []);

  const revoke = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post<Certificat>(`/certificats/${id}/revocar`);
      return data;
    } catch {
      setError(i18n.t("certificates.errors.revoke"));
      throw new Error(i18n.t("certificates.errors.revoke"));
    } finally {
      setLoading(false);
    }
  }, []);

  const downloadPdf = useCallback(async (id: string, fileName: string, lang?: "ca" | "es" | "en" | "fr") => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/certificats/${id}/pdf`, {
        responseType: "blob",
        ...(lang ? { params: { lang } } : {}),
      });
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${fileName}${lang ? `-${lang}` : ""}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError(i18n.t("certificates.errors.download"));
      throw new Error(i18n.t("certificates.errors.download"));
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    generate,
    list,
    getById,
    revoke,
    downloadPdf,
  };
}
