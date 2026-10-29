// Endpoint de Autenticación de Administrador para Cloudflare Pages Functions
// Protegido bajo directivas OWASP / Security-Audit: cero credenciales en texto plano,
// validación criptográfica en servidor, bloqueo anti-fuerza bruta y emisión de JWT HMAC-SHA256.
import { signAdminToken } from "../_auth.js";

// Hash criptográfico SHA-256 precalculado de la contraseña maestra oficial
const MASTER_PASSWORD_SHA256 = "4ebf94d08145211fd39075834eb57cf392359e5ac39e576bd2f61e8250a95a4f";

// Memoria de intentos fallidos en el Edge (Anti Brute-Force Rate Limiting)
const failedAttemptsMap = new Map();
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 10 * 60 * 1000; // 10 minutos de bloqueo temporal

async function computeSha256(str) {
  const enc = new TextEncoder();
  const hashBuf = await crypto.subtle.digest("SHA-256", enc.encode(str));
  return Array.from(new Uint8Array(hashBuf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function onRequestPost({ request, env }) {
  try {
    const clientIp = request.headers.get("CF-Connecting-IP") || request.headers.get("x-forwarded-for") || "unknown-ip";
    const now = Date.now();

    // 0. Protección contra Ataques de Fuerza Bruta (OWASP A07:2021)
    const ipRecord = failedAttemptsMap.get(clientIp);
    if (ipRecord && ipRecord.count >= MAX_FAILED_ATTEMPTS) {
      if (now - ipRecord.lastAttempt < LOCKOUT_DURATION_MS) {
        const remainingMinutes = Math.ceil((LOCKOUT_DURATION_MS - (now - ipRecord.lastAttempt)) / 60000);
        return new Response(
          JSON.stringify({
            success: false,
            error: `Demasiados intentos fallidos. Acceso bloqueado temporalmente por seguridad. Intenta nuevamente en ${remainingMinutes} minuto(s).`,
          }),
          {
            status: 429,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
              "Retry-After": String(Math.ceil((LOCKOUT_DURATION_MS - (now - ipRecord.lastAttempt)) / 1000)),
            },
          }
        );
      } else {
        // Expiró el bloqueo, resetear
        failedAttemptsMap.delete(clientIp);
      }
    }

    const body = await request.json();
    const rawPass = String(body.pin || body.password || "").trim();
    const cleanEmail = String(body.email || "").trim().toLowerCase();

    if (!rawPass || !cleanEmail) {
      return new Response(
        JSON.stringify({ success: false, error: "El correo y la contraseña de administrador son obligatorios." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        }
      );
    }

    // 1. Verificación estricta de correo de administrador autorizado
    const isAuthorizedAdminEmail =
      cleanEmail === "urban.noice@gmail.com" ||
      cleanEmail === "admin@urbannoise.co";

    // 2. Verificación criptográfica estricta (Zero Plaintext Secrets en código)
    let isMatch = false;
    if (isAuthorizedAdminEmail) {
      if (env?.ADMIN_MASTER_PASSWORD && rawPass === env.ADMIN_MASTER_PASSWORD) {
        isMatch = true;
      } else if (env?.ADMIN_PIN && rawPass === env.ADMIN_PIN) {
        isMatch = true;
      } else {
        const passHash = await computeSha256(rawPass);
        if (passHash === MASTER_PASSWORD_SHA256) {
          isMatch = true;
        }
      }
    }

    if (!isMatch) {
      // Registrar intento fallido
      const current = failedAttemptsMap.get(clientIp) || { count: 0, lastAttempt: now };
      failedAttemptsMap.set(clientIp, { count: current.count + 1, lastAttempt: now });

      return new Response(
        JSON.stringify({ success: false, error: "Correo o contraseña de administrador incorrecta." }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        }
      );
    }

    // Login exitoso: limpiar contador de intentos de la IP
    failedAttemptsMap.delete(clientIp);

    const token = await signAdminToken(env?.ADMIN_SECRET);

    return new Response(
      JSON.stringify({
        success: true,
        token,
        message: "Sesión de administración autenticada exitosamente.",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Error interno al autenticar administrador.",
        details: err?.message || String(err),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      }
    );
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, x-admin-token",
    },
  });
}
