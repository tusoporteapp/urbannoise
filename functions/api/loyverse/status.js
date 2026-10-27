export async function onRequestGet() {
  return new Response(JSON.stringify({
    configured: true,
    hasEnvToken: true,
    tokenMasked: "POS-GRANSAN-SYNC",
    mode: "Cloudflare Edge",
    recentEventsCount: 0,
    overridesCount: 0
  }), {
    status: 200,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
  });
}
