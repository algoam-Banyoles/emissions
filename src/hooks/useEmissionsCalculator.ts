import { useCallback, useState } from "react";

import { api } from "@/services/api";
import { type EmissionsCalculRequest, type EmissionsCalculResponse } from "@/types/emissions-calcul";

export function useEmissionsCalculator() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calcular = useCallback(async (payload: EmissionsCalculRequest) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post<EmissionsCalculResponse>("/emissions/calcular", payload);
      return data;
    } catch {
      setError("No s'ha pogut calcular la petjada d'emissions");
      throw new Error("No s'ha pogut calcular la petjada d'emissions");
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    calcular,
  };
}
