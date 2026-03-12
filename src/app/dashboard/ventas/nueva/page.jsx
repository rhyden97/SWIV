"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus, Trash } from "lucide-react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { LAYOUT_CLASSES } from "@/lib/constants";
import RemoteSearchInput from "@/components/remote-search-input";
import { useHotkeys } from "@/hooks/useHotkeys";
import { mergeUniqueById } from "@/lib/utils";
import { generateSaleReceiptPDF } from "@/lib/reportUtils";

export default function NuevaVentaPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [clientesCache, setClientesCache] = useState([]);
  const [productosCache, setProductosCache] = useState([]);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      cliente_id: "",
      metodo_pago: "",
      items: [{ producto_id: "", cantidad: "", precio_unitario: "" }],
      observaciones: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const handleAddItem = () => {
    append({ producto_id: "", cantidad: "", precio_unitario: "" });
  };

  useHotkeys({
    F2: () => {
      handleAddItem();
    },
    F4: () => {
      handleSubmit(onSubmit)();
    },
  });

  const watchedItems = watch("items");

  const calculateSubtotal = (index) => {
    const cantidad = parseFloat(watchedItems[index]?.cantidad || 0);
    const precioUnitario = parseFloat(
      watchedItems[index]?.precio_unitario || 0,
    );
    return (cantidad * precioUnitario).toFixed(2);
  };

  const calculateTotal = () => {
    return watchedItems
      .reduce((total, item) => {
        const cantidad = parseFloat(item?.cantidad || 0);
        const precioUnitario = parseFloat(item?.precio_unitario || 0);
        return total + cantidad * precioUnitario;
      }, 0)
      .toFixed(2);
  };

  const calculateGrandTotal = () => {
    return calculateTotal();
  };

  const subirYGuardarRecibo = async (ventaId, archivoBlob) => {
    try {
      const formData = new FormData();
      formData.append("file", archivoBlob, `${ventaId}.pdf`);
      formData.append("bucket", "recibos");
      formData.append("path", `${ventaId}.pdf`);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        const uploadErr = await uploadRes.json().catch(() => ({}));
        throw new Error(uploadErr.error || "Error al subir recibo de venta");
      }

      const { publicUrl } = await uploadRes.json();

      const patchResponse = await fetch("/api/ventas", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: ventaId, url_recibo: publicUrl }),
      });

      if (!patchResponse.ok) {
        const errorData = await patchResponse.json();
        throw new Error(
          errorData.error || "Error al actualizar la venta con el PDF",
        );
      }

      return publicUrl;
    } catch (error) {
      console.error("Error subiendo PDF recibo:", error.message);
      throw error;
    }
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const ventaData = {
        cliente_id: data.cliente_id,
        metodo_pago: data.metodo_pago || null,
        items: data.items.map((item) => ({
          producto_id: item.producto_id,
          cantidad: parseInt(item.cantidad),
          precio_unitario: parseFloat(item.precio_unitario),
        })),
      };

      const response = await fetch("/api/ventas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(ventaData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al crear la venta");
      }

      const newVenta = await response.json();

      const isCancelled = newVenta.metodo_pago === "cancelada";

      if (isCancelled) {
        toast.warning("¡Venta registrada como CANCELADA!", {
          description: `Venta registrada por falta de stock. Total: Bs ${calculateGrandTotal()}`,
        });
      } else {
        toast.success("¡Venta registrada exitosamente!", {
          description: `Venta creada por un total de Bs ${calculateGrandTotal()}`,
        });
      }

      try {
        const receiptData = {
          id: newVenta.id,
          date: newVenta.fecha_venta,
          customerName:
            clienteSeleccionado?.nombre ||
            clientesCache.find((c) => c.id === data.cliente_id)?.nombre ||
            "Cliente",
          paymentMethod: newVenta.metodo_pago || data.metodo_pago || "efectivo",
          items: data.items.map((item) => {
            const producto = productosCache.find(
              (p) => p.id === item.producto_id,
            );
            const cantidad = parseFloat(item.cantidad);
            const precioUnitario = parseFloat(item.precio_unitario);
            return {
              product: producto?.nombre || "",
              quantity: cantidad,
              unitPrice: precioUnitario,
              subtotal: cantidad * precioUnitario,
            };
          }),
          total: calculateGrandTotal(),
          observations: data.observaciones || "",
        };

        const pdfBlob = generateSaleReceiptPDF(receiptData, true);

        const publicUrl = await subirYGuardarRecibo(newVenta.id, pdfBlob);

        toast.success("Recibo generado y guardado", {
          description: "El recibo se guardó correctamente",
        });
      } catch (pdfError) {
        console.error("Error generando PDF:", pdfError);
        toast.warning("Venta registrada pero no se pudo generar el recibo");
      }

      reset();
      router.push("/dashboard/ventas");
    } catch (error) {
      console.error("Error saving sale:", error);
      toast.error("Error al registrar venta", {
        description:
          error.message || "No se pudo completar el registro de la venta",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveItem = (index) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  return (
    <div className={LAYOUT_CLASSES.PAGE_CONTAINER}>
      <PageHeader
        title="Nueva Venta"
        subtitle="Registro de nueva transacción comercial."
      />

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 min-w-0">
            <div className="border border-border bg-card rounded-xs p-5 flex flex-col min-w-0">
              <div className="mb-6">
                <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
                  <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                    Parámetros de Venta
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 text-xs font-mono bg-muted text-muted-foreground border border-border rounded-xs">
                      [F2] AGREGAR ITEM
                    </span>
                    <span className="px-1.5 py-0.5 text-xs font-mono bg-primary/10 text-primary border border-primary/20 rounded-xs">
                      [F4] PROCESAR
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="cliente_id" className="text-xs font-mono uppercase text-muted-foreground">
                      Cliente Destino
                    </Label>
                    <Controller
                      name="cliente_id"
                      control={control}
                      rules={{ required: "Selecciona un cliente" }}
                      render={({ field }) => (
                        <RemoteSearchInput
                          value={field.value}
                          endpoint="/api/clientes"
                          placeholder="Buscar cliente por nombre o NIT..."
                          disabled={isLoading}
                          getOptionLabel={(cliente) => cliente.nombre}
                          onClearSelection={() => {
                            field.onChange("");
                            setClienteSeleccionado(null);
                          }}
                          onSelectOption={(cliente) => {
                            field.onChange(cliente.id);
                            setClienteSeleccionado(cliente);
                            setClientesCache((current) =>
                              mergeUniqueById(current, [cliente]),
                            );
                          }}
                          onResultsLoaded={(results) =>
                            setClientesCache((current) =>
                              mergeUniqueById(current, results),
                            )
                          }
                        />
                      )}
                    />
                    {errors.cliente_id && (
                      <p className="text-xs font-mono text-destructive">
                        {errors.cliente_id.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="metodo_pago" className="text-xs font-mono uppercase text-muted-foreground">
                      Método de Pago
                    </Label>
                    <Controller
                      name="metodo_pago"
                      control={control}
                      rules={{ required: "Selecciona un método de pago" }}
                      render={({ field }) => (
                        <select
                          className="flex h-10 w-full rounded-xs border border-border bg-background px-3 py-2 text-xs font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                          onChange={field.onChange}
                          value={field.value}
                          disabled={isLoading}
                        >
                          <option value="">Seleccionar método</option>
                          <option value="efectivo">EFECTIVO</option>
                          <option value="qr">QR</option>
                          <option value="tarjeta">TARJETA</option>
                          <option value="por pagar">POR PAGAR</option>
                        </select>
                      )}
                    />
                    {errors.metodo_pago && (
                      <p className="text-xs font-mono text-destructive">
                        {errors.metodo_pago.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex-1 flex flex-col min-w-0">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-border pb-3 mb-3 gap-2">
                  <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                    Detalle de Items ({fields.length})
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleAddItem}
                    className="h-8 px-3 rounded-xs border-border bg-background hover:bg-muted font-mono text-xs uppercase cursor-pointer"
                    disabled={isLoading}
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" /> Agregar Item [F2]
                  </Button>
                </div>

                <div className="overflow-x-auto -mx-2 px-2">
                  <div
                    className="border border-border bg-muted/40 py-2 px-3 text-xs font-mono uppercase text-muted-foreground grid grid-cols-12 gap-3 items-center rounded-xs mb-3"
                    style={{ minWidth: 650 }}
                  >
                    <div className="col-span-5">Producto / SKU</div>
                    <div className="col-span-2">Cantidad</div>
                    <div className="col-span-2">Precio Unit.</div>
                    <div className="col-span-2 text-right">Subtotal</div>
                    <div className="col-span-1"></div>
                  </div>

                  <div
                    className="space-y-2 flex-1 overflow-y-auto pr-1"
                    style={{ maxHeight: 420 }}
                  >
                    {fields.map((item, index) => (
                      <div
                        key={item.id}
                        className="p-2 border border-border bg-card rounded-xs"
                      >
                        <div
                          className="grid grid-cols-12 gap-3 items-center"
                          style={{ minWidth: 650 }}
                        >
                          <div className="col-span-5">
                            <Controller
                              name={`items.${index}.producto_id`}
                              control={control}
                              rules={{ required: "El producto es requerido" }}
                              render={({ field }) => (
                                <RemoteSearchInput
                                  value={field.value}
                                  endpoint="/api/productos"
                                  placeholder="Buscar SKU o nombre..."
                                  disabled={isLoading}
                                  getOptionLabel={(producto) => producto.nombre}
                                  renderOptionLabel={(producto) =>
                                    `${producto.nombre} (Stock: ${producto.stock_actual})`
                                  }
                                  onClearSelection={() => {
                                    field.onChange("");
                                  }}
                                  onSelectOption={(producto) => {
                                    field.onChange(producto.id);
                                    setProductosCache((current) =>
                                      mergeUniqueById(current, [producto]),
                                    );
                                    setValue(
                                      `items.${index}.precio_unitario`,
                                      producto.precio_venta,
                                      {
                                        shouldDirty: true,
                                        shouldValidate: true,
                                      },
                                    );
                                  }}
                                  onResultsLoaded={(results) =>
                                    setProductosCache((current) =>
                                      mergeUniqueById(current, results),
                                    )
                                  }
                                />
                              )}
                            />
                            {errors.items?.[index]?.producto_id && (
                              <p className="text-xs font-mono text-destructive mt-1">
                                {errors.items[index].producto_id.message}
                              </p>
                            )}
                          </div>

                          <div className="col-span-2">
                            <Input
                              type="number"
                              {...register(`items.${index}.cantidad`, {
                                required: "Requerido",
                                min: {
                                  value: 1,
                                  message: "Min 1",
                                },
                              })}
                              placeholder="0"
                              className="bg-background border-border rounded-xs text-xs font-mono"
                              disabled={isLoading}
                            />
                            {errors.items?.[index]?.cantidad && (
                              <p className="text-xs font-mono text-destructive mt-1">
                                {errors.items[index].cantidad.message}
                              </p>
                            )}
                          </div>

                          <div className="col-span-2">
                            <Input
                              type="number"
                              step="0.01"
                              {...register(`items.${index}.precio_unitario`, {
                                required: "Requerido",
                                min: {
                                  value: 0.01,
                                  message: "Min 0.01",
                                },
                              })}
                              placeholder="0.00"
                              className="bg-background border-border rounded-xs text-xs font-mono"
                              disabled={isLoading}
                            />
                            {errors.items?.[index]?.precio_unitario && (
                              <p className="text-xs font-mono text-destructive mt-1">
                                {errors.items[index].precio_unitario.message}
                              </p>
                            )}
                          </div>

                          <div className="col-span-2">
                            <Input
                              value={`Bs ${calculateSubtotal(index)}`}
                              readOnly
                              className="bg-muted/40 border-border font-mono font-medium text-xs text-foreground rounded-xs text-right tabular-nums"
                            />
                          </div>

                          <div className="col-span-1 flex items-center justify-center">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xs cursor-pointer"
                              disabled={fields.length === 1 || isLoading}
                              onClick={() => handleRemoveItem(index)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-6 p-5 rounded-xs border border-border bg-card space-y-5">
              <div className="border-b border-border pb-3">
                <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  Liquidación de Transacción
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-border text-xs font-mono">
                  <span className="text-muted-foreground uppercase">
                    Subtotal Bruto
                  </span>
                  <span className="tabular-nums font-medium text-foreground">
                    Bs {calculateTotal()}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border text-xs font-mono">
                  <span className="text-muted-foreground uppercase">
                    Impuestos / IVA
                  </span>
                  <span className="tabular-nums text-muted-foreground">
                    Incluido
                  </span>
                </div>
              </div>

              <div className="py-4 px-4 rounded-xs bg-muted/40 border border-border">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                    Total a Cobrar
                  </span>
                  <span className="text-2xl font-mono tabular-nums font-bold text-foreground">
                    Bs {calculateGrandTotal()}
                  </span>
                </div>
              </div>

              <div className="space-y-2.5 pt-2">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-mono font-medium uppercase tracking-wider rounded-xs h-11 transition-colors cursor-pointer shadow-none"
                >
                  {isLoading ? "Procesando..." : "Completar Venta [F4]"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/dashboard/ventas")}
                  disabled={isLoading}
                  className="w-full border border-border bg-background hover:bg-muted text-foreground text-xs font-mono uppercase rounded-xs h-10 transition-colors cursor-pointer"
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
