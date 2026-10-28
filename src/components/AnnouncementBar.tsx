import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { AnnouncementContent } from '../types';
import { getStoredSiteContent } from '../lib/siteContent';

interface AnnouncementBarProps {
  isScrolled: boolean;
  isSolid?: boolean;
  onOpenSearch: () => void;
  onOpenHelp: () => void;
  onOpenPolicies?: (tabId?: string) => void;
  onOpenMarketplace?: () => void;
  announcements?: AnnouncementContent;
}

export const AnnouncementBar: React.FC<AnnouncementBarProps> = ({
  isScrolled,
  isSolid = false,
  onOpenSearch,
  onOpenHelp,
  onOpenPolicies,
  onOpenMarketplace,
  announcements: propAnnouncements,
}) => {
  const [announcements, setAnnouncements] = useState<AnnouncementContent>(() => {
    return propAnnouncements || getStoredSiteContent().announcements || {};
  });

  useEffect(() => {
    if (propAnnouncements) {
      setAnnouncements(propAnnouncements);
      return;
    }
    const handler = (e: any) => {
      if (e.detail?.announcements) {
        setAnnouncements(e.detail.announcements);
      }
    };
    window.addEventListener('urbannoise_site_content_updated', handler);
    return () => window.removeEventListener('urbannoise_site_content_updated', handler);
  }, [propAnnouncements]);

  const isLightMode = isScrolled && !isSolid;
  const leftTag = announcements?.leftTag || 'COP | $';
  const leftSub = announcements?.leftSub || 'Envíos a toda Colombia • Tallas S - XL';
  const marquee =
    announcements?.marqueeText ||
    'DESPACHO DE CORTESÍA POR COMPRAS DESDE $150.000 COP • ENVÍOS A TODA COLOMBIA • PAGOS 100% SEGUROS Y PSE';
  const desktopText =
    announcements?.desktopText ||
    'DESPACHO DE CORTESÍA EN BOGOTÁ Y COLOMBIA POR COMPRAS DESDE $150.000 COP • ';
  const desktopCta = announcements?.desktopCta || 'VER CATÁLOGO →';

  return (
    <div
      id="top-announcement-bar"
      className={`w-full text-[9px] sm:text-[11px] font-semibold tracking-widest uppercase border-b transition-all duration-300 ${
        isLightMode
          ? 'bg-white border-[#E5E5E5] text-[#101013]'
          : 'bg-[#101013] border-white/10 text-[#F5F2E4]'
      }`}
    >
      <div className="max-w-[1720px] mx-auto px-3 sm:px-8 py-1.5 sm:py-2 flex items-center justify-between overflow-hidden">
        <div className="flex-shrink-0 flex items-center space-x-2 pr-2.5 sm:pr-0 border-r border-current/20 sm:border-r-0">
          <span className="font-extrabold tracking-wider text-[8.5px] sm:text-[10px]">{leftTag}</span>
          <span className="hidden sm:inline opacity-40">•</span>
          <span className="hidden sm:inline font-normal opacity-90 text-[10px]">
            {leftSub}
          </span>
        </div>

        {/* Marquesina móvil fluida en constante movimiento & ticker central en desktop */}
        <div
          onClick={() => onOpenMarketplace?.()}
          className="flex-1 overflow-hidden relative mx-2 sm:mx-6 flex items-center justify-center cursor-pointer hover:opacity-85 transition"
        >
          {/* Versión Móvil: Marquesina fluida continua sin cortes ni elipsis */}
          <div className="animate-marquee whitespace-nowrap text-[8.5px] font-semibold tracking-wider sm:hidden">
            <span className="mx-4 inline-block">{marquee}</span>
            <span className="mx-4 inline-block">{marquee}</span>
          </div>

          {/* Versión PC / Tablet: Mensaje centrado nítido */}
          <div className="hidden sm:block text-center font-semibold truncate text-[10.5px] tracking-[0.14em]">
            {desktopText}
            {desktopCta && <span className="underline font-bold">{desktopCta}</span>}
          </div>
        </div>

        <div className="hidden md:flex items-center space-x-4 text-[10px] opacity-90 flex-shrink-0">
          <button
            onClick={() => onOpenPolicies?.('cambios-garantias')}
            className="hover:opacity-75 transition cursor-pointer uppercase font-semibold"
          >
            Garantías (60 Días)
          </button>
          <a
            href="#flagship"
            className="hover:opacity-75 transition cursor-pointer"
          >
            Tienda Bogotá (El GranSan)
          </a>
          <button
            onClick={onOpenHelp}
            className="hover:opacity-75 transition cursor-pointer uppercase font-semibold"
          >
            Ayuda
          </button>
          <button
            onClick={onOpenSearch}
            className="hover:opacity-75 transition flex items-center space-x-1 cursor-pointer"
          >
            <Search className="w-3 h-3" />
            <span>Buscar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
