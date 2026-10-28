import React, { useState, useEffect } from 'react';
import {
  LayoutTemplate,
  Image as ImageIcon,
  Type,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Check,
  RefreshCw,
  Save,
  Megaphone,
  Store,
  Eye,
  AlertCircle,
  Upload,
  Truck,
  MessageCircle,
  Share2,
  BookOpen,
  Grid,
  Sparkles,
  Monitor,
  Smartphone,
  Info,
  HelpCircle,
  Shield,
  Link2,
  ExternalLink,
  Layers,
  Tag,
  Bookmark,
  Search,
  CheckSquare,
  Square,
  Package,
  X,
  Loader2,
  Star,
  Flame,
  Clock,
} from 'lucide-react';
import {
  HeroSlide,
  SiteContentConfig,
  CategoryCardContent,
  BrandManifestoContent,
  ShippingRatesConfig,
  SocialLinksConfig,
  WhatsAppFloatingConfig,
  HomeSectionsConfig,
  Product,
  ProductCustomization,
  HomeBlockItem,
} from '../types';
import {
  getStoredSiteContent,
  saveSiteContent,
  saveSiteContentToGitHub,
  DEFAULT_SITE_CONTENT,
  DEFAULT_HOME_BLOCKS,
  DEFAULT_COUNTDOWN_BANNER,
} from '../lib/siteContent';
import { getGitHubConfig } from '../lib/githubStorage';
import { PRODUCTS_DATA, formatCOP } from '../data/products';
import { getStoredCustomizations, saveBulkProductCustomizations } from '../lib/loyverse';

interface SiteContentEditorProps {
  onShowToast?: (msg: string) => void;
  products?: Product[];
  onNavigateToCatalog?: (categoryId?: string) => void;
  onCatalogUpdated?: () => void;
}

type EditorSubTab =
  | 'hero'
  | 'categories'
  | 'shipping'
  | 'announcements-whatsapp'
  | 'flagship-manifesto'
  | 'sections-social';

export const SiteContentEditor: React.FC<SiteContentEditorProps> = ({
  onShowToast,
  products = [],
  onNavigateToCatalog,
  onCatalogUpdated,
}) => {
  const [content, setContent] = useState<SiteContentConfig>(() =>
    getStoredSiteContent()
  );
  const [activeSubTab, setActiveSubTab] = useState<EditorSubTab>('hero');
  const [selectedSlideIndex, setSelectedSlideIndex] = useState<number>(0);
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState<number>(0);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<string>('');
  const [catalogVersion, setCatalogVersion] = useState<number>(0);

  useEffect(() => {
    const handleCatalogUpdate = () => {
      setCatalogVersion((v) => v + 1);
    };
    window.addEventListener('urbannoise_catalog_updated', handleCatalogUpdate);
    return () => {
      window.removeEventListener('urbannoise_catalog_updated', handleCatalogUpdate);
    };
  }, []);

  // Estados interactivos para categorías y conexiones
  const [categoryPreviewMode, setCategoryPreviewMode] = useState<'card' | 'banner' | 'header'>('card');
  const [showCategoryGuide, setShowCategoryGuide] = useState<boolean>(false);

  // Estados para creación de nueva categoría dinámica
  const [isCreatingCategory, setIsCreatingCategory] = useState<boolean>(false);
  const [newCatName, setNewCatName] = useState<string>('');
  const [newCatId, setNewCatId] = useState<string>('');
  const [newCatMenuTitle, setNewCatMenuTitle] = useState<string>('');
  const [newCatMobileTitle, setNewCatMobileTitle] = useState<string>('');
  const [newCatSubtitle, setNewCatSubtitle] = useState<string>('');
  const [newCatBadge, setNewCatBadge] = useState<string>('NUEVO');
  const [newCatImage, setNewCatImage] = useState<string>(
    'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=1000&auto=format&fit=crop'
  );
  const [newCatKicker, setNewCatKicker] = useState<string>('CÁPSULA EXCLUSIVA');
  const [newCatDesc, setNewCatDesc] = useState<string>('');

  // Plantillas de 1 Clic para Crear Categorías Urbanas
  const STREETWEAR_CATEGORY_PRESETS = [
    {
      label: '🧥 Buzos & Hoodies',
      name: 'HOODIES & BUZOS OVERSIZE',
      menuTitle: 'Buzos',
      mobileTitle: 'COLECCIÓN BUZOS & HOODIES',
      id: 'hoodies-buzos',
      subtitle: 'Algodón Rústico Pesado 320g',
      badge: 'HOODIES',
      kicker: 'CÁPSULA OVERSIZE BOGOTÁ',
      description: 'Buzos con capota estructurada, bolsillo canguro y caída pesada confeccionados en Bogotá.',
      image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=1000&auto=format&fit=crop',
    },
    {
      label: '👕 Camisetas Boxy',
      name: 'CAMISETAS BOXY FIT',
      menuTitle: 'Camisetas',
      mobileTitle: 'CAMISETAS BOXY FIT 240G',
      id: 'camisetas-boxy',
      subtitle: 'Algodón Peinado 240g',
      badge: 'BOXY FIT',
      kicker: 'SILUETAS PESADAS',
      description: 'Camisetas con cuello redondo reforzado de 3cm y silueta ancha con caída impecable.',
      image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1000&auto=format&fit=crop',
    },
    {
      label: '👖 Pantalones Cargo',
      name: 'PANTALONES & CARGO STREET',
      menuTitle: 'Pantalones',
      mobileTitle: 'PANTALONES & CARGO JOGGERS',
      id: 'pantalones-cargo',
      subtitle: 'Dril Rígido & Bolsillos Tácticos',
      badge: 'CARGO',
      kicker: 'STREETWEAR FUNCIONAL',
      description: 'Siluetas holgadas con bolsillos fuelle y pretina ajustable para outfit urbano.',
      image: 'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?q=80&w=1000&auto=format&fit=crop',
    },
    {
      label: '🧢 Gorras & Caps',
      name: 'GORRAS & ACCESORIOS URBANOS',
      menuTitle: 'Gorras',
      mobileTitle: 'GORRAS & ACCESORIOS STREETWEAR',
      id: 'gorras-accesorios',
      subtitle: 'Bordados 3D en Relieve',
      badge: 'ACCESORIOS',
      kicker: 'COMPLEMENTOS STREETWEAR',
      description: 'Gorras snapback y trucker con bordado de alta definición y broche metálico.',
      image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?q=80&w=1000&auto=format&fit=crop',
    },
    {
      label: '⚡ Edición Acid Wash',
      name: 'ACID WASH VINTAGE',
      menuTitle: 'Acid Wash',
      mobileTitle: 'EDICIÓN ESPECIAL ACID WASH',
      id: 'acid-wash',
      subtitle: 'Lavado Mineral Artesanal',
      badge: 'VINTAGE',
      kicker: 'EDICIÓN LIMITADA BOGOTÁ',
      description: 'Prendas con efecto desgastado artesanal, cada pieza tiene un teñido irrepetible.',
      image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=1000&auto=format&fit=crop',
    },
  ];

  // Galería de Fotos Recomendadas de Alta Definición (Streetwear)
  const CURATED_STREETWEAR_PHOTOS = [
    { label: 'Negro Street', url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1000&auto=format&fit=crop' },
    { label: 'Underground', url: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=1000&auto=format&fit=crop' },
    { label: 'Hoodie Boxy', url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=1000&auto=format&fit=crop' },
    { label: 'Weird Oversize', url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=1000&auto=format&fit=crop' },
    { label: 'Dama Urbana', url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop' },
    { label: 'Algodón Pesado', url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1000&auto=format&fit=crop' },
  ];

  const isSystemProtectedCategory = (id?: string) => {
    if (!id) return false;
    return id === 'latest-drops' || id === 'young-free' || id === 'weird-oversize' || id === 'dama-oversize';
  };

  // Estados para Selector de Prendas Estrella (Top Picks en Portada)
  const [isSelectingFeaturedModal, setIsSelectingFeaturedModal] = useState<boolean>(false);
  const [featuredSearchTerm, setFeaturedSearchTerm] = useState<string>('');
  const [featuredFilterTab, setFeaturedFilterTab] = useState<'all' | 'starred' | 'unstarred'>('all');

  const currentFeaturedSkus: string[] = Array.isArray(content.featuredSkus) ? content.featuredSkus : [];
  const allAvailableProducts = products && products.length > 0 ? products : PRODUCTS_DATA;

  const handleToggleFeaturedSku = (skuOrId: string) => {
    if (!skuOrId) return;
    const clean = skuOrId.trim();
    setContent((prev) => {
      const existing = Array.isArray(prev.featuredSkus) ? [...prev.featuredSkus] : [];
      const idx = existing.indexOf(clean);
      let updated: string[];
      if (idx >= 0) {
        updated = existing.filter((s) => s !== clean);
      } else {
        updated = [...existing, clean];
      }
      return {
        ...prev,
        featuredSkus: updated,
      };
    });
  };

  const handleMoveFeaturedSku = (index: number, direction: 'up' | 'down') => {
    const list = [...currentFeaturedSkus];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;

    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;

    setContent((prev) => ({
      ...prev,
      featuredSkus: list,
    }));
  };

  const handleRemoveFeaturedSku = (skuOrId: string) => {
    setContent((prev) => ({
      ...prev,
      featuredSkus: (prev.featuredSkus || []).filter((s) => s !== skuOrId),
    }));
  };

  const handleClearAllFeaturedSkus = () => {
    if (confirm('¿Deseas desmarcar todas las prendas estrella? La vitrina de la portada volverá a mostrar las novedades automáticas de Loyverse.')) {
      setContent((prev) => ({
        ...prev,
        featuredSkus: [],
      }));
      onShowToast?.('Se han desmarcado todas las prendas estrella.');
    }
  };

  const getProductBySkuOrId = (skuOrId: string): Product | undefined => {
    if (!skuOrId) return undefined;
    const clean = skuOrId.trim().toLowerCase();
    return allAvailableProducts.find(
      (p) =>
        (p.sku && p.sku.toLowerCase() === clean) ||
        (p.id && p.id.toLowerCase() === clean)
    );
  };

  const filteredFeaturedProducts = allAvailableProducts.filter((p) => {
    const sku = p.sku || p.id;
    const query = featuredSearchTerm.trim().toLowerCase();
    const matchesQuery =
      !query ||
      (p.name && p.name.toLowerCase().includes(query)) ||
      (p.sku && p.sku.toLowerCase().includes(query)) ||
      (p.category && p.category.toLowerCase().includes(query));

    if (!matchesQuery) return false;

    const isStarred = currentFeaturedSkus.includes(sku);
    if (featuredFilterTab === 'starred') return isStarred;
    if (featuredFilterTab === 'unstarred') return !isStarred;
    return true;
  });

  // Estados para el Asignador Masivo de Prendas a Categorías
  const [bulkModalCategory, setBulkModalCategory] = useState<CategoryCardContent | null>(null);
  const [bulkSelectedSkus, setBulkSelectedSkus] = useState<Set<string>>(new Set());
  const [bulkInitialSkus, setBulkInitialSkus] = useState<Set<string>>(new Set());
  const [bulkSearchTerm, setBulkSearchTerm] = useState<string>('');
  const [bulkFilter, setBulkFilter] = useState<'all' | 'assigned' | 'other'>('all');
  const [isSavingBulk, setIsSavingBulk] = useState<boolean>(false);
  const [bulkFeedback, setBulkFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const getProductCountForCategory = (catId?: string) => {
    if (!catId) return 0;
    const list = products && products.length > 0 ? products : PRODUCTS_DATA;
    const storedCustoms = getStoredCustomizations();
    return list.filter((p) => {
      const custom = storedCustoms[p.sku || p.id];
      const effectiveCategory = custom?.category || p.category;
      return effectiveCategory === catId && p.isPublished !== false;
    }).length;
  };

  const handleOpenBulkAssignModal = (category: CategoryCardContent) => {
    const allAvailableProducts = products && products.length > 0 ? products : PRODUCTS_DATA;
    const storedCustoms = getStoredCustomizations();

    const initialSkus = new Set<string>();
    allAvailableProducts.forEach((p) => {
      const sku = p.sku || p.id;
      const custom = storedCustoms[sku];
      const effectiveCategory = custom?.category || p.category;
      if (effectiveCategory === category.id) {
        initialSkus.add(sku);
      }
    });

    setBulkModalCategory(category);
    setBulkInitialSkus(new Set(initialSkus));
    setBulkSelectedSkus(new Set(initialSkus));
    setBulkSearchTerm('');
    setBulkFilter('all');
    setBulkFeedback(null);
  };

  const handleToggleProductSku = (sku: string) => {
    setBulkSelectedSkus((prev) => {
      const next = new Set(prev);
      if (next.has(sku)) {
        next.delete(sku);
      } else {
        next.add(sku);
      }
      return next;
    });
  };

  const handleSelectAllVisible = (skus: string[]) => {
    setBulkSelectedSkus((prev) => {
      const next = new Set(prev);
      skus.forEach((s) => next.add(s));
      return next;
    });
  };

  const handleDeselectAllVisible = (skus: string[]) => {
    setBulkSelectedSkus((prev) => {
      const next = new Set(prev);
      skus.forEach((s) => next.delete(s));
      return next;
    });
  };

  const handleSaveBulkAssignment = async () => {
    if (!bulkModalCategory) return;

    const newlyAdded = Array.from(bulkSelectedSkus).filter((s) => !bulkInitialSkus.has(s));
    const newlyRemoved = Array.from(bulkInitialSkus).filter((s) => !bulkSelectedSkus.has(s));

    if (newlyAdded.length === 0 && newlyRemoved.length === 0) {
      setBulkFeedback({
        type: 'success',
        message: 'No se detectaron cambios en la asignación de prendas.',
      });
      setTimeout(() => {
        setBulkModalCategory(null);
        setBulkFeedback(null);
      }, 800);
      return;
    }

    setIsSavingBulk(true);
    setBulkFeedback(null);

    try {
      const allAvailableProducts = products && products.length > 0 ? products : PRODUCTS_DATA;
      const storedCustoms = getStoredCustomizations();
      const itemsToUpdate: ProductCustomization[] = [];

      // 1. Prendas nuevas que se van a sumar a esta categoría
      newlyAdded.forEach((sku) => {
        const prod = allAvailableProducts.find((p) => (p.sku || p.id) === sku);
        if (prod) {
          const existingCustom = storedCustoms[sku];
          itemsToUpdate.push({
            ...(existingCustom || {}),
            sku,
            name: existingCustom?.name || prod.name,
            desc: existingCustom?.desc || prod.desc || '',
            category: bulkModalCategory.id,
            categoryLabel: bulkModalCategory.name,
            price: existingCustom?.price ?? prod.price,
            images:
              existingCustom?.images && existingCustom.images.length > 0
                ? existingCustom.images
                : prod.images && prod.images.length > 0
                ? prod.images
                : [prod.image],
            video: existingCustom?.video || prod.video,
            fit: existingCustom?.fit || prod.fit,
            isPublished: existingCustom?.isPublished ?? prod.isPublished !== false,
            availableSizes: existingCustom?.availableSizes || prod.availableSizes,
            availableColors: existingCustom?.availableColors || prod.availableColors,
            variants: existingCustom?.variants || prod.variants,
            loyverseItemId: existingCustom?.loyverseItemId || prod.loyverseItemId,
            loyverseVariantId: existingCustom?.loyverseVariantId || prod.loyverseVariantId,
            updatedAt: new Date().toISOString(),
          });
        }
      });

      // 2. Prendas que estaban en esta categoría pero se desmarcaron -> mover a 'latest-drops'
      newlyRemoved.forEach((sku) => {
        const prod = allAvailableProducts.find((p) => (p.sku || p.id) === sku);
        if (prod) {
          const existingCustom = storedCustoms[sku];
          itemsToUpdate.push({
            ...(existingCustom || {}),
            sku,
            name: existingCustom?.name || prod.name,
            desc: existingCustom?.desc || prod.desc || '',
            category: 'latest-drops',
            categoryLabel: 'Últimos Lanzamientos',
            price: existingCustom?.price ?? prod.price,
            images:
              existingCustom?.images && existingCustom.images.length > 0
                ? existingCustom.images
                : prod.images && prod.images.length > 0
                ? prod.images
                : [prod.image],
            video: existingCustom?.video || prod.video,
            fit: existingCustom?.fit || prod.fit,
            isPublished: existingCustom?.isPublished ?? prod.isPublished !== false,
            availableSizes: existingCustom?.availableSizes || prod.availableSizes,
            availableColors: existingCustom?.availableColors || prod.availableColors,
            variants: existingCustom?.variants || prod.variants,
            loyverseItemId: existingCustom?.loyverseItemId || prod.loyverseItemId,
            loyverseVariantId: existingCustom?.loyverseVariantId || prod.loyverseVariantId,
            updatedAt: new Date().toISOString(),
          });
        }
      });

      const res = await saveBulkProductCustomizations(itemsToUpdate, true);
      if (res.success) {
        if (onCatalogUpdated) {
          onCatalogUpdated();
        }
        if (onShowToast) {
          onShowToast(`¡${bulkSelectedSkus.size} prendas asignadas con éxito a ${bulkModalCategory.name}!`);
        }
        setBulkFeedback({
          type: 'success',
          message: `¡Asignación guardada con éxito! ${bulkSelectedSkus.size} prendas ahora pertenecen a "${bulkModalCategory.name}".`,
        });

        setTimeout(() => {
          setBulkModalCategory(null);
          setBulkFeedback(null);
        }, 1200);
      } else {
        setBulkFeedback({
          type: 'error',
          message: res.error || 'Ocurrió un error al guardar la asignación.',
        });
      }
    } catch (err: any) {
      setBulkFeedback({
        type: 'error',
        message: err.message || 'Error inesperado al guardar la asignación.',
      });
    } finally {
      setIsSavingBulk(false);
    }
  };

  const handleApplyCategoryPreset = (preset: typeof STREETWEAR_CATEGORY_PRESETS[0]) => {
    setNewCatName(preset.name);
    setNewCatId(preset.id);
    setNewCatMenuTitle(preset.menuTitle);
    setNewCatMobileTitle(preset.mobileTitle);
    setNewCatSubtitle(preset.subtitle);
    setNewCatBadge(preset.badge);
    setNewCatKicker(preset.kicker);
    setNewCatDesc(preset.description);
    setNewCatImage(preset.image);
  };

  const COUNTDOWN_PRESETS = [
    {
      label: '🔥 Flash Drop (48h)',
      title: 'FLASH DROP STREETWEAR',
      subtitle: 'Siluetas boxy de alto gramaje con inventario limitado al detal',
      ctaText: 'COMPRAR ANTES DE QUE SE AGOTE →',
      ctaAnchor: '#latest-drops',
      hours: 48,
      theme: 'gold' as const,
    },
    {
      label: '⚡ Weekend Drop (72h)',
      title: 'WEEKEND DROP EXCLUSIVO',
      subtitle: 'Confección premium en Bogotá • Disponible solo hasta el domingo a medianoche',
      ctaText: 'VER PIEZAS DISPONIBLES →',
      ctaAnchor: '#latest-drops',
      hours: 72,
      theme: 'neon' as const,
    },
    {
      label: '🔒 Cápsula Limitada (24h)',
      title: 'CÁPSULA LIMITADA 2026',
      subtitle: 'Pocas unidades por talla (S a XL) • Despacho express nacional',
      ctaText: 'EXPLORAR CÁPSULA →',
      ctaAnchor: '#latest-drops',
      hours: 24,
      theme: 'dark' as const,
    },
    {
      label: '🚚 Envío Flash de Cortesía (12h)',
      title: 'DESPACHO DE CORTESÍA FLASH',
      subtitle: 'Envíos sin costo adicional a toda Colombia por las próximas horas',
      ctaText: 'APROVECHAR BENEFICIO →',
      ctaAnchor: '#latest-drops',
      hours: 12,
      theme: 'red' as const,
    },
  ];

  const handleApplyCountdownPreset = (preset: typeof COUNTDOWN_PRESETS[0]) => {
    const targetDate = new Date(Date.now() + preset.hours * 60 * 60 * 1000);
    const pad = (n: number) => String(n).padStart(2, '0');
    const localIso = `${targetDate.getFullYear()}-${pad(targetDate.getMonth() + 1)}-${pad(targetDate.getDate())}T${pad(targetDate.getHours())}:${pad(targetDate.getMinutes())}`;

    setContent((prev) => ({
      ...prev,
      countdownBanner: {
        ...(prev.countdownBanner || DEFAULT_COUNTDOWN_BANNER),
        enabled: true,
        title: preset.title,
        subtitle: preset.subtitle,
        ctaText: preset.ctaText,
        ctaAnchor: preset.ctaAnchor,
        theme: preset.theme,
        endDate: localIso,
        autoHideOnEnd: true,
        expiredMessage: 'DROP FINALIZADO',
      },
    }));
    onShowToast?.(`Plantilla "${preset.label}" aplicada y activada.`);
  };

  const toDatetimeLocal = (dateStr?: string): string => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const formatRemainingPreview = (dateStr?: string): string => {
    if (!dateStr) return 'Fecha no definida';
    const target = new Date(dateStr).getTime();
    if (isNaN(target)) return 'Fecha inválida';
    const diff = target - Date.now();
    if (diff <= 0) return '⏰ Tiempo expirado';
    const seconds = Math.floor((diff / 1000) % 60);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${days > 0 ? `${days}d ` : ''}${pad(hours)}h : ${pad(minutes)}m : ${pad(seconds)}s`;
  };

  const homeBlocksList: HomeBlockItem[] = (
    content.homeBlocks && content.homeBlocks.length > 0
      ? content.homeBlocks
      : DEFAULT_HOME_BLOCKS
  ).slice().sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

  const handleToggleBlockEnabled = (blockId: string) => {
    setContent((prev) => {
      const currentList = (
        prev.homeBlocks && prev.homeBlocks.length > 0
          ? prev.homeBlocks
          : DEFAULT_HOME_BLOCKS
      ).slice();

      const updated = currentList.map((b) => {
        if (b.id === blockId) {
          return { ...b, enabled: b.enabled === false ? true : false };
        }
        return b;
      });

      return {
        ...prev,
        homeBlocks: updated,
      };
    });
  };

  const handleMoveBlock = (index: number, direction: 'up' | 'down') => {
    const list = [...homeBlocksList];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;

    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;

    const reordered = list.map((item, idx) => ({
      ...item,
      order: idx + 1,
    }));

    setContent((prev) => ({
      ...prev,
      homeBlocks: reordered,
    }));
  };

  const handleResetHomeBlocks = () => {
    if (confirm('¿Restablecer todas las secciones de la portada al orden y visibilidad por defecto?')) {
      setContent((prev) => ({
        ...prev,
        homeBlocks: DEFAULT_HOME_BLOCKS,
      }));
      onShowToast?.('Secciones de portada restablecidas.');
    }
  };

  const handleNewCategoryImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido (JPG, PNG, WEBP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setNewCatImage(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const currentSlide: HeroSlide | undefined = content.heroSlides[selectedSlideIndex];
  const categoriesList: CategoryCardContent[] = content.categories || DEFAULT_SITE_CONTENT.categories || [];
  const currentCategory: CategoryCardContent | undefined = categoriesList[selectedCategoryIndex];

  // ==============================================================
  // HANDLERS HERO
  // ==============================================================
  const handleUpdateCurrentSlide = (field: keyof HeroSlide, value: any) => {
    setContent((prev) => {
      const newSlides = [...prev.heroSlides];
      if (newSlides[selectedSlideIndex]) {
        newSlides[selectedSlideIndex] = {
          ...newSlides[selectedSlideIndex],
          [field]: value,
        };
      }
      return { ...prev, heroSlides: newSlides };
    });
  };

  const handleSlideImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido (JPG, PNG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        handleUpdateCurrentSlide('img', dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddSlide = () => {
    const nextIndex = content.heroSlides.length + 1;
    const newSlide: HeroSlide = {
      id: Date.now(),
      label: nextIndex < 10 ? `0${nextIndex}` : `${nextIndex}`,
      titleBold: 'NUEVA',
      titleLight: 'colección',
      subtitle: 'URBANNOISE',
      badge: 'DROP EXCLUSIVO',
      badgeSub: 'TALLAS S - XL',
      desc: 'Nueva silueta streetwear de edición limitada confeccionada en Bogotá con patrones holgados y alta durabilidad.',
      ctaText: 'COMPRAR DROP AHORA',
      ctaAnchor: '#latest-drops',
      img: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=2000&auto=format&fit=crop',
    };

    setContent((prev) => ({
      ...prev,
      heroSlides: [...prev.heroSlides, newSlide],
    }));
    setSelectedSlideIndex(content.heroSlides.length);
  };

  const handleDeleteSlide = (indexToDelete: number) => {
    if (content.heroSlides.length <= 1) {
      alert('El carrusel debe conservar al menos 1 slide para la portada.');
      return;
    }
    if (confirm('¿Deseas eliminar este slide de la portada?')) {
      setContent((prev) => {
        const filtered = prev.heroSlides.filter((_, idx) => idx !== indexToDelete);
        const renumbered = filtered.map((slide, i) => ({
          ...slide,
          label: i + 1 < 10 ? `0${i + 1}` : `${i + 1}`,
        }));
        return { ...prev, heroSlides: renumbered };
      });
      setSelectedSlideIndex((prev) => (prev > 0 ? prev - 1 : 0));
    }
  };

  const handleMoveSlide = (fromIndex: number, direction: 'up' | 'down') => {
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= content.heroSlides.length) return;

    setContent((prev) => {
      const reordered = [...prev.heroSlides];
      const temp = reordered[fromIndex];
      reordered[fromIndex] = reordered[toIndex];
      reordered[toIndex] = temp;

      const renumbered = reordered.map((slide, i) => ({
        ...slide,
        label: i + 1 < 10 ? `0${i + 1}` : `${i + 1}`,
      }));

      return { ...prev, heroSlides: renumbered };
    });
    setSelectedSlideIndex(toIndex);
  };

  // ==============================================================
  // HANDLERS MENÚ Y CATEGORÍAS DINÁMICAS
  // ==============================================================
  const handleUpdateCategory = (field: keyof CategoryCardContent, value: any) => {
    setContent((prev) => {
      const updatedCategories = [...(prev.categories || DEFAULT_SITE_CONTENT.categories || [])];
      if (updatedCategories[selectedCategoryIndex]) {
        updatedCategories[selectedCategoryIndex] = {
          ...updatedCategories[selectedCategoryIndex],
          [field]: value,
        };
      }
      return { ...prev, categories: updatedCategories };
    });
  };

  const handleCreateCategory = () => {
    if (!newCatName.trim()) {
      alert('Por favor ingresa un nombre para la categoría.');
      return;
    }
    const cleanId =
      newCatId.trim() ||
      newCatName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') ||
      `cat-${Date.now()}`;
    const cleanMenu = newCatMenuTitle.trim() || newCatName.trim();
    const cleanMobile = newCatMobileTitle.trim() || newCatName.trim().toUpperCase();

    const created: CategoryCardContent = {
      id: cleanId,
      name: newCatName.trim().toUpperCase(),
      menuTitle: cleanMenu,
      mobileTitle: cleanMobile,
      subtitle: newCatSubtitle.trim() || 'Edición Limitada',
      badge: newCatBadge.trim().toUpperCase() || 'NUEVO',
      kicker: newCatKicker.trim().toUpperCase() || 'CÁPSULA ESPECIAL',
      description: newCatDesc.trim() || `Prendas de autor de la colección ${newCatName.trim()}.`,
      image:
        newCatImage.trim() ||
        'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=1000&auto=format&fit=crop',
      enabled: true,
      order: (content.categories || []).length + 1,
    };

    setContent((prev) => {
      const cats = [...(prev.categories || DEFAULT_SITE_CONTENT.categories || [])];
      return { ...prev, categories: [...cats, created] };
    });

    setSelectedCategoryIndex((content.categories || []).length);
    setIsCreatingCategory(false);
    setNewCatName('');
    setNewCatId('');
    setNewCatMenuTitle('');
    setNewCatMobileTitle('');
    setNewCatSubtitle('');
  };

  const handleDeleteCategory = (idx: number) => {
    const cats = content.categories || DEFAULT_SITE_CONTENT.categories || [];
    if (cats.length <= 1) {
      alert('La tienda debe tener al menos una categoría activa.');
      return;
    }
    const target = cats[idx];
    if (!window.confirm(`¿Seguro que deseas eliminar la categoría "${target?.name}"?`)) {
      return;
    }
    setContent((prev) => {
      const current = [...(prev.categories || DEFAULT_SITE_CONTENT.categories || [])];
      current.splice(idx, 1);
      return { ...prev, categories: current };
    });
    setSelectedCategoryIndex(Math.max(0, idx - 1));
  };

  const handleToggleCategoryEnabled = (idx: number) => {
    setContent((prev) => {
      const current = [...(prev.categories || DEFAULT_SITE_CONTENT.categories || [])];
      if (current[idx]) {
        current[idx] = {
          ...current[idx],
          enabled: current[idx].enabled === false ? true : false,
        };
      }
      return { ...prev, categories: current };
    });
  };

  const handleMoveCategory = (idx: number, direction: 'left' | 'right') => {
    const targetIdx = direction === 'left' ? idx - 1 : idx + 1;
    const cats = [...(content.categories || DEFAULT_SITE_CONTENT.categories || [])];
    if (targetIdx < 0 || targetIdx >= cats.length) return;

    const item = cats[idx];
    cats[idx] = cats[targetIdx];
    cats[targetIdx] = item;

    cats.forEach((c, i) => {
      c.order = i + 1;
    });

    setContent((prev) => ({ ...prev, categories: cats }));
    setSelectedCategoryIndex(targetIdx);
  };

  const handleCategoryImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        handleUpdateCategory('image', dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  // ==============================================================
  // GUARDAR Y SINCRONIZAR
  // ==============================================================
  const handleSaveAll = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    setSaveMessage('');

    try {
      saveSiteContent(content);

      const cfg = getGitHubConfig();
      if (cfg.token) {
        const ghResult = await saveSiteContentToGitHub(content, cfg);
        if (ghResult.success) {
          setSaveSuccess(true);
          setSaveMessage('¡Publicado exitosamente en el servidor cloud y en vivo en la tienda!');
          onShowToast?.('Todo el contenido del sitio web fue actualizado.');
        } else {
          setSaveSuccess(true);
          setSaveMessage(`Guardado localmente. Aviso de servidor: ${ghResult.error || 'Credenciales con permisos limitados'}`);
          onShowToast?.('Guardado localmente en tu tienda.');
        }
      } else {
        setSaveSuccess(true);
        setSaveMessage('¡Guardado localmente! Los cambios son visibles de inmediato en tu navegador.');
        onShowToast?.('Contenido web guardado con éxito.');
      }
    } catch (err: any) {
      setSaveMessage(`Error: ${err.message || 'No se pudo guardar'}`);
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveSuccess(false), 5000);
    }
  };

  const handleResetDefaults = () => {
    if (
      confirm(
        '¿Deseas restablecer todos los textos, imágenes, tarifas y colecciones a los valores originales de fábrica?'
      )
    ) {
      setContent(DEFAULT_SITE_CONTENT);
      saveSiteContent(DEFAULT_SITE_CONTENT);
      setSelectedSlideIndex(0);
      setSelectedCategoryIndex(0);
      onShowToast?.('Valores originales restablecidos.');
    }
  };

  const presetImages = [
    {
      label: 'Modelo Dama (Rojo / Chaqueta)',
      url: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=2000&auto=format&fit=crop',
    },
    {
      label: 'Streetwear Urbano (Blanco / Amarillo)',
      url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=2000&auto=format&fit=crop',
    },
    {
      label: 'Oversize Boxy (Chaqueta Negra / Calle)',
      url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=2000&auto=format&fit=crop',
    },
    {
      label: 'Editorial Hoodie (Atardecer)',
      url: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=2000&auto=format&fit=crop',
    },
  ];

  const storedCustoms = getStoredCustomizations();

  const filteredBulkProducts = allAvailableProducts.filter((p) => {
    const sku = p.sku || p.id;
    const custom = storedCustoms[sku];

    // Filtro por selección
    if (bulkFilter === 'assigned' && !bulkSelectedSkus.has(sku)) return false;
    if (bulkFilter === 'other' && bulkSelectedSkus.has(sku)) return false;

    // Filtro por término de búsqueda
    if (!bulkSearchTerm.trim()) return true;
    const term = bulkSearchTerm.toLowerCase();
    const nameMatch = (custom?.name || p.name).toLowerCase().includes(term);
    const skuMatch = sku.toLowerCase().includes(term);
    const fitMatch = (custom?.fit || p.fit || '').toLowerCase().includes(term);
    return nameMatch || skuMatch || fitMatch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Encabezado y Acciones Principales idéntico al resto del AdminPanel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-[#F5F2E4]">
              Portada, Textos & Tarifas Web
            </h1>
            <span className="hidden sm:inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              <span>CMS en Vivo</span>
            </span>
          </div>
          <p className="text-xs text-white/60 mt-1 max-w-2xl leading-relaxed">
            Administra todo el contenido estático de tu tienda: fotos y textos del Hero, tarjetas de colecciones, políticas de envío nacional, canales de WhatsApp y manifiesto.
          </p>
        </div>

        <div className="flex items-center space-x-2.5 flex-shrink-0">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3 py-2 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white rounded-lg text-xs font-bold transition flex items-center space-x-2 border border-white/10 cursor-pointer"
            title="Restablecer valores originales"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Restablecer</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={isSaving}
            className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center space-x-2 shadow ${
              saveSuccess
                ? 'bg-emerald-500 text-black'
                : 'bg-[#F5F2E4] hover:bg-white text-[#101013]'
            }`}
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-black" />
                <span>Guardando...</span>
              </>
            ) : saveSuccess ? (
              <>
                <Check className="w-4 h-4 text-black stroke-[3]" />
                <span>¡Publicado!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 text-black" />
                <span>Guardar Cambios</span>
              </>
            )}
          </button>
        </div>
      </div>

      {saveMessage && (
        <div
          className={`p-3.5 rounded-xl text-xs font-bold border flex items-center space-x-2.5 ${
            saveSuccess
              ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200'
              : 'bg-amber-950/80 border-amber-500/50 text-amber-200'
          }`}
        >
          {saveSuccess ? (
            <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 stroke-[2.5]" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          )}
          <span className="text-xs sm:text-sm">{saveMessage}</span>
        </div>
      )}

      {/* Guía Oficial de Calidad Apple Super Retina XDR & Píxeles Web */}
      <div className="bg-[#101014] border border-[#D9C4AB]/30 rounded-xl p-4 text-xs text-neutral-300 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-2.5 mb-3">
          <div className="flex items-center space-x-2 text-[#D9C4AB] font-black uppercase tracking-wider text-xs">
            <Sparkles className="w-4 h-4 text-[#D9C4AB]" />
            <span>Guía de Calidad Apple Super Retina XDR & Píxeles Web</span>
          </div>
          <span className="text-[10px] text-neutral-400 font-mono">
            Optimizado para pantallas iPhone Pro OLED y MacBook Retina
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-black/50 border border-white/10 rounded-lg p-2.5 space-y-1">
            <div className="flex items-center space-x-1.5 text-amber-300 font-bold text-[11px] uppercase">
              <Monitor className="w-3.5 h-3.5" />
              <span>1. Carrusel Hero</span>
            </div>
            <p className="text-white font-mono font-bold text-xs">2560 × 1440 px</p>
            <p className="text-[10px] text-neutral-400">Proporción 16:9 • Máx 400 KB (WebP)</p>
          </div>

          <div className="bg-black/50 border border-white/10 rounded-lg p-2.5 space-y-1">
            <div className="flex items-center space-x-1.5 text-blue-300 font-bold text-[11px] uppercase">
              <Smartphone className="w-3.5 h-3.5" />
              <span>2. Colecciones Hub</span>
            </div>
            <p className="text-white font-mono font-bold text-xs">1200 × 1600 px</p>
            <p className="text-[10px] text-neutral-400">Proporción 3:4 • Máx 200 KB (WebP)</p>
          </div>

          <div className="bg-black/50 border border-white/10 rounded-lg p-2.5 space-y-1">
            <div className="flex items-center space-x-1.5 text-purple-300 font-bold text-[11px] uppercase">
              <Store className="w-3.5 h-3.5" />
              <span>3. Banners Lookbook</span>
            </div>
            <p className="text-white font-mono font-bold text-xs">2560 × 1440 px</p>
            <p className="text-[10px] text-neutral-400">Full Width • Máx 350 KB (WebP)</p>
          </div>

          <div className="bg-black/50 border border-white/10 rounded-lg p-2.5 space-y-1">
            <div className="flex items-center space-x-1.5 text-emerald-300 font-bold text-[11px] uppercase">
              <ImageIcon className="w-3.5 h-3.5" />
              <span>4. Catálogo Prendas</span>
            </div>
            <p className="text-white font-mono font-bold text-xs">1400 × 1866 px</p>
            <p className="text-[10px] text-neutral-400">Proporción 3:4 • Máx 180 KB (WebP)</p>
          </div>
        </div>
      </div>

      {/* Sub-barra de Navegación idéntica al estándar AdminPanel */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0 bg-[#14151D] p-2.5 rounded-xl border border-white/10">
        <button
          type="button"
          onClick={() => setActiveSubTab('hero')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-2 cursor-pointer whitespace-nowrap ${
            activeSubTab === 'hero'
              ? 'bg-[#F5F2E4] text-[#101013] shadow'
              : 'text-white/70 hover:bg-white/5 hover:text-white'
          }`}
        >
          <ImageIcon className="w-4 h-4 flex-shrink-0 text-amber-400" />
          <span>1. Carrusel Hero</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
            activeSubTab === 'hero' ? 'bg-black text-white' : 'bg-white/10 text-white/70'
          }`}>
            {content.heroSlides.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('categories')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-2 cursor-pointer whitespace-nowrap ${
            activeSubTab === 'categories'
              ? 'bg-[#F5F2E4] text-[#101013] shadow'
              : 'text-white/70 hover:bg-white/5 hover:text-white'
          }`}
        >
          <Grid className="w-4 h-4 flex-shrink-0 text-blue-400" />
          <span>2. Menú & Categorías Dinámicas</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
            activeSubTab === 'categories' ? 'bg-black text-white' : 'bg-white/10 text-white/70'
          }`}>
            {categoriesList.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('shipping')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-2 cursor-pointer whitespace-nowrap ${
            activeSubTab === 'shipping'
              ? 'bg-[#F5F2E4] text-[#101013] shadow'
              : 'text-white/70 hover:bg-white/5 hover:text-white'
          }`}
        >
          <Truck className="w-4 h-4 flex-shrink-0 text-emerald-400" />
          <span>3. Envíos & Tarifas</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('announcements-whatsapp')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-2 cursor-pointer whitespace-nowrap ${
            activeSubTab === 'announcements-whatsapp'
              ? 'bg-[#F5F2E4] text-[#101013] shadow'
              : 'text-white/70 hover:bg-white/5 hover:text-white'
          }`}
        >
          <Flame className="w-4 h-4 flex-shrink-0 text-amber-400" />
          <span>4. ⏳ Flash Drops, Anuncios & WhatsApp</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('flagship-manifesto')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-2 cursor-pointer whitespace-nowrap ${
            activeSubTab === 'flagship-manifesto'
              ? 'bg-[#F5F2E4] text-[#101013] shadow'
              : 'text-white/70 hover:bg-white/5 hover:text-white'
          }`}
        >
          <Store className="w-4 h-4 flex-shrink-0 text-purple-400" />
          <span>5. Tienda GranSan & Manifiesto</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('sections-social')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-2 cursor-pointer whitespace-nowrap ${
            activeSubTab === 'sections-social'
              ? 'bg-[#F5F2E4] text-[#101013] shadow'
              : 'text-white/70 hover:bg-white/5 hover:text-white'
          }`}
        >
          <Share2 className="w-4 h-4 flex-shrink-0 text-pink-400" />
          <span>6. 🎛️ Organizador de Portada & Redes</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* 1. CARRUSEL HERO */}
      {/* ============================================================== */}
      {activeSubTab === 'hero' && (
        <div className="space-y-5">
          {/* Barra de Diapositivas */}
          <div className="bg-[#14151D] p-3 rounded-xl border border-white/10 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2 overflow-x-auto py-0.5">
              {content.heroSlides.map((slide, idx) => (
                <button
                  key={slide.id || idx}
                  type="button"
                  onClick={() => setSelectedSlideIndex(idx)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-2 cursor-pointer whitespace-nowrap ${
                    idx === selectedSlideIndex
                      ? 'bg-[#F5F2E4] text-[#101013] shadow'
                      : 'bg-black/40 text-white/70 hover:bg-white/5 hover:text-white border border-white/10'
                  }`}
                >
                  <span className={`font-mono text-[10px] font-black px-1.5 py-0.2 rounded ${
                    idx === selectedSlideIndex ? 'bg-black text-[#F5F2E4]' : 'bg-white/10 text-[#D9C4AB]'
                  }`}>
                    {slide.label || `0${idx + 1}`}
                  </span>
                  <span className="truncate max-w-[130px]">
                    {slide.titleBold || 'Slide'} {slide.titleLight || ''}
                  </span>
                </button>
              ))}

              <button
                type="button"
                onClick={handleAddSlide}
                className="px-3 py-1.5 border border-dashed border-[#D9C4AB]/50 hover:border-[#D9C4AB] text-[#D9C4AB] bg-[#D9C4AB]/5 hover:bg-[#D9C4AB]/10 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Añadir Slide</span>
              </button>
            </div>

            {currentSlide && (
              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={() => handleMoveSlide(selectedSlideIndex, 'up')}
                  disabled={selectedSlideIndex === 0}
                  className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/70 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer transition"
                  title="Mover slide hacia arriba"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleMoveSlide(selectedSlideIndex, 'down')}
                  disabled={selectedSlideIndex === content.heroSlides.length - 1}
                  className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/70 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer transition"
                  title="Mover slide hacia abajo"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteSlide(selectedSlideIndex)}
                  disabled={content.heroSlides.length <= 1}
                  className="p-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer transition"
                  title="Eliminar este slide"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {currentSlide && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Formulario */}
              <div className="lg:col-span-7 bg-[#14151D] p-5 sm:p-6 rounded-xl border border-white/10 space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-white/90 flex items-center space-x-2">
                    <Type className="w-4 h-4 text-[#D9C4AB]" />
                    <span>Configuración del Slide {currentSlide.label}</span>
                  </h3>
                  <span className="text-[10px] font-mono font-bold text-[#D9C4AB] bg-[#D9C4AB]/10 px-2 py-0.5 rounded border border-[#D9C4AB]/20">
                    ID: {currentSlide.id}
                  </span>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-white/80 uppercase tracking-wide">
                    Foto de Fondo (Modelo / Banner) *
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={currentSlide.img}
                      onChange={(e) => handleUpdateCurrentSlide('img', e.target.value)}
                      placeholder="https://ejemplo.com/foto-portada.jpg"
                      className="flex-1 bg-black/50 border border-white/15 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#D9C4AB] transition"
                    />
                    <label className="px-3.5 py-2.5 bg-white/5 hover:bg-white/10 text-white border border-white/15 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 cursor-pointer transition flex-shrink-0">
                      <Upload className="w-3.5 h-3.5 text-[#D9C4AB]" />
                      <span>Subir Foto</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleSlideImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Badge de Especificación Super Retina XDR */}
                  <div className="bg-[#0C0D12] border border-[#D9C4AB]/30 rounded-lg p-2.5 flex items-start space-x-2.5 text-[11px] text-neutral-300">
                    <div className="p-1 rounded bg-[#D9C4AB]/15 text-[#D9C4AB] shrink-0 mt-0.5">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-white uppercase tracking-wider text-[10px] bg-white/10 px-1.5 py-0.2 rounded">
                          Super Retina XDR: 2560 × 1440 px
                        </span>
                        <span className="text-[#D9C4AB] font-semibold text-[10px]">
                          Proporción: 16:9 (Horizontal)
                        </span>
                        <span className="text-emerald-400 font-semibold text-[10px]">
                          Peso Máx: 250 - 400 KB
                        </span>
                      </div>
                      <p className="text-[10px] text-neutral-400 leading-tight">
                        DPI óptimo: 72–150 DPI en píxeles reales. Formato sugerido: WebP o JPG 85% para máxima fidelidad en pantallas OLED de iPhone y MacBook.
                      </p>
                    </div>
                  </div>

                  <div className="pt-1.5">
                    <span className="text-[10px] text-white/50 uppercase font-bold tracking-wider block mb-1">
                      Presets recomendados de Streetwear:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {presetImages.map((preset, pIdx) => (
                        <button
                          key={pIdx}
                          type="button"
                          onClick={() => handleUpdateCurrentSlide('img', preset.url)}
                          className="text-[11px] bg-black/40 hover:bg-white/10 text-white/80 border border-white/10 px-2.5 py-1 rounded-md cursor-pointer transition font-medium"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-white/10">
                  <div>
                    <label className="block text-xs font-bold text-white/80 mb-1.5 uppercase tracking-wide">
                      Etiqueta Superior (Kicker)
                    </label>
                    <input
                      type="text"
                      value={currentSlide.badge || ''}
                      onChange={(e) => handleUpdateCurrentSlide('badge', e.target.value)}
                      placeholder="NOVEDADES SEMANALES"
                      className="w-full bg-black/50 border border-white/15 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-white uppercase placeholder-white/40 focus:outline-none focus:border-[#D9C4AB] transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-white/80 mb-1.5 uppercase tracking-wide">
                      Sub-texto Etiqueta
                    </label>
                    <input
                      type="text"
                      value={currentSlide.badgeSub || ''}
                      onChange={(e) => handleUpdateCurrentSlide('badgeSub', e.target.value)}
                      placeholder="TALLAS S - XL"
                      className="w-full bg-black/50 border border-white/15 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-white uppercase placeholder-white/40 focus:outline-none focus:border-[#D9C4AB] transition"
                    />
                  </div>
                </div>

                <div className="space-y-4 pt-3 border-t border-white/10">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-white/80 mb-1.5 uppercase tracking-wide">
                        Título Principal (Negrita) *
                      </label>
                      <input
                        type="text"
                        value={currentSlide.titleBold}
                        onChange={(e) => handleUpdateCurrentSlide('titleBold', e.target.value)}
                        placeholder="CÁPSULA o EDICIÓN"
                        className="w-full bg-black/50 border border-white/15 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm font-black text-white uppercase placeholder-white/40 focus:outline-none focus:border-[#D9C4AB] transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-white/80 mb-1.5 uppercase tracking-wide">
                        Estilo / Cursiva (Dorado) *
                      </label>
                      <input
                        type="text"
                        value={currentSlide.titleLight}
                        onChange={(e) => handleUpdateCurrentSlide('titleLight', e.target.value)}
                        placeholder="dama o young & free"
                        className="w-full bg-black/50 border border-white/15 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm italic font-medium text-[#D9C4AB] lowercase placeholder-white/40 focus:outline-none focus:border-[#D9C4AB] transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-white/80 mb-1.5 uppercase tracking-wide">
                      Subtítulo Inferior *
                    </label>
                    <input
                      type="text"
                      value={currentSlide.subtitle}
                      onChange={(e) => handleUpdateCurrentSlide('subtitle', e.target.value)}
                      placeholder="ESTILO ÚNICO o URBANNOISE"
                      className="w-full bg-black/50 border border-white/15 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm font-bold text-white uppercase placeholder-white/40 focus:outline-none focus:border-[#D9C4AB] transition"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-white/10">
                  <label className="block text-xs font-bold text-white/80 mb-1.5 uppercase tracking-wide">
                    Descripción del Slide
                  </label>
                  <textarea
                    rows={3}
                    value={currentSlide.desc}
                    onChange={(e) => handleUpdateCurrentSlide('desc', e.target.value)}
                    placeholder="Colección femenina con siluetas crop y oversize relajadas creadas en Bogotá para quienes imponen su propio ritmo."
                    className="w-full bg-black/50 border border-white/15 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm font-medium text-white placeholder-white/40 focus:outline-none focus:border-[#D9C4AB] transition leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-white/10">
                  <div>
                    <label className="block text-xs font-bold text-white/80 mb-1.5 uppercase tracking-wide">
                      Texto del Botón *
                    </label>
                    <input
                      type="text"
                      value={currentSlide.ctaText || 'COMPRAR DROP AHORA'}
                      onChange={(e) => handleUpdateCurrentSlide('ctaText', e.target.value)}
                      placeholder="COMPRAR DROP AHORA"
                      className="w-full bg-black/50 border border-white/15 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm font-bold text-white uppercase placeholder-white/40 focus:outline-none focus:border-[#D9C4AB] transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-white/80 mb-1.5 uppercase tracking-wide">
                      Destino al presionar el Botón
                    </label>
                    <select
                      value={currentSlide.ctaAnchor}
                      onChange={(e) => handleUpdateCurrentSlide('ctaAnchor', e.target.value)}
                      className="w-full bg-[#101014] border border-white/15 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-white focus:outline-none focus:border-[#D9C4AB] transition"
                    >
                      <option value="#latest-drops">Últimos Lanzamientos (#latest-drops)</option>
                      <option value="#young-free">Cápsula Young & Free (#young-free)</option>
                      <option value="#weird-oversize">Cápsula Weird Oversize (#weird-oversize)</option>
                      <option value="#dama-oversize">Cápsula Dama Oversize (#dama-oversize)</option>
                      <option value="#marketplace">Marketplace Completo (#marketplace)</option>
                      <option value="#flagship">Tienda Física (#flagship)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Vista Previa en Vivo */}
              <div className="lg:col-span-5 space-y-2.5">
                <div className="flex items-center space-x-2 text-xs font-bold text-white/80 uppercase tracking-wide">
                  <Eye className="w-4 h-4 text-amber-400" />
                  <span>Vista Previa del Hero</span>
                </div>

                <div className="relative w-full h-[460px] rounded-xl overflow-hidden shadow-2xl bg-black text-white flex flex-col justify-end p-6 border border-white/15">
                  <img
                    src={currentSlide.img}
                    alt="Preview"
                    className="absolute inset-0 w-full h-full object-cover filter contrast-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=2000&auto=format&fit=crop';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#101013]/95 via-[#101013]/40 to-transparent pointer-events-none" />

                  <div className="relative z-10 space-y-3">
                    <div className="inline-flex items-center space-x-1.5 border border-white/25 rounded-full px-3 py-1 backdrop-blur-md bg-black/60 text-[10px] uppercase font-bold text-[#D9C4AB]">
                      <span>{currentSlide.badge || 'NOVEDADES SEMANALES'}</span>
                      {currentSlide.badgeSub && (
                        <>
                          <span className="text-white/30">•</span>
                          <span className="text-white/90">{currentSlide.badgeSub}</span>
                        </>
                      )}
                    </div>

                    <h3 className="font-black text-2xl sm:text-3xl uppercase tracking-tight leading-none text-[#F5F2E4]">
                      {currentSlide.titleBold}{' '}
                      <span className="font-light italic lowercase text-[#D9C4AB]">
                        {currentSlide.titleLight}
                      </span>
                      {currentSlide.subtitle && (
                        <>
                          <br />
                          <span>{currentSlide.subtitle}</span>
                        </>
                      )}
                    </h3>

                    {currentSlide.desc && (
                      <p className="text-xs text-white/90 line-clamp-3 leading-relaxed">
                        {currentSlide.desc}
                      </p>
                    )}

                    <div className="pt-2">
                      <span className="inline-block bg-[#F5F2E4] text-[#101013] font-black text-xs uppercase tracking-widest px-5 py-2.5 shadow rounded">
                        {currentSlide.ctaText || 'COMPRAR DROP AHORA'}
                      </span>
                    </div>
                  </div>

                  <div className="absolute top-4 right-4 z-10 font-mono text-[11px] font-bold bg-black/80 px-2.5 py-1 rounded-md border border-white/15 text-[#D9C4AB]">
                    Slide {currentSlide.label} / 0{content.heroSlides.length}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. GESTOR DINÁMICO DE MENÚ Y CATEGORÍAS                        */}
      {/* ============================================================== */}
      {activeSubTab === 'categories' && (
        <div className="space-y-6">
          {/* Cabecera Informativa con Botones de Ayuda y Creación */}
          <div className="bg-[#14151D] p-5 sm:p-6 rounded-xl border border-white/10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-blue-400 mb-1">
                <Grid className="w-4 h-4" />
                <span>MÓDULO 1: CONTROL TOTAL DE MENÚ, PORTADA Y CATEGORÍAS</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black uppercase text-white tracking-tight">
                Gestor Dinámico de Menú Superior, Portada y Catálogo
              </h2>
              <p className="text-xs text-white/60 mt-1 max-w-2xl leading-relaxed">
                Modifica nombres visibles (ej. cambiar <em>Weird Boxy</em> por <em>Boxy Fit</em>, o <em>Dama</em> por <em>Mujer</em>), fotos de portada, subtítulos e insignias sin romper la conexión con tus prendas. Añade nuevas categorías ilimitadas y ordénalas a tu gusto.
              </p>
            </div>

            <div className="flex items-center space-x-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => setShowCategoryGuide(!showCategoryGuide)}
                className={`px-3.5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center space-x-2 cursor-pointer transition border ${
                  showCategoryGuide
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-white/5 hover:bg-white/10 text-white/80 border-white/15'
                }`}
                title="Aprende cómo funciona el Identificador y las conexiones"
              >
                <HelpCircle className="w-4 h-4 text-amber-400" />
                <span>{showCategoryGuide ? 'Ocultar Guía' : '💡 ¿Cómo Conecta?'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsCreatingCategory(!isCreatingCategory);
                  if (showCategoryGuide) setShowCategoryGuide(false);
                }}
                className={`px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center space-x-2 cursor-pointer transition shadow-md ${
                  isCreatingCategory
                    ? 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                    : 'bg-blue-600 hover:bg-blue-500 text-white'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>{isCreatingCategory ? 'Cancelar' : '➕ Nueva Categoría'}</span>
              </button>
            </div>
          </div>

          {/* Guía Interactiva Didáctica Desplegable */}
          {showCategoryGuide && (
            <div className="bg-[#0E1017] p-5 sm:p-6 rounded-xl border border-amber-500/30 shadow-2xl space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center space-x-2 text-amber-400 font-black text-sm uppercase tracking-wide">
                  <Sparkles className="w-4 h-4" />
                  <span>Guía Maestra: Identificador, Portada y Conexión de Prendas</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCategoryGuide(false)}
                  className="text-xs text-white/50 hover:text-white uppercase font-bold cursor-pointer"
                >
                  ✕ Cerrar Guía
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                {/* Pilar 1: El Identificador */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
                  <div className="flex items-center space-x-2 text-blue-400 font-bold uppercase text-[11px]">
                    <Link2 className="w-4 h-4" />
                    <span>1. ¿Qué es el Identificador (ID)?</span>
                  </div>
                  <p className="text-white/70 leading-relaxed text-[11px]">
                    Es la <strong className="text-white">llave técnica interna</strong> (ej: <code className="bg-black/60 text-[#D9C4AB] px-1 py-0.5 rounded font-mono">young-free</code> o <code className="bg-black/60 text-[#D9C4AB] px-1 py-0.5 rounded font-mono">hoodies</code>) que enlaza tus prendas del inventario con esta categoría en la tienda web. Se escribe en minúsculas y sin espacios.
                  </p>
                  <p className="text-[10px] text-white/50 italic">
                    Al crear una categoría se autogenera a partir del nombre, así que no necesitas crearlo a mano.
                  </p>
                </div>

                {/* Pilar 2: Por qué no se pierden las conexiones */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
                  <div className="flex items-center space-x-2 text-emerald-400 font-bold uppercase text-[11px]">
                    <Shield className="w-4 h-4" />
                    <span>2. ¿Por qué NO se pierden las prendas?</span>
                  </div>
                  <p className="text-white/70 leading-relaxed text-[11px]">
                    ¡Puedes renombrar tus colecciones tantas veces como quieras! Si cambias <strong className="text-white">Weird Boxy</strong> por <strong className="text-white">Boxy Fit 2026</strong> o <strong className="text-white">Dama</strong> por <strong className="text-white">Colección Mujer</strong>, <span className="text-emerald-300 font-bold">ninguna prenda se desconecta</span> porque el identificador técnico interno permanece intacto.
                  </p>
                </div>

                {/* Pilar 3: Los 3 lugares donde se muestra cada dato */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
                  <div className="flex items-center space-x-2 text-amber-400 font-bold uppercase text-[11px]">
                    <Layers className="w-4 h-4" />
                    <span>3. ¿Dónde se muestra cada texto?</span>
                  </div>
                  <ul className="text-white/70 space-y-1 text-[11px] list-disc list-inside">
                    <li><strong className="text-white">Menú Superior:</strong> Texto corto en barra PC y móvil.</li>
                    <li><strong className="text-white">Tarjeta de Portada:</strong> Foto vertical, Insignia, Subtítulo y Nombre.</li>
                    <li><strong className="text-white">Banner en Tienda:</strong> Kicker con estrella, Título póster y Descripción.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Formulario de Creación de Nueva Categoría (Desplegable) */}
          {isCreatingCategory && (
            <div className="bg-[#10121A] p-5 sm:p-6 rounded-xl border-2 border-blue-500/50 shadow-2xl space-y-5 animate-in fade-in duration-200">
              <div className="border-b border-white/10 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-black text-sm uppercase tracking-wide text-blue-300 flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-blue-400" />
                    <span>Crear Nueva Categoría para la Tienda</span>
                  </h3>
                  <p className="text-xs text-white/50 mt-0.5">
                    Aparecerá automáticamente en el Menú Superior, Menú Móvil, Visual Hub y Filtros del Catálogo.
                  </p>
                </div>
                <span className="text-[10px] font-mono uppercase bg-blue-500/20 text-blue-300 px-2.5 py-1 rounded border border-blue-500/30 self-start sm:self-auto font-bold">
                  PLANTILLAS O PERSONALIZADO
                </span>
              </div>

              {/* Selector de Plantillas Rápidas (1 Clic) */}
              <div className="bg-black/40 border border-white/10 rounded-xl p-3.5 space-y-2">
                <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Plantillas Rápidas de Streetwear (Relleno en 1 Clic):</span>
                </span>
                <div className="flex flex-wrap gap-2">
                  {STREETWEAR_CATEGORY_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleApplyCategoryPreset(preset)}
                      className="px-3 py-1.5 bg-white/5 hover:bg-white/15 text-white/90 hover:text-white border border-white/15 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
                    >
                      <span>{preset.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Formulario de Campos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-white/80 mb-1 uppercase tracking-wide flex items-center justify-between">
                    <span>Nombre Oficial de la Colección *</span>
                    <span className="text-[9px] text-blue-400 font-mono">PORTADA & BANNER</span>
                  </label>
                  <input
                    type="text"
                    value={newCatName}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewCatName(val);
                      if (!newCatId) {
                        setNewCatId(
                          val
                            .toLowerCase()
                            .normalize('NFD')
                            .replace(/[\u0300-\u036f]/g, '')
                            .replace(/[^a-z0-9]+/g, '-')
                            .replace(/(^-|-$)/g, '')
                        );
                      }
                      if (!newCatMenuTitle) {
                        setNewCatMenuTitle(val);
                      }
                    }}
                    placeholder="Ej. BUZOS & HOODIES"
                    className="w-full bg-black/60 border border-white/20 rounded-lg px-3 py-2 text-xs font-bold text-white uppercase focus:border-blue-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-white/80 mb-1 uppercase tracking-wide flex items-center justify-between">
                    <span>Texto en Menú Superior *</span>
                    <span className="text-[9px] text-amber-400 font-mono">HEADER PC</span>
                  </label>
                  <input
                    type="text"
                    value={newCatMenuTitle}
                    onChange={(e) => setNewCatMenuTitle(e.target.value)}
                    placeholder="Ej. Buzos"
                    className="w-full bg-black/60 border border-white/20 rounded-lg px-3 py-2 text-xs font-bold text-white focus:border-blue-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-white/80 mb-1 uppercase tracking-wide flex items-center justify-between">
                    <span>Texto en Menú Móvil *</span>
                    <span className="text-[9px] text-emerald-400 font-mono">MENÚ CELULAR</span>
                  </label>
                  <input
                    type="text"
                    value={newCatMobileTitle}
                    onChange={(e) => setNewCatMobileTitle(e.target.value)}
                    placeholder="Ej. COLECCIÓN BUZOS"
                    className="w-full bg-black/60 border border-white/20 rounded-lg px-3 py-2 text-xs font-bold text-white uppercase focus:border-blue-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-white/80 mb-1 uppercase tracking-wide flex items-center justify-between">
                    <span>Identificador / Slug Único *</span>
                    <span className="text-[9px] text-[#D9C4AB] font-mono">CLAVE TÉCNICA</span>
                  </label>
                  <input
                    type="text"
                    value={newCatId}
                    onChange={(e) =>
                      setNewCatId(
                        e.target.value
                          .toLowerCase()
                          .normalize('NFD')
                          .replace(/[\u0300-\u036f]/g, '')
                          .replace(/[^a-z0-9_-]/g, '')
                      )
                    }
                    placeholder="Ej. buzos-hoodies"
                    className="w-full bg-black/60 border border-white/20 rounded-lg px-3 py-2 text-xs font-mono text-[#D9C4AB] focus:border-blue-400 focus:outline-none"
                  />
                  <p className="text-[9.5px] text-white/40 mt-1">
                    Código que conectará tus prendas con esta categoría.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-white/80 mb-1 uppercase tracking-wide flex items-center justify-between">
                    <span>Subtítulo Descriptivo *</span>
                    <span className="text-[9px] text-amber-300 font-mono">TEXTO DORADO</span>
                  </label>
                  <input
                    type="text"
                    value={newCatSubtitle}
                    onChange={(e) => setNewCatSubtitle(e.target.value)}
                    placeholder="Ej. Algodón Rústico 320g"
                    className="w-full bg-black/60 border border-white/20 rounded-lg px-3 py-2 text-xs text-white focus:border-blue-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-white/80 mb-1 uppercase tracking-wide flex items-center justify-between">
                    <span>Insignia / Badge *</span>
                    <span className="text-[9px] text-blue-300 font-mono">ETIQUETA SUPERIOR</span>
                  </label>
                  <input
                    type="text"
                    value={newCatBadge}
                    onChange={(e) => setNewCatBadge(e.target.value)}
                    placeholder="Ej. NUEVO, HOT o HOODIES"
                    className="w-full bg-black/60 border border-white/20 rounded-lg px-3 py-2 text-xs font-bold text-white uppercase focus:border-blue-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-white/80 mb-1 uppercase tracking-wide flex items-center justify-between">
                    <span>Kicker Decorativo en Catálogo</span>
                    <span className="text-[9px] text-purple-300 font-mono">BANNER TIENDA</span>
                  </label>
                  <input
                    type="text"
                    value={newCatKicker}
                    onChange={(e) => setNewCatKicker(e.target.value)}
                    placeholder="Ej. CÁPSULA OVERSIZE 2026"
                    className="w-full bg-black/60 border border-white/20 rounded-lg px-3 py-2 text-xs font-bold text-white uppercase focus:border-blue-400 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-white/80 mb-1 uppercase tracking-wide flex items-center justify-between">
                    <span>Descripción Detallada en Catálogo</span>
                    <span className="text-[9px] text-purple-300 font-mono">BANNER TIENDA</span>
                  </label>
                  <input
                    type="text"
                    value={newCatDesc}
                    onChange={(e) => setNewCatDesc(e.target.value)}
                    placeholder="Prendas de autor con confección pesada en Bogotá..."
                    className="w-full bg-black/60 border border-white/20 rounded-lg px-3 py-2 text-xs text-white focus:border-blue-400 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2 lg:col-span-3 space-y-2">
                  <label className="block text-xs font-bold text-white/80 uppercase tracking-wide flex items-center justify-between">
                    <span>Foto de Portada de la Tarjeta *</span>
                    <span className="text-[9px] text-neutral-400 font-mono">VERTICAL 3:4 (1200 × 1600 px)</span>
                  </label>

                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={newCatImage}
                      onChange={(e) => setNewCatImage(e.target.value)}
                      placeholder="https://ejemplo.com/foto-buzos.jpg"
                      className="flex-1 bg-black/60 border border-white/20 rounded-lg px-3 py-2 text-xs text-white focus:border-blue-400 focus:outline-none"
                    />
                    <label className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 cursor-pointer transition flex-shrink-0">
                      <Upload className="w-3.5 h-3.5 text-[#D9C4AB]" />
                      <span>Subir Foto</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleNewCategoryImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Fotos Recomendadas en 1 Clic */}
                  <div className="flex items-center space-x-1.5 overflow-x-auto pt-1 pb-1">
                    <span className="text-[10px] text-white/50 uppercase font-mono flex-shrink-0">Fotos sugeridas:</span>
                    {CURATED_STREETWEAR_PHOTOS.map((photo, pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => setNewCatImage(photo.url)}
                        className={`text-[10px] px-2 py-0.5 rounded border transition flex-shrink-0 cursor-pointer ${
                          newCatImage === photo.url
                            ? 'bg-blue-600 text-white border-blue-400 font-bold'
                            : 'bg-white/5 text-white/70 hover:bg-white/15 border-white/15'
                        }`}
                      >
                        {photo.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsCreatingCategory(false)}
                  className="px-4 py-2 text-xs font-bold uppercase text-white/60 hover:text-white transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleCreateCategory}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition cursor-pointer flex items-center space-x-2 shadow-lg"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Guardar y Agregar Categoría</span>
                </button>
              </div>
            </div>
          )}

          {/* Selector de Categoría (Pestañas Horizontales con Conteo en Vivo) */}
          <div className="bg-[#14151D] p-3 rounded-xl border border-white/10 flex items-center space-x-2 overflow-x-auto">
            {categoriesList.map((cat, idx) => {
              const isSelected = idx === selectedCategoryIndex;
              const isEnabled = cat.enabled !== false;
              const count = getProductCountForCategory(cat.id);
              return (
                <button
                  key={cat.id || idx}
                  type="button"
                  onClick={() => {
                    setSelectedCategoryIndex(idx);
                    setIsCreatingCategory(false);
                  }}
                  className={`px-4 py-2.5 rounded-lg text-xs font-bold transition flex items-center space-x-2.5 cursor-pointer whitespace-nowrap border ${
                    isSelected
                      ? 'bg-[#F5F2E4] text-[#101013] border-white shadow-md'
                      : isEnabled
                      ? 'bg-black/50 text-white/80 hover:bg-white/10 hover:text-white border-white/10'
                      : 'bg-red-950/20 text-white/40 border-red-500/20 hover:text-white/60'
                  }`}
                >
                  {/* Indicador de Estado Activo / Oculto */}
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isEnabled ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]' : 'bg-red-400'
                    }`}
                    title={isEnabled ? 'Visible en tienda' : 'Oculta en tienda'}
                  />
                  <span>{cat.menuTitle || cat.name}</span>
                  <span
                    className={`text-[9.5px] px-1.5 py-0.2 rounded font-mono font-bold ${
                      isSelected
                        ? 'bg-black text-[#F5F2E4]'
                        : 'bg-white/10 text-[#D9C4AB]'
                    }`}
                  >
                    {count} {count === 1 ? 'prenda' : 'prendas'}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Editor Detallado de la Categoría Seleccionada */}
          {currentCategory && (
            <div className="space-y-6">
              {/* Barra de Acciones y Conexión de Inventario */}
              <div className="bg-[#14151D] p-4 rounded-xl border border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-white/50 uppercase font-semibold text-[11px]">Identificador:</span>
                    <code className="font-mono bg-black/60 text-[#D9C4AB] px-2 py-0.5 rounded border border-white/10 font-bold">
                      {currentCategory.id}
                    </code>
                  </div>

                  {isSystemProtectedCategory(currentCategory.id) ? (
                    <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full">
                      <Shield className="w-3 h-3 text-amber-400" />
                      <span>ID Protegido del Sistema</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-blue-300 bg-blue-500/15 border border-blue-500/30 px-2 py-0.5 rounded-full">
                      <Tag className="w-3 h-3 text-blue-400" />
                      <span>Categoría Personalizada</span>
                    </span>
                  )}

                  {/* Contador de Prendas y Acceso Directo */}
                  <div className="flex items-center space-x-1.5 pl-2 border-l border-white/15">
                    <span className="text-[11px] text-white/70 font-mono font-bold">
                      📦 {getProductCountForCategory(currentCategory.id)} prendas conectadas
                    </span>
                    {onNavigateToCatalog && (
                      <button
                        type="button"
                        onClick={() => onNavigateToCatalog(currentCategory.id)}
                        className="text-[10px] text-blue-400 hover:text-blue-300 font-bold underline flex items-center space-x-1 cursor-pointer"
                        title="Ver y editar las prendas de esta categoría en el inventario"
                      >
                        <span>Ver en Inventario</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Botón Asignador Masivo de Prendas */}
                  <button
                    type="button"
                    onClick={() => handleOpenBulkAssignModal(currentCategory)}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase text-[11px] tracking-wider rounded-lg transition flex items-center space-x-1.5 cursor-pointer shadow-md"
                    title="Asigna o desvincula múltiples prendas de esta categoría en lote con casillas de verificación"
                  >
                    <Package className="w-3.5 h-3.5" />
                    <span>+ Asignar / Mover Prendas</span>
                  </button>

                  {/* Interruptor de Visibilidad */}
                  <button
                    type="button"
                    onClick={() => handleToggleCategoryEnabled(selectedCategoryIndex)}
                    className={`px-3 py-1.5 rounded-lg font-bold uppercase text-[11px] transition flex items-center space-x-1.5 cursor-pointer border ${
                      currentCategory.enabled !== false
                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25'
                        : 'bg-amber-500/15 border-amber-500/30 text-amber-300 hover:bg-amber-500/25'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        currentCategory.enabled !== false ? 'bg-emerald-400' : 'bg-amber-400'
                      }`}
                    />
                    <span>
                      {currentCategory.enabled !== false ? '✓ Visible en Tienda' : '✕ Oculta en Tienda'}
                    </span>
                  </button>

                  {/* Botones de Reordenamiento */}
                  <div className="flex items-center bg-black/50 border border-white/10 rounded-lg p-0.5">
                    <button
                      type="button"
                      onClick={() => handleMoveCategory(selectedCategoryIndex, 'left')}
                      disabled={selectedCategoryIndex === 0}
                      className="p-1.5 text-white/60 hover:text-white disabled:opacity-20 disabled:hover:text-white/60 transition cursor-pointer"
                      title="Mover hacia la izquierda en el menú"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[10px] text-white/40 px-1 font-mono">
                      #{selectedCategoryIndex + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleMoveCategory(selectedCategoryIndex, 'right')}
                      disabled={selectedCategoryIndex === categoriesList.length - 1}
                      className="p-1.5 text-white/60 hover:text-white disabled:opacity-20 disabled:hover:text-white/60 transition cursor-pointer"
                      title="Mover hacia la derecha en el menú"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Botón Eliminar */}
                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(selectedCategoryIndex)}
                    className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/25 text-red-300 border border-red-500/20 rounded-lg font-bold text-[11px] uppercase transition flex items-center space-x-1 cursor-pointer"
                    title="Eliminar esta categoría"
                  >
                    <Trash2 className="w-3 h-3 text-red-400" />
                    <span>Eliminar</span>
                  </button>
                </div>
              </div>

              {/* Formulario y Vistas Previas */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Columna Izquierda: Campos Editables */}
                <div className="lg:col-span-7 bg-[#14151D] p-5 sm:p-6 rounded-xl border border-white/10 space-y-5">
                  {/* Sección 1: Textos del Menú */}
                  <div className="border-b border-white/10 pb-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-xs font-bold text-white/90 uppercase tracking-wide">
                        <Type className="w-4 h-4 text-amber-400" />
                        <span>1. Textos en Menús de Navegación</span>
                      </div>
                      <span className="text-[10px] font-mono uppercase bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded border border-amber-500/20 font-bold">
                        BARRA SUPERIOR & MÓVIL
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-white/80 mb-1 uppercase tracking-wide flex items-center justify-between">
                          <span>Texto en Menú Superior (Header) *</span>
                          <span className="text-[9px] text-amber-400 font-mono">PC / LAPTOP</span>
                        </label>
                        <input
                          type="text"
                          value={currentCategory.menuTitle || currentCategory.name}
                          onChange={(e) => handleUpdateCategory('menuTitle', e.target.value)}
                          placeholder="Ej. Weird Boxy"
                          className="w-full bg-black/50 border border-[#D9C4AB]/50 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm font-bold text-white placeholder-white/40 focus:outline-none focus:border-[#D9C4AB] transition"
                        />
                        <p className="text-[10px] text-white/40 mt-1">
                          Nombre visible en la barra horizontal superior.
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-white/80 mb-1 uppercase tracking-wide flex items-center justify-between">
                          <span>Texto en Menú de Celulares *</span>
                          <span className="text-[9px] text-emerald-400 font-mono">SMARTPHONE</span>
                        </label>
                        <input
                          type="text"
                          value={currentCategory.mobileTitle || currentCategory.name}
                          onChange={(e) => handleUpdateCategory('mobileTitle', e.target.value)}
                          placeholder="Ej. EDICIÓN WEIRD & OVERSIZE"
                          className="w-full bg-black/50 border border-white/20 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm font-bold text-white uppercase placeholder-white/40 focus:outline-none focus:border-[#D9C4AB] transition"
                        />
                        <p className="text-[10px] text-white/40 mt-1">
                          Texto que ven los usuarios al abrir el menú hamburguesa.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Sección 2: Identidad en Portada y Catálogo */}
                  <div className="border-b border-white/10 pb-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-xs font-bold text-white/90 uppercase tracking-wide">
                        <Grid className="w-4 h-4 text-blue-400" />
                        <span>2. Tarjeta en la Portada (Visual Hub)</span>
                      </div>
                      <span className="text-[10px] font-mono uppercase bg-blue-500/10 text-blue-300 px-2 py-0.5 rounded border border-blue-500/20 font-bold">
                        HOME PAGE
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-white/80 mb-1 uppercase tracking-wide flex items-center justify-between">
                          <span>Nombre Oficial de la Colección *</span>
                          <span className="text-[9px] text-blue-400 font-mono">TÍTULO GRUESO</span>
                        </label>
                        <input
                          type="text"
                          value={currentCategory.name}
                          onChange={(e) => handleUpdateCategory('name', e.target.value)}
                          placeholder="PLEASURES & WEIRD BOXY"
                          className="w-full bg-black/50 border border-white/15 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm font-black text-white uppercase placeholder-white/40 focus:outline-none focus:border-[#D9C4AB] transition"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-white/80 mb-1 uppercase tracking-wide flex items-center justify-between">
                          <span>Insignia / Badge *</span>
                          <span className="text-[9px] text-blue-400 font-mono">ETIQUETA ARRIBA</span>
                        </label>
                        <input
                          type="text"
                          value={currentCategory.badge}
                          onChange={(e) => handleUpdateCategory('badge', e.target.value)}
                          placeholder="BOXY FIT o NUEVO"
                          className="w-full bg-black/50 border border-white/15 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm font-bold text-white uppercase placeholder-white/40 focus:outline-none focus:border-[#D9C4AB] transition"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-white/80 mb-1 uppercase tracking-wide flex items-center justify-between">
                          <span>Subtítulo Descriptivo *</span>
                          <span className="text-[9px] text-amber-300 font-mono">TEXTO DORADO</span>
                        </label>
                        <input
                          type="text"
                          value={currentCategory.subtitle}
                          onChange={(e) => handleUpdateCategory('subtitle', e.target.value)}
                          placeholder="Algodón Pesado 300g o Drop Semanal"
                          className="w-full bg-black/50 border border-white/15 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-white placeholder-white/40 focus:outline-none focus:border-[#D9C4AB] transition"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Sección 3: Banner en el Catálogo */}
                  <div className="border-b border-white/10 pb-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-xs font-bold text-white/90 uppercase tracking-wide">
                        <Bookmark className="w-4 h-4 text-purple-400" />
                        <span>3. Cabecera en el Catálogo (Marketplace)</span>
                      </div>
                      <span className="text-[10px] font-mono uppercase bg-purple-500/10 text-purple-300 px-2 py-0.5 rounded border border-purple-500/20 font-bold">
                        BANNER TIENDA
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-white/80 mb-1 uppercase tracking-wide flex items-center justify-between">
                          <span>Kicker Decorativo con Estrella</span>
                          <span className="text-[9px] text-purple-400 font-mono">PARTE SUPERIOR</span>
                        </label>
                        <input
                          type="text"
                          value={currentCategory.kicker || 'CÁPSULA ESPECIAL'}
                          onChange={(e) => handleUpdateCategory('kicker', e.target.value)}
                          placeholder="SPECIAL OVERSIZE"
                          className="w-full bg-black/50 border border-white/15 rounded-lg px-3.5 py-2.5 text-xs font-bold text-white uppercase placeholder-white/40 focus:outline-none focus:border-[#D9C4AB] transition"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-white/80 mb-1 uppercase tracking-wide flex items-center justify-between">
                          <span>Descripción Detallada en Catálogo</span>
                          <span className="text-[9px] text-purple-400 font-mono">PÁRRAFO COMPLETO</span>
                        </label>
                        <textarea
                          rows={2}
                          value={currentCategory.description || ''}
                          onChange={(e) => handleUpdateCategory('description', e.target.value)}
                          placeholder="Prendas recién confeccionadas en Bogotá con serigrafía de autor..."
                          className="w-full bg-black/50 border border-white/15 rounded-lg px-3.5 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#D9C4AB] transition resize-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Sección 4: Foto de Portada */}
                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-white/80 uppercase tracking-wide flex items-center justify-between">
                      <span>Foto de Portada de la Tarjeta *</span>
                      <span className="text-[9px] text-neutral-400 font-mono">VERTICAL 3:4 (1200 × 1600 px)</span>
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={currentCategory.image}
                        onChange={(e) => handleUpdateCategory('image', e.target.value)}
                        placeholder="https://ejemplo.com/foto-categoria.jpg"
                        className="flex-1 bg-black/50 border border-white/15 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#D9C4AB] transition"
                      />
                      <label className="px-3.5 py-2.5 bg-white/5 hover:bg-white/10 text-white border border-white/15 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 cursor-pointer transition flex-shrink-0">
                        <Upload className="w-3.5 h-3.5 text-[#D9C4AB]" />
                        <span>Subir Foto</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleCategoryImageUpload}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {/* Galería de Fotos Streetwear Recomendadas en 1 Clic */}
                    <div className="flex items-center space-x-1.5 overflow-x-auto pt-1 pb-1">
                      <span className="text-[10px] text-white/50 uppercase font-mono flex-shrink-0">Reemplazar por foto pro:</span>
                      {CURATED_STREETWEAR_PHOTOS.map((photo, pIdx) => (
                        <button
                          key={pIdx}
                          type="button"
                          onClick={() => handleUpdateCategory('image', photo.url)}
                          className={`text-[10px] px-2 py-0.5 rounded border transition flex-shrink-0 cursor-pointer ${
                            currentCategory.image === photo.url
                              ? 'bg-blue-600 text-white border-blue-400 font-bold'
                              : 'bg-white/5 text-white/70 hover:bg-white/15 border-white/15'
                          }`}
                        >
                          {photo.label}
                        </button>
                      ))}
                    </div>

                    {/* Especificación técnica */}
                    <div className="bg-[#0C0D12] border border-[#D9C4AB]/30 rounded-lg p-2.5 flex items-start space-x-2.5 text-[11px] text-neutral-300">
                      <div className="p-1 rounded bg-[#D9C4AB]/15 text-[#D9C4AB] shrink-0 mt-0.5">
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-white uppercase tracking-wider text-[10px] bg-white/10 px-1.5 py-0.2 rounded">
                            Super Retina XDR: 1200 × 1600 px
                          </span>
                          <span className="text-[#D9C4AB] font-semibold text-[10px]">
                            Proporción: 3:4 (Vertical)
                          </span>
                        </div>
                        <p className="text-[10px] text-neutral-400 leading-tight">
                          Esta misma imagen se utiliza en alta definición en la tarjeta de la portada y difuminada en el banner del catálogo.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Columna Derecha: Previsualizador Interactivo en Tiempo Real */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="bg-[#14151D] p-4 rounded-xl border border-white/10 space-y-3">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                      <div className="flex items-center space-x-2 text-xs font-bold text-white/90 uppercase tracking-wide">
                        <Eye className="w-4 h-4 text-blue-400" />
                        <span>Previsualizador en Vivo</span>
                      </div>
                      <div className="flex items-center space-x-1 bg-black/50 p-0.5 rounded-lg border border-white/10 text-[10px]">
                        <button
                          type="button"
                          onClick={() => setCategoryPreviewMode('card')}
                          className={`px-2 py-1 rounded font-bold transition cursor-pointer ${
                            categoryPreviewMode === 'card'
                              ? 'bg-blue-600 text-white'
                              : 'text-white/60 hover:text-white'
                          }`}
                        >
                          Portada
                        </button>
                        <button
                          type="button"
                          onClick={() => setCategoryPreviewMode('banner')}
                          className={`px-2 py-1 rounded font-bold transition cursor-pointer ${
                            categoryPreviewMode === 'banner'
                              ? 'bg-blue-600 text-white'
                              : 'text-white/60 hover:text-white'
                          }`}
                        >
                          Catálogo
                        </button>
                        <button
                          type="button"
                          onClick={() => setCategoryPreviewMode('header')}
                          className={`px-2 py-1 rounded font-bold transition cursor-pointer ${
                            categoryPreviewMode === 'header'
                              ? 'bg-blue-600 text-white'
                              : 'text-white/60 hover:text-white'
                          }`}
                        >
                          Menú
                        </button>
                      </div>
                    </div>

                    {/* VISTA 1: Tarjeta en la Portada (Visual Hub) */}
                    {categoryPreviewMode === 'card' && (
                      <div className="space-y-2 animate-in fade-in duration-150">
                        <span className="text-[10px] text-white/50 uppercase font-mono block">
                          Así se ve la tarjeta en la página de inicio (Visual Hub):
                        </span>
                        <div className="relative w-full h-[360px] rounded-none overflow-hidden shadow-2xl bg-black text-white flex flex-col justify-end p-5 border border-white/15 group">
                          <img
                            src={currentCategory.image}
                            alt={currentCategory.name}
                            className="absolute inset-0 w-full h-full object-cover opacity-75 group-hover:opacity-90 group-hover:scale-105 transition-all duration-700 filter contrast-110"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1000&auto=format&fit=crop';
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent pointer-events-none" />

                          {/* Badges superiores */}
                          <div className="absolute top-3 left-3 z-10 flex items-center space-x-2">
                            <span className="bg-[#101013]/90 backdrop-blur-xs text-[#F5F2E4] text-[9.5px] font-black uppercase px-2 py-0.5 rounded-xs border border-white/20">
                              {currentCategory.badge || 'COLECCIÓN'}
                            </span>
                            <span className="bg-white/20 backdrop-blur-xs text-white text-[9.5px] font-mono font-bold px-1.5 py-0.5 rounded-xs">
                              {getProductCountForCategory(currentCategory.id)} prendas
                            </span>
                          </div>

                          {/* Contenido inferior */}
                          <div className="relative z-10 space-y-1.5">
                            <p className="text-[11px] text-[#D9C4AB] font-semibold uppercase tracking-widest">
                              {currentCategory.subtitle || 'Edición Limitada'}
                            </p>
                            <h4 className="font-black text-xl uppercase tracking-tight text-[#F5F2E4] leading-tight">
                              {currentCategory.name}
                            </h4>
                            <div className="pt-2">
                              <span className="inline-flex items-center space-x-1.5 text-[10px] font-black uppercase tracking-wider text-white bg-white/15 px-3 py-1.5 rounded-xs border border-white/30">
                                <span>Ver Colección</span>
                                <ArrowRight className="w-3 h-3" />
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* VISTA 2: Banner Gigante en Catálogo */}
                    {categoryPreviewMode === 'banner' && (
                      <div className="space-y-2 animate-in fade-in duration-150">
                        <span className="text-[10px] text-white/50 uppercase font-mono block">
                          Así se ve la cabecera cuando el cliente entra a comprar:
                        </span>
                        <div className="relative w-full h-[280px] rounded-xl overflow-hidden shadow-2xl bg-[#101013] text-[#F5F2E4] flex flex-col justify-center p-5 border border-white/15">
                          <img
                            src={currentCategory.image}
                            alt={currentCategory.name}
                            className="absolute inset-0 w-full h-full object-cover opacity-35 filter contrast-125"
                          />
                          <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/75 to-black/50" />

                          <div className="relative z-10 space-y-2">
                            <div className="inline-flex items-center space-x-1.5 bg-white/10 backdrop-blur-md px-2.5 py-0.5 rounded border border-white/15">
                              <Sparkles className="w-3 h-3 text-[#D9C4AB]" />
                              <span className="text-[10px] font-bold uppercase tracking-widest text-[#D9C4AB]">
                                {currentCategory.kicker || 'CÁPSULA ESPECIAL'}
                              </span>
                            </div>

                            <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-[#F5F2E4] leading-tight">
                              {currentCategory.name}
                            </h3>

                            <p className="text-[11px] text-white/75 leading-relaxed line-clamp-2">
                              {currentCategory.description || 'Prendas con confección de autor en Bogotá.'}
                            </p>

                            <div className="pt-1 flex items-center space-x-2 text-[10px] text-white/60">
                              <span className="bg-white/20 text-white font-mono px-2 py-0.5 rounded font-bold">
                                {getProductCountForCategory(currentCategory.id)} prendas disponibles
                              </span>
                              <span>•</span>
                              <span className="text-emerald-400 font-semibold">Despacho inmediato</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* VISTA 3: Menú Superior Header */}
                    {categoryPreviewMode === 'header' && (
                      <div className="space-y-3 animate-in fade-in duration-150">
                        <span className="text-[10px] text-white/50 uppercase font-mono block">
                          Así se ve el botón en la barra de navegación:
                        </span>
                        <div className="bg-[#101013] p-3 rounded-lg border border-white/10 flex items-center justify-between">
                          <span className="text-[10px] text-white/40 uppercase font-mono">Header Oscuro:</span>
                          <span className="text-xs font-bold uppercase tracking-wider text-white">
                            {currentCategory.menuTitle || currentCategory.name}
                          </span>
                        </div>

                        <div className="bg-white p-3 rounded-lg border border-stone-200 flex items-center justify-between text-black">
                          <span className="text-[10px] text-stone-400 uppercase font-mono">Header Blanco (Scroll):</span>
                          <span className="text-xs font-black uppercase tracking-wider text-black underline underline-offset-4">
                            {currentCategory.menuTitle || currentCategory.name}
                          </span>
                        </div>

                        <div className="bg-[#101013] p-3 rounded-lg border border-white/10 space-y-1">
                          <span className="text-[10px] text-white/40 uppercase font-mono block">Menú Celular:</span>
                          <div className="py-2 px-3 bg-white/5 rounded border border-white/10 text-xs font-bold uppercase text-white/90">
                            {currentCategory.mobileTitle || currentCategory.name}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. ENVÍOS & TARIFAS */}
      {/* ============================================================== */}
      {activeSubTab === 'shipping' && (
        <div className="bg-[#14151D] p-5 sm:p-6 rounded-xl border border-white/10 space-y-5 max-w-3xl">
          <div className="border-b border-white/10 pb-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-white/90 flex items-center space-x-2">
              <Truck className="w-4 h-4 text-emerald-400" />
              <span>Configuración de Tarifas de Envío Nacional</span>
            </h3>
            <p className="text-xs text-white/60 mt-1">
              Controla el umbral para ofrecer Envío Gratis y los costos de flete que se cobran en el Checkout.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-white/80 mb-1.5 uppercase tracking-wide">
                Monto Mínimo para Envío Gratis (COP) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-xs text-[#D9C4AB] font-bold">$</span>
                <input
                  type="number"
                  step="1000"
                  value={content.shipping?.freeShippingThreshold ?? 150000}
                  onChange={(e) =>
                    setContent((prev) => ({
                      ...prev,
                      shipping: {
                        ...prev.shipping!,
                        freeShippingThreshold: Number(e.target.value) || 0,
                      },
                    }))
                  }
                  className="w-full bg-black/50 border border-white/15 rounded-lg pl-8 pr-3.5 py-2.5 text-xs sm:text-sm font-mono font-bold text-white focus:outline-none focus:border-[#D9C4AB] transition"
                />
              </div>
              <p className="text-[11px] text-white/50 mt-1">
                Compras iguales o superiores tendrán envío estándar como <strong>CORTESÍA ($0)</strong>.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-white/80 mb-1.5 uppercase tracking-wide">
                Costo Envío Estándar Nacional (COP) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-xs text-[#D9C4AB] font-bold">$</span>
                <input
                  type="number"
                  step="1000"
                  value={content.shipping?.standardShippingCost ?? 15000}
                  onChange={(e) =>
                    setContent((prev) => ({
                      ...prev,
                      shipping: {
                        ...prev.shipping!,
                        standardShippingCost: Number(e.target.value) || 0,
                      },
                    }))
                  }
                  className="w-full bg-black/50 border border-white/15 rounded-lg pl-8 pr-3.5 py-2.5 text-xs sm:text-sm font-mono font-bold text-white focus:outline-none focus:border-[#D9C4AB] transition"
                />
              </div>
              <p className="text-[11px] text-white/50 mt-1">
                Flete aplicado a compras inferiores al monto mínimo.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-white/80 mb-1.5 uppercase tracking-wide">
                Costo Envío Express Prioritario (COP) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-xs text-[#D9C4AB] font-bold">$</span>
                <input
                  type="number"
                  step="1000"
                  value={content.shipping?.expressShippingCost ?? 18000}
                  onChange={(e) =>
                    setContent((prev) => ({
                      ...prev,
                      shipping: {
                        ...prev.shipping!,
                        expressShippingCost: Number(e.target.value) || 0,
                      },
                    }))
                  }
                  className="w-full bg-black/50 border border-white/15 rounded-lg pl-8 pr-3.5 py-2.5 text-xs sm:text-sm font-mono font-bold text-white focus:outline-none focus:border-[#D9C4AB] transition"
                />
              </div>
              <p className="text-[11px] text-white/50 mt-1">
                Tarifa fija de mensajería express urbana en Bogotá.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-white/80 mb-1.5 uppercase tracking-wide">
                Promesa de Entrega en Producto
              </label>
              <input
                type="text"
                value={
                  content.shipping?.shippingNotice ||
                  'Despacho express: Bogotá 24-48 hrs • Envíos a toda Colombia'
                }
                onChange={(e) =>
                  setContent((prev) => ({
                    ...prev,
                    shipping: {
                      ...prev.shipping!,
                      shippingNotice: e.target.value,
                    },
                  }))
                }
                className="w-full bg-black/50 border border-white/15 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-white focus:outline-none focus:border-[#D9C4AB] transition"
              />
              <p className="text-[11px] text-white/50 mt-1">
                Texto visible en la ficha de cada producto junto al ícono de camión.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. ANUNCIOS & WHATSAPP */}
      {/* ============================================================== */}
      {activeSubTab === 'announcements-whatsapp' && (
        <div className="space-y-5 max-w-3xl">
          {/* MÓDULO: BARRA DE CUENTA REGRESIVA & MODO FLASH DROP */}
          <div className="bg-[#14151D] p-5 sm:p-6 rounded-xl border border-white/10 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-white/10 gap-3">
              <div>
                <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">
                  <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
                  <span>CUENTA REGRESIVA & MODO FLASH DROP (URGENCIA STREETWEAR)</span>
                </div>
                <h3 className="text-base sm:text-lg font-black uppercase text-white tracking-tight">
                  Reloj Temporizador de Drop en Portada
                </h3>
                <p className="text-xs text-white/60 mt-0.5 leading-relaxed">
                  Activa un cintillo en el tope de la tienda con un reloj en cuenta regresiva para drops limitados, siluetas de fin de semana o beneficios express al detal.
                </p>
              </div>

              {/* Botón Encender / Apagar */}
              <button
                type="button"
                onClick={() =>
                  setContent((prev) => ({
                    ...prev,
                    countdownBanner: {
                      ...(prev.countdownBanner || DEFAULT_COUNTDOWN_BANNER),
                      enabled: !prev.countdownBanner?.enabled,
                    },
                  }))
                }
                className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center space-x-2 cursor-pointer border self-start sm:self-center shadow-md ${
                  content.countdownBanner?.enabled
                    ? 'bg-amber-400 text-black border-amber-300'
                    : 'bg-white/5 border-white/15 text-white/50 hover:text-white'
                }`}
              >
                <Eye className={`w-4 h-4 ${content.countdownBanner?.enabled ? 'text-black' : 'text-white/40'}`} />
                <span>{content.countdownBanner?.enabled ? 'Drop Activo' : 'Drop Inactivo'}</span>
              </button>
            </div>

            {/* Plantillas Rápidas de 1 Clic (Presets) */}
            <div className="space-y-2 pt-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-white/70 block">
                ⚡ Plantillas Rápidas de 1 Clic (Activa un Drop al Detal en Segundos):
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {COUNTDOWN_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handleApplyCountdownPreset(preset)}
                    className="p-2.5 rounded-lg bg-black/40 hover:bg-black/80 border border-white/10 hover:border-amber-400/50 transition text-left cursor-pointer group flex flex-col justify-between"
                  >
                    <span className="text-xs font-bold text-white group-hover:text-amber-300 transition">
                      {preset.label}
                    </span>
                    <span className="text-[9.5px] text-white/50 mt-1 block truncate">
                      {preset.title}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Configuración Detallada */}
            <div className="space-y-4 pt-2 border-t border-white/10">
              {/* Fecha y Hora de Cierre */}
              <div className="p-4 bg-black/40 rounded-xl border border-white/10 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-xs font-bold text-white uppercase tracking-wide flex items-center space-x-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Fecha y Hora de Cierre del Drop:</span>
                  </label>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-400/15 text-amber-300 border border-amber-400/30 self-start sm:self-auto">
                    Restante: {formatRemainingPreview(content.countdownBanner?.endDate)}
                  </span>
                </div>

                <input
                  type="datetime-local"
                  value={toDatetimeLocal(content.countdownBanner?.endDate)}
                  onChange={(e) =>
                    setContent((prev) => ({
                      ...prev,
                      countdownBanner: {
                        ...(prev.countdownBanner || DEFAULT_COUNTDOWN_BANNER),
                        endDate: e.target.value ? new Date(e.target.value).toISOString() : new Date().toISOString(),
                      },
                    }))
                  }
                  className="w-full bg-black/60 border border-white/15 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm font-mono text-white focus:outline-none focus:border-amber-400 transition"
                />
              </div>

              {/* Título y Subtítulo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-white/80 mb-1.5 uppercase tracking-wide">
                    Título Principal del Banner
                  </label>
                  <input
                    type="text"
                    value={content.countdownBanner?.title || 'FLASH DROP STREETWEAR'}
                    onChange={(e) =>
                      setContent((prev) => ({
                        ...prev,
                        countdownBanner: {
                          ...(prev.countdownBanner || DEFAULT_COUNTDOWN_BANNER),
                          title: e.target.value,
                        },
                      }))
                    }
                    placeholder="Ej. FLASH DROP STREETWEAR"
                    className="w-full bg-black/50 border border-white/15 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm font-black uppercase text-white focus:outline-none focus:border-amber-400 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-white/80 mb-1.5 uppercase tracking-wide">
                    Texto del Botón (CTA)
                  </label>
                  <input
                    type="text"
                    value={content.countdownBanner?.ctaText || 'VER DROP AHORA →'}
                    onChange={(e) =>
                      setContent((prev) => ({
                        ...prev,
                        countdownBanner: {
                          ...(prev.countdownBanner || DEFAULT_COUNTDOWN_BANNER),
                          ctaText: e.target.value,
                        },
                      }))
                    }
                    placeholder="Ej. VER DROP AHORA →"
                    className="w-full bg-black/50 border border-white/15 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm font-bold uppercase text-white focus:outline-none focus:border-amber-400 transition"
                  />
                </div>
              </div>

              {/* Subtítulo Detallado */}
              <div>
                <label className="block text-xs font-bold text-white/80 mb-1.5 uppercase tracking-wide">
                  Subtítulo / Mensaje de Urgencia al Detal
                </label>
                <input
                  type="text"
                  value={content.countdownBanner?.subtitle || ''}
                  onChange={(e) =>
                    setContent((prev) => ({
                      ...prev,
                      countdownBanner: {
                        ...(prev.countdownBanner || DEFAULT_COUNTDOWN_BANNER),
                        subtitle: e.target.value,
                      },
                    }))
                  }
                  placeholder="Ej. Siluetas boxy de alto gramaje con inventario limitado al detal"
                  className="w-full bg-black/50 border border-white/15 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400 transition"
                />
              </div>

              {/* Tema Visual */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-white/80 mb-1.5 uppercase tracking-wide">
                    Estilo Visual (Tema Streetwear)
                  </label>
                  <select
                    value={content.countdownBanner?.theme || 'gold'}
                    onChange={(e) =>
                      setContent((prev) => ({
                        ...prev,
                        countdownBanner: {
                          ...(prev.countdownBanner || DEFAULT_COUNTDOWN_BANNER),
                          theme: e.target.value as any,
                        },
                      }))
                    }
                    className="w-full bg-black/60 border border-white/15 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-white focus:outline-none focus:border-amber-400 transition cursor-pointer"
                  >
                    <option value="gold">🟡 Dorado Streetwear (High-End)</option>
                    <option value="neon">🟢 Verde Neón (Cyber Acid)</option>
                    <option value="dark">⚫ Negro Minimalista (Monochrome)</option>
                    <option value="red">🔴 Rojo Alerta (Máxima Urgencia)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-white/80 mb-1.5 uppercase tracking-wide">
                    Destino al Presionar el Botón
                  </label>
                  <input
                    type="text"
                    value={content.countdownBanner?.ctaAnchor || '#latest-drops'}
                    onChange={(e) =>
                      setContent((prev) => ({
                        ...prev,
                        countdownBanner: {
                          ...(prev.countdownBanner || DEFAULT_COUNTDOWN_BANNER),
                          ctaAnchor: e.target.value,
                        },
                      }))
                    }
                    placeholder="Ej. #latest-drops"
                    className="w-full bg-black/50 border border-white/15 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm font-mono text-white focus:outline-none focus:border-amber-400 transition"
                  />
                </div>
              </div>

              {/* Comportamiento al Expirar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-black/30 rounded-lg border border-white/10">
                <label className="flex items-center space-x-2 text-xs font-bold text-white/90 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={content.countdownBanner?.autoHideOnEnd !== false}
                    onChange={(e) =>
                      setContent((prev) => ({
                        ...prev,
                        countdownBanner: {
                          ...(prev.countdownBanner || DEFAULT_COUNTDOWN_BANNER),
                          autoHideOnEnd: e.target.checked,
                        },
                      }))
                    }
                    className="w-4 h-4 rounded text-amber-400 focus:ring-0 focus:ring-offset-0 bg-black/60 border-white/20 cursor-pointer"
                  />
                  <span>Ocultar automáticamente el banner cuando el reloj llegue a 00:00:00</span>
                </label>

                {content.countdownBanner?.autoHideOnEnd === false && (
                  <input
                    type="text"
                    placeholder="Mensaje al expirar (ej. DROP FINALIZADO)"
                    value={content.countdownBanner?.expiredMessage || 'DROP FINALIZADO'}
                    onChange={(e) =>
                      setContent((prev) => ({
                        ...prev,
                        countdownBanner: {
                          ...(prev.countdownBanner || DEFAULT_COUNTDOWN_BANNER),
                          expiredMessage: e.target.value,
                        },
                      }))
                    }
                    className="bg-black/60 border border-white/15 rounded px-2.5 py-1 text-xs text-white"
                  />
                )}
              </div>
            </div>
          </div>

          <div className="bg-[#14151D] p-5 sm:p-6 rounded-xl border border-white/10 space-y-4">
            <div className="border-b border-white/10 pb-3">
              <h3 className="font-bold text-xs uppercase tracking-wider text-white/90 flex items-center space-x-2">
                <Megaphone className="w-4 h-4 text-emerald-400" />
                <span>Barra Superior de Anuncios</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-white/80 mb-1.5 uppercase tracking-wide">
                  Tag Izquierdo
                </label>
                <input
                  type="text"
                  value={content.announcements?.leftTag || 'COP | $'}
                  onChange={(e) =>
                    setContent((prev) => ({
                      ...prev,
                      announcements: { ...prev.announcements, leftTag: e.target.value },
                    }))
                  }
                  className="w-full bg-black/50 border border-white/15 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-white focus:outline-none focus:border-[#D9C4AB] transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white/80 mb-1.5 uppercase tracking-wide">
                  Sub-texto Izquierdo
                </label>
                <input
                  type="text"
                  value={content.announcements?.leftSub || 'Envíos a toda Colombia • Tallas S - XL'}
                  onChange={(e) =>
                    setContent((prev) => ({
                      ...prev,
                      announcements: { ...prev.announcements, leftSub: e.target.value },
                    }))
                  }
                  className="w-full bg-black/50 border border-white/15 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-white focus:outline-none focus:border-[#D9C4AB] transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-white/80 mb-1.5 uppercase tracking-wide">
                Mensaje Central Desktop
              </label>
              <input
                type="text"
                value={
                  content.announcements?.desktopText ||
                  'DESPACHO DE CORTESÍA EN BOGOTÁ Y COLOMBIA POR COMPRAS DESDE $150.000 COP • '
                }
                onChange={(e) =>
                  setContent((prev) => ({
                    ...prev,
                    announcements: { ...prev.announcements, desktopText: e.target.value },
                  }))
                }
                className="w-full bg-black/50 border border-white/15 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-white focus:outline-none focus:border-[#D9C4AB] transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-white/80 mb-1.5 uppercase tracking-wide">
                Marquesina Móvil (Texto Continuo en Celulares)
              </label>
              <textarea
                rows={2}
                value={
                  content.announcements?.marqueeText ||
                  'DESPACHO DE CORTESÍA POR COMPRAS DESDE $150.000 COP • ENVÍOS A TODA COLOMBIA • PAGOS 100% SEGUROS Y PSE'
                }
                onChange={(e) =>
                  setContent((prev) => ({
                    ...prev,
                    announcements: { ...prev.announcements, marqueeText: e.target.value },
                  }))
                }
                className="w-full bg-black/50 border border-white/15 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm font-medium text-white focus:outline-none focus:border-[#D9C4AB] transition leading-relaxed"
              />
            </div>
          </div>

          <div className="bg-[#14151D] p-5 sm:p-6 rounded-xl border border-white/10 space-y-4">
            <div className="border-b border-white/10 pb-3">
              <h3 className="font-bold text-xs uppercase tracking-wider text-white/90 flex items-center space-x-2">
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                <span>Burbuja Flotante de WhatsApp</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-white/80 mb-1.5 uppercase tracking-wide">
                  Número de WhatsApp (con código de país) *
                </label>
                <input
                  type="text"
                  value={content.whatsapp?.phoneNumber || '573108720491'}
                  onChange={(e) =>
                    setContent((prev) => ({
                      ...prev,
                      whatsapp: { ...prev.whatsapp, phoneNumber: e.target.value },
                    }))
                  }
                  placeholder="573108720491"
                  className="w-full bg-black/50 border border-white/15 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm font-mono font-bold text-white focus:outline-none focus:border-[#D9C4AB] transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white/80 mb-1.5 uppercase tracking-wide">
                  Texto del Globito Emergente
                </label>
                <input
                  type="text"
                  value={content.whatsapp?.tooltipText || '¿Asesoría de tallas o envíos?'}
                  onChange={(e) =>
                    setContent((prev) => ({
                      ...prev,
                      whatsapp: { ...prev.whatsapp, tooltipText: e.target.value },
                    }))
                  }
                  placeholder="¿Asesoría de tallas o envíos?"
                  className="w-full bg-black/50 border border-white/15 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-white focus:outline-none focus:border-[#D9C4AB] transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-white/80 mb-1.5 uppercase tracking-wide">
                Mensaje Predeterminado al Iniciar Chat
              </label>
              <textarea
                rows={2}
                value={
                  content.whatsapp?.prefilledMessage ||
                  'Hola URBANNOISE Bogotá, deseo asesoría sobre las prendas streetwear, tallas disponibles y despachos en Colombia.'
                }
                onChange={(e) =>
                  setContent((prev) => ({
                    ...prev,
                    whatsapp: { ...prev.whatsapp, prefilledMessage: e.target.value },
                  }))
                }
                className="w-full bg-black/50 border border-white/15 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm font-medium text-white focus:outline-none focus:border-[#D9C4AB] transition"
              />
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. TIENDA FÍSICA & MANIFIESTO */}
      {/* ============================================================== */}
      {activeSubTab === 'flagship-manifesto' && (
        <div className="space-y-5 max-w-4xl">
          <div className="bg-[#14151D] p-5 sm:p-6 rounded-xl border border-white/10 space-y-4">
            <div className="border-b border-white/10 pb-3">
              <h3 className="font-bold text-xs uppercase tracking-wider text-white/90 flex items-center space-x-2">
                <Store className="w-4 h-4 text-purple-400" />
                <span>Tienda Física en El GranSan & Horarios</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-white/80 mb-1.5 uppercase tracking-wide">
                  Lema Superior
                </label>
                <input
                  type="text"
                  value={content.flagship?.kicker || 'PIONEROS DESDE 2024'}
                  onChange={(e) =>
                    setContent((prev) => ({
                      ...prev,
                      flagship: { ...prev.flagship, kicker: e.target.value },
                    }))
                  }
                  className="w-full bg-black/50 border border-white/15 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-white focus:outline-none focus:border-[#D9C4AB] transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white/80 mb-1.5 uppercase tracking-wide">
                  Título Concept Store
                </label>
                <input
                  type="text"
                  value={content.flagship?.title || 'URBANNOISE CONCEPT STORE'}
                  onChange={(e) =>
                    setContent((prev) => ({
                      ...prev,
                      flagship: { ...prev.flagship, title: e.target.value },
                    }))
                  }
                  className="w-full bg-black/50 border border-white/15 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm font-bold text-white focus:outline-none focus:border-[#D9C4AB] transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-white/80 mb-1.5 uppercase tracking-wide">
                Dirección Física
              </label>
              <input
                type="text"
                value={
                  content.flagship?.address ||
                  'Cra 10 # 9-37 Local 23-54, Centro Comercial El GranSan, Bogotá - Colombia'
                }
                onChange={(e) =>
                  setContent((prev) => ({
                    ...prev,
                    flagship: { ...prev.flagship, address: e.target.value },
                  }))
                }
                className="w-full bg-black/50 border border-white/15 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-white focus:outline-none focus:border-[#D9C4AB] transition"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-white/80 mb-1.5 uppercase tracking-wide">
                  Horario Tienda Física
                </label>
                <input
                  type="text"
                  value={
                    content.flagship?.storeHours ||
                    'Lunes a Sábado: 9:00 AM - 7:00 PM • Domingos: 10:00 AM - 4:00 PM'
                  }
                  onChange={(e) =>
                    setContent((prev) => ({
                      ...prev,
                      flagship: { ...prev.flagship, storeHours: e.target.value },
                    }))
                  }
                  className="w-full bg-black/50 border border-white/15 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-white focus:outline-none focus:border-[#D9C4AB] transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white/80 mb-1.5 uppercase tracking-wide">
                  Horario Ventas Online & WhatsApp
                </label>
                <input
                  type="text"
                  value={
                    content.flagship?.onlineHours ||
                    'Lunes a Sábado: 8:00 AM - 8:00 PM (Despachos a toda Colombia)'
                  }
                  onChange={(e) =>
                    setContent((prev) => ({
                      ...prev,
                      flagship: { ...prev.flagship, onlineHours: e.target.value },
                    }))
                  }
                  className="w-full bg-black/50 border border-white/15 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-white focus:outline-none focus:border-[#D9C4AB] transition"
                />
              </div>
            </div>
          </div>

          <div className="bg-[#14151D] p-5 sm:p-6 rounded-xl border border-white/10 space-y-4">
            <div className="border-b border-white/10 pb-3">
              <h3 className="font-bold text-xs uppercase tracking-wider text-white/90 flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-amber-400" />
                <span>Manifiesto de Marca & Historia ("Quiénes Somos")</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-white/80 mb-1.5 uppercase tracking-wide">
                  Etiqueta Superior
                </label>
                <input
                  type="text"
                  value={content.manifesto?.kicker || 'VISIÓN & ESENCIA'}
                  onChange={(e) =>
                    setContent((prev) => ({
                      ...prev,
                      manifesto: { ...prev.manifesto!, kicker: e.target.value },
                    }))
                  }
                  className="w-full bg-black/50 border border-white/15 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-white focus:outline-none focus:border-[#D9C4AB] transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white/80 mb-1.5 uppercase tracking-wide">
                  Título del Manifiesto
                </label>
                <input
                  type="text"
                  value={content.manifesto?.title || 'CURADURÍA CON INTENCIÓN: ARTE ✦ FRESCO ✦ TUYO'}
                  onChange={(e) =>
                    setContent((prev) => ({
                      ...prev,
                      manifesto: { ...prev.manifesto!, title: e.target.value },
                    }))
                  }
                  className="w-full bg-black/50 border border-white/15 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm font-bold text-white focus:outline-none focus:border-[#D9C4AB] transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-white/80 mb-1.5 uppercase tracking-wide">
                Párrafo 1 (Filosofía & Concepto)
              </label>
              <textarea
                rows={3}
                value={
                  content.manifesto?.paragraph1 ||
                  'El logo de URBANNOISE representa un movimiento y una transición entre caracteres que transmiten impulso, fluidez y ritmo urbano.'
                }
                onChange={(e) =>
                  setContent((prev) => ({
                    ...prev,
                    manifesto: { ...prev.manifesto!, paragraph1: e.target.value },
                  }))
                }
                className="w-full bg-black/50 border border-white/15 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm font-medium text-white focus:outline-none focus:border-[#D9C4AB] transition leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-white/80 mb-1.5 uppercase tracking-wide">
                Párrafo 2 (Confección & Calidad de Telas)
              </label>
              <textarea
                rows={3}
                value={
                  content.manifesto?.paragraph2 ||
                  'Confeccionamos camisetas oversize con patrones amplios, cuellos rib reforzados y estampados de alta durabilidad en tallas S a XL, con envíos directos a toda Colombia.'
                }
                onChange={(e) =>
                  setContent((prev) => ({
                    ...prev,
                    manifesto: { ...prev.manifesto!, paragraph2: e.target.value },
                  }))
                }
                className="w-full bg-black/50 border border-white/15 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm font-medium text-white focus:outline-none focus:border-[#D9C4AB] transition leading-relaxed"
              />
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 6. ORGANIZADOR DE SECCIONES DE LA PORTADA & REDES */}
      {/* ============================================================== */}
      {activeSubTab === 'sections-social' && (
        <div className="space-y-6 max-w-4xl">
          {/* MÓDULO: ORGANIZADOR DE SECCIONES DE LA PORTADA */}
          <div className="bg-[#14151D] p-5 sm:p-6 rounded-xl border border-white/10 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-white/10 gap-3">
              <div>
                <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">
                  <LayoutTemplate className="w-4 h-4" />
                  <span>ORGANIZADOR DE SECCIONES DE LA PORTADA (HOME BUILDER)</span>
                </div>
                <h3 className="text-base sm:text-lg font-black uppercase text-white tracking-tight">
                  Estructura y Orden de la Página de Inicio
                </h3>
                <p className="text-xs text-white/60 mt-0.5 leading-relaxed">
                  Activa, oculta o reordena los bloques visuales de la tienda. Puedes subir la vitrina de productos de primera, ocultar el manifiesto o pausar cualquier colección con un solo clic.
                </p>
              </div>

              <button
                type="button"
                onClick={handleResetHomeBlocks}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/15 text-white/70 hover:text-white border border-white/10 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer whitespace-nowrap self-start sm:self-center"
                title="Restablecer el orden y visibilidad original de las secciones"
              >
                <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                <span>Orden por Defecto</span>
              </button>
            </div>

            {/* Lista Interactiva de Secciones */}
            <div className="space-y-2.5 pt-1">
              {homeBlocksList.map((block, idx) => {
                const isEnabled = block.enabled !== false;
                const isFirst = idx === 0;
                const isLast = idx === homeBlocksList.length - 1;

                return (
                  <div
                    key={block.id}
                    className={`p-3 sm:p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isEnabled
                        ? 'bg-black/50 border-white/15 shadow-sm'
                        : 'bg-black/25 border-white/5 opacity-60'
                    }`}
                  >
                    {/* Posición, Nombre y Descripción */}
                    <div className="flex items-start sm:items-center space-x-3 min-w-0 flex-1">
                      {/* Rótulo de Posición */}
                      <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 font-mono font-black text-xs text-[#D9C4AB]">
                        #{idx + 1}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                          <h4 className="text-xs sm:text-sm font-black uppercase tracking-tight text-white">
                            {block.label}
                          </h4>
                          {block.badge && (
                            <span className="text-[9.5px] font-bold uppercase font-mono px-2 py-0.2 rounded bg-white/10 text-white/70 border border-white/10">
                              {block.badge}
                            </span>
                          )}
                          {!isEnabled && (
                            <span className="text-[9.5px] font-bold uppercase font-mono px-2 py-0.2 rounded bg-red-500/15 text-red-300 border border-red-500/30">
                              ✕ Oculta en Portada
                            </span>
                          )}
                        </div>
                        {block.description && (
                          <p className="text-[11px] text-white/50 truncate mt-0.5">
                            {block.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Acciones: Flechas de Orden y Toggle de Visibilidad */}
                    <div className="flex items-center space-x-2 self-end sm:self-center flex-shrink-0">
                      {/* Flechas Subir / Bajar */}
                      <div className="flex items-center bg-black/60 border border-white/10 rounded-lg p-0.5">
                        <button
                          type="button"
                          onClick={() => handleMoveBlock(idx, 'up')}
                          disabled={isFirst}
                          className="p-1.5 text-white/70 hover:text-white disabled:opacity-20 disabled:hover:text-white/70 transition cursor-pointer"
                          title="Mover arriba en la página"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveBlock(idx, 'down')}
                          disabled={isLast}
                          className="p-1.5 text-white/70 hover:text-white disabled:opacity-20 disabled:hover:text-white/70 transition cursor-pointer"
                          title="Mover abajo en la página"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Botón de Visibilidad */}
                      <button
                        type="button"
                        onClick={() => handleToggleBlockEnabled(block.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer border ${
                          isEnabled
                            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25'
                            : 'bg-white/5 border-white/15 text-white/40 hover:text-white/70'
                        }`}
                        title={isEnabled ? 'Clic para ocultar esta sección' : 'Clic para mostrar esta sección'}
                      >
                        <Eye className={`w-3.5 h-3.5 ${isEnabled ? 'text-emerald-400' : 'text-white/30'}`} />
                        <span>{isEnabled ? 'Visible' : 'Oculto'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* MÓDULO: SELECTOR DE PRENDAS ESTRELLA EN PORTADA (TOP PICKS) */}
          <div className="bg-[#14151D] p-5 sm:p-6 rounded-xl border border-white/10 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-white/10 gap-3">
              <div>
                <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span>PRENDAS ESTRELLA EN PORTADA (TOP PICKS / BEST SELLERS)</span>
                </div>
                <h3 className="text-base sm:text-lg font-black uppercase text-white tracking-tight">
                  Prendas Destacadas al Inicio de la Portada
                </h3>
                <p className="text-xs text-white/60 mt-0.5 leading-relaxed">
                  Fija manualmente las prendas con mayor stock o margen de ganancia para que aparezcan de primeras en la vitrina de la portada con la insignia <span className="text-amber-300 font-bold">⭐ TOP PICK</span>, seguidas por el resto de novedades.
                </p>
              </div>

              <div className="flex items-center space-x-2 self-start sm:self-center flex-wrap gap-y-2">
                {currentFeaturedSkus.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllFeaturedSkus}
                    className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/20 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
                    title="Desmarcar todas las prendas estrella"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    <span>Limpiar Todo</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setFeaturedSearchTerm('');
                    setFeaturedFilterTab('all');
                    setIsSelectingFeaturedModal(true);
                  }}
                  className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-[#101013] rounded-lg text-xs font-black uppercase tracking-wider transition flex items-center space-x-1.5 cursor-pointer shadow-md"
                  title="Abrir galería para seleccionar o quitar prendas estrella"
                >
                  <Star className="w-3.5 h-3.5 fill-black text-black" />
                  <span>+ Elegir Prendas Estrella ({currentFeaturedSkus.length})</span>
                </button>
              </div>
            </div>

            {/* Lista Ordenada de Prendas Fijadas */}
            {currentFeaturedSkus.length === 0 ? (
              <div className="p-6 bg-black/40 rounded-xl border border-dashed border-white/10 text-center space-y-2">
                <Star className="w-8 h-8 text-amber-400/40 mx-auto" />
                <p className="text-xs font-bold text-white/80 uppercase tracking-wide">
                  No hay prendas fijadas en portada actualmente
                </p>
                <p className="text-xs text-white/50 max-w-md mx-auto">
                  La portada está mostrando automáticamente las últimas novedades sincronizadas con Loyverse. Haz clic en el botón superior para fijar prendas específicas en la posición #1, #2, etc.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setFeaturedSearchTerm('');
                    setFeaturedFilterTab('all');
                    setIsSelectingFeaturedModal(true);
                  }}
                  className="mt-2 inline-flex items-center space-x-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/15 rounded-lg text-xs font-bold text-amber-300 transition cursor-pointer"
                >
                  <Star className="w-3.5 h-3.5 fill-amber-300" />
                  <span>Fijar mi primera prenda estrella ahora</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] text-white/50 px-1 font-mono">
                  <span>Orden de aparición en la portada (de izquierda a derecha):</span>
                  <span>{currentFeaturedSkus.length} prenda{currentFeaturedSkus.length === 1 ? '' : 's'} fijada{currentFeaturedSkus.length === 1 ? '' : 's'}</span>
                </div>

                {currentFeaturedSkus.map((skuOrId, idx) => {
                  const product = getProductBySkuOrId(skuOrId);
                  const isFirst = idx === 0;
                  const isLast = idx === currentFeaturedSkus.length - 1;
                  const displayName = product?.name || skuOrId;
                  const displayImage = product?.image || (product?.images && product.images[0]) || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=300';
                  const displayPrice = product?.price ? formatCOP(product.price) : '';
                  const displayStock = product?.stock !== undefined ? product.stock : null;

                  return (
                    <div
                      key={skuOrId}
                      className="p-3 bg-black/50 border border-white/15 rounded-xl flex items-center justify-between gap-3 shadow-sm hover:border-amber-400/40 transition"
                    >
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        {/* Posición en el Carrusel */}
                        <div className="w-8 h-8 rounded-lg bg-amber-400/10 border border-amber-400/30 flex items-center justify-center flex-shrink-0 font-mono font-black text-xs text-amber-300">
                          #{idx + 1}
                        </div>

                        {/* Thumbnail */}
                        <div className="w-11 h-11 rounded-lg bg-white/5 border border-white/10 overflow-hidden flex-shrink-0 flex items-center justify-center">
                          <img
                            src={displayImage}
                            alt={displayName}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=300';
                            }}
                          />
                        </div>

                        {/* Metadata */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="text-xs sm:text-sm font-black uppercase text-white truncate">
                              {displayName}
                            </h4>
                            <span className="text-[10px] font-mono text-amber-300 bg-amber-400/10 px-1.5 py-0.2 rounded border border-amber-400/20 whitespace-nowrap">
                              ⭐ TOP PICK
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 text-[11px] text-white/50 mt-0.5">
                            <span className="font-mono text-white/70">{product?.sku || skuOrId}</span>
                            {displayPrice && <span>• {displayPrice}</span>}
                            {displayStock !== null && (
                              <span className={displayStock > 0 ? 'text-emerald-400' : 'text-red-400'}>
                                • {displayStock > 0 ? `${displayStock} en stock` : 'Agotado'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Botones de Orden y Quitar */}
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <div className="flex items-center bg-black/60 border border-white/10 rounded-lg p-0.5">
                          <button
                            type="button"
                            onClick={() => handleMoveFeaturedSku(idx, 'up')}
                            disabled={isFirst}
                            className="p-1.5 text-white/70 hover:text-white disabled:opacity-20 transition cursor-pointer"
                            title="Mover hacia la izquierda (subir prioridad)"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveFeaturedSku(idx, 'down')}
                            disabled={isLast}
                            className="p-1.5 text-white/70 hover:text-white disabled:opacity-20 transition cursor-pointer"
                            title="Mover hacia la derecha (bajar prioridad)"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveFeaturedSku(skuOrId)}
                          className="p-1.5 text-white/40 hover:text-red-400 bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/20 rounded-lg transition cursor-pointer"
                          title="Quitar estrella y desfijar de portada"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-[#14151D] p-5 sm:p-6 rounded-xl border border-white/10 space-y-4">
            <div className="border-b border-white/10 pb-3">
              <h3 className="font-bold text-xs uppercase tracking-wider text-white/90 flex items-center space-x-2">
                <LayoutTemplate className="w-4 h-4 text-blue-400" />
                <span>Títulos de los 4 Carruseles de la Página Principal</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-black/40 rounded-xl space-y-2 border border-white/10">
                <span className="text-xs uppercase font-bold text-[#D9C4AB] block">Carrusel 1: Últimos Lanzamientos</span>
                <input
                  type="text"
                  placeholder="Kicker (ej. DROP EXCLUSIVO 2026)"
                  value={content.sections?.latestDropsKicker || 'DROP EXCLUSIVO 2026'}
                  onChange={(e) =>
                    setContent((prev) => ({
                      ...prev,
                      sections: { ...prev.sections, latestDropsKicker: e.target.value },
                    }))
                  }
                  className="w-full bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-[#D9C4AB] transition"
                />
                <input
                  type="text"
                  placeholder="Título (ej. ÚLTIMOS LANZAMIENTOS)"
                  value={content.sections?.latestDropsTitle || 'ÚLTIMOS LANZAMIENTOS'}
                  onChange={(e) =>
                    setContent((prev) => ({
                      ...prev,
                      sections: { ...prev.sections, latestDropsTitle: e.target.value },
                    }))
                  }
                  className="w-full bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-xs font-black uppercase text-white focus:outline-none focus:border-[#D9C4AB] transition"
                />
              </div>

              <div className="p-4 bg-black/40 rounded-xl space-y-2 border border-white/10">
                <span className="text-xs uppercase font-bold text-[#D9C4AB] block">Carrusel 2: Young & Free</span>
                <input
                  type="text"
                  placeholder="Kicker (ej. CÁPSULA ESTELAR)"
                  value={content.sections?.youngFreeKicker || 'CÁPSULA ESTELAR'}
                  onChange={(e) =>
                    setContent((prev) => ({
                      ...prev,
                      sections: { ...prev.sections, youngFreeKicker: e.target.value },
                    }))
                  }
                  className="w-full bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-[#D9C4AB] transition"
                />
                <input
                  type="text"
                  placeholder="Título (ej. YOUNG & FREE)"
                  value={content.sections?.youngFreeTitle || 'YOUNG & FREE'}
                  onChange={(e) =>
                    setContent((prev) => ({
                      ...prev,
                      sections: { ...prev.sections, youngFreeTitle: e.target.value },
                    }))
                  }
                  className="w-full bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-xs font-black uppercase text-white focus:outline-none focus:border-[#D9C4AB] transition"
                />
              </div>

              <div className="p-4 bg-black/40 rounded-xl space-y-2 border border-white/10">
                <span className="text-xs uppercase font-bold text-[#D9C4AB] block">Carrusel 3: Weird Oversize</span>
                <input
                  type="text"
                  placeholder="Kicker (ej. SPECIAL OVERSIZE)"
                  value={content.sections?.weirdOversizeKicker || 'SPECIAL OVERSIZE'}
                  onChange={(e) =>
                    setContent((prev) => ({
                      ...prev,
                      sections: { ...prev.sections, weirdOversizeKicker: e.target.value },
                    }))
                  }
                  className="w-full bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-[#D9C4AB] transition"
                />
                <input
                  type="text"
                  placeholder="Título (ej. PLEASURES & WEIRD BOXY)"
                  value={content.sections?.weirdOversizeTitle || 'PLEASURES & WEIRD BOXY'}
                  onChange={(e) =>
                    setContent((prev) => ({
                      ...prev,
                      sections: { ...prev.sections, weirdOversizeTitle: e.target.value },
                    }))
                  }
                  className="w-full bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-xs font-black uppercase text-white focus:outline-none focus:border-[#D9C4AB] transition"
                />
              </div>

              <div className="p-4 bg-black/40 rounded-xl space-y-2 border border-white/10">
                <span className="text-xs uppercase font-bold text-[#D9C4AB] block">Carrusel 4: Dama Oversize</span>
                <input
                  type="text"
                  placeholder="Kicker (ej. CÁPSULA FEMENINA)"
                  value={content.sections?.damaOversizeKicker || 'CÁPSULA FEMENINA'}
                  onChange={(e) =>
                    setContent((prev) => ({
                      ...prev,
                      sections: { ...prev.sections, damaOversizeKicker: e.target.value },
                    }))
                  }
                  className="w-full bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-[#D9C4AB] transition"
                />
                <input
                  type="text"
                  placeholder="Título (ej. DAMA OVERSIZE)"
                  value={content.sections?.damaOversizeTitle || 'DAMA OVERSIZE'}
                  onChange={(e) =>
                    setContent((prev) => ({
                      ...prev,
                      sections: { ...prev.sections, damaOversizeTitle: e.target.value },
                    }))
                  }
                  className="w-full bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-xs font-black uppercase text-white focus:outline-none focus:border-[#D9C4AB] transition"
                />
              </div>
            </div>
          </div>

          <div className="bg-[#14151D] p-5 sm:p-6 rounded-xl border border-white/10 space-y-4">
            <div className="border-b border-white/10 pb-3">
              <h3 className="font-bold text-xs uppercase tracking-wider text-white/90 flex items-center space-x-2">
                <Share2 className="w-4 h-4 text-pink-400" />
                <span>Redes Sociales Oficiales & Pie de Página</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-white/80 mb-1.5 uppercase tracking-wide">
                  Enlace Instagram Oficial
                </label>
                <input
                  type="text"
                  value={content.social?.instagramUrl || 'https://instagram.com/urbannoise'}
                  onChange={(e) =>
                    setContent((prev) => ({
                      ...prev,
                      social: { ...prev.social, instagramUrl: e.target.value },
                    }))
                  }
                  placeholder="https://instagram.com/tu_cuenta"
                  className="w-full bg-black/50 border border-white/15 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-white focus:outline-none focus:border-[#D9C4AB] transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white/80 mb-1.5 uppercase tracking-wide">
                  Enlace TikTok Oficial
                </label>
                <input
                  type="text"
                  value={content.social?.tiktokUrl || 'https://tiktok.com/@urbannoise'}
                  onChange={(e) =>
                    setContent((prev) => ({
                      ...prev,
                      social: { ...prev.social, tiktokUrl: e.target.value },
                    }))
                  }
                  placeholder="https://tiktok.com/@tu_cuenta"
                  className="w-full bg-black/50 border border-white/15 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-white focus:outline-none focus:border-[#D9C4AB] transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-white/80 mb-1.5 uppercase tracking-wide">
                  Correo Electrónico de Soporte
                </label>
                <input
                  type="email"
                  value={content.social?.supportEmail || 'urban.noice2023@gmail.com'}
                  onChange={(e) =>
                    setContent((prev) => ({
                      ...prev,
                      social: { ...prev.social, supportEmail: e.target.value },
                    }))
                  }
                  className="w-full bg-black/50 border border-white/15 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-white focus:outline-none focus:border-[#D9C4AB] transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white/80 mb-1.5 uppercase tracking-wide">
                  Texto de Copyright / Derechos en Footer
                </label>
                <input
                  type="text"
                  value={
                    content.social?.copyrightNotice ||
                    '© 2026 URBANNOISE S.A.S. • NIT 901.847.239-1 • Bogotá D.C., Colombia • Todos los derechos reservados.'
                  }
                  onChange={(e) =>
                    setContent((prev) => ({
                      ...prev,
                      social: { ...prev.social, copyrightNotice: e.target.value },
                    }))
                  }
                  className="w-full bg-black/50 border border-white/15 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-white focus:outline-none focus:border-[#D9C4AB] transition"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: ASIGNADOR MASIVO DE PRENDAS A CATEGORÍAS                 */}
      {/* ============================================================== */}
      {bulkModalCategory && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-hidden animate-in fade-in duration-200">
          <div className="bg-[#0E0F17] border border-white/20 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Cabecera del Modal */}
            <div className="bg-[#14151D] px-5 sm:px-6 py-4 border-b border-white/10 flex items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
                  <Package className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">
                      ASIGNACIÓN MASIVA DE PRENDAS
                    </span>
                    <span className="text-[10px] bg-black/60 text-[#D9C4AB] font-mono px-2 py-0.2 rounded border border-white/10 font-bold">
                      ID: {bulkModalCategory.id}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black uppercase text-white tracking-tight flex items-center space-x-2">
                    <span>{bulkModalCategory.name}</span>
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!isSavingBulk) {
                    setBulkModalCategory(null);
                    setBulkFeedback(null);
                  }
                }}
                disabled={isSavingBulk}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/15 text-white/60 hover:text-white flex items-center justify-center transition cursor-pointer disabled:opacity-30"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Barra de Filtros y Búsqueda */}
            <div className="bg-[#10111A] px-5 sm:px-6 py-3.5 border-b border-white/10 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Buscador */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={bulkSearchTerm}
                  onChange={(e) => setBulkSearchTerm(e.target.value)}
                  placeholder="Buscar por nombre, SKU o silueta (ej: Boxy, Acid Wash, UN-001)..."
                  className="w-full bg-black/60 border border-white/15 rounded-lg pl-9 pr-8 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-blue-400 transition"
                />
                {bulkSearchTerm && (
                  <button
                    type="button"
                    onClick={() => setBulkSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Filtros de Pestaña */}
              <div className="flex items-center space-x-1.5 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setBulkFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                    bulkFilter === 'all'
                      ? 'bg-blue-600 text-white shadow'
                      : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  Todas ({allAvailableProducts.length})
                </button>
                <button
                  type="button"
                  onClick={() => setBulkFilter('assigned')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                    bulkFilter === 'assigned'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  Seleccionadas ({bulkSelectedSkus.size})
                </button>
                <button
                  type="button"
                  onClick={() => setBulkFilter('other')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                    bulkFilter === 'other'
                      ? 'bg-amber-600 text-white shadow'
                      : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  No Seleccionadas ({Math.max(0, allAvailableProducts.length - bulkSelectedSkus.size)})
                </button>
              </div>

              {/* Botones de Selección Rápida */}
              <div className="flex items-center space-x-1.5 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => handleSelectAllVisible(filteredBulkProducts.map((p) => p.sku || p.id))}
                  className="px-2.5 py-1.5 bg-white/5 hover:bg-white/15 text-white/80 hover:text-white border border-white/10 rounded-lg text-[11px] font-bold uppercase transition flex items-center space-x-1 cursor-pointer"
                  title="Marcar todas las prendas que se muestran en el filtro actual"
                >
                  <CheckSquare className="w-3.5 h-3.5 text-blue-400" />
                  <span>Marcar mostradas ({filteredBulkProducts.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDeselectAllVisible(filteredBulkProducts.map((p) => p.sku || p.id))}
                  className="px-2.5 py-1.5 bg-white/5 hover:bg-white/15 text-white/80 hover:text-white border border-white/10 rounded-lg text-[11px] font-bold uppercase transition flex items-center space-x-1 cursor-pointer"
                  title="Desmarcar todas las prendas que se muestran en el filtro actual"
                >
                  <Square className="w-3.5 h-3.5 text-white/40" />
                  <span>Desmarcar</span>
                </button>
              </div>
            </div>

            {/* Mensaje de Feedback si existe */}
            {bulkFeedback && (
              <div
                className={`px-6 py-2.5 text-xs font-bold border-b flex items-center space-x-2 ${
                  bulkFeedback.type === 'success'
                    ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
                    : 'bg-red-950/80 border-red-500/40 text-red-300'
                }`}
              >
                {bulkFeedback.type === 'success' ? (
                  <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-400" />
                )}
                <span>{bulkFeedback.message}</span>
              </div>
            )}

            {/* Parrilla de Prendas Seleccionables */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-black/40">
              {filteredBulkProducts.length === 0 ? (
                <div className="py-16 text-center">
                  <Package className="w-10 h-10 text-white/20 mx-auto mb-2" />
                  <p className="text-sm font-bold text-white/60">No se encontraron prendas con este filtro o búsqueda.</p>
                  <p className="text-xs text-white/40 mt-1">Intenta con otro término o borra el buscador.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {filteredBulkProducts.map((product) => {
                    const sku = product.sku || product.id;
                    const isChecked = bulkSelectedSkus.has(sku);
                    const wasInitiallyInCat = bulkInitialSkus.has(sku);
                    const custom = storedCustoms[sku];
                    const currentProdCat = custom?.category || product.category;
                    const matchingCatObj = categoriesList.find((c) => c.id === currentProdCat);
                    const catDisplayName = matchingCatObj?.name || currentProdCat;

                    return (
                      <div
                        key={sku}
                        onClick={() => handleToggleProductSku(sku)}
                        className={`group relative p-3 rounded-xl border transition-all cursor-pointer flex items-center space-x-3 select-none ${
                          isChecked
                            ? 'bg-blue-950/30 border-blue-500/70 shadow-md ring-1 ring-blue-500/30'
                            : 'bg-[#14151D] border-white/10 hover:border-white/25 hover:bg-white/5 opacity-80 hover:opacity-100'
                        }`}
                      >
                        {/* Checkbox Visual */}
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition border ${
                            isChecked
                              ? 'bg-blue-600 border-blue-400 text-white'
                              : 'bg-black/50 border-white/30 text-transparent group-hover:border-white/50'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>

                        {/* Imagen de la prenda */}
                        <div className="w-14 h-14 rounded-lg bg-black/60 overflow-hidden flex-shrink-0 border border-white/10 relative">
                          <img
                            src={
                              custom?.images?.[0] ||
                              product.images?.[0] ||
                              product.image ||
                              'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=200&auto=format&fit=crop'
                            }
                            alt={product.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=200&auto=format&fit=crop';
                            }}
                          />
                        </div>

                        {/* Información de la prenda */}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-white truncate uppercase">
                            {custom?.name || product.name}
                          </h4>
                          <div className="flex items-center justify-between text-[11px] text-white/50 font-mono mt-0.5">
                            <span>{sku}</span>
                            <span className="text-[#D9C4AB] font-bold">
                              {formatCOP(custom?.price ?? product.price)}
                            </span>
                          </div>

                          {/* Rótulo de Estado */}
                          <div className="mt-1.5 flex items-center">
                            {isChecked && wasInitiallyInCat && (
                              <span className="text-[9.5px] font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.2 rounded">
                                ✓ En esta categoría
                              </span>
                            )}
                            {isChecked && !wasInitiallyInCat && (
                              <span className="text-[9.5px] font-bold text-blue-300 bg-blue-500/20 border border-blue-400/40 px-1.5 py-0.2 rounded animate-pulse">
                                + Se asignará aquí
                              </span>
                            )}
                            {!isChecked && wasInitiallyInCat && (
                              <span className="text-[9.5px] font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.2 rounded">
                                ✕ Se desvinculará
                              </span>
                            )}
                            {!isChecked && !wasInitiallyInCat && (
                              <span className="text-[9.5px] text-white/40 font-mono truncate max-w-[140px]" title={catDisplayName}>
                                En: {catDisplayName}
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

            {/* Pie del Modal con Estadísticas y Botón Guardar */}
            <div className="bg-[#14151D] px-5 sm:px-6 py-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <span className="font-bold text-white">
                  Total seleccionadas: <span className="text-blue-400 font-mono text-sm">{bulkSelectedSkus.size}</span> prendas
                </span>
                {bulkSelectedSkus.size > bulkInitialSkus.size && (
                  <span className="text-emerald-400 text-[11px] font-bold">
                    (+{bulkSelectedSkus.size - Array.from(bulkSelectedSkus).filter((s) => bulkInitialSkus.has(s)).length} nuevas a sumar)
                  </span>
                )}
                {Array.from(bulkInitialSkus).filter((s) => !bulkSelectedSkus.has(s)).length > 0 && (
                  <span className="text-amber-400 text-[11px] font-bold">
                    (-{Array.from(bulkInitialSkus).filter((s) => !bulkSelectedSkus.has(s)).length} a mover a Novedades)
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    setBulkModalCategory(null);
                    setBulkFeedback(null);
                  }}
                  disabled={isSavingBulk}
                  className="flex-1 sm:flex-initial px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider text-white/60 hover:text-white transition cursor-pointer disabled:opacity-30"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={handleSaveBulkAssignment}
                  disabled={isSavingBulk}
                  className="flex-1 sm:flex-initial px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900/50 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition cursor-pointer flex items-center justify-center space-x-2 shadow-lg disabled:cursor-not-allowed"
                >
                  {isSavingBulk ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Guardando Cambios...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Guardar Asignación ({bulkSelectedSkus.size} Prendas)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ============================================================== */}
      {/* MODAL: SELECTOR DE PRENDAS ESTRELLA EN PORTADA (TOP PICKS)     */}
      {/* ============================================================== */}
      {isSelectingFeaturedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="bg-[#101013] border border-white/15 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabecera del Modal */}
            <div className="bg-[#14151D] px-5 sm:px-6 py-4 border-b border-white/10 flex items-center justify-between gap-3 flex-shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center flex-shrink-0">
                  <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-white flex items-center gap-2">
                    <span>SELECCIONAR PRENDAS ESTRELLA</span>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                      {currentFeaturedSkus.length} fijadas
                    </span>
                  </h3>
                  <p className="text-xs text-white/60">
                    Haz clic en cualquier prenda para marcarla con una estrella ⭐ y fijarla al inicio de la tienda.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsSelectingFeaturedModal(false)}
                className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition cursor-pointer"
                title="Cerrar ventana"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Barra de Filtros y Búsqueda */}
            <div className="px-5 sm:px-6 py-3 bg-[#12131A] border-b border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 flex-shrink-0">
              {/* Buscador */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="text"
                  placeholder="Buscar prenda por nombre, SKU o categoría..."
                  value={featuredSearchTerm}
                  onChange={(e) => setFeaturedSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-9 py-2 bg-black/60 border border-white/15 rounded-xl text-xs font-medium text-white placeholder-white/30 focus:outline-none focus:border-amber-400 transition"
                />
                {featuredSearchTerm && (
                  <button
                    type="button"
                    onClick={() => setFeaturedSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Filtros por Pestaña */}
              <div className="flex items-center space-x-1.5 self-center sm:self-auto overflow-x-auto py-0.5">
                <button
                  type="button"
                  onClick={() => setFeaturedFilterTab('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                    featuredFilterTab === 'all'
                      ? 'bg-amber-400 text-black shadow'
                      : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  Todas ({allAvailableProducts.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFeaturedFilterTab('starred')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap flex items-center space-x-1 ${
                    featuredFilterTab === 'starred'
                      ? 'bg-amber-400 text-black shadow'
                      : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Star className="w-3 h-3 fill-current" />
                  <span>Fijadas ({currentFeaturedSkus.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFeaturedFilterTab('unstarred')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                    featuredFilterTab === 'unstarred'
                      ? 'bg-amber-400 text-black shadow'
                      : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  Sin fijar ({Math.max(0, allAvailableProducts.length - currentFeaturedSkus.length)})
                </button>
              </div>
            </div>

            {/* Listado de Prendas */}
            <div className="p-4 sm:p-6 overflow-y-auto max-h-[60vh] space-y-2 flex-1">
              {filteredFeaturedProducts.length === 0 ? (
                <div className="py-12 text-center text-white/50 text-xs">
                  No se encontraron prendas con los filtros aplicados.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {filteredFeaturedProducts.map((p) => {
                    const sku = p.sku || p.id;
                    const isStarred = currentFeaturedSkus.includes(sku);
                    const starredIndex = isStarred ? currentFeaturedSkus.indexOf(sku) : -1;
                    const displayImage = p.image || (p.images && p.images[0]) || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=300';

                    return (
                      <div
                        key={p.id}
                        onClick={() => handleToggleFeaturedSku(sku)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isStarred
                            ? 'bg-amber-500/10 border-amber-400/50 shadow-md'
                            : 'bg-black/40 border-white/10 hover:border-white/25 hover:bg-black/60'
                        }`}
                      >
                        <div className="flex items-center space-x-3 min-w-0 flex-1">
                          {/* Thumbnail */}
                          <div className="w-12 h-12 rounded-lg bg-white/5 border border-white/10 overflow-hidden flex-shrink-0">
                            <img
                              src={displayImage}
                              alt={p.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src =
                                  'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=300';
                              }}
                            />
                          </div>

                          {/* Info */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center space-x-1.5">
                              <h4 className="text-xs font-bold text-white uppercase truncate">
                                {p.name}
                              </h4>
                            </div>
                            <div className="flex items-center space-x-2 text-[10px] text-white/50 mt-0.5">
                              <span className="font-mono text-white/70">{sku}</span>
                              <span>• {formatCOP(p.price)}</span>
                              {p.stock !== undefined && (
                                <span className={p.stock > 0 ? 'text-emerald-400' : 'text-red-400'}>
                                  • {p.stock > 0 ? `${p.stock} uds` : 'Agotado'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Botón Estrella */}
                        <div className="flex items-center space-x-1.5 flex-shrink-0">
                          {isStarred ? (
                            <div className="flex items-center space-x-1 px-2.5 py-1 bg-amber-400 text-black rounded-lg text-xs font-black uppercase tracking-wider shadow">
                              <Star className="w-3.5 h-3.5 fill-black" />
                              <span>#{starredIndex + 1}</span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-1 px-2.5 py-1 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/15 rounded-lg text-xs font-bold transition">
                              <Star className="w-3.5 h-3.5 text-white/40" />
                              <span>Fijar</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Pie del Modal */}
            <div className="bg-[#14151D] px-5 sm:px-6 py-4 border-t border-white/10 flex items-center justify-between gap-3 flex-shrink-0">
              <span className="text-xs text-white/70 font-mono">
                {currentFeaturedSkus.length} de {allAvailableProducts.length} prendas fijadas como ⭐ TOP PICK
              </span>

              <button
                type="button"
                onClick={() => {
                  setIsSelectingFeaturedModal(false);
                  onShowToast?.(`Prendas estrella actualizadas (${currentFeaturedSkus.length} fijadas). Recuerda presionar "Guardar y Publicar en la Web" para guardar.`);
                }}
                className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-black font-black text-xs uppercase tracking-wider rounded-lg transition cursor-pointer shadow-lg"
              >
                Listo / Aceptar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};