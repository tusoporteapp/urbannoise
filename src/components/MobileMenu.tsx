import React, { useState, useEffect } from 'react';
import { X, MessageCircle, User, Scale, ShoppingBag, LayoutGrid, Heart } from 'lucide-react';
import { getActiveCategories, getStoredSiteContent } from '../lib/siteContent';
import { CategoryCardContent, FlagshipContent } from '../types';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAccount?: () => void;
  onOpenWishlist?: () => void;
  onOpenAdmin?: () => void;
  onOpenPolicies?: (tabId?: string) => void;
  onOpenMarketplace?: (category?: string) => void;
  onGoHome?: () => void;
}

export const MobileMenu: React.FC<MobileMenuProps> = ({
  isOpen,
  onClose,
  onOpenAccount,
  onOpenWishlist,
  onOpenAdmin,
  onOpenPolicies,
  onOpenMarketplace,
  onGoHome,
}) => {
  const [navCategories, setNavCategories] = useState<CategoryCardContent[]>(() => getActiveCategories());
  const [flagship, setFlagship] = useState<FlagshipContent>(() => getStoredSiteContent().flagship || {});

  useEffect(() => {
    const handleContentUpdate = (e: any) => {
      if (e.detail?.categories) {
        const cats: CategoryCardContent[] = e.detail.categories;
        setNavCategories(
          cats
            .filter((c) => c.enabled !== false)
            .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
        );
      }
      if (e.detail?.flagship) {
        setFlagship(e.detail.flagship);
      }
    };
    window.addEventListener('urbannoise_site_content_updated', handleContentUpdate);
    return () => window.removeEventListener('urbannoise_site_content_updated', handleContentUpdate);
  }, []);

  const whatsappNumber = flagship.whatsappNumber || '(+57) 310 872 0491';
  const cleanPhone = whatsappNumber.replace(/\D/g, '') || '573108720491';
  const storeAddress = flagship.address || 'Cra 10 # 9-37 Local 23-54, Bogotá';

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/60 z-50 transition-opacity duration-300 backdrop-blur-sm ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Slide drawer from left */}
      <div
        id="mobile-menu"
        className={`fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-[#101013] text-[#F5F2E4] z-50 transition-transform duration-300 p-6 flex flex-col justify-between shadow-2xl overflow-y-auto overscroll-contain ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          <div className="flex items-center justify-between pb-6 border-b border-white/10 mb-6">
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onGoHome) onGoHome();
                else window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
              }}
              className="text-lg font-extrabold tracking-tight uppercase hover:text-[#D9C4AB] transition text-left cursor-pointer"
              aria-label="Ir al inicio - URBANNOISE"
            >
              URBANNOISE
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:opacity-60 transition cursor-pointer"
              aria-label="Cerrar menú"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="space-y-3.5 text-sm font-bold uppercase tracking-wider">
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onOpenMarketplace) onOpenMarketplace('all');
              }}
              className="w-full py-2.5 px-3 bg-[#F5F2E4] text-[#101013] text-left text-xs font-black uppercase tracking-wider rounded flex items-center justify-between transition cursor-pointer shadow-md mb-2"
            >
              <div className="flex items-center space-x-2">
                <LayoutGrid className="w-4 h-4 text-[#101013]" />
                <span>CATÁLOGO COMPLETO</span>
              </div>
              <span className="text-[9.5px] bg-[#101013] text-[#F5F2E4] px-1.5 py-0.5 rounded font-mono">VER TODO</span>
            </button>

            {navCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenMarketplace) onOpenMarketplace(cat.id);
                }}
                className="block w-full text-left hover:text-[#D9C4AB] transition cursor-pointer"
              >
                {cat.mobileTitle || cat.name}
              </button>
            ))}
            <a
              href="#flagship"
              onClick={onClose}
              className="block hover:text-[#D9C4AB] transition"
            >
              TIENDA BOGOTÁ (GRANSAN)
            </a>

            <div className="pt-3 border-t border-white/10 space-y-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenWishlist) onOpenWishlist();
                  else if (onOpenAccount) onOpenAccount();
                }}
                className="w-full py-2.5 px-3 bg-white/10 hover:bg-white text-left text-xs font-bold uppercase tracking-wider text-[#F5F2E4] hover:text-[#101013] rounded flex items-center justify-between transition cursor-pointer"
              >
                <div className="flex items-center space-x-2">
                  <Heart className="w-4 h-4 text-red-400" />
                  <span>LISTA DE DESEOS / FAVORITOS</span>
                </div>
                <span className="text-[10px] text-white/50 font-mono">GUARDADOS</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenAccount) onOpenAccount();
                  else if (onOpenAdmin) onOpenAdmin();
                }}
                className="w-full py-2.5 px-3 bg-white/10 hover:bg-white text-left text-xs font-bold uppercase tracking-wider text-[#F5F2E4] hover:text-[#101013] rounded flex items-center justify-between transition cursor-pointer"
              >
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>MI CUENTA / INICIAR SESIÓN</span>
                </div>
                <span className="text-[10px] text-white/50 font-mono">ACCESO</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenPolicies) onOpenPolicies('terminos');
                }}
                className="w-full py-2.5 px-3 bg-white/5 hover:bg-white/15 text-left text-xs font-bold uppercase tracking-wider text-[#D9C4AB] rounded flex items-center justify-between transition cursor-pointer"
              >
                <div className="flex items-center space-x-2">
                  <Scale className="w-4 h-4 text-[#D9C4AB]" />
                  <span>POLÍTICAS & GARANTÍAS (SIC)</span>
                </div>
                <span className="text-[9px] bg-white/10 px-1.5 py-0.5 rounded text-white/70">LEGAL</span>
              </button>
            </div>
          </nav>
        </div>

        <div className="pt-6 border-t border-white/10 text-xs text-white/60 space-y-3">
          <a
            href={`https://wa.me/${cleanPhone}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 text-[#D9C4AB] font-bold hover:underline"
          >
            <MessageCircle className="w-4 h-4 text-emerald-400" />
            <span>WhatsApp: {whatsappNumber}</span>
          </a>
          <p>{storeAddress}</p>
          <p className="text-[10px] text-white/40">Despachos diarios a toda Colombia • Tienda Oficial Bogotá</p>
        </div>
      </div>
    </>
  );
};
