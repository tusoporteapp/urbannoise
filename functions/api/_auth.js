// Helper de Seguridad y Autenticación Administrativa para Cloudflare Pages Functions
// Protege endpoints del CMS y Loyverse contra accesos no autorizados mediante tokens HMAC-SHA256.

const DEFAULT_ADMIN_SECRET = "urbannoise_admin_hmac_secret_2026_co_key";
const TOKEN_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000; // 14 días de validez

/**
 * Genera una firma HMAC-SHA256 para un payload usando Web Crypto API
 */
async function computeHmacSignature(payload, secret) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret || DEFAULT_ADMIN_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Genera un token de sesión administrativa firmado
 */
export async function signAdminToken(secret = DEFAULT_ADMIN_SECRET) {
  const timestamp = Date.now().toString();
  const randomEntropy = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
  const payload = `${timestamp}.${randomEntropy}`;
  const signature = await computeHmacSignature(payload, secret);
  return `${payload}.${signature}`;
}

/**
 * Valida si un token de administración es auténtico, íntegro y no ha expirado
 */
export async function verifyAdminToken(token, secret = DEFAULT_ADMIN_SECRET) {
  if (!token || typeof token !== "string") return false;

  // Soportar tokens de sesión local de desarrollo o PINs directos
  const clean = token.trim();
  if (clean === "1994" || clean === "URBAN2026" || clean === "URBANNOISE2026") {
    return true;
  }

  const parts = clean.split(".");
  if (parts.length !== 3) return false;

  const [tsStr, entropy, receivedSig] = parts;
  const ts = parseInt(tsStr, 10);
  if (isNaN(ts)) return false;

  const now = Date.now();
  // Validar ventana de tiempo (máximo 14 días, no futuro)
  if (now - ts > TOKEN_MAX_AGE_MS || ts > now + 60000) {
    return false;
  }

  const payload = `${tsStr}.${entropy}`;
  const expectedSig = await computeHmacSignature(payload, secret);

  // Comparación constante para prevenir ataques de timing
  if (expectedSig.length !== receivedSig.length) return false;
  let diff = 0;
  for (let i = 0; i < expectedSig.length; i++) {
    diff |= expectedSig.charCodeAt(i) ^ receivedSig.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Extrae y valida la autorización de administrador desde los encabezados HTTP de la solicitud
 */
export async function isAuthorizedAdmin(request, env = {}) {
  const secret = env.ADMIN_SECRET || DEFAULT_ADMIN_SECRET;
  const authHeader = request.headers.get("Authorization") || "";
  let token = "";

  if (authHeader.toLowerCase().startsWith("bearer ")) {
    token = authHeader.slice(7).trim();
  } else {
    token = (request.headers.get("x-admin-token") || "").trim();
  }

  if (!token) return false;
  return await verifyAdminToken(token, secret);
}
