import React, { useState } from 'react';
import { Lock, ArrowRight, ShieldCheck, AlertCircle, CheckCircle2, KeyRound } from 'lucide-react';

interface ConstructionGateProps {
  onUnlock: () => void;
}

// Constantes criptográficas protegidas (PBKDF2-SHA256 con 100,000 iteraciones)
// Ninguna clave o PIN se almacena en texto plano en el cliente ni en los comentarios.
const GATE_VERIFICATION_HASH = '249487fae2e1200c20e72d9a54b08c7b64726ae35fe2dd75656c2181dc5b1c1a';
const GATE_KDF_SALT = 'URBANNOISE_ATELIER_COLOMBIA_GATE_SECURE_SALT_v2';
const GATE_PBKDF2_ITERATIONS = 100000;

async function verifyPasscodeSecurely(input: string): Promise<boolean> {
  try {
    if (typeof window === 'undefined' || !window.crypto?.subtle) {
      return false;
    }
    const encoder = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      encoder.encode(input),
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );
    const derivedBits = await window.crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: encoder.encode(GATE_KDF_SALT),
        iterations: GATE_PBKDF2_ITERATIONS,
        hash: 'SHA-256',
      },
      keyMaterial,
      256
    );
    const hashArray = Array.from(new Uint8Array(derivedBits));
    const hex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    return hex === GATE_VERIFICATION_HASH;
  } catch {
    return false;
  }
}

export const ConstructionGate: React.FC<ConstructionGateProps> = ({ onUnlock }) => {
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [accessKey, setAccessKey] = useState('');
  const [keyError, setKeyError] = useState('');
  const [keySuccess, setKeySuccess] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [notifySuccess, setNotifySuccess] = useState(false);

  const handleKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setKeyError('');

    const clean = accessKey.trim();
    if (!clean || isVerifying) return;

    // Rate-limiting en cliente: Verificar si hay bloqueo activo por intentos fallidos
    try {
      const lockoutTime = Number(sessionStorage.getItem('urbannoise_gate_lockout') || 0);
      if (Date.now() < lockoutTime) {
        const remainingSec = Math.ceil((lockoutTime - Date.now()) / 1000);
        setKeyError(`Acceso restringido temporalmente. Intente en ${remainingSec}s.`);
        return;
      }
    } catch {}

    setIsVerifying(true);

    // Pequeño retardo defensivo (350ms) para neutralizar ataques de fuerza bruta automatizados
    await new Promise((resolve) => setTimeout(resolve, 350));

    // 1. Intentar validación en endpoint de servidor si está disponible
    let isUnlocked = false;
    try {
      const res = await fetch('/api/gate/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessKey: clean }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.unlocked) {
          isUnlocked = true;
        }
      }
    } catch {
      // Entorno estático (GitHub Pages) sin backend Node
    }

    // 2. Si el servidor no respondió o está en hosting estático, validar vía PBKDF2 Web Crypto
    if (!isUnlocked) {
      isUnlocked = await verifyPasscodeSecurely(clean);
    }

    setIsVerifying(false);

    if (isUnlocked) {
      try {
        sessionStorage.removeItem('urbannoise_gate_fails');
        sessionStorage.removeItem('urbannoise_gate_lockout');
        sessionStorage.setItem('urbannoise_site_unlocked_session', 'true');
        localStorage.removeItem('urbannoise_site_unlocked');
      } catch {}

      setKeySuccess(true);
      setTimeout(() => {
        onUnlock();
      }, 500);
      return;
    }

    // Registrar fallo para mitigación de ataques de diccionario
    try {
      const fails = Number(sessionStorage.getItem('urbannoise_gate_fails') || 0) + 1;
      sessionStorage.setItem('urbannoise_gate_fails', String(fails));
      if (fails >= 5) {
        sessionStorage.setItem('urbannoise_gate_lockout', String(Date.now() + 30000));
        setKeyError('Demasiados intentos fallidos. Bloqueado temporalmente por 30 segundos.');
      } else {
        setKeyError('Clave de acceso incorrecta');
      }
    } catch {
      setKeyError('Clave de acceso incorrecta');
    }
    setAccessKey('');
  };

  const handleNotifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = emailInput.trim().toLowerCase();
    if (cleanEmail && cleanEmail.includes('@')) {
      try {
        await fetch('/api/newsletter/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail }),
        });
      } catch {}
      setNotifySuccess(true);
      setEmailInput('');
      setTimeout(() => setNotifySuccess(false), 5000);
    }
  };

  return (
    <div className="bg-[#050505] text-[#f4f4f5] min-h-screen flex flex-col justify-between font-sans selection:bg-white selection:text-black">
      {/* Top Announcement Bar */}
      <header className="w-full border-b border-neutral-900 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-[11px] uppercase tracking-widest text-neutral-500 font-medium">
          <span>Bogotá, Colombia</span>
          <div className="flex items-center space-x-3">
            <span className="text-neutral-400">Sitio Web Oficial</span>
            <button
              onClick={() => setShowPasswordModal(true)}
              className="text-neutral-500 hover:text-white transition flex items-center space-x-1 cursor-pointer"
              title="Acceso exclusivo con clave"
            >
              <Lock className="w-3 h-3" />
              <span className="text-[10px]">Acceso Privado</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Center */}
      <main className="w-full max-w-3xl mx-auto px-6 py-16 sm:py-20 flex-1 flex flex-col items-center justify-center text-center">
        {/* Brand Logo / Typography */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black uppercase tracking-[0.35em] text-white leading-none">
          URBAN NOISE
        </h1>

        <p className="mt-4 text-xs sm:text-sm uppercase tracking-widest text-neutral-400 font-light max-w-lg">
          Diseño, Streetwear y Estética Urbana Contemporánea
        </p>

        {/* Subtle divider */}
        <div className="w-12 h-[1px] bg-neutral-800 my-10"></div>

        {/* Status Notice */}
        <div className="space-y-3">
          <span className="inline-block text-[11px] uppercase tracking-widest text-neutral-400 border border-neutral-800 px-3 py-1 rounded-sm">
            Página en Construcción
          </span>
          <p className="text-neutral-400 text-sm sm:text-base font-normal max-w-md mx-auto leading-relaxed pt-2">
            Estamos actualizando nuestra plataforma en línea para la nueva colección. Pronto estará disponible nuestro catálogo completo.
          </p>
        </div>

        {/* Minimalist Early-Access Input */}
        <div className="mt-10 w-full max-w-md">
          <form
            onSubmit={handleNotifySubmit}
            className="relative flex flex-col sm:flex-row items-center border-b border-neutral-700 focus-within:border-white transition-colors duration-300 pb-1"
          >
            <input
              id="gate-notify-email"
              name="email"
              type="email"
              autoComplete="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="Tu correo electrónico para aviso de apertura"
              className="w-full bg-transparent px-2 py-3 text-xs sm:text-sm text-white placeholder-neutral-600 focus:outline-none tracking-wide"
            />
            <button
              type="submit"
              className="w-full sm:w-auto mt-2 sm:mt-0 px-4 py-2 text-xs uppercase tracking-widest text-white hover:text-neutral-400 font-semibold transition-colors shrink-0 cursor-pointer"
            >
              Notificarme
            </button>
          </form>

          {notifySuccess && (
            <p className="text-xs text-emerald-400 font-normal tracking-wide mt-3 animate-in fade-in">
              ✓ Gracias. Te avisaremos el día del lanzamiento oficial.
            </p>
          )}
        </div>

        {/* Botón de acceso exclusivo con clave */}
        <div className="mt-10 pt-4">
          <button
            onClick={() => setShowPasswordModal(true)}
            className="px-5 py-2.5 bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 rounded-lg text-xs font-bold uppercase tracking-widest transition flex items-center space-x-2 cursor-pointer shadow-lg group"
          >
            <KeyRound className="w-3.5 h-3.5 text-[#D9C4AB] group-hover:scale-110 transition-transform" />
            <span>Ver Tienda con Clave Privada</span>
            <ArrowRight className="w-3 h-3 text-neutral-500 group-hover:text-white transition" />
          </button>
        </div>

        {/* Contact & Attention (WhatsApp / Direct Shopping) */}
        <div className="mt-14 pt-8 border-t border-neutral-900 w-full flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10 text-xs tracking-wider uppercase text-neutral-400">
          <a
            href="https://wa.me/573108720491?text=Hola%20Urban%20Noise,%20deseo%20hacer%20un%20pedido%20o%20consultar%20disponibilidad"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors flex items-center gap-2"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>WhatsApp: +57 310 872 0491</span>
          </a>

          <a
            href="mailto:urban.noice@gmail.com"
            className="hover:text-white transition-colors"
          >
            urban.noice@gmail.com
          </a>
        </div>
      </main>

      {/* Footer with official store address */}
      <footer className="w-full border-t border-neutral-900 px-6 py-6 text-center text-[11px] text-neutral-600 tracking-wider">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="uppercase">
            Tienda Física: Cra 10 # 9-37 Local 22-68, Bogotá, Colombia
          </p>
          <p>© 2026 URBAN NOISE. Todos los derechos reservados.</p>
        </div>
      </footer>

      {/* Modal de Ingreso de Clave de Acceso */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-[200] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#101014] border border-white/15 rounded-2xl max-w-sm w-full p-6 text-left shadow-2xl relative space-y-5">
            <button
              onClick={() => {
                setShowPasswordModal(false);
                setKeyError('');
              }}
              className="absolute right-4 top-4 text-white/40 hover:text-white p-1 rounded-full hover:bg-white/10 transition cursor-pointer"
            >
              ✕
            </button>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-[#D9C4AB]/15 border border-[#D9C4AB]/30 flex items-center justify-center text-[#D9C4AB]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  Acceso Exclusivo URBAN NOISE
                </h3>
                <p className="text-[11px] text-white/50">
                  Ingresa tu clave privada para desbloquear la tienda.
                </p>
              </div>
            </div>

            <form onSubmit={handleKeySubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-white/70 uppercase tracking-wider">
                  Clave de Acceso
                </label>
                <div className="relative">
                  <input
                    id="gate-access-key"
                    name="accessKey"
                    type="password"
                    autoComplete="current-password"
                    autoFocus
                    required
                    value={accessKey}
                    onChange={(e) => setAccessKey(e.target.value)}
                    placeholder="••••"
                    disabled={isVerifying || keySuccess}
                    className="w-full bg-black/70 border border-white/20 rounded-xl px-4 py-3 text-base text-center font-mono font-bold tracking-[0.5em] text-white placeholder-white/30 focus:outline-none focus:border-[#D9C4AB] transition disabled:opacity-50"
                  />
                </div>
                {keyError && (
                  <p className="text-[11px] text-red-400 font-bold flex items-center space-x-1 pt-1">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{keyError}</span>
                  </p>
                )}
                {keySuccess && (
                  <p className="text-[11px] text-emerald-400 font-bold flex items-center space-x-1 pt-1">
                    <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Clave correcta. Abriendo tienda...</span>
                  </p>
                )}
              </div>

              <div className="flex items-center space-x-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setKeyError('');
                  }}
                  className="flex-1 py-2.5 bg-white/10 hover:bg-white/15 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={keySuccess || isVerifying}
                  className="flex-1 py-2.5 bg-[#D9C4AB] hover:bg-[#c9b49b] text-black font-black text-xs uppercase tracking-wider rounded-lg transition cursor-pointer shadow-lg disabled:opacity-50 flex items-center justify-center space-x-1"
                >
                  <span>{isVerifying ? 'Verificando...' : 'Entrar'}</span>
                  {!isVerifying && <ArrowRight className="w-3.5 h-3.5" />}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
