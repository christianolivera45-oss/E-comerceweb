import { useState } from "react";
import { X, ShoppingCart, MessageSquare, ShieldCheck, Truck, RefreshCw, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 md:p-6 backdrop-blur-sm overflow-y-auto">
      <div
        className={`relative w-full max-w-4xl rounded-3xl overflow-y-auto md:overflow-hidden max-h-[90vh] md:max-h-none shadow-2xl transition-transform duration-300 ${
          isThemeDark ? "bg-zinc-950 border border-zinc-805 text-white" : "bg-white text-zinc-900 border border-gray-150"
        }`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 z-10 rounded-full p-2.5 shadow-md ${
            isThemeDark ? "bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800" : "bg-gray-100 text-zinc-650 hover:text-black hover:bg-gray-200"
          } transition cursor-pointer`}
        >
          <X className="h-5 w-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* CAROUSEL IMAGES VIEW */}
          <div className="flex flex-col bg-slate-50 dark:bg-zinc-900/30 p-4 md:p-6 justify-center items-center relative gap-4 border-r border-slate-100 dark:border-zinc-900">
            <div className="relative aspect-square w-full max-w-[380px] rounded-2xl overflow-hidden border border-slate-200 dark:border-zinc-800/80 bg-zinc-950/20 shadow-inner group">
              <img
                src={allImages[activeImgIndex] || "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80"}
                alt={product.name}
                className="h-full w-full object-cover object-center transition-all duration-300"
                referrerPolicy="no-referrer"
              />
              
              {isDiscounted && (
                <span className="absolute top-4 left-4 bg-red-600 text-white font-extrabold text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-full shadow-md">
                  Oferta Especial
                </span>
              )}

              {/* Navigation arrows for gallery images */}
              {allImages.length > 1 && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); handlePrevImg(); }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition duration-200 hover:bg-black/75 cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleNextImg(); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition duration-200 hover:bg-black/75 cursor-pointer"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail selector strips */}
            {allImages.length > 1 && (
              <div className="flex flex-wrap gap-2 py-1 select-none w-full justify-center max-w-[380px]">
                {allImages.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImgIndex(idx)}
                    className={`relative w-12 h-12 rounded-lg overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                      activeImgIndex === idx 
                        ? "border-indigo-600 scale-105 shadow" 
                        : "border-slate-200/50 dark:border-zinc-800 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img src={imgUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details Form Section */}
          <div className="p-6 md:p-8 flex flex-col justify-between">
            <div>
              {/* Category */}
              <span className="text-xs font-semibold tracking-widest uppercase text-zinc-500 block mb-1">
                {product.category}
              </span>

              {/* Title */}
              <h2 className="text-xl md:text-2xl font-bold font-sans tracking-tight mb-2 leading-tight">
                {product.name}
              </h2>

              {/* Price Row */}
              <div className="flex items-baseline gap-3 mb-4">
                <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                  ${dynamicPrice.toFixed(2)}
                </span>
                {isDiscounted && (
                  <span className="text-sm text-zinc-500 line-through">
                    ${product.originalPrice?.toFixed(2)}
                  </span>
                )}
              </div>

              {/* Description */}
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">Detalles</h3>
              <p className={`text-sm mb-6 leading-relaxed ${isThemeDark ? "text-zinc-300" : "text-zinc-650"}`}>
                {product.description || "Sin descripción detallada por el momento."}
              </p>

              {/* Sizes choosing */}
              {sizes.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5 flex justify-between">
                    <span>Talla Seleccionada:</span>
                    <span className="text-[10px] text-zinc-500 font-mono font-bold uppercase">{selectedSize || "Ninguno"}</span>
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {sizes.map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => {
                          setSelectedSize(sz);
                          setQuantity(1); // reset quantity safely
                        }}
                        className={`font-mono text-xs px-3.5 py-1.5 rounded-xl border transition-all cursor-pointer ${
                          selectedSize === sz
                            ? "bg-indigo-600 border-transparent text-white font-bold scale-105 shadow-sm"
                            : isThemeDark
                            ? "border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-700"
                            : "border-gray-200 bg-white text-zinc-650 hover:bg-gray-100"
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Colors choosing */}
              {colors.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5 flex justify-between">
                    <span>Color Seleccionado:</span>
                    <span className="text-[10px] text-zinc-505 font-mono font-bold uppercase">{selectedColor || "Ninguno"}</span>
                  </h3>
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
                          className={`text-xs px-3.5 py-1.5 rounded-xl border transition cursor-pointer ${
                            isAc
                              ? "bg-indigo-600 border-transparent text-white font-bold scale-105 shadow-sm"
                              : isThemeDark
                              ? "border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700"
                              : "border-gray-200 bg-white text-zinc-650 hover:bg-gray-100"
                          }`}
                        >
                          {col}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quantity Selecting & Stock Indicators */}
              <div className="flex items-center gap-4 mb-6">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">Cantidad</h3>
                  {currentStock > 0 ? (
                    <div className={`flex items-center rounded-xl border inline-flex ${
                      isThemeDark ? "border-zinc-800 bg-zinc-900" : "border-gray-200 bg-gray-50"
                    }`}>
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={quantity <= 1}
                        className="px-3.5 py-1.5 text-zinc-400 hover:text-white disabled:opacity-40 transition cursor-pointer font-bold"
                      >
                        -
                      </button>
                      <span className="px-3 font-mono font-bold text-sm select-none">{quantity}</span>
                      <button
                        onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}
                        disabled={quantity >= currentStock}
                        className="px-3.5 py-1.5 text-zinc-400 hover:text-white disabled:opacity-40 transition cursor-pointer font-bold"
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <div className="text-[11px] text-red-500 font-bold bg-red-500/10 p-2 rounded-lg flex items-center gap-1.5 border border-red-500/20">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>Temporalmente Agotada</span>
                    </div>
                  )}
                </div>
                
                {currentStock > 0 && (
                  <div className="text-xs text-zinc-450 self-end mb-1">
                    Disponibles: <strong className="font-mono text-zinc-500 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-900 px-2 py-0.5 rounded">{currentStock} un.</strong>
                  </div>
                )}
              </div>
            </div>

            {/* Actions Bar */}
            <div className="space-y-3">
              {currentStock > 0 ? (
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-700 text-white tracking-wide shadow-lg cursor-pointer transform hover:-translate-y-0.5 transition active:translate-y-0"
                >
                  <ShoppingCart className="h-4 w-4" />
                  Añadir al Carrito (${(dynamicPrice * quantity).toFixed(2)})
                </button>
              ) : (
                <div className="w-full text-center py-2.5 px-4 rounded-xl font-bold bg-zinc-800/80 text-zinc-500 cursor-not-allowed text-xs uppercase tracking-widest border border-zinc-800">
                  Sin Stock Disponible
                </div>
              )}

              <button
                type="button"
                onClick={handleImmediateWhatsAppQuery}
                className={`w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-semibold text-xs border ${
                  isThemeDark ? "border-zinc-800 text-emerald-400 hover:bg-zinc-900/50" : "border-gray-200 text-emerald-600 hover:bg-gray-50"
                } transition-colors cursor-pointer`}
              >
                <MessageSquare className="h-4 w-4 text-emerald-500" />
                Consultar disponibilidad por WhatsApp
              </button>

              {addedMessage && (
                <p className="text-xs text-green-500 dark:text-green-400 font-bold text-center animate-pulse">
                  ¡Producto añadido al carrito con éxito!
                </p>
              )}

              {/* Guarantees info */}
              <div className="grid grid-cols-3 gap-2 pt-4 border-t border-dashed border-zinc-200 dark:border-zinc-800 text-[10px] text-zinc-455 text-center">
                <div className="flex flex-col items-center">
                  <ShieldCheck className="h-4 w-4 text-zinc-500 dark:text-zinc-500 mb-1" />
                  <span>Pago Seguro Coor.</span>
                </div>
                <div className="flex flex-col items-center">
                  <Truck className="h-4 w-4 text-zinc-500 dark:text-zinc-500 mb-1" />
                  <span>Envíos Prioritarios</span>
                </div>
                <div className="flex flex-col items-center">
                  <RefreshCw className="h-4 w-4 text-zinc-500 dark:text-zinc-505 mb-1" />
                  <span>Cambios de Talle</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
