"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { UserCheck } from "lucide-react";

export function RegisterForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingSession, setLoadingSession] = useState(true);
  const [user, setUser] = useState(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const password = watch("password");

  useEffect(() => {
    const supabase = createClient();

    const forzarSesionDesdeUrl = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        verificarPerfil(session.user);
        return;
      }

      const hash = window.location.hash;
      if (hash && hash.includes("access_token")) {
        try {
          const params = new URLSearchParams(hash.substring(1));
          const accessToken = params.get("access_token");
          const refreshToken = params.get("refresh_token");

          if (!accessToken) throw new Error("Token no encontrado en URL");

          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || "",
          });

          if (error) throw error;

          if (data.session) {
            verificarPerfil(data.session.user);
          }
        } catch (err) {
          console.error("Error forzando sesión:", err);
          toast.error("Error de enlace", {
            description: "El enlace está roto o ha expirado.",
          });
        }
      } else {
        setTimeout(() => {
          router.push("/login?error=no_token");
        }, 1000);
      }
    };

    const verificarPerfil = async (usuarioAuth) => {
      setUser(usuarioAuth);

      const { data } = await supabase
        .from("usuarios")
        .select("id")
        .eq("id", usuarioAuth.id)
        .single();

      if (data) {
        router.push("/dashboard");
      } else {
        setLoadingSession(false);
      }
    };

    forzarSesionDesdeUrl();
  }, [router]);

  const onSubmit = async (data) => {
    if (!user) return toast.error("Sesión perdida. Recarga la página.");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password: data.password,
          nombre: data.firstName,
          apellido: data.lastName,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "No se pudo completar el registro");
      }

      toast.success("¡Registro completado!", {
        description: "Tu perfil ha sido configurado en el sistema.",
      });
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      toast.error("Error al registrar", { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  if (loadingSession) {
    return (
      <div className="w-full max-w-sm rounded-xs border border-border bg-card p-8 shadow-sm flex flex-col items-center justify-center space-y-3 text-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
          Validando credenciales...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm rounded-xs border border-border bg-card p-6 sm:p-8 shadow-sm">
      <div className="mb-6 space-y-1 text-left">
        <h1 className="text-xl sm:text-2xl font-bold font-mono uppercase tracking-tight text-foreground">
          Completar Registro
        </h1>
        <p className="text-xs font-mono text-muted-foreground leading-relaxed">
          Define tus credenciales de acceso para completar el registro.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label
              htmlFor="firstName"
              className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-medium"
            >
              Nombre
            </Label>
            <Input
              id="firstName"
              placeholder="Carlos"
              {...register("firstName", { required: "Campo requerido" })}
              className={`h-10 rounded-xs border bg-background px-3 font-mono text-xs focus:border-primary focus:ring-1 focus:ring-primary shadow-none ${
                errors.firstName ? "border-destructive" : "border-border"
              }`}
            />
            {errors.firstName && (
              <p className="text-xs font-mono text-destructive">
                {errors.firstName.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="lastName"
              className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-medium"
            >
              Apellido
            </Label>
            <Input
              id="lastName"
              placeholder="Mendoza"
              {...register("lastName", { required: "Campo requerido" })}
              className={`h-10 rounded-xs border bg-background px-3 font-mono text-xs focus:border-primary focus:ring-1 focus:ring-primary shadow-none ${
                errors.lastName ? "border-destructive" : "border-border"
              }`}
            />
            {errors.lastName && (
              <p className="text-xs font-mono text-destructive">
                {errors.lastName.message}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label
            htmlFor="password"
            className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-medium"
          >
            Nueva Contraseña
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••••••"
            {...register("password", {
              required: "La contraseña es requerida",
              minLength: {
                value: 8,
                message: "Mínimo 8 caracteres",
              },
            })}
            className={`h-10 rounded-xs border bg-background px-3 font-mono text-xs focus:border-primary focus:ring-1 focus:ring-primary shadow-none ${
              errors.password ? "border-destructive" : "border-border"
            }`}
          />
          {errors.password && (
            <p className="text-xs font-mono text-destructive">
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label
            htmlFor="confirmPassword"
            className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-medium"
          >
            Confirmar Contraseña
          </Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="••••••••••••"
            {...register("confirmPassword", {
              required: "La confirmación es requerida",
              validate: (v) => v === password || "Las contraseñas no coinciden",
            })}
            className={`h-10 rounded-xs border bg-background px-3 font-mono text-xs focus:border-primary focus:ring-1 focus:ring-primary shadow-none ${
              errors.confirmPassword ? "border-destructive" : "border-border"
            }`}
          />
          {errors.confirmPassword && (
            <p className="text-xs font-mono text-destructive">
              {errors.confirmPassword.message}
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
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <UserCheck className="h-3.5 w-3.5" />
                <span>Finalizar y Entrar</span>
              </>
            )}
          </Button>
        </div>

        <div className="pt-4 border-t border-border text-center">
          <Link
            href="/login"
            className="text-xs font-mono text-muted-foreground hover:text-foreground transition-colors uppercase"
          >
            ¿Ya tienes cuenta? Iniciar sesión
          </Link>
        </div>
      </form>
    </div>
  );
}
