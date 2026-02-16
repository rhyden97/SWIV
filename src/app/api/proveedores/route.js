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
    const query = searchParams.get("q")?.trim();
    const limitParam = searchParams.get("limit");

    let proveedoresQuery = supabase
      .from("proveedores")
      .select(
        "id, nombre, contacto, email, telefono, direccion, tiempo_entrega, costo_pedido, calificacion_promedio",
      )
      .eq("activo", true)
      .order("nombre", { ascending: true });

    if (query) {
      proveedoresQuery = proveedoresQuery.or(
        `nombre.ilike.%${query}%,email.ilike.%${query}%,telefono.ilike.%${query}%,contacto.ilike.%${query}%`,
      );
    }

    if (limitParam) {
      proveedoresQuery = proveedoresQuery.limit(parseInt(limitParam, 10));
    }

    const { data, error } = await proveedoresQuery;

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    return apiError(error, "Error fetching proveedores:");
  }
}

export async function POST(request) {
  try {
    const auth = await requireRole(["administrador", "almacen"]);
    if (auth.response) return auth.response;

    const { supabase } = auth;
    const body = await request.json();

    if (!body.nombre) {
      return badRequest("El nombre es requerido");
    }

    const { data, error } = await supabase
      .from("proveedores")
      .insert([
        {
          nombre: body.nombre,
          contacto: body.contacto || null,
          telefono: body.telefono || null,
          email: body.email || null,
          direccion: body.direccion || null,
          tiempo_entrega: body.tiempo_entrega || null,
          costo_pedido: body.costo_pedido || 0,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return apiError(error, "Error creating proveedor:");
  }
}

export async function PUT(request) {
  try {
    const auth = await requireRole(["administrador", "almacen"]);
    if (auth.response) return auth.response;

    const { supabase } = auth;
    const body = await request.json();

    if (!body.id) {
      return badRequest("Se requiere ID para actualizar");
    }

    const { id, ...updateData } = body;
    delete updateData.calificacion_promedio;
    delete updateData["calificación_promedio"];
    delete updateData.ordenes_compra;
    delete updateData.productos;

    const { data, error } = await supabase
      .from("proveedores")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    return apiError(error, "Error updating proveedor:");
  }
}

export async function DELETE(request) {
  try {
    const auth = await requireRole(["administrador"]);
    if (auth.response) return auth.response;

    const { supabase } = auth;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return badRequest("Se requiere ID para eliminar");
    }

    const { error } = await supabase
      .from("proveedores")
      .update({ activo: false })
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ message: "Proveedor eliminado correctamente" });
  } catch (error) {
    return apiError(error, "Error deleting proveedor:");
  }
}
