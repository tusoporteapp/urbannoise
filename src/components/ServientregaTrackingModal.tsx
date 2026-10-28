import React, { useState } from 'react';
import { X, ExternalLink, Copy, Check, Truck, RefreshCw, AlertCircle, ShieldCheck } from 'lucide-react';

interface ServientregaTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  trackingNumber: string;
  orderNumber?: string;
}

export const ServientregaTrackingModal: React.FC<ServientregaTrackingModalProps> = ({
  isOpen,
  onClose,
  trackingNumber,
  orderNumber,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [iframeKey, setIframeKey] = useState<number>(1);

  if (!isOpen || !trackingNumber) return null;

  const cleanGuia = trackingNumber.trim();
  const servientregaEmbedUrl = `https://mobile.servientrega.com/WebSitePortal/RastreoEnvioDetalle.html?guia=${encodeURIComponent(
    cleanGuia
  )}`;
  const servientregaPublicPortalUrl = `https://www.servientrega.com/wps/portal/rastreo-envio`;

  const handleCopy = () => {
    navigator.clipboard?.writeText(cleanGuia);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReload = () => {
    setIsLoading(true);
    setIframeKey((prev) => prev + 1);
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in font-sans">
      <div
        className="relative w-full max-w-4xl h-[92vh] sm:h-[88vh] bg-[#12131A] text-white rounded-2xl border border-white/20 shadow-2xl flex flex-col overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Rastreo oficial de envío nacional"
      >
        {/* TOP BAR / ENCABEZADO */}
        <div className="px-4 sm:px-6 py-3.5 bg-[#181924] border-b border-white/10 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center text-emerald-400 flex-shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                  Rastreo Oficial de Envío Nacional
                </span>
                <span className="inline-flex items-center space-x-1 bg-white/10 text-white/80 text-[9px] font-bold px-1.5 py-0.2 rounded">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>En Vivo</span>
                </span>
              </div>
              <div className="flex items-center space-x-2 text-sm sm:text-base font-extrabold uppercase tracking-tight text-[#F5F2E4]">
                <span>Guía #{cleanGuia}</span>
                {orderNumber && (
                  <span className="text-white/40 text-xs font-normal">
                    (Pedido {orderNumber})
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ACCIONES DEL ENCABEZADO */}
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            <button
              type="button"
              onClick={handleCopy}
              className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-lg transition flex items-center space-x-1.5 cursor-pointer"
              title="Copiar número de guía"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[11px] text-emerald-400 font-bold hidden sm:inline">¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span className="text-[11px] hidden sm:inline">Copiar</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleReload}
              className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition cursor-pointer"
              title="Recargar estado del envío"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
            </button>

            <a
              href={servientregaEmbedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-white/70 hover:text-[#D9C4AB] hover:bg-white/10 rounded-lg transition cursor-pointer"
              title="Abrir en portal web de la transportadora"
            >
              <ExternalLink className="w-4 h-4" />
            </a>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition cursor-pointer ml-1"
              title="Cerrar visor"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ÁREA PRINCIPAL CON VISOR OFICIAL EMBEBIDO DE LA TRANSPORTADORA */}
        <div className="relative flex-1 w-full bg-[#FAFAFA] overflow-hidden">
          {isLoading && (
            <div className="absolute inset-0 z-10 bg-[#12131A] flex flex-col items-center justify-center p-6 space-y-3">
              <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-bold uppercase tracking-wider text-[#F5F2E4]">
                Conectando con transportadora nacional...
              </p>
              <p className="text-[11px] text-white/50 max-w-sm text-center">
                Consultando la guía oficial <strong className="text-white font-mono">{cleanGuia}</strong> en tiempo real.
              </p>
            </div>
          )}

          <iframe
            key={iframeKey}
            src={servientregaEmbedUrl}
            title={`Rastreo de guía oficial ${cleanGuia}`}
            className="w-full h-full border-0 bg-white"
            onLoad={() => setIsLoading(false)}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        </div>

        {/* PIE DE PÁGINA / AYUDA DIRECTA */}
        <div className="px-4 sm:px-6 py-2.5 bg-[#181924] border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-white/60 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              Visor integrado de despacho nacional • URBANNOISE Atelier Bogotá
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <a
              href={`https://wa.me/573108720491?text=${encodeURIComponent(
                `Hola URBANNOISE, tengo una duda sobre el rastreo de mi guía #${cleanGuia}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#D9C4AB] hover:underline font-bold"
            >
              ¿Dudas con tu entrega? Escríbenos a WhatsApp
            </a>
            <span className="text-white/20">•</span>
            <a
              href={servientregaPublicPortalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/80 hover:text-white hover:underline flex items-center space-x-1"
            >
              <span>Portal transportadora</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
