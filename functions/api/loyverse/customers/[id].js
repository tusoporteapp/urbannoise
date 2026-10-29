import { isAuthorizedAdmin } from "../../_auth.js";
import { LOYVERSE_DEFAULT_TOKEN } from "../../_loyverse.js";

export async function onRequestDelete({ request, params, env }) {
  try {
    const authorized = await isAuthorizedAdmin(request, env);
    if (!authorized) {
      return new Response(JSON.stringify({ error: "No autorizado para eliminar clientes." }), {
        status: 401,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    const customerId = params?.id;
    if (!customerId) {
      return new Response(JSON.stringify({ error: "customerId es requerido" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    const LOYVERSE_TOKEN = env?.LOYVERSE_API_TOKEN || LOYVERSE_DEFAULT_TOKEN;

    const res = await fetch(`https://api.loyverse.com/v1.0/customers/${customerId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${LOYVERSE_TOKEN}`,
      },
    });

    if (res.ok) {
      return new Response(
        JSON.stringify({ success: true, message: `Cliente ${customerId} eliminado exitosamente de Loyverse POS.` }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        }
      );
    } else {
      const errText = await res.text();
      return new Response(
        JSON.stringify({ success: false, error: `Error de Loyverse POS: ${errText}` }),
        {
          status: res.status,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        }
      );
    }
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
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
      "Access-Control-Allow-Methods": "DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, x-admin-token, x-admin-key",
    },
  });
}
