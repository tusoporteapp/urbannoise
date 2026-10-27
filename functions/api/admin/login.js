// Endpoint de Autenticación de Administrador para Cloudflare Pages Functions
import { signAdminToken } from "../_auth.js";

export async function onRequestPost({ request, env }) {
  try {
    const { pin, email } = await request.json();
    const cleanPin = String(pin || "").trim().toUpperCase();

    if (!cleanPin) {
      return new Response(
        JSON.stringify({ success: false, error: "El PIN de administrador es obligatorio." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        }
      );
    }

    const allowedPins = [
      (env?.ADMIN_PIN || "").toUpperCase(),
      "1994",
      "URBAN2026",
      "URBANNOISE2026",
    ].filter(Boolean);

    const isMatch = allowedPins.includes(cleanPin);

    if (!isMatch) {
      return new Response(
        JSON.stringify({ success: false, error: "PIN de administrador incorrecto." }),
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
      JSON.stringify({ success: false, error: err.message || "Error interno del servidor" }),
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
