import { getAllLoyverseCustomers, LOYVERSE_DEFAULT_TOKEN } from "../_loyverse.js";

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
    const [receiptsRes, customers] = await Promise.all([
      fetch("https://api.loyverse.com/v1.0/receipts?limit=50", {
        headers: { Authorization: `Bearer ${token}` },
      }),
      getAllLoyverseCustomers(token, 8),
    ]);

    if (!receiptsRes.ok) return;

    const data = await receiptsRes.json();
    const receipts = data.receipts || [];
    const newMap = new Map();

    for (const r of receipts) {
      const note = r.note || "";
      const order = (r.order || "").trim().toUpperCase();
      const receiptNum = String(r.receipt_number || "").trim().toUpperCase();

      const orderIdentifiers = new Set();
      if (order) {
        orderIdentifiers.add(order);
        orderIdentifiers.add(order.replace(/^#/, ""));
      }
      if (receiptNum) {
        orderIdentifiers.add(receiptNum);
        orderIdentifiers.add(`REC-${receiptNum}`);
        orderIdentifiers.add(`#REC-${receiptNum}`);
      }
      const orderInNoteMatch = note.match(/#(UN-[A-Z0-9_-]+)/i) || note.match(/(UN-[A-Z0-9_-]+)/i);
      if (orderInNoteMatch) {
        const onClean = orderInNoteMatch[1].trim().toUpperCase();
        orderIdentifiers.add(onClean);
      }

      let matchedGuia = null;
      let matchedEmpresa = "Servientrega";

      // 1. Buscar en cliente asociado
      const attachedCust = (customers || []).find((c) => c.id === r.customer_id);
      if (attachedCust?.note) {
        const custTagRegex = /\[(?:GUIA|G):\s*([^\|\]]+?)(?:\|\s*(?:EMPRESA|E):\s*([^\|\]]+?))?(?:\|\s*(?:ORDEN|O):\s*([^\|\]]+?))?\]/gi;
        let tagMatch;
        while ((tagMatch = custTagRegex.exec(attachedCust.note)) !== null) {
          const gNum = (tagMatch[1] || "").trim();
          const gEmp = (tagMatch[2] || "Servientrega").trim();
          const gOrd = tagMatch[3] ? tagMatch[3].replace(/^#/, "").trim().toUpperCase() : "";
          if (gOrd && (orderIdentifiers.has(gOrd) || Array.from(orderIdentifiers).some(id => id === gOrd || id.includes(gOrd)))) {
            matchedGuia = gNum;
            matchedEmpresa = gEmp;
            break;
          }
        }
      }

      // 2. Si no se encontró en la ficha de cliente, revisar la nota del recibo
      if (!matchedGuia) {
        const receiptTagRegex = /\[(?:GUIA|G):\s*([^\|\]]+?)(?:\|\s*(?:EMPRESA|E):\s*([^\|\]]+?))?(?:\|\s*(?:ORDEN|O):\s*([^\|\]]+?))?\]/gi;
        let rTagMatch;
        while ((rTagMatch = receiptTagRegex.exec(note)) !== null) {
          const gNum = (rTagMatch[1] || "").trim();
          const gEmp = (rTagMatch[2] || "Servientrega").trim();
          const gOrd = rTagMatch[3] ? rTagMatch[3].replace(/^#/, "").trim().toUpperCase() : "";
          if (!gOrd || orderIdentifiers.has(gOrd)) {
            matchedGuia = gNum;
            matchedEmpresa = gEmp;
            break;
          }
        }
      }

      const isDispatched = Boolean(matchedGuia && matchedGuia.length >= 4);
      let trackingUrl = null;
      if (isDispatched) {
        const empLower = matchedEmpresa.toLowerCase();
        if (empLower.includes("interrapid") || empLower.includes("inter rapidisimo")) {
          trackingUrl = `https://www.interrapidisimo.com/siga/?guia=${matchedGuia}`;
        } else {
          trackingUrl = `https://www.servientrega.com/wps/portal/rastreo-envio?guia=${matchedGuia}`;
        }
      }

      const payload = {
        s: isDispatched ? "DESPACHADO" : "EN_PREPARACION",
        g: matchedGuia || null,
        c: matchedGuia ? matchedEmpresa : null,
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
