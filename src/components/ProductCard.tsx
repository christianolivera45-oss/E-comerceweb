import React from 'react';
import { Product } from '../types';
import { ShoppingCart, Eye, Sparkles } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onViewClick: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onViewClick,
  onAddToCart
}) => {
  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
  const discountPercent = hasDiscount 
    ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
    : 0;

  const isOutOfStock = product.stock <= 0;

  // Format price in local currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="group relative bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-gray-300 transition-all duration-300 flex flex-col h-full shadow-sm hover:shadow-md">
      
      {/* Product Image and Overlay Tools */}
      <div className="relative aspect-square overflow-hidden bg-gray-50 block cursor-pointer" onClick={() => onViewClick(product)}>
        <img
          src={product.images[0] || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400'}
          alt={product.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Promotion and discount labels */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {hasDiscount && (
            <span className="bg-red-650 text-white font-mono font-extrabold text-[10px] tracking-wider uppercase py-1 px-2.5 rounded-lg shadow-sm">
              -{discountPercent}% OFF
            </span>
          )}
          {product.featured && (
            <span className="bg-black text-white font-semibold font-mono text-[10px] tracking-wide uppercase py-1 px-2.5 rounded-lg shadow-sm flex items-center gap-1">
              <Sparkles size={10} className="text-yellow-400" />
              <span>Destacado</span>
            </span>
          )}
        </div>

        {/* Stock warnings */}
        {isOutOfStock ? (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-[1px] z-10 flex items-center justify-center">
            <span className="bg-white border border-red-200 text-red-600 font-bold font-mono text-[11px] uppercase tracking-widest py-1.5 px-4 rounded-xl shadow-md">
              Sin Stock
            </span>
          </div>
        ) : product.stock <= 3 ? (
          <div className="absolute bottom-3 left-3 z-10">
            <span className="bg-orange-600/95 backdrop-blur-sm text-white font-bold font-mono text-[9px] uppercase tracking-wider py-1 px-2 rounded-md">
              Sólo {product.stock} restantes
            </span>
          </div>
        ) : null}

        {/* Action Button Overlays on Hover */}
        <div className="absolute inset-0 bg-gray-900/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 z-15">
          <button
            onClick={() => onViewClick(product)}
            className="p-3 bg-white text-gray-900 rounded-xl border border-gray-200 hover:bg-gray-50 hover:scale-110 active:scale-95 transition-all shadow-md"
            title="Ver detalles"
          >
            <Eye size={18} />
          </button>
          {!isOutOfStock && (
            <button
              onClick={() => onAddToCart(product)}
              className="p-3 bg-black text-white rounded-xl hover:bg-zinc-900 hover:scale-110 active:scale-95 transition-all shadow-md"
              title="Agregar al Carrito"
            >
              <ShoppingCart size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Product Content description info */}
      <div className="p-5 flex-grow flex flex-col justify-between">
        <div className="space-y-2">
          {/* Categories tag */}
          <p className="text-[10px] uppercase font-mono tracking-widest text-gray-500 font-semibold">
            {product.categories[0] || 'General'}
          </p>

          <h3 
            onClick={() => onViewClick(product)}
            className="font-sans font-bold text-base text-gray-900 group-hover:text-black hover:underline line-clamp-1 cursor-pointer transition-colors"
          >
            {product.name}
          </h3>

          <p className="text-gray-500 text-xs line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Price and Cart controls */}
        <div className="mt-5 pt-4 border-t border-gray-150 flex items-center justify-between">
          <div className="flex flex-col">
            {hasDiscount && (
              <span className="text-gray-400 line-through text-xs font-mono">
                {formatCurrency(product.originalPrice!)}
              </span>
            )}
            <span className="text-lg font-bold text-gray-900 tracking-tight">
              {formatCurrency(product.price)}
            </span>
          </div>

          {!isOutOfStock && (
            <button
              onClick={() => onAddToCart(product)}
              className="group-hover:bg-black group-hover:text-white flex items-center gap-1.5 justify-center rounded-xl bg-gray-100 border border-transparent text-gray-800 text-xs font-semibold py-2 px-3.5 tracking-tight transition-all active:scale-95"
              id={`add-${product.id}`}
            >
              <ShoppingCart size={14} />
              <span>Agregar</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
