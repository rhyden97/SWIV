"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm, Controller } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { LAYOUT_CLASSES } from "@/lib/constants";
import RemoteSearchInput from "@/components/remote-search-input";

export default function NuevoInventarioPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
      proveedor_id: "",
      category: "",
      unit: "",
      stock: "",
      cost: "",
      price: "",
      image: null,
      es_perecedero: false,
    },
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const productoData = {
        nombre: data.name,
        descripcion: " ",
        ubicacion: data.ubicacion || null,
        sku: data.sku || null,
        stock_actual: parseInt(data.stock, 10) || 0,
        precio_venta:
          data.price !== "" && data.price !== undefined
            ? parseFloat(data.price)
            : data.cost
              ? parseFloat(data.cost) * 1.3
              : 0,
        costo_unitario_base:
          data.cost !== "" && data.cost !== undefined
            ? parseFloat(data.cost)
            : 0,
        proveedor_id: data.proveedor_id || null,
        clasificacion_abc: data.category || "C",
        unidad_medida: data.unit || null,
        punto_reorden: data.punto_reorden
          ? parseInt(data.punto_reorden, 10)
          : data.stock_minimo
            ? parseInt(data.stock_minimo, 10)
            : 10,
        eoq: data.eoq ? parseInt(data.eoq, 10) : null,
        stock_seguridad: data.stock_seguridad
          ? parseInt(data.stock_seguridad, 10)
          : null,
        es_perecedero: !!data.es_perecedero,
        dias_alerta_vencimiento: data.es_perecedero ? 30 : null,
      };

      const file = data.image && data.image.length ? data.image[0] : null;
      if (file) {
        try {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("bucket", "productos");
          formData.append("path", `productos/${Date.now()}_${file.name}`);

          const uploadRes = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });

          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            productoData.url_imagen = uploadData?.publicUrl || null;
          }
        } catch (imgErr) {
          console.error("Error subiendo imagen:", imgErr);
        }
      }

      const response = await fetch("/api/productos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productoData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al crear el producto");
      }

      const newProducto = await response.json();

      toast.success("Producto añadido exitosamente", {
        description: `${newProducto.nombre} ha sido registrado correctamente`,
      });

      reset();
      router.push("/dashboard/inventario");
    } catch (error) {
      console.error("Error saving inventory item:", error);
      toast.error("Error al guardar ítem", {
        description: error.message || "No se pudo agregar el ítem al inventario",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={LAYOUT_CLASSES.PAGE_CONTAINER}>
      <PageHeader
        title="Nuevo Ítem de Inventario"
        subtitle="Registra los detalles del nuevo ítem."
      />

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 min-w-0 space-y-6">
            <Card className="p-6 rounded-xs border border-border bg-card space-y-6">
              <div>
                <h2 className="text-sm font-semibold mb-4 text-foreground">Información Básica</h2>
                <div className="grid gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Nombre del Ítem</Label>
                    <Input
                      {...register("name", {
                        required: "El nombre del ítem es requerido",
                        minLength: {
                          value: 2,
                          message: "El nombre debe tener al menos 2 caracteres",
                        },
                      })}
                      placeholder="Ej. Batería 12V 75Ah"
                      disabled={isLoading}
                    />
                    {errors.name && (
                      <p className="text-xs text-destructive">{errors.name.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="proveedor_id">Proveedor</Label>
                      <Controller
                        name="proveedor_id"
                        control={control}
                        rules={{ required: "Selecciona un proveedor" }}
                        render={({ field }) => (
                          <RemoteSearchInput
                            value={field.value}
                            endpoint="/api/proveedores"
                            placeholder="Buscar proveedor..."
                            disabled={isLoading}
                            getOptionLabel={(p) => p.nombre}
                            renderOption={(p) => p.nombre}
                            onClearSelection={() => field.onChange("")}
                            onSelectOption={(p) => field.onChange(p.id)}
                          />
                        )}
                      />
                      {errors.proveedor_id && (
                        <p className="text-xs text-destructive">
                          {errors.proveedor_id.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="unit">Unidad de Medida</Label>
                      <Controller
                        name="unit"
                        control={control}
                        rules={{ required: "Selecciona una unidad" }}
                        render={({ field }) => (
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={isLoading}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Seleccionar unidad" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                <SelectLabel>Unidad</SelectLabel>
                                <SelectItem value="unidades">Unidades</SelectItem>
                                <SelectItem value="kg">Kilogramos (kg)</SelectItem>
                                <SelectItem value="litros">Litros (L)</SelectItem>
                                <SelectItem value="metros">Metros (m)</SelectItem>
                                <SelectItem value="cajas">Cajas</SelectItem>
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="ubicacion">Ubicación</Label>
                      <Input
                        {...register("ubicacion")}
                        placeholder="Pasillo A-3 (Opcional)"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-sm font-semibold mb-4 text-foreground">Inventario y Costos</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="stock">Stock Inicial</Label>
                    <Input
                      type="number"
                      {...register("stock", {
                        required: "El stock es requerido",
                        min: { value: 0, message: "No puede ser negativo" },
                      })}
                      placeholder="0"
                      disabled={isLoading}
                    />
                    {errors.stock && (
                      <p className="text-xs text-destructive">{errors.stock.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="cost">Costo Unitario (Bs.)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      {...register("cost", {
                        required: "El costo es requerido",
                        min: { value: 0.01, message: "Debe ser mayor a 0" },
                      })}
                      placeholder="0.00"
                      disabled={isLoading}
                    />
                    {errors.cost && (
                      <p className="text-xs text-destructive">{errors.cost.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="price">Precio de Venta (Bs.)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      {...register("price", {
                        required: "El precio es requerido",
                        min: { value: 0.01, message: "Debe ser mayor a 0" },
                      })}
                      placeholder="0.00"
                      disabled={isLoading}
                    />
                    {errors.price && (
                      <p className="text-xs text-destructive">{errors.price.message}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <div className="flex items-center space-x-2">
                  <Controller
                    name="es_perecedero"
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        id="es_perecedero"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isLoading}
                      />
                    )}
                  />
                  <Label htmlFor="es_perecedero" className="text-xs font-mono cursor-pointer">
                    Producto perecedero (alerta de vencimiento a 30 días)
                  </Label>
                </div>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-6 p-5 rounded-xs border border-border bg-card flex flex-col space-y-4">
              <div>
                <span className="font-mono text-xs uppercase text-muted-foreground tracking-wider block">
                  Inventario
                </span>
                <h3 className="text-base font-semibold text-foreground mt-0.5">
                  Confirmar Producto
                </h3>
              </div>

              <div className="p-3.5 rounded-xs border border-border bg-muted/20">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Registra un nuevo producto con su stock y costos base para el control de inventario y reposición.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full rounded-xs font-mono text-xs uppercase tracking-wider h-9"
                >
                  {isLoading ? "Guardando..." : "Guardar Ítem"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/dashboard/inventario")}
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
