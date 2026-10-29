// Receptor de Webhooks de Loyverse POS (Notificaciones en Tiempo Real desde Tienda Física GranSan)
// Invalida o actualiza inmediatamente el inventario en caché cuando se realiza una venta física en GranSan.

let recentLoyverseWebhooks = [];

export async function onRequestPost({ request, env }) {
  try {
    const rawBody = await request.text();
    let payload = {};
    try {
      payload = JSON.parse(rawBody);
    } catch {
      payload = { raw: rawBody };
    }

    const eventType = payload.event || payload.action || "unknown";
    const timestamp = new Date().toISOString();

    const webhookRecord = {
      timestamp,
      eventType,
      payload,
    };

    recentLoyverseWebhooks.unshift(webhookRecord);
    if (recentLoyverseWebhooks.length > 50) {
      recentLoyverseWebhooks.pop();
    }

    console.log(`[Loyverse Webhook] Evento recibido: ${eventType}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Webhook de Loyverse procesado exitosamente.",
        eventType,
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
    return new Response(
      JSON.stringify({
        success: false,
        error: "Error procesando webhook de Loyverse",
        details: err.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      }
    );
  }
}

export async function onRequestGet() {
  return new Response(
    JSON.stringify({
      endpoint: "/api/loyverse/webhook",
      status: "active",
      recentEvents: recentLoyverseWebhooks.slice(0, 10),
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    }
  );
}
