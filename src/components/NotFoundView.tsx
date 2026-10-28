import React from 'react';
import { ArrowLeft, ShoppingBag, Search, Sparkles } from 'lucide-react';

interface NotFoundViewProps {
  onBackToHome: () => void;
  onOpenSearch?: () => void;
}

export const NotFoundView: React.FC<NotFoundViewProps> = ({
  onBackToHome,
  onOpenSearch,
}) => {
  return (
    <div className="min-h-[80vh] flex items-center justify-center pt-24 pb-16 px-4 bg-white text-[#101013]">
      <div className="max-w-xl w-full text-center space-y-6">
        <div className="relative inline-block">
          <span className="text-8xl sm:text-9xl font-black tracking-tighter text-[#101013] select-none opacity-90 font-mono">
            404
          </span>
          <span className="absolute -bottom-2 inset-x-0 bg-black text-[#F5F2E4] text-[10px] font-black uppercase tracking-widest py-1">
            DROP NO ENCONTRADO
          </span>
        </div>

        <div className="space-y-2">
          <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-[#101013]">
            Esta prenda o ruta ya no está disponible
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed max-w-md mx-auto">
            La dirección a la que intentas acceder no existe en nuestro catálogo de Bogotá o fue rotada en una edición limitada anterior.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={onBackToHome}
            className="w-full sm:w-auto px-6 py-3.5 bg-[#101013] text-[#F5F2E4] hover:bg-black font-extrabold text-xs uppercase tracking-widest transition cursor-pointer shadow-lg flex items-center justify-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a la Tienda Principal</span>
          </button>
          {onOpenSearch && (
            <button
              type="button"
              onClick={onOpenSearch}
              className="w-full sm:w-auto px-6 py-3.5 border border-gray-300 hover:border-black font-bold text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center space-x-2"
            >
              <Search className="w-4 h-4" />
              <span>Buscar Prendas</span>
            </button>
          )}
        </div>

        {/* Atajos Rápidos */}
        <div className="pt-8 border-t border-gray-100 text-xs text-gray-500">
          <span className="font-semibold block mb-2 uppercase text-[11px] tracking-wider text-gray-400">
            Explora las colecciones activas:
          </span>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <a href="#latest-drops" className="hover:underline font-mono text-[#101013]">
              #ÚltimosLanzamientos
            </a>
            <span>•</span>
            <a href="#young-free" className="hover:underline font-mono text-[#101013]">
              #YoungAndFree
            </a>
            <span>•</span>
            <a href="#weird-oversize" className="hover:underline font-mono text-[#101013]">
              #WeirdOversize
            </a>
            <span>•</span>
            <a href="#dama-oversize" className="hover:underline font-mono text-[#101013]">
              #DamaOversize
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
