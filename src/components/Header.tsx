import React, { useState, useEffect } from 'react';
import { Menu, Search, User, ShoppingBag } from 'lucide-react';
import { getCustomerSession } from '../lib/loyverse';
import { getActiveCategories } from '../lib/siteContent';
import { CategoryCardContent } from '../types';

interface HeaderProps {
  isScrolled: boolean;
  isSolid?: boolean;
  currentCategory?: string;
  cartCount: number;
  onOpenMobileMenu: () => void;
  onOpenSearch: () => void;
  onOpenAccount: () => void;
  onOpenAdmin?: () => void;
  onOpenCart: () => void;
  onOpenMarketplace?: (category?: string) => void;
  onGoHome?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isScrolled,
  isSolid = false,
  currentCategory,
  cartCount,
  onOpenMobileMenu,
  onOpenSearch,
  onOpenAccount,
  onOpenAdmin,
  onOpenCart,
  onOpenMarketplace,
  onGoHome,
}) => {
  const isLight = isScrolled || isSolid;
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => Boolean(getCustomerSession()));
  const [navCategories, setNavCategories] = useState<CategoryCardContent[]>(() => getActiveCategories());

  useEffect(() => {
    const handleAuthChange = () => {
      setIsLoggedIn(Boolean(getCustomerSession()));
    };
    const handleContentUpdate = (e: any) => {
      if (e.detail?.categories) {
        const cats: CategoryCardContent[] = e.detail.categories;
        setNavCategories(
          cats
            .filter((c) => c.enabled !== false)
            .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
        );
      }
    };
    window.addEventListener('urbannoise_customer_auth_changed', handleAuthChange);
    window.addEventListener('urbannoise_site_content_updated', handleContentUpdate);
    return () => {
      window.removeEventListener('urbannoise_customer_auth_changed', handleAuthChange);
      window.removeEventListener('urbannoise_site_content_updated', handleContentUpdate);
    };
  }, []);

  const isUserAdmin = () => {
    const s = getCustomerSession();
    if (!s) return false;
    const clean = (s.email || '').toLowerCase().trim();
    return Boolean(
      s.isAdmin ||
      clean === 'urban.noice@gmail.com' ||
      clean === 'urban.noice2023@gmail.com' ||
      clean === 'admin@urbannoise.co' ||
      clean === 'admin'
    );
  };

  return (
    <header
      id="site-header"
      className={`w-full border-b transition-all duration-300 ${
        isLight
          ? 'bg-white border-[#E5E5E5] text-[#101013] shadow-[0_4px_20px_-2px_rgba(0,0,0,0.06)]'
          : 'bg-transparent border-white/15 text-white'
      }`}
    >
      <div className="max-w-[1720px] mx-auto px-3 sm:px-8 py-2 sm:py-3.5 flex items-center justify-between relative">
        {/* Izquierda: Menú Hamburguesa + Enlaces Rápidos */}
        <div className="flex items-center space-x-2 xl:space-x-5 z-20">
          <button
            id="mobile-menu-btn"
            onClick={onOpenMobileMenu}
            className={`w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full hover:bg-black/10 active:scale-95 transition-all focus:outline-none cursor-pointer ${
              isLight ? 'text-[#101013]' : 'text-white'
            }`}
            aria-label="Abrir Menú"
          >
            <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <nav className="hidden xl:flex items-center space-x-6 text-xs font-bold uppercase tracking-wider">
            {navCategories.map((cat) => {
              const isCatActive = currentCategory === cat.id;
              const label = cat.menuTitle || cat.name;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => onOpenMarketplace ? onOpenMarketplace(cat.id) : undefined}
                  className={`transition cursor-pointer whitespace-nowrap ${
                    isLight
                      ? isCatActive
                        ? 'text-black font-black underline underline-offset-4'
                        : 'text-stone-700 hover:text-black'
                      : isCatActive
                        ? 'text-white font-black underline underline-offset-4'
                        : 'hover:opacity-75 text-white'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Centro: Logotipo Oficial URBANNOISE estrictamente centrado en toda la pantalla */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-auto z-10 max-w-[48vw] sm:max-w-none">
          <button
            type="button"
            onClick={() => {
              if (onGoHome) {
                onGoHome();
              } else {
                window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
              }
            }}
            className="inline-flex flex-col items-center group max-w-full px-1 py-0.5 rounded-lg active:opacity-80 transition cursor-pointer"
            aria-label="Ir al inicio - URBANNOISE"
          >
            <h1 className="text-[15px] xs:text-[18px] sm:text-2xl md:text-3xl font-black tracking-[-0.03em] uppercase leading-none font-sans truncate max-w-full">
              <span className={isLight ? 'text-[#101013]' : 'text-white'}>URBANNOISE</span>
            </h1>
            <p
              className={`text-[6.5px] xs:text-[7.5px] sm:text-[9.5px] font-semibold tracking-[0.12em] sm:tracking-[0.22em] uppercase mt-0.5 sm:mt-1 text-center transition-colors truncate max-w-full ${
                isLight ? 'text-[#666666]' : 'text-white/80'
              }`}
            >
              <span className="hidden xs:inline">MODA URBANA • </span>BOGOTÁ
            </p>
          </button>
        </div>

        {/* Derecha: 3 Iconos Optimizados (Cápsula Ergonómica Compacta en Móvil & Espaciada en Desktop) */}
        <div className="flex items-center z-20">
          <div
            className={`flex items-center rounded-full transition-colors p-0.5 sm:p-0 ${
              isLight
                ? 'bg-gray-100/90 border border-gray-200/90 sm:bg-transparent sm:border-0 text-[#101013]'
                : 'bg-white/10 border border-white/15 backdrop-blur-md sm:bg-transparent sm:border-0 text-white'
            } space-x-0.5 sm:space-x-2`}
          >
            <button
              id="search-btn"
              onClick={onOpenSearch}
              className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full hover:bg-current/15 active:scale-90 transition-all cursor-pointer ${
                isLight ? 'text-[#101013]' : 'text-white'
              }`}
              aria-label="Buscar"
              title="Buscar prendas"
            >
              <Search className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              id="account-btn"
              onClick={onOpenAccount}
              className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full hover:bg-current/15 active:scale-90 transition-all cursor-pointer relative ${
                isLight ? 'text-[#101013]' : 'text-white'
              }`}
              aria-label="Mi Cuenta"
              title={
                isLoggedIn
                  ? isUserAdmin()
                    ? 'Panel de Control CMS / Administrador (Sesión Activa)'
                    : 'Mi Cuenta (Sesión Activa)'
                  : 'Mi Cuenta / Iniciar Sesión'
              }
            >
              <User className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5" />
              {isLoggedIn && (
                <span
                  className={`absolute top-1 right-1 sm:top-1.5 sm:right-1.5 w-2 h-2 rounded-full ring-2 ring-white ${
                    isUserAdmin() ? 'bg-amber-400' : 'bg-emerald-500'
                  }`}
                />
              )}
            </button>

            <button
              id="cart-btn"
              onClick={onOpenCart}
              className={`relative w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full hover:bg-current/15 active:scale-90 transition-all cursor-pointer ${
                isLight ? 'text-[#101013]' : 'text-white'
              }`}
              aria-label="Carrito de compras"
              title="Ver carrito de compras"
            >
              <ShoppingBag className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5" />
              <span
                id="cart-badge"
                className={`absolute -top-1 -right-1 min-w-[15px] h-[15px] px-0.5 text-[8px] font-black rounded-full flex items-center justify-center leading-none pointer-events-none shadow-sm transition-colors ${
                  isLight
                    ? 'bg-[#101013] text-white'
                    : 'bg-white text-[#101013]'
                }`}
              >
                {cartCount}
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
