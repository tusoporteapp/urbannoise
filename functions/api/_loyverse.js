// Helper module for Loyverse API operations in Cloudflare Pages Functions
export const LOYVERSE_DEFAULT_TOKEN = "eac78ade09eb4cf2b0700e291be2fe0d";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Normaliza un número de teléfono a los últimos 10 dígitos colombianos
 */
export function cleanColombianPhone(phone) {
  if (!phone) return "";
  let digits = String(phone).replace(/\D/g, "");
  if (digits.startsWith("57") && digits.length === 12) {
    digits = digits.substring(2);
  }
  return digits;
}

/**
 * Busca un cliente en Loyverse POS:
 * 1. Por ID directo (UUID) -> O(1) instantáneo
 * 2. Por email, teléfono o documento -> Búsqueda paginada con cursor
 */
export async function findLoyverseCustomer({ customerId, email, phone, document, token = LOYVERSE_DEFAULT_TOKEN }) {
  // 1. Búsqueda directa por UUID
  if (customerId && UUID_REGEX.test(customerId)) {
    try {
      const directRes = await fetch(`https://api.loyverse.com/v1.0/customers/${customerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (directRes.ok) {
        return await directRes.json();
      }
    } catch (err) {
      console.warn("[Loyverse direct lookup error]:", err);
    }
  }

  const cleanEmail = email ? String(email).trim().toLowerCase() : "";
  const cleanPhone = cleanColombianPhone(phone);
  const cleanDoc = document ? String(document).trim().replace(/\D/g, "") : "";

  if (!cleanEmail && !cleanPhone && !cleanDoc && !customerId) {
    return null;
  }

  // 2. Búsqueda paginada utilizando el cursor oficial de Loyverse
  let cursor = null;
  let page = 0;
  const maxPages = 8; // Hasta 2,000 clientes

  try {
    do {
      page++;
      const url = `https://api.loyverse.com/v1.0/customers?limit=250${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) break;

      const data = await res.json();
      const customers = data.customers || [];

      const found = customers.find((c) => {
        if (customerId && c.id === customerId) return true;
        if (cleanEmail && c.email && c.email.toLowerCase() === cleanEmail) return true;
        if (cleanPhone && c.phone_number) {
          const cPhone = cleanColombianPhone(c.phone_number);
          if (cPhone && cPhone.endsWith(cleanPhone.slice(-10))) return true;
        }
        if (cleanDoc && c.customer_code && c.customer_code === cleanDoc) return true;
        return false;
      });

      if (found) {
        return found;
      }

      cursor = data.cursor;
    } while (cursor && page < maxPages);
  } catch (err) {
    console.error("[Loyverse paginated search error]:", err);
  }

  return null;
}

/**
 * Guarda o actualiza un cliente en Loyverse POS.
 * Preserva estrictamente los datos existentes (email, teléfono, documento, dirección, ciudad)
 * para evitar que Loyverse los sobrescriba con null.
 */
export async function saveOrUpdateLoyverseCustomer(customerData, token = LOYVERSE_DEFAULT_TOKEN) {
  const isUpdate = Boolean(customerData.id && UUID_REGEX.test(customerData.id));

  let existing = null;
  if (isUpdate) {
    try {
      const getRes = await fetch(`https://api.loyverse.com/v1.0/customers/${customerData.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (getRes.ok) existing = await getRes.json();
    } catch {}
  }

  const payload = {
    name: (customerData.name || existing?.name || "Cliente Web").trim().toUpperCase(),
    email: customerData.email || existing?.email || undefined,
    phone_number: customerData.phone_number || existing?.phone_number || undefined,
    customer_code: customerData.customer_code || existing?.customer_code || undefined,
    address: customerData.address || existing?.address || undefined,
    city: customerData.city || existing?.city || undefined,
    note: customerData.note !== undefined ? customerData.note : existing?.note,
  };

  if (isUpdate) {
    payload.id = customerData.id;
  }

  const res = await fetch("https://api.loyverse.com/v1.0/customers", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Error en Loyverse (${res.status}): ${errText}`);
  }

  return await res.json();
}

/**
 * Obtiene todos los clientes de Loyverse paginando por completo (hasta 2,500 clientes)
 */
export async function getAllLoyverseCustomers(token = LOYVERSE_DEFAULT_TOKEN, maxPages = 10) {
  let all = [];
  let cursor = null;
  let page = 0;

  do {
    page++;
    const url = `https://api.loyverse.com/v1.0/customers?limit=250${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) break;

    const data = await res.json();
    all = all.concat(data.customers || []);
    cursor = data.cursor;
  } while (cursor && page < maxPages);

  return all;
}
