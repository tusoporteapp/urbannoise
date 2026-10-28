import React, { useState, useEffect } from 'react';
import { ShieldCheck, Scale, FileText, Truck, RotateCcw, Lock, Cookie, HelpCircle, Building2, MapPin, ExternalLink, Instagram } from 'lucide-react';
import { getStoredSiteContent } from '../lib/siteContent';
import { SocialLinksConfig, FlagshipContent } from '../types';

interface FooterProps {
  onNotify: (msg: string) => void;
  onOpenPolicies?: (tabId: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNotify, onOpenPolicies }) => {
  const [email, setEmail] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [lastSubmit, setLastSubmit] = useState<number>(0);
  const [siteConfig, setSiteConfig] = useState(() => getStoredSiteContent());

  useEffect(() => {
    const handler = (e: any) => {
      if (e.detail) {
        setSiteConfig(getStoredSiteContent());
      }
    };
    window.addEventListener('urbannoise_site_content_updated', handler);
    return () => window.removeEventListener('urbannoise_site_content_updated', handler);
  }, []);

  const social = siteConfig.social || {};
  const flagship = siteConfig.flagship || {};
  const whatsappNum = flagship.whatsappNumber || '(+57) 310 872 0491';
  const cleanPhone = whatsappNum.replace(/\D/g, '');
  const supportEmail = social.supportEmail || 'urban.noice2023@gmail.com';
  const copyright = social.copyrightNotice || '© 2026 URBANNOISE • Bogotá D.C., Colombia • Todos los derechos reservados.';
  const storeAddress = flagship.address || 'Cra 10 # 9-37 Local 23-54, Centro Comercial El GranSan, Bogotá';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (honeypot.trim().length > 0) return; // Anti-Spam bot trap
    const now = Date.now();
    if (now - lastSubmit < 2000) return;
    setLastSubmit(now);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      onNotify('Por favor ingresa un correo electrónico válido.');
      return;
    }

    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, source: 'footer_club' }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.success) {
        onNotify('¡Bienvenido al Club URBANNOISE! Registrado para novedades y lanzamientos.');
      } else {
        onNotify(data.message || '¡Gracias! Ya estabas registrado en el Club URBANNOISE.');
      }
    } catch {
      onNotify('¡Bienvenido al Club URBANNOISE! Registrado exitosamente.');
    }
    setEmail('');
  };

  const handleOpenPolicy = (tabId: string) => {
    if (onOpenPolicies) {
      onOpenPolicies(tabId);
    } else {
      onNotify('Abriendo información legal...');
    }
  };

  return (
    <footer className="snap-section w-full min-h-screen sm:h-screen h-[100dvh] bg-[#101013] text-[#F5F2E4] pt-20 sm:pt-24 pb-8 border-t border-white/10 flex flex-col justify-center overflow-y-auto lg:overflow-hidden">
      <div className="max-w-[1720px] mx-auto px-4 sm:px-8 w-full my-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 sm:gap-8 lg:gap-8 pb-8 sm:pb-10 border-b border-white/15">
          {/* Columna 1: Newsletter con Anti-Spam */}
          <div className="lg:col-span-2">
            <h5 className="text-xs uppercase tracking-[0.25em] text-[#D9C4AB] font-bold mb-3">
              ÚNETE AL CLUB URBANNOISE
            </h5>
            <h4 className="font-extrabold text-2xl uppercase tracking-tight mb-4 text-[#F5F2E4]">
              RECIBE DROPS Y BENEFICIOS
            </h4>
            <p className="text-xs text-white/80 mb-5 max-w-sm font-normal leading-relaxed">
              Suscríbete para acceder primero a las ediciones limitadas, preventas exclusivas y lanzamientos semanales en Bogotá.
            </p>
            <form onSubmit={handleSubmit} className="flex max-w-md relative">
              <input
                id="footer-newsletter-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Tu correo electrónico..."
                className="bg-white/10 border border-white/20 text-white text-xs px-4 py-3.5 flex-1 focus:outline-none focus:border-white tracking-wider placeholder-white/50"
              />
              {/* Trampa Anti-Spam Honeypot */}
              <input
                id="footer-newsletter-trap"
                type="text"
                name="_sub_trap"
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                className="hidden opacity-0 pointer-events-none absolute -left-[9999px]"
                aria-hidden="true"
              />
              <button
                type="submit"
                className="bg-[#F5F2E4] text-[#101013] px-6 py-3.5 text-xs font-bold uppercase tracking-widest hover:bg-[#D9C4AB] transition cursor-pointer flex-shrink-0"
              >
                SUSCRIBIRSE
              </button>
            </form>

            <div className="mt-4 flex flex-wrap gap-2 text-[10.5px] text-white/70">
              <span className="flex items-center space-x-1">
                <ShieldCheck className="w-3 h-3 text-[#D9C4AB]" />
                <span>Datos protegidos Ley 1581 / RGPD</span>
              </span>
              <span>•</span>
              <span>Sin spam, cancela cuando quieras</span>
            </div>
          </div>

          {/* Columna 2: Ayuda y Envíos */}
          <div id="help-faq">
            <h5 className="text-xs uppercase tracking-[0.2em] text-[#D9C4AB] font-bold mb-4">
              COMPRA & ENVÍOS
            </h5>
            <ul className="space-y-2.5 text-xs text-white/85">
              <li>
                <button
                  type="button"
                  onClick={() => handleOpenPolicy('envios')}
                  className="hover:text-white transition text-left cursor-pointer flex items-center space-x-1.5"
                >
                  <Truck className="w-3.5 h-3.5 text-[#D9C4AB]" />
                  <span>Envíos Nacionales y Tiempos</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleOpenPolicy('pagos-bold')}
                  className="hover:text-white transition text-left cursor-pointer flex items-center space-x-1.5"
                >
                  <Lock className="w-3.5 h-3.5 text-[#D9C4AB]" />
                  <span>Métodos de Pago y Seguridad</span>
                </button>
              </li>
              <li>
                <a href="#brand-manifesto" className="hover:text-white transition block">
                  ¿Quiénes somos? (Manifiesto)
                </a>
              </li>
              <li>
                <a href="#flagship" className="hover:text-white transition block">
                  Flagship Store El GranSan
                </a>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNotify('Guía de Tallas: Siluetas Boxy Fit Oversize en S, M, L y XL con medidas de busto y largo')}
                  className="hover:text-white transition text-left cursor-pointer"
                >
                  Guía de Tallas Boxy Fit
                </button>
              </li>
            </ul>
          </div>

          {/* Columna 3: Legales y Estatuto del Consumidor SIC */}
          <div>
            <h5 className="text-xs uppercase tracking-[0.2em] text-[#D9C4AB] font-bold mb-4 flex items-center space-x-1.5">
              <Scale className="w-3.5 h-3.5" />
              <span>LEGALES Y POLÍTICAS (SIC)</span>
            </h5>
            <ul className="space-y-2.5 text-xs text-white/85">
              <li>
                <button
                  type="button"
                  onClick={() => handleOpenPolicy('aviso-legal')}
                  className="hover:text-white transition text-left cursor-pointer flex items-center space-x-1.5 font-bold text-emerald-300"
                >
                  <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Aviso Legal Internacional</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleOpenPolicy('terminos')}
                  className="hover:text-white transition text-left cursor-pointer flex items-center space-x-1.5"
                >
                  <FileText className="w-3.5 h-3.5 text-white/70" />
                  <span>Términos y Condiciones</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleOpenPolicy('datos')}
                  className="hover:text-white transition text-left cursor-pointer flex items-center space-x-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#D9C4AB]" />
                  <span>Privacidad (Habeas Data / RGPD)</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleOpenPolicy('cambios-garantias')}
                  className="hover:text-white transition text-left cursor-pointer flex items-center space-x-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-white/70" />
                  <span>Cambios y Garantías (60 Días)</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleOpenPolicy('retracto')}
                  className="hover:text-white transition text-left cursor-pointer flex items-center space-x-1.5 text-amber-200 hover:text-white"
                >
                  <Scale className="w-3.5 h-3.5 text-amber-300" />
                  <span>Derecho de Retracto (Art. 47)</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleOpenPolicy('cookies')}
                  className="hover:text-white transition text-left cursor-pointer flex items-center space-x-1.5"
                >
                  <Cookie className="w-3.5 h-3.5 text-white/70" />
                  <span>Política de Cookies</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleOpenPolicy('pqrs')}
                  className="hover:text-white transition text-left cursor-pointer flex items-center space-x-1.5 font-bold text-emerald-400 hover:text-emerald-300"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Radicar P.Q.R.S. Oficial</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Columna 4: Flagship Store & Ficha de Google */}
          <div>
            <h5 className="text-xs uppercase tracking-[0.2em] text-[#D9C4AB] font-bold mb-4">
              FICHA LOCAL GOOGLE & SEDE
            </h5>
            <div className="text-xs text-white/85 space-y-2">
              <div className="p-2.5 bg-white/5 border border-white/10 rounded-lg space-y-1">
                <div className="flex items-center space-x-1.5 text-emerald-400 font-bold text-[11px]">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Ficha Verificada en Google Maps</span>
                </div>
                <p className="font-bold text-white">{storeAddress}</p>
                <p className="text-[10px] text-[#D9C4AB] pt-0.5">Lunes a Sábado: 8:00 AM - 6:30 PM</p>
              </div>

              <div className="pt-1 space-y-1">
                <a
                  href={`https://wa.me/${cleanPhone || '573108720491'}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 hover:underline block font-semibold"
                >
                  WhatsApp: {whatsappNum}
                </a>
                <a
                  href={`mailto:${supportEmail}`}
                  className="text-white/80 hover:underline block truncate"
                >
                  Email: {supportEmail}
                </a>

                {/* Enlaces a Redes Sociales Oficiales */}
                <div className="flex items-center space-x-3 pt-2">
                  {social.instagramUrl && (
                    <a
                      href={social.instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white/70 hover:text-white transition text-[11px] font-bold flex items-center space-x-1"
                    >
                      <Instagram className="w-3.5 h-3.5" />
                      <span>Instagram</span>
                    </a>
                  )}
                  {social.tiktokUrl && (
                    <a
                      href={social.tiktokUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white/70 hover:text-white transition text-[11px] font-bold"
                    >
                      TikTok
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sellos Oficiales de Vigilancia Colombiana (SIC Ley 1480), Pasarela Bold.co y DIAN */}
        <div className="pt-6 pb-2 grid grid-cols-2 md:grid-cols-4 gap-3 text-[11px] text-white/80 border-b border-white/10 pb-6">
          <a
            href="https://www.sic.gov.co"
            target="_blank"
            rel="noopener noreferrer"
            title="Superintendencia de Industria y Comercio - Protección al Consumidor (Ley 1480 de 2011)"
            className="flex items-center space-x-2 group hover:text-white transition cursor-pointer"
          >
            <span className="bg-red-700 text-white font-black text-[9px] px-1.5 py-0.5 rounded tracking-wider group-hover:bg-red-600 transition">
              SIC
            </span>
            <span className="text-[10px] group-hover:underline">Superintendencia de Industria y Comercio • Ley 1480 ↗</span>
          </a>

          <a
            href="https://bold.co"
            target="_blank"
            rel="noopener noreferrer"
            title="Pasarela Oficial de Pagos Bold.co - PCI-DSS Nivel 1"
            className="flex items-center space-x-2 group hover:text-white transition cursor-pointer"
          >
            <span className="bg-[#002D62] text-white font-black text-[9px] px-1.5 py-0.5 rounded tracking-wider group-hover:bg-[#003B7E] transition">
              BOLD
            </span>
            <span className="text-[10px] group-hover:underline">Pasarela 100% Segura • Certificación PCI-DSS Nivel 1 ↗</span>
          </a>

          <a
            href={flagship.googleMapsUrl || 'https://www.google.com/maps/search/?api=1&query=Cra+10+%23+9-37+Local+23-54+Bogota+Colombia+El+GranSan'}
            target="_blank"
            rel="noopener noreferrer"
            title="Ubicación oficial en Google Maps"
            className="flex items-center space-x-2 group hover:text-white transition cursor-pointer"
          >
            <span className="bg-emerald-800 text-white font-black text-[9px] px-1.5 py-0.5 rounded tracking-wider group-hover:bg-emerald-700 transition">
              TIENDA
            </span>
            <span className="text-[10px] group-hover:underline">Flagship Store Bogotá • El GranSan Local 23-54 ↗</span>
          </a>

          <a
            href="https://www.dian.gov.co"
            target="_blank"
            rel="noopener noreferrer"
            title="Dirección de Impuestos y Aduanas Nacionales (DIAN)"
            className="flex items-center space-x-2 group hover:text-white transition cursor-pointer"
          >
            <span className="bg-stone-700 text-white font-black text-[9px] px-1.5 py-0.5 rounded tracking-wider group-hover:bg-stone-600 transition">
              DIAN
            </span>
            <span className="text-[10px] group-hover:underline">Facturación en Pesos Colombianos (COP) • IVA Incluido ↗</span>
          </a>
        </div>

        <div className="pt-6 flex flex-col md:flex-row items-center justify-between text-xs text-white/60 space-y-3 md:space-y-0">
          <p>{copyright}</p>
          <div className="flex items-center space-x-3 text-[10px] text-white/70">
            <button
              type="button"
              onClick={() => handleOpenPolicy('aviso-legal')}
              className="hover:text-white underline cursor-pointer"
            >
              Aviso Legal
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => handleOpenPolicy('datos')}
              className="hover:text-white underline cursor-pointer"
            >
              Habeas Data & Privacidad
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => handleOpenPolicy('cookies')}
              className="hover:text-white underline cursor-pointer"
            >
              Cookies
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => handleOpenPolicy('pqrs')}
              className="hover:text-white underline cursor-pointer text-emerald-400"
            >
              Canal PQRS
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
