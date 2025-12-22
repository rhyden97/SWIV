"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, CheckCircle2, KeyRound } from "lucide-react";

export function ForgotPasswordForm() {
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: data.email }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error("Error al procesar solicitud", {
          description: result.error || "Ocurrió un problema en el servidor.",
        });
        return;
      }

      toast.success("Solicitud procesada", {
        description:
          "Si el correo está registrado en la base de datos, recibirás las instrucciones.",
      });
      setSubmitted(true);
    } catch (error) {
      toast.error("Error de comunicación", {
        description: "No fue posible conectar con el servidor.",
      });
      console.error("Reset password error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="w-full max-w-sm rounded-xs border border-border bg-card p-6 sm:p-8 shadow-sm space-y-6 text-left">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <span className="font-mono text-xs uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-semibold">
            Instrucciones Enviadas
          </span>
        </div>

        <div className="space-y-1.5">
          <h1 className="text-xl sm:text-2xl font-bold font-mono uppercase tracking-tight text-foreground">
            Bandeja de Entrada
          </h1>
          <p className="text-xs font-mono text-muted-foreground leading-relaxed">
            Si la dirección corresponde a una cuenta registrada, se enviarán las instrucciones para restablecer el acceso.
          </p>
        </div>

        <div className="p-3.5 rounded-xs border border-border bg-muted/20 text-xs font-mono text-muted-foreground leading-relaxed">
          Verifica también la carpeta de spam o correo no deseado.
        </div>

        <Link href="/login" className="block pt-2">
          <Button
            variant="outline"
            className="w-full h-10 rounded-xs font-mono text-xs uppercase tracking-wider"
          >
            Volver al inicio de sesión
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm rounded-xs border border-border bg-card p-6 sm:p-8 shadow-sm">
      <div className="mb-6 space-y-1 text-left">
        <h1 className="text-xl sm:text-2xl font-bold font-mono uppercase tracking-tight text-foreground">
          Restaurar Constraseña
        </h1>
        <p className="text-xs font-mono text-muted-foreground leading-relaxed">
          Ingresa tu correo para recibir un correo de recuperación.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label
            htmlFor="email"
            className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-medium"
          >
            Correo Electrónico
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="usuario@swgvi.com"
            autoComplete="email"
            {...register("email", {
              required: "El correo electrónico es obligatorio",
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "Formato de correo inválido",
              },
            })}
            className={`h-10 rounded-xs border bg-background px-3 font-mono text-xs focus:border-primary focus:ring-1 focus:ring-primary shadow-none ${
              errors.email ? "border-destructive" : "border-border"
            }`}
          />
          {errors.email && (
            <p className="text-xs font-mono text-destructive">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-10 rounded-xs bg-primary hover:bg-primary/90 text-primary-foreground font-mono text-xs uppercase tracking-wider font-semibold shadow-none cursor-pointer flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                <span>Enviando...</span>
              </>
            ) : (
              <>
                <KeyRound className="h-3.5 w-3.5" />
                <span>Enviar Instrucciones</span>
              </>
            )}
          </Button>
        </div>

        <div className="pt-4 border-t border-border text-center">
          <Link
            href="/login"
            className="text-xs font-mono text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5 uppercase"
          >
            <ArrowLeft className="h-3 w-3" />
            Volver al inicio de sesión
          </Link>
        </div>
      </form>
    </div>
  );
}
