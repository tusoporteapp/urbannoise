import React, { useState, useMemo } from 'react';
import {
  X,
  FileText,
  ShieldCheck,
  Truck,
  RotateCcw,
  Scale,
  Lock,
  Cookie,
  HelpCircle,
  Search,
  Printer,
  Copy,
  Check,
  Send,
  ExternalLink,
  AlertCircle,
  Building2,
  Phone,
  Mail,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { LEGAL_POLICIES, PolicySection } from '../data/legalPolicies';

interface LegalPoliciesModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: string;
}

interface SubmittedPQRS {
  radicado: string;
  type: string;
  fullName: string;
  documentId: string;
  email: string;
  phone: string;
  orderNumber?: string;
  details: string;
  date: string;
  status: string;
}

export const LegalPoliciesModal: React.FC<LegalPoliciesModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'terminos',
}) => {
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  // Formulario Interactivo PQRS
  const [pqrsType, setPqrsType] = useState('Reclamo / Garantía');
  const [pqrsName, setPqrsName] = useState('');
  const [pqrsDoc, setPqrsDoc] = useState('');
  const [pqrsEmail, setPqrsEmail] = useState('');
  const [pqrsPhone, setPqrsPhone] = useState('');
  const [pqrsOrder, setPqrsOrder] = useState('');
  const [pqrsMessage, setPqrsMessage] = useState('');
  const [pqrsHoneypot, setPqrsHoneypot] = useState('');
  const [lastSubmitTime, setLastSubmitTime] = useState<number>(0);
  const [lastSubmittedTicket, setLastSubmittedTicket] = useState<SubmittedPQRS | null>(null);

  // Historial de radicados en el navegador
  const [savedTickets, setSavedTickets] = useState<SubmittedPQRS[]>(() => {
    try {
      const saved = localStorage.getItem('urbannoise_pqrs_list');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Sincronizar tab si cambia desde prop
  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  if (!isOpen) return null;

  const currentPolicy = LEGAL_POLICIES.find((p) => p.id === activeTab) || LEGAL_POLICIES[0];

  const handleCopyText = () => {
    const text = `${currentPolicy.title}\nURBANNOISE S.A.S. - NIT 901.847.239-1\nÚltima actualización: ${currentPolicy.lastUpdated}\n\n${currentPolicy.content
      .map(
        (c) =>
          `${c.heading}\n${c.paragraphs.join('\n')}${
            c.bullets ? '\n• ' + c.bullets.join('\n• ') : ''
          }`
      )
      .join('\n\n')}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSubmitPQRS = (e: React.FormEvent) => {
    e.preventDefault();
    // Protección Anti-Spam: Si el bot llenó el campo trampa oculto o envía en ráfaga
    if (pqrsHoneypot.trim().length > 0) {
      console.warn('Bot submission blocked');
      return;
    }
    const now = Date.now();
    if (now - lastSubmitTime < 2000) {
      return;
    }
    setLastSubmitTime(now);

    if (!pqrsName.trim() || !pqrsEmail.trim() || !pqrsMessage.trim()) return;

    const radicadoNum = `PQRS-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const newTicket: SubmittedPQRS = {
      radicado: radicadoNum,
      type: pqrsType,
      fullName: pqrsName.trim(),
      documentId: pqrsDoc.trim(),
      email: pqrsEmail.trim(),
      phone: pqrsPhone.trim(),
      orderNumber: pqrsOrder.trim(),
      details: pqrsMessage.trim(),
      date: new Date().toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      status: 'RADICADO - EN REVISIÓN LEGAL',
    };

    const updated = [newTicket, ...savedTickets];
    setSavedTickets(updated);
    try {
      localStorage.setItem('urbannoise_pqrs_list', JSON.stringify(updated));
    } catch {
      // ignore
    }

    setLastSubmittedTicket(newTicket);
    setPqrsMessage('');
    setPqrsOrder('');
  };

  const getTabIcon = (iconName: string) => {
    switch (iconName) {
      case 'Building2':
        return <Building2 className="w-4 h-4" />;
      case 'FileText':
        return <FileText className="w-4 h-4" />;
      case 'ShieldCheck':
        return <ShieldCheck className="w-4 h-4" />;
      case 'Truck':
        return <Truck className="w-4 h-4" />;
      case 'RotateCcw':
        return <RotateCcw className="w-4 h-4" />;
      case 'Scale':
        return <Scale className="w-4 h-4" />;
      case 'Lock':
        return <Lock className="w-4 h-4" />;
      case 'Cookie':
        return <Cookie className="w-4 h-4" />;
      case 'HelpCircle':
        return <HelpCircle className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  // Filtrado de políticas por búsqueda
  const filteredPolicies = LEGAL_POLICIES.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const inTitle = p.title.toLowerCase().includes(q) || p.shortTitle.toLowerCase().includes(q);
    const inSummary = p.summary.toLowerCase().includes(q);
    const inContent = p.content.some(
      (c) =>
        c.heading.toLowerCase().includes(q) ||
        c.paragraphs.some((pr) => pr.toLowerCase().includes(q)) ||
        (c.bullets && c.bullets.some((b) => b.toLowerCase().includes(q)))
    );
    return inTitle || inSummary || inContent;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#101013] text-[#F5F2E4] border border-white/15 w-full max-w-5xl h-[92vh] max-h-[860px] rounded-lg shadow-2xl flex flex-col overflow-hidden">
        {/* Cabecera Principal del Modal */}
        <header className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-black/40 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded bg-[#F5F2E4] text-[#101013] flex items-center justify-center font-black text-sm">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-sm sm:text-base uppercase tracking-tight text-[#F5F2E4]">
                  CENTRO LEGAL Y POLÍTICAS OFICIALES
                </h3>
                <span className="hidden sm:inline-block bg-[#002D62] text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                  COLOMBIA • LEY 1480 / 1581
                </span>
              </div>
              <p className="text-[11px] text-white/60">
                URBANNOISE S.A.S. • NIT 901.847.239-1 • Tienda Oficial Bogotá & Despacho Nacional
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              title="Imprimir documento"
              className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 text-xs bg-white/10 hover:bg-white/20 text-white rounded transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir</span>
            </button>
            <button
              onClick={handleCopyText}
              title="Copiar texto de esta política"
              className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 text-xs bg-white/10 hover:bg-white/20 text-white rounded transition cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado' : 'Copiar'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/10 rounded text-white/70 hover:text-white transition cursor-pointer"
              aria-label="Cerrar modal de políticas"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Barra de Búsqueda y Navegación Móvil Horizontal */}
        <div className="px-4 py-2.5 bg-[#16161A] border-b border-white/10 flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between flex-shrink-0">
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              id="legal-policies-search"
              name="policiesSearch"
              type="text"
              autoComplete="off"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar en políticas (ej. retracto, flete, garantía, datos)..."
              className="w-full bg-white/5 border border-white/15 rounded text-xs pl-8 pr-3 py-1.5 text-white placeholder-white/40 focus:outline-none focus:border-[#D9C4AB]"
            />
          </div>

          <div className="flex items-center space-x-2 text-[11px] text-white/60">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Estatuto del Consumidor (SIC) & Habeas Data Vigentes 2026</span>
          </div>
        </div>

        {/* Menú de pestañas horizontal en pantallas pequeñas */}
        <div className="lg:hidden flex items-center overflow-x-auto px-3 py-2 bg-[#121216] border-b border-white/10 space-x-1.5 flex-shrink-0 scrollbar-none">
          {filteredPolicies.map((policy) => {
            const isActive = activeTab === policy.id;
            return (
              <button
                key={policy.id}
                onClick={() => setActiveTab(policy.id)}
                className={`whitespace-nowrap px-3 py-1.5 rounded text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-[#F5F2E4] text-[#101013]'
                    : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                {getTabIcon(policy.icon)}
                <span>{policy.shortTitle}</span>
              </button>
            );
          })}
        </div>

        {/* Cuerpo Principal: Sidebar Izquierdo + Contenedor de Lectura */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar Izquierdo (Desktop) */}
          <aside className="hidden lg:flex flex-col w-72 bg-[#141418] border-r border-white/10 p-3 space-y-1 overflow-y-auto flex-shrink-0">
            <p className="text-[10px] uppercase font-bold tracking-widest text-[#D9C4AB] px-3 py-2">
              POLÍTICAS Y GARANTÍAS
            </p>

            {filteredPolicies.map((policy) => {
              const isActive = activeTab === policy.id;
              return (
                <button
                  key={policy.id}
                  onClick={() => setActiveTab(policy.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-md transition flex items-start space-x-3 cursor-pointer ${
                    isActive
                      ? 'bg-[#F5F2E4] text-[#101013] shadow-md font-bold'
                      : 'text-white/75 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className={`mt-0.5 ${isActive ? 'text-[#101013]' : 'text-[#D9C4AB]'}`}>
                    {getTabIcon(policy.icon)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs leading-snug truncate">{policy.shortTitle}</div>
                    {policy.badge && (
                      <span
                        className={`inline-block text-[9px] px-1.5 py-0.2 mt-0.5 rounded ${
                          isActive
                            ? 'bg-black/20 text-[#101013]'
                            : 'bg-white/10 text-white/60'
                        }`}
                      >
                        {policy.badge}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}

            {/* Banner de Contacto Legal y SIC */}
            <div className="mt-auto pt-4 border-t border-white/10 p-3 bg-white/5 rounded text-[11px] text-white/70 space-y-2">
              <div className="font-bold text-white flex items-center space-x-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#D9C4AB]" />
                <span>URBANNOISE Flagship</span>
              </div>
              <p className="text-[10px]">Centro Comercial El GranSan, Local 23-54, Bogotá</p>
              <div className="space-y-1 pt-1 text-[10.5px]">
                <a
                  href="https://wa.me/573108720491"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center space-x-1.5 text-emerald-400 hover:underline"
                >
                  <Phone className="w-3 h-3" />
                  <span>WhatsApp: (+57) 310 872 0491</span>
                </a>
                <a
                  href="mailto:urban.noice2023@gmail.com"
                  className="flex items-center space-x-1.5 text-[#D9C4AB] hover:underline"
                >
                  <Mail className="w-3 h-3" />
                  <span>urban.noice2023@gmail.com</span>
                </a>
              </div>
            </div>
          </aside>

          {/* Área de Visualización y Contenido de Política */}
          <main className="flex-1 bg-[#101013] p-4 sm:p-8 overflow-y-auto overscroll-contain print:p-0 print:bg-white print:text-black">
            <div className="max-w-3xl mx-auto space-y-6">
              {/* Encabezado del Documento */}
              <div className="pb-5 border-b border-white/15">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] uppercase tracking-widest text-[#D9C4AB] font-bold">
                    DOCUMENTO OFICIAL Y VINCULANTE
                  </span>
                  <div className="flex items-center space-x-2 text-[11px] text-white/50">
                    <Calendar className="w-3 h-3" />
                    <span>Actualizado: {currentPolicy.lastUpdated}</span>
                  </div>
                </div>

                <h1 className="text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-tight text-[#F5F2E4]">
                  {currentPolicy.title}
                </h1>

                <p className="text-xs sm:text-sm text-white/70 mt-2 leading-relaxed bg-white/5 p-3.5 rounded border border-white/10">
                  {currentPolicy.summary}
                </p>
              </div>

              {/* Si estamos en la pestaña de PQRS, agregamos el formulario interactivo para radicar solicitudes */}
              {activeTab === 'pqrs' && (
                <div className="bg-[#18181D] border border-white/15 rounded-lg p-4 sm:p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-extrabold text-sm sm:text-base uppercase text-[#F5F2E4] flex items-center space-x-2">
                        <HelpCircle className="w-4 h-4 text-[#D9C4AB]" />
                        <span>Radicación en Línea de PQRS</span>
                      </h3>
                      <p className="text-[11px] text-white/60">
                        Genera tu número de radicado oficial con garantía legal de respuesta en 15 días hábiles.
                      </p>
                    </div>
                    <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded">
                      Canal Directo SIC
                    </span>
                  </div>

                  {lastSubmittedTicket ? (
                    <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-lg space-y-2.5">
                      <div className="flex items-center space-x-2 text-emerald-400 font-extrabold text-sm">
                        <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                        <span>¡SOLICITUD RADICADA EXITOSAMENTE!</span>
                      </div>
                      <p className="text-xs text-emerald-200">
                        Tu número de radicado oficial es:{' '}
                        <strong className="text-white font-mono bg-black/60 px-2 py-1 rounded text-sm">
                          {lastSubmittedTicket.radicado}
                        </strong>
                      </p>
                      <p className="text-[11px] text-emerald-300/80">
                        Hemos registrado tu solicitud tipo <strong>{lastSubmittedTicket.type}</strong> a nombre de{' '}
                        <strong>{lastSubmittedTicket.fullName}</strong>. El equipo jurídico y de servicio de URBANNOISE emitirá
                        respuesta formal a tu correo <u>{lastSubmittedTicket.email}</u> dentro de los próximos 15 días hábiles.
                      </p>
                      <button
                        type="button"
                        onClick={() => setLastSubmittedTicket(null)}
                        className="mt-2 text-xs bg-emerald-700 hover:bg-emerald-600 text-white font-bold px-3 py-1.5 rounded transition cursor-pointer"
                      >
                        Radicar otra solicitud
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmitPQRS} className="space-y-3.5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label htmlFor="pqrs-type" className="block text-[10.5px] uppercase font-bold text-white/70 mb-1">
                            Tipo de Solicitud *
                          </label>
                          <select
                            id="pqrs-type"
                            name="pqrsType"
                            value={pqrsType}
                            onChange={(e) => setPqrsType(e.target.value)}
                            className="w-full bg-black/60 border border-white/20 rounded text-xs px-3 py-2 text-white focus:outline-none focus:border-[#D9C4AB]"
                          >
                            <option value="Reclamo / Garantía">Reclamo / Garantía de Prenda</option>
                            <option value="Derecho de Retracto (Art. 47)">Ejercicio de Derecho de Retracto</option>
                            <option value="Cambio de Talla o Color">Cambio de Talla o Color</option>
                            <option value="Petición / Consulta">Petición / Consulta General</option>
                            <option value="Queja de Servicio o Despacho">Queja de Servicio o Despacho</option>
                            <option value="Habeas Data (Ley 1581)">Actualización / Supresión de Datos</option>
                            <option value="Sugerencia">Sugerencia</option>
                          </select>
                        </div>

                        <div>
                          <label htmlFor="pqrs-name" className="block text-[10.5px] uppercase font-bold text-white/70 mb-1">
                            Nombre y Apellidos Completos *
                          </label>
                          <input
                            id="pqrs-name"
                            name="fullName"
                            type="text"
                            autoComplete="name"
                            required
                            value={pqrsName}
                            onChange={(e) => setPqrsName(e.target.value)}
                            placeholder="Ej. Andrés Camilo Rojas"
                            className="w-full bg-black/60 border border-white/20 rounded text-xs px-3 py-2 text-white focus:outline-none focus:border-[#D9C4AB]"
                          />
                        </div>

                        <div>
                          <label htmlFor="pqrs-doc" className="block text-[10.5px] uppercase font-bold text-white/70 mb-1">
                            Documento de Identidad (Cédula / NIT) *
                          </label>
                          <input
                            id="pqrs-doc"
                            name="documentId"
                            type="text"
                            required
                            value={pqrsDoc}
                            onChange={(e) => setPqrsDoc(e.target.value)}
                            placeholder="Ej. 1.020.345.678"
                            className="w-full bg-black/60 border border-white/20 rounded text-xs px-3 py-2 text-white focus:outline-none focus:border-[#D9C4AB]"
                          />
                        </div>

                        <div>
                          <label htmlFor="pqrs-email" className="block text-[10.5px] uppercase font-bold text-white/70 mb-1">
                            Correo Electrónico para Notificaciones *
                          </label>
                          <input
                            id="pqrs-email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={pqrsEmail}
                            onChange={(e) => setPqrsEmail(e.target.value)}
                            placeholder="correo@ejemplo.com"
                            className="w-full bg-black/60 border border-white/20 rounded text-xs px-3 py-2 text-white focus:outline-none focus:border-[#D9C4AB]"
                          />
                        </div>

                        <div>
                          <label htmlFor="pqrs-phone" className="block text-[10.5px] uppercase font-bold text-white/70 mb-1">
                            Teléfono Celular / WhatsApp *
                          </label>
                          <input
                            id="pqrs-phone"
                            name="phone"
                            type="tel"
                            autoComplete="tel"
                            required
                            value={pqrsPhone}
                            onChange={(e) => setPqrsPhone(e.target.value)}
                            placeholder="310 872 0491"
                            className="w-full bg-black/60 border border-white/20 rounded text-xs px-3 py-2 text-white focus:outline-none focus:border-[#D9C4AB]"
                          />
                        </div>

                        <div>
                          <label htmlFor="pqrs-order" className="block text-[10.5px] uppercase font-bold text-white/70 mb-1">
                            Número de Pedido / Recibo de Compra (Opcional)
                          </label>
                          <input
                            id="pqrs-order"
                            name="orderNumber"
                            type="text"
                            value={pqrsOrder}
                            onChange={(e) => setPqrsOrder(e.target.value)}
                            placeholder="Ej. UN-2026-9482 o REC-1024"
                            className="w-full bg-black/60 border border-white/20 rounded text-xs px-3 py-2 text-white focus:outline-none focus:border-[#D9C4AB]"
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="pqrs-message" className="block text-[10.5px] uppercase font-bold text-white/70 mb-1">
                          Descripción Detallada de los Hechos y Pretensión *
                        </label>
                        <textarea
                          id="pqrs-message"
                          name="message"
                          required
                          rows={3}
                          value={pqrsMessage}
                          onChange={(e) => setPqrsMessage(e.target.value)}
                          placeholder="Explica detalladamente la situación, el estado de la prenda o la solicitud concreta..."
                          className="w-full bg-black/60 border border-white/20 rounded text-xs px-3 py-2 text-white focus:outline-none focus:border-[#D9C4AB]"
                        ></textarea>
                      </div>

                      {/* Campo Trampa Anti-Spam (Honeypot) */}
                      <input
                        id="pqrs-trap"
                        type="text"
                        name="_city_website_trap"
                        tabIndex={-1}
                        autoComplete="off"
                        value={pqrsHoneypot}
                        onChange={(e) => setPqrsHoneypot(e.target.value)}
                        className="hidden opacity-0 pointer-events-none absolute -left-[9999px]"
                        aria-hidden="true"
                      />

                      <div className="flex items-center justify-between pt-1">
                        <div className="text-[10px] text-white/50">
                          Al radicar aceptas la Política de Tratamiento de Datos (Ley 1581 de 2012).
                        </div>
                        <button
                          type="submit"
                          className="bg-[#F5F2E4] text-[#101013] hover:bg-[#D9C4AB] font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded transition flex items-center space-x-2 cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>RADICAR SOLICITUD</span>
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Historial de radicados previos guardados */}
                  {savedTickets.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <h4 className="text-xs font-bold text-[#D9C4AB] uppercase mb-2">
                        Tus Solicitudes Radicadas Recientemente ({savedTickets.length})
                      </h4>
                      <div className="space-y-2 max-h-36 overflow-y-auto">
                        {savedTickets.map((t) => (
                          <div
                            key={t.radicado}
                            className="bg-black/40 border border-white/10 p-2.5 rounded text-[11px] flex items-center justify-between"
                          >
                            <div>
                              <span className="font-mono font-bold text-white mr-2">{t.radicado}</span>
                              <span className="text-white/60">({t.type})</span>
                              <p className="text-[10px] text-white/40 mt-0.5">{t.date}</p>
                            </div>
                            <span className="bg-emerald-500/20 text-emerald-400 text-[9px] font-bold px-2 py-0.5 rounded">
                              {t.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Secciones del Documento */}
              <div className="space-y-6 divide-y divide-white/10 text-xs sm:text-sm text-white/85">
                {currentPolicy.content.map((sec, idx) => (
                  <article key={idx} className={idx > 0 ? 'pt-6' : ''}>
                    <h2 className="text-sm sm:text-base font-bold text-white uppercase tracking-wide mb-3 text-[#F5F2E4] flex items-center space-x-2">
                      <span className="w-1.5 h-4 bg-[#D9C4AB] inline-block mr-1"></span>
                      <span>{sec.heading}</span>
                    </h2>

                    <div className="space-y-2.5 leading-relaxed text-white/80">
                      {sec.paragraphs.map((p, pIdx) => (
                        <p key={pIdx}>{p}</p>
                      ))}

                      {sec.bullets && sec.bullets.length > 0 && (
                        <ul className="list-disc list-inside space-y-1.5 pl-2 text-white/75 bg-white/5 p-3 rounded border border-white/5 my-2">
                          {sec.bullets.map((b, bIdx) => (
                            <li key={bIdx} className="leading-snug">
                              {b}
                            </li>
                          ))}
                        </ul>
                      )}

                      {sec.highlight && (
                        <div className="bg-[#D9C4AB]/10 border-l-2 border-[#D9C4AB] p-2.5 text-xs text-[#D9C4AB]">
                          {sec.highlight}
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>

              {/* Pie de Página del Documento Legal con sellos de garantía */}
              <div className="pt-8 border-t border-white/15 space-y-4">
                <div className="bg-white/5 p-4 rounded-lg border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <div>
                    <h5 className="font-extrabold uppercase text-white tracking-wide">
                      ¿Tienes alguna duda sobre tus derechos como consumidor?
                    </h5>
                    <p className="text-[11px] text-white/60">
                      Atención directa y radicación con asesor legal vía WhatsApp o en el CC El GranSan.
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <a
                      href="https://wa.me/573108720491?text=Hola%20URBANNOISE,%20tengo%20una%20consulta%20sobre%20las%20pol%C3%ADticas%20y%20garant%C3%ADas"
                      target="_blank"
                      rel="noreferrer"
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded text-xs flex items-center space-x-1.5 transition"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>WhatsApp Legal</span>
                    </a>
                    <a
                      href="https://www.sic.gov.co"
                      target="_blank"
                      rel="noreferrer"
                      className="border border-white/20 hover:bg-white/10 text-white font-bold px-3 py-2 rounded text-xs flex items-center space-x-1.5 transition"
                    >
                      <span>Portal SIC</span>
                      <ExternalLink className="w-3 h-3 text-white/60" />
                    </a>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between text-[10px] text-white/40 pt-2">
                  <p>© 2026 URBANNOISE S.A.S. • NIT 901.847.239-1 • Bogotá D.C., Colombia.</p>
                  <p className="font-mono">SUPERINTENDENCIA DE INDUSTRIA Y COMERCIO - LEY 1480 DE 2011</p>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};
