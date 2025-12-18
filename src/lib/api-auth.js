import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function getApiSession() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { supabase, user: null, role: null, active: false };
  }

  const { data: perfil } = await supabase
    .from("usuarios")
    .select("rol, activo")
    .eq("id", user.id)
    .maybeSingle();

  return {
    supabase,
    user,
    role: perfil?.rol ?? null,
    active: perfil?.activo === true,
  };
}

export async function requireRole(allowedRoles) {
  const session = await getApiSession();

  if (!session.user) {
    return {
      response: NextResponse.json(
        { error: "No autenticado" },
        { status: 401 },
      ),
    };
  }

  if (
    !session.active ||
    !session.role ||
    !allowedRoles.includes(session.role)
  ) {
    return {
      response: NextResponse.json(
        { error: "No autorizado" },
        { status: 403 },
      ),
    };
  }

  return session;
}
