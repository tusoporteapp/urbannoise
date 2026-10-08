var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_crypto = __toESM(require("crypto"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_vite = require("vite");
var import_dotenv = __toESM(require("dotenv"), 1);
import_dotenv.default.config();
var app = (0, import_express.default)();
var PORT = 3e3;
app.use(import_express.default.json({ limit: "25mb" }));
app.use(import_express.default.urlencoded({ extended: true, limit: "25mb" }));
app.use((req, res, next) => {
  const proto = req.headers["x-forwarded-proto"];
  const host = req.headers.host;
  if (process.env.NODE_ENV === "production" && proto && proto !== "https" && host && !host.includes("localhost") && !host.includes("127.0.0.1")) {
    return res.redirect(301, `https://${host}${req.url}`);
  }
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  if (req.url.match(/\.(svg|png|jpg|jpeg|webp|woff2|woff|ttf|ico)$/)) {
    res.setHeader("Cache-Control", "public, max-age=604800, stale-while-revalidate=86400");
  }
  next();
});
app.get("/robots.txt", (req, res) => {
  res.type("text/plain");
  res.sendFile(import_path.default.join(process.cwd(), "public", "robots.txt"));
});
app.get("/sitemap.xml", (req, res) => {
  res.type("application/xml");
  res.sendFile(import_path.default.join(process.cwd(), "public", "sitemap.xml"));
});
var activeLoyverseToken = process.env.LOYVERSE_API_TOKEN || "";
var activeBoldIdentityKey = process.env.BOLD_IDENTITY_KEY || process.env.VITE_BOLD_IDENTITY_KEY || "";
var activeBoldSecretKey = process.env.BOLD_SECRET_KEY || process.env.VITE_BOLD_SECRET_KEY || "";
var recentWebhookEvents = [];
var recentBoldWebhooks = [];
var recentOrders = [];
var USERS_FILE_PATH = import_path.default.join(process.cwd(), "web_users.json");
function hashPassword(password) {
  if (!password) return "";
  return import_crypto.default.createHash("sha256").update(password.trim()).digest("hex");
}
function loadWebUsersStore() {
  try {
    if (import_fs.default.existsSync(USERS_FILE_PATH)) {
      const raw = import_fs.default.readFileSync(USERS_FILE_PATH, "utf8");
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn("[Users Store] Error cargando usuarios:", e);
  }
  return {};
}
function saveWebUsersStore() {
  try {
    import_fs.default.writeFileSync(USERS_FILE_PATH, JSON.stringify(webUsersStore, null, 2), "utf8");
  } catch (e) {
    console.warn("[Users Store] Error guardando usuarios:", e);
  }
}
function matchPhone(phoneA, phoneB) {
  if (!phoneA || !phoneB) return false;
  const a = String(phoneA).replace(/\D/g, "");
  const b = String(phoneB).replace(/\D/g, "");
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.startsWith("57") && a.slice(2) === b) return true;
  if (b.startsWith("57") && b.slice(2) === a) return true;
  if (a.length >= 7 && b.length >= 7 && (a.endsWith(b.slice(-7)) || b.endsWith(a.slice(-7)))) return true;
  return false;
}
var webUsersStore = loadWebUsersStore();
var DEMO_EMAIL = "cliente.prueba@urbannoise.co";
if (!webUsersStore[DEMO_EMAIL]) {
  webUsersStore[DEMO_EMAIL] = {
    id: "demo-cust-mateo",
    name: "MATEO G\xD3MEZ RODR\xCDGUEZ",
    email: DEMO_EMAIL,
    phone: "3124589210",
    city: "Bogot\xE1, D.C.",
    address: "Calle 85 # 14-26, Apt 402, Chapinero",
    passwordHash: hashPassword("prueba123"),
    loyverseCustomerId: "demo-cust-mateo",
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  saveWebUsersStore();
}
var recentAnalyticsEvents = [];
var inventoryOverrides = {};
var cachedDefaultStoreId = "";
app.post("/api/analytics/event", (req, res) => {
  try {
    const { event, properties, timestamp = (/* @__PURE__ */ new Date()).toISOString() } = req.body;
    if (!event) return res.status(400).json({ error: "Nombre de evento requerido" });
    const eventRecord = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      event,
      properties: properties || {},
      timestamp,
      ipAnonymized: true
    };
    recentAnalyticsEvents.unshift(eventRecord);
    if (recentAnalyticsEvents.length > 200) recentAnalyticsEvents.pop();
    res.json({ success: true, received: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get("/api/analytics/events", (req, res) => {
  res.json({ count: recentAnalyticsEvents.length, events: recentAnalyticsEvents });
});
async function callLoyverseApi(endpoint, options = {}) {
  const token = options.token || activeLoyverseToken;
  if (!token) {
    throw new Error("LOYVERSE_TOKEN_NOT_CONFIGURED");
  }
  const url = `https://api.loyverse.com/v1.0${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json"
  };
  const fetchOptions = {
    method: options.method || "GET",
    headers
  };
  if (options.body && options.method !== "GET" && options.method !== "HEAD") {
    fetchOptions.body = typeof options.body === "string" ? options.body : JSON.stringify(options.body);
  }
  const response = await fetch(url, fetchOptions);
  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }
  if (!response.ok) {
    const error = new Error(data?.message || `Loyverse API error ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}
async function fetchLoyverseAllItems(token) {
  let cursor = null;
  const allItems = [];
  do {
    const endpoint = `/items?limit=250${cursor ? `&cursor=${cursor}` : ""}`;
    const data = await callLoyverseApi(endpoint, { token });
    if (data.items && Array.isArray(data.items)) {
      allItems.push(...data.items);
    }
    cursor = data.cursor || null;
  } while (cursor);
  return allItems;
}
async function fetchLoyverseAllInventory(token) {
  let cursor = null;
  const allInventory = [];
  do {
    const endpoint = `/inventory?limit=250${cursor ? `&cursor=${cursor}` : ""}`;
    const data = await callLoyverseApi(endpoint, { token });
    if (data.inventory_levels && Array.isArray(data.inventory_levels)) {
      allInventory.push(...data.inventory_levels);
    }
    cursor = data.cursor || null;
  } while (cursor);
  return allInventory;
}
app.get("/api/loyverse/status", (req, res) => {
  res.json({
    configured: Boolean(activeLoyverseToken),
    hasEnvToken: Boolean(process.env.LOYVERSE_API_TOKEN),
    tokenMasked: activeLoyverseToken ? `${activeLoyverseToken.substring(0, 4)}...${activeLoyverseToken.slice(-4)}` : null,
    recentEventsCount: recentWebhookEvents.length,
    overridesCount: Object.keys(inventoryOverrides).length
  });
});
app.post("/api/loyverse/configure", async (req, res) => {
  try {
    const { token } = req.body;
    if (!token || typeof token !== "string" || token.trim().length === 0) {
      return res.status(400).json({ error: "El token de acceso de Loyverse es requerido" });
    }
    const cleanToken = token.trim();
    const storesData = await callLoyverseApi("/stores", { token: cleanToken });
    activeLoyverseToken = cleanToken;
    res.json({
      success: true,
      message: "Conexi\xF3n exitosa con Loyverse POS",
      stores: storesData?.stores || []
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message || "No se pudo conectar a Loyverse con el token proporcionado",
      details: error.data || null
    });
  }
});
app.get("/api/loyverse/items", async (req, res) => {
  try {
    if (!activeLoyverseToken) {
      return res.json({
        configured: false,
        items: [],
        message: "Configura tu LOYVERSE_API_TOKEN en el panel de administraci\xF3n para sincronizar productos reales."
      });
    }
    const allItems = await fetchLoyverseAllItems();
    res.json({
      configured: true,
      count: allItems.length,
      items: allItems
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      configured: Boolean(activeLoyverseToken)
    });
  }
});
app.get("/api/loyverse/inventory", async (req, res) => {
  try {
    if (!activeLoyverseToken) {
      return res.json({
        configured: false,
        inventory_levels: [],
        overrides: inventoryOverrides
      });
    }
    const targetStoreId = await getDefaultStoreId();
    const allInventory = await fetchLoyverseAllInventory();
    const storeInventory = targetStoreId ? allInventory.filter((i) => i.store_id === targetStoreId) : allInventory;
    res.json({
      configured: true,
      storeId: targetStoreId,
      totalCount: allInventory.length,
      storeCount: storeInventory.length,
      inventory_levels: storeInventory,
      overrides: inventoryOverrides
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.get("/api/loyverse/categories", async (req, res) => {
  try {
    if (!activeLoyverseToken) return res.json({ categories: [] });
    const data = await callLoyverseApi("/categories");
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.get("/api/loyverse/stores", async (req, res) => {
  try {
    if (!activeLoyverseToken) return res.json({ stores: [] });
    const data = await callLoyverseApi("/stores");
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.get("/api/loyverse/sync", async (req, res) => {
  try {
    if (!activeLoyverseToken) {
      return res.json({
        configured: false,
        products: [],
        message: "Ingresa tu Token de Loyverse en el Panel de Administraci\xF3n"
      });
    }
    const targetStoreId = await getDefaultStoreId();
    const [items, invLevels, categoriesData] = await Promise.all([
      fetchLoyverseAllItems(),
      fetchLoyverseAllInventory(),
      callLoyverseApi("/categories").catch(() => ({ categories: [] }))
    ]);
    const categories = categoriesData.categories || [];
    const inventoryMap = /* @__PURE__ */ new Map();
    for (const lvl of invLevels) {
      if (lvl.variant_id && (!targetStoreId || lvl.store_id === targetStoreId)) {
        const current = inventoryMap.get(lvl.variant_id) || 0;
        inventoryMap.set(lvl.variant_id, current + (lvl.in_stock || 0));
      }
    }
    const syncedItems = items.map((item) => {
      const colorsSet = /* @__PURE__ */ new Set();
      const sizesSet = /* @__PURE__ */ new Set();
      const variants = (item.variants || []).map((v) => {
        const stockInPos = inventoryMap.get(v.variant_id) ?? 0;
        const override = inventoryOverrides[v.sku] ?? inventoryOverrides[v.variant_id];
        const finalStock = override !== void 0 ? override : stockInPos;
        const size = (v.option1_value || "").trim();
        const color = (v.option2_value || "").trim();
        if (size) sizesSet.add(size);
        if (color) colorsSet.add(color);
        const storePrice = v.stores?.find((s) => s.store_id === targetStoreId)?.price;
        const variantPrice = storePrice !== void 0 && storePrice !== null ? storePrice : v.default_price ?? v.price ?? 0;
        return {
          variant_id: v.variant_id,
          sku: v.sku || `SKU-${v.variant_id.substring(0, 6)}`,
          barcode: v.barcode,
          price: variantPrice,
          default_price: v.default_price,
          stores: v.stores,
          cost: v.cost || 0,
          option1_value: v.option1_value,
          option2_value: v.option2_value,
          option3_value: v.option3_value,
          size,
          color,
          in_stock: finalStock
        };
      });
      const totalStock = variants.reduce((sum, v) => sum + (v.in_stock || 0), 0);
      return {
        id: item.id,
        name: item.item_name,
        category_id: item.category_id,
        category_name: categories.find((c) => c.id === item.category_id)?.name || "General",
        description: item.description,
        image_url: item.image_url,
        variants,
        availableColors: Array.from(colorsSet),
        availableSizes: Array.from(sizesSet),
        totalStock,
        storeId: targetStoreId
      };
    });
    res.json({
      configured: true,
      storeId: targetStoreId,
      count: syncedItems.length,
      items: syncedItems,
      categories,
      syncedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.post("/api/loyverse/receipts", async (req, res) => {
  try {
    if (!activeLoyverseToken) {
      return res.json({
        simulated: true,
        message: "Venta registrada localmente (Configura Token para enviar a Loyverse POS)",
        orderId: `SIM-${Date.now()}`
      });
    }
    const receiptPayload = req.body;
    const result = await callLoyverseApi("/receipts", {
      method: "POST",
      body: receiptPayload
    });
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ error: error.message, details: error.data });
  }
});
app.get("/api/loyverse/receipts", async (req, res) => {
  try {
    if (!activeLoyverseToken) {
      return res.json({ receipts: [], simulated: true });
    }
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const data = await callLoyverseApi(`/receipts?limit=${limit}`);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message, details: error.data });
  }
});
app.get("/api/loyverse/customers", async (req, res) => {
  try {
    const webOnly = req.query.webOnly === "true";
    if (!activeLoyverseToken) {
      const localCustomers = Object.values(webUsersStore);
      return res.json({ customers: localCustomers, simulated: true });
    }
    const limit = req.query.limit ? Number(req.query.limit) : 250;
    const data = await callLoyverseApi(`/customers?limit=${limit}`);
    let customers = data.customers || [];
    if (webOnly) {
      customers = customers.filter((c) => {
        const note = (c.note || "").toLowerCase();
        const code = (c.customer_code || "").toUpperCase();
        const email = (c.email || "").toLowerCase();
        return note.includes("web") || code.startsWith("WEB") || Boolean(webUsersStore[email]);
      });
    }
    res.json({ customers });
  } catch (error) {
    res.status(500).json({ error: error.message, details: error.data });
  }
});
app.post("/api/loyverse/customers", async (req, res) => {
  try {
    if (!activeLoyverseToken) {
      return res.json({ success: true, customer: { id: `sim-${Date.now()}`, ...req.body }, simulated: true });
    }
    const data = await callLoyverseApi("/customers", {
      method: "POST",
      body: req.body
    });
    res.json({ success: true, customer: data });
  } catch (error) {
    res.status(500).json({ error: error.message, details: error.data });
  }
});
app.delete("/api/loyverse/customers/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const email = req.query.email ? String(req.query.email).trim().toLowerCase() : "";
    if (!id) {
      return res.status(400).json({ error: "ID de cliente es requerido" });
    }
    let loyverseDeleted = false;
    if (activeLoyverseToken && !id.startsWith("sim-") && !id.startsWith("web-")) {
      try {
        await callLoyverseApi(`/customers/${id}`, {
          method: "DELETE"
        });
        loyverseDeleted = true;
        console.log(`[Loyverse] Cliente ${id} eliminado de Loyverse POS.`);
      } catch (loyErr) {
        console.warn(`[Loyverse] Advertencia eliminando cliente ${id} en Loyverse POS:`, loyErr.message);
      }
    }
    let removedFromLocal = false;
    for (const [userEmail, userData] of Object.entries(webUsersStore)) {
      const u = userData;
      if (u.id === id || u.loyverseCustomerId === id || email && userEmail.toLowerCase() === email) {
        delete webUsersStore[userEmail];
        removedFromLocal = true;
      }
    }
    if (removedFromLocal) {
      saveWebUsersStore();
      console.log(`[Loyverse] Cliente ${id} eliminado del almacenamiento web local.`);
    }
    res.json({
      success: true,
      id,
      loyverseDeleted,
      removedFromLocal,
      message: "Cliente eliminado correctamente de Loyverse POS y de la tienda web."
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.post("/api/customers/register-web", async (req, res) => {
  try {
    const { name, email, phone, city, address, document, password } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: "Nombre y correo son requeridos" });
    }
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = (phone || "").trim().replace(/\D/g, "");
    const cleanDocument = (document || "").trim().replace(/\D/g, "");
    const passwordHash = password ? hashPassword(password) : "";
    let loyverseCustomer = null;
    if (activeLoyverseToken) {
      try {
        const listData = await callLoyverseApi("/customers?limit=250");
        const existing = (listData.customers || []).find(
          (c) => c.email && c.email.toLowerCase() === cleanEmail || cleanPhone && c.phone_number && c.phone_number.replace(/\D/g, "") === cleanPhone || cleanDocument && c.customer_code && c.customer_code === cleanDocument
        );
        const buildNote = (baseNote) => {
          let cleanBase = (baseNote || "").replace(/\[PW_HASH:[a-f0-9]+\]/gi, "").replace(/CC:\s*\d+/gi, "").replace(/Cliente Web URBANNOISE/gi, "").replace(/•|\|/g, " ").trim();
          const parts = [];
          if (cleanDocument) parts.push(`CC: ${cleanDocument}`);
          if (passwordHash) parts.push(`[PW_HASH:${passwordHash}]`);
          parts.push("Cliente Web URBANNOISE");
          if (cleanBase) parts.push(cleanBase);
          return parts.join(" | ");
        };
        if (existing) {
          loyverseCustomer = existing;
          await callLoyverseApi(`/customers/${existing.id}`, {
            method: "POST",
            body: {
              ...existing,
              note: buildNote(existing.note),
              customer_code: existing.customer_code || cleanDocument || void 0,
              phone_number: cleanPhone || existing.phone_number,
              address: address ? address.trim() : existing.address,
              city: city ? city.trim() : existing.city
            }
          }).catch(() => {
          });
        } else {
          const customerPayload = {
            name: name.trim().toUpperCase(),
            email: cleanEmail,
            note: buildNote(),
            customer_code: cleanDocument || `WEB-${Math.floor(1e5 + Math.random() * 9e5)}`
          };
          if (cleanPhone) customerPayload.phone_number = cleanPhone;
          if (address) customerPayload.address = address.trim();
          if (city) customerPayload.city = city.trim();
          loyverseCustomer = await callLoyverseApi("/customers", {
            method: "POST",
            body: customerPayload
          });
        }
      } catch (apiErr) {
        console.warn("[Loyverse] Error al sincronizar cliente en Loyverse:", apiErr.message);
      }
    }
    const customerId = loyverseCustomer?.id || `web-cust-${Date.now()}`;
    webUsersStore[cleanEmail] = {
      id: customerId,
      name: name.trim().toUpperCase(),
      email: cleanEmail,
      phone: cleanPhone,
      document: cleanDocument,
      city: city || "Bogot\xE1, D.C.",
      address: address || "",
      passwordHash,
      loyverseCustomerId: customerId,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    saveWebUsersStore();
    res.json({
      success: true,
      customer: {
        id: customerId,
        name: name.trim().toUpperCase(),
        email: cleanEmail,
        phone: cleanPhone,
        document: cleanDocument,
        city: city || "Bogot\xE1, D.C.",
        address: address || "",
        loyverseCustomerId: customerId,
        totalSpent: loyverseCustomer?.total_spent || 0,
        totalVisits: loyverseCustomer?.total_visits || 0,
        syncedToLoyverse: Boolean(loyverseCustomer?.id),
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.post("/api/customers/login-web", async (req, res) => {
  try {
    const { emailOrPhone, password } = req.body;
    if (!emailOrPhone) {
      return res.status(400).json({ error: "Ingresa tu correo o tel\xE9fono" });
    }
    const query = emailOrPhone.trim().toLowerCase();
    const queryDigits = query.replace(/\D/g, "");
    let localUser = Object.values(webUsersStore).find(
      (u) => u.email.toLowerCase() === query || matchPhone(u.phone, query)
    );
    let loyverseCustomer = null;
    if (activeLoyverseToken) {
      try {
        const listData = await callLoyverseApi("/customers?limit=250");
        loyverseCustomer = (listData.customers || []).find(
          (c) => c.email && c.email.toLowerCase() === query || matchPhone(c.phone_number, query)
        );
      } catch {
      }
    }
    if (!localUser && !loyverseCustomer) {
      return res.status(404).json({
        error: "No encontramos ninguna cuenta asociada a este correo o tel\xE9fono. Por favor reg\xEDstrate para continuar."
      });
    }
    const noteHashMatch = loyverseCustomer?.note?.match(/\[PW_HASH:([a-f0-9]+)\]/i);
    const loyverseSavedHash = noteHashMatch ? noteHashMatch[1] : null;
    if (localUser && (localUser.passwordHash || localUser.password)) {
      if (!password) {
        return res.status(400).json({ error: "Ingresa tu contrase\xF1a para acceder a tu cuenta." });
      }
      const isMatch = localUser.passwordHash ? localUser.passwordHash === hashPassword(password) : localUser.password === password;
      if (!isMatch) {
        return res.status(401).json({ error: "Contrase\xF1a incorrecta. Por favor verifica tus credenciales." });
      }
    } else if (loyverseSavedHash) {
      if (!password) {
        return res.status(400).json({ error: "Ingresa tu contrase\xF1a para acceder a tu cuenta." });
      }
      if (loyverseSavedHash !== hashPassword(password)) {
        return res.status(401).json({ error: "Contrase\xF1a incorrecta. Por favor verifica tus credenciales." });
      }
    } else if (!localUser && loyverseCustomer && password) {
      const newHash = hashPassword(password);
      webUsersStore[query] = {
        id: loyverseCustomer.id,
        name: (loyverseCustomer.name || "").toUpperCase(),
        email: loyverseCustomer.email || query,
        phone: loyverseCustomer.phone_number || "",
        city: loyverseCustomer.city || "Bogot\xE1, D.C.",
        address: loyverseCustomer.address || "",
        passwordHash: newHash,
        loyverseCustomerId: loyverseCustomer.id,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      saveWebUsersStore();
      const updatedNote = `${loyverseCustomer.note ? loyverseCustomer.note + " | " : ""}[PW_HASH:${newHash}]`;
      callLoyverseApi(`/customers/${loyverseCustomer.id}`, {
        method: "POST",
        body: { ...loyverseCustomer, note: updatedNote }
      }).catch(() => {
      });
    }
    const docMatch = loyverseCustomer?.note?.match(/CC:\s*([0-9]+)/i);
    const finalName = localUser?.name || loyverseCustomer?.name || query.split("@")[0].toUpperCase();
    const finalEmail = localUser?.email || loyverseCustomer?.email || query;
    const finalPhone = localUser?.phone || loyverseCustomer?.phone_number || "";
    const finalCity = localUser?.city || loyverseCustomer?.city || "Bogot\xE1, D.C.";
    const finalAddress = localUser?.address || loyverseCustomer?.address || "";
    const finalDocument = localUser?.document || (loyverseCustomer?.customer_code && !loyverseCustomer.customer_code.startsWith("WEB-") ? loyverseCustomer.customer_code : "") || (docMatch ? docMatch[1] : "");
    const finalId = loyverseCustomer?.id || localUser?.id || `web-${Date.now()}`;
    res.json({
      success: true,
      customer: {
        id: finalId,
        name: finalName,
        email: finalEmail,
        phone: finalPhone,
        document: finalDocument,
        city: finalCity,
        address: finalAddress,
        totalSpent: loyverseCustomer?.total_spent || 0,
        totalVisits: loyverseCustomer?.total_visits || 0,
        loyverseCustomerId: loyverseCustomer?.id,
        createdAt: loyverseCustomer?.created_at || localUser?.createdAt || (/* @__PURE__ */ new Date()).toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.get("/api/loyverse/discounts", async (req, res) => {
  try {
    if (!activeLoyverseToken) return res.json({ discounts: [] });
    const data = await callLoyverseApi("/discounts");
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.post("/api/loyverse/discounts", async (req, res) => {
  try {
    if (!activeLoyverseToken) {
      return res.status(400).json({ error: "Token de Loyverse POS no configurado" });
    }
    const { name, type, discount_percent, discount_amount, stores } = req.body;
    if (!name || !type) {
      return res.status(400).json({ error: "El nombre y el tipo de descuento son requeridos" });
    }
    let storeIds = stores;
    if (!storeIds || !Array.isArray(storeIds) || storeIds.length === 0) {
      try {
        const storesData = await callLoyverseApi("/stores");
        storeIds = (storesData.stores || []).map((s) => s.id);
      } catch (e) {
        console.warn("[Loyverse Discounts] No se pudieron obtener tiendas, usando array vac\xEDo:", e);
      }
    }
    const payload = {
      name: String(name).trim(),
      type: type === "FIXED_AMOUNT" ? "FIXED_AMOUNT" : "FIXED_PERCENT",
      stores: storeIds || []
    };
    if (payload.type === "FIXED_PERCENT") {
      payload.discount_percent = Number(discount_percent) || 0;
    } else {
      payload.discount_amount = Number(discount_amount) || 0;
    }
    const createdDiscount = await callLoyverseApi("/discounts", {
      method: "POST",
      body: payload
    });
    console.log(`[Loyverse Discounts] Descuento creado en Loyverse POS: ${createdDiscount.id} - ${createdDiscount.name}`);
    res.json({ success: true, discount: createdDiscount });
  } catch (error) {
    console.error("[Loyverse Discounts] Error creando descuento:", error);
    res.status(500).json({ error: error.message || "Error al crear descuento en Loyverse POS" });
  }
});
app.delete("/api/loyverse/discounts/:id", async (req, res) => {
  try {
    if (!activeLoyverseToken) {
      return res.status(400).json({ error: "Token de Loyverse POS no configurado" });
    }
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "ID del descuento es requerido" });
    }
    await callLoyverseApi(`/discounts/${id}`, {
      method: "DELETE"
    });
    console.log(`[Loyverse Discounts] Descuento eliminado con \xE9xito de Loyverse POS: ${id}`);
    res.json({ success: true, message: `Descuento ${id} eliminado de Loyverse POS` });
  } catch (error) {
    console.error(`[Loyverse Discounts] Error eliminando descuento ${req.params.id}:`, error);
    res.status(500).json({ error: error.message || "Error al eliminar descuento en Loyverse POS" });
  }
});
app.get("/api/loyverse/employees", async (req, res) => {
  try {
    if (!activeLoyverseToken) return res.json({ employees: [] });
    const data = await callLoyverseApi("/employees");
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.get("/api/loyverse/payment_types", async (req, res) => {
  try {
    if (!activeLoyverseToken) return res.json({ payment_types: [] });
    const data = await callLoyverseApi("/payment_types");
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.post("/api/loyverse/inventory/adjust", async (req, res) => {
  try {
    const { variantId, sku, newStock, storeId, reason } = req.body;
    if (newStock === void 0) {
      return res.status(400).json({ error: "newStock es requerido" });
    }
    const stockNumber = Math.max(0, Number(newStock));
    if (sku) inventoryOverrides[sku] = stockNumber;
    if (variantId) inventoryOverrides[variantId] = stockNumber;
    let loyverseUpdated = false;
    let loyverseResponse = null;
    if (activeLoyverseToken && variantId) {
      try {
        const storeToUse = storeId || await getDefaultStoreId();
        if (storeToUse) {
          loyverseResponse = await callLoyverseApi("/inventory", {
            method: "POST",
            body: {
              inventory_levels: [
                {
                  variant_id: variantId,
                  store_id: storeToUse,
                  in_stock: stockNumber
                }
              ]
            }
          });
          loyverseUpdated = true;
        }
      } catch (loyErr) {
        console.warn("[Loyverse Inventory Adjust warning]:", loyErr.message);
      }
    }
    res.json({
      success: true,
      sku,
      variantId,
      newStock: stockNumber,
      loyverseUpdated,
      loyverseResponse,
      reason: reason || "Ajuste manual desde URBANNOISE Studio"
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.post("/api/loyverse/items/create", async (req, res) => {
  try {
    const itemPayload = req.body;
    if (!activeLoyverseToken) {
      return res.json({
        simulated: true,
        message: "Art\xEDculo creado en simulaci\xF3n (conecta tu Token de Loyverse)",
        item: { id: `sim-${Date.now()}`, ...itemPayload }
      });
    }
    const data = await callLoyverseApi("/items", {
      method: "POST",
      body: itemPayload
    });
    res.json({ success: true, item: data });
  } catch (error) {
    res.status(500).json({ error: error.message, details: error.data });
  }
});
app.post("/api/loyverse/proxy", async (req, res) => {
  try {
    const { endpoint, method = "GET", body } = req.body;
    if (!endpoint) {
      return res.status(400).json({ error: "Par\xE1metro 'endpoint' es requerido (ej: /v1.0/customers)" });
    }
    const cleanEndpoint = endpoint.replace(/^\/v1\.0/, "");
    const result = await callLoyverseApi(cleanEndpoint, {
      method,
      body
    });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      error: error.message,
      details: error.data || null
    });
  }
});
app.get("/api/github/image", async (req, res) => {
  try {
    const filePath = req.query.path;
    if (!filePath) return res.status(400).send("El par\xE1metro 'path' es requerido");
    const owner = process.env.VITE_GITHUB_OWNER || "tusoporteapp";
    const repo = process.env.VITE_GITHUB_REPO || "urbannoise";
    const token = process.env.VITE_GITHUB_TOKEN || "";
    const headers = {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "URBANNOISE-Web-Server"
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const cleanPath = filePath.replace(/^\/+/, "");
    const ghRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${cleanPath}`, {
      headers
    });
    if (!ghRes.ok) {
      return res.status(ghRes.status).send(`No se encontr\xF3 el archivo en GitHub: ${ghRes.statusText}`);
    }
    const fileData = await ghRes.json();
    if (!fileData.content) {
      return res.status(404).send("Contenido de archivo vac\xEDo");
    }
    const buf = Buffer.from(fileData.content, "base64");
    const ext = cleanPath.split(".").pop()?.toLowerCase() || "jpg";
    const mimeMap = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      webp: "image/webp",
      gif: "image/gif",
      svg: "image/svg+xml"
    };
    res.setHeader("Content-Type", mimeMap[ext] || "image/jpeg");
    res.setHeader("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");
    return res.send(buf);
  } catch (error) {
    return res.status(500).send(error.message);
  }
});
app.post("/api/loyverse/webhook", (req, res) => {
  const event = {
    receivedAt: (/* @__PURE__ */ new Date()).toISOString(),
    headers: req.headers,
    body: req.body
  };
  recentWebhookEvents.unshift(event);
  if (recentWebhookEvents.length > 50) {
    recentWebhookEvents.pop();
  }
  console.log("[Loyverse Webhook recibido]", req.body?.event_type || "evento desconocido");
  res.status(200).json({ received: true });
});
app.get("/api/loyverse/webhook-events", (req, res) => {
  res.json({ events: recentWebhookEvents });
});
async function getDefaultStoreId() {
  if (cachedDefaultStoreId) return cachedDefaultStoreId;
  if (!activeLoyverseToken) return "";
  try {
    const storesData = await callLoyverseApi("/stores");
    const stores = storesData?.stores || [];
    if (stores.length > 0) {
      const targetStore = stores.find((s) => {
        const name = (s.name || "").toLowerCase();
        return name.includes("noise") || name.includes("urban");
      });
      cachedDefaultStoreId = targetStore ? targetStore.id : stores[0].id;
      console.log(`[Loyverse] Tienda activa seleccionada: ${targetStore?.name || stores[0].name} (ID: ${cachedDefaultStoreId})`);
      return cachedDefaultStoreId;
    }
  } catch (err) {
    console.warn("[Loyverse] No se pudo obtener store_id:", err.message);
  }
  return "";
}
app.get("/api/bold/config", (req, res) => {
  res.json({
    configured: Boolean(activeBoldIdentityKey && activeBoldSecretKey),
    hasIdentityKey: Boolean(activeBoldIdentityKey),
    hasSecretKey: Boolean(activeBoldSecretKey),
    identityKeyMasked: activeBoldIdentityKey ? `${activeBoldIdentityKey.substring(0, 4)}...${activeBoldIdentityKey.slice(-4)}` : null,
    recentOrdersCount: recentOrders.length,
    recentWebhooksCount: recentBoldWebhooks.length
  });
});
app.post("/api/bold/configure", (req, res) => {
  const { identityKey, secretKey } = req.body;
  if (identityKey !== void 0) {
    activeBoldIdentityKey = String(identityKey).trim();
  }
  if (secretKey !== void 0) {
    activeBoldSecretKey = String(secretKey).trim();
  }
  res.json({
    success: true,
    message: "Credenciales de Bold.co actualizadas correctamente en el servidor",
    configured: Boolean(activeBoldIdentityKey && activeBoldSecretKey)
  });
});
app.post("/api/bold/create-payment-intent", (req, res) => {
  try {
    const { orderId, amount, currency = "COP", customer, description } = req.body;
    if (!orderId || !amount) {
      return res.status(400).json({ error: "Faltan datos requeridos (orderId, amount)" });
    }
    const secretKey = activeBoldSecretKey || "bold_secret_urbannoise_gateway";
    const rawStringToSign = `${orderId}${amount}${currency}${secretKey}`;
    const integritySignature = import_crypto.default.createHash("sha256").update(rawStringToSign).digest("hex");
    res.json({
      success: true,
      orderId,
      amount: Number(amount),
      currency,
      integritySignature,
      identityKey: activeBoldIdentityKey || "bold_sandbox_identity_urbannoise",
      hasLiveCredentials: Boolean(activeBoldIdentityKey && activeBoldSecretKey),
      customer: customer || {},
      description: description || `Pedido URBANNOISE #${orderId}`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.post("/api/orders/confirm-and-sync", async (req, res) => {
  try {
    const {
      orderId,
      amount,
      currency = "COP",
      paymentMethod = "bold_pse",
      boldTransaction,
      customer,
      items = [],
      totals = {},
      shippingAddress = {}
    } = req.body;
    if (!orderId) {
      return res.status(400).json({ error: "orderId es requerido" });
    }
    const orderAmount = Number(totals.total || amount || 0);
    const deductedStockInfo = [];
    for (const it of items) {
      const qty = Number(it.qty) || 1;
      const currentStock = it.stock !== void 0 ? Number(it.stock) : 10;
      if (it.sku) {
        const prev = inventoryOverrides[it.sku] ?? currentStock;
        const newStock = Math.max(0, prev - qty);
        inventoryOverrides[it.sku] = newStock;
        deductedStockInfo.push({ item: it.name, sku: it.sku, qtyDeducted: qty, remainingStock: newStock });
      }
      if (it.loyverseVariantId) {
        const prev = inventoryOverrides[it.loyverseVariantId] ?? currentStock;
        inventoryOverrides[it.loyverseVariantId] = Math.max(0, prev - qty);
      }
      if (it.id) {
        const prev = inventoryOverrides[it.id] ?? currentStock;
        inventoryOverrides[it.id] = Math.max(0, prev - qty);
      }
    }
    let loyverseReceiptResult = null;
    let loyverseSyncStatus = "SIMULATED";
    let loyverseErrorMessage = null;
    if (activeLoyverseToken) {
      try {
        const storeId = await getDefaultStoreId();
        const lineItems = items.map((it) => {
          const unitPrice = Number(it.price) || 0;
          const qty = Number(it.qty) || 1;
          const lineTotal = unitPrice * qty;
          const itemPayload = {
            item_name: it.name || "Prenda URBANNOISE",
            variant_name: it.size || "Talla \xDAnica",
            quantity: qty,
            price: unitPrice,
            gross_total_money: lineTotal,
            total_money: lineTotal
          };
          if (it.loyverseVariantId) {
            itemPayload.variant_id = it.loyverseVariantId;
          }
          return itemPayload;
        });
        let attachedCustomerId = customer?.loyverseCustomerId || null;
        if (!attachedCustomerId && (customer?.email || customer?.phone)) {
          try {
            const cleanEmail = (customer.email || "").trim().toLowerCase();
            const cleanPhone = (customer.phone || "").trim().replace(/\D/g, "");
            const listData = await callLoyverseApi("/customers?limit=250");
            const existing = (listData.customers || []).find(
              (c) => cleanEmail && c.email && c.email.toLowerCase() === cleanEmail || cleanPhone && c.phone_number && c.phone_number.replace(/\D/g, "") === cleanPhone
            );
            if (existing) {
              attachedCustomerId = existing.id;
              if (!existing.note?.toLowerCase().includes("web")) {
                await callLoyverseApi(`/customers/${existing.id}`, {
                  method: "POST",
                  body: {
                    ...existing,
                    note: `${existing.note ? existing.note + " \u2022 " : ""}Cliente Web URBANNOISE`
                  }
                }).catch(() => {
                });
              }
            } else if (customer.name && (cleanEmail || cleanPhone)) {
              const cleanDoc = (customer.document || "").trim().replace(/\D/g, "");
              const newCustPayload = {
                name: customer.name.trim().toUpperCase(),
                email: cleanEmail || void 0,
                note: cleanDoc ? `CC: ${cleanDoc} | Cliente Web URBANNOISE \u2022 Creado en Checkout` : "Cliente Web URBANNOISE \u2022 Creado en Checkout",
                customer_code: cleanDoc || `WEB-${Math.floor(1e5 + Math.random() * 9e5)}`
              };
              if (cleanPhone) newCustPayload.phone_number = cleanPhone;
              if (customer.address || shippingAddress?.address) {
                newCustPayload.address = customer.address || shippingAddress?.address;
              }
              if (customer.city || shippingAddress?.city) {
                newCustPayload.city = customer.city || shippingAddress?.city;
              }
              const createdCust = await callLoyverseApi("/customers", {
                method: "POST",
                body: newCustPayload
              });
              if (createdCust?.id) {
                attachedCustomerId = createdCust.id;
              }
            }
          } catch (custErr) {
            console.warn("[Loyverse] Advertencia vinculando cliente a la venta:", custErr.message);
          }
        }
        if (customer?.email) {
          const cEmail = customer.email.trim().toLowerCase();
          const cDoc = (customer.document || "").trim().replace(/\D/g, "");
          if (!webUsersStore[cEmail]) {
            webUsersStore[cEmail] = {
              id: attachedCustomerId || `web-cust-${Date.now()}`,
              name: (customer.name || "Cliente").trim().toUpperCase(),
              email: cEmail,
              phone: customer.phone || "",
              document: cDoc,
              city: customer.city || shippingAddress?.city || "Bogot\xE1, D.C.",
              address: customer.address || shippingAddress?.address || "",
              loyverseCustomerId: attachedCustomerId,
              createdAt: (/* @__PURE__ */ new Date()).toISOString()
            };
            saveWebUsersStore();
          } else if (attachedCustomerId) {
            webUsersStore[cEmail].loyverseCustomerId = attachedCustomerId;
            if (cDoc && !webUsersStore[cEmail].document) webUsersStore[cEmail].document = cDoc;
            saveWebUsersStore();
          }
        }
        const receiptPayload = {
          receipt_type: "SELL",
          order: orderId,
          created_at: (/* @__PURE__ */ new Date()).toISOString(),
          note: `URBANNOISE Web #${orderId} \u2022 Pasarela Bold: Ref ${boldTransaction?.boldReference || "BLD-DIRECT"} \u2022 Cliente: ${customer?.name || "Cliente"} - CC ${customer?.document || "N/A"} - Tel ${customer?.phone || ""}`,
          line_items: lineItems,
          payments: [
            {
              payment_name: `Bold.co (${paymentMethod})`,
              type: paymentMethod === "cod" ? "CASH" : "OTHER",
              paid_at: (/* @__PURE__ */ new Date()).toISOString(),
              money_amount: orderAmount
            }
          ],
          total_money: orderAmount
        };
        if (totals?.discount && Number(totals.discount) > 0) {
          receiptPayload.total_discount = Number(totals.discount);
          receiptPayload.note += ` \u2022 Descuento: -$${totals.discount}`;
        }
        if (attachedCustomerId) {
          receiptPayload.customer_id = attachedCustomerId;
        }
        if (storeId) {
          receiptPayload.store_id = storeId;
        }
        const apiRes = await callLoyverseApi("/receipts", {
          method: "POST",
          body: receiptPayload
        });
        loyverseReceiptResult = {
          id: apiRes.receipt?.id || apiRes.id || `REC-${Date.now()}`,
          receipt_number: apiRes.receipt?.receipt_number || apiRes.receipt_number || `REC-${orderId}`,
          created_at: apiRes.receipt?.created_at || (/* @__PURE__ */ new Date()).toISOString(),
          total_money: orderAmount,
          syncedToPos: true
        };
        loyverseSyncStatus = "SUCCESS";
        if (storeId) {
          const invUpdates = items.filter((it) => it.loyverseVariantId).map((it) => ({
            variant_id: it.loyverseVariantId,
            store_id: storeId,
            in_stock: inventoryOverrides[it.loyverseVariantId] ?? 0
          }));
          if (invUpdates.length > 0) {
            await callLoyverseApi("/inventory", {
              method: "POST",
              body: { inventory_levels: invUpdates }
            }).catch((e) => console.warn("[Loyverse] Inventario ajustado v\xEDa recibo SELL:", e.message));
          }
        }
      } catch (err) {
        console.error("[Loyverse] Error creando recibo oficial:", err.message);
        loyverseErrorMessage = err.message;
        loyverseSyncStatus = "ERROR";
      }
    }
    if (!loyverseReceiptResult) {
      loyverseReceiptResult = {
        id: `LOY-REC-${orderId}`,
        receipt_number: `REC-${Date.now().toString().slice(-6)}`,
        created_at: (/* @__PURE__ */ new Date()).toISOString(),
        total_money: orderAmount,
        syncedToPos: false,
        note: activeLoyverseToken ? `Error al enviar a Loyverse POS: ${loyverseErrorMessage}` : "Recibo emitido localmente con descuento de stock en tienda. Configura LOYVERSE_API_TOKEN en el panel para sincronizar con tu terminal f\xEDsico."
      };
    }
    const orderRecord = {
      orderId,
      amount: orderAmount,
      currency,
      paymentMethod,
      customer: customer || {},
      shippingAddress: shippingAddress || {},
      items: items.map((i) => ({
        id: i.id,
        name: i.name,
        size: i.size,
        qty: i.qty,
        price: i.price,
        sku: i.sku,
        loyverseVariantId: i.loyverseVariantId
      })),
      totals,
      boldTransaction: boldTransaction || {
        boldTransactionId: `TX-BOLD-${Date.now().toString(36).toUpperCase()}`,
        boldReference: `BLD${Math.floor(1e7 + Math.random() * 9e7)}`,
        authorizationCode: `${Math.floor(1e5 + Math.random() * 9e5)}`,
        status: "APROBADA"
      },
      loyverseReceipt: loyverseReceiptResult,
      loyverseSyncStatus,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    recentOrders.unshift(orderRecord);
    if (recentOrders.length > 100) recentOrders.pop();
    res.json({
      success: true,
      orderId,
      order: orderRecord,
      boldTransaction: orderRecord.boldTransaction,
      loyverseReceipt: loyverseReceiptResult,
      loyverseSyncStatus,
      inventoryDeducted: true,
      deductedStockInfo
    });
  } catch (error) {
    console.error("[Confirm & Sync Error]", error);
    res.status(500).json({ error: error.message });
  }
});
app.post("/api/bold/webhook", async (req, res) => {
  try {
    const payload = req.body;
    const event = {
      receivedAt: (/* @__PURE__ */ new Date()).toISOString(),
      headers: req.headers,
      payload
    };
    recentBoldWebhooks.unshift(event);
    if (recentBoldWebhooks.length > 50) recentBoldWebhooks.pop();
    console.log("[Bold Webhook Recibido]", payload?.event || "evento");
    if (payload?.event === "payment.approved" || payload?.status === "APPROVED") {
      const reference = payload?.data?.reference || payload?.reference;
      console.log(`[Bold Webhook] Pago aprobado para referencia: ${reference}`);
    }
    res.status(200).json({ received: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.get("/api/orders/recent", (req, res) => {
  res.json({
    count: recentOrders.length,
    orders: recentOrders
  });
});
app.get("/api/bold/webhook-events", (req, res) => {
  res.json({ events: recentBoldWebhooks });
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[URBANNOISE] Servidor escuchando en http://0.0.0.0:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
