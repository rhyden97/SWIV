import { NextResponse } from "next/server";
import { requireRole } from "@/lib/api-auth";
import { apiError, badRequest } from "@/lib/api-response";

export async function GET(request) {
  try {
    const auth = await requireRole(["administrador", "visitante"]);
    if (auth.response) return auth.response;

    const { supabase } = auth;
    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get("tipo");
    const fechaInicio = searchParams.get("fecha_inicio");
    const fechaFin = searchParams.get("fecha_fin");

    if (!tipo) {
      return badRequest("El tipo de reporte es requerido");
    }

    let data = [];

    switch (tipo) {
      case "ventas":
      case "ventas-detallado":
      case "ventas-resumen":
      case "ventas-productos":
        let ventasQuery = supabase
          .from("ventas")
          .select(
            "id, fecha_venta, total_venta, metodo_pago, cliente_id, usuario_id, url_recibo, clientes(nombre)"
          )
          .order("fecha_venta", { ascending: false })
          .limit(500);

        if (fechaInicio) {
          ventasQuery = ventasQuery.gte("fecha_venta", fechaInicio);
        }
        if (fechaFin) {
          ventasQuery = ventasQuery.lte("fecha_venta", `${fechaFin}T23:59:59.999Z`);
        }

        const { data: ventasData, error: ventasError } = await ventasQuery;
        if (ventasError) throw ventasError;

        const usuarioIds = [...new Set((ventasData || []).map((v) => v.usuario_id).filter(Boolean))];
        const usuariosMap = {};
        if (usuarioIds.length > 0) {
          const { data: usuariosData, error: usuariosError } = await supabase
            .from("usuarios")
            .select("id, nombre")
            .in("id", usuarioIds);
          
          if (!usuariosError && usuariosData) {
            usuariosData.forEach((u) => {
              usuariosMap[u.id] = u.nombre;
            });
          }
        }

        data = (ventasData || []).map((venta) => ({
          id: venta.id,
          date: venta.fecha_venta,
          customer: venta.clientes
            ? venta.clientes.nombre
            : `Cliente ${venta.cliente_id}`,
          product: "Varios",
          quantity: 1,
          unitPrice: venta.total_venta,
          total: venta.total_venta,
          salesPerson: usuariosMap[venta.usuario_id] || `Usuario ${venta.usuario_id}`,
          receiptUrl: venta.url_recibo,
          paymentMethod: venta.metodo_pago,
        }));
        break;

      case "inventario":
      case "inventario-stock":
      case "inventario-valorizado":
        const { data: productosData, error: productosError } = await supabase
          .from("productos")
          .select("*")
          .order("nombre", { ascending: true });

        if (productosError) throw productosError;

        data = (productosData || []).map((producto) => ({
          id: producto.id,
          product: producto.nombre,
          sku: producto.sku,
          currentStock: producto.stock_actual || 0,
          reorderPoint: producto.punto_reorden || 0,
          status:
            (producto.stock_actual || 0) <= (producto.punto_reorden || 0)
              ? "Bajo Stock"
              : "Normal",
          unitCost: producto.costo_unitario_base || 0,
          totalValue:
            (producto.stock_actual || 0) * (producto.costo_unitario_base || 0),
          category: producto.clasificacion_abc || "N/A",
        }));
        break;

      case "inventario-movimientos":
        let movimientosQuery = supabase
          .from("movimientos_inventario")
          .select(
            "id, producto_id, tipo_movimiento, cantidad, fecha_movimiento, productos(nombre)"
          )
          .order("fecha_movimiento", { ascending: false })
          .limit(500);

        if (fechaInicio) {
          movimientosQuery = movimientosQuery.gte(
            "fecha_movimiento",
            fechaInicio
          );
        }
        if (fechaFin) {
          movimientosQuery = movimientosQuery.lte("fecha_movimiento", `${fechaFin}T23:59:59.999Z`);
        }

        const { data: movimientosData, error: movimientosError } =
          await movimientosQuery;
        if (movimientosError) throw movimientosError;

        data = (movimientosData || []).map((mov) => ({
          id: mov.id,
          date: mov.fecha_movimiento,
          product: mov.productos?.nombre || `Producto ${mov.producto_id}`,
          type: mov.tipo_movimiento,
          quantity: mov.cantidad,
          reason:
            mov.tipo_movimiento === "entrada"
              ? "Compra"
              : mov.tipo_movimiento === "salida"
              ? "Venta"
              : "Ajuste",
          reference: mov.id.slice(0, 8),
        }));
        break;

      case "ordenes-compra":
        let ordenesQuery = supabase
          .from("ordenes_compra")
          .select(
            "id, proveedor_id, fecha_pedido, fecha_entrega_estimada, estado, total_orden"
          )
          .order("fecha_pedido", { ascending: false })
          .limit(500);

        if (fechaInicio) {
          ordenesQuery = ordenesQuery.gte("fecha_pedido", fechaInicio);
        }
        if (fechaFin) {
          ordenesQuery = ordenesQuery.lte("fecha_pedido", fechaFin);
        }

        const { data: ordenesData, error: ordenesError } = await ordenesQuery;
        if (ordenesError) throw ordenesError;

        data = (ordenesData || []).map((orden) => ({
          id: orden.id,
          date: orden.fecha_pedido,
          supplier: `Proveedor ${orden.proveedor_id}`,
          estimatedDelivery: orden.fecha_entrega_estimada,
          status: orden.estado,
          total: orden.total_orden,
        }));
        break;

      default:
        return badRequest("Tipo de reporte no válido");
    }

    return NextResponse.json(data);
  } catch (error) {
    return apiError(error, "Error generating report:");
  }
}

export async function POST(request) {
  try {
    const auth = await requireRole(["administrador", "visitante"]);
    if (auth.response) return auth.response;

    const { supabase, user } = auth;
    const body = await request.json();

    if (!body.tipo_reporte) {
      return badRequest("El tipo de reporte es requerido");
    }

    const { data, error } = await supabase
      .from("reportes")
      .insert([
        {
          tipo_reporte: body.tipo_reporte,
          parametros: body.parametros || null,
          url_archivo: body.url_archivo || null,
          generado_por_id: user.id,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return apiError(error, "Error saving report:");
  }
}
