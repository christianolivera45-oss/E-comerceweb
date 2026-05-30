import { 
  ShoppingBag, 
  TrendingUp, 
  Database, 
  Layout, 
  Tag, 
  Box, 
  AlertCircle, 
  Plus, 
  Palette, 
  ChevronRight, 
  Folder, 
  ArrowUpRight,
  TrendingDown,
  DollarSign
} from "lucide-react";
import { ShopState, Product } from "../types";

export interface DashboardGeneralProps {
  store: ShopState;
  navigateAdminSection: (section: "general" | "products" | "categories" | "promos" | "security" | "stock" | "dashboard" | "banner" | "footer") => void;
  setStockFilterTab?: (tab: "all" | "outOfStock" | "lowStock" | "alerts") => void;
  setIsNewProductMode?: (mode: boolean) => void;
  setEditingProduct?: (product: Product | null) => void;
}

export function DashboardGeneral({
  store,
  navigateAdminSection,
  setStockFilterTab,
  setIsNewProductMode,
  setEditingProduct
}: DashboardGeneralProps) {

  const activeProducts = store.products.filter(p => p.active !== false);
  const pausedProducts = activeProducts.filter(p => p.paused === true);
  const liveProducts = activeProducts.filter(p => p.paused !== true);

  // Financial computations
  const totalInventoryValue = activeProducts.reduce((sum, p) => sum + (p.stock || 0) * p.price, 0);
  const avgProductPrice = activeProducts.length > 0 
    ? activeProducts.reduce((sum, p) => sum + p.price, 0) / activeProducts.length 
    : 0;

  // Alerts computations
  const lowStockThresholdSetting = typeof store.settings?.lowStockThreshold === 'number' ? store.settings.lowStockThreshold : 5;
  const outOfStockProducts = activeProducts.filter(p => p.stock <= 0);
  const lowStockProducts = activeProducts.filter(p => p.stock > 0 && p.stock <= lowStockThresholdSetting);
  const totalStockAlerts = outOfStockProducts.length + lowStockProducts.length;

  // Coupons
  const couponsList = store.coupons || [];
  const activeCoupons = couponsList.filter(c => c.active !== false);

  // Categories distribution list
  const categoriesList = store.dbCategories || [
    { id: "ropa", nombre: "Ropa", icono: "Shirt" },
    { id: "electronica", nombre: "Artículos electrónicos", icono: "Smartphone" },
    { id: "accesorios", nombre: "Accesorios", icono: "Sparkles" },
    { id: "hogar", nombre: "Hogar", icono: "Home" }
  ];

  const distribution = categoriesList.map(cat => {
    // filter products using either categoria_id or string matching
    const count = activeProducts.filter(p => 
      p.categoria_id === cat.id || 
      p.category.toLowerCase() === cat.nombre.toLowerCase()
    ).length;
    
    const value = activeProducts
      .filter(p => p.categoria_id === cat.id || p.category.toLowerCase() === cat.nombre.toLowerCase())
      .reduce((sum, p) => sum + (p.stock || 0) * p.price, 0);

    return {
      ...cat,
      count,
      value
    };
  }).sort((a, b) => b.count - a.count);

  // Top Products by Stock Value
  const topProductsByValue = [...activeProducts]
    .map(p => ({
      ...p,
      inventoryValue: (p.stock || 0) * p.price
    }))
    .sort((a, b) => b.inventoryValue - a.inventoryValue)
    .slice(0, 5);

  // Recents Addition list
  const recentProducts = [...activeProducts]
    .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime())
    .slice(0, 4);

  // Percentage calculations
  const maxProductsCategory = Math.max(...distribution.map(d => d.count), 1);

  return (
    <div className="w-full space-y-6 animate-fade-in">
      
      {/* 1. Header Greeting Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-zinc-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden shadow-xl">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-5 pointer-events-none">
          <Database className="h-full w-full stroke-[1px] rotate-12 scale-110" />
        </div>
        <div className="space-y-1 relative z-10">
          <h3 className="text-lg font-bold tracking-tight">¡Hola, Juem! Bienvenido a tu Centro de Control</h3>
          <p className="text-xs text-zinc-400 font-medium">
            Sugerencias de optimización en tiempo real para elevar la facturación y optimizar el inventario de tu comercio.
          </p>
        </div>
        <div className="flex gap-2 shrink-0 relative z-10">
          {totalStockAlerts > 0 ? (
            <div className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-lg text-xs font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping"></span>
              <span>Atención: {totalStockAlerts} Alertas de Reposición</span>
            </div>
          ) : (
            <div className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs font-bold flex items-center gap-1.5">
              <span>✓ Todo Sincronizado & Correcto</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Visual KPI Metrics Cards Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* KPI Card 1: Total Products */}
        <div className="bg-white dark:bg-zinc-950 p-5 rounded-2xl border border-slate-200 dark:border-zinc-850 shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono font-black text-slate-500 dark:text-zinc-400 tracking-wider">Productos en Catálogo</span>
            <div className="h-8 w-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <ShoppingBag className="h-4.5 w-4.5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">{activeProducts.length}</span>
              <span className="text-[10px] font-bold text-emerald-500 flex items-center">
                <ArrowUpRight className="h-3 w-3 inline" /> +{liveProducts.length} activos
              </span>
            </div>
            <p className="text-[10px] text-zinc-450 dark:text-zinc-500 font-semibold mt-1">
              {pausedProducts.length} productos pausados temporalmente
            </p>
          </div>
        </div>

        {/* KPI Card 2: Inventory Value */}
        <div className="bg-white dark:bg-zinc-950 p-5 rounded-2xl border border-slate-200 dark:border-zinc-850 shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono font-black text-slate-500 dark:text-zinc-400 tracking-wider">Valor del Inventario</span>
            <div className="h-8 w-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <DollarSign className="h-4.5 w-4.5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                ${totalInventoryValue.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <p className="text-[10px] text-zinc-450 dark:text-zinc-500 font-semibold mt-1">
              {activeProducts.reduce((sum, p) => sum + p.stock, 0)} unidades físicas de stock valorizadas
            </p>
          </div>
        </div>

        {/* KPI Card 3: Stock Shortages & Alerts */}
        <div onClick={() => {
          if (setStockFilterTab) setStockFilterTab("alerts");
          navigateAdminSection("stock");
        }} className="bg-white dark:bg-zinc-950 p-5 rounded-2xl border border-slate-200 dark:border-zinc-850 shadow-sm flex flex-col justify-between space-y-4 cursor-pointer hover:border-amber-500/40 transition group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono font-black text-slate-500 dark:text-zinc-400 tracking-wider">Alertas Criticas</span>
            <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${
              totalStockAlerts > 0 
                ? "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400" 
                : "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400"
            }`}>
              <AlertCircle className="h-4.5 w-4.5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-extrabold tracking-tight ${totalStockAlerts > 0 ? "text-amber-600 dark:text-amber-400" : "text-slate-900 dark:text-white"}`}>
                {totalStockAlerts}
              </span>
              <span className="text-[10px] font-bold text-zinc-500">
                {outOfStockProducts.length} agotados
              </span>
            </div>
            <p className="text-[10px] text-indigo-500 font-bold group-hover:underline flex items-center gap-1 mt-1">
              Gestionar reposición <ChevronRight className="h-3 w-3" />
            </p>
          </div>
        </div>

        {/* KPI Card 4: Coupons Admin */}
        <div onClick={() => navigateAdminSection("promos")} className="bg-white dark:bg-zinc-950 p-5 rounded-2xl border border-slate-200 dark:border-zinc-850 shadow-sm flex flex-col justify-between space-y-4 cursor-pointer hover:border-indigo-500/40 transition group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono font-black text-slate-500 dark:text-zinc-400 tracking-wider">Promociones y Cupones</span>
            <div className="h-8 w-8 rounded-xl bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Tag className="h-4.5 w-4.5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {activeCoupons.length}
              </span>
              <span className="text-[10px] font-mono text-zinc-500">cupones activos</span>
            </div>
            <p className="text-[10px] text-zinc-450 dark:text-zinc-500 font-semibold mt-1 group-hover:underline flex items-center gap-1">
              Ver descuentos vigentes <ChevronRight className="h-3 w-3" />
            </p>
          </div>
        </div>

      </div>

      {/* 3. Central Grid - Interactive Visual Chart and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* SVG Distribution / Top valued products visual graph */}
        <div className="lg:col-span-8 bg-white dark:bg-zinc-950 p-5 rounded-2xl border border-slate-200 dark:border-zinc-850 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h4 className="font-bold text-xs uppercase text-slate-900 dark:text-zinc-200 tracking-wide flex items-center gap-2">
                <TrendingUp className="h-4.5 w-4.5 text-indigo-500" />
                <span>Top 5 Productos de Mayor Valor de Inventario</span>
              </h4>
              <p className="text-[10px] text-zinc-450 dark:text-zinc-500">Multiplicador en base a precio unitario por cantidad física.</p>
            </div>
            <span className="text-[9px] font-mono font-bold bg-slate-100 dark:bg-zinc-900 text-zinc-500 px-2 py-0.5 rounded">Fórmula: Stock × Costo</span>
          </div>

          {/* SVG Visual Graphic Design representing the Top valued items */}
          <div className="space-y-3.5 pt-2">
            {topProductsByValue.length === 0 ? (
              <div className="text-center py-8 text-zinc-400 text-xs font-semibold">
                Sube productos al catálogo con stock registrado para generar gráficos del inventario.
              </div>
            ) : (
              topProductsByValue.map((prod, idx) => {
                const totalVal = prod.inventoryValue || 0;
                // find proportion
                const maxVal = Math.max(...topProductsByValue.map(x => x.inventoryValue), 1);
                const percent = Math.min((totalVal / maxVal) * 100, 100);

                return (
                  <div key={prod.id} className="space-y-1">
                    <div className="flex justify-between items-center text-[11px]">
                      <div className="font-bold text-slate-800 dark:text-zinc-300 truncate max-w-[70%]">
                        <span className="text-indigo-500 font-mono text-[10px] mr-1.5">#0{idx+1}</span>
                        {prod.name}
                      </div>
                      <div className="font-mono font-bold text-slate-950 dark:text-white text-right">
                        ${totalVal.toLocaleString("es-AR")} <span className="text-[9px] text-zinc-450 dark:text-zinc-650">({prod.stock}u)</span>
                      </div>
                    </div>
                    {/* Visual Bar representation */}
                    <div className="w-full h-3 bg-slate-100 dark:bg-zinc-900 rounded-full overflow-hidden relative">
                      <div 
                        style={{ width: `${percent}%` }}
                        className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-1000"
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Quick business operational actions */}
        <div className="lg:col-span-4 bg-white dark:bg-zinc-950 p-5 rounded-2xl border border-slate-200 dark:border-zinc-850 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <h4 className="font-bold text-xs uppercase text-slate-900 dark:text-zinc-200 tracking-wide mb-3 flex items-center gap-2">
              <Layout className="h-4.5 w-4.5 text-blue-500" />
              <span>Acciones Operativas Rápidas</span>
            </h4>
            <div className="space-y-2">
              
              <button
                onClick={() => {
                  if (setIsNewProductMode) setIsNewProductMode(true);
                  if (setEditingProduct) setEditingProduct(null);
                  navigateAdminSection("products");
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-dashed border-slate-200 dark:border-zinc-800 hover:border-indigo-500 hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="h-7 w-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 text-indigo-500 flex items-center justify-center">
                    <Plus className="h-4 w-4" />
                  </div>
                  <div>
                    <h5 className="text-[11px] font-bold text-slate-800 dark:text-zinc-200 group-hover:text-indigo-500 transition">Agregar Producto</h5>
                    <p className="text-[9px] text-zinc-450 dark:text-zinc-500">Carga nuevo artículo al catálogo</p>
                  </div>
                </div>
                <ChevronRight className="h-3 w-3 text-zinc-400 group-hover:translate-x-0.5 transition" />
              </button>

              <button
                onClick={() => {
                  if (setStockFilterTab) setStockFilterTab("outOfStock");
                  navigateAdminSection("stock");
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-dashed border-slate-200 dark:border-zinc-800 hover:border-red-500 hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="h-7 w-7 rounded-lg bg-red-50 dark:bg-red-950/20 text-red-500 flex items-center justify-center">
                    <AlertCircle className="h-4 w-4" />
                  </div>
                  <div>
                    <h5 className="text-[11px] font-bold text-slate-800 dark:text-zinc-200 group-hover:text-red-500 transition">Ver Agotados</h5>
                    <p className="text-[9px] text-zinc-450 dark:text-zinc-500">Artículos con stock cero</p>
                  </div>
                </div>
                <ChevronRight className="h-3 w-3 text-zinc-400 group-hover:translate-x-0.5 transition" />
              </button>

              <button
                onClick={() => navigateAdminSection("general")}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-dashed border-slate-200 dark:border-zinc-800 hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="h-7 w-7 rounded-lg bg-blue-50 dark:bg-blue-950/20 text-blue-500 flex items-center justify-center">
                    <Palette className="h-4 w-4" />
                  </div>
                  <div>
                    <h5 className="text-[11px] font-bold text-slate-800 dark:text-zinc-200 group-hover:text-blue-500 transition">Personalizar Branding</h5>
                    <p className="text-[9px] text-zinc-450 dark:text-zinc-500">Editar diseño, logos y colores</p>
                  </div>
                </div>
                <ChevronRight className="h-3 w-3 text-zinc-400 group-hover:translate-x-0.5 transition" />
              </button>

            </div>
          </div>

          <div className="bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-850 rounded-xl p-3 text-[10px] text-zinc-450 dark:text-zinc-500 leading-relaxed">
            💡 <strong>Consejo del mes:</strong> Los productos con stock bajo reducen conversiones en un 15%. Revisa periódicamente las reposiciones.
          </div>
        </div>

      </div>

      {/* 4. Category Density & Recent Catalog additions blocks */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Category Density List */}
        <div className="lg:col-span-5 bg-white dark:bg-zinc-950 p-5 rounded-2xl border border-slate-200 dark:border-zinc-850 shadow-sm space-y-4">
          <div>
            <h4 className="font-bold text-xs uppercase text-slate-900 dark:text-zinc-200 tracking-wide flex items-center gap-2">
              <Folder className="h-4.5 w-4.5 text-indigo-500" />
              <span>Distribución por Categorías</span>
            </h4>
            <p className="text-[10px] text-zinc-450 dark:text-zinc-500">Cantidad y valor del stock distribuido por área.</p>
          </div>

          <div className="space-y-3.5 max-h-[280px] overflow-y-auto pr-1">
            {distribution.map((cat) => {
              const barPercent = Math.min((cat.count / maxProductsCategory) * 100, 100);

              return (
                <div key={cat.id} className="space-y-1.5">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="font-bold text-slate-800 dark:text-zinc-300">{cat.nombre}</span>
                    <span className="font-mono text-zinc-500 font-bold">
                      {cat.count} items <span className="text-zinc-400 font-medium font-sans">(${cat.value.toLocaleString("es-AR")})</span>
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-zinc-900 rounded-full overflow-hidden">
                    <div 
                      style={{ width: `${barPercent}%` }}
                      className="h-full bg-indigo-500 rounded-full"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Additions List */}
        <div className="lg:col-span-7 bg-white dark:bg-zinc-950 p-5 rounded-2xl border border-slate-200 dark:border-zinc-850 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-xs uppercase text-slate-900 dark:text-zinc-200 tracking-wide flex items-center gap-2">
              <Plus className="h-4.5 w-4.5 text-blue-500" />
              <span>Últimos Productos Añadidos</span>
            </h4>
            <p className="text-[10px] text-zinc-450 dark:text-zinc-500">Revisiones del alta de productos al catálogo de forma cronológica.</p>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-zinc-850 flex-1">
            {recentProducts.length === 0 ? (
              <div className="text-center py-8 text-zinc-400 text-xs font-semibold">
                No hay productos dados de alta en este momento.
              </div>
            ) : (
              recentProducts.map((p) => {
                const stockStatus = p.stock <= 0 
                  ? "text-red-500" 
                  : p.stock <= lowStockThresholdSetting 
                    ? "text-amber-500" 
                    : "text-zinc-400";

                return (
                  <div key={p.id} className="py-2.5 flex items-center justify-between gap-3 text-xs leading-none">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img 
                        src={p.imageUrl || "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=100&q=80"}
                        alt={p.name}
                        className="h-8 w-8 rounded-lg object-cover bg-zinc-900 shrink-0 border border-slate-200 dark:border-zinc-800"
                      />
                      <div className="min-w-0">
                        <h5 className="font-bold text-slate-800 dark:text-zinc-200 truncate">{p.name}</h5>
                        <p className="text-[10px] text-zinc-450 dark:text-zinc-500 mt-1 uppercase font-semibold">{p.category}</p>
                      </div>
                    </div>
                    
                    <div className="text-right shrink-0">
                      <span className="font-bold font-mono text-slate-950 dark:text-white block">${p.price.toFixed(2)}</span>
                      <span className={`text-[10px] font-bold ${stockStatus} mt-1 block`}>
                        {p.stock <= 0 ? "Agotado" : `${p.stock} unidades`}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          
          <button
            onClick={() => navigateAdminSection("products")}
            className="w-full text-center py-2 text-[11px] font-bold text-indigo-500 hover:text-indigo-400 transition cursor-pointer border-t border-slate-100 dark:border-zinc-850 pt-3"
          >
            Ver catálogo completo de productos →
          </button>
        </div>

      </div>

    </div>
  );
}
