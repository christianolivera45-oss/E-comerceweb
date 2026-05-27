import { useState } from "react";
import { X, ShoppingCart, MessageSquare, ShieldCheck, Truck, RefreshCw } from "lucide-react";
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
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [addedMessage, setAddedMessage] = useState(false);

  const isThemeDark = settings.themeMode === "dark";
  const isClothing = product.category.toLowerCase() === "ropa" || (product.sizes && product.sizes.length > 0);
  const isElectronics = product.category.toLowerCase() === "artículos electrónicos";

  // Optional custom or mock variant options
  const sizes = product.sizes && product.sizes.length > 0 
    ? product.sizes 
    : (isClothing ? ["S", "M", "L", "XL"] : []);

  const colors = product.colors && product.colors.length > 0
    ? product.colors
    : (isClothing 
      ? ["Negro", "Gris", "Blanco"] 
      : isElectronics 
      ? ["Negro mate", "Plata espacial", "Azul cobalto"] 
      : ["Estándar"]);

  const handleAddToCart = () => {
    if (sizes.length > 0 && !selectedSize) {
      alert("Por favor selecciona un talle.");
      return;
    }
    const colorToPass = colors.length > 0 ? selectedColor || colors[0] : undefined;
    onAddToCart(product, selectedSize || undefined, colorToPass, quantity);
    
    // Show confirmation
    setAddedMessage(true);
    setTimeout(() => {
      setAddedMessage(false);
    }, 2000);
  };

  const handleImmediateWhatsAppQuery = () => {
    const text = `Hola Apex Outlet! Me interesa obtener más información sobre este artículo:
*${product.name}*
${selectedSize ? `👉 Talle seleccionado: ${selectedSize}\n` : ""}${selectedColor ? `👉 Color deseado: ${selectedColor}\n` : ""}Precio actual del catálogo: $${product.price}
Me gustaría saber disponibilidad y formas de envío.`;

    const cleanPhone = settings.whatsappNumber.replace(/[^0-9]/g, "");
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
    window.open(waUrl, "_blank", "referrer");
  };

  const isDiscounted = product.originalPrice && product.originalPrice > product.price;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 md:p-6 backdrop-blur-sm overflow-y-auto">
      <div
        className={`relative w-full max-w-4xl rounded-3xl overflow-y-auto md:overflow-hidden max-h-[90vh] md:max-h-none shadow-2xl transition-transform duration-300 ${
          isThemeDark ? "bg-zinc-950 border border-zinc-800 text-white" : "bg-white text-zinc-900 border border-gray-150"
        }`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 z-10 rounded-full p-2.5 shadow-md ${
            isThemeDark ? "bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800" : "bg-gray-150 text-zinc-600 hover:text-black hover:bg-gray-200"
          } transition`}
        >
          <X className="h-5 w-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Images Section */}
          <div className="relative aspect-square md:aspect-auto md:h-full min-h-[320px] bg-zinc-900/40">
            <img
              src={product.imageUrl || "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80"}
              alt={product.name}
              className="h-full w-full object-cover object-center"
              referrerPolicy="no-referrer"
            />
            {isDiscounted && (
              <span className="absolute bottom-4 left-4 bg-red-500 text-white font-bold text-xs px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
                Promoción Especial
              </span>
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
                <span className="text-2xl font-black theme-text-primary">
                  ${product.price.toFixed(2)}
                </span>
                {isDiscounted && (
                  <span className="text-sm text-zinc-500 line-through">
                    ${product.originalPrice?.toFixed(2)}
                  </span>
                )}
              </div>

              {/* Description */}
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">Descripción corta</h3>
              <p className={`text-sm mb-6 leading-relaxed ${isThemeDark ? "text-zinc-300" : "text-zinc-600"}`}>
                {product.description}
              </p>

              {/* Sizes choosing */}
              {sizes.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">Selecciona un Talle:</h3>
                  <div className="flex gap-2">
                    {sizes.map((sz) => (
                      <button
                        key={sz}
                        onClick={() => setSelectedSize(sz)}
                        className={`font-mono text-sm px-4 py-2 rounded-xl border transition-all ${
                          selectedSize === sz
                            ? "theme-btn-primary scale-105 border-transparent"
                            : isThemeDark
                            ? "border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-700"
                            : "border-gray-200 bg-white text-zinc-700 hover:bg-gray-50"
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
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">Selecciona un Color:</h3>
                  <div className="flex flex-wrap gap-2">
                    {colors.map((col) => (
                      <button
                        key={col}
                        onClick={() => setSelectedColor(col)}
                        className={`text-xs px-3 py-2 rounded-xl border transition ${
                          selectedColor === col || (!selectedColor && col === colors[0])
                            ? "theme-btn-accent scale-105 border-transparent font-medium"
                            : isThemeDark
                            ? "border-zinc-800 bg-zinc-900 text-zinc-400"
                            : "border-gray-200 bg-white text-zinc-600"
                        }`}
                      >
                        {col}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity Choosing */}
              <div className="flex items-center gap-4 mb-6">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">Cantidad</h3>
                  <div className={`flex items-center rounded-xl border inline-flex ${
                    isThemeDark ? "border-zinc-800 bg-zinc-900" : "border-gray-200 bg-gray-50"
                  }`}>
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-3 py-1.5 text-zinc-400 hover:text-white transition"
                    >
                      -
                    </button>
                    <span className="px-3 font-mono text-sm">{quantity}</span>
                    <button
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      className="px-3 py-1.5 text-zinc-400 hover:text-white transition"
                    >
                      +
                    </button>
                  </div>
                </div>
                
                <div className="text-xs text-zinc-400 self-end mb-1">
                  En stock: <strong className="font-mono text-zinc-300">{product.stock} unidades</strong>
                </div>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="space-y-3">
              {product.stock > 0 ? (
                <button
                  onClick={handleAddToCart}
                  className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-bold text-sm theme-btn-primary tracking-wide shadow-lg cursor-pointer transform hover:-translate-y-0.5 transition active:translate-y-0"
                >
                  <ShoppingCart className="h-4 w-4" />
                  Añadir al Carrito (${(product.price * quantity).toFixed(2)})
                </button>
              ) : (
                <div className="w-full text-center py-2 px-4 rounded-xl font-bold bg-zinc-800/80 text-zinc-500 cursor-not-allowed text-xs uppercase tracking-widest">
                  Sin Stock Disponible
                </div>
              )}

              <button
                onClick={handleImmediateWhatsAppQuery}
                className={`w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-semibold text-xs border ${
                  isThemeDark ? "border-zinc-800 text-emerald-400 hover:bg-zinc-900/50" : "border-gray-200 text-emerald-600 hover:bg-gray-50"
                } transition-colors cursor-pointer`}
              >
                <MessageSquare className="h-4 w-4 text-emerald-500" />
                Preguntar disponibilidad por WhatsApp
              </button>

              {addedMessage && (
                <p className="text-xs text-green-400 font-medium text-center animate-pulse">
                  ¡Producto añadido al carrito con éxito!
                </p>
              )}

              {/* Guarantees info */}
              <div className="grid grid-cols-3 gap-2 pt-4 border-t border-dashed border-zinc-800 text-[10px] text-zinc-400 text-center">
                <div className="flex flex-col items-center">
                  <ShieldCheck className="h-4 w-4 text-zinc-500 mb-1" />
                  <span>Pago Seguro Coor.</span>
                </div>
                <div className="flex flex-col items-center">
                  <Truck className="h-4 w-4 text-zinc-500 mb-1" />
                  <span>Envío Prioritario</span>
                </div>
                <div className="flex flex-col items-center">
                  <RefreshCw className="h-4 w-4 text-zinc-500 mb-1" />
                  <span>Cambio de Talle</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
