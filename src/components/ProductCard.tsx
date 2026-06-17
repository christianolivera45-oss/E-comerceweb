import { useMemo, useState, useEffect } from "react";
import { Product, SiteSettings } from "../types";
import { ShoppingCart, Eye, Tag } from "lucide-react";

interface ProductCardProps {
  key?: string;
  product: Product;
  onAddToCart: (product: Product, size?: string, color?: string) => void;
  onViewProduct: (product: Product) => void;
  settings: SiteSettings;
  layoutMode?: "grid" | "list";
}

export default function ProductCard({
  product,
  onAddToCart,
  onViewProduct,
  settings,
  layoutMode = "grid"
}: ProductCardProps) {
  const [isHovered, setIsHovered] = useState<boolean>(false);

  const isDiscounted = product.originalPrice && product.originalPrice > product.price;
  const discountPercent = isDiscounted
    ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
    : 0;

  const lowStockThreshold = typeof settings?.lowStockThreshold === 'number' ? settings.lowStockThreshold : 5;

  // Find the cheapest option (either a specific variant or the base product price)
  const cheapestOption = useMemo(() => {
    let price = product.price;
    let imageUrl = product.imageUrl;

    if (product.variants && product.variants.length > 0) {
      const resolvedVariants = product.variants.map((v) => {
        const vPrice = typeof v.price === "number" && v.price > 0
          ? v.price
          : product.price + (v.priceDelta || 0);
        return {
          price: vPrice,
          imageUrl: v.imageUrl || product.imageUrl,
        };
      });

      const allOptions = [
        { price: product.price, imageUrl: product.imageUrl },
        ...resolvedVariants,
      ];

      let minOption = allOptions[0];
      for (let i = 1; i < allOptions.length; i++) {
        if (allOptions[i].price < minOption.price) {
          minOption = allOptions[i];
        } else if (allOptions[i].price === minOption.price && (!minOption.imageUrl || minOption.imageUrl === product.imageUrl) && allOptions[i].imageUrl) {
          // If prices are equal but one has a specific variant image, use that image
          minOption = allOptions[i];
        }
      }
      price = minOption.price;
      imageUrl = minOption.imageUrl;
    }

    return { price, imageUrl };
  }, [product]);

  const [currentImage, setCurrentImage] = useState<string>("");
  const [fallbackAttempt, setFallbackAttempt] = useState<number>(0);

  useEffect(() => {
    setCurrentImage(product.imageUrl || "");
    setFallbackAttempt(0);
  }, [product.imageUrl]);

  const handleImageError = () => {
    const gallery = product.imagenes || [];
    if (fallbackAttempt < gallery.length) {
      const nextImg = gallery[fallbackAttempt];
      setFallbackAttempt(prev => prev + 1);
      if (nextImg && nextImg !== currentImage) {
        setCurrentImage(nextImg);
      } else {
        setCurrentImage("https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80");
      }
    } else {
      setCurrentImage("https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80");
    }
  };

  const getPriceDisplay = () => {
    return `$${Math.round(cheapestOption.price)}`;
  };

  const optimizeImageUrl = (url: string) => {
    if (!url) return "";
    if (url.includes("unsplash.com")) {
      let optimized = url.replace("auto=format", "fm=webp");
      // Remove any existing width or quality params to prevent duplication
      optimized = optimized.replace(/[&?]w=\d+/g, "").replace(/[&?]q=\d+/g, "");
      // Add optimized width and lower quality (q=70) for super fast mobile and desktop loading
      return optimized + (optimized.includes("?") ? "&" : "?") + "w=400&q=70";
    }
    return url;
  };

  return (
    <div
      className={`group relative flex ${
        layoutMode === "list" 
          ? "flex-row h-[132px] sm:flex-col sm:h-full" 
          : "flex-col h-full"
      } rounded-2xl overflow-hidden bg-[#0B1730] border border-[#D4A55A]/15 hover:border-[#D4A55A]/40 hover:shadow-2xl hover:shadow-[#D4A55A]/5 transition-all duration-300`}
    >
      {/* Aspect Ratio container for Portrait Product Image - Larger visual presence */}
      <div 
        onClick={() => onViewProduct(product)}
        className={`relative ${
          layoutMode === "list" 
            ? "w-[110px] shrink-0 border-r border-[#D4A55A]/15 sm:w-auto sm:shrink sm:border-r-0 aspect-[3/4]" 
            : "aspect-[3/4]"
        } overflow-hidden bg-gradient-to-br from-[#050B1A]/80 via-[#0B1730]/40 to-[#050B1A]/75 cursor-pointer flex items-center justify-center p-2.5`}
      >
        <img
          src={optimizeImageUrl(currentImage || "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80")}
          alt={product.name}
          className="max-h-full max-w-full object-contain transition-transform duration-700 ease-out group-hover:scale-106"
          referrerPolicy="no-referrer"
          loading="lazy"
          onError={handleImageError}
        />

        {/* Promo Badge */}
        {isDiscounted && (
          <div className="absolute top-1.5 left-1.5 sm:top-3 sm:left-3 bg-red-500 text-white font-sans text-[7.5px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-md z-10 flex items-center gap-0.5 sm:gap-1">
            <Tag className="h-2 w-2 sm:h-3 sm:w-3" />
            <span>-{discountPercent}%</span>
          </div>
        )}

        {/* Stock warning */}
        {product.stock <= lowStockThreshold && product.stock > 0 && (
          <div className="absolute top-1.5 right-1.5 sm:top-3 sm:right-3 bg-[#E6BF76] text-[#050B1A] font-sans text-[7px] sm:text-[9.5px] font-bold px-1.5 py-0.5 rounded-full tracking-wider shadow-md z-10 uppercase">
            {product.stock} u
          </div>
        )}

        {product.stock === 0 && (
          <div className="absolute inset-0 bg-[#050B1A]/80 flex items-center justify-center z-10">
            <span className="bg-[#0B1730] text-[#E6BF76] font-sans font-bold text-[8px] sm:text-xs uppercase tracking-wider sm:tracking-widest px-2 py-1 sm:px-3 sm:py-1.5 rounded-full border border-[#D4A55A]/30">
              Agotado
            </span>
          </div>
        )}

        {/* Quick action buttons on hover over image */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2 z-20">
          <button
            onClick={() => onViewProduct(product)}
            className="flex items-center justify-center bg-[#F4EAD7] text-[#050B1A] hover:bg-white rounded-full h-8 w-8 sm:h-9 sm:w-9 hover:scale-110 active:scale-95 transition duration-200"
            title="Ver Detalles"
          >
            <Eye className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
          </button>
        </div>
      </div>

      {/* Product Content Details */}
      <div className={`flex flex-col flex-1 p-3 sm:p-4 bg-[#0B1730] min-w-0 ${layoutMode === "list" ? "justify-between" : ""}`}>
        <div>
          {/* Product Title */}
          <div 
            className="relative mt-0.5 sm:mt-1 flex flex-col justify-start w-full min-w-0"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onTouchStart={() => setIsHovered(true)}
            onTouchEnd={() => setIsHovered(false)}
          >
            <h3 
              className={`text-[11px] sm:text-sm font-semibold text-[#F4EAD7] tracking-wide leading-snug group-hover:text-[#E6BF76] transition-colors cursor-pointer select-none block w-full ${
                layoutMode === "list"
                  ? "line-clamp-2"
                  : isHovered ? "whitespace-normal break-words" : "truncate"
              }`}
              title={product.name}
            >
              {product.name}
            </h3>
          </div>

          {/* Pricing info directly below - no description block to assure uniform card columns */}
          {layoutMode !== "list" && (
            <div className="flex items-baseline gap-1.5 sm:gap-2 mt-1 sm:mt-2">
              <span className="text-xs sm:text-base font-bold text-[#E6BF76]">
                {getPriceDisplay()}
              </span>
              {isDiscounted && (
                <span className="text-[9px] sm:text-xs text-slate-400 line-through">
                  ${Math.round(product.originalPrice!)}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Highlighted Buy Button / Details Strip at base */}
        {layoutMode === "list" ? (
          <div className="flex items-center justify-between gap-1.5 mt-auto pt-1.5 border-t border-[#D4A55A]/10">
            <div className="flex flex-col min-w-0">
              <div className="flex items-baseline gap-1 sm:gap-1.5">
                <span className="text-xs sm:text-base font-black text-[#E6BF76]">
                  {getPriceDisplay()}
                </span>
                {isDiscounted && (
                  <span className="text-[8.5px] sm:text-xs text-slate-400 line-through whitespace-nowrap">
                    ${Math.round(product.originalPrice!)}
                  </span>
                )}
              </div>
              <span className="text-[7px] sm:text-[8px] text-[#25D366]/90 font-medium font-sans truncate tracking-tight uppercase flex items-center gap-0.5">
                <span className="inline-block w-1 h-1 rounded-full bg-[#25D366] animate-pulse shrink-0"></span>
                {product.stock > 0 ? "Entrega Inmediata" : "Bajo Pedido"}
              </span>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                if (product.stock > 0) {
                  onAddToCart(product);
                } else {
                  onViewProduct(product);
                }
              }}
              className={`py-1 px-2.5 sm:py-2 sm:px-4 rounded-full text-[8.5px] sm:text-[10px] font-sans font-extrabold uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-1 cursor-pointer border shrink-0 ${
                product.stock > 0
                  ? "bg-[#D4A55A] hover:bg-[#E6BF76] border-transparent text-[#050B1A] hover:scale-105 active:scale-95 shadow-md shadow-[#D4A55A]/10 font-bold"
                  : "bg-transparent border-slate-700 text-[#D4A55A]/80 cursor-pointer"
              }`}
            >
              <ShoppingCart className="h-2.5 w-2.5" />
              <span>{product.stock > 0 ? "Comprar" : "Detalles"}</span>
            </button>
          </div>
        ) : (
          <div className="mt-2 sm:mt-4 pt-1 sm:pt-1.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (product.stock > 0) {
                  onAddToCart(product);
                } else {
                  onViewProduct(product);
                }
              }}
              className={`w-full py-1.5 sm:py-2.5 px-2.5 sm:px-3 rounded-full text-[8.5px] sm:text-[10px] font-sans font-bold uppercase tracking-wider sm:tracking-widest transition-all duration-300 flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer border ${
                product.stock > 0
                  ? "bg-[#D4A55A] hover:bg-[#E6BF76] border-transparent text-[#050B1A] hover:scale-[1.02] active:scale-98 shadow-md shadow-[#D4A55A]/10"
                  : "bg-transparent border-slate-700 text-slate-400 cursor-not-allowed"
              }`}
            >
              <ShoppingCart className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              <span>{product.stock > 0 ? "Comprar" : "Sin Stock"}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
