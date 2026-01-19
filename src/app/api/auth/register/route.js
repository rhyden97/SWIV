import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { apiError, badRequest } from "@/lib/api-response";

export async function POST(request) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { password, nombre, apellido } = body;

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "La invitación es inválida o ha expirado. Pide una nueva." },
        { status: 401 },
      );
    }

    if (!password || !nombre) {
      return badRequest("Nombre y contraseña son obligatorios");
    }

    if (password.length < 8) {
      return badRequest("La contraseña debe tener al menos 8 caracteres");
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: password,
    });

    if (updateError) {
      return badRequest(updateError.message);
    }

    const { data: perfilActual } = await supabase
      .from("usuarios")
      .select("rol")
      .eq("id", user.id)
      .maybeSingle();

    const rolAsignado = perfilActual?.rol || "ventas";
    const supabaseAdmin = createAdminClient();

    const { data: perfil, error: dbError } = await supabaseAdmin
      .from("usuarios")
      .upsert({
        id: user.id,
        nombre: nombre,
        apellido: apellido || "",
        rol: rolAsignado,
        activo: true,
      })
      .select()
      .single();

    if (dbError) {
      return apiError(dbError, "Error al guardar los datos del perfil:");
    }

    return NextResponse.json({
      message: "Registro completado exitosamente",
      user: perfil,
    });
  } catch (error) {
    return apiError(error, "Error en registro:");
  }
}
