import { findLoyverseCustomer, cleanColombianPhone, LOYVERSE_DEFAULT_TOKEN } from "../_loyverse.js";

export async function onRequestGet({ request, env }) {
  try {
    const url = new URL(request.url);
    const email = (url.searchParams.get("email") || "").trim().toLowerCase();
    const customerId = (url.searchParams.get("customerId") || "").trim();
    const doc = (url.searchParams.get("doc") || "").trim().replace(/\D/g, "");

    if (!email && !customerId && !doc) {
      return new Response(JSON.stringify({ success: true, count: 0, orders: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    const LOYVERSE_TOKEN = env?.LOYVERSE_API_TOKEN || LOYVERSE_DEFAULT_TOKEN;

    // 1. Obtener datos del cliente de Loyverse de forma estricta por correo o ID
    // y obtener los recibos de venta recientes en paralelo
    const [targetCust, receiptsRes] = await Promise.all([
      findLoyverseCustomer({
        customerId: customerId || undefined,
        email: email || undefined,
        token: LOYVERSE_TOKEN,
      }),
      fetch("https://api.loyverse.com/v1.0/receipts?limit=250", {
        headers: { Authorization: `Bearer ${LOYVERSE_TOKEN}` },
      }),
    ]);

    let allReceipts = [];
    if (receiptsRes.ok) {
      const data = await receiptsRes.json();
      allReceipts = data.receipts || [];
    }

    const verifiedCustId = targetCust?.id || null;

    // 2. Filtrar recibos correspondientes al cliente de forma estricta (Zero Cross-Account Leak)
    const emailEscaped = email ? email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") : null;
    const emailRegex = emailEscaped ? new RegExp(`(?:^|[^a-zA-Z0-9_.+-])${emailEscaped}(?:$|[^a-zA-Z0-9_.+-])`, "i") : null;
    const targetCc = targetCust?.customer_code ? String(targetCust.customer_code).trim().replace(/\D/g, "") : (doc || "");
    const matchedReceipts = allReceipts.filter((r) => {
      if (verifiedCustId && r.customer_id === verifiedCustId) return true;

      const note = r.note || "";
      if (emailRegex && emailRegex.test(note)) return true;

      // Si el recibo tiene el documento C.C. verificado de este cliente
      if (targetCc && targetCc.length >= 6 && note.includes(targetCc)) return true;

      return false;
    });

    // 3. Transformar recibos a formato estándar CustomerOrder
    const orders = matchedReceipts.map((r) => {
      const note = r.note || "";
      const orderId = r.order || `#REC-${r.receipt_number}`;
      const ccMatch = note.match(/CC:\s*([^\s•|]+)/i);
      const nameMatch = note.match(/Cliente:\s*([^•-]+)/i);
      const phoneMatch = note.match(/Tel:\s*([^\s•|]+)/i);
      const addrMatch = note.match(/\[ENV[ÍI]O:\s*([^\]]+)\]/i) || note.match(/Dir:\s*([^•|]+)/i);
      const cityMatch = note.match(/Ciudad:\s*([^•|]+)/i);

      const clientName = targetCust?.name || (nameMatch ? nameMatch[1].trim() : "Cliente URBANNOISE");
      const clientEmail = targetCust?.email || email || "";
      const clientPhone = cleanColombianPhone(targetCust?.phone_number || (phoneMatch ? phoneMatch[1].trim() : ""));
      const clientDoc = targetCust?.customer_code || (ccMatch ? ccMatch[1].trim() : doc);
      const clientAddress = targetCust?.address || (addrMatch ? addrMatch[1].trim() : "");
      const clientCity = targetCust?.city || (cityMatch ? cityMatch[1].trim() : "Bogotá");

      // Buscar guía vinculada estrictamente a ESTA orden
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
      }

      let matchedGuia = null;
      let matchedEmpresa = "Servientrega";

      // 1. Prioridad: Buscar en la nota del cliente de Loyverse
      const custNote = targetCust?.note || "";
      const custTagRegex = /\[(?:GUIA|G):\s*([^\|\]]+?)(?:\|\s*(?:EMPRESA|E):\s*([^\|\]]+?))?(?:\|\s*(?:ORDEN|O):\s*([^\|\]]+?))?\]/gi;
      let tagMatch;
      while ((tagMatch = custTagRegex.exec(custNote)) !== null) {
        const gNum = (tagMatch[1] || "").trim();
        const gEmp = (tagMatch[2] || "Servientrega").trim();
        const gOrd = tagMatch[3] ? tagMatch[3].replace(/^#/, "").trim().toUpperCase() : "";
        if (gOrd && orderIdentifiers.has(gOrd)) {
          matchedGuia = gNum;
          matchedEmpresa = gEmp;
          break;
        }
      }

      // 2. Si no está en la nota del cliente, buscar en la nota del recibo
      if (!matchedGuia) {
        const receiptTagRegex = /\[(?:GUIA|G):\s*([^\|\]]+?)(?:\|\s*(?:EMPRESA|E):\s*([^\|\]]+?))?(?:\|\s*(?:ORDEN|O):\s*([^\|\]]+?))?\]/gi;
        let rTagMatch;
        while ((rTagMatch = receiptTagRegex.exec(note)) !== null) {
          const gNum = (rTagMatch[1] || "").trim();
          const gEmp = (rTagMatch[2] || "Servientrega").trim();
          const gOrd = rTagMatch[3] ? rTagMatch[3].replace(/^#/, "").trim().toUpperCase() : "";
          if (!gOrd || orderIdentifiers.has(gOrd)) {
            matchedGuia = gNum;
            matchedEmpresa = gEmp;
            break;
          }
        }
      }

      const isDispatched = Boolean(matchedGuia && matchedGuia.length >= 4);

      let trackingUrl = undefined;
      if (isDispatched) {
        const compLower = matchedEmpresa.toLowerCase();
        if (compLower.includes("interrapid") || compLower.includes("inter rapidisimo")) {
          trackingUrl = `https://www.interrapidisimo.com/siga/?guia=${matchedGuia}`;
        } else {
          trackingUrl = `https://www.servientrega.com/wps/portal/rastreo-envio?guia=${matchedGuia}`;
        }
      }

      const receiptDate = new Date(r.created_at);
      const formattedDate = receiptDate.toLocaleDateString("es-CO", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });

      const items = (r.line_items || []).map((li, idx) => ({
        id: li.variant_id || li.item_id || `item-${idx}`,
        name: li.item_name || "Prenda URBANNOISE",
        size: li.variant_name || "Talla Única",
        qty: Math.round(li.quantity || 1),
        price: Number(li.price || 0),
        image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1000&auto=format&fit=crop",
        sku: li.sku || `UN-${li.item_id || idx}`,
      }));

      const totalMoney = Number(r.total_money || 0);

      return {
        id: orderId,
        orderNumber: orderId,
        date: formattedDate,
        timestamp: receiptDate.getTime(),
        status: isDispatched ? "DESPACHADO" : "EN_PREPARACION",
        statusLabel: isDispatched
          ? `Despachado con ${matchedEmpresa} (Guía: ${matchedGuia})`
          : "En Preparación para Despacho en Atelier Bogotá",
        trackingNumber: matchedGuia || undefined,
        trackingCompany: matchedGuia ? matchedEmpresa : undefined,
        trackingUrl,
        estimatedDelivery: isDispatched
          ? "En tránsito nacional • 1 a 3 días hábiles"
          : "Despacho programado en 24-48 horas",
        timeline: [
          {
            title: "Pago Confirmado & Verificado",
            date: formattedDate,
            completed: true,
            current: false,
            status: "completed",
            detail: `Transacción aprobada por $${totalMoney.toLocaleString("es-CO")} COP.`,
          },
          {
            title: "Paquete en Preparación",
            date: isDispatched ? "Completado" : "En proceso",
            completed: isDispatched,
            current: !isDispatched,
            status: isDispatched ? "completed" : "in_progress",
            detail: isDispatched
              ? "Paquete empacado y sellado exitosamente en el Atelier."
              : "Prendas en confección y alistamiento en packaging de seguridad en Bogotá.",
          },
          {
            title: "Enviado",
            date: isDispatched ? "Despachado" : "Pendiente",
            completed: isDispatched,
            current: isDispatched,
            status: isDispatched ? "completed" : "pending",
            detail: isDispatched
              ? `Entregado a ${matchedEmpresa} bajo la guía oficial #${matchedGuia}. En camino hacia tu dirección.`
              : "Pendiente de entrega a la empresa de mensajería para asignación de guía.",
          },
        ],
        shippingAddress: {
          name: clientName,
          city: clientCity,
          department: "Colombia",
          address: clientAddress,
          phone: clientPhone,
        },
        items,
        totals: {
          subtotal: totalMoney,
          shipping: 0,
          discount: 0,
          total: totalMoney,
        },
        total: totalMoney,
        total_money: totalMoney,
        amount: totalMoney,
        paymentMethod: note.includes("Bold") ? "Pasarela Bold.co" : "Pago Aprobado",
        paymentStatus: "APROBADO",
        receiptNumber: String(r.receipt_number || ""),
        userEmail: clientEmail,
      };
    });

    // Construir perfil estructurado del cliente para auto-completar checkout y vistas
    let customerProfile = null;
    if (targetCust || orders.length > 0) {
      const latestOrder = orders[0];
      const custNote = targetCust?.note || "";
      const ccMatch = custNote.match(/CC:\s*([^\s|•]+)/i);
      const dirMatch = custNote.match(/Dir:\s*([^|•]+)/i);
      const cityMatch = custNote.match(/Ciudad:\s*([^|•]+)/i);

      const resolvedPhone = cleanColombianPhone(
        targetCust?.phone_number || latestOrder?.shippingAddress?.phone || ""
      );

      customerProfile = {
        name: targetCust?.name || latestOrder?.shippingAddress?.name || "Cliente URBANNOISE",
        email: targetCust?.email || email || latestOrder?.userEmail || "",
        phone: resolvedPhone,
        document:
          targetCust?.customer_code ||
          (ccMatch ? ccMatch[1].trim() : (latestOrder?.shippingAddress?.phone ? "" : (doc || ""))),
        address:
          targetCust?.address ||
          (dirMatch ? dirMatch[1].trim() : (latestOrder?.shippingAddress?.address || "")),
        city:
          targetCust?.city ||
          (cityMatch ? cityMatch[1].trim() : (latestOrder?.shippingAddress?.city || "Bogotá")),
      };
    }

    return new Response(JSON.stringify({ success: true, count: orders.length, orders, customerProfile }), {
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
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
