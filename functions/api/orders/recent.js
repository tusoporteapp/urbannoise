import { isAuthorizedAdmin } from "../_auth.js";
import { getAllLoyverseCustomers, cleanColombianPhone, LOYVERSE_DEFAULT_TOKEN } from "../_loyverse.js";

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

    const LOYVERSE_TOKEN = env?.LOYVERSE_API_TOKEN || LOYVERSE_DEFAULT_TOKEN;

    const [receiptsRes, customers] = await Promise.all([
      fetch("https://api.loyverse.com/v1.0/receipts?limit=250", {
        headers: { Authorization: `Bearer ${LOYVERSE_TOKEN}` },
      }),
      getAllLoyverseCustomers(LOYVERSE_TOKEN, 8),
    ]);

    if (!receiptsRes.ok) {
      return new Response(JSON.stringify({ orders: [], count: 0 }), {
        status: 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    const receiptsData = await receiptsRes.json();
    const receipts = receiptsData.receipts || [];

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
        const ccMatch = note.match(/CC:\s*([^\s•|]+)/i) || note.match(/CC\s*([^\s•|]+)/i);
        const nameMatch = note.match(/Cliente:\s*([^•-]+)/i);
        const phoneMatch = note.match(/Tel:\s*([^\s•|]+)/i) || note.match(/Tel\s*([^\s•|]+)/i);
        const addrMatch = note.match(/\[ENV[ÍI]O:\s*([^\]]+)\]/i) || note.match(/Dir:\s*([^•|]+)/i);
        const cityMatch = note.match(/Ciudad:\s*([^•|]+)/i);

        // Asociar datos del cliente
        let attachedCust = customers.find((c) => c.id === r.customer_id);
        if (!attachedCust && ccMatch) {
          const cleanDoc = ccMatch[1].trim().replace(/\D/g, "");
          attachedCust = customers.find((c) => c.customer_code === cleanDoc);
        }

        const clientName = attachedCust?.name || (nameMatch ? nameMatch[1].trim() : "Cliente URBANNOISE");
        const clientEmail = attachedCust?.email || "";
        const clientPhone = cleanColombianPhone(attachedCust?.phone_number || (phoneMatch ? phoneMatch[1].trim() : ""));
        const clientDoc = attachedCust?.customer_code || (ccMatch ? ccMatch[1].trim() : "");
        const clientAddress = attachedCust?.address || (addrMatch ? addrMatch[1].trim() : "");
        const clientCity = attachedCust?.city || (cityMatch ? cityMatch[1].trim() : "Bogotá");

        // Extraer información de guía asignada estrictamente a ESTA orden
        const orderIdentifiers = new Set();
        if (r.order) {
          const oClean = r.order.trim().toUpperCase();
          orderIdentifiers.add(oClean);
          orderIdentifiers.add(oClean.replace(/^#/, ""));
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
          orderIdentifiers.add(onClean.replace(/^#/, ""));
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

        const dateObj = new Date(r.created_at);
        const formattedDate = dateObj.toLocaleDateString("es-CO", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });

        // Extraer items vendidos
        const items = (r.line_items || []).map((li, idx) => ({
          id: li.variant_id || li.item_id || `item-${idx}`,
          name: li.item_name || "Prenda URBANNOISE",
          size: li.variant_name || "Talla Única",
          qty: Math.round(li.quantity || 1),
          price: Number(li.price || 0),
          total: Number(li.gross_total_money || li.total_money || 0),
          sku: li.sku || `UN-${li.item_id || idx}`,
        }));

        const totalMoney = Number(r.total_money || 0);

        return {
          id: r.id,
          orderId: r.order || `#REC-${r.receipt_number}`,
          receiptNumber: String(r.receipt_number || ""),
          orderNumber: r.order || `#REC-${r.receipt_number}`,
          date: formattedDate,
          timestamp: dateObj.getTime(),
          total: totalMoney,
          total_money: totalMoney,
          amount: totalMoney,
          created_at: r.created_at,
          createdAt: r.created_at,
          receipt_date: r.receipt_date || r.created_at,
          receipt_number: String(r.receipt_number || ""),
          status: trackingNumber ? "ENVIADO" : "EN_PREPARACION",
          statusLabel: trackingNumber ? `Enviado con ${trackingCompany}` : "En Preparación",
          trackingNumber: trackingNumber || undefined,
          trackingCompany: trackingNumber ? trackingCompany : undefined,
          trackingUrl,
          paymentMethod: note.includes("Bold") ? "Pasarela Bold.co" : "Pago Directo Web",
          paymentStatus: "APROBADO",
          customerName: clientName,
          customerEmail: clientEmail,
          customerPhone: clientPhone,
          customerDocument: clientDoc,
          customerAddress: clientAddress,
          customerCity: clientCity,
          customerId: attachedCust?.id || r.customer_id || undefined,
          customer: {
            name: clientName,
            email: clientEmail,
            phone: clientPhone,
            document: clientDoc,
          },
          shippingAddress: {
            address: clientAddress,
            city: clientCity,
            recipientName: clientName,
            recipientPhone: clientPhone,
          },
          items,
          receiptNote: note,
          note: note,
        };
      });

    return new Response(JSON.stringify({ success: true, count: webOrders.length, orders: webOrders }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, count: 0, orders: [], error: error.message }), {
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
