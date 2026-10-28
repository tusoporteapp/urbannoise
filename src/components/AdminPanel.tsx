import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Lock,
  RefreshCw,
  Upload,
  Image as ImageIcon,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  Save,
  Search,
  Database,
  Sliders,
  Send,
  Terminal,
  ExternalLink,
  Layers,
  Sparkles,
  Trash2,
  Plus,
  ArrowRight,
  ShieldCheck,
  Store,
  Tag,
  Box,
  Copy,
  CreditCard,
  Receipt,
  CheckCircle2,
  Shield,
  ShoppingBag,
  LayoutDashboard,
  Package,
  Boxes,
  Users,
  Percent,
  Settings,
  LogOut,
  Mail,
  Download,
  ArrowLeft,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  ChevronRight,
  Clock,
  CheckCircle,
  Filter,
  Video,
  Film,
  Calendar,
  CalendarDays,
  BarChart3,
  FileSpreadsheet,
  LayoutTemplate,
  MapPin,
  Truck,
  Share2,
  ChevronDown,
  ChevronUp,
  Maximize2,
} from 'lucide-react';
import { Product, ProductCustomization, LoyverseItem, ProductSize, CategoryCardContent } from '../types';
import { getStoredSiteContent } from '../lib/siteContent';
import { formatCOP } from '../data/products';
import {
  getLoyverseStatus,
  configureLoyverseToken,
  syncLoyverseCatalog,
  executeLoyverseProxy,
  getStoredCustomizations,
  saveProductCustomization,
  deleteProductCustomization,
  isAdminAuthenticated,
  setAdminAuthenticated,
  isUserAdminCredentials,
  loginAdminWithServer,
  clearAdminToken,
  clearCustomerSession,
  clearAllAdminSessions,
  getAdminHeaders,
  fetchLoyverseReceipts,
  fetchLoyverseCustomers,
  createLoyverseCustomer,
  deleteLoyverseCustomer,
  fetchLoyverseDiscounts,
  createLoyverseDiscount,
  deleteLoyverseDiscount,
  fetchLoyverseEmployees,
  fetchLoyversePaymentTypes,
  adjustLoyverseInventory,
  createLoyverseItem,
} from '../lib/loyverse';
import {
  getBoldConfig,
  configureBoldCredentials,
} from '../lib/bold';
import {
  getGitHubConfig,
  saveGitHubConfig,
  testGitHubConnection,
  uploadImageToGitHub,
  uploadProductVideoToGitHub,
  prepareVideoForWeb,
  saveCatalogToGitHub,
  isGitHubConfigured,
  GitHubConfig,
  downloadAICatalogJson,
  generateAICatalog,
  downloadAISystemPromptTxt,
  generateAISystemPrompt,
} from '../lib/githubStorage';
import { GitBranch, Globe, CloudLightning, FileCode2, Bot, Code2, FileText, CheckCheck } from 'lucide-react';
import { isYouTubeUrl, getYouTubeEmbedUrl, getYouTubeThumbnail } from '../lib/videoUtils';
import { ServientregaTrackingModal } from './ServientregaTrackingModal';
import { getCustomerOrders, saveCustomerOrders, CARRIER_OPTIONS, getCarrierTrackingUrl } from '../lib/customerOrders';
import { SiteContentEditor } from './SiteContentEditor';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onCatalogUpdated: () => void;
  onLogout?: () => void;
}

type StudioTab =
  | 'dashboard'
  | 'sales-report'
  | 'catalog'
  | 'hero-content'
  | 'receipts'
  | 'customers'
  | 'discounts'
  | 'bold-gateway'
  | 'inventory'
  | 'stores-team'
  | 'github-cloudflare'
  | 'api-explorer'
  | 'settings';

export const AdminPanel: React.FC<AdminPanelProps> = ({
  isOpen,
  onClose,
  products,
  onCatalogUpdated,
  onLogout,
}) => {
  // Estado de Autenticación
  const [authenticated, setAuthenticated] = useState<boolean>(isAdminAuthenticated());
  const [pinInput, setPinInput] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');

  // Pestaña Activa del CMS Studio
  const [activeTab, setActiveTab] = useState<StudioTab>('dashboard');

  // Estado de Integración con GitHub & Cloudflare Pages
  const [gitHubConfig, setGitHubConfig] = useState<GitHubConfig>(() => getGitHubConfig());
  const [gitHubOwnerInput, setGitHubOwnerInput] = useState<string>(() => getGitHubConfig().owner);
  const [gitHubRepoInput, setGitHubRepoInput] = useState<string>(() => getGitHubConfig().repo);
  const [gitHubBranchInput, setGitHubBranchInput] = useState<string>(() => getGitHubConfig().branch);
  const [gitHubTokenInput, setGitHubTokenInput] = useState<string>(() => getGitHubConfig().token);
  const [gitHubAutoCommit, setGitHubAutoCommit] = useState<boolean>(() => getGitHubConfig().autoCommitOnSave);
  const [cloudflareUrlInput, setCloudflareUrlInput] = useState<string>(() => getGitHubConfig().customDomain || '');
  const [showGitHubToken, setShowGitHubToken] = useState<boolean>(false);
  const [isTestingGitHub, setIsTestingGitHub] = useState<boolean>(false);
  const [gitHubTestResult, setGitHubTestResult] = useState<{
    success?: boolean;
    repoName?: string;
    defaultBranch?: string;
    isPrivate?: boolean;
    permissions?: any;
    error?: string;
  } | null>(null);
  const [isUploadingImages, setIsUploadingImages] = useState<boolean>(false);
  const [uploadProgressMsg, setUploadProgressMsg] = useState<string>('');
  const [uploadErrorMsg, setUploadErrorMsg] = useState<string>('');
  const [isCommittingCatalog, setIsCommittingCatalog] = useState<boolean>(false);
  const [catalogCommitResult, setCatalogCommitResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedJsonUrl, setCopiedJsonUrl] = useState<boolean>(false);
  const [showJsonPreviewModal, setShowJsonPreviewModal] = useState<boolean>(false);
  const [copiedPrompt, setCopiedPrompt] = useState<boolean>(false);
  const [showPromptModal, setShowPromptModal] = useState<boolean>(false);

  // Estado de Conexión Loyverse POS
  const [loyverseStatus, setLoyverseStatus] = useState<any>({ configured: false });
  const [tokenInput, setTokenInput] = useState<string>('');
  const [isSavingToken, setIsSavingToken] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncResult, setSyncResult] = useState<any>(null);
  const [syncedLoyverseItems, setSyncedLoyverseItems] = useState<LoyverseItem[]>([]);

  // Datos de Módulos Loyverse
  const [receiptsList, setReceiptsList] = useState<any[]>([]);
  const [isLoadingReceipts, setIsLoadingReceipts] = useState<boolean>(false);
  const [customersList, setCustomersList] = useState<any[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState<boolean>(false);
  const [crmFilter, setCrmFilter] = useState<'web' | 'all' | 'subscribers'>('web');
  const [allCustomersCount, setAllCustomersCount] = useState<number>(0);
  const [subscribersList, setSubscribersList] = useState<any[]>([]);
  const [isLoadingSubscribers, setIsLoadingSubscribers] = useState<boolean>(false);
  const [subscriberSearch, setSubscriberSearch] = useState<string>('');
  const [copiedSubscribersCount, setCopiedSubscribersCount] = useState<number | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<any | null>(null);
  const [isDeletingCustomer, setIsDeletingCustomer] = useState<boolean>(false);
  const [customerActionNotice, setCustomerActionNotice] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [discountsList, setDiscountsList] = useState<any[]>([]);
  const [isLoadingDiscounts, setIsLoadingDiscounts] = useState<boolean>(false);
  const [discountsSearch, setDiscountsSearch] = useState<string>('');
  const [discountTypeFilter, setDiscountTypeFilter] = useState<'ALL' | 'FIXED_PERCENT' | 'FIXED_AMOUNT'>('ALL');
  const [isNewDiscountOpen, setIsNewDiscountOpen] = useState<boolean>(false);
  const [discountToDelete, setDiscountToDelete] = useState<any | null>(null);
  const [isDeletingDiscount, setIsDeletingDiscount] = useState<boolean>(false);
  const [isSavingDiscount, setIsSavingDiscount] = useState<boolean>(false);
  const [discountActionNotice, setDiscountActionNotice] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [copiedDiscountCode, setCopiedDiscountCode] = useState<string | null>(null);
  const [newDiscountForm, setNewDiscountForm] = useState<{
    name: string;
    type: 'FIXED_PERCENT' | 'FIXED_AMOUNT';
    value: number;
  }>({
    name: '',
    type: 'FIXED_PERCENT',
    value: 10,
  });
  const [employeesList, setEmployeesList] = useState<any[]>([]);
  const [paymentTypesList, setPaymentTypesList] = useState<any[]>([]);
  const [storesList, setStoresList] = useState<any[]>([]);

  // Estado de Pasarela Bold.co
  const [boldConfig, setBoldConfig] = useState<any>({ configured: false });
  const [boldIdentityInput, setBoldIdentityInput] = useState<string>('');
  const [boldSecretInput, setBoldSecretInput] = useState<string>('');
  const [boldIsLiveInput, setBoldIsLiveInput] = useState<boolean>(true);
  const [copiedWebhook, setCopiedWebhook] = useState<boolean>(false);
  const [testOrderId, setTestOrderId] = useState<string>('UN-100234');
  const [testAmount, setTestAmount] = useState<string>('125000');
  const [testHashResult, setTestHashResult] = useState<string>('');
  const [isSavingBold, setIsSavingBold] = useState<boolean>(false);
  const [boldSaveMsg, setBoldSaveMsg] = useState<string>('');
  const [recentOrdersList, setRecentOrdersList] = useState<any[]>([]);

  // Estados de Asignación y Rastreo de Guías Servientrega
  const [trackingAdminGuia, setTrackingAdminGuia] = useState<string | null>(null);
  const [editingOrderTracking, setEditingOrderTracking] = useState<{ orderId: string; currentGuia: string } | null>(null);
  const [inputGuiaValue, setInputGuiaValue] = useState<string>('');
  const [inputCarrierValue, setInputCarrierValue] = useState<string>('Servientrega');
  const [copiedRotulo, setCopiedRotulo] = useState<boolean>(false);
  const [isSavingTracking, setIsSavingTracking] = useState<boolean>(false);
  const [selectedWebOrderForModal, setSelectedWebOrderForModal] = useState<any | null>(null);
  const [expandedOrderIds, setExpandedOrderIds] = useState<Record<string, boolean>>({});
  const [previewGarmentImage, setPreviewGarmentImage] = useState<{ name: string; image: string; size?: string; price?: number; sku?: string } | null>(null);
  const toggleOrderExpand = (id: string) => {
    setExpandedOrderIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Filtros de Búsqueda
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [inventorySearch, setInventorySearch] = useState<string>('');
  const [receiptsSearch, setReceiptsSearch] = useState<string>('');
  const [customersSearch, setCustomersSearch] = useState<string>('');

  // Categorías dinámicas administrables desde el CMS
  const [adminCategories, setAdminCategories] = useState<CategoryCardContent[]>(() => {
    return getStoredSiteContent().categories || [];
  });

  useEffect(() => {
    const handleCategoriesUpdate = (e: any) => {
      if (e.detail?.categories) {
        setAdminCategories(e.detail.categories);
      }
    };
    window.addEventListener('urbannoise_site_content_updated', handleCategoriesUpdate);
    return () => window.removeEventListener('urbannoise_site_content_updated', handleCategoriesUpdate);
  }, []);

  // Modal / Drawer de Edición de Prenda
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editTitle, setEditTitle] = useState<string>('');
  const [editDesc, setEditDesc] = useState<string>('');
  const [editCategory, setEditCategory] = useState<Product['category']>('latest-drops');
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editImages, setEditImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState<string>('');
  const [editVideo, setEditVideo] = useState<string>('');
  const [newVideoUrl, setNewVideoUrl] = useState<string>('');
  const [isUploadingVideo, setIsUploadingVideo] = useState<boolean>(false);
  const [videoProgressMsg, setVideoProgressMsg] = useState<string>('');
  const [videoErrorMsg, setVideoErrorMsg] = useState<string>('');
  const [videoMetrics, setVideoMetrics] = useState<{ origMb: number; compMb: number } | null>(null);
  const [editIsPublished, setEditIsPublished] = useState<boolean>(true);
  const [isSavingProduct, setIsSavingProduct] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>('');

  // Estado del Módulo de Reporte de Ventas (Año, Mes, Día)
  const [salesReportPeriod, setSalesReportPeriod] = useState<'year' | 'month' | 'day'>('month');
  const [salesReportYear, setSalesReportYear] = useState<number>(() => new Date().getFullYear());
  const [salesReportMonth, setSalesReportMonth] = useState<number>(() => new Date().getMonth());
  const [salesReportDay, setSalesReportDay] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [salesScopeFilter, setSalesScopeFilter] = useState<'all' | 'web'>('web');
  const [salesQuery, setSalesQuery] = useState<string>('');

  // Modal de Ajuste de Stock
  const [adjustingItem, setAdjustingItem] = useState<{ sku: string; variantId?: string; name: string; currentStock: number } | null>(null);
  const [newStockValue, setNewStockValue] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<string>('Recepción de nuevo lote de confección');
  const [isAdjustingStock, setIsAdjustingStock] = useState<boolean>(false);

  // Modal de Nuevo Cliente Loyverse
  const [isNewCustomerOpen, setIsNewCustomerOpen] = useState<boolean>(false);
  const [newCustName, setNewCustName] = useState<string>('');
  const [newCustEmail, setNewCustEmail] = useState<string>('');
  const [newCustPhone, setNewCustPhone] = useState<string>('');
  const [newCustAddress, setNewCustAddress] = useState<string>('');
  const [isSavingCustomer, setIsSavingCustomer] = useState<boolean>(false);

  // Modal de Nueva Prenda (Creación Completa desde el CMS)
  const [isNewItemOpen, setIsNewItemOpen] = useState<boolean>(false);
  const [newItemName, setNewItemName] = useState<string>('');
  const [newItemPrice, setNewItemPrice] = useState<number>(65000);
  const [newItemCost, setNewItemCost] = useState<number>(30000);
  const [newItemSku, setNewItemSku] = useState<string>('');
  const [newItemCategory, setNewItemCategory] = useState<Product['category']>('latest-drops');
  const [newItemFit, setNewItemFit] = useState<string>('Oversized Boxy Fit');
  const [newItemStock, setNewItemStock] = useState<number>(10);
  const [newItemDesc, setNewItemDesc] = useState<string>('');
  const [newItemImages, setNewItemImages] = useState<string[]>([]);
  const [newImageUrlInput, setNewImageUrlInput] = useState<string>('');
  const [newItemVideo, setNewItemVideo] = useState<string>('');
  const [newItemColors, setNewItemColors] = useState<string[]>(['Negro']);
  const [newItemColorInput, setNewItemColorInput] = useState<string>('');
  const [newItemSizes, setNewItemSizes] = useState<ProductSize[]>(['S', 'M', 'L', 'XL']);
  const [isUploadingNewImages, setIsUploadingNewImages] = useState<boolean>(false);
  const [newImageProgressMsg, setNewImageProgressMsg] = useState<string>('');
  const [newImageErrorMsg, setNewImageErrorMsg] = useState<string>('');
  const [isSavingNewItem, setIsSavingNewItem] = useState<boolean>(false);

  // Suite API Explorer (100% de la API de Loyverse)
  const [apiEndpoint, setApiEndpoint] = useState<string>('/items');
  const [apiMethod, setApiMethod] = useState<'GET' | 'POST' | 'DELETE'>('GET');
  const [apiRequestBody, setApiRequestBody] = useState<string>('{\n  "limit": 10\n}');
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [isExecutingApi, setIsExecutingApi] = useState<boolean>(false);
  const [copiedResponse, setCopiedResponse] = useState<boolean>(false);

  // Cargar estado inicial al abrir
  useEffect(() => {
    if (isOpen) {
      setAuthenticated(isAdminAuthenticated());
      fetchLoyverseStatus();
      fetchBoldConfig();
      fetchRecentOrders();
      loadAllLoyverseData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && activeTab === 'discounts') {
      refreshDiscounts();
    }
  }, [isOpen, activeTab]);

  const fetchLoyverseStatus = async () => {
    try {
      const status = await getLoyverseStatus();
      setLoyverseStatus(status);
    } catch {
      // ignore
    }
  };

  const fetchBoldConfig = async () => {
    try {
      const cfg = await getBoldConfig();
      setBoldConfig(cfg);
      if (cfg.identityKey && !boldIdentityInput) {
        setBoldIdentityInput(cfg.identityKey);
      }
      if (cfg.isLiveMode !== undefined) {
        setBoldIsLiveInput(Boolean(cfg.isLiveMode));
      }
    } catch {
      // ignore
    }
  };

  const fetchRecentOrders = async () => {
    try {
      const res = await fetch('/api/orders/recent', {
        headers: getAdminHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setRecentOrdersList(data.orders || []);
      }
    } catch {
      // ignore
    }
  };

  const refreshCustomers = async (filter: 'web' | 'all' = (crmFilter === 'subscribers' ? 'web' : crmFilter)) => {
    setIsLoadingCustomers(true);
    try {
      const data = await fetchLoyverseCustomers(250, filter === 'web');
      setCustomersList(data.customers || []);
      if (filter === 'web') {
        fetchLoyverseCustomers(250, false)
          .then((all) => setAllCustomersCount(all.customers?.length || 0))
          .catch(() => {});
      } else {
        setAllCustomersCount(data.customers?.length || 0);
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingCustomers(false);
    }
  };

  const fetchSubscribers = async () => {
    setIsLoadingSubscribers(true);
    try {
      const res = await fetch('/api/newsletter/subscribers', {
        headers: getAdminHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setSubscribersList(data.subscribers || []);
      }
    } catch (err) {
      console.warn('[Admin Newsletter] Error cargando suscriptores:', err);
    } finally {
      setIsLoadingSubscribers(false);
    }
  };

  const handleCopySubscribersEmails = () => {
    if (subscribersList.length === 0) return;
    const emailsString = subscribersList.map((s) => s.email).join(', ');
    navigator.clipboard.writeText(emailsString);
    setCopiedSubscribersCount(subscribersList.length);
    setTimeout(() => setCopiedSubscribersCount(null), 3500);
  };

  const loadAllLoyverseData = async () => {
    // Carga de recursos esenciales
    fetchLoyverseReceipts()
      .then((data) => setReceiptsList(data.receipts || []))
      .catch(() => {});
    refreshCustomers('web');
    fetchSubscribers();
    fetchLoyverseDiscounts()
      .then((data) => setDiscountsList(data.discounts || []))
      .catch(() => {});
  };

  const refreshDiscounts = async () => {
    setIsLoadingDiscounts(true);
    try {
      const data = await fetchLoyverseDiscounts();
      setDiscountsList(data.discounts || []);
    } catch (e) {
      console.warn('[Admin Discounts] Error actualizando descuentos:', e);
    } finally {
      setIsLoadingDiscounts(false);
    }
  };

  const handleCreateDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDiscountForm.name.trim()) return;
    setIsSavingDiscount(true);
    try {
      const payload: any = {
        name: newDiscountForm.name.trim(),
        type: newDiscountForm.type,
      };
      if (newDiscountForm.type === 'FIXED_PERCENT') {
        payload.discount_percent = Number(newDiscountForm.value) || 0;
      } else {
        payload.discount_amount = Number(newDiscountForm.value) || 0;
      }

      const res = await createLoyverseDiscount(payload);
      if (res.success) {
        setDiscountActionNotice({
          type: 'success',
          text: `¡Descuento "${newDiscountForm.name.trim()}" creado exitosamente en el Sistema POS!`,
        });
        setIsNewDiscountOpen(false);
        setNewDiscountForm({ name: '', type: 'FIXED_PERCENT', value: 10 });
        await refreshDiscounts();
      } else {
        setDiscountActionNotice({
          type: 'error',
          text: res.error || 'No se pudo crear el descuento en el Sistema POS.',
        });
      }
    } catch (err: any) {
      setDiscountActionNotice({
        type: 'error',
        text: err.message || 'Error de comunicación con el servidor.',
      });
    } finally {
      setIsSavingDiscount(false);
      setTimeout(() => setDiscountActionNotice(null), 6000);
    }
  };

  const handleConfirmDeleteDiscount = async () => {
    if (!discountToDelete) return;
    setIsDeletingDiscount(true);
    try {
      const res = await deleteLoyverseDiscount(discountToDelete.id);
      if (res.success) {
        setDiscountActionNotice({
          type: 'success',
          text: `Descuento "${discountToDelete.name}" eliminado del Sistema POS y la tienda web.`,
        });
        setDiscountToDelete(null);
        await refreshDiscounts();
      } else {
        setDiscountActionNotice({
          type: 'error',
          text: res.error || 'Error al eliminar el descuento del Sistema POS.',
        });
      }
    } catch (err: any) {
      setDiscountActionNotice({
        type: 'error',
        text: err.message || 'Error al conectar con el Sistema POS.',
      });
    } finally {
      setIsDeletingDiscount(false);
      setTimeout(() => setDiscountActionNotice(null), 6000);
    }
  };

  const handleCopyDiscountCode = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedDiscountCode(code);
    setTimeout(() => setCopiedDiscountCode(null), 2500);
  };

  // Manejar Login de Administrador
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const res = await loginAdminWithServer(pinInput, pinInput);
    if (res.success) {
      setAdminAuthenticated(true);
      setAuthenticated(true);
      setPinInput('');
    } else {
      // Fallback para desarrollo si el servidor aún no tiene endpoint activo
      if (isUserAdminCredentials(pinInput, pinInput)) {
        setAdminAuthenticated(true);
        setAuthenticated(true);
        setPinInput('');
      } else {
        setAuthError(res.error || 'PIN o credenciales de administrador no válidas.');
      }
    }
  };

  const handleLogout = () => {
    clearAllAdminSessions();
    setAuthenticated(false);
    setPinInput('');
    setAuthError('');
    if (onLogout) {
      onLogout();
    } else {
      onClose();
    }
  };

  // Guardar o Actualizar Guía de Despacho en Pedido Web
  const handleSaveOrderTracking = async (
    orderId: string,
    userEmail?: string,
    guiaOverride?: string,
    carrierOverride?: string,
    customerId?: string
  ) => {
    setIsSavingTracking(true);
    const trackingNumber = (guiaOverride !== undefined ? guiaOverride : inputGuiaValue).trim();
    const trackingCompany = (carrierOverride !== undefined ? carrierOverride : inputCarrierValue).trim() || 'Servientrega';

    try {
      const res = await fetch('/api/orders/update-tracking', {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({
          orderId,
          trackingNumber,
          trackingCompany,
          userEmail,
          customerId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setRecentOrdersList((prev) =>
          prev.map((o) =>
            o.orderId === orderId || o.id === orderId
              ? {
                  ...o,
                  trackingNumber: trackingNumber || undefined,
                  trackingCompany,
                  trackingUrl: data.trackingUrl,
                  status: trackingNumber ? 'ENVIADO' : 'EN_PREPARACION',
                  statusLabel: trackingNumber ? `Enviado con ${trackingCompany}` : 'En Preparación',
                }
              : o
          )
        );

        setSelectedWebOrderForModal((prev: any) =>
          prev && (prev.orderId === orderId || prev.id === orderId)
            ? {
                ...prev,
                trackingNumber: trackingNumber || undefined,
                trackingCompany,
                trackingUrl: data.trackingUrl,
                status: trackingNumber ? 'ENVIADO' : 'EN_PREPARACION',
                statusLabel: trackingNumber ? `Enviado con ${trackingCompany}` : 'En Preparación',
              }
            : prev
        );

        // Actualizar en el estado de recibos de Loyverse
        const cleanOId = (orderId || '').replace(/^#/, '').toUpperCase();
        setReceiptsList((prev: any[]) =>
          prev.map((r) => {
            const rOrder = (r.order || '').replace(/^#/, '').toUpperCase();
            const rNum = String(r.receipt_number || '').toUpperCase();
            const rNote = (r.note || '').toUpperCase();
            if (rOrder === cleanOId || rNum === cleanOId || rNote.includes(cleanOId)) {
              return {
                ...r,
                trackingNumber: trackingNumber || undefined,
                trackingCompany,
                trackingUrl: data.trackingUrl,
              };
            }
            return r;
          })
        );

        // Actualizar en el estado de clientes de Loyverse
        if (data.updatedNote) {
          setCustomersList((prev: any[]) =>
            prev.map((c) =>
              (customerId && c.id === customerId) ||
              (userEmail && c.email && c.email.toLowerCase() === userEmail.toLowerCase()) ||
              c.id === 'eed0d7e0-e4a0-463a-9abd-f04890500739'
                ? { ...c, note: data.updatedNote }
                : c
            )
          );
        }

        const targetEmail = userEmail || 'migoel585@gmail.com';
        const clientOrders = getCustomerOrders(targetEmail);
        const updated = clientOrders.map((co) =>
          co.id === orderId || co.orderNumber === orderId
            ? {
                ...co,
                trackingNumber: trackingNumber || undefined,
                trackingCompany,
                trackingUrl: data.trackingUrl,
                status: trackingNumber ? ('EN_CAMINO' as const) : ('EN_PREPARACION' as const),
                statusLabel: trackingNumber ? `Enviado con ${trackingCompany}` : 'En Preparación',
              }
            : co
        );
        saveCustomerOrders(targetEmail, updated);

        setEditingOrderTracking(null);
        setInputGuiaValue('');
      } else {
        alert(data.error || 'Error al guardar guía');
      }
    } catch (err: any) {
      alert(err.message || 'Error de conexión');
    } finally {
      setIsSavingTracking(false);
    }
  };

  // Guardar Token de Loyverse
  const handleSaveToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;
    setIsSavingToken(true);
    try {
      const res = await configureLoyverseToken(tokenInput.trim());
      if (res.success) {
        setLoyverseStatus({ ...loyverseStatus, configured: true });
        setTokenInput('');
        handleSyncCatalog();
      } else {
        alert(res.error || 'No se pudo validar el Token con Loyverse');
      }
    } catch (err: any) {
      alert(err.message || 'Error de conexión');
    } finally {
      setIsSavingToken(false);
    }
  };

  // Guardar Llaves Bold.co
  const handleSaveBoldCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingBold(true);
    setBoldSaveMsg('');
    try {
      const res = await configureBoldCredentials(boldIdentityInput, boldSecretInput, boldIsLiveInput);
      if (res.success) {
        setBoldSaveMsg('✓ Credenciales y configuración de Bold.co guardadas correctamente');
        fetchBoldConfig();
        setTimeout(() => setBoldSaveMsg(''), 4000);
      }
    } catch (err: any) {
      setBoldSaveMsg('Error al guardar credenciales Bold');
    } finally {
      setIsSavingBold(false);
    }
  };

  const handleTestHash = async () => {
    try {
      const res = await fetch('/api/bold/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: testOrderId,
          amount: Number(testAmount) || 125000,
          currency: 'COP',
        }),
      });
      const ct = res.headers.get('content-type') || '';
      if (res.ok && ct.includes('application/json')) {
        const data = await res.json();
        if (data.integritySignature) {
          setTestHashResult(data.integritySignature);
          return;
        }
      }
    } catch {}

    // Fallback con Web Crypto API en el navegador
    try {
      const raw = `${testOrderId}${testAmount}COP${boldSecretInput || 'BOLD_SECRET_INTEGRITY'}`;
      const buf = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
      const hash = Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
      setTestHashResult(hash);
    } catch (e: any) {
      setTestHashResult('Error: ' + e.message);
    }
  };

  // Sincronizar Catálogo Completo
  const handleSyncCatalog = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    try {
      const res = await syncLoyverseCatalog();
      setSyncResult(res);
      if (res.items) {
        setSyncedLoyverseItems(res.items);
      }
      onCatalogUpdated();
      loadAllLoyverseData();
    } catch (err: any) {
      setSyncResult({ error: err.message });
    } finally {
      setIsSyncing(false);
    }
  };

  // Abrir editor de prenda
  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setEditTitle(product.customTitle || product.name);
    setEditDesc(product.customDesc || product.desc);
    setEditCategory(product.category);
    const initialImages = (product.images && product.images.length > 0 ? product.images : [product.image])
      .filter((img) => img && typeof img === 'string' && !img.includes('loyverse.com') && !img.startsWith('data:'));
    setEditImages(initialImages);
    setEditVideo(product.video || (product as any).customVideo || '');
    setNewVideoUrl('');
    setVideoMetrics(null);
    setVideoErrorMsg('');
    setVideoProgressMsg('');
    setEditIsPublished(product.isPublished !== false);
    setNewImageUrl('');
    setSaveSuccessMsg('');
  };

  // Añadir imagen por URL
  const handleAddImageUrl = () => {
    if (!newImageUrl.trim()) return;
    setEditImages((prev) => [...prev, newImageUrl.trim()]);
    setNewImageUrl('');
  };

  // Función auxiliar para optimizar y asegurar compatibilidad de imágenes en la web
  const prepareImageForWeb = (file: File): Promise<{
    file: File;
    base64: string;
    dataUrl: string;
    error?: string;
  }> => {
    const isHeic = file.name.toLowerCase().endsWith('.heic') ||
                   file.name.toLowerCase().endsWith('.heif') ||
                   file.type.includes('heic') ||
                   file.type.includes('heif');

    if (isHeic) {
      return Promise.resolve({
        file,
        base64: '',
        dataUrl: '',
        error: `La foto "${file.name}" está en formato .HEIC de Apple/iPhone. La web requiere formato JPG o PNG. Por favor expórtala como JPG en tu teléfono o conviértela antes de subir.`,
      });
    }

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const rawDataUrl = e.target?.result as string;
        if (!rawDataUrl) {
          resolve({ file, base64: '', dataUrl: '', error: `No se pudo leer el archivo ${file.name}` });
          return;
        }

        // Si es SVG o GIF animado, no alterar
        if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
          const base64 = rawDataUrl.split(';base64,')[1] || '';
          resolve({ file, base64, dataUrl: rawDataUrl });
          return;
        }

        const img = new Image();
        img.onload = () => {
          try {
            const maxDim = 1600;
            let width = img.width;
            let height = img.height;

            if (width > maxDim || height > maxDim) {
              if (width > height) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              } else {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              const base64 = rawDataUrl.split(';base64,')[1] || '';
              resolve({ file, base64, dataUrl: rawDataUrl });
              return;
            }

            // Detectar soporte para WebP en el navegador (soportado por el 98%+ de navegadores modernos)
            const testCanvas = document.createElement('canvas');
            testCanvas.width = 1;
            testCanvas.height = 1;
            const supportsWebP = testCanvas.toDataURL('image/webp').startsWith('data:image/webp');

            const mime = supportsWebP ? 'image/webp' : (isPng ? 'image/png' : 'image/jpeg');
            const ext = supportsWebP ? 'webp' : (isPng ? 'png' : 'jpg');
            const quality = 0.88; // Calidad prémium al 88%: nitidez idéntica pero 75% menos peso

            if (!supportsWebP && !isPng) {
              ctx.fillStyle = '#FFFFFF';
              ctx.fillRect(0, 0, width, height);
            }
            ctx.drawImage(img, 0, 0, width, height);

            const optimizedDataUrl = canvas.toDataURL(mime, quality);
            const base64 = optimizedDataUrl.split(';base64,')[1] || '';

            canvas.toBlob(
              (blob) => {
                if (blob) {
                  const baseName = file.name.replace(/\.[^/.]+$/, '').toLowerCase().replace(/[^a-z0-9_-]/g, '-');
                  const cleanName = `${baseName}.${ext}`;
                  const optimizedFile = new File([blob], cleanName, { type: mime });
                  resolve({ file: optimizedFile, base64, dataUrl: optimizedDataUrl });
                } else {
                  resolve({ file, base64, dataUrl: optimizedDataUrl });
                }
              },
              mime,
              quality
            );
          } catch {
            const base64 = rawDataUrl.split(';base64,')[1] || '';
            resolve({ file, base64, dataUrl: rawDataUrl });
          }
        };

        img.onerror = () => {
          const base64 = rawDataUrl.split(';base64,')[1] || '';
          resolve({ file, base64, dataUrl: rawDataUrl });
        };

        img.src = rawDataUrl;
      };

      reader.onerror = () => {
        resolve({ file, base64: '', dataUrl: '', error: `Error leyendo archivo ${file.name}` });
      };

      reader.readAsDataURL(file);
    });
  };

  // Subir imagen desde la computadora (Directo a GitHub si está configurado, o Base64 local)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !editingProduct) return;

    const fileList: File[] = Array.from(files);
    const sku = (editingProduct.sku || editingProduct.id).toUpperCase();
    const isGHReady = isGitHubConfigured(gitHubConfig);

    setIsUploadingImages(true);
    setUploadErrorMsg('');
    setUploadProgressMsg(isGHReady ? `Procesando ${fileList.length} imagen(es)...` : 'Procesando imágenes...');

    const newUploadedUrls: string[] = [];

    try {
      for (let i = 0; i < fileList.length; i++) {
        const rawFile = fileList[i];
        setUploadProgressMsg(`Optimizando (${i + 1}/${fileList.length}): ${rawFile.name}...`);
        
        const prepared = await prepareImageForWeb(rawFile);
        if (prepared.error) {
          setUploadErrorMsg(prepared.error);
          continue;
        }

        if (isGHReady) {
          setUploadProgressMsg(`Guardando en servidor cloud (${i + 1}/${fileList.length}): ${prepared.file.name}...`);
          const ghResult = await uploadImageToGitHub({
            file: prepared.file,
            base64: prepared.base64,
            filename: prepared.file.name,
            sku,
            config: gitHubConfig,
          });

          if (ghResult.success) {
            newUploadedUrls.push(ghResult.cdnUrl);
          } else {
            console.warn('Fallo al subir a almacenamiento cloud, cargando localmente:', ghResult.error);
            setUploadErrorMsg(`Aviso Cloud: ${ghResult.error || 'Error al subir al servidor'}. Cargada en modo local.`);
            newUploadedUrls.push(prepared.dataUrl);
          }
        } else {
          setUploadErrorMsg('⚠️ Almacenamiento cloud no configurado aún. Guardada en modo local.');
          newUploadedUrls.push(prepared.dataUrl);
        }
      }

      if (newUploadedUrls.length > 0) {
        setEditImages((prev) => [...prev, ...newUploadedUrls]);
      }
    } catch (err: any) {
      console.error('Error al subir archivos:', err);
      setUploadErrorMsg(`Excepción al procesar imágenes: ${err.message || err}`);
    } finally {
      setIsUploadingImages(false);
      setUploadProgressMsg('');
      e.target.value = '';
    }
  };

  // Subir video de producto (Procesamiento silencioso sin audio + compresión web + subida a GitHub)
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !editingProduct) return;

    const file = files[0];
    const sku = (editingProduct.sku || editingProduct.id).toUpperCase();
    const isGHReady = isGitHubConfigured(gitHubConfig);

    setIsUploadingVideo(true);
    setVideoErrorMsg('');
    setVideoMetrics(null);
    setVideoProgressMsg(`Optimizando video (${(file.size / (1024 * 1024)).toFixed(1)} MB)...`);

    try {
      const prepared = await prepareVideoForWeb(file, (percent, status) => {
        setVideoProgressMsg(`${status} (${percent}%)`);
      });

      if (prepared.error) {
        setVideoErrorMsg(prepared.error);
        setIsUploadingVideo(false);
        return;
      }

      const origMb = Number((prepared.originalSize / (1024 * 1024)).toFixed(2));
      const compMb = Number((prepared.compressedSize / (1024 * 1024)).toFixed(2));
      setVideoMetrics({ origMb, compMb });

      if (isGHReady) {
        setVideoProgressMsg(`Subiendo a GitHub (${compMb} MB)...`);
        const ghResult = await uploadProductVideoToGitHub({
          file: prepared.file,
          blob: prepared.blob,
          base64: prepared.base64,
          filename: prepared.file.name,
          sku,
          config: gitHubConfig,
        });

        if (ghResult.success) {
          setEditVideo(ghResult.cdnUrl);
        } else {
          console.warn('Fallo al subir video a GitHub:', ghResult.error);
          setVideoErrorMsg(`Aviso GitHub: ${ghResult.error || 'Error al subir a la nube'}.`);
        }
      } else {
        setVideoErrorMsg('⚠️ GitHub no está configurado. Configura tu Token de GitHub para subir videos a la nube.');
      }
    } catch (err: any) {
      console.error('Error al subir video:', err);
      setVideoErrorMsg(`Excepción al procesar video: ${err.message || err}`);
    } finally {
      setIsUploadingVideo(false);
      setVideoProgressMsg('');
      e.target.value = '';
    }
  };

  // Eliminar imagen
  const handleRemoveImage = (indexToRemove: number) => {
    setEditImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Poner imagen como principal
  const handleSetMainImage = (index: number) => {
    if (index === 0) return;
    setEditImages((prev) => {
      const copy = [...prev];
      const selected = copy.splice(index, 1)[0];
      return [selected, ...copy];
    });
  };

  // Guardar Cambios de Prenda (Local y en GitHub)
  const handleSaveProductChanges = async () => {
    if (!editingProduct) return;
    setIsSavingProduct(true);

    const sku = (editingProduct.sku || editingProduct.id).toUpperCase();
    const isRemoteVideo =
      editVideo &&
      typeof editVideo === 'string' &&
      (editVideo.startsWith('http://') || editVideo.startsWith('https://'));
    const cleanImages = editImages.filter(
      (img) => typeof img === 'string' && !img.includes('loyverse.com') && !img.startsWith('data:')
    );
    const customization: ProductCustomization = {
      sku,
      name: editTitle,
      desc: editDesc,
      category: editCategory,
      price: editPrice,
      images: cleanImages,
      video: isRemoteVideo ? editVideo.trim() : undefined,
      isPublished: cleanImages.length > 0 ? editIsPublished : false,
      updatedAt: new Date().toISOString(),
    };

    const res = await saveProductCustomization(customization, true);
    onCatalogUpdated();
    setIsSavingProduct(false);

    if (res.githubSynced) {
      setSaveSuccessMsg('✓ Prenda guardada y commiteada a GitHub. Despliegue en Cloudflare Pages en proceso.');
    } else {
      setSaveSuccessMsg('✓ Prenda actualizada y publicada en la tienda virtual.');
    }

    setTimeout(() => {
      setEditingProduct(null);
      setSaveSuccessMsg('');
    }, 1400);
  };

  // Guardar configuración de GitHub
  const handleSaveGitHubSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = saveGitHubConfig({
      owner: gitHubOwnerInput,
      repo: gitHubRepoInput,
      branch: gitHubBranchInput,
      token: gitHubTokenInput,
      autoCommitOnSave: gitHubAutoCommit,
      customDomain: cloudflareUrlInput,
    });
    setGitHubConfig(updated);
    setCatalogCommitResult({
      success: true,
      message: '✓ Configuración de GitHub guardada correctamente.',
    });
    setTimeout(() => setCatalogCommitResult(null), 3000);
  };

  // Probar conexión con GitHub
  const handleTestGitHub = async () => {
    setIsTestingGitHub(true);
    setGitHubTestResult(null);
    try {
      const tempConfig: GitHubConfig = {
        owner: gitHubOwnerInput,
        repo: gitHubRepoInput,
        branch: gitHubBranchInput,
        token: gitHubTokenInput,
        autoCommitOnSave: gitHubAutoCommit,
        customDomain: cloudflareUrlInput,
      };
      const res = await testGitHubConnection(tempConfig);
      setGitHubTestResult(res);
      if (res.success) {
        saveGitHubConfig(tempConfig);
        setGitHubConfig(tempConfig);
      }
    } finally {
      setIsTestingGitHub(false);
    }
  };

  // Commitear catálogo completo a GitHub
  const handleCommitFullCatalog = async () => {
    setIsCommittingCatalog(true);
    setCatalogCommitResult(null);
    try {
      const currentCustomizations = getStoredCustomizations();
      const res = await saveCatalogToGitHub(currentCustomizations, products, gitHubConfig);
      if (res.success) {
        const savedList = res.filesSaved && res.filesSaved.length > 0 ? res.filesSaved.join(' y ') : 'catálogo';
        setCatalogCommitResult({
          success: true,
          message: `✓ Catálogo sincronizado en GitHub con éxito (${savedList} guardados, Commit: ${res.commitSha?.slice(0, 7)}). Cloudflare Pages actualizará la tienda y el JSON de IA.`,
        });
      } else {
        setCatalogCommitResult({
          success: false,
          message: res.error || 'Error al guardar el catálogo en GitHub.',
        });
      }
    } finally {
      setIsCommittingCatalog(false);
    }
  };

  // Ejecutar Ajuste de Inventario en Servidor y Loyverse
  const handleConfirmStockAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingItem) return;
    setIsAdjustingStock(true);
    try {
      const res = await adjustLoyverseInventory({
        sku: adjustingItem.sku,
        variantId: adjustingItem.variantId,
        newStock: Number(newStockValue),
        reason: adjustReason,
      });
      if (res.success) {
        onCatalogUpdated();
        handleSyncCatalog();
        setAdjustingItem(null);
      } else {
        alert(res.error || 'Error al actualizar inventario');
      }
    } catch (err: any) {
      alert(err.message || 'Error de conexión');
    } finally {
      setIsAdjustingStock(false);
    }
  };

  // Crear Cliente en Loyverse
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) return;
    setIsSavingCustomer(true);
    try {
      const res = await createLoyverseCustomer({
        name: newCustName.trim(),
        email: newCustEmail.trim() || undefined,
        phone_number: newCustPhone.trim() || undefined,
        address: newCustAddress.trim() || undefined,
        city: 'Bogotá',
      });
      if (res.success || res.customer) {
        setIsNewCustomerOpen(false);
        setNewCustName('');
        setNewCustEmail('');
        setNewCustPhone('');
        setNewCustAddress('');
        fetchLoyverseCustomers().then((data) => setCustomersList(data.customers || []));
      }
    } catch (err: any) {
      alert('Error al registrar cliente');
    } finally {
      setIsSavingCustomer(false);
    }
  };

  // Eliminar Cliente de Loyverse POS y Tienda Web
  const handleConfirmDeleteCustomer = async () => {
    if (!customerToDelete) return;
    setIsDeletingCustomer(true);
    setCustomerActionNotice(null);

    try {
      const res = await deleteLoyverseCustomer(customerToDelete.id, customerToDelete.email);
      if (res.success) {
        setCustomersList((prev) => prev.filter((c) => c.id !== customerToDelete.id));
        setAllCustomersCount((prev) => Math.max(0, prev - 1));
        setCustomerActionNotice({
          text: `Cliente "${customerToDelete.name || 'Seleccionado'}" eliminado correctamente del Sistema POS y la tienda web.`,
          type: 'success',
        });
        setCustomerToDelete(null);
      } else {
        setCustomerActionNotice({
          text: res.error || 'No se pudo eliminar el cliente del Sistema POS.',
          type: 'error',
        });
      }
    } catch (err: any) {
      setCustomerActionNotice({
        text: err.message || 'Error de conexión al eliminar el cliente.',
        type: 'error',
      });
    } finally {
      setIsDeletingCustomer(false);
    }
  };

  // Generar SKU automático
  const handleGenerateNewSku = () => {
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    setNewItemSku(String(randomNum));
  };

  // Subir Imágenes de la Nueva Prenda a GitHub / CDN
  const handleUploadNewItemImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploadingNewImages(true);
    setNewImageErrorMsg('');
    setNewImageProgressMsg('Procesando imágenes...');

    const targetSku = (newItemSku.trim() || `UN-${Math.floor(10000 + Math.random() * 90000)}`).toUpperCase();
    if (!newItemSku.trim()) {
      setNewItemSku(targetSku);
    }

    try {
      const fileList = Array.from(files);
      const isGHReady = isGitHubConfigured(gitHubConfig);
      const newUrls: string[] = [];

      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        setNewImageProgressMsg(`Optimizando (${i + 1}/${fileList.length}): ${file.name}...`);
        const prepared = await prepareImageForWeb(file);

        if (prepared.error) {
          console.warn(prepared.error);
          continue;
        }

        if (isGHReady) {
          setNewImageProgressMsg(`Subiendo a GitHub (${i + 1}/${fileList.length}): ${prepared.file.name}...`);
          const ghResult = await uploadImageToGitHub({
            file: prepared.file,
            base64: prepared.base64,
            filename: prepared.file.name,
            sku: targetSku,
            config: gitHubConfig,
          });

          if (ghResult.success && ghResult.cdnUrl) {
            newUrls.push(ghResult.cdnUrl);
          } else {
            console.warn('Aviso GitHub:', ghResult.error);
            if (prepared.base64) newUrls.push(prepared.base64);
          }
        } else {
          if (prepared.base64) newUrls.push(prepared.base64);
        }
      }

      if (newUrls.length > 0) {
        setNewItemImages((prev) => [...prev, ...newUrls]);
      }
    } catch (err: any) {
      console.error('Error al subir imágenes:', err);
      setNewImageErrorMsg(`Excepción al procesar: ${err.message || err}`);
    } finally {
      setIsUploadingNewImages(false);
      setNewImageProgressMsg('');
      e.target.value = '';
    }
  };

  const handleAddImageUrlToNewItem = () => {
    if (!newImageUrlInput.trim()) return;
    setNewItemImages((prev) => [...prev, newImageUrlInput.trim()]);
    setNewImageUrlInput('');
  };

  const handleRemoveNewItemImage = (idxToRemove: number) => {
    setNewItemImages((prev) => prev.filter((_, idx) => idx !== idxToRemove));
  };

  const handleSetMainNewItemImage = (index: number) => {
    if (index === 0) return;
    setNewItemImages((prev) => {
      const copy = [...prev];
      const selected = copy.splice(index, 1)[0];
      return [selected, ...copy];
    });
  };

  const handleToggleNewItemSize = (size: ProductSize) => {
    setNewItemSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const handleToggleNewItemColor = (color: string) => {
    setNewItemColors((prev) =>
      prev.includes(color) ? (prev.length > 1 ? prev.filter((c) => c !== color) : prev) : [...prev, color]
    );
  };

  const handleAddCustomColor = () => {
    const clean = newItemColorInput.trim();
    if (!clean) return;
    const formatted = clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
    if (!newItemColors.includes(formatted)) {
      setNewItemColors((prev) => [...prev, formatted]);
    }
    setNewItemColorInput('');
  };

  // Crear Nueva Prenda Completa (Web CMS + Loyverse POS)
  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) {
      alert('Por favor ingresa el nombre de la prenda.');
      return;
    }

    const cleanSku = (newItemSku.trim() || `UN-${Math.floor(10000 + Math.random() * 90000)}`).toUpperCase();
    const finalPrice = Number(newItemPrice) > 0 ? Number(newItemPrice) : 55000;
    const finalImages = newItemImages.length > 0
      ? newItemImages
      : ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=800&auto=format&fit=crop'];

    setIsSavingNewItem(true);
    try {
      // 1. Guardar en personalizaciones (Persiste en localStorage y sincroniza con GitHub catalog/customizations.json)
      const customization: ProductCustomization = {
        sku: cleanSku,
        name: newItemName.trim().toUpperCase(),
        desc: newItemDesc.trim() || `Prenda original URBANNOISE confeccionada en Bogotá con algodón de alto gramaje y silueta ${newItemFit}.`,
        category: newItemCategory,
        price: finalPrice,
        images: finalImages,
        video: newItemVideo.trim() || undefined,
        fit: newItemFit,
        isPublished: true,
        updatedAt: new Date().toISOString(),
        stock: Number(newItemStock) || 10,
        availableColors: newItemColors.length > 0 ? newItemColors : ['Negro'],
        availableSizes: newItemSizes.length > 0 ? newItemSizes : ['S', 'M', 'L', 'XL'],
        categoryLabel:
          adminCategories.find((c) => c.id === newItemCategory)?.name ||
          (newItemCategory === 'latest-drops' ? 'Últimos Lanzamientos' :
          newItemCategory === 'young-free' ? 'Young & Free' :
          newItemCategory === 'weird-oversize' ? 'Pleasures & Weird Boxy' : 'Dama Oversize'),
      };

      await saveProductCustomization(customization, true);

      // 2. Si Loyverse está conectado, intentar registrar también en el punto de venta
      if (loyverseStatus.configured) {
        try {
          const loyVariants = (newItemSizes.length > 0 ? newItemSizes : ['M']).map((sz) => ({
            sku: `${cleanSku}-${sz}`,
            price: finalPrice,
            cost: Number(newItemCost) || 30000,
            option1_value: sz,
            option2_value: newItemColors[0] || 'Negro',
          }));

          await createLoyverseItem({
            item_name: newItemName.trim().toUpperCase(),
            description: customization.desc,
            variants: loyVariants,
          });
        } catch (posErr) {
          console.warn('Aviso sincronizando nuevo artículo con Loyverse POS:', posErr);
        }
      }

      // 3. Notificar y resetear
      onCatalogUpdated();
      setIsNewItemOpen(false);
      setNewItemName('');
      setNewItemSku('');
      setNewItemPrice(65000);
      setNewItemCost(30000);
      setNewItemDesc('');
      setNewItemImages([]);
      setNewItemVideo('');
      setNewItemColors(['Negro']);
      setNewItemSizes(['S', 'M', 'L', 'XL']);
      setNewItemStock(10);
      alert(`¡Prenda "${customization.name}" creada y publicada con éxito en la tienda!`);
    } catch (err: any) {
      alert(`Error al crear la prenda: ${err.message || err}`);
    } finally {
      setIsSavingNewItem(false);
    }
  };

  // Ejecutar petición en Consola API
  const handleExecuteApi = async () => {
    setIsExecutingApi(true);
    setApiResponse(null);
    try {
      let parsedBody = undefined;
      if (apiMethod !== 'GET' && apiRequestBody.trim()) {
        parsedBody = JSON.parse(apiRequestBody);
      }
      const res = await executeLoyverseProxy(apiEndpoint, apiMethod, parsedBody);
      setApiResponse(res);
    } catch (err: any) {
      setApiResponse({ error: err.message, status: 'EXCEPTION' });
    } finally {
      setIsExecutingApi(false);
    }
  };

  // Nombres de meses en español
  const MONTH_NAMES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // Métricas y KPIs para Dashboard (Enfocados en catálogo con fotos)
  const metrics = useMemo(() => {
    const totalItems = products.length;
    const withCustomImagesCount = products.filter(
      (p) => p.isPublished !== false && Boolean(p.image && p.images && p.images.length > 0)
    ).length;
    const pendingImagesCount = Math.max(0, totalItems - withCustomImagesCount);

    return {
      totalItems,
      withCustomImagesCount,
      pendingImagesCount,
    };
  }, [products]);

  // Filtrar estrictamente para mostrar SOLO ventas emitidas por la Página Web
  const webReceiptsList = useMemo(() => {
    const resolveCustomer = (ord: any) => {
      const note = ord.note || '';
      const ccMatch = note.match(/CC:\s*([^\s•|]+)/i);
      const nameMatch = note.match(/Cliente:\s*([^•-]+)/i);
      const phoneMatch = note.match(/Tel:\s*([^\s•|]+)/i);
      const addrMatch = note.match(/\[ENV[ÍI]O:\s*([^\]]+)\]/i) || note.match(/Dir:\s*([^•|]+)/i);
      const cityMatch = note.match(/Ciudad:\s*([^•|]+)/i);

      let cust = customersList.find((c: any) => c.id === ord.customer_id);
      if (!cust && ccMatch) {
        cust = customersList.find((c: any) => c.customer_code === ccMatch[1] || (c.note && c.note.includes(ccMatch[1])));
      }
      if (!cust && (ord.customer?.email || ord.userEmail)) {
        const em = (ord.customer?.email || ord.userEmail || '').toLowerCase().trim();
        cust = customersList.find((c: any) => c.email && c.email.toLowerCase().trim() === em);
      }
      if (!cust && (ord.customer_id === 'eed0d7e0-e4a0-463a-9abd-f04890500739' || note.includes('1013636801') || note.toLowerCase().includes('jeisson') || note.toLowerCase().includes('miguel'))) {
        cust = customersList.find((c: any) => c.id === 'eed0d7e0-e4a0-463a-9abd-f04890500739');
      }

      const name = ord.customer?.name || cust?.name || (nameMatch ? nameMatch[1].trim() : 'JEISSON TRIANA');
      const email = ord.customer?.email || cust?.email || ord.userEmail || 'migoel585@gmail.com';
      const phone = ord.customer?.phone || cust?.phone_number || (phoneMatch ? phoneMatch[1].trim() : '3003926061');
      const document = ord.customer?.document || cust?.customer_code || (ccMatch ? ccMatch[1].trim() : '1013636801');
      const address = ord.shippingAddress?.address || cust?.address || (addrMatch ? addrMatch[1].trim() : 'cl 2 sur 11 c 45');
      const city = ord.shippingAddress?.city || cust?.city || (cityMatch ? cityMatch[1].trim() : 'Bogota');
      const department = ord.shippingAddress?.department || 'Cundinamarca';

      const custNote = cust?.note || '';
      const orderIdentifiers = new Set<string>();
      if (ord.id) {
        const idClean = String(ord.id).trim().toUpperCase();
        orderIdentifiers.add(idClean);
        orderIdentifiers.add(idClean.replace(/^#/, ''));
      }
      if (ord.orderId) {
        const oClean = String(ord.orderId).trim().toUpperCase();
        orderIdentifiers.add(oClean);
        orderIdentifiers.add(oClean.replace(/^#/, ''));
      }
      if (ord.orderNumber) {
        const onClean = String(ord.orderNumber).trim().toUpperCase();
        orderIdentifiers.add(onClean);
        orderIdentifiers.add(onClean.replace(/^#/, ''));
      }
      if (ord.receipt_number || ord.receiptNumber) {
        const rcClean = String(ord.receipt_number || ord.receiptNumber).trim().toUpperCase();
        orderIdentifiers.add(rcClean);
        orderIdentifiers.add(`REC-${rcClean}`);
        orderIdentifiers.add(`#REC-${rcClean}`);
      }
      const orderInNoteMatch = note.match(/#(UN-[A-Z0-9_-]+)/i) || note.match(/(UN-[A-Z0-9_-]+)/i);
      if (orderInNoteMatch) {
        const onClean = orderInNoteMatch[1].trim().toUpperCase();
        orderIdentifiers.add(onClean);
        orderIdentifiers.add(onClean.replace(/^#/, ''));
      }

      let trackingNumber = ord.trackingNumber || undefined;
      let trackingCompany = ord.shippingCarrier || ord.trackingCompany || 'Servientrega';

      // 1. Buscar en tags [GUIA:...|ORDEN:...] o [G:...|O:...] en la ficha del cliente que correspondan a ESTA orden
      if (!trackingNumber && custNote) {
        const tagMatches = custNote.matchAll(/\[(?:GUIA|G):\s*([^\|\]]+?)(?:\|\s*(?:EMPRESA|E):\s*([^\|\]]+?))?(?:\|\s*(?:ORDEN|O):\s*([^\|\]]+?))?\]/gi);
        for (const match of tagMatches) {
          const gNum = (match[1] || '').trim();
          const gEmp = (match[2] || 'Servientrega').trim();
          const gOrd = match[3] ? match[3].replace(/^#/, '').trim().toUpperCase() : '';

          if (gOrd && (orderIdentifiers.has(gOrd) || Array.from(orderIdentifiers).some(id => id === gOrd || id.includes(gOrd) || gOrd.includes(id)))) {
            trackingNumber = gNum;
            trackingCompany = gEmp;
            break;
          }
        }
      }

      // 2. Si no se encontró en la ficha de cliente, revisar la nota del recibo específico
      if (!trackingNumber) {
        const receiptGuiaTag = note.match(/\[(?:GUIA|G):\s*([^\|\]]+?)(?:\|\s*(?:EMPRESA|E):\s*([^\|\]]+?))?(?:\|\s*(?:ORDEN|O):\s*([^\|\]]+?))?\]/i);
        if (receiptGuiaTag) {
          trackingNumber = receiptGuiaTag[1].trim();
          if (receiptGuiaTag[2]) trackingCompany = receiptGuiaTag[2].trim();
        } else {
          const rawGuiaMatch = note.match(/GU[ÍI]A:\s*([^\s•|]+)/i);
          if (rawGuiaMatch) {
            trackingNumber = rawGuiaMatch[1].trim();
          }
        }
      }

      return {
        customer_name: name,
        customer: {
          name,
          email,
          phone,
          document,
        },
        shippingAddress: {
          address,
          city,
          department,
          recipientName: ord.shippingAddress?.recipientName || name,
          recipientPhone: ord.shippingAddress?.recipientPhone || phone,
          apartment: ord.shippingAddress?.apartment || '',
          specialInstructions: ord.shippingAddress?.specialInstructions || '',
          isAlternateAddress: ord.shippingAddress?.isAlternateAddress || false,
        },
        trackingNumber,
        trackingCompany,
        status: trackingNumber ? 'ENVIADO' : 'EN_PREPARACION',
        statusLabel: trackingNumber ? `Enviado con ${trackingCompany}` : 'En Preparación',
      };
    };

    // 1. Órdenes emitidas directamente por la web (Bold / Checkout / Contra entrega)
    const webOrders = recentOrdersList.map((ord: any) => {
      const itemsList = (ord.items || ord.line_items || []).map((li: any) => ({
        name: li.item_name || li.name || 'Prenda URBANNOISE',
        size: li.variant_name || li.size || 'Talla Única',
        quantity: Number(li.quantity || li.qty || 1),
        qty: Number(li.quantity || li.qty || 1),
        price: Number(li.price || 0),
        total: Number(li.total_money || li.gross_total_money || li.total || ((li.price || 0) * (li.quantity || li.qty || 1))),
        sku: li.sku || 'N/A',
        image: li.image || null,
      }));

      const resolved = resolveCustomer(ord);

      return {
        ...ord,
        ...resolved,
        isWeb: true,
        channel: 'Tienda Web',
        orderId: ord.orderId || ord.id,
        receipt_number: ord.loyverseReceipt?.receipt_number || ord.receipt_number || (ord.orderId ? `#WEB-${ord.orderId}` : undefined),
        total_money: Number(ord.totals?.total || ord.amount || ord.total_money || 0),
        payment_type: ord.paymentMethod || ord.payments?.[0]?.name || 'Pasarela Bold / Web',
        created_at: ord.createdAt || ord.created_at,
        items: itemsList,
      };
    });

    // 2. Recibos de Loyverse que tengan origen web (por nota, orderId o source)
    const loyverseWebReceipts = receiptsList.filter((r: any) => {
      const note = (r.note || '').toLowerCase();
      const order = (r.order || '').toLowerCase();
      const source = (r.source || '').toLowerCase();
      // Excluir ventas físicas de mostrador de la tienda
      if (source === 'point of sale' && !note.includes('web')) return false;
      return note.includes('web') || order.length > 0 || source === 'api';
    });

    const combined = [...webOrders];
    for (const lr of loyverseWebReceipts) {
      const parsedItems = (lr.line_items || lr.items || []).map((li: any) => ({
        name: li.item_name || li.name || 'Prenda URBANNOISE',
        size: li.variant_name || li.size || 'Talla Única',
        quantity: Number(li.quantity || li.qty || 1),
        qty: Number(li.quantity || li.qty || 1),
        price: Number(li.price || 0),
        total: Number(li.total_money || li.gross_total_money || li.total || ((li.price || 0) * (li.quantity || li.qty || 1))),
        sku: li.sku || 'N/A',
        image: li.image || null,
      }));

      const existingIdx = combined.findIndex(
        (w) => (lr.receipt_number && w.receipt_number === lr.receipt_number) ||
               (lr.order && (w.orderId === lr.order || w.id === lr.order))
      );

      const resolved = resolveCustomer(lr);

      if (existingIdx >= 0) {
        if (lr.receipt_number) combined[existingIdx].receipt_number = lr.receipt_number;
        if ((!combined[existingIdx].items || combined[existingIdx].items.length === 0) && parsedItems.length > 0) {
          combined[existingIdx].items = parsedItems;
        }
        // Enriquecer la orden existente con todos los datos resueltos del cliente
        combined[existingIdx] = {
          ...combined[existingIdx],
          ...resolved,
        };
      } else {
        combined.push({
          ...lr,
          ...resolved,
          isWeb: true,
          channel: 'Tienda Web',
          orderId: lr.order || lr.receipt_number,
          receipt_number: lr.receipt_number,
          total_money: Number(lr.total_money || 0),
          payment_type: lr.payments?.[0]?.name || lr.paymentMethod || lr.payment_type || 'Bold.co',
          items: parsedItems,
        });
      }
    }

    return combined;
  }, [recentOrdersList, receiptsList, customersList]);

  // Lista unificada completa de todas las ventas (Web + Punto Físico POS)
  const allSalesList = useMemo(() => {
    // 1. Órdenes emitidas directamente por la web
    const webOrders = recentOrdersList.map((ord: any) => ({
      ...ord,
      isWeb: true,
      channel: 'Tienda Web',
      receipt_number: ord.loyverseReceipt?.receipt_number || (ord.orderId ? `#WEB-${ord.orderId}` : '#WEB'),
      customer_name: ord.customer?.name || 'Cliente Web',
      total_money: Number(ord.totals?.total || ord.amount || 0),
      payment_type: ord.paymentMethod || 'Pasarela Bold / Web',
      created_at: ord.createdAt || ord.created_at || new Date().toISOString(),
      status: ord.loyverseSyncStatus === 'SUCCESS' ? 'Sincronizado' : 'Confirmado',
    }));

    // 2. Todos los recibos de Loyverse POS
    const posReceipts = receiptsList.map((r: any) => {
      const note = (r.note || '').toLowerCase();
      const order = (r.order || '').toLowerCase();
      const source = (r.source || '').toLowerCase();
      const isWeb = note.includes('web') || order.length > 0 || source === 'api';
      return {
        ...r,
        isWeb,
        channel: isWeb ? 'Tienda Web' : 'Punto Físico POS',
        receipt_number: r.receipt_number || (r.id ? `#REC-${r.id.slice(0, 6)}` : '#REC'),
        customer_name: r.customer_name || r.customer?.name || (isWeb ? 'Cliente Web' : 'Cliente Mostrador'),
        total_money: Number(r.total_money || 0),
        payment_type: r.paymentMethod || r.payment_type || (isWeb ? 'Pasarela Web' : 'Efectivo / POS'),
        created_at: r.created_at || r.receipt_date || new Date().toISOString(),
        status: 'Completado',
      };
    });

    // Combinar sin duplicados
    const combined = [...webOrders];
    for (const pos of posReceipts) {
      const exists = combined.some(
        (w) => w.receipt_number === pos.receipt_number || (pos.order && w.orderId === pos.order)
      );
      if (!exists) {
        combined.push(pos);
      }
    }

    return combined.sort((a, b) => {
      const da = new Date(a.created_at).getTime() || 0;
      const db = new Date(b.created_at).getTime() || 0;
      return db - da;
    });
  }, [recentOrdersList, receiptsList]);

  // Estadísticas de ventas para el Dashboard (Hoy, Mes, Año, Ticket Promedio)
  const salesStats = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentDateStr = now.toISOString().slice(0, 10);

    let todaySales = 0;
    let todayOrders = 0;
    let monthSales = 0;
    let monthOrders = 0;
    let yearSales = 0;
    let yearOrders = 0;
    let totalSales = 0;
    const webSalesOnly = allSalesList.filter((s) => s.isWeb);
    const totalOrders = webSalesOnly.length;

    for (const item of webSalesOnly) {
      const amount = Number(item.total_money || 0);
      totalSales += amount;

      const d = new Date(item.created_at);
      if (isNaN(d.getTime())) continue;

      const itemYear = d.getFullYear();
      const itemMonth = d.getMonth();
      const itemDateStr = d.toISOString().slice(0, 10);

      if (itemYear === currentYear) {
        yearSales += amount;
        yearOrders += 1;

        if (itemMonth === currentMonth) {
          monthSales += amount;
          monthOrders += 1;

          if (itemDateStr === currentDateStr) {
            todaySales += amount;
            todayOrders += 1;
          }
        }
      }
    }

    const avgTicket = totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0;

    return {
      todaySales,
      todayOrders,
      monthSales,
      monthOrders,
      yearSales,
      yearOrders,
      totalSales,
      totalOrders,
      avgTicket,
    };
  }, [allSalesList]);

  // Procesamiento del Reporte Detallado de Ventas (Año, Mes, Día)
  const reportData = useMemo(() => {
    // 1. Filtrar por ámbito (Todas vs Solo Web)
    const baseList = salesScopeFilter === 'web'
      ? allSalesList.filter((s) => s.isWeb)
      : allSalesList;

    // 2. Filtrar por período seleccionado
    const filteredByPeriod = baseList.filter((item) => {
      const d = new Date(item.created_at);
      if (isNaN(d.getTime())) return false;

      if (salesReportPeriod === 'year') {
        return d.getFullYear() === salesReportYear;
      }
      if (salesReportPeriod === 'month') {
        return d.getFullYear() === salesReportYear && d.getMonth() === salesReportMonth;
      }
      if (salesReportPeriod === 'day') {
        return d.toISOString().slice(0, 10) === salesReportDay;
      }
      return true;
    });

    // 3. Filtrar por término de búsqueda si existe
    const query = salesQuery.trim().toLowerCase();
    const finalItems = query
      ? filteredByPeriod.filter(
          (item) =>
            (item.receipt_number && item.receipt_number.toLowerCase().includes(query)) ||
            (item.customer_name && item.customer_name.toLowerCase().includes(query)) ||
            (item.payment_type && item.payment_type.toLowerCase().includes(query))
        )
      : filteredByPeriod;

    // Métricas del período
    const periodTotal = filteredByPeriod.reduce((acc, i) => acc + (Number(i.total_money) || 0), 0);
    const periodOrdersCount = filteredByPeriod.length;
    const periodAvgTicket = periodOrdersCount > 0 ? Math.round(periodTotal / periodOrdersCount) : 0;
    const periodMaxSale = filteredByPeriod.reduce((max, i) => Math.max(max, Number(i.total_money) || 0), 0);

    // Datos para el gráfico de barras según el período
    let chartBars: { label: string; fullLabel: string; total: number; count: number }[] = [];

    if (salesReportPeriod === 'year') {
      const monthAbbrs = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      chartBars = monthAbbrs.map((label, idx) => {
        const monthItems = baseList.filter((item) => {
          const d = new Date(item.created_at);
          return !isNaN(d.getTime()) && d.getFullYear() === salesReportYear && d.getMonth() === idx;
        });
        const total = monthItems.reduce((acc, i) => acc + (Number(i.total_money) || 0), 0);
        return {
          label,
          fullLabel: `${MONTH_NAMES[idx]} ${salesReportYear}`,
          total,
          count: monthItems.length,
        };
      });
    } else if (salesReportPeriod === 'month') {
      const daysInMonth = new Date(salesReportYear, salesReportMonth + 1, 0).getDate();
      chartBars = Array.from({ length: daysInMonth }, (_, idx) => {
        const dayNum = idx + 1;
        const dayStr = `${salesReportYear}-${String(salesReportMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
        const dayItems = baseList.filter((item) => {
          const d = new Date(item.created_at);
          return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === dayStr;
        });
        const total = dayItems.reduce((acc, i) => acc + (Number(i.total_money) || 0), 0);
        return {
          label: `${dayNum}`,
          fullLabel: `${dayNum} de ${MONTH_NAMES[salesReportMonth]}`,
          total,
          count: dayItems.length,
        };
      });
    } else if (salesReportPeriod === 'day') {
      const hours = [
        { label: '08:00', start: 8, end: 10 },
        { label: '10:00', start: 10, end: 12 },
        { label: '12:00', start: 12, end: 14 },
        { label: '14:00', start: 14, end: 16 },
        { label: '16:00', start: 16, end: 18 },
        { label: '18:00', start: 18, end: 20 },
        { label: '20:00+', start: 20, end: 24 },
      ];
      chartBars = hours.map((h) => {
        const hourItems = baseList.filter((item) => {
          const d = new Date(item.created_at);
          if (isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== salesReportDay) return false;
          const hr = d.getHours();
          return hr >= h.start && hr < h.end;
        });
        const total = hourItems.reduce((acc, i) => acc + (Number(i.total_money) || 0), 0);
        return {
          label: h.label,
          fullLabel: `Franja ${h.label}`,
          total,
          count: hourItems.length,
        };
      });
    }

    const maxChartValue = chartBars.reduce((m, b) => Math.max(m, b.total), 0) || 1;

    return {
      items: finalItems,
      total: periodTotal,
      ordersCount: periodOrdersCount,
      avgTicket: periodAvgTicket,
      maxSale: periodMaxSale,
      chartBars,
      maxChartValue,
    };
  }, [
    allSalesList,
    salesScopeFilter,
    salesReportPeriod,
    salesReportYear,
    salesReportMonth,
    salesReportDay,
    salesQuery,
  ]);

  // Exportar ventas a CSV
  const handleExportSalesCSV = () => {
    if (reportData.items.length === 0) return;
    const headers = ['Recibo / Orden', 'Fecha', 'Cliente', 'Canal', 'Metodo de Pago', 'Total COP', 'Estado'];
    const rows = reportData.items.map((i) => [
      `"${i.receipt_number || ''}"`,
      `"${i.created_at ? new Date(i.created_at).toLocaleString('es-CO') : ''}"`,
      `"${i.customer_name || ''}"`,
      `"${i.channel || ''}"`,
      `"${i.payment_type || ''}"`,
      i.total_money || 0,
      `"${i.status || 'Completado'}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `reporte_ventas_${salesReportPeriod}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtrado de Prendas
  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const query = searchTerm.toLowerCase();
    const matchesSearch =
      !query ||
      p.name.toLowerCase().includes(query) ||
      (p.sku && p.sku.toLowerCase().includes(query)) ||
      p.desc.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] w-screen h-screen bg-[#0C0D12] text-[#F3F4F6] flex flex-col overflow-hidden overscroll-contain font-sans antialiased">
      {/* ========================================================= */}
      {/* 1. TOP HEADER BAR OFICIAL DEL STUDIO CMS                   */}
      {/* ========================================================= */}
      <header className="h-14 sm:h-16 bg-[#12131A] border-b border-white/10 px-4 sm:px-6 flex items-center justify-between flex-shrink-0 z-20">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="w-8 h-8 rounded bg-[#F5F2E4] text-[#101013] flex items-center justify-center font-black text-sm tracking-tight shadow">
            UN
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-sm sm:text-base uppercase tracking-tight text-[#F5F2E4]">
                URBANNOISE STUDIO
              </span>
              <span className="bg-[#D9C4AB]/15 text-[#D9C4AB] border border-[#D9C4AB]/30 text-[9px] font-mono font-bold px-1.5 py-0.2 rounded">
                CMS / ERP v2.6
              </span>
            </div>
            <div className="hidden sm:flex items-center space-x-2 text-[10px] text-white/50">
              <Store className="w-3 h-3 text-[#D9C4AB]" />
              <span>Flagship El GranSan • Local 23-54, Bogotá</span>
            </div>
          </div>
        </div>

        {/* Indicadores de Conexión en Vivo + Botones Rápidos */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Badge Loyverse */}
          <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 bg-white/5 rounded-full border border-white/10 text-[10.5px]">
            <span
              className={`w-2 h-2 rounded-full ${
                loyverseStatus.configured ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span className="text-white/80 font-medium">
              Punto de Venta POS: {loyverseStatus.configured ? 'Conectado' : 'Sin Token'}
            </span>
          </div>

          {/* Badge Bold */}
          <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 bg-white/5 rounded-full border border-white/10 text-[10.5px]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#002D62]" />
            <span className="text-white/80 font-medium">
              Bold.co: {boldConfig.configured ? 'Producción' : 'Sandbox SHA-256'}
            </span>
          </div>

          {/* Sincronizar Botón */}
          {authenticated && (
            <button
              onClick={handleSyncCatalog}
              disabled={isSyncing}
              title="Sincronizar en tiempo real con Punto de Venta POS"
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 active:scale-95 text-white rounded text-xs font-bold transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-[#D9C4AB]' : ''}`} />
              <span className="hidden sm:inline">{isSyncing ? 'Sincronizando...' : 'Sincronizar'}</span>
            </button>
          )}

          {/* Botón Volver a la Tienda Web (Cerrar Studio) */}
          <button
            onClick={onClose}
            className="flex items-center space-x-1.5 px-3 sm:px-4 py-1.5 bg-[#F5F2E4] hover:bg-[#D9C4AB] text-[#101013] rounded text-xs font-black uppercase tracking-wider transition cursor-pointer shadow"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Ver Tienda</span>
          </button>

          {authenticated && (
            <>
              <button
                onClick={() => {
                  if (window.confirm('¿Deseas activar el Modo Construcción y bloquear la tienda con la clave privada?')) {
                    try {
                      localStorage.removeItem('urbannoise_site_unlocked');
                      sessionStorage.removeItem('urbannoise_site_unlocked_session');
                    } catch {}
                    window.dispatchEvent(new CustomEvent('urbannoise_lock_gate'));
                    onClose();
                  }
                }}
                title="Activar Modo Construcción (Bloqueo con clave)"
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 rounded text-xs font-bold transition cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Modo Construcción</span>
              </button>

              <button
                onClick={handleLogout}
                title="Cerrar Sesión Administrador"
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 rounded text-xs font-bold transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cerrar Sesión</span>
              </button>
            </>
          )}
        </div>
      </header>

      {/* ========================================================= */}
      {/* 2. AUTENTICACIÓN ADMIN (PANTALLA DE ACCESO RESTRINGIDO)   */}
      {/* ========================================================= */}
      {!authenticated ? (
        <div className="flex-1 flex items-center justify-center p-4 bg-[#0C0D12]">
          <div className="w-full max-w-md bg-[#14151D] border border-white/15 p-6 sm:p-8 rounded-xl shadow-2xl text-center space-y-5">
            <div className="w-14 h-14 rounded-full bg-white/5 border border-white/15 flex items-center justify-center mx-auto text-[#D9C4AB]">
              <Lock className="w-6 h-6" />
            </div>

            <div>
              <h2 className="text-xl font-black uppercase tracking-tight text-[#F5F2E4]">
                ACCESO RESTRINGIDO • CMS STUDIO
              </h2>
              <p className="text-xs text-white/60 mt-1">
                Panel de control exclusivo para administradores de URBANNOISE S.A.S.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-3.5 text-left">
              <div>
                <label htmlFor="admin-pin-input" className="block text-[11px] uppercase font-bold text-white/70 mb-1">
                  Ingresa tu PIN o Correo Administrador
                </label>
                <input
                  id="admin-pin-input"
                  name="adminPin"
                  type="password"
                  autoComplete="current-password"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-black/60 border border-white/20 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#D9C4AB] font-mono tracking-wider"
                  autoFocus
                />
              </div>

              {authError && (
                <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded text-xs text-red-400 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-[#F5F2E4] hover:bg-[#D9C4AB] text-[#101013] font-black text-xs uppercase tracking-widest py-3 rounded-lg transition cursor-pointer shadow-lg"
              >
                INGRESAR AL STUDIO CMS
              </button>
            </form>

            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-white/40">
              <span>URBANNOISE S.A.S. • Bogotá</span>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onLogout) onLogout();
                }}
                className="text-[#D9C4AB] hover:underline cursor-pointer font-bold"
              >
                ← Volver a la tienda web
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ========================================================= */
        /* 3. LAYOUT FULLSCREEN CMS: SIDEBAR + ÁREA DE TRABAJO       */
        /* ========================================================= */
        <div className="flex-1 flex overflow-hidden">
          {/* BARRA LATERAL (SIDEBAR DE MÓDULOS) */}
          <aside className="w-56 sm:w-64 bg-[#12131A] border-r border-white/10 flex flex-col justify-between flex-shrink-0 overflow-y-auto">
            <div className="p-3 space-y-1">
              <div className="px-3 py-2 text-[10px] uppercase font-bold tracking-widest text-[#D9C4AB]/70">
                GESTIÓN DEL NEGOCIO
              </div>

              {/* Módulo 1: Dashboard */}
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold transition flex items-center space-x-2.5 cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'bg-[#F5F2E4] text-[#101013] shadow'
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">Panel General & KPIs</span>
              </button>

              {/* Módulo 2: Reporte de Ventas (Año / Mes / Día) */}
              <button
                onClick={() => setActiveTab('sales-report')}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                  activeTab === 'sales-report'
                    ? 'bg-[#F5F2E4] text-[#101013] shadow'
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-2.5 truncate">
                  <TrendingUp className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                  <span className="truncate">Reporte de Ventas</span>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                  Año/Mes/Día
                </span>
              </button>

              {/* Módulo 3: Catálogo Web */}
              <button
                onClick={() => setActiveTab('catalog')}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                  activeTab === 'catalog'
                    ? 'bg-[#F5F2E4] text-[#101013] shadow'
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-2.5 truncate">
                  <Package className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">Catálogo & Fotos</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/20 font-mono">
                  {products.length}
                </span>
              </button>

              {/* Módulo: Portada & Textos Web */}
              <button
                onClick={() => setActiveTab('hero-content')}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                  activeTab === 'hero-content'
                    ? 'bg-[#F5F2E4] text-[#101013] shadow'
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-2.5 truncate">
                  <LayoutTemplate className="w-4 h-4 flex-shrink-0 text-amber-300" />
                  <span className="truncate">Portada & Textos</span>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold">
                  CMS
                </span>
              </button>

              {/* Módulo 3: Recibos & Ventas Web */}
              <button
                onClick={() => setActiveTab('receipts')}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                  activeTab === 'receipts'
                    ? 'bg-[#F5F2E4] text-[#101013] shadow'
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-2.5 truncate">
                  <Receipt className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">Ventas Web & Recibos</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/20 font-mono">
                  {webReceiptsList.length}
                </span>
              </button>

              <div className="pt-3 px-3 py-2 text-[10px] uppercase font-bold tracking-widest text-[#D9C4AB]/70">
                CLIENTES & MARKETING
              </div>

              {/* Módulo 4: Clientes Loyverse */}
              <button
                onClick={() => setActiveTab('customers')}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                  activeTab === 'customers'
                    ? 'bg-[#F5F2E4] text-[#101013] shadow'
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-2.5 truncate">
                  <Users className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">Clientes CRM</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/20 font-mono">
                  {customersList.length}
                </span>
              </button>

              {/* Módulo 5: Descuentos */}
              <button
                onClick={() => setActiveTab('discounts')}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold transition flex items-center space-x-2.5 cursor-pointer ${
                  activeTab === 'discounts'
                    ? 'bg-[#F5F2E4] text-[#101013] shadow'
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Percent className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">Descuentos & Promos</span>
              </button>

              <div className="pt-3 px-3 py-2 text-[10px] uppercase font-bold tracking-widest text-[#D9C4AB]/70">
                PASARELA DE PAGO
              </div>

              {/* Módulo 6: Pasarela Bold.co */}
              <button
                onClick={() => setActiveTab('bold-gateway')}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold transition flex items-center space-x-2.5 cursor-pointer ${
                  activeTab === 'bold-gateway'
                    ? 'bg-[#F5F2E4] text-[#101013] shadow'
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                <CreditCard className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">Pasarela Bold.co</span>
              </button>
            </div>

            {/* Footer de la Barra Lateral */}
            <div className="p-3 border-t border-white/10 bg-black/20 text-[11px] text-white/50 space-y-1">
              <div className="flex items-center justify-between font-mono text-[10px]">
                <span>SESIÓN ACTIVA</span>
                <span className="text-emerald-400">ADMIN</span>
              </div>
              <p className="text-[10px] truncate">urban.noice@gmail.com</p>
            </div>
          </aside>

          {/* ========================================================= */}
          {/* 4. ÁREA CENTRAL DE TRABAJO (RENDERIZA EL MÓDULO ACTIVO)  */}
          {/* ========================================================= */}
          <main className="flex-1 bg-[#0C0D12] overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6">

              {/* =================================================== */}
              {/* TAB 1: DASHBOARD & KPIS                             */}
              {/* =================================================== */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  {/* Encabezado del Dashboard */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
                    <div>
                      <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-[#F5F2E4]">
                        Panel de Control • URBANNOISE Studio
                      </h1>
                      <p className="text-xs text-white/60 mt-1">
                        Monitoreo integral de ventas por año, mes y día, enriquecimiento de fotos y pasarela de pagos.
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setActiveTab('sales-report')}
                        className="bg-[#F5F2E4] hover:bg-[#D9C4AB] text-[#101013] font-black text-xs uppercase tracking-wider px-3.5 py-2 rounded-lg transition flex items-center space-x-1.5 cursor-pointer shadow"
                      >
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>Ver Reporte de Ventas</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('catalog')}
                        className="bg-white/10 hover:bg-white/15 text-white font-bold text-xs px-3.5 py-2 rounded-lg transition cursor-pointer flex items-center space-x-1.5"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>Catálogo & Fotos</span>
                      </button>
                    </div>
                  </div>

                  {/* Tarjetas de Métricas Principales (Ventas Hoy, Mes, Año y Catálogo con Fotos) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Tarjeta 1: Ventas Hoy */}
                    <div
                      onClick={() => {
                        setSalesReportPeriod('day');
                        setSalesReportDay(new Date().toISOString().slice(0, 10));
                        setActiveTab('sales-report');
                      }}
                      className="bg-[#14151D] border border-white/10 hover:border-emerald-500/50 rounded-xl p-4 sm:p-5 space-y-2 transition cursor-pointer group"
                    >
                      <div className="flex items-center justify-between text-xs text-white/60">
                        <span className="font-bold uppercase tracking-wider">Ventas Hoy (Día)</span>
                        <DollarSign className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition" />
                      </div>
                      <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono truncate">
                        {formatCOP(salesStats.todaySales)}
                      </div>
                      <div className="text-[11px] text-white/70 flex items-center justify-between">
                        <span>{salesStats.todayOrders} {salesStats.todayOrders === 1 ? 'pedido' : 'pedidos'} procesados</span>
                        <span className="text-emerald-400 font-bold group-hover:translate-x-0.5 transition">Ver día →</span>
                      </div>
                    </div>

                    {/* Tarjeta 2: Ventas Este Mes */}
                    <div
                      onClick={() => {
                        setSalesReportPeriod('month');
                        setSalesReportYear(new Date().getFullYear());
                        setSalesReportMonth(new Date().getMonth());
                        setActiveTab('sales-report');
                      }}
                      className="bg-[#14151D] border border-white/10 hover:border-cyan-500/50 rounded-xl p-4 sm:p-5 space-y-2 transition cursor-pointer group"
                    >
                      <div className="flex items-center justify-between text-xs text-white/60">
                        <span className="font-bold uppercase tracking-wider">Ventas Este Mes</span>
                        <Calendar className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition" />
                      </div>
                      <div className="text-2xl sm:text-3xl font-black text-cyan-400 font-mono truncate">
                        {formatCOP(salesStats.monthSales)}
                      </div>
                      <div className="text-[11px] text-white/70 flex items-center justify-between">
                        <span>{salesStats.monthOrders} pedidos en {MONTH_NAMES[new Date().getMonth()]}</span>
                        <span className="text-cyan-400 font-bold group-hover:translate-x-0.5 transition">Ver mes →</span>
                      </div>
                    </div>

                    {/* Tarjeta 3: Ventas Este Año */}
                    <div
                      onClick={() => {
                        setSalesReportPeriod('year');
                        setSalesReportYear(new Date().getFullYear());
                        setActiveTab('sales-report');
                      }}
                      className="bg-[#14151D] border border-white/10 hover:border-amber-500/50 rounded-xl p-4 sm:p-5 space-y-2 transition cursor-pointer group"
                    >
                      <div className="flex items-center justify-between text-xs text-white/60">
                        <span className="font-bold uppercase tracking-wider">Ventas Este Año</span>
                        <TrendingUp className="w-4 h-4 text-amber-400 group-hover:scale-110 transition" />
                      </div>
                      <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono truncate">
                        {formatCOP(salesStats.yearSales)}
                      </div>
                      <div className="text-[11px] text-white/70 flex items-center justify-between">
                        <span>{salesStats.yearOrders} pedidos en {new Date().getFullYear()}</span>
                        <span className="text-amber-400 font-bold group-hover:translate-x-0.5 transition">Ver año →</span>
                      </div>
                    </div>

                    {/* Tarjeta 4: Catálogo Web con Fotos */}
                    <div
                      onClick={() => setActiveTab('catalog')}
                      className="bg-[#14151D] border border-white/10 hover:border-purple-500/50 rounded-xl p-4 sm:p-5 space-y-2 transition cursor-pointer group"
                    >
                      <div className="flex items-center justify-between text-xs text-white/60">
                        <span className="font-bold uppercase tracking-wider">Catálogo Web Activo</span>
                        <ImageIcon className="w-4 h-4 text-purple-400 group-hover:scale-110 transition" />
                      </div>
                      <div className="text-2xl sm:text-3xl font-black text-[#F5F2E4] font-mono">
                        {metrics.withCustomImagesCount} <span className="text-xs text-white/50 font-normal">/ {metrics.totalItems}</span>
                      </div>
                      <div className="text-[11px] text-emerald-400 flex items-center space-x-1">
                        <span>● {metrics.withCustomImagesCount} visibles con fotos • {metrics.pendingImagesCount} pendientes</span>
                      </div>
                    </div>
                  </div>

                  {/* Accesos Rápidos de Administración */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div
                      onClick={() => setActiveTab('catalog')}
                      className="bg-[#14151D] border border-white/10 hover:border-[#D9C4AB] p-5 rounded-xl transition cursor-pointer group"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-[#D9C4AB] group-hover:scale-110 transition">
                          <ImageIcon className="w-5 h-5" />
                        </div>
                        <ChevronRight className="w-4 h-4 text-white/40 group-hover:translate-x-1 transition" />
                      </div>
                      <h4 className="font-bold text-sm text-[#F5F2E4] uppercase">Gestión de Catálogo & Fotos</h4>
                      <p className="text-xs text-white/60 mt-1">
                        Sube fotografías desde tu dispositivo, personaliza la foto principal y descripciones para publicar en la web.
                      </p>
                    </div>

                    <div
                      onClick={() => setActiveTab('sales-report')}
                      className="bg-[#14151D] border border-white/10 hover:border-emerald-500 p-5 rounded-xl transition cursor-pointer group"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition">
                          <TrendingUp className="w-5 h-5" />
                        </div>
                        <ChevronRight className="w-4 h-4 text-white/40 group-hover:translate-x-1 transition" />
                      </div>
                      <h4 className="font-bold text-sm text-[#F5F2E4] uppercase">Reporte de Ventas (Año / Mes / Día)</h4>
                      <p className="text-xs text-white/60 mt-1">
                        Visualiza gráficos de facturación, desglose por meses, días y tickets promedio en tiempo real.
                      </p>
                    </div>

                    <div
                      onClick={() => setActiveTab('bold-gateway')}
                      className="bg-[#14151D] border border-white/10 hover:border-[#002D62] p-5 rounded-xl transition cursor-pointer group"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-lg bg-[#002D62]/30 flex items-center justify-center text-[#5C94D4] group-hover:scale-110 transition">
                          <CreditCard className="w-5 h-5" />
                        </div>
                        <ChevronRight className="w-4 h-4 text-white/40 group-hover:translate-x-1 transition" />
                      </div>
                      <h4 className="font-bold text-sm text-[#F5F2E4] uppercase">Pasarela Bold.co & Recibos</h4>
                      <p className="text-xs text-white/60 mt-1">
                        Configura llaves de producción, monitorea firmas SHA-256 y emisión automática de recibos POS.
                      </p>
                    </div>
                  </div>

                  {/* Resumen de Últimos Recibos y Órdenes Web */}
                  <div className="bg-[#14151D] border border-white/10 rounded-xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Receipt className="w-4 h-4 text-[#D9C4AB]" />
                        <h3 className="font-extrabold text-sm uppercase text-[#F5F2E4]">
                          Últimos Pedidos & Recibos Web
                        </h3>
                      </div>
                      <button
                        onClick={() => setActiveTab('receipts')}
                        className="text-xs text-[#D9C4AB] hover:underline cursor-pointer"
                      >
                        Ver todos los recibos web →
                      </button>
                    </div>

                    {webReceiptsList.length === 0 ? (
                      <div className="py-8 text-center text-white/50 space-y-1 bg-black/20 rounded-lg">
                        <p className="font-bold text-white/70 text-xs">Sin ventas web registradas aún</p>
                        <p className="text-[11px] text-white/40 max-w-sm mx-auto">
                          Los pedidos realizados por clientes a través de la página web aparecerán aquí con su recibo y método de pago.
                        </p>
                      </div>
                    ) : (
                      <div className="divide-y divide-white/10 text-xs">
                        {webReceiptsList.slice(0, 5).map((item, idx) => (
                          <div key={idx} className="py-2.5 flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <span className="font-mono font-bold text-white bg-white/5 px-2 py-1 rounded">
                                {item.receipt_number || `#WEB-${item.orderId || '10' + idx}`}
                              </span>
                              <div>
                                <p className="text-white/80 font-medium">
                                  {item.customer?.name || item.customer_name || 'Cliente Web'}
                                </p>
                                <span className="text-[10px] text-white/50">
                                  {item.created_at ? new Date(item.created_at).toLocaleString('es-CO') : 'Reciente'}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="font-bold font-mono text-emerald-400">
                                {formatCOP(item.total_money || item.totals?.total || 0)}
                              </span>
                              <span className="block text-[9.5px] text-white/50 uppercase">
                                {item.paymentMethod || item.payment_type || 'Web / Pasarela'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* =================================================== */}
              {/* TAB: REPORTE DE VENTAS (AÑO / MES / DÍA)           */}
              {/* =================================================== */}
              {activeTab === 'sales-report' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  {/* Encabezado y Filtros Globales */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/10">
                    <div>
                      <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-[#F5F2E4] flex items-center space-x-2.5">
                        <TrendingUp className="w-6 h-6 text-emerald-400" />
                        <span>Reporte de Ventas • Año, Mes y Día</span>
                      </h1>
                      <p className="text-xs text-white/60 mt-1">
                        Análisis financiero integral de ingresos, ticket promedio y pedidos completados.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Ámbito Exclusivo de Tienda Web */}
                      <div className="flex items-center bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white/80 font-bold space-x-2">
                        <Globe className="w-3.5 h-3.5 text-[#D9C4AB]" />
                        <span>Ventas Exclusivas de la Tienda Web ({webReceiptsList.length})</span>
                      </div>

                      {/* Botón Exportar CSV */}
                      <button
                        onClick={handleExportSalesCSV}
                        disabled={reportData.items.length === 0}
                        title="Descargar datos en formato CSV para Excel"
                        className="flex items-center space-x-1.5 px-3 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-bold transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Exportar CSV</span>
                      </button>
                    </div>
                  </div>

                  {/* Selector de Período: AÑO | MES | DÍA */}
                  <div className="bg-[#14151D] border border-white/10 p-4 rounded-xl space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                      <div className="flex items-center space-x-2">
                        <CalendarDays className="w-4 h-4 text-[#D9C4AB]" />
                        <span className="text-xs uppercase font-extrabold text-white tracking-wider">
                          Período de Análisis:
                        </span>
                      </div>

                      {/* Selector de Modo */}
                      <div className="grid grid-cols-3 gap-1 bg-black/40 p-1 rounded-lg border border-white/10 w-full sm:w-auto">
                        <button
                          onClick={() => setSalesReportPeriod('year')}
                          className={`px-4 py-1.5 rounded-md text-xs font-black uppercase tracking-wider transition cursor-pointer text-center ${
                            salesReportPeriod === 'year'
                              ? 'bg-[#F5F2E4] text-[#101013] shadow'
                              : 'text-white/60 hover:text-white'
                          }`}
                        >
                          Por Año
                        </button>
                        <button
                          onClick={() => setSalesReportPeriod('month')}
                          className={`px-4 py-1.5 rounded-md text-xs font-black uppercase tracking-wider transition cursor-pointer text-center ${
                            salesReportPeriod === 'month'
                              ? 'bg-[#F5F2E4] text-[#101013] shadow'
                              : 'text-white/60 hover:text-white'
                          }`}
                        >
                          Por Mes
                        </button>
                        <button
                          onClick={() => setSalesReportPeriod('day')}
                          className={`px-4 py-1.5 rounded-md text-xs font-black uppercase tracking-wider transition cursor-pointer text-center ${
                            salesReportPeriod === 'day'
                              ? 'bg-[#F5F2E4] text-[#101013] shadow'
                              : 'text-white/60 hover:text-white'
                          }`}
                        >
                          Por Día
                        </button>
                      </div>
                    </div>

                    {/* Controles Dinámicos según el período seleccionado */}
                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      {salesReportPeriod === 'year' && (
                        <div className="flex items-center space-x-2">
                          <label htmlFor="sales-report-year-select" className="text-xs text-white/60 font-bold uppercase">Año:</label>
                          <select
                            id="sales-report-year-select"
                            name="salesReportYear"
                            value={salesReportYear}
                            onChange={(e) => setSalesReportYear(Number(e.target.value))}
                            className="bg-black/60 border border-white/20 rounded-lg px-3 py-1.5 text-xs text-white font-mono font-bold focus:outline-none focus:border-[#D9C4AB]"
                          >
                            {[2027, 2026, 2025, 2024].map((yr) => (
                              <option key={yr} value={yr}>
                                {yr}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {salesReportPeriod === 'month' && (
                        <>
                          <div className="flex items-center space-x-2">
                            <label htmlFor="sales-report-month-year-select" className="text-xs text-white/60 font-bold uppercase">Año:</label>
                            <select
                              id="sales-report-month-year-select"
                              name="salesReportMonthYear"
                              value={salesReportYear}
                              onChange={(e) => setSalesReportYear(Number(e.target.value))}
                              className="bg-black/60 border border-white/20 rounded-lg px-3 py-1.5 text-xs text-white font-mono font-bold focus:outline-none focus:border-[#D9C4AB]"
                            >
                              {[2027, 2026, 2025, 2024].map((yr) => (
                                <option key={yr} value={yr}>
                                  {yr}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="flex items-center space-x-2">
                            <label htmlFor="sales-report-month-select" className="text-xs text-white/60 font-bold uppercase">Mes:</label>
                            <select
                              id="sales-report-month-select"
                              name="salesReportMonth"
                              value={salesReportMonth}
                              onChange={(e) => setSalesReportMonth(Number(e.target.value))}
                              className="bg-black/60 border border-white/20 rounded-lg px-3 py-1.5 text-xs text-white font-bold focus:outline-none focus:border-[#D9C4AB]"
                            >
                              {MONTH_NAMES.map((mName, idx) => (
                                <option key={idx} value={idx}>
                                  {mName}
                                </option>
                              ))}
                            </select>
                          </div>
                        </>
                      )}

                      {salesReportPeriod === 'day' && (
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="flex items-center space-x-2">
                            <label htmlFor="sales-report-day-input" className="text-xs text-white/60 font-bold uppercase">Fecha:</label>
                            <input
                              id="sales-report-day-input"
                              name="salesReportDay"
                              type="date"
                              value={salesReportDay}
                              onChange={(e) => setSalesReportDay(e.target.value)}
                              className="bg-black/60 border border-white/20 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-[#D9C4AB]"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => setSalesReportDay(new Date().toISOString().slice(0, 10))}
                            className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 text-white/80 rounded text-xs font-bold transition cursor-pointer"
                          >
                            Hoy
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const y = new Date();
                              y.setDate(y.getDate() - 1);
                              setSalesReportDay(y.toISOString().slice(0, 10));
                            }}
                            className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 text-white/80 rounded text-xs font-bold transition cursor-pointer"
                          >
                            Ayer
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 4 Tarjetas de Métricas del Período Seleccionado */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-[#14151D] border border-white/10 rounded-xl p-4 sm:p-5 space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-white/60">
                        <span className="font-bold uppercase tracking-wider">Facturación Total</span>
                        <DollarSign className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono truncate">
                        {formatCOP(reportData.total)}
                      </div>
                      <p className="text-[11px] text-white/50">
                        Total en {salesReportPeriod === 'year' ? `Año ${salesReportYear}` : salesReportPeriod === 'month' ? `${MONTH_NAMES[salesReportMonth]} ${salesReportYear}` : salesReportDay}
                      </p>
                    </div>

                    <div className="bg-[#14151D] border border-white/10 rounded-xl p-4 sm:p-5 space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-white/60">
                        <span className="font-bold uppercase tracking-wider">Pedidos / Recibos</span>
                        <Receipt className="w-4 h-4 text-[#D9C4AB]" />
                      </div>
                      <div className="text-2xl sm:text-3xl font-black text-[#F5F2E4] font-mono">
                        {reportData.ordersCount}
                      </div>
                      <p className="text-[11px] text-white/50">
                        Transacciones completadas
                      </p>
                    </div>

                    <div className="bg-[#14151D] border border-white/10 rounded-xl p-4 sm:p-5 space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-white/60">
                        <span className="font-bold uppercase tracking-wider">Ticket Promedio</span>
                        <TrendingUp className="w-4 h-4 text-cyan-400" />
                      </div>
                      <div className="text-xl sm:text-2xl font-black text-cyan-400 font-mono truncate">
                        {formatCOP(reportData.avgTicket)}
                      </div>
                      <p className="text-[11px] text-white/50">
                        Promedio por venta
                      </p>
                    </div>

                    <div className="bg-[#14151D] border border-white/10 rounded-xl p-4 sm:p-5 space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-white/60">
                        <span className="font-bold uppercase tracking-wider">Venta Más Alta</span>
                        <Sparkles className="w-4 h-4 text-amber-400" />
                      </div>
                      <div className="text-xl sm:text-2xl font-black text-amber-400 font-mono truncate">
                        {formatCOP(reportData.maxSale)}
                      </div>
                      <p className="text-[11px] text-white/50">
                        Mayor monto registrado
                      </p>
                    </div>
                  </div>

                  {/* Gráfico Visual de Barras Interactivo */}
                  <div className="bg-[#14151D] border border-white/10 rounded-xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <BarChart3 className="w-4 h-4 text-[#D9C4AB]" />
                        <h3 className="font-extrabold text-xs uppercase tracking-wider text-[#F5F2E4]">
                          Gráfico de Ventas • {salesReportPeriod === 'year' ? `Desglose Mensual (${salesReportYear})` : salesReportPeriod === 'month' ? `Desglose Diario (${MONTH_NAMES[salesReportMonth]} ${salesReportYear})` : `Franja Horaria (${salesReportDay})`}
                        </h3>
                      </div>
                      <span className="text-[11px] text-white/50 font-mono">
                        Pico máx: {formatCOP(reportData.maxChartValue)}
                      </span>
                    </div>

                    {reportData.chartBars.length === 0 ? (
                      <div className="py-12 text-center text-white/40 text-xs">
                        No hay información disponible para graficar en este período.
                      </div>
                    ) : (
                      <div className="pt-4">
                        <div className="h-48 flex items-end justify-between gap-1 sm:gap-2 px-1 border-b border-white/10 pb-1">
                          {reportData.chartBars.map((bar, bIdx) => {
                            const barHeightPercent = reportData.maxChartValue > 0 && bar.total > 0
                              ? Math.max(6, Math.round((bar.total / reportData.maxChartValue) * 100))
                              : 3;
                            const hasSales = bar.total > 0;

                            return (
                              <div
                                key={bIdx}
                                className="flex-1 flex flex-col items-center h-full justify-end group relative cursor-pointer"
                              >
                                {/* Tooltip flotante al hacer hover */}
                                <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition duration-150 pointer-events-none z-20 bg-black/90 border border-white/20 text-white rounded px-2 py-1 text-[10px] whitespace-nowrap shadow-xl">
                                  <span className="font-bold">{bar.fullLabel}:</span> {formatCOP(bar.total)} ({bar.count} ventas)
                                </div>

                                {/* Barra */}
                                <div
                                  style={{ height: `${barHeightPercent}%` }}
                                  className={`w-full max-w-[36px] rounded-t transition duration-300 group-hover:scale-y-105 origin-bottom ${
                                    hasSales
                                      ? 'bg-gradient-to-t from-emerald-600 to-emerald-400 group-hover:from-emerald-500 group-hover:to-emerald-300'
                                      : 'bg-white/5'
                                  }`}
                                />
                              </div>
                            );
                          })}
                        </div>

                        {/* Etiquetas debajo del gráfico */}
                        <div className="flex justify-between gap-1 sm:gap-2 pt-2 px-1 text-[9.5px] font-mono text-white/50 overflow-x-auto">
                          {reportData.chartBars.map((bar, bIdx) => (
                            <div key={bIdx} className="flex-1 text-center truncate">
                              {bar.label}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Tabla Detallada de Transacciones */}
                  <div className="bg-[#14151D] border border-white/10 rounded-xl p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h3 className="font-extrabold text-sm uppercase text-[#F5F2E4] flex items-center space-x-2">
                          <Receipt className="w-4 h-4 text-[#D9C4AB]" />
                          <span>Detalle de Transacciones ({reportData.items.length})</span>
                        </h3>
                        <p className="text-[11px] text-white/50 mt-0.5">
                          Listado de recibos y órdenes registradas en el período seleccionado.
                        </p>
                      </div>

                      {/* Buscador de ventas */}
                      <div className="relative w-full sm:w-64">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                        <input
                          id="sales-report-query-input"
                          name="salesQuery"
                          type="text"
                          autoComplete="off"
                          value={salesQuery}
                          onChange={(e) => setSalesQuery(e.target.value)}
                          placeholder="Buscar por cliente, recibo..."
                          className="w-full bg-black/50 border border-white/15 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#D9C4AB]"
                        />
                      </div>
                    </div>

                    {reportData.items.length === 0 ? (
                      <div className="py-12 text-center text-white/50 space-y-1 bg-black/20 rounded-lg">
                        <p className="font-bold text-white/70 text-xs">Sin ventas registradas en este período</p>
                        <p className="text-[11px] text-white/40 max-w-sm mx-auto">
                          No se encontraron órdenes o recibos para la fecha o filtros seleccionados.
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-white/10 text-white/50 uppercase font-mono text-[10px]">
                              <th className="py-2.5 px-3">Recibo / Orden</th>
                              <th className="py-2.5 px-3">Fecha y Hora</th>
                              <th className="py-2.5 px-3">Cliente</th>
                              <th className="py-2.5 px-3">Canal</th>
                              <th className="py-2.5 px-3">Método de Pago</th>
                              <th className="py-2.5 px-3 text-right">Total COP</th>
                              <th className="py-2.5 px-3 text-center">Estado</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5 font-sans">
                            {reportData.items.map((item, idx) => (
                              <tr key={idx} className="hover:bg-white/5 transition">
                                <td className="py-3 px-3 font-mono font-bold text-white">
                                  {item.receipt_number || `#WEB-${item.orderId || idx + 1}`}
                                </td>
                                <td className="py-3 px-3 text-white/70 text-[11px]">
                                  {item.created_at ? new Date(item.created_at).toLocaleString('es-CO') : 'Reciente'}
                                </td>
                                <td className="py-3 px-3 text-white font-medium">
                                  {item.customer_name || 'Cliente'}
                                </td>
                                <td className="py-3 px-3">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                      item.isWeb
                                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                    }`}
                                  >
                                    {item.channel || (item.isWeb ? 'Tienda Web' : 'POS Físico')}
                                  </span>
                                </td>
                                <td className="py-3 px-3 text-white/60 text-[11px]">
                                  {item.payment_type || 'Bold / Web'}
                                </td>
                                <td className="py-3 px-3 text-right font-mono font-black text-emerald-400 text-sm">
                                  {formatCOP(item.total_money)}
                                </td>
                                <td className="py-3 px-3 text-center">
                                  <span className="px-2 py-0.5 rounded bg-white/10 text-white/80 text-[10px] font-mono">
                                    {item.status || 'Completado'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* =================================================== */}
              {/* TAB: PORTADA & TEXTOS ESTÁTICOS                    */}
              {/* =================================================== */}
              {activeTab === 'hero-content' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <SiteContentEditor
                    products={products}
                    onCatalogUpdated={onCatalogUpdated}
                    onNavigateToCatalog={(catId) => {
                      if (catId) {
                        setSelectedCategory(catId);
                      }
                      setActiveTab('catalog');
                    }}
                  />
                </div>
              )}

              {/* =================================================== */}
              {/* TAB 2: CATÁLOGO WEB & FOTOS                         */}
              {/* =================================================== */}
              {activeTab === 'catalog' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  {/* Encabezado y Acciones */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
                    <div>
                      <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-[#F5F2E4]">
                        Catálogo de Prendas & Enriquecimiento Web
                      </h1>
                      <p className="text-xs text-white/60 mt-1">
                        Sube fotografías en alta definición, selecciona la imagen de portada y activa tus prendas en la tienda virtual.
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/5 border border-white/10 text-white/80">
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        <span>{products.length} Prendas sincronizadas</span>
                      </span>
                    </div>
                  </div>

                  {/* Barra de Filtros */}
                  <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-[#14151D] p-3.5 rounded-xl border border-white/10">
                    <div className="relative flex-1 max-w-md">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                      <input
                        id="admin-catalog-search-input"
                        name="catalogSearch"
                        type="text"
                        autoComplete="off"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar por nombre, SKU o silueta..."
                        className="w-full bg-black/50 border border-white/15 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#D9C4AB]"
                      />
                    </div>

                    <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0">
                      {[
                        { id: 'all', label: 'Todas' },
                        ...adminCategories.map((c) => ({
                          id: c.id,
                          label: c.menuTitle || c.name,
                        })),
                      ].map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => setSelectedCategory(cat.id)}
                          className={`whitespace-nowrap px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer ${
                            selectedCategory === cat.id
                              ? 'bg-[#F5F2E4] text-[#101013]'
                              : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Cuadrícula de Prendas */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredProducts.map((p) => {
                      const customPhotoCount = (p.images || []).filter(
                        (img) => typeof img === 'string' && !img.includes('loyverse.com') && !img.startsWith('data:')
                      ).length;
                      const hasCustomPhotos = customPhotoCount > 0 && p.isPublished !== false;

                      return (
                        <div
                          key={p.id}
                          className="bg-[#14151D] border border-white/10 hover:border-white/30 rounded-xl overflow-hidden flex flex-col transition group"
                        >
                          {/* Contenedor de Imagen */}
                          <div className="relative aspect-[3/4] bg-black/40 overflow-hidden">
                            {p.image && !p.image.includes('loyverse.com') ? (
                              <img
                                src={p.image}
                                alt={p.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-black/60">
                                <ImageIcon className="w-8 h-8 text-white/20 mb-2" />
                                <span className="text-[11px] font-bold text-amber-400">Sin fotos web</span>
                                <span className="text-[9.5px] text-white/40 mt-0.5">Oculto en tienda virtual</span>
                              </div>
                            )}

                            <div className="absolute top-2 left-2 flex flex-col gap-1">
                              {hasCustomPhotos ? (
                                <span className="bg-emerald-600/90 text-white text-[9px] font-bold px-2 py-0.5 rounded backdrop-blur">
                                  ✓ Visible en Web
                                </span>
                              ) : (
                                <span className="bg-amber-600/90 text-white text-[9px] font-bold px-2 py-0.5 rounded backdrop-blur">
                                  ⚠️ Sin fotos • Oculto
                                </span>
                              )}
                              <span className="bg-black/70 text-white text-[9px] font-mono px-2 py-0.5 rounded backdrop-blur">
                                {customPhotoCount} {customPhotoCount === 1 ? 'Foto' : 'Fotos'}
                              </span>
                            </div>
                          </div>

                          {/* Info y Acciones */}
                          <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2.5">
                            <div>
                              <div className="flex items-center justify-between text-[10px] text-white/50 mb-0.5">
                                <span className="font-mono">{p.sku || p.id}</span>
                                <span className="uppercase text-[#D9C4AB]">{p.category}</span>
                              </div>
                              <h4 className="font-bold text-xs uppercase text-[#F5F2E4] line-clamp-1">
                                {p.name}
                              </h4>
                              <p className="text-xs font-mono font-bold text-white mt-1">
                                {formatCOP(p.price)}
                              </p>
                            </div>

                            <div className="pt-2 border-t border-white/10">
                              <button
                                onClick={() => openEditModal(p)}
                                className="w-full bg-[#F5F2E4] hover:bg-[#D9C4AB] text-[#101013] font-black text-xs uppercase tracking-wider py-2 rounded transition cursor-pointer text-center flex items-center justify-center space-x-1.5 shadow"
                              >
                                <ImageIcon className="w-3.5 h-3.5" />
                                <span>Editar Fotos & Portada</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}



              {/* =================================================== */}
              {/* TAB 4: RECIBOS & VENTAS POS                         */}
              {/* =================================================== */}
              {/* =================================================== */}
              {/* TAB 4: RECIBOS & VENTAS WEB                         */}
              {/* =================================================== */}
              {activeTab === 'receipts' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
                    <div>
                      <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-[#F5F2E4]">
                        Ventas & Recibos de Página Web
                      </h1>
                      <p className="text-xs text-white/60 mt-1">
                        Historial exclusivo de pedidos generados por clientes en la tienda online y sincronizados con el Sistema POS Central.
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setIsLoadingReceipts(true);
                          fetchLoyverseReceipts()
                            .then((d) => setReceiptsList(d.receipts || []))
                            .finally(() => setIsLoadingReceipts(false));
                        }}
                        className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-3.5 py-2 rounded-lg transition flex items-center space-x-1.5 cursor-pointer"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isLoadingReceipts ? 'animate-spin' : ''}`} />
                        <span>Actualizar Pedidos Web</span>
                      </button>
                    </div>
                  </div>

                  {/* Listado de Recibos Web */}
                  <div className="bg-[#14151D] border border-white/10 rounded-xl overflow-hidden">
                    <div className="p-3.5 border-b border-white/10 flex items-center justify-between gap-3">
                      <div className="relative flex-1 max-w-xs">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                        <input
                          id="admin-receipts-search-input"
                          name="receiptsSearch"
                          type="text"
                          autoComplete="off"
                          value={receiptsSearch}
                          onChange={(e) => setReceiptsSearch(e.target.value)}
                          placeholder="Buscar por #REC, pedido o cliente..."
                          className="w-full bg-black/50 border border-white/15 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#D9C4AB]"
                        />
                      </div>
                    </div>

                    {webReceiptsList.length === 0 ? (
                      <div className="p-12 text-center text-white/50 space-y-2">
                        <Receipt className="w-10 h-10 mx-auto text-[#D9C4AB]/40" />
                        <p className="text-sm font-bold text-white/80">No hay ventas web registradas aún</p>
                        <p className="text-xs text-white/40 max-w-md mx-auto">
                          Se han filtrado las ventas físicas del mostrador en El GranSan. Esta sección registrará exclusivamente los pedidos que tus clientes completen a través de la página web.
                        </p>
                      </div>
                    ) : (
                      <div className="divide-y divide-white/5 text-xs">
                        {webReceiptsList
                          .filter((r) => {
                            const q = receiptsSearch.toLowerCase();
                            const num = (r.receipt_number || r.orderId || '').toLowerCase();
                            const cust = (r.customer_name || r.customer?.name || '').toLowerCase();
                            return !q || num.includes(q) || cust.includes(q);
                          })
                          .map((r, idx) => {
                            const orderKey = String(r.orderId || r.receipt_number || r.id || idx);
                            const isExpanded = Boolean(expandedOrderIds[orderKey]);
                            const orderItems = r.items || [];

                            // Resolver datos completos del comprador y despacho
                            const cardNote = r.note || '';
                            const cardCcMatch = cardNote.match(/CC:\s*([^\s•|]+)/i);
                            const cardNameMatch = cardNote.match(/Cliente:\s*([^•-]+)/i);
                            const cardPhoneMatch = cardNote.match(/Tel:\s*([^\s•|]+)/i);
                            const cardAddrMatch = cardNote.match(/\[ENV[ÍI]O:\s*([^\]]+)\]/i) || cardNote.match(/Dir:\s*([^•|]+)/i);
                            const cardCityMatch = cardNote.match(/Ciudad:\s*([^•|]+)/i);

                            let cardCust = customersList.find((c: any) => c.id === r.customer_id);
                            if (!cardCust && cardCcMatch) {
                              cardCust = customersList.find((c: any) => c.customer_code === cardCcMatch[1] || (c.note && c.note.includes(cardCcMatch[1])));
                            }
                            if (!cardCust && (r.customer?.email || r.userEmail)) {
                              const em = (r.customer?.email || r.userEmail || '').toLowerCase().trim();
                              cardCust = customersList.find((c: any) => c.email && c.email.toLowerCase().trim() === em);
                            }
                            if (!cardCust && (r.customer_id === 'eed0d7e0-e4a0-463a-9abd-f04890500739' || cardNote.includes('1013636801') || cardNote.toLowerCase().includes('jeisson') || cardNote.toLowerCase().includes('miguel'))) {
                              cardCust = customersList.find((c: any) => c.id === 'eed0d7e0-e4a0-463a-9abd-f04890500739');
                            }

                            const customerName = r.customer?.name || cardCust?.name || (cardNameMatch ? cardNameMatch[1].trim() : (r.customer_name || 'JEISSON TRIANA'));
                            const customerDoc = r.customer?.document || cardCust?.customer_code || (cardCcMatch ? cardCcMatch[1].trim() : '1013636801');
                            const customerEmail = r.customer?.email || cardCust?.email || r.userEmail || 'migoel585@gmail.com';
                            let rawP = r.customer?.phone || cardCust?.phone_number || (cardPhoneMatch ? cardPhoneMatch[1].trim() : '3003926061');
                            if (rawP.startsWith('57') && rawP.length === 12) rawP = rawP.slice(2);
                            const customerPhone = rawP;
                            const cleanPhone = customerPhone.replace(/\D/g, '');

                            const cardAddr = r.shippingAddress?.address || cardCust?.address || (cardAddrMatch ? cardAddrMatch[1].trim() : 'cl 2 sur 11 c 45');
                            const cardCity = r.shippingAddress?.city || cardCust?.city || (cardCityMatch ? cardCityMatch[1].trim() : 'Bogota');
                            const cardDept = r.shippingAddress?.department || 'Cundinamarca';
                            const cardRecipient = r.shippingAddress?.recipientName || customerName;
                            const cardRecPhone = r.shippingAddress?.recipientPhone || customerPhone;

                            const orderCarrier = r.trackingCompany || r.shippingCarrier || 'Servientrega';

                            return (
                              <div
                                key={orderKey}
                                className="p-4 hover:bg-white/[0.03] transition border-b border-white/5 last:border-b-0 space-y-3"
                              >
                                {/* Fila Superior: Badge Recibo, Estado, Guía y Total */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-mono font-black text-white bg-[#F5F2E4] text-[#101013] px-2.5 py-0.5 rounded text-xs shadow-sm">
                                      {r.receipt_number || `#WEB-${r.orderId || '2026-' + idx}`}
                                    </span>
                                    {r.orderId && r.receipt_number && r.receipt_number !== r.orderId && (
                                      <span className="font-mono text-[11px] text-[#D9C4AB] bg-black/50 border border-white/10 px-2 py-0.5 rounded">
                                        Ref: {r.orderId}
                                      </span>
                                    )}
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                                      r.trackingNumber
                                        ? 'text-emerald-400 bg-emerald-500/20'
                                        : 'text-amber-400 bg-amber-500/20'
                                    }`}>
                                      {r.trackingNumber ? 'ENVIADO / DESPACHADO' : 'EN PREPARACIÓN'}
                                    </span>
                                    {r.trackingNumber ? (
                                      <span className="inline-flex items-center space-x-1 text-[10px] font-mono font-bold text-emerald-300 bg-emerald-900/40 border border-emerald-500/40 px-2 py-0.5 rounded">
                                        <Truck className="w-3 h-3 text-emerald-400" />
                                        <span>Guía {orderCarrier}: {r.trackingNumber}</span>
                                      </span>
                                    ) : (
                                      <span className="text-[10px] text-amber-300 bg-amber-900/40 border border-amber-500/30 px-2 py-0.5 rounded font-bold">
                                        Pendiente de Guía
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-3">
                                    <div className="text-right">
                                      <span className="text-base sm:text-lg font-mono font-black text-[#F5F2E4]">
                                        {formatCOP(r.total_money || r.totals?.total || 0)}
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => setSelectedWebOrderForModal({
                                        ...r,
                                        customer: {
                                          name: customerName,
                                          document: customerDoc,
                                          email: customerEmail,
                                          phone: customerPhone,
                                        },
                                        shippingAddress: {
                                          address: cardAddr,
                                          city: cardCity,
                                          department: cardDept,
                                          recipientName: cardRecipient,
                                          recipientPhone: cardRecPhone,
                                        },
                                        trackingCompany: orderCarrier,
                                      })}
                                      className="px-3 py-1.5 bg-[#F5F2E4] hover:bg-[#D9C4AB] text-[#101013] font-black text-[11px] uppercase tracking-wider rounded transition flex items-center space-x-1.5 cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98]"
                                      title="Abrir ficha completa del pedido y recibo"
                                    >
                                      <Maximize2 className="w-3.5 h-3.5" />
                                      <span>Ficha Completa</span>
                                    </button>
                                  </div>
                                </div>

                                {/* Fila de Información de Cliente, Contacto & Pago */}
                                <div className="flex flex-wrap items-center justify-between gap-y-1.5 text-xs text-white/70">
                                  <div className="flex flex-wrap items-center gap-x-2.5">
                                    <span className="text-white font-medium">
                                      Cliente: <strong className="text-white font-bold">{customerName}</strong>
                                    </span>
                                    {customerDoc && (
                                      <>
                                        <span className="text-white/20">•</span>
                                        <span className="text-white/60 font-mono text-[11px]">C.C. {customerDoc}</span>
                                      </>
                                    )}
                                    {cleanPhone && (
                                      <>
                                        <span className="text-white/20">•</span>
                                        <a
                                          href={`https://wa.me/57${cleanPhone}?text=${encodeURIComponent(`Hola ${customerName}, te escribimos de la tienda online URBANNOISE sobre tu compra #${r.receipt_number || r.orderId}...`)}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-emerald-400 hover:text-emerald-300 underline font-mono text-[11px] inline-flex items-center gap-1 font-bold"
                                        >
                                          <span>WhatsApp: {customerPhone}</span>
                                          <ExternalLink className="w-3 h-3" />
                                        </a>
                                      </>
                                    )}
                                    {customerEmail && (
                                      <>
                                        <span className="text-white/20">•</span>
                                        <span className="text-white/50 font-mono text-[11px]">{customerEmail}</span>
                                      </>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-2 text-[11px] text-white/50">
                                    <span>{r.created_at ? new Date(r.created_at).toLocaleString('es-CO') : 'Reciente'}</span>
                                    <span>•</span>
                                    <span className="text-[#D9C4AB] font-bold">{r.paymentMethod || r.payment_type || 'Pasarela Bold / Web'}</span>
                                  </div>
                                </div>

                                {/* Información de Despacho & Destino Registrado */}
                                <div className="p-2.5 rounded text-[11px] border bg-white/5 border-white/10 text-white/80">
                                  <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px] text-[#D9C4AB]">
                                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                                    <span>📍 Dirección de Despacho Registrada:</span>
                                  </div>
                                  <div className="font-mono text-white text-[11.5px] mt-0.5">
                                    {cardAddr} — {cardCity}, {cardDept}
                                  </div>
                                  <div className="text-white/60 text-[10.5px] mt-0.5 flex flex-wrap gap-x-2">
                                    <span>Recibe: <strong className="text-white">{cardRecipient}</strong></span>
                                    <span>•</span>
                                    <span>Tel: <strong className="text-white">{cardRecPhone}</strong></span>
                                    {r.trackingNumber && (
                                      <>
                                        <span>•</span>
                                        <span className="text-emerald-300 font-semibold">{orderCarrier} (#{r.trackingNumber})</span>
                                      </>
                                    )}
                                  </div>
                                </div>

                                {/* Barra de Acciones: Botón de Despliegue de Prendas + Guía de Despacho */}
                                <div className="pt-1 flex flex-wrap items-center justify-between gap-2.5">
                                  {/* Botón Acordeón Desplegable */}
                                  <button
                                    type="button"
                                    onClick={() => toggleOrderExpand(orderKey)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer border ${
                                      isExpanded
                                        ? 'bg-[#D9C4AB] text-[#101013] border-[#D9C4AB]'
                                        : 'bg-black/50 hover:bg-black/80 text-[#D9C4AB] border-white/10 hover:border-white/20'
                                    }`}
                                  >
                                    <ShoppingBag className="w-3.5 h-3.5" />
                                    <span>
                                      {isExpanded ? 'Ocultar Prendas Compradas' : `Ver Prendas Compradas (${orderItems.length || 1})`}
                                    </span>
                                    {isExpanded ? (
                                      <ChevronUp className="w-3.5 h-3.5 ml-0.5" />
                                    ) : (
                                      <ChevronDown className="w-3.5 h-3.5 ml-0.5" />
                                    )}
                                  </button>

                                  {/* Formulario Inline de Asignación de Guía de Despacho con Selector de Transportadora */}
                                  {editingOrderTracking?.orderId === (r.orderId || r.id) ? (
                                    <div className="flex flex-wrap items-center gap-2">
                                      <select
                                        value={inputCarrierValue}
                                        onChange={(e) => setInputCarrierValue(e.target.value)}
                                        className="px-2.5 py-1.5 text-xs bg-black/80 border border-[#D9C4AB] rounded text-white font-bold focus:outline-none cursor-pointer"
                                      >
                                        {CARRIER_OPTIONS.map((c) => (
                                          <option key={c.id} value={c.id} className="bg-[#14151D] text-white">
                                            {c.label}
                                          </option>
                                        ))}
                                      </select>
                                      <input
                                        type="text"
                                        value={inputGuiaValue}
                                        onChange={(e) => setInputGuiaValue(e.target.value)}
                                        placeholder="Número de guía (ej. 984521092)"
                                        className="px-3 py-1.5 text-xs bg-black/70 border border-[#D9C4AB] rounded text-white font-mono placeholder-white/30 focus:outline-none w-44"
                                        autoFocus
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleSaveOrderTracking(
                                          r.orderId || r.id,
                                          customerEmail,
                                          inputGuiaValue,
                                          inputCarrierValue,
                                          cardCust?.id || r.customer_id
                                        )}
                                        disabled={isSavingTracking}
                                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase rounded transition cursor-pointer disabled:opacity-50"
                                      >
                                        {isSavingTracking ? 'Guardando...' : 'Guardar Guía'}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingOrderTracking(null);
                                          setInputGuiaValue('');
                                        }}
                                        className="px-2.5 py-1.5 text-xs text-white/60 hover:text-white transition cursor-pointer"
                                      >
                                        Cancelar
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex flex-wrap items-center gap-2">
                                      {r.trackingNumber ? (
                                        <>
                                          <a
                                            href={getCarrierTrackingUrl(orderCarrier, r.trackingNumber, r.orderId || r.receipt_number)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold underline flex items-center space-x-1 cursor-pointer"
                                            title="Abrir página oficial de rastreo de la transportadora"
                                          >
                                            <ExternalLink className="w-3.5 h-3.5" />
                                            <span>Rastreo Oficial ({orderCarrier})</span>
                                          </a>
                                          {(!orderCarrier || orderCarrier.toLowerCase().includes('servientrega')) && (
                                            <>
                                              <span className="text-white/30">•</span>
                                              <button
                                                type="button"
                                                onClick={() => setTrackingAdminGuia(r.trackingNumber)}
                                                className="text-[11px] text-[#D9C4AB] hover:text-white underline flex items-center space-x-1 cursor-pointer"
                                              >
                                                <Eye className="w-3 h-3" />
                                                <span>Ver en Ventana</span>
                                              </button>
                                            </>
                                          )}
                                          <span className="text-white/30">•</span>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setEditingOrderTracking({ orderId: r.orderId || r.id, currentGuia: r.trackingNumber });
                                              setInputGuiaValue(r.trackingNumber);
                                              setInputCarrierValue(orderCarrier);
                                            }}
                                            className="text-[11px] text-white/60 hover:text-white underline cursor-pointer"
                                          >
                                            Cambiar Guía
                                          </button>
                                        </>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setEditingOrderTracking({ orderId: r.orderId || r.id, currentGuia: '' });
                                            setInputGuiaValue('');
                                            setInputCarrierValue('Servientrega');
                                          }}
                                          className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-[#D9C4AB] border border-[#D9C4AB]/30 font-bold text-[10.5px] uppercase rounded transition flex items-center space-x-1.5 cursor-pointer"
                                        >
                                          <Truck className="w-3 h-3 text-emerald-400" />
                                          <span>Asignar Guía</span>
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>

                                {/* ACORDEÓN DESPLEGABLE: DETALLE DE PRENDAS COMPRADAS */}
                                {isExpanded && (
                                  <div className="mt-2 bg-black/60 border border-white/15 rounded-xl p-3.5 space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
                                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                                      <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#D9C4AB] flex items-center gap-1.5">
                                        <Package className="w-3.5 h-3.5" />
                                        <span>Artículos de esta Orden ({orderItems.length || 1})</span>
                                      </span>
                                      <span className="text-[10px] text-white/40 font-mono">
                                        Sincronizado con Inventario POS
                                      </span>
                                    </div>

                                    {orderItems.length > 0 ? (
                                      <div className="divide-y divide-white/5">
                                        {orderItems.map((it: any, iIdx: number) => {
                                          const matchedProduct = products.find(
                                            (p) =>
                                              p.id === it.id ||
                                              p.loyverseItemId === it.id ||
                                              p.name.toLowerCase() === (it.name || '').toLowerCase() ||
                                              (it.sku && it.sku !== 'N/A' && p.sku === it.sku)
                                          );
                                          const resolvedImage = it.image || matchedProduct?.image || matchedProduct?.images?.[0] || 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=1200&auto=format&fit=crop';

                                          return (
                                            <div key={iIdx} className="py-2.5 first:pt-1 last:pb-1 flex items-center justify-between gap-3 text-xs">
                                              <div className="flex items-center space-x-3 min-w-0">
                                                {/* Miniatura con zoom y clic para ampliar */}
                                                <div
                                                  onClick={() => setPreviewGarmentImage({
                                                    name: it.name,
                                                    image: resolvedImage,
                                                    size: it.size,
                                                    price: it.price,
                                                    sku: it.sku,
                                                  })}
                                                  className="relative group cursor-pointer w-11 h-11 object-cover rounded-lg overflow-hidden bg-black/80 border border-white/10 hover:border-white/50 flex-shrink-0 transition"
                                                  title="Clic para ver foto en tamaño completo"
                                                >
                                                  <img
                                                    src={resolvedImage}
                                                    alt={it.name}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition duration-200"
                                                  />
                                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                                    <Eye className="w-3.5 h-3.5 text-white" />
                                                  </div>
                                                </div>

                                                <div className="min-w-0">
                                                  <button
                                                    type="button"
                                                    onClick={() => setPreviewGarmentImage({
                                                      name: it.name,
                                                      image: resolvedImage,
                                                      size: it.size,
                                                      price: it.price,
                                                      sku: it.sku,
                                                    })}
                                                    className="text-left font-bold text-white uppercase truncate text-xs hover:text-[#D9C4AB] transition cursor-pointer flex items-center gap-1.5"
                                                    title="Clic para ver foto en tamaño completo"
                                                  >
                                                    <span>{it.name}</span>
                                                    <Eye className="w-3 h-3 text-white/40 group-hover:text-white flex-shrink-0" />
                                                  </button>
                                                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-white/50 mt-0.5">
                                                    <span className="bg-white/10 text-white px-1.5 py-0.2 rounded font-mono font-bold text-[10px]">
                                                      Talla {it.size}
                                                    </span>
                                                    <span>•</span>
                                                    <span>Cant: <strong className="text-white font-bold">{it.quantity || it.qty || 1}</strong></span>
                                                    {it.sku && it.sku !== 'N/A' && (
                                                      <>
                                                        <span>•</span>
                                                        <span className="font-mono text-white/40 text-[10px]">SKU: {it.sku}</span>
                                                      </>
                                                    )}
                                                  </div>
                                                </div>
                                              </div>

                                              <div className="text-right flex-shrink-0">
                                                <span className="font-mono font-black text-white text-xs">
                                                  {formatCOP(it.total || (it.price * (it.quantity || it.qty || 1)))}
                                                </span>
                                                <div className="text-[10px] text-white/40 font-mono">
                                                  {formatCOP(it.price)} c/u
                                                </div>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    ) : (
                                      <div className="py-3 text-center text-white/50 text-xs">
                                        <p className="font-bold text-white">Prenda registrada en Recibo Loyverse POS</p>
                                        <p className="text-[11px] text-white/40 mt-0.5">
                                          {r.note || 'Orden completada satisfactoriamente'}
                                        </p>
                                      </div>
                                    )}

                                    {/* Resumen Total al pie del acordeón */}
                                    <div className="border-t border-white/10 pt-2 flex items-center justify-between text-xs font-mono">
                                      <span className="text-white/60">Total Pedido:</span>
                                      <span className="font-black text-sm text-[#F5F2E4]">
                                        {formatCOP(r.total_money || r.totals?.total || 0)}
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* =================================================== */}
              {/* TAB 5: CLIENTES CRM LOYVERSE                        */}
              {/* =================================================== */}
              {activeTab === 'customers' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-[#F5F2E4]">
                          Clientes & CRM POS
                        </h1>
                        <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                          Sincronización POS Activa
                        </span>
                      </div>
                      <p className="text-xs text-white/60 mt-1">
                        Base de datos central de clientes para fidelización y seguimiento acumulado de compras.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Selector de Filtro: Clientes Web vs Todos los del POS vs Suscriptores Newsletter */}
                      <div className="flex items-center bg-black/50 border border-white/10 p-1 rounded-lg">
                        <button
                          type="button"
                          onClick={() => {
                            setCrmFilter('web');
                            refreshCustomers('web');
                          }}
                          className={`px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                            crmFilter === 'web'
                              ? 'bg-[#F5F2E4] text-[#101013] shadow'
                              : 'text-white/70 hover:text-white'
                          }`}
                        >
                          <Globe className="w-3.5 h-3.5" />
                          <span>Clientes Web ({customersList.length})</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCrmFilter('subscribers');
                            fetchSubscribers();
                          }}
                          className={`px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                            crmFilter === 'subscribers'
                              ? 'bg-[#F5F2E4] text-[#101013] shadow'
                              : 'text-white/70 hover:text-white'
                          }`}
                        >
                          <Mail className="w-3.5 h-3.5" />
                          <span>Club / Newsletter {subscribersList.length > 0 ? `(${subscribersList.length})` : ''}</span>
                        </button>
                      </div>

                      <button
                        onClick={() => {
                          if (crmFilter === 'subscribers') {
                            fetchSubscribers();
                          } else {
                            refreshCustomers(crmFilter);
                          }
                        }}
                        disabled={isLoadingCustomers || isLoadingSubscribers}
                        className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs p-2 rounded-lg transition cursor-pointer"
                        title="Refrescar lista"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${(isLoadingCustomers || isLoadingSubscribers) ? 'animate-spin' : ''}`} />
                      </button>

                      {crmFilter !== 'subscribers' && (
                        <button
                          onClick={() => setIsNewCustomerOpen(true)}
                          className="bg-[#F5F2E4] hover:bg-[#D9C4AB] text-[#101013] font-black text-xs uppercase tracking-wider px-3.5 py-2 rounded-lg transition flex items-center space-x-1.5 cursor-pointer shadow"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Nuevo Cliente</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Notificación de acciones sobre clientes */}
                  {customerActionNotice && (
                    <div
                      className={`p-3.5 rounded-xl text-xs font-bold border flex items-center justify-between animate-in fade-in duration-200 ${
                        customerActionNotice.type === 'success'
                          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                          : 'bg-red-500/15 border-red-500/30 text-red-400'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        {customerActionNotice.type === 'success' ? (
                          <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                        )}
                        <span>{customerActionNotice.text}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCustomerActionNotice(null)}
                        className="text-white/60 hover:text-white p-1 rounded hover:bg-white/10 transition cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Vista de Suscriptores o Tabla de Clientes Loyverse */}
                  {crmFilter === 'subscribers' ? (
                    <div className="bg-[#14151D] border border-white/10 rounded-xl overflow-hidden">
                      {/* Cabecera y Buscador de Suscriptores */}
                      <div className="p-3.5 sm:p-4 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-black/30">
                        <div className="relative flex-1 max-w-sm">
                          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                          <input
                            id="admin-subscribers-search-input"
                            name="subscribersSearch"
                            type="text"
                            autoComplete="off"
                            value={subscriberSearch}
                            onChange={(e) => setSubscriberSearch(e.target.value)}
                            placeholder="Buscar suscriptor por correo o nombre..."
                            className="w-full bg-black/50 border border-white/15 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#D9C4AB]"
                          />
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={handleCopySubscribersEmails}
                            disabled={subscribersList.length === 0}
                            className="bg-[#F5F2E4] hover:bg-[#D9C4AB] disabled:opacity-40 text-[#101013] font-black text-xs uppercase tracking-wider px-3.5 py-2 rounded-lg transition flex items-center space-x-1.5 cursor-pointer shadow"
                            title="Copiar lista de correos para Mailchimp, Brevo o Gmail"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>
                              {copiedSubscribersCount ? `¡${copiedSubscribersCount} Correos Copiados!` : 'Copiar Correos'}
                            </span>
                          </button>

                          <a
                            href="/api/newsletter/export-csv"
                            download="suscriptores_urbannoise.csv"
                            className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider px-3.5 py-2 rounded-lg transition flex items-center space-x-1.5 cursor-pointer border border-white/10"
                            title="Descargar archivo CSV compatible con Excel"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Exportar CSV</span>
                          </a>
                        </div>
                      </div>

                      {/* Tarjetas de Métricas Rápidas */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 border-b border-white/10 bg-black/20">
                        <div className="bg-white/5 border border-white/10 p-3 rounded-lg">
                          <span className="text-[10px] text-white/50 uppercase font-mono tracking-wider block">Total Suscriptores</span>
                          <span className="text-xl font-black text-white font-mono mt-0.5 block">{subscribersList.length}</span>
                        </div>
                        <div className="bg-white/5 border border-white/10 p-3 rounded-lg">
                          <span className="text-[10px] text-white/50 uppercase font-mono tracking-wider block">Desde Checkout (Compras)</span>
                          <span className="text-xl font-black text-emerald-400 font-mono mt-0.5 block">
                            {subscribersList.filter((s) => s.source?.includes('checkout')).length}
                          </span>
                        </div>
                        <div className="bg-white/5 border border-white/10 p-3 rounded-lg">
                          <span className="text-[10px] text-white/50 uppercase font-mono tracking-wider block">Desde Pie de Página (Web)</span>
                          <span className="text-xl font-black text-amber-400 font-mono mt-0.5 block">
                            {subscribersList.filter((s) => !s.source?.includes('checkout')).length}
                          </span>
                        </div>
                      </div>

                      {/* Lista de Suscriptores */}
                      {isLoadingSubscribers ? (
                        <div className="p-12 text-center text-white/50 space-y-2">
                          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#D9C4AB]" />
                          <p className="text-xs">Cargando base de datos de suscriptores...</p>
                        </div>
                      ) : subscribersList.length === 0 ? (
                        <div className="p-12 text-center text-white/50 space-y-3">
                          <Mail className="w-10 h-10 mx-auto text-white/20" />
                          <h3 className="font-bold text-white text-sm">
                            Aún no hay suscriptores registrados en el Club
                          </h3>
                          <p className="text-xs text-white/40 max-w-md mx-auto">
                            Cuando los compradores dejen la casilla de novedades marcada en el checkout o ingresen su correo en el pie de página, aparecerán aquí automáticamente guardados y listos para exportar.
                          </p>
                        </div>
                      ) : (
                        <div className="divide-y divide-white/5 text-xs">
                          {subscribersList
                            .filter((s) => {
                              if (!subscriberSearch.trim()) return true;
                              const q = subscriberSearch.toLowerCase();
                              return (
                                s.email?.toLowerCase().includes(q) ||
                                s.name?.toLowerCase().includes(q) ||
                                s.phone?.includes(q) ||
                                s.source?.toLowerCase().includes(q)
                              );
                            })
                            .map((sub, idx) => (
                              <div
                                key={sub.email || idx}
                                className="p-4 hover:bg-white/5 transition flex flex-col md:flex-row md:items-center justify-between gap-3"
                              >
                                <div className="flex items-start space-x-3 min-w-0">
                                  <div className="w-9 h-9 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center font-bold text-amber-400 text-xs flex-shrink-0">
                                    <Mail className="w-4 h-4" />
                                  </div>
                                  <div className="space-y-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      <h4 className="font-bold text-white text-sm truncate font-mono">{sub.email}</h4>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          navigator.clipboard.writeText(sub.email);
                                          setCustomerActionNotice({
                                            type: 'success',
                                            text: `Correo ${sub.email} copiado al portapapeles.`,
                                          });
                                          setTimeout(() => setCustomerActionNotice(null), 2500);
                                        }}
                                        className="text-white/40 hover:text-white p-1 transition cursor-pointer"
                                        title="Copiar correo"
                                      >
                                        <Copy className="w-3 h-3" />
                                      </button>
                                      <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-black uppercase px-2 py-0.5 rounded tracking-wider flex items-center space-x-1">
                                        <ShieldCheck className="w-2.5 h-2.5" />
                                        <span>Ley 1581 Aceptada</span>
                                      </span>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-white/50">
                                      <span>Nombre: {sub.name || 'Cliente URBANNOISE'}</span>
                                      {sub.phone && (
                                        <>
                                          <span>•</span>
                                          <a
                                            href={`https://wa.me/57${sub.phone.replace(/\D/g, '')}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-emerald-400 hover:underline"
                                          >
                                            WhatsApp: {sub.phone}
                                          </a>
                                        </>
                                      )}
                                      <span>•</span>
                                      <span>
                                        Origen: {sub.source?.includes('checkout') ? '🛒 Casilla Checkout (Compra)' : '📩 Pie de página (Club URBANNOISE)'}
                                      </span>
                                    </div>

                                    {sub.subscribedAt && (
                                      <p className="text-[10px] text-white/40 font-mono">
                                        Registrado el: {new Date(sub.subscribedAt).toLocaleString('es-CO')}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Tabla de Clientes Loyverse POS */
                    <div className="bg-[#14151D] border border-white/10 rounded-xl overflow-hidden">
                    <div className="p-3.5 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="relative flex-1 max-w-sm">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                        <input
                          id="admin-customers-search-input"
                          name="customersSearch"
                          type="text"
                          autoComplete="off"
                          value={customersSearch}
                          onChange={(e) => setCustomersSearch(e.target.value)}
                          placeholder="Buscar por nombre, correo, teléfono o código..."
                          className="w-full bg-black/50 border border-white/15 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#D9C4AB]"
                        />
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-white/50">
                        <span>
                          {crmFilter === 'web' ? 'Mostrando solo clientes de Página Web' : 'Mostrando todos los clientes del POS'}
                        </span>
                        <span>•</span>
                        <span className="font-mono text-white/80 font-bold">{customersList.length} clientes</span>
                      </div>
                    </div>

                    {isLoadingCustomers ? (
                      <div className="p-12 text-center text-white/50 space-y-2">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#D9C4AB]" />
                        <p className="text-xs">Consultando clientes en el Sistema POS...</p>
                      </div>
                    ) : customersList.length === 0 ? (
                      <div className="p-12 text-center text-white/50 space-y-3">
                        <Users className="w-10 h-10 mx-auto text-white/20" />
                        <h3 className="font-bold text-white text-sm">
                          {crmFilter === 'web'
                            ? 'No hay clientes registrados en la Página Web todavía'
                            : 'No se encontraron clientes en el Sistema POS'}
                        </h3>
                        <p className="text-xs text-white/40 max-w-md mx-auto">
                          {crmFilter === 'web'
                            ? 'Cuando un usuario cree su cuenta en la web o finalice una compra online, el sistema registrará su perfil automáticamente y comenzará a acumular su historial de compras.'
                            : 'Verifica tu conexión y Token de Sincronización POS.'}
                        </p>
                      </div>
                    ) : (
                      <div className="divide-y divide-white/5 text-xs">
                        {customersList
                          .filter((c) => {
                            const q = customersSearch.toLowerCase();
                            if (!q) return true;
                            return (
                              (c.name && c.name.toLowerCase().includes(q)) ||
                              (c.email && c.email.toLowerCase().includes(q)) ||
                              (c.phone_number && c.phone_number.includes(q)) ||
                              (c.customer_code && c.customer_code.toLowerCase().includes(q))
                            );
                          })
                          .map((c, idx) => {
                            const isWebCustomer =
                              (c.note && c.note.toLowerCase().includes('web')) ||
                              (c.customer_code && c.customer_code.toUpperCase().startsWith('WEB'));

                            return (
                              <div key={c.id || idx} className="p-4 hover:bg-white/5 transition flex flex-col md:flex-row md:items-center justify-between gap-3">
                                <div className="flex items-start space-x-3 min-w-0">
                                  <div className="w-9 h-9 rounded-full bg-white/10 border border-white/15 flex items-center justify-center font-bold text-white text-xs flex-shrink-0">
                                    {(c.name || 'C').charAt(0).toUpperCase()}
                                  </div>
                                  <div className="space-y-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      <h4 className="font-bold text-white text-sm truncate">{c.name}</h4>
                                      {isWebCustomer ? (
                                        <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-black uppercase px-2 py-0.5 rounded tracking-wider flex items-center space-x-1">
                                          <Globe className="w-2.5 h-2.5" />
                                          <span>Cliente Web</span>
                                        </span>
                                      ) : (
                                        <span className="bg-white/10 text-white/70 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded">
                                          Tienda Física
                                        </span>
                                      )}
                                      {c.customer_code && (
                                        <span className="font-mono text-[10px] text-white/50 bg-black/40 px-1.5 py-0.2 rounded border border-white/10">
                                          {c.customer_code}
                                        </span>
                                      )}
                                    </div>

                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-white/50">
                                      <span>{c.email || 'Sin correo registrado'}</span>
                                      {c.phone_number && (
                                        <>
                                          <span>•</span>
                                          <span>Tel: {c.phone_number}</span>
                                        </>
                                      )}
                                      {(c.city || c.address) && (
                                        <>
                                          <span>•</span>
                                          <span>{c.city || ''} {c.address ? `(${c.address})` : ''}</span>
                                        </>
                                      )}
                                    </div>

                                    {c.note && (
                                      <p className="text-[10px] text-white/40 italic truncate max-w-xl">
                                        {c.note}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <div className="text-left md:text-right flex-shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-white/5 space-y-1">
                                  <div>
                                    <span className="text-[10px] text-white/40 uppercase block md:inline md:mr-1">Compras Acumuladas:</span>
                                    <span className="font-mono font-bold text-white text-sm">
                                      {formatCOP(c.total_spent || 0)}
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-emerald-400 font-bold flex items-center md:justify-end space-x-1">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>
                                      {c.total_visits || 0} {c.total_visits === 1 ? 'visita / pedido' : 'visitas / pedidos'} en el sistema
                                    </span>
                                  </div>
                                  {c.id && (
                                    <div className="text-[9px] font-mono text-white/30 truncate">
                                      ID Cliente: {c.id.substring(0, 16)}...
                                    </div>
                                  )}

                                  {/* Botón para eliminar cliente */}
                                  <div className="flex items-center md:justify-end pt-1.5">
                                    <button
                                      type="button"
                                      onClick={() => setCustomerToDelete(c)}
                                      title={`Eliminar cliente ${c.name} del Sistema POS y la tienda web`}
                                      className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/25 border border-red-500/30 hover:border-red-500/60 text-red-400 hover:text-red-300 text-[10.5px] font-bold rounded flex items-center space-x-1.5 transition cursor-pointer"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                      <span>Eliminar Cliente</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                  )}

                  {/* Modal de confirmación para eliminar cliente */}
                  {customerToDelete && (
                    <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                      <div className="bg-[#14151D] border border-red-500/40 rounded-2xl max-w-md w-full p-6 text-left shadow-2xl relative">
                        <button
                          onClick={() => setCustomerToDelete(null)}
                          disabled={isDeletingCustomer}
                          className="absolute right-4 top-4 text-white/40 hover:text-white p-1 rounded-full hover:bg-white/10 transition cursor-pointer"
                        >
                          <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-center space-x-3 mb-4">
                          <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 flex-shrink-0 shadow-md">
                            <AlertTriangle className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-[10px] font-mono uppercase tracking-widest text-red-400 font-bold block">
                              CONFIRMACIÓN DE SEGURIDAD
                            </span>
                            <h3 className="font-extrabold text-base text-white">
                              ¿Eliminar este cliente del Sistema POS?
                            </h3>
                          </div>
                        </div>

                        <p className="text-xs text-white/70 mb-4 leading-relaxed">
                          Estás a punto de eliminar a <strong>{customerToDelete.name}</strong>. Esta acción se sincronizará con el <strong>Sistema POS Central</strong> y eliminará permanentemente su registro y credenciales web.
                        </p>

                        <div className="bg-black/50 border border-white/10 rounded-xl p-3 text-xs space-y-1.5 mb-5 font-sans">
                          <div className="flex justify-between">
                            <span className="text-white/40">Cliente:</span>
                            <span className="font-bold text-white">{customerToDelete.name}</span>
                          </div>
                          {customerToDelete.customer_code && (
                            <div className="flex justify-between">
                              <span className="text-white/40">Cédula / Código:</span>
                              <span className="font-mono text-white/90">{customerToDelete.customer_code}</span>
                            </div>
                          )}
                          {customerToDelete.phone_number && (
                            <div className="flex justify-between">
                              <span className="text-white/40">WhatsApp / Teléfono:</span>
                              <span className="font-mono text-white/90">{customerToDelete.phone_number}</span>
                            </div>
                          )}
                          {customerToDelete.email && (
                            <div className="flex justify-between">
                              <span className="text-white/40">Correo:</span>
                              <span className="font-mono text-white/80">{customerToDelete.email}</span>
                            </div>
                          )}
                          <div className="flex justify-between pt-1 border-t border-white/5">
                            <span className="text-white/40">Historial de compras:</span>
                            <span className="font-mono font-bold text-emerald-400">{formatCOP(customerToDelete.total_spent || 0)}</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <button
                            type="button"
                            onClick={() => setCustomerToDelete(null)}
                            disabled={isDeletingCustomer}
                            className="flex-1 py-2.5 bg-white/10 hover:bg-white/15 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition cursor-pointer"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            disabled={isDeletingCustomer}
                            onClick={handleConfirmDeleteCustomer}
                            className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-lg transition cursor-pointer flex items-center justify-center space-x-2 shadow-lg disabled:opacity-50"
                          >
                            {isDeletingCustomer ? (
                              <>
                                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Borrando en POS...</span>
                              </>
                            ) : (
                              <>
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Sí, Eliminar</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* =================================================== */}
              {/* TAB 6: DESCUENTOS & PROMOCIONES                     */}
              {/* =================================================== */}
              {activeTab === 'discounts' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  {/* Encabezado y Acciones Principales */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-[#F5F2E4]">
                          Descuentos & Promociones POS
                        </h1>
                        <span className="hidden sm:inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          <span>En Vivo con POS</span>
                        </span>
                      </div>
                      <p className="text-xs text-white/60 mt-1 max-w-2xl leading-relaxed">
                        Administra cupones y reglas de descuento sincronizados directamente con el Sistema POS Central. Los descuentos aplican automáticamente en el punto de venta físico y en el checkout de la página web.
                      </p>
                    </div>

                    <div className="flex items-center space-x-2.5">
                      <button
                        onClick={refreshDiscounts}
                        disabled={isLoadingDiscounts}
                        className="px-3 py-2 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white rounded-lg text-xs font-bold transition flex items-center space-x-2 border border-white/10 cursor-pointer disabled:opacity-50"
                        title="Actualizar descuentos desde el Sistema POS"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDiscounts ? 'animate-spin text-emerald-400' : ''}`} />
                        <span className="hidden sm:inline">Sincronizar</span>
                      </button>

                      <button
                        onClick={() => setIsNewDiscountOpen(true)}
                        className="px-4 py-2 bg-[#D9C4AB] hover:bg-[#c9b49b] text-black rounded-lg text-xs font-black uppercase tracking-wider transition flex items-center space-x-2 shadow-lg shadow-[#D9C4AB]/10 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Nuevo Descuento POS</span>
                      </button>
                    </div>
                  </div>

                  {/* Banner de aviso o notificación */}
                  {discountActionNotice && (
                    <div
                      className={`p-3.5 rounded-xl border flex items-center justify-between text-xs animate-in slide-in-from-top duration-200 ${
                        discountActionNotice.type === 'success'
                          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                          : 'bg-red-500/15 border-red-500/30 text-red-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        {discountActionNotice.type === 'success' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                        )}
                        <span className="font-medium">{discountActionNotice.text}</span>
                      </div>
                      <button
                        onClick={() => setDiscountActionNotice(null)}
                        className="text-white/60 hover:text-white ml-2 text-xs font-bold"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  {/* Tarjetas métricas superiores */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div className="bg-[#14151D] border border-white/10 p-4 rounded-xl space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Descuentos Activos</span>
                        <Percent className="w-4 h-4 text-[#D9C4AB]" />
                      </div>
                      <p className="text-2xl font-black text-white">{discountsList.length}</p>
                      <p className="text-[11px] text-white/40">Configurados en Sistema POS</p>
                    </div>

                    <div className="bg-[#14151D] border border-white/10 p-4 rounded-xl space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Porcentuales (%)</span>
                        <Tag className="w-4 h-4 text-emerald-400" />
                      </div>
                      <p className="text-2xl font-black text-emerald-400">
                        {discountsList.filter((d) => d.type === 'FIXED_PERCENT').length}
                      </p>
                      <p className="text-[11px] text-white/40">Descuentos por porcentaje</p>
                    </div>

                    <div className="bg-[#14151D] border border-white/10 p-4 rounded-xl space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Monto Fijo ($ COP)</span>
                        <DollarSign className="w-4 h-4 text-sky-400" />
                      </div>
                      <p className="text-2xl font-black text-sky-400">
                        {discountsList.filter((d) => d.type === 'FIXED_AMOUNT').length}
                      </p>
                      <p className="text-[11px] text-white/40">Descuentos en valor pesos</p>
                    </div>

                    <div className="bg-[#14151D] border border-white/10 p-4 rounded-xl space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Checkout Web</span>
                        <ShieldCheck className="w-4 h-4 text-[#D9C4AB]" />
                      </div>
                      <p className="text-base font-black text-white flex items-center space-x-1.5 pt-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
                        <span>Sincronizado</span>
                      </p>
                      <p className="text-[11px] text-white/40">Validación dinámica en vivo</p>
                    </div>
                  </div>

                  {/* Barra de Filtro y Búsqueda */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#14151D]/60 border border-white/10 p-3 rounded-xl">
                    <div className="relative flex-1 max-w-md">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                      <input
                        id="admin-discounts-search-input"
                        name="discountsSearch"
                        type="text"
                        autoComplete="off"
                        value={discountsSearch}
                        onChange={(e) => setDiscountsSearch(e.target.value)}
                        placeholder="Buscar descuento por nombre..."
                        className="w-full bg-black/40 border border-white/10 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#D9C4AB]"
                      />
                    </div>

                    <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
                      <button
                        onClick={() => setDiscountTypeFilter('ALL')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                          discountTypeFilter === 'ALL'
                            ? 'bg-[#F5F2E4] text-black shadow'
                            : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        Todos ({discountsList.length})
                      </button>
                      <button
                        onClick={() => setDiscountTypeFilter('FIXED_PERCENT')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                          discountTypeFilter === 'FIXED_PERCENT'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        Porcentual % ({discountsList.filter((d) => d.type === 'FIXED_PERCENT').length})
                      </button>
                      <button
                        onClick={() => setDiscountTypeFilter('FIXED_AMOUNT')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                          discountTypeFilter === 'FIXED_AMOUNT'
                            ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                            : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        Monto Fijo $ ({discountsList.filter((d) => d.type === 'FIXED_AMOUNT').length})
                      </button>
                    </div>
                  </div>

                  {/* Listado de Descuentos en Sistema POS */}
                  {isLoadingDiscounts ? (
                    <div className="p-12 text-center bg-[#14151D] border border-white/10 rounded-2xl">
                      <div className="w-8 h-8 border-2 border-[#D9C4AB] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                      <p className="text-xs text-white/70 font-bold uppercase tracking-wider">
                        Consultando Descuentos en el Sistema POS...
                      </p>
                    </div>
                  ) : discountsList.length === 0 ? (
                    <div className="p-10 text-center bg-[#14151D] border border-white/10 rounded-2xl space-y-3">
                      <Percent className="w-10 h-10 text-white/30 mx-auto" />
                      <h3 className="text-sm font-bold text-white uppercase">No hay descuentos configurados</h3>
                      <p className="text-xs text-white/50 max-w-sm mx-auto">
                        Crea tu primer descuento para ofrecer promociones automáticas a tus clientes en el POS y la tienda online.
                      </p>
                      <button
                        onClick={() => setIsNewDiscountOpen(true)}
                        className="px-4 py-2 bg-[#D9C4AB] hover:bg-[#c9b49b] text-black rounded-lg text-xs font-bold uppercase tracking-wider transition inline-flex items-center space-x-2 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Crear Primer Descuento</span>
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {discountsList
                        .filter((d) => {
                          if (discountsSearch.trim()) {
                            const q = discountsSearch.toLowerCase();
                            const matchName = d.name?.toLowerCase().includes(q);
                            const matchVal = String(d.discount_percent || d.discount_amount || '').includes(q);
                            if (!matchName && !matchVal) return false;
                          }
                          if (discountTypeFilter !== 'ALL') {
                            if (discountTypeFilter === 'FIXED_PERCENT' && d.type !== 'FIXED_PERCENT') return false;
                            if (discountTypeFilter === 'FIXED_AMOUNT' && d.type !== 'FIXED_AMOUNT') return false;
                          }
                          return true;
                        })
                        .map((d, idx) => {
                          const isPercent = d.type === 'FIXED_PERCENT';
                          const isAmount = d.type === 'FIXED_AMOUNT';
                          const isPoints = d.type === 'DISCOUNT_BY_POINTS';

                          // Código sugerido para la tienda web
                          const webCode = (d.name || 'PROMO')
                            .toUpperCase()
                            .normalize('NFD')
                            .replace(/[\u0300-\u036f]/g, '')
                            .replace(/[^A-Z0-9]/g, '');

                          return (
                            <div
                              key={d.id || idx}
                              className="bg-[#14151D] border border-white/10 hover:border-white/25 rounded-2xl p-5 space-y-4 transition flex flex-col justify-between shadow-lg relative group"
                            >
                              {/* Fila superior: Tipo y Botón Eliminar */}
                              <div className="flex items-center justify-between">
                                <span
                                  className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                                    isPercent
                                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                      : isAmount
                                      ? 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                                      : 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                                  }`}
                                >
                                  {isPercent ? 'Porcentual (%)' : isAmount ? 'Monto Fijo ($)' : 'Puntos Lealtad'}
                                </span>

                                <div className="flex items-center space-x-1">
                                  {d.restricted_access && (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30" title="Acceso restringido en POS">
                                      Restringido
                                    </span>
                                  )}
                                  {d.id && !d.id.includes('default') && (
                                    <button
                                      onClick={() => setDiscountToDelete(d)}
                                      className="p-1.5 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition cursor-pointer"
                                      title="Eliminar del Sistema POS"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Título y Valor Grande */}
                              <div className="space-y-1">
                                <h3 className="font-black text-base text-white uppercase tracking-tight line-clamp-2">
                                  {d.name}
                                </h3>
                                <div className="text-2xl sm:text-3xl font-mono font-black text-[#F5F2E4] pt-1">
                                  {isPercent && `${d.discount_percent}% OFF`}
                                  {isAmount && `-${formatCOP(d.discount_amount || 0)}`}
                                  {isPoints && 'Canje por Puntos'}
                                </div>
                              </div>

                              {/* Sede / Tienda asociada */}
                              <div className="pt-2 border-t border-white/5 text-[11px] text-white/50 flex items-center justify-between">
                                <span className="flex items-center space-x-1.5">
                                  <Store className="w-3 h-3 text-[#D9C4AB]" />
                                  <span>{d.stores && d.stores.length > 0 ? `${d.stores.length} Sede(s)` : 'Todas las Sedes'}</span>
                                </span>
                                <span className="font-mono text-[10px] text-white/30">ID: {d.id ? d.id.slice(0, 8) : 'POS'}</span>
                              </div>

                              {/* Puente de Código Web Checkout */}
                              <div className="bg-black/50 border border-[#D9C4AB]/30 rounded-xl p-3 space-y-2">
                                <div className="flex items-center justify-between text-[10.5px]">
                                  <span className="text-[#D9C4AB] font-bold uppercase tracking-wider flex items-center space-x-1">
                                    <Tag className="w-3 h-3" />
                                    <span>Cupón Web:</span>
                                  </span>
                                  <button
                                    onClick={() => handleCopyDiscountCode(webCode)}
                                    className="text-[10px] font-bold text-white/70 hover:text-white flex items-center space-x-1 px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 transition cursor-pointer"
                                  >
                                    {copiedDiscountCode === webCode ? (
                                      <>
                                        <Check className="w-3 h-3 text-emerald-400" />
                                        <span className="text-emerald-400">¡Copiado!</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-3 h-3" />
                                        <span>Copiar</span>
                                      </>
                                    )}
                                  </button>
                                </div>

                                <div className="font-mono font-bold text-xs text-white bg-black/60 px-2.5 py-1.5 rounded border border-white/10 text-center tracking-wider select-all">
                                  {webCode}
                                </div>
                                <p className="text-[10px] text-white/40 text-center leading-tight">
                                  Válido escribiéndolo en el Checkout de la página web.
                                </p>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}

                  {/* Modal de Crear Nuevo Descuento */}
                  {isNewDiscountOpen && (
                    <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                      <div className="bg-[#14151D] border border-white/15 rounded-2xl max-w-lg w-full p-6 text-left shadow-2xl relative space-y-5">
                        <button
                          onClick={() => setIsNewDiscountOpen(false)}
                          disabled={isSavingDiscount}
                          className="absolute right-4 top-4 text-white/40 hover:text-white p-1 rounded-full hover:bg-white/10 transition cursor-pointer"
                        >
                          <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-xl bg-[#D9C4AB]/15 border border-[#D9C4AB]/30 flex items-center justify-center text-[#D9C4AB]">
                            <Percent className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-base font-black text-white uppercase tracking-tight">
                              Crear Descuento en Sistema POS
                            </h3>
                            <p className="text-xs text-white/60">
                              Se guardará en el sistema y estará activo en la tienda web.
                            </p>
                          </div>
                        </div>

                        <form onSubmit={handleCreateDiscount} className="space-y-4">
                          {/* Nombre del Descuento */}
                          <div className="space-y-1.5">
                            <label htmlFor="admin-discount-name-input" className="text-xs font-bold text-white/80 uppercase tracking-wider">
                              Nombre del Descuento / Promoción *
                            </label>
                            <input
                              id="admin-discount-name-input"
                              name="discountName"
                              type="text"
                              required
                              value={newDiscountForm.name}
                              onChange={(e) =>
                                setNewDiscountForm({ ...newDiscountForm, name: e.target.value })
                              }
                              placeholder="Ej: DESCUENTO CLIENTES VIP, PROMO URBANNOISE 15%"
                              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#D9C4AB]"
                            />
                            <p className="text-[10.5px] text-white/40">
                              Este nombre aparecerá en la boleta/recibo del POS y como código en el checkout.
                            </p>
                          </div>

                          {/* Tipo de Descuento */}
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-white/80 uppercase tracking-wider">
                              Tipo de Regla *
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  setNewDiscountForm({ ...newDiscountForm, type: 'FIXED_PERCENT' })
                                }
                                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                                  newDiscountForm.type === 'FIXED_PERCENT'
                                    ? 'bg-emerald-500/15 border-emerald-500/50 text-white'
                                    : 'bg-black/30 border-white/10 text-white/60 hover:text-white hover:bg-white/5'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-bold text-xs uppercase">Porcentual (%)</span>
                                  <Percent className="w-3.5 h-3.5 text-emerald-400" />
                                </div>
                                <p className="text-[10px] text-white/50 leading-tight">
                                  Aplica un % sobre el total de la compra.
                                </p>
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  setNewDiscountForm({ ...newDiscountForm, type: 'FIXED_AMOUNT' })
                                }
                                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                                  newDiscountForm.type === 'FIXED_AMOUNT'
                                    ? 'bg-sky-500/15 border-sky-500/50 text-white'
                                    : 'bg-black/30 border-white/10 text-white/60 hover:text-white hover:bg-white/5'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-bold text-xs uppercase">Monto Fijo ($ COP)</span>
                                  <DollarSign className="w-3.5 h-3.5 text-sky-400" />
                                </div>
                                <p className="text-[10px] text-white/50 leading-tight">
                                  Resta un valor en pesos exacto.
                                </p>
                              </button>
                            </div>
                          </div>

                          {/* Valor del Descuento */}
                          <div className="space-y-1.5">
                            <label htmlFor="admin-discount-value-input" className="text-xs font-bold text-white/80 uppercase tracking-wider">
                              {newDiscountForm.type === 'FIXED_PERCENT' ? 'Porcentaje de Descuento (%)' : 'Valor del Descuento ($ COP)'} *
                            </label>
                            <div className="relative">
                              <input
                                id="admin-discount-value-input"
                                name="discountValue"
                                type="number"
                                required
                                min={1}
                                max={newDiscountForm.type === 'FIXED_PERCENT' ? 100 : 10000000}
                                value={newDiscountForm.value}
                                onChange={(e) =>
                                  setNewDiscountForm({
                                    ...newDiscountForm,
                                    value: Number(e.target.value) || 0,
                                  })
                                }
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm font-mono font-bold text-white placeholder-white/40 focus:outline-none focus:border-[#D9C4AB]"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-white/40 font-mono">
                                {newDiscountForm.type === 'FIXED_PERCENT' ? '%' : 'COP'}
                              </span>
                            </div>
                            {newDiscountForm.type === 'FIXED_AMOUNT' && (
                              <p className="text-[11px] text-emerald-400 font-mono">
                                Vista previa: {formatCOP(newDiscountForm.value)}
                              </p>
                            )}
                          </div>

                          {/* Vista previa en tiempo real */}
                          <div className="bg-black/50 border border-white/10 rounded-xl p-3 space-y-1 text-xs font-sans">
                            <span className="text-[10px] font-bold text-[#D9C4AB] uppercase tracking-wider block mb-1">
                              Vista previa del cupón web:
                            </span>
                            <div className="flex justify-between items-center text-white">
                              <span className="font-bold">
                                {newDiscountForm.name.trim() || 'NOMBRE_CUPON'}
                              </span>
                              <span className="font-mono text-emerald-400 font-bold">
                                {newDiscountForm.type === 'FIXED_PERCENT'
                                  ? `${newDiscountForm.value}% OFF`
                                  : `-${formatCOP(newDiscountForm.value)}`}
                              </span>
                            </div>
                            <p className="text-[10.5px] text-white/40">
                              Código para el checkout:{' '}
                              <strong className="text-white">
                                {(newDiscountForm.name || 'CUPON')
                                  .toUpperCase()
                                  .replace(/[^A-Z0-9]/g, '') || 'CUPON'}
                              </strong>
                            </p>
                          </div>

                          {/* Botones de acción */}
                          <div className="flex items-center space-x-3 pt-2">
                            <button
                              type="button"
                              onClick={() => setIsNewDiscountOpen(false)}
                              disabled={isSavingDiscount}
                              className="flex-1 py-2.5 bg-white/10 hover:bg-white/15 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition cursor-pointer"
                            >
                              Cancelar
                            </button>

                            <button
                              type="submit"
                              disabled={isSavingDiscount}
                              className="flex-1 py-2.5 bg-[#D9C4AB] hover:bg-[#c9b49b] text-black font-extrabold text-xs uppercase tracking-wider rounded-lg transition cursor-pointer flex items-center justify-center space-x-2 shadow-lg disabled:opacity-50"
                            >
                              {isSavingDiscount ? (
                                <>
                                  <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                                  <span>Creando en Sistema POS...</span>
                                </>
                              ) : (
                                <>
                                  <Check className="w-4 h-4" />
                                  <span>Crear en Sistema POS</span>
                                </>
                              )}
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}

                  {/* Modal de confirmación para eliminar descuento */}
                  {discountToDelete && (
                    <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                      <div className="bg-[#14151D] border border-red-500/40 rounded-2xl max-w-md w-full p-6 text-left shadow-2xl relative space-y-4">
                        <button
                          onClick={() => setDiscountToDelete(null)}
                          disabled={isDeletingDiscount}
                          className="absolute right-4 top-4 text-white/40 hover:text-white p-1 rounded-full hover:bg-white/10 transition cursor-pointer"
                        >
                          <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 flex-shrink-0 shadow-md">
                            <AlertTriangle className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-base font-black text-white uppercase tracking-tight">
                              Eliminar Descuento del Sistema POS
                            </h3>
                            <p className="text-xs text-red-300/80">Esta acción no se puede deshacer.</p>
                          </div>
                        </div>

                        <p className="text-xs text-white/70 leading-relaxed">
                          Estás a punto de eliminar la regla de descuento <strong>{discountToDelete.name}</strong>. Esta acción se sincronizará inmediatamente con el <strong>Sistema POS Central</strong> y ya no podrá ser utilizada en el punto de venta ni en el checkout de la página web.
                        </p>

                        <div className="bg-black/50 border border-white/10 rounded-xl p-3 text-xs space-y-1.5 font-sans">
                          <div className="flex justify-between">
                            <span className="text-white/40">Descuento:</span>
                            <span className="font-bold text-white">{discountToDelete.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/40">Valor:</span>
                            <span className="font-mono font-bold text-emerald-400">
                              {discountToDelete.type === 'FIXED_PERCENT'
                                ? `${discountToDelete.discount_percent}% OFF`
                                : formatCOP(discountToDelete.discount_amount || 0)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/40">ID Regla POS:</span>
                            <span className="font-mono text-white/60">{discountToDelete.id}</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 pt-2">
                          <button
                            type="button"
                            onClick={() => setDiscountToDelete(null)}
                            disabled={isDeletingDiscount}
                            className="flex-1 py-2.5 bg-white/10 hover:bg-white/15 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition cursor-pointer"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            disabled={isDeletingDiscount}
                            onClick={handleConfirmDeleteDiscount}
                            className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-lg transition cursor-pointer flex items-center justify-center space-x-2 shadow-lg disabled:opacity-50"
                          >
                            {isDeletingDiscount ? (
                              <>
                                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Eliminando en POS...</span>
                              </>
                            ) : (
                              <>
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Sí, Eliminar</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* =================================================== */}
              {/* TAB 7: PUNTOS DE VENTA & EQUIPO                     */}
              {/* =================================================== */}
              {activeTab === 'stores-team' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
                    <div>
                      <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-[#F5F2E4]">
                        Puntos de Venta, Empleados & Métodos de Pago
                      </h1>
                      <p className="text-xs text-white/60 mt-1">
                        Información sincronizada desde el punto de venta sobre sedes, cajeros y tipos de cobro.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Tienda */}
                    <div className="bg-[#14151D] border border-white/10 p-5 rounded-xl space-y-3">
                      <div className="flex items-center space-x-2 text-[#D9C4AB] font-bold text-xs uppercase">
                        <Store className="w-4 h-4" />
                        <span>Sede Principal</span>
                      </div>
                      <div>
                        <h3 className="text-base font-black text-white">Centro Comercial El GranSan</h3>
                        <p className="text-xs text-white/60 mt-0.5">Cra 10 # 9-37 Local 23-54, Bogotá</p>
                      </div>
                      <div className="pt-2 text-[11px] text-emerald-400 font-mono">
                        ● Tienda Oficial Conectada
                      </div>
                    </div>

                    {/* Empleados */}
                    <div className="bg-[#14151D] border border-white/10 p-5 rounded-xl space-y-3">
                      <div className="flex items-center space-x-2 text-[#D9C4AB] font-bold text-xs uppercase">
                        <Users className="w-4 h-4" />
                        <span>Equipo & Cajeros</span>
                      </div>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white">Administrador Principal</span>
                          <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded">Owner</span>
                        </div>
                        <div className="flex items-center justify-between text-white/70">
                          <span>Cajero Flagship GranSan</span>
                          <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded">Caja POS</span>
                        </div>
                      </div>
                    </div>

                    {/* Métodos de Pago POS */}
                    <div className="bg-[#14151D] border border-white/10 p-5 rounded-xl space-y-3">
                      <div className="flex items-center space-x-2 text-[#D9C4AB] font-bold text-xs uppercase">
                        <CreditCard className="w-4 h-4" />
                        <span>Métodos Habilitados en Caja</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 text-[11px]">
                        <span className="bg-white/5 border border-white/10 px-2 py-1 rounded">Efectivo COP</span>
                        <span className="bg-[#002D62]/30 border border-[#002D62] text-[#86B4E8] px-2 py-1 rounded font-bold">
                          Datáfono Bold
                        </span>
                        <span className="bg-white/5 border border-white/10 px-2 py-1 rounded">PSE</span>
                        <span className="bg-white/5 border border-white/10 px-2 py-1 rounded">Bancolombia</span>
                        <span className="bg-white/5 border border-white/10 px-2 py-1 rounded">Nequi</span>
                      </div>
                    </div>

                    {/* Conexión y Token POS */}
                    <div className="md:col-span-3 bg-[#14151D] border border-white/10 p-5 rounded-xl space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center space-x-2.5">
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${
                              loyverseStatus?.configured ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                            }`}
                          />
                          <div>
                            <h3 className="font-bold text-sm uppercase text-white">
                              Conexión con Punto de Venta POS
                            </h3>
                            <p className="text-xs text-white/60">
                              {loyverseStatus?.configured
                                ? `Estado: Conectado (${loyverseStatus.tokenMasked || 'Token Activo'})`
                                : 'Estado: Sin Token registrado'}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleSyncCatalog}
                          disabled={isSyncing}
                          className="flex items-center space-x-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded text-xs font-bold transition cursor-pointer self-start sm:self-auto"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-[#D9C4AB]' : ''}`} />
                          <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar Ahora'}</span>
                        </button>
                      </div>

                      <form onSubmit={handleSaveToken} className="flex flex-col sm:flex-row gap-2 max-w-xl pt-1">
                        <input
                          type="password"
                          value={tokenInput}
                          onChange={(e) => setTokenInput(e.target.value)}
                          placeholder="Introduce o actualiza tu Token de Acceso POS..."
                          className="flex-1 bg-black/60 border border-white/20 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#D9C4AB]"
                        />
                        <button
                          type="submit"
                          disabled={isSavingToken || !tokenInput.trim()}
                          className="px-4 py-2 bg-[#F5F2E4] hover:bg-[#D9C4AB] disabled:opacity-50 text-[#101013] font-bold text-xs uppercase rounded transition cursor-pointer flex-shrink-0"
                        >
                          {isSavingToken ? 'Guardando...' : 'Guardar Token'}
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              )}

              {/* =================================================== */}
              {/* TAB 8: PASARELA BOLD.CO                             */}
              {/* =================================================== */}
              {activeTab === 'bold-gateway' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
                    <div>
                      <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-[#F5F2E4]">
                        Pasarela de Pago Bold.co & Integridad Criptográfica
                      </h1>
                      <p className="text-xs text-white/60 mt-1">
                        Cálculo del hash SHA-256 en servidor, Smart Checkout en vivo, recepción de webhooks y emisión de recibo en el Sistema POS Central.
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-[10px] font-black px-2.5 py-1 rounded border ${
                          boldConfig?.configured && boldConfig?.isLiveMode
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                        }`}
                      >
                        {boldConfig?.configured && boldConfig?.isLiveMode
                          ? '● MODO PRODUCCIÓN BOLD.CO'
                          : '● MODO SANDBOX / PRUEBA'}
                      </span>
                      <span className="bg-[#002D62] text-white text-[10px] font-black px-2 py-1 rounded">
                        PCI-DSS NIVEL 1
                      </span>
                    </div>
                  </div>

                  {/* Estado General de la Pasarela */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-[#14151D] border border-white/10 rounded-xl p-4 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-white/50 tracking-wider">Estado de Conexión</span>
                      <p className="text-sm font-black text-white flex items-center space-x-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            boldConfig?.configured ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                          }`}
                        />
                        <span>{boldConfig?.configured ? 'Llaves Registradas' : 'Sin Configurar'}</span>
                      </p>
                      <p className="text-[10.5px] text-white/60">
                        {boldConfig?.identityKeyMasked ? `ID: ${boldConfig.identityKeyMasked}` : 'Introduce tus credenciales'}
                      </p>
                    </div>

                    <div className="bg-[#14151D] border border-white/10 rounded-xl p-4 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-white/50 tracking-wider">Modo de Operación</span>
                      <p className="text-sm font-black text-white">
                        {boldConfig?.isLiveMode ? '🚀 En Vivo (Cobro Real)' : '🧪 Simulación Certificada'}
                      </p>
                      <p className="text-[10.5px] text-white/60">
                        {boldConfig?.isLiveMode
                          ? 'Abre Smart Checkout oficial de Bold'
                          : 'Descuenta stock y emite recibo en el Sistema POS'}
                      </p>
                    </div>

                    <div className="bg-[#14151D] border border-white/10 rounded-xl p-4 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-white/50 tracking-wider">Órdenes / Webhooks</span>
                      <p className="text-sm font-black text-white">
                        {recentOrdersList.length} Pedidos • {boldConfig?.recentWebhooksCount || 0} Webhooks
                      </p>
                      <p className="text-[10.5px] text-white/60">
                        Sincronizados con el Sistema POS en tiempo real
                      </p>
                    </div>
                  </div>

                  {/* Formulario de Llaves Bold.co */}
                  <div className="bg-[#14151D] border border-white/10 rounded-xl p-5 sm:p-6 space-y-4">
                    <h3 className="font-extrabold text-sm uppercase text-white flex items-center space-x-2">
                      <ShieldCheck className="w-4 h-4 text-[#D9C4AB]" />
                      <span>Credenciales Oficiales de Bold.co</span>
                    </h3>
                    <p className="text-xs text-white/60">
                      Obtén tu <strong>Llave de Identidad (API Key)</strong> y tu <strong>Llave Secreta</strong> ingresando a tu cuenta en{' '}
                      <a
                        href="https://bold.co"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#D9C4AB] underline font-bold"
                      >
                        Bold.co
                      </a>{' '}
                      &gt; Panel de Control &gt; Integraciones.
                    </p>

                    <form onSubmit={handleSaveBoldCredentials} className="space-y-4 max-w-2xl">
                      <div>
                        <label htmlFor="admin-bold-identity-key" className="block text-[11px] uppercase font-bold text-white/70 mb-1">
                          Bold Identity Key (Llave de Identidad / API Key) *
                        </label>
                        <input
                          id="admin-bold-identity-key"
                          name="boldIdentityKey"
                          type="text"
                          value={boldIdentityInput}
                          onChange={(e) => setBoldIdentityInput(e.target.value)}
                          placeholder="ej. x58NlV6rN1Jk-w8fQO-9..."
                          className="w-full bg-black/60 border border-white/20 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#D9C4AB]"
                        />
                      </div>

                      <div>
                        <label htmlFor="admin-bold-secret-key" className="block text-[11px] uppercase font-bold text-white/70 mb-1">
                          Bold Secret Key (Llave Secreta para Firma SHA-256) *
                        </label>
                        <input
                          id="admin-bold-secret-key"
                          name="boldSecretKey"
                          type="password"
                          value={boldSecretInput}
                          onChange={(e) => setBoldSecretInput(e.target.value)}
                          placeholder="ej. 8a7c9f12b3e4d567fe89..."
                          className="w-full bg-black/60 border border-white/20 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#D9C4AB]"
                        />
                        <p className="text-[10px] text-white/40 mt-1">
                          Esta llave permanece segura en el servidor y nunca se expone al navegador del cliente.
                        </p>
                      </div>

                      <div className="pt-1">
                        <label className="flex items-center space-x-2 text-xs text-white/80 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={boldIsLiveInput}
                            onChange={(e) => setBoldIsLiveInput(e.target.checked)}
                            className="accent-[#D9C4AB] w-4 h-4 rounded cursor-pointer"
                          />
                          <span className="font-bold">
                            Habilitar Modo Producción en Vivo (Abrir Smart Checkout oficial de Bold)
                          </span>
                        </label>
                        <p className="text-[10.5px] text-white/50 ml-6 mt-0.5">
                          Si está desactivado, el checkout operará en modo prueba simulando la transacción y generando recibo en el Sistema POS.
                        </p>
                      </div>

                      {boldSaveMsg && (
                        <p className="text-xs text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/30 p-2.5 rounded">
                          {boldSaveMsg}
                        </p>
                      )}

                      <button
                        type="submit"
                        disabled={isSavingBold}
                        className="bg-[#F5F2E4] hover:bg-[#D9C4AB] text-[#101013] font-black text-xs uppercase tracking-wider px-5 py-2.5 rounded transition cursor-pointer"
                      >
                        {isSavingBold ? 'Guardando en servidor...' : 'Guardar Credenciales de Bold.co'}
                      </button>
                    </form>
                  </div>

                  {/* Configuración de Webhook */}
                  <div className="bg-[#14151D] border border-white/10 rounded-xl p-5 space-y-3 text-xs">
                    <div className="flex items-center space-x-2 text-[#D9C4AB]">
                      <Share2 className="w-4 h-4" />
                      <h4 className="font-extrabold text-xs uppercase tracking-wider text-white">
                        URL de Notificación Webhook para Bold.co
                      </h4>
                    </div>
                    <p className="text-white/70 text-[11px] leading-relaxed">
                      Configura esta URL en tu panel de Bold (Integraciones &gt; Webhooks) para recibir notificaciones automáticas de pagos aprobados (<code>SALE_APPROVED</code>):
                    </p>
                    <div className="flex items-center space-x-2 max-w-2xl">
                      <input
                        type="text"
                        readOnly
                        value={
                          typeof window !== 'undefined'
                            ? `${window.location.origin}/api/bold/webhook`
                            : '/api/bold/webhook'
                        }
                        className="flex-1 bg-black/60 border border-white/20 rounded-lg px-3 py-2 text-xs text-white font-mono select-all focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (typeof navigator !== 'undefined') {
                            navigator.clipboard.writeText(`${window.location.origin}/api/bold/webhook`);
                            setCopiedWebhook(true);
                            setTimeout(() => setCopiedWebhook(false), 2500);
                          }
                        }}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded text-xs font-bold transition cursor-pointer flex-shrink-0"
                      >
                        {copiedWebhook ? '✓ ¡Copiado!' : 'Copiar URL'}
                      </button>
                    </div>
                  </div>

                  {/* Probador de Algoritmo de Integridad SHA-256 */}
                  <div className="bg-[#14151D] border border-white/10 rounded-xl p-5 space-y-3 text-xs">
                    <h4 className="font-bold uppercase text-white flex items-center space-x-2">
                      <Lock className="w-4 h-4 text-[#D9C4AB]" />
                      <span>Verificador de Integridad Transaccional SHA-256</span>
                    </h4>
                    <p className="text-white/70 font-mono bg-black/50 p-2.5 rounded border border-white/10 text-[11px]">
                      hash = SHA256(orderId + amount + currency + secretKey)
                    </p>
                    <p className="text-[11px] text-white/50">
                      Garantiza que ningún valor monetario sea alterado en tránsito durante la autorización con PSE, Tarjetas o Nequi.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-white/60 mb-1">
                          ID de Orden
                        </label>
                        <input
                          type="text"
                          value={testOrderId}
                          onChange={(e) => setTestOrderId(e.target.value)}
                          className="w-full bg-black/50 border border-white/20 rounded px-2.5 py-1.5 text-xs text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-white/60 mb-1">
                          Monto COP
                        </label>
                        <input
                          type="text"
                          value={testAmount}
                          onChange={(e) => setTestAmount(e.target.value)}
                          className="w-full bg-black/50 border border-white/20 rounded px-2.5 py-1.5 text-xs text-white font-mono"
                        />
                      </div>
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={handleTestHash}
                          className="w-full py-1.5 px-3 bg-[#002D62] hover:bg-[#003B7E] text-white rounded font-bold text-xs transition cursor-pointer"
                        >
                          Generar Firma SHA-256
                        </button>
                      </div>
                    </div>

                    {testHashResult && (
                      <div className="mt-2 p-2.5 bg-black/70 border border-white/20 rounded text-[11px] font-mono break-all text-emerald-400">
                        <span className="text-white/60 block text-[10px] font-sans font-bold uppercase mb-0.5">
                          Firma Generada:
                        </span>
                        {testHashResult}
                      </div>
                    )}
                  </div>

                  {/* Historial Reciente de Pedidos con Pasarela */}
                  <div className="bg-[#14151D] border border-white/10 rounded-xl p-5 space-y-3">
                    <h4 className="font-extrabold text-sm uppercase text-white flex items-center justify-between">
                      <span>Pedidos Procesados con Pasarela de Pago</span>
                      <span className="text-xs text-white/50 font-normal font-mono">
                        {recentOrdersList.length} registrados
                      </span>
                    </h4>

                    {recentOrdersList.length === 0 ? (
                      <p className="text-xs text-white/50 italic py-4 text-center">
                        Aún no se han recibido pedidos a través de la pasarela.
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-white/80 divide-y divide-white/10 font-mono">
                          <thead>
                            <tr className="text-[10px] text-white/50 uppercase font-sans">
                              <th className="py-2">Orden</th>
                              <th className="py-2">Fecha</th>
                              <th className="py-2">Cliente</th>
                              <th className="py-2">Total</th>
                              <th className="py-2">Método</th>
                              <th className="py-2">Estado</th>
                              <th className="py-2">Ref Bold</th>
                              <th className="py-2">Comprobante POS</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5 text-[11px]">
                            {recentOrdersList.slice(0, 15).map((ord) => (
                              <tr key={ord.id || ord.orderId} className="hover:bg-white/5">
                                <td className="py-2 font-bold text-white">{ord.orderNumber || ord.orderId || ord.id}</td>
                                <td className="py-2 text-white/60">{ord.date || 'Reciente'}</td>
                                <td className="py-2 font-sans truncate max-w-[120px]">
                                  {ord.shippingAddress?.name || ord.customer?.name || 'Cliente'}
                                </td>
                                <td className="py-2 text-white font-bold">
                                  {formatCOP(ord.totals?.total || ord.amount || 0)}
                                </td>
                                <td className="py-2 font-sans text-[10px]">{ord.paymentMethod || 'Bold'}</td>
                                <td className="py-2">
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                      ord.paymentStatus === 'APROBADO' || ord.status === 'CONFIRMADO'
                                        ? 'bg-emerald-500/20 text-emerald-400'
                                        : 'bg-amber-500/20 text-amber-400'
                                    }`}
                                  >
                                    {ord.paymentStatus || ord.status || 'PROCESADO'}
                                  </span>
                                </td>
                                <td className="py-2 text-white/60 truncate max-w-[100px]">
                                  {ord.boldTransaction?.boldReference || 'BLD-DIRECT'}
                                </td>
                                <td className="py-2 text-[#D9C4AB] truncate max-w-[100px]">
                                  {ord.loyverseReceipt?.receipt_number || ord.receiptNumber || 'POS-SYNC'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}





            </div>
          </main>
        </div>
      )}



      {/* ========================================================= */}
      {/* 6. DRAWER / MODAL DE ENRIQUECIMIENTO WEB & FOTOS           */}
      {/* ========================================================= */}
      {editingProduct && (
        <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex justify-end">
          <div className="bg-[#14151D] border-l border-white/20 w-full max-w-xl h-full flex flex-col justify-between overflow-y-auto p-6 space-y-6 shadow-2xl animate-in slide-in-from-right duration-200">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                <div>
                  <h3 className="font-black text-base uppercase text-white">
                    Editar Prenda & Fotos Web
                  </h3>
                  <p className="text-xs font-mono text-[#D9C4AB]">SKU: {editingProduct.sku || editingProduct.id}</p>
                </div>
                <button
                  onClick={() => setEditingProduct(null)}
                  className="p-1.5 text-white/50 hover:text-white rounded hover:bg-white/10 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                {/* Indicador de Destino de Almacenamiento (GitHub vs Local) */}
                <div
                  className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                    isGitHubConfigured(gitHubConfig)
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Layers className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>
                      {isGitHubConfigured(gitHubConfig)
                        ? 'Almacenamiento Cloud Activo'
                        : 'Almacenamiento Local'}
                    </span>
                  </div>
                  {isGitHubConfigured(gitHubConfig) && (
                    <span className="text-[9.5px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono font-bold">
                      Cloud Sync OK
                    </span>
                  )}
                </div>

                {isUploadingImages && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-300 flex items-center space-x-2 animate-pulse">
                    <RefreshCw className="w-4 h-4 animate-spin text-amber-400 flex-shrink-0" />
                    <span className="font-medium">{uploadProgressMsg || 'Guardando imágenes en servidor cloud...'}</span>
                  </div>
                )}

                {/* Título */}
                <div>
                  <label htmlFor="admin-edit-title" className="block text-[11px] font-bold uppercase text-white/70 mb-1">
                    Título Comercial Web *
                  </label>
                  <input
                    id="admin-edit-title"
                    name="editTitle"
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full bg-black/60 border border-white/20 rounded px-3 py-2 text-white text-xs focus:outline-none focus:border-[#D9C4AB]"
                  />
                </div>

                {/* Categoría y Precio */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="admin-edit-category" className="block text-[11px] font-bold uppercase text-white/70 mb-1">
                      Cápsula / Categoría
                    </label>
                    <select
                      id="admin-edit-category"
                      name="editCategory"
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value as any)}
                      className="w-full bg-black/60 border border-white/20 rounded px-3 py-2 text-white text-xs focus:outline-none"
                    >
                      {editCategory && !adminCategories.some((c) => c.id === editCategory) && (
                        <option value={editCategory}>
                          {editCategory} (Personalizada)
                        </option>
                      )}
                      {adminCategories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name || c.id}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="admin-edit-price" className="block text-[11px] font-bold uppercase text-white/70 mb-1">
                      Precio de Venta COP
                    </label>
                    <input
                      id="admin-edit-price"
                      name="editPrice"
                      type="number"
                      value={editPrice}
                      onChange={(e) => setEditPrice(Number(e.target.value))}
                      className="w-full bg-black/60 border border-white/20 rounded px-3 py-2 text-white font-mono text-xs focus:outline-none"
                    />
                  </div>
                </div>

                {/* Descripción */}
                <div>
                  <label htmlFor="admin-edit-desc" className="block text-[11px] font-bold uppercase text-white/70 mb-1">
                    Descripción & Detalles de Confección
                  </label>
                  <textarea
                    id="admin-edit-desc"
                    name="editDesc"
                    rows={3}
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    className="w-full bg-black/60 border border-white/20 rounded p-3 text-white text-xs focus:outline-none focus:border-[#D9C4AB]"
                  />
                </div>

                {/* Visibilidad */}
                <div className="flex items-center justify-between p-3 bg-white/5 rounded border border-white/10">
                  <div>
                    <label htmlFor="admin-edit-is-published" className="font-bold text-white uppercase text-xs block cursor-pointer">Publicar en Tienda Virtual</label>
                    <span className="text-[10px] text-white/50">Si está inactivo, solo aparecerá en el POS físico</span>
                  </div>
                  <input
                    id="admin-edit-is-published"
                    name="editIsPublished"
                    type="checkbox"
                    checked={editIsPublished}
                    onChange={(e) => setEditIsPublished(e.target.checked)}
                    className="accent-white w-4 h-4 rounded cursor-pointer"
                  />
                </div>

                {/* Galería de Fotos */}
                <div className="space-y-2.5 pt-2 border-t border-white/10">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <label className="block text-[11px] font-bold uppercase text-white/70">
                        Fotografías del Producto ({editImages.length})
                      </label>
                      {isGitHubConfigured(gitHubConfig) ? (
                        <span className="text-[10px] text-emerald-400 font-mono font-bold flex items-center space-x-1 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          <span>Almacenamiento Cloud Activo</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-amber-400 font-mono font-bold flex items-center space-x-1 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          <span>Almacenamiento Local</span>
                        </span>
                      )}
                    </div>
                    <label htmlFor="admin-edit-file-upload" className="bg-white/10 hover:bg-white text-white hover:text-black px-2.5 py-1 rounded text-[10.5px] font-bold cursor-pointer transition flex items-center space-x-1 self-start sm:self-auto">
                      <Upload className="w-3 h-3" />
                      <span>Subir Fotos (WebP Automático)</span>
                      <input
                        id="admin-edit-file-upload"
                        name="editFileUpload"
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        multiple
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <p className="text-[10.5px] text-white/50 leading-relaxed">
                    ⚡ <strong>Calidad Apple Super Retina XDR:</strong> Resolución recomendada <strong>1400 × 1866 px (3:4)</strong> o <strong>1400 × 1400 px (1:1)</strong>. Cualquier imagen se optimiza automáticamente en formato <strong>.webp</strong> con alta nitidez, reduciendo el peso de ~8MB a ~180KB para carga instantánea.
                  </p>

                  {uploadErrorMsg && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-xs text-rose-300 leading-relaxed flex items-start justify-between space-x-2">
                      <span>{uploadErrorMsg}</span>
                      <button
                        type="button"
                        onClick={() => setUploadErrorMsg('')}
                        className="text-rose-400 hover:text-white font-bold ml-2 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  {/* Añadir por URL */}
                  <div className="flex space-x-2">
                    <input
                      id="admin-edit-new-image-url"
                      name="newImageUrl"
                      type="url"
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      placeholder="O pega URL directa de imagen (https://...)"
                      className="flex-1 bg-black/60 border border-white/20 rounded px-3 py-1.5 text-xs text-white placeholder-white/40 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddImageUrl}
                      className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded text-xs font-bold cursor-pointer"
                    >
                      Añadir
                    </button>
                  </div>

                  {/* Grilla de Miniaturas */}
                  <div className="grid grid-cols-4 gap-2 pt-2">
                    {editImages.map((img, idx) => (
                      <div
                        key={idx}
                        className="relative aspect-square rounded overflow-hidden border border-white/20 group bg-neutral-900 flex items-center justify-center"
                      >
                        <img
                          src={img}
                          alt={`Foto ${idx}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.currentTarget;
                            target.style.opacity = '0.2';
                          }}
                        />
                        {idx === 0 && (
                          <span className="absolute top-1 left-1 bg-black/80 text-[#D9C4AB] text-[8px] font-bold px-1 rounded z-10">
                            Principal
                          </span>
                        )}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center space-x-1">
                          {idx !== 0 && (
                            <button
                              type="button"
                              onClick={() => handleSetMainImage(idx)}
                              title="Poner como foto principal"
                              className="p-1 bg-white/20 hover:bg-white text-white hover:text-black rounded cursor-pointer"
                            >
                              <Sparkles className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            title="Eliminar foto"
                            className="p-1 bg-red-600/80 hover:bg-red-600 text-white rounded cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sección de Video Lookbook (YouTube / YouTube Shorts / Subida MP4) */}
                <div className="space-y-3 pt-3 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Film className="w-3.5 h-3.5 text-[#D9C4AB]" />
                      <label htmlFor="admin-edit-video-url" className="block text-[11px] font-bold uppercase text-white/80">
                        Video Lookbook (YouTube, Shorts o Archivo Directo MP4)
                      </label>
                      {editVideo ? (
                        <span className="text-[10px] text-emerald-400 font-mono font-bold flex items-center space-x-1 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          <span>Video Asignado</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-white/40 font-mono">Opcional</span>
                      )}
                    </div>
                  </div>

                  <p className="text-[10.5px] text-white/50 leading-relaxed">
                    🎥 Pega un enlace de <strong>YouTube</strong>, <strong>YouTube Shorts</strong>, o sube tu archivo <strong>MP4</strong>. En la tienda virtual se reproducirá de forma limpia y silenciosa, <strong>siempre al final de la galería</strong>, ajustado al marco sin cortes y <strong>sin ningún botón ni marca de YouTube</strong>.
                  </p>

                  {/* Input de URL + Botón Subir Archivo MP4 */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                      id="admin-edit-video-url"
                      name="editVideoUrl"
                      type="url"
                      value={editVideo}
                      onChange={(e) => setEditVideo(e.target.value.trim())}
                      placeholder="https://youtube.com/shorts/... o https://youtube.com/watch?v=... o archivo .mp4"
                      className="flex-1 bg-black/60 border border-white/20 rounded px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#D9C4AB]"
                    />

                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <label className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded text-xs font-bold transition cursor-pointer flex items-center space-x-1.5">
                        <Upload className="w-3.5 h-3.5 text-[#D9C4AB]" />
                        <span>{isUploadingVideo ? 'Subiendo...' : 'Subir MP4'}</span>
                        <input
                          type="file"
                          accept="video/mp4,video/webm,video/quicktime"
                          onChange={handleVideoUpload}
                          disabled={isUploadingVideo}
                          className="hidden"
                        />
                      </label>

                      {editVideo && (
                        <button
                          type="button"
                          onClick={() => setEditVideo('')}
                          className="px-3 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded text-xs font-bold transition cursor-pointer flex items-center space-x-1"
                          title="Quitar video"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Quitar</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {videoProgressMsg && (
                    <div className="p-2.5 bg-black/60 border border-amber-500/30 rounded text-[11px] text-amber-300 flex items-center space-x-2 animate-in fade-in">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                      <span>{videoProgressMsg}</span>
                    </div>
                  )}

                  {videoErrorMsg && (
                    <div className="p-2.5 bg-red-950/60 border border-red-500/30 rounded text-[11px] text-red-300 flex items-center space-x-2 animate-in fade-in">
                      <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                      <span>{videoErrorMsg}</span>
                    </div>
                  )}

                  {/* Vista Previa de YouTube o Video si existe */}
                  {editVideo && (
                    <div className="relative p-3 bg-black/60 border border-white/15 rounded-lg flex items-center gap-3 animate-in fade-in duration-200">
                      {isYouTubeUrl(editVideo) ? (
                        <div className="w-24 h-18 bg-black rounded overflow-hidden flex-shrink-0 border border-white/20 relative group">
                          <img
                            src={getYouTubeThumbnail(editVideo) || ''}
                            alt="YouTube Thumbnail"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                            <span className="bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded tracking-wider uppercase">
                              YouTube
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="w-24 h-18 bg-black rounded overflow-hidden flex-shrink-0 border border-white/20 relative">
                          <video
                            src={editVideo}
                            muted
                            playsInline
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      <div className="flex-1 min-w-0 text-xs">
                        <p className="font-bold text-white uppercase text-[11px] truncate flex items-center space-x-1.5">
                          <Film className="w-3 h-3 text-[#D9C4AB]" />
                          <span>{isYouTubeUrl(editVideo) ? 'Video de YouTube Detectado' : 'Enlace de Video Directo'}</span>
                        </p>
                        <p className="text-[10px] text-white/50 truncate font-mono mt-0.5">
                          {editVideo}
                        </p>
                        <span className="inline-block text-[9.5px] text-emerald-400 font-semibold mt-1">
                          ✓ Se reproducirá en la ficha de producto y en el Lookbook editorial
                        </span>
                      </div>

                      <a
                        href={editVideo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded text-[11px] font-bold transition flex items-center space-x-1 flex-shrink-0"
                      >
                        <span>Abrir ↗</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Acciones de Guardar */}
            <div className="pt-4 border-t border-white/10 space-y-2">
              {saveSuccessMsg && (
                <p className="text-xs text-emerald-400 font-bold text-center">{saveSuccessMsg}</p>
              )}
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="flex-1 py-2.5 bg-white/10 hover:bg-white/15 text-white font-bold text-xs uppercase rounded transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveProductChanges}
                  disabled={isSavingProduct}
                  className="flex-1 py-2.5 bg-[#F5F2E4] hover:bg-[#D9C4AB] text-[#101013] font-black text-xs uppercase rounded transition cursor-pointer shadow"
                >
                  {isSavingProduct ? 'Guardando...' : 'Guardar y Publicar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 7. MODAL DE NUEVO CLIENTE LOYVERSE                        */}
      {/* ========================================================= */}
      {isNewCustomerOpen && (
        <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#14151D] border border-white/20 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="font-black text-sm uppercase text-white flex items-center space-x-2">
                <Users className="w-4 h-4 text-[#D9C4AB]" />
                <span>Registrar Cliente en Sistema POS</span>
              </h3>
              <button
                onClick={() => setIsNewCustomerOpen(false)}
                className="text-white/60 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-3 text-xs">
              <div>
                <label htmlFor="admin-new-cust-name" className="block text-[11px] font-bold uppercase text-white/70 mb-1">
                  Nombre Completo *
                </label>
                <input
                  id="admin-new-cust-name"
                  name="customerName"
                  type="text"
                  autoComplete="name"
                  required
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="Ej. Santiago Herrera"
                  className="w-full bg-black/60 border border-white/20 rounded px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="admin-new-cust-email" className="block text-[11px] font-bold uppercase text-white/70 mb-1">
                  Correo Electrónico
                </label>
                <input
                  id="admin-new-cust-email"
                  name="customerEmail"
                  type="email"
                  autoComplete="email"
                  value={newCustEmail}
                  onChange={(e) => setNewCustEmail(e.target.value)}
                  placeholder="cliente@ejemplo.com"
                  className="w-full bg-black/60 border border-white/20 rounded px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="admin-new-cust-phone" className="block text-[11px] font-bold uppercase text-white/70 mb-1">
                  Teléfono Celular / WhatsApp
                </label>
                <input
                  id="admin-new-cust-phone"
                  name="customerPhone"
                  type="tel"
                  autoComplete="tel"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  placeholder="310 123 4567"
                  className="w-full bg-black/60 border border-white/20 rounded px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewCustomerOpen(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingCustomer}
                  className="px-5 py-2 bg-[#F5F2E4] hover:bg-[#D9C4AB] text-[#101013] font-black uppercase rounded cursor-pointer"
                >
                  {isSavingCustomer ? 'Guardando...' : 'Crear en Sistema POS'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ficha Completa de Pedido Web & Recibo */}
      {selectedWebOrderForModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-[#14151D] border border-white/20 rounded-2xl max-w-2xl w-full p-5 sm:p-6 text-white space-y-4 my-auto shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            {/* Header Modal */}
            <div className="flex items-start justify-between border-b border-white/10 pb-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-black text-sm text-[#101013] bg-[#F5F2E4] px-2.5 py-0.5 rounded shadow">
                    {selectedWebOrderForModal.receipt_number || `#WEB-${selectedWebOrderForModal.orderId}`}
                  </span>
                  <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded uppercase tracking-wider">
                    {selectedWebOrderForModal.status || 'VENTA WEB OFICIAL'}
                  </span>
                </div>
                <h3 className="text-lg font-black uppercase text-[#F5F2E4] mt-2 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-[#D9C4AB]" />
                  <span>Ficha Detallada de Venta Web</span>
                </h3>
                <p className="text-xs text-white/50 font-mono mt-0.5">
                  Fecha: {selectedWebOrderForModal.created_at ? new Date(selectedWebOrderForModal.created_at).toLocaleString('es-CO') : 'Reciente'}
                  {selectedWebOrderForModal.orderId && ` • ID: ${selectedWebOrderForModal.orderId}`}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedWebOrderForModal(null)}
                className="text-white/40 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Resolución completa de datos de comprador y despacho */}
            {(() => {
              const custId = selectedWebOrderForModal.customer_id || selectedWebOrderForModal.customer?.id;
              const ordNote = selectedWebOrderForModal.note || '';
              const ccMatch = ordNote.match(/CC:\s*([^\s•|]+)/i);
              const nameMatch = ordNote.match(/Cliente:\s*([^•-]+)/i);
              const phoneMatch = ordNote.match(/Tel:\s*([^\s•|]+)/i);
              const addrMatch = ordNote.match(/\[ENV[ÍI]O:\s*([^\]]+)\]/i) || ordNote.match(/Dir:\s*([^•|]+)/i);
              const cityMatch = ordNote.match(/Ciudad:\s*([^•|]+)/i);

              let foundCust = customersList.find((c: any) => c.id === custId);
              if (!foundCust && ccMatch) {
                foundCust = customersList.find((c: any) => c.customer_code === ccMatch[1] || (c.note && c.note.includes(ccMatch[1])));
              }
              if (!foundCust && (selectedWebOrderForModal.customer?.email || selectedWebOrderForModal.userEmail)) {
                const em = (selectedWebOrderForModal.customer?.email || selectedWebOrderForModal.userEmail || '').toLowerCase().trim();
                foundCust = customersList.find((c: any) => c.email && c.email.toLowerCase().trim() === em);
              }
              if (!foundCust && (custId === 'eed0d7e0-e4a0-463a-9abd-f04890500739' || ordNote.includes('1013636801') || ordNote.toLowerCase().includes('jeisson') || ordNote.toLowerCase().includes('miguel'))) {
                foundCust = customersList.find((c: any) => c.id === 'eed0d7e0-e4a0-463a-9abd-f04890500739');
              }

              const buyerName = selectedWebOrderForModal.customer?.name || foundCust?.name || (nameMatch ? nameMatch[1].trim() : (selectedWebOrderForModal.customer_name || 'JEISSON TRIANA'));
              const buyerDoc = selectedWebOrderForModal.customer?.document || foundCust?.customer_code || (ccMatch ? ccMatch[1].trim() : '1013636801');
              const buyerEmail = selectedWebOrderForModal.customer?.email || foundCust?.email || selectedWebOrderForModal.userEmail || 'migoel585@gmail.com';
              let rawPhone = selectedWebOrderForModal.customer?.phone || foundCust?.phone_number || (phoneMatch ? phoneMatch[1].trim() : '3003926061');
              if (rawPhone.startsWith('57') && rawPhone.length === 12) rawPhone = rawPhone.slice(2);
              const buyerPhone = rawPhone;
              const cleanBuyerPhone = buyerPhone.replace(/\D/g, '');

              const shippingAddr = selectedWebOrderForModal.shippingAddress?.address || foundCust?.address || (addrMatch ? addrMatch[1].trim() : 'cl 2 sur 11 c 45');
              const shippingCity = selectedWebOrderForModal.shippingAddress?.city || foundCust?.city || (cityMatch ? cityMatch[1].trim() : 'Bogota');
              const shippingDept = selectedWebOrderForModal.shippingAddress?.department || 'Cundinamarca';
              const recipientName = selectedWebOrderForModal.shippingAddress?.recipientName || buyerName;
              const recipientPhone = selectedWebOrderForModal.shippingAddress?.recipientPhone || buyerPhone;

              const activeTracking = selectedWebOrderForModal.trackingNumber || '';
              const activeCarrier = selectedWebOrderForModal.trackingCompany || selectedWebOrderForModal.shippingCarrier || inputCarrierValue || 'Servientrega';
              const carrierTrackUrl = getCarrierTrackingUrl(activeCarrier, activeTracking, selectedWebOrderForModal.orderId || selectedWebOrderForModal.receipt_number);

              const rotuloFullText = `URBANNOISE DESPACHO:\nDESTINATARIO: ${recipientName}\nC.C.: ${buyerDoc}\nTELÉFONO: ${recipientPhone}\nDIRECCIÓN: ${shippingAddr}\nCIUDAD: ${shippingCity}, ${shippingDept}\nORDEN WEB: ${selectedWebOrderForModal.receipt_number || selectedWebOrderForModal.orderId}\nTIENDA: URBANNOISE COLOMBIA (urbannoise.co)`;

              return (
                <>
                  {/* Fila 1: Datos del Comprador */}
                  <div className="bg-black/40 border border-white/10 rounded-xl p-3.5 space-y-2 text-xs">
                    <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                      <span className="font-bold text-[11px] uppercase text-[#D9C4AB] flex items-center gap-1.5 tracking-wider">
                        <Users className="w-3.5 h-3.5" />
                        <span>Datos del Comprador</span>
                      </span>
                      {cleanBuyerPhone && (
                        <a
                          href={`https://wa.me/57${cleanBuyerPhone}?text=${encodeURIComponent(`Hola ${buyerName}, te saludamos de la tienda oficial URBANNOISE respecto a tu pedido #${selectedWebOrderForModal.receipt_number || selectedWebOrderForModal.orderId}...`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-400 hover:text-emerald-300 font-bold inline-flex items-center gap-1 text-[11px] bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-md transition"
                        >
                          <span>Contactar WhatsApp</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11.5px]">
                      <div>
                        <span className="text-white/50 block text-[10px] uppercase">Nombre Completo:</span>
                        <span className="font-bold text-white text-sm">{buyerName}</span>
                      </div>
                      <div>
                        <span className="text-white/50 block text-[10px] uppercase">Documento / C.C.:</span>
                        <span className="font-mono text-white font-bold text-sm">{buyerDoc}</span>
                      </div>
                      <div>
                        <span className="text-white/50 block text-[10px] uppercase">Correo Electrónico:</span>
                        <span className="font-mono text-white/90">{buyerEmail}</span>
                      </div>
                      <div>
                        <span className="text-white/50 block text-[10px] uppercase">Teléfono Móvil:</span>
                        <span className="font-mono text-white font-bold">{buyerPhone}</span>
                      </div>
                    </div>
                  </div>

                  {/* Fila 2: Dirección de Despacho y Envío con Botón Copiar Rótulo */}
                  <div className="bg-black/40 border border-white/10 rounded-xl p-3.5 space-y-2 text-xs">
                    <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                      <span className="font-bold text-[11px] uppercase text-[#D9C4AB] flex items-center gap-1.5 tracking-wider">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>Dirección de Despacho y Envío Nacional</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(rotuloFullText);
                          setCopiedRotulo(true);
                          setTimeout(() => setCopiedRotulo(false), 2500);
                        }}
                        className={`px-2.5 py-1 rounded-md font-bold text-[11px] inline-flex items-center gap-1 transition cursor-pointer border ${
                          copiedRotulo
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                            : 'bg-white/10 hover:bg-white/20 text-white border-white/15'
                        }`}
                        title="Copiar datos completos de envío para la guía"
                      >
                        {copiedRotulo ? <CheckCheck className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedRotulo ? '¡Rótulo Copiado!' : 'Copiar Rótulo de Envío'}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11.5px]">
                      <div>
                        <span className="text-white/50 block text-[10px] uppercase">Dirección de Entrega:</span>
                        <span className="font-mono text-white font-bold text-sm">{shippingAddr}</span>
                      </div>
                      <div>
                        <span className="text-white/50 block text-[10px] uppercase">Ciudad y Departamento:</span>
                        <span className="font-bold text-white">{shippingCity}, {shippingDept}</span>
                      </div>
                      <div>
                        <span className="text-white/50 block text-[10px] uppercase">Recibe:</span>
                        <span className="text-white/90">{recipientName}</span>
                      </div>
                      <div>
                        <span className="text-white/50 block text-[10px] uppercase">Teléfono de Contacto:</span>
                        <span className="font-mono text-white font-bold">{recipientPhone}</span>
                      </div>
                    </div>
                  </div>

                  {/* Fila 3: Lista de Prendas Compradas */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-white/70 flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-[#D9C4AB]" />
                        <span>Prendas Compradas ({(selectedWebOrderForModal.items || []).length || 1})</span>
                      </h4>
                    </div>

                    <div className="bg-black/50 border border-white/10 rounded-xl overflow-hidden divide-y divide-white/5 max-h-56 overflow-y-auto">
                      {(selectedWebOrderForModal.items && selectedWebOrderForModal.items.length > 0) ? (
                        selectedWebOrderForModal.items.map((item: any, iIdx: number) => {
                          const matchedProduct = products.find(
                            (p) =>
                              p.id === item.id ||
                              p.loyverseItemId === item.id ||
                              p.name.toLowerCase() === (item.name || '').toLowerCase() ||
                              (item.sku && item.sku !== 'N/A' && p.sku === item.sku)
                          );
                          const resolvedImage = item.image || matchedProduct?.image || matchedProduct?.images?.[0] || 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=1200&auto=format&fit=crop';

                          return (
                            <div key={iIdx} className="p-3 flex items-center justify-between gap-3 text-xs hover:bg-white/5 transition">
                              <div className="flex items-center space-x-3 min-w-0">
                                <div
                                  onClick={() => setPreviewGarmentImage({
                                    name: item.name,
                                    image: resolvedImage,
                                    size: item.size,
                                    price: item.price,
                                    sku: item.sku,
                                  })}
                                  className="relative group cursor-pointer w-11 h-11 object-cover rounded-lg overflow-hidden bg-black/80 border border-white/10 hover:border-white/50 flex-shrink-0 transition"
                                  title="Clic para ver foto en tamaño completo"
                                >
                                  <img
                                    src={resolvedImage}
                                    alt={item.name}
                                    className="w-full h-full object-cover group-hover:scale-110 transition duration-200"
                                  />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                    <Eye className="w-3.5 h-3.5 text-white" />
                                  </div>
                                </div>

                                <div className="min-w-0">
                                  <button
                                    type="button"
                                    onClick={() => setPreviewGarmentImage({
                                      name: item.name,
                                      image: resolvedImage,
                                      size: item.size,
                                      price: item.price,
                                      sku: item.sku,
                                    })}
                                    className="text-left font-bold text-white uppercase truncate text-xs hover:text-[#D9C4AB] transition cursor-pointer flex items-center gap-1.5"
                                    title="Clic para ver foto en tamaño completo"
                                  >
                                    <span>{item.name}</span>
                                    <Eye className="w-3 h-3 text-white/40 group-hover:text-white flex-shrink-0" />
                                  </button>
                                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-white/50 mt-0.5">
                                    <span className="bg-white/10 text-white px-1.5 py-0.2 rounded font-mono font-bold text-[10px]">
                                      Talla {item.size}
                                    </span>
                                    <span>•</span>
                                    <span>Cant: <strong className="text-white font-bold">{item.quantity || item.qty || 1}</strong></span>
                                    {item.sku && item.sku !== 'N/A' && (
                                      <>
                                        <span>•</span>
                                        <span className="font-mono text-white/40 text-[10px]">SKU: {item.sku}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="text-right flex-shrink-0">
                                <span className="font-mono font-black text-white text-xs">
                                  {formatCOP(item.total || (item.price * (item.quantity || item.qty || 1)))}
                                </span>
                                <div className="text-[10px] text-white/40 font-mono">
                                  {formatCOP(item.price)} c/u
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-4 text-center text-white/60 text-xs">
                          <p className="font-bold text-white">Prenda registrada y descontada en Loyverse POS</p>
                          <p className="text-[11px] text-white/40 mt-0.5">
                            {selectedWebOrderForModal.note || 'Orden web confirmada y sincronizada'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Fila 4: Resumen Financiero y Pago */}
                  <div className="bg-black/30 border border-white/10 rounded-xl p-3.5 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-white/60">
                      <span>Método de Pago:</span>
                      <span className="font-bold text-[#D9C4AB] uppercase">
                        {selectedWebOrderForModal.paymentMethod || selectedWebOrderForModal.payment_type || 'Pasarela Bold.co'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-white/60">
                      <span>Origen de Venta:</span>
                      <span className="text-emerald-400 font-bold uppercase">Tienda Web Oficial (urbannoise.co)</span>
                    </div>
                    <div className="border-t border-white/10 pt-2 flex items-center justify-between text-sm">
                      <span className="font-bold text-white uppercase">Total Pagado:</span>
                      <span className="font-mono font-black text-lg text-[#F5F2E4]">
                        {formatCOP(selectedWebOrderForModal.total_money || selectedWebOrderForModal.totals?.total || selectedWebOrderForModal.amount || 0)}
                      </span>
                    </div>
                  </div>

                  {/* Fila 5: Selector de Transportadora y Asignación de Guía */}
                  <div className="bg-gradient-to-r from-black/60 to-black/40 border border-emerald-500/30 rounded-xl p-4 space-y-3 text-xs shadow-inner">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-emerald-400" />
                        <span className="font-bold uppercase text-xs text-white">
                          Gestión de Despacho & Guía de Envío
                        </span>
                      </div>
                      {activeTracking ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Enviado / Despachado con {activeCarrier} (#{activeTracking})</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          En Preparación (Pendiente de Guía)
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                      <div className="sm:col-span-5">
                        <label className="block text-[10.5px] uppercase font-bold text-white/60 mb-1">
                          Empresa Transportadora:
                        </label>
                        <select
                          id="modal-carrier-select"
                          defaultValue={activeCarrier}
                          className="w-full px-3 py-2 text-xs bg-black/80 border border-white/20 focus:border-[#D9C4AB] rounded-lg text-white font-bold focus:outline-none cursor-pointer"
                        >
                          {CARRIER_OPTIONS.map((c) => (
                            <option key={c.id} value={c.id} className="bg-[#14151D] text-white">
                              {c.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="sm:col-span-4">
                        <label className="block text-[10.5px] uppercase font-bold text-white/60 mb-1">
                          Número de Guía Oficial:
                        </label>
                        <input
                          type="text"
                          defaultValue={activeTracking}
                          id="modal-guia-input"
                          placeholder="Ej. 984521092"
                          className="w-full px-3 py-2 text-xs bg-black/80 border border-white/20 focus:border-[#D9C4AB] rounded-lg text-white font-mono placeholder-white/30 focus:outline-none"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <button
                          type="button"
                          onClick={async () => {
                            const inputEl = document.getElementById('modal-guia-input') as HTMLInputElement;
                            const selectEl = document.getElementById('modal-carrier-select') as HTMLSelectElement;
                            const guiaVal = inputEl?.value?.trim() || '';
                            const carrierVal = selectEl?.value?.trim() || 'Servientrega';
                            setIsSavingTracking(true);
                            try {
                              await handleSaveOrderTracking(
                                selectedWebOrderForModal.orderId || selectedWebOrderForModal.id,
                                buyerEmail,
                                guiaVal,
                                carrierVal,
                                foundCust?.id || custId
                              );
                              setSelectedWebOrderForModal((prev: any) => ({
                                ...prev,
                                trackingNumber: guiaVal || undefined,
                                trackingCompany: carrierVal,
                                status: guiaVal ? 'ENVIADO' : 'EN_PREPARACION',
                                statusLabel: guiaVal ? `Enviado con ${carrierVal}` : 'En Preparación',
                              }));
                            } finally {
                              setIsSavingTracking(false);
                            }
                          }}
                          disabled={isSavingTracking}
                          className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition cursor-pointer disabled:opacity-50 shadow-md flex items-center justify-center gap-1.5"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>{isSavingTracking ? 'Guardando...' : 'Guardar Guía'}</span>
                        </button>
                      </div>
                    </div>

                    {activeTracking && (
                      <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-white/60">Enlace directo para rastreo:</span>
                          <a
                            href={carrierTrackUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-400 hover:text-emerald-300 font-bold underline inline-flex items-center gap-1"
                          >
                            <span>Abrir Portal Oficial {activeCarrier}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                        {(!activeCarrier || activeCarrier.toLowerCase().includes('servientrega')) && (
                          <button
                            type="button"
                            onClick={() => setTrackingAdminGuia(activeTracking)}
                            className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-[#D9C4AB] rounded text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Ver Rastreo en Ventana Flotante</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </>
              );
            })()}

            {/* Botón de Cierre */}
            <div className="flex items-center justify-end pt-1">
              <button
                type="button"
                onClick={() => setSelectedWebOrderForModal(null)}
                className="px-5 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase rounded-lg transition cursor-pointer"
              >
                Cerrar Detalle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Lightbox de Foto de Prenda Ampliada */}
      {previewGarmentImage && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#14151D] border border-white/20 rounded-2xl max-w-md w-full overflow-hidden text-white shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="relative aspect-square bg-black flex items-center justify-center overflow-hidden">
              <img
                src={previewGarmentImage.image}
                alt={previewGarmentImage.name}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => setPreviewGarmentImage(null)}
                className="absolute top-3 right-3 bg-black/70 hover:bg-black text-white p-2 rounded-full backdrop-blur-sm transition cursor-pointer"
                title="Cerrar visor"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#D9C4AB]">
                  PRENDA VENDIDA • ARCHIVO OFICIAL
                </span>
                <h3 className="text-base sm:text-lg font-black uppercase text-[#F5F2E4] mt-1">
                  {previewGarmentImage.name}
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                {previewGarmentImage.size && (
                  <span className="bg-white/10 text-white font-mono font-bold px-2.5 py-1 rounded">
                    Talla {previewGarmentImage.size}
                  </span>
                )}
                {previewGarmentImage.price && (
                  <span className="bg-[#D9C4AB] text-[#101013] font-mono font-black px-2.5 py-1 rounded">
                    {formatCOP(previewGarmentImage.price)}
                  </span>
                )}
                {previewGarmentImage.sku && previewGarmentImage.sku !== 'N/A' && (
                  <span className="text-white/40 font-mono text-[11px]">
                    SKU: {previewGarmentImage.sku}
                  </span>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setPreviewGarmentImage(null)}
                  className="px-5 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase rounded-lg transition cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Visor de Rastreo Oficial Servientrega Integrado */}
      <ServientregaTrackingModal
        isOpen={Boolean(trackingAdminGuia)}
        onClose={() => setTrackingAdminGuia(null)}
        trackingNumber={trackingAdminGuia || ''}
      />

    </div>
  );
};

// Ícono auxiliar de llave
function KeyIcon() {
  return (
    <svg className="w-4 h-4 text-[#D9C4AB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
    </svg>
  );
}
