import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { z } from "zod";

import { SelectorIdioma } from "@/components/layout/SelectorIdioma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";

interface LoginValues {
  email: string;
  password: string;
}

export default function Login() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const loginSchema = useMemo(
    () =>
      z.object({
        email: z.email(t("auth.validation.emailInvalid")),
        password: z.string().min(1, t("auth.validation.passwordRequired")),
      }),
    [t],
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema) as never,
  });

  const onSubmit = async (values: LoginValues) => {
    setServerError(null);
    try {
      await login(values);
    } catch (error) {
      if (axios.isAxiosError<{ message?: string }>(error)) {
        setServerError(error.response?.data?.message ?? t("auth.loginError"));
        return;
      }
      setServerError(t("auth.loginError"));
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-corporate-gray px-4">
      <div className="fixed right-4 top-4">
        <SelectorIdioma />
      </div>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-corporate-blue">{t("auth.loginTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input id="email" type="email" {...register("email")} />
              {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("auth.password")}</Label>
              <Input id="password" type="password" {...register("password")} />
              {errors.password && <p className="text-xs text-red-600">{errors.password.message}</p>}
            </div>
            {serverError && <p className="text-sm text-red-600">{serverError}</p>}
            <Button className="w-full bg-corporate-blue hover:bg-corporate-blue/90" disabled={isSubmitting}>
              {isSubmitting ? t("auth.submittingLogin") : t("auth.submitLogin")}
            </Button>
          </form>
          <p className="mt-4 text-sm text-slate-600">
            {t("auth.noAccount")}{" "}
            <Link className="font-medium text-corporate-green hover:underline" to="/register">
              {t("auth.goRegister")}
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
