"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Eye, EyeOff, LogIn } from "lucide-react";

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: "user@gmail.com",
      password: "12345",
    },
  });

  const onSubmit = async (data) => {
    setIsLoading(true);

    try {
      const emailFormatted =
        data.email.includes("@") && !data.email.includes(".")
          ? `${data.email}.com`
          : data.email;

      const supabase = createClient();
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: emailFormatted,
        password: data.password,
      });

      if (error) {
        toast.error("Error al iniciar sesión", {
          description: error.message,
        });
        return;
      }

      if (authData.user) {
        toast.success("¡Bienvenido al sistema!", {
          description: "Inicio de sesión verificado correctamente.",
        });
        router.push("/dashboard");
        router.refresh();
      }
    } catch (error) {
      toast.error("Error de autenticación", {
        description: "No fue posible verificar las credenciales.",
      });
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm rounded-xs border border-border bg-card p-6 sm:p-8 shadow-sm">
      <div className="mb-6 space-y-1 text-left">
        <h1 className="text-xl sm:text-2xl font-bold font-mono uppercase tracking-tight text-foreground">
          Inicio de Sesión
        </h1>
        <p className="text-xs font-mono text-muted-foreground leading-relaxed">
          Ingrese sus credenciales para acceder a la plataforma.
        </p>
      </div>

      <div className="mb-5 rounded-xs border border-border bg-muted/30 p-3 text-xs font-mono">
        <div className="flex items-center justify-between text-muted-foreground mb-1.5">
          <span className="uppercase font-semibold text-foreground">Acceso Visitante</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-xs bg-primary/10 text-primary border border-primary/20 font-medium">DEMO</span>
        </div>
        <div className="flex items-center justify-between text-muted-foreground text-[11px]">
          <span>Email: <strong className="text-foreground font-mono">user@gmail.com</strong></span>
          <span>Clave: <strong className="text-foreground font-mono">12345</strong></span>
        </div>
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
            placeholder="user@gmail.com"
            autoComplete="email"
            {...register("email", {
              required: "El correo electrónico es obligatorio",
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+$/i,
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

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="password"
              className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-medium"
            >
              Contraseña
            </Label>

          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••••••"
              autoComplete="current-password"
              {...register("password", {
                required: "La contraseña es obligatoria",
              })}
              className={`h-10 rounded-xs border bg-background pl-3 pr-10 font-mono text-xs focus:border-primary focus:ring-1 focus:ring-primary shadow-none ${
                errors.password ? "border-destructive" : "border-border"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              tabIndex={-1}
              aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs font-mono text-destructive">
              {errors.password.message}
            </p>
          )}
          <Link
            href="/recuperar-password"
            className="text-xs font-mono text-muted-foreground hover:text-primary transition-colors uppercase tracking-wider"
          >
            ¿Olvidaste la contraseña?
          </Link>
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
                <span>Verificando...</span>
              </>
            ) : (
              <>
                <LogIn className="h-3.5 w-3.5" />
                <span>Acceder al Sistema</span>
              </>
            )}
          </Button>
          
        </div>

        <div className="pt-4 border-t border-border flex items-center justify-between text-xs font-mono">
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 uppercase"
          >
            <ArrowLeft className="h-3 w-3" />
            Volver al inicio
          </Link>
          <span className="text-muted-foreground/60 uppercase">
            Conexión segura
          </span>
        </div>
      </form>
    </div>
  );
}
