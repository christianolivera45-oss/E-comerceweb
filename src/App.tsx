import React, { useState, useRef } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { ProductCard } from './components/ProductCard';
import { ProductModal } from './components/ProductModal';
import { CartDrawer } from './components/CartDrawer';
import { AdminPanel } from './components/AdminPanel';
import { Product } from './types';
import { 
  Filter, 
  HelpCircle, 
  Send, 
  ShoppingBag, 
  ArrowRight, 
  Sparkles,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

function Storefront() {
  const { 
    products, 
    categories, 
    settings, 
    isSandbox, 
    loading 
  } = useStore();

  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const catalogRef = useRef<HTMLDivElement>(null);

  // Filter products by category and query string
  const filteredProducts = products.filter((p) => {
    const matchesCategory = activeCategory === 'all' || p.categories.includes(activeCategory);
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featuredProducts = filteredProducts.filter(p => p.featured && p.stock > 0);
  const regularProducts = filteredProducts.filter(p => !p.featured || p.stock <= 0);

  const handleScrollToCatalog = () => {
    catalogRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Format price helper
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(value);
  };

  if (loading) {
    return (
      <div className="h-screen w-screen bg-gray-50 flex flex-col items-center justify-center space-y-4">
        <div className="h-12 w-12 rounded-full border-4 border-gray-200 border-t-black animate-spin" />
        <p className="text-gray-500 font-mono text-sm tracking-widest animate-pulse">Cargando tienda online...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 selection:bg-black selection:text-white flex flex-col justify-between">
      
      {/* Dynamic top header bar */}
      <Header
        isAdminOpen={adminOpen}
        setAdminOpen={setAdminOpen}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={activeCategory}
        setSelectedCategory={setActiveCategory}
        setCartOpen={setCartOpen}
      />

      {/* Sandbox education indicator warning */}
      {isSandbox && (
        <div className="bg-amber-50 border-b border-amber-200 text-center py-2.5 px-4 text-xs font-mono text-amber-800 flex items-center justify-center gap-1.5 leading-relaxed">
          <span>⚠️</span>
          <span>
            <strong>Bypass Sandbox Activo:</strong> Estás navegando en ambiente local. Los cambios de productos, precios y CMS se guardan instantáneamente en tu navegador.
          </span>
        </div>
      )}

      {/* Core Body Container Switcher */}
      <main className="flex-grow">
        {adminOpen ? (
          // View 1: Administration Console Control Panel
          <AdminPanel />
        ) : (
          // View 2: Customer Storefront Catalogs
          <>
            {/* Promo Hero graphic header */}
            <Hero onBrowseClick={handleScrollToCatalog} />

            {/* Catalog Main section */}
            <div ref={catalogRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
              
              {/* Category tags pill filtration layout */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
                <div className="flex items-center gap-2">
                  <Filter size={18} className="text-black" />
                  <h2 className="text-lg font-bold font-sans tracking-tight text-gray-950">Navegar por Categoría</h2>
                </div>

                <div className="flex flex-wrap gap-2 max-w-full">
                  <button
                    onClick={() => setActiveCategory('all')}
                    className={`py-2 px-4 rounded-xl text-xs sm:text-xs font-bold tracking-tight transition-all uppercase font-mono ${
                      activeCategory === 'all' 
                        ? 'bg-black text-white shadow-sm' 
                        : 'bg-white border border-gray-200 hover:bg-gray-100 text-gray-600'
                    }`}
                  >
                    Todos
                  </button>
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setActiveCategory(c.id)}
                      className={`py-2 px-4 rounded-xl text-xs sm:text-xs font-bold tracking-tight transition-all uppercase font-mono ${
                        activeCategory === c.id 
                          ? 'bg-black text-white shadow-sm' 
                          : 'bg-white border border-gray-200 hover:bg-gray-100 text-gray-600'
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Products Catalog Display Grid */}
              {filteredProducts.length === 0 ? (
                <div className="py-20 text-center max-w-md mx-auto space-y-4">
                  <div className="h-16 w-16 bg-white border border-gray-200 rounded-3xl flex items-center justify-center text-gray-400 mx-auto shadow-sm">
                    <Filter size={28} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">No encontramos productos coincidentes</p>
                    <p className="text-xs text-gray-450 pt-1 leading-relaxed font-mono">
                      Probá modificando la búsqueda de palabras o elegiendo otra categoría en las etiquetas superiores.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-12">
                  {/* FEATURED SETS */}
                  {featuredProducts.length > 0 && (
                    <div className="space-y-6">
                      <div className="flex items-center gap-2">
                        <Sparkles size={18} className="text-black" />
                        <h3 className="font-sans font-bold text-xl tracking-tight text-gray-950">Selecciones Deseadas</h3>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                        {featuredProducts.map((p) => (
                          <ProductCard
                            key={p.id}
                            product={p}
                            onViewClick={setSelectedProduct}
                            onAddToCart={(prod) => setSelectedProduct(prod)} // Opens modal to select quant/buy directly
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* REGULAR AND RECENT ADDITIONS */}
                  {regularProducts.length > 0 && (
                    <div className="space-y-6">
                      <h3 className="font-sans font-semibold text-lg tracking-tight text-gray-650 block">
                        {featuredProducts.length > 0 ? 'Otros Productos Disponibles' : 'Catálogo Completo'}
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 justify-stretch">
                        {regularProducts.map((p) => (
                          <ProductCard
                            key={p.id}
                            product={p}
                            onViewClick={setSelectedProduct}
                            onAddToCart={(prod) => setSelectedProduct(prod)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          </>
        )}
      </main>

      {/* Floating details page modal */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      {/* Fly-out shopping cart sidebar drawer */}
      {cartOpen && (
        <CartDrawer onClose={() => setCartOpen(false)} />
      )}

      {/* Footer credits and social contacts */}
      <footer className="bg-white text-gray-600 border-t border-gray-200 py-12 mt-16 text-xs font-mono">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start border-b border-gray-200 pb-8 mb-8">
            
            <div className="md:col-span-6 space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-black font-bold text-white flex items-center justify-center text-sm font-sans tracking-tight">
                  {settings.title ? settings.title.charAt(0).toUpperCase() : 'T'}
                </div>
                <span className="font-bold text-gray-900 font-sans text-sm tracking-tight">{settings.title}</span>
              </div>
              <p className="text-gray-500 leading-relaxed font-sans text-xs max-w-sm">
                {settings.description || 'Tienda oficial multirrubro de alto rendimiento e importaciones seleccionadas directa.'}
              </p>
            </div>

            <div className="md:col-span-3 space-y-3">
              <p className="font-bold text-gray-800 font-sans text-xs uppercase tracking-wider">Contacto Seguro</p>
              <ul className="space-y-2 text-[11px] text-gray-600">
                <li>WhatsApp: +{settings.whatsappNumber || '541123456789'}</li>
                <li>Atención al Cliente: Lunes a Sábados 9 a 20hs</li>
                <li>Despachos y Retiros de Lunes a Viernes</li>
              </ul>
            </div>

            <div className="md:col-span-3 space-y-3">
              <p className="font-bold text-gray-800 font-sans text-xs uppercase tracking-wider">Sistema E-Commerce</p>
              <p className="text-gray-500 leading-relaxed text-[11px]">
                Plataforma integrada estilo Shopify administrable en tiempo real. Configurado con Firestore regional y autenticación federada en nube.
              </p>
            </div>

          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] text-gray-400">
            <p>© 2026 {settings.title || 'Trendify Concept'}. Todos los derechos reservados.</p>
            <div className="flex items-center gap-1">
              <ShieldCheck size={14} className="text-emerald-600" />
              <span>Checkout Seguro 256-bit por Canales Directos</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <Storefront />
    </StoreProvider>
  );
}
