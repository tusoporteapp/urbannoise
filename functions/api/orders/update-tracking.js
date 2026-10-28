import { isAuthorizedAdmin } from "../_auth.js";

export async function onRequestPost({ request, env }) {
  try {
    // 0. Verificación de Autorización Administrativa
    const authorized = await isAuthorizedAdmin(request, env);
    if (!authorized) {
      return new Response(
        JSON.stringify({ success: false, error: "Acceso no autorizado para actualizar guías de despacho." }),
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
    const cleanOrderId = String(orderId || "").replace(/^#/, "").trim();

    // Calcular link oficial de rastreo según la transportadora seleccionada (Servientrega o Inter Rapidísimo)
    let trackingUrl = `https://www.servientrega.com/wps/portal/rastreo-envio?guia=${cleanGuia}`;
    const compLower = cleanCompany.toLowerCase();
    if (compLower.includes("interrapid") || compLower.includes("inter rapidisimo")) {
      trackingUrl = `https://www.interrapidisimo.com/siga/?guia=${cleanGuia}`;
    }

    // Persistir permanentemente en Loyverse POS (en la ficha del cliente)
    const LOYVERSE_TOKEN = env?.LOYVERSE_API_TOKEN || "eac78ade09eb4cf2b0700e291be2fe0d";
    let updatedNote = "";

    try {
      // 1. Obtener la lista de clientes de Loyverse
      const listRes = await fetch("https://api.loyverse.com/v1.0/customers?limit=100", {
        headers: { Authorization: `Bearer ${LOYVERSE_TOKEN}` },
      });

      if (listRes.ok) {
        const data = await listRes.json();
        const customers = data.customers || [];
        const cleanEmail = (userEmail || "").toLowerCase().trim();

        let targetCust = customers.find(
          (c) =>
            (customerId && c.id === customerId) ||
            (cleanEmail && c.email && c.email.toLowerCase() === cleanEmail)
        );

        // Si no se encuentra directamente, intentar encontrarlo por recibos asociados a la orden
        if (!targetCust) {
          const receiptsRes = await fetch("https://api.loyverse.com/v1.0/receipts?limit=50", {
            headers: { Authorization: `Bearer ${LOYVERSE_TOKEN}` },
          });
          if (receiptsRes.ok) {
            const rcData = await receiptsRes.json();
            const matchedReceipt = (rcData.receipts || []).find((r) => {
              const oClean = cleanOrderId.toUpperCase();
              const rOrder = (r.order || "").replace(/^#/, "").trim().toUpperCase();
              const rNum = String(r.receipt_number || "").trim().toUpperCase();
              const rNote = (r.note || "").toUpperCase();
              return rOrder === oClean || rNum === oClean || rNote.includes(oClean);
            });
            if (matchedReceipt && matchedReceipt.customer_id) {
              targetCust = customers.find((c) => c.id === matchedReceipt.customer_id);
            }
          }
        }

        // Fallback por defecto a la cuenta de prueba si coincide el correo o pedidos conocidos
        if (!targetCust && (cleanEmail === "migoel585@gmail.com" || cleanOrderId.includes("667628") || cleanOrderId.includes("685636"))) {
          targetCust = customers.find((c) => c.id === "eed0d7e0-e4a0-463a-9abd-f04890500739");
        }

        if (targetCust) {
          const currentNote = targetCust.note || "";

          // Preservar hash de autenticación web si existe
          const pwMatch = currentNote.match(/\[PW_WEB:[^\]]+\]/i);
          const pwTag = pwMatch ? pwMatch[0] : "";

          // Extraer todos los tags de guía existentes preservando los de OTRAS órdenes
          const tagRegex = /\[(?:GUIA|G):\s*([^\|\]]+?)(?:\|\s*(?:EMPRESA|E):\s*([^\|\]]+?))?(?:\|\s*(?:ORDEN|O):\s*([^\|\]]+?))?\]/gi;
          const otherOrderTags = [];
          let match;
          while ((match = tagRegex.exec(currentNote)) !== null) {
            const gNum = (match[1] || "").trim();
            const gEmp = (match[2] || "Servientrega").trim();
            const gOrd = match[3] ? match[3].replace(/^#/, "").trim().toUpperCase() : "";
            if (gOrd && gOrd !== cleanOrderId.toUpperCase()) {
              const empTag = gEmp && gEmp.toLowerCase() !== "servientrega" ? `|E:${gEmp}` : "";
              otherOrderTags.push(`[G:${gNum}${empTag}|O:${gOrd}]`);
            }
          }

          const tags = [...otherOrderTags];
          // Si se proporcionó una guía para ESTA orden, agregarla en formato compacto
          if (cleanGuia) {
            const empTag = cleanCompany && cleanCompany.toLowerCase() !== "servientrega" ? `|E:${cleanCompany}` : "";
            tags.push(`[G:${cleanGuia}${empTag}|O:${cleanOrderId.toUpperCase()}]`);
          }

          // Limpiar boilerplate redundante que no aporta valor y consume caracteres (CC, Ciudad, Dir, etc.)
          let customText = currentNote
            .replace(/\[PW_WEB:[^\]]+\]/gi, "")
            .replace(/\[(?:GUIA|G):[^\]]+\]/gi, "")
            .replace(/(?:CC|Ciudad|Dir|Tel|Cliente|Cliente Web URBANNOISE)[^|]*/gi, "")
            .replace(/\|+/g, " ")
            .trim();

          let parts = [];
          if (pwTag) parts.push(pwTag);
          if (customText.length > 0 && customText.length < 40) parts.push(customText);
          parts.push(...tags);

          let newNote = parts.join(" | ");

          // Garantizar estrictamente el límite de 250 caracteres de Loyverse
          if (newNote.length > 250) {
            parts = [];
            if (pwTag) parts.push(pwTag);
            // Mantener las etiquetas de orden más recientes que quepan
            for (let i = tags.length - 1; i >= 0; i--) {
              const candidate = (parts.length > 0 ? parts.join(" | ") + " | " : "") + tags[i];
              if (candidate.length <= 250) {
                parts.push(tags[i]);
              }
            }
            newNote = parts.join(" | ");
          }

          updatedNote = newNote;

          const loyRes = await fetch("https://api.loyverse.com/v1.0/customers", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOYVERSE_TOKEN}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              id: targetCust.id,
              name: targetCust.name,
              note: newNote,
            }),
          });

          if (!loyRes.ok) {
            const errText = await loyRes.text();
            console.error("[Loyverse Save Note Error]:", loyRes.status, errText);
            return new Response(
              JSON.stringify({
                success: false,
                error: `Error al persistir en Loyverse (${loyRes.status}): ${errText}`,
              }),
              {
                status: 500,
                headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
              }
            );
          }
        }
      }
    } catch (loyverseErr) {
      console.error("[Loyverse Tracking Sync Error]:", loyverseErr);
      return new Response(
        JSON.stringify({ success: false, error: loyverseErr.message || "Error al sincronizar con Loyverse" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        orderId,
        trackingNumber: cleanGuia,
        trackingCompany: cleanCompany,
        trackingUrl,
        updatedNote,
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
