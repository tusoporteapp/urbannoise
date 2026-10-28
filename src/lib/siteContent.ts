import { SiteContentConfig, HeroSlide, HomeBlockItem, CountdownBannerConfig } from '../types';
import { HERO_SLIDES } from '../data/products';
import { getFileSha, getGitHubConfig, GitHubConfig } from './githubStorage';
import { getAdminHeaders } from './loyverse';

export const DEFAULT_HOME_BLOCKS: HomeBlockItem[] = [
  {
    id: 'hero',
    label: 'Carrusel Hero Principal',
    badge: 'Banners',
    description: 'Banners gigantes deslizantes con títulos, subtítulos y botones de compra directa.',
    enabled: true,
    order: 1,
  },
  {
    id: 'categories',
    label: 'Tarjetas de Categorías (Visual Hub)',
    badge: 'Navegación',
    description: 'Cuadrícula interactiva con fotos de cada colección y conteo en vivo de prendas.',
    enabled: true,
    order: 2,
  },
  {
    id: 'latest-drops',
    label: 'Vitrina de Últimos Lanzamientos',
    badge: 'Prendas',
    description: 'Carrusel horizontal con las novedades streetwear más recientes del inventario.',
    enabled: true,
    order: 3,
  },
  {
    id: 'young-free',
    label: 'Cápsula Young & Free (Banner + Carrusel)',
    badge: 'Colección',
    description: 'Banner lookbook a pantalla completa y vitrina de siluetas juveniles urbanas.',
    enabled: true,
    order: 4,
  },
  {
    id: 'weird-oversize',
    label: 'Weird Boxy & Pleasures (Banner + Carrusel)',
    badge: 'Colección',
    description: 'Banner lookbook y carrusel de camisetas pesadas con corte boxy exclusivo.',
    enabled: true,
    order: 5,
  },
  {
    id: 'dama-oversize',
    label: 'Colección Dama Oversize (Banner + Carrusel)',
    badge: 'Colección',
    description: 'Banner lookbook y carrusel femenino con siluetas holgadas y estampados únicos.',
    enabled: true,
    order: 6,
  },
  {
    id: 'flagship',
    label: 'Tienda Física GranSan (Local 2118)',
    badge: 'Showroom',
    description: 'Ubicación física en Bogotá, horarios de madrugón, mapa GPS y asesoría WhatsApp.',
    enabled: true,
    order: 7,
  },
  {
    id: 'manifesto',
    label: 'Manifiesto de Marca Underground',
    badge: 'Filosofía',
    description: 'Esencia, confección en Bogotá, alto gramaje y visión de moda urbana.',
    enabled: true,
    order: 8,
  },
  {
    id: 'seo',
    label: 'Preguntas Frecuentes & Guía de Compra',
    badge: 'Editorial',
    description: 'Módulo editorial de posicionamiento SEO, dudas frecuentes sobre pagos y envíos.',
    enabled: true,
    order: 9,
  },
];

export const DEFAULT_COUNTDOWN_BANNER: CountdownBannerConfig = {
  enabled: false,
  title: 'FLASH DROP STREETWEAR',
  subtitle: 'Siluetas oversize exclusivas • Confección en Bogotá al detal',
  endDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
  ctaText: 'VER DROP AHORA →',
  ctaAnchor: '#latest-drops',
  theme: 'gold',
  autoHideOnEnd: true,
  expiredMessage: 'DROP FINALIZADO',
};

export const DEFAULT_SITE_CONTENT: SiteContentConfig = {
  heroSlides: HERO_SLIDES.map((s) => ({
    ...s,
    ctaText: 'COMPRAR DROP AHORA',
    badge: 'NOVEDADES SEMANALES',
    badgeSub: 'TALLAS S - XL',
  })),
  announcements: {
    leftTag: 'COP | $',
    leftSub: 'Envíos a toda Colombia • Tallas S - XL',
    marqueeText:
      'DESPACHO DE CORTESÍA POR COMPRAS DESDE $150.000 COP • ENVÍOS A TODA COLOMBIA • PAGOS 100% SEGUROS Y PSE',
    desktopText:
      'DESPACHO DE CORTESÍA EN BOGOTÁ Y COLOMBIA POR COMPRAS DESDE $150.000 COP • ',
    desktopCta: 'VER CATÁLOGO →',
  },
  flagship: {
    kicker: 'PIONEROS DESDE 2024',
    title: 'URBANNOISE CONCEPT STORE',
    storeHours: 'Lunes a Sábado: 9:00 AM - 7:00 PM • Domingos: 10:00 AM - 4:00 PM',
    onlineHours: 'Lunes a Sábado: 8:00 AM - 8:00 PM (Despachos a toda Colombia)',
    address: 'Cra 10 # 9-37 Local 23-54, Centro Comercial El GranSan, Bogotá - Colombia',
    whatsappNumber: '(+57) 310 872 0491',
    googleMapsUrl: 'https://maps.google.com/?q=El+GranSan+Bogota',
  },
  categories: [
    {
      id: 'latest-drops',
      name: 'ÚLTIMOS LANZAMIENTOS',
      menuTitle: 'Novedades',
      mobileTitle: 'ÚLTIMOS LANZAMIENTOS',
      subtitle: 'Drop Semanal 2026',
      badge: 'NUEVO',
      kicker: 'DROP EXCLUSIVO 2026',
      description:
        'Prendas recién confeccionadas en Bogotá con serigrafía de alta densidad, tintorería ácida mineral wash y siluetas boxy de edición numerada.',
      image:
        'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1000&auto=format&fit=crop',
      enabled: true,
      order: 1,
    },
    {
      id: 'young-free',
      name: 'YOUNG & FREE',
      menuTitle: 'Young & Free',
      mobileTitle: 'COLECCIÓN YOUNG & FREE',
      subtitle: 'Underground & Audaz',
      badge: 'POPULAR',
      kicker: 'CÁPSULA JUVENIL',
      description:
        'Gráficos serigráficos provocadores inspirados en la escena underground contemporánea. Confección en algodón 100% peinado nacional.',
      image:
        'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=1000&auto=format&fit=crop',
      enabled: true,
      order: 2,
    },
    {
      id: 'weird-oversize',
      name: 'PLEASURES & WEIRD BOXY',
      menuTitle: 'Weird Boxy',
      mobileTitle: 'EDICIÓN WEIRD & OVERSIZE',
      subtitle: 'Algodón Pesado 300g',
      badge: 'BOXY FIT',
      kicker: 'BOX FIT STREETWEAR',
      description:
        'Hombros caídos pronunciados, cuellos gruesos de 3.5cm y caída recta estructurada. El fit oversize definitivo desarrollado por URBANNOISE Bogotá.',
      image:
        'https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=1000&auto=format&fit=crop',
      enabled: true,
      order: 3,
    },
    {
      id: 'dama-oversize',
      name: 'DAMA OVERSIZE',
      menuTitle: 'Dama',
      mobileTitle: 'DESTACADOS DAMA OVERSIZE',
      subtitle: 'Estampados de Autor',
      badge: 'CÁPSULA',
      kicker: 'SILUETAS RELAJADAS',
      description:
        'Prendas fluidas diseñadas para adaptarse con carácter. Cortes contemporáneos con comodidad absoluta y estética streetwear vanguardista.',
      image:
        'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop',
      enabled: true,
      order: 4,
    },
  ],
  manifesto: {
    kicker: 'VISIÓN & ESENCIA',
    title: 'CURADURÍA CON INTENCIÓN: ARTE ✦ FRESCO ✦ TUYO',
    paragraph1:
      'El logo de URBANNOISE representa un movimiento y una transición entre caracteres que transmiten impulso, fluidez y ritmo urbano. Nos impulsa a avanzar, explorar y conectar con la ciudad a través de cada prenda, trascendiendo tendencias pasajeras para aquellos que valoran la autenticidad.',
    paragraph2:
      'Confeccionamos camisetas oversize con patrones amplios, cuellos rib reforzados y estampados de alta durabilidad en tallas S a XL, con envíos directos a toda Colombia.',
  },
  shipping: {
    freeShippingThreshold: 150000,
    standardShippingCost: 15000,
    expressShippingCost: 22000,
    shippingNotice: 'Despacho express: Bogotá 24-48 hrs • Envíos a toda Colombia',
  },
  social: {
    instagramUrl: 'https://instagram.com/urbannoise',
    tiktokUrl: 'https://tiktok.com/@urbannoise',
    facebookUrl: 'https://facebook.com/urbannoise',
    supportEmail: 'urban.noice2023@gmail.com',
    copyrightNotice: '© 2026 URBANNOISE S.A.S. • NIT 901.847.239-1 • Bogotá D.C., Colombia • Todos los derechos reservados.',
  },
  whatsapp: {
    phoneNumber: '573108720491',
    tooltipText: '¿Asesoría de tallas o envíos?',
    prefilledMessage:
      'Hola URBANNOISE Bogotá, deseo asesoría sobre las prendas streetwear, tallas disponibles y despachos en Colombia.',
  },
  sections: {
    latestDropsKicker: 'DROP EXCLUSIVO 2026',
    latestDropsTitle: 'ÚLTIMOS LANZAMIENTOS',
    youngFreeKicker: 'CÁPSULA JUVENIL',
    youngFreeTitle: 'YOUNG & FREE',
    weirdOversizeKicker: 'BOX FIT STREETWEAR',
    weirdOversizeTitle: 'PLEASURES & WEIRD BOXY',
    damaOversizeKicker: 'SILUETAS RELAJADAS',
    damaOversizeTitle: 'DAMA OVERSIZE',
  },
  countdownBanner: DEFAULT_COUNTDOWN_BANNER,
  homeBlocks: DEFAULT_HOME_BLOCKS,
  featuredSkus: [],
  lastUpdated: new Date().toISOString(),
};

const STORAGE_KEY = 'urbannoise_site_content';

/**
 * Obtiene el contenido del sitio web desde localStorage con respaldo en DEFAULT_SITE_CONTENT
 */
export function getStoredSiteContent(): SiteContentConfig {
  if (typeof window === 'undefined') return DEFAULT_SITE_CONTENT;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return {
          ...DEFAULT_SITE_CONTENT,
          ...parsed,
          heroSlides:
            Array.isArray(parsed.heroSlides) && parsed.heroSlides.length > 0
              ? parsed.heroSlides
              : DEFAULT_SITE_CONTENT.heroSlides,
          categories:
            Array.isArray(parsed.categories) && parsed.categories.length > 0
              ? parsed.categories
              : DEFAULT_SITE_CONTENT.categories,
          homeBlocks:
            Array.isArray(parsed.homeBlocks) && parsed.homeBlocks.length > 0
              ? parsed.homeBlocks
              : DEFAULT_HOME_BLOCKS,
          announcements: {
            ...DEFAULT_SITE_CONTENT.announcements,
            ...(parsed.announcements || {}),
          },
          flagship: {
            ...DEFAULT_SITE_CONTENT.flagship,
            ...(parsed.flagship || {}),
          },
          manifesto: {
            ...DEFAULT_SITE_CONTENT.manifesto,
            ...(parsed.manifesto || {}),
          },
          shipping: {
            ...DEFAULT_SITE_CONTENT.shipping,
            ...(parsed.shipping || {}),
          },
          social: {
            ...DEFAULT_SITE_CONTENT.social,
            ...(parsed.social || {}),
          },
          whatsapp: {
            ...DEFAULT_SITE_CONTENT.whatsapp,
            ...(parsed.whatsapp || {}),
          },
          sections: {
            ...DEFAULT_SITE_CONTENT.sections,
            ...(parsed.sections || {}),
          },
          countdownBanner: {
            ...DEFAULT_COUNTDOWN_BANNER,
            ...(parsed.countdownBanner || {}),
            enabled: Boolean(parsed.countdownBanner?.enabled),
          },
          featuredSkus: Array.isArray(parsed.featuredSkus) ? parsed.featuredSkus : [],
        };
      }
    }
  } catch (e) {
    console.warn('[SiteContent] Error leyendo de localStorage:', e);
  }
  return DEFAULT_SITE_CONTENT;
}

/**
 * Retorna la configuración del banner de cuenta regresiva (Flash Drop)
 */
export function getCountdownBanner(): CountdownBannerConfig {
  const content = getStoredSiteContent();
  return content.countdownBanner || DEFAULT_COUNTDOWN_BANNER;
}

/**
 * Retorna la lista de SKUs de prendas destacadas fijadas en portada (Top Picks)
 */
export function getFeaturedSkus(): string[] {
  const content = getStoredSiteContent();
  return Array.isArray(content.featuredSkus) ? content.featuredSkus : [];
}

/**
 * Retorna la lista ordenada de bloques de la portada con fusión defensiva de bloques por defecto
 */
export function getHomeBlocks(): HomeBlockItem[] {
  const content = getStoredSiteContent();
  const raw = content.homeBlocks && content.homeBlocks.length > 0 ? content.homeBlocks : DEFAULT_HOME_BLOCKS;
  const existingIds = new Set(raw.map((b) => b.id));
  const merged = [...raw];
  DEFAULT_HOME_BLOCKS.forEach((def) => {
    if (!existingIds.has(def.id)) {
      merged.push({ ...def, order: merged.length + 1 });
    }
  });
  return merged.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
}

/**
 * Guarda el contenido en localStorage y emite evento reactivo para actualización instantánea
 */
export function saveSiteContent(content: SiteContentConfig): void {
  if (typeof window === 'undefined') return;
  try {
    const toSave: SiteContentConfig = {
      ...content,
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    window.dispatchEvent(
      new CustomEvent('urbannoise_site_content_updated', { detail: toSave })
    );
  } catch (e) {
    console.error('[SiteContent] Error guardando en localStorage:', e);
  }
}

/**
 * Descarga el contenido remoto desde catalog/site_content.json o GitHub CDN
 */
export async function loadSiteContentFromRemote(): Promise<SiteContentConfig> {
  const cfg = getGitHubConfig();
  const urls = [
    `/catalog/site_content.json?t=${Date.now()}`,
    `https://cdn.jsdelivr.net/gh/${cfg.owner || 'tusoporteapp'}/${cfg.repo || 'urbannoise'}@${cfg.branch || 'master'}/catalog/site_content.json?t=${Date.now()}`,
    `https://raw.githubusercontent.com/${cfg.owner || 'tusoporteapp'}/${cfg.repo || 'urbannoise'}/${cfg.branch || 'master'}/catalog/site_content.json?t=${Date.now()}`,
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.heroSlides) && data.heroSlides.length > 0) {
          saveSiteContent(data);
          return data;
        }
      }
    } catch {
      // Intentar con la siguiente URL
    }
  }

  return getStoredSiteContent();
}

/**
 * Guarda y comitea catalog/site_content.json en GitHub para reflejar los cambios en producción
 */
export async function saveSiteContentToGitHub(
  content: SiteContentConfig,
  customConfig?: GitHubConfig
): Promise<{ success: boolean; commitSha?: string; error?: string }> {
  const cfg = customConfig || getGitHubConfig();

  if (!cfg.token) {
    saveSiteContent(content);
    return {
      success: true,
      error: 'Guardado localmente. Para publicar en GitHub configura un Token en la pestaña GitHub/Cloudflare.',
    };
  }

  const filePath = 'catalog/site_content.json';
  const jsonString = JSON.stringify(content, null, 2);
  const base64Content = btoa(unescape(encodeURIComponent(jsonString)));

  try {
    const sha = await getFileSha(filePath, cfg);
    const commitMsg = `Actualizar contenido de portada y textos del sitio web [URBANNOISE CMS]`;

    const res = await fetch(
      `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${filePath}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${cfg.token}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: commitMsg,
          content: base64Content,
          branch: cfg.branch,
          ...(sha ? { sha } : {}),
        }),
      }
    );

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      saveSiteContent(content);
      return {
        success: false,
        error: errData.message || `Error HTTP ${res.status} al guardar en GitHub`,
      };
    }

    const resData = await res.json();
    saveSiteContent(content);

    // Intentar también guardar en servidor local si está corriendo
    try {
      await fetch('/api/admin/save-site-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminHeaders(),
        },
        body: JSON.stringify(content),
      });
    } catch {}

    return {
      success: true,
      commitSha: resData.commit?.sha || '',
    };
  } catch (err: any) {
    saveSiteContent(content);
    return {
      success: false,
      error: err.message || 'Error de conexión con GitHub',
    };
  }
}

/**
 * Retorna las categorías activas en la tienda ordenadas por su campo order
 */
export function getActiveCategories(): import('../types').CategoryCardContent[] {
  const content = getStoredSiteContent();
  const list = content.categories || DEFAULT_SITE_CONTENT.categories || [];
  return list
    .filter((c) => c.enabled !== false)
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
}

/**
 * Retorna todas las categorías configuradas
 */
export function getAllCategories(): import('../types').CategoryCardContent[] {
  const content = getStoredSiteContent();
  return content.categories || DEFAULT_SITE_CONTENT.categories || [];
}
