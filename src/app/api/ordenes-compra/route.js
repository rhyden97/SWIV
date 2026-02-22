import { NextResponse } from "next/server";
import { sendPurchaseOrderEmail } from "@/lib/mailer";
import { requireRole } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
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

    const { data, error } = await supabase
      .from("ordenes_compra")
      .select(
        `
        *,
        proveedor:proveedores(*),
        items:orden_compra_items(
          *,
          producto:productos(*)
        )
      `,
      )
      .order("fecha_pedido", { ascending: false })
      .order("id", { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    return apiError(error, "Error fetching ordenes de compra:");
  }
}

export async function POST(request) {
  try {
    const auth = await requireRole(["administrador", "almacen"]);
    if (auth.response) return auth.response;

    const { supabase, user } = auth;
    const body = await request.json();

    if (!body.proveedor_id || !body.items || body.items.length === 0) {
      return badRequest("Proveedor e items son requeridos");
    }

    const { data: proveedor, error: proveedorError } = await supabase
      .from("proveedores")
      .select("costo_pedido")
      .eq("id", body.proveedor_id)
      .single();

    if (proveedorError) {
      console.warn("No se pudo obtener el costo de pedido del proveedor:", proveedorError);
    }

    const costoPedido = proveedor?.costo_pedido ? Number(proveedor.costo_pedido) : 0;

    const itemsTotal = body.items.reduce(
      (sum, item) => sum + item.cantidad * item.costo_unitario,
      0,
    );
    const total = itemsTotal + costoPedido;

    const { data: orden, error: ordenError } = await supabase
      .from("ordenes_compra")
      .insert([
        {
          proveedor_id: body.proveedor_id,
          usuario_id: user.id,
          fecha_pedido:
            body.fecha_pedido || new Date().toISOString().split("T")[0],
          fecha_entrega_estimada: body.fecha_entrega_estimada || null,
          estado: body.estado || "borrador",
          total_orden: total,
          notas: body.notas || null,
        },
      ])
      .select()
      .single();

    if (ordenError) throw ordenError;

    const items = body.items.map((item) => ({
      orden_compra_id: orden.id,
      producto_id: item.producto_id,
      cantidad: item.cantidad,
      costo_unitario: item.costo_unitario,
      subtotal: item.cantidad * item.costo_unitario,
      fecha_vencimiento: item.fecha_vencimiento || null,
    }));

    const { error: itemsError } = await supabase
      .from("orden_compra_items")
      .insert(items);

    if (itemsError) throw itemsError;

    return NextResponse.json(orden, { status: 201 });
  } catch (error) {
    return apiError(error, "Error creando orden de compra:");
  }
}

export async function PATCH(request) {
  try {
    const auth = await requireRole(["administrador", "almacen"]);
    if (auth.response) return auth.response;

    const body = await request.json();
    if (!body.id) {
      return badRequest("ID de orden es requerido");
    }

    const supabase = createAdminClient();

    if (body.estado === "completada" || body.estado === "recibida_parcial") {
      const { data: existingOrden, error: getOrdenError } = await supabase
        .from("ordenes_compra")
        .select("estado")
        .eq("id", body.id)
        .single();

      if (getOrdenError) throw getOrdenError;
      if (existingOrden?.estado === "completada" || existingOrden?.estado === "completado") {
        return badRequest("La orden de compra ya está completada y no se puede volver a registrar");
      }

      const usuarioId = auth.user.id;

      if (body.items && body.items.length > 0) {
        for (const item of body.items) {
          if (!item.producto_id) continue;

          const { data: existingItem } = await supabase
            .from("orden_compra_items")
            .select("id")
            .eq("orden_compra_id", body.id)
            .eq("producto_id", item.producto_id)
            .maybeSingle();

          const cantidadOrdenada = parseInt(item.cantidad_ordenada || item.cantidad || 0);
          const costoUnitario = parseFloat(item.costo_unitario || 0);
          const subtotalItem = cantidadOrdenada * costoUnitario;

          if (existingItem) {
            const { error: updateItemError } = await supabase
              .from("orden_compra_items")
              .update({
                costo_unitario: costoUnitario,
                subtotal: subtotalItem,
                cantidad: cantidadOrdenada,
                fecha_vencimiento: item.fecha_vencimiento || null,
              })
              .eq("id", existingItem.id);
            if (updateItemError) throw updateItemError;
          } else {
            const { error: insertItemError } = await supabase
              .from("orden_compra_items")
              .insert({
                orden_compra_id: body.id,
                producto_id: item.producto_id,
                cantidad: cantidadOrdenada,
                costo_unitario: costoUnitario,
                subtotal: subtotalItem,
                fecha_vencimiento: item.fecha_vencimiento || null,
              });
            if (insertItemError) throw insertItemError;
          }

          const { error: updateProductError } = await supabase
            .from("productos")
            .update({
              costo_unitario_base: costoUnitario,
            })
            .eq("id", item.producto_id);
          if (updateProductError) throw updateProductError;
        }
      }

      const { data: allItems, error: getItemsError } = await supabase
        .from("orden_compra_items")
        .select("subtotal")
        .eq("orden_compra_id", body.id);

      if (getItemsError) throw getItemsError;

      const newTotal = allItems.reduce((sum, item) => sum + Number(item.subtotal || 0), 0);

      const { data: updatedOrden, error: ordenError } = await supabase
        .from("ordenes_compra")
        .update({
          estado: body.estado || "completada",
          notas: body.observations || null,
          total_orden: newTotal,
          calificacion: body.calificacion !== undefined ? body.calificacion : null,
          fecha_entrega_real: new Date().toISOString().split("T")[0],
        })
        .eq("id", body.id)
        .select()
        .single();

      if (ordenError) throw ordenError;

      if (body.items && body.items.length > 0) {
        const movements = body.items
          .filter((item) => item.producto_id && parseInt(item.cantidad) > 0)
          .map((item) => ({
            producto_id: item.producto_id,
            usuario_id: usuarioId,
            tipo_movimiento: "entrada",
            cantidad: parseInt(item.cantidad),
            orden_compra_id: body.id,
          }));

        if (movements.length > 0) {
          const { error: movsError } = await supabase
            .from("movimientos_inventario")
            .insert(movements);

          if (movsError) throw movsError;
        }
      }

      return NextResponse.json(updatedOrden);
    } else {
      const updatePayload = {};
      if (body.url_comprobante !== undefined) {
        updatePayload.url_comprobante = body.url_comprobante;
      }
      if (body.estado !== undefined) {
        updatePayload.estado = body.estado;
      }
      if (body.notas !== undefined) {
        updatePayload.notas = body.notas;
      }
      if (body.fecha_pedido !== undefined) {
        updatePayload.fecha_pedido = body.fecha_pedido;
      }
      if (body.fecha_entrega_estimada !== undefined) {
        updatePayload.fecha_entrega_estimada = body.fecha_entrega_estimada;
      }
      if (body.total_orden !== undefined) {
        updatePayload.total_orden = body.total_orden;
      }

      const { data, error } = await supabase
        .from("ordenes_compra")
        .update(updatePayload)
        .eq("id", body.id)
        .select()
        .single();

      if (error) throw error;

      if (data && data.estado === "emitida" && data.proveedor_id) {
        const pdfUrl = data.url_comprobante;
        if (pdfUrl) {
          (async () => {
            try {
              const { data: providerData } = await supabase
                .from("proveedores")
                .select("nombre, email")
                .eq("id", data.proveedor_id)
                .single();

              if (providerData && providerData.email) {
                await sendPurchaseOrderEmail(
                  providerData.email,
                  providerData.nombre,
                  pdfUrl,
                  data.id
                );
                console.log(`Correo de orden de compra #${data.id} enviado con éxito a ${providerData.email}`);
              }
            } catch (mailErr) {
              console.error("Error al enviar correo al proveedor:", mailErr);
            }
          })();
        } else {
          console.warn(`No se envió el correo de la orden #${data.id} porque no tiene url_comprobante`);
        }
      }

      return NextResponse.json(data);
    }
  } catch (error) {
    return apiError(error, "Error actualizando orden de compra:");
  }
}
