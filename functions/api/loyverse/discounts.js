export async function onRequestGet() {
  try {
    const LOYVERSE_TOKEN = "eac78ade09eb4cf2b0700e291be2fe0d";

    const res = await fetch("https://api.loyverse.com/v1.0/discounts", {
      headers: { Authorization: `Bearer ${LOYVERSE_TOKEN}` },
    });

    if (!res.ok) {
      return new Response(JSON.stringify({ discounts: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    const data = await res.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ discounts: [], error: error.message }), {
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
