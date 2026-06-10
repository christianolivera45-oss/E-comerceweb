import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Sparkles, MessageCircle, Play, Pause } from "lucide-react";
import { SiteSettings, HeroSlide } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface HeroSliderProps {
  settings: SiteSettings;
  onExploreCatalog: (slideLink?: string) => void;
}

export default function HeroSlider({ settings, onExploreCatalog }: HeroSliderProps) {
  const defaultSlides: HeroSlide[] = [
    {
      id: "slide-1",
      title: settings.bannerTitle || "Colección Exclusiva de Primavera",
      subtitle: settings.bannerSubtitle || "Descubre las últimas tendencias con descuentos de hasta el 40%.",
      imageUrl: settings.bannerImageUrl || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=80"
    },
    {
      id: "slide-2",
      title: "Tendencias de Temporada",
      subtitle: "Colecciones cuidadosamente seleccionadas para expresar tu estilo único.",
      imageUrl: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1600&q=80"
    },
    {
      id: "slide-3",
      title: "Accesorios & Complementos",
      subtitle: "Lentes, mochilas, relojes y detalles que transforman cualquier outfit.",
      imageUrl: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1600&q=80"
    }
  ];

  const slides = settings.heroSlides && settings.heroSlides.length > 0 
    ? settings.heroSlides 
    : defaultSlides;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [direction, setDirection] = useState(1); // 1 = right, -1 = left

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      handleNext();
    }, 6000);
    return () => clearInterval(interval);
  }, [currentIndex, isPlaying, slides.length]);

  const handleNext = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  const handlePrev = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleWhatsAppContact = (slideTitle: string) => {
    const text = `Hola! Vi el banner "${slideTitle}" en la tienda ${settings.siteTitle} y me gustaría recibir más información sobre el catálogo y ofertas actuales.`;
    const cleanPhone = settings.whatsappNumber.replace(/[^0-9]/g, "");
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, "_blank");
  };

  // Variance configuration for motion slider transition
  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (dir: number) => ({
      zIndex: 0,
      x: dir < 0 ? 1000 : -1000,
      opacity: 0
    })
  };

  return (
    <div 
      className="relative h-[440px] md:h-[560px] w-full overflow-hidden bg-[#050B1A] text-white select-none group"
      onMouseEnter={() => setIsPlaying(false)}
      onMouseLeave={() => setIsPlaying(true)}
    >
      {/* Slides Viewport */}
      <div className="absolute inset-0 w-full h-full">
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.3 }
            }}
            className="absolute inset-0 w-full h-full"
          >
            {/* Background Image - Boosted with visual filters to guarantee brightness even for dark images */}
            <img
              src={slides[currentIndex].imageUrl}
              alt={slides[currentIndex].title}
              className="w-full h-full object-cover object-center transition-opacity duration-500 filter brightness-135 contrast-105 saturate-[1.05]"
              style={{ opacity: (settings.bannerOpacity !== undefined ? Math.max(settings.bannerOpacity, 85) : 95) / 100 }}
              referrerPolicy="no-referrer"
            />
            
            {/* Premium Soft Ambient Gradient Overlays:
                - Left-to-right gradient is softened from solid navy/black to transparent much earlier.
                - Bottom-up is made very subtle to avoid darkening the bottom half of the image.
            */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#050B1A]/80 via-[#050B1A]/40 to-transparent md:block hidden animate-fade-in"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#050B1A]/80 via-[#050B1A]/25 to-transparent md:hidden block"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#050B1A]/40 via-transparent to-transparent"></div>

            {/* Slide Content */}
            <div className="absolute inset-0 flex items-center uppercase-none">
              <div className="max-w-7xl mx-auto px-6 w-full text-center md:text-left relative z-10">
                <div className="max-w-2xl">

                  <motion.h1 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25, duration: 0.4 }}
                    className="text-3xl sm:text-5xl md:text-7.5xl font-serif font-light text-[#F4EAD7] tracking-wide leading-tight drop-shadow-md mb-4"
                  >
                    {slides[currentIndex].title}
                  </motion.h1>
                  
                  <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35, duration: 0.4 }}
                    className="text-sm sm:text-base text-slate-350 font-sans tracking-wide leading-relaxed max-w-xl font-light"
                    style={{ color: "#D3CCD8" }}
                  >
                    {slides[currentIndex].subtitle}
                  </motion.p>

                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45, duration: 0.4 }}
                    className="mt-8 flex flex-wrap items-center justify-center md:justify-start gap-4"
                  >
                    <button
                      onClick={() => onExploreCatalog(slides[currentIndex].buttonLink)}
                      className="py-3 px-8 rounded-full font-sans font-bold text-xs uppercase tracking-widest bg-[#D4A55A] text-[#050B1A] hover:bg-[#E6BF76] shadow-xl hover:shadow-[#D4A55A]/10 cursor-pointer transform hover:-translate-y-0.5 transition duration-300"
                    >
                      {slides[currentIndex].buttonText || "Explorar Colección"}
                    </button>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Slide Navigation Left/Right Arrows */}
      <button
        onClick={handlePrev}
        aria-label="Anterior"
        className="absolute left-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-[#0B1730]/65 hover:bg-[#D4A55A] border border-[#D4A55A]/25 hover:border-[#D4A55A] flex items-center justify-center text-[#F4EAD7] hover:text-[#050B1A] transition duration-300 opacity-0 group-hover:opacity-100 cursor-pointer active:scale-95"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      <button
        onClick={handleNext}
        aria-label="Siguiente"
        className="absolute right-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-[#0B1730]/65 hover:bg-[#D4A55A] border border-[#D4A55A]/25 hover:border-[#D4A55A] flex items-center justify-center text-[#F4EAD7] hover:text-[#050B1A] transition duration-300 opacity-0 group-hover:opacity-100 cursor-pointer active:scale-95"
      >
        <ChevronRight className="h-5 w-5" />
      </button>



    </div>
  );
}
