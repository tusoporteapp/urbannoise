export async function onRequestGet() {
  try {
    const LOYVERSE_TOKEN = "eac78ade09eb4cf2b0700e291be2fe0d";

    const res = await fetch("https://api.loyverse.com/v1.0/receipts?limit=50", {
      headers: { Authorization: `Bearer ${LOYVERSE_TOKEN}` },
    });

    if (!res.ok) {
      return new Response(JSON.stringify({ orders: [], count: 0 }), {
        status: 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    const data = await res.json();
    const receipts = data.receipts || [];

    // Filtrar los que provienen de la tienda web
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
      .map((r) => ({
        id: r.order || r.receipt_number,
        orderId: r.order || r.receipt_number,
        orderNumber: r.order || r.receipt_number,
        receiptNumber: r.receipt_number,
        total_money: r.total_money,
        amount: r.total_money,
        customer_name: r.customer_name || (r.note?.match(/Cliente:\s*([^•-]+)/) ? r.note.match(/Cliente:\s*([^•-]+)/)[1].trim() : "Cliente Web"),
        customer: {
          name: r.customer_name || (r.note?.match(/Cliente:\s*([^•-]+)/) ? r.note.match(/Cliente:\s*([^•-]+)/)[1].trim() : "Cliente Web"),
        },
        paymentMethod: r.payments?.[0]?.name || "Bold.co",
        created_at: r.created_at,
        status: "CONFIRMADO",
        loyverseSyncStatus: "SUCCESS",
        loyverseReceipt: {
          receipt_number: r.receipt_number,
          total_money: r.total_money,
          created_at: r.created_at,
          syncedToPos: true,
        },
      }));

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
      "Access-Control-Allow-Headers": "Content-Type, Authorization, x-admin-key",
    },
  });
}
