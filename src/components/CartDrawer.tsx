import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Minus,
  Trash2,
  Truck,
  RotateCcw,
  ShieldCheck,
  ArrowRight,
  Lock,
  Clock,
  Sparkles,
} from 'lucide-react';
import { CartItem, Product, ProductSize } from '../types';
import { formatCOP } from '../data/products';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQty: (productId: string, size: string, delta: number, color?: string) => void;
  onRemoveItem: (productId: string, size: string, color?: string) => void;
  onProceedToCheckout?: () => void;
  onAddToCart?: (
    product: Product,
    size: ProductSize,
    qty?: number,
    color?: string,
    variantId?: string,
    sku?: string
  ) => void;
  onOpenCatalog?: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  onUpdateQty,
  onRemoveItem,
  onProceedToCheckout,
  onAddToCart,
  onOpenCatalog,
}) => {
  const [reservationSeconds, setReservationSeconds] = useState<number>(599);

  useEffect(() => {
    if (!isOpen || cart.length === 0) return;
    const interval = setInterval(() => {
      setReservationSeconds((prev) => (prev > 0 ? prev - 1 : 599));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, cart.length]);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const totalItems = cart.reduce((acc, item) => acc + item.qty, 0);
  const subtotal = cart.reduce((acc, item) => acc + item.product.price * item.qty, 0);

  const threshold = 150000;
  const progressPct = Math.min(100, Math.round((subtotal / threshold) * 100));

  const handleFinalizeOrder = () => {
    if (onProceedToCheckout) {
      onProceedToCheckout();
    }
  };

  // Prendas / Accesorios recomendados para Upsell de Alta Conversión
  const crossSellItems: { product: Product; defaultSize: ProductSize }[] = [
    {
      product: {
        id: 'acc-beanie-01',
        name: 'Gorra Beanie Street Heavyweight',
        category: 'latest-drops',
        price: 35000,
        image: 'https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?q=80&w=600&auto=format&fit=crop',
        desc: 'Gorro tejido en rib acrílico térmico con parche bordado URBANNOISE.',
        stock: 8,
        sku: 'ACC-BEANIE-BLK',
      },
      defaultSize: 'M',
    },
    {
      product: {
        id: 'acc-socks-02',
        name: 'Pack 3 Medias Boxy Cotton Crew',
        category: 'latest-drops',
        price: 28000,
        image: 'https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?q=80&w=600&auto=format&fit=crop',
        desc: 'Medias de media caña con tejido reforzado en talón y puntera.',
        stock: 12,
        sku: 'ACC-SOCKS-3PK',
      },
      defaultSize: 'L',
    },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        id="cart-overlay"
        onClick={onClose}
        className={`fixed inset-0 bg-black/60 z-[60] transition-opacity duration-300 backdrop-blur-sm ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Drawer estilo HYPE.COM.CO */}
      <aside
        id="cart-drawer"
        className={`fixed top-0 right-0 bottom-0 w-full max-w-full sm:max-w-md md:max-w-lg bg-white z-[60] shadow-2xl transition-transform duration-300 flex flex-col overflow-hidden ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header estilo Hype */}
        <div className="p-4 sm:p-5 border-b border-[#E5E5E5] flex items-center justify-between bg-white sticky top-0 z-10">
          <div>
            <div className="text-[10px] text-[#888888] uppercase tracking-wider mb-0.5">
              Inicio / Tu carrito
            </div>
            <h3 className="font-extrabold text-sm sm:text-base uppercase tracking-tight text-[#101013]">
              Tu Carrito ({totalItems})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-black hover:text-white transition cursor-pointer rounded"
            aria-label="Cerrar carrito"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Temporizador de Reserva de Prendas (Mecánica de Urgencia) */}
        {cart.length > 0 && (
          <div className="bg-[#101013] text-[#F5F2E4] px-4 py-2 flex items-center justify-between text-[11px] font-mono border-b border-black">
            <div className="flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>PRENDAS RESERVADAS EN TU BOLSA</span>
            </div>
            <span className="font-bold text-amber-300 bg-white/10 px-2 py-0.5 rounded">
              {formatTimer(reservationSeconds)} min
            </span>
          </div>
        )}

        {/* Barra de Progreso de Envío de Cortesía */}
        <div className="bg-[#F5F2E4] px-4 sm:px-5 py-2.5 sm:py-3 border-b border-[#E5E5E5]">
          <p
            id="free-shipping-label"
            className="text-[10px] sm:text-[11px] font-bold text-[#101013] uppercase tracking-wider mb-1.5"
          >
            {subtotal >= threshold
              ? '¡DESPACHO DE CORTESÍA INCLUIDO EN TU COMPRA!'
              : `Agrega ${formatCOP(threshold - subtotal)} más para despacho de cortesía`}
          </p>
          <div className="w-full bg-white h-1.5 rounded-full overflow-hidden border border-black/10">
            <div
              id="free-shipping-progress"
              className="bg-[#101013] h-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Lista de Productos o Estado Vacío */}
        <div id="cart-items-container" className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 sm:space-y-4 overscroll-contain">
          {cart.length === 0 ? (
            <div className="text-center py-16 px-4">
              <p className="font-extrabold text-xl uppercase tracking-tight text-[#101013] mb-1">
                Está un poco <br />
                <span className="italic font-serif lowercase">vacío</span> aquí
              </p>
              <p className="text-xs text-[#666666] mb-6">Tu carrito está vacío actualmente</p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenCatalog) {
                    onOpenCatalog();
                  }
                }}
                className="bg-[#101013] text-[#F5F2E4] px-8 py-3.5 text-xs font-extrabold uppercase tracking-widest hover:bg-[#222226] transition cursor-pointer shadow-md"
              >
                Comenzar a Comprar
              </button>
            </div>
          ) : (
            <>
              {cart.map((item) => (
                <div
                  key={`${item.product.id}-${item.size}-${item.color || ''}`}
                  className="flex space-x-3.5 pb-4 border-b border-[#EBEBEB] text-left"
                >
                  <div className="w-20 h-24 bg-[#F2F2F2] flex-none overflow-hidden relative border border-gray-100">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-extrabold text-xs uppercase tracking-tight text-[#101013] line-clamp-2">
                        {item.product.name}
                      </h4>
                      <p className="text-[11px] text-[#666666] mt-1 font-medium">
                        Talla: <span className="font-bold text-[#101013]">{item.size}</span>
                        {(item.color || item.product.color) && ` • Color: ${item.color || item.product.color}`}
                      </p>
                      <p className="font-extrabold text-xs text-[#101013] mt-1 font-mono">
                        {formatCOP(item.product.price)}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center border border-[#101013] bg-white">
                        <button
                          onClick={() => onUpdateQty(item.product.id, item.size, -1, item.color)}
                          className="p-1 sm:p-1.5 hover:bg-gray-100 transition cursor-pointer"
                          aria-label="Disminuir"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold px-3">{item.qty}</span>
                        <button
                          onClick={() => onUpdateQty(item.product.id, item.size, 1, item.color)}
                          className="p-1 sm:p-1.5 hover:bg-gray-100 transition cursor-pointer"
                          aria-label="Aumentar"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => onRemoveItem(item.product.id, item.size, item.color)}
                        className="text-[11px] text-[#888888] hover:text-red-600 font-bold uppercase hover:underline flex items-center space-x-1 cursor-pointer transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Eliminar</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* UPSELL DE ALTA INTENCIÓN DE COMPRA (1-CLICK CROSS-SELL) */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-[#101013] flex items-center space-x-1">
                    <Sparkles className="w-3 h-3 text-[#D9C4AB]" />
                    <span>Completa tu look streetwear</span>
                  </span>
                  <span className="text-[9.5px] text-stone-500 font-medium">1-Click Add</span>
                </div>

                <div className="space-y-2">
                  {crossSellItems.map((xs) => (
                    <div
                      key={xs.product.id}
                      className="p-2.5 bg-stone-50 border border-stone-200 rounded flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                        <img
                          src={xs.product.image}
                          alt={xs.product.name}
                          className="w-10 h-12 object-cover rounded bg-white flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-[#101013] text-[11px] truncate">
                            {xs.product.name}
                          </p>
                          <p className="text-[10px] font-mono text-stone-600">
                            {formatCOP(xs.product.price)}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onAddToCart && onAddToCart(xs.product, xs.defaultSize, 1)}
                        className="px-2.5 py-1 bg-[#101013] text-[#F5F2E4] hover:bg-black text-[10px] font-extrabold uppercase tracking-wider rounded transition cursor-pointer flex-shrink-0"
                      >
                        + Agregar
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Sellos de Confianza de HYPE.COM.CO en el Carrito */}
          <div className="pt-5 mt-3 border-t border-[#EBEBEB] grid grid-cols-3 gap-1.5 sm:gap-2 text-center">
            <div className="p-2 sm:p-3 bg-[#FBFBFB] border border-gray-100 flex flex-col items-center justify-center">
              <Truck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#101013] mb-1" />
              <span className="text-[8px] sm:text-[9px] font-extrabold uppercase tracking-tight text-[#101013] leading-tight">
                ENVÍOS A TODA COLOMBIA
              </span>
            </div>
            <div className="p-2 sm:p-3 bg-[#FBFBFB] border border-gray-100 flex flex-col items-center justify-center">
              <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#101013] mb-1" />
              <span className="text-[8px] sm:text-[9px] font-extrabold uppercase tracking-tight text-[#101013] leading-tight">
                30 DÍAS PARA CAMBIOS
              </span>
            </div>
            <div className="p-2 sm:p-3 bg-[#FBFBFB] border border-gray-100 flex flex-col items-center justify-center">
              <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#101013] mb-1" />
              <span className="text-[8px] sm:text-[9px] font-extrabold uppercase tracking-tight text-[#101013] leading-tight">
                PAGOS 100% SEGUROS
              </span>
            </div>
          </div>
        </div>

        {/* Footer de Carrito con Total y Checkout */}
        {cart.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-[#E5E5E5] bg-white space-y-2.5 sm:space-y-3 sticky bottom-0 z-10 shadow-lg">
            <div className="flex items-center justify-between text-sm sm:text-base font-extrabold text-[#101013]">
              <span>SUBTOTAL:</span>
              <span id="cart-subtotal-price" className="text-base sm:text-lg font-mono">
                {formatCOP(subtotal)}
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-[#777777] text-left">
              Impuestos incluidos y gastos de envío calculados en la pantalla de pago.
            </p>

            <button
              id="cart-finalize-order-btn"
              onClick={handleFinalizeOrder}
              className="w-full bg-[#101013] text-[#F5F2E4] font-extrabold text-[11px] sm:text-xs uppercase tracking-[0.1em] sm:tracking-[0.2em] py-3.5 sm:py-4 hover:bg-black transition cursor-pointer flex items-center justify-center space-x-2 shadow-md"
            >
              <Lock className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span className="truncate">FINALIZAR PEDIDO (PAGO DIRECTO)</span>
              <ArrowRight className="w-3.5 h-3.5 flex-shrink-0" />
            </button>

            <div className="flex items-center justify-center gap-1.5 pt-1 pb-0.5 text-[9.5px] sm:text-[10px] text-[#555555] font-semibold tracking-wide flex-wrap">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Pasarela de pagos 100% segura</span>
              <span className="font-black tracking-widest text-[#101013] px-1.5 py-0.5 bg-[#EAEAEA] rounded text-[9.5px]">
                PSE & TARJETAS
              </span>
              <span>• Cifrado 256-bit</span>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
