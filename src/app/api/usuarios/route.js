import { NextResponse } from "next/server";
import { requireRole } from "@/lib/api-auth";
import { apiError, badRequest } from "@/lib/api-response";

export async function GET() {
  try {
    const auth = await requireRole(["administrador"]);
    if (auth.response) return auth.response;

    const { supabase } = auth;

    const { data, error } = await supabase
      .from("perfiles_completos")
      .select("id, nombre, apellido, rol, activo, email")
      .eq("activo", true)
      .order("nombre", { ascending: true });

    if (error) throw error;

    const mappedData = (data || []).map((user) => ({
      ...user,
      estado: user.activo ? "Activo" : "Inactivo",
    }));

    return NextResponse.json(mappedData);
  } catch (error) {
    return apiError(error, "Error al obtener usuarios:");
  }
}

export async function PUT(request) {
  try {
    const auth = await requireRole(["administrador"]);
    if (auth.response) return auth.response;

    const { supabase } = auth;
    const body = await request.json();

    const { id, nombre, apellido, rol, estado } = body;

    if (!id) {
      return badRequest("ID de usuario es requerido");
    }

    const usuarioActualizado = {};
    if (nombre !== undefined) usuarioActualizado.nombre = nombre;
    if (apellido !== undefined) usuarioActualizado.apellido = apellido;
    if (rol !== undefined) usuarioActualizado.rol = rol;
    if (estado !== undefined) {
      usuarioActualizado.activo = estado === "Activo";
    }

    const { error: updateError } = await supabase
      .from("usuarios")
      .update(usuarioActualizado)
      .eq("id", id);

    if (updateError) throw updateError;

    const { data: updatedProfile, error: fetchError } = await supabase
      .from("perfiles_completos")
      .select("id, nombre, apellido, rol, activo, email")
      .eq("id", id)
      .single();

    if (fetchError) throw fetchError;

    return NextResponse.json({
      ...updatedProfile,
      estado: updatedProfile.activo ? "Activo" : "Inactivo",
    });
  } catch (error) {
    return apiError(error, "Error al actualizar usuario:");
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
      return badRequest("ID de usuario es requerido");
    }

    const { error } = await supabase
      .from("usuarios")
      .update({ activo: false })
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: "Usuario eliminado" });
  } catch (error) {
    return apiError(error, "Error al eliminar usuario:");
  }
}
