import { isAuthorizedAdmin } from "../_auth.js";
import { getAllLoyverseCustomers, LOYVERSE_DEFAULT_TOKEN } from "../_loyverse.js";

export async function onRequestGet({ request, env }) {
  try {
    // 0. Verificación de Autorización Administrativa
    const authorized = await isAuthorizedAdmin(request, env);
    if (!authorized) {
      return new Response(
        JSON.stringify({ error: "Acceso no autorizado al listado de clientes administrativos." }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        }
      );
    }

    const LOYVERSE_TOKEN = env?.LOYVERSE_API_TOKEN || LOYVERSE_DEFAULT_TOKEN;

    // Obtener todos los clientes de Loyverse paginando
    const allCustomers = await getAllLoyverseCustomers(LOYVERSE_TOKEN, 8);

    // Filtrar estrictamente SOLO clientes registrados a través de la página web
    const webCustomers = allCustomers.filter((c) => {
      const note = (c.note || "").toLowerCase();
      const code = (c.customer_code || "").toUpperCase();
      return (
        note.includes("cliente web") ||
        note.includes("[pw_web:") ||
        code.startsWith("WEB-") ||
        c.id === "eed0d7e0-e4a0-463a-9abd-f04890500739"
      );
    });

    return new Response(JSON.stringify({ customers: webCustomers, totalCount: allCustomers.length }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ customers: [], error: error.message }), {
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
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, x-admin-token, x-admin-key",
    },
  });
}
