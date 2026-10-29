// Endpoint de Autenticación de Administrador para Cloudflare Pages Functions
// Protegido bajo directivas OWASP / Security-Audit: cero credenciales en texto plano,
// validación criptográfica en servidor y emisión de JWT HMAC-SHA256.
import { signAdminToken } from "../_auth.js";

// Hash criptográfico SHA-256 precalculado de la contraseña maestra oficial
const MASTER_PASSWORD_SHA256 = "4ebf94d08145211fd39075834eb57cf392359e5ac39e576bd2f61e8250a95a4f";

async function computeSha256(str) {
  const enc = new TextEncoder();
  const hashBuf = await crypto.subtle.digest("SHA-256", enc.encode(str));
  return Array.from(new Uint8Array(hashBuf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function onRequestPost({ request, env }) {
  try {
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
      return new Response(
        JSON.stringify({ success: false, error: "Correo o contraseña de administrador incorrecta." }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        }
      );
    }

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
      JSON.stringify({ success: false, error: "Error interno al autenticar administrador." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      }
    );
  }
}
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
