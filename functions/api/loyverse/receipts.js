import { isAuthorizedAdmin } from "../_auth.js";
import { LOYVERSE_DEFAULT_TOKEN } from "../_loyverse.js";

export async function onRequestGet({ request, env }) {
  try {
    // 0. Verificación de Autorización Administrativa
    const authorized = await isAuthorizedAdmin(request, env);
    if (!authorized) {
      return new Response(
        JSON.stringify({ error: "Acceso no autorizado a los recibos de ventas." }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        }
      );
    }

    const url = new URL(request.url);
    const limit = url.searchParams.get("limit") || "250";
    const LOYVERSE_TOKEN = env?.LOYVERSE_API_TOKEN || LOYVERSE_DEFAULT_TOKEN;

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

    // Filtrar estrictamente SOLO ventas realizadas desde la página web y ordenar por más reciente primero
    const webReceipts = allReceipts.filter((r) => {
      const note = (r.note || "").toLowerCase();
      const order = (r.order || "").toLowerCase();
      const source = (r.source || "").toLowerCase();
      return (
        note.includes("urbannoise web") ||
        note.includes("pasarela bold") ||
        note.includes("cliente web") ||
        source === "sitioweb" ||
        order.startsWith("un-")
      );
    });

    // Orden cronológico estricto: la orden más reciente siempre de primera (DESC)
    webReceipts.sort((a, b) => {
      const timeA = new Date(a.created_at || a.receipt_date || 0).getTime();
      const timeB = new Date(b.created_at || b.receipt_date || 0).getTime();
      if (timeA !== timeB) return timeB - timeA;
      const numA = parseInt(String(a.receipt_number || a.order || "").replace(/\D/g, ""), 10) || 0;
      const numB = parseInt(String(b.receipt_number || b.order || "").replace(/\D/g, ""), 10) || 0;
      return numB - numA;
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
