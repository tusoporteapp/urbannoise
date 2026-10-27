import { isAuthorizedAdmin } from "../_auth.js";

export async function onRequestGet({ request, env }) {
  try {
    // 1. Proteger datos personales de clientes con autorización de Administrador
    const authorized = await isAuthorizedAdmin(request, env);
    if (!authorized) {
      return new Response(
        JSON.stringify({ customers: [], error: "Acceso denegado. Se requiere autenticación de administrador." }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        }
      );
    }

    const url = new URL(request.url);
    const limit = url.searchParams.get("limit") || "250";
    const webOnly = url.searchParams.get("webOnly") === "true";
    const LOYVERSE_TOKEN = env?.LOYVERSE_API_TOKEN || "eac78ade09eb4cf2b0700e291be2fe0d";

    const res = await fetch(`https://api.loyverse.com/v1.0/customers?limit=${limit}`, {
      headers: {
        Authorization: `Bearer ${LOYVERSE_TOKEN}`,
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      return new Response(JSON.stringify({ customers: [], error: errText }), {
        status: res.status,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    const data = await res.json();
    const allCustomers = data.customers || [];

    // Filtrar estrictamente SOLO clientes registrados a través de la página web
    const webCustomers = allCustomers.filter((c) => {
      const note = (c.note || "").toLowerCase();
      const code = (c.customer_code || "").toUpperCase();
      return (
        note.includes("cliente web") ||
        note.includes("[pw_web:") ||
        code.startsWith("WEB-")
      );
    });

    return new Response(JSON.stringify({ customers: webCustomers }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ customers: [], error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, x-admin-token, x-admin-key",
    },
  });
}
