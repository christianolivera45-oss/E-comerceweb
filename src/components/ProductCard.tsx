import { Product, SiteSettings } from "../types";
import { ShoppingCart, Eye, Tag } from "lucide-react";

interface ProductCardProps {
  key?: string;
  product: Product;
  onAddToCart: (product: Product, size?: string, color?: string) => void;
  onViewProduct: (product: Product) => void;
  settings: SiteSettings;
}

export default function ProductCard({
  product,
  onAddToCart,
  onViewProduct,
  settings
}: ProductCardProps) {
  const isDiscounted = product.originalPrice && product.originalPrice > product.price;
  const discountPercent = isDiscounted
    ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
    : 0;

  const lowStockThreshold = typeof settings?.lowStockThreshold === 'number' ? settings.lowStockThreshold : 5;

  return (
    <div
      className={`group relative flex flex-col rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-black/20 ${
        settings.themeMode === "dark"
          ? "bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700/80"
          : "bg-white border-gray-150 hover:border-gray-250 hover:shadow-gray-200/50"
      }`}
    >
      {/* Aspect Ratio container for Product Image */}
      <div 
        onClick={() => onViewProduct(product)}
        className="relative aspect-square overflow-hidden bg-zinc-950/25 cursor-pointer"
      >
        <img
          src={product.imageUrl || "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80"}
          alt={product.name}
          className="h-full w-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
          referrerPolicy="no-referrer"
        />

        {/* Promo Badge */}
        {isDiscounted && (
          <div className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-red-500 text-white font-mono text-[9px] sm:text-[11px] font-bold px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded-full shadow-md z-10 flex items-center gap-1">
            <Tag className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
            <span>-{discountPercent}% OFF</span>
          </div>
        )}

        {/* Stock warning */}
        {product.stock <= lowStockThreshold && product.stock > 0 && (
          <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-amber-500/90 text-zinc-950 font-sans text-[8.5px] sm:text-[10px] font-extrabold px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded-full tracking-wide shadow-md z-10 font-bold">
            ÚLTIMAS {product.stock}U
          </div>
        )}

        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
            <span className="bg-zinc-800 text-zinc-400 font-bold text-[10px] sm:text-xs uppercase tracking-wider px-2 py-1 rounded-lg">
              Agotado
            </span>
          </div>
        )}

        {/* Quick action buttons on hover over image */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2 sm:grid-cols-2 z-20">
          <button
            onClick={() => onViewProduct(product)}
            className="flex items-center justify-center bg-white text-zinc-900 rounded-full h-8 w-8 sm:h-10 sm:w-10 hover:bg-zinc-200 hover:scale-110 active:scale-95 transition"
            title="Ver Detalles"
          >
            <Eye className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
          </button>
          
          {product.stock > 0 && (
            <button
              onClick={() => onAddToCart(product)}
              className="flex items-center justify-center theme-btn-primary rounded-full h-8 w-8 sm:h-10 sm:w-10 hover:scale-110 active:scale-95 transition"
              title="Añadir al Carrito"
            >
              <ShoppingCart className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Product Content Details */}
      <div className="flex flex-col flex-1 p-3 sm:p-4">
        {/* Category */}
        <span className="text-[9.5px] sm:text-[11px] font-semibold tracking-widest uppercase text-zinc-500 mb-1">
          {product.category}
        </span>

        {/* Product Title */}
        <h3 className="text-xs sm:text-sm font-semibold tracking-tight leading-snug truncate">
          {product.name}
        </h3>

        {/* Subtle separator */}
        <p className="text-[11px] sm:text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed flex-1 break-words overflow-hidden" style={{ overflowWrap: "anywhere" }}>
          {product.description}
        </p>

        {/* Pricing & Stock */}
        <div className="flex items-center justify-between mt-3 sm:mt-4 gap-1.5">
          <div className="flex flex-col">
            {isDiscounted && (
              <span className="text-[10px] sm:text-xs text-zinc-500 line-through">
                ${Math.round(product.originalPrice || 0)}
              </span>
            )}
            <span className="text-sm sm:text-base font-bold theme-text-primary">
              ${Math.round(product.price)}
            </span>
          </div>

          <div className="text-right shrink-0">
            <button
              onClick={() => onViewProduct(product)}
              className={`text-[10px] sm:text-xs font-semibold py-1 px-2 sm:py-1.5 sm:px-3 rounded-xl border ${
                settings.themeMode === "dark" 
                  ? "border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800" 
                  : "border-gray-200 text-zinc-600 hover:text-black hover:bg-gray-100"
              } transition-colors`}
            >
              Detalles
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
