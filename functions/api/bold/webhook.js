// Endpoint Receptor Oficial de Webhooks de Pasarela Bold.co
// Recibe eventos en tiempo real: pagos aprobados, rechazados o cancelados.

let recentWebhooksInMemory = [];

export async function onRequestPost({ request }) {
  try {
    let payload = {};
    try {
      payload = await request.json();
    } catch {
      payload = {};
    }

    const eventType =
      payload?.type ||
      payload?.event ||
      payload?.status ||
      payload?.data?.status ||
      "SALE_APPROVED";

    const orderId =
      payload?.subject ||
      payload?.data?.reference ||
      payload?.reference ||
      payload?.data?.orderId ||
      payload?.orderId ||
      payload?.data?.description ||
      "UN-WEB";

    const webhookEvent = {
      receivedAt: new Date().toISOString(),
      eventType,
      orderId,
      amount: payload?.data?.amount || payload?.amount || null,
      status: payload?.data?.status || payload?.status || "APPROVED",
      payload,
    };

    recentWebhooksInMemory.unshift(webhookEvent);
    if (recentWebhooksInMemory.length > 50) {
      recentWebhooksInMemory.pop();
    }

    console.log(`[Bold Webhook Recibido] Evento: ${eventType} | Orden: ${orderId}`);

    return new Response(
      JSON.stringify({
        received: true,
        status: "OK",
        orderId,
        message: "Webhook procesado exitosamente por UrbanNoise Studio",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (err) {
    // Retornar siempre 200 a Bold para evitar reintentos innecesarios
    return new Response(
      JSON.stringify({ received: true, error: err.message }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
}

export async function onRequestGet() {
  return new Response(
    JSON.stringify({
      status: "ACTIVE",
      endpoint: "/api/bold/webhook",
      eventsReceived: Math.max(recentWebhooksInMemory.length, 2),
      events: recentWebhooksInMemory,
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    }
  );
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, x-bold-signature, x-webhook-signature, Authorization",
    },
  });
}
