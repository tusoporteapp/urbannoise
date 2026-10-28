export async function onRequestPost({ request }) {
  try {
    const { name, email, phone, city, address, document, password } = await request.json();
    if (!name || !email) {
      return new Response(JSON.stringify({ error: "Nombre y correo son requeridos" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    const LOYVERSE_TOKEN = "eac78ade09eb4cf2b0700e291be2fe0d";
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = (phone || "").trim().replace(/\D/g, "");
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
      // 1. Buscar si ya existe en Loyverse POS por correo, teléfono o cédula
      const listRes = await fetch("https://api.loyverse.com/v1.0/customers?limit=250", {
        headers: { Authorization: `Bearer ${LOYVERSE_TOKEN}` },
      });

      let existing = null;
      if (listRes.ok) {
        const listData = await listRes.json();
        existing = (listData.customers || []).find(
          (c) =>
            (c.email && c.email.toLowerCase() === cleanEmail) ||
            (cleanPhone && c.phone_number && c.phone_number.replace(/\D/g, "") === cleanPhone) ||
            (cleanDocument && c.customer_code && c.customer_code === cleanDocument)
        );
      }

      const targetCity = (city && city.trim()) || existing?.city || "";
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
        loyverseCustomer = existing;
        const updateRes = await fetch(`https://api.loyverse.com/v1.0/customers/${existing.id}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOYVERSE_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...existing,
            note: buildNote(existing.note),
            customer_code: targetDoc || undefined,
            phone_number: cleanPhone || existing.phone_number,
            address: targetAddress || existing.address,
            city: targetCity || existing.city,
          }),
        });
        if (!updateRes.ok) {
          console.warn("[Loyverse Update Customer Warning]:", updateRes.status, await updateRes.text());
        }
      } else {
        // Crear cliente en Loyverse POS
        const customerPayload = {
          name: name.trim().toUpperCase(),
          email: cleanEmail,
          note: buildNote(),
          customer_code: targetDoc || `WEB-${Math.floor(100000 + Math.random() * 900000)}`,
        };
        if (cleanPhone) customerPayload.phone_number = cleanPhone;
        if (targetAddress) customerPayload.address = targetAddress;
        if (targetCity) customerPayload.city = targetCity;

        const createRes = await fetch("https://api.loyverse.com/v1.0/customers", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOYVERSE_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(customerPayload),
        });

        if (createRes.ok) {
          loyverseCustomer = await createRes.json();
        }
      }
    } catch (e) {
      console.warn("[Loyverse CRM Customer Registration Warning]:", e.message);
    }

    const customerId = loyverseCustomer?.id || `web-cust-${Date.now()}`;

    return new Response(
      JSON.stringify({
        success: true,
        customer: {
          id: customerId,
          name: name.trim().toUpperCase(),
          email: cleanEmail,
          phone: cleanPhone,
          document: cleanDocument,
          city: city?.trim() || "Bogotá, D.C.",
          address: address?.trim() || "",
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
