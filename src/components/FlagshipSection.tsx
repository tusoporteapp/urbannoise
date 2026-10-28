import React, { useState, useEffect } from 'react';
import { MessageCircle, MapPin, ExternalLink } from 'lucide-react';
import { FlagshipContent, BrandManifestoContent } from '../types';
import { getStoredSiteContent } from '../lib/siteContent';

export interface FlagshipSectionProps {
  content?: FlagshipContent;
  manifesto?: BrandManifestoContent;
  showStore?: boolean;
  showManifesto?: boolean;
}

export const FlagshipSection: React.FC<FlagshipSectionProps> = ({
  content: propContent,
  manifesto: propManifesto,
  showStore = true,
  showManifesto = true,
}) => {
  const [content, setContent] = useState<FlagshipContent>(() => {
    return propContent || getStoredSiteContent().flagship || {};
  });
  const [manifesto, setManifesto] = useState<BrandManifestoContent>(() => {
    return (
      propManifesto ||
      getStoredSiteContent().manifesto || {
        kicker: 'VISIÓN & ESENCIA',
        title: 'CURADURÍA CON INTENCIÓN: ARTE ✦ FRESCO ✦ TUYO',
        paragraph1:
          'El logo de URBANNOISE representa un movimiento y una transición entre caracteres que transmiten impulso, fluidez y ritmo urbano.',
        paragraph2:
          'Confeccionamos camisetas oversize con patrones amplios, cuellos rib reforzados y estampados de alta durabilidad en tallas S a XL, con envíos directos a toda Colombia.',
      }
    );
  });

  useEffect(() => {
    if (propContent) setContent(propContent);
    if (propManifesto) setManifesto(propManifesto);

    const handler = (e: any) => {
      if (e.detail?.flagship) setContent(e.detail.flagship);
      if (e.detail?.manifesto) setManifesto(e.detail.manifesto);
    };
    window.addEventListener('urbannoise_site_content_updated', handler);
    return () => window.removeEventListener('urbannoise_site_content_updated', handler);
  }, [propContent, propManifesto]);

  const kicker = content?.kicker || 'PIONEROS DESDE 2024';
  const title = content?.title || 'URBANNOISE CONCEPT STORE';
  const storeHours =
    content?.storeHours ||
    'Lunes a Sábado: 9:00 AM - 7:00 PM • Domingos: 10:00 AM - 4:00 PM';
  const onlineHours =
    content?.onlineHours ||
    'Lunes a Sábado: 8:00 AM - 8:00 PM (Despachos a toda Colombia)';
  const address =
    content?.address ||
    'Cra 10 # 9-37 Local 23-54, Centro Comercial El GranSan, Bogotá - Colombia';
  const whatsappNumber = content?.whatsappNumber || '(+57) 310 872 0491';
  const cleanPhone = whatsappNumber.replace(/\D/g, '');
  const googleMapsUrl =
    content?.googleMapsUrl ||
    'https://www.google.com/maps/search/?api=1&query=Cra+10+%23+9-37+Local+23-54+Bogota+Colombia+El+GranSan';

  if (!showStore && !showManifesto) return null;

  return (
    <section
      id="flagship"
      className="w-full bg-white border-b border-[#E5E5E5] flex items-center justify-center py-10 sm:py-16 md:py-20 scroll-mt-[84px] sm:scroll-mt-[100px]"
    >
      <div className="max-w-[1720px] mx-auto px-4 sm:px-8 w-full my-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-center">
          {/* Columna Izquierda: Concept Store y Horarios */}
          {showStore && (
            <div className={showManifesto ? 'lg:col-span-5' : 'lg:col-span-12 max-w-3xl mx-auto'}>
              <div className="flex items-center space-x-2 mb-1 sm:mb-2">
                <span className="text-[10px] sm:text-xs uppercase tracking-[0.25em] text-[#1E342A] font-bold">
                  {kicker}
                </span>
              </div>
              <h3 className="font-extrabold text-2xl sm:text-4xl lg:text-5xl uppercase tracking-tight text-[#101013] mb-3 sm:mb-5 leading-tight">
                {title}
              </h3>

              <div className="space-y-3 sm:space-y-4 text-xs sm:text-sm text-[#555555] font-normal leading-relaxed border-l-2 border-[#101013] pl-4 sm:pl-6 my-4 sm:my-6">
                <div>
                  <h4 className="font-bold text-[10px] sm:text-xs uppercase tracking-widest text-[#101013] mb-0.5">
                    HORARIO TIENDA FÍSICA:
                  </h4>
                  <p>{storeHours}</p>
                </div>
                <div>
                  <h4 className="font-bold text-[10px] sm:text-xs uppercase tracking-widest text-[#101013] mb-0.5">
                    VENTAS ONLINE & WHATSAPP:
                  </h4>
                  <p>{onlineHours}</p>
                </div>
                <div>
                  <h4 className="font-bold text-[10px] sm:text-xs uppercase tracking-widest text-[#101013] mb-0.5">
                    FICHA OFICIAL GOOGLE MAPS:
                  </h4>
                  <p className="font-semibold text-[#101013]">{address}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2.5 sm:gap-3">
                <a
                  href={`https://wa.me/${cleanPhone || '573108720491'}?text=Hola%20UrbanNoise,%20quiero%20conocer%20el%20cat%C3%A1logo`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 bg-[#101013] text-[#F5F2E4] px-5 sm:px-7 py-3 sm:py-3.5 text-[11px] sm:text-xs font-bold uppercase tracking-widest hover:bg-[#1E342A] transition shadow-md"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-400" />
                  <span>ASESORÍA WHATSAPP</span>
                </a>

                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 border border-[#101013] text-[#101013] px-5 sm:px-7 py-3 sm:py-3.5 text-[11px] sm:text-xs font-bold uppercase tracking-widest hover:bg-[#101013] hover:text-[#F5F2E4] transition"
                >
                  <MapPin className="w-4 h-4" />
                  <span>CÓMO LLEGAR (GPS)</span>
                  <ExternalLink className="w-3 h-3 ml-0.5 opacity-60" />
                </a>
              </div>
            </div>
          )}

          {/* Columna Derecha: Brand Manifesto */}
          {showManifesto && (
            <div
              id="brand-manifesto"
              className={`${
                showStore ? 'lg:col-span-7' : 'lg:col-span-12'
              } bg-[#F5F2E4] p-5 sm:p-8 md:p-10 lg:p-12 border border-[#E5E5E5] relative overflow-hidden scroll-mt-[84px] sm:scroll-mt-[100px]`}
            >
              <span className="text-6xl sm:text-8xl font-black text-black/5 absolute -right-6 -bottom-8 select-none pointer-events-none">
                ии
              </span>
              <p className="text-[10px] sm:text-xs uppercase tracking-[0.25em] text-[#1E342A] font-bold mb-2">
                {manifesto.kicker || 'VISIÓN & ESENCIA'}
              </p>
              <h4 className="font-extrabold text-lg sm:text-2xl uppercase tracking-tight text-[#101013] mb-3 sm:mb-4">
                {manifesto.title || 'CURADURÍA CON INTENCIÓN: ARTE ✦ FRESCO ✦ TUYO'}
              </h4>
              {manifesto.paragraph1 && (
                <p className="text-xs sm:text-sm text-[#333333] leading-relaxed mb-3 sm:mb-4 font-normal">
                  {manifesto.paragraph1}
                </p>
              )}
              {manifesto.paragraph2 && (
                <p className="text-xs sm:text-sm text-[#333333] leading-relaxed font-normal">
                  {manifesto.paragraph2}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
