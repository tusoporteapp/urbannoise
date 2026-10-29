import { findLoyverseCustomer, cleanColombianPhone, LOYVERSE_DEFAULT_TOKEN } from "../_loyverse.js";

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const rawInput = body.email || body.emailOrPhone || "";
    if (!rawInput || !rawInput.trim()) {
      return new Response(JSON.stringify({ error: "Ingresa tu correo electrónico para acceder" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    const LOYVERSE_TOKEN = env?.LOYVERSE_API_TOKEN || LOYVERSE_DEFAULT_TOKEN;
    const cleanInput = rawInput.trim().toLowerCase();
    const cleanDigits = rawInput.trim().replace(/\D/g, "");

    // Buscar en Loyverse de forma estricta por correo para clientes comunes
    const foundCustomer = cleanInput.includes("@")
      ? await findLoyverseCustomer({ email: cleanInput, token: LOYVERSE_TOKEN })
      : await findLoyverseCustomer({ phone: cleanDigits, token: LOYVERSE_TOKEN });

    if (!foundCustomer) {
      return new Response(
        JSON.stringify({
          success: false,
          notFound: true,
          error: "No encontramos ninguna cuenta registrada con este correo electrónico. Por favor regístrate o realiza tu primera compra para activarla.",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        }
      );
    }

    const note = foundCustomer.note || "";

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
        message: "¡Bienvenido a tu cuenta URBANNOISE!",
        customer: {
          id: foundCustomer.id,
          loyverseCustomerId: foundCustomer.id,
          name: foundCustomer.name,
          email: foundCustomer.email || cleanInput,
          phone: cleanCustomerPhone,
          document: documentId,
          city: customerCity,
          address: customerAddress,
          createdAt: foundCustomer.created_at || new Date().toISOString(),
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || "Error al autenticar usuario" }), {
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
