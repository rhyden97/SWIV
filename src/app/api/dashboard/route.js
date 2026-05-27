import { NextResponse } from "next/server";
import { format } from "date-fns";
import { requireRole } from "@/lib/api-auth";
import { apiError, badRequest } from "@/lib/api-response";
import { fetchDashboardKPIs, fetchSalesData } from "@/services/dashboardService";

export async function GET() {
  try {
    const auth = await requireRole([
      "administrador",
      "almacen",
      "ventas",
      "visitante",
    ]);
    if (auth.response) return auth.response;

    const { supabase } = auth;
    const hoy = format(new Date(), "yyyy-MM-dd");

    const [
      kpis,
      salesData,
      lotesRes,
      productosARes,
      alertasBRes,
      alertasCRes,
    ] = await Promise.all([
      fetchDashboardKPIs(supabase).catch((err) => {
        console.error("Error fetching KPIs:", err);
        return null;
      }),
      fetchSalesData(supabase).catch((err) => {
        console.error("Error fetching sales data:", err);
        return { data: [], isDemo: true };
      }),
      supabase
        .from("lotes_producto")
        .select("id, codigo_lote, stock_lote, fecha_vencimiento, productos ( nombre, es_perecedero, dias_alerta_vencimiento )")
        .gt("stock_lote", 0)
        .order("fecha_vencimiento", { ascending: true })
        .then((res) => {
          if (res.error) console.error("Error lotes:", res.error);
          return res;
        }),
      supabase
        .from("productos")
        .select("id, nombre, stock_actual, punto_reorden, clasificacion_abc, sku")
        .eq("clasificacion_abc", "A")
        .eq("activo", true)
        .then((res) => {
          if (res.error) console.error("Error productos A:", res.error);
          return res;
        }),
      supabase
        .from("reporte_diario_stock")
        .select("*, productos!inner ( punto_reorden, clasificacion_abc )")
        .eq("fecha_reporte", hoy)
        .eq("productos.clasificacion_abc", "B")
        .order("nivel_alerta", { ascending: true })
        .then((res) => {
          if (res.error) console.error("Error alertas B:", res.error);
          return res;
        }),
      supabase
        .from("reporte_diario_stock")
        .select("*, productos!inner ( punto_reorden, clasificacion_abc )")
        .eq("fecha_reporte", hoy)
        .eq("productos.clasificacion_abc", "C")
        .order("nivel_alerta", { ascending: true })
        .then((res) => {
          if (res.error) console.error("Error alertas C:", res.error);
          return res;
        }),
    ]);

    const alertasA = (productosARes?.data || []).filter((prod) => {
      const rop = prod.punto_reorden || 0;
      const stock = prod.stock_actual || 0;
      return rop > 0 && stock <= rop * 1.15;
    });

    return NextResponse.json({
      kpis: kpis || null,
      salesData: salesData || { data: [], isDemo: true },
      lotes: lotesRes?.data || [],
      alertasA,
      alertasB: alertasBRes?.data || [],
      alertasC: alertasCRes?.data || [],
    });
  } catch (error) {
    return apiError(error, "Error cargando datos del dashboard:");
  }
}

export async function POST(request) {
  try {
    const auth = await requireRole(["administrador", "almacen"]);
    if (auth.response) return auth.response;

    const { supabase } = auth;
    const body = await request.json().catch(() => ({}));

    if (body.action === "optimizar_slotting") {
      const { error } = await supabase.rpc("optimizar_slotting");
      if (error) throw error;
      return NextResponse.json({ success: true, message: "Optimización de slotting ejecutada correctamente" });
    }

    return badRequest("Acción no válida");
  } catch (error) {
    return apiError(error, "Error en POST dashboard:");
  }
}
