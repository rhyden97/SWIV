"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useRol } from "@/hooks/useRol";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { PageHeader } from "@/components/page-header";
import { LAYOUT_CLASSES } from "@/lib/constants";
import { toast } from "sonner";

export default function PrediccionesPage() {
  const router = useRouter();
  const { loading: rolLoading, tienePermiso } = useRol();
  const [selectedItem, setSelectedItem] = useState("");
  const [showPrediction, setShowPrediction] = useState(false);
  const [loading, setLoading] = useState(false);
  const [productos, setProductos] = useState([]);
  const autoLoadedRef = useRef(false);

  useEffect(() => {
    fetch("/api/productos")
      .then((r) => r.json())
      .then((d) => setProductos(Array.isArray(d) ? d : []))
      .catch((err) => console.error("Error loading products for predictions:", err));
  }, []);

  const [predictionData, setPredictionData] = useState(null);

  const [windowWidth, setWindowWidth] = useState(1024);
  useEffect(() => {
    if (typeof window !== "undefined") {
      setWindowWidth(window.innerWidth);
      const handleResize = () => setWindowWidth(window.innerWidth);
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);
  const chartHeight = windowWidth < 768 ? 280 : 450;

  useEffect(() => {
    if (!rolLoading && !tienePermiso(["administrador", "visitante"])) {
      router.push("/dashboard/inventario");
    }
  }, [rolLoading, tienePermiso, router]);

  const handleSelectItem = (value) => {
    setSelectedItem(value);
    setShowPrediction(false);
  };

  const loadPrediction = useCallback(
    async (productId, { auto = false } = {}) => {
      if (!productId) return;

      setLoading(true);
      try {
        const response = await fetch(
          `/api/predicciones?producto_id=${encodeURIComponent(productId)}`,
        );
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error || "No se pudo obtener el pronóstico",
          );
        }

        const data = await response.json();
        const historical = Array.isArray(data?.historical)
          ? data.historical
          : [];
        const forecast = Array.isArray(data?.forecast) ? data.forecast : [];

        if (forecast.length === 0) {
          throw new Error("El servidor no devolvió datos de pronóstico");
        }

        const predicciones = Array.isArray(data.predicciones)
          ? [...data.predicciones].sort(
              (a, b) =>
                new Date(b.periodo_inicio) - new Date(a.periodo_inicio),
            )
          : [];

        const todayStr = new Date().toISOString().slice(0, 10);
        const currentPrediction =
          predicciones.find(
            (prediction) =>
              prediction.periodo_fin &&
              String(prediction.periodo_fin).slice(0, 10) >= todayStr,
          ) || null;

        const forecastSum = forecast.reduce(
          (sum, item) => sum + (item.forecast || 0),
          0,
        );
        const startDate = forecast[0]?.startDate || null;
        const endDate = forecast[forecast.length - 1]?.endDate || null;
        const details = forecast.map((item) => ({
          fecha: item.startDate,
          cantidad: item.forecast,
        }));

        const localPrediction = {
          id: `demo-${productId}`,
          producto_id: productId,
          periodo_inicio: startDate,
          periodo_fin: endDate,
          prediccion_lstm: Math.round(forecastSum * 0.95),
          ajuste_gemini: forecastSum,
          confianza: data.isDemo ? 0.78 : 0.86,
          metadata: {
            predicciones_detalle: details,
            demo: Boolean(data.isDemo),
            modelo: data.isDemo
              ? "Tendencia estimada"
              : "Promedio histórico",
          },
          explicacion_gemini: null,
        };

        const isDemo = Boolean(data.isDemo || !currentPrediction);

        setPredictionData({
          historical,
          forecast,
          prediccion: currentPrediction || localPrediction,
          todasPredicciones: predicciones,
          isDemo,
        });
        setShowPrediction(true);

        if (!auto) {
          toast.success("Pronóstico generado correctamente");
        }
      } catch (error) {
        console.error("Error generating prediction:", error);
        toast.error(error.message || "Error al generar predicción");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const handleGeneratePrediction = () => {
    loadPrediction(selectedItem);
  };

  useEffect(() => {
    if (
      rolLoading ||
      autoLoadedRef.current ||
      productos.length === 0 ||
      !tienePermiso(["administrador", "visitante"])
    ) {
      return;
    }

    autoLoadedRef.current = true;
    const preferredProduct =
      productos.find(
        (product) =>
          Number(product.punto_reorden) > 0 &&
          Number(product.stock_actual) > 0,
      ) || productos[0];

    setSelectedItem(preferredProduct.id);
    loadPrediction(preferredProduct.id, { auto: true });
  }, [loadPrediction, productos, rolLoading, tienePermiso]);

  const currentItem = productos.find((item) => item.id === selectedItem);

  const combinedMap = new Map();
  if (predictionData) {
    predictionData.historical.forEach((d) => {
      combinedMap.set(d.date, { date: d.date, sales: d.sales, forecast: null });
    });
    predictionData.forecast.forEach((d) => {
      if (combinedMap.has(d.date)) {
        combinedMap.get(d.date).forecast = d.forecast;
      } else {
        combinedMap.set(d.date, { date: d.date, sales: null, forecast: d.forecast });
      }
    });
  }
  const combinedData = Array.from(combinedMap.values());

  const forecastedDemand = predictionData
    ? predictionData.forecast.reduce((sum, d) => sum + (d.forecast || 0), 0)
    : 0;

  const rawConfianza = predictionData?.prediccion?.confianza;
  const confianzaDecimal =
    rawConfianza !== undefined && rawConfianza !== null
      ? rawConfianza > 1
        ? rawConfianza / 100
        : rawConfianza
      : null;

  const recommendedOrder = currentItem
    ? Math.max(
        0,
        forecastedDemand +
          (currentItem.punto_reorden || 10) -
          (currentItem.stock_actual || 0),
      )
    : 0;

  const recommendationText = currentItem
    ? recommendedOrder > 0
      ? `La demanda proyectada para las próximas 4 semanas es de ${forecastedDemand} unidades. Con un stock actual de ${currentItem.stock_actual ?? 0} unidades y un punto de reorden de ${currentItem.punto_reorden || 10}, se recomienda reponer aproximadamente ${recommendedOrder} unidades para cubrir el período y mantener un margen de seguridad.`
      : `Con un stock actual de ${currentItem.stock_actual ?? 0} unidades y una demanda proyectada de ${forecastedDemand} unidades, no se requiere una reposición inmediata. Mantén el monitoreo semanal del punto de reorden.`
    : "";

  if (!rolLoading && !tienePermiso(["administrador", "visitante"])) {
    return (
      <div className={LAYOUT_CLASSES.PAGE_CONTAINER}>
        <div className="rounded-xs border border-destructive/20 bg-destructive/5 p-8 text-center max-w-lg mx-auto">
          <span className="font-mono text-xs uppercase text-destructive block mb-1">
            Acceso Denegado
          </span>
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Acceso Restringido
          </h2>
          <p className="text-xs text-muted-foreground mb-4">
            Solo los administradores y visitantes autorizados pueden acceder a las predicciones IA.
          </p>
          <span className="text-xs font-mono text-muted-foreground">Redirigiendo...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={LAYOUT_CLASSES.PAGE_CONTAINER}>
      <PageHeader
        title="Predicciones de Demanda"
        subtitle="Proyecciones de ventas y requerimientos de stock."
      />

      <div className="rounded-xs border border-border bg-card p-5 mb-6">
        <div className="mb-4">
          <span className="font-mono text-xs uppercase text-muted-foreground tracking-wider block">
            PARÁMETROS
          </span>
          <h2 className="text-base font-semibold text-foreground mt-0.5">
            Seleccionar Producto
          </h2>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 space-y-1.5">
            <Label
              htmlFor="item-select"
              className="text-xs font-mono uppercase text-muted-foreground"
            >
              Artículo
            </Label>
            <Select value={selectedItem} onValueChange={handleSelectItem}>
              <SelectTrigger
                id="item-select"
                className="w-full h-9 rounded-xs border-border bg-background font-mono text-xs"
              >
                <SelectValue placeholder="Buscar y seleccionar producto..." />
              </SelectTrigger>
              <SelectContent className="rounded-xs border-border">
                {productos.map((item) => (
                  <SelectItem key={item.id} value={item.id} className="font-mono text-xs">
                    {item.nombre} — Stock: {item.stock_actual} u.
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end w-full sm:w-auto">
            <Button
              onClick={handleGeneratePrediction}
              disabled={!selectedItem || loading}
              className="rounded-xs h-9 px-4 font-mono text-xs uppercase tracking-wider w-full sm:w-auto"
            >
              {loading ? "Analizando..." : "Generar Pronóstico"}
            </Button>
          </div>
        </div>
      </div>

      {loading && (
        <div className="rounded-xs border border-border bg-card p-6 space-y-4">
          <div>
            <span className="font-mono text-xs uppercase text-muted-foreground tracking-wider block">
              Calculando Estimación
            </span>
            <h3 className="text-base font-semibold text-foreground mt-0.5">
              Procesando Modelo Predictivo
            </h3>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="rounded-xs border border-border bg-muted/20 p-4"
              >
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-8 w-20 mb-2" />
                <Skeleton className="h-5 w-24 rounded-xs" />
              </div>
            ))}
          </div>
          <Skeleton className="h-64 w-full rounded-xs" />
        </div>
      )}

      {showPrediction && currentItem && !loading && (
        <div className="space-y-6">
          <div className="rounded-xs border border-border bg-card p-5">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <span className="font-mono text-xs uppercase text-muted-foreground tracking-wider block">
                  Proyección del Producto
                </span>
                <h2 className="text-lg font-semibold text-foreground mt-0.5">
                  Pronóstico de Demanda: {currentItem.nombre}
                </h2>
              </div>
              {predictionData?.isDemo && (
                <Badge
                  variant="outline"
                  className="font-mono text-xs rounded-xs"
                >
                  PROYECCIÓN ESTIMADA
                </Badge>
              )}
            </div>

            <div className="mb-2">
              <ResponsiveContainer width="100%" height={chartHeight}>
                <LineChart data={combinedData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border, #e5e7eb)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    className="text-xs"
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    className="text-xs"
                    label={{
                      value: "Unidades",
                      angle: -90,
                      position: "insideLeft",
                      fontSize: 11,
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "2px",
                      color: "hsl(var(--foreground))",
                      fontFamily: "monospace",
                      boxShadow: "none",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="sales"
                    stroke="#2563eb"
                    strokeWidth={2}
                    name="Demanda Histórica"
                    dot={{ r: 3 }}
                    connectNulls
                  />
                  <Line
                    type="monotone"
                    dataKey="forecast"
                    stroke="#16a34a"
                    strokeWidth={2}
                    name={predictionData?.isDemo ? "Pronóstico Estimado" : "Pronóstico IA"}
                    dot={{ r: 3 }}
                    strokeDasharray="4 4"
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {predictionData?.prediccion && (
            <div className="rounded-xs border border-border bg-card p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="font-mono text-xs uppercase text-muted-foreground tracking-wider block">
                    Recomendación de Reposición
                  </span>
                  <h3 className="text-base font-semibold text-foreground mt-0.5">
                    Recomendación de Inventario
                  </h3>
                </div>
                {predictionData.isDemo && (
                  <Badge
                    variant="outline"
                    className="font-mono text-xs rounded-xs"
                  >
                    PROYECCIÓN ESTIMADA
                  </Badge>
                )}
              </div>

              <div className="rounded-xs border border-border bg-muted/20 p-4">
                <p className="text-foreground text-sm font-sans leading-relaxed">
                  {recommendationText}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 border border-border divide-y sm:divide-y-0 sm:divide-x divide-border bg-card rounded-xs">
                <div className="p-3">
                  <span className="font-mono text-xs uppercase text-muted-foreground block">
                    Demanda 4 semanas
                  </span>
                  <span className="text-lg font-semibold font-mono tabular-nums text-foreground mt-1 block">
                    {forecastedDemand} u.
                  </span>
                </div>
                <div className="p-3">
                  <span className="font-mono text-xs uppercase text-muted-foreground block">
                    Stock actual
                  </span>
                  <span className="text-lg font-semibold font-mono tabular-nums text-foreground mt-1 block">
                    {currentItem.stock_actual ?? 0} u.
                  </span>
                </div>
                <div className="p-3">
                  <span className="font-mono text-xs uppercase text-muted-foreground block">
                    Compra sugerida
                  </span>
                  <span className="text-lg font-semibold font-mono tabular-nums text-primary mt-1 block">
                    {recommendedOrder} u.
                  </span>
                </div>
              </div>

              {predictionData.isDemo && (
                <p className="text-xs font-mono text-muted-foreground">
                  Proyección calculada a partir de la tendencia reciente del catálogo.
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 lg:grid-cols-4 border border-border divide-x divide-y lg:divide-y-0 divide-border bg-card rounded-xs">
            <div className="p-4 sm:p-5 flex flex-col justify-between">
              <div>
                <span className="font-mono text-xs uppercase text-muted-foreground tracking-wider block">
                  Demanda Proyectada
                </span>
                <div className="text-2xl sm:text-3xl font-semibold font-mono tracking-tight tabular-nums text-foreground mt-2">
                  {forecastedDemand}
                </div>
              </div>
              <div className="mt-3">
                <span className="text-xs text-muted-foreground">Periodo proyectado</span>
              </div>
            </div>

            <div className="p-4 sm:p-5 flex flex-col justify-between">
              <div>
                <span className="font-mono text-xs uppercase text-muted-foreground tracking-wider block">
                  Nivel de Confianza
                </span>
                <div className="text-2xl sm:text-3xl font-semibold font-mono tracking-tight tabular-nums text-foreground mt-2">
                  {confianzaDecimal !== null
                    ? `${(confianzaDecimal * 100).toFixed(1).replace(".", ",")}%`
                    : "N/A"}
                </div>
              </div>
              <div className="mt-3">
                <Badge
                  variant="outline"
                  className={`font-mono text-xs rounded-xs ${
                    (confianzaDecimal || 0) >= 0.8
                      ? "border-emerald-500/30 text-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20"
                      : (confianzaDecimal || 0) >= 0.6
                        ? "border-amber-500/30 text-amber-600 bg-amber-50/50 dark:bg-amber-950/20"
                        : "border-red-500/30 text-red-600 bg-red-50/50 dark:bg-red-950/20"
                  }`}
                >
                  {(confianzaDecimal || 0) >= 0.8
                    ? "ALTA CONFIANZA"
                    : (confianzaDecimal || 0) >= 0.6
                      ? "CONFIANZA MEDIA"
                      : "CONFIANZA BAJA"}
                </Badge>
              </div>
            </div>

            <div className="p-4 sm:p-5 flex flex-col justify-between">
              <div>
                <span className="font-mono text-xs uppercase text-muted-foreground tracking-wider block">
                  Umbral de Reorden
                </span>
                <div className="text-2xl sm:text-3xl font-semibold font-mono tracking-tight tabular-nums text-foreground mt-2">
                  {currentItem.punto_reorden || 10}
                </div>
              </div>
              <div className="mt-3">
                <Badge
                  variant="outline"
                  className={`font-mono text-xs rounded-xs ${
                    currentItem.stock_actual > (currentItem.punto_reorden || 10)
                      ? "border-blue-500/30 text-blue-600 bg-blue-50/50 dark:bg-blue-950/20"
                      : "border-red-500/30 text-red-600 bg-red-50/50 dark:bg-red-950/20"
                  }`}
                >
                  STOCK: {currentItem.stock_actual} U.
                </Badge>
              </div>
            </div>

            <div className="p-4 sm:p-5 flex flex-col justify-between">
              <div>
                <span className="font-mono text-xs uppercase text-muted-foreground tracking-wider block">
                  Sugerencia de Reposición
                </span>
                <div className="text-2xl sm:text-3xl font-semibold font-mono tracking-tight tabular-nums text-foreground mt-2">
                  {recommendedOrder}
                </div>
              </div>
              <div className="mt-3">
                <Badge
                  variant="outline"
                  className={`font-mono text-xs rounded-xs ${
                    recommendedOrder > 0
                      ? "border-amber-500/30 text-amber-600 bg-amber-50/50 dark:bg-amber-950/20"
                      : "border-emerald-500/30 text-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20"
                  }`}
                >
                  {recommendedOrder > 0 ? "REPOSICIÓN RECOMENDADA" : "STOCK SUFICIENTE"}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      )}

      {!showPrediction && !loading && (
        <div className="rounded-xs border border-dashed border-border bg-card p-12 text-center">
          <div className="max-w-md mx-auto space-y-2">
            <span className="font-mono text-xs uppercase text-muted-foreground block">
              SELECCIÓN DE PRODUCTO
            </span>
            <h3 className="text-sm font-semibold text-foreground">
              Seleccione un producto para generar la proyección
            </h3>
            <p className="text-xs text-muted-foreground">
              Calculará la curva de demanda de las próximas semanas y el punto óptimo de reorden.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
