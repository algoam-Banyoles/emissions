import { useNavigate } from "react-router-dom";

import { api } from "@/services/api";
import { useAuthStore } from "@/stores/auth.store";
import { type AuthResponse } from "@/types/auth";

interface RegisterInput {
  organitzacioNom: string;
  organitzacioTipus?: string | undefined;
  organitzacioNif?: string | undefined;
  nom: string;
  cognoms?: string | undefined;
  email: string;
  password: string;
}

interface LoginInput {
  email: string;
  password: string;
}

export function useAuth() {
  const navigate = useNavigate();
  const authState = useAuthStore();

  async function register(payload: RegisterInput) {
    const { data } = await api.post<AuthResponse>("/auth/register", payload);
    useAuthStore.getState().setAuth({
      accessToken: data.accessToken,
      user: data.user,
      ...(data.organitzacio ? { organitzacio: data.organitzacio } : {}),
    });
    navigate("/");
  }

  async function login(payload: LoginInput) {
    const { data } = await api.post<AuthResponse>("/auth/login", payload);
    useAuthStore.getState().setAuth({
      accessToken: data.accessToken,
      user: data.user,
      ...(data.organitzacio ? { organitzacio: data.organitzacio } : {}),
    });
    navigate("/");
  }

  async function logout() {
    try {
      await api.post("/auth/logout");
    } finally {
      useAuthStore.getState().clearAuth();
      navigate("/login");
    }
  }

  async function refreshSession() {
    const { data } = await api.post<AuthResponse>("/auth/refresh");
    useAuthStore.getState().setAuth({
      accessToken: data.accessToken,
      user: data.user,
    });
    return data;
  }

  return {
    ...authState,
    register,
    login,
    logout,
    refreshSession,
  };
}
