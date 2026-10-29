// Memoria compartida de órdenes e intenciones pendientes en el Edge de Cloudflare
export const pendingOrdersMap = new Map();

/**
 * Registra una intención de pedido con su carga completa antes de lanzar el checkout de Bold
 */
export function setPendingOrder(orderId, orderData) {
  if (!orderId) return;
  pendingOrdersMap.set(orderId, {
    ...orderData,
    savedAt: Date.now(),
  });

  // Limpieza periódica si excede 200 órdenes en memoria
  if (pendingOrdersMap.size > 200) {
    const oldestKey = pendingOrdersMap.keys().next().value;
    if (oldestKey) pendingOrdersMap.delete(oldestKey);
  }
}

/**
 * Recupera los datos completos del pedido pendiente por orderId
 */
export function getPendingOrder(orderId) {
  if (!orderId) return null;
  return pendingOrdersMap.get(orderId) || null;
}
