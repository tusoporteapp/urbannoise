import { LOYVERSE_DEFAULT_TOKEN } from "../_loyverse.js";

const STORE_ID = "fee704a4-ff11-43ae-903e-d2f9cf0a9a25"; // Tienda Noise Urban GranSan

// Cache en memoria para Cloudflare Pages Functions (15 segundos)
let memoryCache = null;
let cacheExpiresAt = 0;

async function fetchLoyverseAll(endpointName, arrayKey, token) {
  let cursor = null;
  let page = 0;
  const maxPages = 20; // Hasta 5,000 registros
  const all = [];

  do {
    page++;
    const url = `https://api.loyverse.com/v1.0/${endpointName}?limit=250${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) break;

    const data = await res.json();
    if (data[arrayKey] && Array.isArray(data[arrayKey])) {
      all.push(...data[arrayKey]);
    }
    cursor = data.cursor || null;
  } while (cursor && page < maxPages);

  return all;
}

export async function onRequestGet({ request, env }) {
  return handleSync(request, env);
}

export async function onRequestPost({ request, env }) {
  return handleSync(request, env, true);
}

async function handleSync(request, env, forceRefresh = false) {
  try {
    const url = new URL(request.url);
    const force = forceRefresh || url.searchParams.get("force") === "true";

    // Si hay cache válido y no se solicitó forzar actualización
    if (!force && memoryCache && Date.now() < cacheExpiresAt) {
      return new Response(JSON.stringify(memoryCache), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, max-age=60, s-maxage=60, stale-while-revalidate=300",
          "X-Sync-Source": "MemoryCache",
        },
      });
    }

    const LOYVERSE_TOKEN = env?.LOYVERSE_API_TOKEN || LOYVERSE_DEFAULT_TOKEN;

    // Ejecutar en paralelo: Items + Niveles de Inventario + Categorías
    const [items, invLevels, categoriesData] = await Promise.all([
      fetchLoyverseAll("items", "items", LOYVERSE_TOKEN),
      fetchLoyverseAll("inventory", "inventory_levels", LOYVERSE_TOKEN),
      fetch("https://api.loyverse.com/v1.0/categories", {
        headers: { Authorization: `Bearer ${LOYVERSE_TOKEN}` },
      })
        .then((r) => (r.ok ? r.json() : { categories: [] }))
        .catch(() => ({ categories: [] })),
    ]);

    const categories = categoriesData.categories || [];

    // Mapear inventario para la tienda Noise Urban GranSan
    const inventoryMap = new Map();
    for (const lvl of invLevels) {
      if (lvl.variant_id && (!STORE_ID || lvl.store_id === STORE_ID)) {
        const current = inventoryMap.get(lvl.variant_id) || 0;
        inventoryMap.set(lvl.variant_id, current + (lvl.in_stock || 0));
      }
    }

    // Estructurar items con sus variantes y stock real
    const syncedItems = items.map((item) => {
      const colorsSet = new Set();
      const sizesSet = new Set();

      const variants = (item.variants || []).map((v) => {
        const stockInPos = inventoryMap.get(v.variant_id) ?? 0;
        const size = (v.option1_value || "").trim();
        const color = (v.option2_value || "").trim();
        if (size) sizesSet.add(size);
        if (color) colorsSet.add(color);

        const storePrice = v.stores?.find((s) => s.store_id === STORE_ID)?.price;
        const variantPrice = storePrice !== undefined && storePrice !== null ? storePrice : v.default_price ?? v.price ?? 0;

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
          in_stock: stockInPos,
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
        storeId: STORE_ID,
      };
    });

    const responsePayload = {
      configured: true,
      storeId: STORE_ID,
      count: syncedItems.length,
      items: syncedItems,
      categories,
      syncedAt: new Date().toISOString(),
    };

    // Guardar en cache durante 60 segundos
    memoryCache = responsePayload;
    cacheExpiresAt = Date.now() + 60 * 1000;

    return new Response(JSON.stringify(responsePayload), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=60, s-maxage=60, stale-while-revalidate=300",
        "X-Sync-Source": "LoyverseLive",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        configured: false,
        items: [],
        error: error.message || "Error al sincronizar con Loyverse POS",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
}
