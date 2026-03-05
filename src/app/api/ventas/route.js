import { NextResponse } from "next/server";
import { sendSaleReceiptEmail } from "@/lib/mailer";
import { checkAndCreateDraftOrder } from "@/lib/autogenerate-orders";
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

    const { data: ventasData, error: ventasError } = await supabase
      .from("ventas")
      .select(
        `
        *,
        cliente:clientes(*),
        items:venta_items(
          *,
          producto:productos(*)
        )
      `,
      )
      .order("fecha_venta", { ascending: false });

    if (ventasError) throw ventasError;

    const usuarioIds = [...new Set((ventasData || []).map((v) => v.usuario_id).filter(Boolean))];
    const usuariosMap = {};
    if (usuarioIds.length > 0) {
      const { data: usuariosData, error: usuariosError } = await supabase
        .from("usuarios")
        .select("*")
        .in("id", usuarioIds);
      
      if (!usuariosError && usuariosData) {
        usuariosData.forEach((u) => {
          usuariosMap[u.id] = u;
        });
      }
    }

    const data = (ventasData || []).map((venta) => ({
      ...venta,
      usuario: usuariosMap[venta.usuario_id] || null,
    }));

    return NextResponse.json(data);
  } catch (error) {
    return apiError(error, "Error fetching ventas:");
  }
}

export async function POST(request) {
  try {
    const auth = await requireRole(["administrador", "ventas"]);
    if (auth.response) return auth.response;

    const { supabase, user } = auth;
    const body = await request.json();

    if (!body.cliente_id || !body.items || body.items.length === 0) {
      return badRequest("Cliente e items son requeridos");
    }

    const productIds = body.items.map((item) => item.producto_id);
    const { data: productos, error: prodError } = await supabase
      .from("productos")
      .select("id, nombre, stock_actual, precio_venta")
      .in("id", productIds);

    if (prodError) throw prodError;

    const stockMap = {};
    (productos || []).forEach((p) => {
      stockMap[p.id] = {
        nombre: p.nombre,
        stock: Number(p.stock_actual) || 0,
        precio: Number(p.precio_venta) || 0,
      };
    });

    let hasStockIssue = false;
    const itemsConPrecio = [];

    for (const item of body.items) {
      const prodInfo = stockMap[item.producto_id];
      const cantidad = Number(item.cantidad);

      if (!prodInfo || !Number.isInteger(cantidad) || cantidad <= 0) {
        return badRequest("Item inválido: producto o cantidad incorrectos");
      }

      itemsConPrecio.push({
        producto_id: item.producto_id,
        cantidad,
        precio_unitario: prodInfo.precio,
      });

      if (prodInfo.stock < cantidad) {
        hasStockIssue = true;
      }
    }

    const finalMetodoPago = hasStockIssue ? "cancelada" : (body.metodo_pago || null);

    let venta = null;
    try {
      const total = itemsConPrecio.reduce(
        (sum, item) => sum + item.cantidad * item.precio_unitario,
        0,
      );

      const { data: ventaData, error: ventaError } = await supabase
        .from("ventas")
        .insert([
          {
            cliente_id: body.cliente_id,
            usuario_id: user.id,
            fecha_venta: body.fecha_venta || new Date().toISOString(),
            total_venta: total,
            metodo_pago: finalMetodoPago,
            url_recibo: body.url_recibo || null,
          },
        ])
        .select()
        .single();

      if (ventaError) throw ventaError;
      venta = ventaData;

      const items = itemsConPrecio.map((item) => ({
        venta_id: venta.id,
        producto_id: item.producto_id,
        cantidad,
        precio_unitario: item.precio_unitario,
        subtotal: item.cantidad * item.precio_unitario,
      }));

      const { error: itemsError } = await supabase
        .from("venta_items")
        .insert(items);

      if (itemsError) throw itemsError;

      if (!hasStockIssue) {
        const { data: despachoData } = await supabase
          .from("ordenes_despacho")
          .select("id")
          .eq("venta_id", venta.id)
          .maybeSingle();

        const movements = itemsConPrecio.map((item) => ({
          producto_id: item.producto_id,
          usuario_id: user.id,
          tipo_movimiento: "salida",
          cantidad: item.cantidad,
          orden_despacho_id: despachoData?.id || null,
        }));

        const { error: movsError } = await supabase
          .from("movimientos_inventario")
          .insert(movements);

        if (movsError) throw movsError;

        try {
          const adminForDrafts = process.env.SUPABASE_SERVICE_ROLE_KEY
            ? createAdminClient()
            : supabase;

          await checkAndCreateDraftOrder(adminForDrafts, user.id);
        } catch (autoErr) {
          console.error("No se pudo auto-generar borrador de orden de compra:", autoErr);
        }
      }

      return NextResponse.json(venta, { status: 201 });
    } catch (dbError) {
      console.error("Error en base de datos al registrar la venta, ejecutando rollback manual...");
      if (venta && venta.id) {
        await supabase.from("venta_items").delete().eq("venta_id", venta.id);
        await supabase.from("ventas").delete().eq("id", venta.id);
      }
      throw dbError;
    }
  } catch (error) {
    return apiError(error, "Error creating venta:");
  }
}

export async function PATCH(request) {
  try {
    const auth = await requireRole(["administrador", "ventas"]);
    if (auth.response) return auth.response;

    const body = await request.json();
    if (!body.id || !body.url_recibo) {
      return badRequest("ID y url_recibo son requeridos");
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("ventas")
      .update({ url_recibo: body.url_recibo })
      .eq("id", body.id)
      .select()
      .single();

    if (error) throw error;

    if (data && data.cliente_id) {
      (async () => {
        try {
          const { data: clientData } = await supabase
            .from("clientes")
            .select("nombre, email")
            .eq("id", data.cliente_id)
            .single();

          if (clientData && clientData.email) {
            await sendSaleReceiptEmail(
              clientData.email,
              clientData.nombre,
              body.url_recibo,
              data.total_venta,
              data.id
            );
            console.log(`Correo de venta #${data.id} enviado con éxito a ${clientData.email}`);
          }
        } catch (mailError) {
          console.error("Fallo al enviar correo de venta al cliente:", mailError);
        }
      })();
    }

    return NextResponse.json(data);
  } catch (error) {
    return apiError(error, "Error updating venta receipt URL:");
  }
}
