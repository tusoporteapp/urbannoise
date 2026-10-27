export async function onRequestPost({ request }) {
  try {
    const { orderId, trackingNumber, trackingCompany = "Servientrega Express Nacional", estimatedDelivery } = await request.json();

    if (!orderId) {
      return new Response(JSON.stringify({ success: false, error: "orderId es requerido" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    const cleanGuia = String(trackingNumber || "").trim();

    return new Response(
      JSON.stringify({
        success: true,
        message: cleanGuia ? "Guía de Servientrega asignada correctamente" : "Guía eliminada",
        orderId,
        trackingNumber: cleanGuia || undefined,
        trackingCompany,
        status: cleanGuia ? "EN_CAMINO" : "CONFIRMADO",
        statusLabel: cleanGuia ? "En Ruta con Servientrega" : "En Preparación para Despacho",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
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
      "Access-Control-Allow-Headers": "Content-Type, Authorization, x-admin-key",
    },
  });
}
