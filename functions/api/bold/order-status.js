// Endpoint para consultar el estado en vivo de una orden de pago en Bold.co y Loyverse POS
import { LOYVERSE_DEFAULT_TOKEN } from "../_loyverse.js";
import { getPendingOrder } from "../_pendingOrders.js";

export async function onRequestGet({ request, env }) {
  try {
    const url = new URL(request.url);
    const orderId = (url.searchParams.get("orderId") || url.searchParams.get("id") || "").trim().toUpperCase();

    if (!orderId) {
      return new Response(JSON.stringify({ error: "orderId es requerido" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    const LOYVERSE_TOKEN = env?.LOYVERSE_API_TOKEN || LOYVERSE_DEFAULT_TOKEN;

    // 1. Consultar si ya existe recibo emitido en Loyverse POS
    const receiptsRes = await fetch("https://api.loyverse.com/v1.0/receipts?limit=50", {
      headers: { Authorization: `Bearer ${LOYVERSE_TOKEN}` },
    });

    if (receiptsRes.ok) {
      const data = await receiptsRes.json();
      const receipts = data.receipts || [];

      const matchedReceipt = receipts.find((r) => {
        const orderClean = (r.order || "").trim().toUpperCase();
        const noteClean = (r.note || "").toUpperCase();
        return (
          orderClean === orderId ||
          orderClean.includes(orderId) ||
          noteClean.includes(orderId) ||
          noteClean.includes(orderId.replace(/^#/, ""))
        );
      });

      if (matchedReceipt) {
        return new Response(
          JSON.stringify({
            status: "APPROVED",
            paid: true,
            orderId,
            receipt: {
              id: matchedReceipt.id,
              receipt_number: matchedReceipt.receipt_number,
              created_at: matchedReceipt.created_at,
              total_money: matchedReceipt.total_money,
              syncedToPos: true,
            },
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
              "Cache-Control": "no-cache, no-store, must-revalidate",
            },
          }
        );
      }
    }

    // 2. Si no se encontró recibo aún, verificar si está como intención pendiente
    const pending = getPendingOrder(orderId);

    return new Response(
      JSON.stringify({
        status: "PENDING",
        paid: false,
        orderId,
        pending: Boolean(pending),
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
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
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
