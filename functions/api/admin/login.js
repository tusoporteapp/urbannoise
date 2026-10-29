// Endpoint de Autenticación de Administrador para Cloudflare Pages Functions
import { signAdminToken } from "../_auth.js";

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const rawPass = String(body.pin || body.password || "").trim();
    const cleanEmail = String(body.email || "").trim().toLowerCase();

    if (!rawPass || !cleanEmail) {
      return new Response(
        JSON.stringify({ success: false, error: "El correo y la contraseña de administrador son obligatorios." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        }
      );
    }

    // 1. Verificación estricta de correo de administrador autorizado
    const isAuthorizedAdminEmail =
      cleanEmail === "urban.noice@gmail.com" ||
      cleanEmail === "admin@urbannoise.co";

    // 2. Verificación estricta de contraseña maestra autorizada (Exact Match)
    const allowedPasswords = [
      "8624Urban",
      env?.ADMIN_MASTER_PASSWORD,
      env?.ADMIN_PIN,
    ].filter(Boolean);

    const isMatch = isAuthorizedAdminEmail && allowedPasswords.includes(rawPass);

    if (!isMatch) {
      return new Response(
        JSON.stringify({ success: false, error: "Correo o contraseña de administrador incorrecta." }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        }
      );
    }

    const token = await signAdminToken(env?.ADMIN_SECRET);

    return new Response(
      JSON.stringify({
        success: true,
        token,
        message: "Sesión de administración autenticada exitosamente.",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: "Error interno al autenticar administrador." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      }
    );
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, x-admin-token",
    },
  });
}
