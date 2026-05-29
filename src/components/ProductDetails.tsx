import { useState } from "react";
import { X, ShoppingCart, MessageSquare, ShieldCheck, Truck, RefreshCw, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Product, SiteSettings } from "../types";

interface ProductDetailsProps {
  product: Product;
  onClose: () => void;
  onAddToCart: (product: Product, size?: string, color?: string, quantity?: number) => void;
  settings: SiteSettings;
}

export default function ProductDetails({
  product,
  onClose,
  onAddToCart,
  settings
}: ProductDetailsProps) {
  const isThemeDark = settings.themeMode === "dark";
  const isClothing = product.category.toLowerCase() === "ropa" || (product.sizes && product.sizes.length > 0);
  const isElectronics = product.category.toLowerCase() === "artículos electrónicos";

  // Dynamic variants logic
  const variants = product.variants || [];
  const hasVariants = variants.length > 0;

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

  // Pre-initialize selectors
  const [selectedSize, setSelectedSize] = useState(() => {
    return sizes.length > 0 ? sizes[0] : "";
  });

  const [selectedColor, setSelectedColor] = useState(() => {
    return colors.length > 0 ? colors[0] : "";
  });

  const [quantity, setQuantity] = useState(1);
  const [addedMessage, setAddedMessage] = useState(false);

  // Dynamic stock calculations based on Cartesian variant mapping
  let currentStock = product.stock;
  let dynamicPrice = product.price;
  let matchedVariant: any = null;

  if (hasVariants && selectedSize && selectedColor) {
    matchedVariant = variants.find(v => v.size === selectedSize && v.color === selectedColor);
    if (matchedVariant) {
      currentStock = matchedVariant.stock;
      dynamicPrice = product.price + (matchedVariant.priceDelta || 0);
    } else {
      currentStock = 0; // This specific combo isn't defined or holds 0 stock
    }
  }

  // Dynamic Image carousels
  const allImages = [product.imageUrl, ...(product.imagenes || [])].filter(Boolean);
  const [activeImgIndex, setActiveImgIndex] = useState(0);

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
    const colorToPass = colors.length > 0 ? selectedColor || colors[0] : undefined;
    
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
${selectedSize ? `👉 Talle seleccionado: ${selectedSize}\n` : ""}${selectedColor ? `👉 Color deseado: ${selectedColor}\n` : ""}Precio actual del catálogo: $${dynamicPrice.toFixed(2)}
Me gustaría saber disponibilidad de stock y métodos de envío.`;

    const cleanPhone = settings.whatsappNumber.replace(/[^0-9]/g, "");
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
    window.open(waUrl, "_blank", "referrer");
  };

  const isDiscounted = product.originalPrice && product.originalPrice > dynamicPrice;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 md:p-6 backdrop-blur-xs">
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
        className={`relative w-[96vw] md:w-[92vw] max-w-5xl rounded-[32px] overflow-hidden flex flex-col md:grid md:grid-cols-[63%_37%] h-auto max-h-[92vh] md:h-[620px] shadow-2xl transition-all duration-300 ${
          isThemeDark ? "bg-[#0a0a0a] border border-zinc-850 text-white" : "bg-white text-zinc-900 border border-gray-150"
        }`}
      >
        {/* Close Button: Luxurious, circular with backdrop dark glass */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 rounded-full p-2 bg-black/40 text-zinc-400 hover:text-white hover:bg-black/60 border border-zinc-800/45 transition duration-200 cursor-pointer"
          title="Cerrar vista rápida"
        >
          <X className="h-4 w-4" />
        </button>
 
        {/* Left Column: Image Area with soft light gray background, clean white inner card holding the product picture */}
        <div className="flex flex-col bg-[#f5f5f7] dark:bg-zinc-900/10 p-4 sm:p-5 md:p-6 lg:p-7 justify-between items-center relative gap-4 border-b md:border-b-0 md:border-r border-slate-200/30 overflow-hidden shrink-0 h-auto md:h-full w-full">
          
          {/* Main card for product details */}
          <div className="relative w-full h-[240px] sm:h-[310px] md:h-[430px] bg-white dark:bg-zinc-900/35 rounded-[28px] shadow-xs border border-slate-200/30 dark:border-zinc-805/50 flex items-center justify-center p-4 sm:p-6 select-none overflow-hidden">
            
            <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.img
                  key={activeImgIndex}
                  src={allImages[activeImgIndex] || "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80"}
                  alt={product.name}
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.03 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className="max-h-full max-w-full object-contain select-none"
                  referrerPolicy="no-referrer"
                />
              </AnimatePresence>
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
                  className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-md border border-slate-100 dark:border-zinc-850 hover:scale-105 active:scale-95 transition-all cursor-pointer z-10"
                >
                  <ChevronLeft className="h-4 w-4 stroke-[2.5]" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleNextImg(); }}
                  className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-md border border-slate-100 dark:border-zinc-850 hover:scale-105 active:scale-95 transition-all cursor-pointer z-10"
                >
                  <ChevronRight className="h-4 w-4 stroke-[2.5]" />
                </button>
              </>
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
                      ? "border-zinc-805 bg-zinc-900/30 hover:border-zinc-700 opacity-80"
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
        <div className={`p-6 sm:p-7 md:p-8 flex flex-col justify-between overflow-y-auto flex-1 h-full no-scrollbar ${
          isThemeDark ? "bg-[#0a0a0a] text-white" : "bg-white text-zinc-900"
        }`}>
          <div className="space-y-4">
            <div>
              {/* Title */}
              <h2 className={`text-xl sm:text-2xl font-bold font-sans tracking-tight mb-2 leading-tight ${
                isThemeDark ? "text-zinc-100" : "text-zinc-850"
              }`}>
                {product.name}
              </h2>

              {/* Price */}
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-xl sm:text-2xl font-bold text-[#5346ff] tracking-tight">
                  ${dynamicPrice.toFixed(2)}
                </span>
                {isDiscounted && (
                  <span className={`text-xs line-through ${
                    isThemeDark ? "text-zinc-500" : "text-zinc-400"
                  }`}>
                    ${product.originalPrice?.toFixed(2)}
                  </span>
                )}
              </div>

              {/* Description Details Block */}
              <h4 className={`text-[10px] font-bold tracking-[0.15em] uppercase mb-1.5 ${
                isThemeDark ? "text-zinc-500" : "text-zinc-400"
              }`}>
                DETALLES
              </h4>
              <div 
                className={`text-xs max-h-20 overflow-y-auto pr-1 leading-relaxed no-scrollbar font-sans ${
                  isThemeDark ? "text-zinc-400" : "text-zinc-650"
                }`}
                style={{
                  wordBreak: "break-word",
                  overflowWrap: "anywhere"
                }}
              >
                <p className="whitespace-pre-line">
                  {product.description || "Sin descripción de catálogo disponible."}
                </p>
              </div>
            </div>

            {/* Separator Line */}
            <div className={`h-[1px] w-full ${isThemeDark ? "bg-zinc-850" : "bg-gray-100"}`} />

            {/* Sizes selector matching design ovals */}
            {sizes.length > 0 && (
              <div className="space-y-2">
                <h4 className={`text-[10px] font-bold tracking-[0.15em] uppercase ${
                  isThemeDark ? "text-zinc-400" : "text-zinc-500"
                }`}>
                  TALLA SELECCIONADA:
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
                  COLOR SELECCIONADO:
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

            {/* Quantity select counter with stock badge */}
            <div className="space-y-2">
              <h4 className={`text-[10px] font-bold tracking-[0.15em] uppercase ${
                isThemeDark ? "text-zinc-400" : "text-zinc-500"
              }`}>
                CANTIDAD
              </h4>
              <div className="flex items-center gap-4">
                {currentStock > 0 ? (
                  <div className={`flex items-center rounded-lg border px-1 py-0.5 select-none ${
                    isThemeDark ? "border-zinc-800 bg-zinc-900 text-white" : "border-gray-205 bg-gray-50 text-zinc-800"
                  }`}>
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                      className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white disabled:opacity-30 transition cursor-pointer font-bold text-sm"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-mono font-bold text-xs select-none">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}
                      disabled={quantity >= currentStock}
                      className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white disabled:opacity-30 transition cursor-pointer font-bold text-sm"
                    >
                      +
                    </button>
                  </div>
                ) : (
                  <div className="text-[10px] text-red-500 font-bold bg-red-500/10 p-1.5 rounded-lg flex items-center gap-1 border border-red-500/20">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>Sin stock momentáneamente</span>
                  </div>
                )}

                {currentStock > 0 && (
                  <div className={`text-xs flex items-center gap-2 font-medium ${
                    isThemeDark ? "text-zinc-400" : "text-zinc-500"
                  }`}>
                    <span>Disponibles:</span>
                    <span className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded ${
                      isThemeDark ? "bg-white text-zinc-950" : "bg-zinc-900 text-white"
                    }`}>
                      {currentStock} un.
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Premium call actions: solid add-to-cart button and elegant green outline whatsapp button */}
          <div className="space-y-3 pt-4 border-t border-zinc-900 mt-4">
            {currentStock > 0 ? (
              <button
                type="button"
                onClick={handleAddToCart}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl font-bold text-xs bg-[#5346ff] hover:bg-[#4336f5] text-white tracking-wide shadow-md cursor-pointer transform hover:-translate-y-0.5 transition active:translate-y-0 select-none"
              >
                <ShoppingCart className="h-4 w-4" />
                Añadir al Carrito (${(dynamicPrice * quantity).toFixed(2)})
              </button>
            ) : (
              <div className="w-full text-center py-2 px-3 rounded-xl font-bold bg-zinc-800/80 text-zinc-555 cursor-not-allowed text-[10px] uppercase tracking-widest border border-zinc-800">
                Sin Stock Disponible
              </div>
            )}

            <button
              type="button"
              onClick={handleImmediateWhatsAppQuery}
              className={`w-full flex items-center justify-center gap-2 py-3 px-5 rounded-xl font-bold text-xs border cursor-pointer transition-all duration-200 select-none ${
                isThemeDark 
                  ? "border-[#00c26f]/30 text-[#00c26f] hover:bg-[#00c26f]/5 hover:border-[#00c26f]" 
                  : "border-emerald-200 text-emerald-600 hover:bg-emerald-50 bg-white"
              }`}
              style={{
                color: isThemeDark ? "#00c26f" : undefined,
                borderColor: isThemeDark ? "rgba(0, 194, 111, 0.3)" : undefined
              }}
            >
              <MessageSquare className="h-4 w-4 text-emerald-500" />
              Consultar disponibilidad por WhatsApp
            </button>

            {addedMessage && (
              <p className="text-xs text-green-500 dark:text-green-400 font-bold text-center animate-pulse">
                ¡Producto añadido al carrito con éxito!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
