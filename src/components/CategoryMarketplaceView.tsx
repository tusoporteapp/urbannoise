import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowLeft,
  Filter,
  SlidersHorizontal,
  ChevronDown,
  Sparkles,
  ShoppingBag,
  Eye,
  Check,
  Flame,
  Truck,
  ShieldCheck,
  LayoutGrid,
  X,
  Search,
  Heart,
  TrendingUp,
  Tag,
  Clock,
  RotateCcw,
  Film,
} from 'lucide-react';
import { Product, ProductSize, CategoryCardContent } from '../types';
import { formatCOP } from '../data/products';
import { useWishlist } from '../lib/wishlist';
import { getStoredSiteContent } from '../lib/siteContent';

import {
  FABRIC_OPTIONS,
  FILTER_COLORS,
  getColorHex,
  getProductFabricKey,
  getStockForSize,
  getCardSizes,
  checkColorMatch,
  getProductSizes,
  matchSize,
  normalizeSizeName,
} from '../lib/catalogFilters';

interface CategoryMarketplaceViewProps {
  products: Product[];
  initialCategory?: string; // 'all' | 'latest-drops' | 'young-free' | 'weird-oversize' | 'dama-oversize'
  onBackToHome: () => void;
  onQuickView: (product: Product) => void;
  onAddToCart: (product: Product, size: ProductSize, qty?: number) => void;
  onProceedToCheckout?: () => void;
}

const CATEGORY_METADATA: Record<
  string,
  {
    title: string;
    subtitle: string;
    description: string;
    bgImage: string;
    kicker: string;
  }
> = {
  all: {
    title: 'CATÁLOGO STREETWEAR BOGOTÁ',
    subtitle: 'COLECCIÓN COMPLETA URBANNOISE',
    description:
      'Explora todas las siluetas Boxy Fit, cápsulas de algodón pesado 240g-300g y ediciones limitadas disponibles en tienda física El GranSan y con despacho prioritario a toda Colombia.',
    bgImage:
      'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=2000&auto=format&fit=crop',
    kicker: 'MODA URBANA • TALLAS S-XL',
  },
  'latest-drops': {
    title: 'ÚLTIMOS LANZAMIENTOS',
    subtitle: 'DROP EXCLUSIVO 2026',
    description:
      'Prendas recién confeccionadas en Bogotá con serigrafía de alta densidad, tintorería ácida mineral wash y siluetas boxy de edición numerada.',
    bgImage:
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=2000&auto=format&fit=crop',
    kicker: 'NOVEDADES SEMANALES',
  },
  'young-free': {
    title: 'CÁPSULA YOUNG & FREE',
    subtitle: 'URBANO & AUDAZ',
    description:
      'Gráficos serigráficos provocadores inspirados en la escena underground contemporánea. Confección en algodón 100% peinado nacional.',
    bgImage:
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=2000&auto=format&fit=crop',
    kicker: 'CÁPSULA ESTELAR',
  },
  'weird-oversize': {
    title: 'PLEASURES & WEIRD BOXY',
    subtitle: 'INNOVACIÓN TEXTIL HEAVYWEIGHT',
    description:
      'Hombros caídos pronunciados, cuellos gruesos de 3.5cm y caída recta estructurada. El fit oversize definitivo desarrollado por URBANNOISE Bogotá.',
    bgImage:
      'https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=2000&auto=format&fit=crop',
    kicker: 'SPECIAL OVERSIZE',
  },
  'dama-oversize': {
    title: 'COLECCIÓN DAMA OVERSIZE',
    subtitle: 'ESTAMPADOS ÚNICOS & ESTILO PROPIO',
    description:
      'Prendas fluidas diseñadas para adaptarse con carácter. Cortes contemporáneos con comodidad absoluta y estética streetwear vanguardista.',
    bgImage:
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=2000&auto=format&fit=crop',
    kicker: 'CÁPSULA FEMENINA',
  },
};

export const CategoryMarketplaceView: React.FC<CategoryMarketplaceViewProps> = ({
  products,
  initialCategory = 'all',
  onBackToHome,
  onQuickView,
  onAddToCart,
  onProceedToCheckout,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedSize, setSelectedSize] = useState<string>('all');
  const [selectedColor, setSelectedColor] = useState<string>('all');
  const [selectedFabric, setSelectedFabric] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<'all' | 'under-60' | '60-100' | 'over-100'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSort, setSelectedSort] = useState<'popular' | 'price-asc' | 'price-desc' | 'newest'>('popular');
  const [justAddedSku, setJustAddedSku] = useState<string | null>(null);
  const { wishlist, toggleWishlist, isInWishlist } = useWishlist();

  // Scroll to top upon opening or changing category
  const prevCategoryRef = React.useRef(selectedCategory);
  useEffect(() => {
    if (prevCategoryRef.current !== selectedCategory) {
      prevCategoryRef.current = selectedCategory;
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [selectedCategory]);

  useEffect(() => {
    if (initialCategory) {
      setSelectedCategory(initialCategory);
    }
  }, [initialCategory]);

  const [siteCategories, setSiteCategories] = useState<CategoryCardContent[]>(() => {
    return getStoredSiteContent().categories || [];
  });

  useEffect(() => {
    const handler = (e: any) => {
      if (e.detail?.categories) {
        setSiteCategories(e.detail.categories);
      }
    };
    window.addEventListener('urbannoise_site_content_updated', handler);
    return () => window.removeEventListener('urbannoise_site_content_updated', handler);
  }, []);

  const activeCategories = useMemo(() => {
    return siteCategories
      .filter((c) => c.enabled !== false)
      .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  }, [siteCategories]);

  const currentMeta = useMemo(() => {
    if (selectedCategory === 'all') return CATEGORY_METADATA.all;
    const found = siteCategories.find((c) => c.id === selectedCategory);
    if (found) {
      return {
        title: found.name || CATEGORY_METADATA[selectedCategory]?.title || selectedCategory.toUpperCase(),
        subtitle: found.subtitle || CATEGORY_METADATA[selectedCategory]?.subtitle || 'COLECCIÓN EXCLUSIVA',
        description: found.description || CATEGORY_METADATA[selectedCategory]?.description || 'Prendas confeccionadas en Bogotá con serigrafía de alta calidad.',
        bgImage: found.image || CATEGORY_METADATA[selectedCategory]?.bgImage || CATEGORY_METADATA.all.bgImage,
        kicker: found.kicker || CATEGORY_METADATA[selectedCategory]?.kicker || 'URBANNOISE BOGOTÁ',
      };
    }
    return CATEGORY_METADATA[selectedCategory] || CATEGORY_METADATA.all;
  }, [selectedCategory, siteCategories]);

  // Conteo en tiempo real por categoría para los pills (estrictamente con stock)
  const categoryCounts = useMemo(() => {
    const inStockList = products.filter((p) => p.isPublished !== false && (p.stock || 0) > 0 && p.isAvailable !== false);
    const counts: Record<string, number> = { all: inStockList.length };
    inStockList.forEach((p) => {
      const cat = p.category || 'latest-drops';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [products]);

  // Filtrado y ordenamiento exhaustivo de prendas (Talla, Color, Tipo de Tela, Precio, Stock, Búsqueda)
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // 1. Publicado
        if (p.isPublished === false) return false;

        // 2. Ocultar estrictamente toda prenda agotada
        if ((p.stock || 0) <= 0 || p.isAvailable === false) {
          return false;
        }

        // 3. Categoría superior
        if (selectedCategory !== 'all' && p.category !== selectedCategory) {
          return false;
        }

        // 4. Filtro por TALLA (Solo prendas con stock disponible > 0 en esa talla)
        if (selectedSize !== 'all') {
          let hasSize = false;
          if (p.variants && p.variants.length > 0) {
            const matching = p.variants.filter((v: any) =>
              matchSize(selectedSize, v.size || v.option1_value || '')
            );
            if (matching.length > 0) {
              hasSize = matching.some((v: any) => (v.in_stock || 0) > 0);
            }
          } else {
            const sizes = getProductSizes(p);
            hasSize = sizes.some((s: string) => matchSize(selectedSize, s)) && (p.stock || 0) > 0;
          }
          if (!hasSize) return false;
        }

        // 5. Filtro por COLOR (Solo prendas con stock disponible > 0 en ese color)
        if (selectedColor !== 'all') {
          let hasColor = false;
          if (p.variants && p.variants.length > 0) {
            const matching = p.variants.filter((v: any) =>
              checkColorMatch(selectedColor, v.color || v.option2_value)
            );
            if (matching.length > 0) {
              hasColor = matching.some((v: any) => (v.in_stock || 0) > 0);
            }
          } else {
            hasColor =
              ((p.availableColors || []).some((c) => checkColorMatch(selectedColor, c)) ||
              checkColorMatch(selectedColor, p.color)) && (p.stock || 0) > 0;
          }
          if (!hasColor) return false;
        }

        // Combinación precisa de TALLA + COLOR en la misma prenda (debe tener stock > 0)
        if (selectedSize !== 'all' && selectedColor !== 'all') {
          if (p.variants && p.variants.length > 0) {
            const exactVariants = p.variants.filter((v: any) => {
              const vSz = matchSize(selectedSize, v.size || v.option1_value || '');
              const vCol = checkColorMatch(selectedColor, v.color || v.option2_value);
              return vSz && vCol;
            });
            if (exactVariants.length === 0 || !exactVariants.some((v: any) => (v.in_stock || 0) > 0)) {
              return false;
            }
          }
        }

        // 6. Filtro por TIPO DE TELA
        if (selectedFabric !== 'all') {
          const fabricKey = getProductFabricKey(p);
          if (fabricKey !== selectedFabric) return false;
        }

        // 7. Rango de precio
        if (priceRange === 'under-60' && p.price > 60000) return false;
        if (priceRange === '60-100' && (p.price <= 60000 || p.price > 100000)) return false;
        if (priceRange === 'over-100' && p.price <= 100000) return false;

        // 8. Búsqueda por texto (nombre, descripción, sku, categoría)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchesName = p.name.toLowerCase().includes(q);
          const matchesDesc = (p.desc || '').toLowerCase().includes(q);
          const matchesSku = (p.sku || '').toLowerCase().includes(q);
          const matchesCat = (p.categoryLabel || '').toLowerCase().includes(q);
          const matchesColor = (p.availableColors || []).some((c) => c.toLowerCase().includes(q));
          if (!matchesName && !matchesDesc && !matchesSku && !matchesCat && !matchesColor) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (selectedSort === 'price-asc') return a.price - b.price;
        if (selectedSort === 'price-desc') return b.price - a.price;
        if (selectedSort === 'newest') return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0);
        return (b.stock || 0) - (a.stock || 0);
      });
  }, [products, selectedCategory, priceRange, searchQuery, selectedSort, selectedSize, selectedColor, selectedFabric]);

  const handleQuickAdd = (product: Product, size: ProductSize, e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(product, size, 1);
    setJustAddedSku(`${product.id}-${size}`);
    setTimeout(() => setJustAddedSku(null), 1800);
  };

  const clearAllFilters = () => {
    setSelectedCategory('all');
    setSelectedSize('all');
    setSelectedColor('all');
    setSelectedFabric('all');
    setPriceRange('all');
    setSearchQuery('');
  };

  const hasActiveFilters =
    selectedCategory !== 'all' ||
    selectedSize !== 'all' ||
    selectedColor !== 'all' ||
    selectedFabric !== 'all' ||
    priceRange !== 'all' ||
    searchQuery.trim() !== '';

  return (
    <div
      className="min-h-screen bg-[#FDFCFB] text-[#101013] pb-20 antialiased selection:bg-[#101013] selection:text-[#F5F2E4]"
      style={{ paddingTop: 'var(--app-header-height, 112px)' }}
    >
      {/* 1. Barra de Navegación Superior / Breadcrumbs */}
      <div className="max-w-[1720px] mx-auto px-4 sm:px-8 py-3 flex items-center border-b border-[#E5E5E5] text-xs">
        <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-stone-500 font-medium">
          <button
            onClick={onBackToHome}
            className="hover:text-black transition cursor-pointer"
          >
            Inicio
          </button>
          <span className="text-stone-300">/</span>
          {selectedCategory !== 'all' ? (
            <>
              <button
                onClick={() => setSelectedCategory('all')}
                className="hover:text-black transition cursor-pointer"
              >
                Catálogo
              </button>
              <span className="text-stone-300">/</span>
              <span className="font-bold text-black uppercase tracking-wide">
                {currentMeta.title}
              </span>
            </>
          ) : (
            <span className="font-bold text-black uppercase tracking-wide">
              Catálogo
            </span>
          )}
        </nav>
      </div>

      {/* 2. Hero Banner de la Categoría */}
      <div className="relative w-full h-56 sm:h-72 md:h-80 bg-[#101013] text-[#F5F2E4] overflow-hidden flex items-center">
        <img
          src={currentMeta.bgImage}
          alt={`Colección ${currentMeta.title} - Streetwear URBANNOISE Bogotá`}
          className="absolute inset-0 w-full h-full object-cover opacity-40 filter contrast-125 transition-transform duration-700 hover:scale-105"
          loading="lazy"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/40" />

        <div className="relative z-10 max-w-[1720px] mx-auto px-4 sm:px-8 w-full">
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded mb-2.5 border border-white/15">
            <Sparkles className="w-3 h-3 text-[#D9C4AB]" />
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.25em] text-[#D9C4AB]">
              {currentMeta.kicker}
            </p>
          </div>

          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-[#F5F2E4] max-w-3xl leading-none">
            {currentMeta.title}
          </h1>

          <p className="text-xs sm:text-sm text-white/75 max-w-xl mt-3 leading-relaxed hidden xs:block">
            {currentMeta.description}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-white/60">
            <span className="font-extrabold font-mono text-[#F5F2E4] bg-white/15 px-2.5 py-0.5 rounded">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'prenda disponible' : 'prendas disponibles'}
            </span>
            <span>•</span>
            <span className="text-emerald-400 font-semibold flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Despacho inmediato a toda Colombia</span>
            </span>
            <span>•</span>
            <span className="text-[#D9C4AB] font-semibold hidden md:inline">
              🚚 Envío de cortesía desde $150.000 COP
            </span>
          </div>
        </div>
      </div>

      {/* 3. Barra de Navegación por Cápsula & Filtros estilo Marketplace Internacional */}
      <div
        className="sticky z-30 bg-white/95 backdrop-blur-md border-b border-[#E5E5E5] shadow-xs transition-[top] duration-150"
        style={{ top: 'var(--app-header-height, 112px)' }}
      >
        <div className="max-w-[1720px] mx-auto px-4 sm:px-8 py-3.5 space-y-3">
          {/* Fila 1: Pestañas de Categoría con Contadores */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
            {[
              { id: 'all', label: 'Todos los Drops', count: categoryCounts.all || 0 },
              ...activeCategories.map((cat) => ({
                id: cat.id,
                label: cat.menuTitle || cat.name,
                count: categoryCounts[cat.id] || 0,
              })),
            ].map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider transition flex items-center space-x-2 cursor-pointer ${
                    isActive
                      ? 'bg-[#101013] text-[#F5F2E4] shadow-sm'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                      isActive ? 'bg-white/25 text-white' : 'bg-black/10 text-stone-800'
                    }`}
                  >
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Fila 2: Filtros de Atributos de Prenda (Talla, Color, Tipo de Tela, Rango de Precio) */}
          <div className="flex flex-wrap items-center gap-2.5 pt-2.5 border-t border-stone-200/70 text-xs">
            {/* 1. Selector de TALLA */}
            <div className="flex items-center space-x-1 bg-stone-50 border border-stone-200/80 rounded-md p-1">
              <span className="text-[10px] font-black uppercase text-stone-600 px-1.5 flex items-center gap-1">
                <Tag className="w-3 h-3 text-stone-500" />
                <span>Talla:</span>
              </span>
              {[
                { id: 'all', label: 'Todas' },
                { id: 'S', label: 'S' },
                { id: 'M', label: 'M' },
                { id: 'L', label: 'L' },
                { id: 'XL', label: 'XL' },
                { id: 'S/M', label: 'S/M' },
                { id: 'L/XL', label: 'L/XL' },
                { id: 'U', label: 'Única' },
              ].map((sz) => {
                const isSelected = selectedSize === sz.id;
                return (
                  <button
                    key={sz.id}
                    onClick={() => setSelectedSize(sz.id)}
                    className={`px-2 py-0.5 rounded text-[11px] font-black transition cursor-pointer ${
                      isSelected
                        ? 'bg-[#101013] text-[#F5F2E4] shadow-xs'
                        : 'text-stone-700 hover:bg-stone-200/70'
                    }`}
                  >
                    {sz.label}
                  </button>
                );
              })}
            </div>

            {/* 2. Selector de COLOR */}
            <div className="flex items-center space-x-1.5 bg-stone-50 border border-stone-200/80 rounded-md px-2 py-1">
              <span
                className="w-3 h-3 rounded-full border border-stone-300 flex-shrink-0"
                style={{
                  backgroundColor:
                    selectedColor !== 'all' ? getColorHex(selectedColor) : '#101013',
                }}
              />
              <span className="text-[10px] font-black uppercase text-stone-600 hidden sm:inline">Color:</span>
              <select
                id="filter-marketplace-color"
                name="filterColor"
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                className="bg-transparent text-xs font-bold text-[#101013] focus:outline-none cursor-pointer pr-1"
              >
                {FILTER_COLORS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Selector de TIPO DE TELA */}
            <div className="flex items-center space-x-1.5 bg-stone-50 border border-stone-200/80 rounded-md px-2 py-1">
              <SlidersHorizontal className="w-3 h-3 text-stone-500 flex-shrink-0" />
              <span className="text-[10px] font-black uppercase text-stone-600 hidden sm:inline">Tela:</span>
              <select
                id="filter-marketplace-fabric"
                name="filterFabric"
                value={selectedFabric}
                onChange={(e) => setSelectedFabric(e.target.value)}
                className="bg-transparent text-xs font-bold text-[#101013] focus:outline-none cursor-pointer pr-1 max-w-[170px] sm:max-w-none truncate"
              >
                {FABRIC_OPTIONS.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Selector de RANGO DE PRECIO */}
            <div className="flex items-center space-x-1 bg-stone-50 border border-stone-200/80 rounded-md p-1 overflow-x-auto scrollbar-none">
              <span className="text-[10px] font-black uppercase text-stone-600 px-1 hidden md:inline">Precio:</span>
              {[
                { id: 'all', label: 'Todos' },
                { id: 'under-60', label: '< $60k' },
                { id: '60-100', label: '$60k-$100k' },
                { id: 'over-100', label: '> $100k' },
              ].map((p) => {
                const isSelected = priceRange === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setPriceRange(p.id as any)}
                    className={`px-2 py-0.5 rounded text-[11px] font-black transition cursor-pointer whitespace-nowrap ${
                      isSelected
                        ? 'bg-[#101013] text-[#F5F2E4] shadow-xs'
                        : 'text-stone-700 hover:bg-stone-200/70'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Fila 3: Buscador, Solo Disponibles, Ordenar y Limpiar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
            {/* Buscador Rápido en Marketplace */}
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                id="search-marketplace-query"
                name="searchQuery"
                type="text"
                autoComplete="off"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por diseño, silueta o color..."
                className="w-full pl-8 pr-7 py-1.5 bg-stone-100/90 border border-stone-200 rounded text-xs text-[#101013] placeholder-stone-400 focus:outline-none focus:border-black font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-black cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Stock Activo & Ordenamiento */}
            <div className="flex items-center space-x-3 flex-shrink-0">
              <div className="hidden sm:inline-flex items-center space-x-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1.5 rounded select-none">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="uppercase tracking-wide font-black">Stock Disponible</span>
              </div>

              <div className="flex items-center space-x-1.5">
                <span className="text-[11px] text-stone-500 uppercase font-semibold hidden sm:inline">
                  Ordenar:
                </span>
                <select
                  id="sort-marketplace-order"
                  name="sortOrder"
                  value={selectedSort}
                  onChange={(e) => setSelectedSort(e.target.value as any)}
                  className="bg-stone-100 border border-stone-200 rounded px-2.5 py-1.5 text-xs font-extrabold uppercase tracking-wider text-[#101013] focus:outline-none focus:border-black cursor-pointer"
                >
                  <option value="popular">Más Populares</option>
                  <option value="price-asc">Precio: Menor a Mayor</option>
                  <option value="price-desc">Precio: Mayor a Menor</option>
                  <option value="newest">Nuevos Drops</option>
                </select>
              </div>

              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="text-[11px] text-red-600 hover:text-red-700 hover:underline font-black uppercase cursor-pointer flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Limpiar</span>
                </button>
              )}
            </div>
          </div>

          {/* Fila 4: Chips de Filtros Activos & Contador de Resultados */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-stone-100 text-[11px]">
              <span className="text-stone-500 font-bold uppercase text-[10px] mr-1">Filtros Activos:</span>

              {selectedSize !== 'all' && (
                <span className="inline-flex items-center gap-1 bg-[#101013] text-[#F5F2E4] px-2 py-0.5 rounded font-black text-[10px]">
                  Talla: {selectedSize}
                  <button onClick={() => setSelectedSize('all')} className="hover:text-red-300 cursor-pointer">
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              )}

              {selectedColor !== 'all' && (
                <span className="inline-flex items-center gap-1 bg-[#101013] text-[#F5F2E4] px-2 py-0.5 rounded font-black text-[10px]">
                  <span
                    className="w-2 h-2 rounded-full border border-white/50"
                    style={{ backgroundColor: getColorHex(selectedColor) }}
                  />
                  Color: {FILTER_COLORS.find((c) => c.id === selectedColor)?.label || selectedColor}
                  <button onClick={() => setSelectedColor('all')} className="hover:text-red-300 cursor-pointer">
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              )}

              {selectedFabric !== 'all' && (
                <span className="inline-flex items-center gap-1 bg-[#101013] text-[#F5F2E4] px-2 py-0.5 rounded font-black text-[10px]">
                  Tela: {FABRIC_OPTIONS.find((f) => f.id === selectedFabric)?.label || selectedFabric}
                  <button onClick={() => setSelectedFabric('all')} className="hover:text-red-300 cursor-pointer">
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              )}

              {priceRange !== 'all' && (
                <span className="inline-flex items-center gap-1 bg-[#101013] text-[#F5F2E4] px-2 py-0.5 rounded font-black text-[10px]">
                  Precio: {priceRange === 'under-60' ? '< $60k' : priceRange === '60-100' ? '$60k-$100k' : '> $100k'}
                  <button onClick={() => setPriceRange('all')} className="hover:text-red-300 cursor-pointer">
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              )}



              {searchQuery && (
                <span className="inline-flex items-center gap-1 bg-stone-800 text-white px-2 py-0.5 rounded font-bold text-[10px]">
                  "{searchQuery}"
                  <button onClick={() => setSearchQuery('')} className="hover:text-red-300 cursor-pointer">
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              )}

              <span className="text-stone-500 font-mono text-[10px] ml-auto font-bold">
                {filteredProducts.length} prenda{filteredProducts.length === 1 ? '' : 's'} encontrada{filteredProducts.length === 1 ? '' : 's'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 4. Banner de Beneficios & Conversión Directa */}
      <div className="bg-[#FAF8F5] border-b border-[#EBEBEB] py-2.5 px-4 text-center">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-center gap-x-6 gap-y-1.5 text-[11px] text-[#555555]">
          <span className="flex items-center space-x-1.5 font-bold text-[#101013]">
            <Truck className="w-3.5 h-3.5 text-[#101013]" />
            <span>Flete de cortesía en compras desde $150.000 COP</span>
          </span>
          <span className="hidden sm:inline opacity-30">•</span>
          <span className="flex items-center space-x-1.5 font-bold text-[#101013]">
            <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
            <span>Garantía legal de 60 días y 1er cambio de talla gratuito</span>
          </span>
          <span className="hidden sm:inline opacity-30">•</span>
          <span className="font-bold text-[#002D62] flex items-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Pagos 100% seguros y encriptados • PSE, Nequi y Tarjetas</span>
          </span>
        </div>
      </div>

      {/* 5. Grilla de Productos */}
      <div className="max-w-[1720px] mx-auto px-4 sm:px-8 py-8 sm:py-12">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20 px-4 max-w-md mx-auto bg-white border border-stone-200 rounded p-8 shadow-xs">
            <Tag className="w-10 h-10 text-stone-300 mx-auto mb-3" />
            <h3 className="text-lg font-black uppercase tracking-tight text-[#101013] mb-2">
              No se encontraron prendas con estos filtros
            </h3>
            <p className="text-xs text-stone-500 mb-6 leading-relaxed">
              Prueba cambiando la cápsula seleccionada, ajustando el rango de precio o eliminando el término de búsqueda.
            </p>
            <button
              onClick={clearAllFilters}
              className="bg-[#101013] text-[#F5F2E4] px-6 py-3 text-xs font-black uppercase tracking-widest hover:bg-black transition cursor-pointer rounded"
            >
              Restablecer Todos los Filtros
            </button>
          </div>
        ) : (
          <div className="grid gap-3 sm:gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filteredProducts.map((p, idx) => {
              const isLowStock = (p.stock || 0) <= 3 && (p.stock || 0) > 0;
              const isOutOfStock = (p.stock || 0) <= 0;
              const hasSecondaryImage = p.images && p.images.length > 1;
              const isWished = wishlist.includes(p.id);

              // Simulación de social proof dinámica para alta conversión
              const liveViewers = 6 + ((idx * 3 + 2) % 14);

              return (
                <div
                  key={p.id}
                  onClick={() => onQuickView(p)}
                  className="group flex flex-col justify-between bg-white border border-stone-200 hover:border-black transition-all duration-200 cursor-pointer overflow-hidden relative shadow-xs hover:shadow-md"
                >
                  {/* Contenedor de Imagen y Badges de Intención de Compra */}
                  <div className="relative aspect-[4/5] w-full bg-[#F4F4F6] overflow-hidden">
                    <img
                      src={p.image}
                      alt={`${p.name} - Marca de ropa colombiana oversize y streetwear Bogotá`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                      decoding="async"
                    />

                    {hasSecondaryImage && (
                      <img
                        src={p.images![1]}
                        alt={`${p.name} - Detalle silueta boxy fit y caída oversize`}
                        className="w-full h-full object-cover absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                        loading="lazy"
                        decoding="async"
                      />
                    )}

                    {/* Botón de Lista de Deseos (Wishlist) */}
                    <button
                      type="button"
                      onClick={(e) => toggleWishlist(p.id, e)}
                      title={isWished ? 'Remover de lista de deseos' : 'Guardar en lista de deseos'}
                      className="absolute top-2.5 right-2.5 z-20 w-8 h-8 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-stone-700 hover:text-red-500 transition shadow-sm cursor-pointer"
                    >
                      <Heart
                        className={`w-4 h-4 ${isWished ? 'fill-red-500 text-red-500' : 'text-stone-700'}`}
                      />
                    </button>

                    {/* Badges de Escasez y Novedad */}
                    <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
                      {isLowStock && (
                        <span className="bg-red-600 text-white text-[9px] font-black px-2 py-0.5 uppercase tracking-wider rounded-xs shadow flex items-center space-x-1 animate-pulse">
                          <Flame className="w-2.5 h-2.5 fill-current" />
                          <span>¡ÚLTIMAS UNIDADES!</span>
                        </span>
                      )}
                      {p.isNew && (
                        <span className="bg-[#101013] text-[#F5F2E4] text-[9px] font-black px-2 py-0.5 uppercase tracking-wider rounded-xs">
                          NUEVO DROP
                        </span>
                      )}
                      {p.video && (
                        <span className="bg-black/85 backdrop-blur-xs text-[#F5F2E4] text-[8.5px] font-black px-2 py-0.5 uppercase tracking-wider rounded-xs flex items-center space-x-1 border border-white/20 shadow">
                          <Film className="w-2.5 h-2.5 text-[#D9C4AB] animate-pulse" />
                          <span>VIDEO</span>
                        </span>
                      )}
                      {/* Social Proof Badge */}
                      <span className="bg-black/75 backdrop-blur-xs text-[#F5F2E4] text-[8.5px] font-bold px-1.5 py-0.5 rounded-xs flex items-center space-x-1 opacity-90">
                        <TrendingUp className="w-2.5 h-2.5 text-amber-400" />
                        <span>{liveViewers} viendo ahora</span>
                      </span>
                    </div>

                    {/* Botón de Vista Rápida Hover en Pantallas Medianas/Grandes */}
                    <div className="absolute inset-x-3 bottom-12 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden sm:flex items-center justify-center z-10">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onQuickView(p);
                        }}
                        className="w-full bg-[#101013]/90 hover:bg-black text-[#F5F2E4] text-[11px] font-black uppercase tracking-wider py-2.5 rounded backdrop-blur shadow-lg transition flex items-center justify-center space-x-1.5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Vista Rápida & Medidas</span>
                      </button>
                    </div>

                    {/* SELECTOR 1-CLICK DE TALLA DIRECTO EN LA PRENDA (Muestra todas las tallas; tallas agotadas con raya roja) */}
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute inset-x-1.5 sm:inset-x-2 bottom-1.5 sm:bottom-2 bg-white/95 backdrop-blur-md p-1 sm:p-1.5 rounded border border-stone-200/80 shadow-md flex items-center justify-between z-10 text-[10px]"
                    >
                      <span className="text-[8.5px] sm:text-[9.5px] uppercase font-black text-stone-600 pl-1">
                        + Talla:
                      </span>
                      <div className="flex items-center space-x-1">
                        {getCardSizes(p).map((sz) => {
                          const stockForSz = getStockForSize(p, sz);
                          const isSzAvailable = stockForSz > 0;
                          const isAdded = justAddedSku === `${p.id}-${sz}`;

                          if (isSzAvailable) {
                            return (
                              <button
                                key={sz}
                                type="button"
                                onClick={(e) => handleQuickAdd(p, sz as ProductSize, e)}
                                title={`Agregar talla ${sz} directamente al carrito (${stockForSz} disponible${stockForSz > 1 ? 's' : ''})`}
                                className={`w-5 h-5 sm:w-6 sm:h-6 text-[9.5px] sm:text-[10px] rounded flex items-center justify-center font-black transition cursor-pointer ${
                                  isAdded
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-stone-100 hover:bg-black hover:text-white text-stone-900 active:scale-90'
                                }`}
                              >
                                {isAdded ? <Check className="w-3 h-3" /> : sz}
                              </button>
                            );
                          }

                          // Talla sin stock en tienda Noise Urban: se muestra con raya roja diagonal para que el cliente sepa que la prenda viene en esa talla pero está agotada
                          return (
                            <button
                              key={sz}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onQuickView(p);
                              }}
                              title={`Talla ${sz} (Sin stock actual en tienda Noise Urban - Clic para ver detalles)`}
                              aria-label={`Talla ${sz} sin stock`}
                              className="w-5 h-5 sm:w-6 sm:h-6 text-[9.5px] sm:text-[10px] rounded flex items-center justify-center font-bold text-stone-400 bg-stone-50/90 border border-stone-200/70 relative overflow-hidden cursor-pointer hover:border-red-400 transition"
                            >
                              <span className="opacity-60">{sz}</span>
                              <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <span className="w-[135%] h-[1.8px] bg-red-600 -rotate-45 transform rounded-full shadow-xs" />
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Información Comercial de la Prenda */}
                  <div className="p-2.5 sm:p-3.5 flex flex-col justify-between flex-1">
                    <div>
                      <div className="flex items-center justify-between text-[9.5px] sm:text-[10px] text-stone-500 font-mono mb-1">
                        <span className="truncate max-w-[120px]">{p.sku || `UN-${p.id.substring(0, 6)}`}</span>
                        <span
                          className={`font-bold ${
                            isOutOfStock
                              ? 'text-red-600'
                              : isLowStock
                              ? 'text-amber-600 font-extrabold'
                              : 'text-emerald-700'
                          }`}
                        >
                          {isOutOfStock ? 'Agotado' : isLowStock ? 'Últimas Unidades' : 'Disponible'}
                        </span>
                      </div>

                      <h3 className="font-black text-xs sm:text-sm uppercase tracking-tight text-[#101013] line-clamp-1 group-hover:text-black transition">
                        {p.name}
                      </h3>

                      <p className="text-[10.5px] sm:text-[11px] text-stone-500 mt-0.5 line-clamp-1">
                        {p.desc}
                      </p>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-stone-100 flex items-center justify-between">
                      <span className="text-xs sm:text-base font-black text-[#101013] font-mono">
                        {formatCOP(p.price)}
                      </span>
                      {p.availableColors && p.availableColors.length > 0 ? (
                        <div className="flex items-center gap-1">
                          {p.availableColors.slice(0, 3).map((col) => (
                            <span
                              key={col}
                              title={col}
                              className="w-2.5 h-2.5 rounded-full border border-black/20"
                              style={{ backgroundColor: getColorHex(col) }}
                            />
                          ))}
                          {p.availableColors.length > 3 && (
                            <span className="text-[8px] font-mono text-stone-500 font-semibold">
                              +{p.availableColors.length - 3}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[9px] sm:text-[10px] text-stone-400 uppercase font-semibold">
                          IVA Incluido
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
