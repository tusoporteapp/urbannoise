import React, { useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Heart, Film } from 'lucide-react';
import { Product } from '../types';
import { formatCOP } from '../data/products';
import { useWishlist } from '../lib/wishlist';

const COLOR_HEX_MAP: Record<string, string> = {
  negro: '#111111',
  marfil: '#F4EBD9',
  blanco: '#F8F9FA',
  gris: '#8E8E93',
  cafe: '#6E473B',
  azul: '#1D4ED8',
  verde: '#15803D',
  rojo: '#DC2626',
  lila: '#C084FC',
  mostaza: '#D97706',
  amarillo: '#FACC15',
  naranja: '#EA580C',
  rosado: '#F472B6',
  vino: '#881337',
  militar: '#4D533C',
  beige: '#E5D9C5',
  crudo: '#ECE4D4',
};

function getColorHex(colorName: string): string {
  if (!colorName) return '#111111';
  const clean = colorName.toLowerCase().trim();
  for (const [key, hex] of Object.entries(COLOR_HEX_MAP)) {
    if (clean.includes(key)) return hex;
  }
  return '#9CA3AF';
}

interface ProductCarouselProps {
  id: string;
  kicker?: string;
  title: string;
  products: Product[];
  featuredSkus?: string[];
  onQuickView: (product: Product) => void;
  onViewAll?: () => void;
}

export const ProductCarousel: React.FC<ProductCarouselProps> = ({
  id,
  kicker,
  title,
  products,
  featuredSkus,
  onQuickView,
  onViewAll,
}) => {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const trackRef = useRef<HTMLDivElement>(null);
  const autoplayRef = useRef<NodeJS.Timeout | null>(null);

  const startAutoplay = () => {
    if (autoplayRef.current) clearInterval(autoplayRef.current);
    autoplayRef.current = setInterval(() => {
      if (!trackRef.current) return;
      const track = trackRef.current;
      const maxScroll = track.scrollWidth - track.clientWidth;
      const cardWidth = track.firstElementChild
        ? (track.firstElementChild as HTMLElement).offsetWidth
        : 320;

      if (track.scrollLeft >= maxScroll - 10) {
        track.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        track.scrollBy({ left: cardWidth + 16, behavior: 'smooth' });
      }
    }, 4000);
  };

  const stopAutoplay = () => {
    if (autoplayRef.current) {
      clearInterval(autoplayRef.current);
      autoplayRef.current = null;
    }
  };

  useEffect(() => {
    startAutoplay();
    return () => stopAutoplay();
  }, [products]);

  const handleScroll = (direction: number) => {
    if (!trackRef.current) return;
    const track = trackRef.current;
    const cardWidth = track.firstElementChild
      ? (track.firstElementChild as HTMLElement).offsetWidth
      : 320;
    const step = window.innerWidth >= 1024 ? (cardWidth + 16) * 2 : cardWidth + 16;
    track.scrollBy({ left: direction * step, behavior: 'smooth' });
  };

  return (
    <div className="w-full flex flex-col justify-between pt-1 pb-3 sm:pb-4 bg-white select-none">
      {/* Encabezado limpio estilo PLEASURES / Streetwear */}
      <div className="max-w-[1780px] mx-auto px-4 sm:px-6 md:px-8 mb-3 sm:mb-4 flex items-center justify-between w-full flex-shrink-0">
        <div
          onClick={() => {
            if (onViewAll) onViewAll();
          }}
          className={onViewAll ? 'cursor-pointer group select-none' : ''}
        >
          {kicker && (
            <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.22em] text-[#666666] mb-0.5 group-hover:text-black transition">
              {kicker}
            </p>
          )}
          <h2 className="font-black text-xl sm:text-2xl md:text-3xl uppercase tracking-tight text-[#101013] leading-none group-hover:opacity-75 transition">
            {title}
          </h2>
        </div>

        {/* Controles: Píldora VER TODO y Flechas circulares < > */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            onClick={() => {
              if (onViewAll) {
                onViewAll();
              } else if (trackRef.current) {
                trackRef.current.scrollTo({ left: 0, behavior: 'smooth' });
              }
            }}
            className="border border-[#101013] rounded-full px-4 sm:px-5 py-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#101013] hover:bg-[#101013] hover:text-[#F5F2E4] transition cursor-pointer"
          >
            VER TODO
          </button>
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => handleScroll(-1)}
              className="w-7 h-7 sm:w-8 sm:h-8 text-[#101013] hover:bg-[#101013] hover:text-white transition flex items-center justify-center border border-[#101013]/30 rounded-full cursor-pointer"
              aria-label="Anterior"
            >
              <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <button
              onClick={() => handleScroll(1)}
              className="w-7 h-7 sm:w-8 sm:h-8 text-[#101013] hover:bg-[#101013] hover:text-white transition flex items-center justify-center border border-[#101013]/30 rounded-full cursor-pointer"
              aria-label="Siguiente"
            >
              <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Carrusel Ultra Limpio y Fluido sin imantado: 4 productos por pantalla en PC */}
      <div
        className="relative w-full flex flex-col justify-center overflow-hidden px-4 sm:px-6 md:px-8"
        onMouseEnter={stopAutoplay}
        onMouseLeave={startAutoplay}
      >
        <div
          id={id}
          ref={trackRef}
          className="flex overflow-x-auto no-scrollbar scroll-smooth gap-3 sm:gap-4 md:gap-4.5 w-full items-stretch py-1 overscroll-x-contain"
        >
          {products.map((product) => (
            <div
              key={product.id}
              onClick={() => onQuickView(product)}
              className="flex-none w-[74vw] sm:w-[42vw] md:w-[30vw] lg:w-[calc(25vw-20px)] xl:w-[calc(25vw-24px)] flex flex-col justify-between group cursor-pointer bg-transparent transition"
            >
              {/* Imagen con aspecto 3:4 / 4:5 de estudio tipo lookbook */}
              <div className="w-full aspect-[4/5] bg-[#EBEBEB] overflow-hidden relative flex items-center justify-center">
                <img
                  src={product.image}
                  alt={`${product.name} - Marca de ropa colombiana oversize y streetwear URBANNOISE`}
                  className={`w-full h-full object-cover transition-all duration-500 ${
                    product.images && product.images.length > 1
                      ? 'group-hover:opacity-0'
                      : 'group-hover:scale-105'
                  }`}
                  loading="lazy"
                  decoding="async"
                />

                {/* Imagen Secundaria (Espalda / Detalle) en hover */}
                {product.images && product.images.length > 1 && (
                  <img
                    src={product.images[1]}
                    alt={`${product.name} - Vista de espalda silueta boxy fit y caída oversize`}
                    className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                    loading="lazy"
                    decoding="async"
                  />
                )}

                {/* Micro-etiqueta sutil en hover */}
                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4 pointer-events-none">
                  <span className="bg-[#101013] text-[#F5F2E4] font-bold text-[9px] uppercase tracking-widest px-3 py-1.5 shadow-md">
                    VER DETALLE
                  </span>
                </div>

                {/* Botón de Lista de Deseos (Wishlist) */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleWishlist(product.id, e);
                  }}
                  title={isInWishlist(product.id) ? 'Remover de lista de deseos' : 'Guardar en lista de deseos'}
                  className="absolute top-2 right-2 z-20 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-stone-700 hover:text-red-500 transition shadow-sm cursor-pointer hover:scale-110 active:scale-95"
                >
                  <Heart
                    className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors ${
                      isInWishlist(product.id)
                        ? 'fill-red-500 text-red-500'
                        : 'text-stone-700 hover:text-red-500'
                    }`}
                  />
                </button>

                {/* Badges superiores izquierda: Top Pick ⭐ y Disponibilidad de Stock */}
                <div className="absolute top-2 left-2 z-10 flex flex-col gap-1 items-start pointer-events-none">
                  {Boolean(
                    featuredSkus &&
                      ((product.sku && featuredSkus.includes(product.sku)) ||
                        (product.id && featuredSkus.includes(product.id)))
                  ) && (
                    <div className="bg-[#101013]/95 backdrop-blur-xs text-[#F5F2E4] border border-[#D9C4AB]/70 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 shadow-md flex items-center gap-1">
                      <span className="text-[#D9C4AB] text-[10px]">⭐</span>
                      <span>TOP PICK</span>
                    </div>
                  )}

                  {product.stock !== undefined && product.stock <= 0 ? (
                    <div className="bg-black/90 text-red-400 border border-red-500/40 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 shadow">
                      Agotado
                    </div>
                  ) : product.stock !== undefined && product.stock <= 3 ? (
                    <div className="bg-black/90 text-amber-300 border border-amber-400/40 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 shadow">
                      Últimas piezas
                    </div>
                  ) : null}
                </div>

                {/* Badge de Video Lookbook */}
                {product.video && (
                  <div className="absolute bottom-2 left-2 z-10 bg-black/85 backdrop-blur-xs text-[#F5F2E4] px-2 py-0.5 text-[8px] font-black uppercase tracking-wider flex items-center space-x-1 border border-white/20 shadow">
                    <Film className="w-2.5 h-2.5 text-[#D9C4AB] animate-pulse" />
                    <span>VIDEO</span>
                  </div>
                )}
              </div>

              {/* Metadata inferior: Nombre + SKU + Precio */}
              <div className="pt-2.5 sm:pt-3 pb-1 flex flex-col bg-white flex-shrink-0">
                <div className="flex items-center justify-between text-[9px] font-mono text-[#888888] mb-0.5">
                  <span>{product.sku || `UN-${product.id.toUpperCase()}`}</span>
                  {product.stock !== undefined && product.stock > 0 ? (
                    <span className="text-emerald-700 font-sans font-medium">
                      Disponible
                    </span>
                  ) : (
                    <span className="text-red-600 font-sans font-medium">
                      Agotado
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-[10px] sm:text-[11px] md:text-[12px] uppercase text-[#101013] tracking-tight leading-snug line-clamp-1 group-hover:opacity-70 transition-opacity">
                  {product.name}
                </h3>
                <div className="flex items-center justify-between mt-0.5">
                  <p className="font-bold text-[11px] sm:text-[12px] md:text-[13px] text-[#101013] tracking-tight">
                    {formatCOP(product.price)}
                  </p>
                  {product.availableColors && product.availableColors.length > 0 && (
                    <div className="flex items-center gap-1">
                      {product.availableColors.slice(0, 3).map((c) => (
                        <span
                          key={c}
                          title={c}
                          className="w-2.5 h-2.5 rounded-full border border-black/20"
                          style={{ backgroundColor: getColorHex(c) }}
                        />
                      ))}
                      {product.availableColors.length > 3 && (
                        <span className="text-[8.5px] font-mono text-stone-500 font-semibold">
                          +{product.availableColors.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
