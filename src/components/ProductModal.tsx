import React, { useState } from 'react';
import { Product } from '../types';
import { useStore } from '../context/StoreContext';
import { X, ShoppingCart, Send, ChevronLeft, ChevronRight, Check, Package, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ProductModalProps {
  product: Product;
  onClose: () => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({ product, onClose }) => {
  const { addToCart, settings } = useStore();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addedTemp, setAddedTemp] = useState(false);

  const imagesList = product.images.length > 0 ? product.images : ['https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600'];

  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
  const discountPercent = hasDiscount 
    ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
    : 0;

  const isOutOfStock = product.stock <= 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(value);
  };

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setAddedTemp(true);
    setTimeout(() => {
      setAddedTemp(false);
    }, 2000);
  };

  const handleWhatsAppBuyNow = () => {
    const formattedPrice = formatCurrency(product.price);
    const message = `¡Hola! Me interesa comprar este producto desde la tienda web:\n\n` +
      `📦 *${product.name}*\n` +
      `🔢 Cantidad: ${quantity}\n` +
      `💵 Precio Unitario: ${formattedPrice}\n` +
      `💰 Total: ${formatCurrency(product.price * quantity)}\n\n` +
      `¿Tienen disponibilidad para coordinar el envío/pago?`;

    const encodedText = encodeURIComponent(message);
    const whatsappNum = settings.whatsappNumber || '541123456789';
    window.open(`https://wa.me/${whatsappNum}?text=${encodedText}`, '_blank');
  };

  // Gallery Navigation helpers
  const nextImage = () => {
    setActiveImageIndex((prev) => (prev + 1) % imagesList.length);
  };

  const prevImage = () => {
    setActiveImageIndex((prev) => (prev - 1 + imagesList.length) % imagesList.length);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/40 backdrop-blur-xs"
        />

        {/* Modal Window Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white border border-gray-200 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl z-10 text-gray-900 flex flex-col md:flex-row"
        >
          {/* Close button top right */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 rounded-xl bg-white text-gray-700 hover:text-black border border-gray-200 shadow-sm focus:outline-none transition-transform active:scale-95"
            id="close-product-modal"
          >
            <X size={20} />
          </button>

          {/* Left panel: Media Slider */}
          <div className="md:w-1/2 p-6 flex flex-col justify-between border-b md:border-b-0 md:border-r border-gray-200">
            <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-gray-50 flex items-center justify-center border border-gray-250 group">
              <img
                src={imagesList[activeImageIndex]}
                alt={product.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />

              {imagesList.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-3 p-2 bg-white/90 hover:bg-white text-gray-950 rounded-lg border border-gray-220 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-3 p-2 bg-white/90 hover:bg-white text-gray-950 rounded-lg border border-gray-220 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                  >
                    <ChevronRight size={16} />
                  </button>
                </>
              )}

              {/* Discount Tag */}
              {hasDiscount && (
                <span className="absolute top-4 left-4 bg-red-600 text-white font-mono font-bold text-xs py-1 px-3 rounded-lg shadow-md">
                  -{discountPercent}% OFF
                </span>
              )}
            </div>

            {/* Thumbnail switcher */}
            {imagesList.length > 1 && (
              <div className="flex gap-2.5 mt-4 overflow-x-auto pb-1 max-w-full">
                {imagesList.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImageIndex(i)}
                    className={`relative h-14 w-14 rounded-xl overflow-hidden border-2 shrink-0 ${
                      activeImageIndex === i ? 'border-black scale-95' : 'border-gray-200 grayscale hover:grayscale-0'
                    } transition-all`}
                  >
                    <img src={img} alt="thumbnail" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right panel: Information details */}
          <div className="md:w-1/2 p-6 sm:p-8 flex flex-col justify-between">
            <div className="space-y-5">
              {/* Category label */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-mono tracking-widest text-gray-700 px-2.5 py-1 bg-gray-150 border border-gray-200 rounded-md">
                  {product.categories[0] || 'General'}
                </span>
                {product.featured && (
                  <span className="text-[10px] uppercase font-mono tracking-widest text-gray-900 px-2.5 py-1 bg-gray-100 border border-gray-250 rounded-md flex items-center gap-1 font-semibold">
                    <Sparkles size={11} className="text-yellow-500 animate-pulse" />
                    <span>Selección Premium</span>
                  </span>
                )}
              </div>

              {/* Title & Stats */}
              <div>
                <h2 className="text-2xl sm:text-3xl font-sans font-bold text-gray-950 tracking-tight">{product.name}</h2>
                <div className="flex items-center gap-2.5 mt-2 text-xs font-mono text-gray-500">
                  <Package size={14} className="text-gray-400" />
                  <span>Stock disponible: {product.stock} unidades</span>
                </div>
              </div>

              {/* Pricing section */}
              <div className="bg-gray-50 border border-gray-200 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-mono text-gray-500 uppercase tracking-widest">Precio Especial</p>
                  <div className="flex items-baseline gap-2 pt-0.5">
                    <span className="text-3xl font-black text-gray-955 tracking-tight animate-none">
                      {formatCurrency(product.price)}
                    </span>
                    {hasDiscount && (
                      <span className="text-gray-400 line-through text-sm font-mono">
                        {formatCurrency(product.originalPrice!)}
                      </span>
                    )}
                  </div>
                </div>

                {hasDiscount && (
                  <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 py-1.5 px-3.5 rounded-xl text-xs font-mono text-center sm:text-right font-semibold">
                    <span>Ahorrás {formatCurrency(product.originalPrice! - product.price)}</span>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <p className="text-xs uppercase font-mono tracking-wider text-gray-400">Descripción</p>
                <p className="text-gray-650 text-sm leading-relaxed max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                  {product.description}
                </p>
              </div>
            </div>

            {/* Interactive Buy widgets */}
            <div className="pt-6 mt-6 border-t border-gray-200 space-y-4">
              {!isOutOfStock ? (
                <>
                  {/* Quantity selector control */}
                  <div className="flex items-center justify-between bg-gray-50 p-2.5 rounded-xl border border-gray-200">
                    <span className="text-xs text-gray-500 font-mono tracking-tight pl-2">Especificar Cantidad</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={quantity <= 1}
                        className="h-8 w-8 rounded-lg bg-white border border-gray-200 hover:bg-gray-100 disabled:opacity-40 disabled:pointer-events-none text-gray-800 font-bold transition-colors shadow-sm"
                      >
                        -
                      </button>
                      <span className="w-10 text-center font-mono text-sm font-bold">{quantity}</span>
                      <button
                        onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                        disabled={quantity >= product.stock}
                        className="h-8 w-8 rounded-lg bg-white border border-gray-200 hover:bg-gray-100 disabled:opacity-40 disabled:pointer-events-none text-gray-800 font-bold transition-colors shadow-sm"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={handleAddToCart}
                      className={`flex items-center justify-center gap-2 rounded-xl border font-bold py-3 px-4 text-sm tracking-tight transition-all active:scale-95 ${
                        addedTemp 
                          ? 'bg-emerald-600 border-emerald-750 text-white font-semibold' 
                          : 'bg-black hover:bg-zinc-900 border-black text-white font-semibold shadow-sm'
                      }`}
                      id="modal-add-to-cart"
                    >
                      {addedTemp ? <Check size={16} /> : <ShoppingCart size={16} />}
                      <span>{addedTemp ? '¡Agregado!' : 'Agregar al Carrito'}</span>
                    </button>

                    <button
                      onClick={handleWhatsAppBuyNow}
                      className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 text-sm tracking-tight shadow-md transition-all active:scale-95"
                      id="modal-whatsapp-checkout"
                    >
                      <Send size={15} />
                      <span>Comprar por WhatsApp</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="bg-red-50 border border-red-100 p-4 rounded-xl text-center">
                  <p className="text-red-700 font-bold text-sm tracking-wide">Temporalmente sin stock</p>
                  <p className="text-xs text-red-600 pt-1 font-mono">Dejanos tu contacto para avisarte cuando vuelva a ingresar.</p>
                </div>
              )}
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
