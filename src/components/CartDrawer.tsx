import { useState, useEffect, FormEvent } from "react";
import { X, ShoppingBag, Trash2, Plus, Minus, ArrowRight } from "lucide-react";
import { CartItem, SiteSettings, Coupon, is3DProduct } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number, size?: string, color?: string) => void;
  onRemoveItem: (productId: string, size?: string, color?: string) => void;
  settings: SiteSettings;
  onClearCart: () => void;
  coupons?: Coupon[];
  onProceedToCheckout: () => void;
}

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  settings,
  onClearCart,
  coupons,
  onProceedToCheckout
}: CartDrawerProps) {
  const [promoCode, setPromoCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(0); // in percentage
  const [promoStatus, setPromoStatus] = useState<"none" | "success" | "invalid">("none");

  // Helper to resolve actual item price (checking variants for overriding price or delta)
  const getItemPrice = (item: CartItem): number => {
    const p = item.product;
    if (p.variants && p.variants.length > 0 && item.selectedSize) {
      const exactMatch = item.selectedColor 
        ? p.variants.find(v => v.size === item.selectedSize && v.color === item.selectedColor)
        : null;
      const sizeMatch = p.variants.find(v => v.size === item.selectedSize);
      const match = exactMatch || sizeMatch;
      
      if (match) {
        if (typeof match.price === "number" && match.price > 0) {
          return match.price;
        }
        return p.price + (match.priceDelta || 0);
      }
    }
    return p.price;
  };

  // Calculate prices
  const subtotal = cartItems.reduce(
    (sum, item) => sum + getItemPrice(item) * item.quantity,
    0
  );

  const discountAmount = (subtotal * appliedDiscount) / 100;
  const total = Math.max(0, subtotal - discountAmount);

  const handleApplyPromo = () => {
    if (!promoCode) {
      setPromoStatus("none");
      setAppliedDiscount(0);
      return;
    }
    const cleanPromo = promoCode.trim().toUpperCase();

    // Check with backend-seeded coupon codes
    const matchedCoupon = coupons?.find(
      (c) => c.code.toUpperCase() === cleanPromo && c.active !== false
    );

    if (matchedCoupon) {
      // Validate expiration date if specified
      let isExpired = false;
      if (matchedCoupon.expiration_date) {
        const expiration = new Date(matchedCoupon.expiration_date);
        if (expiration.getTime() < Date.now()) {
          isExpired = true;
        }
      }

      if (!isExpired) {
        setAppliedDiscount(matchedCoupon.discount_percent);
        setPromoStatus("success");
        return;
      }
    }

    setAppliedDiscount(0);
    setPromoStatus("invalid");
  };

  // Rendering logic below
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Drawer body */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 z-50 flex h-full w-full max-w-md flex-col text-[#F4EAD7] bg-[#050B1A] border-l border-[#D4A55A]/20"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#D4A55A]/15">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-[#E6BF76]" />
                <h2 className="text-lg font-semibold font-sans text-[#F4EAD7]">Mi Carrito</h2>
                <span className="rounded-full bg-[#0B1730] text-[#E6BF76] border border-[#D4A55A]/20 px-2 py-0.5 text-xs font-mono font-bold">
                  {cartItems.length} {cartItems.length === 1 ? "artículo" : "artículos"}
                </span>
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-1.5 transition hover:bg-white/10 text-[#E6BF76] hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center h-full">
                  <div className="rounded-full bg-[#0B1730] p-6 mb-4 border border-[#D4A55A]/25 animate-pulse">
                    <ShoppingBag className="h-10 w-10 text-[#E6BF76]" />
                  </div>
                  <h3 className="text-base font-semibold text-zinc-300">Tu carrito está vacío</h3>
                  <p className="text-zinc-500 text-xs mt-1 max-w-xs px-4">
                    Explora nuestra tienda y añade productos increíbles para realizar tu primer checkout.
                  </p>
                  <button
                    onClick={onClose}
                    className="mt-6 px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest bg-[#D4A55A] hover:bg-[#E6BF76] text-[#050B1A] transition-all transform active:scale-95 cursor-pointer shadow-md shadow-[#D4A55A]/10"
                  >
                    Seguir Comprando
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {cartItems.map((item, index) => (
                    <div
                      key={`${item.product.id}-${item.selectedSize || "nosize"}-${item.selectedColor || "nocolor"}`}
                      className="flex gap-3 p-3 rounded-xl border bg-[#0B1730]/60 border-[#D4A55A]/15 hover:border-[#D4A55A]/30 transition-all duration-300"
                    >
                      <img
                        src={item.product.imageUrl || "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80"}
                        alt={item.product.name}
                        className="h-20 w-16 rounded-lg object-cover bg-zinc-800 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium leading-snug line-clamp-2">
                          {item.product.name}
                        </h4>
                        
                        {/* Options tags */}
                        {(item.selectedSize || item.selectedColor) && (
                          <div className="flex flex-wrap gap-1.5 mt-1 font-mono text-[10px] text-[#E6BF76]">
                            {item.selectedSize && (
                              <span className="px-1.5 py-0.5 rounded bg-[#0B1730] border border-[#D4A55A]/25">
                                {is3DProduct(item.product) ? "Material" : "Talle"}: {item.selectedSize}
                              </span>
                            )}
                            {item.selectedColor && (
                              <span className="px-1.5 py-0.5 rounded bg-[#0B1730] border border-[#D4A55A]/25 font-bold">Color: {item.selectedColor}</span>
                            )}
                          </div>
                        )}

                        <div className="flex items-center justify-between mt-3">
                          {/* Stepper */}
                          <div className="flex items-center rounded-lg border text-sm border-[#D4A55A]/25 bg-[#050B1A]">
                            <button
                              onClick={() => {
                                if (item.quantity > 1) {
                                  onUpdateQuantity(item.product.id, item.quantity - 1, item.selectedSize, item.selectedColor);
                                } else {
                                  onRemoveItem(item.product.id, item.selectedSize, item.selectedColor);
                                }
                              }}
                              className="px-2 py-1 text-zinc-400 hover:text-[#E6BF76] cursor-pointer"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="px-2 font-mono text-xs text-[#F4EAD7]">{item.quantity}</span>
                            <button
                              onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1, item.selectedSize, item.selectedColor)}
                              className="px-2 py-1 text-zinc-400 hover:text-[#E6BF76] cursor-pointer"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          {/* Price */}
                          <div className="text-right">
                            <span className="text-sm font-bold text-[#E6BF76]">
                              ${Math.round(getItemPrice(item) * item.quantity)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Delete */}
                      <button
                        onClick={() => onRemoveItem(item.product.id, item.selectedSize, item.selectedColor)}
                        className="text-[#E6BF76]/60 hover:text-red-400 self-start p-1 transition cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Checkout & summary footer */}
            {cartItems.length > 0 && (
              <div className="p-4 border-t space-y-4 border-[#D4A55A]/15 bg-[#050B1A]">


                {/* Pricing summary */}
                <div className="space-y-1.5 text-xs font-sans">
                  <div className="flex justify-between text-zinc-400">
                    <span>Subtotal</span>
                    <span className="font-mono">${Math.round(subtotal)}</span>
                  </div>
                  {appliedDiscount > 0 && (
                    <div className="flex justify-between text-green-400 font-medium">
                      <span>Descuento ({appliedDiscount}%)</span>
                      <span className="font-mono">-${Math.round(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-sm font-bold pt-1.5 border-t border-dashed border-[#D4A55A]/20">
                    <span>Total Estimado</span>
                    <span className="text-base font-mono text-[#E6BF76]">
                      ${Math.round(total)}
                    </span>
                  </div>
                </div>

                {/* Action button to proceed to Checkout */}
                <div className="pt-2 border-t border-dashed border-[#D4A55A]/20">
                  <button
                    onClick={() => {
                      onProceedToCheckout();
                      onClose();
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-extrabold uppercase tracking-widest bg-[#D4A55A] hover:bg-[#E6BF76] text-[#050B1A] mt-1 shadow-lg shadow-[#D4A55A]/10 transition-all transform active:scale-95 cursor-pointer"
                  >
                    <span>Continuar</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
