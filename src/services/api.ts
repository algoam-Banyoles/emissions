import axios, { type InternalAxiosRequestConfig } from "axios";

import { getLanguageForApi } from "@/i18n/config";
import { useAuthStore } from "@/stores/auth.store";
import { type AuthResponse } from "@/types/auth";

const API_BASE_URL = import.meta.env["VITE_API_URL"] ?? "http://localhost:4000/api";

type RetriableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  const nextConfig = config;

  if (token) {
    nextConfig.headers.Authorization = `Bearer ${token}`;
  }
  nextConfig.headers["Accept-Language"] = getLanguageForApi();

  return nextConfig;
});

api.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error) || !error.config) {
      return Promise.reject(error);
    }

    const originalRequest = error.config as RetriableRequestConfig;
    const status = error.response?.status;

    if (status !== 401 || originalRequest._retry || originalRequest.url?.includes("/auth/")) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const { data } = await api.post<AuthResponse>("/auth/refresh");
      useAuthStore.getState().setAuth({
        accessToken: data.accessToken,
        user: data.user,
      });
      originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
      return await api.request(originalRequest);
    } catch (refreshError) {
      useAuthStore.getState().clearAuth();
      return Promise.reject(refreshError);
    }
  },
);
