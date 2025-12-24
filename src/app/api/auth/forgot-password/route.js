import { NextResponse } from "next/server";
import { sendPasswordResetEmail } from "@/lib/mailer";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateTemporaryPassword } from "@/lib/password";
import { badRequest } from "@/lib/api-response";

const GENERIC_MESSAGE =
  "Si el correo está registrado, recibirás un mensaje con instrucciones.";

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return badRequest("El correo electrónico es requerido");
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return badRequest("Correo electrónico inválido");
    }

    const supabaseAdmin = createAdminClient();

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("perfiles_completos")
      .select("id, nombre, apellido, activo")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (profileError) {
      console.error("Error buscando perfil:", profileError);
      return NextResponse.json({ message: GENERIC_MESSAGE });
    }

    if (!profile || !profile.activo) {
      return NextResponse.json({ message: GENERIC_MESSAGE });
    }

    const passwordTemp = generateTemporaryPassword();
    const nombreCompleto = `${profile.nombre} ${profile.apellido}`.trim();

    try {
      await sendPasswordResetEmail(
        normalizedEmail,
        nombreCompleto,
        passwordTemp,
      );
    } catch (mailError) {
      console.error("Fallo al enviar correo de recuperación:", mailError);
      return NextResponse.json({ message: GENERIC_MESSAGE });
    }

    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      profile.id,
      { password: passwordTemp },
    );

    if (authError) {
      console.error("Error al actualizar la contraseña en Auth:", authError);
    }

    return NextResponse.json({ message: GENERIC_MESSAGE });
  } catch (error) {
    console.error("Error API recuperar contraseña:", error);
    return NextResponse.json({ message: GENERIC_MESSAGE });
  }
}
