export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number; // For sale/discount prices
  category: string; // Keep for fallback compatibility
  categoria_id?: string; // Main Category ID
  subcategoria_id?: string; // Subcategory ID
  imageUrl: string;
  imagenes?: string[]; // List of multiple product images
  stock: number;
  featured: boolean;
  createdAt: string;
  sizes?: string[];
  colors?: string[];
}

export interface HeroSlide {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
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
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
}
