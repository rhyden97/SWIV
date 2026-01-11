import { NextResponse } from "next/server";
import { sendWelcomeEmail } from "@/lib/mailer";
import { requireRole } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateTemporaryPassword } from "@/lib/password";
import { apiError, badRequest } from "@/lib/api-response";

export async function POST(request) {
  try {
    const auth = await requireRole(["administrador"]);
    if (auth.response) return auth.response;

    const { email, nombre, apellido, rol } = await request.json();

    if (!email || !nombre || !rol) {
      return badRequest("Faltan datos requeridos");
    }

    const passwordTemp = generateTemporaryPassword();

    const supabaseAdmin = createAdminClient();

    let rolFinal = "ventas";
    if (rol.toLowerCase().includes("admin")) rolFinal = "administrador";
    else if (rol.toLowerCase().includes("almacen")) rolFinal = "almacen";
    else if (rol.toLowerCase().includes("visitante")) rolFinal = "visitante";

    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: passwordTemp,
        email_confirm: true,
        user_metadata: { nombre, apellido, rol: rolFinal },
      });

    if (authError) throw authError;

    const { error: profileError } = await supabaseAdmin
      .from("usuarios")
      .upsert({
        id: authData.user.id,
        nombre: nombre,
        apellido: apellido || "",
        rol: rolFinal,
        activo: true,
      });

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw new Error("Error creando perfil: " + profileError.message);
    }

    try {
      await sendWelcomeEmail(email, nombre, email, passwordTemp);
    } catch (mailError) {
      console.error("Fallo al enviar correo:", mailError);
      return NextResponse.json(
        {
          error:
            "Usuario creado, pero no se pudo enviar el correo de bienvenida. " +
            "Pide al usuario que use 'Recuperar contraseña' para establecer una.",
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      message: "Usuario creado y notificado correctamente",
    });
  } catch (error) {
    return apiError(error, "Error API:");
  }
}
