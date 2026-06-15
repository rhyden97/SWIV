import { NextResponse } from "next/server";
import { requireRole } from "@/lib/api-auth";
import { buildDemoDailySales, buildDemoForecast } from "@/lib/demoSeries";
import { apiError, badRequest } from "@/lib/api-response";

const formatWeekDate = (dateObj) => {
  const day = String(dateObj.getUTCDate()).padStart(2, "0");
  const month = String(dateObj.getUTCMonth() + 1).padStart(2, "0");
  return `Sem ${day}/${month}`;
};

const getMonday = (dateValue) => {
  const date = new Date(dateValue);
  const day = date.getUTCDay();
  const diff = date.getUTCDate() - day + (day === 0 ? -6 : 1);
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), diff),
  );
};

const getUTCDateString = (date) => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const addDaysUTC = (date, days) => {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
};

const groupSalesByWeek = (sales, historicalMap) => {
  sales.forEach((sale) => {
    const monday = getMonday(sale.date);
    const weekKey = getUTCDateString(monday);
    if (historicalMap.has(weekKey)) {
      historicalMap.get(weekKey).sales += sale.quantity;
    }
  });
};

export async function GET(request) {
  try {
    const auth = await requireRole(["administrador", "visitante"]);
    if (auth.response) return auth.response;

    const { supabase } = auth;
    const { searchParams } = new URL(request.url);
    const productoId = searchParams.get("producto_id");

    if (productoId) {
      const [predictionResult, salesResult] = await Promise.all([
        supabase
          .from("predicciones_ventas")
          .select(
            `
            *,
            producto:productos(*)
          `,
          )
          .eq("producto_id", productoId)
          .order("fecha_generacion", { ascending: false }),
        supabase
          .from("ventas")
          .select(
            `
            fecha_venta,
            venta_items!inner (
              cantidad,
              producto_id
            )
          `,
          )
          .eq("venta_items.producto_id", productoId),
      ]);

      if (predictionResult.error) throw predictionResult.error;
      if (salesResult.error) {
        console.error(
          "Error fetching sales from DB, falling back to demo:",
          salesResult.error,
        );
      }

      const today = new Date();
      const realDailySales = [];

      (salesResult.data || []).forEach((record) => {
        const quantity = (record.venta_items || []).reduce(
          (sum, item) => sum + (item.cantidad || 0),
          0,
        );
        if (quantity > 0) {
          realDailySales.push({
            date: new Date(record.fecha_venta),
            quantity,
          });
        }
      });

      const currentMonday = getMonday(today);
      const historicalMondays = [];
      const historicalMap = new Map();

      for (let i = 8; i >= 1; i--) {
        const monday = addDaysUTC(currentMonday, -i * 7);
        const mondayKey = getUTCDateString(monday);
        historicalMondays.push(mondayKey);
        historicalMap.set(mondayKey, {
          date: formatWeekDate(monday),
          sales: 0,
          weekStart: mondayKey,
        });
      }

      let usedDemoSales = false;

      groupSalesByWeek(
        realDailySales.filter((sale) => sale.date <= today),
        historicalMap,
      );

      let totalSales = 0;
      historicalMap.forEach((week) => {
        totalSales += week.sales;
      });

      if (totalSales === 0) {
        usedDemoSales = true;
        const demoDailySales = buildDemoDailySales({
          productId: productoId,
          days: 90,
          endDate: today,
        });
        groupSalesByWeek(demoDailySales, historicalMap);
      }

      const historical = historicalMondays.map((mondayKey) =>
        historicalMap.get(mondayKey),
      );

      const forecastMondays = [];
      const forecastMap = new Map();
      const currentMondayKey = getUTCDateString(currentMonday);

      for (let i = 0; i < 4; i++) {
        const monday = addDaysUTC(currentMonday, i * 7);
        const mondayKey = getUTCDateString(monday);
        forecastMondays.push(mondayKey);
        forecastMap.set(mondayKey, 0);
      }

      const predicciones = predictionResult.data || [];
      const currentPrediction = predicciones.find((prediction) => {
        const end = prediction.periodo_fin
          ? String(prediction.periodo_fin).slice(0, 10)
          : "";
        return end && end >= currentMondayKey;
      });

      let detailList = [];
      let usedPrediction = false;

      if (currentPrediction) {
        let metadata = currentPrediction.metadata;
        if (typeof metadata === "string") {
          try {
            metadata = JSON.parse(metadata);
          } catch (error) {
            console.error("Error parsing prediction metadata JSON:", error);
          }
        }

        if (
          metadata &&
          Array.isArray(metadata.predicciones_detalle) &&
          metadata.predicciones_detalle.length > 0
        ) {
          detailList = metadata.predicciones_detalle;
          usedPrediction = true;

          detailList.forEach((detail) => {
            if (!detail) return;
            const dateValue = detail.semana || detail.fecha;
            const quantityValue =
              detail.unidades !== undefined
                ? detail.unidades
                : detail.cantidad;
            if (dateValue && quantityValue !== undefined) {
              forecastMap.set(dateValue, parseFloat(quantityValue));
            }
          });
        }
      }

      const fallbackForecast = buildDemoForecast({
        historical,
        productId: productoId,
        weeks: 4,
      });

      const forecast = forecastMondays.map((mondayKey, index) => {
        const [year, month, day] = mondayKey.split("-").map(Number);
        const dateObj = new Date(Date.UTC(year, month - 1, day));
        let value = 0;
        let found = false;

        if (detailList[index]) {
          const quantityValue =
            detailList[index].unidades !== undefined
              ? detailList[index].unidades
              : detailList[index].cantidad;
          if (quantityValue !== undefined) {
            value = parseFloat(quantityValue);
            found = true;
          }
        }

        if (!found) {
          const mappedValue = forecastMap.get(mondayKey);
          if (mappedValue !== undefined && mappedValue !== 0) {
            value = mappedValue;
            found = true;
          }
        }

        if (!found) {
          value = fallbackForecast[index] ?? 0;
        }

        return {
          date: formatWeekDate(dateObj),
          forecast: Math.max(0, Math.round(value)),
          startDate: mondayKey,
          endDate: getUTCDateString(addDaysUTC(dateObj, 6)),
        };
      });

      const isDemo = usedDemoSales || !usedPrediction;

      return NextResponse.json({
        predicciones,
        historical,
        forecast,
        isDemo,
        source: isDemo ? "demo" : "prediction",
      });
    }

    const { data: allPredicciones, error: allPredError } = await supabase
      .from("predicciones_ventas")
      .select(
        `
        *,
        producto:productos(*)
      `,
      )
      .order("fecha_generacion", { ascending: false });

    if (allPredError) throw allPredError;

    return NextResponse.json(allPredicciones);
  } catch (error) {
    return apiError(error, "Error fetching predicciones:");
  }
}

export async function POST(request) {
  try {
    const auth = await requireRole(["administrador", "almacen"]);
    if (auth.response) return auth.response;

    const { supabase } = auth;
    const body = await request.json();

    if (!body.producto_id || !body.periodo_inicio || !body.periodo_fin) {
      return badRequest(
        "Producto, periodo inicio y periodo fin son requeridos",
      );
    }

    const { data, error } = await supabase
      .from("predicciones_ventas")
      .insert([
        {
          producto_id: body.producto_id,
          periodo_inicio: body.periodo_inicio,
          periodo_fin: body.periodo_fin,
          prediccion_lstm: body.prediccion_lstm || null,
          ajuste_gemini: body.ajuste_gemini,
          explicacion: body.explicacion || null,
          metadata: body.metadata || null,
          confianza: body.confianza || null,
          explicacion_gemini: body.explicacion_gemini || null,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return apiError(error, "Error creating prediccion:");
  }
}
