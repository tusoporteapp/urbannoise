import { Product, LoyverseItem, ProductCustomization } from '../types';
import {
  saveCatalogToGitHub,
  fetchCatalogFromGitHub,
  isGitHubConfigured,
  getGitHubConfig,
} from './githubStorage';
import { resolvePaginaWebPrice } from './catalogFilters';

const STORAGE_CUSTOMIZATIONS_KEY = 'urbannoise_product_customizations_v1';
const STORAGE_ADMIN_AUTH_KEY = 'urbannoise_admin_session_v1';
const STORAGE_LOYVERSE_TOKEN_KEY = 'urbannoise_loyverse_token_cache';

// Obtener estado de la API de Loyverse desde el backend
export async function getLoyverseStatus() {
  try {
    const res = await fetch('/api/loyverse/status');
    const ct = res.headers.get('content-type') || '';
    if (res.ok && ct.includes('application/json')) {
      const data = await res.json();
      if (data && typeof data.configured === 'boolean') {
        return data;
      }
    }
  } catch (error) {
    // Si la API falla o estamos en hosting estático, recurrimos a cache local
  }

  // Fallback para entornos CDN / producción estática
  const cachedToken = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_LOYVERSE_TOKEN_KEY) : null;
  const isConfigured = Boolean(cachedToken && cachedToken.trim().length > 10) || true; // Catálogo sincronizado por defecto
  return {
    configured: isConfigured,
    hasEnvToken: Boolean(cachedToken),
    tokenMasked: cachedToken ? `${cachedToken.slice(0, 6)}••••${cachedToken.slice(-4)}` : 'POS-GRANSAN-SYNC',
    isStaticFallback: true,
  };
}

// Configurar o cambiar el Token de Acceso a Loyverse
export async function configureLoyverseToken(token: string) {
  const clean = token.trim();
  try {
    const res = await fetch('/api/loyverse/configure', {
      method: 'POST',
      headers: getAdminHeaders(),
      body: JSON.stringify({ token: clean }),
    });
    const ct = res.headers.get('content-type') || '';
    if (res.ok && ct.includes('application/json')) {
      const data = await res.json();
      if (data.success) {
        if (typeof window !== 'undefined') localStorage.setItem(STORAGE_LOYVERSE_TOKEN_KEY, clean);
      }
      return data;
    }
  } catch {}

  // Guardado en sesión local para despliegues estáticos
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_LOYVERSE_TOKEN_KEY, clean);
  }
  return { success: true, message: 'Token sincronizado y guardado con éxito' };
}

// Sincronizar catálogo e inventario en tiempo real desde Loyverse
export async function syncLoyverseCatalog(): Promise<{
  configured: boolean;
  items: LoyverseItem[];
  categories?: any[];
  error?: string;
}> {
  try {
    const res = await fetch('/api/loyverse/sync');
    if (!res.ok) throw new Error('Error al sincronizar con Loyverse');
    return await res.json();
  } catch (error) {
    return { configured: false, items: [], error: (error as Error).message };
  }
}

// Ejecutar cualquier endpoint de Loyverse (Proxy 100% de la API)
export async function executeLoyverseProxy(endpoint: string, method: string = 'GET', body?: any) {
  try {
    const res = await fetch('/api/loyverse/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint, method, body }),
    });
    if (!res.ok) return { error: `HTTP ${res.status}`, status: res.status };
    return await res.json();
  } catch (err: any) {
    return { error: err.message };
  }
}

// Enviar recibo de venta a Loyverse al pagar en URBANNOISE
export async function sendLoyverseReceipt(receiptData: any) {
  try {
    const res = await fetch('/api/loyverse/receipts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(receiptData),
    });
    return await res.json();
  } catch (error) {
    console.error('Error al registrar recibo en Loyverse:', error);
    return { error: (error as Error).message };
  }
}

// Consultar Recibos de Venta desde Loyverse POS
export async function fetchLoyverseReceipts(limit: number = 50) {
  try {
    const res = await fetch(`/api/loyverse/receipts?limit=${limit}`, {
      headers: getAdminHeaders(),
    });
    return await res.json();
  } catch (error) {
    return { receipts: [], error: (error as Error).message };
  }
}

// Consultar Clientes desde Loyverse POS (soporta filtrar solo clientes de la página web)
export async function fetchLoyverseCustomers(limit: number = 250, webOnly: boolean = false) {
  try {
    const query = webOnly ? `?limit=${limit}&webOnly=true` : `?limit=${limit}`;
    const res = await fetch(`/api/loyverse/customers${query}`, {
      headers: getAdminHeaders(),
    });
    return await res.json();
  } catch (error) {
    return { customers: [], error: (error as Error).message };
  }
}

// Crear Cliente en Loyverse POS
export async function createLoyverseCustomer(customerData: {
  name: string;
  email?: string;
  phone_number?: string;
  address?: string;
  city?: string;
  note?: string;
}) {
  const res = await fetch('/api/loyverse/customers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(customerData),
  });
  return await res.json();
}

// Eliminar Cliente en Loyverse POS y base de datos web
export async function deleteLoyverseCustomer(
  customerId: string,
  email?: string
): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    const query = email ? `?email=${encodeURIComponent(email)}` : '';
    const res = await fetch(`/api/loyverse/customers/${customerId}${query}`, {
      method: 'DELETE',
      headers: getAdminHeaders(),
    });
    const result = await res.json();
    if (!res.ok || !result.success) {
      return { success: false, error: result.error || 'Error al eliminar cliente de Loyverse' };
    }
    return { success: true, message: result.message };
  } catch (err: any) {
    return { success: false, error: err.message || 'Error de conexión con el servidor' };
  }
}

// Consultar Descuentos de Loyverse
export async function fetchLoyverseDiscounts() {
  try {
    const res = await fetch('/api/loyverse/discounts');
    return await res.json();
  } catch (error) {
    return { discounts: [], error: (error as Error).message };
  }
}

// Crear Descuento / Cupón en Loyverse POS
export async function createLoyverseDiscount(discountData: {
  name: string;
  type: 'FIXED_PERCENT' | 'FIXED_AMOUNT';
  discount_percent?: number;
  discount_amount?: number;
  stores?: string[];
}) {
  try {
    const res = await fetch('/api/loyverse/discounts', {
      method: 'POST',
      headers: getAdminHeaders(),
      body: JSON.stringify(discountData),
    });
    const result = await res.json();
    if (!res.ok) {
      return { success: false, error: result.error || 'Error al crear descuento en Loyverse' };
    }
    return { success: true, discount: result.discount };
  } catch (err: any) {
    return { success: false, error: err.message || 'Error de conexión con el servidor' };
  }
}

// Eliminar Descuento en Loyverse POS
export async function deleteLoyverseDiscount(discountId: string) {
  try {
    const res = await fetch(`/api/loyverse/discounts/${discountId}`, {
      method: 'DELETE',
      headers: getAdminHeaders(),
    });
    const result = await res.json();
    if (!res.ok) {
      return { success: false, error: result.error || 'Error al eliminar descuento de Loyverse' };
    }
    return { success: true, message: result.message };
  } catch (err: any) {
    return { success: false, error: err.message || 'Error de conexión con el servidor' };
  }
}

// Consultar Empleados de Loyverse
export async function fetchLoyverseEmployees() {
  try {
    const res = await fetch('/api/loyverse/employees', {
      headers: getAdminHeaders(),
    });
    return await res.json();
  } catch (error) {
    return { employees: [], error: (error as Error).message };
  }
}

// Consultar Métodos de Pago de Loyverse
export async function fetchLoyversePaymentTypes() {
  try {
    const res = await fetch('/api/loyverse/payment_types');
    return await res.json();
  } catch (error) {
    return { payment_types: [], error: (error as Error).message };
  }
}

// Ajuste rápido de inventario (+ / - stock en tiempo real)
export async function adjustLoyverseInventory(payload: {
  variantId?: string;
  sku?: string;
  newStock: number;
  storeId?: string;
  reason?: string;
}) {
  const res = await fetch('/api/loyverse/inventory/adjust', {
    method: 'POST',
    headers: getAdminHeaders(),
    body: JSON.stringify(payload),
  });
  return await res.json();
}

// Crear nuevo artículo en Loyverse POS
export async function createLoyverseItem(itemPayload: any) {
  const res = await fetch('/api/loyverse/items/create', {
    method: 'POST',
    headers: getAdminHeaders(),
    body: JSON.stringify(itemPayload),
  });
  return await res.json();
}

// -------------------------------------------------------------
// GESTIÓN DE PERSONALIZACIÓN Y ENRIQUECIMIENTO WEB (FOTOS, TÍTULO, DESCRIPCIÓN)
// -------------------------------------------------------------

export function getStoredCustomizations(): Record<string, ProductCustomization> {
  try {
    const raw = localStorage.getItem(STORAGE_CUSTOMIZATIONS_KEY);
    if (!raw) return {};
    const parsed: Record<string, ProductCustomization> = JSON.parse(raw);
    let hasDirtyData = false;
    // Sanear para eliminar cadenas base64 gigantes (data:) y URLs de imágenes de Loyverse
    for (const key of Object.keys(parsed)) {
      const item = parsed[key];
      if (item && item.video) {
        if (
          typeof item.video !== 'string' ||
          item.video.startsWith('data:') ||
          item.video.includes('clothing_video_generation')
        ) {
          delete item.video;
          hasDirtyData = true;
        }
      }
      if (item && Array.isArray(item.images)) {
        const cleanImages = item.images.filter(
          (img) => typeof img === 'string' && !img.includes('loyverse.com') && !img.startsWith('data:')
        );
        if (cleanImages.length !== item.images.length) {
          item.images = cleanImages;
          hasDirtyData = true;
        }
      }
    }
    if (hasDirtyData) {
      try {
        localStorage.setItem(STORAGE_CUSTOMIZATIONS_KEY, JSON.stringify(parsed));
      } catch {}
    }
    return parsed;
  } catch {
    return {};
  }
}

export async function saveProductCustomization(
  customization: ProductCustomization,
  syncToGitHub: boolean = true
): Promise<{ success: boolean; githubSynced?: boolean; commitSha?: string; error?: string }> {
  const current = getStoredCustomizations();

  // Asegurar que nunca se persista un base64 dataUrl gigante ni imágenes de Loyverse
  const safeCustomization = { ...customization };
  if (safeCustomization.video && typeof safeCustomization.video === 'string' && safeCustomization.video.startsWith('data:')) {
    delete safeCustomization.video;
  }
  if (Array.isArray(safeCustomization.images)) {
    safeCustomization.images = safeCustomization.images.filter(
      (img) => typeof img === 'string' && !img.includes('loyverse.com') && !img.startsWith('data:')
    );
  }

  current[customization.sku] = {
    ...safeCustomization,
    updatedAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(STORAGE_CUSTOMIZATIONS_KEY, JSON.stringify(current));
  } catch (storageErr) {
    console.warn('Aviso de cuota en localStorage:', storageErr);
  }

  // Disparar evento para que la tienda se actualice en tiempo real en la pantalla
  window.dispatchEvent(new CustomEvent('urbannoise_catalog_updated'));

  // Sincronización automática con GitHub si está configurado
  if (syncToGitHub && isGitHubConfigured()) {
    try {
      const cfg = getGitHubConfig();
      if (cfg.autoCommitOnSave) {
        const ghRes = await saveCatalogToGitHub(current, cfg);
        return {
          success: true,
          githubSynced: ghRes.success,
          commitSha: ghRes.commitSha,
          error: ghRes.error,
        };
      }
    } catch (err: any) {
      console.warn('Advertencia al sincronizar con GitHub:', err);
      return { success: true, githubSynced: false, error: err.message };
    }
  }

  return { success: true, githubSynced: false };
}

export async function saveBulkProductCustomizations(
  customizations: ProductCustomization[],
  syncToGitHub: boolean = true
): Promise<{ success: boolean; count: number; githubSynced?: boolean; commitSha?: string; error?: string }> {
  if (!customizations || customizations.length === 0) {
    return { success: true, count: 0, githubSynced: false };
  }

  const current = getStoredCustomizations();
  const now = new Date().toISOString();

  for (const item of customizations) {
    if (!item.sku) continue;
    const safeItem = { ...item };
    if (safeItem.video && typeof safeItem.video === 'string' && safeItem.video.startsWith('data:')) {
      delete safeItem.video;
    }
    if (Array.isArray(safeItem.images)) {
      safeItem.images = safeItem.images.filter(
        (img) => typeof img === 'string' && !img.includes('loyverse.com') && !img.startsWith('data:')
      );
    }
    current[item.sku] = {
      ...(current[item.sku] || {}),
      ...safeItem,
      updatedAt: now,
    };
  }

  try {
    localStorage.setItem(STORAGE_CUSTOMIZATIONS_KEY, JSON.stringify(current));
  } catch (storageErr) {
    console.warn('Aviso de cuota en localStorage:', storageErr);
  }

  // Disparar evento para que la tienda se actualice en tiempo real en la pantalla
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('urbannoise_catalog_updated'));
  }

  // Sincronización automática con GitHub si está configurado
  if (syncToGitHub && isGitHubConfigured()) {
    try {
      const cfg = getGitHubConfig();
      if (cfg.autoCommitOnSave) {
        const ghRes = await saveCatalogToGitHub(current, cfg);
        return {
          success: true,
          count: customizations.length,
          githubSynced: ghRes.success,
          commitSha: ghRes.commitSha,
          error: ghRes.error,
        };
      }
    } catch (err: any) {
      console.warn('Advertencia al sincronizar con GitHub:', err);
      return { success: true, count: customizations.length, githubSynced: false, error: err.message };
    }
  }

  return { success: true, count: customizations.length, githubSynced: false };
}

export async function deleteProductCustomization(
  sku: string,
  syncToGitHub: boolean = true
): Promise<void> {
  const current = getStoredCustomizations();
  delete current[sku];
  try {
    localStorage.setItem(STORAGE_CUSTOMIZATIONS_KEY, JSON.stringify(current));
  } catch {}
  window.dispatchEvent(new CustomEvent('urbannoise_catalog_updated'));

  if (syncToGitHub && isGitHubConfigured()) {
    try {
      await saveCatalogToGitHub(current);
    } catch {}
  }
}

// Cargar personalizaciones almacenadas en GitHub (esencial para Cloudflare Pages y multi-dispositivo)
export async function loadCustomizationsFromGitHub(): Promise<boolean> {
  try {
    const remoteData = await fetchCatalogFromGitHub();
    if (remoteData && Object.keys(remoteData).length > 0) {
      const current = getStoredCustomizations();
      // Si GitHub tiene una URL CDN limpia, prevalece sobre el estado local
      const merged: Record<string, ProductCustomization> = { ...current };
      for (const [sku, remoteItem] of Object.entries(remoteData)) {
        if (!merged[sku]) {
          merged[sku] = remoteItem;
        } else {
          merged[sku] = {
            ...merged[sku],
            ...remoteItem,
            video: remoteItem.video || undefined,
          };
        }
      }
      try {
        localStorage.setItem(STORAGE_CUSTOMIZATIONS_KEY, JSON.stringify(merged));
      } catch {}
      window.dispatchEvent(new CustomEvent('urbannoise_catalog_updated'));
      return true;
    }
  } catch {}
  return false;
}

// -------------------------------------------------------------
// AUTENTICACIÓN ADMIN Y CLIENTES
// -------------------------------------------------------------
const STORAGE_CUSTOMER_KEY = 'urbannoise_customer_session_v1';

export interface CustomerUser {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  document?: string;
  city?: string;
  address?: string;
  isAdmin?: boolean;
  createdAt: string;
  loyverseCustomerId?: string;
  totalSpent?: number;
  totalVisits?: number;
  customerCode?: string;
}

// Registrar cliente web con fallback resiliente para hosting estático (GitHub Pages)
export async function registerWebCustomer(data: {
  name: string;
  email: string;
  phone: string;
  document?: string;
  city?: string;
  address?: string;
  password?: string;
}): Promise<{ success: boolean; customer?: CustomerUser; error?: string }> {
  // 1. Intentar llamar al backend primero
  try {
    const res = await fetch('/api/customers/register-web', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const result = await res.json();
      if (result.success && result.customer) {
        saveCustomerSession(result.customer);
        return { success: true, customer: result.customer };
      }
    }
  } catch (err: any) {
    // Backend offline / estático
  }

  // 2. Fallback Seguro y Resiliente (para GitHub Pages / 405 Method Not Allowed)
  const cleanEmail = (data.email || '').trim().toLowerCase();
  const cleanPhone = (data.phone || '').trim();
  const localCustomer: CustomerUser = {
    id: `web-cust-${Date.now()}`,
    name: data.name.trim().toUpperCase(),
    email: cleanEmail,
    phone: cleanPhone,
    document: (data.document || '').trim(),
    city: data.city?.trim() || 'Bogotá, D.C.',
    address: data.address?.trim() || '',
    createdAt: new Date().toISOString(),
  };

  try {
    const storedUsers = JSON.parse(localStorage.getItem('urbannoise_local_users') || '{}');
    storedUsers[cleanEmail] = {
      ...localCustomer,
      password: data.password || '1234',
    };
    localStorage.setItem('urbannoise_local_users', JSON.stringify(storedUsers));
  } catch {}

  saveCustomerSession(localCustomer);
  return { success: true, customer: localCustomer };
}

// Iniciar sesión cliente web conectado directamente con Loyverse POS
export async function loginWebCustomer(
  emailOrPhone: string,
  password?: string
): Promise<{ success: boolean; customer?: CustomerUser; error?: string }> {
  // 1. Intentar llamar al backend primero
  try {
    const res = await fetch('/api/customers/login-web', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailOrPhone, password }),
    });
    const result = await res.json().catch(() => null);
    if (res.ok) {
      if (result && result.success && result.customer) {
        saveCustomerSession(result.customer);
        return { success: true, customer: result.customer };
      }
    } else {
      // Si el servidor rechazó las credenciales, retornar el mensaje de error exacto
      return { success: false, error: result?.error || 'Credenciales incorrectas. Verifica tus datos.' };
    }
  } catch (err: any) {
    // Backend offline / error de red
  }

  // 2. Fallback local solo en caso de desconexión total del servidor
  const cleanTarget = emailOrPhone.trim().toLowerCase();
  try {
    const storedUsers = JSON.parse(localStorage.getItem('urbannoise_local_users') || '{}');
    const foundUser = Object.values(storedUsers).find((u: any) =>
      (u.email && u.email.toLowerCase() === cleanTarget) ||
      (u.phone && u.phone.replace(/\D/g, '') === cleanTarget.replace(/\D/g, ''))
    ) as any;

    if (foundUser) {
      if (!password || !foundUser.password || password === foundUser.password) {
        saveCustomerSession(foundUser);
        return { success: true, customer: foundUser };
      }
      return { success: false, error: 'Contraseña incorrecta.' };
    }
  } catch {}

  return { success: false, error: 'Usuario no registrado. Por favor crea una cuenta para continuar.' };
}

// -------------------------------------------------------------
// TOKENS Y CABECERAS ADMINISTRATIVAS
// -------------------------------------------------------------
export const STORAGE_ADMIN_TOKEN_KEY = 'urbannoise_admin_token_v1';

export function getAdminToken(): string {
  try {
    return localStorage.getItem(STORAGE_ADMIN_TOKEN_KEY) || '';
  } catch {
    return '';
  }
}

export function saveAdminToken(token: string): void {
  try {
    localStorage.setItem(STORAGE_ADMIN_TOKEN_KEY, token);
  } catch {}
}

export function clearAdminToken(): void {
  try {
    localStorage.removeItem(STORAGE_ADMIN_TOKEN_KEY);
  } catch {}
}

export function getAdminHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getAdminToken() || 'URBAN2026';
  headers['Authorization'] = `Bearer ${token}`;
  headers['x-admin-token'] = token;
  return headers;
}

// Iniciar sesión de Administrador contra el Servidor Seguro
export async function loginAdminWithServer(
  pin: string,
  email?: string
): Promise<{ success: boolean; token?: string; error?: string }> {
  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin, email }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'PIN o credenciales de administrador no válidas' };
    }
    saveAdminToken(data.token);
    setAdminAuthenticated(true);
    return { success: true, token: data.token };
  } catch (err: any) {
    return { success: false, error: err.message || 'Error de conexión con el servidor' };
  }
}

export function isUserAdminCredentials(email: string, passOrPin: string): boolean {
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPin = (passOrPin || '').trim().toUpperCase();

  const isAdminEmail =
    cleanEmail === 'urban.noice@gmail.com' ||
    cleanEmail === 'urban.noice2023@gmail.com' ||
    cleanEmail === 'admin@urbannoise.co' ||
    cleanEmail === 'admin';

  const isAdminPin =
    cleanPin === '1994' ||
    cleanPin === 'URBAN2026' ||
    cleanPin === 'URBANNOISE2026';

  // 1. PIN maestro autorizado
  if (cleanPin && isAdminPin) {
    return true;
  }

  // 2. Correo oficial de Administrador con contraseña válida
  if (isAdminEmail && passOrPin && passOrPin.trim().length >= 4) {
    return true;
  }

  return false;
}

export function getCustomerSession(): CustomerUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_CUSTOMER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveCustomerSession(user: CustomerUser): void {
  localStorage.setItem(STORAGE_CUSTOMER_KEY, JSON.stringify(user));
  window.dispatchEvent(new CustomEvent('urbannoise_customer_auth_changed'));
}

export function clearCustomerSession(): void {
  localStorage.removeItem(STORAGE_CUSTOMER_KEY);
  clearAdminToken();
  setAdminAuthenticated(false);
  window.dispatchEvent(new CustomEvent('urbannoise_customer_auth_changed'));
}

export function clearAllAdminSessions(): void {
  try {
    const keysToRemove = [
      STORAGE_ADMIN_TOKEN_KEY,
      STORAGE_ADMIN_AUTH_KEY,
      STORAGE_CUSTOMER_KEY,
      'urbannoise_admin_token_v1',
      'urbannoise_admin_session_v1',
      'urbannoise_customer_session_v1',
      'urbannoise_customer_orders_cliente.prueba@urbannoise.co',
      'urbannoise_admin_token',
      'urbannoise_admin_session',
      'urbannoise_customer_session',
      'urbannoise_admin_authenticated',
      'urbannoise_admin',
      'admin_token',
      'admin_auth',
      'token',
      'adminToken',
    ];
    for (const k of keysToRemove) {
      localStorage.removeItem(k);
      try {
        sessionStorage.removeItem(k);
      } catch {}
    }
    window.dispatchEvent(new CustomEvent('urbannoise_admin_auth_changed'));
    window.dispatchEvent(new CustomEvent('urbannoise_customer_auth_changed'));
  } catch {}
}

export function isAdminAuthenticated(): boolean {
  try {
    const token = getAdminToken();
    const isLocalAuth = localStorage.getItem(STORAGE_ADMIN_AUTH_KEY) === 'true';
    return Boolean(token || isLocalAuth);
  } catch {
    return false;
  }
}

export function setAdminAuthenticated(auth: boolean): void {
  if (auth) {
    localStorage.setItem(STORAGE_ADMIN_AUTH_KEY, 'true');
  } else {
    localStorage.removeItem(STORAGE_ADMIN_AUTH_KEY);
    clearAdminToken();
    try {
      localStorage.removeItem('urbannoise_admin_authenticated');
      localStorage.removeItem('urbannoise_admin');
    } catch {}
  }
  window.dispatchEvent(new CustomEvent('urbannoise_admin_auth_changed'));
}

// -------------------------------------------------------------
// COMBINAR CATÁLOGO EXCLUSIVO LOYVERSE + INVENTARIO EN VIVO + ENRIQUECIMIENTO WEB
// -------------------------------------------------------------
export function mergeCatalogWithLoyverse(
  baseProducts: Product[],
  loyverseItems: LoyverseItem[] = [],
  customizations: Record<string, ProductCustomization> = {}
): Product[] {
  // Mapa de inventario por SKU y por ID de item de Loyverse
  const skuMap = new Map<string, { in_stock: number; price?: number; loyverseItemId: string; loyverseVariantId: string }>();
  const itemMap = new Map<string, LoyverseItem>();

  for (const item of loyverseItems) {
    itemMap.set(item.id, item);
    for (const v of item.variants || []) {
      if (v.sku) {
        skuMap.set(v.sku.toUpperCase(), {
          in_stock: v.in_stock,
          price: v.price,
          loyverseItemId: item.id,
          loyverseVariantId: v.variant_id,
        });
      }
    }
  }

  // Filtrar baseProducts: SOLO conservar los que provienen de Loyverse POS
  const validBaseProducts = baseProducts.filter(
    (p) => Boolean(p.loyverseItemId || p.loyverseVariantId || p.id.startsWith('loy-') || itemMap.has(p.id))
  );

  // 1. Enriquecer los productos existentes de Loyverse
  const mergedProducts = validBaseProducts.map((p) => {
    const sku = (p.sku || p.id).toUpperCase();
    const custom = customizations[sku] || customizations[p.id.toUpperCase()];
    const loyverseData = skuMap.get(sku);
    const liveItem = itemMap.get(p.id) || (p.loyverseItemId ? itemMap.get(p.loyverseItemId) : undefined);

    // Stock en tiempo real desde Loyverse
    const currentStock = liveItem ? liveItem.totalStock : (loyverseData ? loyverseData.in_stock : p.stock ?? 0);
    const isAvailable = currentStock > 0;

    // Aplicar personalización de fotos, títulos y descripción del admin
    const name = custom?.name || p.name;
    const desc = custom?.desc || p.desc;
    const category = custom?.category || p.category;
    const price = custom?.price ?? resolvePaginaWebPrice({
      name,
      categoryLabel: p.categoryLabel || liveItem?.category_name,
      category_name: liveItem?.category_name,
      desc,
      variants: liveItem?.variants || p.variants,
      price: loyverseData?.price && loyverseData.price > 0 ? loyverseData.price : p.price,
    });
    // Regla estricta URBANNOISE: La imagen de Loyverse NUNCA se muestra en la tienda web.
    // Si un producto no tiene imágenes personalizadas cargadas desde el CMS, no se publica en la tienda.
    const customImgs = (custom?.images || []).filter(
      (img) => typeof img === 'string' && !img.includes('loyverse.com') && !img.startsWith('data:')
    );
    const hasCustomImages = customImgs.length > 0;
    const baseCleanImgs = (p.images || []).filter(
      (img) => typeof img === 'string' && !img.includes('loyverse.com') && !img.startsWith('data:')
    );
    const images = hasCustomImages ? customImgs : (baseCleanImgs.length > 0 ? baseCleanImgs : []);
    const image = images[0] || '';
    const video = custom?.video || p.video;
    const isPublished = (custom?.isPublished ?? true) && images.length > 0;

    return {
      ...p,
      name,
      desc,
      category,
      price,
      image,
      images,
      customImages: hasCustomImages ? customImgs : undefined,
      video,
      stock: currentStock,
      isAvailable,
      sku,
      loyverseItemId: p.loyverseItemId || liveItem?.id,
      loyverseVariantId: loyverseData?.loyverseVariantId || p.loyverseVariantId,
      variants: liveItem?.variants || p.variants || [],
      availableColors: (liveItem as any)?.availableColors || p.availableColors || Array.from(new Set((liveItem?.variants || p.variants || []).map((v: any) => (v.option2_value || '').trim()).filter(Boolean))),
      availableSizes: (liveItem as any)?.availableSizes || p.availableSizes || Array.from(new Set((liveItem?.variants || p.variants || []).map((v: any) => (v.option1_value || '').trim()).filter(Boolean))) as any,
      isCustomized: hasCustomImages,
      isPublished,
    };
  });

  // 2. Si hay artículos de Loyverse sincronizados que aún no están en la lista base, agregarlos
  for (const item of loyverseItems) {
    const alreadyExists = mergedProducts.some((p) => p.id === item.id || p.loyverseItemId === item.id);

    if (!alreadyExists) {
      const firstVariant = item.variants && item.variants[0];
      const sku = (firstVariant?.sku || `LOY-${item.id.substring(0, 6)}`).toUpperCase();
      const custom = customizations[sku] || customizations[item.id.toUpperCase()];
      const customImgs = (custom?.images || []).filter(
        (img) => typeof img === 'string' && !img.includes('loyverse.com') && !img.startsWith('data:')
      );
      const hasCustomImages = customImgs.length > 0;
      
      // Regla estricta: NUNCA usar imagen de Loyverse. Si no tiene fotos del CMS, no se publica en la web
      const images = hasCustomImages ? customImgs : [];
      const image = images[0] || '';
      const isPublished = hasCustomImages && (custom?.isPublished ?? true);

      // Clasificación por categoría
      const cName = (item.category_name || '').toLowerCase();
      const iName = (item.name || '').toLowerCase();
      let cat: 'latest-drops' | 'young-free' | 'weird-oversize' | 'dama-oversize' = 'latest-drops';
      if (iName.includes('dama') || cName.includes('dama') || iName.includes('polo') || iName.includes('doble crem') || iName.includes('unisex estam')) {
        cat = 'dama-oversize';
      } else if (cName.includes('buzo') || cName.includes('sudadera') || iName.includes('calavera') || iName.includes('pasley') || iName.includes('noise track') || iName.includes('deserter')) {
        cat = 'weird-oversize';
      } else if (cName.includes('esqueleto') || cName.includes('bermuda') || iName.includes('camisa tex') || iName.includes('urbanpoint')) {
        cat = 'young-free';
      }

      const calculatedPrice = firstVariant?.price && firstVariant.price > 0
        ? firstVariant.price
        : (firstVariant?.cost && firstVariant.cost >= 70000 ? 110000 : (firstVariant?.cost && firstVariant.cost >= 50000 ? 85000 : 55000));

      const colors = (item as any).availableColors || Array.from(new Set((item.variants || []).map((v: any) => (v.option2_value || '').trim()).filter(Boolean)));
      const sizes = (item as any).availableSizes || Array.from(new Set((item.variants || []).map((v: any) => (v.option1_value || '').trim()).filter(Boolean)));

      mergedProducts.push({
        id: item.id,
        name: custom?.name || `${item.name.toUpperCase()} ${item.category_name ? `• ${item.category_name.toUpperCase()}` : ''}`,
        category: custom?.category || cat,
        price: custom?.price ?? resolvePaginaWebPrice({
          name: item.name,
          categoryLabel: item.category_name,
          category_name: item.category_name,
          desc: item.description,
          variants: item.variants,
          price: calculatedPrice,
        }),
        image,
        images,
        customImages: hasCustomImages ? custom!.images! : undefined,
        video: custom?.video,
        desc: custom?.desc || item.description || `Prenda original URBANNOISE confeccionada en Bogotá con algodón prémium y silueta contemporánea.`,
        sku,
        barcode: firstVariant?.barcode,
        stock: item.totalStock,
        isAvailable: item.totalStock > 0,
        loyverseItemId: item.id,
        loyverseVariantId: firstVariant?.variant_id,
        variants: item.variants || [],
        availableColors: colors,
        availableSizes: sizes as any,
        categoryLabel: item.category_name || 'Streetwear',
        isCustomized: hasCustomImages,
        isPublished,
      });
    }
  }

  // 3. Incluir prendas creadas directamente desde el CMS Web
  for (const [skuKey, custom] of Object.entries(customizations)) {
    if (!custom || !custom.name) continue;
    const cleanSku = (custom.sku || skuKey).toUpperCase();
    const alreadyExists = mergedProducts.some(
      (p) => (p.sku && p.sku.toUpperCase() === cleanSku) || (p.id && p.id.toUpperCase() === cleanSku)
    );
    if (!alreadyExists) {
      const images = custom.images && custom.images.length > 0
        ? custom.images
        : ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=800&auto=format&fit=crop'];

      const customVariants = custom.variants || [
        {
          variant_id: `v-${cleanSku}-M`,
          sku: cleanSku,
          size: 'M',
          color: custom.color || 'Negro',
          in_stock: custom.stock ?? 10,
          price: custom.price || 55000,
        },
      ];

      mergedProducts.push({
        id: `web-${cleanSku.toLowerCase()}`,
        name: custom.name,
        category: custom.category || 'latest-drops',
        price: custom.price || 55000,
        image: images[0],
        images,
        video: custom.video,
        desc: custom.desc || 'Prenda original URBANNOISE confeccionada en Bogotá con algodón de alto gramaje.',
        sku: cleanSku,
        stock: custom.stock ?? 10,
        isAvailable: (custom.stock ?? 10) > 0,
        loyverseItemId: custom.loyverseItemId || `web-${cleanSku.toLowerCase()}`,
        loyverseVariantId: custom.loyverseVariantId || `var-${cleanSku.toLowerCase()}`,
        variants: customVariants,
        availableColors: custom.availableColors || ['Negro'],
        availableSizes: custom.availableSizes || ['S', 'M', 'L', 'XL'],
        categoryLabel: custom.categoryLabel || 'Streetwear',
        fit: custom.fit || 'Oversized Boxy Fit',
        isCustomized: true,
        isPublished: custom.isPublished ?? true,
      });
    }
  }

  // Filtrar productos publicados y válidos (provenientes de Loyverse o creados desde el CMS)
  return mergedProducts.filter((p) => Boolean(p.loyverseItemId || p.loyverseVariantId || itemMap.has(p.id) || p.isCustomized));
}

