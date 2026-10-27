import { isAuthorizedAdmin } from "../_auth.js";

export async function onRequestPost({ request, env }) {
  try {
    // 1. Proteger actualización de guías con autorización de Administrador
    const authorized = await isAuthorizedAdmin(request, env);
    if (!authorized) {
      return new Response(
        JSON.stringify({ success: false, error: "Acceso denegado. Se requiere autenticación de administrador." }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        }
      );
    }

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
            (cleanEmail && c.email && c.email.toLowerCase() === cleanEmail)
        );

        if (targetCust) {
          // Limpiar etiqueta anterior de guía si existía
          let currentNote = targetCust.note || "";
          currentNote = currentNote.replace(/\s*\|\s*\[GUIA:[^\]]*\]/gi, "").replace(/\[GUIA:[^\]]*\]/gi, "").trim();

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
