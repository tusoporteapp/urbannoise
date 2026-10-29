import React, { useState, useEffect, useMemo } from 'react';
import { CountdownBanner } from './components/CountdownBanner';
import { AnnouncementBar } from './components/AnnouncementBar';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { ProductCarousel } from './components/ProductCarousel';
import { FlagshipSection } from './components/FlagshipSection';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { QuickViewModal } from './components/QuickViewModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SearchModal } from './components/SearchModal';
import { MobileMenu } from './components/MobileMenu';
import { Toast } from './components/Toast';
import { CheckoutView } from './components/CheckoutView';
import { AdminPanel } from './components/AdminPanel';
import { AccountView } from './components/AccountView';
import { LegalPoliciesModal } from './components/LegalPoliciesModal';
import { CookieBanner } from './components/CookieBanner';
import { FloatingWhatsApp } from './components/FloatingWhatsApp';
import { NotFoundView } from './components/NotFoundView';
import { CategoryMarketplaceView } from './components/CategoryMarketplaceView';
import { CategoryVisualHub } from './components/CategoryVisualHub';
import { SeoEditorialSection } from './components/SeoEditorialSection';
import { ConstructionGate } from './components/ConstructionGate';
import { Product, ProductSize, CartItem } from './types';
import { PRODUCTS_DATA, INITIAL_PRODUCTS } from './data/products';
import {
  mergeCatalogWithLoyverse,
  getStoredCustomizations,
  syncLoyverseCatalog,
  loadCustomizationsFromGitHub,
  getCustomerSession,
  isAdminAuthenticated,
  clearAdminToken,
  setAdminAuthenticated,
  clearCustomerSession,
  clearAllAdminSessions,
} from './lib/loyverse';
import { trackEvent } from './lib/analytics';
import { loadSiteContentFromRemote, getStoredSiteContent, getHomeBlocks, getFeaturedSkus } from './lib/siteContent';
import { verifyBoldReturnRedirect, getPendingCheckout } from './lib/bold';
import { HomeBlockItem } from './types';

export default function App() {
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('urbannoise_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      return (
        path === '/cms' ||
        path === '/cms/' ||
        path === '/admin' ||
        path === '/admin/' ||
        hash === '#cms' ||
        hash === '#admin'
      );
    }
    return false;
  });

  // Gestión de Indexación y URL para el CMS Studio (/cms) - Anti-Indexación en Google
  useEffect(() => {
    if (typeof document === 'undefined') return;

    let metaRobots = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    if (!metaRobots) {
      metaRobots = document.createElement('meta');
      metaRobots.name = 'robots';
      document.head.appendChild(metaRobots);
    }

    const currentPath = window.location.pathname.toLowerCase();
    const isCmsRoute =
      isAdminOpen ||
      currentPath.startsWith('/cms') ||
      currentPath.startsWith('/admin');

    if (isCmsRoute) {
      // Bloquear 100% la indexación en Google y motores de búsqueda para la ruta /cms
      metaRobots.setAttribute('content', 'noindex, nofollow, noarchive, nosnippet');
      document.title = 'CMS Studio • URBANNOISE (Privado)';

      try {
        if (window.location.pathname !== '/cms') {
          window.history.replaceState({ view: 'cms' }, '', '/cms');
        }
      } catch {}
    } else {
      // Restaurar indexación normal y SEO para la tienda pública
      metaRobots.setAttribute(
        'content',
        'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
      );
      document.title = 'URBANNOISE | Marca de Ropa Colombiana Oversize & Streetwear Bogotá';

      try {
        if (
          window.location.pathname === '/cms' ||
          window.location.pathname === '/cms/' ||
          window.location.pathname.startsWith('/admin')
        ) {
          window.history.pushState(null, '', '/');
        }
      } catch {}
    }
  }, [isAdminOpen]);
  const [isPoliciesOpen, setIsPoliciesOpen] = useState<boolean>(false);
  const [policiesInitialTab, setPoliciesInitialTab] = useState<string>('terminos');
  const [accountInitialTab, setAccountInitialTab] = useState<'orders' | 'wishlist' | 'profile'>('orders');
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [siteSections, setSiteSections] = useState(() => getStoredSiteContent().sections || {});
  const [homeBlocks, setHomeBlocks] = useState<HomeBlockItem[]>(() => getHomeBlocks());
  const [featuredSkus, setFeaturedSkus] = useState<string[]>(() => getFeaturedSkus());

  useEffect(() => {
    const handler = (e: any) => {
      if (e.detail?.sections) {
        setSiteSections(e.detail.sections);
      }
      if (e.detail?.homeBlocks) {
        setHomeBlocks(
          [...e.detail.homeBlocks].sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
        );
      }
      if (e.detail?.featuredSkus !== undefined) {
        setFeaturedSkus(Array.isArray(e.detail.featuredSkus) ? e.detail.featuredSkus : []);
      }
    };
    window.addEventListener('urbannoise_site_content_updated', handler);
    return () => window.removeEventListener('urbannoise_site_content_updated', handler);
  }, []);

  // Estado de Desbloqueo de Tienda (Página en Construcción)
  const [isSiteUnlocked, setIsSiteUnlocked] = useState<boolean>(() => {
    try {
      if (typeof window !== 'undefined') {
        // Limpiar cualquier flag persistente antiguo en localStorage para garantizar el bloqueo
        try {
          localStorage.removeItem('urbannoise_site_unlocked');
        } catch {}

        // Solo permitir acceso si fue desbloqueado con la clave 8624 en la sesión actual
        return sessionStorage.getItem('urbannoise_site_unlocked_session') === 'true';
      }
    } catch {}
    return false;
  });

  // Escuchar evento para bloquear la tienda (Modo Construcción)
  useEffect(() => {
    const handleLock = () => {
      try {
        localStorage.removeItem('urbannoise_site_unlocked');
        sessionStorage.removeItem('urbannoise_site_unlocked_session');
      } catch {}
      setIsSiteUnlocked(false);
    };
    window.addEventListener('urbannoise_lock_gate', handleLock);
    return () => window.removeEventListener('urbannoise_lock_gate', handleLock);
  }, []);

  // Detectar retorno de pago desde Bold.co o recuperación anti-F5 para abrir comprobante
  useEffect(() => {
    const returnCheck = verifyBoldReturnRedirect();
    if (returnCheck.isReturningFromBold) {
      setIsCheckoutOpen(true);
      return;
    }

    // Comprobación anti-F5: Si un cliente recargó en pagos Nequi o PSE y la orden ya fue aprobada
    const pending = getPendingCheckout();
    if (pending && pending.orderId) {
      fetch(`/api/bold/order-status?orderId=${encodeURIComponent(pending.orderId)}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((res) => {
          if (res && res.status === 'APPROVED' && res.paid) {
            setIsCheckoutOpen(true);
          }
        })
        .catch(() => {});
    }
  }, []);

  // Navegación de Vistas: 'home', 'marketplace', 'account' o 'not-found'
  const [currentView, setCurrentView] = useState<'home' | 'marketplace' | 'account' | 'not-found'>('home');
  const [marketplaceCategory, setMarketplaceCategory] = useState<string>('all');
  const currentViewRef = React.useRef(currentView);
  useEffect(() => {
    currentViewRef.current = currentView;
  }, [currentView]);

  // Memoria de posición de scroll independiente por página
  const pageScrollPositions = React.useRef<Record<string, number>>({
    home: 0,
    marketplace: 0,
    account: 0,
    'not-found': 0,
  });

  const navigateToView = (nextView: 'home' | 'marketplace' | 'account' | 'not-found', resetToTop: boolean = false) => {
    // 1. Guardar la posición actual de la página antes de cambiar de vista
    const currentScroll = window.scrollY || document.documentElement.scrollTop || 0;
    pageScrollPositions.current[currentView] = currentScroll;

    // 2. Limpiar o sincronizar el hash en la barra de direcciones para evitar bloqueos
    try {
      if (nextView === 'account') {
        if (window.location.hash !== '#cuenta') {
          window.history.pushState(null, '', '#cuenta');
        }
      } else if (nextView === 'not-found') {
        if (window.location.hash !== '#404') {
          window.history.pushState(null, '', '#404');
        }
      } else {
        // Al navegar a home o marketplace, limpiar cualquier hash residual (#cuenta, #login, #mi-cuenta, etc.)
        if (window.location.hash) {
          window.history.pushState(null, '', window.location.pathname + window.location.search);
        }
      }
    } catch {}

    // 3. Cambiar de vista
    if (resetToTop) {
      pageScrollPositions.current[nextView] = 0;
    }
    setCurrentView(nextView);

    // 4. Restaurar la posición de scroll propia e independiente de la página destino
    requestAnimationFrame(() => {
      const targetPos = resetToTop ? 0 : (pageScrollPositions.current[nextView] ?? 0);
      window.scrollTo({ top: targetPos, behavior: 'instant' });
    });
  };

  const handleOpenMarketplace = (category: string = 'all') => {
    const isDifferentCategory = category !== marketplaceCategory;
    setMarketplaceCategory(category);
    trackEvent('view_category', { category });
    try {
      if (window.location.hash) {
        window.history.pushState(null, '', window.location.pathname + window.location.search);
      }
    } catch {}
    navigateToView('marketplace', isDifferentCategory || currentView !== 'marketplace');
  };

  const isSessionAdmin = (s: any) => {
    if (!s) return false;
    // Solo es administrador si cuenta con credencial administrativa activa validada por clave
    return Boolean(s.isAdmin && isAdminAuthenticated());
  };

  const handleOpenAccount = () => {
    const session = getCustomerSession();
    const isCurrentlyLoggedInAdmin = isSessionAdmin(session);

    if (isCurrentlyLoggedInAdmin) {
      setAdminAuthenticated(true);
      setIsAdminOpen(true);
      if (currentView === 'account') {
        setCurrentView('home');
      }
      return;
    }

    setIsAdminOpen(false);
    setAccountInitialTab('orders');
    trackEvent('page_view', { view: 'account' });
    try {
      window.history.pushState(null, '', '#cuenta');
    } catch {}
    navigateToView('account', true);
  };

  const handleOpenWishlist = () => {
    const session = getCustomerSession();
    const isCurrentlyLoggedInAdmin = isSessionAdmin(session);

    if (isCurrentlyLoggedInAdmin) {
      setAdminAuthenticated(true);
      setIsAdminOpen(true);
      if (currentView === 'account') {
        setCurrentView('home');
      }
      return;
    }

    setIsAdminOpen(false);
    setAccountInitialTab('wishlist');
    trackEvent('page_view', { view: 'wishlist' });
    try {
      window.history.pushState(null, '', '#favoritos');
    } catch {}
    navigateToView('account', true);
  };

  const handleBackToHome = (forceTop: boolean = false) => {
    trackEvent('page_view', { view: 'home' });
    try {
      if (window.location.hash) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    } catch {}
    if (forceTop) {
      pageScrollPositions.current['home'] = 0;
      setCurrentView('home');
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      });
    } else {
      navigateToView('home', false);
    }
  };

  // Al presionar el logotipo de URBANNOISE: ir al principio, arriba del todo
  const handleLogoClick = () => {
    trackEvent('click_logo', { action: 'scroll_to_top' });
    try {
      if (window.location.hash) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    } catch {}

    pageScrollPositions.current['home'] = 0;

    if (currentView !== 'home') {
      setCurrentView('home');
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    });
  };

  const handleOpenPolicies = (tabId: string = 'terminos') => {
    setPoliciesInitialTab(tabId);
    setIsPoliciesOpen(true);
  };

  // Aislamiento completo de scroll para Modales y Drawers:
  // Impide que el scroll de los paneles afecte la página activa
  const isAnyOverlayActive =
    isCartOpen ||
    isCheckoutOpen ||
    isSearchOpen ||
    isMobileMenuOpen ||
    isAdminOpen ||
    isPoliciesOpen ||
    Boolean(quickViewProduct);

  useEffect(() => {
    if (isAnyOverlayActive) {
      const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      if (scrollBarWidth > 0) {
        document.body.style.paddingRight = `${scrollBarWidth}px`;
      }
      return () => {
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
      };
    }
  }, [isAnyOverlayActive]);

  // Catálogo dinámico unificado: Base + Stock en tiempo real Loyverse + Enriquecimiento Admin (fotos/títulos)
  const [loyverseItems, setLoyverseItems] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>(() =>
    mergeCatalogWithLoyverse(INITIAL_PRODUCTS, [], getStoredCustomizations())
  );

  const refreshCatalog = (newLoyverseItems?: any[]) => {
    const itemsToUse = newLoyverseItems !== undefined ? newLoyverseItems : loyverseItems;
    const merged = mergeCatalogWithLoyverse(INITIAL_PRODUCTS, itemsToUse, getStoredCustomizations());
    setProducts(merged);
  };

  const productsRef = React.useRef<Product[]>(products);
  useEffect(() => {
    productsRef.current = products;
  }, [products]);

  // Manejo de Enlaces Directos por Prenda (?product=SKU o ?p=SKU)
  const handleOpenProduct = (product: Product, updateUrl: boolean = true) => {
    setQuickViewProduct(product);
    try {
      document.title = `${product.name} | URBANNOISE`;
    } catch {}

    if (updateUrl && typeof window !== 'undefined') {
      try {
        const currentUrl = new URL(window.location.href);
        const identifier = product.sku || product.id;
        currentUrl.searchParams.set('product', identifier);
        window.history.pushState({ productId: identifier }, '', currentUrl.toString());
      } catch {}
    }
  };

  const handleCloseProduct = (updateUrl: boolean = true) => {
    setQuickViewProduct(null);
    try {
      document.title = 'URBANNOISE | Streetwear Oficial Colombia';
    } catch {}

    if (updateUrl && typeof window !== 'undefined') {
      try {
        const currentUrl = new URL(window.location.href);
        if (currentUrl.searchParams.has('product') || currentUrl.searchParams.has('p') || currentUrl.searchParams.has('sku')) {
          currentUrl.searchParams.delete('product');
          currentUrl.searchParams.delete('p');
          currentUrl.searchParams.delete('sku');
          const cleanSearch = currentUrl.searchParams.toString();
          const cleanUrl = currentUrl.pathname + (cleanSearch ? `?${cleanSearch}` : '') + (currentUrl.hash || '');
          window.history.pushState({}, '', cleanUrl);
        }
      } catch {}
    }
  };

  // Detección y apertura automática de prenda al cargar por URL directa (?product=SKU)
  useEffect(() => {
    if (!products || products.length === 0) return;

    try {
      const searchParams = new URLSearchParams(window.location.search);
      const targetParam = searchParams.get('product') || searchParams.get('p') || searchParams.get('sku');
      if (targetParam) {
        const cleanTarget = targetParam.trim().toLowerCase();
        const found = products.find(
          (p) =>
            (p.sku && p.sku.toLowerCase() === cleanTarget) ||
            (p.id && p.id.toLowerCase() === cleanTarget) ||
            (p.name && p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').includes(cleanTarget))
        );

        if (found && found.isPublished !== false && found.images && found.images.length > 0) {
          if (!quickViewProduct || (quickViewProduct.id !== found.id && quickViewProduct.sku !== found.sku)) {
            handleOpenProduct(found, false);
          }
        }
      }
    } catch {}

    // Sincronizar prenda en modal abierto si su stock o variantes se actualizaron desde Loyverse
    if (quickViewProduct) {
      const liveCurrent = products.find(
        (p) => p.id === quickViewProduct.id || (p.sku && p.sku === quickViewProduct.sku)
      );
      if (
        liveCurrent &&
        (liveCurrent.stock !== quickViewProduct.stock ||
          liveCurrent.variants !== quickViewProduct.variants)
      ) {
        setQuickViewProduct(liveCurrent);
      }
    }
  }, [products]);

  // Sincronización al montar y escucha de eventos de actualización
  useEffect(() => {
    const handleCatalogUpdated = () => {
      refreshCatalog();
    };
    window.addEventListener('urbannoise_catalog_updated', handleCatalogUpdated);

    const handleStockDeducted = () => {
      syncLoyverseCatalog(true)
        .then((res) => {
          if (res.configured && res.items && res.items.length > 0) {
            setLoyverseItems(res.items);
            refreshCatalog(res.items);
          }
        })
        .catch(() => {});
    };
    window.addEventListener('urbannoise_stock_deducted', handleStockDeducted);

    // Actualización de stock puntual en tiempo real por prenda (desde micro-endpoint ~300ms)
    const handleProductStockUpdated = (e: any) => {
      const { productId, sku, stockMap } = e.detail || {};
      if (!stockMap) return;

      setProducts((prev) =>
        prev.map((p) => {
          if (p.id === productId || (sku && p.sku === sku)) {
            const updatedVariants = (p.variants || []).map((v) => {
              if (v.variant_id && stockMap[v.variant_id] !== undefined) {
                return { ...v, in_stock: stockMap[v.variant_id] };
              }
              return v;
            });
            const newTotalStock = updatedVariants.reduce((sum, v) => sum + (v.in_stock || 0), 0);
            return {
              ...p,
              variants: updatedVariants,
              stock: updatedVariants.length > 0 ? newTotalStock : (p.stock ?? 0),
            };
          }
          return p;
        })
      );
    };
    window.addEventListener('urbannoise_product_stock_updated', handleProductStockUpdated);

    // Descuento optimista de stock inmediato tras compra (0 ms de lag)
    const handleOptimisticDeduct = (e: any) => {
      const { items } = e.detail || {};
      if (!items || !Array.isArray(items)) return;

      setProducts((prev) =>
        prev.map((p) => {
          let hasChanges = false;
          const updatedVariants = (p.variants || []).map((v) => {
            const matchedItem = items.find(
              (it: any) =>
                (it.variantId && it.variantId === v.variant_id) ||
                (it.sku && it.sku === v.sku) ||
                (it.id && it.id === p.id)
            );
            if (matchedItem) {
              hasChanges = true;
              const newQty = Math.max(0, (v.in_stock || 0) - (Number(matchedItem.qty) || 1));
              return { ...v, in_stock: newQty };
            }
            return v;
          });

          if (hasChanges) {
            const newTotalStock = updatedVariants.reduce((sum, v) => sum + (v.in_stock || 0), 0);
            return {
              ...p,
              variants: updatedVariants,
              stock: updatedVariants.length > 0 ? newTotalStock : Math.max(0, (p.stock || 0) - 1),
            };
          }
          return p;
        })
      );
    };
    window.addEventListener('urbannoise_stock_optimistic_deduct', handleOptimisticDeduct);

    // Cargar personalizaciones almacenadas en GitHub (Cloudflare Pages y multi-dispositivo)
    loadCustomizationsFromGitHub()
      .then((hasUpdates) => {
        if (hasUpdates) refreshCatalog();
      })
      .catch(() => {});

    // Cargar contenido de portada y textos del sitio
    loadSiteContentFromRemote().catch(() => {});

    // Intentar sincronización inicial silenciosa con Loyverse POS si el backend ya tiene token
    syncLoyverseCatalog()
      .then((res) => {
        if (res.configured && res.items && res.items.length > 0) {
          setLoyverseItems(res.items);
          refreshCatalog(res.items);
        }
      })
      .catch(() => {});

    return () => {
      window.removeEventListener('urbannoise_catalog_updated', handleCatalogUpdated);
      window.removeEventListener('urbannoise_stock_deducted', handleStockDeducted);
      window.removeEventListener('urbannoise_product_stock_updated', handleProductStockUpdated);
      window.removeEventListener('urbannoise_stock_optimistic_deduct', handleOptimisticDeduct);
    };
  }, []);

  // Sync cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('urbannoise_cart', JSON.stringify(cart));
    } catch {
      // ignore
    }
  }, [cart]);

  // Scroll listener for transparent/white header
  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY || document.documentElement.scrollTop || 0;
      setIsScrolled(scrollPos > 20);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Medición dinámica y sincronización precisa de la altura del Header fijo
  useEffect(() => {
    const updateHeaderHeight = () => {
      const headerEl = document.getElementById('header-wrapper');
      if (headerEl) {
        const height = Math.round(headerEl.getBoundingClientRect().height);
        if (height > 0) {
          document.documentElement.style.setProperty('--app-header-height', `${height}px`);
        }
      }
    };

    updateHeaderHeight();
    // Reintentar en siguiente frame para garantizar renderizado de fuentes y elementos
    requestAnimationFrame(updateHeaderHeight);

    window.addEventListener('resize', updateHeaderHeight, { passive: true });

    let observer: ResizeObserver | null = null;
    const headerEl = document.getElementById('header-wrapper');
    if (headerEl && typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => {
        updateHeaderHeight();
      });
      observer.observe(headerEl);
    }

    return () => {
      window.removeEventListener('resize', updateHeaderHeight);
      if (observer) observer.disconnect();
    };
  }, []);

  // Manejo de desplazamiento suave, limpieza de hashes y control de navegación
  useEffect(() => {
    // Desactivar el salto automático del navegador a hashes antiguos o posiciones previas en recarga
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    // Comportamiento al cargar o recargar la página por primera vez:
    const hash = window.location.hash;
    const pathname = window.location.pathname.toLowerCase();
    const session = getCustomerSession();
    const isCurrentlyLoggedInAdmin = isSessionAdmin(session);

    if (
      pathname === '/cms' ||
      pathname === '/cms/' ||
      pathname === '/admin' ||
      pathname === '/admin/' ||
      hash === '#admin' ||
      hash === '#cms'
    ) {
      setIsAdminOpen(true);
      setCurrentView('home');
      try {
        if (window.location.pathname !== '/cms') {
          window.history.replaceState({ view: 'cms' }, '', '/cms');
        }
      } catch {}
    } else if (
      hash === '#cuenta' ||
      hash === '#login' ||
      hash === '#mi-cuenta' ||
      hash === '#registro' ||
      hash === '#favoritos' ||
      hash === '#wishlist' ||
      hash === '#pedidos' ||
      hash === '#orders' ||
      hash === '#perfil' ||
      hash === '#profile'
    ) {
      if (isCurrentlyLoggedInAdmin) {
        setIsAdminOpen(true);
        setCurrentView('home');
        try {
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        } catch {}
      } else {
        setIsAdminOpen(false);
        if (hash === '#favoritos' || hash === '#wishlist') {
          setAccountInitialTab('wishlist');
        } else if (hash === '#pedidos' || hash === '#orders') {
          setAccountInitialTab('orders');
        } else if (hash === '#perfil' || hash === '#profile') {
          setAccountInitialTab('profile');
        }
        pageScrollPositions.current['account'] = 0;
        setCurrentView('account');
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      }
    } else if (hash === '#404' || hash === '#not-found') {
      setCurrentView('not-found');
    } else {
      // Si la URL traía un hash de ancla de sección (#flagship, #latest-drops, etc.),
      // lo limpiamos de inmediato para que la URL esté limpia y al recargar NUNCA caiga en #flagship.
      if (hash) {
        try {
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        } catch {}
      }
      // Al recargar la tienda principal, siempre iniciar arriba del todo
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }

    const handleAnchorClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a[href^="#"]');
      if (!target) return;
      const href = target.getAttribute('href');
      if (!href) return;

      if (href === '#' || href === '#top') {
        e.preventDefault();
        try {
          if (window.location.hash) {
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
          }
        } catch {}
        pageScrollPositions.current['home'] = 0;
        if (currentViewRef.current !== 'home') {
          setCurrentView('home');
        }
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
        return;
      }

      const targetId = href.substring(1);
      if (!targetId) return;

      // Si es un enlace a modales o vistas especiales, permitir que sus manejadores específicos lo gestionen
      const specialTargets = [
        'cuenta',
        'login',
        'registro',
        'mi-cuenta',
        'favoritos',
        'wishlist',
        'pedidos',
        'orders',
        'perfil',
        'profile',
        'admin',
        'cms',
      ];
      if (specialTargets.includes(targetId)) {
        return;
      }

      e.preventDefault();

      // Limpiar hash de vista de la URL si se navega a una sección
      try {
        if (window.location.hash) {
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
      } catch {}

      // Si no estamos en home, cambiar a home para que la sección exista en el DOM
      const isAwayFromHome = currentViewRef.current !== 'home';
      if (isAwayFromHome) {
        setCurrentView('home');
      }

      const scrollToElement = (attempt = 0) => {
        let targetEl = document.getElementById(targetId);
        if (!targetEl) {
          if (targetId === 'willy' || targetId === 'young-free') {
            targetEl =
              document.getElementById('young-free') ||
              document.getElementById('willy') ||
              document.getElementById('willy-products');
          } else if (targetId === 'pleasures' || targetId === 'weird-oversize') {
            targetEl =
              document.getElementById('weird-oversize') ||
              document.getElementById('pleasures') ||
              document.getElementById('pleasures-products');
          } else if (targetId === 'avavav' || targetId === 'dama-oversize') {
            targetEl =
              document.getElementById('dama-oversize') ||
              document.getElementById('avavav') ||
              document.getElementById('avavav-products');
          }
        }

        if (targetEl) {
          const headerEl = document.getElementById('header-wrapper');
          // Altura exacta del contenedor fijo del header
          const headerHeight = headerEl ? Math.round(headerEl.getBoundingClientRect().height) : 96;
          const targetPos = targetEl.getBoundingClientRect().top + window.pageYOffset;

          // Alinear al ras inferior del header con compensación
          const offsetPosition = Math.max(0, Math.ceil(targetPos - headerHeight + 2));

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth',
          });
        } else if (attempt < 8) {
          // Si el componente aún está montándose tras cambiar de vista, reintentar progresivamente
          setTimeout(() => scrollToElement(attempt + 1), 60);
        }
      };

      setTimeout(() => {
        scrollToElement(0);
      }, isAwayFromHome ? 60 : 0);
    };

    const handlePopState = () => {
      // 1. Sincronización de modal de prenda al navegar Atrás / Adelante
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const targetParam = searchParams.get('product') || searchParams.get('p') || searchParams.get('sku');
        if (targetParam) {
          const cleanTarget = targetParam.trim().toLowerCase();
          const found = productsRef.current.find(
            (p) =>
              (p.sku && p.sku.toLowerCase() === cleanTarget) ||
              (p.id && p.id.toLowerCase() === cleanTarget)
          );
          if (found && found.isPublished !== false && found.images && found.images.length > 0) {
            setQuickViewProduct(found);
            try {
              document.title = `${found.name} | URBANNOISE`;
            } catch {}
          }
        } else {
          // Si el usuario presionó Atrás y ya no hay parámetro de producto en la URL, cerrar modal
          setQuickViewProduct(null);
          try {
            document.title = 'URBANNOISE | Streetwear Oficial Colombia';
          } catch {}
        }
      } catch {}

      // 2. Navegación de vistas por pathname y hash
      const currentPath = window.location.pathname.toLowerCase();
      if (
        currentPath === '/cms' ||
        currentPath === '/cms/' ||
        currentPath === '/admin' ||
        currentPath === '/admin/' ||
        window.location.hash === '#admin' ||
        window.location.hash === '#cms'
      ) {
        setIsAdminOpen(true);
        setCurrentView('home');
      } else if (
        window.location.hash === '#cuenta' ||
        window.location.hash === '#login' ||
        window.location.hash === '#mi-cuenta' ||
        window.location.hash === '#registro' ||
        window.location.hash === '#favoritos' ||
        window.location.hash === '#wishlist' ||
        window.location.hash === '#pedidos' ||
        window.location.hash === '#orders' ||
        window.location.hash === '#perfil' ||
        window.location.hash === '#profile'
      ) {
        setQuickViewProduct(null);
        const s = getCustomerSession();
        const isCurrentlyLoggedInAdmin = isSessionAdmin(s);
        if (isCurrentlyLoggedInAdmin) {
          setIsAdminOpen(true);
          setCurrentView('home');
        } else {
          setIsAdminOpen(false);
          const h = window.location.hash;
          if (h === '#favoritos' || h === '#wishlist') {
            setAccountInitialTab('wishlist');
          } else if (h === '#pedidos' || h === '#orders') {
            setAccountInitialTab('orders');
          } else if (h === '#perfil' || h === '#profile') {
            setAccountInitialTab('profile');
          }
          pageScrollPositions.current['account'] = 0;
          setCurrentView('account');
          window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
          requestAnimationFrame(() => {
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
          });
        }
      } else if (window.location.hash === '#404' || window.location.hash === '#not-found') {
        setCurrentView('not-found');
      } else if (!window.location.hash) {
        if (currentViewRef.current === 'account' || currentViewRef.current === 'not-found') {
          setCurrentView('home');
        }
      }
    };

    const handleWishlistAuthRedirect = () => {
      handleCloseProduct(true);
      setIsAdminOpen(false);
      setAccountInitialTab('wishlist');
      pageScrollPositions.current['account'] = 0;
      setCurrentView('account');
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      });
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    window.addEventListener('urbannoise_require_auth_wishlist', handleWishlistAuthRedirect);
    document.addEventListener('click', handleAnchorClick);
    return () => {
      document.removeEventListener('click', handleAnchorClick);
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
      window.removeEventListener('urbannoise_require_auth_wishlist', handleWishlistAuthRedirect);
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const handleAddToCart = (
    product: Product,
    size: ProductSize,
    qty: number = 1,
    color?: string,
    variantId?: string,
    sku?: string
  ) => {
    setCart((prev) => {
      const itemColor = color || product.color || '';
      const index = prev.findIndex(
        (item) =>
          item.product.id === product.id &&
          item.size === size &&
          (item.color || '') === itemColor
      );
      if (index > -1) {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          qty: updated[index].qty + qty,
          variantId: variantId || updated[index].variantId,
          sku: sku || updated[index].sku,
        };
        return updated;
      }
      return [
        ...prev,
        {
          product,
          size,
          color: itemColor || undefined,
          qty,
          variantId: variantId || product.loyverseVariantId,
          sku: sku || product.sku,
        },
      ];
    });
    const colorLabel = color ? ` • Color ${color}` : '';
    showToast(`Agregado: ${product.name} (Talla ${size}${colorLabel})`);
    setIsCartOpen(true);
    trackEvent('add_to_cart', {
      item_id: product.id,
      item_name: product.name,
      price: product.price,
      size,
      color,
      quantity: qty,
    });
  };

  const handleUpdateQty = (productId: string, size: string, delta: number, color?: string) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          const matchProduct = item.product.id === productId;
          const matchSize = item.size === size;
          const matchColor = color === undefined || (item.color || '') === color;
          if (matchProduct && matchSize && matchColor) {
            const newQty = item.qty + delta;
            return newQty > 0 ? { ...item, qty: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const handleRemoveItem = (productId: string, size: string, color?: string) => {
    setCart((prev) =>
      prev.filter((item) => {
        const matchProduct = item.product.id === productId;
        const matchSize = item.size === size;
        const matchColor = color === undefined || (item.color || '') === color;
        return !(matchProduct && matchSize && matchColor);
      })
    );
  };

  const totalCartCount = cart.reduce((acc, item) => acc + item.qty, 0);

  // Solo prendas publicadas, con fotos personalizadas del CMS y con stock > 0
  const availableProducts = useMemo(
    () =>
      products.filter(
        (p) =>
          p.isPublished !== false &&
          (p.stock || 0) > 0 &&
          p.isAvailable !== false &&
          Boolean(p.image && p.images && p.images.length > 0)
      ),
    [products]
  );

  const latestDrops = useMemo(
    () => availableProducts.filter((p) => p.category === 'latest-drops'),
    [availableProducts]
  );

  // Vitrina Principal de Portada (Lanzamientos / Prendas Estrella):
  // 1. Prendas fijadas con ⭐ en el CMS en su orden exacto de prioridad (#1, #2...)
  // 2. Seguidas por las novedades de 'latest-drops' no duplicadas
  const homeFeaturedProducts = useMemo(() => {
    if (!featuredSkus || featuredSkus.length === 0) {
      return latestDrops;
    }

    const starred: Product[] = [];
    const addedIds = new Set<string>();

    // Buscar prendas fijadas por SKU o por ID en todo el inventario disponible
    for (const skuOrId of featuredSkus) {
      if (!skuOrId) continue;
      const clean = String(skuOrId).trim().toLowerCase();
      const found = availableProducts.find(
        (p) =>
          (p.sku && p.sku.toLowerCase() === clean) ||
          (p.id && p.id.toLowerCase() === clean)
      );
      if (found && !addedIds.has(found.id)) {
        starred.push(found);
        addedIds.add(found.id);
      }
    }

    // Agregar el resto de últimas novedades que no estén ya fijadas como estrellas
    const remainingDrops = latestDrops.filter((p) => !addedIds.has(p.id));
    return [...starred, ...remainingDrops];
  }, [featuredSkus, availableProducts, latestDrops]);
  const youngFree = useMemo(
    () => availableProducts.filter((p) => p.category === 'young-free'),
    [availableProducts]
  );
  const weirdOversize = useMemo(
    () => availableProducts.filter((p) => p.category === 'weird-oversize'),
    [availableProducts]
  );
  const damaOversize = useMemo(
    () => availableProducts.filter((p) => p.category === 'dama-oversize'),
    [availableProducts]
  );

  const dynamicCategoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: availableProducts.length };
    availableProducts.forEach((p) => {
      const cat = p.category || 'latest-drops';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [availableProducts]);

  // Si la tienda está protegida por modo construcción, renderizar la puerta de acceso
  if (!isSiteUnlocked) {
    return <ConstructionGate onUnlock={() => setIsSiteUnlocked(true)} />;
  }

  return (
    <div className="min-h-screen bg-white text-[#101013] font-sans antialiased selection:bg-[#101013] selection:text-[#F5F2E4]">
      {/* Contenedor Fijo Unificado: Agrupa el banner de flash drop, la barra de anuncios y la cabecera */}
      <div id="header-wrapper" className="fixed top-0 inset-x-0 z-40 transition-all duration-300">
        <CountdownBanner
          onCtaClick={(anchor) => {
            const clean = (anchor || '#latest-drops').replace('#', '');
            const el = document.getElementById(clean);
            if (el) {
              const headerEl = document.getElementById('header-wrapper');
              const headerHeight = headerEl ? Math.round(headerEl.getBoundingClientRect().height) : 96;
              const targetPos = el.getBoundingClientRect().top + window.pageYOffset;
              window.scrollTo({ top: Math.max(0, targetPos - headerHeight + 2), behavior: 'smooth' });
            } else {
              handleOpenMarketplace('latest-drops');
            }
          }}
        />
        <AnnouncementBar
          isScrolled={isScrolled}
          isSolid={currentView === 'marketplace' || currentView === 'account'}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenHelp={() =>
            showToast('Asistencia directa por WhatsApp: (+57) 310 872 0491')
          }
          onOpenPolicies={handleOpenPolicies}
          onOpenMarketplace={() => handleOpenMarketplace('all')}
        />
        <Header
          isScrolled={isScrolled}
          isSolid={currentView === 'marketplace' || currentView === 'account'}
          currentCategory={currentView === 'marketplace' ? marketplaceCategory : undefined}
          cartCount={totalCartCount}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenAccount={handleOpenAccount}
          onOpenAdmin={() => setIsAdminOpen(true)}
          onOpenCart={() => setIsCartOpen(true)}
          onOpenMarketplace={handleOpenMarketplace}
          onGoHome={handleLogoClick}
        />
      </div>

      {/* RENDERIZADO CONDICIONAL DE VISTAS: 404 vs CUENTA vs MARKETPLACE vs TIENDA PRINCIPAL */}
      {currentView === 'not-found' ? (
        <NotFoundView
          onBackToHome={() => handleBackToHome(true)}
          onOpenSearch={() => setIsSearchOpen(true)}
        />
      ) : currentView === 'account' ? (
        <ErrorBoundary
          fallbackTitle="Portal de Clientes URBANNOISE"
          onReset={() => handleBackToHome(true)}
        >
          <AccountView
            onBackToHome={() => handleBackToHome(true)}
            onOpenAdmin={() => setIsAdminOpen(true)}
            onOpenCatalog={() => handleOpenMarketplace('all')}
            products={availableProducts}
            onAddToCart={handleAddToCart}
            onQuickView={handleOpenProduct}
            initialTab={accountInitialTab}
          />
        </ErrorBoundary>
      ) : currentView === 'marketplace' ? (
        <CategoryMarketplaceView
          products={availableProducts}
          initialCategory={marketplaceCategory}
          onBackToHome={() => handleBackToHome(true)}
          onQuickView={handleOpenProduct}
          onAddToCart={handleAddToCart}
          onProceedToCheckout={() => {
            setIsCheckoutOpen(true);
          }}
        />
      ) : (
        <>
          {homeBlocks.map((block) => {
            if (block.enabled === false) return null;

            switch (block.id) {
              case 'hero':
                return (
                  <HeroSection
                    key="hero"
                    onCtaClick={(anchor) => {
                      const clean = (anchor || '').replace('#', '');
                      if (clean === 'flagship' || clean === 'brand-manifesto') {
                        const el = document.getElementById(clean);
                        if (el) {
                          const headerEl = document.getElementById('header-wrapper');
                          const headerHeight = headerEl ? Math.round(headerEl.getBoundingClientRect().height) : 96;
                          const targetPos = el.getBoundingClientRect().top + window.pageYOffset;
                          window.scrollTo({ top: Math.max(0, targetPos - headerHeight + 2), behavior: 'smooth' });
                          return;
                        }
                      }
                      handleOpenMarketplace(clean || 'all');
                    }}
                  />
                );

              case 'categories':
                return (
                  <CategoryVisualHub
                    key="categories"
                    onSelectCategory={handleOpenMarketplace}
                    categoryCounts={dynamicCategoryCounts}
                  />
                );

              case 'latest-drops':
                return (
                  <section
                    key="latest-drops"
                    id="latest-drops"
                    className="w-full border-b border-[#E5E5E5] bg-white pt-4 sm:pt-6 md:pt-8 pb-10 sm:pb-16 scroll-mt-[84px] sm:scroll-mt-[100px]"
                  >
                    <ProductCarousel
                      id="latest-drops-carousel"
                      kicker={siteSections.latestDropsKicker || 'DROP EXCLUSIVO 2026'}
                      title={siteSections.latestDropsTitle || 'ÚLTIMOS LANZAMIENTOS'}
                      products={homeFeaturedProducts}
                      featuredSkus={featuredSkus}
                      onQuickView={handleOpenProduct}
                      onViewAll={() => handleOpenMarketplace('latest-drops')}
                    />
                  </section>
                );

              case 'young-free':
                return (
                  <React.Fragment key="young-free">
                    <section
                      id="young-free"
                      className="relative w-full h-screen h-[100dvh] min-h-[100dvh] bg-[#101013] text-white flex items-center justify-center text-center overflow-hidden px-6 border-b border-white/10 scroll-mt-[84px] sm:scroll-mt-[100px]"
                    >
                      <span id="willy" className="absolute top-0 pointer-events-none opacity-0 -translate-y-24" aria-hidden="true" />
                      <img
                        src="https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=2000&auto=format&fit=crop"
                        alt="Cápsula Young and Free URBANNOISE - Streetwear oversize juvenil y siluetas auténticas confeccionadas en Bogotá"
                        className="absolute inset-0 w-full h-full object-cover opacity-50 filter contrast-125"
                        loading="lazy"
                        decoding="async"
                      />
                      <div className="absolute inset-0 bg-black/35 pointer-events-none" />
                      <div className="relative z-10 max-w-3xl my-auto py-8">
                        <p className="text-[11px] sm:text-xs uppercase tracking-[0.25em] text-[#D9C4AB] mb-2 sm:mb-3 font-semibold">
                          URBANO Y AUDAZ • TALLAS S-XL
                        </p>
                        <h2 className="font-extrabold text-3xl sm:text-6xl md:text-7xl uppercase tracking-tight mb-5 sm:mb-7 leading-none text-[#F5F2E4]">
                          CÁPSULA{' '}
                          <span className="font-light italic tracking-normal lowercase text-3xl sm:text-6xl text-[#D9C4AB]">
                            young & free
                          </span>
                          <br />
                          URBANNOISE
                        </h2>
                        <a
                          href="#willy-products"
                          className="inline-block bg-[#F5F2E4] text-[#101013] font-bold text-[11px] sm:text-xs uppercase tracking-widest px-8 sm:px-10 py-3.5 sm:py-4 hover:bg-[#101013] hover:text-[#F5F2E4] transition border border-[#F5F2E4] shadow-lg"
                        >
                          EXPLORAR CÁPSULA ↓
                        </a>
                      </div>
                    </section>
                    <section
                      id="willy-products"
                      className="w-full bg-white border-b border-[#E5E5E5] pt-4 sm:pt-6 md:pt-8 pb-10 sm:pb-16 scroll-mt-[84px] sm:scroll-mt-[100px]"
                    >
                      <ProductCarousel
                        id="willy-carousel"
                        kicker={siteSections.youngFreeKicker || 'CÁPSULA ESTELAR'}
                        title={siteSections.youngFreeTitle || 'YOUNG & FREE'}
                        products={youngFree}
                        onQuickView={handleOpenProduct}
                        onViewAll={() => handleOpenMarketplace('young-free')}
                      />
                    </section>
                  </React.Fragment>
                );

              case 'weird-oversize':
                return (
                  <React.Fragment key="weird-oversize">
                    <section
                      id="weird-oversize"
                      className="relative w-full h-screen h-[100dvh] min-h-[100dvh] bg-[#202F3D] text-white flex items-center justify-center text-center overflow-hidden px-6 border-b border-white/10 scroll-mt-[84px] sm:scroll-mt-[100px]"
                    >
                      <span id="pleasures" className="absolute top-0 pointer-events-none opacity-0 -translate-y-24" aria-hidden="true" />
                      <img
                        src="https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=2000&auto=format&fit=crop"
                        alt="Edición Weird Boxy y Pleasures URBANNOISE - Camisetas de alto gramaje y corte holgado en Colombia"
                        className="absolute inset-0 w-full h-full object-cover opacity-50"
                        loading="lazy"
                        decoding="async"
                      />
                      <div className="absolute inset-0 bg-black/40 pointer-events-none" />
                      <div className="relative z-10 max-w-3xl my-auto py-8">
                        <p className="text-[11px] sm:text-xs uppercase tracking-[0.25em] text-[#D9C4AB] mb-2 sm:mb-3 font-semibold">
                          INNOVACIÓN TEXTIL URBANA
                        </p>
                        <h2 className="font-extrabold text-3xl sm:text-6xl md:text-7xl uppercase tracking-tight mb-5 sm:mb-7 text-[#F5F2E4]">
                          <span className="font-light italic tracking-normal">PLEASURES</span>
                          <br />
                          SPECIAL DROP
                        </h2>
                        <a
                          href="#pleasures-products"
                          className="inline-block bg-[#F5F2E4] text-[#101013] font-bold text-[11px] sm:text-xs uppercase tracking-widest px-8 sm:px-10 py-3.5 sm:py-4 hover:bg-[#101013] hover:text-[#F5F2E4] transition border border-[#F5F2E4] shadow-lg"
                        >
                          VER PRENDAS ↓
                        </a>
                      </div>
                    </section>
                    <section
                      id="pleasures-products"
                      className="w-full bg-white border-b border-[#E5E5E5] pt-4 sm:pt-6 md:pt-8 pb-10 sm:pb-16 scroll-mt-[84px] sm:scroll-mt-[100px]"
                    >
                      <ProductCarousel
                        id="pleasures-carousel"
                        kicker={siteSections.weirdOversizeKicker || 'SPECIAL OVERSIZE'}
                        title={siteSections.weirdOversizeTitle || 'PLEASURES & WEIRD BOXY'}
                        products={weirdOversize}
                        onQuickView={handleOpenProduct}
                        onViewAll={() => handleOpenMarketplace('weird-oversize')}
                      />
                    </section>
                  </React.Fragment>
                );

              case 'dama-oversize':
                return (
                  <React.Fragment key="dama-oversize">
                    <section
                      id="dama-oversize"
                      className="relative w-full h-screen h-[100dvh] min-h-[100dvh] bg-[#1E342A] text-white flex items-center justify-center text-center overflow-hidden px-6 border-b border-white/10 scroll-mt-[84px] sm:scroll-mt-[100px]"
                    >
                      <span id="avavav" className="absolute top-0 pointer-events-none opacity-0 -translate-y-24" aria-hidden="true" />
                      <img
                        src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=2000&auto=format&fit=crop"
                        alt="Colección Dama Oversize URBANNOISE - Moda urbana femenina y estampados streetwear únicos en Bogotá"
                        className="absolute inset-0 w-full h-full object-cover opacity-50"
                        loading="lazy"
                        decoding="async"
                      />
                      <div className="absolute inset-0 bg-black/40 pointer-events-none" />
                      <div className="relative z-10 max-w-3xl my-auto py-8">
                        <p className="text-[11px] sm:text-xs uppercase tracking-[0.25em] text-[#D9C4AB] mb-2 sm:mb-3 font-semibold">
                          COLECCIÓN DAMA OVERSIZE
                        </p>
                        <h2 className="font-extrabold text-3xl sm:text-6xl md:text-7xl uppercase tracking-tight mb-5 sm:mb-7 text-[#F5F2E4]">
                          <span className="font-light italic tracking-normal lowercase text-2xl sm:text-5xl">
                            estampados únicos
                          </span>
                          <br />
                          ESTILO ÚNICO
                        </h2>
                        <a
                          href="#avavav-products"
                          className="inline-block bg-[#F5F2E4] text-[#101013] font-bold text-[11px] sm:text-xs uppercase tracking-widest px-8 sm:px-10 py-3.5 sm:py-4 hover:bg-[#101013] hover:text-[#F5F2E4] transition border border-[#F5F2E4] shadow-lg"
                        >
                          VER COLECCIÓN DAMA ↓
                        </a>
                      </div>
                    </section>
                    <section
                      id="avavav-products"
                      className="w-full bg-white border-b border-[#E5E5E5] pt-4 sm:pt-6 md:pt-8 pb-10 sm:pb-16 scroll-mt-[84px] sm:scroll-mt-[100px]"
                    >
                      <ProductCarousel
                        id="avavav-carousel"
                        kicker={siteSections.damaOversizeKicker || 'CÁPSULA FEMENINA'}
                        title={siteSections.damaOversizeTitle || 'DAMA OVERSIZE'}
                        products={damaOversize}
                        onQuickView={handleOpenProduct}
                        onViewAll={() => handleOpenMarketplace('dama-oversize')}
                      />
                    </section>
                  </React.Fragment>
                );

              case 'flagship':
                return (
                  <FlagshipSection
                    key="flagship"
                    showStore={true}
                    showManifesto={homeBlocks.some((b) => b.id === 'manifesto' && b.enabled !== false)}
                  />
                );

              case 'manifesto':
                // Si flagship ya está activo, FlagshipSection maneja ambas columnas.
                // Si flagship está desactivado, renderizamos solo el manifiesto:
                if (homeBlocks.some((b) => b.id === 'flagship' && b.enabled !== false)) {
                  return null;
                }
                return (
                  <FlagshipSection
                    key="manifesto"
                    showStore={false}
                    showManifesto={true}
                  />
                );

              case 'seo':
                return <SeoEditorialSection key="seo" />;

              default:
                return null;
            }
          })}
        </>
      )}

      {/* Sección 10: Footer & Newsletter */}
      <div id="footer-section">
        <Footer
          onNotify={(msg) => showToast(msg)}
          onOpenPolicies={handleOpenPolicies}
        />
      </div>

      {/* Modales y Drawers */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQty={handleUpdateQty}
        onRemoveItem={handleRemoveItem}
        onAddToCart={handleAddToCart}
        onOpenCatalog={() => handleOpenMarketplace('all')}
        onProceedToCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
      />

      {quickViewProduct && (
        <ErrorBoundary
          key={quickViewProduct.id || quickViewProduct.sku}
          fallbackTitle="Error al abrir prenda"
          onReset={handleCloseProduct}
        >
          <QuickViewModal
            product={quickViewProduct}
            onClose={handleCloseProduct}
            onAddToCart={handleAddToCart}
            cartCount={totalCartCount}
            onOpenCart={() => setIsCartOpen(true)}
            onProceedToCheckout={() => {
              handleCloseProduct();
              setIsCheckoutOpen(true);
            }}
            onSelectProduct={handleOpenProduct}
          />
        </ErrorBoundary>
      )}

      <CheckoutView
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cart={cart}
        onClearCart={() => setCart([])}
        onOpenPolicies={handleOpenPolicies}
      />

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectProduct={handleOpenProduct}
        products={availableProducts}
      />

      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        onOpenAccount={() => {
          setIsMobileMenuOpen(false);
          handleOpenAccount();
        }}
        onOpenWishlist={() => {
          setIsMobileMenuOpen(false);
          handleOpenWishlist();
        }}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenPolicies={handleOpenPolicies}
        onOpenMarketplace={handleOpenMarketplace}
        onGoHome={handleLogoClick}
      />

      <AdminPanel
        isOpen={isAdminOpen}
        onClose={() => {
          setIsAdminOpen(false);
          try {
            if (
              window.location.pathname === '/cms' ||
              window.location.pathname === '/cms/' ||
              window.location.pathname.startsWith('/admin')
            ) {
              window.history.pushState(null, '', '/');
            }
          } catch {}
          if (currentView === 'account') {
            handleBackToHome(true);
          }
        }}
        products={products}
        onCatalogUpdated={() => refreshCatalog()}
        onLogout={() => {
          setIsAdminOpen(false);
          clearAllAdminSessions();
          try {
            if (
              window.location.pathname === '/cms' ||
              window.location.pathname === '/cms/' ||
              window.location.pathname.startsWith('/admin')
            ) {
              window.history.pushState(null, '', '/');
            }
          } catch {}
          handleBackToHome(true);
        }}
      />

      <LegalPoliciesModal
        isOpen={isPoliciesOpen}
        onClose={() => setIsPoliciesOpen(false)}
        initialTab={policiesInitialTab}
      />

      <CookieBanner onOpenPolicies={handleOpenPolicies} />

      {/* Botón Flotante Oficial de WhatsApp */}
      <FloatingWhatsApp />

      <Toast message={toastMessage} />
    </div>
  );
}
