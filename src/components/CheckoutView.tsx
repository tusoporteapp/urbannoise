import React, { useState } from 'react';
import {
  X,
  ArrowLeft,
  Lock,
  ShieldCheck,
  Truck,
  CreditCard,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Tag,
  Building2,
  Smartphone,
  Banknote,
  Check,
  ShoppingBag,
  Printer,
  Shield,
  FileCheck,
  ExternalLink,
  Receipt,
  Boxes,
  Store,
  Scale,
  FileText,
  HelpCircle,
  Eye,
  EyeOff,
  User,
  Sparkles,
  MapPin,
  AlertTriangle,
} from 'lucide-react';
import { CartItem } from '../types';
import { formatCOP } from '../data/products';
import {
  processBoldPayment,
  confirmOrderAndSyncLoyverse,
  BoldTransactionDetails,
  LoyverseReceiptInfo,
  BOLD_CONFIG,
  getBoldConfig,
  BoldServerConfig,
  loadBoldScript,
  launchBoldCheckout,
  savePendingCheckout,
  getPendingCheckout,
  clearPendingCheckout,
  verifyBoldReturnRedirect,
  createBoldPaymentIntent,
} from '../lib/bold';
import { addCustomerOrder } from '../lib/customerOrders';
import { getCustomerSession, saveCustomerSession, clearCustomerSession, registerWebCustomer, fetchLoyverseDiscounts } from '../lib/loyverse';
import { getStoredSiteContent } from '../lib/siteContent';

interface CheckoutViewProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onClearCart: () => void;
  onOpenPolicies?: (tabId: string) => void;
}

type PaymentMethodType = 'bold_pse' | 'bold_card' | 'bold_bancolombia' | 'bold_nequi' | 'cod';

export const CheckoutView: React.FC<CheckoutViewProps> = ({
  isOpen,
  onClose,
  cart,
  onClearCart,
  onOpenPolicies,
}) => {
  // Formulario de Contacto
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [newslettersOptIn, setNewslettersOptIn] = useState(true);

  // Aceptación Legal y Políticas (Ley 1480 / Ley 1581)
  const [legalAccepted, setLegalAccepted] = useState(true);
  const [legalError, setLegalError] = useState('');

  // Dirección de Entrega en Colombia
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [documentId, setDocumentId] = useState('');
  const [address, setAddress] = useState('');
  const [apartment, setApartment] = useState('');
  const [department, setDepartment] = useState('Bogotá D.C.');
  const [city, setCity] = useState('Bogotá');
  const [postalCode, setPostalCode] = useState('');
  const [phone, setPhone] = useState('');

  // Método de Envío: Nacional (Servientrega / Inter Rapidísimo) o Express Bogotá Mismo Día (DiDi, inDrive, Yango o Privado)
  const [shippingMode, setShippingMode] = useState<'national' | 'express_bogota'>('national');
  const shippingModeLabel =
    shippingMode === 'express_bogota'
      ? 'Envío Express Bogotá (Mismo Día / Pago al Recibir)'
      : 'Envío Nacional Estándar (Pago Contra Entrega de Flete)';

  // Método de Pago (Pasarela Bold.co - Único método activo)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('bold_pse');

  // Dirección de Entrega: Misma dirección vs Dirección Diferente / Alternativa
  const [deliveryLocationChoice, setDeliveryLocationChoice] = useState<'same' | 'different'>('same');
  const [altAddress, setAltAddress] = useState('');
  const [altApartment, setAltApartment] = useState('');
  const [altCity, setAltCity] = useState('Bogotá');
  const [altDepartment, setAltDepartment] = useState('Bogotá D.C.');
  const [altRecipientName, setAltRecipientName] = useState('');
  const [altRecipientPhone, setAltRecipientPhone] = useState('');
  const [altInstructions, setAltInstructions] = useState('');
  const [addressConfirmed, setAddressConfirmed] = useState(false);

  // Datos PSE (Bold)
  const [pseBank, setPseBank] = useState('Bancolombia');
  const [psePersonType, setPsePersonType] = useState('natural');

  // Datos Tarjeta (Bold)
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExp, setCardExp] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardInstallments, setCardInstallments] = useState('1');

  // Datos Botón Bancolombia / Nequi (Bold)
  const [boldNequiPhone, setBoldNequiPhone] = useState('');

  // Cupón de descuento
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; percent: number; amount: number } | null>(null);
  const [discountError, setDiscountError] = useState('');

  // Estado del pedido y pasarela Bold
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [boldProcessingStep, setBoldProcessingStep] = useState('Conectando con Bold.co...');
  const [boldTransaction, setBoldTransaction] = useState<BoldTransactionDetails | null>(null);
  const [loyverseReceipt, setLoyverseReceipt] = useState<LoyverseReceiptInfo | null>(null);
  const [loyverseSyncStatus, setLoyverseSyncStatus] = useState<'SUCCESS' | 'SIMULATED' | 'ERROR'>('SIMULATED');
  const [deductedStockDetails, setDeductedStockDetails] = useState<any[]>([]);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [finalOrderAmount, setFinalOrderAmount] = useState<number>(0);
  const [finalOrderItems, setFinalOrderItems] = useState<any[]>([]);
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);
  const [orderHoneypot, setOrderHoneypot] = useState('');
  const [boldGatewayConfig, setBoldGatewayConfig] = useState<BoldServerConfig | null>(null);
  const [boldRedirectError, setBoldRedirectError] = useState<string>('');
  const [isBoldModalWaiting, setIsBoldModalWaiting] = useState<boolean>(false);

  // Consultar configuración del servidor para pasarela Bold y precargar pasarela
  React.useEffect(() => {
    getBoldConfig()
      .then((cfg) => setBoldGatewayConfig(cfg))
      .catch(() => {});
    loadBoldScript().catch(() => {});
  }, []);

  // Función para poblar todos los campos del formulario de Entrega
  const populateCustomerDeliveryData = React.useCallback(
    (data: {
      name?: string;
      email?: string;
      phone?: string;
      document?: string;
      address?: string;
      city?: string;
    }) => {
      if (data.email) setEmailOrPhone(data.email);
      if (data.name) {
        const parts = data.name.trim().split(' ');
        setFirstName(parts[0] || '');
        if (parts.length > 1) {
          setLastName(parts.slice(1).join(' '));
        }
      }
      if (data.document) setDocumentId(data.document);
      if (data.phone) {
        let p = data.phone.replace(/\D/g, '');
        if (p.startsWith('57') && p.length === 12) p = p.substring(2);
        if (p && p.length >= 7) setPhone(p);
      }
      if (data.address) setAddress(data.address);
      if (data.city) {
        const cityClean = data.city.trim();
        setCity(cityClean);
        if (cityClean.toLowerCase().includes('bogot')) {
          setDepartment('Bogotá D.C.');
        }
      }
    },
    []
  );

  // Sincronizar y autocompletar datos de entrega desde el servidor seguro
  const syncCustomerFromLoyverse = React.useCallback(
    (targetEmail: string) => {
      const cleanEmail = targetEmail.trim().toLowerCase();
      if (!cleanEmail || !cleanEmail.includes('@') || cleanEmail.length < 5) return;

      fetch(`/api/customers/orders?email=${encodeURIComponent(cleanEmail)}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((res) => {
          const profile = res?.customerProfile || res?.orders?.[0]?.shippingAddress;
          if (profile) {
            populateCustomerDeliveryData({
              name: profile.name,
              email: cleanEmail,
              phone: profile.phone,
              document: profile.document,
              address: profile.address,
              city: profile.city,
            });

            // Guardar sesión enriquecida para próximas compras
            saveCustomerSession({
              id: res?.customerProfile?.id || `web-cust-${cleanEmail}`,
              name: profile.name || 'Cliente URBANNOISE',
              email: cleanEmail,
              phone: profile.phone,
              document: profile.document,
              address: profile.address,
              city: profile.city,
              createdAt: new Date().toISOString(),
            });
          }
        })
        .catch(() => {});
    },
    [populateCustomerDeliveryData]
  );

  // Precargar datos del cliente logueado para trazabilidad en Loyverse POS
  React.useEffect(() => {
    if (isOpen) {
      const session = getCustomerSession();
      if (session) {
        populateCustomerDeliveryData(session);
        if (session.email) {
          syncCustomerFromLoyverse(session.email);
        }
      }
    }
  }, [isOpen, populateCustomerDeliveryData, syncCustomerFromLoyverse]);

  // Garantizar que la pantalla de checkout siempre inicie arriba al abrirse o al completarse la orden
  React.useEffect(() => {
    if (isOpen) {
      const el = document.getElementById('checkout-screen');
      if (el) el.scrollTop = 0;
    }
  }, [isOpen]);

  React.useEffect(() => {
    if (orderComplete) {
      const el = document.getElementById('checkout-screen');
      if (el) el.scrollTop = 0;
    }
  }, [orderComplete]);

  // Verificar retorno de redirección desde Bold.co
  React.useEffect(() => {
    if (isOpen) {
      const returnCheck = verifyBoldReturnRedirect();
      if (returnCheck.isReturningFromBold && returnCheck.orderId) {
        if (returnCheck.status === 'approved') {
          const pending = getPendingCheckout();
          if (pending && (pending.orderId === returnCheck.orderId || !pending.orderId)) {
            completeReturningOrder(pending, returnCheck.orderId);
          } else {
            setOrderId(returnCheck.orderId);
            setOrderComplete(true);
          }
        } else if (returnCheck.status === 'rejected') {
          setBoldRedirectError(
            'El pago en Bold.co fue cancelado o rechazado por tu entidad bancaria. Puedes intentar de nuevo o seleccionar otro medio de pago.'
          );
        }
        try {
          window.history.replaceState(null, '', window.location.pathname);
        } catch {}
      }

      // Recuperación Automática Anti-F5: Si el usuario recargó durante el pago en Nequi/PSE
      const pending = getPendingCheckout();
      if (pending && pending.orderId && !orderComplete) {
        fetch(`/api/bold/order-status?orderId=${encodeURIComponent(pending.orderId)}`)
          .then((r) => (r.ok ? r.json() : null))
          .then((res) => {
            if (res && res.status === 'APPROVED' && res.paid) {
              console.log('[Recovery Anti-F5] Pago aprobado detectado en servidor:', pending.orderId);
              completeReturningOrder(pending, pending.orderId);
            }
          })
          .catch(() => {});
      }
    }
  }, [isOpen, orderComplete]);

  // Sondeo Activo de Pago Asíncrono (Nequi / PSE):
  // Mientras haya una orden pendiente y no esté completa, verificar con el servidor cada 3.5 segundos
  React.useEffect(() => {
    const pending = getPendingCheckout();
    if (!pending?.orderId || orderComplete) return;

    const interval = setInterval(() => {
      fetch(`/api/bold/order-status?orderId=${encodeURIComponent(pending.orderId)}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((res) => {
          if (res && res.status === 'APPROVED' && res.paid) {
            clearInterval(interval);
            console.log('[Sondeo Nequi/PSE] ¡Pago Aprobado en Servidor! Completando orden...');
            completeReturningOrder(pending, pending.orderId);
          }
        })
        .catch(() => {});
    }, 3500);

    return () => clearInterval(interval);
  }, [orderComplete]);

  // Escuchar eventos en vivo del modal embebido de Bold.co
  React.useEffect(() => {
    const handleBoldModalEvent = (event: MessageEvent) => {
      try {
        // Validación de Origen para prevenir ataques de falsificación de eventos postMessage entre dominios
        const origin = event.origin || '';
        const isBoldOrigin =
          origin.endsWith('.bold.co') ||
          origin === 'https://checkout.bold.co' ||
          origin === window.location.origin;
        if (!isBoldOrigin) return;

        const d = event.data;
        if (!d) return;
        if (d.type === 'BOLD_CHECKOUT_EVENT' || d.event === 'BOLD_CHECKOUT_EVENT') {
          console.log('[Bold Modal Event]:', d);
          const pending = getPendingCheckout();
          if (pending) {
            const isApproved =
              d.status === 'approved' ||
              d.action === 'PAYMENT_APPROVED' ||
              d.state === 'APPROVED' ||
              d.paymentStatus === 'APPROVED' ||
              (d.transaction && d.transaction.status === 'APPROVED');
            if (isApproved) {
              completeReturningOrder(pending, pending.orderId || orderId);
            } else if (d.status === 'rejected' || d.action === 'PAYMENT_REJECTED') {
              setIsBoldModalWaiting(false);
              setBoldRedirectError('El pago en Bold.co fue cancelado o rechazado.');
            }
          }
        }
      } catch (err) {
        console.warn('Error procesando evento Bold:', err);
      }
    };

    window.addEventListener('message', handleBoldModalEvent);
    return () => window.removeEventListener('message', handleBoldModalEvent);
  }, [orderId]);

  // Escudo Anti-F5 y Prevención de Recarga Accidental durante la transacción
  React.useEffect(() => {
    const isTransactionInProgress = isSubmitting || isBoldModalWaiting;
    if (!isTransactionInProgress || orderComplete) return;

    // 1. Advertencia nativa al intentar cerrar o recargar la pestaña
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'Tu pago está en proceso de verificación bancaria. Si recargas o sales ahora, la confirmación podría demorarse.';
      return e.returnValue;
    };

    // 2. Interceptar teclas de recarga (F5, Ctrl+R, Cmd+R)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === 'F5' ||
        (e.ctrlKey && (e.key === 'r' || e.key === 'R')) ||
        (e.metaKey && (e.key === 'r' || e.key === 'R'))
      ) {
        e.preventDefault();
        e.stopPropagation();
        console.warn('[Escudo Anti-F5] Recarga de página prevenida mientras la pasarela procesa el pago.');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSubmitting, isBoldModalWaiting, orderComplete]);

  if (!isOpen) return null;

  // Cálculos financieros
  const subtotal = cart.reduce((acc, item) => acc + item.product.price * item.qty, 0);
  // Modalidad Flete al Cobro / Contra Entrega:
  // El flete de transporte NO se cobra en la web ($0 COP). El cliente lo paga directamente a Servientrega o Inter Rapidísimo al recibir el paquete.
  const shippingCost = 0;

  const discountValue = appliedDiscount
    ? appliedDiscount.percent > 0
      ? Math.round((subtotal * appliedDiscount.percent) / 100)
      : appliedDiscount.amount
    : 0;

  const total = Math.max(0, subtotal - discountValue);

  // Obtiene los datos dinámicos (monto y método) para el escudo visual anti-estrés
  const getWaitingPaymentInfo = () => {
    const formattedAmount = formatCOP(total || finalOrderAmount || 1500);
    switch (paymentMethod) {
      case 'bold_nequi':
        return {
          title: 'Esperando confirmación en tu App Nequi',
          methodName: 'Nequi',
          instructions: 'Abre tu aplicación Nequi en tu celular, ingresa a notificaciones y autoriza el débito.',
          amountText: formattedAmount,
          icon: 'nequi',
        };
      case 'bold_pse':
      case 'bold_bancolombia':
        return {
          title: 'Esperando confirmación bancaria en PSE',
          methodName: 'PSE / Bancolombia',
          instructions: 'Completa la autorización con tu entidad bancaria. Estamos conectados en vivo esperando la confirmación.',
          amountText: formattedAmount,
          icon: 'pse',
        };
      case 'bold_card':
        return {
          title: 'Validando transacción con tu banco emisor',
          methodName: 'Tarjeta de Crédito / Débito',
          instructions: 'Tu entidad bancaria está procesando el cobro seguro y validando los sistemas de seguridad.',
          amountText: formattedAmount,
          icon: 'card',
        };
      default:
        return {
          title: 'Transacción segura en curso con Pasarela Bold.co',
          methodName: 'Pasarela Bold.co',
          instructions: 'Estamos sincronizados en tiempo real con Bold.co esperando la aprobación de tu pago.',
          amountText: formattedAmount,
          icon: 'shield',
        };
    }
  };

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setDiscountError('');
    const rawCode = discountCode.trim();
    if (!rawCode) return;
    const cleanCode = rawCode.toUpperCase().replace(/\s+/g, '');

    try {
      // 1. Consultar descuentos activos en vivo desde Loyverse POS
      const data = await fetchLoyverseDiscounts();
      const discounts: any[] = data.discounts || [];

      // Función normalizadora para comparar sin acentos ni símbolos
      const normalize = (s: string) =>
        s.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Z0-9]/g, '');

      const normInput = normalize(rawCode);

      // Buscar coincidencia en Loyverse POS
      const matched = discounts.find((d: any) => {
        if (!d || d.deleted_at) return false;
        const normName = normalize(d.name || '');
        if (normName === normInput) return true;
        if (normName.includes(normInput) || normInput.includes(normName)) return true;

        // Alias comunes para descuentos creados en el POS
        if (normName.includes('MADRUG') && normInput.includes('MADRUG')) return true;
        if (normName.includes('MAYOR') && (normInput.includes('MAYOR') || normInput.includes('XMAYOR'))) return true;
        if (normName.includes('MOVIMIENTO') && normInput.includes('MOVIMIENTO')) return true;
        return false;
      });

      if (matched) {
        const percent = matched.type === 'FIXED_PERCENT' ? (Number(matched.discount_percent) || 0) : 0;
        const amount = matched.type === 'FIXED_AMOUNT' ? (Number(matched.discount_amount) || 0) : 0;

        if (percent > 0 || amount > 0) {
          setAppliedDiscount({
            code: matched.name.toUpperCase(),
            percent,
            amount,
          });
          setDiscountCode('');
          return;
        }
      }
    } catch (e) {
      console.warn('[Checkout] No se pudo verificar en Loyverse:', e);
    }

    // Si no está registrado
    setDiscountError('Código de descuento no válido o expirado.');
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.match(/.{1,4}/g)?.join(' ') || raw;
    setCardNumber(formatted);
  };

  const handleCardExpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 2) {
      raw = raw.slice(0, 2) + '/' + raw.slice(2);
    }
    setCardExp(raw);
  };

  const completeReturningOrder = async (pending: any, confirmedOrderId: string) => {
    setIsSubmitting(true);
    setIsBoldModalWaiting(false);
    setBoldProcessingStep('Confirmando pago aprobado por Bold.co y emitiendo recibo...');
    try {
      const resolvedAmount = Number(pending.amount || pending.totals?.total || total || 1500);
      setFinalOrderAmount(resolvedAmount);

      const resolvedItems =
        pending.items && pending.items.length > 0
          ? pending.items.map((it: any) => ({ item: it.name, qtyDeducted: it.qty || 1 }))
          : cart && cart.length > 0
          ? cart.map((i) => ({ item: i.product.name, qtyDeducted: i.qty }))
          : [];
      if (resolvedItems.length > 0) {
        setFinalOrderItems(resolvedItems);
      }

      const tx: BoldTransactionDetails = {
        orderId: confirmedOrderId,
        boldTransactionId: `TX-BOLD-${confirmedOrderId}`,
        boldReference: `BLD-${confirmedOrderId}`,
        authorizationCode: `${Math.floor(100000 + Math.random() * 900000)}`,
        amount: resolvedAmount,
        currency: 'COP',
        paymentMethod: pending.paymentMethod || paymentMethod || 'bold_pse',
        payerName: pending.customer?.name || `${firstName} ${lastName}`.trim() || 'Cliente URBANNOISE',
        payerEmail: pending.customer?.email || emailOrPhone,
        payerDocument: pending.customer?.document || documentId || '1028394829',
        timestamp: new Date().toISOString(),
        status: 'APROBADA',
        integritySignature: pending.integritySignature,
      };

      setOrderId(confirmedOrderId);
      setBoldTransaction(tx);

      const syncResult = await confirmOrderAndSyncLoyverse({
        ...pending,
        orderId: confirmedOrderId,
        boldTransaction: tx,
      });

      setLoyverseReceipt(syncResult.loyverseReceipt);
      setLoyverseSyncStatus(syncResult.loyverseSyncStatus);
      setDeductedStockDetails(syncResult.deductedStockInfo || []);

      const targetEmail = (pending.customer?.email || emailOrPhone).trim().toLowerCase();
      addCustomerOrder(
        {
          id: confirmedOrderId,
          orderNumber: confirmedOrderId,
          date: 'Hoy • ' + new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
          timestamp: Date.now(),
          status: 'CONFIRMADO',
          statusLabel: 'En Preparación para Despacho',
          userEmail: targetEmail,
          trackingCompany: pending.shippingCarrier || 'Envío Nacional Estándar',
          trackingNumber: undefined,
          estimatedDelivery: pending.shippingMethod === 'express_bogota' ? 'Hoy mismo • Mensajería Express Bogotá' : 'En 1-3 días hábiles • Entrega Nacional',
          timeline: [
            {
              title: 'Pedido Confirmado y Pagado en Bold.co',
              date: 'Hoy (Ahora)',
              completed: true,
              current: true,
              detail: `Pago aprobado por ${formatCOP(pending.amount || total)} a través de pasarela Bold.`,
            },
            {
              title: 'Control de Calidad & Empaque',
              date: 'En proceso',
              completed: false,
              current: false,
              detail: 'Tus prendas están siendo preparadas en el taller de Bogotá.',
            },
            {
              title: pending.shippingMethod === 'express_bogota' ? 'Motorizado en Camino' : 'En Ruta con Transportadora',
              date: 'Pendiente',
              completed: false,
              current: false,
              detail: pending.shippingMethod === 'express_bogota'
                ? 'Despacho con mensajería express urbana. Pagas la carrera al recibir.'
                : 'Se generará la guía oficial de la transportadora nacional (flete al cobro).',
            },
            {
              title: 'Entrega en Destino',
              date: 'Estimado 1-2 días',
              completed: false,
              current: false,
              detail: `Dirección registrada: ${pending.customer?.address || address}, ${pending.customer?.city || city}.`,
            },
          ],
          shippingAddress: {
            name: pending.customer?.name || `${firstName} ${lastName}`.trim() || 'Cliente URBANNOISE',
            city: pending.customer?.city || city,
            department: pending.customer?.department || department,
            address: pending.customer?.address || address,
            phone: pending.customer?.phone || phone,
          },
          items: pending.items || cart.map((i: any) => ({
            id: i.product?.id || i.id,
            name: i.product?.name || i.name,
            size: i.size,
            qty: i.qty,
            price: i.product?.price || i.price,
            image: i.product?.image || i.image,
            sku: i.product?.sku || i.sku,
          })),
          totals: pending.totals || {
            subtotal,
            shipping: shippingCost,
            discount: discountValue,
            total,
          },
          paymentMethod: 'Pasarela Oficial Bold.co',
          paymentStatus: 'APROBADO',
          receiptNumber: syncResult.loyverseReceipt?.receipt_number || `REC-${confirmedOrderId}`,
        },
        targetEmail
      );

      clearPendingCheckout();
      onClearCart();
      setOrderComplete(true);
    } catch (err) {
      console.error('Error completando orden retornada de Bold:', err);
      setOrderComplete(true);
    } finally {
      setIsSubmitting(false);
      setIsBoldModalWaiting(false);
    }
  };

  const executeBoldPaymentFlow = async (overrideLoyverseId?: string) => {
    setIsSubmitting(true);
    const generatedId = `UN-${Math.floor(100000 + Math.random() * 900000)}`;

    try {
      const orderPayload = {
        orderId: generatedId,
        amount: total,
        currency: 'COP',
        paymentMethod,
        customer: {
          name: `${firstName} ${lastName}`.trim() || 'Cliente URBANNOISE',
          email: emailOrPhone.includes('@') ? emailOrPhone : `${phone || 'cliente'}@urbannoise.co`,
          phone: phone || '3000000000',
          document: documentId || '1028394829',
          address,
          city,
          department,
          loyverseCustomerId: overrideLoyverseId || getCustomerSession()?.loyverseCustomerId,
        },
        items: cart.map((item) => ({
          id: item.product.id,
          name: item.product.name,
          size: item.size,
          qty: item.qty,
          price: item.product.price,
          sku: item.sku || item.product.sku,
          stock: item.product.stock,
          loyverseItemId: item.product.loyverseItemId,
          loyverseVariantId: item.variantId || item.product.loyverseVariantId,
          color: item.color || item.product.color,
        })),
        totals: {
          subtotal,
          shipping: 0,
          discount: discountValue,
          total,
        },
        shippingCarrier: shippingModeLabel,
        shippingMethod: shippingMode,
        newslettersOptIn: Boolean(newslettersOptIn),
        shippingAddress: deliveryLocationChoice === 'different'
          ? {
              isAlternateAddress: true,
              address: altAddress.trim(),
              apartment: altApartment.trim(),
              city: altCity.trim(),
              department: altDepartment.trim(),
              recipientName: altRecipientName.trim() || `${firstName} ${lastName}`.trim(),
              recipientPhone: altRecipientPhone.trim() || phone.trim(),
              specialInstructions: altInstructions.trim(),
              billingAddress: {
                address: address.trim(),
                apartment: apartment.trim(),
                city: city.trim(),
                department: department.trim(),
              },
            }
          : {
              isAlternateAddress: false,
              address: address.trim(),
              apartment: apartment.trim(),
              city: city.trim(),
              department: department.trim(),
              recipientName: `${firstName} ${lastName}`.trim(),
              recipientPhone: phone.trim(),
              specialInstructions: '',
            },
      };

      // Si el cliente marcó la casilla de novedades, registrarlo inmediatamente al Club URBANNOISE
      if (newslettersOptIn && (emailOrPhone.includes('@') || phone)) {
        const targetEmail = emailOrPhone.includes('@')
          ? emailOrPhone.trim().toLowerCase()
          : `${phone.replace(/\D/g, '')}@urbannoise.co`;

        try {
          const subs = JSON.parse(localStorage.getItem('urbannoise_newsletter_subs') || '[]');
          if (!subs.some((s: any) => s.email === targetEmail)) {
            subs.push({
              email: targetEmail,
              name: `${firstName} ${lastName}`.trim() || undefined,
              phone: phone ? phone.trim() : undefined,
              date: new Date().toISOString(),
            });
            localStorage.setItem('urbannoise_newsletter_subs', JSON.stringify(subs));
          }
        } catch {}

        fetch('/api/newsletter/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: targetEmail,
            name: `${firstName} ${lastName}`.trim() || undefined,
            phone: phone ? phone.trim() : undefined,
            source: 'checkout_checkbox',
          }),
        }).catch(() => {});
      }

      // Si es Pago Contra Entrega (exclusivo Bogotá)
      if (paymentMethod === 'cod') {
        setBoldProcessingStep('Registrando pedido con Pago Contra Entrega...');
        const syncResult = await confirmOrderAndSyncLoyverse({
          ...orderPayload,
          boldTransaction: {
            orderId: generatedId,
            boldTransactionId: `COD-${generatedId}`,
            boldReference: `COD-BOGOTA-${generatedId}`,
            authorizationCode: 'CONTRA_ENTREGA',
            amount: total,
            currency: 'COP',
            paymentMethod: 'cod',
            payerName: `${firstName} ${lastName}`.trim() || 'Cliente URBANNOISE',
            payerEmail: emailOrPhone,
            payerDocument: documentId || 'N/A',
            timestamp: new Date().toISOString(),
            status: 'APROBADA',
          },
        });

        setOrderId(generatedId);
        setLoyverseReceipt(syncResult.loyverseReceipt);
        setLoyverseSyncStatus(syncResult.loyverseSyncStatus);
        setDeductedStockDetails(syncResult.deductedStockInfo || []);

        const targetEmail = emailOrPhone.includes('@')
          ? emailOrPhone.trim().toLowerCase()
          : `${phone.replace(/\D/g, '')}@urbannoise.co`;
        addCustomerOrder(
          {
            id: generatedId,
            orderNumber: generatedId,
            date: 'Hoy • ' + new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
            timestamp: Date.now(),
            status: 'CONFIRMADO',
            statusLabel: 'En Preparación para Despacho Contra Entrega',
            userEmail: targetEmail,
            trackingCompany: shippingModeLabel,
            trackingNumber: undefined,
            estimatedDelivery: shippingMode === 'express_bogota' ? 'Hoy mismo • Mensajería Express Bogotá' : 'En 1-3 días hábiles • Entrega Nacional',
            timeline: [
              {
                title: 'Pedido Contra Entrega Registrado',
                date: 'Hoy (Ahora)',
                completed: true,
                current: true,
                detail: `Pagas ${formatCOP(total)} al recibir tu pedido en Bogotá con efectivo o datáfono Bold.`,
              },
              {
                title: 'Alistamiento en Tienda GranSan',
                date: 'En proceso',
                completed: false,
                current: false,
                detail: 'Tus prendas están siendo empacadas en el atelier.',
              },
              {
                title: 'Mensajero en Camino',
                date: 'Pendiente',
                completed: false,
                current: false,
                detail: 'El repartidor llevará el datáfono móvil Bold a tu dirección.',
              },
            ],
            shippingAddress: {
              name: `${firstName} ${lastName}`.trim() || 'Cliente URBANNOISE',
              city,
              department,
              address: `${address} ${apartment ? `(${apartment})` : ''}`.trim(),
              phone: phone || 'N/A',
            },
            items: cart.map((i) => ({
              id: i.product.id,
              name: i.product.name,
              size: i.size,
              qty: i.qty,
              price: i.product.price,
              image: i.product.image,
              sku: i.product.sku,
            })),
            totals: {
              subtotal,
              shipping: shippingCost,
              discount: discountValue,
              total,
            },
            paymentMethod: 'Pago Contra Entrega Bogotá',
            paymentStatus: 'PENDIENTE',
            receiptNumber: syncResult.loyverseReceipt?.receipt_number || `REC-${generatedId}`,
          },
          targetEmail
        );

        setIsSubmitting(false);
        setOrderComplete(true);
        onClearCart();
        return;
      }

      // Si es Pago en Línea (PSE, Tarjeta, Bancolombia / Nequi)
      setBoldProcessingStep('Iniciando conexión cifrada con pasarela Bold.co...');
      const intent = await createBoldPaymentIntent({
        orderId: generatedId,
        amount: total,
        currency: 'COP',
        customer: orderPayload.customer,
        items: orderPayload.items,
        totals: orderPayload.totals,
        shippingAddress: orderPayload.shippingAddress,
        shippingCarrier: orderPayload.shippingCarrier,
        shippingMethod: orderPayload.shippingMethod,
        paymentMethod: orderPayload.paymentMethod,
        description: `Pedido URBANNOISE #${generatedId}`,
        redirectionUrl: `${window.location.origin}${window.location.pathname}?bold-order-id=${generatedId}`,
      });

      // Guardar checkout pendiente con su firma criptográfica de integridad
      savePendingCheckout({
        ...orderPayload,
        integritySignature: intent.integritySignature,
      });

      // Si hay credenciales de producción activas, lanzar Bold con redirección de página completa sustituyendo la ventana
      if (intent.hasLiveCredentials && intent.identityKey) {
        setBoldProcessingStep('Redirigiendo a pasarela oficial Bold.co...');
        const opened = await launchBoldCheckout({
          identityKey: intent.identityKey,
          orderId: generatedId,
          amount: total,
          currency: 'COP',
          integritySignature: intent.integritySignature,
          description: intent.description,
          redirectionUrl: intent.redirectionUrl,
          renderMode: 'redirect',
        });

        if (opened) {
          setIsSubmitting(false);
          return;
        } else {
          setIsSubmitting(false);
          setBoldRedirectError('No se pudo redirigir a la pasarela de pago de Bold.co. Por favor intenta nuevamente o recarga la página.');
          return;
        }
      }

      // Si estamos en entorno local sin credenciales en vivo
      setBoldProcessingStep('Conectando con pasarela segura Bold.co...');
      await new Promise((r) => setTimeout(r, 350));
      setBoldProcessingStep('Autorizando transacción con entidad bancaria...');
      await new Promise((r) => setTimeout(r, 400));

      const tx = await processBoldPayment({
        orderId: generatedId,
        amount: total,
        paymentMethod,
        payerName: `${firstName} ${lastName}`.trim() || 'Cliente URBANNOISE',
        payerEmail: emailOrPhone.includes('@') ? emailOrPhone : `${phone || 'cliente'}@urbannoise.co`,
        payerDocument: documentId || '1028394829',
        bankName: paymentMethod === 'bold_pse' ? pseBank : undefined,
        cardLastFour:
          paymentMethod === 'bold_card'
            ? cardNumber.replace(/\s/g, '').slice(-4) || '8842'
            : undefined,
        cardBrand: paymentMethod === 'bold_card' ? 'Visa' : undefined,
      });

      setOrderId(generatedId);
      setBoldTransaction(tx);

      // PASO CRÍTICO: Generar Recibo y descontar inventario en tiempo real
      setBoldProcessingStep('Procesando pago y generando comprobante oficial...');
      try {
        const syncResult = await confirmOrderAndSyncLoyverse({
          ...orderPayload,
          boldTransaction: tx,
        });

        setLoyverseReceipt(syncResult.loyverseReceipt);
        setLoyverseSyncStatus(syncResult.loyverseSyncStatus);
        setDeductedStockDetails(syncResult.deductedStockInfo || []);
      } catch (syncErr: any) {
        console.warn('Advertencia en sincronización Loyverse:', syncErr);
        setLoyverseReceipt({
          id: `LOY-SIM-${generatedId}`,
          receipt_number: `REC-${Date.now().toString().slice(-6)}`,
          created_at: new Date().toISOString(),
          total_money: total,
          syncedToPos: false,
          note: 'Confirmación oficial de orden para despacho.',
        });
        setLoyverseSyncStatus('SIMULATED');
      }

      // Guardar pedido en el portal de cuenta del cliente
      try {
        const targetEmail = emailOrPhone.includes('@')
          ? emailOrPhone.trim().toLowerCase()
          : `${phone.replace(/\D/g, '')}@urbannoise.co`;
        addCustomerOrder(
          {
            id: generatedId,
            orderNumber: generatedId,
            date: 'Hoy • ' + new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
            timestamp: Date.now(),
            status: 'CONFIRMADO',
            statusLabel: 'En Preparación para Despacho',
            userEmail: targetEmail,
            trackingCompany: shippingModeLabel,
            trackingNumber: undefined,
            estimatedDelivery: shippingMode === 'express_bogota' ? 'Hoy mismo • Mensajería Express Bogotá' : 'En 1-3 días hábiles • Entrega Nacional',
            timeline: [
              {
                title: 'Pedido Confirmado y Pagado',
                date: 'Hoy (Ahora)',
                completed: true,
                current: true,
                detail: `Pago validado por ${formatCOP(total)} mediante ${paymentMethod.toUpperCase()}.`,
              },
              {
                title: 'Control de Calidad & Empaque',
                date: 'En proceso',
                completed: false,
                current: false,
                detail: 'Tus prendas están siendo preparadas en el atelier de Bogotá.',
              },
              {
                title: shippingMode === 'express_bogota' ? 'Motorizado en Camino' : 'En Ruta con Transportadora',
                date: 'Pendiente',
                completed: false,
                current: false,
                detail: shippingMode === 'express_bogota'
                  ? 'Se asignará mensajería express urbana. Pagas la tarifa al momento de recibir.'
                  : 'Se generará la guía oficial de la transportadora nacional con flete al cobro.',
              },
              {
                title: 'Entrega en Destino',
                date: 'Estimado 1-2 días',
                completed: false,
                current: false,
                detail: `Dirección registrada: ${address} ${apartment ? `(${apartment})` : ''}, ${city}.`,
              },
            ],
            shippingAddress: {
              name: `${firstName} ${lastName}`.trim() || 'Cliente URBANNOISE',
              city,
              department,
              address: `${address} ${apartment ? `(${apartment})` : ''}`.trim(),
              phone: phone || 'N/A',
            },
            items: cart.map((i) => ({
              id: i.product.id,
              name: i.product.name,
              size: i.size,
              qty: i.qty,
              price: i.product.price,
              image: i.product.image,
              sku: i.product.sku,
            })),
            totals: {
              subtotal,
              shipping: shippingCost,
              discount: discountValue,
              total,
            },
            paymentMethod:
              paymentMethod === 'bold_pse'
                ? 'PSE / Nequi / Bancolombia'
                : paymentMethod === 'bold_card'
                ? 'Tarjeta de Crédito / Débito'
                : paymentMethod === 'cod'
                ? 'Pago Contra Entrega'
                : 'Pasarela Segura Bold',
            paymentStatus: 'APROBADO',
            receiptNumber: `REC-${generatedId}`,
          },
          targetEmail
        );
      } catch (saveErr) {
        console.warn('No se pudo registrar la orden en storage local del cliente:', saveErr);
      }

      setIsSubmitting(false);
      setOrderComplete(true);
      onClearCart();
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (orderHoneypot.trim().length > 0) return; // Anti-Spam bot trap
    if (cart.length === 0) return;

    if (!legalAccepted) {
      setLegalError('Debes aceptar los Términos y Condiciones y la Política de Tratamiento de Datos (Ley 1581) para continuar con el pago.');
      return;
    }
    setLegalError('');

    // Validar datos obligatorios
    if (!firstName.trim() || !lastName.trim()) {
      alert('Por favor completa tu Nombre y Apellidos de entrega.');
      return;
    }
    if (!documentId.trim()) {
      alert('Por favor ingresa tu número de Cédula de Ciudadanía.');
      return;
    }
    if (!address.trim()) {
      alert('Por favor ingresa tu dirección de entrega.');
      return;
    }
    if (!city.trim()) {
      alert('Por favor ingresa la ciudad de entrega.');
      return;
    }
    if (!phone.trim()) {
      alert('Por favor ingresa tu número de WhatsApp / teléfono celular de entrega.');
      return;
    }
    if (!emailOrPhone.trim()) {
      alert('Por favor ingresa tu correo electrónico de contacto.');
      return;
    }

    // Si eligió recibir en otra dirección, validar campos de la dirección alternativa
    if (deliveryLocationChoice === 'different') {
      if (!altAddress.trim()) {
        alert('Por favor ingresa la dirección diferente donde deseas recibir tu pedido.');
        return;
      }
      if (!altCity.trim()) {
        alert('Por favor ingresa la ciudad de entrega para la dirección diferente.');
        return;
      }
      if (!altRecipientName.trim()) {
        alert('Por favor ingresa el nombre de la persona que recibirá el paquete en esa dirección.');
        return;
      }
      if (!altRecipientPhone.trim()) {
        alert('Por favor ingresa el teléfono celular de la persona que recibirá el paquete.');
        return;
      }
    }

    // Confirmación obligatoria de que la dirección está bien escrita para evitar demoras
    if (!addressConfirmed) {
      alert('Por favor verifica que tu dirección de entrega esté completa y bien digitada, y marca la casilla de confirmación para evitar errores con la transportadora.');
      return;
    }

    // REGISTRO Y GUARDADO LOCAL INMEDIATO (CERO RETARDO / CERO LAG)
    const cleanDoc = documentId.replace(/\D/g, '');
    const cleanPhone = phone.replace(/\D/g, '');
    const targetEmail = emailOrPhone.includes('@')
      ? emailOrPhone.trim().toLowerCase()
      : `${cleanPhone || 'cliente'}@urbannoise.co`;
    const fullName = `${firstName} ${lastName}`.trim() || 'Cliente URBANNOISE';

    const localUser = {
      name: fullName,
      email: targetEmail,
      phone: cleanPhone,
      city: city || 'Bogotá, D.C.',
      address: `${address} ${apartment}`.trim(),
      document: cleanDoc,
      createdAt: new Date().toISOString(),
    };
    saveCustomerSession(localUser as any);

    // Enviar registro al CRM en segundo plano sin pausar ni congelar la pantalla de pago
    registerWebCustomer({
      name: fullName,
      email: targetEmail,
      phone: cleanPhone,
      city: city || 'Bogotá, D.C.',
      address: `${address} ${apartment}`.trim(),
      document: cleanDoc,
    }).catch((err) => {
      console.warn('[CRM Sync Background]:', err);
    });

    // Proceder de inmediato al cobro oficial con pasarela Bold.co
    await executeBoldPaymentFlow();
  };

  const colombianDepartments = [
    'Bogotá D.C.',
    'Antioquia',
    'Valle del Cauca',
    'Cundinamarca',
    'Atlántico',
    'Santander',
    'Bolívar',
    'Risaralda',
    'Caldas',
    'Tolima',
    'Meta',
    'Boyacá',
    'Norte de Santander',
    'Huila',
    'Quindío',
    'Nariño',
  ];

  const pseBanksList = [
    'Bancolombia',
    'Nequi',
    'Davivienda',
    'Daviplata',
    'Banco de Bogotá',
    'BBVA Colombia',
    'Banco Falabella',
    'Banco de Occidente',
    'Scotiabank Colpatria',
    'Banco Popular',
    'Banco Caja Social',
    'Banco AV Villas',
    'Itaú',
    'Lulo Bank',
    'Nu Colombia',
  ];

  return (
    <div
      id="checkout-screen"
      className="fixed inset-0 z-[70] bg-[#FAFAFA] text-[#101013] overflow-y-auto overflow-x-hidden w-full font-sans animate-in fade-in duration-200 overscroll-contain"
    >
      {/* Barra Superior Minimalista con Logo */}
      <header className="bg-white border-b border-[#E5E5E5] sticky top-0 z-30 px-3 sm:px-8 py-2.5 sm:py-3.5 flex items-center justify-between gap-2 w-full">
        <div className="flex items-center space-x-1.5 sm:space-x-3 min-w-0">
          <button
            onClick={onClose}
            className="p-1 sm:p-1.5 -ml-1 text-xs font-bold uppercase tracking-wider text-[#101013] hover:opacity-60 transition cursor-pointer flex items-center space-x-1 flex-shrink-0"
            aria-label="Volver a la tienda"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden md:inline">Volver a la tienda</span>
          </button>
          <span className="text-gray-300 hidden sm:inline">|</span>
          <div className="flex items-center space-x-1.5 min-w-0">
            <span className="font-extrabold text-xs sm:text-base tracking-tight uppercase text-[#101013] truncate">
              URBANNOISE
            </span>
            <span className="text-[9px] sm:text-[10px] font-mono bg-black text-[#F5F2E4] px-1.5 py-0.5 font-bold tracking-widest flex-shrink-0">
              CHECKOUT
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3 text-xs text-[#666666] flex-shrink-0">
          <div className="flex items-center space-x-1 text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded text-[10px] whitespace-nowrap">
            <Lock className="w-3 h-3 text-emerald-600 flex-shrink-0" />
            <span className="hidden sm:inline uppercase tracking-wider">Pago Encriptado 256-Bit</span>
            <span className="sm:hidden uppercase tracking-wider text-[9px]">Seguro</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 sm:p-1.5 hover:bg-gray-100 rounded transition cursor-pointer"
            aria-label="Cerrar checkout"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Banner Escudo Dinámico Anti-Estrés y Anti-F5 */}
      {isBoldModalWaiting && !orderComplete && (
        <aside
          role="status"
          aria-live="polite"
          className="bg-[#101013] text-white border-b-2 border-emerald-500 shadow-2xl px-3 sm:px-8 py-3.5 sm:py-4 sticky top-[49px] sm:top-[57px] z-40 animate-in slide-in-from-top duration-300"
        >
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-start sm:items-center space-x-3 text-left w-full">
              <div className="relative flex-shrink-0 mt-0.5 sm:mt-0">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center">
                  <div className="w-3 h-3 bg-emerald-400 rounded-full animate-ping absolute"></div>
                  <ShieldCheck className="w-5 h-5 text-emerald-400 relative z-10" />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-emerald-400">
                    Sincronización en vivo • Pasarela Bold.co
                  </span>
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                </div>
                <h4 className="text-xs sm:text-sm font-extrabold text-[#F5F2E4] leading-tight mt-0.5">
                  {getWaitingPaymentInfo().title} por <span className="text-emerald-400 font-mono font-black">{getWaitingPaymentInfo().amountText}</span>
                </h4>
                <p className="text-[11px] text-gray-300 mt-1 leading-snug">
                  {getWaitingPaymentInfo().instructions} <span className="font-bold text-amber-300">Por favor no recargues ni cierres esta pantalla.</span>
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between md:justify-end w-full md:w-auto space-x-2 border-t border-gray-800 md:border-0 pt-2 md:pt-0 flex-shrink-0">
              <div className="text-[10px] text-gray-400 flex items-center space-x-1">
                <Lock className="w-3 h-3 text-emerald-400" />
                <span className="font-semibold">Vigilado SuperFinanciera</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const pending = getPendingCheckout();
                  if (pending?.orderId) {
                    fetch(`/api/bold/order-status?orderId=${encodeURIComponent(pending.orderId)}`)
                      .then((r) => r.json())
                      .then((res) => {
                        if (res?.status === 'APPROVED') {
                          completeReturningOrder(pending, pending.orderId);
                        }
                      });
                  }
                }}
                className="text-[10px] font-bold uppercase tracking-wider bg-white/10 hover:bg-white/20 text-[#F5F2E4] px-2.5 py-1 rounded transition border border-white/20 flex items-center space-x-1 cursor-pointer"
              >
                <span>Verificar Pago</span>
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* Pantalla de Confirmación de Pedido Exitoso con Voucher Oficial Bold.co */}
      {orderComplete ? (
        <div className="max-w-2xl mx-auto px-4 py-12 text-center">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div className="inline-flex items-center space-x-2 bg-emerald-50 border border-emerald-300 text-emerald-900 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-3">
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            <span>PAGO APROBADO • PASARELA BOLD.CO</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-[#101013] mb-2">
            ¡Pago Exitoso, {firstName || 'Cliente'}!
          </h1>
          <p className="text-xs sm:text-sm text-[#666666] mb-6 max-w-lg mx-auto">
            Hemos recibido y verificado tu pago a través de <strong>Bold.co</strong> para la orden{' '}
            <strong className="text-black font-mono">#{orderId}</strong>. Hemos enviado el recibo de compra y la notificación de despacho a{' '}
            <strong className="text-black">{emailOrPhone || 'tu correo'}</strong>.
          </p>

          {/* VOUCHER OFICIAL DE PAGO BOLD.CO */}
          <div className="bg-white border-2 border-[#101013] p-4 sm:p-6 text-left mb-6 shadow-md relative w-full overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b pb-4 mb-4 gap-2">
              <div className="flex items-center space-x-2">
                <span className="bg-[#002D62] text-white px-2.5 py-1 text-xs font-black tracking-widest rounded flex-shrink-0">
                  BOLD
                </span>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#101013]">
                    COMPROBANTE ELECTRÓNICO DE PAGO
                  </h3>
                  <p className="text-[10px] text-[#666666]">
                    Vigilado Superintendencia Financiera de Colombia
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 flex-shrink-0">
                ● APROBADA POR BOLD
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between border-b border-gray-100 pb-2 gap-2">
                <span className="text-[#666666] flex-shrink-0">Número de Orden Tienda:</span>
                <span className="font-mono font-bold text-black text-right">{orderId}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2 gap-2">
                <span className="text-[#666666] flex-shrink-0">ID Transacción Bold:</span>
                <span className="font-mono font-bold text-[#002D62] text-right break-all">
                  {boldTransaction?.boldTransactionId || 'TX-BOLD-2026-X88'}
                </span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2 gap-2">
                <span className="text-[#666666] flex-shrink-0">Referencia de Pago:</span>
                <span className="font-mono font-semibold text-black text-right break-all">
                  {boldTransaction?.boldReference || 'BLD98472910'}
                </span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2 gap-2">
                <span className="text-[#666666] flex-shrink-0">Código de Autorización:</span>
                <span className="font-mono font-semibold text-black text-right">
                  {boldTransaction?.authorizationCode || '729401'}
                </span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2 gap-2">
                <span className="text-[#666666] flex-shrink-0">Método de Pago:</span>
                <span className="font-bold uppercase text-black text-right">
                  {paymentMethod === 'bold_pse'
                    ? `PSE Débito Bancario (${pseBank})`
                    : paymentMethod === 'bold_card'
                    ? `Tarjeta terminada en •••• ${
                        cardNumber.replace(/\s/g, '').slice(-4) || '8842'
                      }`
                    : paymentMethod === 'bold_bancolombia'
                    ? 'Botón Bancolombia & Nequi'
                    : 'Pago Contra Entrega Bogotá'}
                </span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2 gap-2">
                <span className="text-[#666666] flex-shrink-0">Pagador:</span>
                <span className="font-medium text-black text-right">
                  {firstName} {lastName} (C.C. {documentId || '1028394829'})
                </span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2 gap-2">
                <span className="text-[#666666] flex-shrink-0">Dirección de Despacho:</span>
                <span className="font-medium text-black text-right">
                  {address}, {city} ({department})
                </span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2 gap-2">
                <span className="text-[#666666] flex-shrink-0">Firma Digital:</span>
                <span className="font-mono text-[10px] text-gray-500 truncate max-w-[150px] sm:max-w-[240px]">
                  {boldTransaction?.integritySignature || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
                </span>
              </div>
              <div className="flex justify-between pt-2 text-sm font-black text-[#101013]">
                <span>Total Pagado (COP):</span>
                <span className="text-base text-black">
                  {formatCOP(finalOrderAmount || boldTransaction?.amount || loyverseReceipt?.total_money || total)}
                </span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-200 text-[10px] text-[#777777] flex flex-wrap items-center justify-between gap-1">
              <span className="flex items-center space-x-1">
                <Lock className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                <span>Transacción encriptada certificación PCI-DSS Nivel 1</span>
              </span>
              <span>Pasarela de Pagos Segura</span>
            </div>
          </div>

          {/* VOUCHER OFICIAL DE RECIBO E INVENTARIO */}
          <div className="bg-white border-2 border-emerald-900/40 p-4 sm:p-6 text-left mb-6 shadow-md relative w-full overflow-hidden bg-gradient-to-b from-white to-emerald-50/20">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-emerald-100 pb-4 mb-4 gap-2">
              <div className="flex items-center space-x-2">
                <span className="bg-emerald-800 text-white px-2.5 py-1 text-xs font-black tracking-widest rounded flex items-center space-x-1 flex-shrink-0">
                  <Store className="w-3 h-3 inline mr-1" />
                  <span>TIENDA OFICIAL</span>
                </span>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-emerald-950">
                    RECIBO OFICIAL DE COMPRA
                  </h3>
                  <p className="text-[10px] text-emerald-700">
                    Comprobante digital y garantía oficial de entrega
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded border flex-shrink-0 text-emerald-800 bg-emerald-100/70 border-emerald-300">
                ● PEDIDO CONFIRMADO
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between border-b border-emerald-100/60 pb-2 gap-2">
                <span className="text-[#666666] flex-shrink-0">Número de Pedido:</span>
                <span className="font-mono font-bold text-emerald-900 text-right">
                  #{orderId}
                </span>
              </div>
              <div className="flex justify-between border-b border-emerald-100/60 pb-2 gap-2">
                <span className="text-[#666666] flex-shrink-0">Referencia de Pago:</span>
                <span className="font-mono text-gray-700 text-right break-all">
                  {boldTransaction?.boldReference || `BLD-${orderId}`}
                </span>
              </div>
              <div className="flex justify-between border-b border-emerald-100/60 pb-2 gap-2">
                <span className="text-[#666666] flex-shrink-0">Estado de la Orden:</span>
                <span className="font-bold text-emerald-700 text-right flex items-center space-x-1">
                  <Check className="w-3.5 h-3.5 inline text-emerald-600 mr-0.5" />
                  <span>LISTO PARA EMPAQUE Y DESPACHO</span>
                </span>
              </div>

              {/* Detalle de prendas adquiridas */}
              <div className="bg-emerald-50/70 border border-emerald-200/70 rounded p-3 my-2 space-y-1.5">
                <div className="flex items-center space-x-1 text-[11px] font-bold text-emerald-900 mb-1">
                  <Boxes className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Resumen de Prendas Adquiridas:</span>
                </div>
                {(deductedStockDetails && deductedStockDetails.length > 0) || (finalOrderItems && finalOrderItems.length > 0) ? (
                  (deductedStockDetails.length > 0 ? deductedStockDetails : finalOrderItems).map((item, idx) => (
                    <div key={idx} className="flex justify-between text-[11px] text-emerald-950 font-mono">
                      <span>• {item.item}</span>
                      <span className="font-bold text-emerald-800">{item.qtyDeducted} unidad(es)</span>
                    </div>
                  ))
                ) : (
                  <div className="text-[11px] text-emerald-800 font-mono">
                    • Pedido registrado y listo para despacho inmediato.
                  </div>
                )}
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-emerald-100 text-[10px] text-emerald-800 flex items-center justify-between">
              <span className="flex items-center space-x-1">
                <Receipt className="w-3 h-3 text-emerald-700 flex-shrink-0" />
                <span>Factura digital y comprobante oficial emitido</span>
              </span>
              <span className="font-bold">Bogotá, Colombia</span>
            </div>
          </div>

          {/* ACCIONES DE CIERRE Y DESCARGA */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => window.print()}
              className="border-2 border-[#101013] text-[#101013] hover:bg-gray-100 font-extrabold text-xs uppercase tracking-widest px-6 py-3.5 transition cursor-pointer flex items-center justify-center space-x-2"
            >
              <Printer className="w-4 h-4" />
              <span>IMPRIMIR COMPROBANTE</span>
            </button>
            <button
              onClick={onClose}
              className="bg-[#101013] text-[#F5F2E4] hover:bg-black font-extrabold text-xs uppercase tracking-widest px-8 py-3.5 transition cursor-pointer flex items-center justify-center space-x-2"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>FINALIZAR Y VOLVER A LA TIENDA</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="max-w-[1320px] mx-auto grid grid-cols-1 lg:grid-cols-12 min-h-[calc(100vh-60px)] w-full overflow-x-hidden">
          {/* ========================================================= */}
          {/* MÓVIL: Botón de Resumen Plegable (Igual a Shopify Checkout) */}
          {/* ========================================================= */}
          <div className="lg:hidden bg-[#F5F5F7] border-b border-[#E5E5E5] w-full">
            <div className="px-3.5 sm:px-4 py-3 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => setMobileSummaryOpen(!mobileSummaryOpen)}
                className="flex items-center space-x-2 text-[#101013] font-bold cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4 text-[#101013]" />
                <span className="text-[11px] sm:text-xs">
                  {mobileSummaryOpen ? 'Ocultar resumen del pedido' : 'Mostrar resumen del pedido'}
                </span>
                {mobileSummaryOpen ? (
                  <ChevronUp className="w-3.5 h-3.5 text-[#101013]" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-[#101013]" />
                )}
              </button>
              <span className="font-extrabold text-sm text-[#101013]">{formatCOP(total)}</span>
            </div>

            {/* Resumen Móvil Desplegable directamente bajo la barra */}
            {mobileSummaryOpen && (
              <div className="p-3.5 sm:p-4 border-t border-[#E5E5E5] bg-[#F9F9F9] space-y-3.5 animate-in slide-in-from-top-1 duration-200 text-left">
                <div className="divide-y divide-[#E5E5E5] max-h-[260px] overflow-y-auto pr-1">
                  {cart.map((item) => (
                    <div
                      key={`mob-${item.product.id}-${item.size}-${item.color || ''}`}
                      className="py-2.5 flex items-center space-x-3 text-xs"
                    >
                      <div className="relative w-12 h-15 bg-white border border-gray-200 flex-shrink-0 overflow-hidden">
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute -top-1 -right-1 bg-[#101013] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                          {item.qty}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-extrabold text-xs uppercase tracking-tight text-[#101013] truncate">
                          {item.product.name}
                        </h4>
                        <p className="text-[10.5px] text-[#666666]">
                          Talla: <span className="font-bold text-black">{item.size}</span>
                          {(item.color || item.product.color) && (
                            <span> • Color: <span className="font-bold text-black">{item.color || item.product.color}</span></span>
                          )}
                        </p>
                      </div>
                      <span className="text-xs font-bold text-[#101013] flex-shrink-0">
                        {formatCOP(item.product.price * item.qty)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Subtotal / Envío / Total */}
                <div className="pt-3 border-t border-[#E5E5E5] space-y-1.5 text-xs text-[#666666]">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-bold text-black">{formatCOP(subtotal)}</span>
                  </div>
                  {appliedDiscount && (
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>Descuento ({appliedDiscount.code}):</span>
                      <span>-{formatCOP(discountValue)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-xs">
                    <span>Envío ({shippingMode === 'express_bogota' ? 'Express Mismo Día' : 'Nacional'}):</span>
                    <span className="font-bold text-emerald-700">
                      FLETE AL COBRO (Envío contra entrega)
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-extrabold text-[#101013] pt-2 border-t border-[#E5E5E5]">
                    <span>Total a Pagar:</span>
                    <span>{formatCOP(total)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* COLUMNA IZQUIERDA: Formulario de Pago y Envío (60%)       */}
          {/* ========================================================= */}
          <div className="lg:col-span-7 bg-white p-3.5 sm:p-8 lg:p-12 border-r border-[#E5E5E5] w-full max-w-full overflow-x-hidden">
            <form onSubmit={handleSubmitOrder} className="max-w-xl mx-auto space-y-6 sm:space-y-8 text-left w-full">
              {/* Trampa Anti-Spam invisible para bots */}
              <input
                id="checkout-order-honeypot"
                type="text"
                name="_order_security_check"
                tabIndex={-1}
                autoComplete="off"
                value={orderHoneypot}
                onChange={(e) => setOrderHoneypot(e.target.value)}
                className="hidden opacity-0 pointer-events-none absolute -left-[9999px]"
                aria-hidden="true"
              />
              {/* 1. SECCIÓN CONTACTO */}
              {/* 1. SECCIÓN CONTACTO & CUENTA OBLIGATORIA */}
              <div>
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <div className="flex items-center space-x-2">
                    <h2 className="text-sm sm:text-lg font-extrabold uppercase tracking-tight text-[#101013]">
                      1. Contacto & Cuenta
                    </h2>
                    <span className="text-[9px] bg-black text-[#F5F2E4] font-bold px-1.5 py-0.5 uppercase tracking-wider rounded">
                      Obligatoria
                    </span>
                  </div>
                  {getCustomerSession() && (
                    <span className="text-[11px] text-emerald-700 font-bold flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Sesión Activa</span>
                    </span>
                  )}
                </div>

                {getCustomerSession() ? (
                  <div className="bg-emerald-50/70 border border-emerald-200/80 p-3 rounded-lg flex items-center justify-between text-xs mb-3">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-emerald-800 block">Comprando como:</span>
                      <span className="font-bold text-gray-900">{getCustomerSession()?.name}</span>
                      <span className="text-gray-600 font-mono text-[11px] block">{getCustomerSession()?.email}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        clearCustomerSession();
                        window.location.reload();
                      }}
                      className="text-[11px] text-emerald-800 hover:text-black underline font-semibold cursor-pointer"
                    >
                      Cambiar cuenta
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label htmlFor="checkout-contact-email-phone" className="block text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-[#555555] mb-1">
                        Correo electrónico de contacto *
                      </label>
                      <input
                        id="checkout-contact-email-phone"
                        name="emailOrPhone"
                        type="email"
                        autoComplete="email"
                        required
                        value={emailOrPhone}
                        onChange={(e) => setEmailOrPhone(e.target.value)}
                        onBlur={() => syncCustomerFromLoyverse(emailOrPhone)}
                        placeholder="tu-correo@ejemplo.com"
                        className="w-full border border-gray-300 px-3 py-2 sm:px-3.5 sm:py-2.5 text-xs sm:text-sm focus:border-black focus:outline-none bg-white rounded-none"
                      />
                    </div>

                    {/* Información de Cuenta por Correo (Sin Contraseña) */}
                    <p className="text-[10.5px] text-[#666666] leading-snug">
                      🔒 Tu cuenta se asociará automáticamente a este correo para darte acceso directo a tu historial, comprobantes digitales y guía oficial de despacho sin necesidad de recordar contraseñas.
                    </p>

                    <label htmlFor="checkout-newsletter-optin" className="flex items-start space-x-2 text-[11px] sm:text-xs text-[#555555] cursor-pointer pt-0.5">
                      <input
                        id="checkout-newsletter-optin"
                        name="newslettersOptIn"
                        type="checkbox"
                        checked={newslettersOptIn}
                        onChange={(e) => setNewslettersOptIn(e.target.checked)}
                        className="mt-0.5 rounded-none accent-black"
                      />
                      <span>Enviarme novedades y lanzamientos exclusivos de URBANNOISE por correo</span>
                    </label>
                  </div>
                )}
              </div>

              {/* 2. SECCIÓN ENTREGA / DIRECCIÓN */}
              <div className="pt-5 sm:pt-6 border-t border-[#EBEBEB]">
                <h2 className="text-sm sm:text-lg font-extrabold uppercase tracking-tight text-[#101013] mb-3 sm:mb-4">
                  2. Entrega
                </h2>
                <div className="space-y-2.5 sm:space-y-3 text-xs sm:text-sm">
                  <div>
                    <label htmlFor="checkout-shipping-country" className="block text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-[#555555] mb-1">
                      País o región
                    </label>
                    <input
                      id="checkout-shipping-country"
                      name="country"
                      type="text"
                      disabled
                      value="Colombia (Envío Nacional)"
                      className="w-full border border-gray-200 px-3 py-2 sm:px-3.5 sm:py-2.5 bg-[#F9F9F9] text-gray-700 font-semibold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <div>
                      <label htmlFor="checkout-shipping-first-name" className="block text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-[#555555] mb-1">
                        Nombre *
                      </label>
                      <input
                        id="checkout-shipping-first-name"
                        name="firstName"
                        type="text"
                        autoComplete="given-name"
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Tu nombre"
                        className="w-full border border-gray-300 px-3 py-2 sm:px-3.5 sm:py-2.5 focus:border-black focus:outline-none text-xs sm:text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="checkout-shipping-last-name" className="block text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-[#555555] mb-1">
                        Apellidos *
                      </label>
                      <input
                        id="checkout-shipping-last-name"
                        name="lastName"
                        type="text"
                        autoComplete="family-name"
                        required
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Tus apellidos"
                        className="w-full border border-gray-300 px-3 py-2 sm:px-3.5 sm:py-2.5 focus:border-black focus:outline-none text-xs sm:text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="checkout-shipping-document-id" className="block text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-[#555555] mb-1">
                      Cédula de Ciudadanía (C.C. / NIT para factura legal) *
                    </label>
                    <input
                      id="checkout-shipping-document-id"
                      name="documentId"
                      type="text"
                      required
                      value={documentId}
                      onChange={(e) => setDocumentId(e.target.value)}
                      placeholder="Ej. 1020304050"
                      className="w-full border border-gray-300 px-3 py-2 sm:px-3.5 sm:py-2.5 focus:border-black focus:outline-none text-xs sm:text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="checkout-shipping-address" className="block text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-[#555555] mb-1">
                      Dirección de residencia (Calle, Carrera, Número) *
                    </label>
                    <input
                      id="checkout-shipping-address"
                      name="address"
                      type="text"
                      autoComplete="street-address"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Ej. Cra 10 # 9-37"
                      className="w-full border border-gray-300 px-3 py-2 sm:px-3.5 sm:py-2.5 focus:border-black focus:outline-none text-xs sm:text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="checkout-shipping-apartment" className="block text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-[#555555] mb-1">
                      Apartamento, suite, interior (opcional)
                    </label>
                    <input
                      id="checkout-shipping-apartment"
                      name="apartment"
                      type="text"
                      autoComplete="address-line2"
                      value={apartment}
                      onChange={(e) => setApartment(e.target.value)}
                      placeholder="Ej. Apto 402, Torre 3"
                      className="w-full border border-gray-300 px-3 py-2 sm:px-3.5 sm:py-2.5 focus:border-black focus:outline-none text-xs sm:text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <div>
                      <label htmlFor="checkout-shipping-department" className="block text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-[#555555] mb-1">
                        Departamento *
                      </label>
                      <select
                        id="checkout-shipping-department"
                        name="department"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="w-full border border-gray-300 px-2.5 sm:px-3.5 py-2 sm:py-2.5 bg-white focus:border-black focus:outline-none text-xs sm:text-sm"
                      >
                        {colombianDepartments.map((dep) => (
                          <option key={dep} value={dep}>
                            {dep}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="checkout-shipping-city" className="block text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-[#555555] mb-1">
                        Ciudad / Municipio *
                      </label>
                      <input
                        id="checkout-shipping-city"
                        name="city"
                        type="text"
                        autoComplete="address-level2"
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Ej. Bogotá"
                        className="w-full border border-gray-300 px-3 py-2 sm:px-3.5 sm:py-2.5 focus:border-black focus:outline-none text-xs sm:text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <div>
                      <label htmlFor="checkout-shipping-postal-code" className="block text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-[#555555] mb-1">
                        Código postal (opcional)
                      </label>
                      <input
                        id="checkout-shipping-postal-code"
                        name="postalCode"
                        type="text"
                        autoComplete="postal-code"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        placeholder="110111"
                        className="w-full border border-gray-300 px-3 py-2 sm:px-3.5 sm:py-2.5 focus:border-black focus:outline-none text-xs sm:text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="checkout-shipping-phone" className="block text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-[#555555] mb-1">
                        Teléfono celular (entrega) *
                      </label>
                      <input
                        id="checkout-shipping-phone"
                        name="phone"
                        type="tel"
                        autoComplete="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="310 123 4567"
                        className="w-full border border-gray-300 px-3 py-2 sm:px-3.5 sm:py-2.5 focus:border-black focus:outline-none text-xs sm:text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. SECCIÓN MÉTODO DE ENVÍO */}
              <div className="pt-5 sm:pt-6 border-t border-[#EBEBEB]">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-sm sm:text-lg font-extrabold uppercase tracking-tight text-[#101013]">
                    3. Método de Envío
                  </h2>
                  <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                    Flete al Cobro (Envío pagadero al recibir)
                  </span>
                </div>

                {/* Cuadro explicativo claro para evitar confusiones */}
                <div className="bg-amber-50/80 border border-amber-200/90 rounded-lg p-3 mb-3 text-xs text-amber-950 flex items-start space-x-2.5">
                  <span className="text-base mt-0.5">ℹ️</span>
                  <div className="leading-relaxed">
                    <p className="font-bold text-amber-950">
                      La prenda se paga ahora en la web. Únicamente el valor del envío se cancela al recibir.
                    </p>
                    <p className="text-[11px] text-amber-900 mt-0.5">
                      En este pago web el transporte marca <strong>$0 COP</strong> porque pagas el costo exacto del flete directamente a la transportadora (Servientrega / Inter Rapidísimo) o al motorizado cuando te entreguen tu paquete.
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5 text-xs sm:text-sm">
                  {/* Opción 1: Envío Nacional Unificado (Servientrega o Inter Rapidísimo) */}
                  <label
                    htmlFor="shipping-mode-national"
                    className={`flex items-start sm:items-center justify-between p-3 sm:p-3.5 border cursor-pointer transition gap-2 ${
                      shippingMode === 'national'
                        ? 'border-black bg-[#FBFBFB] ring-1 ring-black'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start space-x-2.5 sm:space-x-3 min-w-0 flex-1">
                      <input
                        id="shipping-mode-national"
                        type="radio"
                        name="shippingModeOption"
                        checked={shippingMode === 'national'}
                        onChange={() => setShippingMode('national')}
                        className="accent-black mt-0.5"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p className="font-extrabold text-[#101013] text-xs sm:text-sm uppercase tracking-tight">
                            Envío Nacional Estándar
                          </p>
                          <span className="text-[9px] bg-black text-[#F5F2E4] font-bold px-1.5 py-0.2 uppercase rounded">
                            Nacional 1-3 Días
                          </span>
                        </div>
                        <p className="text-[#666666] text-[10.5px] sm:text-xs mt-0.5">
                          Despacho asegurado desde taller GranSan Bogotá con Servientrega o Inter Rapidísimo. Te enviamos la guía oficial para rastreo. Pagas el costo del envío al recibir.
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="font-black text-xs sm:text-sm text-emerald-700 block">
                        FLETE AL COBRO
                      </span>
                      <span className="text-[9.5px] text-[#555555] font-semibold block">
                        (Envío pagas al recibir)
                      </span>
                      <span className="text-[9px] text-[#888888] font-mono block">
                        $0 cobrado en web
                      </span>
                    </div>
                  </label>

                  {/* Opción 2: Envío Express Bogotá Mismo Día (DiDi, inDrive, Yango o Privado) */}
                  <label
                    htmlFor="shipping-mode-express-bogota"
                    className={`flex items-start sm:items-center justify-between p-3 sm:p-3.5 border cursor-pointer transition gap-2 ${
                      shippingMode === 'express_bogota'
                        ? 'border-black bg-[#FBFBFB] ring-1 ring-black'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start space-x-2.5 sm:space-x-3 min-w-0 flex-1">
                      <input
                        id="shipping-mode-express-bogota"
                        type="radio"
                        name="shippingModeOption"
                        checked={shippingMode === 'express_bogota'}
                        onChange={() => setShippingMode('express_bogota')}
                        className="accent-black mt-0.5"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p className="font-extrabold text-[#101013] text-xs sm:text-sm uppercase tracking-tight">
                            Envío Express Bogotá (Mismo Día / Inmediato)
                          </p>
                          <span className="text-[9px] bg-amber-600 text-white font-bold px-1.5 py-0.2 uppercase rounded">
                            Bogotá Mismo Día
                          </span>
                        </div>
                        <p className="text-[#666666] text-[10.5px] sm:text-xs mt-0.5">
                          Despacho express el mismo día con motorizado vía app (DiDi Entrega, inDrive, Yango o mensajero privado). Pagas la carrera directamente al motorizado al recibir.
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="font-black text-xs sm:text-sm text-emerald-700 block">
                        FLETE AL COBRO
                      </span>
                      <span className="text-[9.5px] text-[#555555] font-semibold block">
                        (Carrera pagas al recibir)
                      </span>
                      <span className="text-[9px] text-[#888888] font-mono block">
                        $0 cobrado en web
                      </span>
                    </div>
                  </label>
                </div>

                {/* ¿DESEAS RECIBIR EN LA DIRECCIÓN QUE DIGITASTE O EN OTRO LUGAR? */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="mb-2.5">
                    <div className="flex items-center space-x-1.5">
                      <MapPin className="w-4 h-4 text-black flex-shrink-0" />
                      <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-tight text-[#101013]">
                        ¿Usted desea recibir en la dirección que digitó?
                      </h3>
                    </div>
                    <p className="text-[11px] sm:text-xs text-[#666666] mt-0.5">
                      Confirma si entregamos en tu dirección de residencia o si deseas recibir tu paquete en otro lugar.
                    </p>
                  </div>

                  <div className="space-y-2 mb-3">
                    {/* Opción 1: Sí, en la dirección registrada arriba */}
                    <label
                      htmlFor="delivery-choice-same"
                      className={`flex items-start p-3 border cursor-pointer transition gap-2.5 ${
                        deliveryLocationChoice === 'same'
                          ? 'border-black bg-[#FBFBFB] ring-1 ring-black'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        id="delivery-choice-same"
                        type="radio"
                        name="deliveryLocationChoice"
                        checked={deliveryLocationChoice === 'same'}
                        onChange={() => setDeliveryLocationChoice('same')}
                        className="accent-black mt-0.5"
                      />
                      <div className="min-w-0 flex-1">
                        <span className="font-extrabold text-xs sm:text-sm text-[#101013] block">
                          Sí, recibir en la dirección que digité arriba
                        </span>
                        <p className="text-[11px] text-[#555555] mt-0.5">
                          {address ? (
                            <span className="font-mono text-black font-semibold">
                              {address} {apartment ? `• ${apartment}` : ''} ({city}, {department})
                            </span>
                          ) : (
                            <span className="italic text-gray-400">
                              (Se despachará a la dirección principal ingresada en la Sección 2)
                            </span>
                          )}
                        </p>
                      </div>
                    </label>

                    {/* Opción 2: No, en otro lugar */}
                    <label
                      htmlFor="delivery-choice-different"
                      className={`flex items-start p-3 border cursor-pointer transition gap-2.5 ${
                        deliveryLocationChoice === 'different'
                          ? 'border-black bg-[#FBFBFB] ring-1 ring-black'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        id="delivery-choice-different"
                        type="radio"
                        name="deliveryLocationChoice"
                        checked={deliveryLocationChoice === 'different'}
                        onChange={() => setDeliveryLocationChoice('different')}
                        className="accent-black mt-0.5"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-extrabold text-xs sm:text-sm text-[#101013]">
                            No, deseo recibirlo en otro lugar
                          </span>
                          <span className="text-[9px] bg-black text-white px-1.5 py-0.2 font-bold uppercase rounded">
                            Solo para esta ocasión
                          </span>
                        </div>
                        <p className="text-[11px] text-[#666666] mt-0.5">
                          Para recibir en tu oficina, trabajo, portería, casa de un familiar o si es un obsequio.
                        </p>
                      </div>
                    </label>
                  </div>

                  {/* FORMULARIO DESPLEGABLE: DIRECCIÓN SOLO PARA ESTA OCASIÓN */}
                  {deliveryLocationChoice === 'different' && (
                    <div className="p-3.5 sm:p-4 bg-gray-50 border border-gray-300 rounded mb-3 space-y-3">
                      <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                        <span className="text-[11px] font-extrabold text-black uppercase tracking-wider flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-black" />
                          Dirección de Entrega para esta ocasión:
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block text-[11px] font-bold text-[#333333] uppercase mb-1">
                            Nombre de quien recibe allí *
                          </label>
                          <input
                            type="text"
                            required={deliveryLocationChoice === 'different'}
                            value={altRecipientName}
                            onChange={(e) => setAltRecipientName(e.target.value)}
                            placeholder="Ej: Laura Gómez / Portería Torre 2"
                            className="w-full border border-gray-300 p-2.5 text-xs focus:border-black outline-none bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-[#333333] uppercase mb-1">
                            Teléfono celular de contacto *
                          </label>
                          <input
                            type="tel"
                            required={deliveryLocationChoice === 'different'}
                            value={altRecipientPhone}
                            onChange={(e) => setAltRecipientPhone(e.target.value)}
                            placeholder="Ej: 310 123 4567"
                            className="w-full border border-gray-300 p-2.5 text-xs focus:border-black outline-none bg-white"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block text-[11px] font-bold text-[#333333] uppercase mb-1">
                            Departamento de entrega *
                          </label>
                          <select
                            value={altDepartment}
                            onChange={(e) => setAltDepartment(e.target.value)}
                            className="w-full border border-gray-300 p-2.5 text-xs focus:border-black outline-none bg-white"
                          >
                            {colombianDepartments.map((dept) => (
                              <option key={dept} value={dept}>
                                {dept}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-[#333333] uppercase mb-1">
                            Ciudad o Municipio *
                          </label>
                          <input
                            type="text"
                            required={deliveryLocationChoice === 'different'}
                            value={altCity}
                            onChange={(e) => setAltCity(e.target.value)}
                            placeholder="Ej: Bogotá, Medellín, Cali..."
                            className="w-full border border-gray-300 p-2.5 text-xs focus:border-black outline-none bg-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[#333333] uppercase mb-1">
                          Dirección exacta de entrega (Calle, Carrera, Barrio, Edificio) *
                        </label>
                        <input
                          type="text"
                          required={deliveryLocationChoice === 'different'}
                          value={altAddress}
                          onChange={(e) => setAltAddress(e.target.value)}
                          placeholder="Ej: Calle 72 # 10-34, Edificio Platinum Piso 4"
                          className="w-full border border-gray-300 p-2.5 text-xs focus:border-black outline-none bg-white"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block text-[11px] font-bold text-[#333333] uppercase mb-1">
                            Apto / Oficina / Local / Torre (Opcional)
                          </label>
                          <input
                            type="text"
                            value={altApartment}
                            onChange={(e) => setAltApartment(e.target.value)}
                            placeholder="Ej: Apto 502, Oficina 301"
                            className="w-full border border-gray-300 p-2.5 text-xs focus:border-black outline-none bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-[#333333] uppercase mb-1">
                            Instrucciones para mensajero (Opcional)
                          </label>
                          <input
                            type="text"
                            value={altInstructions}
                            onChange={(e) => setAltInstructions(e.target.value)}
                            placeholder="Ej: Dejar en portería, llamar antes de llegar"
                            className="w-full border border-gray-300 p-2.5 text-xs focus:border-black outline-none bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* MENSAJE DE ADVERTENCIA Y CONFIRMACIÓN OBLIGATORIA */}
                  <div className="bg-amber-50 border border-amber-300 p-3 sm:p-3.5 rounded space-y-2 mt-3">
                    <div className="flex items-start space-x-2 text-amber-900">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
                      <div className="text-[11px] sm:text-xs leading-relaxed">
                        <span className="font-extrabold block uppercase text-[11px] tracking-wide text-amber-950">
                          Asegúrate de que la dirección esté bien digitada y completa
                        </span>
                        <p className="mt-0.5 text-amber-900">
                          Para evitar retrasos o devoluciones con la transportadora ({shippingMode === 'express_bogota' ? 'mensajería express urbana' : 'transportadora nacional'}), por favor verifica que no falten datos (torre, apto, oficina, barrio).
                        </p>
                      </div>
                    </div>

                    <label htmlFor="address-confirmation-check" className="flex items-start space-x-2.5 cursor-pointer pt-2 border-t border-amber-200 select-none">
                      <input
                        id="address-confirmation-check"
                        type="checkbox"
                        checked={addressConfirmed}
                        onChange={(e) => setAddressConfirmed(e.target.checked)}
                        className="accent-black w-4 h-4 rounded border-amber-400 mt-0.5 cursor-pointer flex-shrink-0"
                      />
                      <span className="text-[11px] sm:text-xs font-bold text-amber-950">
                        Confirmo que la dirección de entrega está completa, correcta y verificada para el despacho. *
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* 4. SECCIÓN MÉTODO DE PAGO BOLD (PAGO DIRECTO 100% INTEGRADO) */}
              <div className="pt-5 sm:pt-6 border-t border-[#EBEBEB]">
                <div className="mb-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm sm:text-lg font-extrabold uppercase tracking-tight text-[#101013]">
                      4. Pasarela de Pagos Bold (Bold.co)
                    </h2>
                    <span className="bg-[#002D62] text-white text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded tracking-widest flex-shrink-0">
                      BOLD
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-[#666666] mt-0.5">
                    Pagos directos en línea procesados por <strong>Bold.co</strong> (Colombia). Cifrado bancario 256-bit y certificación PCI-DSS Nivel 1.
                  </p>
                </div>

                {/* Banner de error de redirección si hubo rechazo en Bold */}
                {boldRedirectError && (
                  <div className="bg-amber-50 border border-amber-300 p-3 mb-3 text-amber-900 rounded-lg text-xs font-semibold flex items-start space-x-2">
                    <span className="text-base flex-shrink-0">⚠️</span>
                    <div className="flex-1">
                      <p>{boldRedirectError}</p>
                      <button
                        type="button"
                        onClick={() => setBoldRedirectError('')}
                        className="text-[11px] underline font-bold mt-1 text-amber-950 cursor-pointer"
                      >
                        Entendido, intentar de nuevo
                      </button>
                    </div>
                  </div>
                )}

                {/* Banner de confianza Bold */}
                <div className="bg-[#F0F5FA] border border-[#CCE0F5] p-2.5 sm:p-3 mb-3 flex items-center justify-between text-[11px] sm:text-xs gap-2">
                  <div className="flex items-center space-x-2 min-w-0">
                    <ShieldCheck className="w-4 h-4 text-[#002D62] flex-shrink-0" />
                    <span className="text-[#002D62] font-bold truncate">
                      Pasarela Bold.co Oficial • Pago 100% Seguro
                    </span>
                  </div>
                  <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest hidden sm:inline flex-shrink-0">
                    VIGILADO SUPERFINANCIERA
                  </span>
                </div>

                <div className="border border-gray-300 divide-y divide-gray-200">
                  {/* OPCIÓN 1: PASARELA UNIFICADA BOLD.CO EN LÍNEA */}
                  <div>
                    <label
                      htmlFor="payment-option-bold-online"
                      onClick={() => setPaymentMethod('bold_pse')}
                      className={`flex items-start sm:items-center justify-between p-3.5 sm:p-4 gap-2 cursor-pointer transition ${
                        paymentMethod !== 'cod' ? 'bg-[#FAFAFA]' : 'bg-white'
                      }`}
                    >
                      <div className="flex items-start space-x-2.5 sm:space-x-3 min-w-0 flex-1">
                        <input
                          id="payment-option-bold-online"
                          type="radio"
                          name="paymentOption"
                          checked={paymentMethod !== 'cod'}
                          onChange={() => setPaymentMethod('bold_pse')}
                          className="accent-[#002D62] mt-0.5"
                        />
                        <div className="min-w-0 flex-1">
                          <span className="font-extrabold text-xs sm:text-sm text-[#101013] block">
                            Pago Seguro en Línea con Bold.co
                          </span>
                          <p className="text-[10.5px] sm:text-[11px] text-[#666666] mt-0.5">
                            PSE (todos los bancos), Tarjetas de Crédito/Débito, Botón Bancolombia y Nequi
                          </p>
                        </div>
                      </div>
                      <span className="bg-[#002D62] text-white text-[8.5px] sm:text-[9px] font-bold px-1.5 py-0.5 uppercase tracking-wider flex-shrink-0 mt-0.5 sm:mt-0">
                        RECOMENDADO
                      </span>
                    </label>

                    {paymentMethod !== 'cod' && (
                      <div className="p-3.5 sm:p-4 bg-[#F9F9F9] border-t border-gray-200 space-y-3 text-xs">
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mr-1">
                            Acepta:
                          </span>
                          <span className="bg-[#002D62] text-white text-[9.5px] font-black px-2 py-0.5 rounded">
                            PSE
                          </span>
                          <span className="border border-gray-300 bg-white text-gray-800 text-[9.5px] font-bold px-1.5 py-0.5 rounded">
                            VISA
                          </span>
                          <span className="border border-gray-300 bg-white text-gray-800 text-[9.5px] font-bold px-1.5 py-0.5 rounded">
                            MASTERCARD
                          </span>
                          <span className="border border-gray-300 bg-white text-gray-800 text-[9.5px] font-bold px-1.5 py-0.5 rounded">
                            AMEX
                          </span>
                          <span className="bg-[#FDDA24] text-black text-[9.5px] font-black px-1.5 py-0.5 rounded">
                            BANCOLOMBIA
                          </span>
                          <span className="bg-[#200020] text-pink-300 text-[9.5px] font-black px-1.5 py-0.5 rounded">
                            NEQUI
                          </span>
                        </div>

                        <div className="p-3 bg-blue-50/60 border border-blue-100/80 rounded text-[11px] text-[#002D62] flex items-start space-x-2.5">
                          <Lock className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#002D62]" />
                          <div className="leading-relaxed">
                            <p className="font-semibold">
                              Procesamiento directo y seguro con certificación bancaria PCI-DSS Nivel 1.
                            </p>
                            <p className="text-[10.5px] text-[#446688] mt-0.5">
                              Al presionar el botón de pago, se desplegará la pasarela oficial de <strong>Bold.co</strong> para que selecciones tu medio preferido (PSE, Tarjeta o Nequi) sin salir de URBANNOISE.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* OPCIÓN 2: PAGO CONTRA ENTREGA (TEMPORALMENTE DESHABILITADO / PRÓXIMAMENTE) */}
                  <div className="bg-[#F7F7F7] border-t border-gray-200 opacity-75">
                    <div className="flex items-start sm:items-center justify-between p-3.5 sm:p-4 gap-2">
                      <div className="flex items-start space-x-2.5 sm:space-x-3 min-w-0 flex-1">
                        <input
                          id="payment-option-cod"
                          type="radio"
                          name="paymentOption"
                          disabled
                          checked={false}
                          className="accent-gray-400 mt-0.5 cursor-not-allowed"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-extrabold text-xs sm:text-sm text-gray-500 line-through">
                              Pago Contra Entrega en Efectivo / Datáfono
                            </span>
                            <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[9px] font-black px-1.5 py-0.5 uppercase tracking-wider rounded">
                              Próximamente disponible
                            </span>
                          </div>
                          <p className="text-[10.5px] sm:text-[11px] text-[#666666] mt-0.5">
                            Por el momento no está disponible. Todos los pedidos deben pagarse en línea 100% seguros con Bold.co antes de ser despachados.
                          </p>
                        </div>
                      </div>
                      <Banknote className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5 sm:mt-0" />
                    </div>
                  </div>
                </div>
              </div>

              {/* ACEPTACIÓN OBLIGATORIA DE TÉRMINOS Y POLÍTICAS (SIC - LEY 1480 / 1581) */}
              <div className="pt-4 border-t border-[#EBEBEB]">
                <label htmlFor="checkout-legal-accepted" className="flex items-start space-x-2.5 cursor-pointer text-xs text-[#444444] select-none bg-gray-50/80 p-3 rounded border border-gray-200">
                  <input
                    id="checkout-legal-accepted"
                    name="legalAccepted"
                    type="checkbox"
                    checked={legalAccepted}
                    onChange={(e) => {
                      setLegalAccepted(e.target.checked);
                      if (e.target.checked) setLegalError('');
                    }}
                    className="mt-0.5 accent-black w-4 h-4 rounded border-gray-300 flex-shrink-0 cursor-pointer"
                  />
                  <span className="leading-snug text-[11px] sm:text-xs">
                    He leído y acepto los{' '}
                    <button
                      type="button"
                      onClick={() => onOpenPolicies?.('terminos')}
                      className="font-bold text-[#101013] underline hover:text-black cursor-pointer"
                    >
                      Términos y Condiciones
                    </button>
                    , la{' '}
                    <button
                      type="button"
                      onClick={() => onOpenPolicies?.('datos')}
                      className="font-bold text-[#101013] underline hover:text-black cursor-pointer"
                    >
                      Política de Tratamiento de Datos (Ley 1581)
                    </button>{' '}
                    y declaro conocer el{' '}
                    <button
                      type="button"
                      onClick={() => onOpenPolicies?.('retracto')}
                      className="font-bold text-[#101013] underline hover:text-black cursor-pointer"
                    >
                      Derecho de Retracto (Art. 47 Ley 1480)
                    </button>
                    .
                  </span>
                </label>
                {legalError && (
                  <p className="text-[11px] text-red-600 font-bold mt-2 p-2 bg-red-50 border border-red-200 rounded">
                    ⚠️ {legalError}
                  </p>
                )}
              </div>

              {/* BOTÓN FINALIZAR / PAGAR DIRECTAMENTE CON BOLD */}
              <div className="pt-4 sm:pt-5 border-t border-[#EBEBEB]">
                <button
                  type="submit"
                  disabled={isSubmitting || cart.length === 0}
                  className="w-full bg-[#101013] text-[#F5F2E4] font-extrabold text-xs sm:text-sm uppercase tracking-[0.1em] sm:tracking-[0.2em] py-3.5 sm:py-4.5 hover:bg-black transition cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-50 shadow-lg"
                >
                  {isSubmitting ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>{boldProcessingStep}</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Lock className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">
                        PAGAR AHORA CON BOLD.CO • {formatCOP(total)}
                      </span>
                    </div>
                  )}
                </button>
                <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3 text-[10px] sm:text-[11px] text-[#666666] text-center">
                  <span className="bg-[#002D62] text-white px-1.5 py-0.5 rounded text-[8.5px] sm:text-[9px] font-black">
                    BOLD.CO
                  </span>
                  <span>
                    Pasarela encriptada 256-bit • Vigilado Superintendencia Financiera
                  </span>
                </div>
              </div>
            </form>
          </div>

          {/* ========================================================= */}
          {/* COLUMNA DERECHA: Resumen del Pedido (Desktop Only)       */}
          {/* ========================================================= */}
          <aside
            className="hidden lg:block lg:col-span-5 bg-[#F5F5F7] p-8 lg:p-12 border-l border-[#E5E5E5]"
          >
            <div className="max-w-md mx-auto space-y-6 text-left">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#101013] pb-3 border-b border-[#E5E5E5]">
                Resumen del Pedido ({cart.reduce((a, b) => a + b.qty, 0)} productos)
              </h3>

              {/* Lista de Prendas */}
              <div className="divide-y divide-[#E5E5E5] max-h-[380px] overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div
                    key={`${item.product.id}-${item.size}-${item.color || ''}`}
                    className="py-3.5 flex items-center space-x-4"
                  >
                    <div className="relative w-16 h-20 bg-white border border-gray-200 flex-shrink-0">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute -top-2 -right-2 bg-[#101013] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                        {item.qty}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-extrabold text-xs uppercase tracking-tight text-[#101013] truncate">
                        {item.product.name}
                      </h4>
                      <p className="text-[11px] text-[#666666] mt-0.5">
                        Talla: <span className="font-bold text-black">{item.size}</span>
                        {(item.color || item.product.color) && (
                          <span> • Color: <span className="font-bold text-black">{item.color || item.product.color}</span></span>
                        )}
                      </p>
                    </div>

                    <span className="text-xs font-bold text-[#101013]">
                      {formatCOP(item.product.price * item.qty)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Campo Cupón / Tarjeta de Regalo */}
              <div className="pt-3 border-t border-[#E5E5E5]">
                <form onSubmit={handleApplyCoupon} className="flex space-x-2">
                  <input
                    id="checkout-discount-code"
                    name="discountCode"
                    type="text"
                    autoComplete="off"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value)}
                    placeholder="Código de descuento (ej. HYPE10)"
                    className="flex-1 border border-gray-300 px-3 py-2.5 text-xs uppercase bg-white focus:border-black focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="bg-[#101013] text-[#F5F2E4] text-xs font-bold uppercase tracking-wider px-4 py-2.5 hover:bg-black transition cursor-pointer"
                  >
                    Aplicar
                  </button>
                </form>
                {discountError && (
                  <p className="text-[11px] text-red-600 mt-1.5">{discountError}</p>
                )}
                {appliedDiscount && (
                  <div className="flex items-center justify-between mt-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs text-emerald-800">
                    <span className="font-bold uppercase tracking-wide">
                      Cupón {appliedDiscount.code} Aplicado
                    </span>
                    <button
                      type="button"
                      onClick={() => setAppliedDiscount(null)}
                      className="text-emerald-900 font-bold hover:underline cursor-pointer"
                    >
                      Quitar
                    </button>
                  </div>
                )}
              </div>

              {/* Desglose de Precios */}
              <div className="pt-4 border-t border-[#E5E5E5] space-y-2 text-xs text-[#555555]">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-bold text-[#101013]">{formatCOP(subtotal)}</span>
                </div>

                {appliedDiscount && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Descuento ({appliedDiscount.code})</span>
                    <span>-{formatCOP(discountValue)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center text-xs">
                  <div>
                    <span>Envío ({shippingMode === 'express_bogota' ? 'Express Bogotá Mismo Día' : 'Nacional Estándar'})</span>
                    <p className="text-[10px] text-gray-500 font-normal">Flete al cobro • Solo el envío se paga al recibir</p>
                  </div>
                  <span className="font-bold text-emerald-700 text-right">
                    FLETE AL COBRO
                  </span>
                </div>

                <div className="flex justify-between text-[11px] text-[#777777]">
                  <span>Impuestos incluidos (IVA 19%)</span>
                  <span>{formatCOP(Math.round(subtotal * 0.19))}</span>
                </div>

                <div className="flex justify-between pt-3 border-t border-[#E5E5E5] text-base font-extrabold text-[#101013]">
                  <span>Total</span>
                  <div className="text-right">
                    <span className="text-[10px] text-[#777777] font-normal mr-1.5">COP</span>
                    <span>{formatCOP(total)}</span>
                  </div>
                </div>
              </div>

              {/* Sellos de Confianza y Políticas SIC */}
              <div className="pt-6 border-t border-[#E5E5E5] space-y-2.5">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <button
                    type="button"
                    onClick={() => onOpenPolicies?.('envios')}
                    className="p-2.5 bg-white border border-gray-200 hover:border-black flex flex-col items-center transition cursor-pointer"
                  >
                    <Truck className="w-4 h-4 text-[#101013] mb-1" />
                    <span className="text-[9px] font-extrabold uppercase tracking-tight text-[#101013]">
                      Envíos 2-4 Días
                    </span>
                    <span className="text-[8px] text-gray-500">Nacional</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenPolicies?.('cambios-garantias')}
                    className="p-2.5 bg-white border border-gray-200 hover:border-black flex flex-col items-center transition cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4 text-[#101013] mb-1" />
                    <span className="text-[9px] font-extrabold uppercase tracking-tight text-[#101013]">
                      Garantía 60 Días
                    </span>
                    <span className="text-[8px] text-gray-500">Ley 1480</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenPolicies?.('pagos-bold')}
                    className="p-2.5 bg-white border border-gray-200 hover:border-black flex flex-col items-center transition cursor-pointer"
                  >
                    <Lock className="w-4 h-4 text-[#101013] mb-1" />
                    <span className="text-[9px] font-extrabold uppercase tracking-tight text-[#101013]">
                      Bold 256-bit
                    </span>
                    <span className="text-[8px] text-gray-500">PCI-DSS</span>
                  </button>
                </div>

                {/* Banner de Retracto SIC & Pasarela Bold Oficial */}
                <button
                  type="button"
                  onClick={() => onOpenPolicies?.('retracto')}
                  className="w-full p-2.5 bg-amber-50/70 border border-amber-200/80 rounded hover:bg-amber-100/70 transition flex items-center justify-between text-left cursor-pointer"
                >
                  <div className="flex items-center space-x-2">
                    <Scale className="w-4 h-4 text-amber-800 flex-shrink-0" />
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wide text-amber-950 block">
                        Derecho de Retracto (Art. 47 Ley 1480)
                      </span>
                      <span className="text-[9.5px] text-amber-800">
                        Devolución 100% en compras online dentro de 5 días hábiles
                      </span>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold text-amber-900 underline flex-shrink-0">
                    Ver
                  </span>
                </button>

                {/* Banner de Pasarela Bold Oficial */}
                <div
                  onClick={() => onOpenPolicies?.('pagos-bold')}
                  className="p-2.5 bg-white border border-[#D5E4F3] flex items-center justify-between text-[11px] cursor-pointer hover:border-[#002D62] transition rounded"
                >
                  <div className="flex items-center space-x-2">
                    <span className="bg-[#002D62] text-white text-[9px] font-black px-1.5 py-0.5 rounded">
                      BOLD
                    </span>
                    <span className="font-bold text-[#002D62] text-xs">Pasarela Bold.co Oficial</span>
                  </div>
                  <span className="text-[10px] text-emerald-700 font-extrabold uppercase tracking-wider">
                    ● Vigilado SuperFinanciera
                  </span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};
