"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { LAYOUT_CLASSES } from "@/lib/constants";

export default function NuevoClientePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const clienteData = {
        nombre: data.name,
        telefono: data.phone,
        email: data.email,
        direccion: `${data.address}, ${data.city}`,
      };

      const response = await fetch("/api/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clienteData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al crear el cliente");
      }

      const newCliente = await response.json();

      toast.success("Cliente añadido exitosamente", {
        description: `${newCliente.nombre} ha sido registrado correctamente`,
      });

      reset();
      router.push("/dashboard/clientes");
    } catch (error) {
      console.error("Error guardando cliente:", error);
      toast.error("Error al guardar cliente", {
        description: error.message || "Ocurrió un problema al registrar el cliente",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={LAYOUT_CLASSES.PAGE_CONTAINER}>
      <PageHeader
        title="Nuevo Cliente"
        subtitle="Registra los detalles del nuevo cliente."
      />

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 min-w-0">
            <Card className="p-6 rounded-xs border border-border bg-card min-w-0">
              <div className="mb-4">
                <h2 className="text-sm font-semibold mb-4 text-foreground">Información Básica</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Nombre</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Nombre del cliente o empresa"
                      {...register("name", {
                        required: "El nombre es requerido",
                        minLength: {
                          value: 2,
                          message: "El nombre debe tener al menos 2 caracteres",
                        },
                      })}
                      disabled={isLoading}
                    />
                    {errors.name && (
                      <p className="text-xs text-destructive">{errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="contacto@cliente.com"
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
                </div>
              </div>

              <div className="mb-4">
                <h2 className="text-sm font-semibold mb-4 text-foreground">Contacto y Ubicación</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+591 2 2000000"
                      {...register("phone")}
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="city">Ciudad</Label>
                    <Input
                      id="city"
                      type="text"
                      placeholder="La Paz, Santa Cruz..."
                      {...register("city", { required: "La ciudad es requerida" })}
                      disabled={isLoading}
                    />
                    {errors.city && (
                      <p className="text-xs text-destructive">{errors.city.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <Label htmlFor="address">Dirección</Label>
                    <Input
                      id="address"
                      type="text"
                      placeholder="Calle, Número, Zona"
                      {...register("address", { required: "La dirección es requerida" })}
                      disabled={isLoading}
                    />
                    {errors.address && (
                      <p className="text-xs text-destructive">{errors.address.message}</p>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <div className="p-6 rounded-xs border border-border bg-card flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-semibold mb-2 text-foreground">Confirmar Registro</h3>
                <p className="text-xs text-muted-foreground mb-6">
                  Verifica que los datos del cliente sean precisos antes de guardar.
                </p>
              </div>

              <div className="space-y-3">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-foreground text-background hover:bg-foreground/90 text-xs font-mono uppercase tracking-wider h-9 rounded-xs"
                >
                  {isLoading ? "Guardando..." : "Guardar Cliente"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/dashboard/clientes")}
                  disabled={isLoading}
                  className="w-full text-xs font-mono uppercase tracking-wider h-9 rounded-xs"
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
