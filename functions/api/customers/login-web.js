export async function onRequestPost({ request, env }) {
  try {
    const { emailOrPhone, password } = await request.json();
    if (!emailOrPhone) {
      return new Response(JSON.stringify({ error: "Correo o celular requerido" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    const LOYVERSE_TOKEN = env?.LOYVERSE_API_TOKEN || "eac78ade09eb4cf2b0700e291be2fe0d";
    const cleanInput = emailOrPhone.trim().toLowerCase();
    const cleanPhone = emailOrPhone.trim().replace(/\D/g, "");

    // Buscar en Loyverse
    const listRes = await fetch("https://api.loyverse.com/v1.0/customers?limit=250", {
      headers: { Authorization: `Bearer ${LOYVERSE_TOKEN}` },
    });

    let foundCustomer = null;
    if (listRes.ok) {
      const data = await listRes.json();
      foundCustomer = (data.customers || []).find(
        (c) =>
          (c.email && c.email.toLowerCase() === cleanInput) ||
          (cleanPhone && c.phone_number && c.phone_number.replace(/\D/g, "") === cleanPhone) ||
          (c.customer_code && c.customer_code === cleanInput)
      );
    }

    if (!foundCustomer) {
      return new Response(JSON.stringify({ error: "Usuario no encontrado en la base de clientes" }), {
        status: 404,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    // Validar hash de la contraseña si el usuario registró una clave web
    const note = foundCustomer.note || "";
    const pwMatch = note.match(/\[PW_(?:WEB|HASH):([^\]]+)\]/i);
    if (pwMatch) {
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
    let cleanCustomerPhone = (foundCustomer.phone_number || "").replace(/\D/g, "");
    if (cleanCustomerPhone.startsWith("57") && cleanCustomerPhone.length === 12) {
      cleanCustomerPhone = cleanCustomerPhone.substring(2);
    }

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
