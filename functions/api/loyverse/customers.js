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

    const url = new URL(request.url);
    const webOnly = url.searchParams.get("webOnly") !== "false";
    const LOYVERSE_TOKEN = env?.LOYVERSE_API_TOKEN || LOYVERSE_DEFAULT_TOKEN;

    // Obtener todos los clientes de Loyverse paginando
    const allCustomers = await getAllLoyverseCustomers(LOYVERSE_TOKEN, 8);

    // Filtrar estrictamente SOLO clientes registrados a través de la página web de URBANNOISE
    const isWebCustomer = (c) => {
      const note = (c.note || "").toLowerCase();
      const code = (c.customer_code || "").toUpperCase();

      return (
        code.startsWith("WEB-") ||
        note.includes("cliente web") ||
        note.includes("urbannoise web") ||
        note.includes("un-") ||
        note.includes("|o:") ||
        note.includes("[g:") ||
        note.includes("[pw_web:") ||
        note.includes("[web]") ||
        (c.email && c.email.toLowerCase() === "migocreativo.com@gmail.com") ||
        c.id === "7a0cc03a-f658-4b2a-a6d6-86f010205b0b"
      );
    };

    const webCustomers = allCustomers.filter(isWebCustomer);
    const resultCustomers = webOnly ? webCustomers : allCustomers;

    return new Response(
      JSON.stringify({
        customers: resultCustomers,
        totalCount: allCustomers.length,
        webCount: webCustomers.length,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      }
    );
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
