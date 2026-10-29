import { CustomerUser } from './loyverse';
import { Product } from '../types';

export interface CustomerOrderItem {
  id: string;
  name: string;
  size?: string;
  qty: number;
  price: number;
  image?: string;
  sku?: string;
}

export interface CustomerOrderTimelineStep {
  title: string;
  date: string;
  completed: boolean;
  current: boolean;
  detail: string;
  status?: 'completed' | 'in_progress' | 'pending';
}

export interface CustomerOrder {
  id: string;
  orderNumber: string;
  date: string;
  timestamp: number;
  status: 'CONFIRMADO' | 'EN_PREPARACION' | 'EN_CAMINO' | 'ENTREGADO';
  statusLabel: string;
  userEmail: string;
  trackingCompany?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  estimatedDelivery?: string;
  timeline: CustomerOrderTimelineStep[];
  shippingAddress: {
    name: string;
    city: string;
    department?: string;
    address: string;
    phone: string;
  };
  items: CustomerOrderItem[];
  totals: {
    subtotal: number;
    shipping: number;
    discount?: number;
    total: number;
  };
  paymentMethod: string;
  paymentStatus: 'APROBADO' | 'PENDIENTE' | 'RECHAZADO';
  receiptNumber?: string;
  authCode?: string;
}

export const CARRIER_OPTIONS = [
  { id: 'Servientrega', label: 'Servientrega' },
  { id: 'Interrapidisimo', label: 'Inter Rapidísimo' },
];

export function getCarrierTrackingUrl(company: string, guia: string): string {
  if (!guia) return '';
  const cleanGuia = (guia || '').trim();
  const c = (company || '').toLowerCase();
  if (c.includes('interrapid') || c.includes('inter rapidisimo')) {
    return `https://www.interrapidisimo.com/siga/?guia=${cleanGuia}`;
  }
  return `https://www.servientrega.com/wps/portal/rastreo-envio?guia=${cleanGuia}`;
}

const STORAGE_ORDERS_PREFIX = 'urbannoise_customer_orders_';

export function getCustomerOrders(email?: string): CustomerOrder[] {
  if (!email || !email.trim()) return [];
  const targetEmail = email.trim().toLowerCase();
  const storageKey = `${STORAGE_ORDERS_PREFIX}${targetEmail}`;

  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error leyendo pedidos locales:', err);
  }

  return [];
}

export function saveCustomerOrders(email: string, orders: CustomerOrder[]): void {
  if (!email || !email.trim()) return;
  const targetEmail = email.trim().toLowerCase();
  const storageKey = `${STORAGE_ORDERS_PREFIX}${targetEmail}`;
  try {
    localStorage.setItem(storageKey, JSON.stringify(orders));
    window.dispatchEvent(new CustomEvent('urbannoise_orders_updated'));
  } catch (err) {
    console.error('Error guardando pedidos locales:', err);
  }
}

export function addCustomerOrder(newOrder: CustomerOrder, email?: string): void {
  const targetEmail = (email || newOrder.userEmail || '').trim().toLowerCase();
  if (!targetEmail) return;
  const currentOrders = getCustomerOrders(targetEmail);
  const updatedOrders = [newOrder, ...currentOrders.filter((o) => o.id !== newOrder.id)];
  saveCustomerOrders(targetEmail, updatedOrders);
}

// Sincronizar y obtener pedidos del cliente desde el servidor / Loyverse POS
export async function fetchCustomerOrdersFromServer(
  user: CustomerUser,
  products?: Product[]
): Promise<CustomerOrder[]> {
  if (!user || !user.email) return [];
  const targetEmail = user.email.trim().toLowerCase();

  try {
    const params = new URLSearchParams({
      email: targetEmail,
      customerId: user.id || user.loyverseCustomerId || '',
      doc: user.document || '',
    });

    const res = await fetch(`/api/customers/orders?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.orders)) {
        const serverOrders: CustomerOrder[] = data.orders.map((so: any) => {
          // Resolver imagen de cada prenda con el catálogo si falta
          const resolvedItems = (so.items || []).map((it: any) => {
            let img = it.image;
            if (!img && products && products.length > 0) {
              const matched = products.find(
                (p) =>
                  p.id === it.id ||
                  p.loyverseItemId === it.id ||
                  p.name.toLowerCase() === (it.name || '').toLowerCase() ||
                  (it.sku && it.sku !== 'N/A' && p.sku === it.sku)
              );
              if (matched) {
                img = matched.image || matched.images?.[0];
              }
            }
            return {
              ...it,
              image: img || 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=1200&auto=format&fit=crop',
            };
          });

          return {
            ...so,
            items: resolvedItems,
          };
        });

        // Combinar con pedidos locales dando autoridad absoluta al servidor
        const localOrders = getCustomerOrders(targetEmail);
        const mergedMap = new Map<string, CustomerOrder>();

        // 1. Añadir órdenes del servidor (Fuente canónica de verdad)
        for (const o of serverOrders) {
          if (o.trackingNumber) {
            o.status = 'EN_CAMINO';
            o.trackingCompany = o.trackingCompany || 'Servientrega';
            o.trackingUrl = o.trackingUrl || getCarrierTrackingUrl(o.trackingCompany, o.trackingNumber);
            o.statusLabel = `Enviado con ${o.trackingCompany}`;
          } else {
            o.status = 'EN_PREPARACION';
            o.statusLabel = 'En Preparación';
            o.trackingNumber = undefined;
            o.trackingUrl = undefined;
          }
          mergedMap.set(o.id, o);
          if (o.orderNumber) {
            mergedMap.set(o.orderNumber, o);
          }
        }

        // 2. Solo añadir órdenes locales que NO existan en el servidor (ej. checkout recién terminado)
        for (const lo of localOrders) {
          const loId = lo.id || lo.orderNumber;
          if (loId && !mergedMap.has(loId)) {
            mergedMap.set(loId, lo);
          }
        }

        const mergedOrders = Array.from(new Set(mergedMap.values())).sort(
          (a, b) => (b.timestamp || 0) - (a.timestamp || 0)
        );

        saveCustomerOrders(targetEmail, mergedOrders);
        return mergedOrders;
      }
    }
  } catch (err) {
    console.error('Error fetching customer orders from server:', err);
  }

  return getCustomerOrders(targetEmail);
}
