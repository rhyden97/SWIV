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

    let clientesQuery = supabase
      .from("clientes")
      .select("id, nombre, telefono, email, direccion")
      .eq("activo", true)
      .order("nombre", { ascending: true });

    if (query) {
      clientesQuery = clientesQuery.or(
        `nombre.ilike.%${query}%,email.ilike.%${query}%,telefono.ilike.%${query}%`,
      );
    }

    if (limitParam) {
      clientesQuery = clientesQuery.limit(parseInt(limitParam, 10));
    }

    const { data, error } = await clientesQuery;

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    return apiError(error, "Error fetching clientes:");
  }
}

export async function POST(request) {
  try {
    const auth = await requireRole(["administrador", "ventas"]);
    if (auth.response) return auth.response;

    const { supabase } = auth;
    const body = await request.json();

    if (!body.nombre) {
      return badRequest("El nombre es requerido");
    }

    const { data, error } = await supabase
      .from("clientes")
      .insert([
        {
          nombre: body.nombre,
          telefono: body.telefono || null,
          email: body.email || null,
          direccion: body.direccion || null,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return apiError(error, "Error creating cliente:");
  }
}

export async function PUT(request) {
  try {
    const auth = await requireRole(["administrador", "ventas"]);
    if (auth.response) return auth.response;

    const { supabase } = auth;
    const body = await request.json();

    if (!body.id) {
      return badRequest("Se requiere ID para actualizar");
    }

    const { id, ...updateData } = body;

    const { data, error } = await supabase
      .from("clientes")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    return apiError(error, "Error updating cliente:");
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
      .from("clientes")
      .update({ activo: false })
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ message: "Cliente eliminado correctamente" });
  } catch (error) {
    return apiError(error, "Error deleting cliente:");
  }
}
