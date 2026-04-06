import { NextResponse } from "next/server";
import { requireRole } from "@/lib/api-auth";
import { apiError, badRequest } from "@/lib/api-response";

export async function GET(request) {
  try {
    const auth = await requireRole([
      "administrador",
      "almacen",
      "ventas",
      "visitante",
    ]);
    if (auth.response) return auth.response;

    const { supabase } = auth;
    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get("tipo");

    if (tipo === "lotes") {
      const { data, error } = await supabase
        .from("lotes_producto")
        .select(`
          id,
          codigo_lote,
          stock_lote,
          fecha_vencimiento,
          productos ( nombre, es_perecedero, dias_alerta_vencimiento )
        `)
        .gt("stock_lote", 0)
        .order("fecha_vencimiento", { ascending: true });

      if (error) throw error;
      return NextResponse.json(data);
    }

    const [
      usuariosRes,
      tareasRes,
      areasRes,
      registrosRes,
      productosRes,
    ] = await Promise.all([
      supabase
        .from("perfiles_completos")
        .select("id, nombre, apellido, rol"),
      supabase
        .from("tareas_conteo")
        .select(`*, productos ( nombre, sku, ubicacion )`)
        .order("fecha_asignacion", { ascending: false }),
      supabase
        .from("areas_almacen")
        .select("*")
        .order("nombre", { ascending: true }),
      supabase
        .from("registros_limpieza")
        .select(`*, areas_almacen ( nombre, descripcion, criterios_checklist )`)
        .order("fecha_registro", { ascending: false }),
      supabase
        .from("productos")
        .select("id, nombre, sku, stock_actual")
        .eq("activo", true)
        .order("nombre", { ascending: true }),
    ]);

    if (usuariosRes.error) throw usuariosRes.error;
    if (tareasRes.error) throw tareasRes.error;
    if (areasRes.error) throw areasRes.error;
    if (registrosRes.error) throw registrosRes.error;
    if (productosRes.error) throw productosRes.error;

    return NextResponse.json({
      usuarios: usuariosRes.data || [],
      tareasConteo: tareasRes.data || [],
      areasLimpieza: areasRes.data || [],
      registrosLimpieza: registrosRes.data || [],
      productosDisponibles: productosRes.data || [],
    });
  } catch (error) {
    return apiError(error, "Error en API de auditoría:");
  }
}

export async function POST(request) {
  try {
    const auth = await requireRole(["administrador", "almacen"]);
    if (auth.response) return auth.response;

    const { supabase } = auth;
    const body = await request.json();
    const { action } = body;

    if (action === "crear_tarea_conteo") {
      const { producto_id, stock_logico_snapshot, usuario_asignado_id } = body;
      const { data, error } = await supabase
        .from("tareas_conteo")
        .insert({
          producto_id,
          stock_logico_snapshot,
          usuario_asignado_id:
            usuario_asignado_id && usuario_asignado_id !== "none"
              ? usuario_asignado_id
              : null,
          estado: "Pendiente",
          fecha_asignacion: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, data });
    }

    if (action === "crear_area") {
      const { nombre, descripcion, frecuencia_dias, criterios_checklist } = body;
      const { data, error } = await supabase
        .from("areas_almacen")
        .insert({
          nombre,
          descripcion,
          frecuencia_dias: parseInt(frecuencia_dias) || 7,
          criterios_checklist: criterios_checklist || [],
        })
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, data });
    }

    if (action === "inicializar_limpieza") {
      const { error } = await supabase.rpc("inicializar_rutina_diaria");
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    if (action === "crear_tarea_limpieza") {
      const { area_id, usuario_id } = body;
      const { data, error } = await supabase
        .from("registros_limpieza")
        .insert({
          area_id,
          usuario_id:
            usuario_id && usuario_id !== "none" ? usuario_id : null,
          estado: "asignado",
          resultados_checklist: {},
          fecha_registro: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, data });
    }

    return badRequest("Acción no válida");
  } catch (error) {
    return apiError(error, "Error en POST auditoría:");
  }
}

export async function PATCH(request) {
  try {
    const auth = await requireRole(["administrador", "almacen"]);
    if (auth.response) return auth.response;

    const { supabase, user } = auth;
    const body = await request.json();
    const { action, id } = body;

    if (!id) return badRequest("Se requiere ID");

    if (action === "actualizar_area") {
      const { nombre, descripcion, frecuencia_dias, criterios_checklist } = body;
      const { data, error } = await supabase
        .from("areas_almacen")
        .update({
          nombre,
          descripcion,
          frecuencia_dias: parseInt(frecuencia_dias) || 7,
          criterios_checklist: criterios_checklist || [],
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, data });
    }

    if (action === "actualizar_estado_limpieza") {
      const { estado } = body;
      const { data, error } = await supabase
        .from("registros_limpieza")
        .update({ estado })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, data });
    }

    if (action === "asignar_usuario_limpieza") {
      const { usuario_id } = body;
      const uId = usuario_id === "none" ? null : usuario_id;
      const { data, error } = await supabase
        .from("registros_limpieza")
        .update({ usuario_id: uId })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, data });
    }

    if (action === "completar_tarea_conteo") {
      const {
        conteo_fisico,
        diferencia,
        estado,
        justificacion_ajuste,
      } = body;

      const updatePayload = {
        conteo_fisico,
        diferencia: diferencia ?? 0,
        estado: estado || "Completada",
        usuario_asignado_id: user?.id || null,
        fecha_completado: new Date().toISOString(),
      };

      if (justificacion_ajuste !== undefined) {
        updatePayload.justificacion_ajuste = justificacion_ajuste;
      }

      const { data, error } = await supabase
        .from("tareas_conteo")
        .update(updatePayload)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, data });
    }

    if (action === "completar_limpieza") {
      const {
        resultados_checklist,
        observaciones,
        url_evidencia,
      } = body;

      const { data, error } = await supabase
        .from("registros_limpieza")
        .update({
          usuario_id: user?.id || null,
          resultados_checklist: resultados_checklist || {},
          observaciones: observaciones || "Limpieza y orden verificados.",
          estado: "realizado",
          url_evidencia: url_evidencia || null,
          fecha_registro: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, data });
    }

    return badRequest("Acción no válida");
  } catch (error) {
    return apiError(error, "Error en PATCH auditoría:");
  }
}
