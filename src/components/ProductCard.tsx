import { useMemo, useState, useEffect } from "react";
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
      return url.replace("auto=format", "fm=webp") + (url.includes("w=") ? "" : "&w=600");
    }
    return url;
  };

  return (
    <div
      className="group relative flex flex-col rounded-2xl overflow-hidden bg-[#0B1730] border border-[#D4A55A]/15 hover:border-[#D4A55A]/40 hover:shadow-2xl hover:shadow-[#D4A55A]/5 transition-all duration-300 h-full"
    >
      {/* Aspect Ratio container for Portrait Product Image - Larger visual presence */}
      <div 
        onClick={() => onViewProduct(product)}
        className="relative aspect-[3/4] overflow-hidden bg-[#050B1A]/40 cursor-pointer flex items-center justify-center p-2"
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
          <div className="absolute top-3 left-3 bg-red-500 text-white font-sans text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md z-10 flex items-center gap-1">
            <Tag className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
            <span>-{discountPercent}% OFF</span>
          </div>
        )}

        {/* Stock warning */}
        {product.stock <= lowStockThreshold && product.stock > 0 && (
          <div className="absolute top-3 right-3 bg-[#E6BF76] text-[#050B1A] font-sans text-[8px] sm:text-[9.5px] font-bold px-2 py-0.5 rounded-full tracking-wider shadow-md z-10 uppercase">
            Últimas {product.stock} u
          </div>
        )}

        {product.stock === 0 && (
          <div className="absolute inset-0 bg-[#050B1A]/80 flex items-center justify-center z-10">
            <span className="bg-[#0B1730] text-[#E6BF76] font-sans font-bold text-[10px] sm:text-xs uppercase tracking-widest px-3 py-1.5 rounded-full border border-[#D4A55A]/30">
              Agotado
            </span>
          </div>
        )}

        {/* Quick action buttons on hover over image */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2 z-20">
          <button
            onClick={() => onViewProduct(product)}
            className="flex items-center justify-center bg-[#F4EAD7] text-[#050B1A] hover:bg-white rounded-full h-9 w-9 hover:scale-110 active:scale-95 transition duration-200"
            title="Ver Detalles"
          >
            <Eye className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>

      {/* Product Content Details */}
      <div className="flex flex-col flex-1 p-4 bg-[#0B1730] min-w-0">
        {/* Category */}
        <span className="text-[9px] sm:text-[10px] font-bold tracking-widest uppercase text-[#D4A55A]/85 mb-1 bg-[#D4A55A]/5 border border-[#D4A55A]/10 px-2 py-0.5 rounded-md self-start">
          {product.category}
        </span>

        {/* Product Title */}
        <div 
          className="relative mt-1.5 flex flex-col justify-start w-full min-w-0"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onTouchStart={() => setIsHovered(true)}
          onTouchEnd={() => setIsHovered(false)}
        >
          <h3 
            className={`text-xs sm:text-sm font-semibold text-[#F4EAD7] tracking-wide leading-snug group-hover:text-[#E6BF76] transition-colors cursor-pointer select-none block w-full ${
              isHovered ? "whitespace-normal break-words" : "truncate"
            }`}
            title={product.name}
          >
            {product.name}
          </h3>
        </div>

        {/* Pricing info directly below - no description block to assure uniform card columns */}
        <div className="flex items-baseline gap-2 mt-2">
          <span className="text-sm sm:text-base font-bold text-[#E6BF76]">
            {getPriceDisplay()}
          </span>
          {isDiscounted && (
            <span className="text-[10px] sm:text-xs text-slate-400 line-through">
              ${Math.round(product.originalPrice!)}
            </span>
          )}
        </div>

        {/* Highlighted Buy Button at base of catalog grid element */}
        <div className="mt-4 pt-1.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (product.stock > 0) {
                onAddToCart(product);
              } else {
                onViewProduct(product);
              }
            }}
            className={`w-full py-2.5 px-3 rounded-full text-[10px] font-sans font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer border ${
              product.stock > 0
                ? "bg-[#D4A55A] hover:bg-[#E6BF76] border-transparent text-[#050B1A] hover:scale-[1.02] active:scale-98 shadow-md shadow-[#D4A55A]/10"
                : "bg-transparent border-slate-700 text-slate-400 cursor-not-allowed"
            }`}
          >
            <ShoppingCart className="h-3 w-3" />
            <span>{product.stock > 0 ? "Comprar" : "Sin Stock"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
