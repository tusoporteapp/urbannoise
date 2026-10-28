import React, { useState } from 'react';
import { ChevronDown, ShieldCheck, Sparkles, MapPin, Truck, Award } from 'lucide-react';

export const SeoEditorialSection: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: '¿Por qué URBANNOISE es considerada una de las mejores marcas de ropa colombiana oversize?',
      a: 'URBANNOISE se consolida como una de las mejores marcas de ropa oversize en Colombia al fusionar siluetas boxy fit auténticas con algodón peinado pesado de 240g a 300g/m². A diferencia de la producción masiva convencional, cada drop es confeccionado éticamente en Bogotá con cuellos reforzados indeformables, cortes geométricos que estilizan la caída y procesos artesanales como acid wash y serigrafía textil de máxima duración.',
    },
    {
      q: '¿Qué gramaje y telas se emplean en las prendas oversize de URBANNOISE?',
      a: 'Empleamos algodón 100% nacional de hilatura peinada de gramaje pesado (240g - 280g para camisetas y 380g para hoodies térmicos). Esta densidad proporciona una silueta estructurada, alta transpirabilidad y cero encogimiento tras el lavado, manteniendo el porte streetwear impecable.',
    },
    {
      q: '¿Cómo comprar online y cuáles son los tiempos de entrega en Colombia?',
      a: 'Puedes comprar con total tranquilidad en www.urbannoise.co. Procesamos pagos en línea 100% seguros a través de la pasarela oficial Bold.co (PSE, Nequi, Bancolombia, tarjetas de crédito y débito). Despachamos con Servientrega e Interrapidísimo: entregas en Bogotá en 24-48 horas y envíos nacionales a Medellín, Cali, Barranquilla, Bucaramanga y todo el país en 2 a 4 días hábiles con guía de rastreo en tiempo real.',
    },
    {
      q: '¿Tienen tienda física y showroom en Bogotá?',
      a: 'Sí. Nuestra sede física y taller está ubicada en el Centro Comercial El GranSan, Carrera 10 # 9-37, Local 23-54 en Bogotá, Colombia. Allí puedes probarte todas las referencias de nuestras colecciones, verificar los gramajes en vivo y realizar pagos directos en datáfono o efectivo.',
    },
  ];

  return (
    <section
      id="guia-streetwear-colombia"
      aria-label="Guía Oficial de Ropa Oversize en Colombia - URBANNOISE"
      className="w-full bg-[#0A0A0C] text-white border-t border-white/10 py-16 sm:py-24 px-4 sm:px-6 md:px-12 relative overflow-hidden"
    >
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Encabezado Editorial SEO */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] sm:text-xs font-mono uppercase tracking-widest text-[#D9C4AB]">
            <Award className="w-3.5 h-3.5" />
            <span>Streetwear Colombiano • Confección de Autor</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tight text-[#F5F2E4]">
            URBANNOISE: Marca Referente de Ropa Oversize en Colombia
          </h2>
          <p className="text-xs sm:text-sm text-white/70 leading-relaxed font-sans">
            Diseñamos el nuevo estándar del streetwear colombiano. Siluetas oversize con caída pesada, acabados industriales de alto gramaje y confección de autor pensada para quienes buscan identidad, durabilidad y autenticidad en cada prenda.
          </p>
        </div>

        {/* 4 Pilares de Marca */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 pt-4">
          {/* Pilar 1 */}
          <div className="bg-[#12131A] border border-white/10 p-5 rounded-xl space-y-2 hover:border-[#D9C4AB]/50 transition">
            <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-[#D9C4AB]">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-xs sm:text-sm uppercase text-white tracking-wide">
              Silueta Boxy Fit Auténtica
            </h3>
            <p className="text-[11.5px] text-white/60 leading-relaxed font-sans">
              Hombros caídos con proporciones estudiadas al milímetro para lograr una caída oversize geométrica que no pierde forma con el uso diario.
            </p>
          </div>

          {/* Pilar 2 */}
          <div className="bg-[#12131A] border border-white/10 p-5 rounded-xl space-y-2 hover:border-[#D9C4AB]/50 transition">
            <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-[#D9C4AB]">
              <Award className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-xs sm:text-sm uppercase text-white tracking-wide">
              Algodón Pesado 240g - 300g
            </h3>
            <p className="text-[11.5px] text-white/60 leading-relaxed font-sans">
              Tejido peinado de alta densidad con cuellos rib indeformables de 3 cm. Tacto suave premium, cero transparencias y resistencia extrema.
            </p>
          </div>

          {/* Pilar 3 */}
          <div className="bg-[#12131A] border border-white/10 p-5 rounded-xl space-y-2 hover:border-[#D9C4AB]/50 transition">
            <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-[#D9C4AB]">
              <MapPin className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-xs sm:text-sm uppercase text-white tracking-wide">
              Sello Bogotá • El GranSan
            </h3>
            <p className="text-[11.5px] text-white/60 leading-relaxed font-sans">
              Manufactura ética local en el corazón textil de Colombia (Cra 10 # 9-37 Local 23-54). Drops limitados con procesos de acid wash y bordado 3D.
            </p>
          </div>

          {/* Pilar 4 */}
          <div className="bg-[#12131A] border border-white/10 p-5 rounded-xl space-y-2 hover:border-[#D9C4AB]/50 transition">
            <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-[#D9C4AB]">
              <Truck className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-xs sm:text-sm uppercase text-white tracking-wide">
              Envíos & Pagos Seguros Bold
            </h3>
            <p className="text-[11.5px] text-white/60 leading-relaxed font-sans">
              Despachos asegurados a toda Colombia con Servientrega. Pagos 100% protegidos con PSE, Nequi, tarjetas y opciones de cuotas.
            </p>
          </div>
        </div>

        {/* Acordeón FAQ para Indexación en Google */}
        <div className="pt-6 max-w-3xl mx-auto space-y-4">
          <div className="text-center space-y-1 mb-6">
            <span className="text-[10px] uppercase font-mono tracking-widest text-[#D9C4AB]">
              Transparencia & Preguntas Frecuentes
            </span>
            <h3 className="text-lg sm:text-xl font-black uppercase tracking-tight text-white">
              Preguntas Frecuentes sobre Nuestra Ropa Oversize
            </h3>
          </div>

          <div className="space-y-2.5">
            {faqs.map((item, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="bg-[#12131A] border border-white/10 rounded-xl overflow-hidden transition"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full py-4 px-5 flex items-center justify-between text-left cursor-pointer hover:bg-white/5 transition"
                    aria-expanded={isOpen}
                  >
                    <span className="font-bold text-xs sm:text-sm text-white pr-4">
                      {item.q}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#D9C4AB] flex-shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-4 pt-1 text-xs sm:text-sm text-white/70 leading-relaxed font-sans border-t border-white/5">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
