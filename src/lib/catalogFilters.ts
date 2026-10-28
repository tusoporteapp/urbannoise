import { Product, ProductSize } from '../types';

export const COLOR_HEX_MAP: Record<string, string> = {
  negro: '#111111',
  marfil: '#F4EBD9',
  blanco: '#F8F9FA',
  gris: '#8E8E93',
  cafe: '#6E473B',
  azul: '#1D4ED8',
  verde: '#15803D',
  cobre: '#9A5A35',
  camel: '#C2A67E',
  mora: '#9B7B9E',
  rojo: '#DC2626',
  rosado: '#F472B6',
  lila: '#C084FC',
  mostaza: '#D97706',
  amarillo: '#FACC15',
  naranja: '#EA580C',
  vino: '#881337',
  militar: '#4D533C',
  beige: '#E5D9C5',
  crudo: '#ECE4D4',
};

export function getColorHex(colorName: string): string {
  if (!colorName) return '#111111';
  const clean = colorName.toLowerCase().trim();
  for (const [key, hex] of Object.entries(COLOR_HEX_MAP)) {
    if (clean.includes(key)) return hex;
  }
  return '#9CA3AF';
}

export const FABRIC_OPTIONS = [
  { id: 'all', label: 'Todas las Telas' },
  { id: 'algodon-pesado', label: 'Algodón Pesado 240g-300g' },
  { id: 'acid-wash', label: 'Acid Wash (Lavado Ácido)' },
  { id: 'algodon-streetwear', label: 'Algodón Premium Streetwear' },
  { id: 'esqueleto-rib', label: 'Esqueleto / Sisa' },
  { id: 'french-terry', label: 'French Terry / Buzos' },
  { id: 'bermudas-denim', label: 'Bermudas & Pantalones' },
  { id: 'pedreria', label: 'Con Pedrería / Especial' },
];

export const FILTER_COLORS = [
  { id: 'all', label: 'Todos los Colores' },
  { id: 'negro', label: 'Negro' },
  { id: 'marfil', label: 'Marfil' },
  { id: 'gris', label: 'Gris' },
  { id: 'cobre', label: 'Cobre' },
  { id: 'azul', label: 'Azul' },
  { id: 'verde', label: 'Verde / Oliva' },
  { id: 'cafe', label: 'Café / Choco' },
  { id: 'camel', label: 'Camel / Beige' },
  { id: 'mora', label: 'Mora en Leche' },
  { id: 'blanco', label: 'Blanco' },
  { id: 'rosado', label: 'Rosado' },
  { id: 'rojo', label: 'Rojo' },
];

const KNOWN_COLORS = [
  'NEGRO', 'MARFIL', 'GRIS', 'COBRE', 'AZUL', 'VERDE', 'CAFE', 'CAFÉ',
  'CAMEL', 'CAMELL', 'BEIGE', 'MORA', 'BLANCO', 'ROSADO', 'ROJO', 'LILA',
  'MOSTAZA', 'AMARILLO', 'NARANJA', 'VINO', 'MILITAR', 'CRUDO', 'VARIAS', '1.0', '1.1'
];

/**
 * Normaliza nombres de tallas para manejar variaciones y errores tipográficos de Loyverse POS
 * (ej. 'SM/' -> 'S/M', 'UND' -> 'U')
 */
export function normalizeSizeName(raw: string): string {
  if (!raw) return '';
  const s = raw.trim().toUpperCase();
  if (s === 'SM/' || s === 'S/M' || s === 'SM' || s === 'S-M') return 'S/M';
  if (s === 'L/XL' || s === 'LXL' || s === 'L-XL') return 'L/XL';
  if (s === 'UND' || s === 'UNICA' || s === 'ÚNICA' || s === 'U') return 'U';
  return s;
}

/**
 * Obtiene la lista auténtica de tallas para una prenda según sus variantes reales en Loyverse POS.
 * Detecta prendas con tallas combinadas (S/M, L/XL como en Conjuntos y Buzos),
 * prendas estándar (S, M, L, XL), prendas con XXL y accesorios Talla Única.
 */
export function getProductSizes(product: Product): ProductSize[] {
  if (!product) return ['S', 'M', 'L', 'XL'];

  const rawList = Array.from(
    new Set(
      (product.variants || [])
        .map((v: any) => (v.size || v.option1_value || '').trim())
        .filter(Boolean)
    )
  ) as string[];
  const normList = Array.from(new Set(rawList.map(normalizeSizeName).filter(Boolean)));

  // 1. Si las variantes de Loyverse tienen tallas combinadas (S/M y/o L/XL)
  const hasCombo = normList.some((s) => s === 'S/M' || s === 'L/XL');
  if (hasCombo) {
    const res: ProductSize[] = [];
    if (normList.includes('S/M')) res.push('S/M');
    if (normList.includes('L/XL')) res.push('L/XL');
    // Si alguna prenda viene solo en una de las dos o en ambas
    if (res.length > 0) {
      // Si tiene una pero se confecciona en ambas siluetas combo
      if (res.includes('S/M') && !res.includes('L/XL')) res.push('L/XL');
      if (res.includes('L/XL') && !res.includes('S/M')) res.unshift('S/M');
      return res;
    }
    return ['S/M', 'L/XL'];
  }

  // 2. Si son tallas numéricas infantiles (4, 6, 8, 10, 12)
  const numericSizes = normList.filter((s) => /^\d+$/.test(s));
  if (numericSizes.length > 0 && numericSizes.length === normList.length) {
    return numericSizes.sort((a, b) => Number(a) - Number(b)) as ProductSize[];
  }

  // 3. Si todas las variantes son canales de venta o nombres de color (prenda sin tallaje múltiple)
  const isAllColorsOrChannels =
    normList.length > 0 &&
    normList.every(
      (s) =>
        KNOWN_COLORS.some((c) => s.includes(c)) ||
        ['DIGITAL', 'X MAYOR', 'PAGINA WEB', 'UND', 'U'].includes(s)
    );
  if (isAllColorsOrChannels && !normList.some((s) => ['S', 'M', 'L', 'XL'].includes(s))) {
    return ['U'];
  }

  // 4. Si explícitamente solo viene en Talla Única
  const av = (product.availableSizes || []).map((s: string) => normalizeSizeName(s));
  if (av.includes('U') && !av.includes('S') && !av.includes('M') && !av.includes('L')) {
    return ['U'];
  }

  // 5. Escala estándar de Streetwear (S, M, L, XL y opcionalmente XXL)
  const std: ProductSize[] = ['S', 'M', 'L', 'XL'];
  if (normList.includes('XXL')) {
    std.push('XXL');
  }
  return std;
}

export function getCardSizes(product: Product): ProductSize[] {
  return getProductSizes(product);
}

/**
 * Calcula el stock total para una talla específica de una prenda,
 * respetando la normalización de tallas combinadas (ej. 'S/M' o 'L/XL').
 */
export function getStockForSize(product: Product, size: string): number {
  if (!product.variants || product.variants.length === 0) {
    return product.stock ?? 0;
  }
  const targetNorm = normalizeSizeName(size);
  const matching = product.variants.filter((v: any) => {
    const vSize = normalizeSizeName(v.size || v.option1_value || '');
    return vSize === targetNorm;
  });
  if (matching.length === 0) return 0;
  return matching.reduce((sum, v: any) => sum + (v.in_stock ?? 0), 0);
}

/**
 * Coincidencia flexible e inteligente de tallas para el sistema de filtrado.
 * Permite que al filtrar por 'S' o 'M', también se encuentren las prendas con talla combo 'S/M'.
 * Y al filtrar por 'L' o 'XL', también se encuentren las prendas con talla combo 'L/XL'.
 */
export function matchSize(filterSize: string, variantOrProductSize: string): boolean {
  if (!filterSize || filterSize === 'all') return true;
  const f = normalizeSizeName(filterSize);
  const v = normalizeSizeName(variantOrProductSize);
  if (f === v) return true;

  // Lógica de tallas combinadas:
  if (v === 'S/M' && (f === 'S' || f === 'M' || f === 'S/M')) return true;
  if (v === 'L/XL' && (f === 'L' || f === 'XL' || f === 'L/XL')) return true;
  if (f === 'S/M' && (v === 'S' || v === 'M' || v === 'S/M')) return true;
  if (f === 'L/XL' && (v === 'L' || v === 'XL' || v === 'L/XL')) return true;

  return false;
}

export function getProductFabricKey(p: Product): string {
  const text = `${p.categoryLabel || ''} ${p.name} ${p.desc || ''}`.toLowerCase();
  if (text.includes('acid') || text.includes('mineral')) return 'acid-wash';
  if (text.includes('esqueleto') || text.includes('tank')) return 'esqueleto-rib';
  if (text.includes('buzo') || text.includes('sudadera') || text.includes('capotero') || text.includes('hoodie')) return 'french-terry';
  if (text.includes('bermuda') || text.includes('pantalon') || text.includes('pantalón') || text.includes('conj.')) return 'bermudas-denim';
  if (text.includes('pedreria') || text.includes('pedrería') || text.includes('brillos')) return 'pedreria';
  if (text.includes('algodon') || text.includes('algodón')) return 'algodon-pesado';
  return 'algodon-streetwear';
}

export function checkColorMatch(targetColor: string, colorStr?: string): boolean {
  if (!colorStr) return false;
  const c = colorStr.toLowerCase();
  const target = targetColor.toLowerCase().trim();
  if (c.includes(target)) return true;
  if (target === 'camel' && (c.includes('beige') || c.includes('crema') || c.includes('camell') || c.includes('miel'))) return true;
  if (target === 'cafe' && (c.includes('cafe') || c.includes('café') || c.includes('choco'))) return true;
  if (target === 'mora' && (c.includes('mora') || c.includes('lila') || c.includes('morad'))) return true;
  if (target === 'verde' && (c.includes('verd') || c.includes('oliva'))) return true;
  if (target === 'negro' && (c.includes('neg') || c.includes('nero'))) return true;
  if (target === 'marfil' && (c.includes('marf') || c.includes('mrfil'))) return true;
  return false;
}

/**
 * Determina el precio oficial de PAGINA WEB para cualquier prenda del catálogo,
 * respetando exactamente las tarifas registradas en Loyverse POS para venta web.
 */
export function resolvePaginaWebPrice(p: {
  name?: string;
  categoryLabel?: string;
  category_name?: string;
  desc?: string;
  variants?: any[];
  price?: number;
}): number {
  if (!p) return 55000;
  if (p.price === 1500 || (p as any).id === 'test-bold-live-001') return 1500;
  const name = (p.name || '').toUpperCase();
  const cat = (p.categoryLabel || p.category_name || '').toUpperCase();
  const text = `${name} ${cat} ${p.desc || ''}`.toUpperCase();

  // 1. Si la prenda tiene una variante explícita con precio 'PAGINA WEB' en Loyverse
  for (const v of p.variants || []) {
    const opt = (v.option1_value || v.size || '').toUpperCase();
    if (opt.includes('PAGINA WEB') || opt.includes('WEB')) {
      let pr = v.default_price || v.price;
      if (pr === 70) pr = 70000;
      if (pr && pr > 0) return pr;
    }
  }

  // 2. Mapeo oficial de tarifas PAGINA WEB de Loyverse POS:
  // Buzos pesados Acid Wash (400g): PAGINA WEB $159.990
  if (cat.includes('BUZO ACIDWASH') || (text.includes('BUZO') && text.includes('ACID'))) return 159990;

  // Buzos Capotero Gold: PAGINA WEB $149.990
  if (cat.includes('BUZO GOLD') || text.includes('GOLDCREM') || (text.includes('BUZO') && text.includes('GOLD'))) return 149990;

  // Buzos Capoteros regulares (250g): PAGINA WEB $79.990
  if (cat.includes('BUZO') || text.includes('BUZO') || text.includes('CAPOTERO') || text.includes('HOODIE') || cat.includes('BUZO NEW/B')) return 79990;

  // Conjuntos (Cargo, Sudadera, Chup, Burda, Galleta, Pantalón): PAGINA WEB $99.990
  if (cat.includes('CONJUNTO') || text.includes('CONJ.') || text.includes('CONJUNTO') || text.includes('SUDADERA')) return 99990;

  // Pantalones (HM, Cargo, Ofi-Spo): PAGINA WEB $89.990
  if (cat.includes('PANTALON') || text.includes('PANTALON') || text.includes('PANTALÓN') || text.includes('PANTALO')) return 89990;

  // Oversize Premium y Pedrería: PAGINA WEB $84.990
  if (cat.includes('PEDRERIA') || text.includes('PEDRERIA') || text.includes('PIEDRERIA') || cat.includes('OVERSIZE PREMIUM') || text.includes('OVERSIZE PREMIUM')) return 84990;

  // Oversize Acid Wash (Lavado Ácido): PAGINA WEB $70.000
  if (cat.includes('OVERSIZE ACIDWASH') || (text.includes('OVERSIZE') && text.includes('ACID')) || text.includes('ACIDWASH') || text.includes('MINERAL WASH')) return 70000;

  // Boxy Fit: PAGINA WEB $63.000
  if (cat.includes('BOXI FIT') || cat.includes('BOXY FIT') || text.includes('BOXY FIT') || text.includes('BOXY')) return 63000;

  // Oversize Burda / Relajado: PAGINA WEB $58.990
  if (cat.includes('OVERSIZE BURDA') || text.includes('BURDA')) return 58990;

  // Oversize Algodón Pesado / Peinado: PAGINA WEB $54.990
  if (cat.includes('OVERSIZE ALGODON') || (text.includes('OVERSIZE') && text.includes('ALGODON')) || (text.includes('OVERSIZE') && text.includes('ALGODÓN'))) return 54990;

  // Bermudas Streetwear: PAGINA WEB $45.000
  if (cat.includes('BERMUDA') || text.includes('BERMUDA') || text.includes('PANTALONETA')) return 45000;

  // Esqueletos / Musculosas Sisa: $50.000
  if (cat.includes('ESQUELETO') || text.includes('ESQUELETO') || text.includes('TANK')) return 50000;

  // Camisetas Básicas / T-Shirts / Dama: PAGINA WEB $50.000
  if (cat.includes('T-SHIRT') || text.includes('T-SHIRT') || text.includes('CAMISETA') || cat.includes('DAMA')) return 50000;

  // 3. Si tiene precio en variante de Loyverse
  const v0 = p.variants?.[0];
  const livePrice = v0?.stores?.find((s: any) => s.store_id === 'fee704a4-ff11-43ae-903e-d2f9cf0a9a25')?.price || v0?.default_price || v0?.price;
  if (livePrice && livePrice > 0) return livePrice;

  return p.price || 55000;
}
