import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { requireRole } from "@/lib/api-auth";
import { apiError, badRequest } from "@/lib/api-response";

export async function POST(request) {
  try {
    const auth = await requireRole(["administrador", "almacen"]);
    if (auth.response) return auth.response;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return badRequest("Falta GEMINI_API_KEY");

    const supabase = await createClient();

    let body;
    try {
      body = await request.json();
    } catch {
      return badRequest("JSON inválido");
    }

    const { productoId, nombre, proveedor } = body;

    if (!productoId || !nombre) {
      return badRequest("Se requiere el ID y nombre del producto");
    }

    const promptText = `Genera una descripción profesional para un producto de inventario:
Nombre: ${nombre}
${proveedor ? `Proveedor: ${proveedor}` : ""}

Responde ÚNICAMENTE con la descripción (un párrafo de 3-4 oraciones). Sin introducciones ni negritas.`;

    const modelName = "gemini-2.5-flash";
    const generateUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const genResp = await fetch(generateUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }],
      }),
    });

    if (!genResp.ok) {
      const errJson = await genResp.json();
      if (genResp.status === 429) {
        return NextResponse.json(
          {
            error:
              "Límite de Google alcanzado. Espera un momento antes de generar otra descripción.",
          },
          { status: 429 },
        );
      }
      return apiError(
        new Error(errJson.error?.message || "Error desconocido"),
        "Error Gemini:",
      );
    }

    const genJson = await genResp.json();
    const descripcion =
      genJson.candidates?.[0]?.content?.parts?.[0]?.text || "Sin resultado";

    const { data, error } = await supabase
      .from("productos")
      .update({ descripcion: descripcion.trim() })
      .eq("id", productoId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      modelo_usado: modelName,
      descripcion: descripcion.trim(),
      producto: data,
    });
  } catch (error) {
    return apiError(error, "Error al generar descripción:");
  }
}
