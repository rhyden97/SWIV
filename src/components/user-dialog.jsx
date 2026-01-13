import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "./ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UserRoundPlus } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { useState } from "react";
import { toast } from "sonner";

export default function DialogUsers({ onUserCreated }) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/usuarios/crear", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: data.email,
          nombre: data.nombre,
          apellido: data.apellido,
          rol: data.role,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Error al crear usuario");
      }

      if (result.warning) {
        toast.warning("Usuario creado pero el correo falló", {
          description: `Credenciales: ${result.credenciales.email} / ${result.credenciales.password}`,
          duration: 10000,
        });
      } else {
        toast.success("¡Usuario creado exitosamente!", {
          description: `Se ha enviado un correo a ${data.email} con las credenciales`,
        });
      }

      if (onUserCreated) {
        onUserCreated();
      }

      setOpen(false);
      reset();
    } catch (error) {
      console.error("Error creando usuario:", error);
      toast.error("Error al crear usuario", {
        description:
          error.message || "No se pudo crear el usuario. Intenta nuevamente.",
      });
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-9 rounded-xs font-mono text-xs uppercase tracking-wider bg-primary hover:bg-primary/90 text-primary-foreground touch-manipulation">
          <UserRoundPlus className="mr-1.5 h-3.5 w-3.5" />
          Añadir Usuario
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-xs border-border bg-card p-6">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle className="text-base font-semibold tracking-tight font-mono uppercase text-foreground">Crear Nuevo Usuario</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground font-mono mt-1">
              Completa los datos del usuario. Se enviará un correo con la
              contraseña generada.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nombre" className="text-xs font-mono uppercase text-muted-foreground">Nombre</Label>
              <Input
                id="nombre"
                type="text"
                placeholder="Juan"
                className="h-9 rounded-xs border-border bg-background text-xs font-mono text-foreground focus:border-primary"
                {...register("nombre", {
                  required: "El nombre es requerido",
                })}
              />
              {errors.nombre && (
                <p className="text-xs font-mono text-destructive">{errors.nombre.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="apellido" className="text-xs font-mono uppercase text-muted-foreground">Apellido</Label>
              <Input
                id="apellido"
                type="text"
                placeholder="Pérez"
                className="h-9 rounded-xs border-border bg-background text-xs font-mono text-foreground focus:border-primary"
                {...register("apellido", {
                  required: "El apellido es requerido",
                })}
              />
              {errors.apellido && (
                <p className="text-xs font-mono text-destructive">
                  {errors.apellido.message}
                </p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email" className="text-xs font-mono uppercase text-muted-foreground">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="juan.perez@example.com"
                className="h-9 rounded-xs border-border bg-background text-xs font-mono text-foreground focus:border-primary"
                {...register("email", {
                  required: "El email es requerido",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Email inválido",
                  },
                })}
              />
              {errors.email && (
                <p className="text-xs font-mono text-destructive">{errors.email.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role" className="text-xs font-mono uppercase text-muted-foreground">Rol</Label>
              <Controller
                name="role"
                control={control}
                rules={{ required: "El rol es requerido" }}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="h-9 rounded-xs border-border bg-background text-xs font-mono text-foreground focus:border-primary">
                      <SelectValue placeholder="Seleccionar un rol" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xs border-border bg-popover text-xs font-mono">
                      <SelectGroup>
                        <SelectLabel className="text-xs font-mono uppercase text-muted-foreground">Roles</SelectLabel>
                        <SelectItem value="administrador">
                          Administrador
                        </SelectItem>
                        <SelectItem value="almacen">Almacén</SelectItem>
                        <SelectItem value="ventas">Ventas</SelectItem>
                        <SelectItem value="visitante">Visitante</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.role && (
                <p className="text-xs font-mono text-destructive">{errors.role.message}</p>
              )}
            </div>
          </div>
          <DialogFooter className="mt-2 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
              className="h-9 rounded-xs font-mono text-xs uppercase tracking-wider touch-manipulation"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="h-9 rounded-xs font-mono text-xs uppercase tracking-wider bg-primary hover:bg-primary/90 text-primary-foreground touch-manipulation"
            >
              {isLoading ? "Creando..." : "Crear Usuario"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
