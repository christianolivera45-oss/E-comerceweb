export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  categories: string[];
  images: string[];
  stock: number;
  featured: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export interface Category {
  id: string;
  name: string;
  imageUrl?: string;
}

export interface Promotion {
  id: string;
  title: string;
  description: string;
  code: string;
  discountPercent: number;
  active: boolean;
}

export interface Settings {
  title: string;
  description: string;
  whatsappNumber: string;
  themeColor: string;
  heroTitle: string;
  heroSubtitle: string;
  heroBannerUrl: string;
  promoBannerText: string;
  updatedAt?: any;
}

export interface CartItem {
  product: Product;
  quantity: number;
}
