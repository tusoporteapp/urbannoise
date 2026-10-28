import React, { useState, useEffect } from 'react';
import { ArrowRight, Sparkles, LayoutGrid, Flame, Eye } from 'lucide-react';
import { getStoredSiteContent } from '../lib/siteContent';
import { CategoryCardContent } from '../types';

interface CategoryVisualHubProps {
  onSelectCategory: (categoryId: string) => void;
  categoryCounts: Record<string, number>;
}

export const CategoryVisualHub: React.FC<CategoryVisualHubProps> = ({
  onSelectCategory,
  categoryCounts,
}) => {
  const [customCategories, setCustomCategories] = useState<CategoryCardContent[]>(() => {
    return getStoredSiteContent().categories || [];
  });

  useEffect(() => {
    const handler = (e: any) => {
      if (e.detail?.categories) {
        setCustomCategories(e.detail.categories);
      }
    };
    window.addEventListener('urbannoise_site_content_updated', handler);
    return () => window.removeEventListener('urbannoise_site_content_updated', handler);
  }, []);

  const defaultCategories: CategoryCardContent[] = [
    {
      id: 'latest-drops',
      name: 'ÚLTIMOS LANZAMIENTOS',
      menuTitle: 'Novedades',
      mobileTitle: 'ÚLTIMOS LANZAMIENTOS',
      subtitle: 'Drop Semanal 2026',
      badge: 'NUEVO',
      image:
        'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1000&auto=format&fit=crop',
    },
    {
      id: 'young-free',
      name: 'YOUNG & FREE',
      menuTitle: 'Young & Free',
      mobileTitle: 'COLECCIÓN YOUNG & FREE',
      subtitle: 'Underground & Audaz',
      badge: 'POPULAR',
      image:
        'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=1000&auto=format&fit=crop',
    },
    {
      id: 'weird-oversize',
      name: 'PLEASURES & WEIRD BOXY',
      menuTitle: 'Weird Boxy',
      mobileTitle: 'EDICIÓN WEIRD & OVERSIZE',
      subtitle: 'Algodón Pesado 300g',
      badge: 'BOXY FIT',
      image:
        'https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=1000&auto=format&fit=crop',
    },
    {
      id: 'dama-oversize',
      name: 'DAMA OVERSIZE',
      menuTitle: 'Dama',
      mobileTitle: 'DESTACADOS DAMA OVERSIZE',
      subtitle: 'Estampados de Autor',
      badge: 'CÁPSULA',
      image:
        'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop',
    },
  ];

  const sourceCategories = (customCategories.length > 0 ? customCategories : defaultCategories)
    .filter((cat) => cat.enabled !== false)
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

  const categories = sourceCategories.map((cat) => ({
    ...cat,
    count: categoryCounts[cat.id] ?? 0,
  }));

  return (
    <section className="w-full bg-[#FAF8F5] border-b border-[#E5E5E5] py-8 sm:py-12 px-4 sm:px-8">
      <div className="max-w-[1720px] mx-auto">
        {/* Cabecera de Sección */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 sm:mb-8 gap-3">
          <div>
            <div className="flex items-center space-x-2 text-[10px] sm:text-xs font-bold uppercase tracking-[0.25em] text-[#8E8E93] mb-1">
              <Sparkles className="w-3.5 h-3.5 text-[#D9C4AB]" />
              <span>COLECCIONES URBANNOISE BOGOTÁ</span>
            </div>
            <h2 className="text-xl sm:text-3xl font-black uppercase tracking-tight text-[#101013] leading-none">
              COMPRA POR CATEGORÍA
            </h2>
          </div>

          <button
            onClick={() => onSelectCategory('all')}
            className="inline-flex items-center space-x-2 text-xs font-black uppercase tracking-wider text-[#101013] hover:text-stone-600 transition cursor-pointer self-start sm:self-auto border-b-2 border-black pb-0.5"
          >
            <span>Ver Catálogo Completo ({categoryCounts.all} Prendas)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Cuadrícula de 4 Categorías Visuales */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {categories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className="group relative h-64 sm:h-80 md:h-96 rounded-none overflow-hidden bg-black cursor-pointer border border-stone-200 hover:border-black transition-all duration-300 shadow-xs hover:shadow-xl flex flex-col justify-end p-4 sm:p-6 text-white"
            >
              {/* Imagen de fondo con hover zoom */}
              <img
                src={cat.image}
                alt={cat.name}
                className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-85 group-hover:scale-105 transition-all duration-700 filter contrast-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />

              {/* Badges superiores */}
              <div className="absolute top-3 left-3 z-10 flex items-center space-x-2">
                <span className="bg-[#101013]/90 backdrop-blur-xs text-[#F5F2E4] text-[9px] font-black uppercase px-2 py-0.5 rounded-xs border border-white/20">
                  {cat.badge}
                </span>
                <span className="bg-white/20 backdrop-blur-xs text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-xs">
                  {cat.count} prendas
                </span>
              </div>

              {/* Contenido inferior */}
              <div className="relative z-10">
                <p className="text-[10px] sm:text-xs text-[#D9C4AB] font-semibold uppercase tracking-widest mb-1">
                  {cat.subtitle}
                </p>
                <h3 className="text-base sm:text-xl font-black uppercase tracking-tight text-[#F5F2E4] leading-tight mb-3">
                  {cat.name}
                </h3>
                <div className="inline-flex items-center space-x-1.5 text-[10px] sm:text-xs font-black uppercase tracking-wider text-white bg-white/10 group-hover:bg-white group-hover:text-black transition px-3 py-1.5 rounded-xs border border-white/30">
                  <span>Ver Colección</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Barra Banner de Acceso al Marketplace */}
        <div className="mt-6 sm:mt-8 bg-[#101013] text-[#F5F2E4] p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left border border-black shadow-md">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded bg-white/10 flex items-center justify-center flex-shrink-0 hidden xs:flex">
              <LayoutGrid className="w-5 h-5 text-[#D9C4AB]" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-black uppercase tracking-wide">
                ¿Buscas todas las siluetas en un solo catálogo?
              </p>
              <p className="text-[11px] text-white/60">
                Filtra por talla, precio y disponibilidad inmediata con despacho nacional y pago 100% seguro.
              </p>
            </div>
          </div>
          <button
            onClick={() => onSelectCategory('all')}
            className="bg-[#F5F2E4] text-[#101013] hover:bg-white text-xs font-black uppercase tracking-widest px-6 py-2.5 rounded-xs transition cursor-pointer flex-shrink-0 shadow flex items-center space-x-2"
          >
            <span>VER CATÁLOGO COMPLETO</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </section>
  );
};
