import { LOYVERSE_DEFAULT_TOKEN } from "../_loyverse.js";

// Cache en memoria en el Edge de Cloudflare (TTL de 15 segundos para proteger Loyverse)
let cachedStatusMap = new Map();
let lastCacheSync = 0;
const CACHE_TTL_MS = 15000;

async function refreshStatusCache(token) {
  const now = Date.now();
  if (now - lastCacheSync < CACHE_TTL_MS && cachedStatusMap.size > 0) {
    return;
  }

  try {
    const res = await fetch("https://api.loyverse.com/v1.0/receipts?limit=50", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;

    const data = await res.json();
    const receipts = data.receipts || [];
    const newMap = new Map();

    for (const r of receipts) {
      const note = r.note || "";
      const order = (r.order || "").trim().toUpperCase();
      const receiptNum = String(r.receipt_number || "").trim().toUpperCase();

      // Extraer tags [GUIA:...|EMPRESA:...]
      const tagMatch = note.match(/\[(?:GUIA|G):\s*([^\|\]]+?)(?:\|\s*(?:EMPRESA|E):\s*([^\|\]]+?))?(?:\|\s*(?:ORDEN|O):\s*([^\|\]]+?))?\]/i);
      const rawGuiaMatch = note.match(/GU[ÍI]A:\s*([^\s•|]+)/i);

      let guia = undefined;
      let empresa = "Servientrega";

      if (tagMatch) {
        guia = tagMatch[1].trim();
        if (tagMatch[2]) empresa = tagMatch[2].trim();
      } else if (rawGuiaMatch) {
        guia = rawGuiaMatch[1].trim();
      }

      const isDispatched = Boolean(guia && guia.length >= 4);
      let trackingUrl = null;
      if (isDispatched) {
        const empLower = empresa.toLowerCase();
        if (empLower.includes("interrapid") || empLower.includes("inter rapidisimo")) {
          trackingUrl = `https://www.interrapidisimo.com/siga/?guia=${guia}`;
        } else {
          trackingUrl = `https://www.servientrega.com/wps/portal/rastreo-envio?guia=${guia}`;
        }
      }

      const payload = {
        s: isDispatched ? "DESPACHADO" : "EN_PREPARACION",
        g: guia || null,
        c: guia ? empresa : null,
        u: trackingUrl,
      };

      if (order) newMap.set(order, payload);
      if (receiptNum) newMap.set(receiptNum, payload);
      if (r.id) newMap.set(r.id, payload);
    }

    cachedStatusMap = newMap;
    lastCacheSync = now;
  } catch {
    // Si falla, conservar cache anterior
  }
}

export async function onRequestGet({ request, env }) {
  try {
    const url = new URL(request.url);
    const orderId = (url.searchParams.get("orderId") || "").trim().toUpperCase().replace(/^#/, "");

    if (!orderId) {
      return new Response(JSON.stringify({ s: "UNKNOWN" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    const LOYVERSE_TOKEN = env?.LOYVERSE_API_TOKEN || LOYVERSE_DEFAULT_TOKEN;
    await refreshStatusCache(LOYVERSE_TOKEN);

    const hit = cachedStatusMap.get(orderId) || { s: "EN_PREPARACION", g: null, c: null, u: null };

    return new Response(JSON.stringify(hit), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=10, stale-while-revalidate=20",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ s: "EN_PREPARACION", g: null, c: null, u: null }), {
      status: 200,
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
