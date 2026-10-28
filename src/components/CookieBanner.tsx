import React, { useState, useEffect } from 'react';
import { Cookie, ShieldCheck, X, Settings2, Check } from 'lucide-react';
import { getCookieConsent, setCookieConsent, trackEvent } from '../lib/analytics';

interface CookieBannerProps {
  onOpenPolicies: (tabId: string) => void;
}

export const CookieBanner: React.FC<CookieBannerProps> = ({ onOpenPolicies }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);

  useEffect(() => {
    const existing = getCookieConsent();
    if (!existing) {
      const timer = setTimeout(() => setIsVisible(true), 900);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    setCookieConsent({ accepted: true, analytics: true });
    trackEvent('cookie_consent_accepted_all');
    setIsVisible(false);
  };

  const handleAcceptEssentialOnly = () => {
    setCookieConsent({ accepted: true, analytics: false });
    setIsVisible(false);
  };

  const handleSaveCustom = () => {
    setCookieConsent({ accepted: true, analytics: analyticsEnabled });
    if (analyticsEnabled) {
      trackEvent('cookie_consent_custom');
    }
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <aside
      aria-label="Aviso de privacidad y cookies"
      className="fixed bottom-0 inset-x-0 z-50 p-3 sm:p-4 bg-[#101013]/98 backdrop-blur-md text-[#F5F2E4] border-t border-white/20 shadow-2xl animate-in slide-in-from-bottom-2 duration-300"
    >
      <div className="max-w-7xl mx-auto text-xs">
        {!showConfig ? (
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-start space-x-3.5 max-w-4xl">
              <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 text-emerald-400 mt-0.5">
                <Cookie className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-extrabold uppercase tracking-wide text-xs text-white">
                    Aviso de Privacidad y Política de Cookies
                  </span>
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[9px] font-bold px-1.5 py-0.2 rounded uppercase">
                    Habeas Data • RGPD • CCPA
                  </span>
                </div>
                <p className="text-[11px] text-white/70 leading-relaxed">
                  Utilizamos cookies esenciales para el funcionamiento del carrito de compras y la seguridad de tus pagos encriptados. Con tu consentimiento, usamos métricas analíticas anónimas para optimizar la velocidad y la experiencia de compra conforme a la Ley 1581 de Colombia y el RGPD de la Unión Europea.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end flex-shrink-0 pt-1 lg:pt-0 border-t lg:border-t-0 border-white/10">
              <button
                type="button"
                onClick={() => onOpenPolicies('cookies')}
                className="text-[11px] text-white/70 hover:text-white underline underline-offset-2 px-2 py-1.5 cursor-pointer"
              >
                Leer Política
              </button>
              <button
                type="button"
                onClick={() => setShowConfig(true)}
                className="px-3 py-1.5 border border-white/25 hover:border-white text-white text-xs font-semibold rounded-md transition cursor-pointer"
              >
                Configurar
              </button>
              <button
                type="button"
                onClick={handleAcceptEssentialOnly}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-md transition cursor-pointer"
                title="Rechazar cookies analíticas opcionales"
              >
                Solo Esenciales
              </button>
              <button
                type="button"
                onClick={handleAcceptAll}
                className="px-4 py-1.5 bg-[#F5F2E4] hover:bg-[#D9C4AB] text-[#101013] text-xs font-extrabold uppercase tracking-wider rounded-md transition cursor-pointer shadow-md"
              >
                Aceptar Todas
              </button>
            </div>
          </div>
        ) : (
          /* Panel de Configuración Granular */
          <div className="space-y-3 py-1">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <span className="font-extrabold text-sm uppercase text-white flex items-center space-x-2">
                <Settings2 className="w-4 h-4 text-emerald-400" />
                <span>Preferencias de Privacidad y Cookies</span>
              </span>
              <button
                type="button"
                onClick={() => setShowConfig(false)}
                className="text-white/60 hover:text-white text-xs underline cursor-pointer"
              >
                ← Volver al aviso
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
              <div className="p-3 bg-white/5 rounded-lg border border-white/10 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white uppercase">Cookies Técnicas / Esenciales</span>
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/20 px-2 py-0.5 rounded">Siempre Activas</span>
                </div>
                <p className="text-white/60">
                  Necesarias para recordar las prendas añadidas al carrito de compras, el inicio de sesión y la encriptación segura del checkout.
                </p>
              </div>

              <div className="p-3 bg-white/5 rounded-lg border border-white/10 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white uppercase">Cookies Analíticas Anónimas</span>
                  <label className="relative inline-flex items-center cursor-pointer" htmlFor="cookie-analytics-toggle">
                    <input
                      id="cookie-analytics-toggle"
                      name="analyticsCookies"
                      type="checkbox"
                      checked={analyticsEnabled}
                      onChange={(e) => setAnalyticsEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>
                <p className="text-white/60">
                  Métricas no invasivas sin identificación personal para analizar velocidad de carga y estabilidad del catálogo.
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={handleAcceptEssentialOnly}
                className="px-3.5 py-1.5 border border-white/20 text-white text-xs font-semibold rounded-md hover:bg-white/10 cursor-pointer"
              >
                Rechazar Analíticas
              </button>
              <button
                type="button"
                onClick={handleSaveCustom}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider rounded-md cursor-pointer shadow"
              >
                Guardar Mis Preferencias
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
