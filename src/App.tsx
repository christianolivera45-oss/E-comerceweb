import { useState, useEffect, FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  ShoppingBag,
  Sliders,
  Settings,
  LogIn,
  LogOut,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  Cpu,
  Save,
  Grid,
  Sparkles,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Database,
  ArrowLeft,
  Image,
  Tag,
  Key,
  Lock,
  ShoppingBag as CartIcon,
  Palette,
  Eye,
  EyeOff,
  Type,
  Layout,
  MessageCircle,
  Shirt,
  Laptop,
  Home,
  Watch,
  Percent,
  Box,
  ChevronDown,
  HelpCircle,
  Menu,
  X,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Upload,
  Loader2
} from "lucide-react";
import { Product, SiteSettings, ShopState, CartItem, Category, Subcategory, ProductVariant, is3DProduct } from "./types";
import ThemeStyles from "./components/ThemeStyles";
import ProductCard from "./components/ProductCard";
import ProductSlider from "./components/ProductSlider";
import ProductDetails from "./components/ProductDetails";
import CartDrawer from "./components/CartDrawer";
import HeroSlider from "./components/HeroSlider";
import SecurityPanel from "./components/SecurityPanel";
import { DashboardGeneral } from "./components/DashboardGeneral";
import WhatsAppWidget from "./components/WhatsAppWidget";
import ImageGalleryEditor from "./components/ImageGalleryEditor";


export const normalizeText = (text: string): string => {
  if (!text) return "";
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[^a-z0-9 ]/g, " ")     // replace non-alphanumeric with space
    .replace(/\s+/g, " ")            // collapse multi-spaces
    .trim();
};

export const calculateRelevance = (
  product: Product,
  query: string,
  dbCategories?: Category[],
  dbSubcategories?: Subcategory[]
): number => {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) return 0;

  const normalizedName = normalizeText(product.name);
  const normalizedDesc = normalizeText(product.description || "");
  
  // Resolve product category name
  const mainCat = (dbCategories || []).find(c => c.id === product.categoria_id);
  const mainCatName = mainCat ? normalizeText(mainCat.nombre) : "";
  const fallbackCatName = product.category ? normalizeText(product.category) : "";
  
  // Resolve subcategory name
  const subCat = (dbSubcategories || []).find(s => s.id === product.subcategoria_id);
  const subCatName = subCat ? normalizeText(subCat.nombre) : "";

  // Normalize colors and sizes to act as tags
  const colorsStr = (product.colors || []).map(normalizeText).join(" ");
  const sizesStr = (product.sizes || []).map(normalizeText).join(" ");

  const queryTokens = normalizedQuery.split(" ").filter(t => t.length > 0);
  if (queryTokens.length === 0) return 0;

  let score = 0;

  // 1. Exact Name match or name starts with query
  if (normalizedName === normalizedQuery) {
    score += 500;
  } else if (normalizedName.startsWith(normalizedQuery)) {
    score += 250;
  } else if (normalizedName.includes(normalizedQuery)) {
    score += 150;
  }

  // 2. Word tokens match in Name
  queryTokens.forEach(token => {
    const cleanToken = token.endsWith("s") && token.length > 3 ? token.slice(0, -1) : token;
    
    const matchedNameWords = normalizedName.split(" ").some(word => {
      const cleanWord = word.endsWith("s") && word.length > 3 ? word.slice(0, -1) : word;
      return cleanWord.includes(cleanToken) || cleanToken.includes(cleanWord);
    });

    if (matchedNameWords) {
      score += 80;
    } else if (normalizedName.includes(token)) {
      score += 40;
    }
  });

  // 3. Category & Subcategory match
  if (mainCatName && (mainCatName.includes(normalizedQuery) || normalizedQuery.includes(mainCatName))) {
    score += 100;
  } else if (fallbackCatName && (fallbackCatName.includes(normalizedQuery) || normalizedQuery.includes(fallbackCatName))) {
    score += 60;
  }
  if (subCatName && (subCatName.includes(normalizedQuery) || normalizedQuery.includes(subCatName))) {
    score += 80;
  }

  queryTokens.forEach(token => {
    if (mainCatName && mainCatName.includes(token)) score += 20;
    if (fallbackCatName && fallbackCatName.includes(token)) score += 10;
    if (subCatName && subCatName.includes(token)) score += 15;
  });

  // 4. Description match
  if (normalizedDesc.includes(normalizedQuery)) {
    score += 50;
  }
  queryTokens.forEach(token => {
    if (normalizedDesc.includes(token)) {
      score += 10;
    }
  });

  // 5. Colors and Sizes matches (as tags)
  queryTokens.forEach(token => {
    if (colorsStr.includes(token)) score += 15;
    if (sizesStr.includes(token)) score += 15;
  });

  return score;
};

const DEFAULT_SETTINGS: SiteSettings = {
  siteTitle: "Ventas Juem",
  siteSubtitle: "Moda, tecnología y accesorios con envío a todo el país.",
  bannerTitle: "Colección Exclusiva de Primavera",
  bannerSubtitle: "Descubre las últimas tendencias con descuentos de hasta el 40%.",
  bannerImageUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=80",
  whatsappNumber: "5491123456789",
  primaryColor: "#2563eb",
  accentColor: "#10b981",
  themeMode: "dark",
  promotionBannerText: "🚚 ¡ENVÍO GRATUITO en compras superiores a $50! Código: JUEM50",
  showPromotionBanner: true,
  lowStockThreshold: 5,
  heroSlides: [
    {
      id: "slide-1",
      title: "Colección Exclusiva de Primavera",
      subtitle: "Descubre las últimas tendencias con descuentos de hasta el 40%.",
      imageUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=80"
    },
    {
      id: "slide-2",
      title: "Tendencias de Temporada",
      subtitle: "Colecciones cuidadosamente seleccionadas para expresar tu estilo único.",
      imageUrl: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1600&q=80"
    },
    {
      id: "slide-3",
      title: "Accesorios & Complementos",
      subtitle: "Lentes, mochilas, relojes y detalles que transforman cualquier outfit.",
      imageUrl: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1600&q=80"
    }
  ],
  logoType: "text",
  logoText: "J",
  logoImageUrl: "",
  footerCol1Title: "🚀 Compra Personalizada",
  footerCol1Text: "Realiza tus pedidos seleccionando tus talles y colores favoritos. El carrito envía una lista formateada directo a nuestro WhatsApp de atención oficial para coordinar pago y entrega express.",
  footerCol2Title: "🌟 Calidad Asegurada",
  footerCol2Text: "Todos los productos que visualizas pasan por un control estricto de empaque y selección. Ofrecemos cambio de talle inmediato dentro de las 72 horas de recibida tu compra.",
  footerCol3Title: "📞 Soporte Directo",
  footerCol3Text: "¿Habiendo dudas con talles o stock rápido? Pícale al botón de consulta express en la ficha de cada producto y un asesor te responderá inmediatamente en WhatsApp.",
  footerCopyright: "Desarrollado con tecnología de punta responsive. Reservados todos los derechos."
};

const getCategoryIcon = (categoryOrIcon: string) => {
  const cat = (categoryOrIcon || "").toLowerCase();
  
  if (cat === "todos" || cat === "grid") return <Grid className="h-5 w-5 animate-pulse" />;
  if (cat === "shirt" || cat === "ropa") return <Shirt className="h-5 w-5" />;
  if (cat === "smartphone" || cat === "celular" || cat === "celulares") return <Smartphone className="h-5 w-5" />;
  if (cat === "sparkles" || cat === "destacado") return <Sparkles className="h-5 w-5" />;
  if (cat === "home" || cat === "hogar") return <Home className="h-5 w-5" />;
  if (cat === "watch" || cat === "relojes") return <Watch className="h-5 w-5" />;
  if (cat === "percent" || cat === "descuentos") return <Percent className="h-5 w-5" />;
  if (cat === "laptop" || cat === "pc") return <Laptop className="h-5 w-5" />;
  if (cat === "palette" || cat === "diseno") return <Palette className="h-5 w-5" />;
  if (cat === "tag" || cat === "promos") return <Tag className="h-5 w-5" />;
  if (cat === "box") return <Box className="h-5 w-5" />;
  
  // Ropa / Moda / Vestimenta keyword check
  if (
    cat.includes("ropa") ||
    cat.includes("vest") ||
    cat.includes("moda") ||
    cat.includes("calza") ||
    cat.includes("prend") ||
    cat.includes("remera") ||
    cat.includes("abrigo") ||
    cat.includes("calzado") ||
    cat.includes("buzo") ||
    cat.includes("jean") ||
    cat.includes("panta") ||
    cat.includes("shirt")
  ) {
    return <Shirt className="h-5 w-5" />;
  }
  
  // Electrónica / Tecnología / Artículos electrónicos keyword check
  if (
    cat.includes("electron") ||
    cat.includes("tecno") ||
    cat.includes("celular") ||
    cat.includes("notebook") ||
    cat.includes("comput") ||
    cat.includes("smart") ||
    cat.includes("tablet") ||
    cat.includes("audio") ||
    cat.includes("parlante") ||
    cat.includes("chip") ||
    cat.includes("laptop") ||
    cat.includes("phone")
  ) {
    return <Laptop className="h-5 w-5" />;
  }
  
  // Hogar / Decoración / Casa keyword check
  if (
    cat.includes("hogar") ||
    cat.includes("casa") ||
    cat.includes("mueble") ||
    cat.includes("decor") ||
    cat.includes("jardin") ||
    cat.includes("cocina")
  ) {
    return <Home className="h-5 w-5" />;
  }
  
  // Accesorios / Relojes / Bolsos keyword check
  if (
    cat.includes("accesor") ||
    cat.includes("joya") ||
    cat.includes("reloj") ||
    cat.includes("bols") ||
    cat.includes("mochila") ||
    cat.includes("cartera") ||
    cat.includes("watch")
  ) {
    return <Watch className="h-5 w-5" />;
  }
  
  // Ofertas / Descuentos / Liquidación / Sale keyword check
  if (
    cat.includes("oferta") ||
    cat.includes("promoc") ||
    cat.includes("descu") ||
    cat.includes("liquid") ||
    cat.includes("sale") ||
    cat.includes("porcent")
  ) {
    return <Percent className="h-5 w-5" />;
  }
  
  // Otros / Caja / Estrellas / Predeterminado
  return <Box className="h-5 w-5" />;
};

// Mapeo amigable de categorías internas para mostrar en UI
const getCategoryDisplayName = (cat: string) => {
  if (cat === "Artículos electrónicos") return "Electrónica";
  return cat;
};

// Temas y Paletas de Colores Predeterminadas para el eCommerce
const THEME_PRESETS = [
  {
    name: "Apex Clásico",
    primaryColor: "#2563eb",
    accentColor: "#10b981",
    themeMode: "dark" as "dark" | "light"
  },
  {
    name: "Moda Veraniega Warm",
    primaryColor: "#ea580c",
    accentColor: "#e11d48",
    themeMode: "light" as "dark" | "light"
  },
  {
    name: "Lujo & Carbono (Gold)",
    primaryColor: "#ca8a04",
    accentColor: "#e11d48",
    themeMode: "dark" as "dark" | "light"
  },
  {
    name: "Nórdico Suave",
    primaryColor: "#64748b",
    accentColor: "#0284c7",
    themeMode: "light" as "dark" | "light"
  },
  {
    name: "Neón Cyberpunk",
    primaryColor: "#d946ef",
    accentColor: "#06b6d4",
    themeMode: "dark" as "dark" | "light"
  },
  {
    name: "Esmeralda Eco",
    primaryColor: "#059669",
    accentColor: "#10b981",
    themeMode: "light" as "dark" | "light"
  },
  {
    name: "Misterio Forestal",
    primaryColor: "#15803d",
    accentColor: "#f59e0b",
    themeMode: "dark" as "dark" | "light"
  },
  {
    name: "Rosa de París",
    primaryColor: "#ec4899",
    accentColor: "#ae2d68",
    themeMode: "light" as "dark" | "light"
  }
];

// Subcategorías predefinidas para no llenar la tienda de categorías vacías
const SUBCATEGORIES_MAP: Record<string, { id: string; name: string }[]> = {
  "Ropa": [
    { id: "all", name: "Ver todo Ropa" },
    { id: "hombre", name: "Hombre" },
    { id: "mujer", name: "Mujer" },
    { id: "invierno", name: "Invierno" }
  ],
  "Artículos electrónicos": [
    { id: "all", name: "Ver todo Electrónica" },
    { id: "celulares", name: "Celulares" },
    { id: "audio", name: "Audio" },
    { id: "pc", name: "PC y accesorios" }
  ],
  "Accesorios": [
    { id: "all", name: "Ver todo Accesorios" },
    { id: "mochilas", name: "Mochilas" },
    { id: "relojes", name: "Relojes" },
    { id: "fundas", name: "Fundas" }
  ],
  "Hogar": [
    { id: "all", name: "Ver todo Hogar" },
    { id: "decoracion", name: "Decoración" },
    { id: "cocina", name: "Cocina" },
    { id: "organizacion", name: "Organización" }
  ]
};

// Palabras clave para mapear dinámicamente los productos existentes y nuevos a subcategorías de manera invisible
const SUBCATEGORY_KEYWORDS: Record<string, string[]> = {
  hombre: ["hombre", "men", "masculino", "camisa hombre", "pantalón hombre", "chaqueta hombre"],
  mujer: ["mujer", "women", "femenino", "vestido", "blusa", "falda", "cartera mujer"],
  invierno: ["invierno", "winter", "abrigo", "jacket", "chaqueta", "bomber", "buzo", "sudadera", "capucha", "suéter", "sueter", "saco", "lana", "guantes", "bufanda"],
  
  celulares: ["celular", "teléfono", "telefono", "phone", "iphone", "samsung", "cargador", "funda celular", "xiaomi", "motorola"],
  audio: ["audio", "parlante", "audífono", "audifono", "auricular", "headphones", "bluetooth", "sonido", "sonar", "micrófono", "microfono"],
  pc: ["teclado", "mouse", "monitor", "pantalla", "computadora", "pc", "gamer", "usb", "cable", "organizador cables", "disco duro", "memoria", "portatil", "laptop"],
  
  mochilas: ["mochila", "bolso", "cartera", "morral", "maletín", "viaje", "organizador"],
  relojes: ["reloj", "smartwatch", "reloj inteligente", "cronógrafo", "cronografo", "pulsera watch"],
  fundas: ["funda", "estuche", "case", "protector", "cubierta"],
  
  decoracion: ["vela", "cuadro", "lámpara", "lampara", "adorno", "plant", "espejo", "alfombra", "deco", "decoración", "decoracion"],
  cocina: ["cocina", "taza", "plato", "vaso", "cubiertos", "artículos cocina", "cafetera", "tetera", "organizador cocina", "ollas", "sarten"],
  organizacion: ["estante", "caja", "reloj pared", "perchero", "organiz", "cajón", "cajon", "almacenamiento", "percheros"]
};

export default function App() {
  // Store state loaded from api
  const [store, setStore] = useState<ShopState>({
    products: [],
    categories: ["Ropa", "Artículos electrónicos", "Accesorios", "Hogar"],
    dbCategories: [
      { id: "ropa", nombre: "Ropa", icono: "Shirt", orden: 1, active: true },
      { id: "electronica", nombre: "Artículos electrónicos", icono: "Smartphone", orden: 2, active: true },
      { id: "accesorios", nombre: "Accesorios", icono: "Sparkles", orden: 3, active: true },
      { id: "hogar", nombre: "Hogar", icono: "Home", orden: 4, active: true }
    ],
    dbSubcategories: [
      { id: "hombre", nombre: "Hombre", categoria_id: "ropa" },
      { id: "mujer", nombre: "Mujer", categoria_id: "ropa" },
      { id: "invierno", nombre: "Invierno", categoria_id: "ropa" },
      { id: "celulares", nombre: "Celulares", categoria_id: "electronica" },
      { id: "audio", nombre: "Audio", categoria_id: "electronica" },
      { id: "pc", nombre: "PC y accesorios", categoria_id: "electronica" },
      { id: "mochilas", nombre: "Mochilas", categoria_id: "accesorios" },
      { id: "lentes", nombre: "Gafas de Sol", categoria_id: "accesorios" },
      { id: "decoracion", nombre: "Decoración", categoria_id: "hogar" },
      { id: "organizacion", nombre: "Organización", categoria_id: "hogar" }
    ],
    settings: DEFAULT_SETTINGS
  });

  // Client statuses
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"synced" | "syncing" | "error">("synced");
  const [errorMessage, setErrorMessage] = useState("");

  // Search & Navigation
  const [activeTab, setActiveTab] = useState<"storefront" | "admin">("storefront");
  const [adminSection, setAdminSection] = useState<"general" | "products" | "categories" | "promos" | "security" | "stock" | "dashboard" | "banner" | "footer">("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [bannerProductSearch, setBannerProductSearch] = useState("");
  const [uploadingSlideIdx, setUploadingSlideIdx] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("todos");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("all");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);

  // Sorting & Filtering States
  const [sortBy, setSortBy] = useState<string>("featured");
  const [onlyInStock, setOnlyInStock] = useState<boolean>(false);
  const [showFiltersPanel, setShowFiltersPanel] = useState<boolean>(false);
  const [stockFilterTab, setStockFilterTab] = useState<"all" | "outOfStock" | "lowStock" | "alerts">("alerts");

  // Helper to verify admin token with backend
  const verifyAdminToken = async (token: string) => {
    try {
      const res = await fetch("/api/admin/verify", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.valid && data.user?.role === "admin") {
          setAuthToken(token);
        } else {
          handleLogout();
          showAdminToast("Acceso denegado: permisos de administrador requeridos.", "error");
        }
      } else {
        handleLogout();
      }
    } catch (err) {
      console.error("No se pudo verificar el token administrativa:", err);
    }
  };

  const navigateAdminSection = (section: "general" | "products" | "categories" | "promos" | "security" | "stock" | "dashboard" | "banner" | "footer") => {
    setAdminSection(section);
    setEditingProduct(null);
    setIsNewProductMode(false);
    window.history.pushState(null, "", `/admin/${section}`);
  };

  // URL routing helpers
  const parseRoute = (currentCategories?: any[], currentProducts?: any[]) => {
    const categoriesList = currentCategories || store.dbCategories || [];
    const subcategoriesList = store.dbSubcategories || [];
    const productsList = currentProducts || store.products || [];
    const path = window.location.pathname.toLowerCase().replace(/\/$/, ""); // remove trailing slash
    const segments = path.split("/").filter(Boolean); // e.g. ["ropa", "hombre"]

    const urlParams = new URLSearchParams(window.location.search);
    let prodId: string | null = null;
    if (segments[0] === "producto" && segments[1]) {
      prodId = segments[1];
    } else {
      prodId = urlParams.get("product");
    }

    if (prodId) {
      const prod = productsList.find(p => String(p.id) === String(prodId));
      if (prod) {
        setSelectedProduct(prod);
      } else {
        setSelectedProduct(null);
      }
    } else {
      setSelectedProduct(null);
    }

    if (segments[0] === "admin") {
      setActiveTab("admin");
      
      const sub = segments[1];
      if (sub === "products") setAdminSection("products");
      else if (sub === "categories") setAdminSection("categories");
      else if (sub === "promos") setAdminSection("promos");
      else if (sub === "security") setAdminSection("security");
      else if (sub === "stock") setAdminSection("stock");
      else if (sub === "dashboard") setAdminSection("dashboard");
      else if (sub === "banner") setAdminSection("banner");
      else if (sub === "footer") setAdminSection("footer");
      else setAdminSection("dashboard");

      // Verify session token integrity on every URL change
      const token = localStorage.getItem("apex_admin_token");
      const loginTime = localStorage.getItem("apex_admin_login_time");
      const isExpired = loginTime && (Date.now() - Number(loginTime) > 3600000);
      
      if (token && !isExpired) {
        verifyAdminToken(token);
      } else {
        if (token || isExpired) {
          handleLogout();
        } else {
          setAuthToken(null);
        }
      }
      return;
    }

    setActiveTab("storefront");

    if (segments.length === 0) {
      setSelectedCategory("todos");
      setSelectedSubcategory("all");
      return;
    }

    const catPath = segments[0];
    const matchingCat = categoriesList.find(c => c.id === catPath);
    if (matchingCat) {
      setSelectedCategory(matchingCat.nombre);
      
      const subPath = segments[1];
      if (subPath) {
        const subcats = subcategoriesList.filter(s => s.categoria_id === matchingCat.id);
        const subcatExists = subcats.some(s => s.id === subPath) || subPath === "all";
        if (subcatExists) {
          setSelectedSubcategory(subPath);
        } else {
          setSelectedSubcategory("all");
        }
      } else {
        setSelectedSubcategory("all");
      }
    } else {
      setSelectedCategory("todos");
      setSelectedSubcategory("all");
    }
  };

  const navigateToProductRoute = (category: string, subcategory: string) => {
    setSelectedProduct(null);
    let path = "/";
    if (category !== "todos") {
      const catObj = store.dbCategories?.find(c => c.nombre === category || c.id === category);
      if (catObj) {
        path = `/${catObj.id}`;
        if (subcategory && subcategory !== "all") {
          path += `/${subcategory}`;
        }
      }
    }
    
    window.history.pushState(null, "", path);
    setSelectedCategory(category);
    setSelectedSubcategory(subcategory);
  };

  const getCatalogPath = () => {
    let path = "/";
    if (selectedCategory !== "todos") {
      const catObj = store.dbCategories?.find(c => c.nombre === selectedCategory || c.id === selectedCategory);
      if (catObj) {
        path = `/${catObj.id}`;
        if (selectedSubcategory && selectedSubcategory !== "all") {
          path += `/${selectedSubcategory}`;
        }
      }
    }
    return path;
  };
  
  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Active product details view
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Authentication
  const [authToken, setAuthToken] = useState<string | null>(() => {
    const token = localStorage.getItem("apex_admin_token");
    if (!token) return null;
    
    let loginTime = localStorage.getItem("apex_admin_login_time");
    if (!loginTime) {
      loginTime = Date.now().toString();
      localStorage.setItem("apex_admin_login_time", loginTime);
    }
    
    const isExpired = Date.now() - Number(loginTime) > 3600000;
    if (isExpired) {
      localStorage.removeItem("apex_admin_token");
      localStorage.removeItem("apex_admin_login_time");
      return null;
    }
    
    return token;
  });
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Form states for Admin panel
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isNewProductMode, setIsNewProductMode] = useState(false);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: "",
    description: "",
    price: undefined,
    originalPrice: undefined,
    category: "",
    imageUrl: "",
    stock: 10,
    featured: false,
    categorias_adicionales: [],
    subcategorias_adicionales: []
  });
  const [newProductErrors, setNewProductErrors] = useState<Record<string, string>>({});

  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryIcon, setNewCategoryIcon] = useState("Shirt");
  const [newCategoryOrder, setNewCategoryOrder] = useState<number>(1);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [newCouponCode, setNewCouponCode] = useState("");
  const [newCouponDiscount, setNewCouponDiscount] = useState<number>(10);
  const [newCouponExpiration, setNewCouponExpiration] = useState("");

  const [newSubcategoryName, setNewSubcategoryName] = useState("");
  const [newSubcategoryParent, setNewSubcategoryParent] = useState("");
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null);
  const [subToDeleteId, setSubToDeleteId] = useState<string | null>(null);
  const [adminToast, setAdminToast] = useState<{ text: string; type: "success" | "error" | "neutral" } | null>(null);

  const showAdminToast = (text: string, type: "success" | "error" | "neutral" = "success") => {
    setAdminToast({ text, type });
  };

  useEffect(() => {
    if (adminToast) {
      const timer = setTimeout(() => {
        setAdminToast(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [adminToast]);

  // Custom Modal/Dialog overlays for superior UX and iframe sandbox compatibility
  const [customAlert, setCustomAlert] = useState<{ title: string; message: string; show: boolean } | null>(null);
  const [customConfirm, setCustomConfirm] = useState<{
    title: string;
    message: string;
    show: boolean;
    onConfirm: () => void;
  } | null>(null);

  const showCustomAlert = (title: string, message: string) => {
    setCustomAlert({ title, message, show: true });
  };

  const showCustomConfirm = (title: string, message: string, onConfirm: () => void) => {
    setCustomConfirm({ title, message, show: true, onConfirm });
  };

  const handleStartEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    // Smooth scroll down to edit workspace forms
    setTimeout(() => {
      const element = document.getElementById("admin-categories-editor-form-row");
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      } else {
        window.scrollTo({ top: 300, behavior: "smooth" });
      }
    }, 80);
  };

  const handleStartEditSubcategory = (sub: Subcategory) => {
    setEditingSubcategory(sub);
    // Smooth scroll down to edit workspace forms
    setTimeout(() => {
      const element = document.getElementById("admin-categories-editor-form-row");
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      } else {
        window.scrollTo({ top: 300, behavior: "smooth" });
      }
    }, 80);
  };

  const [editingSettings, setEditingSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);

  // Fetch initial data and setup routing listeners
  useEffect(() => {
    fetchStoreData();
    parseRoute();
    // Load local cart if any
    const localCart = localStorage.getItem("apex_shop_cart");
    if (localCart) {
      try {
        setCart(JSON.parse(localCart));
      } catch (err) {
        console.error("Failed to parse cart", err);
      }
    }

    // Dynamic Server Token verification on program startup with 1 hour limit check
    const initialToken = localStorage.getItem("apex_admin_token");
    const loginTime = localStorage.getItem("apex_admin_login_time");
    const isExpired = loginTime && (Date.now() - Number(loginTime) > 3600000);
    
    if (initialToken && !isExpired) {
      verifyAdminToken(initialToken);
    } else if (initialToken || isExpired) {
      handleLogout();
    }

    const handlePopState = () => {
      parseRoute();
    };
    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  // Active session expiration checker (forces redirect/logout after exactly 1 hour of session time)
  useEffect(() => {
    if (!authToken) return;

    const interval = setInterval(() => {
      const loginTime = localStorage.getItem("apex_admin_login_time");
      if (loginTime && Date.now() - Number(loginTime) > 3600000) {
        handleLogout();
        showAdminToast("Sesión de administrador expirada (límite de 1 hora excedido).", "error");
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [authToken]);

  // Click outside detector to close active dropdown menus cleanly
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".category-dropdown-container")) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  // Update scrolled state on scroll to add elegant shadow
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleOpenProduct = (prod: Product) => {
    setSelectedProduct(prod);
    const newUrl = `/producto/${prod.id}`;
    window.history.pushState(null, "", newUrl);
  };

  const fetchStoreData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/store");
      if (!res.ok) throw new Error("No se pudo obtener la configuración de la tienda");
      const data = (await res.json()) as ShopState;
      setStore(data);
      setEditingSettings(data.settings);
      setNewCategoryOrder((data.dbCategories || []).length + 1);
      if (data.dbCategories && data.dbCategories.length > 0) {
        setNewSubcategoryParent(data.dbCategories[0].id);
      }
      parseRoute(data.dbCategories, data.products);
      
      // Auto-open product details page if path or query parameter is present
      const currentPath = window.location.pathname.toLowerCase().replace(/\/$/, "");
      const segments = currentPath.split("/").filter(Boolean);
      let prodId: string | null = null;
      if (segments[0] === "producto" && segments[1]) {
        prodId = segments[1];
      } else {
        const urlParams = new URLSearchParams(window.location.search);
        prodId = urlParams.get("product");
      }
      if (prodId && data.products) {
        const prod = data.products.find(p => String(p.id) === String(prodId));
        if (prod) {
          setSelectedProduct(prod);
        }
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage("No se pudo sincronizar con la base de datos.");
      setSyncStatus("error");
    } finally {
      setLoading(false);
    }
  };

  // Persist cart
  const saveCartToLocalStorage = (newCart: CartItem[]) => {
    setCart(newCart);
    localStorage.setItem("apex_shop_cart", JSON.stringify(newCart));
  };

  const handleAddToCart = (product: Product, size?: string, color?: string, qty = 1) => {
    const existingIndex = cart.findIndex(
      (item) =>
        item.product.id === product.id &&
        item.selectedSize === size &&
        item.selectedColor === color
    );

    let newCart = [...cart];
    if (existingIndex > -1) {
      newCart[existingIndex].quantity += qty;
    } else {
      newCart.push({
        product,
        quantity: qty,
        selectedSize: size,
        selectedColor: color
      });
    }
    saveCartToLocalStorage(newCart);
  };

  const handleUpdateQuantity = (productId: string, quantity: number, size?: string, color?: string) => {
    const newCart = cart.map((item) => {
      if (item.product.id === productId && item.selectedSize === size && item.selectedColor === color) {
        return { ...item, quantity };
      }
      return item;
    });
    saveCartToLocalStorage(newCart);
  };

  const handleRemoveCartItem = (productId: string, size?: string, color?: string) => {
    const newCart = cart.filter(
      (item) =>
        !(item.product.id === productId && item.selectedSize === size && item.selectedColor === color)
    );
    saveCartToLocalStorage(newCart);
  };

  const handleClearCart = () => {
    saveCartToLocalStorage([]);
  };

  // Submit Admin Login
  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoginError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: usernameInput, password: passwordInput })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setAuthToken(data.token);
        localStorage.setItem("apex_admin_token", data.token);
        localStorage.setItem("apex_admin_login_time", Date.now().toString());
        setIsLoginModalOpen(false);
        setActiveTab("admin");
        setUsernameInput("");
        setPasswordInput("");
        // Synchronize with active section subpath
        window.history.pushState(null, "", `/admin/${adminSection}`);
        showAdminToast("¡Sincronización de Sesión Establecida!", "success");
      } else {
        setLoginError(data.message || "Credenciales incorrectas.");
      }
    } catch (err) {
      setLoginError("Error de conexión al servidor de autenticación.");
    }
  };

  const handleLogout = () => {
    setAuthToken(null);
    localStorage.removeItem("apex_admin_token");
    localStorage.removeItem("apex_admin_login_time");
    setActiveTab("storefront");
    window.history.pushState(null, "", "/");
  };

  // Send whole storage state update to Server
  const saveStateToServer = async (updatedStore: ShopState) => {
    if (!authToken) return;
    setSyncStatus("syncing");
    setSaving(true);
    try {
      const res = await fetch("/api/store", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`
        },
        body: JSON.stringify(updatedStore)
      });

      if (!res.ok) {
        if (res.status === 403) {
          handleLogout();
          throw new Error("Sesión vencida. Por favor, vuelve a iniciar sesión.");
        }
        throw new Error("No se pudo guardar la información en la base de datos.");
      }

      const resData = await res.json();
      if (resData.success && resData.state) {
        setStore(resData.state);
      } else {
        setStore(updatedStore);
      }
      setSyncStatus("synced");
    } catch (err: any) {
      console.error(err);
      setSyncStatus("error");
      alert(err.message || "Error al sincronizar con el servidor. Por favor, reintenta.");
    } finally {
      setSaving(false);
    }
  };

  // CRUD handlers - Products
  const handleCreateProduct = (e: FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!newProduct.name || !newProduct.name.trim()) {
      errors.name = "El nombre del producto es obligatorio.";
    }
    
    // Category validation
    let actualCategory = "Otros";
    let actualCategoryId = "";
    if (newProduct.categoria_id) {
      const match = (store.dbCategories || []).find(c => c.id === newProduct.categoria_id);
      if (match) {
        actualCategory = match.nombre;
        actualCategoryId = match.id;
      }
    } else {
      const firstCat = (store.dbCategories || [])[0];
      if (firstCat) {
        actualCategory = firstCat.nombre;
        actualCategoryId = firstCat.id;
      }
    }

    if (!actualCategoryId) {
      errors.category = "Debes seleccionar o crear una categoría primero.";
    }

    // Price validation
    if (newProduct.price === undefined || isNaN(newProduct.price)) {
      errors.price = "El precio de venta es obligatorio.";
    } else if (newProduct.price <= 0) {
      errors.price = "El precio debe ser un número mayor a 0.";
    }

    // Stock validation
    if (newProduct.stock === undefined || isNaN(newProduct.stock)) {
      errors.stock = "El stock físico es obligatorio.";
    } else if (newProduct.stock < 0) {
      errors.stock = "El stock no puede ser un número negativo.";
    }

    if (Object.keys(errors).length > 0) {
      setNewProductErrors(errors);
      // Wait for a tick and scroll to errors if possible
      return;
    }

    // Clear any previous error
    setNewProductErrors({});

    const created: Product = {
      id: "prod-" + Date.now(),
      name: newProduct.name!.trim(),
      description: newProduct.description || "",
      price: Number(newProduct.price),
      originalPrice: newProduct.originalPrice ? Number(newProduct.originalPrice) : Number(newProduct.price),
      category: actualCategory,
      categoria_id: actualCategoryId,
      subcategoria_id: newProduct.subcategoria_id || "all",
      categorias_adicionales: newProduct.categorias_adicionales || [],
      subcategorias_adicionales: newProduct.subcategorias_adicionales || [],
      imageUrl: newProduct.imageUrl || "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80",
      stock: Math.floor(Number(newProduct.stock ?? 10)),
      featured: !!newProduct.featured,
      createdAt: new Date().toISOString(),
      sizes: newProduct.sizes || [],
      colors: newProduct.colors || []
    };

    const updatedProducts = [created, ...store.products];
    const updatedState = { ...store, products: updatedProducts };
    
    saveStateToServer(updatedState);
    setIsNewProductMode(false);
    
    // Reset form
    setNewProduct({
      name: "",
      description: "",
      price: undefined,
      originalPrice: undefined,
      category: (store.dbCategories || [])[0]?.nombre || "",
      categoria_id: (store.dbCategories || [])[0]?.id || "",
      subcategoria_id: "all",
      categorias_adicionales: [],
      subcategorias_adicionales: [],
      imageUrl: "",
      stock: 10,
      featured: false,
      sizes: [],
      colors: []
    });
  };

  const handleUpdateProduct = (e: FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    const updatedProducts = store.products.map((p) => {
      if (p.id === editingProduct.id) {
        return editingProduct;
      }
      return p;
    });

    const updatedState = { ...store, products: updatedProducts };
    saveStateToServer(updatedState);
    setEditingProduct(null);
  };

  const handleDeleteProduct = (productId: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este producto?")) return;
    const updatedProducts = store.products.filter((p) => p.id !== productId);
    const updatedState = { ...store, products: updatedProducts };
    saveStateToServer(updatedState);
  };

  const handleTogglePause = (productId: string) => {
    const updatedProducts = store.products.map((p) => {
      if (p.id === productId) {
        return { ...p, paused: !p.paused };
      }
      return p;
    });
    const updatedState = { ...store, products: updatedProducts };
    saveStateToServer(updatedState);
  };

  const handleQuickUpdateStock = (productId: string, newStock: number) => {
    const updatedProducts = store.products.map((p) => {
      if (p.id === productId) {
        return { ...p, stock: Math.max(0, newStock) };
      }
      return p;
    });
    const updatedState = { ...store, products: updatedProducts };
    saveStateToServer(updatedState);
    showAdminToast("Stock rápido actualizado con éxito.", "success");
  };

  const handleSaveLowStockThreshold = (newThreshold: number) => {
    const updatedSettings = { ...store.settings, lowStockThreshold: newThreshold };
    const updatedState = { ...store, settings: updatedSettings };
    saveStateToServer(updatedState);
    setEditingSettings(updatedSettings);
    showAdminToast(`Límite de stock bajo configurado: ${newThreshold} unidades.`, "success");
  };

  // CRUD handlers - Coupons
  const handleAddCoupon = (e: FormEvent) => {
    e.preventDefault();
    const code = newCouponCode.trim().toUpperCase();
    if (!code) {
      showAdminToast("El código del cupón es obligatorio", "error");
      return;
    }
    if (newCouponDiscount <= 0 || newCouponDiscount > 100) {
      showAdminToast("El porcentaje de descuento debe estar entre 1 y 100", "error");
      return;
    }

    const exists = (store.coupons || []).some(c => c.code.toUpperCase() === code);
    if (exists) {
      showAdminToast("Este código de cupón ya existe", "error");
      return;
    }

    const newC = {
      code,
      discount_percent: Number(newCouponDiscount),
      expiration_date: newCouponExpiration ? new Date(newCouponExpiration).toISOString() : undefined,
      active: true
    };

    const updatedCoupons = [...(store.coupons || []), newC];
    const updatedState = { ...store, coupons: updatedCoupons };
    saveStateToServer(updatedState);
    setNewCouponCode("");
    setNewCouponDiscount(10);
    setNewCouponExpiration("");
    showAdminToast("¡Cupón agregado con éxito!", "success");
  };

  const handleDeleteCoupon = (code: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar el cupón ${code}?`)) return;
    const updatedCoupons = (store.coupons || []).filter(c => c.code !== code);
    const updatedState = { ...store, coupons: updatedCoupons };
    saveStateToServer(updatedState);
    showAdminToast("¡Cupón eliminado correctamente!", "success");
  };

  // CRUD handlers - Categories & Subcategories
  const handleAddCategory = (e: FormEvent) => {
    e.preventDefault();
    const nombre = newCategoryName.trim();
    if (!nombre) return;
    
    // Create URL-safe semantic category ID slug
    const id = nombre.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
      
    if (!id) {
      showCustomAlert("Error de Categoría", "Nombre de categoría no válido.");
      return;
    }

    const exists = (store.dbCategories || []).some(c => c.id === id || c.nombre.toLowerCase() === nombre.toLowerCase());
    if (exists) {
      showCustomAlert("Categoría Existente", "Esta categoría principal ya existe.");
      return;
    }

    const newCat: Category = {
      id,
      nombre,
      icono: newCategoryIcon,
      orden: Number(newCategoryOrder) || ((store.dbCategories || []).length + 1),
      active: true
    };

    const updatedDbCategories = [...(store.dbCategories || []), newCat];
    const updatedCategories = [...store.categories, nombre];

    const updatedState = { 
      ...store, 
      categories: updatedCategories,
      dbCategories: updatedDbCategories 
    };

    saveStateToServer(updatedState);
    setNewCategoryName("");
    setNewCategoryIcon("Shirt");
    setNewCategoryOrder((store.dbCategories || []).length + 2);
  };

  const handleUpdateDynamicCategory = (e: FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;

    const nombre = editingCategory.nombre.trim();
    if (!nombre) return;

    const updatedDbCategories = (store.dbCategories || []).map(c => {
      if (c.id === editingCategory.id) {
        return editingCategory;
      }
      return c;
    });

    const oldCatName = (store.dbCategories || []).find(c => c.id === editingCategory.id)?.nombre || "";
    const updatedCategories = store.categories.map(c => c === oldCatName ? nombre : c);

    const updatedProducts = store.products.map(p => {
      if (p.categoria_id === editingCategory.id || p.category === oldCatName) {
        return { ...p, category: nombre, categoria_id: editingCategory.id };
      }
      return p;
    });

    const updatedState = {
      ...store,
      products: updatedProducts,
      categories: updatedCategories,
      dbCategories: updatedDbCategories
    };

    saveStateToServer(updatedState);
    setEditingCategory(null);
  };

  const handleDeleteCategory = (catIdOrName: string) => {
    // Handle both dynamic ID deletion and fallback name matching
    const catObj = (store.dbCategories || []).find(c => c.id === catIdOrName || c.nombre === catIdOrName);
    const catId = catObj ? catObj.id : catIdOrName;
    const catName = catObj ? catObj.nombre : catIdOrName;

    const assignedProducts = store.products.filter(p => 
      p.categoria_id === catId || 
      p.category === catName ||
      (p.categorias_adicionales && p.categorias_adicionales.includes(catId))
    );
    const hasProducts = assignedProducts.length > 0;

    // We'll also find any subcategories of this category that will be deleted
    const subcatsToDelete = (store.dbSubcategories || []).filter(s => s.categoria_id === catId);
    const subcatIds = subcatsToDelete.map(s => s.id);

    let confirmMsg = `¿Estás seguro de que deseas eliminar la categoría "${catName}"? Esto eliminará también todas sus subcategorías asociadas de forma irreversible.`;
    if (hasProducts) {
      confirmMsg = `La categoría "${catName}" tiene ${assignedProducts.length} producto(s) asignado(s). Si la eliminas, estos productos se desvincularán automáticamente de esta categoría y de sus subcategorías asociadas. ¿Deseas continuar?`;
    }

    showCustomConfirm(
      "Eliminar Categoría",
      confirmMsg,
      () => {
        // Disassociate products from this category and its deleted subcategories
        const updatedProducts = store.products.map(p => {
          let updated = { ...p };
          let changed = false;

          // Main category
          if (p.categoria_id === catId || p.category === catName) {
            updated.categoria_id = "";
            updated.category = "";
            changed = true;
          }

          // Additional categories array
          if (p.categorias_adicionales && p.categorias_adicionales.includes(catId)) {
            updated.categorias_adicionales = p.categorias_adicionales.filter(id => id !== catId);
            changed = true;
          }

          // Main subcategory
          if (p.subcategoria_id && subcatIds.includes(p.subcategoria_id)) {
            updated.subcategoria_id = "all";
            changed = true;
          }

          // Additional subcategories array
          if (p.subcategorias_adicionales && p.subcategorias_adicionales.some(id => subcatIds.includes(id))) {
            updated.subcategorias_adicionales = p.subcategorias_adicionales.filter(id => !subcatIds.includes(id));
            changed = true;
          }

          return changed ? updated : p;
        });

        const updatedDbCategories = (store.dbCategories || []).filter(c => c.id !== catId);
        const updatedDbSubcategories = (store.dbSubcategories || []).filter(s => s.categoria_id !== catId);
        const updatedCategories = store.categories.filter(c => c !== catName);

        const updatedState = {
          ...store,
          products: updatedProducts,
          categories: updatedCategories,
          dbCategories: updatedDbCategories,
          dbSubcategories: updatedDbSubcategories
        };

        saveStateToServer(updatedState);
        showAdminToast("¡Categoría y subcategorías asociadas eliminadas correctamente!", "success");
      }
    );
  };

  const handleReorderCategory = (catId: string, direction: "up" | "down") => {
    const cats = [...(store.dbCategories || [])].sort((a, b) => (a.orden || 0) - (b.orden || 0));
    const index = cats.findIndex(c => c.id === catId);
    if (index === -1) return;

    if (direction === "up" && index > 0) {
      const temp = cats[index].orden;
      cats[index].orden = cats[index - 1].orden;
      cats[index - 1].orden = temp;
    } else if (direction === "down" && index < cats.length - 1) {
      const temp = cats[index].orden;
      cats[index].orden = cats[index + 1].orden;
      cats[index + 1].orden = temp;
    }

    const remapped = cats.map((c, i) => ({ ...c, orden: i + 1 }));

    saveStateToServer({
      ...store,
      dbCategories: remapped
    });
  };

  // CRUD handlers - Subcategories
  const handleCreateSubcategory = (e: FormEvent) => {
    e.preventDefault();
    const nombre = newSubcategoryName.trim();
    if (!nombre) return;
    if (!newSubcategoryParent) {
      showCustomAlert("Falta Categoría", "Por favor selecciona una categoría principal para esta subcategoría.");
      return;
    }

    const id = nombre.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    if (!id) {
      showCustomAlert("Error de Subcategoría", "Nombre de subcategoría no válido.");
      return;
    }

    const exists = (store.dbSubcategories || []).some(s => s.categoria_id === newSubcategoryParent && (s.id === id || s.nombre.toLowerCase() === nombre.toLowerCase()));
    if (exists) {
      showCustomAlert("Subcategoría Existente", "Esta subcategoría ya existe en la categoría seleccionada.");
      return;
    }

    const newSub: Subcategory = {
      id,
      nombre,
      categoria_id: newSubcategoryParent
    };

    const updatedDbSubcategories = [...(store.dbSubcategories || []), newSub];
    const updatedState = { ...store, dbSubcategories: updatedDbSubcategories };
    saveStateToServer(updatedState);
    setNewSubcategoryName("");
    showAdminToast("¡Subcategoría creada con éxito!", "success");
  };

  const handleUpdateSubcategory = (e: FormEvent) => {
    e.preventDefault();
    if (!editingSubcategory) return;
    
    const nombre = editingSubcategory.nombre.trim();
    if (!nombre) return;

    const updatedDbSubcategories = (store.dbSubcategories || []).map(s => {
      if (s.id === editingSubcategory.id) {
        return editingSubcategory;
      }
      return s;
    });

    const updatedState = { ...store, dbSubcategories: updatedDbSubcategories };
    saveStateToServer(updatedState);
    setEditingSubcategory(null);
    showAdminToast("¡Subcategoría modificada con éxito!", "success");
  };

  const handleDeleteSubcategory = (subId: string) => {
    const subObj = (store.dbSubcategories || []).find(s => s.id === subId);
    const subName = subObj ? subObj.nombre : subId;

    const assignedProducts = store.products.filter(p => 
      p.subcategoria_id === subId ||
      (p.subcategorias_adicionales && p.subcategorias_adicionales.includes(subId))
    );
    const hasProducts = assignedProducts.length > 0;

    let confirmMsg = `¿Estás seguro de que deseas eliminar la subcategoría "${subName}"?`;
    if (hasProducts) {
      confirmMsg = `La subcategoría "${subName}" tiene ${assignedProducts.length} producto(s) asignado(s). Si la eliminas, estos productos se desvincularán automáticamente de esta subcategoría. ¿Deseas continuar?`;
    }

    showCustomConfirm("Eliminar Subcategoría", confirmMsg, () => {
      // Disassociate products
      const updatedProducts = store.products.map(p => {
        let updated = { ...p };
        let changed = false;

        if (p.subcategoria_id === subId) {
          updated.subcategoria_id = "all";
          changed = true;
        }

        if (p.subcategorias_adicionales && p.subcategorias_adicionales.includes(subId)) {
          updated.subcategorias_adicionales = p.subcategorias_adicionales.filter(id => id !== subId);
          changed = true;
        }

        return changed ? updated : p;
      });

      const updatedDbSubcategories = (store.dbSubcategories || []).filter(s => s.id !== subId);
      const updatedState = { 
        ...store, 
        products: updatedProducts, 
        dbSubcategories: updatedDbSubcategories 
      };
      saveStateToServer(updatedState);
      showAdminToast("¡Subcategoría eliminada correctamente!", "success");
    });
  };

  // Save Settings Changes (Design, titles, colors, WhatsApp)
  const handleSaveSettings = () => {
    const updatedState = { ...store, settings: editingSettings };
    saveStateToServer(updatedState);
  };

  // Image Helper templates
  const UNSPLASH_TEMPLATES = [
    { title: "Ropa / Moda 1", url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80" },
    { title: "Ropa / Moda 2", url: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=800&q=80" },
    { title: "Electrónica 1", url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80" },
    { title: "Electrónica 2", url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80" },
    { title: "Accesorios 1", url: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80" },
    { title: "Accesorios 2", url: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=800&q=80" }
  ];

  // Business Stock Alerts Logic
  const lowStockThresholdSetting = typeof store.settings?.lowStockThreshold === 'number' ? store.settings.lowStockThreshold : 5;
  const outOfStockProducts = store.products.filter(p => p.active !== false && p.stock <= 0);
  const lowStockProducts = store.products.filter(p => p.active !== false && p.stock > 0 && p.stock <= lowStockThresholdSetting);
  const totalStockAlerts = outOfStockProducts.length + lowStockProducts.length;

  // Filtering products for listing
  const filteredProducts = store.products.filter((p) => {
    if (p.paused || p.active === false) return false;
    
    let matchesSearch = true;
    if (searchQuery.trim().length > 0) {
      matchesSearch = calculateRelevance(p, searchQuery, store.dbCategories, store.dbSubcategories) > 0;
    }
    
    let matchesCategory = true;
    if (selectedCategory !== "todos") {
      const catObj = (store.dbCategories || []).find(
        (c) => c.nombre.toLowerCase() === selectedCategory.toLowerCase() || c.id === selectedCategory.toLowerCase()
      );
      const catId = catObj ? catObj.id : "";
      
      const isMainCatMatch = (p.categoria_id && catId && p.categoria_id === catId) || 
                             (p.category && p.category.toLowerCase() === selectedCategory.toLowerCase());
      
      const isAdditionalCatMatch = !!(p.categorias_adicionales && catId && p.categorias_adicionales.includes(catId));
      const hasCatMatch = isMainCatMatch || isAdditionalCatMatch;
      
      if (!hasCatMatch) {
         matchesCategory = false;
      } else if (selectedSubcategory && selectedSubcategory !== "all") {
        const isMainSubMatch = p.subcategoria_id && p.subcategoria_id === selectedSubcategory;
        const isAdditionalSubMatch = !!(p.subcategorias_adicionales && p.subcategorias_adicionales.includes(selectedSubcategory));
        
        if (isMainSubMatch || isAdditionalSubMatch) {
          matchesCategory = true;
        } else if (p.subcategoria_id && p.subcategoria_id !== "all") {
          matchesCategory = false;
        } else {
          // Fallback to keyword search for backward compatibility
          const keywords = SUBCATEGORY_KEYWORDS[selectedSubcategory] || [];
          if (keywords.length > 0) {
            const textToSearch = (p.name + " " + p.description).toLowerCase();
            const matchesKeyword = keywords.some(kw => textToSearch.includes(kw));
            matchesCategory = matchesKeyword;
          } else {
            // Unrecognized subcategory identifier fallback matching by checking strings
            const subcatObj = (store.dbSubcategories || []).find(s => s.id === selectedSubcategory);
            const subName = subcatObj ? subcatObj.nombre.toLowerCase() : selectedSubcategory.toLowerCase();
            const textToSearch = (p.name + " " + p.description).toLowerCase();
            matchesCategory = textToSearch.includes(subName);
          }
        }
      }
    }

    // Stock Filter
    if (onlyInStock && p.stock <= 0) {
      return false;
    }
    
    return matchesSearch && matchesCategory;
  });

  // Apply sorting options
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    // If a search query is typed and default sort 'featured' is used, sort by relevance score first!
    if (searchQuery.trim().length > 0 && sortBy === "featured") {
      const scoreA = calculateRelevance(a, searchQuery, store.dbCategories, store.dbSubcategories);
      const scoreB = calculateRelevance(b, searchQuery, store.dbCategories, store.dbSubcategories);
      if (scoreA !== scoreB) {
        return scoreB - scoreA;
      }
    }
    if (sortBy === "price-asc") {
      return a.price - b.price;
    }
    if (sortBy === "price-desc") {
      return b.price - a.price;
    }
    if (sortBy === "newest") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    // Default: Featured
    if (sortBy === "featured") {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
    }
    return 0;
  });

  const featuredProducts = store.products.filter((p) => p.featured && !p.paused);

  const clothingProducts = store.products.filter((p) => {
    const cat = p.category.toLowerCase();
    return cat === "ropa" || cat.includes("vest") || cat.includes("calza") || cat.includes("prend") || cat.includes("buzo") || cat.includes("abrigo") || cat.includes("jean") || cat.includes("remera") || cat.includes("panta");
  });

  const electronicsProducts = store.products.filter((p) => {
    const cat = p.category.toLowerCase();
    return cat === "artículos electrónicos" || cat === "electrónica" || cat.includes("electron") || cat.includes("tecnol");
  });

  const otherProducts = store.products.filter((p) => {
    const cat = p.category.toLowerCase();
    const isCloth = cat === "ropa" || cat.includes("vest") || cat.includes("calza") || cat.includes("prend") || cat.includes("buzo") || cat.includes("abrigo") || cat.includes("jean") || cat.includes("remera") || cat.includes("panta");
    const isElec = cat === "artículos electrónicos" || cat === "electrónica" || cat.includes("electron") || cat.includes("tecnol");
    return !isCloth && !isElec;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center gap-4">
        <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
        <p className="font-mono text-sm text-zinc-400">Cargando base de datos de la tienda...</p>
      </div>
    );
  }

  return (
    <div id="app" className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
      store.settings.themeMode === "dark" ? "bg-zinc-950 text-white" : "bg-slate-50 text-slate-800"
    }`}>
      
      {/* Dynamic theme style overrides */}
      <ThemeStyles settings={store.settings} />

      {/* Fixed Top Navigation Container */}
      <div className={`fixed top-0 left-0 right-0 w-full z-50 transition-all duration-305 ${
        store.settings.themeMode === "dark" 
          ? scrolled 
            ? "bg-zinc-950/80 border-b border-zinc-805 backdrop-blur-md shadow-lg shadow-black/20" 
            : "bg-zinc-950 border-b border-zinc-900 shadow-sm" 
          : scrolled 
            ? "bg-white/80 border-b border-slate-200 backdrop-blur-md shadow-md shadow-slate-100/70" 
            : "bg-white border-b border-slate-200 shadow-sm"
      }`}>
        {/* Top Banner Message for Promotions */}
        {store.settings.showPromotionBanner && store.settings.promotionBannerText && (
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-2 px-4 text-center text-xs font-semibold relative z-30 flex items-center justify-center gap-2">
            <Tag className="h-3 w-3 inline" />
            <span>{store.settings.promotionBannerText}</span>
          </div>
        )}

        {/* Main Layout Header based on design HTML & Professional Polish theme */}
        <header className="min-h-[3.5rem] h-14 md:h-16 flex items-center justify-between px-4 md:px-6 shrink-0 relative z-40 gap-3 md:gap-4 transition-all duration-300 bg-transparent">
        
        {/* Logo and hamburger container */}
        <div className="flex items-center gap-2 md:gap-4 select-none">
          {/* Mobile hamburger toggle */}
          {activeTab === "storefront" && (
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className={`p-2 rounded-xl lg:hidden transition cursor-pointer ${
                store.settings.themeMode === "dark"
                  ? "hover:bg-zinc-800 text-zinc-300 hover:text-white"
                  : "hover:bg-slate-100 text-slate-600 hover:text-slate-900"
              }`}
              title="Abrir menú"
              aria-label="Menú"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}

          <div 
            onClick={() => {
              navigateToProductRoute("todos", "all");
              setIsMobileMenuOpen(false);
            }}
            className="flex items-center gap-2 md:gap-4 shrink-0 cursor-pointer"
          >
            {/* Elegant Circular Logo inspired by Juem logo from design HTML */}
            {store.settings.logoType === "image" && store.settings.logoImageUrl ? (
              <img
                src={store.settings.logoImageUrl}
                alt={store.settings.siteTitle}
                className="w-8 h-8 rounded-xl object-cover shadow-sm"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-8 h-8 theme-btn-primary rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm">
                {store.settings.logoText || "J"}
              </div>
            )}
            <div>
              <h1 className="font-bold text-sm md:text-lg tracking-tight flex items-center gap-1.5">
                <span>{store.settings.siteTitle}</span>
              </h1>
            </div>
          </div>
        </div>

        {/* Modern Clean Individual Category Hover/Click Dropdowns (Only shown for activeTab === "storefront") */}
        {activeTab === "storefront" && (
          <div className="hidden lg:flex items-center flex-wrap gap-1.5 sm:gap-3 md:gap-4 py-1 relative z-50 overflow-visible justify-center">
            {(store.dbCategories || [])
              .sort((a, b) => (a.orden || 0) - (b.orden || 0))
              .map((catObj) => {
                const displayName = catObj.nombre;
                const isCatActive = selectedCategory === catObj.nombre;
                
                // Get dynamic subcategories nested under this category
                const dbSubs = (store.dbSubcategories || []).filter(sub => sub.categoria_id === catObj.id);
                // Define complete menu subcategories list, starting with full collection explorer option
                const itemSubcategories = [
                  { id: "all", name: `Ver todo ${catObj.nombre}` },
                  ...dbSubs.map(s => ({ id: s.id, name: s.nombre }))
                ];
                
                const isOpen = activeDropdown === catObj.id;

                return (
                  <div
                    key={catObj.id}
                    className="relative shrink-0 category-dropdown-container"
                    onMouseEnter={() => {
                      if (window.innerWidth >= 768) {
                        setActiveDropdown(catObj.id);
                      }
                    }}
                    onMouseLeave={() => {
                      if (window.innerWidth >= 768) {
                        setActiveDropdown(null);
                      }
                    }}
                  >
                    {/* Category Button */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setActiveDropdown(isOpen ? null : catObj.id);
                      }}
                      className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs font-bold transition-all duration-300 border select-none cursor-pointer tracking-tight ${
                        isCatActive
                          ? "theme-btn-primary border-transparent text-white shadow-md shadow-indigo-500/10 scale-[1.02]"
                          : store.settings.themeMode === "dark"
                          ? "border-zinc-800 bg-zinc-900/50 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800/80 hover:text-white"
                          : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-950 hover:border-slate-300 shadow-sm"
                      }`}
                    >
                      <span className="shrink-0 size-3.5 flex items-center justify-center [&_svg]:h-3.5 [&_svg]:w-3.5 opacity-80">
                        {getCategoryIcon(catObj.icono || catObj.nombre)}
                      </span>
                      <span>{displayName}</span>
                      <ChevronDown className={`h-3 w-3 transition-transform duration-300 opacity-60 ${isOpen ? "rotate-180" : ""}`} />
                    </button>

                    {/* Dropdown Menu Container (using AnimatePresence and motion.div) */}
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 12, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.95 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                          className="absolute top-full left-1/2 -translate-x-1/2 md:-translate-x-0 md:left-0 mt-2.5 w-48 rounded-xl shadow-2xl p-1.5 z-50 origin-top bg-zinc-950/95 border border-zinc-800 backdrop-blur-md text-white select-none"
                        >
                          {/* Inner list */}
                          <div className="flex flex-col gap-0.5">
                            {itemSubcategories.map((subcat) => {
                              const isSubcatActive = isCatActive && selectedSubcategory === subcat.id;
                              return (
                                <button
                                  key={subcat.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigateToProductRoute(catObj.id, subcat.id);
                                    setActiveDropdown(null);
                                  }}
                                  className={`w-full text-left text-[11px] py-2 px-2.5 rounded-lg transition-all cursor-pointer font-bold uppercase tracking-wider flex items-center justify-between ${
                                    isSubcatActive
                                      ? "bg-indigo-600/30 text-indigo-400"
                                      : "text-zinc-300 hover:bg-zinc-900 hover:text-white"
                                  }`}
                                >
                                  <span>{subcat.name}</span>
                                  {isSubcatActive && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shadow shadow-indigo-500/50" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
          </div>
        )}

        {/* Dynamic Nav link / controls */}
        <div className="flex items-center gap-3 md:gap-4 font-sans text-sm shrink-0">
          {activeTab === "storefront" ? (
            <>
              {/* Shopping Cart Trigger */}
              <button
                onClick={() => setIsCartOpen(true)}
                className={`relative p-2 rounded-xl transition flex items-center gap-1.5 ${
                  store.settings.themeMode === "dark" 
                    ? "hover:bg-zinc-800 text-zinc-300 hover:text-white" 
                    : "hover:bg-slate-100 text-slate-600 hover:text-slate-900"
                }`}
              >
                <CartIcon className="h-5 w-5" />
                <span className="text-xs font-mono font-bold bg-indigo-600 text-white rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              </button>

              {/* Toggle to admin */}
              {authToken && (
                <button
                  onClick={() => {
                    setActiveTab("admin");
                    window.history.pushState(null, "", `/admin/${adminSection}`);
                  }}
                  className="hidden lg:flex items-center gap-1 text-xs font-bold py-1.5 px-3 rounded-lg bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 transition cursor-pointer"
                >
                  <Settings className="h-3.5 w-3.5" />
                  <span>Panel Admin</span>
                </button>
              )}
            </>
          ) : (
            <>
              {/* Active Synchronization state panel from design HTML */}
              <div className="flex items-center gap-2 px-2.5 py-1 bg-green-500/10 text-green-400 rounded-full border border-green-500/20">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-[10px] font-semibold uppercase tracking-wider hidden md:inline">Base de Datos Sincronizada</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider md:hidden">Sincronizado</span>
              </div>

              {/* View Store button */}
              <button
                onClick={() => setActiveTab("storefront")}
                className={`flex items-center gap-1.5 text-xs font-bold py-1.5 px-3 rounded-lg transition ${
                  store.settings.themeMode === "dark" 
                    ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-300" 
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Ver Tienda</span>
              </button>

              {/* Active account details (Juem) */}
              <div className="flex items-center gap-2 pl-3 border-l border-zinc-700/50">
                <div className="hidden md:block text-right">
                  <p className="text-xs font-bold leading-none">Juem</p>
                  <p className="text-[9px] text-zinc-500">Administrador Principal</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-1 text-red-400 hover:bg-red-400/15 rounded transition"
                  title="Cerrar sesión"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </>
          )}
        </div>
      </header>
    </div>

    {/* Dynamic Spacer to prevent content from slipping under fixed navbar */}
    <div 
      className={
        store.settings.showPromotionBanner && store.settings.promotionBannerText
          ? "h-[88px] lg:h-[100px]"
          : "h-[56px] lg:h-[64px]"
      }
    />

      {/* RENDER STOREFRONT OPTION */}
      {activeTab === "storefront" && (
        <div className="flex-1 flex flex-col">
          {selectedProduct ? (
            <ProductDetails
              product={store.products.find(p => p.id === selectedProduct.id) || selectedProduct}
              onClose={() => {
                setSelectedProduct(null);
                const catalogPath = getCatalogPath();
                window.history.pushState(null, "", catalogPath);
              }}
              onAddToCart={(p, sz, col, qty) => {
                handleAddToCart(p, sz, col, qty);
              }}
              settings={store.settings}
              allProducts={store.products}
              dbCategories={store.dbCategories || []}
              onViewProduct={(p) => {
                setSelectedProduct(p);
                window.history.pushState(null, "", `/producto/${p.id}`);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          ) : (
            <>
              {/* Interactive Hero Slider Showcase */}
          {selectedCategory === "todos" && !searchQuery && (
            <HeroSlider
              settings={store.settings}
              onExploreCatalog={(slideLink) => {
                if (!slideLink) {
                  const el = document.getElementById("catalog-view");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                  return;
                }

                if (slideLink.startsWith("category:")) {
                  const catName = slideLink.replace("category:", "");
                  setSelectedCategory(catName);
                  setSelectedSubcategory("all");
                  setTimeout(() => {
                    const el = document.getElementById("catalog-view");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }, 100);
                } else if (slideLink.startsWith("subcategory:")) {
                  const subId = slideLink.replace("subcategory:", "");
                  const subcat = (store.dbSubcategories || []).find(s => s.id === subId);
                  if (subcat) {
                    const catObj = (store.dbCategories || []).find(c => c.id === subcat.categoria_id);
                    if (catObj) {
                      setSelectedCategory(catObj.nombre);
                    }
                    setSelectedSubcategory(subId);
                    setTimeout(() => {
                      const el = document.getElementById("catalog-view");
                      if (el) el.scrollIntoView({ behavior: "smooth" });
                    }, 100);
                  }
                } else if (slideLink.startsWith("product:")) {
                  const prodId = slideLink.replace("product:", "");
                  const prod = store.products.find(p => p.id === prodId);
                  if (prod) {
                    handleOpenProduct(prod);
                  }
                } else if (slideLink.startsWith("http://") || slideLink.startsWith("https://")) {
                  window.open(slideLink, "_blank");
                } else if (slideLink.startsWith("#") && slideLink.length > 1) {
                  const el = document.getElementById(slideLink.substring(1));
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                } else {
                  const el = document.getElementById("catalog-view");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }
              }}
            />
          )}

          {/* Search bar container */}
          <section id="catalog-view" className="py-8 max-w-7xl mx-auto px-6 w-full flex-1">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6 border-b pb-6 border-zinc-200/50 dark:border-zinc-800/50">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-1.5 h-4 bg-indigo-500 rounded-full"></span>
                  <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">
                    Búsqueda de Catálogo
                  </h2>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Encuentra prendas de vestir, tecnología y accesorios al instante.</p>
              </div>

              {/* Premium Search, Sorting & Stock Filter Bar */}
              <div className="w-full md:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                <div className="relative w-full md:w-80">
                  <input
                    type="text"
                    placeholder="Buscar por nombre, descripción o marca..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 250)}
                    className={`w-full pl-9 pr-10 py-3 rounded-xl text-xs outline-none border transition-all ${
                      store.settings.themeMode === "dark"
                        ? "bg-zinc-900 border-zinc-800 text-white placeholder-zinc-500 focus:border-zinc-700 focus:bg-zinc-950"
                        : "bg-slate-50 border-slate-150 text-slate-800 focus:bg-white focus:border-blue-400"
                    }`}
                  />
                  <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  {searchQuery && (
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setShowSuggestions(false);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white text-xs font-bold font-mono cursor-pointer"
                    >
                      ×
                    </button>
                  )}

                  {/* Autocomplete / Search Suggestions Popover */}
                  {showSuggestions && searchQuery.trim().length >= 2 && (() => {
                    const normQ = normalizeText(searchQuery);
                    
                    // 1. Match categories
                    const matchingCats = (store.dbCategories || [])
                      .filter(c => c.active !== false && normalizeText(c.nombre).includes(normQ));
                    
                    const matchingSubs = (store.dbSubcategories || [])
                      .filter(s => s.active !== false && normalizeText(s.nombre).includes(normQ));

                    // 2. Match products (top 5 matched)
                    const matchingProds = store.products
                      .filter(p => !p.paused && p.active !== false)
                      .map(p => ({
                        product: p,
                        score: calculateRelevance(p, searchQuery, store.dbCategories, store.dbSubcategories)
                      }))
                      .filter(item => item.score > 0)
                      .sort((a, b) => b.score - a.score)
                      .slice(0, 5);

                    const hasAnySuggestion = matchingCats.length > 0 || matchingSubs.length > 0 || matchingProds.length > 0;

                    if (!hasAnySuggestion) {
                      return (
                        <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800/85 rounded-xl shadow-xl z-50 p-4 text-center">
                          <p className="text-xs text-zinc-400 dark:text-zinc-500">
                            No se encontraron sugerencias para "<span className="font-semibold">{searchQuery}</span>"
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div className="absolute right-0 top-full mt-2 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800/85 rounded-xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100 dark:divide-zinc-900 transition-all duration-200 w-[300px] sm:w-[360px] md:w-[400px]">
                        
                        {/* Render category direct link suggestions */}
                        {(matchingCats.length > 0 || matchingSubs.length > 0) && (
                          <div className="p-2 bg-slate-50/50 dark:bg-zinc-900/20">
                            <span className="block text-[9px] font-extrabold uppercase text-slate-400 dark:text-zinc-550 px-2.5 py-1 tracking-wider">
                              Categorías sugeridas
                            </span>
                            <div className="space-y-0.5">
                              {matchingCats.map(cat => (
                                <button
                                  key={`cat-sug-${cat.id}`}
                                  onClick={() => {
                                    setSelectedCategory(cat.id);
                                    setSelectedSubcategory("all");
                                    setSearchQuery("");
                                    setShowSuggestions(false);
                                    // Smooth scroll to catalog
                                    document.getElementById("catalog-view")?.scrollIntoView({ behavior: "smooth" });
                                  }}
                                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-zinc-300 transition-colors flex items-center justify-between cursor-pointer border-0 bg-transparent"
                                >
                                  <span className="font-semibold text-indigo-650 dark:text-indigo-400">
                                    {cat.nombre}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-mono">Ir a categoría ›</span>
                                </button>
                              ))}
                              {matchingSubs.map(sub => {
                                const parentCat = (store.dbCategories || []).find(c => c.id === sub.categoria_id);
                                return (
                                  <button
                                    key={`sub-sug-${sub.id}`}
                                    onClick={() => {
                                      if (parentCat) {
                                        setSelectedCategory(parentCat.id);
                                      }
                                      setSelectedSubcategory(sub.id);
                                      setSearchQuery("");
                                      setShowSuggestions(false);
                                      document.getElementById("catalog-view")?.scrollIntoView({ behavior: "smooth" });
                                    }}
                                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-zinc-300 transition-colors flex items-center justify-between cursor-pointer border-0 bg-transparent"
                                  >
                                    <span className="text-zinc-700 dark:text-zinc-300">
                                      {parentCat?.nombre || "Otros"} › <span className="font-semibold text-indigo-650 dark:text-indigo-400">{sub.nombre}</span>
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-mono">Ir a subcategoría ›</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Render top matched products */}
                        {matchingProds.length > 0 && (
                          <div className="p-2">
                            <span className="block text-[9px] font-extrabold uppercase text-slate-400 dark:text-zinc-550 px-2.5 py-1 tracking-wider">
                              Artículos sugeridos
                            </span>
                            <div className="space-y-1">
                              {matchingProds.map(item => {
                                const p = item.product;
                                return (
                                  <button
                                    key={`prod-sug-${p.id}`}
                                    onClick={() => {
                                      handleOpenProduct(p);
                                      setShowSuggestions(false);
                                    }}
                                    className="w-full text-left p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-900 transition-colors flex items-center gap-3 cursor-pointer group border-0 bg-transparent"
                                  >
                                    <div className="relative w-10 h-10 rounded-md overflow-hidden bg-slate-100 dark:bg-zinc-800 shrink-0 border border-slate-150 dark:border-zinc-900">
                                      <img
                                        src={p.imageUrl}
                                        alt={p.name}
                                        referrerPolicy="no-referrer"
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                      />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <span className="block text-xs font-bold text-slate-800 dark:text-zinc-100 truncate group-hover:text-indigo-650 dark:group-hover:text-indigo-400 transition-colors">
                                        {p.name}
                                      </span>
                                      <span className="block text-[10px] text-slate-450 dark:text-zinc-500 truncate">
                                        {p.category} | {p.stock > 0 ? `${p.stock} dispo` : "Bajo demanda"}
                                      </span>
                                    </div>
                                    <div className="text-right shrink-0">
                                      <span className="text-xs font-black text-indigo-655 dark:text-indigo-400">
                                        ${Math.round(p.price)}
                                      </span>
                                      {p.originalPrice && p.originalPrice > p.price && (
                                        <span className="block text-[9px] text-slate-400 dark:text-zinc-500 line-through">
                                          ${Math.round(p.originalPrice)}
                                        </span>
                                      )}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        <div className="p-2 bg-slate-50 dark:bg-zinc-900/40 text-center">
                          <button
                            onClick={() => {
                              setShowSuggestions(false);
                            }}
                            className="text-[10px] text-indigo-605 dark:text-indigo-400 font-bold hover:underline cursor-pointer border-0 bg-transparent"
                          >
                            Ver todos los resultados ({filteredProducts.length})
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Show elegant Filtros & Orden button ONLY when a category is selected */}
                {selectedCategory !== "todos" && (
                  <button
                    id="btn-advanced-filters"
                    onClick={() => setShowFiltersPanel(!showFiltersPanel)}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-bold transition-all border cursor-pointer select-none ${
                      showFiltersPanel || onlyInStock || sortBy !== "featured"
                        ? "theme-btn-accent text-zinc-950 border-transparent shadow-sm scale-102"
                        : store.settings.themeMode === "dark"
                        ? "bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-850"
                        : "bg-slate-100 border-slate-200 text-zinc-700 hover:bg-slate-200"
                    }`}
                  >
                    <Sliders className="h-4 w-4" />
                    <span>Filtros & Orden</span>
                    {(onlyInStock || sortBy !== "featured") && (
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Collapsible advanced filters panel (Only shown inside a category) */}
            <AnimatePresence>
              {selectedCategory !== "todos" && showFiltersPanel && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="overflow-hidden pb-6 border-b border-zinc-200/50 dark:border-zinc-800/50 mb-6"
                >
                  <div className={`p-5 rounded-2xl border ${
                    store.settings.themeMode === "dark"
                      ? "bg-zinc-950/40 border-zinc-900"
                      : "bg-slate-50/50 border-slate-150"
                  } grid grid-cols-1 sm:grid-cols-2 gap-6`}>
                    
                    {/* Collapsible Sorting options */}
                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">
                        Ordenar por
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: "featured", label: "Destacados ⭐" },
                          { id: "price-asc", label: "Menor Precio 📈" },
                          { id: "price-desc", label: "Mayor Precio 📉" },
                          { id: "newest", label: "Más Recientes 📅" }
                        ].map(option => (
                          <button
                            key={option.id}
                            onClick={() => setSortBy(option.id)}
                            className={`px-3 py-2.5 rounded-lg text-xs font-semibold cursor-pointer transition-all duration-205 text-center ${
                              sortBy === option.id
                                ? "theme-btn-primary text-white scale-[1.01]"
                                : store.settings.themeMode === "dark"
                                ? "bg-zinc-900/50 text-zinc-400 hover:bg-zinc-900 hover:text-white border border-zinc-800"
                                : "bg-slate-100 text-zinc-650 hover:bg-slate-200/60 hover:text-zinc-900 border border-slate-200"
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Stock switch availability */}
                    <div className="flex flex-col justify-center">
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3 font-semibold">
                        Disponibilidad
                      </h4>
                      <div className="block">
                        <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={onlyInStock}
                            onChange={(e) => setOnlyInStock(e.target.checked)}
                            className="rounded border-zinc-300 dark:border-zinc-850 text-indigo-600 focus:ring-indigo-550 h-4 w-4 pointer-events-auto cursor-pointer"
                          />
                          <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Mostrar solo productos con Stock disponible</span>
                        </label>
                      </div>
                    </div>

                  </div>

                  {/* Clean filters notification strip */}
                  {(onlyInStock || sortBy !== "featured") && (
                    <div className="flex items-center justify-between gap-3 mt-4 px-2">
                      <span className="text-[11px] text-indigo-400 font-semibold">✨ Filtro rápido activo para ordenar tu catálogo</span>
                      <button
                        onClick={() => {
                          setOnlyInStock(false);
                          setSortBy("featured");
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-500 hover:bg-red-500/10 cursor-pointer transition-colors"
                      >
                        Limpiar Selección ×
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Clean current filters notification strip on non-panel view */}
            {selectedCategory !== "todos" && !showFiltersPanel && (onlyInStock || sortBy !== "featured") && (
              <div className="flex items-center justify-between gap-3 pb-4 border-b border-zinc-200/50 dark:border-zinc-800/50 mb-6 px-1">
                <span className="text-[11px] text-indigo-400 font-semibold">✨ Filtro rápido activo para ordenar tu catálogo</span>
                <button
                  onClick={() => {
                    setOnlyInStock(false);
                    setSortBy("featured");
                  }}
                  className="px-3 py-1 rounded-lg text-xs font-bold text-red-500 hover:bg-red-500/10 cursor-pointer transition-colors"
                >
                  Limpiar Orden ×
                </button>
              </div>
            )}

            {/* Featured Showcase if there are products marked featured */}
            {featuredProducts.length > 0 && selectedCategory === "todos" && !searchQuery && (
              <div className="mb-12">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-1.5 h-6 theme-btn-primary rounded-full"></div>
                  <h3 className="text-xl font-bold tracking-tight">Especiales Destacados</h3>
                  <span className="text-[10px] uppercase font-bold text-yellow-400 animate-pulse">¡Los más buscados!</span>
                </div>
                <ProductSlider
                  products={featuredProducts}
                  settings={store.settings}
                  onAddToCart={(prod, sz, col) => handleAddToCart(prod, sz, col)}
                  onViewProduct={(prod) => handleOpenProduct(prod)}
                  emptyIcon={<ShoppingBag className="h-6 w-6" />}
                  emptyText="No hay productos destacados activos."
                  emptySubtext=""
                />
              </div>
            )}

            {/* If there's an active filter query, category, or custom sorting, show a single filtered/sorted grid view */}
            {(selectedCategory !== "todos" || searchQuery || onlyInStock || sortBy !== "featured") ? (
              <>
                <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-6 theme-btn-accent rounded-full"></div>
                    <h3 className="text-xl font-bold tracking-tight">
                      {searchQuery ? (
                        "Resultados de Búsqueda"
                      ) : selectedCategory !== "todos" ? (
                        <span className="inline-flex items-center gap-1.5">
                          <span>{getCategoryDisplayName(selectedCategory)}</span>
                          {selectedSubcategory && selectedSubcategory !== "all" && (
                            <>
                              <span className="text-zinc-400 dark:text-zinc-600 font-normal">›</span>
                              <span className="text-zinc-400 dark:text-zinc-500 font-medium text-base">
                                {SUBCATEGORIES_MAP[selectedCategory]?.find(s => s.id === selectedSubcategory)?.name || selectedSubcategory}
                              </span>
                            </>
                          )}
                        </span>
                      ) : (
                        "Catálogo de Productos"
                      )}
                    </h3>
                    <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">({sortedProducts.length} productos)</span>
                  </div>

                  <button
                    onClick={() => {
                      navigateToProductRoute("todos", "all");
                      setSearchQuery("");
                      setOnlyInStock(false);
                      setSortBy("featured");
                    }}
                    className="text-xs text-indigo-500 hover:underline transition-all cursor-pointer font-bold"
                  >
                    Limpiar Filtros ×
                  </button>
                </div>

                {sortedProducts.length === 0 ? (
                  <div className={`p-16 text-center rounded-2xl border border-dashed ${
                    store.settings.themeMode === "dark" ? "border-zinc-800 text-zinc-500" : "border-slate-200 text-slate-400"
                  }`}>
                    <ShoppingBag className="h-10 w-10 mx-auto mb-3 opacity-60" />
                    <p className="text-base font-semibold">No se encontraron productos coincidentes</p>
                    <p className="text-xs mt-1">Prueba a restablecer filtros o cambiar tu término de búsqueda e intenta nuevamente.</p>
                    <button
                      onClick={() => {
                        navigateToProductRoute("todos", "all");
                        setSearchQuery("");
                        setOnlyInStock(false);
                        setSortBy("featured");
                      }}
                      className="mt-4 px-4 py-2 rounded-xl text-xs theme-btn-primary inline-block font-semibold pointer-events-auto cursor-pointer"
                    >
                      Ver todo el catálogo
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
                    {sortedProducts.map((p) => (
                      <ProductCard
                        key={p.id}
                        product={p}
                        settings={store.settings}
                        onAddToCart={(prod, sz, col) => handleAddToCart(prod, sz, col)}
                        onViewProduct={(prod) => handleOpenProduct(prod)}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              /* Custom dynamic database-driven categorizations when viewing "Todos" */
              <div className="space-y-16">
                {(store.dbCategories || [])
                  .filter((catObj) => catObj.active !== false)
                  .sort((a, b) => (a.orden || 0) - (b.orden || 0))
                  .map((catObj) => {
                    const catProducts = store.products.filter(
                      (p) => 
                        p.categoria_id === catObj.id || 
                        p.category?.toLowerCase() === catObj.nombre?.toLowerCase() ||
                        (p.categorias_adicionales && p.categorias_adicionales.includes(catObj.id))
                    );
                    
                    return (
                      <div key={catObj.id} className="scroll-mt-24">
                        <div className="flex items-center justify-between border-b border-zinc-100/10 dark:border-zinc-850 pb-3 mb-6">
                          <button
                            onClick={() => navigateToProductRoute(catObj.id, "all")}
                            className="flex items-center gap-2 text-left group cursor-pointer focus:outline-none"
                          >
                            <div className="w-1.5 h-6 rounded-full transition-transform duration-300 group-hover:scale-y-125" style={{ backgroundColor: store.settings.primaryColor }}></div>
                            <span className="p-1.5 rounded-lg flex items-center justify-center [&_svg]:h-4 [&_svg]:w-4 transition-transform duration-300 group-hover:scale-110" style={{ color: store.settings.primaryColor, backgroundColor: `${store.settings.primaryColor}15` }}>
                              {getCategoryIcon(catObj.icono || catObj.nombre)}
                            </span>
                            <h3 className="text-xl font-extrabold tracking-tight flex items-center gap-1.5">
                              <span className="group-hover:underline">{catObj.nombre}</span>
                              <span 
                                className="text-sm opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-x-1 group-hover:translate-x-0"
                                style={{ color: store.settings.primaryColor }}
                              >
                                &rarr;
                              </span>
                            </h3>
                          </button>
                        </div>

                        <ProductSlider
                          products={catProducts}
                          settings={store.settings}
                          onAddToCart={(prod, sz, col) => handleAddToCart(prod, sz, col)}
                          onViewProduct={(prod) => handleOpenProduct(prod)}
                          emptyIcon={getCategoryIcon(catObj.icono || catObj.nombre)}
                          emptyText={`No se encontraron artículos de ${catObj.nombre}.`}
                          emptySubtext={`Puedes crear artículos desde el panel de productos asignando como categoría "${catObj.nombre}".`}
                        />
                      </div>
                    );
                  })}
              </div>
            )}
          </section>

          {/* Features highlight banner */}
          <footer className={`py-12 border-t mt-12 transition-all duration-300 ${
            store.settings.themeMode === "dark" 
              ? "bg-zinc-950/40 border-zinc-900/60 text-zinc-400" 
              : "bg-white border-slate-100/85 text-slate-500"
          }`}>
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
              <div className="space-y-2 group">
                <h4 className={`font-bold text-xs uppercase tracking-[0.14em] font-mono transition-all duration-300 ${
                  store.settings.themeMode === "dark" ? "text-zinc-100 group-hover:text-[#5346ff]" : "text-slate-850 group-hover:text-indigo-600"
                }`}>
                  {store.settings.footerCol1Title || "🚀 Compra Personalizada"}
                </h4>
                <p className="text-xs leading-relaxed opacity-85 hover:opacity-100 transition-opacity">
                  {store.settings.footerCol1Text || "Realiza tus pedidos seleccionando tus talles y colores favoritos. El carrito envía una lista formateada directo a nuestro WhatsApp de atención oficial para coordinar pago y entrega express."}
                </p>
              </div>
              <div className="space-y-2 group">
                <h4 className={`font-bold text-xs uppercase tracking-[0.14em] font-mono transition-all duration-300 ${
                  store.settings.themeMode === "dark" ? "text-zinc-100 group-hover:text-[#5346ff]" : "text-slate-850 group-hover:text-indigo-600"
                }`}>
                  {store.settings.footerCol2Title || "🌟 Calidad Asegurada"}
                </h4>
                <p className="text-xs leading-relaxed opacity-85 hover:opacity-100 transition-opacity">
                  {store.settings.footerCol2Text || "Todos los productos que visualizas pasan por un control estricto de empaque y selección. Ofrecemos cambio de talle inmediato dentro de las 72 horas de recibida tu compra."}
                </p>
              </div>
              <div className="space-y-2 group">
                <h4 className={`font-bold text-xs uppercase tracking-[0.14em] font-mono transition-all duration-300 ${
                  store.settings.themeMode === "dark" ? "text-zinc-100 group-hover:text-[#5346ff]" : "text-slate-850 group-hover:text-indigo-600"
                }`}>
                  {store.settings.footerCol3Title || "📞 Soporte Directo"}
                </h4>
                <p className="text-xs leading-relaxed opacity-85 hover:opacity-100 transition-opacity">
                  {store.settings.footerCol3Text || "¿Habiendo dudas con talles o stock rápido? Pícale al botón de consulta express en la ficha de cada producto y un asesor te responderá inmediatamente en WhatsApp."}
                </p>
              </div>
            </div>
            <div className="max-w-7xl mx-auto px-6 mt-8 pt-8 border-t border-zinc-800/10 text-center text-[11px] space-y-2">
              <p className="leading-relaxed opacity-75">
                &copy; 2026 {store.settings.siteTitle}. {store.settings.footerCopyright || "Desarrollado con tecnología de punta responsive. Reservados todos los derechos."}
              </p>
              {!authToken && (
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="text-zinc-500 hover:text-indigo-400 dark:text-zinc-500 dark:hover:text-indigo-400 font-semibold cursor-pointer transition text-xs inline-flex items-center gap-1 mt-1"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Acceso Administrativo</span>
                </button>
              )}
            </div>
          </footer>
        </>
      )}
        </div>
      )}

      {/* RENDER ADMIN DASHBOARD - SECURE ACCESS GUARD WHEN NOT AUTHENTICATED */}
      {activeTab === "admin" && !authToken && (
        <div className="flex-grow flex items-center justify-center p-6 bg-slate-100 dark:bg-zinc-950 min-h-[70vh]">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl space-y-6">
            <div className="w-16 h-16 bg-red-500/10 dark:bg-red-500/5 text-red-500 rounded-2xl flex items-center justify-center mx-auto border border-red-500/20">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            
            <div className="space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-red-500 bg-red-500/10 px-2.5 py-1 rounded-full border border-red-500/20 inline-block">
                Acceso Restringido - Ruta Protegida
              </span>
              <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Ruta Administrativa Protegida
              </h3>
              <p className="text-slate-500 dark:text-zinc-400 text-xs max-w-sm mx-auto leading-relaxed">
                No tienes autorización para acceder a este panel. Inicia sesión con tus credenciales de administrador para continuar. El acceso manual por URL está estrictamente restringido.
              </p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-3.5 text-left">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-zinc-400">Nombre de Usuario</label>
                <input
                  required
                  type="text"
                  placeholder="ej. Juem"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-zinc-400">Contraseña Segura</label>
                <input
                  required
                  type="password"
                  placeholder="••••••••"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>

              {loginError && (
                <p className="text-xs text-red-500 text-center font-bold">❌ {loginError}</p>
              )}

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold tracking-wider uppercase mt-4 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Acceder al Panel Admin</span>
              </button>
            </form>

            <div className="pt-2">
              <button
                onClick={() => navigateToProductRoute("todos", "all")}
                className="text-xs font-bold text-slate-500 dark:text-zinc-500 hover:text-slate-800 dark:hover:text-zinc-300 underline cursor-pointer"
              >
                Volver a la Tienda Pública
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RENDER ADMIN DASHBOARD - PRIVATE CONTROL PANEL */}
      {activeTab === "admin" && authToken && (
        <div className="flex-grow flex flex-col md:flex-row min-h-0">
          
          {/* Left sidebar nav following Professional Polish theme instructions */}
          <aside className="w-full md:w-60 bg-zinc-900 text-zinc-100 flex flex-col shrink-0 border-r border-zinc-800">
            <nav className="p-4 space-y-1">
              <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-4 px-3">
                Gestión Operativa
              </div>

              <button
                onClick={() => navigateAdminSection("dashboard")}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-xs font-semibold tracking-wide transition-colors ${
                  adminSection === "dashboard"
                    ? "bg-indigo-600/20 text-indigo-400 border-l-2 border-indigo-500"
                    : "hover:bg-zinc-800 text-zinc-400 hover:text-white"
                }`}
              >
                <TrendingUp className="h-4 w-4" />
                <span>Dashboard de Negocio 📊</span>
              </button>
              
              <button
                onClick={() => navigateAdminSection("general")}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-xs font-semibold tracking-wide transition-colors ${
                  adminSection === "general"
                    ? "bg-indigo-600/20 text-indigo-400 border-l-2 border-indigo-500"
                    : "hover:bg-zinc-800 text-zinc-400 hover:text-white"
                }`}
              >
                <Palette className="h-4 w-4" />
                <span>Identidad de Marca🎨</span>
              </button>

              <button
                onClick={() => navigateAdminSection("banner")}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-xs font-semibold tracking-wide transition-colors ${
                  adminSection === "banner"
                    ? "bg-indigo-600/20 text-indigo-400 border-l-2 border-indigo-500"
                    : "hover:bg-zinc-800 text-zinc-400 hover:text-white"
                }`}
              >
                <Image className="h-4 w-4" />
                <span>Banners y Carrusel 📷</span>
              </button>

              <button
                onClick={() => navigateAdminSection("footer")}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-xs font-semibold tracking-wide transition-colors ${
                  adminSection === "footer"
                    ? "bg-indigo-600/20 text-indigo-400 border-l-2 border-indigo-500"
                    : "hover:bg-zinc-800 text-zinc-400 hover:text-white"
                }`}
              >
                <Layout className="h-4 w-4" />
                <span>Pie de Página (Footer) 👣</span>
              </button>

              <button
                onClick={() => navigateAdminSection("products")}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-xs font-semibold tracking-wide transition-colors ${
                  adminSection === "products"
                    ? "bg-indigo-600/20 text-indigo-400 border-l-2 border-indigo-500"
                    : "hover:bg-zinc-800 text-zinc-400 hover:text-white"
                }`}
              >
                <Grid className="h-4 w-4" />
                <span>Catálogo de Productos ({store.products.length})</span>
              </button>

              <button
                onClick={() => navigateAdminSection("stock")}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs font-semibold tracking-wide transition-all ${
                  adminSection === "stock"
                    ? "bg-indigo-600/20 text-indigo-400 border-l-2 border-indigo-500"
                    : "hover:bg-zinc-800 text-zinc-400 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Box className="h-4 w-4" />
                  <span>Gestión de Stock</span>
                </div>
                {totalStockAlerts > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                    outOfStockProducts.length > 0
                      ? "bg-red-500 text-white"
                      : "bg-amber-500 text-zinc-950"
                  }`}>
                    {totalStockAlerts}
                  </span>
                )}
              </button>

              <button
                onClick={() => navigateAdminSection("categories")}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-xs font-semibold tracking-wide transition-colors ${
                  adminSection === "categories"
                    ? "bg-indigo-600/20 text-indigo-400 border-l-2 border-indigo-500"
                    : "hover:bg-zinc-800 text-zinc-400 hover:text-white"
                }`}
              >
                <Sliders className="h-4 w-4" />
                <span>Modificar Categorías</span>
              </button>

              <button
                onClick={() => navigateAdminSection("promos")}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-xs font-semibold tracking-wide transition-colors ${
                  adminSection === "promos"
                    ? "bg-indigo-600/20 text-indigo-400 border-l-2 border-indigo-500"
                    : "hover:bg-zinc-800 text-zinc-400 hover:text-white"
                }`}
              >
                <Tag className="h-4 w-4" />
                <span>Cupones y Descuentos</span>
              </button>

              <button
                onClick={() => navigateAdminSection("security")}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-xs font-semibold tracking-wide transition-colors ${
                  adminSection === "security"
                    ? "bg-indigo-600/20 text-indigo-400 border-l-2 border-indigo-500"
                    : "hover:bg-zinc-800 text-zinc-400 hover:text-white"
                }`}
              >
                <Lock className="h-4 w-4" />
                <span>Seguridad de Acceso</span>
              </button>

              <div className="pt-8 text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-4 px-3">
                Soporte de Sistema
              </div>
              
              <div className="px-3 py-1 space-y-1">
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block"></span>
                  <span className="font-mono">User: Juem</span>
                </div>
                <div className="text-[10px] text-zinc-500 font-sans">
                  Nivel de Accesibilidad: Máxima (Admin Principal)
                </div>
              </div>
            </nav>

            <div className="mt-auto p-4 border-t border-zinc-800">
              <div className="p-3 bg-white/[0.03] rounded-lg border border-zinc-800">
                <p className="text-[10px] text-zinc-500 mb-1.5 flex items-center gap-1.5 justify-between">
                  <span>Espacio en DB</span>
                  <span className="text-[9px] font-semibold uppercase text-indigo-400 font-mono">Activa</span>
                </p>
                <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="w-1/4 h-full bg-blue-500"></div>
                </div>
                <p className="text-[10px] text-zinc-400 mt-2 font-mono flex items-center justify-between">
                  <span>14.5 KB / 1 GB</span>
                  <span className="text-[10px] text-zinc-500">PostgreSQL Cloud</span>
                </p>
              </div>
            </div>
          </aside>

          {/* Main admin Workspace workspace */}
          <main className="flex-1 flex flex-col p-6 gap-6 bg-slate-100 dark:bg-zinc-900 border-zinc-800 overflow-y-auto">
            
            {/* Header control summary */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-3 shrink-0">
              <div>
                <h2 className="text-2xl font-bold font-sans text-slate-900 dark:text-white">
                  {adminSection === "dashboard" && "Resumen de Métricas & Dashboard de Negocio"}
                  {adminSection === "general" && "Identidad de Marca, Tipografías & Colores"}
                  {adminSection === "banner" && "Control del Slider y Banners Principales"}
                  {adminSection === "footer" && "Configuración de Columnas del Pie de Página"}
                  {adminSection === "products" && "Catálogo General de Productos"}
                  {adminSection === "categories" && "Configuración de Categorías de Tienda"}
                  {adminSection === "promos" && "Promociones y Administrador de Cupones"}
                  {adminSection === "security" && "Seguridad y Control de Acceso"}
                  {adminSection === "stock" && "Control y Alertas de Stock Bajo"}
                </h2>
                <p className="text-slate-500 dark:text-zinc-400 text-xs">
                  Modifica los contenidos de tu tienda en tiempo real. Los cambios se sincronizarán directamente con tu base de datos central sin tocar código.
                </p>
              </div>

              {/* Instant action trigger */}
              {adminSection === "products" && !isNewProductMode && !editingProduct && (
                <button
                  onClick={() => {
                    setEditingProduct(null);
                    setNewProductErrors({});
                    setNewProduct({
                      name: "",
                      description: "",
                      price: undefined,
                      originalPrice: undefined,
                      category: (store.dbCategories || [])[0]?.nombre || store.categories[0] || "",
                      categoria_id: (store.dbCategories || [])[0]?.id || "",
                      subcategoria_id: "all",
                      imageUrl: "",
                      stock: 10,
                      featured: false
                    });
                    setIsNewProductMode(true);
                  }}
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center gap-1.5 text-xs shadow-md shadow-blue-500/10 cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Crea Nuevo Producto</span>
                </button>
              )}
            </div>

            {/* ERROR STATS BAR IF ANY */}
            {syncStatus === "error" && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <span>Error de comunicación. Haz click en Guardar Cambios para forzar sincronía.</span>
              </div>
            )}

            {/* DYNAMIC SECTIONS GRID */}
            {adminSection === "dashboard" ? (
              <DashboardGeneral
                store={store}
                navigateAdminSection={navigateAdminSection}
                setStockFilterTab={setStockFilterTab}
                setIsNewProductMode={setIsNewProductMode}
                setEditingProduct={(p) => setEditingProduct(p as any)}
              />
            ) : (
              <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* SECTION A: THE PRINCIPAL CONTROL FORM */}
              <div className="lg:col-span-7 space-y-4">
                
                {/* 1. GENERAL & BRANDING EDITOR */}
                {adminSection === "general" && (
                  <div className="bg-white dark:bg-zinc-950 p-5 rounded-xl border border-slate-200 dark:border-zinc-850 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 border-b border-zinc-800/10 dark:border-zinc-800 pb-3 mb-2">
                      <Palette className="h-4 w-4 theme-text-primary" />
                      <h3 className="font-bold text-sm text-slate-950 dark:text-zinc-150">Diseño & Textos de Tienda</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5">Nombre del eCommerce</label>
                        <input
                          type="text"
                          value={editingSettings.siteTitle}
                          onChange={(e) => setEditingSettings({ ...editingSettings, siteTitle: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5">WhatsApp Oficial (Teléfono código país completo)</label>
                        <input
                          type="text"
                          value={editingSettings.whatsappNumber}
                          onChange={(e) => setEditingSettings({ ...editingSettings, whatsappNumber: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white font-mono"
                          placeholder="p.ej. 5491123456789"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5">Descripción de Tienda / Eslogan</label>
                      <input
                        type="text"
                        value={editingSettings.siteSubtitle}
                        onChange={(e) => setEditingSettings({ ...editingSettings, siteSubtitle: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white"
                      />
                    </div>

                    {/* Logo Configurator inside store general settings */}
                    <div className="border border-slate-200 dark:border-zinc-800 rounded-xl p-4 bg-slate-50/50 dark:bg-zinc-900/30 space-y-3">
                      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-zinc-800 pb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                          Logo de la Web
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5">Tipo de Logo</label>
                          <select
                            value={editingSettings.logoType || "text"}
                            onChange={(e) => setEditingSettings({ ...editingSettings, logoType: e.target.value as 'text' | 'image' })}
                            className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white"
                          >
                            <option value="text">Texto / Iniciales (Por defecto)</option>
                            <option value="image">Imagen por URL (Personalizada)</option>
                          </select>
                        </div>

                        {editingSettings.logoType === "image" ? (
                          <div>
                            <label className="block text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5">URL de la Imagen del Logo</label>
                            <input
                              type="text"
                              value={editingSettings.logoImageUrl || ""}
                              onChange={(e) => setEditingSettings({ ...editingSettings, logoImageUrl: e.target.value })}
                              className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white font-mono"
                              placeholder="https://ejemplo.com/logo.png"
                            />
                          </div>
                        ) : (
                          <div>
                            <label className="block text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5">Letra / Icono (Máx 3 carac.)</label>
                            <input
                              type="text"
                              maxLength={3}
                              value={editingSettings.logoText || ""}
                              onChange={(e) => setEditingSettings({ ...editingSettings, logoText: e.target.value })}
                              className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white"
                              placeholder="J"
                            />
                          </div>
                        )}
                      </div>
                      
                      {/* Live Preview of logo in settings */}
                      <div className="flex items-center gap-3 p-2 bg-white dark:bg-zinc-950/45 border border-dashed border-slate-200 dark:border-zinc-800 rounded-lg">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vista Previa:</span>
                        <div className="flex items-center gap-2">
                          {editingSettings.logoType === "image" && editingSettings.logoImageUrl ? (
                            <img
                              src={editingSettings.logoImageUrl}
                              alt="Vista Previa Logo"
                              className="w-8 h-8 rounded-xl object-cover shadow-sm bg-zinc-950/25"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=100&q=80";
                              }}
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-8 h-8 theme-btn-primary rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm">
                              {editingSettings.logoText || "J"}
                            </div>
                          )}
                          <span className="font-bold text-xs text-slate-900 dark:text-zinc-200">
                            {editingSettings.siteTitle || "Tu Tienda"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                      <button
                        onClick={handleSaveSettings}
                        disabled={saving}
                        className="py-2.5 px-6 bg-blue-600 text-white rounded-lg font-semibold text-xs transition-all hover:bg-blue-700 hover:scale-[1.01] active:scale-[0.99] flex items-center gap-1.5 cursor-pointer shadow-md"
                      >
                        <Save className="h-4 w-4" />
                        <span>{saving ? "Guardando..." : "Guardar Personalización"}</span>
                      </button>
                    </div>
                  </div>
                )}

                {adminSection === "banner" && (
                  <div className="bg-white dark:bg-zinc-950 p-5 rounded-xl border border-slate-200 dark:border-zinc-850 shadow-sm space-y-4 animate-fade-in">
                    <div className="flex items-center gap-2 border-b border-zinc-800/10 dark:border-zinc-800 pb-3 mb-2">
                      <Image className="h-4 w-4 theme-text-primary" />
                      <h3 className="font-bold text-sm text-slate-950 dark:text-zinc-150 font-sans">Banners del Carrusel de Tienda</h3>
                    </div>

                    {/* Carousel Slides Manager in Admin Section */}
                    <div className="border border-slate-200 dark:border-zinc-800 rounded-xl p-4 bg-slate-50/50 dark:bg-zinc-900/30 space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-705 dark:text-zinc-300">
                          Imágenes y Textos del Carrusel (Slider)
                        </h4>
                        <span className="text-[10px] text-zinc-400">
                          {(editingSettings.heroSlides?.length || 3)} diapositivas activas
                        </span>
                      </div>

                      <div className="space-y-4">
                        {/* Loop through each slide for configuration */}
                        {((editingSettings.heroSlides && editingSettings.heroSlides.length > 0) 
                          ? editingSettings.heroSlides 
                          : [
                              {
                                id: "slide-1",
                                title: editingSettings.bannerTitle || "Colección Exclusiva de Primavera",
                                subtitle: editingSettings.bannerSubtitle || "Descubre las últimas tendencias con descuentos de hasta el 40%.",
                                imageUrl: editingSettings.bannerImageUrl || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=80"
                              },
                              {
                                id: "slide-2",
                                title: "Tendencias de Temporada",
                                subtitle: "Colecciones cuidadosamente seleccionadas para expresar tu estilo único.",
                                imageUrl: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1600&q=80"
                              },
                              {
                                id: "slide-3",
                                title: "Accesorios & Complementos",
                                subtitle: "Lentes, mochilas, relojes y detalles que transforman cualquier outfit.",
                                imageUrl: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1600&q=80"
                              }
                            ]
                        ).map((slide, idx) => {
                          // Helper handler updates editingSettings list inline
                          const updateSlideField = (field: "title" | "subtitle" | "imageUrl" | "buttonText" | "buttonLink", value: string) => {
                            const currentSlides = editingSettings.heroSlides && editingSettings.heroSlides.length > 0
                              ? [...editingSettings.heroSlides]
                              : [
                                  {
                                    id: "slide-1",
                                    title: editingSettings.bannerTitle || "Colección Exclusiva de Primavera",
                                    subtitle: editingSettings.bannerSubtitle || "Descubre las últimas tendencias con descuentos de hasta el 40%.",
                                    imageUrl: editingSettings.bannerImageUrl || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=80"
                                  },
                                  {
                                    id: "slide-2",
                                    title: "Tendencias de Temporada",
                                    subtitle: "Colecciones cuidadosamente seleccionadas para expresar tu estilo único.",
                                    imageUrl: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1600&q=80"
                                  },
                                  {
                                    id: "slide-3",
                                    title: "Accesorios & Complementos",
                                    subtitle: "Lentes, mochilas, relojes y detalles que transforman cualquier outfit.",
                                    imageUrl: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1600&q=80"
                                  }
                                ];

                            // Ensure slide exists in range
                            if(!currentSlides[idx]) {
                              currentSlides[idx] = { id: `slide-${Date.now()}`, title: "", subtitle: "", imageUrl: "" };
                            }
                            currentSlides[idx] = { ...currentSlides[idx], [field]: value };

                            // Also sync the first slide defaults to the old legacy root banner fields just in case
                            const nextSettings = { ...editingSettings, heroSlides: currentSlides };
                            if (idx === 0) {
                              if (field === "title") nextSettings.bannerTitle = value;
                              if (field === "subtitle") nextSettings.bannerSubtitle = value;
                              if (field === "imageUrl") nextSettings.bannerImageUrl = value;
                            }
                            setEditingSettings(nextSettings);
                          };

                          const removeSlide = () => {
                            const currentSlides = editingSettings.heroSlides && editingSettings.heroSlides.length > 0
                              ? [...editingSettings.heroSlides]
                              : [
                                  {
                                    id: "slide-1",
                                    title: editingSettings.bannerTitle || "Colección Exclusiva de Primavera",
                                    subtitle: editingSettings.bannerSubtitle || "Descubre las últimas tendencias con descuentos de hasta el 40%.",
                                    imageUrl: editingSettings.bannerImageUrl || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=80"
                                  },
                                  {
                                    id: "slide-2",
                                    title: "Tendencias de Temporada",
                                    subtitle: "Colecciones cuidadosamente seleccionadas para expresar tu estilo único.",
                                    imageUrl: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1600&q=80"
                                  },
                                  {
                                    id: "slide-3",
                                    title: "Accesorios & Complementos",
                                    subtitle: "Lentes, mochilas, relojes y detalles que transforman cualquier outfit.",
                                    imageUrl: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1600&q=80"
                                  }
                                ];
                            if (currentSlides.length <= 1) {
                              alert("Debes mantener al menos una diapositiva.");
                              return;
                            }
                            const filtered = currentSlides.filter((_, sIdx) => sIdx !== idx);
                            
                            const nextSettings = { ...editingSettings, heroSlides: filtered };
                            // Sync legacy if first was removed
                            if (filtered[0]) {
                              nextSettings.bannerTitle = filtered[0].title;
                              nextSettings.bannerSubtitle = filtered[0].subtitle;
                              nextSettings.bannerImageUrl = filtered[0].imageUrl;
                            }
                            setEditingSettings(nextSettings);
                          };

                          return (
                            <div key={slide.id || idx} className="p-3 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg space-y-3 relative shadow-inner">
                              <div className="flex items-center justify-between text-[11px] font-bold text-zinc-400">
                                <span>Diapositiva #{idx + 1}</span>
                                <button
                                  type="button"
                                  onClick={removeSlide}
                                  className="text-red-400 hover:text-red-500 transition-colors text-[10px] font-semibold flex items-center gap-1.5 cursor-pointer"
                                >
                                  <Trash2 className="h-3 w-3" />
                                  <span>Eliminar</span>
                                </button>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-[9px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Título de la Diapositiva</label>
                                  <input
                                    type="text"
                                    value={slide.title}
                                    onChange={(e) => updateSlideField("title", e.target.value)}
                                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded text-xs outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white"
                                    placeholder="ej: Ofertas Exclusivas de Invierno"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[9px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Subtítulo de la Diapositiva</label>
                                  <input
                                    type="text"
                                    value={slide.subtitle}
                                    onChange={(e) => updateSlideField("subtitle", e.target.value)}
                                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded text-xs outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white"
                                    placeholder="ej: Descuentos de hasta un 30% en toda la tienda"
                                  />
                                </div>
                              </div>

                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <label className="block text-[9px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                                    Imagen del Banner (URL o Subir)
                                  </label>
                                  <span className="text-[10px] text-[#5346ff] font-medium">
                                    Recomendado: 1920x800 píxeles
                                  </span>
                                </div>
                                
                                <div className="space-y-2">
                                  <div className="flex gap-2">
                                    <input
                                      type="text"
                                      value={slide.imageUrl}
                                      onChange={(e) => updateSlideField("imageUrl", e.target.value)}
                                      className="flex-1 px-2.5 py-1.5 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded text-xs outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white font-mono"
                                      placeholder="URL de la imagen (ej: https://images.unsplash.com/...)"
                                    />
                                    {slide.imageUrl && (
                                      <div className="relative group/mini duration-150 shrink-0">
                                        <img 
                                          src={slide.imageUrl} 
                                          alt="mini previsualizacion de slide" 
                                          className="h-8 w-16 object-cover rounded bg-zinc-800 border border-zinc-700/50"
                                          referrerPolicy="no-referrer"
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/mini:opacity-100 transition-opacity rounded flex items-center justify-center">
                                          <Eye 
                                            className="w-3 h-3 text-white cursor-pointer" 
                                            onClick={() => {
                                              window.open(slide.imageUrl, "_blank");
                                            }}
                                          />
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between p-2 rounded-lg bg-slate-100/60 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800/40">
                                    <div className="space-y-0.5 max-w-sm">
                                      <p className="text-[10px] font-semibold text-slate-700 dark:text-zinc-350">
                                        Subir directamente a Cloudinary:
                                      </p>
                                      <p className="text-[9px] text-slate-500 dark:text-zinc-450 leading-relaxed">
                                        Las fotos grandes de paisajes (16:9 o 21:9) lucen más nítidas e impactantes. Te aconsejamos usar imágenes optimizadas de aproximadamente <strong>1920 x 800 píxeles</strong>.
                                      </p>
                                    </div>
                                    
                                    <div className="shrink-0 w-full sm:w-auto flex items-center justify-end">
                                      {uploadingSlideIdx === idx ? (
                                        <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-medium py-1 px-2">
                                          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#5346ff]" />
                                          <span className="text-[10px] font-mono">Subiendo...</span>
                                        </div>
                                      ) : (
                                        <label className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-white font-medium text-[10px] cursor-pointer transition-colors shadow-sm select-none">
                                          <Upload className="w-3 h-3" />
                                          <span>Seleccionar Archivo</span>
                                          <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={async (e) => {
                                              if (e.target.files && e.target.files[0]) {
                                                const file = e.target.files[0];
                                                const formData = new FormData();
                                                formData.append("image", file);
                                                
                                                try {
                                                  setUploadingSlideIdx(idx);
                                                  const uploadRes = await fetch("/api/cloudinary/upload", {
                                                    method: "POST",
                                                    body: formData,
                                                  });
                                                  
                                                  const resText = await uploadRes.text();
                                                  let parsedData: any = null;
                                                  
                                                  if (resText.trim().startsWith("<!doctype") || resText.trim().startsWith("<html")) {
                                                    alert("El servidor de subidas no pudo procesar el archivo. Comprueba que tus ajustes de Cloudinary sean correctos.");
                                                    return;
                                                  }
                                                  
                                                  try {
                                                    parsedData = JSON.parse(resText);
                                                  } catch (pErr) {
                                                    console.error("Error al parsear respuesta JSON:", pErr);
                                                  }

                                                  if (uploadRes.ok && parsedData && parsedData.success && parsedData.url) {
                                                    updateSlideField("imageUrl", parsedData.url);
                                                  } else {
                                                    alert((parsedData && parsedData.message) || "Ocurrió un error al subir a Cloudinary.");
                                                  }
                                                } catch (err) {
                                                  console.error(err);
                                                  alert("Fallo al conectar con la API de Cloudinary.");
                                                } finally {
                                                  setUploadingSlideIdx(null);
                                                }
                                              }
                                            }}
                                          />
                                        </label>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Quick Unsplash selector for this slide */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-100 dark:border-zinc-850">
                                  <div>
                                    <label className="block text-[9px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
                                      Texto del Botón (Opcional)
                                    </label>
                                    <input
                                      type="text"
                                      value={slide.buttonText || ""}
                                      onChange={(e) => updateSlideField("buttonText", e.target.value)}
                                      className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded text-xs outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white"
                                      placeholder="ej: Explorar Catálogo (Por defecto)"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[9px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
                                      Direccionar Botón a (Enlace / Categoría / Producto)
                                    </label>
                                    <div className="flex gap-1.5 col-span-1">
                                      <select
                                        value={
                                          slide.buttonLink?.startsWith("category:") 
                                            ? "category" 
                                            : slide.buttonLink?.startsWith("subcategory:") 
                                              ? "subcategory" 
                                              : slide.buttonLink?.startsWith("product:") 
                                                ? "product" 
                                                : slide.buttonLink?.startsWith("http") 
                                                  ? "external" 
                                                  : "custom"
                                        }
                                        onChange={(e) => {
                                          const type = e.target.value;
                                          if (type === "category") {
                                            const firstCat = (store.dbCategories || [])[0]?.nombre || "todos";
                                            updateSlideField("buttonLink", `category:${firstCat}`);
                                          } else if (type === "subcategory") {
                                            const firstSub = (store.dbSubcategories || [])[0]?.id || "";
                                            updateSlideField("buttonLink", `subcategory:${firstSub}`);
                                          } else if (type === "product") {
                                            const firstProd = store.products[0]?.id || "";
                                            updateSlideField("buttonLink", `product:${firstProd}`);
                                          } else if (type === "external") {
                                            updateSlideField("buttonLink", "https://");
                                          } else {
                                            updateSlideField("buttonLink", "");
                                          }
                                        }}
                                        className="px-2 py-1.5 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                                      >
                                        <option value="custom">Manual / Ninguno</option>
                                        <option value="category">Categoría</option>
                                        <option value="subcategory">Subcategoría</option>
                                        <option value="product">Producto</option>
                                        <option value="external">Enlace Externo</option>
                                      </select>
                                      
                                      {slide.buttonLink?.startsWith("category:") ? (
                                        <select
                                          value={slide.buttonLink.replace("category:", "")}
                                          onChange={(e) => updateSlideField("buttonLink", `category:${e.target.value}`)}
                                          className="flex-1 px-2.5 py-1.5 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer animate-fade-in"
                                        >
                                          <option value="todos">Todos los Productos</option>
                                          {(store.dbCategories || []).map((cat) => (
                                            <option key={cat.id} value={cat.nombre}>
                                              {cat.nombre}
                                            </option>
                                          ))}
                                        </select>
                                      ) : slide.buttonLink?.startsWith("subcategory:") ? (
                                        <select
                                          value={slide.buttonLink.replace("subcategory:", "")}
                                          onChange={(e) => updateSlideField("buttonLink", `subcategory:${e.target.value}`)}
                                          className="flex-1 px-2.5 py-1.5 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer animate-fade-in"
                                        >
                                          {(store.dbSubcategories || []).map((sub) => (
                                            <option key={sub.id} value={sub.id}>
                                              {sub.nombre} ({ (store.dbCategories || []).find(c => c.id === sub.categoria_id)?.nombre || "Sin cat" })
                                            </option>
                                          ))}
                                        </select>
                                      ) : slide.buttonLink?.startsWith("product:") ? (
                                        <div className="flex-1 flex flex-col gap-1.5 animate-fade-in col-span-1">
                                          <div className="flex gap-1.5">
                                            <input
                                              type="text"
                                              value={bannerProductSearch}
                                              onChange={(e) => setBannerProductSearch(e.target.value)}
                                              placeholder="🔍 Buscar producto..."
                                              className="w-full px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200/60 dark:bg-zinc-850 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 rounded text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500"
                                            />
                                            {bannerProductSearch && (
                                              <button
                                                type="button"
                                                onClick={() => setBannerProductSearch("")}
                                                className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded text-[10px] font-bold"
                                              >
                                                Borrar
                                              </button>
                                            )}
                                          </div>
                                          
                                          <select
                                            value={slide.buttonLink.replace("product:", "")}
                                            onChange={(e) => updateSlideField("buttonLink", `product:${e.target.value}`)}
                                            className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                                          >
                                            <option value="">-- Seleccionar producto --</option>
                                            {store.products
                                              .filter(p => !bannerProductSearch || p.name.toLowerCase().includes(bannerProductSearch.toLowerCase()) || p.category?.toLowerCase().includes(bannerProductSearch.toLowerCase()))
                                              .map((p) => (
                                                <option key={p.id} value={p.id}>
                                                  {p.name} (${Number(p.price || 0).toFixed(2)})
                                                </option>
                                              ))}
                                          </select>
                                          
                                          <span className="text-[9px] text-zinc-400 italic">
                                            {store.products.filter(p => !bannerProductSearch || p.name.toLowerCase().includes(bannerProductSearch.toLowerCase()) || p.category?.toLowerCase().includes(bannerProductSearch.toLowerCase())).length} de {store.products.length} productos en lista
                                          </span>
                                        </div>
                                      ) : (
                                        <input
                                          type="text"
                                          value={slide.buttonLink || ""}
                                          onChange={(e) => updateSlideField("buttonLink", e.target.value)}
                                          className="flex-1 px-2.5 py-1.5 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded text-xs outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white font-mono"
                                          placeholder="ej: #catalog-view o URL completa"
                                        />
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {/* Button to append a brand new slide */}
                        <button
                          type="button"
                          onClick={() => {
                            const currentSlides = editingSettings.heroSlides && editingSettings.heroSlides.length > 0
                              ? [...editingSettings.heroSlides]
                              : [
                                  {
                                    id: "slide-1",
                                    title: editingSettings.bannerTitle || "Colección Exclusiva de Primavera",
                                    subtitle: editingSettings.bannerSubtitle || "Descubre las últimas tendencias con descuentos de hasta el 40%.",
                                    imageUrl: editingSettings.bannerImageUrl || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=80"
                                  },
                                  {
                                    id: "slide-2",
                                    title: "Tendencias de Temporada",
                                    subtitle: "Colecciones cuidadosamente seleccionadas para expresar tu estilo único.",
                                    imageUrl: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1600&q=80"
                                  },
                                  {
                                    id: "slide-3",
                                    title: "Accesorios & Complementos",
                                    subtitle: "Lentes, mochilas, relojes y detalles que transforman cualquier outfit.",
                                    imageUrl: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1600&q=80"
                                  }
                                ];
                            
                            const newSlideId = `slide-${Date.now()}`;
                            currentSlides.push({
                              id: newSlideId,
                              title: "Nueva Ofertas " + (currentSlides.length + 1),
                              subtitle: "Descripción rápida del beneficio, promoción o temporada.",
                              imageUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80"
                            });
                            setEditingSettings({ ...editingSettings, heroSlides: currentSlides });
                          }}
                          className="w-full py-2 border-2 border-dashed border-slate-300 dark:border-zinc-800 hover:border-blue-500/50 hover:bg-white dark:hover:bg-zinc-900/60 rounded-xl text-xs font-semibold text-slate-500 dark:text-zinc-400 hover:text-blue-500 dark:hover:text-amber-400 flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Añadir Nueva Diapositiva al Slider</span>
                        </button>
                      </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                      <button
                        onClick={handleSaveSettings}
                        disabled={saving}
                        className="py-2.5 px-6 bg-blue-600 text-white rounded-lg font-semibold text-xs transition-all hover:bg-blue-700 hover:scale-[1.01] active:scale-[0.99] flex items-center gap-1.5 cursor-pointer shadow-md"
                      >
                        <Save className="h-4 w-4" />
                        <span>{saving ? "Guardando..." : "Guardar Carrusel"}</span>
                      </button>
                    </div>
                  </div>
                )}

                {adminSection === "footer" && (
                  <div className="bg-white dark:bg-zinc-950 p-5 rounded-xl border border-slate-200 dark:border-zinc-850 shadow-sm space-y-4 animate-fade-in">
                    <div className="flex items-center gap-2 border-b border-zinc-800/10 dark:border-zinc-800 pb-3 mb-2">
                      <Layout className="h-4 w-4 theme-text-primary" />
                      <h3 className="font-bold text-sm text-slate-950 dark:text-zinc-150 font-sans">Información del Pie de Página (Footer)</h3>
                    </div>

                    {/* Footer Customizer Card */}
                    <div className="border border-slate-200 dark:border-zinc-800 rounded-xl p-4 bg-slate-50/55 dark:bg-zinc-900/40 space-y-4">
                      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-zinc-800 pb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-zinc-200">
                          Personalización del Pie de Página (Footer)
                        </span>
                      </div>

                      <div className="space-y-4">
                        {/* Columna 1 */}
                        <div className="p-3 bg-white dark:bg-zinc-950/70 border border-slate-150 dark:border-zinc-850 rounded-xl space-y-2.5">
                          <label className="block text-[10px] font-black text-blue-500 uppercase tracking-widest">Columna 1: Información de Envío o Compra</label>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="md:col-span-1">
                              <label className="block text-[9px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase mb-1">Título</label>
                              <input
                                type="text"
                                value={editingSettings.footerCol1Title || ""}
                                onChange={(e) => setEditingSettings({ ...editingSettings, footerCol1Title: e.target.value })}
                                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded text-xs outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white"
                                placeholder="🚀 Compra Personalizada"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-[9px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase mb-1">Descripción corta o Detalles</label>
                              <textarea
                                value={editingSettings.footerCol1Text || ""}
                                onChange={(e) => setEditingSettings({ ...editingSettings, footerCol1Text: e.target.value })}
                                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded text-xs outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white h-[68px] resize-none"
                                placeholder="Detalles de compra personalizada o envíos..."
                              />
                            </div>
                          </div>
                        </div>

                        {/* Columna 2 */}
                        <div className="p-3 bg-white dark:bg-zinc-950/70 border border-slate-150 dark:border-zinc-850 rounded-xl space-y-2.5">
                          <label className="block text-[10px] font-black text-emerald-500 uppercase tracking-widest">Columna 2: Calidad o Garantía</label>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="md:col-span-1">
                              <label className="block text-[9px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase mb-1">Título</label>
                              <input
                                type="text"
                                value={editingSettings.footerCol2Title || ""}
                                onChange={(e) => setEditingSettings({ ...editingSettings, footerCol2Title: e.target.value })}
                                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded text-xs outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white"
                                placeholder="🌟 Calidad Asegurada"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-[9px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase mb-1">Descripción corta o Políticas</label>
                              <textarea
                                value={editingSettings.footerCol2Text || ""}
                                onChange={(e) => setEditingSettings({ ...editingSettings, footerCol2Text: e.target.value })}
                                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded text-xs outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white h-[68px] resize-none"
                                placeholder="Políticas de cambio de talle, calidad..."
                              />
                            </div>
                          </div>
                        </div>

                        {/* Columna 3 */}
                        <div className="p-3 bg-white dark:bg-zinc-950/70 border border-slate-150 dark:border-zinc-850 rounded-xl space-y-2.5">
                          <label className="block text-[10px] font-black text-pink-500 uppercase tracking-widest">Columna 3: Información de Contacto / Soporte</label>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="md:col-span-1">
                              <label className="block text-[9px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase mb-1">Título</label>
                              <input
                                type="text"
                                value={editingSettings.footerCol3Title || ""}
                                onChange={(e) => setEditingSettings({ ...editingSettings, footerCol3Title: e.target.value })}
                                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded text-xs outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white"
                                placeholder="📞 Soporte Directo"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-[9px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase mb-1">Descripción corta o Canales</label>
                              <textarea
                                value={editingSettings.footerCol3Text || ""}
                                onChange={(e) => setEditingSettings({ ...editingSettings, footerCol3Text: e.target.value })}
                                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded text-xs outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white h-[68px] resize-none"
                                placeholder="Canales de soporte directo por WhatsApp..."
                              />
                            </div>
                          </div>
                        </div>

                        {/* Copyright */}
                        <div className="p-3 bg-white dark:bg-zinc-950/70 border border-slate-150 dark:border-zinc-850 rounded-xl">
                          <label className="block text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5">Texto del Copyright (Derechos Reservados)</label>
                          <input
                            type="text"
                            value={editingSettings.footerCopyright || ""}
                            onChange={(e) => setEditingSettings({ ...editingSettings, footerCopyright: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded text-xs outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white"
                            placeholder="Desarrollado con tecnología de punta responsive. Reservados todos los derechos."
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                      <button
                        onClick={handleSaveSettings}
                        disabled={saving}
                        className="py-2.5 px-6 bg-blue-600 text-white rounded-lg font-semibold text-xs transition-colors hover:bg-blue-700 hover:scale-[1.01] active:scale-[0.99] flex items-center gap-1.5 cursor-pointer shadow-md"
                      >
                        <Save className="h-4 w-4" />
                        <span>{saving ? "Guardando..." : "Guardar Pie de Página"}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Colors section remains combined with general branding */}
                {adminSection === "general" && (
                  <div className="bg-white dark:bg-zinc-950 p-5 rounded-xl border border-slate-200 dark:border-zinc-850 shadow-sm space-y-4 animate-fade-in mt-4">
                    <div className="flex items-center gap-2 border-b border-zinc-800/10 dark:border-zinc-800 pb-3 mb-2">
                      <Palette className="h-4 w-4 theme-text-primary" />
                      <h3 className="font-bold text-sm text-slate-950 dark:text-zinc-150 font-sans">Paleta de Colores de Tienda y Tematización</h3>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5">Color Primario</label>
                        <div className="flex gap-1.5">
                          <input
                            type="color"
                            value={editingSettings.primaryColor}
                            onChange={(e) => setEditingSettings({ ...editingSettings, primaryColor: e.target.value })}
                            className="h-8 w-8 rounded cursor-pointer border-0 bg-transparent"
                          />
                          <input
                            type="text"
                            value={editingSettings.primaryColor}
                            onChange={(e) => setEditingSettings({ ...editingSettings, primaryColor: e.target.value })}
                            className="w-full px-2 py-1 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded text-xs font-mono text-slate-900 dark:text-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5">Color Acento</label>
                        <div className="flex gap-1.5">
                          <input
                            type="color"
                            value={editingSettings.accentColor}
                            onChange={(e) => setEditingSettings({ ...editingSettings, accentColor: e.target.value })}
                            className="h-8 w-8 rounded cursor-pointer border-0 bg-transparent"
                          />
                          <input
                            type="text"
                            value={editingSettings.accentColor}
                            onChange={(e) => setEditingSettings({ ...editingSettings, accentColor: e.target.value })}
                            className="w-full px-2 py-1 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded text-xs font-mono text-slate-900 dark:text-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5">Tema Predeterminado</label>
                        <select
                          value={editingSettings.themeMode}
                          onChange={(e) => setEditingSettings({ ...editingSettings, themeMode: e.target.value as 'dark' | 'light' })}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs outline-none text-slate-900 dark:text-white"
                        >
                          <option value="dark">Immersive Dark Mode</option>
                          <option value="light">Clean Light Mode</option>
                        </select>
                      </div>
                    </div>

                    {/* Preloaded visual default themes for fast customization */}
                    <div className="border border-slate-150 dark:border-zinc-850 bg-slate-50/50 dark:bg-zinc-900/40 p-4 rounded-xl space-y-3">
                      <div className="flex items-center gap-1.5 text-slate-700 dark:text-zinc-300">
                        <Sparkles className="h-3.5 w-3.5 text-blue-500" />
                        <span className="text-[10px] font-extrabold uppercase tracking-widest">Temas Predeterminados (Haz click para aplicar)</span>
                      </div>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {THEME_PRESETS.map((preset) => {
                          const isSelected = 
                            editingSettings.primaryColor.toLowerCase() === preset.primaryColor.toLowerCase() &&
                            editingSettings.accentColor.toLowerCase() === preset.accentColor.toLowerCase() &&
                            editingSettings.themeMode === preset.themeMode;
                          
                          return (
                            <button
                              key={preset.name}
                              type="button"
                              onClick={() => {
                                setEditingSettings({
                                  ...editingSettings,
                                  primaryColor: preset.primaryColor,
                                  accentColor: preset.accentColor,
                                  themeMode: preset.themeMode
                                });
                                showAdminToast(`Tema "${preset.name}" seleccionado temporalmente.`, "success");
                              }}
                              className={`p-2 border rounded-xl text-left transition cursor-pointer flex flex-col gap-1.5 relative overflow-hidden group ${
                                isSelected 
                                  ? "bg-white dark:bg-zinc-900 border-indigo-500 shadow-md ring-1 ring-indigo-500/30" 
                                  : "bg-white/80 dark:bg-zinc-900/20 border-slate-200 dark:border-zinc-850 hover:bg-white dark:hover:bg-zinc-900/60 hover:border-zinc-400 dark:hover:border-zinc-750"
                              }`}
                            >
                              <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-1">
                                  <span className="w-2.5 h-2.5 rounded-full shrink-0 border border-black/10" style={{ backgroundColor: preset.primaryColor }}></span>
                                  <span className="w-2.5 h-2.5 rounded-full shrink-0 border border-black/10" style={{ backgroundColor: preset.accentColor }}></span>
                                </div>
                                <span className={`text-[7px] px-1 py-0.2 rounded font-extrabold tracking-wider uppercase ${
                                  preset.themeMode === 'dark' 
                                    ? 'bg-zinc-850 text-zinc-400 border border-zinc-800' 
                                    : 'bg-zinc-100 text-zinc-600 border border-slate-200'
                                }`}>
                                  {preset.themeMode === 'dark' ? "Oscuro" : "Claro"}
                                </span>
                              </div>
                              <span className="text-[10px] font-bold text-slate-800 dark:text-zinc-200 truncate group-hover:text-blue-500 transition-colors">
                                {preset.name}
                              </span>
                              {isSelected && (
                                <div className="absolute top-0 right-0 w-3 h-3 bg-indigo-500 rounded-bl-lg flex items-center justify-center">
                                  <span className="text-[6px] text-white font-extrabold">✓</span>
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                      <button
                        onClick={handleSaveSettings}
                        disabled={saving}
                        className="py-2.5 px-6 bg-blue-600 text-white rounded-lg font-semibold text-xs transition-all hover:bg-blue-700 hover:scale-[1.01] active:scale-[0.99] flex items-center gap-1.5 cursor-pointer shadow-md"
                      >
                        <Save className="h-4 w-4" />
                        <span>{saving ? "Guardando..." : "Guardar Personalización"}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. CHOOSE CAT LIST FOR PRODUCTS EDITOR */}
                {adminSection === "products" && !isNewProductMode && !editingProduct && (
                  <div className="space-y-4">
                    
                    {/* Catalog management header & metrics */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-white dark:bg-zinc-950 p-4 rounded-xl border border-slate-200 dark:border-zinc-850 shadow-sm text-center">
                        <span className="text-[10px] font-extrabold text-zinc-500 dark:text-zinc-400 uppercase">Total Productos</span>
                        <p className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">{store.products.length}</p>
                      </div>
                      <div className="bg-white dark:bg-zinc-950 p-4 rounded-xl border border-slate-200 dark:border-zinc-850 shadow-sm text-center">
                        <span className="text-[10px] font-extrabold text-zinc-500 dark:text-zinc-400 uppercase">Sin Stock</span>
                        <p className="text-xl font-bold font-mono text-red-500 mt-1">
                          {store.products.filter(p => p.stock <= 0).length}
                        </p>
                      </div>
                      <div className="bg-white dark:bg-zinc-950 p-4 rounded-xl border border-slate-200 dark:border-zinc-850 shadow-sm text-center">
                        <span className="text-[10px] font-extrabold text-zinc-500 dark:text-zinc-400 uppercase">Destacados</span>
                        <p className="text-xl font-bold font-mono text-yellow-500 mt-1">
                          {store.products.filter(p => p.featured).length}
                        </p>
                      </div>
                    </div>

                    {/* Products Grid list detail for editor quick action */}
                    <div className="bg-white dark:bg-zinc-950 rounded-xl border border-slate-200 dark:border-zinc-850 shadow-sm overflow-hidden">
                      <div className="p-4 border-b border-slate-100 dark:border-zinc-850 flex items-center justify-between">
                        <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">Listado de Artículos</h4>
                        <span className="text-[10px] font-mono text-zinc-400">Total: {store.products.length} productos</span>
                      </div>

                      <div className="divide-y divide-slate-100 dark:divide-zinc-850">
                        {store.products.map((p) => (
                          <div key={p.id} className="p-4 flex gap-4 items-center justify-between hover:bg-slate-50 dark:hover:bg-zinc-900/40 transition">
                            <img
                              src={p.imageUrl || "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80"}
                              alt={p.name}
                              className="h-10 w-10 rounded-lg object-cover bg-zinc-800"
                            />
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h5 className="font-semibold text-xs truncate text-slate-900 dark:text-zinc-200">{p.name}</h5>
                                {p.paused && (
                                  <span className="bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded text-[9px] font-extrabold uppercase px-1.5 py-0.5 tracking-wider font-mono">
                                    Pausado
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5 text-[10px] text-zinc-400">
                                <span className="bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-400">{p.category}</span>
                                {p.categorias_adicionales && p.categorias_adicionales.map(catId => {
                                  const name = (store.dbCategories || []).find(c => c.id === catId)?.nombre;
                                  if (!name) return null;
                                  return (
                                    <span key={catId} className="bg-[#5346ff]/10 text-[#5346ff] border border-[#5346ff]/20 px-1.5 py-0.5 rounded">
                                      + {name}
                                    </span>
                                  );
                                })}
                                {p.subcategorias_adicionales && p.subcategorias_adicionales.map(subId => {
                                  const name = (store.dbSubcategories || []).find(s => s.id === subId)?.nombre;
                                  if (!name) return null;
                                  return (
                                    <span key={subId} className="bg-teal-550/10 text-teal-605 border border-teal-500/25 px-1.5 py-0.5 rounded dark:bg-teal-500/10 dark:text-teal-400 dark:border-teal-500/25">
                                      + {name}
                                    </span>
                                  );
                                })}
                                <span>PVP: <strong>${p.price.toFixed(2)}</strong></span>
                                <span>Stock: <strong className={p.stock === 0 ? "text-red-400" : "text-emerald-400"}>{p.stock} u</strong></span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleTogglePause(p.id)}
                                className={`p-1.5 rounded-lg transition cursor-pointer ${
                                  p.paused 
                                    ? "bg-amber-500/10 hover:bg-amber-500 hover:text-white text-amber-500" 
                                    : "bg-zinc-800/80 hover:bg-zinc-700 hover:text-white text-zinc-450"
                                }`}
                                title={p.paused ? "Reanudar (Mostrar en la web)" : "Pausar (Ocultar en la web)"}
                              >
                                {p.paused ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                              </button>
                              <button
                                onClick={() => setEditingProduct(p)}
                                className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 hover:text-white text-zinc-300 transition cursor-pointer"
                                title="Editar"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(p.id)}
                                className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500 hover:text-white text-red-400 transition cursor-pointer"
                                title="Eliminar"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. NEW PRODUCT FORM DISPLAY */}
                {adminSection === "products" && isNewProductMode && (
                  <form onSubmit={handleCreateProduct} className="bg-white dark:bg-zinc-950 p-5 rounded-xl border border-slate-200 dark:border-zinc-850 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-850 pb-3 mb-2">
                      <div className="flex items-center gap-2">
                        <Plus className="h-4 w-4 text-emerald-400" />
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white">Nuevo Artículo de Catálogo</h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsNewProductMode(false)}
                        className="text-xs text-zinc-400 hover:text-white underline"
                      >
                        Cancelar
                      </button>
                    </div>

                    {/* Global Form Validation Info Banner */}
                    {Object.keys(newProductErrors).length > 0 && (
                      <div className="p-3 bg-red-100 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-lg text-red-700 dark:text-red-400 text-xs font-semibold flex items-center gap-2">
                        <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse shrink-0"></span>
                        <span>Por favor corrige los campos marcados en rojo antes de guardar el artículo.</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5 flex items-center justify-between">
                          <span>Nombre del Producto *</span>
                          {newProductErrors.name && <span className="text-red-500 text-[9px] font-semibold lowercase">obligatorio</span>}
                        </label>
                        <input
                          type="text"
                          value={newProduct.name || ""}
                          onChange={(e) => {
                            setNewProduct({ ...newProduct, name: e.target.value });
                            if (newProductErrors.name) {
                              setNewProductErrors(prev => {
                                const copy = { ...prev };
                                delete copy.name;
                                return copy;
                              });
                            }
                          }}
                          className={`w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900 border rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white transition-all ${
                            newProductErrors.name 
                              ? "border-red-500 dark:border-red-650 ring-1 ring-red-500/30" 
                              : "border-slate-200 dark:border-zinc-800"
                          }`}
                          placeholder="p.ej. Auriculares inalámbricos HiFi"
                        />
                        {newProductErrors.name && (
                          <p className="text-[10px] text-red-505 dark:text-red-400 mt-1 font-semibold flex items-center gap-1">
                            <span>⚠</span> {newProductErrors.name}
                          </p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5 flex items-center justify-between">
                          <span>Categoría Principal *</span>
                          {newProductErrors.category && <span className="text-red-500 text-[9px] font-semibold lowercase">obligatoria</span>}
                        </label>
                        <select
                          value={newProduct.categoria_id || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            const match = (store.dbCategories || []).find(c => c.id === val);
                            const isCategory3D = !!match && (
                              match.nombre.toLowerCase().includes("3d") ||
                              match.nombre.toLowerCase().includes("impresión") ||
                              match.nombre.toLowerCase().includes("impresion") ||
                              match.nombre.toLowerCase().includes("impreción") ||
                              match.nombre.toLowerCase().includes("imprecion")
                            );
                            const currentSizes = newProduct.sizes || [];
                            const needsDefaultMaterials = isCategory3D && (currentSizes.length === 0 || currentSizes.includes("S") || currentSizes.includes("M") || currentSizes.includes("L") || currentSizes.includes("Único"));
                            setNewProduct({
                              ...newProduct,
                              categoria_id: val,
                              category: match ? match.nombre : "",
                              subcategoria_id: "all", // reset subcategory on parent change
                              is3D: isCategory3D ? true : newProduct.is3D,
                              hoursPerUnit: isCategory3D ? (newProduct.hoursPerUnit || 1) : newProduct.hoursPerUnit,
                              sizes: needsDefaultMaterials ? ["PLA", "PETG", "ABS", "TPU"] : currentSizes
                            });
                            if (newProductErrors.category) {
                              setNewProductErrors(prev => {
                                const copy = { ...prev };
                                delete copy.category;
                                return copy;
                              });
                            }
                          }}
                          className={`w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900 border rounded-lg text-xs outline-none text-slate-900 dark:text-white transition-all ${
                            newProductErrors.category
                              ? "border-red-500 dark:border-red-650 ring-1 ring-red-500/30"
                              : "border-slate-200 dark:border-zinc-800"
                          }`}
                        >
                          <option value="">-- Elige categoría --</option>
                          {(store.dbCategories || [])
                            .sort((a, b) => (a.orden || 0)  - (b.orden || 0))
                            .map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.nombre} {c.active === false ? " (Inactiva)" : ""}
                              </option>
                            ))}
                        </select>
                        {newProductErrors.category && (
                          <p className="text-[10px] text-red-505 dark:text-red-400 mt-1 font-semibold flex items-center gap-1">
                            <span>⚠</span> {newProductErrors.category}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5 flex items-center justify-between">
                          <span>Subcategoría Relacionada</span>
                        </label>
                        <select
                          value={newProduct.subcategoria_id || "all"}
                          onChange={(e) => setNewProduct({ ...newProduct, subcategoria_id: e.target.value })}
                          disabled={!newProduct.categoria_id}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs outline-none text-slate-900 dark:text-white disabled:opacity-50 transition-all font-semibold"
                        >
                          <option value="all">Sin subcategoría / General</option>
                          {(store.dbSubcategories || [])
                            .filter(s => s.categoria_id === newProduct.categoria_id)
                            .map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.nombre} {s.active === false ? " (Inactiva)" : ""}
                              </option>
                            ))}
                        </select>
                        {!newProduct.categoria_id && (
                          <p className="text-[9px] text-zinc-500 mt-1">Selecciona primero una categoría principal.</p>
                        )}
                      </div>
                    </div>

                    {/* Categorías secundarias adicionales para Nuevo Producto */}
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/60">
                      <label className="block text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5">
                        Categorías Adicionales / Secundarias <span className="text-zinc-400 dark:text-zinc-500 font-normal lowercase">(los artículos aparecerán en todas las categorías marcadas)</span>
                      </label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {(store.dbCategories || [])
                          .sort((a,b) => (a.orden || 0) - (b.orden || 0))
                          .filter(c => c.id !== newProduct.categoria_id)
                          .map((c) => {
                            const isChecked = !!(newProduct.categorias_adicionales && newProduct.categorias_adicionales.includes(c.id));
                            return (
                              <button
                                type="button"
                                key={c.id}
                                onClick={() => {
                                  const list = newProduct.categorias_adicionales || [];
                                  const updated = list.includes(c.id)
                                    ? list.filter(id => id !== c.id)
                                    : [...list, c.id];
                                  setNewProduct({
                                    ...newProduct,
                                    categorias_adicionales: updated
                                  });
                                }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer select-none active:scale-95 ${
                                  isChecked
                                    ? "bg-[#5346ff]/10 text-[#5346ff] border-[#5346ff]/40 dark:bg-[#5346ff]/20 dark:text-[#9086ff] dark:border-[#5346ff]/60"
                                    : "bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-850 hover:bg-slate-100 dark:hover:bg-zinc-850"
                                }`}
                              >
                                <span>{c.nombre}</span>
                                {isChecked && <span className="text-[#5346ff] dark:text-[#9086ff]">✓</span>}
                              </button>
                            );
                          })}
                        {(store.dbCategories || []).filter(c => c.id !== newProduct.categoria_id).length === 0 && (
                          <span className="text-[10px] text-zinc-400 italic">No hay otras categorías creadas para seleccionar.</span>
                        )}
                      </div>
                    </div>

                    {/* Subcategorías secundarias adicionales para Nuevo Producto */}
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/60">
                      <label className="block text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5 flex items-center justify-between">
                        <span>Subcategorías Adicionales / Secundarias</span>
                        <span className="text-zinc-400 dark:text-zinc-500 font-normal lowercase">(haz clic para desplegar cada menú y marcar)</span>
                      </label>
                      <div className="space-y-2 mt-2">
                        {(store.dbCategories || [])
                          .sort((a,b) => (a.orden || 0) - (b.orden || 0))
                          .map((cat) => {
                            // Find subcategories belonging to this category
                            const subs = (store.dbSubcategories || []).filter(
                              s => s.categoria_id === cat.id && s.id !== newProduct.subcategoria_id
                            );
                            if (subs.length === 0) return null;

                            const activeSubCount = subs.filter(
                              s => !!(newProduct.subcategorias_adicionales && newProduct.subcategorias_adicionales.includes(s.id))
                            ).length;
                            
                            return (
                              <details key={cat.id} className="group border border-slate-200/50 dark:border-zinc-800/50 rounded-lg bg-white dark:bg-zinc-950/40 overflow-hidden" open={activeSubCount > 0}>
                                <summary className="flex items-center justify-between px-3 py-2 text-[11px] text-slate-700 dark:text-zinc-300 font-extrabold cursor-pointer select-none hover:bg-slate-100/50 dark:hover:bg-zinc-900/50 duration-150 list-none [&::-webkit-details-marker]:hidden">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[9px] text-slate-400 dark:text-zinc-500 transition-transform duration-200 group-open:rotate-90">▶</span>
                                    <span className="uppercase text-[10px] tracking-wider font-mono">{cat.nombre}</span>
                                  </div>
                                  {activeSubCount > 0 && (
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-[#5346ff]/10 text-[#5346ff] dark:bg-[#5346ff]/20 dark:text-[#9086ff]">
                                      {activeSubCount} {activeSubCount === 1 ? "seleccionada" : "seleccionadas"}
                                    </span>
                                  )}
                                </summary>
                                <div className="p-2.5 border-t border-slate-100 dark:border-zinc-800/30 bg-slate-50/40 dark:bg-zinc-950/20 flex flex-wrap gap-1.5">
                                  {subs.map((s) => {
                                    const isChecked = !!(newProduct.subcategorias_adicionales && newProduct.subcategorias_adicionales.includes(s.id));
                                    return (
                                      <button
                                        type="button"
                                        key={s.id}
                                        onClick={() => {
                                          const list = newProduct.subcategorias_adicionales || [];
                                          const updated = list.includes(s.id)
                                            ? list.filter(id => id !== s.id)
                                            : [...list, s.id];
                                          setNewProduct({
                                            ...newProduct,
                                            subcategorias_adicionales: updated
                                          });
                                        }}
                                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 border transition-all cursor-pointer select-none active:scale-95 ${
                                          isChecked
                                            ? "bg-[#5346ff]/10 text-[#5346ff] border-[#5346ff]/35 dark:bg-[#5346ff]/20 dark:text-[#9086ff] dark:border-[#5346ff]/50"
                                            : "bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-850 hover:bg-slate-100 dark:hover:bg-zinc-850"
                                        }`}
                                      >
                                        <span>{s.nombre}</span>
                                        {isChecked && <span className="text-[#5346ff] dark:text-[#9086ff]">✓</span>}
                                      </button>
                                    );
                                  })}
                                </div>
                              </details>
                            );
                          })}
                        {!(store.dbSubcategories && store.dbSubcategories.length > 0) && (
                          <span className="text-[10px] text-zinc-400 italic">No hay subcategorías registradas en la tienda para seleccionar.</span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5">Precio de Lista / Antes</label>
                        <input
                          type="number"
                          step="0.01"
                          value={newProduct.originalPrice === undefined ? "" : newProduct.originalPrice}
                          onChange={(e) => {
                            const val = e.target.value === "" ? undefined : Number(e.target.value);
                            setNewProduct({ ...newProduct, originalPrice: val });
                          }}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white font-mono"
                          placeholder="ej. 99.99"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5">Descuento (%)</label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            max="99"
                            value={
                              newProduct.originalPrice && newProduct.price && newProduct.originalPrice > newProduct.price
                                ? Math.round(((newProduct.originalPrice - newProduct.price) / newProduct.originalPrice) * 100)
                                : ""
                            }
                            onChange={(e) => {
                              const pct = e.target.value === "" ? 0 : Number(e.target.value);
                              if (pct >= 0 && pct < 100) {
                                if (newProduct.originalPrice) {
                                  const computedPrice = Number((newProduct.originalPrice * (1 - pct / 100)).toFixed(2));
                                  setNewProduct({ ...newProduct, price: computedPrice });
                                } else if (newProduct.price) {
                                  const computedOriginal = Number((newProduct.price / (1 - pct / 100)).toFixed(2));
                                  setNewProduct({ ...newProduct, originalPrice: computedOriginal });
                                }
                              }
                            }}
                            className="w-full px-3 py-2 pr-8 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white font-mono font-bold text-indigo-500 dark:text-indigo-400"
                            placeholder="Calculado"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">%</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5 flex items-center justify-between">
                          <span>Precio de Venta ($) *</span>
                          {newProductErrors.price && <span className="text-red-500 text-[9px] font-semibold lowercase">inválido</span>}
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={newProduct.price === undefined ? "" : newProduct.price}
                          onChange={(e) => {
                            const val = e.target.value === "" ? undefined : Number(e.target.value);
                            setNewProduct({ ...newProduct, price: val });
                            if (newProductErrors.price) {
                              setNewProductErrors(prev => {
                                const copy = { ...prev };
                                delete copy.price;
                                return copy;
                              });
                            }
                          }}
                          className={`w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900 border rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white transition-all font-mono ${
                            newProductErrors.price
                              ? "border-red-500 dark:border-red-650 ring-1 ring-red-500/30"
                              : "border-slate-200 dark:border-zinc-800"
                          }`}
                          placeholder="69.99"
                        />
                        {newProductErrors.price && (
                          <p className="text-[10px] text-red-550 dark:text-red-400 mt-1 font-semibold flex items-center gap-1">
                            <span>⚠</span> {newProductErrors.price}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5 flex items-center justify-between">
                          <span>Stock Físico Real *</span>
                          {newProductErrors.stock && <span className="text-red-500 text-[9px] font-semibold lowercase">inválido</span>}
                        </label>
                        <input
                          type="number"
                          value={newProduct.stock === undefined ? "" : newProduct.stock}
                          onChange={(e) => {
                            const val = e.target.value === "" ? undefined : Number(e.target.value);
                            setNewProduct({ ...newProduct, stock: val });
                            if (newProductErrors.stock) {
                              setNewProductErrors(prev => {
                                const copy = { ...prev };
                                delete copy.stock;
                                return copy;
                              });
                            }
                          }}
                          className={`w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900 border rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white transition-all font-mono ${
                            newProductErrors.stock
                              ? "border-red-500 dark:border-red-650 ring-1 ring-red-500/30"
                              : "border-slate-200 dark:border-zinc-800"
                          }`}
                          placeholder="15"
                        />
                        {newProductErrors.stock && (
                          <p className="text-[10px] text-red-550 dark:text-red-400 mt-1 font-semibold flex items-center gap-1">
                            <span>⚠</span> {newProductErrors.stock}
                          </p>
                        )}
                      </div>
                    </div>

                    <ImageGalleryEditor
                      images={[newProduct.imageUrl || "", ...(newProduct.imagenes || [])].filter(Boolean)}
                      onChange={(updatedImages) => {
                        setNewProduct({
                          ...newProduct,
                          imageUrl: updatedImages[0] || "",
                          imagenes: updatedImages.slice(1)
                        });
                      }}
                      isThemeDark={store.settings.themeMode === "dark"}
                    />

                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5">Descripción Detallada</label>
                      <textarea
                        value={newProduct.description}
                        onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white resize-none"
                        placeholder="Escribe detalles del producto..."
                      />
                    </div>

                    {/* Talles y Colores Configuration Panel */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border border-indigo-500/10 p-4 rounded-xl bg-slate-50/50 dark:bg-zinc-900/40">
                      <div>
                        {newProduct.is3D || is3DProduct(newProduct as Product) ? (
                          <div>
                            <label className="block text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-1">
                              Materiales 3D Disponibles
                            </label>
                            <input
                              type="text"
                              value={(newProduct.sizes || []).join(", ")}
                              onChange={(e) => {
                                const arr = e.target.value.split(",").map(s => s.trim()).filter(Boolean);
                                setNewProduct({ ...newProduct, sizes: arr });
                              }}
                              placeholder="p.ej. PLA, PETG, ABS, TPU (Separados por comas)"
                              className="w-full px-3 py-2 bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-850 rounded-lg text-xs outline-none text-slate-900 dark:text-white mb-2"
                            />
                            <div className="flex flex-wrap gap-1.5">
                              <span className="text-[9px] text-zinc-500 mr-1 self-center">Preajustes rápidos:</span>
                              {["PLA", "PETG", "ABS", "TPU"].map((mat) => {
                                const isSelected = (newProduct.sizes || []).includes(mat);
                                return (
                                  <button
                                    type="button"
                                    key={mat}
                                    onClick={() => {
                                      const current = newProduct.sizes || [];
                                      const next = current.includes(mat)
                                        ? current.filter(x => x !== mat)
                                        : [...current, mat];
                                      setNewProduct({ ...newProduct, sizes: next });
                                    }}
                                    className={`text-[9.5px] font-mono px-2 py-0.5 rounded cursor-pointer transition-all ${
                                      isSelected 
                                        ? "bg-indigo-600 text-white font-bold" 
                                        : "bg-slate-200 hover:bg-slate-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
                                    }`}
                                  >
                                    {mat}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <label className="block text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-1">Talles / Tamaños Disponibles</label>
                            <input
                              type="text"
                              value={(newProduct.sizes || []).join(", ")}
                              onChange={(e) => {
                                const arr = e.target.value.split(",").map(s => s.trim()).filter(Boolean);
                                setNewProduct({ ...newProduct, sizes: arr });
                              }}
                              placeholder="p.ej. S, M, L, XL (Separados por comas)"
                              className="w-full px-3 py-2 bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-850 rounded-lg text-xs outline-none text-slate-900 dark:text-white mb-2"
                            />
                            <div className="flex flex-wrap gap-1.5">
                              <span className="text-[9px] text-zinc-500 mr-1 self-center">Preajustes rápidos:</span>
                              {["S", "M", "L", "XL", "XXL", "Único"].map((sz) => {
                                const isSelected = (newProduct.sizes || []).includes(sz);
                                return (
                                  <button
                                    type="button"
                                    key={sz}
                                    onClick={() => {
                                      const current = newProduct.sizes || [];
                                      const next = current.includes(sz)
                                        ? current.filter(x => x !== sz)
                                        : [...current, sz];
                                      setNewProduct({ ...newProduct, sizes: next });
                                    }}
                                    className={`text-[9.5px] font-mono px-2 py-0.5 rounded cursor-pointer transition-all ${
                                      isSelected 
                                        ? "bg-indigo-600 text-white font-bold" 
                                        : "bg-slate-200 hover:bg-slate-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
                                    }`}
                                  >
                                    {sz}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-1">Colores Disponibles</label>
                        <input
                          type="text"
                          value={(newProduct.colors || []).join(", ")}
                          onChange={(e) => {
                            const arr = e.target.value.split(",").map(c => c.trim()).filter(Boolean);
                            setNewProduct({ ...newProduct, colors: arr });
                          }}
                          placeholder="p.ej. Negro, Blanco, Gris, Rojo (Separados por comas)"
                          className="w-full px-3 py-2 bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-850 rounded-lg text-xs outline-none text-slate-900 dark:text-white mb-2"
                        />
                        <div className="flex flex-wrap gap-1.5">
                          <span className="text-[9px] text-zinc-500 mr-1 self-center">Preajustes rápidos:</span>
                          {["Negro", "Blanco", "Gris", "Azul", "Rojo", "Verde", "Beige", "Rosa"].map((col) => {
                            const isSelected = (newProduct.colors || []).includes(col);
                            return (
                              <button
                                type="button"
                                key={col}
                                onClick={() => {
                                  const current = newProduct.colors || [];
                                  const next = current.includes(col)
                                    ? current.filter(x => x !== col)
                                    : [...current, col];
                                  setNewProduct({ ...newProduct, colors: next });
                                }}
                                className={`text-[9.5px] px-2 py-0.5 rounded cursor-pointer transition-all ${
                                  isSelected 
                                    ? "bg-indigo-600 text-white font-bold" 
                                    : "bg-slate-200 hover:bg-slate-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
                                }`}
                              >
                                {col}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* PRODUCT COMBINATIONS VARIANT STOCK MANAGER */}
                    <div className="border border-indigo-500/10 p-4 rounded-xl bg-slate-50/50 dark:bg-zinc-900/40 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-widest">
                            Gestor de Stock de Variantes (Combinación Exacto)
                          </label>
                          <p className="text-[9px] text-zinc-400 mt-0.5">Asigna inventarios individuales por talle y color, y un precio diferente por variante si lo requiere</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const curSizes = newProduct.sizes || [];
                            const curColors = newProduct.colors || [];
                            if (curSizes.length === 0 && curColors.length === 0) {
                              showAdminToast("Primero ingresa talles o colores arriba para generar combinaciones.", "error");
                              return;
                            }
                            
                            const generated: ProductVariant[] = [];
                            const sizesList = curSizes.length > 0 ? curSizes : ["Único"];
                            const colorsList = curColors.length > 0 ? curColors : ["General"];
                            
                            for (const sz of sizesList) {
                              for (const col of colorsList) {
                                const exists = (newProduct.variants || []).some(v => v.size === sz && v.color === col);
                                if (!exists) {
                                  generated.push({
                                    size: sz,
                                    color: col,
                                    colorCode: col === "Negro" ? "#000000" : col === "Blanco" ? "#ffffff" : col === "Rojo" ? "#ef4444" : col === "Azul" ? "#3b82f6" : col === "Verde" ? "#22c55e" : col === "Gris" ? "#6b7280" : col === "Beige" ? "#f5f5dc" : col === "Rosa" ? "#f472b6" : "#9ca3af",
                                    stock: Math.floor(Number(newProduct.stock || 5)),
                                    priceDelta: 0
                                  });
                                }
                              }
                            }
                            
                            const combined = [...(newProduct.variants || []), ...generated];
                            setNewProduct({
                              ...newProduct,
                              variants: combined,
                              stock: combined.reduce((sum, v) => sum + v.stock, 0)
                            });
                            showAdminToast(`Se autogeneraron ${generated.length} combinaciones.`, "success");
                          }}
                          className="text-[9px] px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded shadow transition-all cursor-pointer self-start sm:self-center"
                        >
                          Generar Todas las Combinaciones
                        </button>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-100/30 dark:bg-zinc-950 p-2.5 rounded-lg border border-slate-150 dark:border-zinc-850">
                        <div>
                          <label className="block text-[9px] text-zinc-400 capitalize mb-0.5">Talle</label>
                          <select id="new-var-size" className="w-full text-xs bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-1 rounded font-semibold text-zinc-800 dark:text-zinc-200">
                            {((newProduct.sizes || []).length > 0 ? (newProduct.sizes || []) : ["Único"]).map(sz => (
                              <option key={sz} value={sz}>{sz}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[9px] text-zinc-400 capitalize mb-0.5">Color</label>
                          <select id="new-var-color" className="w-full text-xs bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-1 rounded font-semibold text-zinc-800 dark:text-zinc-200">
                            {((newProduct.colors || []).length > 0 ? (newProduct.colors || []) : ["General"]).map(col => (
                              <option key={col} value={col}>{col}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[9px] text-zinc-400 capitalize mb-0.5">Stock Físico</label>
                          <input id="new-var-stock" type="number" defaultValue="5" className="w-full text-xs bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-1 rounded font-mono font-bold" />
                        </div>
                        <div className="flex items-end">
                          <button
                            type="button"
                            onClick={() => {
                              const szEl = document.getElementById('new-var-size') as HTMLSelectElement;
                              const colEl = document.getElementById('new-var-color') as HTMLSelectElement;
                              const stkEl = document.getElementById('new-var-stock') as HTMLInputElement;
                              
                              if (szEl && colEl && stkEl) {
                                const sz = szEl.value;
                                const col = colEl.value;
                                const stk = Math.floor(Number(stkEl.value || 0));
                                
                                const current = newProduct.variants || [];
                                if (current.some(v => v.size === sz && v.color === col)) {
                                  showAdminToast(`La combinación ${sz} - ${col} ya existe.`, "error");
                                  return;
                                }
                                
                                const newV: ProductVariant = {
                                  size: sz,
                                  color: col,
                                  colorCode: col === "Negro" ? "#000000" : col === "Blanco" ? "#ffffff" : col === "Rojo" ? "#ef4444" : col === "Azul" ? "#3b82f6" : col === "Verde" ? "#22c55e" : col === "Gris" ? "#6b7280" : col === "Beige" ? "#f5f5dc" : col === "Rosa" ? "#f472b6" : "#9ca3af",
                                  stock: stk,
                                  priceDelta: 0
                                };
                                const updated = [...current, newV];
                                setNewProduct({
                                  ...newProduct,
                                  variants: updated,
                                  stock: updated.reduce((sum, v) => sum + v.stock, 0)
                                });
                                showAdminToast("Combinación añadida", "success");
                              }
                            }}
                            className="w-full py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-bold rounded border border-zinc-700 transition cursor-pointer"
                          >
                            + Añadir
                          </button>
                        </div>
                      </div>

                      {((newProduct.variants || []).length > 0) ? (
                        <div className="max-h-52 overflow-y-auto border border-slate-150 dark:border-zinc-850 rounded-lg text-xs shadow-inner">
                          <table className="w-full text-left border-collapse bg-white dark:bg-zinc-950">
                            <thead>
                              <tr className="bg-slate-100 dark:bg-zinc-900/60 border-b border-slate-200 dark:border-zinc-850 text-[10px] text-zinc-400 font-extrabold uppercase">
                                <th className="p-2">Talle</th>
                                <th className="p-2">Color / Tono</th>
                                <th className="p-2">Stock Disponible</th>
                                <th className="p-2">Precio Diferente (Opcional)</th>
                                <th className="p-2">Foto URL (Opcional)</th>
                                <th className="p-2 text-right">Acciones</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(newProduct.variants || []).map((v, i) => (
                                <tr key={i} className="border-b border-slate-100 dark:border-zinc-900/50 hover:bg-slate-50/50 dark:hover:bg-zinc-900/30 text-slate-700 dark:text-zinc-300">
                                  <td className="p-2 font-mono font-bold text-indigo-500 dark:text-indigo-400">{v.size}</td>
                                  <td className="p-2 flex items-center gap-2">
                                    <span className="w-3.5 h-3.5 rounded-full border border-zinc-300 dark:border-zinc-800 shadow-sm" style={{ backgroundColor: v.colorCode || '#666' }}></span>
                                    <span>{v.color}</span>
                                  </td>
                                  <td className="p-2">
                                    <input
                                      type="number"
                                      value={v.stock}
                                      onChange={(e) => {
                                        const nextStockArr = JSON.parse(JSON.stringify(newProduct.variants || []));
                                        nextStockArr[i].stock = Math.max(0, Math.floor(Number(e.target.value || 0)));
                                        setNewProduct({
                                          ...newProduct,
                                          variants: nextStockArr,
                                          stock: nextStockArr.reduce((sum: number, item: any) => sum + item.stock, 0)
                                        });
                                      }}
                                      className="w-16 px-1.5 py-0.5 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded font-mono font-bold text-xs outline-none"
                                    />
                                  </td>
                                  <td className="p-2">
                                    <div className="flex items-center gap-1">
                                      <span className="text-zinc-400 font-bold">$</span>
                                      <input
                                        type="number"
                                        placeholder="Base"
                                        value={v.price !== undefined ? v.price : ""}
                                        onChange={(e) => {
                                          const nextArr = JSON.parse(JSON.stringify(newProduct.variants || []));
                                          const val = e.target.value;
                                          if (val === "") {
                                            delete nextArr[i].price;
                                          } else {
                                            nextArr[i].price = Math.max(0, Number(val));
                                          }
                                          setNewProduct({
                                            ...newProduct,
                                            variants: nextArr
                                          });
                                        }}
                                        className="w-20 px-1 py-0.5 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded font-mono font-bold text-xs outline-none"
                                      />
                                    </div>
                                  </td>
                                  <td className="p-2">
                                                                        {(() => {
                                      const galleryImages = [newProduct.imageUrl, ...(newProduct.imagenes || [])].filter(Boolean);
                                      return (
                                        <div className="flex flex-col gap-1 max-w-[170px]">
                                          {galleryImages.length > 0 ? (
                                            <select
                                              value={galleryImages.includes(v.imageUrl || "") ? v.imageUrl : (v.imageUrl ? "manual" : "")}
                                              onChange={(e) => {
                                                const val = e.target.value;
                                                const nextArr = JSON.parse(JSON.stringify(newProduct.variants || []));
                                                if (val === "manual") {
                                                  if (galleryImages.includes(v.imageUrl || "")) {
                                                    nextArr[i].imageUrl = "";
                                                  }
                                                } else {
                                                  nextArr[i].imageUrl = val;
                                                }
                                                setNewProduct({
                                                  ...newProduct,
                                                  variants: nextArr
                                                });
                                              }}
                                              className="px-1.5 py-0.5 bg-slate-50 dark:bg-zinc-900 border border-slate-205 dark:border-zinc-800 rounded text-[11px] outline-none w-full text-slate-800 dark:text-zinc-200"
                                            >
                                              <option value="">-- Sin foto --</option>
                                              {galleryImages.map((img, imgIdx) => (
                                                <option key={imgIdx} value={img}>
                                                  {imgIdx === 0 ? "Foto Principal" : `Foto Adicional ${imgIdx}`}
                                                </option>
                                              ))}
                                              <option value="manual">Otro (Insertar URL)...</option>
                                            </select>
                                          ) : null}

                                          {(galleryImages.length === 0 || !v.imageUrl || !galleryImages.includes(v.imageUrl)) && (
                                            <div className="space-y-1">
                                              <input
                                                type="text"
                                                placeholder="URL de foto..."
                                                value={v.imageUrl || ""}
                                                onChange={(e) => {
                                                  const nextArr = JSON.parse(JSON.stringify(newProduct.variants || []));
                                                  nextArr[i].imageUrl = e.target.value.trim();
                                                  setNewProduct({
                                                    ...newProduct,
                                                    variants: nextArr
                                                  });
                                                }}
                                                className="w-full px-1.5 py-0.5 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-805 rounded text-[10px] outline-none font-mono"
                                              />
                                              <div className="flex items-center gap-1 mt-1">
                                                <span className="text-[8px] text-zinc-400 font-bold uppercase shrink-0">Subir:</span>
                                                <input
                                                  type="file"
                                                  accept="image/*"
                                                  onChange={async (e) => {
                                                    if (e.target.files && e.target.files[0]) {
                                                      const file = e.target.files[0];
                                                      const formData = new FormData();
                                                      formData.append("image", file);
                                                      try {
                                                        const uploadRes = await fetch("/api/cloudinary/upload", {
                                                          method: "POST",
                                                          body: formData,
                                                        });
                                                        const resText = await uploadRes.text();
                                                        let parsedData: any = null;
                                                        
                                                        if (resText.trim().startsWith("<!doctype") || resText.trim().startsWith("<html")) {
                                                          alert("El servidor no pudo subir la imagen. Por favor, verifica que Cloudinary esté configurado en tus Ajustes o reinicia el servidor.");
                                                          return;
                                                        }
                                                        
                                                        try {
                                                          parsedData = JSON.parse(resText);
                                                        } catch (pErr) {
                                                          console.error("Error al parsear respuesta JSON:", pErr);
                                                        }

                                                        if (uploadRes.ok && parsedData && parsedData.success && parsedData.url) {
                                                          const nextArr = JSON.parse(JSON.stringify(newProduct.variants || []));
                                                          nextArr[i].imageUrl = parsedData.url;
                                                          setNewProduct({
                                                            ...newProduct,
                                                            variants: nextArr
                                                          });
                                                        } else {
                                                          alert((parsedData && parsedData.message) || "Error al subir a Cloudinary.");
                                                        }
                                                      } catch (err) {
                                                        console.error(err);
                                                        alert("Error al conectar con la API de subida.");
                                                      }
                                                    }
                                                  }}
                                                  className="w-full text-[8px] text-zinc-550 dark:text-zinc-400 file:mr-1 file:py-0.5 file:px-1 file:rounded file:border-0 file:text-[8px] file:font-semibold file:bg-zinc-100 dark:file:bg-zinc-800 file:text-zinc-700 dark:file:text-zinc-350 hover:file:opacity-80 cursor-pointer"
                                                />
                                              </div>
                                            </div>
                                          )}

                                          {v.imageUrl && (
                                            <div className="flex items-center gap-1 mt-0.5 bg-slate-100/40 dark:bg-zinc-900/40 p-1 rounded border border-slate-200/50 dark:border-zinc-800/30">
                                              <img 
                                                src={v.imageUrl} 
                                                alt="preview" 
                                                className="w-6 h-6 object-cover rounded border border-zinc-700/20 shadow-xs shrink-0" 
                                                onError={(e) => { e.target.style.display = 'none'; }} 
                                              />
                                              <span className="text-[9px] text-zinc-500 truncate max-w-[110px]" title={v.imageUrl}>
                                                {v.imageUrl.includes('/') ? v.imageUrl.substring(v.imageUrl.lastIndexOf('/') + 1) : v.imageUrl}
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })()}
                                  </td>
                                  <td className="p-2 text-right">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const nextVariants = (newProduct.variants || []).filter((_, idx) => idx !== i);
                                        setNewProduct({
                                          ...newProduct,
                                          variants: nextVariants,
                                          stock: nextVariants.reduce((sum, item) => sum + item.stock, 0)
                                        });
                                      }}
                                      className="text-red-500 hover:text-red-600 font-bold transition-all cursor-pointer"
                                    >
                                      Remover
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="p-3 text-center text-zinc-500 text-[11px] bg-slate-100/30 dark:bg-zinc-950 rounded-lg border border-dashed border-slate-200 dark:border-zinc-800">
                          Sin combinaciones registradas. Se usará el stock físico general definido arriba. Puedes autogenerarlas o añadirlas manualmente.
                        </div>
                      )}
                    </div>

                      <div className="flex flex-col gap-3.5 p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="newProductIs3D"
                          checked={!!newProduct.is3D}
                          onChange={(e) => setNewProduct({ ...newProduct, is3D: e.target.checked, hoursPerUnit: e.target.checked ? (newProduct.hoursPerUnit || 1) : undefined })}
                          className="rounded border-zinc-750 bg-zinc-950 text-indigo-500 focus:ring-0 cursor-pointer h-4 w-4"
                        />
                        <label htmlFor="newProductIs3D" className="text-xs text-zinc-300 select-none cursor-pointer font-bold flex items-center gap-1.5 text-indigo-400">
                          <Cpu className="w-4 h-4 shrink-0" />
                          <span>Habilitar Fabricación y Stock 3D Bajo Demanda</span>
                        </label>
                      </div>

                      {newProduct.is3D && (
                        <div className="pl-6 animate-fade-in space-y-2">
                          <label htmlFor="newProductHours" className="block text-[10px] font-extrabold uppercase text-zinc-400 tracking-wider">
                            Demora de fabricación estimada por unidad (en días):
                          </label>
                          <div className="flex items-center gap-2.5">
                            <input
                              type="number"
                              id="newProductHours"
                              min="1"
                              max="100"
                              value={newProduct.hoursPerUnit || 1}
                              onChange={(e) => setNewProduct({ ...newProduct, hoursPerUnit: Math.max(1, Number(e.target.value)) })}
                              className="w-24 px-2.5 py-1.5 rounded bg-zinc-950 text-white border border-zinc-800 text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-[#5346ff]"
                            />
                            <span className="text-[11px] text-zinc-500">día(s) de demora.</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="newProductFeatured"
                        checked={!!newProduct.featured}
                        onChange={(e) => setNewProduct({ ...newProduct, featured: e.target.checked })}
                        className="rounded border-zinc-700 bg-zinc-900 text-indigo-500 focus:ring-0 cursor-pointer h-4 w-4"
                      />
                      <label htmlFor="newProductFeatured" className="text-xs text-zinc-300 select-none cursor-pointer font-semibold">
                        Marcar este producto como "Destacado" (aparece primero en portada)
                      </label>
                    </div>

                    <div className="pt-2 flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setIsNewProductMode(false)}
                        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-705 text-zinc-400 hover:text-white rounded-lg text-xs transition"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={saving}
                        className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>{saving ? "Creando..." : "Crear e Insertar"}</span>
                      </button>
                    </div>
                  </form>
                )}

                {/* 4. EDIT PRODUCT FORM DISPLAY */}
                {adminSection === "products" && editingProduct && (
                  <form onSubmit={handleUpdateProduct} className="bg-white dark:bg-zinc-950 p-5 rounded-xl border border-slate-200 dark:border-zinc-850 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-850 pb-3 mb-2">
                      <div className="flex items-center gap-2">
                        <Edit className="h-4 w-4 text-amber-400" />
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white">Modificar Detalles de Producto</h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditingProduct(null)}
                        className="text-xs text-zinc-400 hover:text-white underline"
                      >
                        Cancelar
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5">Nombre del Producto *</label>
                        <input
                          required
                          type="text"
                          value={editingProduct.name}
                          onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5">Categoría Principal *</label>
                        <select
                          required
                          value={editingProduct.categoria_id || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            const match = (store.dbCategories || []).find(c => c.id === val);
                            const isCategory3D = !!match && (
                              match.nombre.toLowerCase().includes("3d") ||
                              match.nombre.toLowerCase().includes("impresión") ||
                              match.nombre.toLowerCase().includes("impresion") ||
                              match.nombre.toLowerCase().includes("impreción") ||
                              match.nombre.toLowerCase().includes("imprecion")
                            );
                            const currentSizes = editingProduct.sizes || [];
                            const needsDefaultMaterials = isCategory3D && (currentSizes.length === 0 || currentSizes.includes("S") || currentSizes.includes("M") || currentSizes.includes("L") || currentSizes.includes("Único"));
                            setEditingProduct({ 
                              ...editingProduct, 
                              categoria_id: val, 
                              category: match ? match.nombre : "",
                              subcategoria_id: "all", // Reset subcategory selection
                              is3D: isCategory3D ? true : editingProduct.is3D,
                              hoursPerUnit: isCategory3D ? (editingProduct.hoursPerUnit || 1) : editingProduct.hoursPerUnit,
                              sizes: needsDefaultMaterials ? ["PLA", "PETG", "ABS", "TPU"] : currentSizes
                            });
                          }}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs outline-none text-slate-900 dark:text-white font-bold"
                        >
                          <option value="">-- Elige categoría --</option>
                          {(store.dbCategories || [])
                            .sort((a,b) => (a.orden || 0)  - (b.orden || 0))
                            .map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.nombre} {c.active === false ? " (Inactiva)" : ""}
                              </option>
                            ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5">Subcategoría Relacionada</label>
                        <select
                          value={editingProduct.subcategoria_id || "all"}
                          onChange={(e) => setEditingProduct({ ...editingProduct, subcategoria_id: e.target.value })}
                          disabled={!editingProduct.categoria_id}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs outline-none text-slate-900 dark:text-white disabled:opacity-50 transition-all font-semibold"
                        >
                          <option value="all">Sin subcategoría / General</option>
                          {(store.dbSubcategories || [])
                            .filter(s => s.categoria_id === editingProduct.categoria_id)
                            .map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.nombre} {s.active === false ? " (Inactiva)" : ""}
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>

                    {/* Categorías secundarias adicionales para Editar Producto */}
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/60">
                      <label className="block text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5">
                        Categorías Adicionales / Secundarias <span className="text-zinc-400 dark:text-zinc-500 font-normal lowercase">(los artículos aparecerán en todas las categorías marcadas)</span>
                      </label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {(store.dbCategories || [])
                          .sort((a,b) => (a.orden || 0) - (b.orden || 0))
                          .filter(c => c.id !== editingProduct.categoria_id)
                          .map((c) => {
                            const isChecked = !!(editingProduct.categorias_adicionales && editingProduct.categorias_adicionales.includes(c.id));
                            return (
                              <button
                                type="button"
                                key={c.id}
                                onClick={() => {
                                  const list = editingProduct.categorias_adicionales || [];
                                  const updated = list.includes(c.id)
                                    ? list.filter(id => id !== c.id)
                                    : [...list, c.id];
                                  setEditingProduct({
                                    ...editingProduct,
                                    categorias_adicionales: updated
                                  });
                                }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer select-none active:scale-95 ${
                                  isChecked
                                    ? "bg-[#5346ff]/10 text-[#5346ff] border-[#5346ff]/40 dark:bg-[#5346ff]/20 dark:text-[#9086ff] dark:border-[#5346ff]/60"
                                    : "bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-850 hover:bg-slate-100 dark:hover:bg-zinc-850"
                                }`}
                              >
                                <span>{c.nombre}</span>
                                {isChecked && <span className="text-[#5346ff] dark:text-[#9086ff]">✓</span>}
                              </button>
                            );
                          })}
                        {(store.dbCategories || []).filter(c => c.id !== editingProduct.categoria_id).length === 0 && (
                          <span className="text-[10px] text-zinc-400 italic">No hay otras categorías creadas para seleccionar.</span>
                        )}
                      </div>
                    </div>

                    {/* Subcategorías secundarias adicionales para Editar Producto */}
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/60">
                      <label className="block text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5 flex items-center justify-between">
                        <span>Subcategorías Adicionales / Secundarias</span>
                        <span className="text-zinc-400 dark:text-zinc-500 font-normal lowercase">(haz clic para desplegar cada menú y marcar)</span>
                      </label>
                      <div className="space-y-2 mt-2">
                        {(store.dbCategories || [])
                          .sort((a,b) => (a.orden || 0) - (b.orden || 0))
                          .map((cat) => {
                            // Find subcategories belonging to this category
                            const subs = (store.dbSubcategories || []).filter(
                              s => s.categoria_id === cat.id && s.id !== editingProduct.subcategoria_id
                            );
                            if (subs.length === 0) return null;

                            const activeSubCount = subs.filter(
                              s => !!(editingProduct.subcategorias_adicionales && editingProduct.subcategorias_adicionales.includes(s.id))
                            ).length;
                            
                            return (
                              <details key={cat.id} className="group border border-slate-200/50 dark:border-zinc-800/50 rounded-lg bg-white dark:bg-zinc-950/40 overflow-hidden" open={activeSubCount > 0}>
                                <summary className="flex items-center justify-between px-3 py-2 text-[11px] text-slate-700 dark:text-zinc-300 font-extrabold cursor-pointer select-none hover:bg-slate-100/50 dark:hover:bg-zinc-900/50 duration-150 list-none [&::-webkit-details-marker]:hidden">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[9px] text-slate-400 dark:text-zinc-500 transition-transform duration-200 group-open:rotate-90">▶</span>
                                    <span className="uppercase text-[10px] tracking-wider font-mono">{cat.nombre}</span>
                                  </div>
                                  {activeSubCount > 0 && (
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-[#5346ff]/10 text-[#5346ff] dark:bg-[#5346ff]/20 dark:text-[#9086ff]">
                                      {activeSubCount} {activeSubCount === 1 ? "seleccionada" : "seleccionadas"}
                                    </span>
                                  )}
                                </summary>
                                <div className="p-2.5 border-t border-slate-100 dark:border-zinc-800/30 bg-slate-50/40 dark:bg-zinc-950/20 flex flex-wrap gap-1.5">
                                  {subs.map((s) => {
                                    const isChecked = !!(editingProduct.subcategorias_adicionales && editingProduct.subcategorias_adicionales.includes(s.id));
                                    return (
                                      <button
                                        type="button"
                                        key={s.id}
                                        onClick={() => {
                                          const list = editingProduct.subcategorias_adicionales || [];
                                          const updated = list.includes(s.id)
                                            ? list.filter(id => id !== s.id)
                                            : [...list, s.id];
                                          setEditingProduct({
                                            ...editingProduct,
                                            subcategorias_adicionales: updated
                                          });
                                        }}
                                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 border transition-all cursor-pointer select-none active:scale-95 ${
                                          isChecked
                                            ? "bg-[#5346ff]/10 text-[#5346ff] border-[#5346ff]/35 dark:bg-[#5346ff]/20 dark:text-[#9086ff] dark:border-[#5346ff]/50"
                                            : "bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-850 hover:bg-slate-100 dark:hover:bg-zinc-850"
                                        }`}
                                      >
                                        <span>{s.nombre}</span>
                                        {isChecked && <span className="text-[#5346ff] dark:text-[#9086ff]">✓</span>}
                                      </button>
                                    );
                                  })}
                                </div>
                              </details>
                            );
                          })}
                        {!(store.dbSubcategories && store.dbSubcategories.length > 0) && (
                          <span className="text-[10px] text-zinc-400 italic">No hay subcategorías registradas en la tienda para seleccionar.</span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5">Precio de Lista / Antes</label>
                        <input
                          type="number"
                          step="0.01"
                          value={editingProduct.originalPrice || ""}
                          onChange={(e) => setEditingProduct({ ...editingProduct, originalPrice: e.target.value ? Number(e.target.value) : undefined })}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white font-mono"
                          placeholder="ej. 99.99"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5">Descuento (%)</label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            max="99"
                            value={
                              editingProduct.originalPrice && editingProduct.price && editingProduct.originalPrice > editingProduct.price
                                ? Math.round(((editingProduct.originalPrice - editingProduct.price) / editingProduct.originalPrice) * 100)
                                : ""
                            }
                            onChange={(e) => {
                              const pct = e.target.value === "" ? 0 : Number(e.target.value);
                              if (pct >= 0 && pct < 100) {
                                if (editingProduct.originalPrice) {
                                  const computedPrice = Number((editingProduct.originalPrice * (1 - pct / 100)).toFixed(2));
                                  setEditingProduct({ ...editingProduct, price: computedPrice });
                                } else if (editingProduct.price) {
                                  const computedOriginal = Number((editingProduct.price / (1 - pct / 100)).toFixed(2));
                                  setEditingProduct({ ...editingProduct, originalPrice: computedOriginal });
                                }
                              }
                            }}
                            className="w-full px-3 py-2 pr-8 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white font-mono font-bold text-indigo-500 dark:text-indigo-400"
                            placeholder="Calculado"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">%</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5">Precio de Venta ($) *</label>
                        <input
                          required
                          type="number"
                          step="0.01"
                          value={editingProduct.price}
                          onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5">Stock Real *</label>
                        <input
                          required
                          type="number"
                          value={editingProduct.stock}
                          onChange={(e) => setEditingProduct({ ...editingProduct, stock: Number(e.target.value) })}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white font-mono"
                        />
                      </div>
                    </div>

                    <ImageGalleryEditor
                      images={[editingProduct.imageUrl || "", ...(editingProduct.imagenes || [])].filter(Boolean)}
                      onChange={(updatedImages) => {
                        setEditingProduct({
                          ...editingProduct,
                          imageUrl: updatedImages[0] || "",
                          imagenes: updatedImages.slice(1)
                        });
                      }}
                      isThemeDark={store.settings.themeMode === "dark"}
                    />

                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5">Descripción Detallada</label>
                      <textarea
                        value={editingProduct.description}
                        onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white resize-none"
                      />
                    </div>

                    {/* Talles y Colores Configuration Panel */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border border-indigo-500/10 p-4 rounded-xl bg-slate-50/50 dark:bg-zinc-900/40">
                      <div>
                        {editingProduct.is3D || is3DProduct(editingProduct) ? (
                          <div>
                            <label className="block text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-1">
                              Materiales 3D Disponibles
                            </label>
                            <input
                              type="text"
                              value={(editingProduct.sizes || []).join(", ")}
                              onChange={(e) => {
                                const arr = e.target.value.split(",").map(s => s.trim()).filter(Boolean);
                                setEditingProduct({ ...editingProduct, sizes: arr });
                              }}
                              placeholder="p.ej. PLA, PETG, ABS, TPU (Separados por comas)"
                              className="w-full px-3 py-2 bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-850 rounded-lg text-xs outline-none text-slate-900 dark:text-white mb-2"
                            />
                            <div className="flex flex-wrap gap-1.5">
                              <span className="text-[9px] text-zinc-500 mr-1 self-center">Preajustes rápidos:</span>
                              {["PLA", "PETG", "ABS", "TPU"].map((mat) => {
                                const isSelected = (editingProduct.sizes || []).includes(mat);
                                return (
                                  <button
                                    type="button"
                                    key={mat}
                                    onClick={() => {
                                      const current = editingProduct.sizes || [];
                                      const next = current.includes(mat)
                                        ? current.filter(x => x !== mat)
                                        : [...current, mat];
                                      setEditingProduct({ ...editingProduct, sizes: next });
                                    }}
                                    className={`text-[9.5px] font-mono px-2 py-0.5 rounded cursor-pointer transition-all ${
                                      isSelected 
                                        ? "bg-indigo-600 text-white font-bold" 
                                        : "bg-slate-200 hover:bg-slate-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
                                    }`}
                                  >
                                    {mat}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <label className="block text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-1">Talles / Tamaños Disponibles</label>
                            <input
                              type="text"
                              value={(editingProduct.sizes || []).join(", ")}
                              onChange={(e) => {
                                const arr = e.target.value.split(",").map(s => s.trim()).filter(Boolean);
                                setEditingProduct({ ...editingProduct, sizes: arr });
                              }}
                              placeholder="p.ej. S, M, L, XL (Separados por comas)"
                              className="w-full px-3 py-2 bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-850 rounded-lg text-xs outline-none text-slate-900 dark:text-white mb-2"
                            />
                            <div className="flex flex-wrap gap-1.5">
                              <span className="text-[9px] text-zinc-500 mr-1 self-center">Preajustes rápidos:</span>
                              {["S", "M", "L", "XL", "XXL", "Único"].map((sz) => {
                                const isSelected = (editingProduct.sizes || []).includes(sz);
                                return (
                                  <button
                                    type="button"
                                    key={sz}
                                    onClick={() => {
                                      const current = editingProduct.sizes || [];
                                      const next = current.includes(sz)
                                        ? current.filter(x => x !== sz)
                                        : [...current, sz];
                                      setEditingProduct({ ...editingProduct, sizes: next });
                                    }}
                                    className={`text-[9.5px] font-mono px-2 py-0.5 rounded cursor-pointer transition-all ${
                                      isSelected 
                                        ? "bg-indigo-600 text-white font-bold" 
                                        : "bg-slate-200 hover:bg-slate-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
                                    }`}
                                  >
                                    {sz}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-1">Colores Disponibles</label>
                        <input
                          type="text"
                          value={(editingProduct.colors || []).join(", ")}
                          onChange={(e) => {
                            const arr = e.target.value.split(",").map(c => c.trim()).filter(Boolean);
                            setEditingProduct({ ...editingProduct, colors: arr });
                          }}
                          placeholder="p.ej. Negro, Blanco, Gris, Rojo (Separados por comas)"
                          className="w-full px-3 py-2 bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-850 rounded-lg text-xs outline-none text-slate-900 dark:text-white mb-2"
                        />
                        <div className="flex flex-wrap gap-1.5">
                          <span className="text-[9px] text-zinc-500 mr-1 self-center">Preajustes rápidos:</span>
                          {["Negro", "Blanco", "Gris", "Azul", "Rojo", "Verde", "Beige", "Rosa"].map((col) => {
                            const isSelected = (editingProduct.colors || []).includes(col);
                            return (
                              <button
                                type="button"
                                key={col}
                                onClick={() => {
                                  const current = editingProduct.colors || [];
                                  const next = current.includes(col)
                                    ? current.filter(x => x !== col)
                                    : [...current, col];
                                  setEditingProduct({ ...editingProduct, colors: next });
                                }}
                                className={`text-[9.5px] px-2 py-0.5 rounded cursor-pointer transition-all ${
                                  isSelected 
                                    ? "bg-indigo-600 text-white font-bold" 
                                    : "bg-slate-200 hover:bg-slate-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
                                }`}
                              >
                                {col}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* PRODUCT COMBINATIONS VARIANT STOCK MANAGER FOR EDITING */}
                    <div className="border border-indigo-500/10 p-4 rounded-xl bg-slate-50/50 dark:bg-zinc-900/40 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-widest">
                            Gestor de Stock de Variantes (Combinación Exacto)
                          </label>
                          <p className="text-[9px] text-zinc-400 mt-0.5 font-sans">Asigna inventarios individuales por talle y color, y un precio diferente por variante si lo requiere</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const curSizes = editingProduct.sizes || [];
                            const curColors = editingProduct.colors || [];
                            if (curSizes.length === 0 && curColors.length === 0) {
                              showAdminToast("Primero ingresa talles o colores arriba para generar combinaciones.", "error");
                              return;
                            }
                            
                            const generated: ProductVariant[] = [];
                            const sizesList = curSizes.length > 0 ? curSizes : ["Único"];
                            const colorsList = curColors.length > 0 ? curColors : ["General"];
                            
                            for (const sz of sizesList) {
                              for (const col of colorsList) {
                                const exists = (editingProduct.variants || []).some(v => v.size === sz && v.color === col);
                                if (!exists) {
                                  generated.push({
                                    size: sz,
                                    color: col,
                                    colorCode: col === "Negro" ? "#000000" : col === "Blanco" ? "#ffffff" : col === "Rojo" ? "#ef4444" : col === "Azul" ? "#3b82f6" : col === "Verde" ? "#22c55e" : col === "Gris" ? "#6b7280" : col === "Beige" ? "#f5f5dc" : col === "Rosa" ? "#f472b6" : "#9ca3af",
                                    stock: Math.floor(Number(editingProduct.stock || 5)),
                                    priceDelta: 0
                                  });
                                }
                              }
                            }
                            
                            const combined = [...(editingProduct.variants || []), ...generated];
                            setEditingProduct({
                              ...editingProduct,
                              variants: combined,
                              stock: combined.reduce((sum, v) => sum + v.stock, 0)
                            });
                            showAdminToast(`Se autogeneraron ${generated.length} combinaciones.`, "success");
                          }}
                          className="text-[9px] px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded shadow transition-all cursor-pointer self-start sm:self-center"
                        >
                          Generar Todas las Combinaciones
                        </button>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-100/30 dark:bg-zinc-950 p-2.5 rounded-lg border border-slate-150 dark:border-zinc-850">
                        <div>
                          <label className="block text-[9px] text-zinc-400 capitalize mb-0.5">Talle</label>
                          <select id="edit-var-size" className="w-full text-xs bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-1 rounded font-semibold text-zinc-800 dark:text-zinc-200">
                            {((editingProduct.sizes || []).length > 0 ? (editingProduct.sizes || []) : ["Único"]).map(sz => (
                              <option key={sz} value={sz}>{sz}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[9px] text-zinc-400 capitalize mb-0.5">Color</label>
                          <select id="edit-var-color" className="w-full text-xs bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-1 rounded font-semibold text-zinc-800 dark:text-zinc-200">
                            {((editingProduct.colors || []).length > 0 ? (editingProduct.colors || []) : ["General"]).map(col => (
                              <option key={col} value={col}>{col}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[9px] text-zinc-400 capitalize mb-0.5">Stock Físico</label>
                          <input id="edit-var-stock" type="number" defaultValue="5" className="w-full text-xs bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-1 rounded font-mono font-bold" />
                        </div>
                        <div className="flex items-end">
                          <button
                            type="button"
                            onClick={() => {
                              const szEl = document.getElementById('edit-var-size') as HTMLSelectElement;
                              const colEl = document.getElementById('edit-var-color') as HTMLSelectElement;
                              const stkEl = document.getElementById('edit-var-stock') as HTMLInputElement;
                              
                              if (szEl && colEl && stkEl) {
                                const sz = szEl.value;
                                const col = colEl.value;
                                const stk = Math.floor(Number(stkEl.value || 0));
                                
                                const current = editingProduct.variants || [];
                                if (current.some(v => v.size === sz && v.color === col)) {
                                  showAdminToast(`La combinación ${sz} - ${col} ya existe.`, "error");
                                  return;
                                }
                                
                                const newV: ProductVariant = {
                                  size: sz,
                                  color: col,
                                  colorCode: col === "Negro" ? "#000000" : col === "Blanco" ? "#ffffff" : col === "Rojo" ? "#ef4444" : col === "Azul" ? "#3b82f6" : col === "Verde" ? "#22c55e" : col === "Gris" ? "#6b7280" : col === "Beige" ? "#f5f5dc" : col === "Rosa" ? "#f472b6" : "#9ca3af",
                                  stock: stk,
                                  priceDelta: 0
                                };
                                const updated = [...current, newV];
                                setEditingProduct({
                                  ...editingProduct,
                                  variants: updated,
                                  stock: updated.reduce((sum, v) => sum + v.stock, 0)
                                });
                                showAdminToast("Combinación añadida", "success");
                              }
                            }}
                            className="w-full py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-bold rounded border border-zinc-700 transition cursor-pointer"
                          >
                            + Añadir
                          </button>
                        </div>
                      </div>

                      {((editingProduct.variants || []).length > 0) ? (
                        <div className="max-h-52 overflow-y-auto border border-slate-150 dark:border-zinc-850 rounded-lg text-xs shadow-inner">
                          <table className="w-full text-left border-collapse bg-white dark:bg-zinc-950">
                            <thead>
                              <tr className="bg-slate-100 dark:bg-zinc-900/60 border-b border-slate-200 dark:border-zinc-850 text-[10px] text-zinc-400 font-extrabold uppercase">
                                <th className="p-2">Talle</th>
                                <th className="p-2">Color / Tono</th>
                                <th className="p-2">Stock Disponible</th>
                                <th className="p-2">Precio Diferente (Opcional)</th>
                                <th className="p-2">Foto URL (Opcional)</th>
                                <th className="p-2 text-right">Acciones</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(editingProduct.variants || []).map((v, i) => (
                                <tr key={i} className="border-b border-slate-100 dark:border-zinc-900/50 hover:bg-slate-50/50 dark:hover:bg-zinc-900/30 text-slate-700 dark:text-zinc-300">
                                  <td className="p-2 font-mono font-bold text-indigo-500 dark:text-indigo-400">{v.size}</td>
                                  <td className="p-2 flex items-center gap-2">
                                    <span className="w-3.5 h-3.5 rounded-full border border-zinc-300 dark:border-zinc-800 shadow-sm" style={{ backgroundColor: v.colorCode || '#666' }}></span>
                                    <span>{v.color}</span>
                                  </td>
                                  <td className="p-2">
                                    <input
                                      type="number"
                                      value={v.stock}
                                      onChange={(e) => {
                                        const nextStockArr = JSON.parse(JSON.stringify(editingProduct.variants || []));
                                        nextStockArr[i].stock = Math.max(0, Math.floor(Number(e.target.value || 0)));
                                        setEditingProduct({
                                          ...editingProduct,
                                          variants: nextStockArr,
                                          stock: nextStockArr.reduce((sum: number, item: any) => sum + item.stock, 0)
                                        });
                                      }}
                                      className="w-16 px-1.5 py-0.5 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded font-mono font-bold text-xs outline-none"
                                    />
                                  </td>
                                  <td className="p-2">
                                    <div className="flex items-center gap-1">
                                      <span className="text-zinc-400 font-bold">$</span>
                                      <input
                                        type="number"
                                        placeholder="Base"
                                        value={v.price !== undefined ? v.price : ""}
                                        onChange={(e) => {
                                          const nextArr = JSON.parse(JSON.stringify(editingProduct.variants || []));
                                          const val = e.target.value;
                                          if (val === "") {
                                            delete nextArr[i].price;
                                          } else {
                                            nextArr[i].price = Math.max(0, Number(val));
                                          }
                                          setEditingProduct({
                                            ...editingProduct,
                                            variants: nextArr
                                          });
                                        }}
                                        className="w-20 px-1 py-0.5 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded font-mono font-bold text-xs outline-none"
                                      />
                                    </div>
                                  </td>
                                  <td className="p-2">
                                                                        {(() => {
                                      const galleryImages = [editingProduct.imageUrl, ...(editingProduct.imagenes || [])].filter(Boolean);
                                      return (
                                        <div className="flex flex-col gap-1 max-w-[170px]">
                                          {galleryImages.length > 0 ? (
                                            <select
                                              value={galleryImages.includes(v.imageUrl || "") ? v.imageUrl : (v.imageUrl ? "manual" : "")}
                                              onChange={(e) => {
                                                const val = e.target.value;
                                                const nextArr = JSON.parse(JSON.stringify(editingProduct.variants || []));
                                                if (val === "manual") {
                                                  if (galleryImages.includes(v.imageUrl || "")) {
                                                    nextArr[i].imageUrl = "";
                                                  }
                                                } else {
                                                  nextArr[i].imageUrl = val;
                                                }
                                                setEditingProduct({
                                                  ...editingProduct,
                                                  variants: nextArr
                                                });
                                              }}
                                              className="px-1.5 py-0.5 bg-slate-50 dark:bg-zinc-900 border border-slate-205 dark:border-zinc-800 rounded text-[11px] outline-none w-full text-slate-800 dark:text-zinc-200"
                                            >
                                              <option value="">-- Sin foto --</option>
                                              {galleryImages.map((img, imgIdx) => (
                                                <option key={imgIdx} value={img}>
                                                  {imgIdx === 0 ? "Foto Principal" : `Foto Adicional ${imgIdx}`}
                                                </option>
                                              ))}
                                              <option value="manual">Otro (Insertar URL)...</option>
                                            </select>
                                          ) : null}

                                          {(galleryImages.length === 0 || !v.imageUrl || !galleryImages.includes(v.imageUrl)) && (
                                            <div className="space-y-1">
                                              <input
                                                type="text"
                                                placeholder="URL de foto..."
                                                value={v.imageUrl || ""}
                                                onChange={(e) => {
                                                  const nextArr = JSON.parse(JSON.stringify(editingProduct.variants || []));
                                                  nextArr[i].imageUrl = e.target.value.trim();
                                                  setEditingProduct({
                                                    ...editingProduct,
                                                    variants: nextArr
                                                  });
                                                }}
                                                className="w-full px-1.5 py-0.5 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-805 rounded text-[10px] outline-none font-mono"
                                              />
                                              <div className="flex items-center gap-1 mt-1">
                                                <span className="text-[8px] text-zinc-400 font-bold uppercase shrink-0">Subir:</span>
                                                <input
                                                  type="file"
                                                  accept="image/*"
                                                  onChange={async (e) => {
                                                    if (e.target.files && e.target.files[0]) {
                                                      const file = e.target.files[0];
                                                      const formData = new FormData();
                                                      formData.append("image", file);
                                                      try {
                                                        const uploadRes = await fetch("/api/cloudinary/upload", {
                                                          method: "POST",
                                                          body: formData,
                                                        });
                                                        const resText = await uploadRes.text();
                                                        let parsedData: any = null;
                                                        
                                                        if (resText.trim().startsWith("<!doctype") || resText.trim().startsWith("<html")) {
                                                          alert("El servidor no pudo subir la imagen. Por favor, verifica que Cloudinary esté configurado en tus Ajustes o reinicia el servidor.");
                                                          return;
                                                        }
                                                        
                                                        try {
                                                          parsedData = JSON.parse(resText);
                                                        } catch (pErr) {
                                                          console.error("Error al parsear respuesta JSON:", pErr);
                                                        }

                                                        if (uploadRes.ok && parsedData && parsedData.success && parsedData.url) {
                                                          const nextArr = JSON.parse(JSON.stringify(editingProduct.variants || []));
                                                          nextArr[i].imageUrl = parsedData.url;
                                                          setEditingProduct({
                                                            ...editingProduct,
                                                            variants: nextArr
                                                          });
                                                        } else {
                                                          alert((parsedData && parsedData.message) || "Error al subir a Cloudinary.");
                                                        }
                                                      } catch (err) {
                                                        console.error(err);
                                                        alert("Error al conectar con la API de subida.");
                                                      }
                                                    }
                                                  }}
                                                  className="w-full text-[8px] text-zinc-550 dark:text-zinc-400 file:mr-1 file:py-0.5 file:px-1 file:rounded file:border-0 file:text-[8px] file:font-semibold file:bg-zinc-100 dark:file:bg-zinc-800 file:text-zinc-700 dark:file:text-zinc-350 hover:file:opacity-80 cursor-pointer"
                                                />
                                              </div>
                                            </div>
                                          )}

                                          {v.imageUrl && (
                                            <div className="flex items-center gap-1 mt-0.5 bg-slate-100/40 dark:bg-zinc-900/40 p-1 rounded border border-slate-200/50 dark:border-zinc-800/30">
                                              <img 
                                                src={v.imageUrl} 
                                                alt="preview" 
                                                className="w-6 h-6 object-cover rounded border border-zinc-700/20 shadow-xs shrink-0" 
                                                onError={(e) => { e.target.style.display = 'none'; }} 
                                              />
                                              <span className="text-[9px] text-zinc-500 truncate max-w-[110px]" title={v.imageUrl}>
                                                {v.imageUrl.includes('/') ? v.imageUrl.substring(v.imageUrl.lastIndexOf('/') + 1) : v.imageUrl}
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })()}
                                  </td>
                                  <td className="p-2 text-right">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const nextVariants = (editingProduct.variants || []).filter((_, idx) => idx !== i);
                                        setEditingProduct({
                                          ...editingProduct,
                                          variants: nextVariants,
                                          stock: nextVariants.reduce((sum, item) => sum + item.stock, 0)
                                        });
                                      }}
                                      className="text-red-500 hover:text-red-650 font-bold transition-all cursor-pointer"
                                    >
                                      Remover
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="p-3 text-center text-zinc-500 text-[11px] bg-slate-100/30 dark:bg-zinc-950 rounded-lg border border-dashed border-slate-200 dark:border-zinc-800">
                          Sin combinaciones registradas. Se usará el stock físico general definido arriba. Puedes autogenerarlas o añadirlas manualmente.
                        </div>
                      )}
                    </div>

                      <div className="flex flex-col gap-3.5 p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="editProductIs3D"
                          checked={!!editingProduct.is3D}
                          onChange={(e) => setEditingProduct({ ...editingProduct, is3D: e.target.checked, hoursPerUnit: e.target.checked ? (editingProduct.hoursPerUnit || 1) : undefined })}
                          className="rounded border-zinc-750 bg-zinc-950 text-indigo-500 focus:ring-0 cursor-pointer h-4 w-4"
                        />
                        <label htmlFor="editProductIs3D" className="text-xs text-zinc-300 select-none cursor-pointer font-bold flex items-center gap-1.5 text-indigo-400">
                          <Cpu className="w-4 h-4 shrink-0" />
                          <span>Habilitar Fabricación y Stock 3D Bajo Demanda</span>
                        </label>
                      </div>

                      {editingProduct.is3D && (
                        <div className="pl-6 animate-fade-in space-y-2">
                          <label htmlFor="editProductHours" className="block text-[10px] font-extrabold uppercase text-zinc-400 tracking-wider">
                            Demora de fabricación estimada por unidad (en días):
                          </label>
                          <div className="flex items-center gap-2.5">
                            <input
                              type="number"
                              id="editProductHours"
                              min="1"
                              max="100"
                              value={editingProduct.hoursPerUnit || 1}
                              onChange={(e) => setEditingProduct({ ...editingProduct, hoursPerUnit: Math.max(1, Number(e.target.value)) })}
                              className="w-24 px-2.5 py-1.5 rounded bg-zinc-950 text-white border border-zinc-800 text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-[#5346ff]"
                            />
                            <span className="text-[11px] text-zinc-500">día(s) de demora.</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="editProductFeatured"
                        checked={!!editingProduct.featured}
                        onChange={(e) => setEditingProduct({ ...editingProduct, featured: e.target.checked })}
                        className="rounded border-zinc-700 bg-zinc-900 text-indigo-500 focus:ring-0 cursor-pointer h-4 w-4"
                      />
                      <label htmlFor="editProductFeatured" className="text-xs text-zinc-300 select-none cursor-pointer font-semibold">
                        Marcar este producto como "Destacado"
                      </label>
                    </div>

                    <div className="pt-2 flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setEditingProduct(null)}
                        className="px-4 py-2 bg-zinc-800 text-zinc-400 hover:text-white rounded-lg text-xs transition cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={saving}
                        className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>{saving ? "Salvando..." : "Guardar Modificación"}</span>
                      </button>
                    </div>
                  </form>
                )}

                {/* 5. CATEGORIES MANAGER */}
                {adminSection === "categories" && (
                  <div className="space-y-6">
                    {/* Category forms row */}
                    <div id="admin-categories-editor-form-row" className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Left: main category form (create or edit) */}
                      <div className="bg-white dark:bg-zinc-950 p-5 rounded-2xl border border-slate-200 dark:border-zinc-850 shadow-sm space-y-4">
                        {editingCategory ? (
                          <form onSubmit={handleUpdateDynamicCategory} className="space-y-3">
                            <div className="flex items-center justify-between border-b border-zinc-100/10 dark:border-zinc-900 pb-2">
                              <h4 className="font-bold text-xs uppercase tracking-wider text-amber-500">Editar Categoría</h4>
                              <button
                                type="button"
                                onClick={() => setEditingCategory(null)}
                                className="text-[10px] text-zinc-400 hover:text-white underline cursor-pointer"
                              >
                                Cancelar edición
                              </button>
                            </div>
                            <div>
                              <label className="block text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-1">Nombre</label>
                              <input
                                required
                                type="text"
                                value={editingCategory.nombre || ""}
                                onChange={(e) => setEditingCategory({ ...editingCategory, nombre: e.target.value })}
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white font-semibold"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-1">Ícono (Lucide)</label>
                                <select
                                  value={editingCategory.icono || "Shirt"}
                                  onChange={(e) => setEditingCategory({ ...editingCategory, icono: e.target.value })}
                                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs outline-none text-slate-900 dark:text-white font-semibold"
                                >
                                  {["Shirt", "Smartphone", "Watch", "Tv", "Home", "Gem", "Glasses", "Gift", "Music", "Sparkles", "Package", "BookOpen", "Compass", "Palette"].map((ico) => (
                                    <option key={ico} value={ico}>{ico}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-1">Orden de visualización</label>
                                <input
                                  type="number"
                                  value={editingCategory.orden === undefined ? "" : editingCategory.orden}
                                  onChange={(e) => setEditingCategory({ ...editingCategory, orden: Number(e.target.value) })}
                                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs outline-none text-slate-900 dark:text-white font-mono"
                                />
                              </div>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <input
                                type="checkbox"
                                id="editingCategoryActive"
                                checked={editingCategory.active !== false}
                                onChange={(e) => setEditingCategory({ ...editingCategory, active: e.target.checked })}
                                className="rounded border-zinc-700 bg-zinc-900 text-indigo-500 focus:ring-0 cursor-pointer h-4 w-4"
                              />
                              <label htmlFor="editingCategoryActive" className="text-xs text-zinc-300 font-semibold select-none cursor-pointer">
                                Categoría activa (se muestra en menú)
                              </label>
                            </div>
                            <button
                              type="submit"
                              disabled={saving}
                              className="w-full py-2 bg-amber-500 text-slate-950 font-bold rounded-lg text-xs hover:bg-amber-400 transition-all cursor-pointer"
                            >
                              {saving ? "Salvando..." : "Guardar Cambios"}
                            </button>
                          </form>
                        ) : (
                          <form onSubmit={handleAddCategory} className="space-y-3">
                            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-zinc-400 border-b border-zinc-100/5 pb-2 flex items-center gap-1.5">
                              <span className="w-1.5 h-3 bg-blue-500 rounded-full"></span>
                              <span>Crear Categoría Principal</span>
                            </h4>
                            <div>
                              <label className="block text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-1">Nombre de Categoría *</label>
                              <input
                                required
                                type="text"
                                placeholder="p.ej. Accesorios premium"
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-1">Ícono</label>
                                <select
                                  value={newCategoryIcon}
                                  onChange={(e) => setNewCategoryIcon(e.target.value)}
                                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs outline-none text-slate-900 dark:text-white font-semibold"
                                >
                                  {["Shirt", "Smartphone", "Watch", "Tv", "Home", "Gem", "Glasses", "Gift", "Music", "Sparkles", "Package", "BookOpen", "Compass", "Palette"].map((ico) => (
                                    <option key={ico} value={ico}>{ico}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-1">Orden</label>
                                <input
                                  type="number"
                                  value={newCategoryOrder}
                                  onChange={(e) => setNewCategoryOrder(Number(e.target.value))}
                                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs outline-none text-slate-900 dark:text-white font-mono"
                                />
                              </div>
                            </div>
                            <button
                              type="submit"
                              disabled={saving}
                              className="w-full py-2 bg-blue-600 text-white font-semibold rounded-lg text-xs hover:bg-blue-700 transition flex items-center justify-center gap-1.5 cursor-pointer font-bold"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              <span>Crear Categoría</span>
                            </button>
                          </form>
                        )}
                      </div>

                      {/* Right: subcategory form (create or edit) */}
                      <div className="bg-white dark:bg-zinc-950 p-5 rounded-2xl border border-slate-200 dark:border-zinc-850 shadow-sm space-y-4">
                        {editingSubcategory ? (
                          <form onSubmit={handleUpdateSubcategory} className="space-y-3">
                            <div className="flex items-center justify-between border-b border-zinc-100/10 dark:border-zinc-900 pb-2">
                              <h4 className="font-bold text-xs uppercase tracking-wider text-indigo-400">Editar Subcategoría</h4>
                              <button
                                type="button"
                                onClick={() => setEditingSubcategory(null)}
                                className="text-[10px] text-zinc-400 hover:text-white underline cursor-pointer"
                              >
                                Cancelar edición
                              </button>
                            </div>
                            <div>
                              <label className="block text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-1">Nombre</label>
                              <input
                                required
                                type="text"
                                value={editingSubcategory.nombre || ""}
                                onChange={(e) => setEditingSubcategory({ ...editingSubcategory, nombre: e.target.value })}
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white font-semibold"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-1">Categoría Principal Asignada</label>
                              <select
                                value={editingSubcategory.categoria_id || ""}
                                onChange={(e) => setEditingSubcategory({ ...editingSubcategory, categoria_id: e.target.value })}
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs outline-none text-slate-900 dark:text-white font-bold"
                              >
                                {(store.dbCategories || []).map((cat) => (
                                  <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                                ))}
                              </select>
                            </div>
                            <button
                              type="submit"
                              disabled={saving}
                              className="w-full py-2 bg-indigo-650 bg-indigo-650 text-white font-bold rounded-lg text-xs hover:bg-indigo-700 transition shadow cursor-pointer text-center"
                            >
                              {saving ? "Salvando..." : "Guardar Modificaciones"}
                            </button>
                          </form>
                        ) : (
                          <form onSubmit={handleCreateSubcategory} className="space-y-3">
                            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-zinc-400 border-b border-zinc-100/5 pb-2 flex items-center gap-1.5">
                              <span className="w-1.5 h-3 bg-violet-500 rounded-full"></span>
                              <span>Crear Nueva Subcategoría</span>
                            </h4>
                            <div>
                              <label className="block text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-1">Nombre de Subcategoría *</label>
                              <input
                                required
                                type="text"
                                placeholder="p.ej. Zapatos de vestir"
                                value={newSubcategoryName}
                                onChange={(e) => setNewSubcategoryName(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-1">Categoría Principal Madre</label>
                              <select
                                value={newSubcategoryParent}
                                onChange={(e) => setNewSubcategoryParent(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs outline-none text-slate-900 dark:text-white font-semibold"
                              >
                                <option value="">-- Elige categoría madre --</option>
                                {(store.dbCategories || []).map((cat) => (
                                  <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                                ))}
                              </select>
                            </div>
                            <button
                              type="submit"
                              disabled={saving || !newSubcategoryParent}
                              className="w-full py-2 bg-violet-600 disabled:opacity-40 text-white font-semibold rounded-lg text-xs hover:bg-violet-700 transition flex items-center justify-center gap-1.5 cursor-pointer font-bold"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              <span>Crear Subcategoría</span>
                            </button>
                          </form>
                        )}
                      </div>
                    </div>

                    {/* Listing of all categories and nested subcategories */}
                    <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-slate-200 dark:border-zinc-850 shadow-sm overflow-hidden">
                      <div className="p-4 border-b border-slate-100 dark:border-zinc-850 bg-slate-50/50 dark:bg-zinc-950/80 flex items-center justify-between">
                        <div>
                          <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-800 dark:text-zinc-300">
                            Jerarquía de Categorías y Subcategorías
                          </h4>
                          <p className="text-[10px] text-zinc-400 mt-0.5">Organiza tu menú y segmenta tus productos sin tocar código.</p>
                        </div>
                        <span className="text-[10px] font-mono bg-zinc-800 px-2 py-0.5 rounded text-zinc-400 font-bold">
                          {(store.dbCategories || []).length} principales | {(store.dbSubcategories || []).length} secundarias
                        </span>
                      </div>

                      <div className="divide-y divide-slate-100 dark:divide-zinc-850">
                        {(store.dbCategories || []).length === 0 ? (
                          <div className="p-8 text-center text-zinc-500 text-xs">
                            No hay categorías principales creadas aún. Utiliza el formulario superior para crear la primera.
                          </div>
                        ) : (
                          (store.dbCategories || [])
                            .sort((a,b) => (a.orden || 0)  - (b.orden || 0))
                            .map((cat) => {
                              const catProductsCount = store.products.filter(p => p.categoria_id === cat.id || p.category?.toLowerCase() === cat.nombre?.toLowerCase()).length;
                              const children = (store.dbSubcategories || []).filter(s => s.categoria_id === cat.id);
                              
                              return (
                                <div key={cat.id} className="p-5 flex flex-col gap-3 hover:bg-slate-50/40 dark:hover:bg-zinc-900/10 transition">
                                  {/* Main Category Header details */}
                                  <div className="flex items-center justify-between flex-wrap gap-2">
                                    <div className="flex items-center gap-2.5">
                                      <div className="text-[10px] font-bold bg-zinc-800 text-indigo-400 px-2 py-0.5 rounded font-mono" title="Orden de visualización">
                                        N° {cat.orden || 0}
                                      </div>
                                      <span className="p-1.5 bg-zinc-800/80 text-zinc-300 rounded flex items-center justify-center [&_svg]:h-4 [&_svg]:w-4">
                                        {getCategoryIcon(cat.icono || cat.nombre)}
                                      </span>
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">{cat.nombre}</span>
                                          {cat.active === false ? (
                                            <span className="text-[9px] bg-amber-500/10 text-amber-500 dark:text-amber-400 px-1.5 rounded font-bold uppercase tracking-wider flex items-center gap-1">
                                              <span>👁</span> Oculta en Web
                                            </span>
                                          ) : (
                                            <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-1.5 rounded font-bold uppercase tracking-wider flex items-center gap-1">
                                              <span>✨</span> Visible en Web
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-[10px] text-zinc-500 font-semibold mt-0.5">
                                          {catProductsCount} {catProductsCount === 1 ? "producto asignado" : "productos asignados"}
                                        </p>
                                      </div>
                                    </div>

                                    {/* Action items */}
                                    <div className="flex items-center gap-1.5">
                                      <button
                                        onClick={() => {
                                          const nextActiveStatus = cat.active === false ? true : false;
                                          const updatedDbCategories = (store.dbCategories || []).map(c => {
                                            if (c.id === cat.id) return { ...c, active: nextActiveStatus };
                                            return c;
                                          });
                                          saveStateToServer({ ...store, dbCategories: updatedDbCategories });
                                        }}
                                        className={`text-[10.5px] font-bold py-1 px-2.5 rounded-lg border transition cursor-pointer ${
                                          cat.active === false
                                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                                            : "border-zinc-750 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-450 hover:text-white"
                                        }`}
                                      >
                                        {cat.active === false ? "Mostrar en Web" : "Ocultar de Web"}
                                      </button>
                                      
                                      <button
                                        onClick={() => handleStartEditCategory(cat)}
                                        className="p-1.5 rounded bg-zinc-850 hover:bg-zinc-700 text-zinc-300 transition cursor-pointer"
                                        title="Editar Categoría"
                                      >
                                        <Edit className="h-3.5 w-3.5" />
                                      </button>
                                      
                                      <button
                                        onClick={() => handleDeleteCategory(cat.id)}
                                        className="p-1.5 rounded bg-red-500/10 hover:bg-red-500 hover:text-white text-red-400 transition cursor-pointer"
                                        title="Eliminar Categoría"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Subcategories list box inside parent Category */}
                                  <div className="pl-6 border-l border-dashed border-zinc-200 dark:border-zinc-800 flex flex-col gap-2 mt-1">
                                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Subcategorías Relacionadas</span>
                                    
                                    {children.length === 0 ? (
                                      <p className="text-[10px] text-zinc-500 italic">No hay subcategorías asignadas.</p>
                                    ) : (
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                                        {children.map((sub) => {
                                          const subProductsCount = store.products.filter(p => p.subcategoria_id === sub.id).length;
                                          return (
                                            <div key={sub.id} className="p-2.5 bg-slate-50 dark:bg-zinc-900/60 rounded-xl border border-slate-100 dark:border-zinc-850/40 flex items-center justify-between">
                                              <div className="min-w-0">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                  <p className="text-xs font-semibold truncate text-slate-900 dark:text-zinc-300">{sub.nombre}</p>
                                                  {sub.active === false ? (
                                                    <span className="text-[7.5px] bg-amber-500/10 text-amber-500 px-1 py-0.2 rounded font-bold uppercase tracking-wider font-mono">Oculta</span>
                                                  ) : (
                                                    <span className="text-[7.5px] bg-emerald-500/10 text-emerald-400 px-1 py-0.2 rounded font-bold uppercase tracking-wider font-mono">Visible</span>
                                                  )}
                                                </div>
                                                <span className="text-[9px] text-zinc-500">
                                                  {subProductsCount} {subProductsCount === 1 ? "producto" : "productos"}
                                                </span>
                                              </div>
                                              
                                              <div className="flex items-center gap-1 shrink-0 ml-2">
                                                <button
                                                  onClick={() => {
                                                    const nextActiveStatus = sub.active === false ? true : false;
                                                    const updatedDbSubcategories = (store.dbSubcategories || []).map(s => {
                                                      if (s.id === sub.id) return { ...s, active: nextActiveStatus };
                                                      return s;
                                                    });
                                                    saveStateToServer({ ...store, dbSubcategories: updatedDbSubcategories });
                                                  }}
                                                  className={`px-1.5 py-0.5 rounded text-[9px] transition cursor-pointer font-bold ${
                                                    sub.active === false 
                                                      ? "bg-amber-500/10 hover:bg-amber-500 hover:text-white text-amber-500 border border-amber-500/20" 
                                                      : "bg-zinc-800 hover:bg-zinc-750 text-zinc-400 hover:text-white"
                                                  }`}
                                                  title={sub.active === false ? "Mostrar en Web" : "Ocultar en Web"}
                                                >
                                                  {sub.active === false ? "Mostrar" : "Ocultar"}
                                                </button>
                                                <button
                                                  onClick={() => handleStartEditSubcategory(sub)}
                                                  className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-all text-[10px] cursor-pointer"
                                                  title="Renombrar / Mover"
                                                >
                                                  <Edit className="h-3 w-3" />
                                                </button>
                                                <button
                                                  onClick={() => handleDeleteSubcategory(sub.id)}
                                                  className="p-1 rounded bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white transition-all text-[10px] cursor-pointer"
                                                  title="Eliminar Subcategoría"
                                                >
                                                  <Trash2 className="h-3 w-3" />
                                                </button>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 6. PROMOTIONS AND DISCOUNTS PAGE */}
                {adminSection === "promos" && (
                  <div className="space-y-4">
                    <div className="bg-white dark:bg-zinc-950 p-5 rounded-xl border border-slate-200 dark:border-zinc-850 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 border-b border-zinc-800/10 dark:border-zinc-800 pb-3 mb-2">
                      <Tag className="h-4 w-4 text-amber-500" />
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">Sección de Promociones & Cupones</h3>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs leading-relaxed">
                      <div>
                        <strong>¿Cómo funcionan los cupones?</strong> Puedes otorgar a tus clientes el cupón <strong>APEX50</strong> o <strong>DESCUENTO10</strong> para simular un 10% de descuento directo en el importe total de sus pedidos antes de realizar la compra por WhatsApp.
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="showPromoBannerCheck"
                          checked={editingSettings.showPromotionBanner}
                          onChange={(e) => setEditingSettings({ ...editingSettings, showPromotionBanner: e.target.checked })}
                          className="rounded border-zinc-700 bg-zinc-900 text-indigo-500 focus:ring-0 cursor-pointer h-4 w-4"
                        />
                        <label htmlFor="showPromoBannerCheck" className="text-xs text-zinc-300 font-semibold select-none cursor-pointer">
                          Mostrar barra de promoción cintillo superior en todo el eCommerce
                        </label>
                      </div>

                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5">Texto de Ofertas & Descuentos en Barra Superior</label>
                        <input
                          type="text"
                          value={editingSettings.promotionBannerText}
                          onChange={(e) => setEditingSettings({ ...editingSettings, promotionBannerText: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white"
                          placeholder="p.ej. ¡Envío gratuito en compras superiores a $50!"
                        />
                      </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                      <button
                        onClick={handleSaveSettings}
                        disabled={saving}
                        className="py-2.5 px-6 bg-blue-600 text-white rounded-lg font-semibold text-xs transition-all hover:bg-blue-700 hover:scale-[1.01] cursor-pointer"
                      >
                        <span>{saving ? "Salvando..." : "Guardar Promociones"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Dynamic coupon CRUD card */}
                  <div className="bg-white dark:bg-zinc-950 p-5 rounded-xl border border-slate-200 dark:border-zinc-850 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 border-b border-zinc-800/10 dark:border-zinc-800 pb-3 mb-2">
                      <Percent className="h-4 w-4 text-emerald-500" />
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">Crear y Gestionar Cupones de Descuento</h3>
                    </div>

                    <form onSubmit={handleAddCoupon} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end bg-slate-50 dark:bg-zinc-905/30 p-4 rounded-xl border border-slate-100 dark:border-zinc-850/40">
                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5">Código Único (PK/Code)</label>
                        <input
                          type="text"
                          required
                          placeholder="Ej. MASFAST15"
                          value={newCouponCode}
                          onChange={(e) => setNewCouponCode(e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white uppercase font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5">% Descuento Directo</label>
                        <input
                          type="number"
                          required
                          min="1"
                          max="100"
                          placeholder="p.ej. 15"
                          value={newCouponDiscount}
                          onChange={(e) => setNewCouponDiscount(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5">Fecha de Vencimiento</label>
                        <div className="flex gap-2">
                          <input
                            type="date"
                            value={newCouponExpiration}
                            onChange={(e) => setNewCouponExpiration(e.target.value)}
                            className="flex-1 px-3 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white cursor-pointer"
                          />
                          <button
                            type="submit"
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition-all cursor-pointer whitespace-nowrap"
                          >
                            Agregar
                          </button>
                        </div>
                      </div>
                    </form>

                    {/* Coupons List */}
                    <div className="space-y-2 mt-4">
                      <label className="block text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-widest">Cupones Activos Registrados en Base de Datos</label>
                      {!(store.coupons && store.coupons.length > 0) ? (
                        <p className="text-xs text-zinc-500 italic mt-1 bg-slate-50 dark:bg-zinc-900/50 p-3 rounded-lg border border-dashed border-zinc-800">
                          No hay cupones personalizados en la base de datos de Ventas Juem todavía. Puedes crear uno arriba y se validará en vivo en el carrito.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                          {store.coupons.map((c) => {
                            const isExpired = c.expiration_date ? new Date(c.expiration_date).getTime() < Date.now() : false;
                            return (
                              <div key={c.code} className="p-3 bg-slate-50 dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-850 flex items-center justify-between">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-xs font-mono font-black text-indigo-400 uppercase tracking-wide bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded">
                                      {c.code}
                                    </span>
                                    <span className="text-xs font-bold text-emerald-400">
                                      {c.discount_percent}% OFF
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-zinc-400 mt-1">
                                    {c.expiration_date ? (
                                      <span className={isExpired ? "text-red-400 line-through font-semibold" : "text-zinc-400"}>
                                        Vence: {new Date(c.expiration_date).toLocaleDateString()} {isExpired && " (Expirado)"}
                                      </span>
                                    ) : (
                                      <span>Sin límite de vencimiento</span>
                                    )}
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleDeleteCoupon(c.code)}
                                  className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500 hover:text-white text-red-400 transition cursor-pointer"
                                  title="Eliminar Cupón"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

                {/* 9. GESTION DE ALERTAS Y STOCK BAJO (GESTION DEL NEGOCIO) */}
                {adminSection === "stock" && (
                  <div className="space-y-6">
                    
                    {/* Alertas Diagnóstico de Negocio */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-red-500/20 text-red-500 flex items-center justify-center text-lg font-bold">
                          {outOfStockProducts.length}
                        </div>
                        <div>
                          <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-red-500">Sin Stock (Crítico)</h4>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold mt-0.5">Productos agotados</p>
                        </div>
                      </div>

                      <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center text-lg font-bold">
                          {lowStockProducts.length}
                        </div>
                        <div>
                          <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-amber-500">Stock Bajo (Advertencia)</h4>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold mt-0.5">Límite de {lowStockThresholdSetting} u o menos</p>
                        </div>
                      </div>

                      <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-lg font-bold">
                          {store.products.filter(p => p.active !== false && p.stock > lowStockThresholdSetting).length}
                        </div>
                        <div>
                          <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400">Stock Saludable</h4>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold mt-0.5">Niveles de stock correctos</p>
                        </div>
                      </div>
                    </div>

                    {/* Selector de límite de Alerta de Stock Bajo */}
                    <div className="bg-white dark:bg-zinc-950 p-5 rounded-xl border border-slate-200 dark:border-zinc-850 shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Sliders className="h-4.5 w-4.5 text-indigo-500" />
                          <h4 className="font-bold text-xs uppercase tracking-wider text-slate-950 dark:text-zinc-150">Límite de Alerta de Stock Bajo</h4>
                        </div>
                        <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 font-bold">Configuración persistente</span>
                      </div>
                      
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed font-semibold">
                        Define las unidades a partir de las cuales se marcará de forma automática el aviso "ÚLTIMAS" en tu catálogo público y se detonarán alertas de reposición en este espacio de gestión del negocio.
                      </p>

                      <div className="flex items-center gap-4 pt-1.5">
                        <input
                          type="range"
                          min="1"
                          max="25"
                          value={lowStockThresholdSetting}
                          onChange={(e) => handleSaveLowStockThreshold(Number(e.target.value))}
                          className="flex-1 accent-indigo-600 h-2 bg-slate-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="px-3.5 py-1.5 bg-indigo-600 text-white font-mono font-bold text-xs rounded-lg shrink-0 shadow-md shadow-indigo-500/10">
                          {lowStockThresholdSetting} unidades
                        </div>
                      </div>
                    </div>

                    {/* Alertas List View & Interactive Stock Adjustment */}
                    <div className="bg-white dark:bg-zinc-950 rounded-xl border border-slate-200 dark:border-zinc-850 shadow-sm overflow-hidden space-y-4">
                      
                      {/* Filter Pills with labels and counters */}
                      <div className="p-4 border-b border-slate-200 dark:border-zinc-850 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                          <h4 className="font-bold text-xs uppercase tracking-wider text-slate-550">Registro del Inventario de Negocio</h4>
                        </div>

                        {/* Switch bar */}
                        <div className="flex flex-wrap gap-1">
                          {[
                            { id: "alerts", label: "Solo Alertas ⚠", count: totalStockAlerts, color: "text-red-500" },
                            { id: "outOfStock", label: "Agotado", count: outOfStockProducts.length, color: "text-red-400" },
                            { id: "lowStock", label: "Stock Bajo", count: lowStockProducts.length, color: "text-amber-400" },
                            { id: "all", label: "Todo el Catálogo", count: store.products.filter(p => p.active !== false).length, color: "text-zinc-450" }
                          ].map(tab => (
                            <button
                              key={tab.id}
                              onClick={() => setStockFilterTab(tab.id as any)}
                              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                stockFilterTab === tab.id
                                  ? "bg-indigo-600 text-white shadow"
                                  : "border border-slate-200 dark:border-zinc-850 text-zinc-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-900"
                              }`}
                            >
                              <span>{tab.label}</span>
                              <span className={`px-1 rounded-md text-[10px] font-mono ${stockFilterTab === tab.id ? 'bg-indigo-700 text-white' : 'bg-slate-100 dark:bg-zinc-900'}`}>{tab.count}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Filter products matching state tab picker */}
                      {(() => {
                        let displayedStockProducts = store.products.filter(p => p.active !== false);
                        if (stockFilterTab === "alerts") {
                          displayedStockProducts = displayedStockProducts.filter(p => p.stock <= lowStockThresholdSetting);
                        } else if (stockFilterTab === "outOfStock") {
                          displayedStockProducts = displayedStockProducts.filter(p => p.stock <= 0);
                        } else if (stockFilterTab === "lowStock") {
                          displayedStockProducts = displayedStockProducts.filter(p => p.stock > 0 && p.stock <= lowStockThresholdSetting);
                        }

                        if (displayedStockProducts.length === 0) {
                          return (
                            <div className="p-8 text-center text-zinc-500">
                              <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                              <p className="text-xs font-bold">¡Tu negocio está completamente al día!</p>
                              <p className="text-[11px] text-zinc-400 mt-0.5">Ningún artículo registrado coincide con los filtros de alertas seleccionados.</p>
                            </div>
                          );
                        }

                        return (
                          <div className="divide-y divide-slate-150 dark:divide-zinc-850">
                            {displayedStockProducts.map((p) => {
                              const isOutOfStock = p.stock <= 0;
                              const isLowStock = p.stock > 0 && p.stock <= lowStockThresholdSetting;
                              const hasVariants = p.variants && p.variants.length > 0;

                              return (
                                <div key={p.id} className="p-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between hover:bg-slate-100/50 dark:hover:bg-zinc-900/10 transition">
                                  
                                  {/* Thumbnail & Title metadata */}
                                  <div className="flex gap-3 items-center min-w-0 flex-1">
                                    <img
                                      src={p.imageUrl || "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=100&q=80"}
                                      alt={p.name}
                                      className="h-9 w-9 rounded-lg object-cover bg-zinc-850 shrink-0 border border-slate-200 dark:border-zinc-800"
                                    />
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <h5 className="font-bold text-xs text-slate-900 dark:text-zinc-200 truncate">{p.name}</h5>
                                        {p.paused && (
                                          <span className="bg-amber-500/15 text-amber-500 text-[8px] font-bold uppercase py-0.5 px-1.5 rounded tracking-wide border border-amber-500/20">
                                            Pausado
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-[10px] text-zinc-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                                        <span className="bg-slate-100 dark:bg-zinc-900 px-1.5 py-0.5 rounded font-bold uppercase">{p.category}</span>
                                        {p.categorias_adicionales && p.categorias_adicionales.map(catId => {
                                          const name = (store.dbCategories || []).find(c => c.id === catId)?.nombre;
                                          if (!name) return null;
                                          return (
                                            <span key={catId} className="bg-[#5346ff]/10 text-[#5346ff] border border-[#5346ff]/25 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase">
                                              + {name}
                                            </span>
                                          );
                                        })}
                                        {p.subcategorias_adicionales && p.subcategorias_adicionales.map(subId => {
                                          const name = (store.dbSubcategories || []).find(s => s.id === subId)?.nombre;
                                          if (!name) return null;
                                          return (
                                            <span key={subId} className="bg-teal-550/15 text-teal-605 border border-teal-500/25 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase dark:bg-teal-500/10 dark:text-teal-400">
                                              + {name}
                                            </span>
                                          );
                                        })}
                                        <span>Precio: <strong>${p.price.toFixed(2)}</strong></span>
                                        {hasVariants && (
                                          <span className="text-zinc-500">({p.variants?.length} combinaciones registradas)</span>
                                        )}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Current Stock status column */}
                                  <div className="flex items-center gap-4 shrink-0 mt-2 md:mt-0 w-full md:w-auto justify-between md:justify-end">
                                    <div className="text-left md:text-right">
                                      {isOutOfStock ? (
                                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 text-[10px] font-extrabold tracking-wide uppercase border border-red-500/25">
                                          ● SIN STOCK
                                        </span>
                                      ) : isLowStock ? (
                                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-extrabold tracking-wide uppercase border border-amber-500/25">
                                          ⚠ BAJO STOCK ({p.stock}u)
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-extrabold tracking-wide uppercase border border-emerald-500/25">
                                          ✓ CORRECTO
                                        </span>
                                      )}
                                      
                                      {/* Sub-variant status descriptions if any */}
                                      {hasVariants && (
                                        <div className="text-[9px] text-indigo-400 font-bold mt-1 font-mono">
                                          {p.variants?.map((v, idx) => (
                                            <span key={idx} className="block">
                                              Talle {v.size} / {v.color}: {v.stock <= 0 ? "Agotado 🚫" : v.stock <= lowStockThresholdSetting ? `Bajo (${v.stock}u) ⚠` : `${v.stock}u` }{typeof v.price === "number" && v.price > 0 ? ` | Precio: $${v.price}` : ""}
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                    </div>

                                    {/* Action Counter Stock Changer */}
                                    <div>
                                      {hasVariants ? (
                                        <div className="text-[10px] bg-indigo-500/5 text-indigo-400 border border-indigo-500/10 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 font-semibold">
                                          <span>Posee Variantes.</span>
                                          <button
                                            onClick={() => {
                                              setEditingProduct(p);
                                              setAdminSection("products");
                                            }}
                                            className="underline text-[10px] text-indigo-300 font-extrabold hover:text-indigo-200 cursor-pointer"
                                          >
                                            Editar Ficha ×
                                          </button>
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-1 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-850 p-1 rounded-xl">
                                          <button
                                            onClick={() => handleQuickUpdateStock(p.id, p.stock - 1)}
                                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-750 text-xs font-bold font-mono text-zinc-550 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-zinc-750 transition active:scale-90"
                                            title="Descontar 1 unidad"
                                          >
                                            -
                                          </button>
                                          <input
                                            type="number"
                                            value={p.stock}
                                            onChange={(e) => handleQuickUpdateStock(p.id, Math.max(0, parseInt(e.target.value) || 0))}
                                            className="w-10 text-center font-mono font-extrabold text-xs bg-transparent border-0 outline-none p-0 focus:ring-0 text-slate-900 dark:text-white"
                                          />
                                          <button
                                            onClick={() => handleQuickUpdateStock(p.id, p.stock + 1)}
                                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-750 text-xs font-bold font-mono text-zinc-550 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-zinc-750 transition active:scale-90"
                                            title="Sumar 1 unidad"
                                          >
                                            +
                                          </button>
                                        </div>
                                      )}
                                    </div>

                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}

                    </div>
                  </div>
                )}

                {/* 10. ACCESS SECURITY & CREDENTIALS CONFIG */}
                {adminSection === "security" && (
                  <SecurityPanel
                    authToken={authToken}
                    showAdminToast={showAdminToast}
                    setAuthToken={setAuthToken}
                  />
                )}
              </div>

              {/* SECTION B: LIVE PREVIEW COLUMN - EXTREMELY SOPHISTICATED LOOK */}
              <div className="hidden lg:flex lg:col-span-5 flex-col gap-3 sticky top-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                    <Smartphone className="h-4 w-4" />
                    <span>Vista Previa del Dispositivo</span>
                  </label>
                  <span className="text-[10px] px-2 py-0.5 bg-indigo-600 text-white rounded-full font-mono font-bold uppercase">En vivo</span>
                </div>

                {/* Simulated frame preview of store */}
                <div className="w-full aspect-[4/5] bg-zinc-950 rounded-3xl border-8 border-zinc-800 shadow-2xl relative overflow-hidden flex flex-col scale-100 origin-top">
                  
                  {/* Mockup Store Header */}
                  <div className="h-11 border-b border-zinc-900 flex items-center justify-between px-3 bg-zinc-900/60 select-none">
                    <div className="text-white font-extrabold italic text-xs tracking-tight">{editingSettings.siteTitle}</div>
                    <div className="flex gap-2 text-zinc-500 text-[9px] font-semibold">
                      <span>Catálogo</span>
                      <span className="theme-text-primary">Cart (1)</span>
                    </div>
                  </div>

                  {/* Mockup visual representation in mini card */}
                  <div className="p-4 flex-1 overflow-y-auto space-y-3 bg-zinc-950 text-white flex flex-col justify-between">
                    <div>
                      {/* Banner teaser */}
                      <div className="relative h-20 rounded-lg overflow-hidden bg-zinc-900 mb-2">
                        <img
                          src={editingSettings.bannerImageUrl}
                          alt="preview mini layout"
                          className="w-full h-full object-cover opacity-50"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 to-transparent"></div>
                        <div className="absolute bottom-1.5 left-2">
                          <h4 className="text-[10px] font-bold text-white line-clamp-1">{editingSettings.bannerTitle}</h4>
                          <span className="text-[8px] text-zinc-400 font-light block line-clamp-1">{editingSettings.bannerSubtitle}</span>
                        </div>
                      </div>

                      {/* Item representation */}
                      {adminSection === "products" && editingProduct ? (
                        <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
                          <img
                            src={editingProduct.imageUrl || UNSPLASH_TEMPLATES[0].url}
                            alt="editing preview"
                            className="w-full h-24 object-cover rounded-md"
                          />
                          <div>
                            <span className="text-[8px] uppercase tracking-widest text-zinc-500 font-bold">{editingProduct.category || "Categoría"}</span>
                            <h5 className="text-[11px] font-bold line-clamp-1 text-zinc-100">{editingProduct.name || "Sin título"}</h5>
                            <div className="flex items-baseline gap-1.5 mt-1">
                              <span className="text-[12px] font-mono font-black text-indigo-400">${Number(editingProduct.price || 0).toFixed(2)}</span>
                              {editingProduct.originalPrice && (
                                <span className="text-[8px] text-zinc-500 line-through">${Number(editingProduct.originalPrice).toFixed(2)}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-850 space-y-2">
                          <img
                            src="https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80"
                            alt="editing preview item 1"
                            className="w-full h-24 object-cover rounded-md"
                          />
                          <div>
                            <span className="text-[8px] uppercase tracking-widest text-zinc-500 font-bold">Moda / Calidad</span>
                            <h5 className="text-[11px] font-bold line-clamp-1 text-zinc-100">Chaqueta Bomber Premium</h5>
                            <span className="text-[12px] font-mono font-black text-indigo-400">$89.99</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Footer query tool */}
                    <div className="space-y-1.5 mt-auto">
                      <div className="w-full py-1.5 bg-indigo-600 text-white font-extrabold text-center rounded text-[10px] uppercase">Añadir al Carrito</div>
                      <div className="w-full py-1.5 bg-[#25D366] text-white font-bold text-center rounded text-[9px] uppercase flex items-center justify-center gap-1 select-none">
                        <MessageCircle className="w-3.5 h-3.5 fill-current" />
                        Averiguar por WhatsApp
                      </div>
                    </div>
                  </div>

                  {/* Watermark badge rotate 45 degrees */}
                  <div className="absolute top-1/2 left-0 right-0 py-1 bg-indigo-600 text-white text-[8px] text-center uppercase tracking-widest font-black rotate-[-35deg] opacity-20 pointer-events-none">
                    Preview de Diseñador
                  </div>
                </div>
              </div>
              </div>
            )}
          </main>
        </div>
      )}

      {/* RENDER MODAL SECURE LOGIN FOR ADMIN */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 w-full max-w-sm text-center relative shadow-2xl">
            <h3 className="text-xl font-bold mb-1 tracking-tight text-white flex items-center justify-center gap-2">
              <Settings className="h-5 w-5 text-blue-500" />
              <span>Gestión de Tienda</span>
            </h3>
            <p className="text-zinc-400 text-xs mb-6">Inicia sesión de administrador con tus credenciales seguras de sincronización.</p>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="text-left space-y-1">
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500">Nombre de Usuario</label>
                <input
                  required
                  type="text"
                  placeholder="ej. Juem"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white outline-none focus:border-zinc-700"
                />
              </div>

              <div className="text-left space-y-1">
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500">Contraseña Segura</label>
                <input
                  required
                  type="password"
                  placeholder="••••••••"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white outline-none focus:border-zinc-700"
                />
              </div>

              {loginError && (
                <p className="text-xs text-red-400 text-center font-semibold">❌ {loginError}</p>
              )}

              <button
                type="submit"
                className="w-full py-2.5 px-4 theme-btn-primary rounded-xl text-xs font-bold tracking-wider uppercase mt-2 shadow-lg cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Sincronizar Panel</span>
              </button>
            </form>

            <button
              onClick={() => {
                setIsLoginModalOpen(false);
                setLoginError("");
              }}
              className="mt-4 text-xs text-zinc-500 hover:text-zinc-300 underline"
            >
              Cerrar y volver a Tienda
            </button>
          </div>
        </div>
      )}

      {/* Cart Drawer element */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveCartItem}
        settings={store.settings}
        onClearCart={handleClearCart}
        coupons={store.coupons}
      />

      {/* Mobile Drawer Navigation Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs md:hidden"
            />

            {/* Slide-out Menu Panel */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className={`fixed inset-y-0 left-0 z-50 w-4/5 max-w-sm h-full flex flex-col p-6 shadow-2xl border-r md:hidden overflow-y-auto ${
                store.settings.themeMode === "dark"
                  ? "bg-zinc-950 border-zinc-800 text-white"
                  : "bg-white border-slate-200 text-slate-800"
              }`}
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-200/55 dark:border-zinc-800/55">
                <div 
                  onClick={() => {
                    navigateToProductRoute("todos", "all");
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-2 cursor-pointer select-none"
                >
                  {store.settings.logoType === "image" && store.settings.logoImageUrl ? (
                    <img
                      src={store.settings.logoImageUrl}
                      alt={store.settings.siteTitle}
                      className="w-8 h-8 rounded-xl object-cover shadow-sm"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-8 h-8 theme-btn-primary rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm">
                      {store.settings.logoText || "J"}
                    </div>
                  )}
                  <span className="font-bold text-base tracking-tight">{store.settings.siteTitle}</span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`p-2 rounded-xl transition cursor-pointer ${
                    store.settings.themeMode === "dark"
                      ? "hover:bg-zinc-900 text-zinc-400 hover:text-white"
                      : "hover:bg-slate-150 text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Categories Navigation Block */}
              <div className="flex-1 space-y-6">
                <div>
                  <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-3">
                    Explorar Categorías
                  </h3>
                  <div className="flex flex-col gap-1.5">
                    {/* All Catalog option */}
                    <button
                      onClick={() => {
                        navigateToProductRoute("todos", "all");
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full text-left flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        selectedCategory === "todos"
                          ? "theme-btn-primary text-white"
                          : store.settings.themeMode === "dark"
                          ? "bg-zinc-900/50 hover:bg-zinc-900 text-zinc-300 hover:text-white"
                          : "bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Grid className="h-4 w-4" />
                        <span>Ver todo el catálogo</span>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 opacity-60" />
                    </button>

                    {/* Main Categories list */}
                    {(store.dbCategories || [])
                      .sort((a, b) => (a.orden || 0) - (b.orden || 0))
                      .map((catObj) => {
                        const isCatActive = selectedCategory === catObj.nombre;
                        const dbSubs = (store.dbSubcategories || []).filter(sub => sub.categoria_id === catObj.id);
                        
                        return (
                          <div key={catObj.id} className="space-y-1">
                            <button
                              onClick={() => {
                                navigateToProductRoute(catObj.id, "all");
                                setIsMobileMenuOpen(false);
                              }}
                              className={`w-full text-left flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                isCatActive
                                  ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
                                  : store.settings.themeMode === "dark"
                                  ? "hover:bg-zinc-900 text-zinc-300 hover:text-white"
                                  : "hover:bg-slate-105 text-slate-700 hover:text-slate-900"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="[&_svg]:h-4 [&_svg]:w-4 opacity-70">
                                  {getCategoryIcon(catObj.icono || catObj.nombre)}
                                </span>
                                <span>{catObj.nombre}</span>
                              </div>
                              <ChevronRight className="h-3.5 w-3.5 opacity-40" />
                            </button>

                            {/* Mobile nested Subcategories */}
                            {dbSubs.length > 0 && (
                              <div className="pl-6 border-l border-zinc-200 dark:border-zinc-805 ml-5 py-0.5 space-y-1">
                                {dbSubs.map((sub) => {
                                  const isSubActive = isCatActive && selectedSubcategory === sub.id;
                                  return (
                                    <button
                                      key={sub.id}
                                      onClick={() => {
                                        navigateToProductRoute(catObj.id, sub.id);
                                        setIsMobileMenuOpen(false);
                                      }}
                                      className={`w-full text-left py-1.5 px-2 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                                        isSubActive
                                          ? "text-indigo-400 font-bold"
                                          : "text-zinc-500 hover:text-zinc-300"
                                      }`}
                                    >
                                      • {sub.nombre}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Mobile Admin panel shortcut triggers */}
                <div>
                  <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-3">
                    Herramientas de Cuenta
                  </h3>
                  <div className="flex flex-col gap-1.5">
                    {authToken ? (
                      <>
                        <button
                          onClick={() => {
                            setActiveTab("admin");
                            window.history.pushState(null, "", `/admin/${adminSection}`);
                            setIsMobileMenuOpen(false);
                          }}
                          className={`w-full text-left flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                            activeTab === "admin"
                              ? "bg-indigo-600/20 text-indigo-400"
                              : store.settings.themeMode === "dark"
                              ? "bg-zinc-900/40 text-zinc-300 hover:bg-zinc-900"
                              : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          <Settings className="h-4 w-4 text-indigo-400" />
                          <span>Panel de Control Admin</span>
                        </button>
                        <button
                          onClick={() => {
                            handleLogout();
                            setIsMobileMenuOpen(false);
                          }}
                          className="w-full text-left flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-red-400 bg-red-500/10 hover:bg-red-500/15 transition-colors cursor-pointer animate-fade-in"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>Cerrar Sesión</span>
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="pt-4 border-t border-zinc-200/50 dark:border-zinc-800/50 text-center text-[10px] space-y-1.5">
                {!authToken && (
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setIsLoginModalOpen(true);
                    }}
                    className="text-zinc-500 dark:text-zinc-500 hover:underline text-[10px] font-semibold tracking-wide cursor-pointer transition select-none"
                  >
                    🔐 Acceso Administrativo
                  </button>
                )}
                <p className="opacity-60">&copy; 2026 {store.settings.siteTitle}</p>
                <p className="opacity-40 text-[9px] mt-0.5">Tienda Virtual Optimizada</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>



      {/* Elegantes Alertas y Confirmaciones Personalizadas (Elimina bloqueos de iframe/sandboxing de alert/confirm) */}
      {customAlert && customAlert.show && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in animate-duration-150">
          <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-850 p-6 rounded-2xl max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-amber-500">
              <span className="p-2 bg-amber-500/10 rounded-lg">
                <AlertCircle className="h-5 w-5" />
              </span>
              <h4 className="font-bold text-sm text-slate-950 dark:text-white uppercase tracking-wider">{customAlert.title}</h4>
            </div>
            <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed font-semibold">{customAlert.message}</p>
            <button
              onClick={() => setCustomAlert(null)}
              className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-white font-bold rounded-lg text-xs transition cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {customConfirm && customConfirm.show && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in animate-duration-150">
          <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-850 p-6 rounded-2xl max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-zinc-800 dark:text-white">
              <span className="p-2 bg-neutral-500/10 rounded-lg">
                <HelpCircle className="h-5 w-5 text-blue-500" />
              </span>
              <h4 className="font-bold text-sm text-slate-950 dark:text-white uppercase tracking-wider">{customConfirm.title}</h4>
            </div>
            <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed font-semibold">{customConfirm.message}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setCustomConfirm(null)}
                className="flex-1 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-800 dark:text-white font-bold rounded-lg text-xs transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  customConfirm.onConfirm();
                  setCustomConfirm(null);
                }}
                className="flex-1 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs transition cursor-pointer"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Botón Flotante de WhatsApp - Siempre Visible en Storefront */}
      {activeTab === "storefront" && (
        <WhatsAppWidget
          whatsappNumber={store.settings.whatsappNumber}
          siteTitle={store.settings.siteTitle}
        />
      )}

      <AnimatePresence>
        {adminToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-[99999] p-4 rounded-xl shadow-2xl border flex items-center gap-3 bg-white/95 dark:bg-zinc-950/95 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
          >
            <span className="p-1 px-1.5 bg-emerald-500/10 text-emerald-500 rounded font-bold text-xs">✓</span>
            <span className="font-semibold text-xs">{adminToast.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
