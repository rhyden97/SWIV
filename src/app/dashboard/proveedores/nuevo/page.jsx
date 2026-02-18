"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { LAYOUT_CLASSES } from "@/lib/constants";

export default function NuevoProveedorPage() {
  const router = useRouter();
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
      const proveedorData = {
        nombre: data.nombre,
        contacto: data.contacto || null,
        telefono: data.telefono,
        email: data.email,
        direccion: data.direccion,
        tiempo_entrega: data.tiempo_entrega ? parseInt(data.tiempo_entrega, 10) : null,
        costo_pedido: data.costo_pedido ? parseFloat(data.costo_pedido) : 0,
      };

      const response = await fetch("/api/proveedores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(proveedorData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al crear el proveedor");
      }

      const newProveedor = await response.json();

      toast.success("Proveedor añadido exitosamente", {
        description: `${newProveedor.nombre} ha sido registrado correctamente`,
      });

      reset();
      router.push("/dashboard/proveedores");
    } catch (error) {
      console.error("Error guardando proveedor:", error);
      toast.error("Error al guardar proveedor", {
        description: error.message || "Ocurrió un problema al registrar el proveedor",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={LAYOUT_CLASSES.PAGE_CONTAINER}>
      <PageHeader
        title="Nuevo Proveedor"
        subtitle="Registra los datos del nuevo proveedor."
      />

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 min-w-0 space-y-6">
            <div className="p-6 rounded-xs border border-border bg-card space-y-6">
              <div>
                <span className="font-mono text-xs uppercase text-muted-foreground tracking-wider block mb-1">
                  Datos de la Empresa
                </span>
                <h2 className="text-base font-semibold text-foreground mb-4">
                  Información de la Empresa
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="nombre" className="text-xs font-mono uppercase text-muted-foreground">
                      Nombre de la Empresa
                    </Label>
                    <Input
                      id="nombre"
                      type="text"
                      placeholder="Materiales Industriales S.A."
                      className="rounded-xs border-border bg-background font-mono text-xs h-9"
                      {...register("nombre", {
                        required: "El nombre de la empresa es requerido",
                        minLength: {
                          value: 2,
                          message: "El nombre debe tener al menos 2 caracteres",
                        },
                      })}
                      disabled={isLoading}
                    />
                    {errors.nombre && (
                      <p className="text-xs text-destructive">{errors.nombre.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="contacto" className="text-xs font-mono uppercase text-muted-foreground">
                      Persona de Contacto
                    </Label>
                    <Input
                      id="contacto"
                      type="text"
                      placeholder="Ing. Juan Pérez"
                      className="rounded-xs border-border bg-background font-mono text-xs h-9"
                      {...register("contacto")}
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>

              <div>
                <span className="font-mono text-xs uppercase text-muted-foreground tracking-wider block mb-1">
                  Contacto y Dirección
                </span>
                <h2 className="text-base font-semibold text-foreground mb-4">
                  Contacto y Ubicación
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs font-mono uppercase text-muted-foreground">
                      Email de Contacto
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="contacto@empresa.com"
                      className="rounded-xs border-border bg-background font-mono text-xs h-9"
                      {...register("email", {
                        required: "El email es requerido",
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: "Email inválido",
                        },
                      })}
                      disabled={isLoading}
                    />
                    {errors.email && (
                      <p className="text-xs text-destructive">{errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="telefono" className="text-xs font-mono uppercase text-muted-foreground">
                      Teléfono
                    </Label>
                    <Input
                      id="telefono"
                      type="tel"
                      placeholder="+591 2 2000000"
                      className="rounded-xs border-border bg-background font-mono text-xs h-9"
                      {...register("telefono", {
                        required: "El teléfono es requerido",
                      })}
                      disabled={isLoading}
                    />
                    {errors.telefono && (
                      <p className="text-xs text-destructive">{errors.telefono.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <Label htmlFor="direccion" className="text-xs font-mono uppercase text-muted-foreground">
                      Dirección
                    </Label>
                    <Input
                      id="direccion"
                      type="text"
                      placeholder="Zona Industrial Norte, Sector 5"
                      className="rounded-xs border-border bg-background font-mono text-xs h-9"
                      {...register("direccion", {
                        required: "La dirección es requerida",
                      })}
                      disabled={isLoading}
                    />
                    {errors.direccion && (
                      <p className="text-xs text-destructive">{errors.direccion.message}</p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <span className="font-mono text-xs uppercase text-muted-foreground tracking-wider block mb-1">
                  Logística y Abastecimiento
                </span>
                <h2 className="text-base font-semibold text-foreground mb-4">
                  Parámetros de Reposición
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="tiempo_entrega" className="text-xs font-mono uppercase text-muted-foreground">
                      Tiempo de Entrega (días)
                    </Label>
                    <Input
                      id="tiempo_entrega"
                      type="number"
                      placeholder="Ej. 5"
                      className="rounded-xs border-border bg-background font-mono text-xs h-9"
                      {...register("tiempo_entrega", {
                        min: { value: 0, message: "No puede ser negativo" },
                      })}
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="costo_pedido" className="text-xs font-mono uppercase text-muted-foreground">
                      Costo de Pedido (Bs.)
                    </Label>
                    <Input
                      id="costo_pedido"
                      type="number"
                      step="any"
                      placeholder="Ej. 120.00"
                      className="rounded-xs border-border bg-background font-mono text-xs h-9"
                      {...register("costo_pedido", {
                        min: { value: 0, message: "No puede ser negativo" },
                      })}
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-6 p-5 rounded-xs border border-border bg-card flex flex-col space-y-4">
              <div>
                <span className="font-mono text-xs uppercase text-muted-foreground tracking-wider block">
                  Ficha del Proveedor
                </span>
                <h3 className="text-base font-semibold text-foreground mt-0.5">
                  Confirmación de Registro
                </h3>
              </div>

              <div className="p-3.5 rounded-xs border border-border bg-muted/20">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Registra un nuevo proveedor en el catálogo homologado con sus parámetros de entrega y costos asociados.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full rounded-xs font-mono text-xs uppercase tracking-wider h-9"
                >
                  {isLoading ? "Guardando..." : "Guardar Proveedor"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/dashboard/proveedores")}
                  disabled={isLoading}
                  className="w-full rounded-xs font-mono text-xs uppercase tracking-wider h-9"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
