import { create } from "zustand";

import { type AuthOrganization, type AuthUser } from "@/types/auth";

interface SetAuthPayload {
  accessToken: string;
  user: AuthUser;
  organitzacio?: AuthOrganization | undefined;
}

interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  organitzacio: AuthOrganization | null;
  isAuthenticated: boolean;
  setAuth: (payload: SetAuthPayload) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  organitzacio: null,
  isAuthenticated: false,
  setAuth: ({ accessToken, user, organitzacio }) =>
    set({
      accessToken,
      user,
      organitzacio: organitzacio ?? null,
      isAuthenticated: true,
    }),
  clearAuth: () =>
    set({
      accessToken: null,
      user: null,
      organitzacio: null,
      isAuthenticated: false,
    }),
}));
