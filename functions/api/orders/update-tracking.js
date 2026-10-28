export async function onRequestPost({ request, env }) {
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

    // Calcular link oficial de rastreo según la transportadora seleccionada (Servientrega o Inter Rapidísimo)
    let trackingUrl = `https://www.servientrega.com/wps/portal/rastreo-envio?guia=${cleanGuia}`;
    const compLower = cleanCompany.toLowerCase();
    if (compLower.includes("interrapid") || compLower.includes("inter rapidisimo")) {
      trackingUrl = `https://www.interrapidisimo.com/siga/?guia=${cleanGuia}`;
    }

    // Persistir permanentemente en Loyverse POS (en la ficha del cliente)
    const LOYVERSE_TOKEN = env?.LOYVERSE_API_TOKEN || "eac78ade09eb4cf2b0700e291be2fe0d";
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
            c.id === "eed0d7e0-e4a0-463a-9abd-f04890500739"
        );

        if (targetCust) {
          const cleanOrderId = String(orderId || "").replace(/^#/, "").trim();
          let currentNote = targetCust.note || "";

          // Extraer todos los tags de guía existentes preservando los de OTRAS órdenes
          const existingTags = [];
          const tagRegex = /\[GUIA:\s*([^\|\]]+)(?:\|\s*EMPRESA:\s*([^\|\]]+))?(?:\|\s*ORDEN:\s*([^\|\]]+))?\]/gi;
          let match;
          while ((match = tagRegex.exec(currentNote)) !== null) {
            const gNum = (match[1] || "").trim();
            const gEmp = (match[2] || "Servientrega").trim();
            const gOrd = match[3] ? match[3].replace(/^#/, "").trim() : "";
            if (gOrd && gOrd.toUpperCase() !== cleanOrderId.toUpperCase()) {
              existingTags.push(`[GUIA:${gNum}|EMPRESA:${gEmp}|ORDEN:${gOrd}]`);
            }
          }

          // Remover todos los tags de guía de currentNote para reensamblar limpiamente
          currentNote = currentNote.replace(/\s*\|\s*\[GUIA:[^\]]*\]/gi, "").replace(/\[GUIA:[^\]]*\]/gi, "").trim();

          // Si se proporcionó una guía para ESTA orden, agregarla
          if (cleanGuia) {
            existingTags.push(`[GUIA:${cleanGuia}|EMPRESA:${cleanCompany}|ORDEN:${cleanOrderId}]`);
          }

          // Re-ensamblar la nota conservando los datos del cliente y los tags por orden
          if (existingTags.length > 0) {
            currentNote = currentNote ? `${currentNote} | ${existingTags.join(" | ")}` : existingTags.join(" | ");
          }

          await fetch("https://api.loyverse.com/v1.0/customers", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOYVERSE_TOKEN}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              id: targetCust.id,
              name: targetCust.name,
              note: currentNote,
            }),
          });
        }
      }
    } catch (loyverseErr) {
      console.warn("[Loyverse Tracking Sync Warning]:", loyverseErr.message);
    }

    return new Response(
      JSON.stringify({
        success: true,
        orderId,
        trackingNumber: cleanGuia,
        trackingCompany: cleanCompany,
        trackingUrl,
        status: cleanGuia ? "ENVIADO" : "EN_PREPARACION",
        statusLabel: cleanGuia ? `Enviado con ${cleanCompany}` : "En Preparación",
        updatedAt: new Date().toISOString(),
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
      "Access-Control-Allow-Headers": "Content-Type, Authorization, x-admin-token, x-admin-key",
    },
  });
}
