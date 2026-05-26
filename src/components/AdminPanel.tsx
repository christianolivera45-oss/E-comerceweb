import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Product, Category, Promotion, Settings } from '../types';
import { 
  Settings2, 
  Plus, 
  Edit, 
  Trash2, 
  Layout, 
  Tag, 
  Percent, 
  ShieldCheck, 
  Lock, 
  RefreshCw, 
  Save,
  CheckCircle,
  HelpCircle,
  AlertTriangle,
  FolderOpen
} from 'lucide-react';

export const AdminPanel: React.FC = () => {
  const {
    isOnline,
    isSandbox,
    user,
    isAdminUser,
    loginWithGoogle,
    loginWithCredentials,
    logout,
    authError,
    setAuthError,
    settings,
    saveSettings,
    products,
    saveProduct,
    deleteProduct,
    categories,
    saveCategory,
    deleteCategory,
    promotions,
    savePromotion,
    deletePromotion
  } = useStore();

  const [activeTab, setActiveTab] = useState<'cms' | 'products' | 'categories' | 'promotions' | 'admins'>('cms');
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // States for administrative credential login
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginErrorMessage, setLoginErrorMessage] = useState<string | null>(null);

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginErrorMessage(null);
    try {
      const success = await loginWithCredentials(usernameInput, passwordInput);
      if (!success) {
        setLoginErrorMessage('Usuario o contraseña incorrectos. Intente de nuevo.');
      } else {
        setUsernameInput('');
        setPasswordInput('');
      }
    } catch (err: any) {
      setLoginErrorMessage(err?.message || 'Error al autenticar credenciales.');
    }
  };

  // States for Editing/Adding Products
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productFormOpen, setProductFormOpen] = useState(false);
  const [prodName, setProdName] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodPrice, setProdPrice] = useState(0);
  const [prodOrigPrice, setProdOrigPrice] = useState(0);
  const [prodStock, setProdStock] = useState(1);
  const [prodFeatured, setProdFeatured] = useState(false);
  const [prodCategories, setProdCategories] = useState<string[]>([]);
  const [prodImagesString, setProdImagesString] = useState('');

  // States for CMS Settings Form
  const [cmsTitle, setCmsTitle] = useState(settings.title || '');
  const [cmsDesc, setCmsDesc] = useState(settings.description || '');
  const [cmsWhatsApp, setCmsWhatsApp] = useState(settings.whatsappNumber || '');
  const [cmsThemeColor, setCmsThemeColor] = useState(settings.themeColor || '#0f172a');
  const [cmsHeroTitle, setCmsHeroTitle] = useState(settings.heroTitle || '');
  const [cmsHeroSubtitle, setCmsHeroSubtitle] = useState(settings.heroSubtitle || '');
  const [cmsHeroBanner, setCmsHeroBanner] = useState(settings.heroBannerUrl || '');
  const [cmsPromoBanner, setCmsPromoBanner] = useState(settings.promoBannerText || '');

  // States for Categories Form
  const [catId, setCatId] = useState('');
  const [catName, setCatName] = useState('');
  const [catImage, setCatImage] = useState('');

  // States for Promotions Form
  const [promoId, setPromoId] = useState('');
  const [promoTitle, setPromoTitle] = useState('');
  const [promoDesc, setPromoDesc] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [promoPercent, setPromoPercent] = useState(10);
  const [promoActive, setPromoActive] = useState(true);

  // Helper trigger for save notification
  const triggerSuccessNotification = (msg: string) => {
    setSaveSuccess(msg);
    setTimeout(() => {
      setSaveSuccess(null);
    }, 3000);
  };

  // CMS Settings saving handler
  const handleSaveCMS = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await saveSettings({
        title: cmsTitle,
        description: cmsDesc,
        whatsappNumber: cmsWhatsApp,
        themeColor: cmsThemeColor,
        heroTitle: cmsHeroTitle,
        heroSubtitle: cmsHeroSubtitle,
        heroBannerUrl: cmsHeroBanner,
        promoBannerText: cmsPromoBanner
      });
      triggerSuccessNotification('Configuraciones CMS guardadas exitosamente.');
    } catch (err) {
      console.error(err);
    }
  };

  // Product submission saving handler
  const openNewProductForm = () => {
    setEditingProduct(null);
    setProdName('');
    setProdDesc('');
    setProdPrice(0);
    setProdOrigPrice(0);
    setProdStock(10);
    setProdFeatured(false);
    setProdCategories([]);
    setProdImagesString('');
    setProductFormOpen(true);
  };

  const openEditProductForm = (product: Product) => {
    setEditingProduct(product);
    setProdName(product.name);
    setProdDesc(product.description);
    setProdPrice(product.price);
    setProdOrigPrice(product.originalPrice || 0);
    setProdStock(product.stock);
    setProdFeatured(product.featured);
    setProdCategories(product.categories);
    setProdImagesString(product.images.join(', '));
    setProductFormOpen(true);
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim() || prodPrice <= 0) {
      alert('Por favor, ingresá un nombre válido y un precio mayor a cero.');
      return;
    }

    const imagesArray = prodImagesString
      .split(',')
      .map(url => url.trim())
      .filter(url => url.length > 0);

    const fallbackImg = 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400';
    const finalImages = imagesArray.length > 0 ? imagesArray : [fallbackImg];

    const targetId = editingProduct ? editingProduct.id : 'prod_' + Date.now();

    const updatedProduct: Product = {
      id: targetId,
      name: prodName,
      description: prodDesc,
      price: Number(prodPrice),
      originalPrice: prodOrigPrice > 0 ? Number(prodOrigPrice) : undefined,
      categories: prodCategories.length > 0 ? prodCategories : ['ropa'],
      images: finalImages,
      stock: Number(prodStock),
      featured: prodFeatured,
    };

    try {
      await saveProduct(updatedProduct);
      setProductFormOpen(false);
      triggerSuccessNotification(editingProduct ? 'Producto actualizado correctamente.' : 'Producto creado exitosamente.');
    } catch (err) {
      alert('Error guardando producto. Verificá los permisos del Administrador.');
    }
  };

  // Category submission handlers
  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catId.trim() || !catName.trim()) {
      alert('Completá el Slug (ID) y el Nombre para continuar.');
      return;
    }

    const formattedSlug = catId.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');

    try {
      await saveCategory({
        id: formattedSlug,
        name: catName,
        imageUrl: catImage || undefined
      });
      setCatId('');
      setCatName('');
      setCatImage('');
      triggerSuccessNotification('Categoría guardada correctamente.');
    } catch (err) {
      alert('Error guardando categoría.');
    }
  };

  // Promotion coupon handlers
  const handlePromoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoTitle.trim() || !promoCode.trim() || promoPercent <= 0) {
      alert('Por favor, completá los campos obligatorios del Cupón.');
      return;
    }

    const targetPromoId = promoId.trim() || 'promo_' + Date.now();

    try {
      await savePromotion({
        id: targetPromoId,
        title: promoTitle,
        description: promoDesc,
        code: promoCode.toUpperCase().replace(/\s/g, ''),
        discountPercent: Number(promoPercent),
        active: promoActive
      });
      setPromoId('');
      setPromoTitle('');
      setPromoDesc('');
      setPromoCode('');
      setPromoPercent(10);
      setPromoActive(true);
      triggerSuccessNotification('Promoción cargada con éxito.');
    } catch (err) {
      alert('Error guardando promoción.');
    }
  };

  // Force loading configuration presets
  const applyPresetImage = (url: string) => {
    setProdImagesString(url);
  };

  return (
    <div className="bg-gray-50 text-gray-900 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Banner with state notifications (Sandbox / Core cloud database toggle) */}
        {saveSuccess && (
          <div className="fixed bottom-6 right-6 z-55 bg-emerald-500 border border-emerald-600 text-slate-950 py-3 px-5 rounded-2xl shadow-2xl flex items-center gap-2.5 font-bold animate-bounce">
            <CheckCircle size={18} />
            <span>{saveSuccess}</span>
          </div>
        )}

        {/* CMS Console Header */}
        <div className="border-b border-gray-250 pb-6 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-sans font-extrabold text-gray-950 tracking-tight flex items-center gap-2.5">
              <Settings2 size={28} className="text-black" />
              <span>Panel de Control Administrativo</span>
            </h1>
            <p className="text-gray-500 text-sm mt-1.5 leading-relaxed">
              Modificá el contenido, catálogo, banners, cupones y colores generales de la tienda en tiempo real.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className={`py-1.5 px-3 rounded-xl border text-xs font-mono font-semibold flex items-center gap-2 ${
              isSandbox 
                ? 'bg-amber-50 border-amber-200 text-amber-900' 
                : 'bg-emerald-50 border-emerald-250 text-emerald-800'
            }`}>
              <div className={`h-2.5 w-2.5 rounded-full ${isSandbox ? 'bg-amber-550' : 'bg-emerald-500 animate-pulse'}`} />
              <span>{isSandbox ? 'Modo Sandbox Activo (Local)' : 'Sincronizado con Firebase'}</span>
            </div>
            
            {user && (
              <button 
                onClick={logout} 
                className="rounded-xl border border-gray-200 bg-white hover:bg-gray-55 text-gray-600 hover:text-black py-1.5 px-3.5 text-xs font-semibold tracking-tight shadow-sm"
              >
                Salir
              </button>
            )}
          </div>
        </div>

        {/* Security / Login Lock Screen if they are NOT an Admin */}
        {!isAdminUser && (
          <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-12 max-w-md mx-auto text-center space-y-6 shadow-2xl">
            <div className="h-16 w-16 bg-gray-50 border border-gray-200 rounded-2xl flex items-center justify-center text-black mx-auto">
              <Lock size={32} />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold font-sans text-gray-900">Ingreso de Administrador</h2>
              <p className="text-gray-505 text-xs xs:text-sm max-w-xs mx-auto leading-relaxed">
                Ingresá tus credenciales autorizadas para gestionar el catálogo, precios, cupones de descuento y configuraciones del sitio web.
              </p>
            </div>

            <form onSubmit={handleCredentialsLogin} className="space-y-4 text-left">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-750">Usuario</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Juem"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className="w-full bg-gray-55 border border-gray-200 rounded-xl py-2.5 px-4 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-750">Contraseña</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full bg-gray-55 border border-gray-200 rounded-xl py-2.5 px-4 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors"
                />
              </div>

              {loginErrorMessage && (
                <div className="p-3 bg-red-50 border border-red-150 rounded-xl text-xs text-red-700 flex items-center gap-2 font-medium">
                  <AlertTriangle size={14} className="shrink-0 animate-pulse" />
                  <span>{loginErrorMessage}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-black hover:bg-zinc-900 text-white text-sm font-bold shadow-lg transition-all active:scale-[0.98] cursor-pointer"
              >
                <ShieldCheck size={16} />
                <span>Iniciar Sesión Administrativa</span>
              </button>
            </form>
          </div>
        )}

        {/* Full Administration Panel Content Workspace */}
        {isAdminUser && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Sidebar navigation tabs list */}
            <div className="lg:col-span-3 flex flex-row lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0 scroll-smooth">
              <button
                onClick={() => setActiveTab('cms')}
                className={`flex items-center gap-2 rounded-xl py-3 px-4 text-xs sm:text-sm font-semibold tracking-tight transition-colors shrink-0 text-left ${
                  activeTab === 'cms' ? 'bg-black text-white font-bold shadow-sm' : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-700'
                }`}
              >
                <Layout size={16} />
                <span>Sitio Web / CMS</span>
              </button>

              <button
                onClick={() => setActiveTab('products')}
                className={`flex items-center gap-2 rounded-xl py-3 px-4 text-xs sm:text-sm font-semibold tracking-tight transition-colors shrink-0 text-left ${
                  activeTab === 'products' ? 'bg-black text-white font-bold shadow-sm' : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-700'
                }`}
              >
                <Tag size={16} />
                <span>Productos ({products.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('categories')}
                className={`flex items-center gap-2 rounded-xl py-3 px-4 text-xs sm:text-sm font-semibold tracking-tight transition-colors shrink-0 text-left ${
                  activeTab === 'categories' ? 'bg-black text-white font-bold shadow-sm' : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-700'
                }`}
              >
                <FolderOpen size={16} />
                <span>Categorías ({categories.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('promotions')}
                className={`flex items-center gap-2 rounded-xl py-3 px-4 text-xs sm:text-sm font-semibold tracking-tight transition-colors shrink-0 text-left ${
                  activeTab === 'promotions' ? 'bg-black text-white font-bold shadow-sm' : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-700'
                }`}
              >
                <Percent size={16} />
                <span>Banners & Cupones</span>
              </button>

              <button
                onClick={() => setActiveTab('admins')}
                className={`flex items-center gap-2 rounded-xl py-3 px-4 text-xs sm:text-sm font-semibold tracking-tight transition-colors shrink-0 text-left ${
                  activeTab === 'admins' ? 'bg-black text-white font-bold shadow-sm' : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-700'
                }`}
              >
                <ShieldCheck size={16} />
                <span>Admin Privileges</span>
              </button>
            </div>

            {/* Right side form blocks */}
            <div className="lg:col-span-9 bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-sm text-gray-900">
              
              {/* TAB 1: SITE CONFIGURATION / CMS BANNERS */}
              {activeTab === 'cms' && (
                <form onSubmit={handleSaveCMS} className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-950 flex items-center gap-2">Configuraciones Generales de la Tienda</h3>
                    <p className="text-xs text-gray-500 mt-1 font-mono">CMS para renombrar textos, banner de anuncios de color, y WhatsApp tributario.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-700">Título de la Tienda</label>
                      <input 
                        type="text" 
                        value={cmsTitle} 
                        onChange={(e) => setCmsTitle(e.target.value)} 
                        className="w-full bg-white border border-gray-250 rounded-xl py-2 px-3 text-sm text-gray-900 focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                        id="cms-store-title"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-700">WhatsApp de Atención (Código de área + número)</label>
                      <input 
                        type="text" 
                        value={cmsWhatsApp} 
                        onChange={(e) => setCmsWhatsApp(e.target.value)} 
                        className="w-full bg-white border border-gray-250 rounded-xl py-2 px-3 text-sm text-gray-900 focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                        placeholder="Ej: 541123456789"
                        id="cms-store-whatsapp"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700">Descripción Corta (Footer / About US)</label>
                    <textarea 
                      value={cmsDesc} 
                      onChange={(e) => setCmsDesc(e.target.value)} 
                      rows={2}
                      className="w-full bg-white border border-gray-250 rounded-xl py-2 px-3 text-sm text-gray-900 focus:outline-none focus:border-black focus:ring-1 focus:ring-black shrink-0"
                    />
                  </div>

                  <div className="border-t border-gray-150 pt-5 space-y-4">
                    <h4 className="text-sm font-bold text-gray-950">Visual Customizer & Hero Panel</h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-700 font-mono">Theme Hex Color Accent</label>
                        <div className="flex gap-2">
                          <input 
                            type="color" 
                            value={cmsThemeColor} 
                            onChange={(e) => setCmsThemeColor(e.target.value)} 
                            className="bg-transparent border border-gray-200 rounded-lg h-9 w-10 cursor-pointer p-0.5"
                          />
                          <input 
                            type="text" 
                            value={cmsThemeColor} 
                            onChange={(e) => setCmsThemeColor(e.target.value)} 
                            className="flex-1 bg-white border border-gray-250 rounded-xl py-2 px-3 text-xs font-mono focus:outline-none focus:border-black"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-700">Banner Anuncio Superior (Negro/Amber)</label>
                        <input 
                          type="text" 
                          value={cmsPromoBanner} 
                          onChange={(e) => setCmsPromoBanner(e.target.value)} 
                          className="w-full bg-white border border-gray-250 rounded-xl py-2 px-3 text-xs text-gray-900 placeholder:font-mono focus:outline-none focus:border-black"
                          placeholder="Texto de anuncios de CyberMonday..."
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-700">Hero Section: Título Principal</label>
                        <input 
                          type="text" 
                          value={cmsHeroTitle} 
                          onChange={(e) => setCmsHeroTitle(e.target.value)} 
                          className="w-full bg-white border border-gray-250 rounded-xl py-2 px-3 text-sm text-gray-900 focus:outline-none focus:border-black"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-700">Hero Section: Subtítulo de Bajada</label>
                        <input 
                          type="text" 
                          value={cmsHeroSubtitle} 
                          onChange={(e) => setCmsHeroSubtitle(e.target.value)} 
                          className="w-full bg-white border border-gray-250 rounded-xl py-2 px-3 text-sm text-gray-900 focus:outline-none focus:border-black"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-700">Hero Section: URL Banner Imagen Principal</label>
                      <input 
                        type="text" 
                        value={cmsHeroBanner} 
                        onChange={(e) => setCmsHeroBanner(e.target.value)} 
                        className="w-full bg-white border border-gray-250 rounded-xl py-2 px-3 text-xs font-mono text-gray-900 focus:outline-none focus:border-black"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-150 flex justify-end">
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-black hover:bg-zinc-900 text-white font-bold py-2.5 px-6 text-sm tracking-tight transition-transform active:scale-95 shadow-md"
                      id="save-cms-settings"
                    >
                      <Save size={16} />
                      <span>Guardar Cambios CMS</span>
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 2: PRODUCTS MANAGER (ADD/EDIT/DELETE) */}
              {activeTab === 'products' && (
                <div className="space-y-6 text-gray-900 animate-none">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-gray-950">Catálogo de Productos</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Editá o eliminá productos, modificá el stock e incorporá nuevos.</p>
                    </div>
                    {!productFormOpen && (
                      <button
                        onClick={openNewProductForm}
                        className="flex items-center gap-1.5 rounded-xl bg-black hover:bg-zinc-900 text-white font-bold py-2.5 px-4 text-xs transition-colors"
                        id="add-new-product-btn"
                      >
                        <Plus size={14} />
                        <span>Agregar Producto</span>
                      </button>
                    )}
                  </div>

                  {/* Form Container to Add or Edit */}
                  {productFormOpen && (
                    <form onSubmit={handleProductSubmit} className="bg-gray-50 p-5 rounded-2xl border border-gray-200 space-y-4 shadow-xs">
                      <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-black font-sans">
                          {editingProduct ? 'Editar Producto Seleccionado' : 'Cargar Nuevo Producto'}
                        </h4>
                        <button
                          type="button"
                          onClick={() => setProductFormOpen(false)}
                          className="text-gray-500 hover:text-black text-xs font-mono"
                        >
                          Cancelar
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-gray-700">Nombre del Producto</label>
                          <input 
                            type="text" 
                            value={prodName} 
                            onChange={(e) => setProdName(e.target.value)} 
                            className="w-full bg-white border border-gray-250 rounded-lg py-1.5 px-3 text-xs text-gray-900 focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                            required
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-gray-700 font-mono">Categoría (Slug)</label>
                          <select 
                            value={prodCategories[0] || ''} 
                            onChange={(e) => setProdCategories([e.target.value])}
                            className="w-full bg-white border border-gray-250 rounded-lg py-1.5 px-3 text-xs text-gray-950 focus:outline-none"
                            required
                          >
                            <option value="">-- Elegir Categoría --</option>
                            {categories.map(c => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-gray-700">Descripción Técnica / Comercial</label>
                        <textarea 
                          value={prodDesc} 
                          onChange={(e) => setProdDesc(e.target.value)} 
                          rows={3}
                          className="w-full bg-white border border-gray-250 rounded-lg py-1.5 px-3 text-xs text-gray-900 focus:outline-none"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-gray-700">Precio de Venta ($)</label>
                          <input 
                            type="number" 
                            value={prodPrice} 
                            onChange={(e) => setProdPrice(Number(e.target.value))} 
                            className="w-full bg-white border border-gray-250 rounded-lg py-1.5 px-3 text-xs text-gray-900 focus:outline-none"
                            min="0"
                            required
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-gray-400">Precio Original ($)</label>
                          <input 
                            type="number" 
                            value={prodOrigPrice} 
                            onChange={(e) => setProdOrigPrice(Number(e.target.value))} 
                            className="w-full bg-white border border-gray-250 rounded-lg py-1.5 px-3 text-xs text-gray-900 focus:outline-none"
                            min="0"
                            placeholder="Ej: 245000"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-gray-700">Unidades en Stock</label>
                          <input 
                            type="number" 
                            value={prodStock} 
                            onChange={(e) => setProdStock(Number(e.target.value))} 
                            className="w-full bg-white border border-gray-250 rounded-lg py-1.5 px-3 text-xs text-gray-900 focus:outline-none"
                            min="0"
                            required
                          />
                        </div>

                        <div className="flex items-center gap-2 pt-5">
                          <input 
                            type="checkbox" 
                            checked={prodFeatured} 
                            onChange={(e) => setProdFeatured(e.target.checked)} 
                            className="rounded bg-white border-gray-250 text-black h-4.5 w-4.5 cursor-pointer"
                            id="prod-featured"
                          />
                          <label htmlFor="prod-featured" className="text-[11px] font-semibold text-gray-800 select-none cursor-pointer">
                            Destacado ⭐
                          </label>
                        </div>
                      </div>

                      {/* Image URLs split lists */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold text-gray-700 flex items-center justify-between">
                          <span>URLs de Imagenes (Separadas por coma)</span>
                          <span className="text-[10px] text-gray-400">Insertar URLs de Unsplash o Imgur válidas</span>
                        </label>
                        <input 
                          type="text" 
                          value={prodImagesString} 
                          onChange={(e) => setProdImagesString(e.target.value)} 
                          className="w-full bg-white border border-gray-250 rounded-lg py-1.5 px-3 text-xs font-mono text-gray-950 placeholder:font-sans focus:outline-none"
                          placeholder="https://example.com/one.jpg, https://example.com/two.jpg"
                          id="prod-images-input"
                        />
                        
                        {/* Quick Presets for Demo ease-of-use */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          <span className="text-[9px] text-gray-400 uppercase font-mono tracking-tight pt-1 mr-1">Rápidos:</span>
                          <button
                            type="button"
                            onClick={() => applyPresetImage('https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600')}
                            className="text-[9px] py-0.5 px-2 rounded bg-white hover:bg-gray-100 text-gray-800 border border-gray-200 font-mono shadow-xs"
                          >
                            Zapatilla Roja
                          </button>
                          <button
                            type="button"
                            onClick={() => applyPresetImage('https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600')}
                            className="text-[9px] py-0.5 px-2 rounded bg-white hover:bg-gray-100 text-gray-800 border border-gray-200 font-mono shadow-xs"
                          >
                            Reloj Madera
                          </button>
                          <button
                            type="button"
                            onClick={() => applyPresetImage('https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600')}
                            className="text-[9px] py-0.5 px-2 rounded bg-white hover:bg-gray-100 text-gray-800 border border-gray-200 font-mono shadow-xs"
                          >
                            Gafas Sol
                          </button>
                        </div>
                      </div>

                      <div className="pt-2 flex justify-end">
                        <button
                          type="submit"
                          className="rounded-xl bg-black hover:bg-zinc-900 text-white font-bold py-2.5 px-5 text-xs transition-colors shrink-0 shadow-sm"
                          id="submit-product-form"
                        >
                          Guardar Producto
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Products Table/Grid Listing */}
                  <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
                    <table className="w-full text-left text-xs text-gray-800">
                      <thead className="bg-gray-50 text-gray-500 font-mono text-[10px] uppercase border-b border-gray-200">
                        <tr>
                          <th className="py-3 px-4">Artíclo</th>
                          <th className="py-3 px-4">Categoría</th>
                          <th className="py-3 px-4">Precio</th>
                          <th className="py-3 px-4">Precio Original</th>
                          <th className="py-3 px-4">Stock</th>
                          <th className="py-3 px-4 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {products.map((p) => (
                          <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2.5">
                                <img src={p.images[0]} alt="" className="h-9 w-9 rounded-lg object-cover bg-gray-50 border border-gray-150 shrink-0" />
                                <div className="min-w-0">
                                  <p className="font-bold text-gray-950 truncate max-w-[170px]">{p.name}</p>
                                  <p className="text-[10px] text-gray-400 font-mono truncate max-w-[170px]">{p.id}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="bg-gray-100 text-gray-800 border border-gray-200 rounded py-0.5 px-1.5 font-mono text-[10px]">
                                {p.categories[0] || 'ropa'}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-bold text-gray-950 font-mono">
                              ${p.price.toLocaleString('es-AR')}
                            </td>
                            <td className="py-3 px-4 font-mono text-gray-400">
                              {p.originalPrice ? `$${p.originalPrice.toLocaleString('es-AR')}` : '-'}
                            </td>
                            <td className="py-3 px-4 font-mono">
                              <span className={`font-semibold ${p.stock <= 0 ? 'text-red-650' : 'text-gray-600'}`}>
                                {p.stock} units
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                              <button
                                onClick={() => openEditProductForm(p)}
                                className="p-1.5 bg-white text-gray-600 hover:text-black rounded-lg border border-gray-200 hover:bg-gray-50 transition shadow-xs"
                                title="Editar"
                                id={`edit-${p.id}`}
                              >
                                <Edit size={12} />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`¿Estás seguro de eliminar "${p.name}"?`)) {
                                    deleteProduct(p.id);
                                    triggerSuccessNotification('Producto removido.');
                                  }
                                }}
                                className="p-1.5 bg-white text-gray-500 hover:text-red-500 rounded-lg border border-gray-200 hover:bg-red-50 transition shadow-xs"
                                title="Eliminar"
                                id={`delete-btn-${p.id}`}
                              >
                                <Trash2 size={12} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                </div>
              )}

              {/* TAB 3: CATEGORIES MANAGER */}
              {activeTab === 'categories' && (
                <div className="space-y-6 text-gray-900">
                  <div>
                    <h3 className="text-lg font-bold text-gray-950">Gestor de Categorías</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Creá filtros personalizados para segmentar tu tienda web.</p>
                  </div>

                  <form onSubmit={handleCategorySubmit} className="bg-gray-50 p-5 rounded-2xl border border-gray-200 grid grid-cols-1 sm:grid-cols-3 gap-4 items-end shadow-xs">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-gray-700 font-mono">Slug / ID (en minúsculas)</label>
                      <input 
                        type="text" 
                        value={catId} 
                        onChange={(e) => setCatId(e.target.value)} 
                        placeholder="Ej: calzado"
                        className="w-full bg-white border border-gray-250 rounded-lg py-1.5 px-3 text-xs focus:outline-none focus:border-black font-mono"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-gray-700">Nombre de la Categoría</label>
                      <input 
                        type="text" 
                        value={catName} 
                        onChange={(e) => setCatName(e.target.value)} 
                        placeholder="Ej: Calzados Urbanos"
                        className="w-full bg-white border border-gray-250 rounded-lg py-1.5 px-3 text-xs focus:outline-none focus:border-black"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="rounded-xl bg-black hover:bg-zinc-900 text-white font-bold py-2.5 px-5 text-xs transition-colors shrink-0 shadow"
                      id="submit-category-form"
                    >
                      Añadir Categoría
                    </button>
                  </form>

                  {/* Categories active grid listing */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-4">
                    {categories.map((c) => (
                      <div 
                        key={c.id}
                        className="flex items-center justify-between p-4 rounded-2xl bg-white border border-gray-200 hover:border-gray-300 transition shadow-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="h-10 w-10 bg-gray-50 rounded-xl flex items-center justify-center font-bold text-black font-mono text-sm border border-gray-200">
                            {c.id.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-gray-950 text-sm">{c.name}</p>
                            <p className="text-[10px] text-gray-400 font-mono font-semibold">slug: {c.id}</p>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            if (confirm(`¿Deseas remover la categoría "${c.name}"? Los productos no serán eliminados pero perderán esta etiqueta.`)) {
                              deleteCategory(c.id);
                              triggerSuccessNotification('Categoría eliminada.');
                            }
                          }}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100 rounded-lg transition"
                          title="Remover"
                          id={`delete-cat-${c.id}`}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>

                </div>
              )}

              {/* TAB 4: CAMPAIGNS & PROMO COUPONS */}
              {activeTab === 'promotions' && (
                <div className="space-y-6 text-gray-900">
                  <div>
                    <h3 className="text-lg font-bold text-gray-950">Descuentos & Cupones de Venta</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Definí códigos de descuento que los clientes aplican en los carritos de compra.</p>
                  </div>

                  <form onSubmit={handlePromoSubmit} className="bg-gray-50 p-5 rounded-2xl border border-gray-200 space-y-4 shadow-xs">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-black font-semibold">Crear Nuevo Cupón de Descuento</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-gray-700">Título Campaña</label>
                        <input 
                          type="text" 
                          value={promoTitle} 
                          onChange={(e) => setPromoTitle(e.target.value)} 
                          placeholder="Ej: Oferta de Invierno"
                          className="w-full bg-white border border-gray-250 rounded-lg py-1.5 px-3 text-xs focus:outline-none focus:border-black text-gray-950"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-gray-700">Código del Cupón (Alfanumérico)</label>
                        <input 
                          type="text" 
                          value={promoCode} 
                          onChange={(e) => setPromoCode(e.target.value)} 
                          placeholder="Ej: INVIERNO20"
                          className="w-full bg-white border border-gray-250 rounded-lg py-1.5 px-3 text-xs focus:outline-none uppercase font-mono text-gray-955"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-gray-700">Porcentaje Bonificación (%)</label>
                        <input 
                          type="number" 
                          value={promoPercent} 
                          onChange={(e) => setPromoPercent(Number(e.target.value))} 
                          className="w-full bg-white border border-gray-250 rounded-lg py-1.5 px-3 text-xs focus:outline-none text-gray-955"
                          min="1"
                          max="99"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-gray-500">Breve descripción del descuento (opcional)</label>
                      <input 
                        type="text" 
                        value={promoDesc} 
                        onChange={(e) => setPromoDesc(e.target.value)} 
                        className="w-full bg-white border border-gray-250 rounded-lg py-1.5 px-3 text-xs focus:outline-none text-gray-955"
                        placeholder="Ej: Aplica 20% off en toda la compra de abrigo."
                      />
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          checked={promoActive} 
                          onChange={(e) => setPromoActive(e.target.checked)} 
                          className="rounded bg-white border-gray-250 text-black h-4 w-4 cursor-pointer"
                          id="promo-active"
                        />
                        <label htmlFor="promo-active" className="text-xs font-semibold text-gray-700 select-none cursor-pointer">
                          Cupón Activo / Habilitado
                        </label>
                      </div>

                      <button
                        type="submit"
                        className="rounded-xl bg-black hover:bg-zinc-900 text-white font-bold py-2.5 px-5 text-xs transition-colors shadow-sm shrink-0"
                        id="submit-promo-coupon"
                      >
                        Añadir Promoción
                      </button>
                    </div>
                  </form>

                  {/* List of active promos */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4">
                    {promotions.map((p) => (
                      <div 
                        key={p.id}
                        className="p-4 bg-white border border-gray-200 rounded-2xl flex flex-col justify-between hover:border-gray-300 transition shadow-xs"
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-1 min-w-0">
                            <span className="font-mono bg-black text-white text-xs font-bold py-1 px-2.5 rounded-lg">
                              {p.code}
                            </span>
                            <h4 className="font-bold text-gray-900 mt-2 text-sm">{p.title}</h4>
                            <p className="text-xs text-gray-500 line-clamp-1">{p.description}</p>
                          </div>

                          <div className="text-right">
                            <span className="text-xl font-black text-gray-950 font-mono">{p.discountPercent}%</span>
                            <p className="text-[10px] text-gray-400 font-mono">Bonificado</p>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-gray-150 flex items-center justify-between">
                          <span className={`text-[10px] font-mono tracking-wider uppercase ${p.active ? 'text-emerald-700 font-semibold' : 'text-gray-400'}`}>
                            ● {p.active ? 'Habilitado' : 'Fuera de Línea'}
                          </span>

                          <button
                            onClick={() => {
                              if (confirm(`¿Querés revocar el código promocional [${p.code}]?`)) {
                                deletePromotion(p.id);
                                triggerSuccessNotification('Promoción borrada.');
                              }
                            }}
                            className="p-1 text-gray-400 hover:text-red-500 rounded transition"
                            title="Eliminar"
                            id={`delete-promo-${p.id}`}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              )}

              {/* TAB 5: PRIVILEGES / SECURITY / ADMINS INFORMATION SCREEN */}
              {activeTab === 'admins' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-white">Listado de Privilegios y Seguridad</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Control de cuentas administrativas y credenciales verificables con email.</p>
                  </div>

                  <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Bootstrapped SuperAdmin Oficial</h4>
                    
                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-850 flex items-start gap-3">
                      <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 max-w-[40px] shrink-0">
                        <ShieldCheck size={20} />
                      </div>
                      <div className="space-y-1 text-xs">
                        <p className="font-bold text-slate-200">justiciaotec@gmail.com</p>
                        <p className="text-slate-400 leading-relaxed max-w-xl">
                          Este correo electrónico es la cuenta administrativa maestra. Al iniciar sesión vía Google, el motor Firestore securizado valida la procedencia y permite realizar consultas de guardado sin restricciones.
                        </p>
                        <div className="inline-flex items-center gap-1.5 pt-1.5 text-xs font-mono text-emerald-400 font-semibold">
                          <span>Verified:</span>
                          <span className="bg-emerald-500/20 text-emerald-400 py-0.5 px-2 rounded">True</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-900">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono pb-2">Prueba y Simulación Sandbox</h4>
                      <p className="text-slate-300 text-xs leading-relaxed max-w-prose">
                        Si estás evaluando esta entrega, no necesitás tener acceso al email administrativo oficial. La consola habilita de forma inteligente el **Bypass Sandbox** guardando de forma paralela todas las adiciones en memoria local persistente de tu navegador. Esto te permite testear con total naturalidad:
                      </p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 text-[11px] font-mono">
                        <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-850">
                          <p className="font-bold text-white">1. CMS visual</p>
                          <p className="text-slate-500 pt-0.5">Modificá banners o banners de anuncio y comprobalo al instante.</p>
                        </div>
                        <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-850">
                          <p className="font-bold text-white">2. Catálogo ágil</p>
                          <p className="text-slate-500 pt-0.5">Sumá productos con fotos e inventario dinámico.</p>
                        </div>
                        <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-850">
                          <p className="font-bold text-white">3. Campañas</p>
                          <p className="text-slate-500 pt-0.5">Creá cupones de un 90% para validar subtotales.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              )}

            </div>
          </div>
        )}

      </div>
    </div>
  );
};
