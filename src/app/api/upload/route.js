import { NextResponse } from "next/server";
import { requireRole } from "@/lib/api-auth";
import { badRequest, apiError } from "@/lib/api-response";

const ALLOWED_BUCKETS = ["productos", "ordenes_compra", "recibos", "evidencias"];

export async function POST(request) {
  try {
    const auth = await requireRole([
      "administrador",
      "almacen",
      "ventas",
      "visitante",
    ]);
    if (auth.response) return auth.response;

    const { supabase } = auth;
    const formData = await request.formData();
    const file = formData.get("file");
    const bucket = formData.get("bucket");
    let path = formData.get("path");

    if (!file) {
      return badRequest("No se proporcionó ningún archivo.");
    }

    if (!bucket || !ALLOWED_BUCKETS.includes(bucket)) {
      return badRequest("Bucket no válido o no autorizado.");
    }

    if (!path) {
      const extension = file.name ? file.name.split(".").pop() : "bin";
      path = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${extension}`;
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const contentType = file.type || "application/octet-stream";

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, buffer, {
        contentType,
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data: publicData } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return NextResponse.json({
      publicUrl: publicData?.publicUrl || null,
      path,
    });
  } catch (error) {
    return apiError(error, "Error al subir archivo a storage:");
  }
}
