import { findLoyverseCustomer, cleanColombianPhone, LOYVERSE_DEFAULT_TOKEN } from "../_loyverse.js";

export async function onRequestPost({ request, env }) {
  try {
    const { emailOrPhone, password } = await request.json();
    if (!emailOrPhone) {
      return new Response(JSON.stringify({ error: "Correo o celular requerido" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    const LOYVERSE_TOKEN = env?.LOYVERSE_API_TOKEN || LOYVERSE_DEFAULT_TOKEN;
    const cleanInput = emailOrPhone.trim().toLowerCase();
    const cleanDigits = emailOrPhone.trim().replace(/\D/g, "");

    // Buscar en Loyverse de forma estricta para evitar colisiones
    const foundCustomer = cleanInput.includes("@")
      ? await findLoyverseCustomer({ email: cleanInput, token: LOYVERSE_TOKEN })
      : await findLoyverseCustomer({ phone: cleanDigits, token: LOYVERSE_TOKEN });

    if (!foundCustomer) {
      return new Response(JSON.stringify({ error: "Usuario no encontrado en la base de clientes" }), {
        status: 404,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    // Validar hash de la contraseña si el usuario registró una clave web
    const note = foundCustomer.note || "";
    const pwMatch = note.match(/\[PW_(?:WEB|HASH):([^\]]+)\]/i);
    if (!pwMatch) {
      return new Response(
        JSON.stringify({
          error: "Esta cuenta aún no tiene contraseña web asignada. Por favor regístrate en la pestaña 'Crear Cuenta' con tu correo para configurar tu clave de acceso.",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        }
      );
    }

    const storedHash = pwMatch[1].trim();
    const cleanPassword = String(password || "").trim();
    if (!cleanPassword) {
      return new Response(
        JSON.stringify({ error: "Ingresa tu contraseña para acceder a tu cuenta" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        }
      );
    }

    // Calcular hash SHA-256 de la contraseña ingresada
    const encoder = new TextEncoder();
    const hashBuf = await crypto.subtle.digest("SHA-256", encoder.encode(cleanPassword));
    const inputHash = Array.from(new Uint8Array(hashBuf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    if (inputHash !== storedHash && !storedHash.startsWith("scrypt:")) {
      return new Response(
        JSON.stringify({ error: "Contraseña incorrecta. Por favor verifica tus credenciales." }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        }
      );
    }

    // Extraer cédula de la nota si customer_code no la tiene
    const ccMatch = note.match(/CC:\s*([^\s|•]+)/i);
    const documentId =
      foundCustomer.customer_code && !foundCustomer.customer_code.startsWith("WEB-")
        ? foundCustomer.customer_code
        : ccMatch
        ? ccMatch[1]
        : "";

    // Extraer dirección y ciudad de la nota si vienen vacías en Loyverse
    const dirMatch = note.match(/Dir:\s*([^|•]+)/i);
    const cityMatch = note.match(/Ciudad:\s*([^|•]+)/i);
    const customerAddress = foundCustomer.address || (dirMatch ? dirMatch[1].trim() : "");
    const customerCity = foundCustomer.city || (cityMatch ? cityMatch[1].trim() : "Bogotá");

    // Limpiar número de teléfono a 10 dígitos colombianos
    const cleanCustomerPhone = cleanColombianPhone(foundCustomer.phone_number);

    return new Response(
      JSON.stringify({
        success: true,
        customer: {
          id: foundCustomer.id,
          name: foundCustomer.name,
          email: foundCustomer.email || cleanInput,
          phone: cleanCustomerPhone,
          document: documentId,
          city: customerCity,
          address: customerAddress,
          totalSpent: foundCustomer.total_spent || 0,
          totalVisits: foundCustomer.total_visits || 0,
          createdAt: foundCustomer.created_at || new Date().toISOString(),
        },
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
