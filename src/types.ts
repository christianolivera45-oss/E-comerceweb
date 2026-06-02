export interface ProductVariant {
  id?: string;
  sku?: string;
  size: string;
  color: string;
  colorCode?: string; // e.g. '#2563eb'
  priceDelta?: number;
  stock: number;
  imageUrl?: string; // Image associated with this color/variant
  price?: number; // Custom override price
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number; // For sale/discount prices
  category: string; // Keep for fallback compatibility
  categoria_id?: string; // Main Category ID
  subcategoria_id?: string; // Subcategory ID
  categorias_adicionales?: string[]; // Additional Category IDs
  subcategorias_adicionales?: string[]; // Additional Subcategory IDs
  imageUrl: string;
  imagenes?: string[]; // List of multiple product images
  variants?: ProductVariant[]; // Advanced dyn sub-variants with stock
  stock: number;
  featured: boolean;
  createdAt: string;
  sizes?: string[];
  colors?: string[];
  active?: boolean; // Logical soft delete
  paused?: boolean; // Pause in eCommerce store front
  is3D?: boolean; // Is a 3D printed product with custom logic
  hoursPerUnit?: number; // Hours needed to 3D print one unit
}

export interface HeroSlide {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  buttonText?: string;
  buttonLink?: string;
}

export interface DeliveryMethod {
  id: string;
  title: string;
  subtext?: string | null;
  iconType: string;
}

export interface SiteSettings {
  siteTitle: string;
  siteSubtitle: string;
  bannerTitle: string;
  bannerSubtitle: string;
  bannerImageUrl: string;
  whatsappNumber: string; // WhatsApp context for messaging
  primaryColor: string; // Core branding color
  accentColor: string; // Interactive elements color
  themeMode: 'dark' | 'light';
  promotionBannerText: string;
  showPromotionBanner: boolean;
  heroSlides?: HeroSlide[];
  logoType?: 'text' | 'image';
  logoText?: string;
  logoImageUrl?: string;
  footerCol1Title?: string;
  footerCol1Text?: string;
  footerCol2Title?: string;
  footerCol2Text?: string;
  footerCol3Title?: string;
  footerCol3Text?: string;
  footerCopyright?: string;
  lowStockThreshold?: number;
  mercadopagoActive?: boolean;
  mercadopagoMessage?: string;
  mercadopagoPublicKey?: string;
  mercadopagoAccessToken?: string;
  exchangeRate?: number;
  transferActive?: boolean;
  transferDetails?: string;
  cashActive?: boolean;
  cashMessage?: string;
  pickupActive?: boolean;
  pickupAddress?: string;
  pickupHours?: string;
  pickupSuccessMessage?: string;
  deliveryActive?: boolean;
  deliveryMethods?: DeliveryMethod[];
  invoiceOptionActive?: boolean;
  defaultFirstName?: string;
  defaultLastName?: string;
  defaultPhone?: string;
}

export interface Category {
  id: string;
  nombre: string;
  icono: string; // icon name e.g. "Shirt", "Smartphone", "Sparkles", "Home"
  orden: number;
  active?: boolean; // toggle visibility on/off
}

export interface Subcategory {
  id: string;
  nombre: string;
  categoria_id: string;
  active?: boolean;
}

export interface Coupon {
  code: string;
  discount_percent: number;
  expiration_date?: string; // ISO string on client side
  active?: boolean;
}

export interface AdminCredentials {
  username: string;
  passwordHash: string;
  sessionToken?: string;
  salt?: string;
}

export interface ShopState {
  products: Product[];
  categories: string[]; // compatible fallback
  dbCategories?: Category[]; // dynamic main categories
  dbSubcategories?: Subcategory[]; // dynamic subcategories
  settings: SiteSettings;
  adminCredentials?: AdminCredentials;
  coupons?: Coupon[];
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
}

export function is3DProduct(product: Product): boolean {
  if (!product) return false;
  if (product.is3D === true) return true;
  
  const name = (product.name || "").toLowerCase();
  const desc = (product.description || "").toLowerCase();
  const cat = (product.category || "").toLowerCase();
  const catId = (product.categoria_id || "").toLowerCase();

  const matchesText = (txt: string) => {
    return (
      txt.includes("3d") || 
      txt.includes("3 d") ||
      txt.includes("impresión") || 
      txt.includes("impresion") ||
      txt.includes("impreción") ||
      txt.includes("imprecion")
    );
  };

  return matchesText(name) || matchesText(desc) || matchesText(cat) || matchesText(catId);
}
