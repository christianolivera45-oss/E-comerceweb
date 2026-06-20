import React, { useState } from "react";
import { ShopState, Order } from "../types";
import { 
  Search, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Phone, 
  Mail, 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  DollarSign, 
  ShoppingBag,
  ExternalLink,
  Tag as TagIcon,
  Trash2
} from "lucide-react";

interface DashboardOrdersProps {
  store: ShopState;
  onUpdateStatus: (id: string, status: string) => Promise<void>;
  onDeleteOrder: (id: string) => Promise<void>;
}

export const DashboardOrders: React.FC<DashboardOrdersProps> = ({ store, onUpdateStatus, onDeleteOrder }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeletingLoading, setIsDeletingLoading] = useState<string | null>(null);

  const orders: Order[] = store.orders || [];

  // Categorize stats
  const totalOrdersCount = orders.length;
  const approvedOrders = orders.filter(o => o.status === "pago_aprobado");
  const pendingOrders = orders.filter(o => o.status === "pedido_iniciado" || o.status === "pago_pendiente");
  const rejectedOrders = orders.filter(o => o.status === "pago_rechazado");

  const totalVolumeUYU = approvedOrders.reduce((acc, o) => acc + o.total, 0);

  // Status human-readable definitions
  const getStatusLabelAndStyle = (status: string) => {
    switch (status) {
      case "pago_aprobado":
        return {
          label: "Aprobado / Pagado ✓",
          colors: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-405 border-emerald-500/20",
          icon: <CheckCircle className="h-3 w-3 inline mr-1" />
        };
      case "pago_pendiente":
        return {
          label: "Pago Pendiente ⌚",
          colors: "bg-amber-500/10 text-amber-600 dark:text-amber-405 border-amber-500/20",
          icon: <Clock className="h-3 w-3 inline mr-1" />
        };
      case "pedido_iniciado":
        return {
          label: "Iniciado / lead 📝",
          colors: "bg-sky-500/10 text-sky-600 dark:text-sky-402 border-sky-500/20",
          icon: <Clock className="h-3 w-3 inline mr-1" />
        };
      case "pago_rechazado":
        return {
          label: "Rechazado / Fallido ✗",
          colors: "bg-rose-500/10 text-rose-600 dark:text-rose-405 border-rose-500/20",
          icon: <XCircle className="h-3 w-3 inline mr-1" />
        };
      default:
        return {
          label: status || "Registrado",
          colors: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20",
          icon: null
        };
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      await onUpdateStatus(orderId, newStatus);
    } finally {
      setUpdatingId(null);
    }
  };

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      (order.id || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.customerName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.customerEmail || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.customerPhone || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.couponCode || "").toLowerCase().includes(searchTerm.toLowerCase());

    if (statusFilter === "all") return matchesSearch;
    if (statusFilter === "aprobado") return matchesSearch && order.status === "pago_aprobado";
    if (statusFilter === "pendiente") return matchesSearch && (order.status === "pago_pendiente" || order.status === "pedido_iniciado");
    if (statusFilter === "rechazado") return matchesSearch && order.status === "pago_rechazado";
    return matchesSearch;
  });

  const toggleRow = (orderId: string) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
    } else {
      setExpandedOrderId(orderId);
    }
  };

  const handleWhatsAppChat = (order: Order) => {
    const rawNum = order.customerPhone || "";
    const cleanNum = rawNum.replace(/[^0-9]/g, "");
    const textMsg = `Hola ${order.customerName}, nos contactamos de la tienda por tu pedido N° ${(order.id || "").substring(0, 6).toUpperCase()}.`;
    window.open(`https://wa.me/${cleanNum}?text=${encodeURIComponent(textMsg)}`, "_blank");
  };

  return (
    <div className="w-full space-y-6">
      
      {/* METRIC HEADER OVERVIEW cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1 */}
        <div className="bg-white dark:bg-zinc-950 p-5 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Ventas Monetarias Aprobadas</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
              <DollarSign className="h-4.5 w-4.5" />
            </div>
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-zinc-50 font-mono">
              $ {totalVolumeUYU.toLocaleString("es-AR")} UYU
            </h3>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold mt-1">Transacciones Mercado Pago Uruguay</p>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white dark:bg-zinc-950 p-5 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Órdenes Pagadas</span>
            <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-lg">
              <CheckCircle className="h-4.5 w-4.5" />
            </div>
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-zinc-50 font-mono">
              {approvedOrders.length}
            </h3>
            <p className="text-[10px] text-slate-600 dark:text-zinc-300 font-semibold mt-1">De {totalOrdersCount} transacciones registradas</p>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white dark:bg-zinc-950 p-5 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Leads & Pagos Pendientes</span>
            <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg">
              <Clock className="h-4.5 w-4.5" />
            </div>
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-zinc-50 font-mono">
              {pendingOrders.length}
            </h3>
            <p className="text-[10px] text-slate-600 dark:text-zinc-300 font-semibold mt-1">Consultas que requieren seguimiento</p>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white dark:bg-zinc-950 p-5 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Órdenes Rechazadas</span>
            <div className="p-2 bg-rose-500/10 text-rose-500 rounded-lg">
              <XCircle className="h-4.5 w-4.5" />
            </div>
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-rose-600 dark:text-rose-400 font-mono">
              {rejectedOrders.length}
            </h3>
            <p className="text-[10px] text-slate-600 dark:text-zinc-300 font-semibold mt-1">Operaciones denegadas o canceladas</p>
          </div>
        </div>

      </div>

      {/* FILTER & CONTAINER HEADER */}
      <div className="bg-white dark:bg-zinc-950 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        
        {/* Controls bar */}
        <div className="p-5 border-b border-slate-100 dark:border-zinc-800/80 flex flex-col md:flex-row justify-between items-center gap-4">
          
          {/* Status Tabs Navigation */}
          <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === "all"
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 font-extrabold"
                  : "bg-slate-50 dark:bg-zinc-900 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              Todos ({totalOrdersCount})
            </button>
            <button
              onClick={() => setStatusFilter("aprobado")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === "aprobado"
                  ? "bg-emerald-500 text-white font-extrabold"
                  : "bg-slate-50 dark:bg-zinc-900 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              ✓ Aprobados ({approvedOrders.length})
            </button>
            <button
              onClick={() => setStatusFilter("pendiente")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === "pendiente"
                  ? "bg-amber-500 text-zinc-950 font-extrabold"
                  : "bg-slate-50 dark:bg-zinc-900 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              ⌚ Pendientes ({pendingOrders.length})
            </button>
            <button
              onClick={() => setStatusFilter("rechazado")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === "rechazado"
                  ? "bg-rose-500 text-white font-extrabold"
                  : "bg-slate-50 dark:bg-zinc-900 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              ✗ Cancelados ({rejectedOrders.length})
            </button>
          </div>

          {/* Quick Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Buscar por cliente, ID, cupón o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white"
            />
          </div>

        </div>

        {/* LIST TABLE CONTAINER */}
        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center">
            <ShoppingBag className="h-10 w-10 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-500 dark:text-zinc-400 text-sm font-semibold">No se encontraron pedidos registrados con los filtros actuales.</p>
            <p className="text-zinc-400 dark:text-zinc-500 text-[11px] mt-1">Los pedidos aparecerán de forma automática una vez que los clientes completen el formulario de compra o inicien la consulta de WhatsApp.</p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[550px] overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-zinc-900/30 border-b border-slate-100 dark:border-zinc-800">
                  <th className="p-4 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">ID de Pedido</th>
                  <th className="p-4 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Fecha / Hora</th>
                  <th className="p-4 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Cliente</th>
                  <th className="p-4 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Datos de Contacto</th>
                  <th className="p-4 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-right">Monto Total</th>
                  <th className="p-4 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Estado del Pedido</th>
                  <th className="p-4 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-850">
                {filteredOrders.map((order) => {
                  const isExpanded = expandedOrderId === order.id;
                  const statusInfo = getStatusLabelAndStyle(order.status);
                  
                  return (
                    <React.Fragment key={order.id}>
                      <tr className="hover:bg-slate-50/30 dark:hover:bg-zinc-900/10 cursor-pointer" onClick={() => toggleRow(order.id)}>
                        <td className="p-4">
                          <span className="font-mono text-xs font-bold text-slate-800 dark:text-zinc-200">
                            #{order.id.substring(0, 6).toUpperCase()}
                          </span>
                        </td>
                        <td className="p-4 text-xs whitespace-nowrap text-zinc-500 dark:text-zinc-400 font-mono">
                          {order.createdAt ? new Date(order.createdAt).toLocaleDateString("es-AR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          }) : "N/A"}
                        </td>
                        <td className="p-4">
                          <p className="text-xs font-bold text-slate-900 dark:text-white">{order.customerName}</p>
                          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">{order.customerEmail}</p>
                        </td>
                        <td className="p-4">
                          <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300 font-mono">{order.customerPhone}</span>
                          <span className="block text-[9px] text-sky-505 dark:text-sky-455 font-bold truncate max-w-xs">{order.notes}</span>
                        </td>
                        <td className="p-4 text-right">
                          <span className="text-xs font-extrabold text-slate-900 dark:text-white font-mono">
                            $ {order.total.toLocaleString("es-AR")} UYU
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-[10px] font-bold border ${statusInfo.colors}`}>
                            {statusInfo.icon}
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleWhatsAppChat(order)}
                              title="Chatear con el cliente"
                              className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-450 rounded-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center"
                            >
                              <svg className="h-3.5 w-3.5 shrink-0 fill-current" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
                                <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.998h.003c4.368 0 7.927-3.558 7.93-7.926a7.86 7.86 0 0 0-2.33-5.596ZM7.994 14.52a6.57 6.57 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232"/>
                              </svg>
                            </button>

                            {deletingId === order.id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={async () => {
                                    setIsDeletingLoading(order.id);
                                    try {
                                      await onDeleteOrder(order.id);
                                    } finally {
                                      setIsDeletingLoading(null);
                                      setDeletingId(null);
                                    }
                                  }}
                                  title="Confirmar eliminación del pedido"
                                  className="px-2 py-1 bg-rose-600 text-white text-[10px] hover:bg-rose-700 uppercase font-black rounded cursor-pointer"
                                >
                                  {isDeletingLoading === order.id ? "..." : "Sí"}
                                </button>
                                <button
                                  onClick={() => setDeletingId(null)}
                                  title="Cancelar"
                                  className="px-1.5 py-1 bg-zinc-200 dark:bg-zinc-850 text-zinc-650 dark:text-zinc-350 text-[10px] hover:bg-zinc-300 hover:dark:bg-zinc-800 rounded cursor-pointer"
                                >
                                  No
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeletingId(order.id)}
                                title="Eliminar pedido permanentemente"
                                className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 rounded-lg transition-all hover:scale-105 active:scale-95 cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}

                            <button
                              onClick={() => toggleRow(order.id)}
                              className="p-1.5 bg-slate-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-lg transition-colors cursor-pointer"
                            >
                              {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                          {deletingId === order.id && (
                            <span className="block text-[8px] text-rose-500 dark:text-rose-400 font-bold mt-1 uppercase animate-pulse">¿Borrar?</span>
                          )}
                        </td>
                      </tr>

                      {/* EXPANDED INNER INFO ROW */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={7} className="bg-slate-50/50 dark:bg-zinc-900/30 p-5">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                              
                              {/* Left column - items details */}
                              <div className="lg:col-span-8 space-y-3">
                                <h4 className="text-xs font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-zinc-800 pb-1.5">
                                  DESGLOSE DE ARTÍCULOS EN EL CARRITO
                                </h4>
                                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                  {order.items && order.items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center bg-white dark:bg-zinc-950 p-2.5 rounded-lg border border-slate-150 dark:border-zinc-850">
                                      <div>
                                        <p className="text-xs font-bold text-slate-900 dark:text-white">
                                          {item.productName}
                                        </p>
                                        <p className="text-[10px] text-zinc-500 dark:text-zinc-500 font-semibold font-mono">
                                          Cant: {item.quantity} x $ {item.unitPrice.toLocaleString("es-AR")} UYU
                                          {item.sizeSelected && ` | Talle: ${item.sizeSelected}`}
                                          {item.colorSelected && ` | Color: ${item.colorSelected}`}
                                        </p>
                                      </div>
                                      <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                                        $ {item.totalPrice.toLocaleString("es-AR")} UYU
                                      </span>
                                    </div>
                                  ))}
                                </div>

                                <div className="p-3 bg-slate-100 dark:bg-zinc-900 rounded-lg flex flex-wrap gap-4 text-[11px] text-zinc-500 dark:text-zinc-400 justify-between">
                                  <p><strong>Subtotal:</strong> $ {order.subtotal?.toLocaleString("es-AR")} UYU</p>
                                  {order.discountAmount > 0 && (
                                    <p className="text-rose-500">
                                      <strong>Descuento:</strong> -$ {order.discountAmount?.toLocaleString("es-AR")} UYU
                                    </p>
                                  )}
                                  <p className="text-slate-950 dark:text-white font-extrabold text-xs">
                                    <strong>Total:</strong> $ {order.total?.toLocaleString("es-AR")} UYU
                                  </p>
                                  {order.couponCode && (
                                    <p className="bg-sky-500/10 text-sky-600 px-1.5 py-0.5 rounded font-bold font-mono">
                                      Cupón: {order.couponCode}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Right column - workflow modification */}
                              <div className="lg:col-span-4 space-y-3">
                                <h4 className="text-xs font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-zinc-800 pb-1.5">
                                  FLUJO DE VALIDACIÓN DE PEDIDO
                                </h4>

                                <div className="space-y-2">
                                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                                    Modificar Estado Manualmente
                                  </p>

                                  <div className="grid grid-cols-2 gap-1.5">
                                    <button
                                      disabled={updatingId !== null}
                                      onClick={() => handleUpdateStatus(order.id, "pago_aprobado")}
                                      className={`px-3 py-2 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                                        order.status === "pago_aprobado"
                                          ? "bg-emerald-600 text-white font-extrabold scale-[1.01]"
                                          : "bg-white hover:bg-emerald-50 dark:bg-zinc-900 dark:hover:bg-emerald-950 text-emerald-605"
                                      }`}
                                    >
                                      ✓ Aprobado
                                    </button>
                                    
                                    <button
                                      disabled={updatingId !== null}
                                      onClick={() => handleUpdateStatus(order.id, "pago_pendiente")}
                                      className={`px-3 py-2 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                                        order.status === "pago_pendiente"
                                          ? "bg-amber-500 text-zinc-950 font-extrabold scale-[1.01]"
                                          : "bg-white hover:bg-amber-50 dark:bg-zinc-900 dark:hover:bg-amber-950/40 text-amber-600"
                                      }`}
                                    >
                                      ⌚ Pendiente
                                    </button>

                                    <button
                                      disabled={updatingId !== null}
                                      onClick={() => handleUpdateStatus(order.id, "pago_rechazado")}
                                      className={`px-3 py-2 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                                        order.status === "pago_rechazado"
                                          ? "bg-rose-600 text-white font-extrabold scale-[1.01]"
                                          : "bg-white hover:bg-rose-50 dark:bg-zinc-900 dark:hover:bg-rose-950/40 text-rose-600"
                                      }`}
                                    >
                                      ✗ Rechazado
                                    </button>

                                    <button
                                      disabled={updatingId !== null}
                                      onClick={() => handleUpdateStatus(order.id, "pedido_iniciado")}
                                      className={`px-3 py-2 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                                        order.status === "pedido_iniciado"
                                          ? "bg-sky-600 text-white font-extrabold scale-[1.01]"
                                          : "bg-white hover:bg-sky-50 dark:bg-zinc-900 dark:hover:bg-sky-950/40 text-sky-600"
                                      }`}
                                    >
                                      📝 Lead / Iniciado
                                    </button>
                                  </div>
                                </div>

                                <div className="pt-2">
                                  <button
                                    onClick={() => handleWhatsAppChat(order)}
                                    className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-transform hover:scale-[1.01] flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-emerald-500/10"
                                  >
                                    <svg className="h-3.5 w-3.5 shrink-0 fill-current" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
                                      <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.998h.003c4.368 0 7.927-3.558 7.93-7.926a7.86 7.86 0 0 0-2.33-5.596ZM7.994 14.52a6.57 6.57 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232"/>
                                    </svg>
                                    <span>Chatear por WhatsApp</span>
                                  </button>
                                </div>
                              </div>

                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
