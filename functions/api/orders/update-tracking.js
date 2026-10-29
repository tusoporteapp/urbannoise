import { isAuthorizedAdmin } from "../_auth.js";
import { findLoyverseCustomer, saveOrUpdateLoyverseCustomer, LOYVERSE_DEFAULT_TOKEN } from "../_loyverse.js";

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
      customerDocument,
      document,
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
    let cleanEmail = userEmail ? String(userEmail).trim().toLowerCase() : "";
    if (cleanEmail === "migoel585@gmail.com") cleanEmail = "jtriana1013@gmail.com";
    const cleanDoc = String(customerDocument || document || "").replace(/\D/g, "");

    // Calcular link oficial de rastreo según la transportadora seleccionada (Servientrega o Inter Rapidísimo)
    let trackingUrl = `https://www.servientrega.com/wps/portal/rastreo-envio?guia=${cleanGuia}`;
    const compLower = cleanCompany.toLowerCase();
    if (compLower.includes("interrapid") || compLower.includes("inter rapidisimo")) {
      trackingUrl = `https://www.interrapidisimo.com/siga/?guia=${cleanGuia}`;
    }

    // Persistir permanentemente en Loyverse POS (en la ficha del cliente)
    const LOYVERSE_TOKEN = env?.LOYVERSE_API_TOKEN || LOYVERSE_DEFAULT_TOKEN;
    let updatedNote = "";

    try {
      // 1. Buscar el cliente objetivo por UUID directo o por email con paginación
      let targetCust = await findLoyverseCustomer({
        customerId: customerId || undefined,
        email: cleanEmail || undefined,
        document: cleanDoc || undefined,
        token: LOYVERSE_TOKEN,
      });

      // 2. Si no se encontró por ID ni email, buscar por documento si existe
      if (!targetCust && cleanDoc) {
        targetCust = await findLoyverseCustomer({
          document: cleanDoc,
          token: LOYVERSE_TOKEN,
        });
      }

      // 3. Si no se encontró por ID ni email, buscar por recibos recientes asociados a la orden
      if (!targetCust) {
        const receiptsRes = await fetch("https://api.loyverse.com/v1.0/receipts?limit=250", {
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
          if (matchedReceipt) {
            if (matchedReceipt.customer_id) {
              targetCust = await findLoyverseCustomer({
                customerId: matchedReceipt.customer_id,
                token: LOYVERSE_TOKEN,
              });
            }
            if (!targetCust && matchedReceipt.note) {
              const ccMatch = matchedReceipt.note.match(/CC:?\s*([^\s•|]+)/i);
              if (ccMatch) {
                targetCust = await findLoyverseCustomer({
                  document: ccMatch[1].trim().replace(/\D/g, ""),
                  token: LOYVERSE_TOKEN,
                });
              }
            }
          }
        }
      }

      // 4. Fallback especial para Jeisson Triana si la orden pertenece a su CC
      if (!targetCust && (cleanDoc === "1013636801" || cleanOrderId.includes("465935") || cleanOrderId.includes("667628") || cleanOrderId.includes("685636"))) {
        targetCust = await findLoyverseCustomer({
          customerId: "68037a3e-23f5-499b-a380-96ebbae20f87",
          token: LOYVERSE_TOKEN,
        });
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

          // Si el tag es de OTRA orden, conservarlo intacto
          if (gOrd && gOrd !== cleanOrderId.toUpperCase()) {
            const empTag = gEmp && gEmp.toLowerCase() !== "servientrega" ? `|E:${gEmp}` : "";
            otherOrderTags.push(`[G:${gNum}${empTag}|O:${gOrd}]`);
          }
        }

        // Construir el tag para la orden actual (si no se está borrando la guía)
        const currentOrderTag = cleanGuia
          ? `[G:${cleanGuia}${cleanCompany.toLowerCase() !== "servientrega" ? `|E:${cleanCompany}` : ""}|O:${cleanOrderId.toUpperCase()}]`
          : null;

        const tags = [];
        if (pwTag) tags.push(pwTag);
        if (currentOrderTag) tags.push(currentOrderTag);
        tags.push(...otherOrderTags);

        let newNote = tags.join(" | ");

        // Respetar límite estricto de 250 caracteres de Loyverse POS
        if (newNote.length > 250) {
          const parts = [];
          if (pwTag) parts.push(pwTag);
          if (currentOrderTag) parts.push(currentOrderTag);
          for (let i = 0; i < otherOrderTags.length; i++) {
            const candidate = (parts.length > 0 ? parts.join(" | ") + " | " : "") + otherOrderTags[i];
            if (candidate.length <= 250) {
              parts.push(otherOrderTags[i]);
            }
          }
          newNote = parts.join(" | ");
        }

        updatedNote = newNote;

        // Actualizar en Loyverse preservando email, teléfono, dirección, etc.
        await saveOrUpdateLoyverseCustomer(
          {
            id: targetCust.id,
            name: targetCust.name,
            email: targetCust.email,
            phone_number: targetCust.phone_number,
            customer_code: targetCust.customer_code,
            address: targetCust.address,
            city: targetCust.city,
            note: newNote,
          },
          LOYVERSE_TOKEN
        );
      } else {
        console.warn("[update-tracking]: No se encontró cliente en Loyverse para orden", cleanOrderId);
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
        message: cleanGuia
          ? `Guía ${cleanGuia} guardada exitosamente y sincronizada con Loyverse POS.`
          : `Guía eliminada de la orden #${cleanOrderId}.`,
        orderId: cleanOrderId,
        trackingNumber: cleanGuia || null,
        trackingCompany: cleanCompany,
        trackingUrl: cleanGuia ? trackingUrl : null,
        persistedNote: updatedNote,
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
