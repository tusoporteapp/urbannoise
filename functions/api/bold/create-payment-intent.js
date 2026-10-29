import { setPendingOrder } from "../_pendingOrders.js";
import { findLoyverseCustomer, saveOrUpdateLoyverseCustomer, cleanColombianPhone, LOYVERSE_DEFAULT_TOKEN } from "../_loyverse.js";

export async function onRequestPost({ request, env }) {
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

    // Fórmula oficial Bold: SHA256(orderId + amount + currency + secretKey)
    const rawStringToSign = `${orderId}${numAmount}${currency}${secretKey}`;
    const encoder = new TextEncoder();
    const hashBuf = await crypto.subtle.digest("SHA-256", encoder.encode(rawStringToSign));
    const integritySignature = Array.from(new Uint8Array(hashBuf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const LOYVERSE_TOKEN = env?.LOYVERSE_API_TOKEN || LOYVERSE_DEFAULT_TOKEN;
    let loyverseCustomerId = customer?.loyverseCustomerId || null;

    // Pre-asegurar el cliente en Loyverse CRM para garantizar trazabilidad si el usuario recarga la página
    if (!loyverseCustomerId && customer?.email) {
      try {
        const cleanEmail = (customer.email || "").trim().toLowerCase();
        const cleanPhone = cleanColombianPhone(customer.phone);
        const cleanDoc = (customer.document || "").trim().replace(/\D/g, "");

        const existing = await findLoyverseCustomer({
          email: cleanEmail,
          token: LOYVERSE_TOKEN,
        });

        if (existing) {
          loyverseCustomerId = existing.id;
        } else if (customer.name) {
          const newCust = await saveOrUpdateLoyverseCustomer(
            {
              name: (customer.name || "Cliente Web").trim().toUpperCase(),
              email: cleanEmail,
              phone_number: cleanPhone || undefined,
              customer_code: cleanDoc || `WEB-${Date.now().toString().slice(-6)}`,
              address: customer.address || shippingAddress.address || undefined,
              city: customer.city || shippingAddress.city || "Bogotá",
              note: `Cliente Web URBANNOISE • Intención de Compra #${orderId}`,
            },
            LOYVERSE_TOKEN
          );
          loyverseCustomerId = newCust?.id || null;
        }
      } catch (crmErr) {
        console.warn("[CRM Pre-registro Aviso]:", crmErr.message);
      }
    }

    // Guardar la intención de pedido completa en memoria edge para que el Webhook la pueda procesar
    // incluso si el cliente cierra la pestaña o recarga la página F5
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
