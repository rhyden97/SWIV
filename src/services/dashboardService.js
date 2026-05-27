import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { buildDemoSalesSeries } from "@/lib/demoSeries";

export const fetchDashboardKPIs = async (supabaseClient) => {
  try {
    const supabase = supabaseClient || createClient();

    const now = new Date();
    const firstDayThisMonth = startOfMonth(now);
    const firstDayLastMonth = startOfMonth(subDays(firstDayThisMonth, 1));
    const lastDayLastMonth = endOfMonth(subDays(firstDayThisMonth, 1));

    const { data: ventasMesActual } = await supabase
      .from("ventas")
      .select("total_venta, metodo_pago")
      .gte("fecha_venta", firstDayThisMonth.toISOString());

    const { data: ventasMesAnterior } = await supabase
      .from("ventas")
      .select("total_venta, metodo_pago")
      .gte("fecha_venta", firstDayLastMonth.toISOString())
      .lte("fecha_venta", lastDayLastMonth.toISOString());

    const ventasExitosasMesActual =
      ventasMesActual?.filter((v) => v.metodo_pago !== "cancelada") || [];
    const ventasExitosasMesAnterior =
      ventasMesAnterior?.filter((v) => v.metodo_pago !== "cancelada") || [];

    const monthSales =
      ventasExitosasMesActual.reduce(
        (sum, v) => sum + (v.total_venta || 0),
        0,
      ) || 0;
    const lastMonthSales =
      ventasExitosasMesAnterior.reduce(
        (sum, v) => sum + (v.total_venta || 0),
        0,
      ) || 0;
    const salesGrowth =
      lastMonthSales > 0
        ? (((monthSales - lastMonthSales) / lastMonthSales) * 100).toFixed(1)
        : 0;

    const orderCount = ventasExitosasMesActual.length;
    const lastMonthOrderCount = ventasExitosasMesAnterior.length;
    const ordersGrowth =
      lastMonthOrderCount > 0
        ? (
            ((orderCount - lastMonthOrderCount) / lastMonthOrderCount) *
            100
          ).toFixed(1)
        : 0;

    const stockoutsMesActual =
      ventasMesActual?.filter((v) => v.metodo_pago === "cancelada") || [];
    const stockoutsMesAnterior =
      ventasMesAnterior?.filter((v) => v.metodo_pago === "cancelada") || [];
    const stockoutCount = stockoutsMesActual.length;
    const lastMonthStockoutCount = stockoutsMesAnterior.length;
    const stockoutGrowth =
      lastMonthStockoutCount > 0
        ? (
            ((stockoutCount - lastMonthStockoutCount) /
              lastMonthStockoutCount) *
            100
          ).toFixed(1)
        : 0;

    const { data: productos } = await supabase
      .from("productos")
      .select("stock_actual, costo_unitario_base")
      .eq("activo", true);

    const inventoryValue =
      productos?.reduce(
        (sum, p) => sum + (p.stock_actual || 0) * (p.costo_unitario_base || 0),
        0,
      ) || 0;

    const { data: todosProductos } = await supabase
      .from("productos")
      .select("stock_actual, punto_reorden")
      .eq("activo", true)
      .not("stock_actual", "is", null)
      .not("punto_reorden", "is", null);

    const lowStockAlerts =
      todosProductos?.filter((p) => p.stock_actual <= p.punto_reorden).length ||
      0;

    return {
      monthSales: Math.round(monthSales),
      orderCount,
      inventoryValue: Math.round(inventoryValue),
      lowStockAlerts,
      stockoutCount,
      growth: {
        sales: parseFloat(salesGrowth),
        orders: parseFloat(ordersGrowth),
        inventory: 0,
        alerts: 0,
        stockout: parseFloat(stockoutGrowth),
      },
    };
  } catch (error) {
    console.error("Error fetching KPIs:", error);
    return {
      monthSales: 0,
      orderCount: 0,
      inventoryValue: 0,
      lowStockAlerts: 0,
      stockoutCount: 0,
      growth: { sales: 0, orders: 0, inventory: 0, alerts: 0, stockout: 0 },
    };
  }
};

export const fetchSalesData = async (supabaseClient) => {
  try {
    const supabase = supabaseClient || createClient();
    const today = new Date();
    const thirtyDaysAgo = subDays(today, 29);

    const { data: ventas } = await supabase
      .from("ventas")
      .select("fecha_venta, total_venta, metodo_pago")
      .gte("fecha_venta", thirtyDaysAgo.toISOString())
      .order("fecha_venta", { ascending: true });

    const salesByDay = {};
    ventas?.forEach((venta) => {
      if (venta.metodo_pago !== "cancelada") {
        const day = format(new Date(venta.fecha_venta), "dd/MM");
        salesByDay[day] = (salesByDay[day] || 0) + (venta.total_venta || 0);
      }
    });

    const salesData = [];
    for (let i = 29; i >= 0; i--) {
      const date = subDays(today, i);
      const dayKey = format(date, "dd/MM");
      salesData.push({
        date: dayKey,
        amount: Math.round(salesByDay[dayKey] || 0),
        fullDate: format(date, "yyyy-MM-dd"),
        isDemo: false,
      });
    }

    const hasSales = salesData.some((day) => day.amount > 0);
    if (!hasSales) {
      return {
        data: buildDemoSalesSeries({ days: 30, endDate: today }),
        isDemo: true,
      };
    }

    return { data: salesData, isDemo: false };
  } catch (error) {
    console.error("Error fetching sales data:", error);
    return {
      data: buildDemoSalesSeries({ days: 30 }),
      isDemo: true,
    };
  }
};

export const fetchDashboardData = async (supabaseClient) => {
  try {
    const [kpis, salesData] = await Promise.all([
      fetchDashboardKPIs(supabaseClient),
      fetchSalesData(supabaseClient),
    ]);

    return {
      kpis,
      salesData,
    };
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    throw error;
  }
};
