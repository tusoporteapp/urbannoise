import React, { useState, useEffect } from 'react';
import { getCustomerSession } from './loyverse';

const WISHLIST_STORAGE_KEY = 'urbannoise_wishlist';
export const WISHLIST_UPDATED_EVENT = 'urbannoise_wishlist_updated';
export const REQUIRE_REGISTRATION_FOR_WISHLIST_EVENT = 'urbannoise_require_auth_wishlist';
export const PENDING_WISHLIST_KEY = 'urbannoise_pending_wishlist';

/**
 * Verifica si el usuario actual ha iniciado sesión / está registrado
 */
export function isCustomerLoggedIn(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(getCustomerSession());
}

/**
 * Obtener lista de IDs de productos guardados en la Lista de Deseos.
 * El acceso a la lista de deseos es exclusivo para usuarios registrados.
 */
export function getStoredWishlist(): string[] {
  if (typeof window === 'undefined') return [];
  if (!isCustomerLoggedIn()) return [];
  try {
    const raw = localStorage.getItem(WISHLIST_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Guardar lista de IDs en localStorage y emitir evento reactivo
 */
export function saveStoredWishlist(ids: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(ids));
  } catch (err) {
    console.warn('Error al guardar wishlist en localStorage:', err);
  }
  window.dispatchEvent(new CustomEvent(WISHLIST_UPDATED_EVENT, { detail: { wishlist: ids } }));
}

/**
 * Alternar producto en la lista de deseos (añadir si no está, quitar si ya está).
 * Si el usuario no está registrado, se bloquea la acción, se almacena la prenda pendiente
 * y se redirige inmediatamente al formulario de registro.
 */
export function toggleWishlistItem(productId: string): boolean {
  if (!isCustomerLoggedIn()) {
    try {
      localStorage.setItem(PENDING_WISHLIST_KEY, productId);
    } catch {}
    window.dispatchEvent(
      new CustomEvent(REQUIRE_REGISTRATION_FOR_WISHLIST_EVENT, { detail: { productId } })
    );
    if (typeof window !== 'undefined') {
      window.location.hash = '#registro';
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      });
    }
    return false;
  }

  const current = getStoredWishlist();
  const exists = current.includes(productId);
  const updated = exists ? current.filter((id) => id !== productId) : [...current, productId];
  saveStoredWishlist(updated);
  return !exists;
}

/**
 * Añadir producto a la lista de deseos (requiere registro)
 */
export function addToWishlist(productId: string): string[] {
  if (!isCustomerLoggedIn()) {
    try {
      localStorage.setItem(PENDING_WISHLIST_KEY, productId);
    } catch {}
    window.dispatchEvent(
      new CustomEvent(REQUIRE_REGISTRATION_FOR_WISHLIST_EVENT, { detail: { productId } })
    );
    if (typeof window !== 'undefined') {
      window.location.hash = '#registro';
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      });
    }
    return getStoredWishlist();
  }

  const current = getStoredWishlist();
  if (!current.includes(productId)) {
    const updated = [...current, productId];
    saveStoredWishlist(updated);
    return updated;
  }
  return current;
}

/**
 * Quitar producto de la lista de deseos
 */
export function removeFromWishlist(productId: string): string[] {
  const current = getStoredWishlist();
  const updated = current.filter((id) => id !== productId);
  saveStoredWishlist(updated);
  return updated;
}

/**
 * Verificar si un producto está en la lista de deseos
 */
export function isItemInWishlist(productId: string): boolean {
  if (!isCustomerLoggedIn()) return false;
  const current = getStoredWishlist();
  return current.includes(productId);
}

/**
 * Limpiar toda la lista de deseos
 */
export function clearWishlist(): void {
  saveStoredWishlist([]);
}

/**
 * Hook de React para escuchar reactivamente los cambios en la Lista de Deseos
 */
export function useWishlist(): {
  wishlist: string[];
  count: number;
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (productId: string, e?: React.MouseEvent) => boolean;
  removeFromWishlist: (productId: string) => void;
  clearWishlist: () => void;
} {
  const [wishlist, setWishlist] = useState<string[]>(() => getStoredWishlist());

  useEffect(() => {
    const handleUpdate = () => {
      setWishlist(getStoredWishlist());
    };

    window.addEventListener(WISHLIST_UPDATED_EVENT, handleUpdate);
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('urbannoise_customer_auth_changed', handleUpdate);

    return () => {
      window.removeEventListener(WISHLIST_UPDATED_EVENT, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('urbannoise_customer_auth_changed', handleUpdate);
    };
  }, []);

  const handleToggle = (productId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

    if (!isCustomerLoggedIn()) {
      try {
        localStorage.setItem(PENDING_WISHLIST_KEY, productId);
      } catch {}
      window.dispatchEvent(
        new CustomEvent(REQUIRE_REGISTRATION_FOR_WISHLIST_EVENT, { detail: { productId } })
      );
      if (typeof window !== 'undefined') {
        window.location.hash = '#registro';
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        requestAnimationFrame(() => {
          window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        });
      }
      return false;
    }

    const added = toggleWishlistItem(productId);
    setWishlist(getStoredWishlist());
    return added;
  };

  const handleRemove = (productId: string) => {
    removeFromWishlist(productId);
    setWishlist(getStoredWishlist());
  };

  const handleClear = () => {
    clearWishlist();
    setWishlist([]);
  };

  return {
    wishlist,
    count: wishlist.length,
    isInWishlist: (id: string) => (isCustomerLoggedIn() ? wishlist.includes(id) : false),
    toggleWishlist: handleToggle,
    removeFromWishlist: handleRemove,
    clearWishlist: handleClear,
  };
}
