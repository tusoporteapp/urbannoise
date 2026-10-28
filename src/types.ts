export type ProductSize = 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'S/M' | 'L/XL' | 'U';

export interface Product {
  id: string;
  name: string;
  category: 'latest-drops' | 'young-free' | 'weird-oversize' | 'dama-oversize' | (string & {});
  price: number;
  image: string;
  desc: string;
  images?: string[];
  sku?: string;
  barcode?: string;
  categoryLabel?: string;
  fit?: string;
  color?: string;
  colorHex?: string;
  longDesc?: string;
  // Campos de integración Loyverse POS en tiempo real
  loyverseItemId?: string;
  loyverseVariantId?: string;
  stock?: number;
  isAvailable?: boolean;
  isCustomized?: boolean;
  isPublished?: boolean;
  customImages?: string[];
  customTitle?: string;
  customDesc?: string;
  variants?: LoyverseVariant[];
  availableSizes?: ProductSize[];
  availableColors?: string[];
  video?: string;
  customVideo?: string;
}

export interface LoyverseVariant {
  variant_id: string;
  sku: string;
  barcode?: string;
  price: number;
  cost?: number;
  in_stock: number;
  option1_value?: string;
  option2_value?: string;
  option3_value?: string | null;
  size?: string;
  color?: string;
}

export interface LoyverseItem {
  id: string;
  name: string;
  category_id?: string;
  category_name?: string;
  description?: string;
  image_url?: string;
  variants: LoyverseVariant[];
  totalStock: number;
}

export interface ProductCustomization {
  sku: string;
  name: string;
  desc: string;
  category: 'latest-drops' | 'young-free' | 'weird-oversize' | 'dama-oversize';
  price?: number;
  images: string[];
  video?: string;
  color?: string;
  fit?: string;
  isPublished: boolean;
  updatedAt: string;
  stock?: number;
  variants?: LoyverseVariant[];
  availableSizes?: ProductSize[];
  availableColors?: string[];
  categoryLabel?: string;
  loyverseItemId?: string;
  loyverseVariantId?: string;
}


export interface CartItem {
  product: Product;
  size: ProductSize;
  color?: string;
  qty: number;
  variantId?: string;
  sku?: string;
}

export interface HeroSlide {
  id: number;
  label: string;
  titleLight: string;
  titleBold: string;
  subtitle: string;
  desc: string;
  img: string;
  ctaAnchor: string;
  ctaText?: string;
  badge?: string;
  badgeSub?: string;
}

export interface FlagshipContent {
  kicker?: string;
  title?: string;
  storeHours?: string;
  onlineHours?: string;
  address?: string;
  whatsappNumber?: string;
  googleMapsUrl?: string;
}

export interface AnnouncementContent {
  leftTag?: string;
  leftSub?: string;
  marqueeText?: string;
  desktopText?: string;
  desktopCta?: string;
}

export interface CategoryCardContent {
  id: string; // 'latest-drops' | 'young-free' | 'weird-oversize' | 'dama-oversize' o slug personalizado
  name: string;
  subtitle: string;
  badge: string;
  image: string;
  menuTitle?: string;     // Texto corto para la barra de navegación del Header (ej: "Novedades")
  mobileTitle?: string;   // Texto para el menú lateral en dispositivos móviles (ej: "ÚLTIMOS LANZAMIENTOS")
  kicker?: string;        // Kicker decorativo en el catálogo (ej: "DROP EXCLUSIVO 2026")
  description?: string;   // Descripción que aparece en la cabecera del catálogo/marketplace
  enabled?: boolean;      // Si la categoría está activa en la tienda (default: true)
  order?: number;         // Orden de visualización en el menú y en el Visual Hub
}

export interface BrandManifestoContent {
  kicker: string;
  title: string;
  paragraph1: string;
  paragraph2: string;
}

export interface ShippingRatesConfig {
  freeShippingThreshold: number;
  standardShippingCost: number;
  expressShippingCost: number;
  shippingNotice?: string;
}

export interface SocialLinksConfig {
  instagramUrl?: string;
  tiktokUrl?: string;
  facebookUrl?: string;
  supportEmail?: string;
  copyrightNotice?: string;
}

export interface WhatsAppFloatingConfig {
  phoneNumber?: string;
  tooltipText?: string;
  prefilledMessage?: string;
}

export interface HomeSectionsConfig {
  latestDropsKicker?: string;
  latestDropsTitle?: string;
  youngFreeKicker?: string;
  youngFreeTitle?: string;
  weirdOversizeKicker?: string;
  weirdOversizeTitle?: string;
  damaOversizeKicker?: string;
  damaOversizeTitle?: string;
}

export type HomeSectionId =
  | 'hero'
  | 'categories'
  | 'latest-drops'
  | 'young-free'
  | 'weird-oversize'
  | 'dama-oversize'
  | 'flagship'
  | 'manifesto'
  | 'seo';

export interface HomeBlockItem {
  id: HomeSectionId;
  label: string;
  badge?: string;
  description?: string;
  enabled: boolean;
  order: number;
}

export interface SiteContentConfig {
  heroSlides: HeroSlide[];
  announcements?: AnnouncementContent;
  flagship?: FlagshipContent;
  categories?: CategoryCardContent[];
  manifesto?: BrandManifestoContent;
  shipping?: ShippingRatesConfig;
  social?: SocialLinksConfig;
  whatsapp?: WhatsAppFloatingConfig;
  sections?: HomeSectionsConfig;
  homeBlocks?: HomeBlockItem[];
  featuredSkus?: string[];
  lastUpdated?: string;
}
