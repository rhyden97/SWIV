import { NextResponse } from "next/server";
import { checkAndCreateDraftOrder } from "@/lib/autogenerate-orders";
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
    const query = searchParams.get("q")?.trim();
    const proveedorId = searchParams.get("proveedorId")?.trim();
    const productId = searchParams.get("id")?.trim();

    let productosQuery = supabase
      .from("productos")
      .select(
        "id, nombre, precio_venta, stock_actual, sku, proveedor_id, costo_unitario_base, es_perecedero, eoq, punto_reorden, clasificacion_abc, dias_alerta_vencimiento, stock_seguridad, ubicacion, proveedor:proveedores(id, nombre, tiempo_entrega, costo_pedido)",
      )
      .eq("activo", true)
      .order("clasificacion_abc", { ascending: true })
      .order("nombre", { ascending: true });

    if (proveedorId) {
      productosQuery = productosQuery.eq("proveedor_id", proveedorId);
    }

    if (productId) {
      productosQuery = productosQuery.eq("id", productId);
    }

    if (query) {
      productosQuery = productosQuery.or(
        `nombre.ilike.%${query}%,sku.ilike.%${query}%`,
      );
    }

    const { data, error } = await productosQuery;

    if (error) throw error;

    const mappedData = (data || []).map((product) => ({
      ...product,
      proveedor_nombre: product.proveedor?.nombre || "Sin proveedor",
      proveedor_tiempo_entrega: product.proveedor?.tiempo_entrega || 0,
    }));

    return NextResponse.json(mappedData);
  } catch (error) {
    return apiError(error, "Error fetching productos:");
  }
}

export async function POST(request) {
  try {
    const auth = await requireRole(["administrador", "almacen"]);
    if (auth.response) return auth.response;

    const { supabase } = auth;
    const body = await request.json();

    if (!body.nombre || body.precio_venta === undefined) {
      return badRequest("Nombre y precio de venta son requeridos");
    }

    const { data, error } = await supabase
      .from("productos")
      .insert([
        {
          nombre: body.nombre,
          descripcion: body.descripcion || null,
          sku: body.sku || null,
          stock_actual: body.stock_actual || 0,
          precio_venta: body.precio_venta,
          proveedor_id: body.proveedor_id || null,
          clasificacion_abc: body.clasificacion_abc || null,
          eoq: body.eoq || null,
          punto_reorden:
            body.punto_reorden !== undefined
              ? body.punto_reorden
              : body.stock_minimo || 0,
          stock_seguridad: body.stock_seguridad || null,
          ubicacion: body.ubicacion || null,
          ubicacion_objetivo: body.ubicacion_objetivo || null,
          unidad_medida: body.unidad_medida || null,
          politica_inventario: body.politica_inventario || null,
          costo_unitario_base: body.costo_unitario_base || null,
          origen: body.origen || null,
          es_perecedero:
            body.es_perecedero !== undefined ? body.es_perecedero : false,
          dias_alerta_vencimiento:
            body.dias_alerta_vencimiento !== undefined
              ? body.dias_alerta_vencimiento
              : null,
          url_imagen: body.url_imagen || null,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return apiError(error, "Error creating producto:");
  }
}

export async function PUT(request) {
  try {
    const auth = await requireRole(["administrador", "almacen"]);
    if (auth.response) return auth.response;

    const { supabase, user } = auth;
    const body = await request.json();

    if (!body.sku && !body.id) {
      return badRequest("Se requiere SKU o ID para actualizar");
    }

    const { sku, id, ...updateData } = body;
    delete updateData.proveedores;

    if (updateData.stock_minimo !== undefined) {
      if (updateData.punto_reorden === undefined) {
        updateData.punto_reorden = updateData.stock_minimo;
      }
      delete updateData.stock_minimo;
    }

    let query = supabase.from("productos").update(updateData);

    if (sku) {
      query = query.eq("sku", sku);
    } else {
      query = query.eq("id", id);
    }

    const { data, error } = await query.select().single();

    if (error) throw error;

    try {
      if (user && data?.id) {
        await checkAndCreateDraftOrder(supabase, user.id);
      }
    } catch (autoErr) {
      console.error(
        "No se pudo auto-generar borrador de orden de compra desde productos:",
        autoErr,
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    return apiError(error, "Error updating producto:");
  }
}

export async function DELETE(request) {
  try {
    const auth = await requireRole(["administrador"]);
    if (auth.response) return auth.response;

    const { supabase } = auth;
    const { searchParams } = new URL(request.url);
    const sku = searchParams.get("sku");
    const id = searchParams.get("id");

    if (!sku && !id) {
      return badRequest("Se requiere SKU o ID para eliminar");
    }

    let query = supabase.from("productos").update({ activo: false });

    if (sku) {
      query = query.eq("sku", sku);
    } else {
      query = query.eq("id", id);
    }

    const { error } = await query;

    if (error) throw error;

    return NextResponse.json({ message: "Producto eliminado correctamente" });
  } catch (error) {
    return apiError(error, "Error deleting producto:");
  }
}
