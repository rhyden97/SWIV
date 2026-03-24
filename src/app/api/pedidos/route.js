import { NextResponse } from "next/server";
import { requireRole } from "@/lib/api-auth";
import { apiError, badRequest } from "@/lib/api-response";

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

    const { data: ordenes, error } = await supabase
      .from("ordenes_despacho")
      .select("id, descripcion, fecha_inicio, fecha_entrega, estado, venta_id")
      .order("fecha_inicio", { ascending: false })
      .limit(20);

    if (error) throw error;
    if (!ordenes || ordenes.length === 0) {
      return NextResponse.json([]);
    }

    const ventaIds = ordenes.map((o) => o.venta_id).filter(Boolean);
    const { data: ventas } = await supabase
      .from("ventas")
      .select(
        "id, fecha_venta, total_venta, metodo_pago, cliente_id, url_recibo"
      )
      .in("id", ventaIds);

    const clienteIds = (ventas || []).map((v) => v.cliente_id).filter(Boolean);
    const { data: clientes } = await supabase
      .from("clientes")
      .select("id, nombre, telefono")
      .in("id", clienteIds);

    const { data: items } = await supabase
      .from("venta_items")
      .select("venta_id, cantidad, precio_unitario, producto_id")
      .in("venta_id", ventaIds);

    const productoIds = (items || []).map((i) => i.producto_id).filter(Boolean);
    const { data: productos } = await supabase
      .from("productos")
      .select("id, nombre, sku")
      .in("id", productoIds);

    const ventasMap = new Map((ventas || []).map((v) => [v.id, v]));
    const clientesMap = new Map((clientes || []).map((c) => [c.id, c]));
    const productosMap = new Map((productos || []).map((p) => [p.id, p]));

    const itemsPorVenta = (items || []).reduce((acc, item) => {
      if (!acc[item.venta_id]) acc[item.venta_id] = [];
      const producto = productosMap.get(item.producto_id);
      acc[item.venta_id].push({
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        producto: producto
          ? { nombre: producto.nombre, sku: producto.sku }
          : null,
      });
      return acc;
    }, {});

    const pedidos = ordenes.map((orden) => {
      const venta = ventasMap.get(orden.venta_id);
      const cliente = venta ? clientesMap.get(venta.cliente_id) : null;
      const ventaItems = itemsPorVenta[orden.venta_id] || [];

      return {
        id: orden.id,
        title: `Pedido ${cliente?.nombre || "Sin cliente"}`,
        description: orden.descripcion,
        status: orden.estado,
        priority: obtenerPrioridad(orden.fecha_entrega),
        dueDate: orden.fecha_entrega,
        assignee: "Sistema",
        venta_id: orden.venta_id,
        fecha_inicio: orden.fecha_inicio,
        total: venta?.total_venta || 0,
        cliente: cliente?.nombre || "Sin cliente",
        telefono: cliente?.telefono || "",
        items: ventaItems,
        receiptUrl: venta?.url_recibo || null,
      };
    });

    return NextResponse.json(pedidos);
  } catch (error) {
    return apiError(error, "Error fetching pedidos:");
  }
}

export async function POST(request) {
  try {
    const auth = await requireRole(["administrador", "almacen"]);
    if (auth.response) return auth.response;

    const { supabase } = auth;
    const body = await request.json();

    if (!body.venta_id || !body.descripcion || !body.fecha_inicio) {
      return badRequest("venta_id, descripcion y fecha_inicio son requeridos");
    }

    const { data, error } = await supabase
      .from("ordenes_despacho")
      .insert([
        {
          venta_id: body.venta_id,
          descripcion: body.descripcion,
          fecha_inicio: body.fecha_inicio,
          fecha_entrega: body.fecha_entrega || null,
          estado: body.estado || "pendiente",
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return apiError(error, "Error creating pedido:");
  }
}

export async function PATCH(request) {
  try {
    const auth = await requireRole(["administrador", "almacen"]);
    if (auth.response) return auth.response;

    const { supabase } = auth;
    const body = await request.json();

    if (!body.id) {
      return badRequest("ID es requerido");
    }

    const updateData = {
      estado: body.estado,
    };

    if (body.fecha_entrega) {
      updateData.fecha_entrega = body.fecha_entrega;
    }

    if (body.descripcion !== undefined) {
      updateData.descripcion = body.descripcion;
    }

    const { data, error } = await supabase
      .from("ordenes_despacho")
      .update(updateData)
      .eq("id", body.id)
      .select()
      .single();

    if (error) {
      console.error("Error Supabase:", error);
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    return apiError(error, "Error updating pedido:");
  }
}

function obtenerPrioridad(fechaEntrega) {
  if (!fechaEntrega) return "medium";
  const hoy = new Date();
  const entrega = new Date(fechaEntrega);
  const diasRestantes = Math.ceil((entrega - hoy) / (1000 * 60 * 60 * 24));
  if (diasRestantes <= 2) return "high";
  if (diasRestantes <= 7) return "medium";
  return "low";
}
