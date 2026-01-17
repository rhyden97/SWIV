import { NextResponse } from "next/server";
import { getApiSession } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiError, badRequest } from "@/lib/api-response";

const MAX_NAME_LENGTH = 80;

export async function PUT(request) {
  try {
    const session = await getApiSession();

    if (!session.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    if (!session.active) {
      return NextResponse.json({ error: "Usuario inactivo" }, { status: 403 });
    }

    if (session.role === "visitante") {
      return NextResponse.json(
        { error: "Los usuarios con rol visitante no pueden modificar su perfil" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const nombre =
      typeof body.nombre === "string" ? body.nombre.trim() : undefined;
    const apellido =
      typeof body.apellido === "string" ? body.apellido.trim() : undefined;

    if (!nombre) {
      return badRequest("El nombre es obligatorio");
    }

    if (
      nombre.length > MAX_NAME_LENGTH ||
      (apellido && apellido.length > MAX_NAME_LENGTH)
    ) {
      return badRequest("El nombre o apellido es demasiado largo");
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      return apiError(
        new Error("Configuración del servidor incompleta"),
        "Falta SUPABASE_SERVICE_ROLE_KEY",
      );
    }

    const supabaseAdmin = createAdminClient();

    const { data, error } = await supabaseAdmin
      .from("usuarios")
      .update({
        nombre,
        apellido: apellido || "",
      })
      .eq("id", session.user.id)
      .select("id, nombre, apellido, rol, activo")
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    return apiError(error, "Error al actualizar el perfil:");
  }
}
