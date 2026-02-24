"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import RemoteSearchInput from "@/components/remote-search-input";
import { Plus, Trash } from "lucide-react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { LAYOUT_CLASSES } from "@/lib/constants";
import { Loader } from "@/components/ui/loader";
import { mergeUniqueById } from "@/lib/utils";
import { generatePurchaseOrderPDF } from "@/lib/reportUtils";

export default function NuevaOrdenCompraPage() {
  return (
    <Suspense
      fallback={
        <div className={LAYOUT_CLASSES.PAGE_CONTAINER}>
          <Loader columns={4} rows={6} />
        </div>
      }
    >
      <NuevaOrdenCompraPageContent />
    </Suspense>
  );
}

function NuevaOrdenCompraPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedProductId = searchParams.get("productoId");

  const [isLoading, setIsLoading] = useState(false);
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState(null);
  const [proveedoresCache, setProveedoresCache] = useState([]);
  const [productosCache, setProductosCache] = useState([]);

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    setValue,
    getValues,
    formState: { errors },
  } = useForm({
    defaultValues: {
      proveedor_id: "",
      fecha_entrega_estimada: "",
      items: [{ producto_id: "", cantidad: "", costo_unitario: "" }],
      notas: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const watchedItems = watch("items");
  const watchedProveedor = watch("proveedor_id");

  useEffect(() => {
    if (!preselectedProductId) return;

    const fetchPreselectedProduct = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/productos?id=${preselectedProductId}`,
        );
        if (!response.ok)
          throw new Error("Error al cargar producto preseleccionado");
        const data = await response.json();

        if (data && data.length > 0) {
          const producto = data[0];

          setProductosCache((current) => mergeUniqueById(current, [producto]));

          setValue("items.0.producto_id", producto.id, {
            shouldDirty: true,
            shouldValidate: true,
          });

          const costo =
            producto.costo_unitario_base || producto.precio_venta || 0;
          setValue("items.0.costo_unitario", costo.toString(), {
            shouldDirty: true,
            shouldValidate: true,
          });

          const eoqCantidad = producto.eoq || 1;
          setValue("items.0.cantidad", eoqCantidad.toString(), {
            shouldDirty: true,
            shouldValidate: true,
          });

          if (producto.proveedor_id) {
            setValue("proveedor_id", producto.proveedor_id, {
              shouldDirty: true,
              shouldValidate: true,
            });

            if (producto.proveedor) {
              setProveedorSeleccionado(producto.proveedor);
              setProveedoresCache((current) =>
                mergeUniqueById(current, [producto.proveedor]),
              );

              const diasEntrega = producto.proveedor.tiempo_entrega || 7;
              const fechaEstimada = new Date();
              fechaEstimada.setDate(fechaEstimada.getDate() + diasEntrega);
              const fechaFormateada = fechaEstimada.toISOString().split("T")[0];
              setValue("fecha_entrega_estimada", fechaFormateada);
            }
          }

          toast.success(`Producto "${producto.nombre}" preseleccionado`);
        }
      } catch (error) {
        console.error("Error fetching preselected product:", error);
        toast.error("No se pudo cargar el producto preseleccionado");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPreselectedProduct();
  }, [preselectedProductId, setValue]);

  const calculateSubtotal = (index) => {
    const cantidad = parseFloat(watchedItems[index]?.cantidad || 0);
    const costoUnitario = parseFloat(watchedItems[index]?.costo_unitario || 0);
    return (cantidad * costoUnitario).toFixed(2);
  };

  const calculateTotal = () => {
    return watchedItems
      .reduce((total, item) => {
        const cantidad = parseFloat(item?.cantidad || 0);
        const costoUnitario = parseFloat(item?.costo_unitario || 0);
        return total + cantidad * costoUnitario;
      }, 0)
      .toFixed(2);
  };

  const calculateGrandTotal = () => {
    const totalItems = parseFloat(calculateTotal());
    const costoPedido = proveedorSeleccionado ? parseFloat(proveedorSeleccionado.costo_pedido || 0) : 0;
    return (totalItems + costoPedido).toFixed(2);
  };

  const subirYGuardarOrdenPDF = async (ordenId, archivoBlob) => {
    try {
      const formData = new FormData();
      formData.append("file", archivoBlob, `${ordenId}.pdf`);
      formData.append("bucket", "ordenes_compra");
      formData.append("path", `ordenes_compra/${ordenId}.pdf`);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        const uploadErr = await uploadRes.json().catch(() => ({}));
        throw new Error(uploadErr.error || "Error al subir la orden de compra");
      }

      const { publicUrl } = await uploadRes.json();

      const patchResponse = await fetch("/api/ordenes-compra", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: ordenId, url_comprobante: publicUrl }),
      });

      if (!patchResponse.ok) {
        const errorData = await patchResponse.json();
        throw new Error(
          errorData.error || "Error al actualizar la orden con el PDF",
        );
      }

      return publicUrl;
    } catch (error) {
      console.error("Error subiendo PDF orden:", error.message);
      throw error;
    }
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const ordenData = {
        proveedor_id: data.proveedor_id,
        fecha_entrega_estimada: data.fecha_entrega_estimada || null,
        estado: "emitida",
        notas: data.notas || null,
        items: data.items.map((item) => ({
          producto_id: item.producto_id,
          cantidad: parseInt(item.cantidad),
          costo_unitario: parseFloat(item.costo_unitario),
        })),
      };

      const response = await fetch("/api/ordenes-compra", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(ordenData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al crear la orden de compra");
      }

      const newOrden = await response.json();

      toast.success("¡Orden de compra registrada exitosamente!", {
        description: `Orden creada por un total de Bs. ${calculateGrandTotal()}`,
      });

      try {
        const pdfData = {
          id: newOrden.id,
          date: newOrden.fecha_orden,
          expectedDate: data.fecha_entrega_estimada,
          supplier:
            proveedorSeleccionado?.nombre ||
            proveedoresCache.find((p) => p.id === data.proveedor_id)?.nombre ||
            "Proveedor",
          items: data.items.map((item) => {
            const producto = productosCache.find(
              (p) => p.id === item.producto_id,
            );
            const cantidad = parseFloat(item.cantidad);
            const costoUnitario = parseFloat(item.costo_unitario);
            return {
              product: producto?.nombre || "",
              quantity: cantidad,
              unitCost: costoUnitario,
              subtotal: cantidad * costoUnitario,
            };
          }),
          total: calculateGrandTotal(),
          observations: data.notas || "",
        };

        const pdfBlob = generatePurchaseOrderPDF(pdfData, true);

        const publicUrl = await subirYGuardarOrdenPDF(newOrden.id, pdfBlob);

        toast.success("PDF de orden generado y guardado", {
          description: "La orden se guardó correctamente",
        });
      } catch (pdfError) {
        console.error("Error generando PDF:", pdfError);
        toast.warning("Orden registrada pero no se pudo generar el PDF");
      }

      reset();
      router.push("/dashboard/ordenes-de-compra");
    } catch (error) {
      console.error("Error saving orden:", error);
      toast.error("Error al registrar orden de compra", {
        description: error.message || "No se pudo completar el registro",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddItem = () => {
    append({ producto_id: "", cantidad: "", costo_unitario: "" });
  };

  const handleRemoveItem = (index) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  return (
    <div className={LAYOUT_CLASSES.PAGE_CONTAINER}>
      <PageHeader
        title="Nueva Orden de Compra"
        subtitle="Registra los detalles de la orden de compra."
      />

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 min-w-0">
            <div className="p-6 rounded-xs border border-border bg-card h-full flex flex-col min-w-0">
              <div className="flex-1 flex flex-col min-w-0 mb-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
                  <div>
                    <span className="font-mono text-xs uppercase text-muted-foreground tracking-wider block">
                      Líneas de Compra
                    </span>
                    <h2 className="text-base font-semibold text-foreground mt-0.5">
                      Lista de Productos
                    </h2>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddItem}
                    className="rounded-xs h-8 px-3 font-mono text-xs uppercase tracking-wider whitespace-nowrap"
                    disabled={isLoading}
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" /> Agregar Producto
                  </Button>
                </div>

                <div className="space-y-4 flex-1 overflow-y-auto max-h-112 pr-2">
                  {fields.map((item, index) => (
                    <div key={item.id} className="mb-4 space-y-4">
                      <div className="flex items-between gap-4 py-2">
                        <div className="flex-1 space-y-2">
                          <Label>Producto</Label>
                          <Controller
                            name={`items.${index}.producto_id`}
                            control={control}
                            rules={{ required: "El producto es requerido" }}
                            render={({ field }) => (
                              <RemoteSearchInput
                                value={field.value}
                                valueLabel={
                                  productosCache.find(
                                    (p) => p.id === field.value,
                                  )?.nombre || ""
                                }
                                endpoint="/api/productos"
                                queryParams={{ proveedorId: watchedProveedor }}
                                placeholder="Escribe para buscar producto"
                                disabled={isLoading}
                                getOptionLabel={(producto) => producto.nombre}
                                theme="ORDENES"
                                onClearSelection={() => {
                                  field.onChange("");
                                  const currentItems = getValues("items") || [];
                                  const hasOtherProducts = currentItems.some(
                                    (item) => item.producto_id,
                                  );
                                  if (!hasOtherProducts) {
                                    setValue("proveedor_id", "");
                                    setProveedorSeleccionado(null);
                                    setValue("fecha_entrega_estimada", "");
                                  }
                                }}
                                onSelectOption={(producto) => {
                                  field.onChange(producto.id);
                                  setProductosCache((current) =>
                                    mergeUniqueById(current, [producto]),
                                  );

                                  const costo =
                                    producto.costo_unitario_base ||
                                    producto.precio_venta ||
                                    0;
                                  setValue(
                                    `items.${index}.costo_unitario`,
                                    costo.toString(),
                                    {
                                      shouldDirty: true,
                                      shouldValidate: true,
                                    },
                                  );

                                  const eoqCantidad = producto.eoq || 1;
                                  setValue(
                                    `items.${index}.cantidad`,
                                    eoqCantidad.toString(),
                                    {
                                      shouldDirty: true,
                                      shouldValidate: true,
                                    },
                                  );

                                  if (producto.proveedor_id) {
                                    setValue(
                                      "proveedor_id",
                                      producto.proveedor_id,
                                      {
                                        shouldDirty: true,
                                        shouldValidate: true,
                                      },
                                    );

                                    if (producto.proveedor) {
                                      setProveedorSeleccionado(
                                        producto.proveedor,
                                      );
                                      setProveedoresCache((current) =>
                                        mergeUniqueById(current, [
                                          producto.proveedor,
                                        ]),
                                      );

                                      const diasEntrega =
                                        producto.proveedor.tiempo_entrega ||
                                        7;
                                      const fechaEstimada = new Date();
                                      fechaEstimada.setDate(
                                        fechaEstimada.getDate() + diasEntrega,
                                      );
                                      const fechaFormateada = fechaEstimada
                                        .toISOString()
                                        .split("T")[0];
                                      setValue(
                                        "fecha_entrega_estimada",
                                        fechaFormateada,
                                      );
                                    }
                                  }
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
                            <p className="text-xs text-red-500">
                              {errors.items[index].producto_id.message}
                            </p>
                          )}
                        </div>

                        <div className="pt-5 flex items-center">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-red-600 bg-red-100 hover:bg-red-200 hover:text-red-700"
                            disabled={fields.length === 1 || isLoading}
                            onClick={() => {
                              handleRemoveItem(index);
                              setTimeout(() => {
                                const currentItems = getValues("items") || [];
                                const hasOtherProducts = currentItems.some(
                                  (item) => item.producto_id,
                                );
                                if (!hasOtherProducts) {
                                  setValue("proveedor_id", "");
                                  setProveedorSeleccionado(null);
                                  setValue("fecha_entrega_estimada", "");
                                }
                              }, 0);
                            }}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`items.${index}.cantidad`}>
                            Cantidad
                          </Label>
                          <Input
                            type="number"
                            {...register(`items.${index}.cantidad`, {
                              required: "Requerido",
                              min: {
                                value: 1,
                                message: "Mínimo 1",
                              },
                            })}
                            placeholder="0"
                            className="w-full bg-gray-100 border-gray-300"
                            disabled={isLoading}
                          />
                          {errors.items?.[index]?.cantidad && (
                            <p className="text-xs text-red-500">
                              {errors.items[index].cantidad.message}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`items.${index}.costo_unitario`}>
                            Costo Unit. (Bs.)
                          </Label>
                          <Input
                            type="number"
                            step="0.01"
                            {...register(`items.${index}.costo_unitario`, {
                              required: "Requerido",
                              min: {
                                value: 0.01,
                                message: "Mínimo 0.01",
                              },
                            })}
                            placeholder="0.00"
                            className="w-full bg-gray-100 border-gray-300"
                            disabled={isLoading}
                          />
                          {errors.items?.[index]?.costo_unitario && (
                            <p className="text-xs text-red-500">
                              {errors.items[index].costo_unitario.message}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label>Subtotal</Label>
                          <Input
                            value={`Bs. ${calculateSubtotal(index)}`}
                            readOnly
                            className="bg-gray-100 border-gray-300 font-semibold text-gray-900"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200">
                <h3 className="text-lg font-bold mb-6">Datos de la orden</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="proveedor_id">Proveedor</Label>
                    <Controller
                      name="proveedor_id"
                      control={control}
                      rules={{ required: "Selecciona un proveedor" }}
                      render={({ field }) => (
                        <RemoteSearchInput
                          value={field.value}
                          valueLabel={proveedorSeleccionado?.nombre}
                          endpoint="/api/proveedores"
                          placeholder={
                            watchedItems.some((item) => item.producto_id)
                              ? "Proveedor fijado por el producto seleccionado"
                              : "Escribe para buscar proveedor"
                          }
                          disabled={
                            isLoading ||
                            watchedItems.some((item) => item.producto_id)
                          }
                          getOptionLabel={(proveedor) => proveedor.nombre}
                          theme="ORDENES"
                          onClearSelection={() => {
                            field.onChange("");
                            setProveedorSeleccionado(null);
                          }}
                          onSelectOption={(proveedor) => {
                            field.onChange(proveedor.id);
                            setProveedorSeleccionado(proveedor);
                            setProveedoresCache((current) =>
                              mergeUniqueById(current, [proveedor]),
                            );

                            const diasEntrega =
                              proveedor.tiempo_entrega || 7;
                            const fechaEstimada = new Date();
                            fechaEstimada.setDate(
                              fechaEstimada.getDate() + diasEntrega,
                            );
                            const fechaFormateada = fechaEstimada
                              .toISOString()
                              .split("T")[0];
                            setValue("fecha_entrega_estimada", fechaFormateada);
                          }}
                          onResultsLoaded={(results) =>
                            setProveedoresCache((current) =>
                              mergeUniqueById(current, results),
                            )
                          }
                        />
                      )}
                    />
                    {errors.proveedor_id && (
                      <p className="text-sm text-red-500">
                        {errors.proveedor_id.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fecha_entrega_estimada">
                      Fecha Entrega Estimada
                    </Label>
                    <Input
                      type="date"
                      {...register("fecha_entrega_estimada")}
                      className="bg-gray-100 border-gray-300"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2 mt-4">
                  <Label htmlFor="notas">Observaciones</Label>
                  <Textarea
                    {...register("notas")}
                    placeholder="Notas adicionales sobre la orden..."
                    className="bg-gray-100 border-gray-300 min-h-20"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-6 p-5 rounded-xs border border-border bg-card flex flex-col space-y-4">
              <div>
                <span className="font-mono text-xs uppercase text-muted-foreground tracking-wider block">
                  Liquidación Estimada
                </span>
                <h3 className="text-base font-semibold text-foreground mt-0.5">
                  Resumen de Orden
                </h3>
              </div>

              <div className="space-y-3 border-t border-b border-border py-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground font-mono uppercase">
                    Subtotal
                  </span>
                  <span className="font-mono font-medium text-foreground tabular-nums">
                    Bs. {calculateTotal()}
                  </span>
                </div>
                {proveedorSeleccionado && parseFloat(proveedorSeleccionado.costo_pedido || 0) > 0 && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground font-mono uppercase">
                      Costo Pedido (S)
                    </span>
                    <span className="font-mono font-medium text-foreground tabular-nums">
                      Bs. {parseFloat(proveedorSeleccionado.costo_pedido).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

              <div className="p-4 rounded-xs border border-border bg-muted/20">
                <span className="font-mono text-xs uppercase text-muted-foreground block mb-1">
                  IMPORTE TOTAL
                </span>
                <div className="text-2xl sm:text-3xl font-semibold font-mono tracking-tight tabular-nums text-foreground">
                  Bs. {calculateGrandTotal()}
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full rounded-xs font-mono text-xs uppercase tracking-wider h-9"
                >
                  {isLoading ? "Procesando..." : "Crear Orden de Compra"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/dashboard/ordenes-de-compra")}
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
