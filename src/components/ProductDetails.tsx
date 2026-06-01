import { useState, useEffect, useMemo, useRef } from "react";
import { X, ShoppingCart, MessageSquare, ShieldCheck, Truck, RefreshCw, ChevronLeft, ChevronRight, AlertCircle, Share2, Maximize2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Product, SiteSettings } from "../types";
import ProductCard from "./ProductCard";

interface ProductDetailsProps {
  product: Product;
  onClose: () => void;
  onAddToCart: (product: Product, size?: string, color?: string, quantity?: number) => void;
  settings: SiteSettings;
  allProducts?: Product[];
  dbCategories?: any[];
  onViewProduct?: (product: Product) => void;
}

export default function ProductDetails({
  product,
  onClose,
  onAddToCart,
  settings,
  allProducts = [],
  dbCategories = [],
  onViewProduct = () => {}
}: ProductDetailsProps) {
  const isThemeDark = settings.themeMode === "dark";
  const isClothing = product.category.toLowerCase() === "ropa" || (product.sizes && product.sizes.length > 0);
  const isElectronics = product.category.toLowerCase() === "artículos electrónicos";

  // Dynamic variants logic
  const variants = product.variants || [];
  const hasVariants = variants.length > 0;

  // Filter related products
  let relatedProducts = allProducts
    ? allProducts.filter((p) => p.id !== product.id && p.active !== false && p.paused !== true && (
        String(p.categoria_id) === String(product.categoria_id) || 
        p.category?.toLowerCase() === product.category?.toLowerCase()
      ))
    : [];

  if (relatedProducts.length < 4 && allProducts) {
    const ids = new Set(relatedProducts.map(p => p.id));
    const extra = allProducts.filter(
      (p) => p.id !== product.id && p.active !== false && p.paused !== true && !ids.has(p.id)
    );
    relatedProducts = [...relatedProducts, ...extra].slice(0, 4);
  }

  const sizes = product.sizes && product.sizes.length > 0 
    ? product.sizes 
    : (hasVariants ? Array.from(new Set(variants.map(v => v.size))) : (isClothing ? ["S", "M", "L", "XL"] : []));

  const colors = product.colors && product.colors.length > 0
    ? product.colors
    : (hasVariants ? Array.from(new Set(variants.map(v => v.color))) : (isClothing 
      ? ["Negro", "Gris", "Blanco"] 
      : isElectronics 
      ? ["Negro mate", "Plata espacial", "Azul cobalto"] 
      : ["Estándar"]));

  // Pre-initialize selectors (only auto-select if there is exactly 1 option, otherwise start unselected)
  const [selectedSize, setSelectedSize] = useState(() => {
    return sizes.length === 1 ? sizes[0] : "";
  });

  const [selectedColor, setSelectedColor] = useState(() => {
    return colors.length === 1 ? colors[0] : "";
  });

  const [quantity, setQuantity] = useState(1);
  const [addedMessage, setAddedMessage] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  // Dynamic stock calculations based on Cartesian variant mapping
  let currentStock = product.stock;
  let dynamicPrice = product.price;
  let matchedVariant: any = null;

  if (hasVariants && selectedSize && selectedColor) {
    matchedVariant = variants.find(v => v.size === selectedSize && v.color === selectedColor);
    if (matchedVariant) {
      currentStock = matchedVariant.stock;
      dynamicPrice = typeof matchedVariant.price === "number" && matchedVariant.price > 0
        ? matchedVariant.price
        : product.price + (matchedVariant.priceDelta || 0);
    } else {
      currentStock = 0; // This specific combo isn't defined or holds 0 stock
    }
  }

  // Dynamic Image carousels
  const allImages = useMemo(() => {
    return [product.imageUrl, ...(product.imagenes || [])].filter(Boolean);
  }, [product.imageUrl, product.imagenes]);

  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Keep track of the last color that triggered an automatic image transition
  const autoSwitchedColorRef = useRef("");

  // Scroll to the top of the page when the product loaded changes, and reset the active image index and state
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setActiveImgIndex(0);
    setSelectedSize(sizes.length === 1 ? sizes[0] : "");
    setSelectedColor(colors.length === 1 ? colors[0] : "");
    setQuantity(1);
    autoSwitchedColorRef.current = ""; // Reset matched color on product change
  }, [product.id, sizes.length, colors.length]);

  // Automatically update activeImgIndex when selectedColor changes
  useEffect(() => {
    if (selectedColor && selectedColor !== autoSwitchedColorRef.current) {
      autoSwitchedColorRef.current = selectedColor;
      const lowerColor = selectedColor.toLowerCase().trim();
      // Strategy 1: Check if any variant has a specific variant imageUrl
      const matchedV = (variants || []).find(v => v.color && v.color.toLowerCase().trim() === lowerColor && v.imageUrl);
      if (matchedV && matchedV.imageUrl) {
        const idx = allImages.indexOf(matchedV.imageUrl);
        if (idx !== -1) {
          setActiveImgIndex(idx);
          return;
        }
      }

      // Strategy 2: Check standard image URLs for a substring containing the color name
      const matchesUrl = allImages.findIndex(img => {
        try {
          const decoded = decodeURIComponent(img).toLowerCase();
          return decoded.includes(lowerColor);
        } catch {
          return img.toLowerCase().includes(lowerColor);
        }
      });
      if (matchesUrl !== -1) {
        setActiveImgIndex(matchesUrl);
      }
    }
  }, [selectedColor, product.id, variants, allImages]);

  const handlePrevImg = () => {
    setActiveImgIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  };

  const handleNextImg = () => {
    setActiveImgIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
  };

  const handleAddToCart = () => {
    if (sizes.length > 0 && !selectedSize) {
      alert("Por favor selecciona un talle.");
      return;
    }
    if (colors.length > 0 && !selectedColor) {
      alert("Por favor selecciona un color.");
      return;
    }
    const colorToPass = colors.length > 0 ? selectedColor : undefined;
    
    // Safety check quantity boundaries
    const finalQty = Math.min(quantity, currentStock);
    if (finalQty <= 0) {
      alert("Lo sentimos, esta combinación temporalmente no cuenta con stock.");
      return;
    }

    onAddToCart(product, selectedSize || undefined, colorToPass, finalQty);
    
    setAddedMessage(true);
    setTimeout(() => {
      setAddedMessage(false);
    }, 2000);
  };

  const handleImmediateWhatsAppQuery = () => {
    const text = `Hola ${settings.siteTitle || "Ventas Juem"}! Me interesa obtener más información sobre este artículo:
*${product.name}*
${selectedSize ? `👉 Talle seleccionado: ${selectedSize}\n` : ""}${selectedColor ? `👉 Color deseado: ${selectedColor}\n` : ""}Precio actual del catálogo: $${Math.round(dynamicPrice)}
Me gustaría saber disponibilidad de stock y métodos de envío.`;

    const cleanPhone = settings.whatsappNumber.replace(/[^0-9]/g, "");
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
    window.open(waUrl, "_blank", "referrer");
  };

  const isDiscounted = product.originalPrice && product.originalPrice > dynamicPrice;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 animate-fade-in">
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }
        .no-scrollbar {
          -ms-overflow-style: none !important; /* IE and Edge */
          scrollbar-width: none !important; /* Firefox */
        }
      `}</style>



      <div
        className={`relative w-full rounded-[32px] overflow-hidden flex flex-col md:grid md:grid-cols-[58%_42%] shadow-2xl transition-all duration-300 ${
          isThemeDark ? "bg-[#09090b] text-white" : "bg-white text-zinc-900"
        }`}
      >
        {/* Close Button: Luxurious, circular, shown mostly on small screens */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 rounded-full p-2 bg-black/40 text-zinc-400 hover:text-white hover:bg-black/60 border border-zinc-800/45 transition duration-200 cursor-pointer sm:hidden animate-fade-in"
          title="Volver"
        >
          <X className="h-4 w-4" />
        </button>
 
        {/* Left Column: Image Area without separating borders for unified visual integration */}
        <div className={`flex flex-col p-4 sm:p-5 md:p-6 justify-start items-center relative gap-3.5 sm:gap-4 overflow-hidden w-full shrink-0 ${
          isThemeDark ? "bg-[#09090b]" : "bg-white"
        }`}>
          
          {/* Main card for product details */}
          <div className={`relative w-full h-[280px] sm:h-[360px] md:h-[460px] rounded-[24px] flex items-center justify-center p-4 sm:p-5 select-none overflow-hidden ${
            isThemeDark ? "bg-[#0c0c0e]/30" : "bg-[#fcfbfc]"
          }`}>
            
            <div 
              onClick={() => setIsLightboxOpen(true)}
              className="relative w-full h-full flex items-center justify-center overflow-hidden cursor-zoom-in group/main-img"
              title="Haz clic para ampliar la imagen"
            >
              <AnimatePresence mode="wait">
                <motion.img
                  key={activeImgIndex}
                  src={allImages[activeImgIndex] || "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80"}
                  alt={product.name}
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.03 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className="max-h-full max-w-full object-contain select-none transition-transform duration-300 group-hover/main-img:scale-[1.015]"
                  referrerPolicy="no-referrer"
                />
              </AnimatePresence>

              {/* Floating expand indicator */}
              <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md rounded-full p-2 text-white/90 opacity-0 group-hover/main-img:opacity-100 transition-all duration-300 z-10 shadow-lg hover:scale-105 hover:bg-black/80">
                <Maximize2 className="w-3.5 h-3.5" />
              </div>
            </div>
            
            {isDiscounted && (
              <span className="absolute top-4 left-4 bg-red-650 text-white font-extrabold text-[8px] uppercase tracking-widest px-2.5 py-1 rounded-full shadow-md z-10">
                Oferta Especial
              </span>
            )}

            {/* Navigation arrows for gallery images floating gracefully inside the card borders */}
            {allImages.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); handlePrevImg(); }}
                  className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/50 hover:bg-black/75 text-white border border-white/10 hover:scale-105 active:scale-95 transition-all cursor-pointer z-10 shadow-md"
                >
                  <ChevronLeft className="h-4 w-4 stroke-[2.5]" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleNextImg(); }}
                  className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/50 hover:bg-black/75 text-white border border-white/10 hover:scale-105 active:scale-95 transition-all cursor-pointer z-10 shadow-md"
                >
                  <ChevronRight className="h-4 w-4 stroke-[2.5]" />
                </button>
              </>
            )}

            {/* Dots indicator inside the image area */}
            {allImages.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10 select-none bg-black/30 backdrop-blur-xs px-3.5 py-1.5 rounded-full">
                {allImages.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => { e.stopPropagation(); setActiveImgIndex(idx); }}
                    className={`h-2 w-2 rounded-full transition-all duration-300 ${
                      activeImgIndex === idx ? "bg-white w-4" : "bg-white/40 hover:bg-white/70"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Thumbnail selector strips - crisp borders and scale transitions */}
          {allImages.length > 1 && (
            <div className="flex flex-wrap gap-2.5 sm:gap-3 py-1 select-none w-full justify-center max-w-full overflow-x-auto no-scrollbar shrink-0">
              {allImages.map((imgUrl, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImgIndex(idx)}
                  className={`relative w-[72px] h-[72px] sm:w-[84px] sm:h-[84px] rounded-2xl overflow-hidden border-2 transition-all duration-300 shrink-0 cursor-pointer ${
                    activeImgIndex === idx 
                      ? "border-[#5346ff] scale-[1.04] shadow-md shadow-[#5346ff]/15 bg-white dark:bg-zinc-900/60" 
                      : isThemeDark
                      ? "border-zinc-800 bg-[#0c0c0e]/40 hover:border-zinc-700 opacity-80"
                      : "border-slate-205 bg-white hover:border-slate-350 opacity-85"
                  }`}
                >
                  <img src={imgUrl} className="w-full h-full object-contain p-1" referrerPolicy="no-referrer" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details Form Section: Apple/Zara premium styling */}
        <div className={`p-6 sm:p-8 md:p-10 flex flex-col justify-between gap-8 ${
          isThemeDark ? "bg-[#09090b] text-white" : "bg-white text-zinc-900"
        }`}>
          <div className="space-y-4">
            <div>
              {/* Title */}
              <h2 className={`text-2xl sm:text-3xl font-extrabold font-sans tracking-tight mb-3 leading-tight ${
                isThemeDark ? "text-white" : "text-zinc-900"
              }`}>
                {product.name}
              </h2>

              {/* Row with Price, Quantity Selector and "Comprar" Button */}
              <div className="flex items-center gap-3 sm:gap-4 mb-6 pb-3 flex-wrap sm:flex-nowrap border-b border-zinc-900/10 dark:border-zinc-800/30">
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl sm:text-3xl font-extrabold text-[#5346ff] tracking-tight">
                      ${Math.round(dynamicPrice)}
                    </span>
                    {isDiscounted && (
                      <span className={`text-[11px] sm:text-xs line-through font-light ${
                        isThemeDark ? "text-zinc-500" : "text-zinc-400"
                      }`}>
                        ${Math.round(product.originalPrice || 0)}
                      </span>
                    )}
                  </div>
                  {/* Subtle Stock Label */}
                  <span className={`text-[9px] font-semibold mt-0.5 ${
                    currentStock > 0 
                      ? (isThemeDark ? "text-zinc-400" : "text-zinc-500")
                      : "text-red-500 font-bold"
                  }`}>
                    Stock: {currentStock > 0 ? `${currentStock} un.` : "Agotado"}
                  </span>
                </div>

                {currentStock > 0 ? (
                  <div className="flex items-center gap-2">
                    {/* Quantity Selector immediately to the right of the price */}
                    <div className={`flex items-center rounded-lg border p-0.5 select-none ${
                      isThemeDark ? "border-zinc-800 bg-zinc-900/60 text-white" : "border-gray-205 bg-gray-50 text-zinc-800"
                    }`}>
                      <button
                        type="button"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={quantity <= 1}
                        className="w-7 h-7 flex items-center justify-center text-zinc-400 hover:text-white disabled:opacity-30 transition cursor-pointer font-bold text-sm"
                      >
                        -
                      </button>
                      <span className="w-6 text-center font-mono font-bold text-xs select-none">{quantity}</span>
                      <button
                        type="button"
                        onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}
                        disabled={quantity >= currentStock}
                        className="w-7 h-7 flex items-center justify-center text-zinc-400 hover:text-white disabled:opacity-30 transition cursor-pointer font-bold text-sm"
                      >
                        +
                      </button>
                    </div>

                    {/* Buy Button */}
                    <button
                      type="button"
                      onClick={handleAddToCart}
                      className="flex items-center justify-center gap-1.5 py-2 px-3.5 sm:px-4 rounded-lg font-bold text-xs bg-[#5346ff] hover:bg-[#4336f5] hover:bg-opacity-90 active:scale-95 text-white tracking-wide shadow-md cursor-pointer transition select-none shrink-0"
                    >
                      <ShoppingCart className="h-3.5 w-3.5" />
                      <span>Comprar (${Math.round(dynamicPrice * quantity)})</span>
                    </button>
                  </div>
                ) : (
                  <div className="text-[10px] text-red-500 font-bold bg-red-500/10 px-3 py-2 rounded-lg flex items-center gap-1 border border-red-500/20 shrink-0">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>Sin Stock disponible</span>
                  </div>
                )}
              </div>

              {/* Description Details Block */}
              <h4 className={`text-[10px] font-bold tracking-[0.18em] uppercase mb-2 ${
                isThemeDark ? "text-zinc-500" : "text-zinc-400"
              }`}>
                DETALLES
              </h4>
              <div 
                className={`text-[13px] sm:text-sm pr-3 leading-relaxed font-sans font-light max-h-[165px] overflow-y-auto custom-description-scrollbar ${
                  isThemeDark ? "text-zinc-400" : "text-zinc-650"
                }`}
                style={{
                  wordBreak: "break-word",
                  overflowWrap: "anywhere"
                }}
              >
                <p className="whitespace-pre-line leading-relaxed">
                  {product.description || "Sin descripción de catálogo disponible."}
                </p>
              </div>
            </div>

            {/* Subtle spacer instead of a separator line */}
            <div className="h-3" />

            {/* Sizes selector matching design ovals */}
            {sizes.length > 0 && (
              <div className="space-y-2">
                <h4 className={`text-[10px] font-bold tracking-[0.15em] uppercase ${
                  isThemeDark ? "text-zinc-400" : "text-zinc-500"
                }`}>
                  TALLE SELECCIONADO:{" "}
                  {selectedSize ? (
                    <span className="text-[#5346ff] font-extrabold">{selectedSize}</span>
                  ) : (
                    <span className="text-red-500 font-bold dark:text-red-400 animate-pulse text-[9px]">(Por favor selecciona un talle)</span>
                  )}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => {
                        setSelectedSize(sz);
                        setQuantity(1); // reset quantity safely
                      }}
                      className={`text-xs px-4 py-1.5 rounded-full border transition-all duration-200 font-bold tracking-wide cursor-pointer select-none ${
                        selectedSize === sz
                          ? "bg-[#5346ff] border-transparent text-white shadow-sm shadow-[#5346ff]/20 scale-[1.02]"
                          : isThemeDark
                          ? "border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-850"
                          : "border-gray-200 bg-white text-zinc-650 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Colors selector matching design ovals */}
            {colors.length > 0 && (
              <div className="space-y-2">
                <h4 className={`text-[10px] font-bold tracking-[0.15em] uppercase ${
                  isThemeDark ? "text-zinc-400" : "text-zinc-500"
                }`}>
                  COLOR SELECCIONADO:{" "}
                  {selectedColor ? (
                    <span className="text-[#5346ff] font-extrabold">{selectedColor}</span>
                  ) : (
                    <span className="text-red-500 font-bold dark:text-red-400 animate-pulse text-[9px]">(Por favor selecciona un color)</span>
                  )}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {colors.map((col) => {
                    const isAc = selectedColor === col;
                    return (
                      <button
                        key={col}
                        type="button"
                        onClick={() => {
                          setSelectedColor(col);
                          setQuantity(1); // reset quantity safely
                        }}
                        className={`text-xs px-4 py-1.5 rounded-full border transition-all duration-200 font-bold tracking-wide cursor-pointer select-none ${
                          isAc
                            ? "bg-[#5346ff] border-transparent text-white shadow-sm shadow-[#5346ff]/20 scale-[1.02]"
                            : isThemeDark
                            ? "border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-850"
                            : "border-gray-200 bg-white text-zinc-650 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {col}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}


          </div>

          {/* Premium call actions: Horizontal 3-column button grid */}
          <div className="space-y-3 pt-4 mt-4">
            <div className="grid grid-cols-3 gap-2 w-full">
              <button
                type="button"
                onClick={handleImmediateWhatsAppQuery}
                className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-2.5 px-1 rounded-lg font-bold text-[10px] sm:text-xs uppercase tracking-wider bg-[#25D366] hover:bg-[#20ba56] text-white duration-200 shadow-xs select-none cursor-pointer transition-all shrink-0"
                title="Consultar por WhatsApp"
              >
                <svg className="h-4 w-4 shrink-0 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.725 1.45 5.234 0 9.492-4.254 9.495-9.489.002-2.536-.983-4.919-2.775-6.713C16.3 2.608 13.924 1.623 11.393 1.623c-5.239 0-9.5 4.255-9.502 9.49 0 1.651.436 3.262 1.262 4.694l-.99 3.614 3.7-.97c1.37.848 2.76 1.284 4.194 1.285zm12.524-7.23c-.104-.173-.388-.277-.813-.49-.425-.21-2.515-1.24-2.903-1.382-.388-.141-.672-.213-.956.213-.284.425-1.098 1.381-1.347 1.664-.25.282-.499.318-.924.106-.425-.212-1.79-.663-3.41-2.11-1.258-1.124-2.107-2.514-2.355-2.938-.247-.424-.026-.654.186-.865.19-.19.425-.495.637-.743.213-.248.284-.424.425-.707.142-.283.07-.531-.035-.743-.106-.212-.956-2.301-1.31-3.15-.345-.828-.696-.716-.957-.73-.248-.013-.531-.015-.814-.015-.283 0-.743.106-1.134.531-.39.424-1.488 1.454-1.488 3.546 0 2.093 1.524 4.11 1.737 4.393.213.284 3.001 4.581 7.271 6.425 1.015.439 1.808.7 2.425.897 1.02.324 1.95.278 2.684.17.818-.12 2.516-1.026 2.87-2.016.353-.99.353-1.84.247-2.017z" />
                </svg>
                <span className="text-[9px] sm:text-[11px]">WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-2.5 px-1 rounded-lg font-bold text-[10px] sm:text-xs uppercase tracking-wider border transition-all duration-200 select-none cursor-pointer ${
                  isThemeDark 
                    ? "border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-900/40 bg-zinc-950/20" 
                    : "border-slate-200 text-zinc-650 hover:bg-slate-50 bg-white"
                }`}
                title="Volver al Catálogo"
              >
                <ChevronLeft className="h-4 w-4 stroke-[2.5]" />
                <span className="text-[9px] sm:text-[11px]">Volver</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const url = `${window.location.origin}/producto/${product.id}`;
                  navigator.clipboard.writeText(url);
                  setCopiedShare(true);
                  setTimeout(() => setCopiedShare(false), 2500);
                }}
                className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-2.5 px-1 rounded-lg font-bold text-[10px] sm:text-xs uppercase tracking-wider border transition-all duration-200 select-none cursor-pointer ${
                  isThemeDark 
                    ? "border-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-900/20" 
                    : "border-slate-100 text-zinc-550 hover:bg-slate-50/50"
                }`}
                title="Compartir o copiar enlace"
              >
                <Share2 className="h-4 w-4 text-sky-500" />
                <span className="text-[9px] sm:text-[11px] truncate">
                  {copiedShare ? "Copiado!" : "Compartir"}
                </span>
              </button>
            </div>

            {addedMessage && (
              <p className="text-xs text-green-500 dark:text-green-400 font-bold text-center animate-pulse">
                ¡Producto añadido al carrito con éxito!
              </p>
            )}
          </div>
        </div>
      </div>

      {/* SECCIÓN DE PRODUCTOS RELACIONADOS */}
      {relatedProducts.length > 0 && (
        <div className="mt-16 sm:mt-24 border-t border-slate-200/50 dark:border-zinc-800/60 pt-12">
          <div className="flex items-center justify-between mb-8">
            <h3 className={`text-lg sm:text-xl font-extrabold tracking-tight ${
              isThemeDark ? "text-white" : "text-zinc-900"
            }`}>
              Productos Relacionados
            </h3>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#5346ff]">
              Te puede interesar
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {relatedProducts.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                settings={settings}
                onAddToCart={(prod, sz, col) => onAddToCart(prod, sz, col, 1)}
                onViewProduct={onViewProduct}
              />
            ))}
          </div>
        </div>
      )}

      {/* Immersive Lightbox Modal */}
      <AnimatePresence>
        {isLightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 backdrop-blur-md p-4 sm:p-6 text-white"
            onClick={() => setIsLightboxOpen(false)}
          >
            {/* Upper control strip */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-[110]">
              <span className="text-white/60 font-mono text-xs font-semibold bg-black/45 backdrop-blur-md px-3 py-1.5 rounded-full select-none">
                {activeImgIndex + 1} / {allImages.length}
              </span>
              <button
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                className="pointer-events-auto p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer shadow-lg border border-white/10"
                title="Cerrar vista ampliada"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Main content viewport */}
            <div 
              className="relative w-full max-w-5xl h-[70vh] sm:h-[80vh] flex items-center justify-center"
              onClick={(e) => e.stopPropagation()} // Prevent clicking the image from closing the lightbox
            >
              <AnimatePresence mode="wait">
                <motion.img
                  key={activeImgIndex}
                  src={allImages[activeImgIndex] || "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80"}
                  alt={product.name}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className="max-h-full max-w-full object-contain rounded-xl select-none"
                  referrerPolicy="no-referrer"
                />
              </AnimatePresence>

              {/* Prev/Next inside lightbox */}
              {allImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handlePrevImg(); }}
                    className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-3 sm:p-4 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white transition-all cursor-pointer z-50 shadow-md border border-white/5"
                  >
                    <ChevronLeft className="h-6 w-6 stroke-[2.5]" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleNextImg(); }}
                    className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-3 sm:p-4 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white transition-all cursor-pointer z-50 shadow-md border border-white/5"
                  >
                    <ChevronRight className="h-6 w-6 stroke-[2.5]" />
                  </button>
                </>
              )}
            </div>

            {/* Bottom thumbnail selector inside fullscreen overlay */}
            {allImages.length > 1 && (
              <div 
                className="mt-6 flex flex-wrap gap-2.5 justify-center max-w-full overflow-x-auto no-scrollbar py-2 shrink-0 relative z-[110]"
                onClick={(e) => e.stopPropagation()}
              >
                {allImages.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImgIndex(idx)}
                    className={`relative w-12 h-12 sm:w-16 sm:h-16 rounded-xl overflow-hidden border-2 transition-all duration-300 shrink-0 cursor-pointer ${
                      activeImgIndex === idx 
                        ? "border-[#5346ff] scale-[1.05] shadow-lg bg-zinc-900" 
                        : "border-white/10 bg-black/40 hover:border-white/30 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img src={imgUrl} className="w-full h-full object-contain p-0.5" referrerPolicy="no-referrer" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
