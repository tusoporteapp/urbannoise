import { setPendingOrder } from "../_pendingOrders.js";
import { LOYVERSE_DEFAULT_TOKEN } from "../_loyverse.js";

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const body = await request.json();
    const {
      orderId,
      amount,
      currency = "COP",
      customer,
      items = [],
      totals = {},
      shippingAddress = {},
      shippingCarrier,
      shippingMethod,
      paymentMethod = "bold_pse",
      description,
      redirectionUrl,
    } = body;

    const numAmount = Math.round(Number(amount));
    if (!orderId || isNaN(numAmount) || numAmount < 1000) {
      return new Response(
        JSON.stringify({
          error: "Faltan datos requeridos o el monto es menor al mínimo permitido (orderId, amount >= 1000 COP)",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        }
      );
    }

    const identityKey = "lRI_amtz7N6CTdY-m3JWIYDmTZC2DHMaO9Oe7z5-u-U";
    const secretKey = "zGivRzn0ym4CDxGErtEtYQ";

    // Fórmula oficial Bold: SHA256(orderId + amount + currency + secretKey) - Cálculo ultraveloz (0.01 ms)
    const rawStringToSign = `${orderId}${numAmount}${currency}${secretKey}`;
    const encoder = new TextEncoder();
    const hashBuf = await crypto.subtle.digest("SHA-256", encoder.encode(rawStringToSign));
    const integritySignature = Array.from(new Uint8Array(hashBuf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const LOYVERSE_TOKEN = env?.LOYVERSE_API_TOKEN || LOYVERSE_DEFAULT_TOKEN;
    const loyverseCustomerId = customer?.loyverseCustomerId || null;

    // Guardar la intención de pedido completa de inmediato en memoria edge para el Webhook (Cero lag)
    const pendingPayload = {
      orderId,
      amount: numAmount,
      currency,
      customer: {
        ...(customer || {}),
        loyverseCustomerId,
      },
      items,
      totals,
      shippingAddress,
      shippingCarrier,
      shippingMethod,
      paymentMethod,
      integritySignature,
      timestamp: new Date().toISOString(),
    };

    setPendingOrder(orderId, pendingPayload);

    return new Response(
      JSON.stringify({
        success: true,
        orderId,
        amount: Number(amount),
        currency,
        integritySignature,
        identityKey,
        hasLiveCredentials: true,
        isLiveMode: true,
        customer: pendingPayload.customer,
        description: description || `Pedido URBANNOISE #${orderId}`,
        redirectionUrl: redirectionUrl || "",
        timestamp: pendingPayload.timestamp,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
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
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
