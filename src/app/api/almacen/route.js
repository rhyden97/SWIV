import { NextResponse } from "next/server";
import { requireRole } from "@/lib/api-auth";
import { apiError } from "@/lib/api-response";

export async function GET() {
  try {
    const auth = await requireRole([
      "administrador",
      "almacen",
      "ventas",
      "visitante",
    ]);
    if (auth.response) return auth.response;

    const { supabase, user } = auth;

    const [tareasRes, areasRes, lotesRes] = await Promise.all([
      supabase
        .from("tareas_conteo")
        .select(`*, productos ( nombre, sku, ubicacion )`)
        .eq("estado", "Pendiente")
        .order("id")
        .then((res) => {
          if (res.error) console.error("Error tareas conteo:", res.error);
          return res;
        }),
      supabase
        .from("registros_limpieza")
        .select(`*, areas_almacen ( id, nombre, descripcion, criterios_checklist )`)
        .in("estado", ["assigned", "asignado", "rechazado"])
        .order("fecha_registro", { ascending: false })
        .then((res) => {
          if (res.error) console.error("Error registros limpieza:", res.error);
          return res;
        }),
      supabase
        .from("lotes_producto")
        .select(`id, codigo_lote, stock_lote, fecha_vencimiento, productos ( nombre, es_perecedero, dias_alerta_vencimiento )`)
        .gt("stock_lote", 0)
        .order("fecha_vencimiento", { ascending: true })
        .then((res) => {
          if (res.error) console.error("Error lotes producto:", res.error);
          return res;
        }),
    ]);

    const tareas = tareasRes.error ? [] : (tareasRes.data || []);
    const rawAreas = areasRes.error ? [] : (areasRes.data || []);
    const lotes = lotesRes.error ? [] : (lotesRes.data || []);

    const userAreas = rawAreas.filter(
      (task) => !user || task.usuario_id === null || task.usuario_id === user.id,
    );

    return NextResponse.json({
      tareas,
      areas: userAreas,
      lotes,
    });
  } catch (error) {
    return apiError(error, "Error cargando almacén:");
  }
}
