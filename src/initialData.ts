import { Product, Category, Settings, Promotion } from './types';

export const INITIAL_CATEGORIES: Category[] = [
  {
    id: 'ropa',
    name: 'Ropa',
    imageUrl: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=400&auto=format&fit=crop&q=80'
  },
  {
    id: 'electronica',
    name: 'Artículos Electrónicos',
    imageUrl: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&auto=format&fit=crop&q=80'
  },
  {
    id: 'accesorios',
    name: 'Accesorios',
    imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&auto=format&fit=crop&q=80'
  },
  {
    id: 'otros',
    name: 'Variados',
    imageUrl: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&auto=format&fit=crop&q=80'
  }
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod1',
    name: 'Campera de Cuero Premium Black',
    description: 'Campera de cuero 100% genuino de oveja. Corte entallado y moderno. Costuras reforzadas, cierres metálicos YKK de alta resistencia y forrería interna satinada ultra-suave. Especial para lucir un look urbano sofisticado de día o de noche.',
    price: 189000,
    originalPrice: 245000,
    categories: ['ropa'],
    images: [
      'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1521223890158-f9f7c3d5ded1?w=500&auto=format&fit=crop&q=80'
    ],
    stock: 12,
    featured: true
  },
  {
    id: 'prod2',
    name: 'Remera Minimalist Over-Fit Algodón',
    description: 'Nuestra remera icónica oversize de cuello redondo grueso (rib 3cm). Confeccionada con algodón peinado premium de 20/1 de trama pesada. Tacto frío, caída elegante y pre-encogida para garantizar un calce inmejorable lavado tras lavado.',
    price: 32000,
    originalPrice: 38000,
    categories: ['ropa'],
    images: [
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=500&auto=format&fit=crop&q=80'
    ],
    stock: 25,
    featured: true
  },
  {
    id: 'prod3',
    name: 'Auriculares Inalámbricos ANC Pro Studio',
    description: 'Auriculares de diadema con cancelación activa de ruido híbrida de hasta 40dB. Drivers dinámicos de 40mm para agudos nítidos y graves corporales balanceados. Conexión Bluetooth 5.2 multipunto, batería recargable de 45 horas continuas de uso con carga tipo C rápida.',
    price: 245000,
    categories: ['electronica'],
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=500&auto=format&fit=crop&q=80'
    ],
    stock: 8,
    featured: true
  },
  {
    id: 'prod4',
    name: 'Cargador Inalámbrico Rápido Magnético 30W',
    description: 'Estación de carga inalámbrica de metal y vidrio templado con imanes de alineación automática MagSafe compatibles. Carga óptima de 15W/30W inteligente con protección técnica inteligente contra sobrecalentamiento y cortocircuitos. Incluye cable siliconado USB-C de 1.5 metros.',
    price: 49000,
    originalPrice: 59000,
    categories: ['electronica'],
    images: [
      'https://images.unsplash.com/photo-1622445262465-2481c4574875?w=500&auto=format&fit=crop&q=80'
    ],
    stock: 18,
    featured: false
  },
  {
    id: 'prod5',
    name: 'Reloj Urbano Cuarzo Minimalist Slate',
    description: 'Reloj de cuarzo japonés con caja de acero inoxidable cepillado de 40mm. Cristal mineral de alta dureza anti-ralladuras y malla intercambiable de cuero engrasado marrón. Confección sumergible 5 ATM con indicadores horarios minimalistas grabados a láser.',
    price: 159000,
    categories: ['accesorios'],
    images: [
      'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?w=500&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1495856458675-048cca5f9dfa?w=500&auto=format&fit=crop&q=80'
    ],
    stock: 7,
    featured: true
  },
  {
    id: 'prod6',
    name: 'Billetera Slim de Cuero RFID Block',
    description: 'Billetera ultrafina de cuero graneado genuino curtido vegetal. Cuenta con extractor rápido de aluminio anodizado para 6 tarjetas de crédito con protección magnética RFID anti-clonaciones, compartimiento trasero para efectivo y bolsillo auxiliar exterior.',
    price: 36000,
    originalPrice: 42000,
    categories: ['accesorios'],
    images: [
      'https://images.unsplash.com/photo-1627124718515-552fd0113d97?w=500&auto=format&fit=crop&q=80'
    ],
    stock: 30,
    featured: false
  }
];

export const INITIAL_SETTINGS: Settings = {
  title: 'Trendify Concept',
  description: 'Tienda de diseño exclusivo de ropa de abrigo, electrónica de vanguardia y accesorios urbanos minimalistas seleccionados de primera línea.',
  whatsappNumber: '541123456789',
  themeColor: '#0f172a', // Slate-900 / Dark theme Slate
  heroTitle: 'Estilo, Calidad & Innovación en un solo lugar',
  heroSubtitle: 'Descubrí piezas curadas de alta calidad para renovar tu look diario y complementar tu ecosistema geek.',
  heroBannerUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&auto=format&fit=crop&q=80',
  promoBannerText: '🔥 ¡CYBERWEEK ACTIVADA! Hasta 20% OFF en Ropa y Electrónica Seleccionada. Pago seguro vía transferencia o WhatsApp.'
};

export const INITIAL_PROMOTIONS: Promotion[] = [
  {
    id: 'promo1',
    title: 'Descuento de Bienvenida',
    description: 'Obtené un 10% de descuento en el total de tu carrito en compras de WhatsApp.',
    code: 'HOLA10',
    discountPercent: 10,
    active: true
  },
  {
    id: 'promo2',
    title: 'Especial Lanzamiento',
    description: 'Disfrutá un 15% off adicional comprando productos de la categoría Tecnología.',
    code: 'TECH15',
    discountPercent: 15,
    active: true
  }
];
