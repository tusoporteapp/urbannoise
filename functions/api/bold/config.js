export async function onRequestGet() {
  return new Response(JSON.stringify({
    configured: true,
    hasIdentityKey: true,
    hasSecretKey: true,
    identityKey: "lRI_amtz7N6CTdY-m3JWIYDmTZC2DHMaO9Oe7z5-u-U",
    identityKeyMasked: "lRI_am••••u-U",
    isLiveMode: true,
    recentOrdersCount: 0,
    recentWebhooksCount: 0,
    webhookUrl: "/api/bold/webhook"
  }), {
    status: 200,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
  });
}
