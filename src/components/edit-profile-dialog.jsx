"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { User, Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRol } from "@/hooks/useRol";
import { createClient } from "@/lib/supabase/client";

export function EditProfileDialog({ open, onOpenChange, onSuccess }) {
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const { esVisitante } = useRol();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      nombre: "",
      apellido: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const watchPassword = watch("password");

  useEffect(() => {
    if (!open) return;

    const loadUserData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          setCurrentUser(user);

          const { data: profile } = await supabase
            .from("usuarios")
            .select("nombre, apellido")
            .eq("id", user.id)
            .maybeSingle();

          reset({
            nombre: profile?.nombre || user.user_metadata?.nombre || "",
            apellido: profile?.apellido || user.user_metadata?.apellido || "",
            email: user.email || "",
            password: "",
            confirmPassword: "",
          });
        }
      } catch (err) {
        console.error("Error cargando perfil:", err);
        toast.error("Error al cargar datos del perfil");
      }
    };

    loadUserData();
  }, [open, reset]);

  const onSubmit = async (data) => {
    if (!currentUser) return;
    if (esVisitante) {
      toast.error("Acceso restringido", {
        description:
          "Los usuarios con rol visitante no tienen permiso para editar su perfil.",
      });
      return;
    }
    setIsLoading(true);

    try {
      const profileResponse = await fetch("/api/usuarios/perfil", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre: data.nombre,
          apellido: data.apellido,
        }),
      });

      const profileResult = await profileResponse.json();

      if (!profileResponse.ok) {
        throw new Error(
          profileResult.error || "No se pudo actualizar el perfil",
        );
      }

      if (data.password) {
        const { error: authError } = await supabase.auth.updateUser({
          password: data.password,
        });
        if (authError) throw authError;
      }

      let successMessage = "¡Perfil actualizado exitosamente!";
      if (data.password) {
        successMessage += " Contraseña actualizada correctamente.";
      }

      toast.success(successMessage, {
        duration: 6000,
      });

      onOpenChange(false);

      if (onSuccess) {
        onSuccess();
      }

      router.refresh();
    } catch (error) {
      console.error("Error actualizando perfil:", error);
      toast.error("Error al guardar cambios", {
        description: error.message || "Por favor intente de nuevo.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-border rounded-xs bg-card max-h-144 overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="text-base font-bold font-mono uppercase tracking-tight text-foreground flex items-center gap-2">
            Configuración de Perfil
          </DialogTitle>
          <DialogDescription className="text-xs font-mono text-muted-foreground mt-1">
            Actualiza tus datos de usuario o cambia tu contraseña de acceso.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {esVisitante && (
            <div className="p-3 rounded-xs border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono text-xs">
              Los usuarios con rol visitante tienen perfil de solo lectura y no pueden modificar sus datos de acceso.
            </div>
          )}

          <div className="space-y-1.5">
            <Label
              htmlFor="nombre"
              className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-medium"
            >
              Nombre
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                id="nombre"
                type="text"
                disabled={esVisitante}
                placeholder="Nombre"
                className="pl-9 h-9 border-border rounded-xs font-mono text-xs focus:border-primary disabled:bg-muted disabled:cursor-not-allowed"
                {...register("nombre", {
                  required: "El nombre es obligatorio",
                })}
              />
            </div>
            {errors.nombre && (
              <p className="text-xs font-mono text-destructive">
                {errors.nombre.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="apellido"
              className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-medium"
            >
              Apellido
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                id="apellido"
                type="text"
                disabled={esVisitante}
                placeholder="Apellido"
                className="pl-9 h-9 border-border rounded-xs font-mono text-xs focus:border-primary disabled:bg-muted disabled:cursor-not-allowed"
                {...register("apellido")}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="email"
              className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-medium"
            >
              Correo Electrónico
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                disabled
                className="pl-9 h-9 border-border bg-muted text-muted-foreground rounded-xs font-mono text-xs cursor-not-allowed"
                {...register("email")}
              />
            </div>
          </div>

          <div className="border-t border-border pt-4 mt-4">
            <h4 className="text-xs font-mono uppercase tracking-wider font-semibold text-foreground mb-3">
              Cambiar Contraseña (Opcional)
            </h4>

            <div className="space-y-1.5 mb-3">
              <Label
                htmlFor="password"
                className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-medium"
              >
                Nueva Contraseña
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  disabled={esVisitante}
                  placeholder={esVisitante ? "No disponible para visitantes" : "Dejar vacío para no cambiar"}
                  className="pl-9 pr-9 h-9 border-border rounded-xs font-mono text-xs focus:border-primary disabled:bg-muted disabled:cursor-not-allowed"
                  {...register("password", {
                    minLength: {
                      value: 8,
                      message: "La contraseña debe tener al menos 8 caracteres",
                    },
                  })}
                />
                <button
                  type="button"
                  disabled={esVisitante}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground disabled:opacity-50 cursor-pointer"
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
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="confirmPassword"
                className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-medium"
              >
                Confirmar Nueva Contraseña
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  disabled={esVisitante}
                  placeholder={esVisitante ? "No disponible para visitantes" : "Confirmar nueva contraseña"}
                  className="pl-9 pr-9 h-9 border-border rounded-xs font-mono text-xs focus:border-primary disabled:bg-muted disabled:cursor-not-allowed"
                  {...register("confirmPassword", {
                    validate: (value) =>
                      !watchPassword ||
                      value === watchPassword ||
                      "Las contraseñas no coinciden",
                  })}
                />
                <button
                  type="button"
                  disabled={esVisitante}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground disabled:opacity-50 cursor-pointer"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs font-mono text-destructive">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="pt-4 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="h-9 rounded-xs font-mono text-xs uppercase tracking-wider"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading || esVisitante}
              className="h-9 rounded-xs bg-primary hover:bg-primary/90 text-primary-foreground font-mono text-xs uppercase tracking-wider disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar Cambios"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
