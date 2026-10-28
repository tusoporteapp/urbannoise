import React, { useState, useEffect } from 'react';
import { Flame, Clock, ArrowRight, X } from 'lucide-react';
import { CountdownBannerConfig } from '../types';
import { getCountdownBanner } from '../lib/siteContent';

interface CountdownBannerProps {
  config?: CountdownBannerConfig;
  onCtaClick?: (anchor: string) => void;
}

interface TimeRemaining {
  totalMs: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

function calculateRemaining(targetDateStr?: string): TimeRemaining {
  if (!targetDateStr) {
    return { totalMs: 0, days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
  }

  const targetTime = new Date(targetDateStr).getTime();
  if (isNaN(targetTime)) {
    return { totalMs: 0, days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
  }

  const now = Date.now();
  const diff = targetTime - now;

  if (diff <= 0) {
    return { totalMs: 0, days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
  }

  const seconds = Math.floor((diff / 1000) % 60);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  return { totalMs: diff, days, hours, minutes, seconds, isExpired: false };
}

export const CountdownBanner: React.FC<CountdownBannerProps> = ({
  config: propConfig,
  onCtaClick,
}) => {
  const [config, setConfig] = useState<CountdownBannerConfig>(() => {
    return propConfig || getCountdownBanner();
  });

  const [time, setTime] = useState<TimeRemaining>(() => calculateRemaining(config?.endDate));
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      const dismissKey = `urbannoise_dismissed_countdown_${config?.endDate || 'default'}`;
      return sessionStorage.getItem(dismissKey) === 'true';
    } catch {
      return false;
    }
  });

  // Escucha reactiva en tiempo real cuando se actualiza desde el CMS
  useEffect(() => {
    if (propConfig) {
      setConfig(propConfig);
      setTime(calculateRemaining(propConfig.endDate));
      return;
    }

    const handler = (e: any) => {
      if (e.detail?.countdownBanner) {
        setConfig(e.detail.countdownBanner);
        setTime(calculateRemaining(e.detail.countdownBanner.endDate));
        setIsDismissed(false);
      }
    };
    window.addEventListener('urbannoise_site_content_updated', handler);
    return () => window.removeEventListener('urbannoise_site_content_updated', handler);
  }, [propConfig]);

  // Actualización segundo a segundo del reloj
  useEffect(() => {
    if (!config?.enabled || isDismissed) return;

    const timer = setInterval(() => {
      const remaining = calculateRemaining(config.endDate);
      setTime(remaining);
      if (remaining.isExpired && config.autoHideOnEnd !== false) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [config?.enabled, config?.endDate, config?.autoHideOnEnd, isDismissed]);

  // Si no está habilitado o fue descartado por el usuario en esta sesión
  if (!config?.enabled || isDismissed) {
    return null;
  }

  // Si expiró y está configurado para ocultarse automáticamente
  if (time.isExpired && config.autoHideOnEnd !== false) {
    return null;
  }

  const handleDismiss = () => {
    try {
      const dismissKey = `urbannoise_dismissed_countdown_${config.endDate || 'default'}`;
      sessionStorage.setItem(dismissKey, 'true');
    } catch {}
    setIsDismissed(true);
  };

  const handleAction = () => {
    if (onCtaClick) {
      onCtaClick(config.ctaAnchor || '#latest-drops');
    } else {
      const anchor = (config.ctaAnchor || '#latest-drops').replace('#', '');
      const el = document.getElementById(anchor);
      if (el) {
        const headerEl = document.getElementById('header-wrapper');
        const headerHeight = headerEl ? Math.round(headerEl.getBoundingClientRect().height) : 96;
        const targetPos = el.getBoundingClientRect().top + window.pageYOffset;
        window.scrollTo({ top: Math.max(0, targetPos - headerHeight + 2), behavior: 'smooth' });
      }
    }
  };

  // Temas visuales de streetwear
  const theme = config.theme || 'gold';
  let containerStyle = 'bg-[#0B0C10] border-amber-500/30 text-[#F5F2E4]';
  let badgeStyle = 'bg-amber-400 text-black';
  let digitStyle = 'bg-amber-400/10 text-amber-300 border-amber-400/30';
  let buttonStyle = 'bg-amber-400 hover:bg-amber-300 text-black';

  if (theme === 'neon') {
    containerStyle = 'bg-[#07090D] border-emerald-500/30 text-white';
    badgeStyle = 'bg-emerald-400 text-black';
    digitStyle = 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    buttonStyle = 'bg-emerald-400 hover:bg-emerald-300 text-black';
  } else if (theme === 'dark') {
    containerStyle = 'bg-[#101013] border-white/15 text-white';
    badgeStyle = 'bg-white text-black';
    digitStyle = 'bg-white/10 text-white border-white/20';
    buttonStyle = 'bg-white hover:bg-[#F5F2E4] text-[#101013]';
  } else if (theme === 'red') {
    containerStyle = 'bg-[#14080A] border-red-500/30 text-white';
    badgeStyle = 'bg-red-500 text-white';
    digitStyle = 'bg-red-500/15 text-red-300 border-red-500/30';
    buttonStyle = 'bg-red-500 hover:bg-red-400 text-white';
  }

  const pad = (n: number) => String(Math.max(0, n)).padStart(2, '0');

  return (
    <div
      id="countdown-drop-banner"
      className={`w-full border-b select-none transition-all duration-300 relative z-30 shadow-md ${containerStyle}`}
    >
      <div className="max-w-[1720px] mx-auto px-3 sm:px-6 py-2 sm:py-2.5 flex flex-col md:flex-row items-center justify-between gap-2.5 sm:gap-4">
        {/* Lado Izquierdo: Icono + Título + Subtítulo */}
        <div className="flex items-center space-x-2.5 sm:space-x-3 text-center md:text-left min-w-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0 animate-pulse">
            <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center justify-center md:justify-start space-x-2 flex-wrap gap-y-1">
              <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${badgeStyle}`}>
                FLASH DROP
              </span>
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider truncate text-white">
                {config.title || 'FLASH DROP STREETWEAR'}
              </h3>
            </div>
            {config.subtitle && (
              <p className="text-[10px] sm:text-[11px] text-white/70 truncate hidden sm:block mt-0.5">
                {config.subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Centro: Reloj de Cuenta Regresiva Segundo a Segundo */}
        <div className="flex items-center space-x-2 flex-shrink-0">
          <div className="flex items-center space-x-1.5 sm:space-x-2 font-mono">
            {time.isExpired ? (
              <span className="text-xs font-bold uppercase tracking-wider text-amber-300 px-3 py-1 rounded bg-black/40 border border-amber-400/30">
                {config.expiredMessage || 'DROP FINALIZADO'}
              </span>
            ) : (
              <>
                {/* Días */}
                {time.days > 0 && (
                  <>
                    <div className={`px-2 py-1 rounded border flex flex-col items-center justify-center min-w-[34px] sm:min-w-[40px] ${digitStyle}`}>
                      <span className="text-xs sm:text-sm font-black leading-tight tracking-tight">{pad(time.days)}</span>
                      <span className="text-[8px] uppercase tracking-wider opacity-60">días</span>
                    </div>
                    <span className="font-black text-xs opacity-40">:</span>
                  </>
                )}

                {/* Horas */}
                <div className={`px-2 py-1 rounded border flex flex-col items-center justify-center min-w-[34px] sm:min-w-[40px] ${digitStyle}`}>
                  <span className="text-xs sm:text-sm font-black leading-tight tracking-tight">{pad(time.hours)}</span>
                  <span className="text-[8px] uppercase tracking-wider opacity-60">hrs</span>
                </div>
                <span className="font-black text-xs opacity-40">:</span>

                {/* Minutos */}
                <div className={`px-2 py-1 rounded border flex flex-col items-center justify-center min-w-[34px] sm:min-w-[40px] ${digitStyle}`}>
                  <span className="text-xs sm:text-sm font-black leading-tight tracking-tight">{pad(time.minutes)}</span>
                  <span className="text-[8px] uppercase tracking-wider opacity-60">min</span>
                </div>
                <span className="font-black text-xs opacity-40">:</span>

                {/* Segundos */}
                <div className={`px-2 py-1 rounded border flex flex-col items-center justify-center min-w-[34px] sm:min-w-[40px] ${digitStyle}`}>
                  <span className="text-xs sm:text-sm font-black leading-tight tracking-tight text-white animate-pulse">{pad(time.seconds)}</span>
                  <span className="text-[8px] uppercase tracking-wider opacity-60">seg</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Lado Derecho: Botón de Compra Directa + Cerrar */}
        <div className="flex items-center space-x-2 flex-shrink-0">
          <button
            type="button"
            onClick={handleAction}
            className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-wider transition flex items-center space-x-1.5 cursor-pointer shadow-md active:scale-95 ${buttonStyle}`}
          >
            <span>{config.ctaText || 'VER DROP AHORA →'}</span>
            <ArrowRight className="w-3 h-3" />
          </button>

          <button
            type="button"
            onClick={handleDismiss}
            className="p-1 sm:p-1.5 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition cursor-pointer"
            title="Ocultar aviso de drop por esta sesión"
          >
            <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
