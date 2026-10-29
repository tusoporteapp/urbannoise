import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  User,
  Lock,
  Mail,
  Phone,
  MapPin,
  FileText,
  Check,
  ShieldCheck,
  ArrowRight,
  LogOut,
  Sliders,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  Copy,
  Receipt,
  ShoppingBag,
  Eye,
  EyeOff,
  Store,
  ChevronRight,
  Heart,
  Trash2,
  AlertCircle,
  ZoomIn,
  X,
  RefreshCw,
  Maximize2,
  ExternalLink,
  Bell,
} from 'lucide-react';
import { Product, ProductSize } from '../types';
import { useWishlist, addToWishlist, PENDING_WISHLIST_KEY } from '../lib/wishlist';
import { INITIAL_PRODUCTS } from '../data/products';
import {
  getCustomerSession,
  saveCustomerSession,
  clearCustomerSession,
  clearAllAdminSessions,
  isUserAdminCredentials,
  setAdminAuthenticated,
  clearAdminToken,
  registerWebCustomer,
  loginWebCustomer,
  CustomerUser,
} from '../lib/loyverse';
import {
  getCustomerOrders,
  CustomerOrder,
  fetchCustomerOrdersFromServer,
  getCarrierTrackingUrl,
} from '../lib/customerOrders';
import { ServientregaTrackingModal } from './ServientregaTrackingModal';
import { formatCOP } from '../data/products';
import { trackEvent } from '../lib/analytics';

interface AccountViewProps {
  onBackToHome: () => void;
  onOpenAdmin: () => void;
  onOpenCatalog?: () => void;
  products?: Product[];
  onAddToCart?: (product: Product, size: ProductSize, qty?: number) => void;
  onQuickView?: (product: Product) => void;
  initialTab?: 'orders' | 'wishlist' | 'profile';
}

export const AccountView: React.FC<AccountViewProps> = ({
  onBackToHome,
  onOpenAdmin,
  onOpenCatalog,
  products,
  onAddToCart,
  onQuickView,
  initialTab = 'orders',
}) => {
  const [currentUser, setCurrentUser] = useState<CustomerUser | null>(getCustomerSession());
  const [pendingWishlistId, setPendingWishlistId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(PENDING_WISHLIST_KEY);
    } catch {
      return null;
    }
  });
  const [mode, setMode] = useState<'login' | 'register'>(() => {
    try {
      if (typeof window !== 'undefined' && (window.location.hash === '#registro' || localStorage.getItem(PENDING_WISHLIST_KEY))) {
        return 'register';
      }
    } catch {}
    return 'login';
  });
  const [activeTab, setActiveTab] = useState<'orders' | 'wishlist' | 'profile'>(initialTab);
  const [guestTab, setGuestTab] = useState<'auth' | 'wishlist'>('auth');

  // Hook de Lista de Deseos (Wishlist) reactiva con localStorage
  const { wishlist, removeFromWishlist, clearWishlist } = useWishlist();

  // Catálogo completo para resolver prendas guardadas
  const allCatalogProducts = products && products.length > 0 ? products : INITIAL_PRODUCTS;

  // Productos de la lista de deseos resueltos
  const wishlistProducts = React.useMemo(() => {
    return wishlist
      .map((id) => allCatalogProducts.find((p) => p.id === id || p.sku === id))
      .filter(Boolean) as Product[];
  }, [wishlist, allCatalogProducts]);

  // Garantizar que la pantalla inicie siempre arriba al abrir la vista de cuenta / registro
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    const timer = setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }, 30);
    return () => clearTimeout(timer);
  }, []);

  // Escuchar cambios de hash dinámicos (#registro, #login, #favoritos, #pedidos, #perfil)
  useEffect(() => {
    const handleHashChange = () => {
      if (typeof window !== 'undefined') {
        const h = window.location.hash;
        if (h === '#registro' || localStorage.getItem(PENDING_WISHLIST_KEY)) {
          setMode('register');
          window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        } else if (h === '#login') {
          setMode('login');
          window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        } else if (h === '#favoritos' || h === '#wishlist') {
          setActiveTab('wishlist');
          setGuestTab('wishlist');
          window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        } else if (h === '#pedidos' || h === '#orders') {
          setActiveTab('orders');
          window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        } else if (h === '#perfil' || h === '#profile') {
          setActiveTab('profile');
          window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        }
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Si se pasa initialTab desde afuera o si se requiere auth para wishlist
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
      if (initialTab === 'wishlist') {
        setGuestTab('wishlist');
      }
    }

    const handleWishlistReq = (e: any) => {
      setMode('register');
      const pId = e.detail?.productId || localStorage.getItem(PENDING_WISHLIST_KEY);
      setPendingWishlistId(pId);
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      });
    };

    window.addEventListener('urbannoise_require_auth_wishlist', handleWishlistReq);
    return () => window.removeEventListener('urbannoise_require_auth_wishlist', handleWishlistReq);
  }, [initialTab]);

  // Customer orders state
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [copiedTracking, setCopiedTracking] = useState<string | null>(null);
  const [trackingModalGuia, setTrackingModalGuia] = useState<string | null>(null);
  const [newlyDispatchedToast, setNewlyDispatchedToast] = useState<{
    orderNumber: string;
    guia: string;
    empresa: string;
  } | null>(null);
  const [isLoadingOrders, setIsLoadingOrders] = useState<boolean>(false);
  const [viewingGarmentImage, setViewingGarmentImage] = useState<{
    name: string;
    image: string;
    size?: string;
    price?: number;
    sku?: string;
    product?: Product;
  } | null>(null);

  // Form states
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [document, setDocument] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [city, setCity] = useState<string>('Bogotá, D.C.');
  const [address, setAddress] = useState<string>('');

  // Profile edit states
  const [editName, setEditName] = useState<string>('');
  const [editDocument, setEditDocument] = useState<string>('');
  const [editPhone, setEditPhone] = useState<string>('');
  const [editCity, setEditCity] = useState<string>('');
  const [editAddress, setEditAddress] = useState<string>('');

  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [honeypotTrap, setHoneypotTrap] = useState<string>('');
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);

  // Cargar sesión y pedidos al montar
  useEffect(() => {
    const session = getCustomerSession();
    const cleanEmail = (session?.email || '').toLowerCase().trim();
    const isAdmin = Boolean(
      session?.isAdmin ||
      cleanEmail === 'urban.noice@gmail.com' ||
      cleanEmail === 'urban.noice2023@gmail.com' ||
      cleanEmail === 'admin@urbannoise.co' ||
      cleanEmail === 'admin'
    );

    // Si el usuario es administrador, su pantalla es el CMS: abrirlo y salir de esta vista
    if (isAdmin) {
      setAdminAuthenticated(true);
      onOpenAdmin();
      onBackToHome();
      return;
    }

    setCurrentUser(session);
    setErrorMsg('');
    setSuccessMsg('');

    if (session) {
      const userOrders = getCustomerOrders(session.email);
      setOrders(userOrders);
      if (userOrders.length > 0) {
        setSelectedOrderId(userOrders[0].id);
      }
      setEditName(session.name || '');
      setEditDocument(session.document || '');
      setEditPhone(session.phone || '');
      setEditCity(session.city || 'Bogotá, D.C.');
      setEditAddress(session.address || '');

      // Sincronizar en vivo pedidos con Loyverse POS / Servidor
      setIsLoadingOrders(true);
      fetchCustomerOrdersFromServer(session, products || INITIAL_PRODUCTS)
        .then((freshOrders) => {
          if (freshOrders && freshOrders.length > 0) {
            setOrders(freshOrders);
            setSelectedOrderId((prev) => prev || freshOrders[0].id);
          }
        })
        .finally(() => setIsLoadingOrders(false));
    }
  }, []);

  // Escuchar evento de actualización de pedidos
  useEffect(() => {
    const handleOrdersUpdated = () => {
      const session = getCustomerSession();
      if (session) {
        setOrders(getCustomerOrders(session.email));
      }
    };
    window.addEventListener('urbannoise_orders_updated', handleOrdersUpdated);
    return () => window.removeEventListener('urbannoise_orders_updated', handleOrdersUpdated);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (honeypotTrap.trim().length > 0) return; // Anti-Spam
    setErrorMsg('');
    setSuccessMsg('');

    // 1. Modo Administrador con contraseña maestra
    if (isAdminMode) {
      if (!email.trim() || !password.trim()) {
        setErrorMsg('Por favor ingresa tu correo electrónico y contraseña de administrador.');
        return;
      }

      setIsLoading(true);
      const isAdmin = isUserAdminCredentials(email, password);

      if (isAdmin) {
        setAdminAuthenticated(true);
        const adminUser: CustomerUser = {
          name: 'Administrador URBANNOISE',
          email: email.trim(),
          isAdmin: true,
          createdAt: new Date().toISOString(),
        };
        saveCustomerSession(adminUser);
        setCurrentUser(adminUser);
        try {
          await loginAdminWithServer(password, email);
        } catch {}
        trackEvent('login', { method: 'admin_credentials' });
        setIsLoading(false);
        onOpenAdmin();
        onBackToHome();
        return;
      } else {
        setIsLoading(false);
        setErrorMsg('Contraseña o credenciales de administrador inválidas.');
        return;
      }
    }

    // 2. Modo Cliente: Acceso directo con solo Correo Electrónico (Passwordless)
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMsg('Por favor ingresa un correo electrónico válido para acceder a tu cuenta.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await loginWebCustomer(cleanEmail);
      if (!res.success || !res.customer) {
        setIsLoading(false);
        setErrorMsg(res.error || 'No encontramos ninguna cuenta con este correo. Por favor crea tu cuenta primero.');
        return;
      }

      const customer = res.customer;
      const cleanCustEmail = (customer.email || '').toLowerCase().trim();
      const isAdminLogin = Boolean(
        customer.isAdmin ||
        cleanCustEmail === 'urban.noice@gmail.com' ||
        cleanCustEmail === 'urban.noice2023@gmail.com'
      );

      if (isAdminLogin) {
        customer.isAdmin = true;
        setAdminAuthenticated(true);
        saveCustomerSession(customer);
        setCurrentUser(customer);
        setIsLoading(false);
        onOpenAdmin();
        onBackToHome();
        return;
      }

      saveCustomerSession(customer);
      setCurrentUser(customer);
      const userOrders = getCustomerOrders(customer.email);
      setOrders(userOrders);
      if (userOrders.length > 0) {
        setSelectedOrderId(userOrders[0].id);
      }
      // Sincronizar en vivo pedidos con Loyverse POS tras login
      setIsLoadingOrders(true);
      fetchCustomerOrdersFromServer(customer, products || INITIAL_PRODUCTS)
        .then((freshOrders) => {
          if (freshOrders && freshOrders.length > 0) {
            setOrders(freshOrders);
            setSelectedOrderId((prev) => prev || freshOrders[0].id);
          }
        })
        .finally(() => setIsLoadingOrders(false));

      setEditName(customer.name);
      setEditDocument(customer.document || '');
      setEditPhone(customer.phone || '');
      setEditCity(customer.city || 'Bogotá, D.C.');
      setEditAddress(customer.address || '');
      setIsLoading(false);
      setSuccessMsg('¡Sesión iniciada con éxito! Conectado a tu cuenta de compras.');
      trackEvent('login', { method: 'customer_email_passwordless' });

      // Si el usuario intentó guardar una prenda antes de autenticarse, añadirla de inmediato
      try {
        const pending = localStorage.getItem(PENDING_WISHLIST_KEY);
        if (pending) {
          addToWishlist(pending);
          localStorage.removeItem(PENDING_WISHLIST_KEY);
          setPendingWishlistId(null);
          setActiveTab('wishlist');
        }
      } catch {}

      window.scrollTo({ top: 0, behavior: 'instant' });
    } catch (err: any) {
      setIsLoading(false);
      setErrorMsg(err.message || 'Error al conectar con el servidor.');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (honeypotTrap.trim().length > 0) return; // Anti-Spam
    setErrorMsg('');
    setSuccessMsg('');

    const cleanName = name.trim();
    const cleanDoc = document.replace(/\D/g, '');
    const cleanPhone = phone.replace(/\D/g, '');
    const cleanAddress = address.trim();
    const cleanCity = city.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName || !cleanPhone || !cleanEmail) {
      setErrorMsg('Por favor completa los 3 campos obligatorios: Nombre, Correo y Celular.');
      return;
    }

    if (cleanName.length < 2) {
      setErrorMsg('Por favor ingresa tu Nombre y Apellido.');
      return;
    }

    if (cleanPhone.length < 7) {
      setErrorMsg('Por favor ingresa un número de WhatsApp / celular válido (mínimo 7 dígitos).');
      return;
    }

    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMsg('Por favor ingresa un correo electrónico válido.');
      return;
    }

    if (cleanDoc && (cleanDoc.length < 6 || cleanDoc.length > 12)) {
      setErrorMsg('Si ingresas tu cédula, debe tener entre 6 y 11 dígitos.');
      return;
    }

    setIsLoading(true);

    // Registro de cliente web sincronizado con Loyverse POS (Sin contraseñas para clientes)
    try {
      const regRes = await registerWebCustomer({
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        city: cleanCity || 'Bogotá, D.C.',
        address: cleanAddress,
        document: cleanDoc,
      });

      if (!regRes.success || !regRes.customer) {
        setIsLoading(false);
        setErrorMsg(regRes.error || 'No se pudo crear la cuenta de cliente.');
        return;
      }

      const newUser = regRes.customer;
      saveCustomerSession(newUser);
      setCurrentUser(newUser);
      setOrders(getCustomerOrders(newUser.email));
      setEditName(newUser.name);
      setEditDocument(newUser.document || cleanDoc);
      setEditPhone(newUser.phone || '');
      setEditCity(newUser.city || 'Bogotá, D.C.');
      setEditAddress(newUser.address || '');
      setIsLoading(false);
      trackEvent('sign_up', { method: 'customer_account_web_passwordless' });
      setSuccessMsg('¡Cuenta creada exitosamente! Tus pedidos y beneficios sumarán automáticamente a tu cuenta.');

      // Si el usuario intentó guardar una prenda antes de autenticarse, añadirla de inmediato
      try {
        const pending = localStorage.getItem(PENDING_WISHLIST_KEY);
        if (pending) {
          addToWishlist(pending);
          localStorage.removeItem(PENDING_WISHLIST_KEY);
          setPendingWishlistId(null);
          setActiveTab('wishlist');
        }
      } catch {}

      window.scrollTo({ top: 0, behavior: 'instant' });
    } catch (err: any) {
      setIsLoading(false);
      setErrorMsg(err.message || 'Error de conexión al registrar cliente.');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const updatedUser: CustomerUser = {
      ...currentUser,
      name: editName.trim() || currentUser.name,
      document: editDocument.trim() || currentUser.document,
      phone: editPhone.trim(),
      city: editCity.trim() || 'Bogotá, D.C.',
      address: editAddress.trim(),
    };

    saveCustomerSession(updatedUser);
    setCurrentUser(updatedUser);
    setSuccessMsg('¡Datos de envío y facturación actualizados con éxito!');

    // Sincronizar hacia Loyverse POS (actualiza nombre, teléfono, ciudad, dirección y nota)
    try {
      await registerWebCustomer({
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone || '',
        document: updatedUser.document,
        city: updatedUser.city,
        address: updatedUser.address,
      });
    } catch (syncErr) {
      console.warn('Error sincronizando perfil con Loyverse:', syncErr);
    }

    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleLogout = () => {
    clearAllAdminSessions();
    clearCustomerSession();
    clearAdminToken();
    setAdminAuthenticated(false);
    setCurrentUser(null);
    setOrders([]);
    setSelectedOrderId(null);
    setEmail('');
    setPassword('');
    onBackToHome();
  };

  const handleCopyTracking = (tracking: string) => {
    navigator.clipboard.writeText(tracking);
    setCopiedTracking(tracking);
    setTimeout(() => setCopiedTracking(null), 2000);
  };

  const selectedOrder = orders.find((o) => o.id === selectedOrderId) || orders[0];

  // Detección Inteligente de Despacho de Alta Escala (Decay Polling + Visibility API + Micro-Ping)
  useEffect(() => {
    if (!selectedOrder || selectedOrder.trackingNumber) return;

    let pollCount = 0;
    let timer: any = null;
    let isCancelled = false;

    const checkStatus = async () => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
      if (isCancelled) return;

      try {
        const orderIdClean = (selectedOrder.orderNumber || selectedOrder.id || '').replace(/^#/, '');
        if (!orderIdClean) return;

        const res = await fetch(`/api/orders/status-ping?orderId=${encodeURIComponent(orderIdClean)}`);
        if (!res.ok) return;
        const data = await res.json();

        if (data.s === 'DESPACHADO' && data.g) {
          // ¡Guía detectada en el servidor!
          setNewlyDispatchedToast({
            orderNumber: selectedOrder.orderNumber || selectedOrder.id,
            guia: data.g,
            empresa: data.c || 'Transportadora Nacional',
          });

          // Actualizar la lista de órdenes completa para reflejar los 3 pasos en verde
          if (currentUser?.email) {
            fetchCustomerOrdersFromServer(currentUser.email).then((fresh) => {
              if (fresh && fresh.length > 0) setOrders(fresh);
            });
          }
          return; // Detener permanentemente el polling para este cliente
        }
      } catch {
        // Silencioso
      }

      pollCount += 1;
      // Decay Polling:
      // Minutos 0 a 3: cada 45s (4 checks)
      // Minutos 3 a 10: cada 90s (5 checks)
      // Más de 10 minutos (pollCount >= 9): auto-apagado total (cero consumo)
      if (pollCount < 9 && !isCancelled) {
        const nextDelay = pollCount <= 4 ? 45000 : 90000;
        timer = setTimeout(checkStatus, nextDelay);
      }
    };

    // Iniciar primer timeout a los 45s
    timer = setTimeout(checkStatus, 45000);

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !isCancelled && !selectedOrder.trackingNumber) {
        checkStatus();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      isCancelled = true;
      if (timer) clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [selectedOrder?.id, selectedOrder?.trackingNumber, currentUser?.email]);

  // Renderizador unificado de la sección de Lista de Deseos
  const renderWishlistContent = () => {
    if (wishlistProducts.length === 0) {
      return (
        <div className="bg-white rounded-2xl border border-gray-200 p-10 sm:p-14 text-center space-y-4 max-w-xl mx-auto my-6 shadow-sm">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <Heart className="w-8 h-8 sm:w-10 sm:h-10 text-red-400" />
          </div>
          <h3 className="font-black text-base sm:text-lg uppercase text-[#101013] tracking-tight">
            Tu lista de deseos está vacía
          </h3>
          <p className="text-xs text-gray-500 leading-relaxed max-w-md mx-auto">
            Guarda tus prendas favoritas haciendo clic en el icono del corazón en cualquiera de nuestras colecciones para comprarlas cuando desees o recibir alertas de stock.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={onOpenCatalog || onBackToHome}
              className="px-6 py-3.5 bg-[#101013] text-[#F5F2E4] hover:bg-black font-extrabold text-xs uppercase tracking-widest rounded-lg transition cursor-pointer shadow-md inline-flex items-center space-x-2"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Explorar Catálogo de Ropa</span>
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Barra Superior de la Lista de Deseos */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-xl border border-gray-200 shadow-xs">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-1 rounded-md bg-red-50 text-red-500">
                <Heart className="w-4 h-4 fill-red-500" />
              </span>
              <h3 className="font-black text-sm sm:text-base uppercase tracking-tight text-[#101013]">
                Mis Prendas Guardadas ({wishlistProducts.length})
              </h3>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Los productos guardados se conservan en tu navegador. Si una prenda se agota en inventario, se marcará automáticamente como no disponible.
            </p>
          </div>

          <div className="flex items-center space-x-2 self-start sm:self-auto flex-shrink-0">
            <button
              type="button"
              onClick={clearWishlist}
              className="px-3.5 py-2 border border-gray-200 hover:border-red-300 hover:bg-red-50 text-gray-600 hover:text-red-700 text-xs font-bold uppercase tracking-wider rounded-lg transition flex items-center space-x-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Vaciar Lista</span>
            </button>
            {onOpenCatalog && (
              <button
                type="button"
                onClick={onOpenCatalog}
                className="px-4 py-2 bg-[#101013] hover:bg-black text-[#F5F2E4] text-xs font-bold uppercase tracking-wider rounded-lg transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Ver Más Prendas</span>
              </button>
            )}
          </div>
        </div>

        {/* Grid de Prendas de la Lista de Deseos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {wishlistProducts.map((p) => {
            // VERIFICACIÓN ESTRICTA DE DISPONIBILIDAD DE INVENTARIO
            const isOutOfStock =
              p.isPublished === false ||
              p.isAvailable === false ||
              (typeof p.stock === 'number' && p.stock <= 0);

            return (
              <div
                key={p.id}
                className={`group flex flex-col justify-between bg-white border rounded-xl overflow-hidden shadow-xs transition hover:shadow-md ${
                  isOutOfStock ? 'border-red-300/80 bg-red-50/10' : 'border-gray-200 hover:border-black'
                }`}
              >
                {/* Imagen del Producto */}
                <div className="relative aspect-[3/4] w-full bg-[#EBEBEB] overflow-hidden">
                  <img
                    src={p.image}
                    alt={p.name}
                    className={`w-full h-full object-cover transition duration-300 ${
                      isOutOfStock ? 'grayscale-[35%] opacity-80' : 'group-hover:scale-105'
                    }`}
                    loading="lazy"
                  />

                  {/* Badge de Disponibilidad: SI ESTÁ AGOTADO APARECE COMO NO DISPONIBLE */}
                  {isOutOfStock ? (
                    <div className="absolute top-2.5 left-2.5 z-10 bg-red-600 text-white text-[9.5px] font-black uppercase tracking-wider px-2.5 py-1 rounded shadow-md flex items-center space-x-1.5 animate-pulse">
                      <AlertCircle className="w-3 h-3" />
                      <span>NO DISPONIBLE</span>
                    </div>
                  ) : (
                    <div className="absolute top-2.5 left-2.5 z-10 bg-[#101013]/90 text-emerald-400 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded shadow backdrop-blur-xs flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>EN STOCK</span>
                    </div>
                  )}

                  {/* Botón para Quitar de la Wishlist */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromWishlist(p.id);
                    }}
                    title="Quitar de mi lista de deseos"
                    className="absolute top-2.5 right-2.5 z-20 w-8 h-8 rounded-full bg-white/95 backdrop-blur-md shadow-md flex items-center justify-center text-gray-500 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Información y Acciones */}
                <div className="p-4 flex flex-col justify-between flex-1 bg-white space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-[10px] font-mono text-gray-500 mb-1">
                      <span>{p.sku || `UN-${p.id.toUpperCase()}`}</span>
                      <span>{p.categoryLabel || 'STREETWEAR'}</span>
                    </div>
                    <h4 className="font-extrabold text-xs sm:text-sm uppercase text-[#101013] leading-snug line-clamp-1">
                      {p.name}
                    </h4>
                    <p className="font-black text-sm text-[#101013] mt-1">
                      {formatCOP(p.price)}
                    </p>
                  </div>

                  {/* Bloque Condicional Según Stock */}
                  {isOutOfStock ? (
                    <div className="space-y-2 pt-1 border-t border-red-100">
                      <div className="p-2 bg-red-50 border border-red-200 rounded text-[11px] text-red-700 flex items-start space-x-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-red-600 mt-0.5 flex-shrink-0" />
                        <span className="leading-tight">
                          Prenda agotada en inventario de bodega y tienda física.
                        </span>
                      </div>

                      <button
                        type="button"
                        disabled
                        className="w-full py-2.5 bg-gray-100 text-gray-400 font-extrabold text-[11px] uppercase tracking-wider rounded border border-gray-200 cursor-not-allowed text-center"
                      >
                        No Disponible para Compra
                      </button>

                      <a
                        href={`https://wa.me/573108720491?text=${encodeURIComponent(
                          `¡Hola URBANNOISE! Tengo en mi lista de deseos la prenda "${p.name}" (${p.sku || p.id}) pero figura agotada. ¿Tienen fecha estimada de reposición?`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full py-1 text-[11px] text-emerald-700 hover:text-emerald-800 font-bold uppercase tracking-wider flex items-center justify-center space-x-1 hover:underline text-center"
                      >
                        <span>Consultar reposición por WhatsApp</span>
                        <ChevronRight className="w-3 h-3" />
                      </a>
                    </div>
                  ) : (
                    <div className="space-y-2 pt-1 border-t border-gray-100">
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase text-gray-500">
                        <span>Agregar al Carrito:</span>
                        <span>Selecciona Talla</span>
                      </div>
                      <div className="grid grid-cols-4 gap-1">
                        {(['S', 'M', 'L', 'XL'] as ProductSize[]).map((sz) => (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => onAddToCart && onAddToCart(p, sz, 1)}
                            className="py-1.5 text-xs font-black border border-gray-300 hover:border-black hover:bg-[#101013] hover:text-[#F5F2E4] transition uppercase rounded text-center cursor-pointer active:scale-95"
                          >
                            {sz}
                          </button>
                        ))}
                      </div>

                      {onQuickView && (
                        <button
                          type="button"
                          onClick={() => onQuickView(p)}
                          className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-[#101013] font-bold text-xs uppercase tracking-wider rounded transition flex items-center justify-center space-x-1.5 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver Ficha y Medidas</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Protección: Si el usuario es administrador, no renderizar interfaz de cliente
  if (currentUser?.isAdmin || (currentUser?.email && isUserAdminCredentials(currentUser.email, ''))) {
    return null;
  }

  return (
    <div
      id="account-view"
      className="min-h-screen bg-[#FAFAFA] text-[#101013] flex flex-col pb-16 relative scroll-mt-[84px] sm:scroll-mt-[100px]"
      style={{ paddingTop: 'var(--app-header-height, 112px)' }}
    >
      {/* Anclas de accesibilidad e indexación */}
      <span id="registro" className="absolute top-0 pointer-events-none opacity-0 -translate-y-28" aria-hidden="true" />
      <span id="cuenta" className="absolute top-0 pointer-events-none opacity-0 -translate-y-28" aria-hidden="true" />
      <span id="login" className="absolute top-0 pointer-events-none opacity-0 -translate-y-28" aria-hidden="true" />
      
      {/* 1. Barra de Navegación Superior / Breadcrumbs de Página Completa */}
      <div
        className="bg-white border-b border-[#E5E5E5] sticky z-30 shadow-xs transition-[top] duration-150"
        style={{ top: 'var(--app-header-height, 112px)' }}
      >
        <div className="max-w-[1720px] mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between text-xs">
          <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-[#666666]">
            <button
              onClick={onBackToHome}
              className="hover:text-black transition-colors font-medium flex items-center space-x-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              <span>Inicio</span>
            </button>
            <span>/</span>
            <span className="font-extrabold uppercase tracking-wider text-[#101013]">
              {currentUser ? 'Portal de Cliente & Mis Pedidos' : 'Iniciar Sesión / Registro'}
            </span>
          </nav>

          <button
            onClick={onBackToHome}
            className="flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-[#101013] hover:opacity-70 transition cursor-pointer"
          >
            <span>Volver a la Tienda</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Notificaciones Globales */}
      {errorMsg && (
        <div className="max-w-[1720px] mx-auto px-4 sm:px-8 w-full mt-4">
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg font-medium shadow-xs">
            {errorMsg}
          </div>
        </div>
      )}
      {successMsg && (
        <div className="max-w-[1720px] mx-auto px-4 sm:px-8 w-full mt-4">
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg font-medium flex items-center space-x-2 shadow-xs">
            <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        </div>
      )}

      {/* 2. CONTENIDO PRINCIPAL: USUARIO AUTENTICADO vs PÁGINA COMPLETA DE LOGIN */}
      {currentUser ? (
        /* ======================================================== */
        /* VISTA PÁGINA COMPLETA: DASHBOARD DEL CLIENTE Y PEDIDOS  */
        /* ======================================================== */
        <div className="max-w-[1720px] mx-auto px-4 sm:px-8 w-full mt-6 space-y-6 flex-1">
          
          {/* Header del Perfil de Usuario */}
          <div className="bg-[#101013] text-[#F5F2E4] rounded-xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-start sm:items-center space-x-4 z-10">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white text-[#101013] flex items-center justify-center font-black text-lg sm:text-xl uppercase shadow-md flex-shrink-0">
                {currentUser.name
                  ? currentUser.name.split(' ').map((n) => n[0]).slice(0, 2).join('')
                  : 'CL'}
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-extrabold text-xl sm:text-2xl uppercase tracking-tight text-white">
                    {currentUser.name}
                  </h2>
                  <span className="bg-white/10 text-white/90 text-[10px] font-bold uppercase px-2.5 py-0.5 rounded tracking-wider">
                    Cliente Verificado
                  </span>
                  {currentUser.isAdmin && (
                    <span className="bg-amber-400 text-black text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-wider">
                      Admin
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-white/70 font-mono">
                  {currentUser.email} • {currentUser.city || 'Bogotá, Colombia'}
                </p>
                <p className="text-[11px] text-white/50">
                  Miembro de URBANNOISE Atelier • Envíos a toda Colombia
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1.5">
                  <span className="inline-flex items-center space-x-1.5 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded">
                    <Store className="w-3 h-3 text-emerald-400" />
                    <span>Cliente Verificado</span>
                  </span>
                  {currentUser.totalSpent !== undefined && currentUser.totalSpent > 0 && (
                    <span className="text-[10.5px] text-white/90 font-mono bg-white/10 px-2 py-0.5 rounded border border-white/10">
                      Compras Acumuladas: <strong>{formatCOP(currentUser.totalSpent)}</strong>
                    </span>
                  )}
                  {currentUser.totalVisits !== undefined && currentUser.totalVisits > 0 && (
                    <span className="text-[10.5px] text-white/90 font-mono bg-white/10 px-2 py-0.5 rounded border border-white/10">
                      {currentUser.totalVisits} {currentUser.totalVisits === 1 ? 'Compra Registrada' : 'Compras Registradas'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Acciones Rápidas */}
            <div className="flex flex-wrap items-center gap-2.5 z-10">
              {currentUser.isAdmin && (
                <button
                  type="button"
                  onClick={onOpenAdmin}
                  className="px-4 py-2.5 bg-white text-[#101013] hover:bg-gray-100 font-extrabold text-xs uppercase tracking-wider rounded-lg flex items-center space-x-2 transition cursor-pointer shadow"
                >
                  <Sliders className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Panel de Control</span>
                </button>
              )}
              {onOpenCatalog && (
                <button
                  type="button"
                  onClick={onOpenCatalog}
                  className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider rounded-lg flex items-center space-x-2 transition cursor-pointer"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Explorar Colección</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleLogout}
                className="px-4 py-2.5 border border-white/20 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-wider rounded-lg flex items-center space-x-2 transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>

          {/* Navegación por Pestañas del Dashboard */}
          <div className="flex items-center space-x-2 sm:space-x-6 border-b border-gray-200 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => {
                setActiveTab('orders');
                try {
                  window.history.replaceState(null, '', '#pedidos');
                } catch {}
              }}
              className={`pb-3 text-xs sm:text-sm font-extrabold uppercase tracking-wider border-b-2 transition flex items-center space-x-2 cursor-pointer flex-shrink-0 ${
                activeTab === 'orders'
                  ? 'border-[#101013] text-[#101013]'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Mis Pedidos ({orders.length})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('wishlist');
                try {
                  window.history.replaceState(null, '', '#favoritos');
                } catch {}
              }}
              className={`pb-3 text-xs sm:text-sm font-extrabold uppercase tracking-wider border-b-2 transition flex items-center space-x-2 cursor-pointer flex-shrink-0 ${
                activeTab === 'wishlist'
                  ? 'border-[#101013] text-[#101013]'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              <Heart className={`w-4 h-4 ${wishlistProducts.length > 0 ? 'fill-red-500 text-red-500' : ''}`} />
              <span>Lista de Deseos ({wishlistProducts.length})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('profile');
                try {
                  window.history.replaceState(null, '', '#perfil');
                } catch {}
              }}
              className={`pb-3 text-xs sm:text-sm font-extrabold uppercase tracking-wider border-b-2 transition flex items-center space-x-2 cursor-pointer flex-shrink-0 ${
                activeTab === 'profile'
                  ? 'border-[#101013] text-[#101013]'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>Libreta de Direcciones</span>
            </button>
          </div>

          {/* Contenido según pestaña seleccionada */}
          {activeTab === 'orders' ? (
            orders.length === 0 ? (
              isLoadingOrders ? (
                /* Estado Cargando */
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center space-y-4 max-w-xl mx-auto my-8">
                  <div className="w-10 h-10 border-3 border-black border-t-transparent rounded-full animate-spin mx-auto" />
                  <h3 className="font-extrabold text-base uppercase text-[#101013]">
                    Sincronizando tus pedidos con Loyverse...
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Consultando tu historial de compras y recibos en tiempo real.
                  </p>
                </div>
              ) : (
                /* Estado Vacío */
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center space-y-4 max-w-xl mx-auto my-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-400">
                    <ShoppingBag className="w-8 h-8" />
                  </div>
                  <h3 className="font-extrabold text-base uppercase text-[#101013]">
                    Aún no tienes pedidos registrados
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Realiza tu primera compra en nuestra tienda online para hacer seguimiento de guía, fechas estimadas de entrega y estados en tiempo real.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={onBackToHome}
                      className="px-6 py-3 bg-[#101013] text-[#F5F2E4] hover:bg-black font-extrabold text-xs uppercase tracking-widest rounded-lg transition cursor-pointer shadow"
                    >
                      Ir al Catálogo de Ropa
                    </button>
                    {currentUser && (
                      <button
                        type="button"
                        onClick={async () => {
                          setIsLoadingOrders(true);
                          try {
                            const fresh = await fetchCustomerOrdersFromServer(currentUser, products || INITIAL_PRODUCTS);
                            setOrders(fresh);
                            if (fresh.length > 0) setSelectedOrderId(fresh[0].id);
                          } finally {
                            setIsLoadingOrders(false);
                          }
                        }}
                        className="px-5 py-3 bg-gray-100 hover:bg-gray-200 text-[#101013] font-bold text-xs uppercase rounded-lg transition cursor-pointer flex items-center gap-1.5"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isLoadingOrders ? 'animate-spin' : ''}`} />
                        <span>Sincronizar Pedidos</span>
                      </button>
                    )}
                  </div>
                </div>
              )
            ) : (
              /* Lista y Detalle de Pedidos en Layout de Dos Columnas */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Columna Izquierda: Lista de Órdenes */}
                <div className="lg:col-span-4 space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-extrabold text-xs text-gray-500 uppercase tracking-wider">
                      Historial de Compras ({orders.length})
                    </h4>
                    {currentUser && (
                      <button
                        type="button"
                        onClick={async () => {
                          setIsLoadingOrders(true);
                          try {
                            const fresh = await fetchCustomerOrdersFromServer(currentUser, products || INITIAL_PRODUCTS);
                            setOrders(fresh);
                            if (fresh.length > 0 && !selectedOrderId) setSelectedOrderId(fresh[0].id);
                          } finally {
                            setIsLoadingOrders(false);
                          }
                        }}
                        className="text-[11px] text-gray-500 hover:text-black font-semibold flex items-center gap-1 cursor-pointer"
                        title="Actualizar pedidos desde el servidor"
                      >
                        <RefreshCw className={`w-3 h-3 ${isLoadingOrders ? 'animate-spin' : ''}`} />
                        <span>Actualizar</span>
                      </button>
                    )}
                  </div>

                  {orders.map((o) => {
                    const isSelected = selectedOrder?.id === o.id;
                    return (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() => setSelectedOrderId(o.id)}
                        className={`w-full text-left p-4 rounded-xl border transition cursor-pointer ${
                          isSelected
                            ? 'bg-white border-[#101013] shadow-md ring-2 ring-[#101013]/10'
                            : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-xs'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-sm text-[#101013]">
                            #{o.orderNumber}
                          </span>
                          <span
                            className={`text-[9.5px] font-black uppercase px-2 py-0.5 rounded border ${
                              o.status === 'ENTREGADO'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : o.status === 'EN_CAMINO'
                                ? 'bg-blue-50 text-blue-800 border-blue-300 animate-pulse'
                                : 'bg-amber-50 text-amber-800 border-amber-300'
                            }`}
                          >
                            {o.statusLabel}
                          </span>
                        </div>

                        <div className="mt-2 text-xs text-gray-500 font-mono flex items-center justify-between">
                          <span>{o.date}</span>
                          <span className="font-bold text-[#101013]">{formatCOP(o.totals.total)}</span>
                        </div>

                        <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-600">
                          <span>{o.items.length} prenda(s)</span>
                          <span className="text-emerald-700 font-medium">{o.trackingCompany}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Columna Derecha: Detalle Profundo de la Orden Seleccionada */}
                <div className="lg:col-span-8 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  {selectedOrder && (
                    <div>
                      {/* Cabecera de la Orden */}
                      <div className="p-6 border-b border-gray-200 bg-gray-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center space-x-3">
                            <h3 className="font-mono font-black text-lg text-[#101013]">
                              Orden #{selectedOrder.orderNumber}
                            </h3>
                            <span
                              className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded border flex items-center space-x-1 ${
                                selectedOrder.status === 'ENTREGADO'
                                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                  : selectedOrder.status === 'EN_CAMINO'
                                  ? 'bg-blue-100 text-blue-900 border-blue-300'
                                  : 'bg-amber-100 text-amber-900 border-amber-300'
                              }`}
                            >
                              {selectedOrder.status === 'ENTREGADO' ? (
                                <Check className="w-3.5 h-3.5" />
                              ) : (
                                <Truck className="w-3.5 h-3.5" />
                              )}
                              <span>{selectedOrder.statusLabel}</span>
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 font-mono mt-1">
                            Emitido: {selectedOrder.date} • Comprobante Digital #{selectedOrder.receiptNumber || selectedOrder.orderNumber}
                          </p>
                        </div>

                        <div className="text-left sm:text-right">
                          <span className="text-[11px] text-gray-500 block">Total Pagado:</span>
                          <span className="text-xl font-black text-[#101013]">
                            {formatCOP(selectedOrder.totals.total)}
                          </span>
                          <span className="text-[10px] text-emerald-700 font-bold block">
                            ● {selectedOrder.paymentMethod}
                          </span>
                        </div>
                      </div>

                      {/* Banner / Toast de Notificación en Vivo de Despacho (Alta Escala) */}
                      {newlyDispatchedToast && (
                        <div className="bg-emerald-600 text-white p-4 rounded-xl shadow-xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                              <Bell className="w-4 h-4 text-white animate-bounce" />
                            </div>
                            <div>
                              <p className="text-xs font-black uppercase tracking-wider">
                                ¡Buenas noticias! Tu paquete ya fue despachado
                              </p>
                              <p className="text-[11px] text-white/90 mt-0.5">
                                Transportadora: <strong>{newlyDispatchedToast.empresa}</strong> • Guía Oficial: <strong>#{newlyDispatchedToast.guia}</strong>
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setNewlyDispatchedToast(null)}
                            className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                            title="Cerrar aviso"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      {/* Tarjeta de Guía de Transporte */}
                      {selectedOrder.trackingNumber ? (
                        <div className="bg-[#101013] text-[#F5F2E4] p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-xl border border-white/10 shadow-lg">
                          <div className="flex items-center space-x-3.5">
                            <div className="w-10 h-10 rounded-lg bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center text-emerald-400 flex-shrink-0">
                              <Truck className="w-5 h-5" />
                            </div>
                            <div>
                              <span className="text-[10px] text-emerald-400 font-mono uppercase font-bold block">
                                {selectedOrder.trackingCompany || 'Transportadora Nacional Express'}
                              </span>
                              <div className="flex items-center space-x-2">
                                <span className="font-mono font-bold text-sm text-white">
                                  Guía: {selectedOrder.trackingNumber}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCopyTracking(selectedOrder.trackingNumber!)}
                                  className="p-1 text-white/60 hover:text-white transition cursor-pointer"
                                  title="Copiar guía de transporte"
                                >
                                  {copiedTracking === selectedOrder.trackingNumber ? (
                                    <span className="text-[10px] text-emerald-400 font-bold">¡Copiado!</span>
                                  ) : (
                                    <Copy className="w-4 h-4" />
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2.5">
                            <a
                              href={
                                selectedOrder.trackingUrl ||
                                getCarrierTrackingUrl(
                                  selectedOrder.trackingCompany || 'Servientrega',
                                  selectedOrder.trackingNumber || ''
                                )
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-lg transition flex items-center space-x-1.5 cursor-pointer shadow-md"
                              title="Abrir página oficial de rastreo de la transportadora"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>RASTREAR PEDIDO</span>
                            </a>

                            {selectedOrder.trackingCompany?.toLowerCase().includes('servientrega') && (
                              <button
                                type="button"
                                onClick={() => setTrackingModalGuia(selectedOrder.trackingNumber!)}
                                className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase rounded-lg transition flex items-center space-x-1 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Ver en Pantalla</span>
                              </button>
                            )}

                            {selectedOrder.estimatedDelivery && (
                              <div className="text-xs text-white/80 font-semibold bg-white/10 px-3 py-2 rounded-lg border border-white/10">
                                ⏱ {selectedOrder.estimatedDelivery}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-100 p-4 sm:p-5 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div className="flex items-start space-x-3">
                            <Truck className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <span className="font-extrabold text-xs uppercase text-amber-300 block">
                                Despacho Nacional Oficial • En alistamiento en atelier Bogotá
                              </span>
                              <p className="text-[11px] text-white/70 mt-0.5 leading-relaxed">
                                Tu compra está confirmada. En cuanto despachemos tu paquete a la transportadora, verás aquí tu número de guía y podrás rastrearlo en vivo en esta pantalla.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Línea de Tiempo de Rastreo / Timeline */}
                      <div className="p-6 sm:p-8 bg-white border-b border-gray-100">
                        <h4 className="font-extrabold text-xs text-[#101013] uppercase tracking-wider mb-6 flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span>Línea de Tiempo y Logística de Despacho</span>
                        </h4>

                        <div className="relative pl-7 sm:pl-9 space-y-7 before:content-[''] before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
                          {(selectedOrder.timeline || []).map((step, idx) => {
                            const isStepCompleted = Boolean(step.completed);
                            const isInProgress = step.status === 'in_progress' || (!isStepCompleted && (idx === 1 || step.title.toLowerCase().includes('preparaci')));

                            return (
                              <div key={idx} className="relative">
                                <div
                                  className={`absolute -left-7 sm:-left-9 top-0.5 w-6 h-6 rounded-full flex items-center justify-center border-2 ${
                                    isStepCompleted
                                      ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm'
                                      : isInProgress
                                      ? 'border-amber-500 bg-amber-500 text-white shadow-sm animate-pulse'
                                      : 'border-gray-300 bg-gray-100 text-gray-400'
                                  }`}
                                >
                                  {isStepCompleted ? (
                                    <Check className="w-3.5 h-3.5 text-white stroke-[3.5]" />
                                  ) : isInProgress ? (
                                    <Clock className="w-3 h-3 text-white" />
                                  ) : (
                                    <div className="w-2 h-2 rounded-full bg-gray-400" />
                                  )}
                                </div>

                                <div>
                                  <div className="flex flex-wrap items-center justify-between gap-1">
                                    <div className="flex items-center space-x-2">
                                      <h5
                                        className={`text-xs sm:text-sm font-extrabold uppercase tracking-tight ${
                                          isStepCompleted
                                            ? 'text-[#101013]'
                                            : isInProgress
                                            ? 'text-amber-800'
                                            : 'text-gray-400'
                                        }`}
                                      >
                                        {step.title}
                                      </h5>
                                      {isInProgress && (
                                        <span className="text-[9.5px] uppercase font-black bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded border border-amber-300">
                                          En Proceso
                                        </span>
                                      )}
                                    </div>
                                    <span
                                      className={`text-[11px] font-mono ${
                                        isStepCompleted
                                          ? 'text-gray-500 font-semibold'
                                          : isInProgress
                                          ? 'text-amber-600 font-bold'
                                          : 'text-gray-400 italic'
                                      }`}
                                    >
                                      {step.date}
                                    </span>
                                  </div>
                                  <p
                                    className={`text-xs mt-1 leading-relaxed ${
                                      isStepCompleted
                                        ? 'text-gray-600'
                                        : isInProgress
                                        ? 'text-amber-900/80 font-medium'
                                        : 'text-gray-400'
                                    }`}
                                  >
                                    {step.detail}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Desglose de Prendas */}
                      <div className="p-6 sm:p-8 bg-gray-50/60">
                        <h4 className="font-extrabold text-xs text-[#101013] uppercase tracking-wider mb-4 flex items-center space-x-2">
                          <ShoppingBag className="w-4 h-4 text-gray-500" />
                          <span>Prendas Adquiridas en esta Orden ({selectedOrder.items.length})</span>
                        </h4>

                        <div className="space-y-3">
                          {selectedOrder.items.map((item, idx) => {
                            const allCatalogProducts = products && products.length > 0 ? products : INITIAL_PRODUCTS;
                            const matchedProduct = allCatalogProducts.find(
                              (p) =>
                                p.id === item.id ||
                                p.loyverseItemId === item.id ||
                                p.name.toLowerCase() === (item.name || '').toLowerCase() ||
                                (item.sku && item.sku !== 'N/A' && p.sku === item.sku)
                            );
                            const resolvedImage = item.image || matchedProduct?.image || matchedProduct?.images?.[0] || 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=1200&auto=format&fit=crop';

                            return (
                              <div
                                key={idx}
                                className="flex items-center justify-between p-3.5 bg-white border border-gray-200 rounded-xl gap-3 hover:border-gray-400 transition shadow-xs"
                              >
                                <div className="flex items-center space-x-3.5 min-w-0">
                                  {/* Thumbnail interactivo con zoom */}
                                  <div
                                    onClick={() => setViewingGarmentImage({
                                      name: item.name,
                                      image: resolvedImage,
                                      size: item.size,
                                      price: item.price,
                                      sku: item.sku,
                                      product: matchedProduct,
                                    })}
                                    className="relative group cursor-pointer w-14 h-16 sm:w-16 sm:h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200 hover:border-[#101013] transition"
                                    title="Haz clic para ver la foto en grande"
                                  >
                                    <img
                                      src={resolvedImage}
                                      alt={item.name}
                                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                      <ZoomIn className="w-5 h-5 text-white drop-shadow" />
                                    </div>
                                  </div>

                                  <div className="min-w-0">
                                    <button
                                      type="button"
                                      onClick={() => setViewingGarmentImage({
                                        name: item.name,
                                        image: resolvedImage,
                                        size: item.size,
                                        price: item.price,
                                        sku: item.sku,
                                        product: matchedProduct,
                                      })}
                                      className="text-left font-bold text-xs sm:text-sm uppercase text-[#101013] hover:text-[#9e8265] transition line-clamp-1 cursor-pointer flex items-center gap-1.5"
                                      title="Haz clic para ver la foto en grande"
                                    >
                                      <span>{item.name}</span>
                                      <ZoomIn className="w-3.5 h-3.5 text-gray-400 group-hover:text-black flex-shrink-0" />
                                    </button>

                                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-500 font-mono mt-1">
                                      {item.size && (
                                        <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-800 font-bold">
                                          Talla: {item.size}
                                        </span>
                                      )}
                                      <span>Cantidad: {item.qty}</span>
                                      {item.sku && item.sku !== 'N/A' && <span>• SKU: {item.sku}</span>}
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => setViewingGarmentImage({
                                        name: item.name,
                                        image: resolvedImage,
                                        size: item.size,
                                        price: item.price,
                                        sku: item.sku,
                                        product: matchedProduct,
                                      })}
                                      className="inline-flex items-center gap-1 text-[11px] text-gray-500 hover:text-black font-semibold underline mt-1.5 cursor-pointer"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                      <span>Ver Foto de la Prenda</span>
                                    </button>
                                  </div>
                                </div>

                                <div className="text-right flex-shrink-0">
                                  <span className="font-extrabold text-sm text-[#101013]">
                                    {formatCOP(item.price * item.qty)}
                                  </span>
                                  {item.qty > 1 && (
                                    <span className="text-[10px] text-gray-500 block font-mono">
                                      {formatCOP(item.price)} c/u
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Desglose de Totales */}
                        <div className="mt-6 pt-4 border-t border-gray-200 text-xs sm:text-sm space-y-2 text-gray-600">
                          <div className="flex justify-between">
                            <span>Subtotal Prendas:</span>
                            <span className="font-mono text-gray-900 font-bold">{formatCOP(selectedOrder.totals.subtotal)}</span>
                          </div>
                          <div className="flex justify-between items-center text-gray-700">
                            <div>
                              <span className="font-medium text-[#101013]">Servicio de Transporte / Envío:</span>
                              <p className="text-[10px] text-gray-500 font-normal">
                                {selectedOrder.trackingCompany || 'Servientrega / Inter Rapidísimo'} • Flete al cobro
                              </p>
                            </div>
                            <span className="font-bold text-[#101013] text-right text-xs uppercase tracking-tight bg-gray-100 px-2.5 py-1 rounded border border-gray-200">
                              Contra Entrega (Pagas al recibir)
                            </span>
                          </div>
                          <div className="flex justify-between text-base font-black text-[#101013] pt-2 border-t border-gray-200">
                            <span>Total Cancelado (COP):</span>
                            <span>{formatCOP(selectedOrder.totals.total)}</span>
                          </div>
                        </div>

                        {/* Dirección de Entrega Registrada */}
                        <div className="mt-5 p-3.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-600 flex items-start space-x-2.5">
                          <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="font-bold text-[#101013] block">Destino de Entrega:</span>
                            <span>
                              {selectedOrder.shippingAddress.name} • {selectedOrder.shippingAddress.address}, {selectedOrder.shippingAddress.city} • Tel: {selectedOrder.shippingAddress.phone}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            )
          ) : activeTab === 'wishlist' ? (
            /* ======================================================== */
            /* PESTAÑA: LISTA DE DESEOS                                */
            /* ======================================================== */
            renderWishlistContent()
          ) : (
            /* ======================================================== */
            /* PESTAÑA: LIBRETA DE DIRECCIONES Y DATOS DE ENVÍO         */
            /* ======================================================== */
            <div className="bg-white border border-gray-200 rounded-xl p-6 sm:p-10 max-w-2xl shadow-xs">
              <h3 className="font-extrabold text-base uppercase text-[#101013] mb-1">
                Datos de Envío y Contacto
              </h3>
              <p className="text-xs text-gray-500 mb-6 leading-relaxed">
                Estos datos se utilizarán para prellenar automáticamente tus próximos pedidos y generar las guías de transporte nacional.
              </p>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label htmlFor="profile-name" className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Nombre Completo del Destinatario
                  </label>
                  <input
                    id="profile-name"
                    name="fullName"
                    type="text"
                    autoComplete="name"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3.5 py-3 bg-white border border-gray-300 rounded-lg text-xs text-gray-900 focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                  />
                </div>

                <div>
                  <label htmlFor="profile-document" className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Cédula / Documento de Identidad (C.C. / NIT)
                  </label>
                  <input
                    id="profile-document"
                    name="documentId"
                    type="text"
                    value={editDocument}
                    onChange={(e) => setEditDocument(e.target.value)}
                    placeholder="Ej: 1028492019"
                    className="w-full px-3.5 py-3 bg-white border border-gray-300 rounded-lg text-xs text-gray-900 focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                  />
                </div>

                <div>
                  <label htmlFor="profile-email" className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Correo Electrónico (Asociado a tu cuenta)
                  </label>
                  <input
                    id="profile-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    disabled
                    value={currentUser.email}
                    className="w-full px-3.5 py-3 bg-gray-100 border border-gray-200 rounded-lg text-xs text-gray-500 font-mono cursor-not-allowed"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="profile-phone" className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-1">
                      Teléfono / WhatsApp
                    </label>
                    <input
                      id="profile-phone"
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="312 458 9210"
                      className="w-full px-3.5 py-3 bg-white border border-gray-300 rounded-lg text-xs text-gray-900 focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                    />
                  </div>
                  <div>
                    <label htmlFor="profile-city" className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-1">
                      Ciudad y Departamento
                    </label>
                    <input
                      id="profile-city"
                      name="city"
                      type="text"
                      autoComplete="address-level2"
                      value={editCity}
                      onChange={(e) => setEditCity(e.target.value)}
                      placeholder="Bogotá, D.C."
                      className="w-full px-3.5 py-3 bg-white border border-gray-300 rounded-lg text-xs text-gray-900 focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="profile-address" className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Dirección Completa de Despacho (Calle, Carrera, Apto, Edificio)
                  </label>
                  <input
                    id="profile-address"
                    name="address"
                    type="text"
                    autoComplete="street-address"
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    placeholder="Calle 85 # 14-26, Apt 402, Chapinero"
                    className="w-full px-3.5 py-3 bg-white border border-gray-300 rounded-lg text-xs text-gray-900 focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3.5 bg-[#101013] text-[#F5F2E4] hover:bg-black font-extrabold text-xs uppercase tracking-widest rounded-lg transition cursor-pointer shadow-md"
                  >
                    Guardar Datos de Envío
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>
      ) : (
        /* ======================================================== */
        /* VISTA PÁGINA COMPLETA: INICIO DE SESIÓN / REGISTRO      */
        /* ======================================================== */
        <div className="max-w-[1720px] mx-auto px-4 sm:px-8 w-full mt-6 flex-1 flex flex-col justify-center">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 max-w-5xl mx-auto w-full my-4">
            
            {/* Columna Izquierda: Showcase Editorial de Marca URBANNOISE */}
            <div className="lg:col-span-5 bg-[#0D0D10] text-[#F5F2E4] p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute inset-0 bg-cover bg-center opacity-25 mix-blend-luminosity pointer-events-none" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=800&auto=format&fit=crop')` }} />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D10] via-[#0D0D10]/80 to-transparent pointer-events-none" />

              <div className="relative z-10 space-y-4">
                <div className="inline-flex items-center space-x-2 bg-white/10 border border-white/20 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase">
                  <span>ии URBANNOISE ATELIER</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white leading-tight">
                  TU CUENTA.<br />TUS PEDIDOS.<br />TU ESTILO.
                </h2>
                <p className="text-xs text-white/70 leading-relaxed">
                  Inicia sesión para hacer seguimiento en tiempo real de tus envíos nacionales, gestionar direcciones y acceder a los últimos drops de streetwear en Bogotá.
                </p>
              </div>

              {/* Beneficios de la Cuenta */}
              <div className="relative z-10 my-8 space-y-3 pt-6 border-t border-white/10">
                <div className="flex items-start space-x-3 text-xs">
                  <Truck className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-bold text-white block">Rastreo de Envíos Nacionales</span>
                    <span className="text-[11px] text-white/60">Transportadora oficial con número de guía en tiempo real.</span>
                  </div>
                </div>

                <div className="flex items-start space-x-3 text-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-bold text-white block">Pagos 100% Protegidos</span>
                    <span className="text-[11px] text-white/60">Comprobante de compra y certificación oficial de entrega.</span>
                  </div>
                </div>

                <div className="flex items-start space-x-3 text-xs">
                  <Store className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-bold text-white block">Confección Colombiana</span>
                    <span className="text-[11px] text-white/60">Algodón de alto gramaje con despacho desde Bogotá.</span>
                  </div>
                </div>
              </div>

              <div className="relative z-10 text-[10px] text-white/40 font-mono">
                URBANNOISE CLOTHING • BOGOTÁ, COLOMBIA
              </div>
            </div>

            {/* Columna Derecha: Formulario de Login / Registro */}
            <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center bg-white">
              {/* Banner Informativo si se intentó agregar a la Lista de Deseos sin cuenta */}
              {pendingWishlistId && (
                <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start space-x-3 text-amber-950 shadow-xs">
                  <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-red-500 flex-shrink-0 mt-0.5">
                    <Heart className="w-4 h-4 fill-red-500" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-extrabold text-xs uppercase tracking-tight text-[#101013]">
                      Registro Obligatorio para tu Lista de Deseos
                    </h4>
                    <p className="text-[11px] text-gray-600 mt-0.5 leading-relaxed">
                      El registro es obligatorio para guardar prendas en tu lista de deseos. Crea tu cuenta o inicia sesión y la prenda seleccionada se guardará automáticamente en tu perfil.
                    </p>
                  </div>
                </div>
              )}

              {/* Selector de Pestañas: Iniciar Sesión / Crear Cuenta */}
              <div className="flex border-b border-gray-200 mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setIsAdminMode(false);
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className={`flex-1 pb-3 text-xs sm:text-sm font-extrabold uppercase tracking-wider border-b-2 transition cursor-pointer text-center ${
                    mode === 'login'
                      ? 'border-[#101013] text-[#101013]'
                      : 'border-transparent text-gray-400 hover:text-gray-700'
                  }`}
                >
                  Iniciar Sesión
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setIsAdminMode(false);
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className={`flex-1 pb-3 text-xs sm:text-sm font-extrabold uppercase tracking-wider border-b-2 transition cursor-pointer text-center ${
                    mode === 'register'
                      ? 'border-[#101013] text-[#101013]'
                      : 'border-transparent text-gray-400 hover:text-gray-700'
                  }`}
                >
                  Crear Cuenta Nueva
                </button>
              </div>

              {/* Formularios */}
              {mode === 'login' ? (
                /* Formulario Login */
                <form onSubmit={handleLogin} className="space-y-4">
                  {isAdminMode && (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center justify-between text-amber-900 text-xs mb-3">
                      <div className="flex items-center space-x-2">
                        <Lock className="w-4 h-4 text-amber-700" />
                        <span className="font-bold">Modo Administrador</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAdminMode(false);
                          setErrorMsg('');
                        }}
                        className="text-[11px] text-amber-900 underline font-semibold hover:text-black cursor-pointer"
                      >
                        ← Volver a clientes
                      </button>
                    </div>
                  )}

                  <div>
                    <label htmlFor="login-account-identifier" className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-1 flex items-center justify-between">
                      <span>{isAdminMode ? 'Correo de Administrador' : 'Correo Electrónico de tu Cuenta'}</span>
                      <span className="text-[10px] text-emerald-700 font-bold lowercase">
                        {isAdminMode ? 'acceso maestro' : 'acceso directo'}
                      </span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="login-account-identifier"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        placeholder="tucorreo@ejemplo.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-3.5 py-3 bg-white border border-gray-300 rounded-lg text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                      />
                    </div>
                    {!isAdminMode && (
                      <p className="mt-1.5 text-[11px] text-gray-500 flex items-center space-x-1">
                        <span>🔒 Accede directamente sin contraseñas para ver tus pedidos y guías oficiales.</span>
                      </p>
                    )}
                  </div>

                  {isAdminMode && (
                    <div>
                      <label htmlFor="login-account-password" className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-1">
                        Contraseña Maestra de Administrador
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          id="login-account-password"
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="current-password"
                          required
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full pl-10 pr-10 py-3 bg-white border border-gray-300 rounded-lg text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Honeypot Anti-Spam */}
                  <input
                    id="login-account-trap"
                    type="text"
                    name="_account_trap"
                    tabIndex={-1}
                    autoComplete="off"
                    value={honeypotTrap}
                    onChange={(e) => setHoneypotTrap(e.target.value)}
                    className="hidden opacity-0 pointer-events-none absolute -left-[9999px]"
                    aria-hidden="true"
                  />

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 bg-[#101013] text-[#F5F2E4] hover:bg-black font-extrabold text-xs uppercase tracking-widest rounded-lg transition cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-60 shadow-md mt-2"
                  >
                    <span>{isLoading ? 'Verificando...' : (isAdminMode ? 'Entrar al Panel Admin' : 'Entrar a mi Cuenta')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  {!isAdminMode && (
                    <div className="pt-3 border-t border-gray-100 flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setIsAdminMode(true);
                          setErrorMsg('');
                        }}
                        className="text-[10px] text-gray-400 hover:text-black uppercase tracking-wider font-semibold transition cursor-pointer"
                      >
                        ¿Acceso Administrador?
                      </button>
                    </div>
                  )}
                </form>
              ) : (
                /* Formulario Registro Ultrarrápido y Sencillo (Sin contraseña) */
                <form onSubmit={handleRegister} className="space-y-3.5">
                  <div className="p-3 bg-emerald-50 border border-emerald-200/80 rounded-lg text-emerald-900 text-xs flex items-center space-x-2">
                    <span className="font-bold">✨ Acceso sin contraseñas:</span>
                    <span>Tu correo electrónico es tu llave única para acceder a tu historial de compras y guías de envío.</span>
                  </div>

                  <div>
                    <label htmlFor="register-account-name" className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-1">
                      Nombre y Apellido *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="register-account-name"
                        name="fullName"
                        type="text"
                        autoComplete="name"
                        required
                        placeholder="Ej: Daniel Rodríguez"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="register-account-email" className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-1">
                        Correo Electrónico *
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          id="register-account-email"
                          name="email"
                          type="email"
                          autoComplete="email"
                          required
                          placeholder="tucorreo@ejemplo.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="register-account-phone" className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-1">
                        WhatsApp / Celular *
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          id="register-account-phone"
                          name="phone"
                          type="tel"
                          autoComplete="tel"
                          required
                          placeholder="312 458 9210"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Datos de Envío y Facturación (Guardados en Loyverse POS) */}
                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-[10px] text-gray-700 uppercase tracking-wider font-bold mb-2 flex items-center justify-between">
                      <span>Datos de Envío y Facturación (Opcionales)</span>
                      <span className="text-emerald-700 font-semibold text-[10px]">Guardado en tu perfil</span>
                    </p>

                    <div className="space-y-2.5 bg-gray-50/60 p-3 rounded-lg border border-gray-100">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label htmlFor="register-account-document" className="block text-[10px] font-bold text-gray-600 mb-1">
                            Cédula (C.C. / NIT)
                          </label>
                          <div className="relative">
                            <FileText className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                              id="register-account-document"
                              name="documentId"
                              type="text"
                              placeholder="Ej: 1028394829"
                              value={document}
                              onChange={(e) => setDocument(e.target.value.replace(/\D/g, ''))}
                              className="w-full pl-8 pr-3 py-2 bg-white border border-gray-200 rounded-md text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-black font-mono"
                            />
                          </div>
                        </div>

                        <div>
                          <label htmlFor="register-account-city" className="block text-[10px] font-bold text-gray-600 mb-1">
                            Ciudad de entrega
                          </label>
                          <input
                            id="register-account-city"
                            name="city"
                            type="text"
                            autoComplete="address-level2"
                            placeholder="Bogotá, D.C."
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-black"
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="register-account-address" className="block text-[10px] font-bold text-gray-600 mb-1">
                          Dirección de despacho
                        </label>
                        <div className="relative">
                          <MapPin className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            id="register-account-address"
                            name="address"
                            type="text"
                            autoComplete="street-address"
                            placeholder="Calle, Carrera, Apto, Casa o Conjunto"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            className="w-full pl-8 pr-3 py-2 bg-white border border-gray-200 rounded-md text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-black"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Honeypot Anti-Spam */}
                  <input
                    id="register-account-trap"
                    type="text"
                    name="_account_reg_trap"
                    tabIndex={-1}
                    autoComplete="off"
                    value={honeypotTrap}
                    onChange={(e) => setHoneypotTrap(e.target.value)}
                    className="hidden opacity-0 pointer-events-none absolute -left-[9999px]"
                    aria-hidden="true"
                  />

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full mt-2 py-3.5 bg-[#101013] text-[#F5F2E4] hover:bg-black font-extrabold text-xs uppercase tracking-widest rounded-lg transition cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-60 shadow-md"
                  >
                    <span>{isLoading ? 'Creando cuenta...' : 'Crear mi Cuenta Oficial'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}

            </div>
          </div>
        </div>
      )}

      {/* Lightbox / Visor de Foto de la Prenda Adquirida */}
      {viewingGarmentImage && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#14151D] border border-white/20 rounded-2xl max-w-md w-full overflow-hidden text-white shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="relative aspect-square bg-black flex items-center justify-center overflow-hidden">
              <img
                src={viewingGarmentImage.image}
                alt={viewingGarmentImage.name}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => setViewingGarmentImage(null)}
                className="absolute top-3 right-3 bg-black/70 hover:bg-black text-white p-2 rounded-full backdrop-blur-sm transition cursor-pointer"
                title="Cerrar visor"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#D9C4AB]">
                  URBANNOISE ATELIER • FOTO OFICIAL DE LA PRENDA
                </span>
                <h3 className="text-base sm:text-lg font-black uppercase text-[#F5F2E4] mt-1">
                  {viewingGarmentImage.name}
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                {viewingGarmentImage.size && (
                  <span className="bg-white/10 text-white font-mono font-bold px-2.5 py-1 rounded">
                    Talla {viewingGarmentImage.size}
                  </span>
                )}
                {viewingGarmentImage.price && (
                  <span className="bg-[#D9C4AB] text-[#101013] font-mono font-black px-2.5 py-1 rounded">
                    {formatCOP(viewingGarmentImage.price)}
                  </span>
                )}
                {viewingGarmentImage.sku && viewingGarmentImage.sku !== 'N/A' && (
                  <span className="text-white/40 font-mono text-[11px]">
                    SKU: {viewingGarmentImage.sku}
                  </span>
                )}
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-white/10">
                {viewingGarmentImage.product && onQuickView ? (
                  <button
                    type="button"
                    onClick={() => {
                      const p = viewingGarmentImage.product!;
                      setViewingGarmentImage(null);
                      onQuickView(p);
                    }}
                    className="text-xs text-[#D9C4AB] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <span>Ver prenda en catálogo</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : <div />}

                <button
                  type="button"
                  onClick={() => setViewingGarmentImage(null)}
                  className="px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase rounded transition cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Visor Oficial Integrado de Servientrega */}
      <ServientregaTrackingModal
        isOpen={Boolean(trackingModalGuia)}
        onClose={() => setTrackingModalGuia(null)}
        trackingNumber={trackingModalGuia || ''}
        orderNumber={selectedOrder?.orderNumber}
      />

    </div>
  );
};
