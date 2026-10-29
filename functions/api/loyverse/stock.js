// Micro-Endpoint de Consulta de Stock en Tiempo Real por Prenda / Variantes
// Consulta únicamente las variantes solicitadas (S, M, L, XL) a la API de Loyverse
// sin descargar el catálogo completo, respondiendo en ~300ms y protegiendo la cuota de la API.
import { LOYVERSE_DEFAULT_TOKEN } from "../_loyverse.js";

const DEFAULT_STORE_ID = "fee704a4-ff11-43ae-903e-d2f9cf0a9a25"; // Tienda Noise Urban GranSan
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function onRequestGet({ request, env }) {
  try {
    const url = new URL(request.url);
    const variantIdsParam = url.searchParams.get("variant_ids") || url.searchParams.get("variants") || "";
    const storeId = url.searchParams.get("store_id") || DEFAULT_STORE_ID;

    const variantIds = variantIdsParam
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 5);

    if (variantIds.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Debes proporcionar al menos un variant_id válido." }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // Filtrar estrictamente solo UUIDs válidos para la API de Loyverse
    const validUuidVariants = variantIds.filter((id) => UUID_REGEX.test(id));

    const token = env?.LOYVERSE_API_TOKEN || LOYVERSE_DEFAULT_TOKEN;
    const stockMap = {};
    let totalStock = 0;

    if (validUuidVariants.length > 0) {
      // Llamada puntual a Loyverse filtrando exclusivamente por los UUIDs válidos de la prenda
      const loyverseUrl = `https://api.loyverse.com/v1.0/inventory?variant_ids=${encodeURIComponent(validUuidVariants.join(","))}`;

      const res = await fetch(loyverseUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        const data = await res.json();
        const levels = data.inventory_levels || [];

        for (const lvl of levels) {
          if (lvl.variant_id && (!storeId || lvl.store_id === storeId)) {
            const qty = Number(lvl.in_stock) || 0;
            stockMap[lvl.variant_id] = qty;
            totalStock += qty;
          }
        }
      }
    }

    // Para cualquier variant_id solicitado que no tenga registro explícito en Loyverse
    for (const id of variantIds) {
      if (stockMap[id] === undefined) {
        stockMap[id] = 0;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        storeId,
        variantCount: variantIds.length,
        stockMap,
        totalStock,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          // Caché corta en CDN para deduplicar micro-ráfagas (5 segundos)
          "Cache-Control": "public, max-age=5, s-maxage=5, stale-while-revalidate=15",
        },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Error interno al consultar micro-inventario",
        details: err.message,
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

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
