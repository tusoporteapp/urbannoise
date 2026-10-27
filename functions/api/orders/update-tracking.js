export async function onRequestPost({ request }) {
  try {
    const {
      orderId,
      trackingNumber,
      trackingCompany = "Servientrega",
      customerId,
      userEmail,
    } = await request.json();

    if (!orderId) {
      return new Response(JSON.stringify({ success: false, error: "orderId es requerido" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    const cleanGuia = String(trackingNumber || "").trim();
    const cleanCompany = String(trackingCompany || "Servientrega").trim();

    // Calcular link oficial de rastreo según la transportadora seleccionada
    let trackingUrl = `https://www.servientrega.com/wps/portal/rastreo-envio?guia=${cleanGuia}`;
    const compLower = cleanCompany.toLowerCase();
    if (compLower.includes("coordinadora")) {
      trackingUrl = `https://coordinadora.com/rastreo/rastreo-de-guia/detalle-de-rastreo-de-guia/?guia=${cleanGuia}`;
    } else if (compLower.includes("interrapid") || compLower.includes("inter rapidisimo")) {
      trackingUrl = `https://www.interrapidisimo.com/siga/?guia=${cleanGuia}`;
    } else if (compLower.includes("envia") || compLower.includes("envía")) {
      trackingUrl = `https://envia.co/?guia=${cleanGuia}`;
    } else if (compLower.includes("tcc")) {
      trackingUrl = `https://tcc.com.co/rastreo-envios/?guia=${cleanGuia}`;
    } else if (compLower.includes("bogota") || compLower.includes("domicilio") || compLower.includes("mensajer")) {
      trackingUrl = `https://wa.me/573003926061?text=${encodeURIComponent(`Hola, quisiera consultar la entrega de mi pedido #${orderId}`)}`;
    }

    // Persistir permanentemente en Loyverse POS (en la ficha del cliente)
    const LOYVERSE_TOKEN = "eac78ade09eb4cf2b0700e291be2fe0d";
    try {
      // 1. Obtener la lista de clientes para ubicar el id
      const listRes = await fetch("https://api.loyverse.com/v1.0/customers?limit=100", {
        headers: { Authorization: `Bearer ${LOYVERSE_TOKEN}` },
      });

      if (listRes.ok) {
        const data = await listRes.json();
        const customers = data.customers || [];
        const cleanEmail = (userEmail || "").toLowerCase().trim();

        const targetCust = customers.find(
          (c) =>
            (customerId && c.id === customerId) ||
            (cleanEmail && c.email && c.email.toLowerCase() === cleanEmail) ||
            c.id === "eed0d7e0-e4a0-463a-9abd-f04890500739" // Cuenta web oficial JEISSON TRIANA
        );

        if (targetCust) {
          // Limpiar etiqueta anterior de guía si existía
          let currentNote = targetCust.note || "";
          currentNote = currentNote.replace(/\s*\|\s*\[GUIA:[^\]]+\]/gi, "").trim();

          // Si hay nueva guía, añadir etiqueta normalizada
          if (cleanGuia) {
            currentNote += ` | [GUIA:${cleanGuia}|EMPRESA:${cleanCompany}|ORDEN:${orderId}]`;
          }

          await fetch("https://api.loyverse.com/v1.0/customers", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOYVERSE_TOKEN}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              id: targetCust.id,
              name: targetCust.name || "JEISSON TRIANA",
              email: targetCust.email || "migoel585@gmail.com",
              phone_number: targetCust.phone_number || "573003926061",
              address: targetCust.address || "cl 2 sur 11 c 45",
              city: targetCust.city || "Bogota",
              customer_code: targetCust.customer_code || "1013636801",
              note: currentNote,
            }),
          });
        }
      }
    } catch (persistErr) {
      console.warn("[Tracking Persistence Warning]:", persistErr.message);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: cleanGuia
          ? `Guía de ${cleanCompany} asignada y notificada correctamente`
          : "Guía eliminada",
        orderId,
        trackingNumber: cleanGuia || undefined,
        trackingCompany: cleanCompany,
        trackingUrl: cleanGuia ? trackingUrl : undefined,
        status: cleanGuia ? "EN_CAMINO" : "CONFIRMADO",
        statusLabel: cleanGuia
          ? `En Ruta con ${cleanCompany}`
          : "En Preparación para Despacho",
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
