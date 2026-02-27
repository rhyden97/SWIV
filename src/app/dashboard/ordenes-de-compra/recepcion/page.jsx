"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { PackageCheck, Star } from "lucide-react";
import { useForm, useFieldArray } from "react-hook-form";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { LAYOUT_CLASSES } from "@/lib/constants";
import { Loader } from "@/components/ui/loader";

function RecepcionOrdenContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ordenId = searchParams.get("ordenId");

  const [isLoading, setIsLoading] = useState(false);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [isOrderCompleted, setIsOrderCompleted] = useState(false);
  const [calificacion, setCalificacion] = useState(5);
  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      ordenId: "",
      providerName: "",
      receptionDate: "",
      items: [
        {
          product: "",
          productId: "",
          costoUnitario: "",
          quantityOrdered: "",
          quantityReceived: "",
          isComplete: false,
          es_perecedero: false,
          fecha_vencimiento: "",
        },
      ],
      observations: "",
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: "items",
  });

  const watchedItems = watch("items");

  useEffect(() => {
    setValue("receptionDate", new Date().toISOString().split("T")[0]);
  }, [setValue]);

  const loadPurchaseOrder = useCallback(
    async (id) => {
      setLoadingOrder(true);
      try {
        const response = await fetch("/api/ordenes-compra");
        if (!response.ok) {
          throw new Error("Error al cargar órdenes de compra");
        }

        const ordenes = await response.json();
        const orden = ordenes.find((o) => o.id === id);

        if (!orden) {
          throw new Error("Orden de compra no encontrada");
        }

        setOrdenSeleccionada(orden);

        const isCompleted =
          orden.estado === "completada" || orden.estado === "completado";
        setIsOrderCompleted(isCompleted);
        if (orden.calificacion) {
          setCalificacion(orden.calificacion);
        }
        if (isCompleted) {
          toast.warning("Atención", {
            description:
              "Esta orden de compra ya ha sido completada y no se puede volver a registrar.",
          });
        }

        const orderData = {
          ordenId: orden.id,
          providerName: orden.proveedor?.nombre || "Sin proveedor",
          items:
            orden.items?.map((item) => ({
              productId: item.producto_id,
              product: item.producto?.nombre || "Producto desconocido",
              costoUnitario: item.costo_unitario
                ? item.costo_unitario.toString()
                : "0",
              quantityOrdered: item.cantidad.toString(),
              quantityReceived: item.cantidad.toString(),
              isComplete: true,
              es_perecedero: !!item.producto?.es_perecedero,
              fecha_vencimiento: item.fecha_vencimiento || "",
            })) || [],
        };

        setValue("ordenId", orderData.ordenId);
        setValue("providerName", orderData.providerName);
        replace(orderData.items);

        toast.success("Orden cargada", {
          description: `Datos de la orden ${orden.id.slice(
            0,
            8,
          )} cargados correctamente`,
        });
      } catch (error) {
        console.error("Error loading order:", error);
        toast.error("Error al cargar orden", {
          description:
            error.message || "No se pudo cargar la información de la orden",
        });
      } finally {
        setLoadingOrder(false);
      }
    },
    [setValue, replace],
  );

  useEffect(() => {
    if (ordenId) {
      loadPurchaseOrder(ordenId);
    }
  }, [ordenId, loadPurchaseOrder]);

  const calculateCompletionPercentage = () => {
    if (watchedItems.length === 0) return 0;
    const totalOrdered = watchedItems.reduce(
      (sum, item) => sum + parseFloat(item?.quantityOrdered || 0),
      0,
    );
    const totalReceived = watchedItems.reduce(
      (sum, item) => sum + parseFloat(item?.quantityReceived || 0),
      0,
    );
    if (totalOrdered === 0) return 0;
    const percentage = (totalReceived / totalOrdered) * 100;
    return Math.min(percentage, 100).toFixed(1);
  };

  const calculateSubtotal = (index) => {
    const qty = parseFloat(watchedItems?.[index]?.quantityReceived || 0);
    const cost = parseFloat(watchedItems?.[index]?.costoUnitario || 0);
    return (qty * cost).toFixed(2);
  };

  const calculateOrderTotal = () => {
    if (!watchedItems) return "0.00";
    return watchedItems
      .reduce((sum, item) => {
        const qty = parseFloat(item?.quantityReceived || 0);
        const cost = parseFloat(item?.costoUnitario || 0);
        return sum + qty * cost;
      }, 0)
      .toFixed(2);
  };

  const calculateGrandTotal = () => {
    const totalItems = parseFloat(calculateOrderTotal());
    const costoPedido = ordenSeleccionada?.proveedor?.costo_pedido ? parseFloat(ordenSeleccionada.proveedor.costo_pedido) : 0;
    return (totalItems + costoPedido).toFixed(2);
  };

  const onSubmit = async (data) => {
    if (isOrderCompleted) {
      toast.error("Acción no permitida", {
        description: "Esta orden de compra ya ha sido completada.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const percentage = parseFloat(calculateCompletionPercentage());
      const orderStatus = percentage >= 100 ? "completada" : "recibida_parcial";

      const receptionData = {
        id: data.ordenId,
        estado: orderStatus,
        observations: data.observations || null,
        calificacion: calificacion,
        items: data.items.map((item) => ({
          producto_id: item.productId,
          cantidad: parseInt(item.quantityReceived || 0),
          costo_unitario: parseFloat(item.costoUnitario || 0),
          cantidad_ordenada: parseInt(item.quantityOrdered || 0),
          fecha_vencimiento:
            item.es_perecedero && item.fecha_vencimiento
              ? item.fecha_vencimiento
              : null,
        })),
      };

      const response = await fetch("/api/ordenes-compra", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(receptionData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al registrar la recepción");
      }

      toast.success("¡Recepción registrada exitosamente!", {
        description: `La recepción de la orden ${data.ordenId} ha sido registrada (${orderStatus === "completada" ? "Completada" : "Parcial"}) e inventario actualizado.`,
      });

      reset();
      router.push("/dashboard/ordenes-de-compra");
    } catch (error) {
      console.error("Error saving reception:", error);
      toast.error("Error al registrar recepción", {
        description:
          error.message || "No se pudo completar el registro de la recepción",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddItem = () => {
    append({
      product: "",
      productId: "",
      costoUnitario: "",
      quantityOrdered: "",
      quantityReceived: "",
      isComplete: false,
      es_perecedero: false,
      fecha_vencimiento: "",
    });
  };

  const handleRemoveItem = (index) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  return (
    <div className={LAYOUT_CLASSES.PAGE_CONTAINER}>
      <PageHeader
        title="Recepción de Orden de Compra"
        subtitle="Registra la recepción de productos y control de lotes."
      />

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 min-w-0">
            <div className="p-6 rounded-xs border border-border bg-card h-full flex flex-col min-w-0">
              <div className="mb-6">
                <span className="font-mono text-xs uppercase text-muted-foreground tracking-wider block mb-1">
                  Documento de Ingreso
                </span>
                <h3 className="text-base font-semibold text-foreground mb-4">
                  Datos de la Recepción
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ordenId">ID de Orden</Label>
                    <Input
                      {...register("ordenId", {
                        required: "El ID de orden es requerido",
                      })}
                      placeholder="OC-001"
                      className="bg-white border-gray-300"
                      readOnly={true}
                    />
                    {errors.ordenId && (
                      <p className="text-sm text-red-500">
                        {errors.ordenId.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="providerName">Proveedor</Label>
                    <Input
                      {...register("providerName", {
                        required: "El proveedor es requerido",
                      })}
                      placeholder="Nombre del proveedor..."
                      className="bg-white border-gray-300"
                      readOnly={true}
                    />
                    {errors.providerName && (
                      <p className="text-sm text-red-500">
                        {errors.providerName.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="receptionDate">Fecha de Recepción</Label>
                    <Input
                      type="date"
                      {...register("receptionDate", {
                        required: "La fecha es requerida",
                      })}
                      className="bg-gray-100 border-gray-300"
                      disabled={isLoading || isOrderCompleted}
                    />
                    {errors.receptionDate && (
                      <p className="text-sm text-red-500">
                        {errors.receptionDate.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex-1 flex flex-col min-w-0">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-4 mb-6 gap-3">
                  <Label className="text-lg font-bold mr-auto">
                    Productos Recibidos
                  </Label>
                </div>

                <div className="divide-y divide-gray-200 flex-1 overflow-y-auto max-h-120 pr-1">
                  {fields.map((item, index) => {
                    const ordered = parseFloat(
                      watchedItems[index]?.quantityOrdered || 0,
                    );
                    const received = parseFloat(
                      watchedItems[index]?.quantityReceived || 0,
                    );
                    const percentage =
                      ordered > 0
                        ? Math.min((received / ordered) * 105, 100)
                        : 0;
                    const realPercentage =
                      ordered > 0 ? (received / ordered) * 100 : 0;
                    const isComplete = ordered > 0 && received >= ordered;
                    const esPerecedero = watchedItems[index]?.es_perecedero;

                    return (
                      <div
                        key={item.id}
                        className="py-6 first:pt-2 last:pb-2 space-y-4"
                      >
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                          <div className="space-y-1">
                            <h4 className="text-sm dark:text-gray-100 flex items-center gap-2">
                              <span className="font-mono text-xs px-2 py-0.5 rounded-xs border border-border bg-muted/40">
                                Ítem {index + 1}
                              </span>
                              {watchedItems[index]?.product || "Producto"}
                            </h4>
                            <p className="text-xs text-muted-foreground font-mono">
                              ID Producto:{" "}
                              {watchedItems[index]?.productId || "N/A"}
                            </p>
                          </div>

                          <Badge
                            variant={isComplete ? "default" : "warning"}
                            className="text-xs font-mono rounded-xs"
                          >
                            {isComplete
                              ? "Completo"
                              : `Faltan ${(ordered - received).toFixed(0)} u.`}
                          </Badge>
                        </div>

                        <div
                          className={`grid grid-cols-1 sm:grid-cols-2 ${esPerecedero ? "md:grid-cols-4" : "md:grid-cols-3"} gap-4 pt-1`}
                        >
                          <div className="space-y-1.5">
                            <Label className="text-xs text-gray-700 font-bold">
                              Pedido
                            </Label>
                            <div className="text-md text-gray-650 space-y-1 py-2 font-semibold">
                              <div>
                                Ordenado:{" "}
                                <span className="text-gray-900 font-extrabold">
                                  {ordered}
                                </span>{" "}
                                unidades
                              </div>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <Label
                              htmlFor={`items.${index}.costoUnitario`}
                              className="text-xs text-gray-750 font-bold"
                            >
                              Costo Unitario (Bs.)
                            </Label>
                            <Input
                              type="number"
                              step="0.01"
                              {...register(`items.${index}.costoUnitario`, {
                                required: "Requerido",
                                min: {
                                  value: 0,
                                  message: "Mínimo 0",
                                },
                              })}
                              placeholder="0.00"
                              className="w-full rounded-xs border-border bg-background font-mono text-xs h-9"
                              disabled={isLoading || isOrderCompleted}
                            />
                            {errors.items?.[index]?.costoUnitario && (
                              <p className="text-xs text-destructive font-mono mt-0.5">
                                {errors.items[index].costoUnitario.message}
                              </p>
                            )}
                          </div>

                          <div className="space-y-1.5">
                            <Label
                              htmlFor={`items.${index}.quantityReceived`}
                              className="text-xs text-muted-foreground font-mono uppercase"
                            >
                              Cantidad Recibida
                            </Label>
                            <Input
                              type="number"
                              {...register(`items.${index}.quantityReceived`, {
                                required: "Requerido",
                                min: {
                                  value: 0,
                                  message: "Mínimo 0",
                                },
                                validate: (value) => {
                                  const r = parseFloat(value || 0);
                                  if (r > ordered) {
                                    return "Excede lo ordenado";
                                  }
                                  return true;
                                },
                              })}
                              placeholder="0"
                              className="w-full rounded-xs border-border bg-background font-mono text-xs h-9"
                              disabled={isLoading || isOrderCompleted}
                            />
                            {errors.items?.[index]?.quantityReceived && (
                              <p className="text-xs text-destructive font-mono mt-0.5">
                                {errors.items[index].quantityReceived.message}
                              </p>
                            )}
                          </div>

                          {esPerecedero && (
                            <div className="space-y-1.5">
                              <Label className="text-xs text-muted-foreground font-mono uppercase">
                                Control de Vencimiento
                              </Label>
                              <div className="space-y-1">
                                <Input
                                  type="date"
                                  {...register(
                                    `items.${index}.fecha_vencimiento`,
                                    {
                                      required: esPerecedero
                                        ? "Fecha requerida"
                                        : false,
                                    },
                                  )}
                                  className="w-full rounded-xs border-border bg-background font-mono text-xs h-9"
                                  disabled={isLoading || isOrderCompleted}
                                />
                                {errors.items?.[index]?.fecha_vencimiento && (
                                  <p className="text-xs text-destructive font-mono mt-0.5">
                                    {
                                      errors.items[index].fecha_vencimiento
                                        .message
                                    }
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col sm:flex-row justify-between items-center rounded-xs gap-4 mt-2">
                          <div className="w-full sm:max-w-xs space-y-1">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-muted-foreground font-mono uppercase">
                                Progreso Recepción
                              </span>
                              <span className="font-mono font-medium text-foreground tabular-nums">
                                {realPercentage.toFixed(0)}%
                              </span>
                            </div>
                            <div className="w-full bg-border rounded-xs h-1.5 overflow-hidden">
                              <div
                                className={`h-full transition-all duration-300 ${
                                  isComplete
                                    ? "bg-emerald-600"
                                    : realPercentage > 50
                                      ? "bg-amber-500"
                                      : "bg-red-500"
                                }`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                          <div className="text-right text-xs font-mono text-muted-foreground">
                            Subtotal Recibido:{" "}
                            <span className="text-sm font-semibold text-foreground tabular-nums ml-1">
                              Bs. {calculateSubtotal(index)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-8 pt-6 border-t border-border grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="text-xs font-mono uppercase text-muted-foreground">
                      Calificación del Proveedor / Servicio
                    </Label>
                    <div className="flex items-center gap-2 p-3 rounded-xs border border-border bg-muted/20">
                      <div className="flex gap-1.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            disabled={isLoading || isOrderCompleted}
                            onClick={() => setCalificacion(star)}
                            className="focus:outline-hidden transition-all hover:scale-110 active:scale-95 cursor-pointer"
                          >
                            <Star
                              className={`h-5 w-5 transition-all ${
                                star <= calificacion
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-muted hover:text-amber-300"
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                      <span className="ml-3 text-xs font-mono text-foreground px-2 py-0.5 rounded-xs border border-border bg-card">
                        {calificacion} / 5
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Califica el tiempo de entrega, la calidad del empaque y el
                      cumplimiento general del proveedor.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="observations"
                      className="text-xs font-mono uppercase text-muted-foreground"
                    >
                      Observaciones
                    </Label>
                    <Textarea
                      {...register("observations")}
                      placeholder="Notas sobre la recepción (daños, faltantes, etc.)"
                      className="rounded-xs border-border bg-background font-mono text-xs min-h-24"
                      rows={3}
                      disabled={isLoading || isOrderCompleted}
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
                  Recepción Física
                </span>
                <h3 className="text-base font-semibold text-foreground mt-0.5">
                  Resumen de Recepción
                </h3>
              </div>

              <div className="space-y-3 border-t border-b border-border py-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground font-mono uppercase">
                    Total de Productos
                  </span>
                  <span className="font-mono font-medium text-foreground tabular-nums">
                    {fields.length}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground font-mono uppercase">
                    Subtotal Productos
                  </span>
                  <span className="font-mono font-medium text-foreground tabular-nums">
                    Bs. {calculateOrderTotal()}
                  </span>
                </div>

                {ordenSeleccionada?.proveedor?.costo_pedido && parseFloat(ordenSeleccionada.proveedor.costo_pedido) > 0 && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground font-mono uppercase">
                      Costo de Pedido (S)
                    </span>
                    <span className="font-mono font-medium text-foreground tabular-nums">
                      Bs. {parseFloat(ordenSeleccionada.proveedor.costo_pedido).toFixed(2)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center text-xs pt-1 border-t border-border/50">
                  <span className="text-muted-foreground font-mono uppercase">
                    Total de la Orden
                  </span>
                  <span className="font-mono font-semibold text-foreground tabular-nums">
                    Bs. {calculateGrandTotal()}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xs border border-border bg-muted/20 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-mono uppercase text-muted-foreground">
                    Completitud
                  </span>
                  <span className="font-mono font-semibold text-foreground tabular-nums">
                    {calculateCompletionPercentage()}%
                  </span>
                </div>
                <div className="w-full bg-border rounded-xs h-1.5 overflow-hidden">
                  <div
                    className="bg-primary h-full transition-all"
                    style={{ width: `${calculateCompletionPercentage()}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <Button
                  type="submit"
                  disabled={isLoading || isOrderCompleted}
                  className="w-full rounded-xs font-mono text-xs uppercase tracking-wider h-9"
                >
                  <PackageCheck className="mr-2 h-4 w-4" />
                  {isLoading ? "Procesando..." : "Registrar Recepción"}
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
export default function RecepcionOrdenPage() {
  return (
    <Suspense
      fallback={
        <div className={LAYOUT_CLASSES.PAGE_CONTAINER}>
          <Loader columns={4} rows={6} />
        </div>
      }
    >
      <RecepcionOrdenContent />
    </Suspense>
  );
}
