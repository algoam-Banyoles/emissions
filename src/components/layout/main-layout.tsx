import { type PropsWithChildren } from "react";
import { useTranslation } from "react-i18next";

import { SelectorIdioma } from "@/components/layout/SelectorIdioma";
import { Separator } from "@/components/ui/separator";

export function MainLayout({ children }: PropsWithChildren) {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-corporate-gray">
      <header className="border-b bg-white/90 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <div className="text-lg font-semibold text-corporate-blue">{t("app.name")}</div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-slate-600">
              {t("app.tenant")}: {t("app.demoOrg")}
            </div>
            <SelectorIdioma />
          </div>
        </div>
      </header>
      <div className="container py-8">
        {children}
        <Separator className="my-8" />
        <footer className="text-xs text-slate-500">{t("app.subtitle")}</footer>
      </div>
    </div>
  );
}
