import { isAuthorizedAdmin } from "../_auth.js";

export async function onRequestGet({ request, env }) {
  try {
    // 1. Proteger recibos y transacciones con autorización de Administrador
    const authorized = await isAuthorizedAdmin(request, env);
    if (!authorized) {
      return new Response(
        JSON.stringify({ receipts: [], error: "Acceso denegado. Se requiere autenticación de administrador." }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        }
      );
    }

    const url = new URL(request.url);
    const limit = url.searchParams.get("limit") || "50";
    const LOYVERSE_TOKEN = env?.LOYVERSE_API_TOKEN || "eac78ade09eb4cf2b0700e291be2fe0d";

    const res = await fetch(`https://api.loyverse.com/v1.0/receipts?limit=${limit}`, {
      headers: {
        Authorization: `Bearer ${LOYVERSE_TOKEN}`,
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      return new Response(JSON.stringify({ receipts: [], error: errText }), {
        status: res.status,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    const data = await res.json();
    const allReceipts = data.receipts || [];

    // Filtrar estrictamente SOLO ventas realizadas desde la página web
    const webReceipts = allReceipts.filter((r) => {
      const note = (r.note || "").toLowerCase();
      const order = (r.order || "").toLowerCase();
      const source = (r.source || "").toLowerCase();
      return (
        note.includes("urbannoise web") ||
        note.includes("pasarela bold") ||
        source === "sitioweb" ||
        order.startsWith("un-")
      );
    });

    return new Response(JSON.stringify({ receipts: webReceipts }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ receipts: [], error: error.message }), {
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
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, x-admin-token, x-admin-key",
    },
  });
}
