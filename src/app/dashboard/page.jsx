"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader } from "@/components/ui/loader";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { PageHeader } from "@/components/page-header";
import { useRol } from "@/hooks/useRol";
import { LAYOUT_CLASSES, GRID_CLASSES } from "@/lib/constants";
import { LotesPanel } from "@/components/lots-panel";
import { StatCard } from "@/components/ui/stat-card";
import { DEMO_ALERTAS_A, DEMO_KPIS, buildDemoSalesSeries } from "@/lib/demoData";

const playNotificationSound = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const playTone = (time, freq, duration) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0.15, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(time);
      osc.stop(time + duration);
    };

    const now = ctx.currentTime;
    playTone(now, 880, 0.15);
    playTone(now + 0.1, 1320, 0.25);
  } catch (e) {
    console.warn("Autoplay block or AudioContext error:", e);
  }
};

export default function DashboardPage() {
  const router = useRouter();
  const { rol } = useRol();
  const puedeOperarInventario = rol === "administrador" || rol === "almacen";

  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState(null);
  const [salesData, setSalesData] = useState([]);
  const [salesIsDemo, setSalesIsDemo] = useState(false);
  const [alertasA, setAlertasA] = useState([]);
  const [alertasB, setAlertasB] = useState([]);
  const [alertasC, setAlertasC] = useState([]);
  const [lotes, setLotes] = useState([]);
  const [activeTab, setActiveTab] = useState("claseA");
  const [generandoC, setGenerandoC] = useState(false);

  const ropAlertsPlayedGlobal = useRef(new Set()).current;

  const loadData = async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      const res = await fetch("/api/dashboard");
      if (!res.ok) throw new Error("Error cargando dashboard");
      const data = await res.json();

      if (data.kpis) setKpis(data.kpis);
      if (data.salesData) {
        const payload = data.salesData;
        setSalesData(payload?.data ?? payload ?? []);
        setSalesIsDemo(Boolean(payload?.isDemo));
      }
      if (data.lotes) setLotes(data.lotes);

      if (data.alertasA) {
        const newAlerts = [];
        data.alertasA.forEach((prod) => {
          const rop = prod.punto_reorden || 0;
          const stock = prod.stock_actual || 0;

          if (rop > 0 && stock <= rop * 1.15) {
            if (!ropAlertsPlayedGlobal.has(prod.id)) {
              newAlerts.push(prod);
              ropAlertsPlayedGlobal.add(prod.id);
            }
          } else {
            if (ropAlertsPlayedGlobal.has(prod.id)) {
              ropAlertsPlayedGlobal.delete(prod.id);
            }
          }
        });

        if (newAlerts.length > 0) {
          playNotificationSound();
          newAlerts.forEach((prod) => {
            const rop = prod.punto_reorden;
            const stock = prod.stock_actual;
            const pct = Math.round((stock / rop) * 100);
            toast.error("Alerta ROP: Producto Clase A Crítico", {
              description: `"${prod.nombre}" stock: ${stock} u (${pct}% del ROP: ${rop}).`,
              duration: 10000,
            });
          });
        }

        const mapped = (data.alertasA || [])
          .filter(
            (p) =>
              p.stock_actual !== null &&
              p.punto_reorden !== null &&
              p.stock_actual <= p.punto_reorden,
          )
          .map((p) => ({
            id: p.id,
            producto_id: p.id,
            nombre_producto: p.nombre,
            nivel_alerta: "critico",
            mensaje: `Stock actual (${p.stock_actual}) por debajo del ROP (${p.punto_reorden}).`,
            stock_al_corte: p.stock_actual,
            productos: { punto_reorden: p.punto_reorden },
            clasificacion_abc: p.clasificacion_abc,
            sku: p.sku,
          }));
        setAlertasA(mapped);
      }

      if (data.alertasB) setAlertasB(data.alertasB);
      if (data.alertasC) setAlertasC(data.alertasC);
    } catch (err) {
      console.error("Error cargando dashboard:", err);
      setKpis((prev) => prev || DEMO_KPIS);
      setSalesData((prev) => (prev && prev.length > 0 ? prev : buildDemoSalesSeries({ days: 30 })));
      setSalesIsDemo(true);
      setAlertasA((prev) => (prev && prev.length > 0 ? prev : DEMO_ALERTAS_A));
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const fetchDailyAlertsB = () => loadData({ silent: true });
  const fetchDailyAlertsC = () => loadData({ silent: true });
  const checkClassARopAlerts = () => loadData({ silent: true });

  const ejecutarGenerarAlertasClaseC = async () => {
    try {
      setGenerandoC(true);
      const res = await fetch("/api/auditoria/alertas-clase-c", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al generar alertas");

      toast.success(
        `Alertas generadas: ${data.insertadas} nuevas, ${data.actualizadas} actualizadas`,
      );
      fetchDailyAlertsC();
    } catch (err) {
      console.error("Error al generar alertas de Clase C:", err);
      toast.error(err.message || "Error al generar alertas");
    } finally {
      setGenerandoC(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      loadData({ silent: true });
    }, 30000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const hasSales = (kpis?.monthSales ?? 0) > 0;
  const monthSales = hasSales ? kpis.monthSales : DEMO_KPIS.monthSales;
  const isSalesDemo = !hasSales;

  const hasOrders = (kpis?.orderCount ?? 0) > 0;
  const orderCount = hasOrders ? kpis.orderCount : DEMO_KPIS.orderCount;

  const lowStockAlerts = (kpis?.lowStockAlerts ?? 0) > 0 ? kpis.lowStockAlerts : DEMO_KPIS.lowStockAlerts;
  const stockoutCount = kpis?.stockoutCount ?? DEMO_KPIS.stockoutCount;

  const salesGrowth =
    typeof kpis?.growth?.sales === "number" && !isNaN(kpis.growth.sales)
      ? kpis.growth.sales
      : DEMO_KPIS.growth.sales;
  const ordersGrowth =
    typeof kpis?.growth?.orders === "number" && !isNaN(kpis.growth.orders)
      ? kpis.growth.orders
      : DEMO_KPIS.growth.orders;

  const displayAlertasA = alertasA.length > 0 ? alertasA : DEMO_ALERTAS_A;

  return (
    <div className={LAYOUT_CLASSES.PAGE_CONTAINER}>
      <PageHeader
        title="Panel Principal"
        subtitle="Métricas de ventas, inventario y estado operativo."
      />

      {loading ? (
        <Loader columns={4} rows={6} />
      ) : (
        <>
          <div className="border border-border rounded-xs bg-card overflow-hidden">
            <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-border">
              <StatCard
                title="Ventas del Mes"
                badge={isSalesDemo && (
                  <span className="text-xs text-muted-foreground border border-border px-1 py-0.2 rounded-xs">
                    DEMO
                  </span>
                )}
                value={`Bs. ${monthSales.toLocaleString()}`}
                change={`${salesGrowth > 0 ? "+" : ""}${salesGrowth}%`}
                subtitle="vs mes anterior"
                trend="up"
              />

              <StatCard
                title="Pedidos Registrados"
                badge={isSalesDemo && (
                  <span className="text-xs text-muted-foreground border border-border px-1 py-0.2 rounded-xs">
                    DEMO
                  </span>
                )}
                value={orderCount.toLocaleString()}
                change={`${ordersGrowth > 0 ? "+" : ""}${ordersGrowth}%`}
                subtitle="vs mes anterior"
                trend="up"
              />

              <StatCard
                title="Stock en Reorden ROP"
                value={lowStockAlerts}
                change={lowStockAlerts > 0 ? "Atención requerida" : "Stock nominal"}
                trend={lowStockAlerts > 0 ? "warning" : "neutral"}
              />

              <StatCard
                title="Roturas de Stock"
                value={stockoutCount}
                subtitle="Ventas no despachadas"
              />
            </div>
          </div>

          <div className="mt-6">
            <div className={GRID_CLASSES.CHARTS_GRID}>
              <div className="border border-border rounded-xs bg-card">
                <div className="p-5 border-b border-border flex items-center justify-between">
                  <div>
                    <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-0.5">
                      Facturación Mensual
                    </div>
                    <h2 className="text-base font-semibold text-foreground">
                      Ventas de los Últimos 30 Días
                    </h2>
                  </div>
                  {salesIsDemo && (
                    <span className="text-xs font-mono text-muted-foreground border border-border px-1.5 py-0.5 rounded-xs">
                      SIMULACIÓN
                    </span>
                  )}
                </div>

                <div className="p-5">
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={salesData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="2 2" stroke="hsl(var(--border))" opacity={0.6} />
                        <XAxis
                          dataKey="date"
                          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10, fontFamily: "monospace" }}
                          interval="preserveStartEnd"
                          axisLine={{ stroke: "hsl(var(--border))" }}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10, fontFamily: "monospace" }}
                          tickFormatter={(value) => `Bs. ${(value / 1000).toFixed(0)}k`}
                          width={55}
                          axisLine={{ stroke: "hsl(var(--border))" }}
                          tickLine={false}
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
                          formatter={(value) => [`Bs. ${value.toLocaleString()}`, "Monto"]}
                        />
                        <Line
                          type="monotone"
                          dataKey="amount"
                          stroke="hsl(var(--foreground))"
                          strokeWidth={1.5}
                          dot={false}
                          activeDot={{ r: 4, stroke: "hsl(var(--foreground))", strokeWidth: 1 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="border border-border rounded-xs bg-card flex flex-col justify-between">
                <div>
                  <div className="p-5 border-b border-border flex items-center justify-between">
                    <div>
                      <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-0.5">
                        Alertas de Reposición
                      </div>
                      <h2 className="text-base font-semibold text-foreground">
                        Alertas de Inventario ABC
                      </h2>
                    </div>
                    <span className="text-xs font-mono text-muted-foreground">
                      Análisis ABC
                    </span>
                  </div>

                  <div className="p-5">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                      <TabsList className="grid grid-cols-3 mb-4 bg-muted/50 p-0.5 rounded-xs border border-border">
                        <TabsTrigger
                          value="claseA"
                          className="text-xs py-1 font-mono rounded-xs data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-none"
                        >
                          Clase A ({displayAlertasA.length})
                        </TabsTrigger>
                        <TabsTrigger
                          value="claseB"
                          className="text-xs py-1 font-mono rounded-xs data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-none"
                        >
                          Clase B ({alertasB.length})
                        </TabsTrigger>
                        <TabsTrigger
                          value="claseC"
                          className="text-xs py-1 font-mono rounded-xs data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-none"
                        >
                          Clase C ({alertasC.length})
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="claseA" className="mt-0">
                        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                          {displayAlertasA.map((alerta, index) => (
                            <div
                              key={alerta.id || index}
                              className="p-3 rounded-xs border border-border bg-muted/20 flex flex-col gap-1 text-xs"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="font-semibold text-foreground truncate">
                                  {alerta.nombre_producto}
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  {puedeOperarInventario && alerta.producto_id && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-6 text-xs px-2 font-mono rounded-xs border-border"
                                      onClick={() =>
                                        router.push(
                                          `/dashboard/ordenes-de-compra/nueva?productoId=${alerta.producto_id}`,
                                        )
                                      }
                                    >
                                      Reponer
                                    </Button>
                                  )}
                                  <span className="text-xs font-mono px-1.5 py-0.5 rounded-xs bg-rose-500/10 text-rose-600 dark:text-rose-400 font-medium">
                                    CRÍTICO
                                  </span>
                                </div>
                              </div>

                              <p className="text-xs text-muted-foreground leading-relaxed">
                                {alerta.mensaje}
                              </p>

                              <div className="flex flex-wrap gap-2 text-xs pt-1 border-t border-border/60 font-mono text-muted-foreground">
                                <span>Stock: {alerta.stock_al_corte}</span>
                                <span>·</span>
                                <span>ROP: {alerta.productos?.punto_reorden}</span>
                                {alerta.sku && (
                                  <>
                                    <span>·</span>
                                    <span>SKU: {alerta.sku}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </TabsContent>

                      <TabsContent value="claseB" className="mt-0">
                        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                          {alertasB.length === 0 ? (
                            <div className="text-center py-10 text-muted-foreground text-xs font-mono">
                              No hay alertas de stock registradas para Clase B hoy.
                            </div>
                          ) : (
                            alertasB.map((alerta, index) => (
                              <div
                                key={alerta.id || index}
                                className="p-3 rounded-xs border border-border bg-muted/20 flex flex-col gap-1 text-xs"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="font-semibold text-foreground truncate">
                                    {alerta.nombre_producto}
                                  </div>
                                  <span className="text-xs font-mono px-1.5 py-0.5 rounded-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium">
                                    BAJO
                                  </span>
                                </div>
                                {alerta.mensaje && (
                                  <p className="text-xs text-muted-foreground">{alerta.mensaje}</p>
                                )}
                                <div className="flex gap-2 text-xs pt-1 border-t border-border/60 font-mono text-muted-foreground">
                                  <span>Stock: {alerta.stock_al_corte}</span>
                                  <span>·</span>
                                  <span>ROP: {alerta.productos?.punto_reorden}</span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </TabsContent>

                      <TabsContent value="claseC" className="mt-0">
                        {puedeOperarInventario && (
                          <div className="flex justify-between items-center mb-3 bg-muted/30 p-2 rounded-xs border border-border">
                            <span className="text-xs text-muted-foreground font-mono">
                              Cálculo batch semanal
                            </span>
                            <Button
                              onClick={ejecutarGenerarAlertasClaseC}
                              disabled={generandoC}
                              size="sm"
                              variant="outline"
                              className="h-6 text-xs font-mono rounded-xs border-border"
                            >
                              {generandoC ? "Generando..." : "Ejecutar Lote C"}
                            </Button>
                          </div>
                        )}
                        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                          {alertasC.length === 0 ? (
                            <div className="text-center py-10 text-muted-foreground text-xs font-mono">
                              No hay alertas de stock registradas para Clase C hoy.
                            </div>
                          ) : (
                            alertasC.map((alerta, index) => (
                              <div
                                key={alerta.id || index}
                                className="p-3 rounded-xs border border-border bg-muted/20 flex flex-col gap-1 text-xs"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="font-semibold text-foreground truncate">
                                    {alerta.nombre_producto}
                                  </div>
                                  <span className="text-xs font-mono px-1.5 py-0.5 rounded-xs bg-muted text-muted-foreground font-medium">
                                    ROTACIÓN BAJA
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground">{alerta.mensaje}</p>
                              </div>
                            ))
                          )}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <LotesPanel lotes={lotes} />
          </div>
        </>
      )}
    </div>
  );
}
