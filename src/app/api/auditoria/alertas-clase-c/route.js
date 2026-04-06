import { NextResponse } from "next/server";
import { requireRole } from "@/lib/api-auth";
import { apiError } from "@/lib/api-response";

export async function POST() {
  try {
    const auth = await requireRole(["administrador", "almacen"]);
    if (auth.response) return auth.response;

    const { supabase } = auth;
    const { data, error } = await supabase.rpc(
      "generar_alertas_rop_clase_c",
    );

    if (error) throw error;

    const result = Array.isArray(data) ? data[0] : data;

    return NextResponse.json({
      insertadas: result?.insertadas ?? 0,
      actualizadas: result?.actualizadas ?? 0,
    });
  } catch (error) {
    return apiError(error, "Error generando alertas Clase C:");
  }
}
