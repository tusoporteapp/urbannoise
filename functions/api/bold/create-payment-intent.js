export async function onRequestPost({ request }) {
  try {
    const { orderId, amount, currency = "COP", customer, description, redirectionUrl } = await request.json();
    const numAmount = Math.round(Number(amount));
    if (!orderId || isNaN(numAmount) || numAmount < 1000) {
      return new Response(JSON.stringify({ error: "Faltan datos requeridos o el monto es menor al mínimo permitido (orderId, amount >= 1000 COP)" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    const identityKey = "lRI_amtz7N6CTdY-m3JWIYDmTZC2DHMaO9Oe7z5-u-U";
    const secretKey = "zGivRzn0ym4CDxGErtEtYQ";

    // Fórmula oficial Bold: SHA256(orderId + amount + currency + secretKey)
    const rawStringToSign = `${orderId}${numAmount}${currency}${secretKey}`;
    const encoder = new TextEncoder();
    const hashBuf = await crypto.subtle.digest("SHA-256", encoder.encode(rawStringToSign));
    const integritySignature = Array.from(new Uint8Array(hashBuf))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");

    return new Response(JSON.stringify({
      success: true,
      orderId,
      amount: Number(amount),
      currency,
      integritySignature,
      identityKey,
      hasLiveCredentials: true,
      isLiveMode: true,
      customer: customer || {},
      description: description || `Pedido URBANNOISE #${orderId}`,
      redirectionUrl: redirectionUrl || "",
      timestamp: new Date().toISOString(),
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}
