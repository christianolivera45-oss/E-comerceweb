import React from 'react';
import { useStore } from '../context/StoreContext';
import { ShoppingBag, ChevronRight, CheckCircle2 } from 'lucide-react';

interface HeroProps {
  onBrowseClick: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onBrowseClick }) => {
  const { settings } = useStore();

  return (
    <div className="relative overflow-hidden bg-white text-gray-900 border-b border-gray-100">
      {/* Decorative backdrop gradients */}
      <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-gray-100 rounded-full blur-[125px] pointer-events-none opacity-60" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Text content side */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 border border-gray-200 text-gray-600 text-xs font-mono font-medium">
              <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Tienda Verificada y Segura</span>
            </div>

            <h1 className="font-sans font-bold tracking-tight text-4xl sm:text-5xl lg:text-6xl text-gray-950 leading-tight">
              {settings.heroTitle || 'Estilo y tecnología sin límites'}
            </h1>

            <p className="text-gray-500 text-base sm:text-lg max-w-xl mx-auto lg:mx-0 font-medium leading-relaxed">
              {settings.heroSubtitle || 'Explorá nuestras colecciones de prendas exclusivas, gadgets premium y accesorios vanguardistas adaptados a tu estilo diario.'}
            </p>

            {/* Micro value props grid */}
            <div className="grid grid-cols-2 gap-3 max-w-md mx-auto lg:mx-0 pt-2 text-xs text-gray-500 font-mono">
              <div className="flex items-center gap-1.5 justify-center lg:justify-start">
                <CheckCircle2 size={14} className="text-black" />
                <span>Asistencia al instante</span>
              </div>
              <div className="flex items-center gap-1.5 justify-center lg:justify-start">
                <CheckCircle2 size={14} className="text-black" />
                <span>Envíos rápidos</span>
              </div>
              <div className="flex items-center gap-1.5 justify-center lg:justify-start">
                <CheckCircle2 size={14} className="text-black" />
                <span>Compras por WhatsApp</span>
              </div>
              <div className="flex items-center gap-1.5 justify-center lg:justify-start">
                <CheckCircle2 size={14} className="text-black" />
                <span>Garantía Asegurada</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
              <button
                onClick={onBrowseClick}
                className="flex items-center justify-center gap-2 rounded-xl bg-black hover:bg-zinc-900 text-white font-semibold py-3 px-8 text-sm shadow-sm active:scale-95 transition-transform"
                id="hero-cta-browse"
              >
                <ShoppingBag size={16} />
                <span>Explorar Catálogo</span>
                <ChevronRight size={16} />
              </button>
              
              <a
                href={`https://wa.me/${settings.whatsappNumber || '541123456789'}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl bg-white hover:bg-gray-50 text-gray-850 font-semibold py-3 px-8 text-sm border border-gray-250 transition-all shadow-sm"
                id="hero-cta-whatsapp"
              >
                <span>Soporte Directo</span>
              </a>
            </div>
          </div>

          {/* Banner Image side */}
          <div className="lg:col-span-5 relative flex justify-center lg:justify-end">
            <div className="relative w-full max-w-md aspect-square lg:aspect-[4/5] rounded-3xl overflow-hidden border border-gray-150 shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-t from-gray-950/20 via-transparent to-transparent z-10" />
              <img
                src={settings.heroBannerUrl || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200'}
                alt="Banner E-Commerce"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700"
              />
              
              {/* Overlay stats item */}
              <div className="absolute bottom-6 left-6 right-6 z-20 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-gray-100 flex items-center justify-between shadow-md">
                <div>
                  <p className="text-[10px] uppercase font-mono tracking-widest text-gray-500">Colección Especial</p>
                  <p className="font-bold text-sm text-gray-900">Novedades Seleccionadas</p>
                </div>
                <div className="bg-black font-semibold text-white text-xs py-1.5 px-3 rounded-lg uppercase tracking-wide">
                  Nuevo
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
