import React, { useState, useEffect } from 'react';
import { HeroSlide } from '../types';
import { HERO_SLIDES } from '../data/products';
import { getStoredSiteContent } from '../lib/siteContent';

export interface HeroSectionProps {
  slides?: HeroSlide[];
  onCtaClick?: (anchor: string) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  slides: propSlides,
  onCtaClick,
}) => {
  const [internalSlides, setInternalSlides] = useState<HeroSlide[]>(() => {
    if (propSlides && propSlides.length > 0) return propSlides;
    return getStoredSiteContent().heroSlides || HERO_SLIDES;
  });

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [prevSlideIndex, setPrevSlideIndex] = useState(0);

  // Escuchar cambios reactivos desde el CMS en tiempo real
  useEffect(() => {
    if (propSlides && propSlides.length > 0) {
      setInternalSlides(propSlides);
      return;
    }

    const handleContentUpdate = (e: any) => {
      if (e.detail?.heroSlides && e.detail.heroSlides.length > 0) {
        setInternalSlides(e.detail.heroSlides);
      }
    };

    window.addEventListener('urbannoise_site_content_updated', handleContentUpdate);
    return () => {
      window.removeEventListener('urbannoise_site_content_updated', handleContentUpdate);
    };
  }, [propSlides]);

  const activeSlides = propSlides && propSlides.length > 0 ? propSlides : internalSlides;
  const safeSlides = activeSlides.length > 0 ? activeSlides : HERO_SLIDES;

  const goToSlide = (nextIdx: number) => {
    if (nextIdx === currentSlideIndex) return;
    setPrevSlideIndex(currentSlideIndex);
    setCurrentSlideIndex(nextIdx);
  };

  useEffect(() => {
    if (safeSlides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlideIndex((curr) => {
        const next = (curr + 1) % safeSlides.length;
        setPrevSlideIndex(curr);
        return next;
      });
    }, 5500);
    return () => clearInterval(timer);
  }, [safeSlides.length]);

  return (
    <section
      id="hero"
      className="relative w-full h-screen h-[100dvh] min-h-[100dvh] flex flex-col justify-end bg-[#101013] text-white overflow-hidden"
    >
      {/* Contenedor de Fondos Hero: Cross-Dissolve puro */}
      <div className="absolute inset-0 w-full h-full overflow-hidden z-0">
        {safeSlides.map((s, idx) => {
          const isCurrent = idx === currentSlideIndex;
          const isPrev = idx === prevSlideIndex && idx !== currentSlideIndex;

          return (
            <div
              key={s.id ?? idx}
              className={`absolute inset-0 w-full h-full ${
                isCurrent
                  ? 'opacity-100 z-[2] transition-opacity duration-1000 ease-in-out'
                  : isPrev
                  ? 'opacity-100 z-[1] transition-none'
                  : 'opacity-0 z-0 transition-none pointer-events-none'
              }`}
            >
              <img
                src={s.img}
                alt={`${s.titleBold || ''} ${s.titleLight || ''} - URBANNOISE Streetwear`}
                className="w-full h-full object-cover object-[70%_center] sm:object-center filter contrast-105 select-none"
                loading={idx === 0 ? 'eager' : 'lazy'}
                decoding="async"
                // @ts-ignore
                fetchpriority={idx === 0 ? 'high' : 'auto'}
              />
            </div>
          );
        })}
      </div>

      {/* Gradientes calculados sobre las imágenes */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#101013]/95 via-[#101013]/40 to-transparent sm:bg-gradient-to-r sm:from-[#101013]/90 sm:via-[#101013]/30 sm:to-transparent pointer-events-none z-10" />
      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/60 to-transparent pointer-events-none z-10" />

      {/* Contenido alineado al lateral con transición suave de texto */}
      <div className="relative z-20 w-full max-w-[1720px] mx-auto px-5 sm:px-10 lg:px-16 pb-14 sm:pb-20 lg:pb-24 flex flex-col items-start justify-end text-left">
        <div className="relative w-full max-w-md sm:max-w-xl lg:max-w-2xl min-h-[160px] sm:min-h-[220px]">
          {safeSlides.map((s, idx) => {
            const isActive = idx === currentSlideIndex;
            return (
              <div
                key={s.id ?? idx}
                className={`transition-all duration-700 ease-in-out ${
                  isActive
                    ? 'opacity-100 translate-y-0 relative z-10 pointer-events-auto'
                    : 'opacity-0 translate-y-2 absolute inset-0 pointer-events-none -z-10'
                }`}
              >
                {/* Badge Novedades */}
                <div className="hidden sm:inline-flex items-center space-x-2 border border-white/20 rounded-full px-3 py-1 mb-3 sm:mb-4 backdrop-blur-md bg-black/40">
                  <span className="text-[#D9C4AB] text-[9px] sm:text-[10px] font-bold tracking-[0.22em] uppercase">
                    {s.badge || 'NOVEDADES SEMANALES'}
                  </span>
                  {(s.badgeSub || s.badgeSub === undefined) && (
                    <>
                      <span className="text-white/30">•</span>
                      <span className="text-white/90 text-[9px] sm:text-[10px] font-semibold tracking-wider uppercase">
                        {s.badgeSub || 'TALLAS S - XL'}
                      </span>
                    </>
                  )}
                </div>

                {/* Título Principal lateralizado */}
                <h2 className="font-extrabold text-3xl sm:text-5xl md:text-6xl lg:text-7xl uppercase tracking-tight leading-[0.95] mb-3 sm:mb-4 text-[#F5F2E4]">
                  {s.titleBold}{' '}
                  <span className="font-light italic lowercase text-[#D9C4AB]">
                    {s.titleLight}
                  </span>
                  {s.subtitle && (
                    <>
                      <br />
                      <span>{s.subtitle}</span>
                    </>
                  )}
                </h2>

                {/* Subtexto / Descripción */}
                {s.desc && (
                  <p className="hidden sm:block text-xs sm:text-sm md:text-base text-white/80 max-w-lg mb-6 sm:mb-7 font-normal leading-relaxed">
                    {s.desc}
                  </p>
                )}

                {/* Botón de Acción Principal (Personalizable) */}
                <div className="flex flex-row items-center mb-2 sm:mb-0">
                  <a
                    href={s.ctaAnchor || '#latest-drops'}
                    onClick={(e) => {
                      if (onCtaClick && s.ctaAnchor) {
                        e.preventDefault();
                        onCtaClick(s.ctaAnchor);
                      }
                    }}
                    className="bg-[#F5F2E4] text-[#101013] font-black text-xs uppercase tracking-[0.2em] px-8 sm:px-10 py-3.5 sm:py-4 hover:bg-[#101013] hover:text-[#F5F2E4] transition border-2 border-[#F5F2E4] shadow-2xl whitespace-nowrap cursor-pointer"
                  >
                    {s.ctaText || 'COMPRAR DROP AHORA'}
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Contadores numéricos fijos en la base */}
      {safeSlides.length > 1 && (
        <div
          id="hero-slide-indicators"
          className="absolute bottom-3 sm:bottom-6 left-5 sm:left-10 lg:left-16 z-30 flex items-center space-x-3"
        >
          {safeSlides.map((s, idx) => (
            <button
              key={s.id ?? idx}
              id={`hero-dot-${idx}`}
              onClick={() => goToSlide(idx)}
              className={`group flex items-center space-x-2 py-1.5 transition-all cursor-pointer ${
                idx === currentSlideIndex
                  ? 'text-white'
                  : 'text-white/40 hover:text-white/80'
              }`}
            >
              <span className="text-[11px] sm:text-xs font-mono font-bold tracking-widest">
                {s.label || `0${idx + 1}`}
              </span>
              <span
                className={`h-[2px] transition-all duration-300 ${
                  idx === currentSlideIndex
                    ? 'w-7 sm:w-9 bg-[#F5F2E4]'
                    : 'w-2.5 bg-white/30 group-hover:w-4 group-hover:bg-white/60'
                }`}
              />
            </button>
          ))}
        </div>
      )}
    </section>
  );
};
