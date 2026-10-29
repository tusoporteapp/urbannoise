import { findLoyverseCustomer, saveOrUpdateLoyverseCustomer, cleanColombianPhone, LOYVERSE_DEFAULT_TOKEN } from "../_loyverse.js";

export async function onRequestPost({ request, env }) {
  try {
    const { name, email, phone, city, address, document } = await request.json();
    if (!email) {
      return new Response(JSON.stringify({ error: "El correo electrónico es obligatorio" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    const LOYVERSE_TOKEN = env?.LOYVERSE_API_TOKEN || LOYVERSE_DEFAULT_TOKEN;
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = (name || "Cliente URBANNOISE").trim().toUpperCase();
    const cleanPhone = cleanColombianPhone(phone);
    const cleanDocument = (document || "").trim().replace(/\D/g, "");

    let loyverseCustomer = null;

    try {
      // 1. Buscar si ya existe en Loyverse POS estrictamente por correo para evitar colisiones
      const existing = await findLoyverseCustomer({
        email: cleanEmail,
        token: LOYVERSE_TOKEN,
      });

      const targetCity = (city && city.trim()) || existing?.city || "Bogotá";
      const targetAddress = (address && address.trim()) || existing?.address || "";
      const targetDoc =
        cleanDocument ||
        (existing?.customer_code && !existing.customer_code.startsWith("WEB-")
          ? existing.customer_code
          : "");

      // Nota limpia con marca inequívoca de registro web y tags logísticos de órdenes [G:..|O:..]
      const buildNote = (baseNote = "") => {
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

        const webTag = "Cliente Web URBANNOISE";
        let finalNote = orderTags.length > 0 ? `${webTag} • ${orderTags.join(" | ")}` : webTag;
        if (finalNote.length > 250) {
          finalNote = finalNote.slice(0, 250);
        }
        return finalNote;
      };

      if (existing) {
        // Actualizar cliente existente preservando todos sus datos y tags
        loyverseCustomer = await saveOrUpdateLoyverseCustomer(
          {
            id: existing.id,
            name: cleanName || existing.name,
            email: cleanEmail,
            phone_number: cleanPhone || existing.phone_number,
            customer_code: targetDoc || existing.customer_code,
            address: targetAddress || existing.address,
            city: targetCity || existing.city,
            note: buildNote(existing.note),
          },
          LOYVERSE_TOKEN
        );
      } else {
        // Crear nuevo cliente con correo como referencia primaria
        const generatedCode = targetDoc || `WEB-${Date.now().toString().slice(-6)}`;
        loyverseCustomer = await saveOrUpdateLoyverseCustomer(
          {
            name: cleanName,
            email: cleanEmail,
            phone_number: cleanPhone || undefined,
            customer_code: generatedCode,
            address: targetAddress || undefined,
            city: targetCity || "Bogotá",
            note: buildNote(),
          },
          LOYVERSE_TOKEN
        );
      }
    } catch (loyverseErr) {
      console.warn("Aviso en Loyverse (continuando con registro local):", loyverseErr.message);
    }

    const finalCustomer = {
      id: loyverseCustomer?.id || `web-cust-${Date.now()}`,
      loyverseCustomerId: loyverseCustomer?.id || undefined,
      name: loyverseCustomer?.name || cleanName,
      email: cleanEmail,
      phone: cleanPhone || loyverseCustomer?.phone_number || "",
      document: cleanDocument || loyverseCustomer?.customer_code || "",
      city: targetCity || loyverseCustomer?.city || "Bogotá",
      address: targetAddress || loyverseCustomer?.address || "",
      createdAt: loyverseCustomer?.created_at || new Date().toISOString(),
    };

    return new Response(
      JSON.stringify({
        success: true,
        message: "Cuenta registrada y sincronizada con éxito en Loyverse POS",
        customer: finalCustomer,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || "Error interno del servidor" }), {
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
