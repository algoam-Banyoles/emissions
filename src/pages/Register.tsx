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

interface RegisterValues {
  organitzacioNom: string;
  organitzacioTipus?: string | undefined;
  organitzacioNif?: string | undefined;
  nom: string;
  cognoms?: string | undefined;
  email: string;
  password: string;
  confirmPassword: string;
}

export default function Register() {
  const { t } = useTranslation();
  const { register: registerUser } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const registerSchema = useMemo(
    () =>
      z
        .object({
          organitzacioNom: z.string().min(2, t("auth.validation.organizationRequired")),
          organitzacioTipus: z.string().optional(),
          organitzacioNif: z.string().optional(),
          nom: z.string().min(2, t("auth.validation.nameRequired")),
          cognoms: z.string().optional(),
          email: z.email(t("auth.validation.emailInvalid")),
          password: z
            .string()
            .min(10, t("auth.validation.passwordMin"))
            .regex(/[A-Z]/, t("auth.validation.passwordUpper"))
            .regex(/[a-z]/, t("auth.validation.passwordLower"))
            .regex(/[0-9]/, t("auth.validation.passwordNumber"))
            .regex(/[^A-Za-z0-9]/, t("auth.validation.passwordSpecial")),
          confirmPassword: z.string().min(1, t("auth.validation.passwordConfirm")),
        })
        .refine((data) => data.password === data.confirmPassword, {
          message: t("auth.validation.passwordMismatch"),
          path: ["confirmPassword"],
        }),
    [t],
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema) as never,
  });

  const onSubmit = async (values: RegisterValues) => {
    setServerError(null);
    try {
      await registerUser({
        organitzacioNom: values.organitzacioNom,
        nom: values.nom,
        email: values.email,
        password: values.password,
        ...(values.organitzacioTipus ? { organitzacioTipus: values.organitzacioTipus } : {}),
        ...(values.organitzacioNif ? { organitzacioNif: values.organitzacioNif } : {}),
        ...(values.cognoms ? { cognoms: values.cognoms } : {}),
      });
    } catch (error) {
      if (axios.isAxiosError<{ message?: string }>(error)) {
        setServerError(error.response?.data?.message ?? t("auth.registerError"));
        return;
      }
      setServerError(t("auth.registerError"));
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-corporate-gray px-4 py-8">
      <div className="fixed right-4 top-4">
        <SelectorIdioma />
      </div>
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle className="text-2xl text-corporate-blue">{t("auth.registerTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="organitzacioNom">{t("auth.organization")}</Label>
              <Input id="organitzacioNom" {...register("organitzacioNom")} />
              {errors.organitzacioNom && (
                <p className="text-xs text-red-600">{errors.organitzacioNom.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="nom">{t("auth.name")}</Label>
              <Input id="nom" {...register("nom")} />
              {errors.nom && <p className="text-xs text-red-600">{errors.nom.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="cognoms">{t("auth.lastName")}</Label>
              <Input id="cognoms" {...register("cognoms")} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input id="email" type="email" {...register("email")} />
              {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("auth.password")}</Label>
              <Input id="password" type="password" {...register("password")} />
              {errors.password && <p className="text-xs text-red-600">{errors.password.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t("auth.confirmPassword")}</Label>
              <Input id="confirmPassword" type="password" {...register("confirmPassword")} />
              {errors.confirmPassword && (
                <p className="text-xs text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>
            {serverError && <p className="text-sm text-red-600 sm:col-span-2">{serverError}</p>}
            <Button
              className="sm:col-span-2 bg-corporate-green hover:bg-corporate-green/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? t("auth.submittingRegister") : t("auth.submitRegister")}
            </Button>
          </form>
          <p className="mt-4 text-sm text-slate-600">
            {t("auth.haveAccount")}{" "}
            <Link className="font-medium text-corporate-blue hover:underline" to="/login">
              {t("auth.goLogin")}
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
