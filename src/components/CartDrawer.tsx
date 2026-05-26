import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { X, Trash2, Send, ShoppingBag, Percent, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CartDrawerProps {
  onClose: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onClose }) => {
  const { 
    cart, 
    updateQuantity, 
    removeFromCart, 
    clearCart,
    applyPromoCode, 
    appliedPromo,
    cartSubtotal, 
    cartDiscount, 
    cartTotal,
    settings
  } = useStore();

  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState(false);
  const [promoSuccess, setPromoSuccess] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(value);
  };

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError(false);
    setPromoSuccess(false);

    if (!promoInput.trim()) return;

    const accepted = applyPromoCode(promoInput);
    if (accepted) {
      setPromoSuccess(true);
      setPromoInput('');
    } else {
      setPromoError(true);
    }
  };

  const handleWhatsAppCheckout = () => {
    let orderDetails = `*🛒 ¡Hola! Quiero realizar un pedido desde la tienda web:*\n\n`;
    
    cart.forEach((item, index) => {
      const linePrice = item.product.price * item.quantity;
      orderDetails += `*${index + 1}. ${item.product.name}*\n` +
                      `   • Cantidad: ${item.quantity}\n` +
                      `   • Precio: ${formatCurrency(item.product.price)}\n` +
                      `   • Subtotal: ${formatCurrency(linePrice)}\n\n`;
    });

    orderDetails += `------------------------------------\n`;
    orderDetails += `*Subtotal:* ${formatCurrency(cartSubtotal)}\n`;
    
    if (appliedPromo) {
      orderDetails += `*Cupón aplicado:* ${appliedPromo.code} (-${appliedPromo.discountPercent}%)\n`;
      orderDetails += `*Descuento:* -${formatCurrency(cartDiscount)}\n`;
    }
    
    orderDetails += `*💰 TOTAL ESTIMADO:* ${formatCurrency(cartTotal)}\n\n`;
    orderDetails += `_Por favor, confírmenme el stock y los datos para realizar la transferencia/envío._`;

    const encodedText = encodeURIComponent(orderDetails);
    const whatsappNum = settings.whatsappNumber || '541123456789';
    window.open(`https://wa.me/${whatsappNum}?text=${encodedText}`, '_blank');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black backdrop-blur-xs"
          id="cart-backdrop"
        />

        {/* Drawer slide-in panel */}
        <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-screen max-w-md bg-white border-l border-gray-200 text-gray-900 flex flex-col justify-between shadow-2xl h-full"
            id="cart-drawer-panel"
          >
            {/* Header top */}
            <div className="p-6 border-b border-gray-150 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-gray-100 rounded-lg text-black">
                  <ShoppingBag size={20} />
                </div>
                <h2 className="text-lg font-bold text-gray-950 tracking-tight">Tu Carrito de Compras</h2>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg bg-gray-50 text-gray-500 hover:text-black hover:bg-gray-100 border border-gray-200 font-mono transition-transform active:scale-95"
                id="close-cart-drawer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Middle Product List (scrollable) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                  <div className="h-16 w-16 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400">
                    <ShoppingBag size={30} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-800 font-bold">El carrito está vacío</p>
                    <p className="text-xs text-gray-400 pt-1 font-mono">Agregá productos al catálogo para empezar.</p>
                  </div>
                  <button
                    onClick={onClose}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-black hover:bg-zinc-900 text-white text-xs font-semibold py-2.5 px-5 tracking-tight shadow-sm"
                  >
                    <span>Seguir explorando</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              ) : (
                cart.map((item) => (
                  <div 
                    key={item.product.id}
                    className="flex bg-gray-50/50 border border-gray-150 p-3.5 rounded-xl gap-3 hover:border-gray-250 transition-colors"
                  >
                    {/* Item Thumbnail */}
                    <div className="h-16 w-16 rounded-lg overflow-hidden shrink-0 bg-white border border-gray-200">
                      <img src={item.product.images[0]} alt={item.product.name} referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                    </div>

                    {/* Content Details */}
                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div className="flex justify-between items-start gap-1">
                        <h4 className="text-xs font-bold text-gray-900 truncate pr-2 group-hover:underline">
                          {item.product.name}
                        </h4>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-gray-400 hover:text-red-500 p-0.5 transition-colors"
                          title="Eliminar artículo"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      {/* Quantity & Price info */}
                      <div className="flex items-center justify-between pt-1">
                        {/* Selector */}
                        <div className="flex items-center gap-1.5 bg-white rounded-md border border-gray-200 py-0.5 px-1.5 scale-90 -ml-1 shadow-sm">
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            className="text-gray-500 hover:text-black font-bold text-xs font-mono h-5 w-5 flex items-center justify-center rounded"
                          >
                            -
                          </button>
                          <span className="text-xs font-mono font-semibold text-gray-800">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            disabled={item.quantity >= item.product.stock}
                            className="text-gray-500 hover:text-black disabled:opacity-30 font-bold text-xs font-mono h-5 w-5 flex items-center justify-center rounded"
                          >
                            +
                          </button>
                        </div>

                        {/* Line aggregate price */}
                        <span className="text-xs font-bold text-gray-950 font-mono">
                          {formatCurrency(item.product.price * item.quantity)}
                        </span>
                      </div>

                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Bottom aggregate card logic */}
            {cart.length > 0 && (
              <div className="p-6 border-t border-gray-200 bg-gray-50/40 space-y-4">
                
                {/* Coupon apply Form */}
                <form onSubmit={handleApplyPromo} className="flex gap-2">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-3 flex items-center text-gray-400">
                      <Percent size={14} />
                    </div>
                    <input
                      type="text"
                      placeholder="Código de descuento..."
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value)}
                      className="w-full bg-white border border-gray-250 rounded-xl py-2 pl-9 pr-3 text-xs placeholder-gray-400 text-gray-900 placeholder:font-mono focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                      id="cart-coupon-input"
                    />
                  </div>
                  <button
                    type="submit"
                    className="rounded-xl bg-black hover:bg-zinc-900 text-white font-mono text-xs font-bold px-4 transition-colors shadow-sm"
                  >
                    Apply
                  </button>
                </form>

                {/* Applied status banners */}
                {promoError && (
                  <p className="text-[10px] text-red-500 font-mono">⚠️ Cupón inválido o inactivo.</p>
                )}
                {promoSuccess && (
                  <p className="text-[10px] text-green-600 font-mono">✅ ¡Cupón aplicado exitosamente!</p>
                )}
                {appliedPromo && (
                  <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 py-2 px-3 rounded-xl text-xs text-emerald-800">
                    <span className="font-mono font-bold">Cupón activo: {appliedPromo.code}</span>
                    <span className="font-mono font-semibold">-{appliedPromo.discountPercent}% OFF</span>
                  </div>
                )}

                {/* Summary list values */}
                <div className="space-y-2 text-xs text-gray-500 font-mono pt-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="text-gray-800 font-semibold">{formatCurrency(cartSubtotal)}</span>
                  </div>
                  {appliedPromo && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Descuento ({appliedPromo.discountPercent}%)</span>
                      <span>-{formatCurrency(cartDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-gray-200 pt-2.5 text-sm font-bold text-gray-900">
                    <span>Monto Total</span>
                    <span className="font-sans text-black text-lg font-black">{formatCurrency(cartTotal)}</span>
                  </div>
                </div>

                {/* Actions purchase button triggers */}
                <div className="space-y-2.5 pt-2">
                  <button
                    onClick={handleWhatsAppCheckout}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-4 text-xs tracking-tight shadow-md transition-all active:scale-95"
                    id="cart-whatsapp-checkout"
                  >
                    <Send size={14} />
                    <span>Realizar Pedido por WhatsApp</span>
                  </button>

                  <div className="flex gap-2 items-center justify-center text-[10px] text-gray-400 font-mono">
                    <ShieldCheck size={14} className="text-black" />
                    <span>Transacción directa por chat de WhatsApp</span>
                  </div>
                </div>

              </div>
            )}

          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};
