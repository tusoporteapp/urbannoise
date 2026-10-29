import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Minus,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Truck,
  RotateCcw,
  ShieldCheck,
  Ruler,
  ShoppingBag,
  ArrowLeft,
  Sparkles,
  Lock,
  Flame,
  Heart,
  Store,
  Share2,
  Film,
  MessageCircle,
} from 'lucide-react';
import { Product, ProductSize } from '../types';
import { formatCOP, PRODUCTS_DATA } from '../data/products';
import { useWishlist } from '../lib/wishlist';
import { getProductSizes, normalizeSizeName } from '../lib/catalogFilters';
import { isYouTubeUrl, getYouTubeEmbedUrl, getYouTubeThumbnail } from '../lib/videoUtils';
import { ProductLookbookVideo } from './ProductLookbookVideo';
import { fetchLiveProductStock } from '../lib/loyverse';

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
  plomo: '#4A5568',
  petroleo: '#0F4C5C',
  oliva: '#556B2F',
  grafito: '#374151',
  arena: '#D2B48C',
  perla: '#EAE6DF',
};

function getColorHex(colorName: string): string {
  if (!colorName) return '#111111';
  const clean = colorName.toLowerCase().trim();
  for (const [key, hex] of Object.entries(COLOR_HEX_MAP)) {
    if (clean.includes(key)) return hex;
  }
  return '#9CA3AF';
}

interface QuickViewModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (
    product: Product,
    size: ProductSize,
    qty: number,
    color?: string,
    variantId?: string,
    sku?: string
  ) => void;
  cartCount?: number;
  onOpenCart?: () => void;
  onProceedToCheckout?: () => void;
  onSelectProduct?: (product: Product) => void;
}

export const QuickViewModal: React.FC<QuickViewModalProps> = ({
  product,
  onClose,
  onAddToCart,
  cartCount = 0,
  onOpenCart,
  onProceedToCheckout,
  onSelectProduct,
}) => {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<ProductSize>('M');
  const [qty, setQty] = useState<number>(1);
  const [activeImageIdx, setActiveImageIdx] = useState<number>(0);
  const [addedAnimation, setAddedAnimation] = useState<boolean>(false);
  const [showSizeGuide, setShowSizeGuide] = useState<boolean>(false);
  const [isStickyDismissed, setIsStickyDismissed] = useState<boolean>(false);
  const [copiedShareLink, setCopiedShareLink] = useState<boolean>(false);
  const [liveStockMap, setLiveStockMap] = useState<Record<string, number>>({});
  const [isLiveStockSynced, setIsLiveStockSynced] = useState<boolean>(false);

  // Micro-consulta de stock en vivo desde Loyverse (~300ms) al abrir o cambiar de prenda
  useEffect(() => {
    if (!product) {
      setLiveStockMap({});
      setIsLiveStockSynced(false);
      return;
    }

    const variantIds: string[] = [];
    if (product.variants && product.variants.length > 0) {
      for (const v of product.variants) {
        if (v.variant_id) variantIds.push(v.variant_id);
      }
    }
    if (product.loyverseVariantId && !variantIds.includes(product.loyverseVariantId)) {
      variantIds.push(product.loyverseVariantId);
    }

    if (variantIds.length > 0) {
      fetchLiveProductStock(variantIds).then((map) => {
        if (map && Object.keys(map).length > 0) {
          setLiveStockMap(map);
          setIsLiveStockSynced(true);
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('urbannoise_product_stock_updated', {
                detail: { productId: product.id, sku: product.sku, stockMap: map },
              })
            );
          }
        }
      });
    }
  }, [product?.id, product?.sku]);

  const handleCopyShareLink = async () => {
    try {
      const skuOrId = product?.sku || product?.id || '';
      const url = `${window.location.origin}/?product=${encodeURIComponent(skuOrId)}`;

      if (typeof navigator !== 'undefined' && navigator.share && /mobile|android|iphone/i.test(navigator.userAgent)) {
        try {
          await navigator.share({
            title: `${product?.name || 'Prenda'} | URBANNOISE`,
            text: `Mira ${product?.name} en URBANNOISE:`,
            url,
          });
          return;
        } catch {
          // Si el usuario cancela el diálogo nativo, continuar con portapapeles
        }
      }

      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
      }
      setCopiedShareLink(true);
      setTimeout(() => setCopiedShareLink(false), 2500);
    } catch {
      try {
        const skuOrId = product?.sku || product?.id || '';
        const url = `${window.location.origin}/?product=${encodeURIComponent(skuOrId)}`;
        navigator.clipboard.writeText(url);
        setCopiedShareLink(true);
        setTimeout(() => setCopiedShareLink(false), 2500);
      } catch {}
    }
  };

  // Acordeones colapsables estilo HYPE (Descripción abierta por defecto)
  const [openAccordion, setOpenAccordion] = useState<{ [key: string]: boolean }>({
    description: true,
    shipping: false,
    returns: false,
    care: false,
  });

  useEffect(() => {
    if (product) {
      // 1. Extraer colores reales de las variantes de Loyverse
      const availableColors = product.availableColors && product.availableColors.length > 0
        ? product.availableColors
        : (product.color
            ? [product.color]
            : Array.from(new Set((product.variants || []).map((v: any) => (v.color || v.option2_value || '').trim()).filter(Boolean))));
      const initialColor = availableColors[0] || '';
      setSelectedColor(initialColor);

      // 2. Extraer tallas reales de la prenda (respetando S/M, L/XL, tallas únicas, etc.)
      const productSizes = getProductSizes(product);
      const variantsForInitColor =
        product.variants && product.variants.length > 0 && initialColor
          ? product.variants.filter(
              (v: any) =>
                (v.color || v.option2_value || '').toLowerCase() === initialColor.toLowerCase()
            )
          : product.variants || [];

      // Seleccionar preferentemente la primera talla con stock para este color
      const variantWithStock = variantsForInitColor.find(
        (v: any) => (v.in_stock || 0) > 0
      );
      const defaultSize = variantWithStock
        ? normalizeSizeName(variantWithStock.size || variantWithStock.option1_value || '')
        : (productSizes[0] || 'M');
      setSelectedSize(defaultSize as ProductSize);

      setQty(1);
      setActiveImageIdx(0);
      setAddedAnimation(false);
      setShowSizeGuide(false);
      setIsStickyDismissed(false);
      setOpenAccordion({
        description: true,
        shipping: false,
        returns: false,
        care: false,
      });
      // Scroll modal to top on product change
      const scrollEl = document.getElementById('hype-product-scroll-container');
      if (scrollEl) {
        scrollEl.scrollTop = 0;
      }
    }
  }, [product]);

  // Lista de colores disponibles
  const colorsList: string[] = React.useMemo(() => {
    if (!product) return [];
    if (product.availableColors && product.availableColors.length > 0) {
      return product.availableColors;
    }
    if (product.variants && product.variants.length > 0) {
      const set = new Set<string>();
      product.variants.forEach((v: any) => {
        const c = (v.color || v.option2_value || '').trim();
        if (c) set.add(c);
      });
      if (set.size > 0) return Array.from(set);
    }
    return product.color ? [product.color] : [];
  }, [product]);

  // Variantes del color seleccionado
  const variantsForSelectedColor = React.useMemo(() => {
    if (!product || !product.variants || product.variants.length === 0) return [];
    if (!selectedColor) return product.variants;
    const filtered = product.variants.filter((v: any) =>
      (v.color || v.option2_value || '').toLowerCase() === selectedColor.toLowerCase()
    );
    return filtered.length > 0 ? filtered : product.variants;
  }, [product, selectedColor]);

  // Tallas disponibles para la prenda (detecta tallas combo S/M, L/XL, tallas estándar, etc.)
  const sizesForColor: ProductSize[] = React.useMemo(() => {
    if (!product) return ['S', 'M', 'L', 'XL'];
    return getProductSizes(product);
  }, [product]);

  // Variante específica actualmente seleccionada (Color + Talla)
  const activeVariant = React.useMemo(() => {
    if (!product || !product.variants || product.variants.length === 0) return null;
    const targetSizeNorm = normalizeSizeName(selectedSize);
    return (
      product.variants.find((v: any) => {
        const vSize = normalizeSizeName(v.size || v.option1_value || '');
        const vColor = (v.color || v.option2_value || '').toLowerCase().trim();
        const matchSize = vSize === targetSizeNorm;
        const matchColor = !selectedColor || vColor === selectedColor.toLowerCase();
        return matchSize && matchColor;
      }) || null
    );
  }, [product, selectedSize, selectedColor]);

  // Galería de imágenes: Si el producto tiene array de imágenes, las usa; de lo contrario genera ángulos de estudio
  const galleryImages: string[] = React.useMemo(() => {
    if (!product) return [];
    return product.images && product.images.length > 0
      ? product.images
      : [
          product.image || '',
          'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=1200&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1200&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=1200&auto=format&fit=crop',
        ].filter(Boolean);
  }, [product]);

  // Lista unificada de medios interactivos (Fotografías + Video Lookbook silenciado de ÚLTIMO)
  const galleryMedia = React.useMemo(() => {
    if (!product) return [];
    const items: { type: 'image' | 'video'; url: string; label?: string }[] = [];

    // 1. Todas las fotografías primero en orden
    for (let i = 0; i < galleryImages.length; i++) {
      if (galleryImages[i]) {
        items.push({ type: 'image', url: galleryImages[i] });
      }
    }

    // 2. Video editorial Motion Lookbook SIEMPRE DE ÚLTIMO
    const rawVideo = product.video || (product as any).customVideo;
    if (rawVideo && typeof rawVideo === 'string' && rawVideo.trim().length > 0 && !rawVideo.startsWith('data:')) {
      items.push({ type: 'video', url: rawVideo.trim(), label: 'Motion Lookbook' });
    }

    return items;
  }, [product, galleryImages]);

  // Stock para la combinación actual de Talla + Color (Con prioridad al stock en vivo verificado)
  const currentVariantStock = activeVariant
    ? (activeVariant.variant_id && liveStockMap[activeVariant.variant_id] !== undefined
        ? liveStockMap[activeVariant.variant_id]
        : (activeVariant.in_stock ?? 0))
    : (product?.stock ?? 0);
  const isOutOfStockForCombination = currentVariantStock <= 0;

  // IMPORTANTE: Retorno condicional ÚNICAMENTE después de declarar el 100% de los hooks de React
  if (!product) return null;

  const activeMedia = galleryMedia[activeImageIdx] || galleryMedia[0];

  const sku = activeVariant?.sku || product.sku || `LOY-${String(product.id || '').slice(0, 6)}`;
  const barcode = activeVariant?.barcode || product.barcode || '';
  const categoryLabel = product.categoryLabel || 'Streetwear';
  const fitLabel = product.fit || 'Oversized Boxy Fit';

  const toggleAccordion = (section: string) => {
    setOpenAccordion((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleSelectColor = (newColor: string) => {
    setSelectedColor(newColor);
    if (!product || !product.variants || product.variants.length === 0) return;
    const variantsForNewColor = product.variants.filter((v: any) =>
      (v.color || v.option2_value || '').toLowerCase() === newColor.toLowerCase()
    );
    if (variantsForNewColor.length > 0) {
      const sizesInNewColor = Array.from(
        new Set(
          variantsForNewColor
            .map((v: any) => (v.size || v.option1_value || '').toUpperCase().trim())
            .filter((s: string) => ['S', 'M', 'L', 'XL'].includes(s))
        )
      ) as ProductSize[];
      if (!sizesInNewColor.includes(selectedSize) && sizesInNewColor.length > 0) {
        setSelectedSize(sizesInNewColor[0]);
      }
    }
  };

  const handleAdd = () => {
    onAddToCart(
      product,
      selectedSize,
      qty,
      selectedColor || activeVariant?.option2_value || product.color,
      activeVariant?.variant_id || product.loyverseVariantId,
      sku
    );
    setAddedAnimation(true);
    if (onOpenCart) {
      onOpenCart();
    }
    setTimeout(() => {
      setAddedAnimation(false);
    }, 1500);
  };

  const handleBuyNow = () => {
    onAddToCart(
      product,
      selectedSize,
      qty,
      selectedColor || activeVariant?.option2_value || product.color,
      activeVariant?.variant_id || product.loyverseVariantId,
      sku
    );
    onClose();
    if (onProceedToCheckout) {
      onProceedToCheckout();
    } else if (onOpenCart) {
      onOpenCart();
    }
  };


  // Productos relacionados "PODRÍA GUSTARTE" (estrictamente con stock)
  const relatedProducts = PRODUCTS_DATA.filter(
    (p) => p.id !== product.id && (p.stock || 0) > 0 && p.isPublished !== false && (p.category === product.category || p.category === 'weird-oversize')
  ).slice(0, 4);

  return (
    <div
      id="quickview-modal"
      className="fixed inset-0 z-50 bg-white text-[#101013] overflow-hidden flex flex-col animate-in fade-in duration-200"
    >
      {/* Barra de Navegación Superior / Breadcrumb estilo HYPE */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E5E5E5] px-4 sm:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3 overflow-hidden text-xs sm:text-sm">
          <button
            onClick={onClose}
            className="flex items-center space-x-1.5 font-bold uppercase tracking-wider text-[#101013] hover:text-[#777777] transition cursor-pointer flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Regresar</span>
          </button>
          <span className="text-[#CCCCCC] hidden sm:inline">|</span>
          <nav className="hidden sm:flex items-center space-x-2 text-xs text-[#666666] truncate">
            <span className="hover:text-black cursor-pointer" onClick={onClose}>
              Inicio
            </span>
            <span>/</span>
            <span className="truncate">{categoryLabel}</span>
            <span>/</span>
            <span className="font-semibold text-[#101013] uppercase truncate">
              {product.name}
            </span>
          </nav>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Botón Compartir / Copiar Enlace Directo */}
          <button
            type="button"
            onClick={handleCopyShareLink}
            className="p-2 hover:bg-gray-100 rounded-full transition cursor-pointer text-[#101013] flex items-center justify-center relative"
            title={copiedShareLink ? '¡Enlace copiado!' : 'Copiar enlace directo de esta prenda'}
            aria-label="Compartir prenda"
          >
            {copiedShareLink ? (
              <Check className="w-5 h-5 text-emerald-600 animate-in zoom-in-50 duration-200" />
            ) : (
              <Share2 className="w-5 h-5" />
            )}
            {copiedShareLink && (
              <span className="absolute -bottom-7 right-0 bg-[#101013] text-[#F5F2E4] text-[9.5px] font-bold px-2 py-0.5 whitespace-nowrap shadow-md z-30">
                ¡Copiado!
              </span>
            )}
          </button>

          {onOpenCart && (
            <button
              id="quickview-cart-button"
              onClick={() => onOpenCart()}
              className="relative p-2 hover:bg-gray-100 rounded-full transition cursor-pointer text-[#101013]"
              title="Ver Carrito"
              aria-label="Ver Carrito"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span
                  id="quickview-cart-count"
                  className="absolute -top-1 -right-1 bg-[#101013] text-[#F5F2E4] text-[9px] font-black w-4.5 h-4.5 min-w-[18px] rounded-full flex items-center justify-center animate-in zoom-in-50 duration-200 shadow-sm"
                >
                  {cartCount}
                </span>
              )}
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 hover:bg-black hover:text-white rounded-none transition cursor-pointer"
            aria-label="Cerrar vista de producto"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Contenedor Principal con Scroll Vertical Fluido */}
      <div
        id="hype-product-scroll-container"
        className="flex-1 overflow-y-auto overflow-x-hidden bg-[#FAFAFA] sm:bg-white overscroll-contain"
      >
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 py-6 sm:py-10 pb-44 sm:pb-16">
          {/* Grilla de Producto: 2 Columnas idénticas a Hype.com.co */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
            {/* ==================================================== */}
            {/* COLUMNA IZQUIERDA: Galería en Cascada Estilo Zara/Balenciaga */}
            {/* ==================================================== */}
            <div className="lg:col-span-7 lg:sticky lg:top-6 self-start">
              {/* VISTA DESKTOP (lg:): Foto/Video Principal Fijo (Sticky) con Miniaturas */}
              <div className="hidden lg:flex gap-4 items-start">
                {/* Tira Lateral de Miniaturas para Salto Rápido */}
                {galleryMedia.length > 1 && (
                  <div className="flex flex-col gap-2.5 w-16 xl:w-20 max-h-[75vh] overflow-y-auto no-scrollbar flex-shrink-0">
                    {galleryMedia.map((media, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveImageIdx(idx)}
                        className={`relative w-full aspect-[3/4] bg-[#F5F5F7] overflow-hidden border transition cursor-pointer ${
                          activeImageIdx === idx
                            ? 'border-[#101013] ring-1 ring-[#101013]'
                            : 'border-transparent opacity-60 hover:opacity-100 hover:border-gray-300'
                        }`}
                        title={media.type === 'video' ? 'Ver Video Lookbook' : `Ver foto ${idx + 1}`}
                      >
                        {media.type === 'video' ? (
                          <div className="w-full h-full bg-[#101013] flex flex-col items-center justify-center text-white relative">
                            <img
                              src={getYouTubeThumbnail(media.url) || galleryImages[0]}
                              alt="Video preview"
                              className="w-full h-full object-cover opacity-60"
                            />
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
                              <Film className="w-4 h-4 text-[#D9C4AB] mb-0.5 animate-pulse" />
                              <span className="text-[7.5px] font-black tracking-widest text-[#F5F2E4] uppercase">VIDEO</span>
                            </div>
                          </div>
                        ) : (
                          <img
                            src={media.url}
                            alt={`${product.name} miniatura ${idx + 1}`}
                            className="w-full h-full object-cover object-center"
                            referrerPolicy="no-referrer"
                          />
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {/* Foto o Video Principal Fijo en Alta Resolución */}
                <div className={`relative flex-1 aspect-[3/4] max-h-[78vh] overflow-hidden flex items-center justify-center border border-gray-100 group shadow-sm ${
                  activeMedia?.type === 'video' ? 'bg-[#0A0A0C]' : 'bg-[#F5F5F7]'
                }`}>
                  {activeMedia?.type === 'video' ? (
                    <ProductLookbookVideo
                      key={`desktop-media-${activeImageIdx}`}
                      url={activeMedia.url}
                      title={`${product.name} Video`}
                      fit="contain"
                    />
                  ) : (
                    <img
                      id="hype-main-product-image-desktop"
                      src={activeMedia?.url}
                      alt={product.name}
                      className="w-full h-full object-cover object-center transition-all duration-300 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                  )}

                  <div className="absolute top-4 left-4 z-10 flex items-center space-x-1.5 bg-[#101013] text-[#F5F2E4] px-3 py-1 text-[9.5px] font-extrabold tracking-widest uppercase shadow-md">
                    {activeMedia?.type === 'video' ? (
                      <>
                        <Film className="w-3 h-3 text-[#D9C4AB] animate-pulse" />
                        <span>MOTION LOOKBOOK • SILENCIOSO</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3 text-[#D9C4AB]" />
                        <span>EDICIÓN STREETWEAR</span>
                      </>
                    )}
                  </div>
                  <div className="absolute bottom-3 right-3 bg-black/75 backdrop-blur-sm text-white/90 px-2.5 py-0.5 text-[10px] font-mono tracking-widest">
                    {activeImageIdx + 1} / {galleryMedia.length}
                  </div>
                  {galleryMedia.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          setActiveImageIdx((prev) =>
                            prev === 0 ? galleryMedia.length - 1 : prev - 1
                          )
                        }
                        className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-black hover:text-white p-2 text-black transition shadow-md rounded-none cursor-pointer"
                        aria-label="Media anterior"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setActiveImageIdx((prev) =>
                            (prev + 1) % galleryMedia.length
                          )
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-black hover:text-white p-2 text-black transition shadow-md rounded-none cursor-pointer"
                        aria-label="Siguiente media"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* VISTA MÓVIL Y TABLET (lg:hidden): Slider Touch Compacto */}
              <div className="lg:hidden flex flex-col-reverse sm:flex-row gap-4">
                {/* Tira de Miniaturas */}
                <div className="flex sm:flex-col gap-3 overflow-x-auto sm:overflow-y-auto sm:w-24 sm:max-h-[640px] flex-shrink-0 pb-2 sm:pb-0 scrollbar-none">
                  {galleryMedia.map((media, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImageIdx(idx)}
                      className={`relative w-16 h-20 sm:w-20 sm:h-24 flex-shrink-0 bg-[#F5F5F7] overflow-hidden border transition cursor-pointer ${
                        activeImageIdx === idx
                          ? 'border-[#101013] ring-1 ring-[#101013]'
                          : 'border-transparent opacity-70 hover:opacity-100 hover:border-gray-300'
                      }`}
                    >
                      {media.type === 'video' ? (
                        <div className="w-full h-full bg-[#101013] flex flex-col items-center justify-center text-white relative">
                          <img
                            src={getYouTubeThumbnail(media.url) || galleryImages[0]}
                            alt="Video preview"
                            className="w-full h-full object-cover opacity-60"
                          />
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
                            <Film className="w-3.5 h-3.5 text-[#D9C4AB] mb-0.5 animate-pulse" />
                            <span className="text-[7px] font-black tracking-widest text-[#F5F2E4] uppercase">VIDEO</span>
                          </div>
                        </div>
                      ) : (
                        <img
                          src={media.url}
                          alt={`${product.name} vista ${idx + 1}`}
                          className="w-full h-full object-cover object-center"
                          referrerPolicy="no-referrer"
                        />
                      )}
                    </button>
                  ))}
                </div>

                {/* Media Principal Móvil */}
                <div className={`relative flex-1 aspect-[4/5] sm:aspect-[3/4] overflow-hidden flex items-center justify-center border border-gray-100 ${
                  activeMedia?.type === 'video' ? 'bg-[#0A0A0C]' : 'bg-[#F5F5F7]'
                }`}>
                  {activeMedia?.type === 'video' ? (
                    <ProductLookbookVideo
                      key={`mobile-media-${activeImageIdx}`}
                      url={activeMedia.url}
                      title={`${product.name} Video`}
                      fit="contain"
                    />
                  ) : (
                    <img
                      id="hype-main-product-image"
                      src={activeMedia?.url}
                      alt={product.name}
                      className="w-full h-full object-cover object-center transition-all duration-300"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <div className="absolute top-4 left-4 z-10 flex items-center space-x-1.5 bg-[#101013] text-[#F5F2E4] px-3 py-1 text-[9.5px] font-extrabold tracking-widest uppercase shadow-md">
                    {activeMedia?.type === 'video' ? (
                      <>
                        <Film className="w-3 h-3 text-[#D9C4AB] animate-pulse" />
                        <span>MOTION LOOKBOOK</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3 text-[#D9C4AB]" />
                        <span>EDICIÓN STREETWEAR</span>
                      </>
                    )}
                  </div>
                  <div className="absolute bottom-4 right-4 z-10 bg-black/75 backdrop-blur-md text-white px-2.5 py-1 text-[10px] font-mono font-bold tracking-widest">
                    {activeImageIdx + 1} / {galleryMedia.length}
                  </div>
                  {galleryMedia.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          setActiveImageIdx((prev) =>
                            prev === 0 ? galleryMedia.length - 1 : prev - 1
                          )
                        }
                        className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-black hover:text-white p-2 text-black transition shadow-md rounded-none cursor-pointer"
                        aria-label="Media anterior"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setActiveImageIdx((prev) =>
                            (prev + 1) % galleryMedia.length
                          )
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-black hover:text-white p-2 text-black transition shadow-md rounded-none cursor-pointer"
                        aria-label="Siguiente media"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* ==================================================== */}
            {/* COLUMNA DERECHA: Ficha Técnica & Compra HYPE (Scroll Fluido) */}
            {/* ==================================================== */}
            <div className="lg:col-span-5 flex flex-col text-left lg:pl-4">
              {/* Título de la Prenda */}
              <h1
                id="hype-product-title"
                className="font-extrabold text-2xl sm:text-3xl md:text-4xl uppercase tracking-[-0.02em] leading-tight text-[#101013] mb-2"
              >
                {product.name}
              </h1>

              {/* Precio y Sello de Impuestos */}
              <div className="flex items-baseline space-x-3 mb-1">
                <span className="font-extrabold text-2xl sm:text-3xl text-[#101013] tracking-tight">
                  {formatCOP(product.price)}
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#888888]">
                  Precio regular
                </span>
              </div>
              <p className="text-[11px] font-medium text-[#777777] mb-3">
                Impuestos incluidos. Despacho nacional asegurado.
              </p>

              {/* Información de Envío y Disponibilidad */}
              <div className="mb-4 space-y-2">
                {product.stock !== undefined && product.stock <= 3 && product.stock > 0 && (
                  <div className="flex items-center space-x-2 text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600 flex-shrink-0" />
                    <span>Quedan solo {product.stock} {product.stock === 1 ? 'unidad' : 'unidades'} disponibles</span>
                  </div>
                )}

                <div className="flex items-center space-x-2 text-[11px] text-stone-700 bg-stone-50 border border-stone-200/70 px-3 py-1.5 rounded">
                  <Truck className="w-3.5 h-3.5 text-[#101013] flex-shrink-0" />
                  <span>Despacho express: Bogotá 24-48 hrs • Envíos a toda Colombia</span>
                </div>
              </div>

              {/* Referencia y Disponibilidad */}
              <div className="flex flex-wrap items-center gap-2.5 text-[10px] font-mono text-[#777777] tracking-wider mb-4 pb-3 border-b border-[#EBEBEB]">
                <span className="bg-[#F0F0F0] px-2 py-0.5 rounded font-semibold text-[#333333]">
                  REF: #{sku}
                </span>
                <span>•</span>
                {isOutOfStockForCombination ? (
                  <span className="bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded font-bold">
                    Agotado en esta combinación
                  </span>
                ) : (
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-semibold flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Disponible ({currentVariantStock} {currentVariantStock === 1 ? 'unidad' : 'unidades'})</span>
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleCopyShareLink}
                  className="sm:ml-auto text-[10px] text-[#101013]/70 hover:text-[#101013] flex items-center space-x-1.5 transition cursor-pointer bg-black/5 hover:bg-black/10 px-2 py-0.5 rounded"
                  title="Copiar enlace directo para compartir"
                >
                  <Share2 className="w-3 h-3 text-[#D9C4AB]" />
                  <span className="font-sans font-medium">{copiedShareLink ? '✓ ¡Enlace copiado!' : 'Copiar enlace'}</span>
                </button>
              </div>

              {/* Selector de Tallaje (Hombre / Unisex) */}
              <div className="mb-4">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#101013] mb-1.5">
                  Tallaje
                </label>
                <div className="inline-block bg-[#101013] text-[#F5F2E4] px-4 py-1.5 text-xs font-bold uppercase tracking-wider">
                  {fitLabel}
                </div>
              </div>

              {/* Selector de Color (Loyverse POS Multi-Color) */}
              {colorsList.length > 0 && (
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#101013]">
                      Color: <span className="text-black font-extrabold">{selectedColor || 'Estándar'}</span>
                    </label>
                    <span className="text-[10px] text-[#777777] font-medium flex items-center gap-1.5">
                      <span>{colorsList.length} {colorsList.length === 1 ? 'tono disponible' : 'tonos disponibles'}</span>
                      {isLiveStockSynced && (
                        <span className="inline-flex items-center gap-1 text-[9px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-mono font-bold" title="Stock verificado en tiempo real con Loyverse POS">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          EN VIVO
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {colorsList.map((col) => {
                      const isSelected = selectedColor.toLowerCase() === col.toLowerCase();
                      const hex = getColorHex(col);
                      const totalStockForColor = (product.variants || [])
                        .filter((v: any) => (v.color || v.option2_value || '').toLowerCase() === col.toLowerCase())
                        .reduce((sum: number, v: any) => {
                          const s = (v.variant_id && liveStockMap[v.variant_id] !== undefined)
                            ? liveStockMap[v.variant_id]
                            : (v.in_stock || 0);
                          return sum + s;
                        }, 0);
                      const isColorOutOfStock = (product.variants && product.variants.length > 0) ? totalStockForColor <= 0 : false;

                      return (
                        <button
                          key={col}
                          type="button"
                          onClick={() => handleSelectColor(col)}
                          className={`group px-3.5 py-2 rounded-xs border text-xs font-bold uppercase tracking-wider transition flex items-center space-x-2 cursor-pointer ${
                            isSelected
                              ? 'border-[#101013] bg-[#101013] text-[#F5F2E4] shadow-md ring-1 ring-black'
                              : isColorOutOfStock
                              ? 'border-stone-200 bg-stone-50 text-stone-400 opacity-60 hover:opacity-100'
                              : 'border-stone-300 bg-white text-[#101013] hover:border-black'
                          }`}
                        >
                          <span
                            className={`w-3.5 h-3.5 rounded-full flex-shrink-0 border ${
                              isSelected ? 'border-white/50' : 'border-black/20'
                            }`}
                            style={{ backgroundColor: hex }}
                          />
                          <span>{col}</span>
                          {totalStockForColor > 0 && (
                            <span
                              className={`text-[9.5px] px-1.5 py-0.2 rounded-full font-mono ${
                                isSelected ? 'bg-white/20 text-[#F5F2E4]' : 'bg-stone-100 text-stone-600'
                              }`}
                            >
                              {totalStockForColor}
                            </span>
                          )}
                          {isColorOutOfStock && (
                            <span className="text-[9px] text-red-500 font-semibold lowercase">
                              (agotado)
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Selector de Tallas con enlace a Guía de Tallas */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#101013]">
                    Talla: <span className="text-black font-extrabold">{selectedSize}</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowSizeGuide(true)}
                    className="flex items-center space-x-1 text-[11px] font-semibold tracking-wide text-[#666666] hover:text-black underline cursor-pointer"
                  >
                    <Ruler className="w-3.5 h-3.5" />
                    <span>Guía de tallas</span>
                  </button>
                </div>

                <div
                  className={`grid gap-2.5 pt-2.5 ${
                    sizesForColor.length === 1
                      ? 'grid-cols-1'
                      : sizesForColor.length === 2
                      ? 'grid-cols-2'
                      : sizesForColor.length === 3
                      ? 'grid-cols-3'
                      : sizesForColor.length === 5
                      ? 'grid-cols-5'
                      : 'grid-cols-4'
                  }`}
                  id="hype-size-selector"
                >
                  {sizesForColor.map((size) => {
                    const isSelected = normalizeSizeName(selectedSize) === normalizeSizeName(size);
                    const variantForSize = variantsForSelectedColor.find(
                      (v: any) =>
                        normalizeSizeName(v.size || v.option1_value || '') ===
                        normalizeSizeName(size)
                    );
                    const stockForSize = variantForSize
                      ? (variantForSize.variant_id && liveStockMap[variantForSize.variant_id] !== undefined
                          ? liveStockMap[variantForSize.variant_id]
                          : (variantForSize.in_stock ?? 0))
                      : (product.variants && product.variants.length > 0 ? 0 : (product.stock ?? 0));
                    const isSizeOutOfStock = stockForSize <= 0;
                    const isSizeUrgent = stockForSize > 0 && stockForSize <= 3;

                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setSelectedSize(size)}
                        className={`py-2.5 px-1 text-xs font-extrabold tracking-wider uppercase border transition cursor-pointer relative flex flex-col items-center justify-center ${
                          isSelected
                            ? 'bg-[#101013] text-[#F5F2E4] border-[#101013] shadow-md ring-1 ring-[#101013]'
                            : isSizeOutOfStock
                            ? 'bg-stone-50 text-stone-400 border-stone-200 hover:border-red-400 opacity-70'
                            : 'bg-white text-[#101013] border-[#D0D0D0] hover:border-black'
                        }`}
                      >
                        <span className={isSizeOutOfStock && !isSelected ? 'opacity-60' : ''}>
                          {size}
                        </span>
                        <span
                          className={`text-[9px] font-mono mt-0.5 ${
                            isSelected ? 'text-[#D9C4AB]' : isSizeOutOfStock ? 'text-red-500 font-bold' : 'text-stone-500'
                          }`}
                        >
                          {isSizeOutOfStock ? 'Agotada' : `${stockForSize} u.`}
                        </span>

                        {/* Raya roja diagonal para tallas sin stock (con su propio contenedor overflow-hidden para no cortar badges externos) */}
                        {isSizeOutOfStock && !isSelected && (
                          <span className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden rounded">
                            <span className="w-[140%] h-[2px] bg-red-600 -rotate-30 transform rounded-full shadow-xs" />
                          </span>
                        )}

                        {/* Badge de ¡Pocas! visible, nítido y sin cortes */}
                        {isSizeUrgent && !isSelected && (
                          <span className="absolute -top-2 -right-1 z-20 bg-red-600 text-white text-[7.5px] font-black px-1.5 py-0.5 rounded-full shadow-sm leading-none tracking-tight ring-2 ring-white uppercase select-none pointer-events-none">
                            ¡Pocas!
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Caja de Información de Tienda Oficial Noise Urban (Urbannoise) */}
              <div className="mb-5 p-3.5 bg-stone-50 border border-stone-200/90 rounded text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 font-bold uppercase tracking-wider text-[#101013]">
                    <Store className="w-3.5 h-3.5 text-[#101013]" />
                    <span>Tienda Noise Urban (Urbannoise)</span>
                  </div>
                  {currentVariantStock > 0 ? (
                    <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 font-extrabold text-[10px] px-2 py-0.5 rounded flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                      <span>{currentVariantStock} en Stock</span>
                    </span>
                  ) : (
                    <span className="bg-red-100 text-red-700 border border-red-300 font-extrabold text-[10px] px-2 py-0.5 rounded">
                      Sin Stock
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-stone-600 font-medium">
                  {currentVariantStock > 0 ? (
                    <>
                      Disponibilidad confirmada en tiempo real para{' '}
                      <strong>{selectedColor ? `${selectedColor} • ` : ''}Talla {selectedSize}</strong>.
                      Despacho inmediato a toda Colombia o retiro en tienda.
                    </>
                  ) : (
                    <>
                      Sin existencias para{' '}
                      <strong>{selectedColor ? `${selectedColor} • ` : ''}Talla {selectedSize}</strong> en la tienda Noise Urban.
                      Por favor selecciona otro color o talla disponible.
                    </>
                  )}
                </p>
              </div>

              {/* Selector de Cantidad */}
              <div className="mb-6">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#101013] mb-2">
                  Cantidad
                </label>
                <div className="inline-flex items-center border border-[#101013] bg-white">
                  <button
                    type="button"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="p-2.5 sm:p-3 hover:bg-gray-100 transition cursor-pointer"
                    aria-label="Disminuir cantidad"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-sm font-extrabold px-5 text-center min-w-[3rem]">
                    {qty}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setQty((q) => {
                        if (currentVariantStock > 0 && q >= currentVariantStock) return q;
                        return q + 1;
                      })
                    }
                    disabled={currentVariantStock > 0 && qty >= currentVariantStock}
                    className="p-2.5 sm:p-3 hover:bg-gray-100 transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Aumentar cantidad"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                {currentVariantStock > 0 && qty >= currentVariantStock && (
                  <p className="text-[10px] text-amber-700 font-bold mt-1">
                    Máximo disponible en tienda: {currentVariantStock} {currentVariantStock === 1 ? 'unidad' : 'unidades'}
                  </p>
                )}
              </div>

              {/* Botones de Acción Principales */}
              <div className="space-y-2.5 mb-8">
                {/* Botón Principal: Agregar al Carrito */}
                <button
                  type="button"
                  id="hype-add-to-cart-btn"
                  onClick={handleAdd}
                  disabled={isOutOfStockForCombination}
                  className={`w-full py-4 text-xs font-extrabold tracking-[0.2em] uppercase transition flex items-center justify-center space-x-2 border ${
                    isOutOfStockForCombination
                      ? 'bg-gray-200 text-gray-500 border-gray-300 cursor-not-allowed'
                      : addedAnimation
                      ? 'bg-emerald-700 text-white border-emerald-700 cursor-pointer'
                      : 'bg-[#101013] text-[#F5F2E4] border-[#101013] hover:bg-[#222226] cursor-pointer'
                  }`}
                >
                  {isOutOfStockForCombination ? (
                    <span>AGOTADO EN ESTA COMBINACIÓN</span>
                  ) : addedAnimation ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>¡AGREGADO AL CARRITO!</span>
                    </>
                  ) : (
                    <span>AGREGAR AL CARRITO</span>
                  )}
                </button>

                {/* Botón Secundario: Comprar Ahora */}
                <button
                  type="button"
                  id="hype-buy-now-btn"
                  onClick={handleBuyNow}
                  disabled={isOutOfStockForCombination}
                  className={`w-full py-3.5 text-xs font-extrabold tracking-[0.2em] uppercase border transition ${
                    isOutOfStockForCombination
                      ? 'hidden'
                      : 'bg-[#F5F2E4] text-[#101013] border-[#101013] hover:bg-[#101013] hover:text-[#F5F2E4] cursor-pointer'
                  }`}
                >
                  COMPRAR AHORA
                </button>

                {/* Consulta por WhatsApp si está agotado */}
                {isOutOfStockForCombination && (
                  <a
                    href={`https://wa.me/573108720491?text=${encodeURIComponent(
                      `¡Hola URBANNOISE! Estoy interesado en la prenda "${product.name}" (${product.sku || product.id}) en color ${selectedColor || 'estándar'} y talla ${selectedSize}, pero figura agotada. ¿Cuándo tendrán reposición o disponibilidad?`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-3 text-xs font-bold uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center justify-center space-x-2 rounded-xs shadow-xs"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Consultar reposición por WhatsApp</span>
                  </a>
                )}

                {/* Botón de Lista de Deseos (Wishlist) */}
                <button
                  type="button"
                  onClick={() => toggleWishlist(product.id)}
                  className="w-full py-3 text-xs font-bold uppercase tracking-wider border border-[#101013]/25 hover:border-black transition flex items-center justify-center space-x-2 text-[#101013] cursor-pointer bg-white hover:bg-gray-50 rounded-xs"
                >
                  <Heart
                    className={`w-4 h-4 transition-colors ${
                      isInWishlist(product.id) ? 'fill-red-500 text-red-500' : 'text-stone-600'
                    }`}
                  />
                  <span>
                    {isInWishlist(product.id)
                      ? 'En tu Lista de Deseos (Quitar)'
                      : 'Guardar en Lista de Deseos'}
                  </span>
                </button>

                {/* Indicador de Pago Seguro */}
                <div className="w-full py-2.5 px-3 bg-gray-50 border border-gray-200 flex items-center justify-center space-x-2 text-[10px] text-[#444444] font-medium tracking-wide">
                  <Lock className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>Pago 100% protegido y cifrado</span>
                  <span className="font-extrabold text-[#101013] tracking-wider uppercase bg-[#E8E8E8] px-1.5 py-0.5 rounded text-[9px]">
                    PSE / TARJETAS
                  </span>
                  <span>• Despacho Inmediato</span>
                </div>
              </div>

              {/* ==================================================== */}
              {/* ACORDEONES PLEGABLES ESTILO HYPE.COM.CO              */}
              {/* ==================================================== */}
              <div className="border-t border-[#E5E5E5] divide-y divide-[#E5E5E5] text-left">
                {/* 1. Descripción */}
                <div className="py-4">
                  <button
                    type="button"
                    onClick={() => toggleAccordion('description')}
                    className="w-full flex items-center justify-between text-left font-bold text-xs sm:text-sm tracking-wider uppercase text-[#101013] hover:opacity-75 transition cursor-pointer"
                  >
                    <span>Descripción</span>
                    {openAccordion.description ? (
                      <ChevronUp className="w-4 h-4 text-[#888888]" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[#888888]" />
                    )}
                  </button>

                  {openAccordion.description && (
                    <div className="pt-3 text-xs sm:text-[13px] text-[#4A4A4A] leading-relaxed space-y-3 font-normal">
                      <p>
                        {product.longDesc || (
                          <>
                            {product.desc}
                            <br />
                            <br />
                            Confeccionado en French Terry de algodón premium de alto gramaje,
                            proporciona una estructura firme, un tacto suave y una sensación de
                            confort superior. Silueta relajada pensada para ofrecer comodidad,
                            resistencia y un acabado vanguardista en cada detalle.
                          </>
                        )}
                      </p>
                      <p className="font-mono text-[11px] text-[#888888] pt-1">
                        SKU: {sku}
                      </p>
                    </div>
                  )}
                </div>

                {/* 2. Envíos y Tiempos de Entrega */}
                <div className="py-4">
                  <button
                    type="button"
                    onClick={() => toggleAccordion('shipping')}
                    className="w-full flex items-center justify-between text-left font-bold text-xs sm:text-sm tracking-wider uppercase text-[#101013] hover:opacity-75 transition cursor-pointer"
                  >
                    <div className="flex items-center space-x-2">
                      <Truck className="w-4 h-4 text-[#101013]" />
                      <span>Envío</span>
                    </div>
                    {openAccordion.shipping ? (
                      <ChevronUp className="w-4 h-4 text-[#888888]" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[#888888]" />
                    )}
                  </button>

                  {openAccordion.shipping && (
                    <div className="pt-3 text-xs sm:text-[13px] text-[#4A4A4A] leading-relaxed space-y-2.5 font-normal">
                      <p>
                        Nuestros envíos son realizados a través de transportadoras nacionales
                        oficiales con cobertura y número de guía para todo el país.
                      </p>
                      <p className="font-bold text-[#101013] uppercase tracking-wider text-[11px]">
                        TIEMPOS DE TRÁNSITO:
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-xs text-[#555555]">
                        <li>
                          <strong className="text-black">Bogotá D.C.:</strong> 24 a 48 horas
                          hábiles (Despacho de cortesía por compras desde $150.000 COP).
                        </li>
                        <li>
                          <strong className="text-black">Ciudades principales:</strong> 2 a 5
                          días hábiles.
                        </li>
                        <li>
                          <strong className="text-black">Municipios y zonas aledañas:</strong> 4
                          a 8 días hábiles.
                        </li>
                      </ul>
                      <div className="p-3 bg-[#F7F7F7] border border-gray-200 mt-2 text-xs">
                        <p className="font-bold text-[#101013]">¡IMPORTANTE!</p>
                        <p className="text-[#666666] text-[11px] mt-0.5">
                          Los envíos y entregas se realizan únicamente en días hábiles (lunes a
                          viernes, excluyendo festivos de Colombia). Disponibilidad de pago
                          contra entrega en Bogotá.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Cambios y Devoluciones */}
                <div className="py-4">
                  <button
                    type="button"
                    onClick={() => toggleAccordion('returns')}
                    className="w-full flex items-center justify-between text-left font-bold text-xs sm:text-sm tracking-wider uppercase text-[#101013] hover:opacity-75 transition cursor-pointer"
                  >
                    <div className="flex items-center space-x-2">
                      <RotateCcw className="w-4 h-4 text-[#101013]" />
                      <span>Cambios y Garantía</span>
                    </div>
                    {openAccordion.returns ? (
                      <ChevronUp className="w-4 h-4 text-[#888888]" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[#888888]" />
                    )}
                  </button>

                  {openAccordion.returns && (
                    <div className="pt-3 text-xs sm:text-[13px] text-[#4A4A4A] leading-relaxed space-y-2 font-normal">
                      <p>
                        Cuentas con <strong>15 días calendario</strong> a partir de la recepción
                        de tu paquete para solicitar el cambio de tu prenda por talla o
                        referencia.
                      </p>
                      <p className="text-[#666666] text-xs">
                        La prenda debe conservar sus etiquetas originales, no presentar señales
                        de uso ni lavado y encontrarse en su empaque original.
                      </p>
                    </div>
                  )}
                </div>

                {/* 4. Cuidados de la Prenda */}
                <div className="py-4">
                  <button
                    type="button"
                    onClick={() => toggleAccordion('care')}
                    className="w-full flex items-center justify-between text-left font-bold text-xs sm:text-sm tracking-wider uppercase text-[#101013] hover:opacity-75 transition cursor-pointer"
                  >
                    <div className="flex items-center space-x-2">
                      <ShieldCheck className="w-4 h-4 text-[#101013]" />
                      <span>Cuidados de la Prenda</span>
                    </div>
                    {openAccordion.care ? (
                      <ChevronUp className="w-4 h-4 text-[#888888]" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[#888888]" />
                    )}
                  </button>

                  {openAccordion.care && (
                    <div className="pt-3 text-xs sm:text-[13px] text-[#4A4A4A] leading-relaxed space-y-1.5 font-normal">
                      <p>• Lavar a mano o ciclo suave en máquina con agua fría.</p>
                      <p>• No usar cloro ni blanqueadores textiles.</p>
                      <p>• Secar extendido a la sombra; evitar secadora a altas temperaturas.</p>
                      <p>• No planchar directamente sobre estampados, serigrafías o parches.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ==================================================== */}
          {/* SECCIÓN INTERMEDIA: LOOKBOOK EN CASCADA              */}
          {/* Aparece justo cuando se terminan de mostrar los textos */}
          {/* ==================================================== */}
          {(galleryImages.length > 1 || Boolean(product.video)) && (
            <div className="mt-14 sm:mt-20 pt-10 border-t border-[#E5E5E5]">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-2">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.25em] text-[#888888] font-bold mb-1">
                    LOOKBOOK & DETALLES • {galleryImages.length} FOTOGRAFÍAS {product.video ? '• 1 VIDEO EDITORIAL' : ''}
                  </p>
                  <h3 className="font-extrabold text-xl sm:text-3xl uppercase tracking-tight text-[#101013]">
                    GALERÍA EDITORIAL DEL DROP
                  </h3>
                </div>
                <span className="text-xs text-[#777777] font-mono">
                  URBANNOISE STUDIO • 2026
                </span>
              </div>

              {/* Cinemagraph en Movimiento / Lookbook Video (si existe video) */}
              {product.video && typeof product.video === 'string' && !product.video.startsWith('data:') && (
                <div className="mb-8 relative w-full aspect-[4/5] sm:aspect-[16/9] md:aspect-[21/9] max-h-[560px] bg-[#0A0A0C] overflow-hidden border border-black shadow-md group">
                  <ProductLookbookVideo
                    key="lookbook-cascade-video"
                    url={product.video}
                    title={`${product.name} Video Editorial`}
                    fit="contain"
                  />
                  <div className="absolute top-4 left-4 z-30 flex items-center space-x-2 bg-black/85 backdrop-blur-md text-[#F5F2E4] px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-widest border border-white/20 pointer-events-none">
                    <Film className="w-3.5 h-3.5 text-[#D9C4AB] animate-pulse" />
                    <span>CINEMATOGRAFÍA DEL DROP • MOVIMIENTO REAL</span>
                  </div>
                </div>
              )}

              {/* Cascada de Fotos Grandes en Alta Resolución */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                {galleryImages.map((imgUrl, idx) => (
                  <div
                    key={idx}
                    className="relative bg-[#F5F5F7] aspect-[3/4] overflow-hidden border border-gray-100 group shadow-xs"
                  >
                    <img
                      src={imgUrl}
                      alt={`${product.name} lookbook ${idx + 1}`}
                      className="w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-700"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-3 left-3 bg-[#101013] text-[#F5F2E4] px-2.5 py-1 text-[9.5px] font-extrabold tracking-widest uppercase shadow">
                      VISTA 0{idx + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* SECCIÓN INFERIOR: PODRÍA GUSTARTE (Estilo HYPE)     */}
          {/* ==================================================== */}
          <div className="mt-16 sm:mt-24 pt-10 border-t border-[#E5E5E5]">
            <h3 className="font-extrabold text-lg sm:text-2xl uppercase tracking-wider mb-8 text-center sm:text-left text-[#101013]">
              <span className="underline decoration-2 underline-offset-8">PODRÍA GUSTARTE</span>
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 pb-6">
              {relatedProducts.map((relProduct) => (
                <div
                  key={relProduct.id}
                  onClick={() => {
                    if (onSelectProduct) {
                      onSelectProduct(relProduct);
                    }
                  }}
                  className="group flex flex-col justify-between bg-white border border-[#E5E5E5] hover:border-black transition cursor-pointer p-3 sm:p-4 text-left shadow-xs hover:shadow-md"
                >
                  <div>
                    <div className="aspect-[3/4] bg-[#F7F7F7] overflow-hidden mb-2.5 relative">
                      <img
                        src={relProduct.image}
                        alt={relProduct.name}
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                      />
                      <div className="absolute top-2 right-2 bg-black/85 text-white text-[8.5px] font-bold px-2 py-0.5 uppercase tracking-widest">
                        URBAN NOISE
                      </div>
                    </div>
                    <h4 className="font-extrabold text-[12px] sm:text-sm uppercase tracking-tight text-[#101013] line-clamp-3 leading-snug mb-1.5 group-hover:text-stone-600 transition break-words">
                      {relProduct.name}
                    </h4>
                  </div>
                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                    <p className="text-xs sm:text-sm font-extrabold text-[#101013] font-mono">
                      {formatCOP(relProduct.price)}
                    </p>
                    <span className="text-[10px] uppercase font-bold text-stone-500 group-hover:text-black">
                      Ver →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================== */}
      {/* MODAL GUÍA DE TALLAS                                  */}
      {/* ==================================================== */}
      {showSizeGuide && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowSizeGuide(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white max-w-lg w-full p-6 sm:p-8 shadow-2xl relative border border-black"
          >
            <button
              onClick={() => setShowSizeGuide(false)}
              className="absolute top-4 right-4 p-1 hover:bg-black hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2 mb-2">
              <Ruler className="w-5 h-5 text-[#101013]" />
              <h4 className="text-base sm:text-lg font-extrabold uppercase tracking-tight">
                Guía de Tallas Streetwear
              </h4>
            </div>
            <p className="text-xs text-[#666666] mb-5">
              Medidas corporales aproximadas en centímetros para siluetas Boxy y Relaxed.
            </p>

            <table className="w-full text-xs text-left border-collapse border border-gray-200 mb-6">
              <thead>
                <tr className="bg-[#101013] text-white">
                  <th className="p-2.5 border border-gray-300 font-extrabold">Talla</th>
                  <th className="p-2.5 border border-gray-300 font-extrabold">Pecho (cm)</th>
                  <th className="p-2.5 border border-gray-300 font-extrabold">Largo (cm)</th>
                  <th className="p-2.5 border border-gray-300 font-extrabold">Manga (cm)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="p-2.5 font-bold bg-[#F9F9F9]">S</td>
                  <td className="p-2.5">108 - 112</td>
                  <td className="p-2.5">70</td>
                  <td className="p-2.5">62</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold bg-[#F9F9F9]">M</td>
                  <td className="p-2.5">114 - 118</td>
                  <td className="p-2.5">73</td>
                  <td className="p-2.5">64</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold bg-[#F9F9F9]">L</td>
                  <td className="p-2.5">120 - 124</td>
                  <td className="p-2.5">76</td>
                  <td className="p-2.5">66</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold bg-[#F9F9F9]">XL</td>
                  <td className="p-2.5">126 - 132</td>
                  <td className="p-2.5">79</td>
                  <td className="p-2.5">68</td>
                </tr>
              </tbody>
            </table>

            <button
              onClick={() => setShowSizeGuide(false)}
              className="w-full bg-[#101013] text-[#F5F2E4] font-extrabold text-xs uppercase tracking-widest py-3 hover:bg-black transition cursor-pointer"
            >
              ENTENDIDO
            </button>
          </div>
        </div>
      )}
      {/* BARRA FLOTANTE DE COMPRA RÁPIDA EN MÓVIL (Sticky Add To Bag) */}
      {!isStickyDismissed && (
        <div className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-white/98 backdrop-blur-lg border-t border-stone-200 px-3 py-2.5 shadow-[0_-4px_20px_rgba(0,0,0,0.12)] flex items-center justify-between gap-2.5 animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center space-x-2.5 min-w-0 flex-1">
            <img
              src={product.image}
              alt={product.name}
              className="w-10 h-12 object-cover rounded bg-stone-100 flex-shrink-0 border border-stone-200"
            />
            <div className="min-w-0 flex-1">
              <p
                className="text-[11.5px] font-black uppercase text-[#101013] line-clamp-2 leading-tight break-words"
                title={product.name}
              >
                {product.name}
              </p>
              <p className="text-[11px] font-bold text-stone-900 font-mono mt-0.5">
                {formatCOP(product.price)}{' '}
                <span className="text-stone-500 font-normal">
                  • Talla {selectedSize} {selectedColor ? `(${selectedColor})` : ''}
                </span>
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-1.5 flex-shrink-0">
            <button
              onClick={handleAdd}
              disabled={isOutOfStockForCombination}
              className="bg-[#101013] text-[#F5F2E4] text-[11px] font-black uppercase px-3.5 py-2.5 rounded shadow transition cursor-pointer active:scale-95 disabled:bg-stone-300 disabled:text-stone-500 min-h-[40px]"
            >
              {isOutOfStockForCombination
                ? 'AGOTADO'
                : addedAnimation
                ? '¡AGREGADO!'
                : 'AGREGAR'}
            </button>
            <button
              type="button"
              onClick={() => setIsStickyDismissed(true)}
              className="p-1.5 text-stone-400 hover:text-black transition cursor-pointer rounded-full hover:bg-stone-100"
              title="Ocultar barra"
              aria-label="Ocultar barra inferior"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
