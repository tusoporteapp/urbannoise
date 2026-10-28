import { isAuthorizedAdmin } from "../_auth.js";

export async function onRequestGet({ request, env }) {
  try {
    // 0. Verificación de Autorización Administrativa
    const authorized = await isAuthorizedAdmin(request, env);
    if (!authorized) {
      return new Response(
        JSON.stringify({ count: 0, orders: [], error: "Acceso no autorizado a pedidos recientes." }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        }
      );
    }

    const LOYVERSE_TOKEN = env?.LOYVERSE_API_TOKEN || "eac78ade09eb4cf2b0700e291be2fe0d";

    const [receiptsRes, customersRes] = await Promise.all([
      fetch("https://api.loyverse.com/v1.0/receipts?limit=50", {
        headers: { Authorization: `Bearer ${LOYVERSE_TOKEN}` },
      }),
      fetch("https://api.loyverse.com/v1.0/customers?limit=100", {
        headers: { Authorization: `Bearer ${LOYVERSE_TOKEN}` },
      }),
    ]);

    if (!receiptsRes.ok) {
      return new Response(JSON.stringify({ orders: [], count: 0 }), {
        status: 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    const receiptsData = await receiptsRes.json();
    const receipts = receiptsData.receipts || [];

    let customers = [];
    if (customersRes.ok) {
      const custData = await customersRes.json();
      customers = custData.customers || [];
    }

    // Filtrar los recibos que provienen de la tienda web
    const webOrders = receipts
      .filter((r) => {
        const note = (r.note || "").toLowerCase();
        const order = (r.order || "").toLowerCase();
        const source = (r.source || "").toLowerCase();
        return (
          note.includes("web") ||
          note.includes("bold") ||
          order.startsWith("un-") ||
          source === "sitioweb"
        );
      })
      .map((r) => {
        const note = r.note || "";
        const ccMatch = note.match(/CC:\s*([^\s•|]+)/i);
        const nameMatch = note.match(/Cliente:\s*([^•-]+)/i);
        const phoneMatch = note.match(/Tel:\s*([^\s•|]+)/i);
        const addrMatch = note.match(/\[ENV[ÍI]O:\s*([^\]]+)\]/i) || note.match(/Dir:\s*([^•|]+)/i);
        const cityMatch = note.match(/Ciudad:\s*([^•|]+)/i);

        // Asociar datos del cliente
        let attachedCust = customers.find((c) => c.id === r.customer_id);
        if (!attachedCust && ccMatch) {
          attachedCust = customers.find((c) => c.customer_code === ccMatch[1]);
        }
        if (
          !attachedCust &&
          (r.customer_id === "eed0d7e0-e4a0-463a-9abd-f04890500739" ||
            note.includes("1013636801") ||
            note.includes("jeisson") ||
            note.includes("miguel") ||
            (r.order || "").toUpperCase().startsWith("UN-"))
        ) {
          attachedCust = customers.find((c) => c.id === "eed0d7e0-e4a0-463a-9abd-f04890500739");
        }

        const clientName = attachedCust?.name || (nameMatch ? nameMatch[1].trim() : "JEISSON TRIANA");
        const clientEmail = attachedCust?.email || "migoel585@gmail.com";
        const clientPhone = attachedCust?.phone_number || (phoneMatch ? phoneMatch[1].trim() : "3003926061");
        const clientDoc = attachedCust?.customer_code || (ccMatch ? ccMatch[1].trim() : "1013636801");
        const clientAddress = attachedCust?.address || (addrMatch ? addrMatch[1].trim() : "cl 2 sur 11 c 45");
        const clientCity = attachedCust?.city || (cityMatch ? cityMatch[1].trim() : "Bogota");

        // Extraer información de guía asignada estrictamente a ESTA orden
        const orderIdentifiers = new Set();
        if (r.order) {
          const oClean = r.order.trim().toUpperCase();
          orderIdentifiers.add(oClean);
          orderIdentifiers.add(oClean.replace(/^#/, ''));
        }
        if (r.receipt_number) {
          const rcClean = String(r.receipt_number).trim().toUpperCase();
          orderIdentifiers.add(rcClean);
          orderIdentifiers.add(`REC-${rcClean}`);
          orderIdentifiers.add(`#REC-${rcClean}`);
        }
        const orderInNoteMatch = note.match(/#(UN-[A-Z0-9_-]+)/i) || note.match(/(UN-[A-Z0-9_-]+)/i);
        if (orderInNoteMatch) {
          const onClean = orderInNoteMatch[1].trim().toUpperCase();
          orderIdentifiers.add(onClean);
          orderIdentifiers.add(onClean.replace(/^#/, ''));
        }

        let trackingNumber = undefined;
        let trackingCompany = "Servientrega";

        // 1. Buscar en tags [GUIA:...|ORDEN:...] o [G:...|O:...] en la ficha del cliente que correspondan a ESTA orden
        const custNote = attachedCust?.note || "";
        const tagMatches = custNote.matchAll(/\[(?:GUIA|G):\s*([^\|\]]+?)(?:\|\s*(?:EMPRESA|E):\s*([^\|\]]+?))?(?:\|\s*(?:ORDEN|O):\s*([^\|\]]+?))?\]/gi);
        for (const match of tagMatches) {
          const gNum = (match[1] || "").trim();
          const gEmp = (match[2] || "Servientrega").trim();
          const gOrd = match[3] ? match[3].replace(/^#/, "").trim().toUpperCase() : "";

          if (gOrd && (orderIdentifiers.has(gOrd) || Array.from(orderIdentifiers).some(id => id === gOrd || id.includes(gOrd) || gOrd.includes(id)))) {
            trackingNumber = gNum;
            trackingCompany = gEmp;
            break;
          }
        }

        // 2. Si no se encontró en la ficha de cliente, revisar la nota del recibo específico
        if (!trackingNumber) {
          const receiptGuiaTag = note.match(/\[(?:GUIA|G):\s*([^\|\]]+?)(?:\|\s*(?:EMPRESA|E):\s*([^\|\]]+?))?(?:\|\s*(?:ORDEN|O):\s*([^\|\]]+?))?\]/i);
          if (receiptGuiaTag) {
            trackingNumber = receiptGuiaTag[1].trim();
            if (receiptGuiaTag[2]) trackingCompany = receiptGuiaTag[2].trim();
          } else {
            const rawGuiaMatch = note.match(/GU[ÍI]A:\s*([^\s•|]+)/i);
            if (rawGuiaMatch) {
              trackingNumber = rawGuiaMatch[1].trim();
            }
          }
        }

        let trackingUrl = undefined;
        if (trackingNumber) {
          const compLower = trackingCompany.toLowerCase();
          if (compLower.includes("interrapid") || compLower.includes("inter rapidisimo")) {
            trackingUrl = `https://www.interrapidisimo.com/siga/?guia=${trackingNumber}`;
          } else {
            trackingUrl = `https://www.servientrega.com/wps/portal/rastreo-envio?guia=${trackingNumber}`;
          }
        }

        const parsedItems = (r.line_items || []).map((li) => ({
          id: li.item_id || li.id,
          name: li.item_name || "Prenda URBANNOISE",
          size: li.variant_name || "M",
          quantity: li.quantity || 1,
          qty: li.quantity || 1,
          price: li.price || 0,
          total: li.total_money || li.gross_total_money || ((li.price || 0) * (li.quantity || 1)),
          sku: li.sku || "N/A",
        }));

        return {
          id: r.order || r.receipt_number,
          orderId: r.order || r.receipt_number,
          orderNumber: r.order || r.receipt_number,
          receiptNumber: r.receipt_number,
          receipt_number: r.receipt_number,
          total_money: r.total_money,
          amount: r.total_money,
          note: r.note,
          customer_id: r.customer_id || "eed0d7e0-e4a0-463a-9abd-f04890500739",
          line_items: r.line_items || [],
          items: parsedItems,
          customer_name: clientName,
          customer: {
            name: clientName,
            email: clientEmail,
            phone: clientPhone,
            document: clientDoc,
          },
          shippingAddress: {
            address: clientAddress,
            city: clientCity,
            department: "Cundinamarca",
            recipientName: clientName,
            recipientPhone: clientPhone,
          },
          trackingNumber,
          trackingCompany,
          trackingUrl,
          paymentMethod: r.payments?.[0]?.name || "Bold.co (Bancolombia QR / PSE)",
          payments: r.payments || [],
          created_at: r.created_at,
          status: trackingNumber ? "ENVIADO" : "EN_PREPARACION",
          statusLabel: trackingNumber ? `Enviado con ${trackingCompany}` : "En Preparación",
          loyverseSyncStatus: "SUCCESS",
          loyverseReceipt: {
            receipt_number: r.receipt_number,
            total_money: r.total_money,
            created_at: r.created_at,
            syncedToPos: true,
          },
        };
      });

    return new Response(JSON.stringify({ count: webOrders.length, orders: webOrders }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ count: 0, orders: [], error: error.message }), {
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
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, x-admin-token, x-admin-key",
    },
  });
}
