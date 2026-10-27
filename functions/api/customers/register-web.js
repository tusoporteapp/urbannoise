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
        let cleanBase = (baseNote || "")
          .replace(/\[PW_(?:WEB|HASH):[^\]]+\]/gi, "")
          .replace(/CC:\s*[^|•]+/gi, "")
          .replace(/Ciudad:\s*[^|•]+/gi, "")
          .replace(/Dir:\s*[^|•]+/gi, "")
          .replace(/Cliente Web URBANNOISE[^|•]*/gi, "")
          .replace(/•|\|/g, " ")
          .trim();
        const parts = [];
        if (targetDoc) parts.push(`CC: ${targetDoc}`);
        if (targetCity) parts.push(`Ciudad: ${targetCity}`);
        if (targetAddress) parts.push(`Dir: ${targetAddress}`);
        parts.push("Cliente Web URBANNOISE");
        if (passwordHash) parts.push(`[PW_WEB:${passwordHash}]`);
        if (cleanBase) parts.push(cleanBase);
        return parts.join(" | ");
      };

      if (existing) {
        loyverseCustomer = existing;
        await fetch(`https://api.loyverse.com/v1.0/customers/${existing.id}`, {
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
        }).catch(() => {});
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
