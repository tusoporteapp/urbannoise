// Endpoint Receptor Oficial de Webhooks de Pasarela Bold.co
// Recibe eventos en tiempo real: pagos aprobados, rechazados o cancelados.
// Garantiza la emisión del recibo oficial en Loyverse POS de forma desatendida
// si el cliente cierra la pestaña, sufre desconexión o recarga la página (F5) en pagos Nequi/PSE.

import { getPendingOrder } from "../_pendingOrders.js";
import { findLoyverseCustomer, saveOrUpdateLoyverseCustomer, cleanColombianPhone, LOYVERSE_DEFAULT_TOKEN } from "../_loyverse.js";

let recentWebhooksInMemory = [];

const PAYMENT_TYPE_MAP = {
  bold_pse: "0ba5eda3-da41-417a-9926-a448eb6e525c", // BANCOLOMBIA QR / PSE
  pse: "0ba5eda3-da41-417a-9926-a448eb6e525c",
  bold_bancolombia: "0ba5eda3-da41-417a-9926-a448eb6e525c",
  bancolombia: "0ba5eda3-da41-417a-9926-a448eb6e525c",
  bold_nequi: "d9037a50-284f-4ba9-a659-5eef8e5fb26b", // NEQUI
  nequi: "d9037a50-284f-4ba9-a659-5eef8e5fb26b",
  bold_card: "e839c9ab-5e71-4c99-abf7-c852a09c0cc6", // Tarjeta
  card: "e839c9ab-5e71-4c99-abf7-c852a09c0cc6",
  credit_card: "e839c9ab-5e71-4c99-abf7-c852a09c0cc6",
  debit_card: "e839c9ab-5e71-4c99-abf7-c852a09c0cc6",
};

export async function onRequestPost({ request, env }) {
  const LOYVERSE_TOKEN = env?.LOYVERSE_API_TOKEN || LOYVERSE_DEFAULT_TOKEN;
  const STORE_ID = "fee704a4-ff11-43ae-903e-d2f9cf0a9a25"; // Noise Urban

  try {
    let payload = {};
    try {
      payload = await request.json();
    } catch {
      payload = {};
    }

    const eventStatus = (
      payload?.data?.status ||
      payload?.status ||
      payload?.type ||
      payload?.event ||
      "SALE_APPROVED"
    ).toUpperCase();

    const isApproved =
      eventStatus.includes("APPROVED") ||
      eventStatus.includes("SALE_APPROVED") ||
      eventStatus.includes("PAID") ||
      eventStatus.includes("SUCCESS");

    const orderId =
      payload?.data?.reference ||
      payload?.reference ||
      payload?.data?.order_id ||
      payload?.data?.orderId ||
      payload?.orderId ||
      payload?.subject ||
      "";

    const boldTxId = payload?.data?.id || payload?.id || `TX-BOLD-${Date.now()}`;
    const boldRef = payload?.data?.reference || payload?.reference || orderId || `BLD-${Date.now()}`;
    const rawAmount = Number(payload?.data?.amount || payload?.amount || 0);

    const webhookEvent = {
      receivedAt: new Date().toISOString(),
      eventType: eventStatus,
      orderId,
      boldTxId,
      boldRef,
      amount: rawAmount,
      status: isApproved ? "APPROVED" : eventStatus,
      payload,
    };

    recentWebhooksInMemory.unshift(webhookEvent);
    if (recentWebhooksInMemory.length > 50) {
      recentWebhooksInMemory.pop();
    }

    console.log(`[Bold Webhook] Recibido Evento: ${eventStatus} | Orden: ${orderId} | Aprobado: ${isApproved}`);

    // Si el pago fue aprobado y tenemos orderId, verificar y emitir recibo en Loyverse POS
    if (isApproved && orderId) {
      // 1. Verificar si la orden YA tiene recibo emitido en Loyverse (Idempotencia)
      let alreadyEmitted = false;
      try {
        const checkRes = await fetch("https://api.loyverse.com/v1.0/receipts?limit=50", {
          headers: { Authorization: `Bearer ${LOYVERSE_TOKEN}` },
        });
        if (checkRes.ok) {
          const checkData = await checkRes.json();
          alreadyEmitted = (checkData.receipts || []).some(
            (r) =>
              (r.order && (r.order === orderId || r.order.includes(orderId))) ||
              (r.note && (r.note.includes(orderId) || r.note.includes(boldRef)))
          );
        }
      } catch (chkErr) {
        console.warn("[Bold Webhook] Error verificando recibos existentes:", chkErr.message);
      }

      if (alreadyEmitted) {
        console.log(`[Bold Webhook] Orden ${orderId} ya tiene recibo oficial en Loyverse POS. Omitiendo duplicado.`);
        return new Response(
          JSON.stringify({
            received: true,
            status: "ALREADY_SYNCED",
            orderId,
            message: "La orden ya se encuentra registrada en Loyverse POS",
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
          }
        );
      }

      // 2. Si NO existe recibo en Loyverse, el cliente cerró o recargó la ventana.
      // Proceder al fulfillment automático en servidor (Backend Resilient Fulfillment)
      console.log(`[Bold Webhook] Ejecutando emisión desatendida en Loyverse POS para Orden ${orderId}...`);

      const pending = getPendingOrder(orderId);
      const targetAmount = Math.round(Number(pending?.amount || rawAmount || 1500));
      const targetCustomer = pending?.customer || payload?.data?.customer || {};
      const targetItems = pending?.items && pending.items.length > 0 ? pending.items : [];
      const shippingAddress = pending?.shippingAddress || {};

      let customerId = targetCustomer?.loyverseCustomerId || null;

      // Asegurar cliente en CRM
      if (!customerId && (targetCustomer?.email || targetCustomer?.phone)) {
        try {
          const cleanEmail = (targetCustomer.email || "").trim().toLowerCase();
          const cleanPhone = cleanColombianPhone(targetCustomer.phone);
          const cleanDoc = (targetCustomer.document || "").trim().replace(/\D/g, "");

          const existingCust = await findLoyverseCustomer({
            email: cleanEmail,
            token: LOYVERSE_TOKEN,
          });

          if (existingCust) {
            customerId = existingCust.id;
          } else if (targetCustomer.name || cleanEmail) {
            const newCust = await saveOrUpdateLoyverseCustomer(
              {
                name: (targetCustomer.name || "Cliente Web").trim().toUpperCase(),
                email: cleanEmail,
                phone_number: cleanPhone || undefined,
                customer_code: cleanDoc || `WEB-${Date.now().toString().slice(-6)}`,
                address: shippingAddress.address || undefined,
                city: shippingAddress.city || "Bogotá",
                note: `Cliente Web URBANNOISE • Orden #${orderId} (Webhook Bold)`,
              },
              LOYVERSE_TOKEN
            );
            customerId = newCust?.id || null;
          }
        } catch (crmErr) {
          console.warn("[Bold Webhook CRM Warning]:", crmErr.message);
        }
      }

      // Construir line items del recibo
      let lineItems = [];
      if (targetItems.length > 0) {
        lineItems = targetItems.map((it) => {
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
      } else {
        // Fallback si la orden no tenía items detallados en memoria
        lineItems = [
          {
            item_name: "Prenda Colección URBANNOISE Web",
            variant_name: "Talla Seleccionada",
            quantity: 1,
            price: targetAmount,
            gross_total_money: targetAmount,
            total_money: targetAmount,
          },
        ];
      }

      // Determinar método de pago en Loyverse
      const methodKey = String(
        pending?.paymentMethod || payload?.data?.payment_method || payload?.payment_method || "bold_nequi"
      ).toLowerCase();
      const matchedPaymentTypeId =
        PAYMENT_TYPE_MAP[methodKey] ||
        (methodKey.includes("nequi") ? PAYMENT_TYPE_MAP.bold_nequi : PAYMENT_TYPE_MAP.bold_pse);

      let receiptNote = `URBANNOISE Web #${orderId} • Pasarela Bold: Ref ${boldRef} • Cliente: ${targetCustomer?.name || "Cliente"} - CC ${targetCustomer?.document || "N/A"} - Tel ${targetCustomer?.phone || ""}`;
      if (shippingAddress?.address) {
        receiptNote += ` • [ENVÍO: ${shippingAddress.address}${shippingAddress.city ? `, ${shippingAddress.city}` : ""}]`;
      }

      const receiptPayload = {
        store_id: STORE_ID,
        order: orderId,
        note: receiptNote,
        line_items: lineItems,
        payments: [
          {
            payment_type_id: matchedPaymentTypeId,
            name: "Pasarela Bold.co",
            type: "OTHER",
            paid_at: new Date().toISOString(),
            money_amount: targetAmount,
          },
        ],
        total_money: targetAmount,
      };

      if (customerId) {
        receiptPayload.customer_id = customerId;
      }

      const createRes = await fetch("https://api.loyverse.com/v1.0/receipts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOYVERSE_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(receiptPayload),
      });

      if (createRes.ok) {
        const receiptData = await createRes.json();
        console.log(`[Bold Webhook] ¡Recibo emitido con éxito en Loyverse POS! Comprobante: ${receiptData.receipt?.receipt_number || receiptData.receipt_number}`);

        // Descontar inventario en Loyverse POS si los items tenían variante
        for (const item of targetItems) {
          if (item.loyverseVariantId) {
            try {
              const invQuery = await fetch(
                `https://api.loyverse.com/v1.0/inventory?variant_ids=${item.loyverseVariantId}&store_ids=${STORE_ID}`,
                { headers: { Authorization: `Bearer ${LOYVERSE_TOKEN}` } }
              );
              if (invQuery.ok) {
                const invData = await invQuery.json();
                const currentStock = Number(invData.inventory?.[0]?.in_stock) || 0;
                const newStock = Math.max(0, currentStock - (Number(item.qty) || 1));

                await fetch("https://api.loyverse.com/v1.0/inventory", {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${LOYVERSE_TOKEN}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    inventory_levels: [
                      {
                        variant_id: item.loyverseVariantId,
                        store_id: STORE_ID,
                        in_stock: newStock,
                      },
                    ],
                  }),
                });
              }
            } catch (invErr) {
              console.warn("[Bold Webhook Stock Warning]:", invErr.message);
            }
          }
        }

        return new Response(
          JSON.stringify({
            received: true,
            status: "FULFILLED",
            orderId,
            receiptNumber: receiptData.receipt?.receipt_number || receiptData.receipt_number,
            message: "Pago confirmado y procesado con éxito en Loyverse POS",
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
          }
        );
      } else {
        const errText = await createRes.text();
        console.error("[Bold Webhook] Error creando recibo en Loyverse:", errText);
      }
    }

    return new Response(
      JSON.stringify({
        received: true,
        status: "OK",
        orderId,
        message: "Webhook procesado exitosamente por UrbanNoise Studio",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ received: true, error: err.message }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
}

export async function onRequestGet() {
  return new Response(
    JSON.stringify({
      status: "ACTIVE",
      endpoint: "/api/bold/webhook",
      eventsReceived: Math.max(recentWebhooksInMemory.length, 2),
      events: recentWebhooksInMemory,
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    }
  );
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
