import { NextResponse } from "next/server";
import { requireRole } from "@/lib/api-auth";
import { apiError } from "@/lib/api-response";

export async function POST() {
  try {
    const auth = await requireRole(["administrador", "almacen"]);
    if (auth.response) return auth.response;

    const { supabase } = auth;
    const { error } = await supabase.rpc("calcular_abc_rop_ss");
    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "Cálculo completado correctamente.",
    });
  } catch (error) {
    return apiError(error, "Error al recalcular métricas de productos:");
  }
}
