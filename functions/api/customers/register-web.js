import { findLoyverseCustomer, saveOrUpdateLoyverseCustomer, cleanColombianPhone, LOYVERSE_DEFAULT_TOKEN } from "../_loyverse.js";

export async function onRequestPost({ request, env }) {
  try {
    const { name, email, phone, city, address, document, password } = await request.json();
    if (!name || !email) {
      return new Response(JSON.stringify({ error: "Nombre y correo son requeridos" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    const LOYVERSE_TOKEN = env?.LOYVERSE_API_TOKEN || LOYVERSE_DEFAULT_TOKEN;
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = cleanColombianPhone(phone);
    const cleanDocument = (document || "").trim().replace(/\D/g, "");

    // Cifrar hash sha-256 de la contraseña para seguridad
    let passwordHash = "";
    if (password) {
      const encoder = new TextEncoder();
      const hashBuf = await crypto.subtle.digest("SHA-256", encoder.encode(password));
      passwordHash = Array.from(new Uint8Array(hashBuf))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    }

    let loyverseCustomer = null;

    try {
      // 1. Buscar si ya existe en Loyverse POS por correo, teléfono o cédula mediante búsqueda paginada
      const existing = await findLoyverseCustomer({
        email: cleanEmail,
        phone: cleanPhone,
        document: cleanDocument,
        token: LOYVERSE_TOKEN,
      });

      const targetCity = (city && city.trim()) || existing?.city || "Bogotá";
      const targetAddress = (address && address.trim()) || existing?.address || "";
      const targetDoc =
        cleanDocument ||
        (existing?.customer_code && !existing.customer_code.startsWith("WEB-")
          ? existing.customer_code
          : "");

      const buildNote = (baseNote = "") => {
        const pwTag = passwordHash ? `[PW_WEB:${passwordHash}]` : "";
        // Extraer tags de guía existentes para preservarlos
        const tagRegex = /\[(?:GUIA|G):\s*([^\|\]]+?)(?:\|\s*(?:EMPRESA|E):\s*([^\|\]]+?))?(?:\|\s*(?:ORDEN|O):\s*([^\|\]]+?))?\]/gi;
        const orderTags = [];
        let match;
        while ((match = tagRegex.exec(baseNote || "")) !== null) {
          const gNum = (match[1] || "").trim();
          const gEmp = (match[2] || "Servientrega").trim();
          const gOrd = match[3] ? match[3].replace(/^#/, "").trim().toUpperCase() : "";
          if (gOrd) {
            const empTag = gEmp && gEmp.toLowerCase() !== "servientrega" ? `|E:${gEmp}` : "";
            orderTags.push(`[G:${gNum}${empTag}|O:${gOrd}]`);
          }
        }

        const parts = [];
        if (pwTag) parts.push(pwTag);
        parts.push(...orderTags);

        let finalNote = parts.join(" | ");
        // Límite estricto de 250 caracteres de Loyverse POS
        if (finalNote.length > 250) {
          parts.length = 0;
          if (pwTag) parts.push(pwTag);
          for (let i = orderTags.length - 1; i >= 0; i--) {
            const candidate = (parts.length > 0 ? parts.join(" | ") + " | " : "") + orderTags[i];
            if (candidate.length <= 250) {
              parts.push(orderTags[i]);
            }
          }
          finalNote = parts.join(" | ");
        }
        return finalNote;
      };

      if (existing) {
        // Actualizar cliente existente preservando todos sus datos
        loyverseCustomer = await saveOrUpdateLoyverseCustomer(
          {
            id: existing.id,
            name: name.trim().toUpperCase(),
            email: cleanEmail || existing.email,
            phone_number: cleanPhone || existing.phone_number,
            customer_code: targetDoc || existing.customer_code,
            address: targetAddress || existing.address,
            city: targetCity || existing.city,
            note: buildNote(existing.note),
          },
          LOYVERSE_TOKEN
        );
      } else {
        // Crear nuevo cliente en Loyverse
        const generatedCode = targetDoc || `WEB-${Date.now().toString().slice(-6)}`;
        loyverseCustomer = await saveOrUpdateLoyverseCustomer(
          {
            name: name.trim().toUpperCase(),
            email: cleanEmail,
            phone_number: cleanPhone || undefined,
            customer_code: generatedCode,
            address: targetAddress || undefined,
            city: targetCity || undefined,
            note: buildNote(),
          },
          LOYVERSE_TOKEN
        );
      }
    } catch (loyverseErr) {
      console.warn("Aviso en Loyverse (continuando con registro):", loyverseErr.message);
    }

    const cleanFinalPhone = cleanColombianPhone(cleanPhone || loyverseCustomer?.phone_number);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Cuenta creada exitosamente en URBANNOISE",
        customer: {
          id: loyverseCustomer?.id || `LOCAL-${Date.now()}`,
          name: name.trim().toUpperCase(),
          email: cleanEmail,
          phone: cleanFinalPhone,
          document: cleanDocument || loyverseCustomer?.customer_code || "",
          city: city || "Bogotá",
          address: address || "",
          loyverseCustomerId: loyverseCustomer?.id,
          createdAt: new Date().toISOString(),
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
