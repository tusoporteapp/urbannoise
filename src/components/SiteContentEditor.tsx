import React, { useState } from 'react';
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
} from '../types';
import {
  getStoredSiteContent,
  saveSiteContent,
  saveSiteContentToGitHub,
  DEFAULT_SITE_CONTENT,
} from '../lib/siteContent';
import { getGitHubConfig } from '../lib/githubStorage';

interface SiteContentEditorProps {
  onShowToast?: (msg: string) => void;
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
          <MessageCircle className="w-4 h-4 flex-shrink-0 text-emerald-300" />
          <span>4. Anuncios & WhatsApp</span>
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
          <span>6. Títulos & Redes</span>
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
          {/* Cabecera Informativa con Botón de Creación */}
          <div className="bg-[#14151D] p-5 rounded-xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-blue-400 mb-1">
                <Grid className="w-4 h-4" />
                <span>MÓDULO 1: CONTROL TOTAL DE MENÚ Y CATEGORÍAS</span>
              </div>
              <h2 className="text-lg font-black uppercase text-white tracking-tight">
                Gestor Dinámico de Menú Superior y Colecciones
              </h2>
              <p className="text-xs text-white/60 mt-0.5 max-w-2xl">
                Modifica los nombres que ven los clientes en el menú superior (ej. cambiar <em>Weird Boxy</em> por <em>Boxy Fit</em>, o <em>Dama</em> por <em>Mujer</em>), añade nuevas categorías ilimitadas (ej. <em>Buzos</em>, <em>Gorras</em>) y reordena las colecciones en vivo.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsCreatingCategory(!isCreatingCategory)}
              className={`px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center space-x-2 cursor-pointer transition shadow-md flex-shrink-0 ${
                isCreatingCategory
                  ? 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                  : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>{isCreatingCategory ? 'Cancelar Creación' : '➕ Nueva Categoría'}</span>
            </button>
          </div>

          {/* Formulario de Creación de Nueva Categoría (Desplegable) */}
          {isCreatingCategory && (
            <div className="bg-[#10121A] p-5 sm:p-6 rounded-xl border-2 border-blue-500/40 shadow-2xl space-y-4 animate-in fade-in duration-200">
              <div className="border-b border-white/10 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="font-black text-sm uppercase tracking-wide text-blue-300 flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-blue-400" />
                    <span>Crear Nueva Categoría para la Tienda</span>
                  </h3>
                  <p className="text-xs text-white/50 mt-0.5">
                    Aparecerá automáticamente en el Menú Superior, Menú Móvil, Visual Hub y Filtros del Catálogo.
                  </p>
                </div>
                <span className="text-[10px] font-mono uppercase bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-500/30">
                  PASO 1 DE 1
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-white/80 mb-1 uppercase tracking-wide">
                    Nombre Oficial de la Colección *
                  </label>
                  <input
                    type="text"
                    value={newCatName}
                    onChange={(e) => {
                      setNewCatName(e.target.value);
                      if (!newCatId) {
                        setNewCatId(
                          e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9]+/g, '-')
                            .replace(/(^-|-$)/g, '')
                        );
                      }
                      if (!newCatMenuTitle) {
                        setNewCatMenuTitle(e.target.value);
                      }
                    }}
                    placeholder="Ej. BUZOS & HOODIES"
                    className="w-full bg-black/60 border border-white/20 rounded-lg px-3 py-2 text-xs font-bold text-white uppercase focus:border-blue-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-white/80 mb-1 uppercase tracking-wide">
                    Texto en Menú Superior (Header) *
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
                  <label className="block text-xs font-bold text-white/80 mb-1 uppercase tracking-wide">
                    Texto en Menú Móvil *
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
                  <label className="block text-xs font-bold text-white/80 mb-1 uppercase tracking-wide">
                    ID / Slug Único (en minúsculas)
                  </label>
                  <input
                    type="text"
                    value={newCatId}
                    onChange={(e) => setNewCatId(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                    placeholder="Ej. buzos-hoodies"
                    className="w-full bg-black/60 border border-white/20 rounded-lg px-3 py-2 text-xs font-mono text-[#D9C4AB] focus:border-blue-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-white/80 mb-1 uppercase tracking-wide">
                    Subtítulo Descriptivo *
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
                  <label className="block text-xs font-bold text-white/80 mb-1 uppercase tracking-wide">
                    Insignia / Badge
                  </label>
                  <input
                    type="text"
                    value={newCatBadge}
                    onChange={(e) => setNewCatBadge(e.target.value)}
                    placeholder="Ej. NUEVO o HOT"
                    className="w-full bg-black/60 border border-white/20 rounded-lg px-3 py-2 text-xs font-bold text-white uppercase focus:border-blue-400 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="block text-xs font-bold text-white/80 mb-1 uppercase tracking-wide">
                    Foto de Portada de la Tarjeta (URL) *
                  </label>
                  <input
                    type="text"
                    value={newCatImage}
                    onChange={(e) => setNewCatImage(e.target.value)}
                    placeholder="https://ejemplo.com/foto-buzos.jpg"
                    className="w-full bg-black/60 border border-white/20 rounded-lg px-3 py-2 text-xs text-white focus:border-blue-400 focus:outline-none"
                  />
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

          {/* Selector de Categoría (Pestañas Horizontales) */}
          <div className="bg-[#14151D] p-3 rounded-xl border border-white/10 flex items-center space-x-2 overflow-x-auto">
            {categoriesList.map((cat, idx) => {
              const isSelected = idx === selectedCategoryIndex;
              const isEnabled = cat.enabled !== false;
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
                    {cat.badge || 'TAG'}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Editor Detallado de la Categoría Seleccionada */}
          {currentCategory && (
            <div className="space-y-6">
              {/* Barra de Acciones Rápidas de la Categoría (Estado, Orden, Eliminar) */}
              <div className="bg-[#14151D] p-3.5 rounded-xl border border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center space-x-2">
                  <span className="text-white/50 uppercase font-semibold text-[11px]">Identificador:</span>
                  <code className="font-mono bg-black/60 text-[#D9C4AB] px-2 py-0.5 rounded border border-white/10 font-bold">
                    {currentCategory.id}
                  </code>
                </div>

                <div className="flex flex-wrap items-center gap-2">
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
                    <div className="flex items-center space-x-2 text-xs font-bold text-white/90 uppercase tracking-wide">
                      <Type className="w-4 h-4 text-amber-400" />
                      <span>Textos en Menús de Navegación</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-white/80 mb-1 uppercase tracking-wide">
                          Texto en Menú Superior (Header) *
                        </label>
                        <input
                          type="text"
                          value={currentCategory.menuTitle || currentCategory.name}
                          onChange={(e) => handleUpdateCategory('menuTitle', e.target.value)}
                          placeholder="Ej. Weird Boxy"
                          className="w-full bg-black/50 border border-[#D9C4AB]/50 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm font-bold text-white placeholder-white/40 focus:outline-none focus:border-[#D9C4AB] transition"
                        />
                        <p className="text-[10px] text-white/40 mt-1">
                          Texto que verán los clientes en la barra superior en PC/Laptop.
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-white/80 mb-1 uppercase tracking-wide">
                          Texto en Menú de Celulares *
                        </label>
                        <input
                          type="text"
                          value={currentCategory.mobileTitle || currentCategory.name}
                          onChange={(e) => handleUpdateCategory('mobileTitle', e.target.value)}
                          placeholder="Ej. EDICIÓN WEIRD & OVERSIZE"
                          className="w-full bg-black/50 border border-white/20 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm font-bold text-white uppercase placeholder-white/40 focus:outline-none focus:border-[#D9C4AB] transition"
                        />
                        <p className="text-[10px] text-white/40 mt-1">
                          Texto en el menú lateral desplegable en teléfonos móviles.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Sección 2: Identidad en Visual Hub y Catálogo */}
                  <div className="border-b border-white/10 pb-4 space-y-4">
                    <div className="flex items-center space-x-2 text-xs font-bold text-white/90 uppercase tracking-wide">
                      <Grid className="w-4 h-4 text-blue-400" />
                      <span>Tarjeta del Hub Visual & Cabecera de Catálogo</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-white/80 mb-1 uppercase tracking-wide">
                          Nombre Oficial de la Colección *
                        </label>
                        <input
                          type="text"
                          value={currentCategory.name}
                          onChange={(e) => handleUpdateCategory('name', e.target.value)}
                          placeholder="ÚLTIMOS LANZAMIENTOS"
                          className="w-full bg-black/50 border border-white/15 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm font-black text-white uppercase placeholder-white/40 focus:outline-none focus:border-[#D9C4AB] transition"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-white/80 mb-1 uppercase tracking-wide">
                          Insignia / Badge
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
                        <label className="block text-xs font-bold text-white/80 mb-1 uppercase tracking-wide">
                          Subtítulo Descriptivo *
                        </label>
                        <input
                          type="text"
                          value={currentCategory.subtitle}
                          onChange={(e) => handleUpdateCategory('subtitle', e.target.value)}
                          placeholder="Drop Semanal 2026 o Algodón Pesado 300g"
                          className="w-full bg-black/50 border border-white/15 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-white placeholder-white/40 focus:outline-none focus:border-[#D9C4AB] transition"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-white/80 mb-1 uppercase tracking-wide">
                          Kicker Decorativo en Catálogo
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
                        <label className="block text-xs font-bold text-white/80 mb-1 uppercase tracking-wide">
                          Descripción Detallada en Catálogo
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

                  {/* Sección 3: Foto de Portada */}
                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-white/80 uppercase tracking-wide">
                      Foto de Portada de la Tarjeta *
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

                    {/* Especificación técnica Super Retina XDR */}
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
                          DPI óptimo: 72–150 DPI. Formato sugerido: WebP o JPG 85% para máxima fidelidad visual.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Columna Derecha: Vistas Previas en Vivo */}
                <div className="lg:col-span-5 space-y-5">
                  {/* Vista Previa del Botón en el Header */}
                  <div className="bg-[#14151D] p-4 rounded-xl border border-white/10 space-y-3">
                    <div className="flex items-center space-x-2 text-xs font-bold text-white/80 uppercase tracking-wide">
                      <Monitor className="w-4 h-4 text-amber-400" />
                      <span>Vista Previa en Barra Superior (Header)</span>
                    </div>

                    <div className="bg-[#101013] p-3 rounded-lg border border-white/10 flex items-center justify-between">
                      <span className="text-[10px] text-white/40 uppercase font-mono">Fondo Oscuro:</span>
                      <span className="text-xs font-bold uppercase tracking-wider text-white hover:opacity-75 transition">
                        {currentCategory.menuTitle || currentCategory.name}
                      </span>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-stone-200 flex items-center justify-between">
                      <span className="text-[10px] text-stone-400 uppercase font-mono">Fondo Blanco (Scrolled):</span>
                      <span className="text-xs font-black uppercase tracking-wider text-black underline underline-offset-4">
                        {currentCategory.menuTitle || currentCategory.name}
                      </span>
                    </div>
                  </div>

                  {/* Vista Previa de la Tarjeta en el Hub Visual */}
                  <div className="bg-[#14151D] p-4 rounded-xl border border-white/10 space-y-3">
                    <div className="flex items-center space-x-2 text-xs font-bold text-white/80 uppercase tracking-wide">
                      <Eye className="w-4 h-4 text-blue-400" />
                      <span>Vista Previa de la Tarjeta en Portada</span>
                    </div>

                    <div className="relative w-full h-[320px] rounded-xl overflow-hidden shadow-2xl bg-black text-white flex flex-col justify-end p-5 border border-white/15">
                      <img
                        src={currentCategory.image}
                        alt={currentCategory.name}
                        className="absolute inset-0 w-full h-full object-cover filter contrast-105"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1000&auto=format&fit=crop';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent pointer-events-none" />

                      <div className="relative z-10 space-y-2">
                        <span className="inline-block bg-[#101013] text-[#F5F2E4] text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider border border-white/20">
                          {currentCategory.badge || 'COLECCIÓN'}
                        </span>
                        <h4 className="font-black text-xl uppercase tracking-tight text-[#F5F2E4]">
                          {currentCategory.name}
                        </h4>
                        <p className="text-xs font-medium text-white/80">{currentCategory.subtitle}</p>
                      </div>
                    </div>
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
      {/* 6. TÍTULOS DE SECCIONES & REDES */}
      {/* ============================================================== */}
      {activeSubTab === 'sections-social' && (
        <div className="space-y-5 max-w-4xl">
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
    </div>
  );
};