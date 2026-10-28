import React, { useState, useEffect } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { trackEvent } from '../lib/analytics';
import { getStoredSiteContent } from '../lib/siteContent';

export const FloatingWhatsApp: React.FC = () => {
  const [isTooltipDismissed, setIsTooltipDismissed] = useState(false);
  const [config, setConfig] = useState(() => getStoredSiteContent().whatsapp || {});

  useEffect(() => {
    const handler = (e: any) => {
      if (e.detail?.whatsapp) {
        setConfig(e.detail.whatsapp);
      }
    };
    window.addEventListener('urbannoise_site_content_updated', handler);
    return () => window.removeEventListener('urbannoise_site_content_updated', handler);
  }, []);

  const phoneNumber = (config.phoneNumber || '573108720491').replace(/\D/g, '');
  const tooltipText = config.tooltipText || '¿Asesoría de tallas o envíos?';
  const rawMessage =
    config.prefilledMessage ||
    'Hola URBANNOISE Bogotá, deseo asesoría sobre las prendas streetwear, tallas disponibles y despachos en Colombia.';
  const prefilledMessage = encodeURIComponent(rawMessage);
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${prefilledMessage}`;

  const handleClick = () => {
    trackEvent('whatsapp_click', {
      source: 'floating_button',
      phone: phoneNumber,
    });
  };

  return (
    <div className="fixed bottom-5 right-5 z-40 flex items-center space-x-2 pointer-events-auto">
      {/* Tooltip Emergente */}
      {!isTooltipDismissed && (
        <div className="hidden sm:flex items-center space-x-2 bg-white text-[#101013] border border-gray-200 px-3.5 py-2 rounded-full shadow-xl text-xs font-bold animate-in fade-in slide-in-from-right-3 duration-300">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
          <span>{tooltipText}</span>
          <button
            type="button"
            onClick={() => setIsTooltipDismissed(true)}
            className="text-gray-400 hover:text-black p-0.5 ml-1 transition cursor-pointer"
            aria-label="Cerrar mensaje"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Botón Flotante Oficial de WhatsApp */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        aria-label="Contactar a URBANNOISE por WhatsApp"
        title="Chatear con asesor en Bogotá (+57 310 872 0491)"
        className="relative group w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white flex items-center justify-center shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95"
      >
        {/* Anillo Pulsante */}
        <span className="absolute inset-0 rounded-full bg-[#25D366] opacity-40 animate-ping pointer-events-none" />

        {/* Icono Oficial */}
        <MessageCircle className="w-7 h-7 sm:w-8 sm:h-8 fill-current relative z-10" />

        {/* Badge "En línea" */}
        <span className="absolute top-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-300 border-2 border-white" />
      </a>
    </div>
  );
};
