import { useState, FormEvent } from "react";
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
}

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  settings,
  onClearCart,
  coupons
}: CartDrawerProps) {
  const [userName, setUserName] = useState("");
  const [address, setAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Transferencia");
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

    // Match common keywords or configuration values as fallback
    if (cleanPromo === "APEX50" || cleanPromo === "DESCUENTO10" || cleanPromo === "PROMO" || cleanPromo === "OFFER") {
      setAppliedDiscount(10); // 10%
      setPromoStatus("success");
    } else {
      setAppliedDiscount(0);
      setPromoStatus("invalid");
    }
  };

  const handleWhatsAppCheckout = (e: FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) return;
    if (!userName.trim() || !address.trim()) {
      alert("Por favor completa tu nombre y dirección de envío.");
      return;
    }

    // Generate messaging text formatted nicely for WhatsApp
    let message = `🛒 *NUEVO PEDIDO - ${settings.siteTitle}*\n\n`;
    message += `👤 *Cliente:* ${userName.trim()}\n`;
    message += `📍 *Dirección:* ${address.trim()}\n`;
    message += `💳 *Método de Pago:* ${paymentMethod}\n`;
    if (appliedDiscount > 0) {
      message += `🎟️ *Cupón Aplicado:* ${promoCode.toUpperCase()} (${appliedDiscount}% desc.)\n`;
    }
    message += `┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n\n`;

    cartItems.forEach((item, index) => {
      const is3D = is3DProduct(item.product);
      const options = [];
      if (item.selectedSize) {
        options.push(is3D ? `Material: ${item.selectedSize}` : `Talle: ${item.selectedSize}`);
      }
      if (item.selectedColor) {
        options.push(`Color: ${item.selectedColor}`);
      }
      const optionsStr = options.length > 0 ? ` (${options.join(", ")})` : "";
      
      const itemPrice = getItemPrice(item);
      message += `${index + 1}. *${item.product.name}*${optionsStr}\n`;
      
      if (is3D) {
        const immediateStock = item.product.stock || 0;
        const immediateQty = Math.min(item.quantity, Math.max(0, immediateStock));
        const onDemandQty = Math.max(0, item.quantity - immediateStock);
        
        const rawVal = item.product.hoursPerUnit;
        const delayDays = (rawVal === undefined || rawVal === null) ? 1 : (rawVal === 8 ? 1 : (rawVal === 24 ? 2 : (rawVal === 48 ? 3 : rawVal)));
        const totalDelayDays = onDemandQty * delayDays;
        message += `   ⚡ _Stock inmediato:_ ${immediateQty} un.\n`;
        message += `   🛠️ _A fabricar:_ ${onDemandQty} un. (demora est. ${totalDelayDays} ${totalDelayDays === 1 ? "día" : "días"})\n`;
      }
      
      message += `   👉 ${item.quantity} x $${Math.round(itemPrice)} = *$${Math.round(
        itemPrice * item.quantity
      )}*\n\n`;
    });

    message += `┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n`;
    message += `🔹 *Subtotal:* $${Math.round(subtotal)}\n`;
    if (appliedDiscount > 0) {
      message += `🔹 *Descuento (${appliedDiscount}%):* -$${Math.round(discountAmount)}\n`;
    }
    message += `🔥 *TOTAL NETO:* *$${Math.round(total)}*\n\n`;
    message += `🙌 _Quiero coordinar la entrega y el pago con ustedes de este pedido._`;

    // Encode text and open link
    const encodedText = encodeURIComponent(message);
    const cleanPhone = settings.whatsappNumber.replace(/[^0-9]/g, "");
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodedText}`;
    
    // Open in standard tab safely
    window.open(waUrl, "_blank", "referrer");
    onClearCart();
    onClose();
  };

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
            className={`fixed top-0 right-0 z-50 flex h-full w-full max-w-md flex-col text-white ${
              settings.themeMode === "dark" ? "bg-zinc-950 border-l border-zinc-800" : "bg-white text-zinc-900 border-l border-gray-200"
            }`}
          >
            {/* Header */}
            <div className={`flex items-center justify-between p-4 border-b ${
              settings.themeMode === "dark" ? "border-zinc-800" : "border-gray-200"
            }`}>
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 theme-text-primary" />
                <h2 className="text-lg font-semibold font-sans">Mi Carrito</h2>
                <span className="rounded-full bg-zinc-800 text-zinc-300 px-2 py-0.5 text-xs font-mono font-bold">
                  {cartItems.length} {cartItems.length === 1 ? "artículo" : "artículos"}
                </span>
              </div>
              <button
                onClick={onClose}
                className={`rounded-full p-1.5 transition ${
                  settings.themeMode === "dark" ? "hover:bg-zinc-800 text-zinc-400 hover:text-white" : "hover:bg-gray-100 text-zinc-500 hover:text-black"
                }`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center h-full">
                  <div className="rounded-full bg-zinc-900 p-6 mb-4">
                    <ShoppingBag className="h-10 w-10 text-zinc-500" />
                  </div>
                  <h3 className="text-base font-semibold text-zinc-300">Tu carrito está vacío</h3>
                  <p className="text-zinc-500 text-sm mt-1 max-w-xs">
                    Explora nuestra tienda y añade productos increíbles para realizar tu primer checkout.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cartItems.map((item, index) => (
                    <div
                      key={`${item.product.id}-${item.selectedSize || "nosize"}-${item.selectedColor || "nocolor"}`}
                      className={`flex gap-3 p-3 rounded-xl border ${
                        settings.themeMode === "dark" ? "bg-zinc-900/40 border-zinc-800/80" : "bg-gray-50 border-gray-100"
                      }`}
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
                          <div className="flex flex-wrap gap-1.5 mt-1 font-mono text-[10px] text-zinc-400">
                            {item.selectedSize && (
                              <span className="px-1.5 py-0.5 rounded bg-zinc-800/80">
                                {is3DProduct(item.product) ? "Material" : "Talle"}: {item.selectedSize}
                              </span>
                            )}
                            {item.selectedColor && (
                              <span className="px-1.5 py-0.5 rounded bg-zinc-800/80">Color: {item.selectedColor}</span>
                            )}
                          </div>
                        )}

                        <div className="flex items-center justify-between mt-3">
                          {/* Stepper */}
                          <div className={`flex items-center rounded-lg border text-sm ${
                            settings.themeMode === "dark" ? "border-zinc-800 bg-zinc-950" : "border-gray-200 bg-white"
                          }`}>
                            <button
                              onClick={() => {
                                if (item.quantity > 1) {
                                  onUpdateQuantity(item.product.id, item.quantity - 1, item.selectedSize, item.selectedColor);
                                } else {
                                  onRemoveItem(item.product.id, item.selectedSize, item.selectedColor);
                                }
                              }}
                              className="px-2 py-1 text-zinc-400 hover:text-white transition-colors"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="px-2 font-mono text-xs">{item.quantity}</span>
                            <button
                              onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1, item.selectedSize, item.selectedColor)}
                              className="px-2 py-1 text-zinc-400 hover:text-white transition-colors"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          {/* Price */}
                          <div className="text-right">
                            <span className="text-sm font-bold theme-text-primary">
                              ${Math.round(getItemPrice(item) * item.quantity)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Delete */}
                      <button
                        onClick={() => onRemoveItem(item.product.id, item.selectedSize, item.selectedColor)}
                        className="text-zinc-500 hover:text-red-400 self-start p-1 transition"
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
              <div className={`p-4 border-t space-y-4 ${
                settings.themeMode === "dark" ? "border-zinc-800 bg-zinc-950/80" : "border-gray-150 bg-gray-50/50"
              }`}>
                {/* Promo Code area */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Código de cupón (ej: APEX50)"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    className={`flex-1 text-xs px-3 py-2 rounded-lg border outline-none font-mono ${
                      settings.themeMode === "dark"
                        ? "bg-zinc-900 border-zinc-800 text-white placeholder-zinc-500 focus:border-zinc-700"
                        : "bg-white border-gray-200 text-zinc-900 placeholder-gray-400"
                    }`}
                  />
                  <button
                    onClick={handleApplyPromo}
                    className="px-3 py-2 rounded-lg text-xs font-semibold theme-btn-accent whitespace-nowrap"
                  >
                    Aplicar
                  </button>
                </div>

                {promoStatus === "success" && (
                  <p className="text-[11px] text-green-400 font-medium">✔️ ¡Descuento de 10% aplicado de manera exitosa!</p>
                )}
                {promoStatus === "invalid" && (
                  <p className="text-[11px] text-red-400 font-medium">❌ Cupón inválido. Revisa el código.</p>
                )}

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
                  <div className="flex justify-between items-center text-sm font-bold pt-1.5 border-t border-dashed border-zinc-800">
                    <span>Total Estimado</span>
                    <span className="text-base font-mono theme-text-primary">
                      ${Math.round(total)}
                    </span>
                  </div>
                </div>

                {/* Shipping Form & Checkout */}
                <form onSubmit={handleWhatsAppCheckout} className="space-y-3 pt-2">
                  <hr className={`border-t ${settings.themeMode === "dark" ? "border-zinc-800" : "border-gray-200"}`} />
                  <h4 className="text-xs font-semibold tracking-wider uppercase text-zinc-400">Datos para Envío (WhatsApp Coordinated)</h4>
                  
                  <div className="space-y-2">
                    <input
                      required
                      type="text"
                      placeholder="Nombre Completo"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className={`text-xs w-full px-3 py-2 rounded-lg border outline-none ${
                        settings.themeMode === "dark"
                          ? "bg-zinc-900 border-zinc-800 text-white placeholder-zinc-500 focus:border-zinc-700"
                          : "bg-white border-gray-200 text-zinc-900 placeholder-gray-400"
                      }`}
                    />
                    <input
                      required
                      type="text"
                      placeholder="Dirección Física de Entrega"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className={`text-xs w-full px-3 py-2 rounded-lg border outline-none ${
                        settings.themeMode === "dark"
                          ? "bg-zinc-900 border-zinc-800 text-white placeholder-zinc-500 focus:border-zinc-700"
                          : "bg-white border-gray-200 text-zinc-900 placeholder-gray-400"
                      }`}
                    />
                    
                    <div className="flex items-center gap-2 justify-between">
                      <label className="text-[11px] text-zinc-400 font-sans">Pago preferido:</label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className={`text-xs px-2 py-1 rounded-lg border outline-none ${
                          settings.themeMode === "dark"
                            ? "bg-zinc-900 border-zinc-800 text-white"
                            : "bg-white border-gray-200 text-zinc-900"
                        }`}
                      >
                        <option value="Transferencia BCP/Mercado Pago">MercadoPago / Transf.</option>
                        <option value="Efectivo al recibir">Efectivo Contraentrega</option>
                        <option value="Tarjeta vía link de pago">Tarjeta de Crédito/Débito</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold font-sans theme-btn-primary mt-1 shadow-lg shadow-black/10 transition-transform active:scale-95"
                  >
                    Comprar vía WhatsApp
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </form>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
