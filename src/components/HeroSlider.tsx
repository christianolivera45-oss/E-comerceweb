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
      className="relative h-[420px] md:h-[520px] w-full overflow-hidden bg-zinc-950 text-white select-none group"
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
            {/* Background Image */}
            <img
              src={slides[currentIndex].imageUrl}
              alt={slides[currentIndex].title}
              className="w-full h-full object-cover object-center opacity-35"
              referrerPolicy="no-referrer"
            />
            
            {/* Ambient Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-zinc-950/20"></div>

            {/* Slide Content */}
            <div className="absolute inset-0 flex items-center">
              <div className="max-w-7xl mx-auto px-6 w-full text-center md:text-left relative z-10">
                <div className="max-w-3xl">


                  <motion.h1 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25, duration: 0.4 }}
                    className="text-3xl sm:text-4xl md:text-6xl font-black tracking-tight leading-none text-white drop-shadow-md"
                  >
                    {slides[currentIndex].title}
                  </motion.h1>
                  
                  <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35, duration: 0.4 }}
                    className="mt-4 text-base sm:text-lg text-zinc-300 font-light leading-relaxed drop-shadow-sm max-w-2xl"
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
                      className="py-3 px-6 rounded-xl font-bold text-sm tracking-wide theme-btn-primary shadow-lg hover:shadow-indigo-500/20 cursor-pointer transform hover:-translate-y-0.5 transition"
                    >
                      {slides[currentIndex].buttonText || "Explorar Catálogo"}
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
        aria-label="Anterior diapositiva"
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-zinc-900/60 hover:bg-zinc-805 border border-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white transition opacity-0 group-hover:opacity-100 cursor-pointer active:scale-95"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      <button
        onClick={handleNext}
        aria-label="Siguiente diapositiva"
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-zinc-900/60 hover:bg-zinc-805 border border-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white transition opacity-0 group-hover:opacity-100 cursor-pointer active:scale-95"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Interactive indicator dots and actions bar */}
      <div className="absolute bottom-6 left-1/2 -translate-y-0 -translate-x-1/2 z-25 flex items-center gap-3 bg-zinc-900/40 backdrop-blur-md border border-zinc-800/55 px-3.5 py-2 rounded-full shadow-lg">
        {/* Play / Pause Autoplay state */}
        <button 
          onClick={() => setIsPlaying(!isPlaying)}
          title={isPlaying ? "Pausar carrusel" : "Iniciar reproducción automática"}
          className="text-zinc-400 hover:text-white transition mr-1 cursor-pointer"
        >
          {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
        </button>

        {/* Indicators */}
        <div className="flex items-center gap-1.5">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setDirection(idx > currentIndex ? 1 : -1);
                setCurrentIndex(idx);
              }}
              aria-label={`Ir a la diapositiva ${idx + 1}`}
              className={`h-2.5 rounded-full transition-all cursor-pointer ${
                currentIndex === idx 
                  ? "w-6 bg-indigo-500" 
                  : "w-2.5 bg-zinc-600/60 hover:bg-zinc-500"
              }`}
            />
          ))}
        </div>
      </div>

    </div>
  );
}
