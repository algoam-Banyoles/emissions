import { create } from "zustand";

interface TenantState {
  tenantId: string;
  tenantName: string;
  setTenant: (tenantId: string, tenantName: string) => void;
}

export const useTenantStore = create<TenantState>((set) => ({
  tenantId: "demo-tenant",
  tenantName: "Demo Org",
  setTenant: (tenantId, tenantName) => set({ tenantId, tenantName }),
}));
