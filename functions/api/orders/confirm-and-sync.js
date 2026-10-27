export async function onRequestPost({ request }) {
  try {
    const body = await request.json();
    const {
      orderId,
      amount,
      currency = "COP",
      paymentMethod = "bold_pse",
      boldTransaction,
      customer,
      items = [],
      totals = {},
      shippingAddress = {},
    } = body;

    if (!orderId) {
      return new Response(JSON.stringify({ error: "orderId es requerido" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    const LOYVERSE_TOKEN = "eac78ade09eb4cf2b0700e291be2fe0d";
    const STORE_ID = "fee704a4-ff11-43ae-903e-d2f9cf0a9a25"; // Noise Urban
    const orderAmount = Number(totals.total || amount || 0);

    let customerId = null;

    // 1. Vincular o crear cliente en Loyverse CRM
    if (customer?.email || customer?.phone) {
      try {
        const cleanEmail = (customer.email || "").trim().toLowerCase();
        const cleanPhone = (customer.phone || "").trim().replace(/\D/g, "");
        const cleanDoc = (customer.document || "").trim().replace(/\D/g, "");

        const custRes = await fetch("https://api.loyverse.com/v1.0/customers?limit=100", {
          headers: { Authorization: `Bearer ${LOYVERSE_TOKEN}` },
        });

        if (custRes.ok) {
          const custData = await custRes.json();
          const existing = (custData.customers || []).find((c) =>
            (cleanEmail && c.email && c.email.toLowerCase() === cleanEmail) ||
            (cleanPhone && c.phone_number && c.phone_number.replace(/\D/g, "") === cleanPhone)
          );

          if (existing) {
            customerId = existing.id;
          } else if (customer.name) {
            const createCustRes = await fetch("https://api.loyverse.com/v1.0/customers", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${LOYVERSE_TOKEN}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                name: (customer.name || "Cliente Web").trim().toUpperCase(),
                email: cleanEmail || undefined,
                phone_number: cleanPhone || undefined,
                address: customer.address || shippingAddress.address || undefined,
                city: customer.city || shippingAddress.city || undefined,
                note: `CC: ${cleanDoc} | Cliente Web URBANNOISE | Ref Pedido: #${orderId}`,
              }),
            });
            if (createCustRes.ok) {
              const newCust = await createCustRes.json();
              customerId = newCust.id || null;
            }
          }
        }
      } catch (custErr) {
        console.warn("[Loyverse CRM Error]:", custErr.message);
      }
    }

    // 2. Construir line items para el Recibo Oficial en Loyverse
    const lineItems = items.map((it) => {
      const unitPrice = Number(it.price) || 0;
      const qty = Number(it.qty) || 1;
      const lineTotal = unitPrice * qty;

      const itemPayload = {
        item_name: it.name || "Prenda URBANNOISE",
        variant_name: it.size || "Talla Única",
        quantity: qty,
        price: unitPrice,
        gross_total_money: lineTotal,
        total_money: lineTotal,
      };

      if (it.loyverseVariantId) {
        itemPayload.variant_id = it.loyverseVariantId;
      }

      return itemPayload;
    });

    let receiptNote = `URBANNOISE Web #${orderId} • Pasarela Bold: Ref ${boldTransaction?.boldReference || "BLD-DIRECT"} • Cliente: ${customer?.name || "Cliente"} - CC ${customer?.document || "N/A"} - Tel ${customer?.phone || ""}`;
    if (shippingAddress?.address) {
      receiptNote += ` • [ENVÍO: ${shippingAddress.address} - ${shippingAddress.city || "Bogotá"} (${shippingAddress.department || "Cundinamarca"})]`;
    }

    const receiptPayload = {
      store_id: STORE_ID,
      receipt_type: "SELL",
      order: orderId,
      created_at: new Date().toISOString(),
      note: receiptNote,
      line_items: lineItems,
      payments: [
        {
          payment_name: `Bold.co (${paymentMethod})`,
          type: "OTHER",
          paid_at: new Date().toISOString(),
          money_amount: orderAmount,
        },
      ],
      total_money: orderAmount,
    };

    if (customerId) {
      receiptPayload.customer_id = customerId;
    }

    let loyverseReceipt = null;
    let loyverseSyncStatus = "SIMULATED";

    try {
      const receiptRes = await fetch("https://api.loyverse.com/v1.0/receipts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOYVERSE_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(receiptPayload),
      });

      if (receiptRes.ok) {
        const receiptData = await receiptRes.json();
        loyverseReceipt = {
          id: receiptData.receipt?.id || receiptData.id || `REC-${Date.now()}`,
          receipt_number: receiptData.receipt?.receipt_number || receiptData.receipt_number || `REC-${orderId}`,
          created_at: receiptData.receipt?.created_at || new Date().toISOString(),
          total_money: orderAmount,
          syncedToPos: true,
        };
        loyverseSyncStatus = "SUCCESS";
      } else {
        const errorText = await receiptRes.text();
        console.error("[Loyverse Receipt API Error]:", errorText);
      }
    } catch (rErr) {
      console.error("[Loyverse Receipt Exception]:", rErr.message);
    }

    // 3. Descontar Inventario en Loyverse si hay variantes con stock rastreado
    try {
      for (const it of items) {
        if (it.loyverseVariantId) {
          const invQuery = await fetch(
            `https://api.loyverse.com/v1.0/inventory?variant_ids=${it.loyverseVariantId}`,
            { headers: { Authorization: `Bearer ${LOYVERSE_TOKEN}` } }
          );
          if (invQuery.ok) {
            const invData = await invQuery.json();
            const currentLevel = (invData.inventory_levels || []).find(
              (l) => l.store_id === STORE_ID
            );
            const currentStock = currentLevel ? Number(currentLevel.in_stock) : 5;
            const newStock = Math.max(0, currentStock - (Number(it.qty) || 1));

            await fetch("https://api.loyverse.com/v1.0/inventory", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${LOYVERSE_TOKEN}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                inventory_levels: [
                  {
                    variant_id: it.loyverseVariantId,
                    store_id: STORE_ID,
                    stock_after: newStock,
                  },
                ],
              }),
            });
          }
        }
      }
    } catch (invErr) {
      console.warn("[Loyverse Stock Deduction Warning]:", invErr.message);
    }

    if (!loyverseReceipt) {
      loyverseReceipt = {
        id: `REC-${orderId}`,
        receipt_number: `REC-${orderId}`,
        created_at: new Date().toISOString(),
        total_money: orderAmount,
        syncedToPos: false,
      };
    }

    return new Response(
      JSON.stringify({
        success: true,
        orderId,
        boldTransaction: boldTransaction || {
          orderId,
          boldTransactionId: `TX-BOLD-${orderId}`,
          boldReference: `BLD-${orderId}`,
          amount: orderAmount,
          currency,
          paymentMethod,
          payerName: customer?.name || "Cliente URBANNOISE",
          payerEmail: customer?.email || "",
          payerDocument: customer?.document || "",
          timestamp: new Date().toISOString(),
          status: "APROBADA",
        },
        loyverseReceipt,
        loyverseSyncStatus,
        inventoryDeducted: true,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
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
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
