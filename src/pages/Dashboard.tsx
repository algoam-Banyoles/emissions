import { Building2, ShieldCheck, Trees } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";

export default function Dashboard() {
  const { t } = useTranslation();
  const { logout, user } = useAuth();
  const isAdmin = user?.rol === "ADMIN";
  const isEmissionsAdmin = user?.rol === "ADMIN_EMISSIONS";
  const kpis = useMemo(
    () => [
      { label: t("dashboard.kpi.activeTenants"), value: "12", icon: Building2 },
      { label: t("dashboard.kpi.optimizedPavements"), value: "1.284 km", icon: Trees },
      { label: t("dashboard.kpi.certificatesIssued"), value: "329", icon: ShieldCheck },
    ],
    [t],
  );

  return (
    <MainLayout>
      <section className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-corporate-blue">{t("dashboard.title")}</h1>
            <p className="text-sm text-slate-600">
              {t("dashboard.authenticatedAs", { email: user?.email ?? t("dashboard.userFallback") })}
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild className="bg-corporate-green hover:bg-corporate-green/90">
              <Link to="/certificats">{t("dashboard.createCertification")}</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/projects">{t("dashboard.projects")}</Link>
            </Button>
            {isAdmin && (
              <>
                <Button asChild variant="outline">
                  <Link to="/admin/materials">{t("dashboard.materials")}</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/admin/versions">{t("dashboard.versions")}</Link>
                </Button>
              </>
            )}
            {isEmissionsAdmin && (
              <Button asChild variant="outline">
                <Link to="/admin/emissions">{t("dashboard.emissionsFactors")}</Link>
              </Button>
            )}
            <Button variant="outline" onClick={() => void logout()}>
              {t("dashboard.logout")}
            </Button>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {kpis.map((kpi) => (
            <Card key={kpi.label}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">
                  {kpi.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <span className="text-2xl font-semibold text-corporate-blue">{kpi.value}</span>
                <kpi.icon className="h-5 w-5 text-corporate-green" />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </MainLayout>
  );
}
