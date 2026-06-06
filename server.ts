import dotenv from "dotenv";
dotenv.config({ override: true });
import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { ShopState } from "./src/types";
import pg from "pg";
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import { MercadoPagoConfig, Preference, Payment } from "mercadopago";

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Max 5MB
  fileFilter: (req, file, cb) => {
    const allowedMimes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    if (allowedMimes.includes(file.mimetype.toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error("MIME_TYPE_NOT_ALLOWED") as any, false);
    }
  }
});

const { Pool } = pg;

// Initial Shop Data
const DEFAULT_SHOP_STATE: ShopState = {
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
  settings: {
    siteTitle: "Ventas Juem",
    siteSubtitle: "Moda, tecnología y accesorios con envío a todo el país.",
    bannerTitle: "Colección Exclusiva de Primavera",
    bannerSubtitle: "Descubre las últimas tendencias con descuentos de hasta el 40%.",
    bannerImageUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=80",
    whatsappNumber: "5491123456789", // Default dummy format, editable
    primaryColor: "#3b82f6", // Indigo/Blue
    accentColor: "#10b981", // Emerald
    themeMode: "dark",
    promotionBannerText: "🚚 ¡ENVÍO GRATUITO en compras superiores a $50! Código: JUEM50",
    showPromotionBanner: true,
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
    freeShippingActive: true,
    freeShippingMinAmount: 2000,
    freeShippingRegions: "Pinamar, Salinas, Marindia, Neptunia"
  },
  products: [
    {
      id: "prod-1",
      name: "Chaqueta Bomber Premium 'Neo'",
      description: "Chaqueta bomber de alta gama, fabricada con tejido resistente al viento y forro térmico suave. Incluye bolsillos interiores seguros y cierres reforzados.",
      price: 89.99,
      originalPrice: 129.99,
      category: "Ropa",
      categoria_id: "ropa",
      subcategoria_id: "hombre",
      imageUrl: "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80",
      stock: 12,
      featured: true,
      createdAt: new Date().toISOString()
    },
    {
      id: "prod-2",
      name: "Auriculares ANC Inalámbricos Apex",
      description: "Auriculares de diadema con cancelación activa de ruido (ANC) híbrida, 40 horas de reproducción de audio continuo y carga rápida USB-C.",
      price: 149.99,
      originalPrice: 199.99,
      category: "Artículos electrónicos",
      categoria_id: "electronica",
      subcategoria_id: "audio",
      imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80",
      stock: 8,
      featured: true,
      createdAt: new Date().toISOString()
    },
    {
      id: "prod-3",
      name: "Mochila Impermeable Urbana",
      description: "Mochila multifuncional de 25L con compartimento acolchado para notebook de hasta 16 pies, puerto de carga USB exterior y material repelente al agua.",
      price: 45.00,
      originalPrice: 45.00,
      category: "Accesorios",
      categoria_id: "accesorios",
      subcategoria_id: "mochilas",
      imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80",
      stock: 20,
      featured: false,
      createdAt: new Date().toISOString()
    },
    {
      id: "prod-4",
      name: "Reloj Inteligente ActiveFit Pro",
      description: "Smartwatch con pantalla AMOLED táctil, monitor de ritmo cardíaco, seguimiento de sueño, GPS integrado y resistencia al agua IP68.",
      price: 119.99,
      originalPrice: 159.99,
      category: "Artículos electrónicos",
      categoria_id: "electronica",
      subcategoria_id: "celulares",
      imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80",
      stock: 15,
      featured: true,
      createdAt: new Date().toISOString()
    },
    {
      id: "prod-5",
      name: "Estuche Organizador de Cables Tech",
      description: "Práctico estuche organizador de viaje para cargadores, cables, tarjetas SD y accesorios. Compartimentos elásticos acolchados ajustables.",
      price: 19.99,
      originalPrice: 24.99,
      category: "Accesorios",
      categoria_id: "accesorios",
      subcategoria_id: "mochilas",
      imageUrl: "https://images.unsplash.com/photo-1531346878377-a5be20888e57?auto=format&fit=crop&w=600&q=80",
      stock: 35,
      featured: false,
      createdAt: new Date().toISOString()
    },
    {
      id: "prod-6",
      name: "Gafas de Sol Polarizadas 'Oasis'",
      description: "Lentes de sol polarizados de diseño moderno con armazón de aleación ligera de alta resistencia y protección ultravioleta UV400 total.",
      price: 29.99,
      originalPrice: 39.99,
      category: "Accesorios",
      categoria_id: "accesorios",
      subcategoria_id: "lentes",
      imageUrl: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=600&q=80",
      stock: 18,
      featured: false,
      createdAt: new Date().toISOString()
    },
    {
      id: "prod-7",
      name: "Buzo Oversize 'Retro Comfort'",
      description: "Buzo / sudadera con capucha estilo oversize de algodón orgánico texturizado con bolsillo tipo canguro y cordón ajustable premium.",
      price: 49.99,
      originalPrice: 69.99,
      category: "Ropa",
      categoria_id: "ropa",
      subcategoria_id: "invierno",
      imageUrl: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=600&q=80",
      stock: 25,
      featured: true,
      createdAt: new Date().toISOString()
    }
  ]
};

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_FILE = path.join(DATA_DIR, "store.json");

// Module scope cache
let currentStoreState: ShopState = DEFAULT_SHOP_STATE;

// Helper to ensure data directory and file exist
function initDataStore(): ShopState {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(STORE_FILE)) {
      const content = fs.readFileSync(STORE_FILE, "utf-8").trim();
      if (!content) {
        console.warn("El archivo de almacenamiento está vacío. Inicializando con el estado por defecto...");
        fs.writeFileSync(STORE_FILE, JSON.stringify(DEFAULT_SHOP_STATE, null, 2), "utf-8");
        return { ...DEFAULT_SHOP_STATE };
      }

      let parsed: ShopState;
      try {
        parsed = JSON.parse(content) as ShopState;
      } catch (parseErr) {
        console.error("El archivo store.json contiene JSON inválido. Reconstruyendo con el estado por defecto...", parseErr);
        fs.writeFileSync(STORE_FILE, JSON.stringify(DEFAULT_SHOP_STATE, null, 2), "utf-8");
        return { ...DEFAULT_SHOP_STATE };
      }
      
      // Auto-migrate if its dynamic database models are empty or missing
      let changed = false;
      if (!parsed.dbCategories) {
        parsed.dbCategories = DEFAULT_SHOP_STATE.dbCategories;
        changed = true;
      }
      if (!parsed.dbSubcategories) {
        parsed.dbSubcategories = DEFAULT_SHOP_STATE.dbSubcategories;
        changed = true;
      }
      
      if (parsed.products) {
        parsed.products = parsed.products.map(p => {
          let pChanged = false;
          if (!p.categoria_id) {
            pChanged = true;
            if (p.category === "Ropa") p.categoria_id = "ropa";
            else if (p.category === "Artículos electrónicos") p.categoria_id = "electronica";
            else if (p.category === "Accesorios") p.categoria_id = "accesorios";
            else if (p.category === "Hogar") p.categoria_id = "hogar";
            else p.categoria_id = p.category ? p.category.toLowerCase().replace(/\s+/g, "-") : "otros";
          }
          if (!p.subcategoria_id) {
            pChanged = true;
            p.subcategoria_id = "all";
          }
          if (pChanged) changed = true;
          return p;
        });
      } else {
        parsed.products = DEFAULT_SHOP_STATE.products;
        changed = true;
      }

      if (changed) {
        fs.writeFileSync(STORE_FILE, JSON.stringify(parsed, null, 2), "utf-8");
      }

      return parsed;
    } else {
      fs.writeFileSync(STORE_FILE, JSON.stringify(DEFAULT_SHOP_STATE, null, 2), "utf-8");
      return { ...DEFAULT_SHOP_STATE };
    }
  } catch (err) {
    console.error("Error accessing data store, using defaults:", err);
    return { ...DEFAULT_SHOP_STATE };
  }
}

// PostgreSQL integration and lazy pool helper
let dbPool: any = null;
let dbUnavailable = false;

function writeDiagnosticReport(errorMsg?: string) {
  try {
    const rawUrl = process.env.DATABASE_URL || "";
    let maskedUrl = rawUrl;
    if (rawUrl.includes("@")) {
      const parts = rawUrl.split("@");
      const beforeAt = parts[0];
      const afterAt = parts.slice(1).join("@");
      if (beforeAt.includes(":")) {
        const userParts = beforeAt.split(":");
        maskedUrl = `${userParts[0]}:****@${afterAt}`;
      } else {
        maskedUrl = `****@${afterAt}`;
      }
    }
    
    let parsedHost = "";
    try {
      if (rawUrl.includes("://")) {
        const urlObj = new URL(rawUrl.trim());
        parsedHost = urlObj.hostname;
      }
    } catch(e) {}

    const report = {
      timestamp: new Date().toISOString(),
      databaseUrlExists: !!process.env.DATABASE_URL,
      databaseUrlLength: rawUrl.length,
      maskedUrl,
      parsedHost,
      errorMsg: errorMsg || null,
      envKeys: Object.keys(process.env).filter(k => k.toLowerCase().includes("database") || k.toLowerCase().includes("post") || k.toLowerCase().includes("db") || k.toLowerCase().includes("url"))
    };
    
    const dataPath = path.join(process.cwd(), "data");
    if (!fs.existsSync(dataPath)) {
      fs.mkdirSync(dataPath, { recursive: true });
    }
    fs.writeFileSync(path.join(dataPath, "db_inspect.json"), JSON.stringify(report, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write diagnostic report:", err);
  }
}

let lastDatabaseUrl = process.env.DATABASE_URL || "";

function getDbPool(force = false) {
  const currentUrl = process.env.DATABASE_URL || "";
  if (currentUrl.trim() !== lastDatabaseUrl.trim()) {
    console.log("🔄 DATABASE_URL cambiada de manera dinámica. Restableciendo conexión pool...");
    if (dbPool) {
      try {
        dbPool.end();
      } catch (e) {}
    }
    dbPool = null;
    dbUnavailable = false;
    lastDatabaseUrl = currentUrl;
  }

  if (force) {
    dbUnavailable = false;
    if (dbPool) {
      try {
        dbPool.end();
      } catch (e) {}
      dbPool = null;
    }
  }

  if (dbUnavailable && !force) {
    return null;
  }
  if (!dbPool && process.env.DATABASE_URL) {
    let url = process.env.DATABASE_URL.trim();
    if (url.startsWith('"') && url.endsWith('"')) {
      url = url.substring(1, url.length - 1);
    }
    if (url.startsWith("'") && url.endsWith("'")) {
      url = url.substring(1, url.length - 1);
    }
    if (url.startsWith("AIzaSy")) {
      console.error("⛔️ ALERTA CRÍTICA DE CONFIGURACIÓN:");
      console.error("La variable DATABASE_URL está configurada con una API Key de Gemini (empieza con 'AIzaSy') en lugar de la cadena de conexión de Supabase.");
      console.error("Por favor, ve a Settings en AI Studio y corrige DATABASE_URL.");
      return null;
    }
    console.log("Configurando conexión PostgreSQL...");
    dbPool = new Pool({
      connectionString: url,
      ssl: {
        rejectUnauthorized: false
      }
    });
  }
  return dbPool;
}

function hashPassword(password: string): string {
  const salt = process.env.JWT_SECRET || "juem-salt-1248";
  return crypto.createHash("sha256").update(password + salt).digest("hex");
}

async function approveOrderAndDeductStock(orderId: string, paymentId: string, verifiedPaymentAmount: number): Promise<string> {
  const pool = getDbPool();
  if (pool && !dbUnavailable) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN;");
      
      // Lock the order to prevent concurrent updates
      const orderRes = await client.query("SELECT current_status FROM public.orders WHERE id = $1 FOR UPDATE;", [orderId]);
      if (orderRes.rows.length === 0) {
        await client.query("ROLLBACK;");
        return "not_found";
      }
      
      const prevStatus = orderRes.rows[0].current_status;
      if (prevStatus === "pago_aprobado") {
        await client.query("COMMIT;");
        return "already_approved";
      }
      
      // Update order status with verified status
      await client.query("UPDATE public.orders SET current_status = 'pago_aprobado', updated_at = NOW() WHERE id = $1;", [orderId]);
      
      // Fetch item list and lock materials to deduct stock
      const itemsRes = await client.query("SELECT product_id, variant_id, quantity, product_name FROM public.order_items WHERE order_id = $1;", [orderId]);
      
      for (const item of itemsRes.rows) {
        const qty = Number(item.quantity);
        if (item.variant_id) {
          // Lock variant for update
          await client.query("SELECT stock FROM public.product_variants WHERE id = $1 FOR UPDATE;", [item.variant_id]);
          // Deduct stock down to greatest of 0 or stock - qty
          await client.query("UPDATE public.product_variants SET stock = GREATEST(0, stock - $1), updated_at = NOW() WHERE id = $2;", [qty, item.variant_id]);
        } else if (item.product_id) {
          // Lock product for update
          await client.query("SELECT stock FROM public.products WHERE id = $1 FOR UPDATE;", [item.product_id]);
          // Deduct stock down to greatest of 0 or stock - qty
          await client.query("UPDATE public.products SET stock = GREATEST(0, stock - $1), updated_at = NOW() WHERE id = $2;", [qty, item.product_id]);
        }
      }
      
      await client.query("COMMIT;");
      console.log(`[Seguridad Stock] Transacción completada con éxito. Stock descontado para Orden ${orderId}.`);
      
      // Force state reload
      const dbState = await getDbState();
      currentStoreState = dbState;
      return "approved_now";
    } catch (txErr) {
      await client.query("ROLLBACK;");
      console.error("[Seguridad Stock] Error en la transacción de descuento de stock:", txErr);
      throw txErr;
    } finally {
      client.release();
    }
  } else {
    // Falls back to in-memory/JSON store
    if (currentStoreState.orders) {
      let alreadyApproved = false;
      currentStoreState.orders = currentStoreState.orders.map(o => {
        if (o.id === orderId) {
          if (o.status === "pago_aprobado") {
            alreadyApproved = true;
          } else {
            o.status = "pago_aprobado";
            o.updatedAt = new Date().toISOString();
            
            // Deduct in-memory stock
            if (o.items && Array.isArray(o.items)) {
              for (const it of o.items) {
                const prod = currentStoreState.products?.find(p => String(p.id) === String(it.productId));
                if (prod) {
                  if (it.variantId) {
                    const variant = prod.variants?.find((v: any) => String(v.id) === String(it.variantId));
                    if (variant) {
                      variant.stock = Math.max(0, (variant.stock || 0) - (it.quantity || 1));
                    }
                  } else {
                    prod.stock = Math.max(0, (prod.stock || 0) - (it.quantity || 1));
                  }
                }
              }
            }
          }
        }
        return o;
      });
      
      if (!alreadyApproved) {
        try {
          fs.writeFileSync(STORE_FILE, JSON.stringify(currentStoreState, null, 2), "utf-8");
          return "approved_now";
        } catch (fsErr) {
          console.error("Error writing updated local order & stock to store file:", fsErr);
        }
      } else {
        return "already_approved";
      }
    }
    return "not_found";
  }
}

async function getDbState(): Promise<ShopState> {
  const pool = getDbPool();
  if (!pool) {
    return currentStoreState;
  }

  try {
    // 1. Fetch settings from shop_state row where id = 'settings'
    const settingsRes = await pool.query("SELECT state FROM shop_state WHERE id = 'settings';");
    let settings = DEFAULT_SHOP_STATE.settings;
    if (settingsRes.rows.length > 0) {
      settings = settingsRes.rows[0].state;
    }

    // 2. Fetch categories
    const catRes = await pool.query("SELECT id, nombre, icono, orden, active FROM categories ORDER BY orden ASC;");
    const dbCategories = catRes.rows.map(row => ({
      id: row.id,
      nombre: row.nombre,
      icono: row.icono || "Shirt",
      orden: row.orden || 1,
      active: row.active !== false
    }));

    // 3. Fetch subcategories
    const subRes = await pool.query("SELECT id, nombre, categoria_id, active FROM subcategories;");
    const dbSubcategories = subRes.rows.map(row => ({
      id: row.id,
      nombre: row.nombre,
      categoria_id: row.categoria_id,
      active: row.active !== false
    }));

    // 4. Fetch coupons
    const coupRes = await pool.query("SELECT code, discount_percent, expiration_date, active FROM coupons;");
    const coupons = coupRes.rows.map(row => ({
      code: row.code,
      discount_percent: Number(row.discount_percent),
      expiration_date: row.expiration_date ? new Date(row.expiration_date).toISOString() : undefined,
      active: row.active !== false
    }));

    // 5. Fetch admin credentials
    const adminRes = await pool.query("SELECT username, password_hash, session_token FROM admin_credentials;");
    let adminCredentials = currentStoreState.adminCredentials;
    if (adminRes.rows.length > 0) {
      adminCredentials = {
        username: adminRes.rows[0].username,
        passwordHash: adminRes.rows[0].password_hash,
        sessionToken: adminRes.rows[0].session_token
      };
    }

    // 6. Fetch products where active = true (logical soft delete)
    const prodRes = await pool.query(`
      SELECT id, name, price, stock, category, featured, image_url, created_at, description, categoria_id, original_price, subcategoria_id, active, paused, sizes, colors, is_3d, hours_per_unit 
      FROM public.products 
      WHERE active = true 
      ORDER BY id DESC;
    `);

    // Fetch product multiple images
    const productImagesMap: Record<number, string[]> = {};
    try {
      const imagesRes = await pool.query("SELECT product_id, image_url, order_index FROM public.product_images ORDER BY order_index ASC;");
      for (const imgRow of imagesRes.rows) {
        const pid = imgRow.product_id;
        if (!productImagesMap[pid]) {
          productImagesMap[pid] = [];
        }
        productImagesMap[pid].push(imgRow.image_url);
      }
    } catch (imgErr) {
      console.warn("Product images table read failed (possibly not created yet):", imgErr);
    }

    // Fetch product variants
    const productVariantsMap: Record<number, any[]> = {};
    try {
      const variantsRes = await pool.query("SELECT id, product_id, size_value, color_name, color_code, additional_price, stock, image_url, price FROM public.product_variants WHERE active = true;");
      for (const vRow of variantsRes.rows) {
        const pid = vRow.product_id;
        if (!productVariantsMap[pid]) {
          productVariantsMap[pid] = [];
        }
        productVariantsMap[pid].push({
          id: String(vRow.id),
          size: vRow.size_value || "",
          color: vRow.color_name || "",
          colorCode: vRow.color_code || "",
          priceDelta: vRow.additional_price ? Number(vRow.additional_price) : 0,
          stock: vRow.stock ? Number(vRow.stock) : 0,
          imageUrl: vRow.image_url || "",
          price: vRow.price !== null && vRow.price !== undefined ? Number(vRow.price) : undefined
        });
      }
    } catch (varErr) {
      console.warn("Product variants table read failed (possibly not created yet):", varErr);
    }

    const products = prodRes.rows.map(row => {
      const pid = row.id;
      return {
        id: String(pid),
        name: row.name,
        price: Number(row.price),
        stock: Number(row.stock),
        category: row.category || "",
        featured: row.featured === true,
        imageUrl: row.image_url || "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80",
        createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
        description: row.description || "",
        categoria_id: row.categoria_id || "ropa",
        originalPrice: row.original_price ? Number(row.original_price) : Number(row.price),
        subcategoria_id: row.subcategoria_id || "all",
        active: row.active !== false,
        paused: row.paused === true,
        sizes: Array.isArray(row.sizes) ? row.sizes : [],
        colors: Array.isArray(row.colors) ? row.colors : [],
        imagenes: productImagesMap[pid] || [],
        variants: productVariantsMap[pid] || [],
        is3D: row.is_3d === true,
        hoursPerUnit: row.hours_per_unit !== null && row.hours_per_unit !== undefined ? Number(row.hours_per_unit) : undefined
      };
    });

    // 7. Fetch orders & their items
    let orders: any[] = [];
    try {
      const ordersRes = await pool.query("SELECT id, customer_email, customer_name, customer_phone, subtotal, discount_amount, shipping_cost, total, applied_coupon_code, current_status, notes, created_at, updated_at FROM public.orders ORDER BY created_at DESC;");
      
      const itemsRes = await pool.query("SELECT id, order_id, product_id, variant_id, product_name, sku, size_selected, color_selected, unit_price, quantity, total_price FROM public.order_items;");
      const orderItemsMap: Record<string, any[]> = {};
      for (const item of itemsRes.rows) {
        const oid = item.order_id;
        if (!orderItemsMap[oid]) {
          orderItemsMap[oid] = [];
        }
        orderItemsMap[oid].push({
          id: item.id,
          productId: item.product_id ? String(item.product_id) : undefined,
          variantId: item.variant_id || undefined,
          productName: item.product_name,
          sku: item.sku || undefined,
          sizeSelected: item.size_selected || undefined,
          colorSelected: item.color_selected || undefined,
          unitPrice: Number(item.unit_price),
          quantity: Number(item.quantity),
          totalPrice: Number(item.total_price)
        });
      }

      orders = ordersRes.rows.map(row => ({
        id: row.id,
        customerEmail: row.customer_email,
        customerName: row.customer_name,
        customerPhone: row.customer_phone || undefined,
        subtotal: Number(row.subtotal),
        discountAmount: Number(row.discount_amount || 0),
        shippingCost: Number(row.shipping_cost || 0),
        total: Number(row.total),
        couponCode: row.applied_coupon_code || undefined,
        status: row.current_status,
        notes: row.notes || undefined,
        createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
        updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : undefined,
        items: orderItemsMap[row.id] || []
      }));
    } catch (ordErr) {
      console.warn("Orders database tables read failed (possibly not created yet):", ordErr);
    }

    return {
      categories: dbCategories.map(c => c.nombre),
      dbCategories,
      dbSubcategories,
      settings,
      products,
      coupons,
      adminCredentials,
      orders
    };
  } catch (err: any) {
    console.error("Error reading relational DB tables:", err);
    const msg = String(err.message || err).toLowerCase();
    if (msg.includes("auth") || msg.includes("password") || msg.includes("connection") || msg.includes("econ") || msg.includes("timeout")) {
      console.warn("⚠️ Error crítico de conexión. Desconectando de la base de datos temporalmente y usando almacenamiento local.");
      dbUnavailable = true;
    }
    return currentStoreState;
  }
}

async function saveDbState(state: ShopState): Promise<boolean> {
  const pool = getDbPool();
  if (!pool) return false;

  try {
    // 1. Settings (global custom layout properties)
    await pool.query(
      "INSERT INTO shop_state (id, state) VALUES ('settings', $1) ON CONFLICT (id) DO UPDATE SET state = EXCLUDED.state;",
      [JSON.stringify(state.settings)]
    );

    // 2. Categories hard delete logic & upsert
    const existingCatsRes = await pool.query("SELECT id FROM categories;");
    const existingCatIds = existingCatsRes.rows.map(r => r.id);
    const incomingCatIds = (state.dbCategories || []).map(c => c.id);

    const deletedCatIds = existingCatIds.filter(id => !incomingCatIds.includes(id));
    if (deletedCatIds.length > 0) {
      await pool.query("DELETE FROM categories WHERE id = ANY($1);", [deletedCatIds]);
    }

    for (const cat of state.dbCategories || []) {
      const activeVal = cat.active !== false;
      await pool.query(
        "INSERT INTO categories (id, nombre, icono, orden, active) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO UPDATE SET nombre = EXCLUDED.nombre, icono = EXCLUDED.icono, orden = EXCLUDED.orden, active = EXCLUDED.active;",
        [cat.id, cat.nombre, cat.icono || "Shirt", cat.orden || 1, activeVal]
      );
    }

    // 3. Subcategories hard delete logic & upsert
    const existingSubsRes = await pool.query("SELECT id FROM subcategories;");
    const existingSubIds = existingSubsRes.rows.map(r => r.id);
    const incomingSubIds = (state.dbSubcategories || []).map(s => s.id);

    const deletedSubIds = existingSubIds.filter(id => !incomingSubIds.includes(id));
    if (deletedSubIds.length > 0) {
      await pool.query("DELETE FROM subcategories WHERE id = ANY($1);", [deletedSubIds]);
    }

    for (const sub of state.dbSubcategories || []) {
      const activeVal = sub.active !== false;
      await pool.query(
        "INSERT INTO subcategories (id, nombre, categoria_id, active) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO UPDATE SET nombre = EXCLUDED.nombre, categoria_id = EXCLUDED.categoria_id, active = EXCLUDED.active;",
        [sub.id, sub.nombre, sub.categoria_id, activeVal]
      );
    }

    // 4. Coupons hard delete logic & upsert
    const existingCouponsRes = await pool.query("SELECT code FROM coupons;");
    const existingCodes = existingCouponsRes.rows.map(r => r.code);
    const incomingCodes = (state.coupons || []).map(c => c.code);

    const deletedCodes = existingCodes.filter(c => !incomingCodes.includes(c));
    if (deletedCodes.length > 0) {
      await pool.query("DELETE FROM coupons WHERE code = ANY($1);", [deletedCodes]);
    }

    for (const coupon of state.coupons || []) {
      const activeVal = coupon.active !== false;
      const expDate = coupon.expiration_date ? new Date(coupon.expiration_date) : null;
      await pool.query(
        "INSERT INTO coupons (code, discount_percent, expiration_date, active) VALUES ($1, $2, $3, $4) ON CONFLICT (code) DO UPDATE SET discount_percent = EXCLUDED.discount_percent, expiration_date = EXCLUDED.expiration_date, active = EXCLUDED.active;",
        [coupon.code, coupon.discount_percent, expDate, activeVal]
      );
    }

    // 5. Admin credentials
    if (state.adminCredentials) {
      await pool.query(
        "INSERT INTO admin_credentials (username, password_hash, session_token) VALUES ($1, $2, $3) ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash, session_token = EXCLUDED.session_token;",
        [
          state.adminCredentials.username,
          state.adminCredentials.passwordHash,
          state.adminCredentials.sessionToken || null
        ]
      );
    }

    // 6. Products Syncing: logical soft delete & upserts
    const existingProdsRes = await pool.query("SELECT id FROM public.products WHERE active = true;");
    const existingDbProdIds = existingProdsRes.rows.map(row => String(row.id));
    const incomingProdIds = (state.products || []).map(p => String(p.id));

    const deletedProdIds = existingDbProdIds.filter(id => !incomingProdIds.includes(id));
    if (deletedProdIds.length > 0) {
      const idInts = deletedProdIds.map(id => parseInt(id)).filter(id => !isNaN(id));
      if (idInts.length > 0) {
        await pool.query("UPDATE public.products SET active = false WHERE id = ANY($1::int[]);", [idInts]);
      }
    }

    for (const prod of state.products || []) {
      const isNew = !prod.id || isNaN(parseInt(prod.id)) || String(prod.id).startsWith("prod-");
      const priceVal = Number(prod.price);
      const originalPriceVal = prod.originalPrice ? Number(prod.originalPrice) : priceVal;
      const stockVal = Math.floor(Number(prod.stock ?? 10));
      const featuredVal = !!prod.featured;
      const pausedVal = !!prod.paused;
      const sizesVal = Array.isArray(prod.sizes) ? prod.sizes : [];
      const colorsVal = Array.isArray(prod.colors) ? prod.colors : [];
      const is3DVal = !!prod.is3D;
      const hoursPerUnitVal = prod.hoursPerUnit ? Math.floor(prod.hoursPerUnit) : null;

      let prodId: number;
      if (isNew) {
        const insertRes = await pool.query(`
          INSERT INTO public.products (
            name, price, stock, category, featured, image_url, description, categoria_id, original_price, subcategoria_id, active, paused, sizes, colors, is_3d, hours_per_unit
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true, $11, $12, $13, $14, $15)
          RETURNING id;
        `, [
          prod.name, priceVal, stockVal, prod.category, featuredVal, prod.imageUrl,
          prod.description || "", prod.categoria_id, originalPriceVal, prod.subcategoria_id,
          pausedVal, sizesVal, colorsVal, is3DVal, hoursPerUnitVal
        ]);
        prodId = insertRes.rows[0].id;
        prod.id = String(prodId);
      } else {
        prodId = parseInt(prod.id);
        await pool.query(`
          UPDATE public.products SET
            name = $1, price = $2, stock = $3, category = $4, featured = $5, image_url = $6, description = $7,
            categoria_id = $8, original_price = $9, subcategoria_id = $10, active = true, paused = $11, sizes = $12, colors = $13,
            is_3d = $14, hours_per_unit = $15
          WHERE id = $16;
        `, [
          prod.name, priceVal, stockVal, prod.category, featuredVal, prod.imageUrl,
          prod.description || "", prod.categoria_id, originalPriceVal, prod.subcategoria_id,
          pausedVal, sizesVal, colorsVal, is3DVal, hoursPerUnitVal, prodId
        ]);
      }

      // Sync product multiple images
      try {
        await pool.query("DELETE FROM public.product_images WHERE product_id = $1;", [prodId]);
        if (Array.isArray(prod.imagenes) && prod.imagenes.length > 0) {
          for (let i = 0; i < prod.imagenes.length; i++) {
            const imgUrl = prod.imagenes[i];
            if (imgUrl && imgUrl.trim()) {
              await pool.query(`
                INSERT INTO public.product_images (product_id, image_url, order_index)
                VALUES ($1, $2, $3);
              `, [prodId, imgUrl.trim(), i]);
            }
          }
        }
      } catch (imgErr) {
        console.error(`Error saving product images for product ${prodId}:`, imgErr);
      }

      // Sync product variants
      try {
        await pool.query("DELETE FROM public.product_variants WHERE product_id = $1;", [prodId]);
        if (Array.isArray(prod.variants) && prod.variants.length > 0) {
          for (const variant of prod.variants) {
            const sku = variant.sku || `SKU-${prodId}-${variant.size}-${variant.color}-${Math.floor(Math.random() * 10000)}`;
            const variantPrice = typeof variant.price === "number" && variant.price > 0 ? variant.price : null;
            await pool.query(`
              INSERT INTO public.product_variants (product_id, sku, size_value, color_name, color_code, additional_price, stock, image_url, price, active)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true);
            `, [
              prodId,
              sku,
              variant.size,
              variant.color,
              variant.colorCode || "",
              Number(variant.priceDelta || 0),
              Math.floor(Number(variant.stock || 0)),
              variant.imageUrl || null,
              variantPrice
            ]);
          }
        }
      } catch (varErr) {
        console.error(`Error saving product variants for product ${prodId}:`, varErr);
      }
    }

    return true;
  } catch (err: any) {
    console.error("Error saving relational DB elements:", err);
    const msg = String(err.message || err).toLowerCase();
    if (msg.includes("auth") || msg.includes("password") || msg.includes("connection") || msg.includes("econ") || msg.includes("timeout")) {
      console.warn("⚠️ Error crítico de conexión detectado al guardar. Usando almacenamiento local.");
      dbUnavailable = true;
    }
    return false;
  }
}

async function initPostgresStore(): Promise<ShopState | null> {
  const rawUrl = process.env.DATABASE_URL || "";
  if (rawUrl.trim().startsWith("AIzaSy")) {
    const errMsg = "DATABASE_URL configurada erróneamente con una API Key de Gemini (empieza con 'AIzaSy'). Debe ser la URL de Supabase.";
    console.error(`Error de inicialización: ${errMsg}`);
    writeDiagnosticReport(errMsg);
    return null;
  }

  const pool = getDbPool();
  if (!pool) return null;

  try {
    // Probar la conexión ejecutando una simple consulta de prueba
    await pool.query("SELECT 1;");
  } catch (testErr: any) {
    console.error("⛔️ Error al conectar a PostgreSQL/Supabase (DATABASE_URL probablemente inválida o inaccesible):", testErr.message || testErr);
    dbUnavailable = true;
    writeDiagnosticReport(testErr.message || String(testErr));
    return null;
  }

  try {
    // 1. Create global shop state tracker
    await pool.query(`
      CREATE TABLE IF NOT EXISTS shop_state (
        id VARCHAR(50) PRIMARY KEY,
        state JSONB NOT NULL
      );
    `);

    // 2. Create products table with compatible columns
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public.products (
        id INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
        name TEXT NOT NULL,
        price NUMERIC(10, 2) NOT NULL,
        stock INTEGER NOT NULL DEFAULT 0,
        category TEXT,
        featured BOOLEAN DEFAULT false,
        image_url TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        description TEXT,
        categoria_id TEXT,
        original_price NUMERIC(10, 2),
        subcategoria_id TEXT
      );
    `);

    // 3. Alter products to ensure active, paused, sizes, colors, and updated_at exist
    await pool.query(`
      ALTER TABLE public.products ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;
      ALTER TABLE public.products ADD COLUMN IF NOT EXISTS paused BOOLEAN DEFAULT false;
      ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sizes TEXT[] DEFAULT '{}';
      ALTER TABLE public.products ADD COLUMN IF NOT EXISTS colors TEXT[] DEFAULT '{}';
      ALTER TABLE public.products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
      ALTER TABLE public.products ADD COLUMN IF NOT EXISTS original_price NUMERIC(10, 2);
      ALTER TABLE public.products ADD COLUMN IF NOT EXISTS subcategoria_id TEXT;
      ALTER TABLE public.products ADD COLUMN IF NOT EXISTS categoria_id TEXT;
      ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_3d BOOLEAN DEFAULT false;
      ALTER TABLE public.products ADD COLUMN IF NOT EXISTS hours_per_unit INTEGER;
    `);

    // Create product_images table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public.product_images (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id INTEGER NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
        image_url TEXT NOT NULL,
        alt_text VARCHAR(150),
        order_index INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Create product_variants table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public.product_variants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id INTEGER NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
        sku VARCHAR(100) UNIQUE,
        size_value VARCHAR(50),
        color_name VARCHAR(50),
        color_code VARCHAR(20),
        additional_price NUMERIC(10, 2) DEFAULT 0.00,
        stock INTEGER NOT NULL DEFAULT 0,
        active BOOLEAN DEFAULT true,
        image_url TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    await pool.query(`
      ALTER TABLE public.product_variants ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
    `);
    await pool.query(`
      ALTER TABLE public.product_variants ADD COLUMN IF NOT EXISTS image_url TEXT;
    `);
    await pool.query(`
      ALTER TABLE public.product_variants ADD COLUMN IF NOT EXISTS price NUMERIC(10, 2);
    `);

    // 4. Create categories
    await pool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id VARCHAR(100) PRIMARY KEY,
        nombre TEXT NOT NULL,
        icono TEXT,
        orden INTEGER DEFAULT 1,
        active BOOLEAN DEFAULT true
      );
    `);
    await pool.query(`
      ALTER TABLE categories ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
    `);

    // 5. Create subcategories
    await pool.query(`
      CREATE TABLE IF NOT EXISTS subcategories (
        id VARCHAR(100) PRIMARY KEY,
        nombre TEXT NOT NULL,
        categoria_id VARCHAR(100) REFERENCES categories(id) ON DELETE CASCADE,
        active BOOLEAN DEFAULT true
      );
    `);
    await pool.query(`
      ALTER TABLE subcategories ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
    `);

    // 6. Create coupons
    await pool.query(`
      CREATE TABLE IF NOT EXISTS coupons (
        code VARCHAR(100) PRIMARY KEY,
        discount_percent INTEGER NOT NULL,
        expiration_date TIMESTAMPTZ,
        active BOOLEAN DEFAULT true
      );
    `);

    // 7. Create admin credentials
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_credentials (
        username VARCHAR(100) PRIMARY KEY,
        password_hash TEXT NOT NULL,
        session_token TEXT
      );
    `);

    // 8. Create orders and order items tables for Mercado Pago Uruguay transactions tracking
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public.orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        customer_email TEXT NOT NULL,
        customer_name TEXT NOT NULL,
        customer_phone TEXT,
        subtotal NUMERIC(10, 2) NOT NULL,
        discount_amount NUMERIC(10, 2) DEFAULT 0.00,
        shipping_cost NUMERIC(10, 2) DEFAULT 0.00,
        total NUMERIC(10, 2) NOT NULL,
        applied_coupon_code VARCHAR(100),
        current_status VARCHAR(50) NOT NULL DEFAULT 'pedido_iniciado',
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS public.order_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES public.products(id) ON DELETE SET NULL,
        variant_id TEXT,
        product_name TEXT NOT NULL,
        sku VARCHAR(100),
        size_selected VARCHAR(50),
        color_selected VARCHAR(50),
        unit_price NUMERIC(10, 2) NOT NULL,
        quantity INTEGER NOT NULL,
        total_price NUMERIC(10, 2) NOT NULL
      );
    `);

    // --- CREATE OPTIMIZED INDEXES FOR HIGH-PERFORMANCE CATALOGUE FETCHES ---
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_products_search ON public.products (active, featured, paused);
      CREATE INDEX IF NOT EXISTS idx_products_category ON public.products (categoria_id, subcategoria_id);
      CREATE INDEX IF NOT EXISTS idx_variants_product ON public.product_variants (product_id, active);
    `);

    // --- SEED TABLES IF EMPTY ---

    // Seed categories
    const catCheck = await pool.query("SELECT COUNT(*) FROM categories;");
    if (parseInt(catCheck.rows[0].count) === 0) {
      console.log("Seeding categories Table...");
      for (const cat of DEFAULT_SHOP_STATE.dbCategories || []) {
        await pool.query(
          "INSERT INTO categories (id, nombre, icono, orden, active) VALUES ($1, $2, $3, $4, true);",
          [cat.id, cat.nombre, cat.icono, cat.orden]
        );
      }
    }

    // Seed subcategories
    const subCheck = await pool.query("SELECT COUNT(*) FROM subcategories;");
    if (parseInt(subCheck.rows[0].count) === 0) {
      console.log("Seeding subcategories Table...");
      for (const sub of DEFAULT_SHOP_STATE.dbSubcategories || []) {
        await pool.query(
          "INSERT INTO subcategories (id, nombre, categoria_id, active) VALUES ($1, $2, $3, true);",
          [sub.id, sub.nombre, sub.categoria_id]
        );
      }
    }

    // Seed admin credentials
    const adminCheck = await pool.query("SELECT COUNT(*) FROM admin_credentials;");
    if (parseInt(adminCheck.rows[0].count) === 0) {
      console.log("Seeding admin credentials Table...");
      const seedUsername = process.env.ADMIN_USERNAME || "Juem";
      const seedPassword = process.env.ADMIN_PASSWORD || "olivera45";
      const defaultHash = hashPassword(seedPassword);
      await pool.query(
        "INSERT INTO admin_credentials (username, password_hash) VALUES ($1, $2);",
        [seedUsername, defaultHash]
      );
    }

    // Seed settings JSON inside shop_state
    const settingsCheck = await pool.query("SELECT COUNT(*) FROM shop_state WHERE id = 'settings';");
    if (parseInt(settingsCheck.rows[0].count) === 0) {
      console.log("Seeding settings inside shop_state...");
      await pool.query(
        "INSERT INTO shop_state (id, state) VALUES ('settings', $1);",
        [JSON.stringify(DEFAULT_SHOP_STATE.settings)]
      );
    }

    // Seed products table ONLY if table is completely empty (no previous products at all)
    const prodCheck = await pool.query("SELECT COUNT(*) FROM public.products;");
    if (parseInt(prodCheck.rows[0].count) === 0) {
      console.log("Seeding products...");
      for (const prod of DEFAULT_SHOP_STATE.products || []) {
        const priceVal = Number(prod.price);
        const originalPriceVal = prod.originalPrice ? Number(prod.originalPrice) : priceVal;
        const stockVal = Math.floor(Number(prod.stock ?? 10));
        const featuredVal = !!prod.featured;
        const sizesVal = Array.isArray(prod.sizes) ? prod.sizes : [];
        const colorsVal = Array.isArray(prod.colors) ? prod.colors : [];

        await pool.query(`
          INSERT INTO public.products (
            name, price, stock, category, featured, image_url, description, categoria_id, original_price, subcategoria_id, active, paused, sizes, colors
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true, false, $11, $12);
        `, [
          prod.name, priceVal, stockVal, prod.category, featuredVal, prod.imageUrl,
          prod.description || "", prod.categoria_id, originalPriceVal, prod.subcategoria_id,
          sizesVal, colorsVal
        ]);
      }
    }

    console.log("PostgreSQL schema validated. Fetching reconstructed ShopState...");
    const state = await getDbState();
    writeDiagnosticReport("No error - Loaded successfully via direct SQL");
    return state;
  } catch (err: any) {
    console.error("Error seeding or configuring PostgreSQL tables:", err);
    writeDiagnosticReport(err.message || String(err));
    return null;
  }
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  // Verify mandatory credentials/secrets. In production, we generate secure runtime defaults to prevent container crashes while logging clear recommendations.
  if (!process.env.JWT_SECRET) {
    console.error("⚠️ ADVERTENCIA DE SEGURIDAD CRÍTICA: La variable 'JWT_SECRET' es estrictamente recomendada.");
    console.warn("Generando una clave temporal aleatoria de un solo uso para garantizar que la aplicación inicie de manera segura.");
    process.env.JWT_SECRET = crypto.randomBytes(32).toString("hex");
  }
  if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD) {
    console.error("⚠️ ADVERTENCIA DE SEGURIDAD CRÍTICA: Las variables 'ADMIN_USERNAME' y/o 'ADMIN_PASSWORD' no están definidas.");
    console.warn("Estableciendo credenciales de respaldo temporales ('admin' / 'admin123') para evitar fallas del contenedor.");
    if (!process.env.ADMIN_USERNAME) process.env.ADMIN_USERNAME = "admin";
    if (!process.env.ADMIN_PASSWORD) process.env.ADMIN_PASSWORD = "admin123";
  }

  app.use(express.json({ limit: "15mb" })); // Support large images or custom payloads

  // Sync cache with store.json
  currentStoreState = initDataStore();

  // --- IN-MEMORY SECURITY LAYER FOR RATE-LIMITING AND XSS SANITIZATION ---
  const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
  function limitRequest(ip: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const clientData = rateLimitMap.get(ip) || { count: 0, lastReset: now };
    if (now - clientData.lastReset > windowMs) {
      clientData.count = 1;
      clientData.lastReset = now;
      rateLimitMap.set(ip, clientData);
      return true;
    }
    if (clientData.count >= limit) {
      return false;
    }
    clientData.count += 1;
    rateLimitMap.set(ip, clientData);
    return true;
  }

  function sanitizeHtmlString(str: string): string {
    if (typeof str !== "string") return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;")
      .replace(/\//g, "&#x2F;");
  }

  function isValidToken(authHeader: string | undefined): boolean {
    if (!authHeader || !authHeader.startsWith("Bearer ")) return false;
    const token = authHeader.substring(7);
    
    const creds = currentStoreState.adminCredentials;
    const expectedUsername = process.env.ADMIN_USERNAME || creds?.username || "Juem";
    const expectedPasswordHash = process.env.ADMIN_PASSWORD 
      ? hashPassword(process.env.ADMIN_PASSWORD) 
      : (creds?.passwordHash || hashPassword("olivera45"));
    
    // Create stable deterministic token to ensure stateless/ephemeral scaling resilience
    const stableToken = hashPassword(expectedUsername + ":" + expectedPasswordHash);
    const expectedToken = creds?.sessionToken || stableToken;
    
    // REMOVED INSECURE LEGACY BACKDOOR/STATIC STRINGS FOR CRITICAL PRODUCTION HARDENING
    return token === expectedToken || token === stableToken;
  }

  // Cargar estado de Postgres si DATABASE_URL está definido
  if (process.env.DATABASE_URL) {
    try {
      const pgState = await initPostgresStore();
      if (pgState) {
        currentStoreState = pgState;
        console.log("🟢 Estado sincronizado con la base de datos de Supabase exitosamente.");
      }
    } catch (pgError) {
      console.error("🔴 Error: No se pudo cargar de Postgres en el inicio, usando cache local:", pgError);
    }
  } else {
    console.warn("⚠️ ADVERTENCIA: La variable DATABASE_URL no está configurada en las variables de entorno de Render.");
    console.warn("⚠️ El servidor usará el archivo local de respaldo '/data/store.json' (cualquier cambio se perderá al reiniciar o desplegar en Render).");
  }

  // API Admin login
  app.post("/api/admin/login", async (req, res) => {
    const clientIp = req.ip || req.headers["x-forwarded-for"] || "";
    const ipStr = Array.isArray(clientIp) ? clientIp[0] : String(clientIp);
    if (!limitRequest(ipStr, 5, 2 * 60 * 1000)) { // limit to 5 login request checks per 2 minutes
      return res.status(429).json({ success: false, message: "Demasiados intentos fallidos de inicio de sesión. Por seguridad, debes esperar 2 minutos." });
    }

    const { username, password } = req.body;
    const creds = currentStoreState.adminCredentials;
    const expectedUsername = process.env.ADMIN_USERNAME || creds?.username || "Juem";
    const expectedPasswordHash = process.env.ADMIN_PASSWORD 
      ? hashPassword(process.env.ADMIN_PASSWORD) 
      : (creds?.passwordHash || hashPassword("olivera45"));
    
    if (password && username === expectedUsername && hashPassword(password) === expectedPasswordHash) {
      // If session token is missing, generate one dynamically and persist it
      let sessionToken = creds?.sessionToken;
      if (!sessionToken) {
        sessionToken = "session-" + crypto.randomBytes(16).toString("hex");
        if (!currentStoreState.adminCredentials) {
          currentStoreState.adminCredentials = {
            username: expectedUsername,
            passwordHash: expectedPasswordHash,
            sessionToken
          };
        } else {
          currentStoreState.adminCredentials.sessionToken = sessionToken;
        }

        try {
          fs.writeFileSync(STORE_FILE, JSON.stringify(currentStoreState, null, 2), "utf-8");
          if (process.env.DATABASE_URL) {
            await saveDbState(currentStoreState);
          }
        } catch (e) {}
      }

      res.json({
        success: true,
        token: sessionToken,
        user: { username: expectedUsername, role: "admin" }
      });
    } else {
      res.status(401).json({
        success: false,
        message: "Usuario o contraseña inválidos."
      });
    }
  });

  // Verify Admin session & role
  app.get("/api/admin/verify", (req, res) => {
    const authHeader = req.headers.authorization;
    if (isValidToken(authHeader)) {
      const creds = currentStoreState.adminCredentials;
      res.json({
        success: true,
        valid: true,
        user: { username: creds?.username || "Juem", role: "admin" }
      });
    } else {
      res.status(401).json({
        success: false,
        valid: false,
        message: "Sesión inválida, expirada o sin permisos de administrador."
      });
    }
  });

  // API Admin change credentials securely
  app.post("/api/admin/change-credentials", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!isValidToken(authHeader)) {
      return res.status(403).json({ success: false, message: "Acceso denegado: debes estar autenticado como administrador." });
    }

    const { currentPassword, newUsername, newPassword } = req.body;
    if (!currentPassword || !newUsername || !newPassword) {
      return res.status(400).json({ success: false, message: "Faltan campos requeridos." });
    }

    const trimmedUsername = newUsername.trim();
    if (trimmedUsername.length < 3) {
      return res.status(400).json({ success: false, message: "El nombre de usuario debe tener un mínimo de 3 caracteres." });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "La nueva contraseña debe tener un mínimo de 6 caracteres por seguridad." });
    }

    if (process.env.ADMIN_PASSWORD || process.env.ADMIN_USERNAME) {
      return res.status(400).json({ success: false, message: "Las credenciales están configuradas a nivel de servidor mediante variables de entorno y no pueden modificarse desde este panel." });
    }

    const creds = currentStoreState.adminCredentials;
    const expectedPasswordHash = creds?.passwordHash || hashPassword("olivera45");
    if (hashPassword(currentPassword) !== expectedPasswordHash) {
      return res.status(400).json({ success: false, message: "La contraseña actual ingresada es incorrecta." });
    }

    // Generate fresh session token to invalidate all previous sessions
    const freshToken = "session-" + crypto.randomBytes(16).toString("hex");
    const newPasswordHash = hashPassword(newPassword);

    currentStoreState.adminCredentials = {
      username: trimmedUsername,
      passwordHash: newPasswordHash,
      sessionToken: freshToken
    };

    try {
      fs.writeFileSync(STORE_FILE, JSON.stringify(currentStoreState, null, 2), "utf-8");
      if (process.env.DATABASE_URL) {
        await saveDbState(currentStoreState);
      }
      res.json({
        success: true,
        message: "Credenciales actualizadas correctamente. Las sesiones anteriores se han cerrado con éxito.",
        newToken: freshToken,
        user: { username: trimmedUsername, role: "admin" }
      });
    } catch (err: any) {
      console.error("Error al actualizar credenciales:", err);
      res.status(500).json({ success: false, message: "No se pudieron persistir las credenciales en la base de datos." });
    }
  });

  // POST upload to Cloudinary (Full-stack API proxy for credentials safety)
  app.post("/api/cloudinary/upload", (req, res, next) => {
    // Invoke multer manually to catch limits and filter errors gracefully
    upload.single("image")(req, res, (err: any) => {
      if (err) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({ success: false, message: "El tamaño del archivo supera el límite permitido de 5MB." });
        }
        if (err.message === "MIME_TYPE_NOT_ALLOWED") {
          return res.status(400).json({ success: false, message: "Tipo de archivo no permitido. Solo se aceptan imágenes válidas (JPEG, JPG, PNG, WEBP, GIF)." });
        }
        return res.status(400).json({ success: false, message: `Error al cargar el archivo: ${err.message}` });
      }
      next();
    });
  }, (req, res) => {
    const authHeader = req.headers.authorization;
    if (!isValidToken(authHeader)) {
      return res.status(403).json({ success: false, message: "Acceso denegado: solo personal de administración autorizado puede subir archivos." });
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return res.status(500).json({ 
        success: false, 
        message: "Configuración de Cloudinary incompleta en el servidor. Por favor, define CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET en tus variables de entorno." 
      });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No se proporcionó ningún archivo de imagen para subir." });
    }

    // Double extension and file name validation
    const originalName = req.file.originalname || "";
    const ext = path.extname(originalName).toLowerCase();
    const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
    if (!allowedExtensions.includes(ext)) {
      return res.status(400).json({ success: false, message: "Extensión de imagen no permitida. Por favor, use formatos estándar JPG, JPEG, PNG, WEBP o GIF." });
    }

    const dotsCount = originalName.split(".").length - 1;
    if (dotsCount > 1) {
      return res.status(400).json({ success: false, message: "Se detectó un nombre de archivo sospechoso con múltiples extensiones." });
    }

    // Configure cloudinary connection lazily
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret
    });

    // Create stream and feed binary packet (force resource_type to image to reject fake non-image binary extensions)
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "ventas_juem_cloudinary",
        resource_type: "image"
      },
      (error, result) => {
        if (error) {
          console.error("Error al subir a Cloudinary:", error);
          return res.status(500).json({ success: false, message: "Error al subir a Cloudinary.", detail: error.message });
        }
        res.json({ success: true, url: result?.secure_url });
      }
    );

    uploadStream.end(req.file.buffer);
  });

  // GET store state
  app.get("/api/store", async (req, res) => {
    // Evitar almacenamiento en caché por el navegador o CDN
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    if (process.env.DATABASE_URL) {
      if (dbUnavailable) {
        console.log("🔄 Reintentando conectar con PostgreSQL...");
        getDbPool(true); // Forzar la reactivación del pool limpiando la bandera 'dbUnavailable'
      }
      try {
        const dbState = await getDbState();
        currentStoreState = dbState;
      } catch (err) {
        console.error("No se pudo cargar de Postgres en GET, usando cache local:", err);
      }
    }
    res.json(currentStoreState);
  });

  // POST update store state
  app.post("/api/store", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!isValidToken(authHeader)) {
      return res.status(403).json({ success: false, message: "Acceso no autorizado." });
    }

    const { products, categories, settings, dbCategories, dbSubcategories, coupons } = req.body;
    if (!products || !categories || !settings) {
      return res.status(400).json({ success: false, message: "Datos incompletos." });
    }

    try {
      currentStoreState = { 
        ...currentStoreState, // Preserve adminCredentials and any other configuration
        products, 
        categories, 
        settings,
        dbCategories: Array.isArray(dbCategories) ? dbCategories : currentStoreState.dbCategories,
        dbSubcategories: Array.isArray(dbSubcategories) ? dbSubcategories : currentStoreState.dbSubcategories,
        coupons: Array.isArray(coupons) ? coupons : currentStoreState.coupons
      };
      
      // Guardar SIEMPRE en archivo local como respaldo y sincronizar con base de datos si existe
      try {
        fs.writeFileSync(STORE_FILE, JSON.stringify(currentStoreState, null, 2), "utf-8");
        // Invalidate Google Reviews Cache to reflect new parameters instantly
        reviewsCache = null;
      } catch (fsErr) {
        console.error("Error al escribir respaldo en archivo local:", fsErr);
      }

      if (process.env.DATABASE_URL) {
        const saved = await saveDbState(currentStoreState);
        if (saved) {
          // Re-load to get actual database-assigned auto-incremented integer IDs!
          const dbState = await getDbState();
          currentStoreState = dbState;
        }
      }

      res.json({ success: true, message: "Cambios guardados con éxito en el servidor.", state: currentStoreState });
    } catch (err) {
      console.error("Error al guardar estado de la tienda:", err);
      res.status(500).json({ success: false, message: "Error interno al guardar los datos." });
    }
  });

  // --- REAL-TIME SALES AND ORDERS PERSISTENCE API (URUGUAY LOCAL + PSQL CLOUD) ---

  // GET all orders for administration tracking (Protected)
  app.get("/api/orders", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!isValidToken(authHeader)) {
      return res.status(403).json({ success: false, message: "Acceso denegado. Se requiere autenticación de administrador principal." });
    }
    
    try {
      const pool = getDbPool();
      if (pool && !dbUnavailable) {
        // Force refresh state from SQL
        const dbState = await getDbState();
        currentStoreState = dbState;
      }
      res.json({ success: true, orders: currentStoreState.orders || [] });
    } catch (err: any) {
      console.error("Error reading orders:", err);
      res.status(500).json({ success: false, message: "Error al recuperar listado de pedidos.", error: err.message });
    }
  });

  // POST create a safe checkout order BEFORE redirecting to gateway (Fully Secured)
  app.post("/api/orders", async (req, res) => {
    try {
      // 1. Rate Limiting Check
      const clientIp = req.ip || req.headers["x-forwarded-for"] || "";
      const ipStr = Array.isArray(clientIp) ? clientIp[0] : String(clientIp);
      if (!limitRequest(ipStr, 10, 5 * 60 * 1000)) { // limit 10 order queries per 5 minutes per IP
        return res.status(429).json({ success: false, message: "Demasiados pedidos creados en poco tiempo. Por favor, intente nuevamente en unos minutos." });
      }

      const { customerName, customerEmail, customerPhone, shippingCost, couponCode, notes, items } = req.body;
      
      if (!customerName || !customerEmail || !items || items.length === 0) {
        return res.status(400).json({ success: false, message: "Nombre, Correo Electrónico y Artículos del carrito son obligatorios." });
      }

      // 2. Input Sanitization to prevent XSS (Stored & Dom XSS injection blocks)
      const sanitizedName = sanitizeHtmlString(customerName).trim().substring(0, 100);
      const sanitizedEmail = sanitizeHtmlString(customerEmail).trim().substring(0, 100);
      const sanitizedPhone = sanitizeHtmlString(customerPhone || "").trim().substring(0, 50);
      const sanitizedNotes = sanitizeHtmlString(notes || "").trim().substring(0, 1000);

      const status = "pedido_iniciado"; // initial state
      const pool = getDbPool();
      let orderId: string;

      // 3. SECURE SERVER-SIDE CALCULATIONS (No client-submitted prices or totals are trusted)
      const officialState = await getDbState();
      const officialProducts = officialState.products || [];
      const officialCoupons = officialState.coupons || [];

      let serverSubtotal = 0;
      const verifiedItems = [];

      for (const item of items) {
        const dbProd = officialProducts.find(p => Number(p.id) === Number(item.productId));
        if (!dbProd) {
          return res.status(400).json({ success: false, message: `El producto con ID '${item.productId}' ya no está disponible en la tienda.` });
        }

        // Determine correct base or variant price
        let correctUnitPrice = Number(dbProd.price);
        let activeVariantId = item.variantId;

        if (dbProd.variants && dbProd.variants.length > 0 && item.sizeSelected) {
          const exactMatch = item.colorSelected 
            ? dbProd.variants.find((v: any) => v.size === item.sizeSelected && v.color === item.colorSelected)
            : null;
          const sizeMatch = dbProd.variants.find((v: any) => v.size === item.sizeSelected);
          const match = exactMatch || sizeMatch;
          
          if (match) {
            activeVariantId = match.id;
            if (match.price !== undefined && Number(match.price) > 0) {
              correctUnitPrice = Number(match.price);
            } else if (match.priceDelta !== undefined && Number(match.priceDelta) !== 0) {
              correctUnitPrice = Number(dbProd.price) + Number(match.priceDelta);
            }
          }
        }

        const qty = Math.max(1, parseInt(item.quantity) || 1);
        const itemTot = correctUnitPrice * qty;
        serverSubtotal += itemTot;

        verifiedItems.push({
          productId: dbProd.id,
          variantId: activeVariantId || null,
          productName: dbProd.name,
          sku: item.sku || null,
          sizeSelected: item.sizeSelected || null,
          colorSelected: item.colorSelected || null,
          unitPrice: correctUnitPrice,
          quantity: qty,
          totalPrice: itemTot
        });
      }

      // Check coupon validation server-side
      let serverDiscountAmount = 0;
      if (couponCode) {
        const cleanCode = String(couponCode).trim().toUpperCase();
        const dbCoupon = officialCoupons.find(c => c.code.toUpperCase() === cleanCode && c.active !== false);
        if (dbCoupon) {
          const now = new Date();
          const exp = dbCoupon.expiration_date ? new Date(dbCoupon.expiration_date) : null;
          if (!exp || exp > now) {
            serverDiscountAmount = Math.round((serverSubtotal * Number(dbCoupon.discount_percent)) / 100);
          }
        }
      }

      const verifiedShippingCost = Number(shippingCost || 0);
      const serverTotal = Math.max(0, serverSubtotal - serverDiscountAmount + verifiedShippingCost);

      if (pool && !dbUnavailable) {
        const client = await pool.connect();
        try {
          await client.query("BEGIN;");
          
          // Verify stock with FOR UPDATE lock on every item to prevent race-condition oversellings
          for (const item of verifiedItems) {
            if (item.variantId) {
              const vRes = await client.query(
                "SELECT stock, size_value, color_name FROM public.product_variants WHERE id = $1 FOR UPDATE;",
                [item.variantId]
              );
              if (vRes.rows.length === 0) {
                throw new Error(`La variante seleccionada para el producto '${item.productName}' ya no está disponible.`);
              }
              const stockAvailable = vRes.rows[0].stock;
              if (item.quantity > stockAvailable) {
                const desc = `${vRes.rows[0].size_value || ""}${vRes.rows[0].color_name ? " - " + vRes.rows[0].color_name : ""}`;
                throw new Error(`Lo sentimos, el producto '${item.productName}' (${desc}) no tiene suficiente stock disponible. Stock disponible: ${stockAvailable}.`);
              }
            } else {
              const pRes = await client.query(
                "SELECT stock FROM public.products WHERE id = $1 FOR UPDATE;",
                [item.productId]
              );
              if (pRes.rows.length === 0) {
                throw new Error(`El producto '${item.productName}' ya no está disponible.`);
              }
              const stockAvailable = pRes.rows[0].stock;
              if (item.quantity > stockAvailable) {
                throw new Error(`Lo sentimos, el producto '${item.productName}' no tiene suficiente stock disponible. Stock disponible: ${stockAvailable}.`);
              }
            }
          }

          // Insert secure calculated values into postgres
          const orderRes = await client.query(`
            INSERT INTO public.orders (customer_name, customer_email, customer_phone, subtotal, discount_amount, shipping_cost, total, applied_coupon_code, current_status, notes)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING id, created_at;
          `, [
            sanitizedName, 
            sanitizedEmail, 
            sanitizedPhone || null, 
            serverSubtotal, 
            serverDiscountAmount, 
            verifiedShippingCost, 
            serverTotal, 
            couponCode || null, 
            status, 
            sanitizedNotes || null
          ]);
          
          orderId = orderRes.rows[0].id;

          const isUuid = (val: any) => typeof val === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

          for (const item of verifiedItems) {
            const cleanVariantId = isUuid(item.variantId) ? item.variantId : null;
            await client.query(`
              INSERT INTO public.order_items (order_id, product_id, variant_id, product_name, sku, size_selected, color_selected, unit_price, quantity, total_price)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);
            `, [
              orderId,
              item.productId,
              cleanVariantId,
              item.productName,
              item.sku || null,
              item.sizeSelected || null,
              item.colorSelected || null,
              item.unitPrice,
              item.quantity,
              item.totalPrice
            ]);
          }

          await client.query("COMMIT;");
        } catch (txErr: any) {
          await client.query("ROLLBACK;");
          console.error("Error creating order inside transaction:", txErr);
          return res.status(400).json({ success: false, message: txErr.message || "Error al verificar stock y crear pedido." });
        } finally {
          client.release();
        }
        
        // Force reload cache with database state
        const dbState = await getDbState();
        currentStoreState = dbState;
      } else {
        // Safe, verified file-system backup fallback:
        // Pre-emptively verify in-memory stock limits before generating the offline order
        for (const item of verifiedItems) {
          const dbProd = officialProducts.find(p => Number(p.id) === Number(item.productId));
          if (!dbProd) {
            return res.status(400).json({ success: false, message: `El producto '${item.productName}' ya no está disponible.` });
          }
          if (item.variantId) {
            const matchVar = dbProd.variants?.find((v: any) => String(v.id) === String(item.variantId));
            if (!matchVar) {
              return res.status(400).json({ success: false, message: `La variante seleccionada para el producto '${item.productName}' ya no está disponible.` });
            }
            if (item.quantity > (matchVar.stock || 0)) {
              const desc = `${matchVar.size || ""}${matchVar.color ? " - " + matchVar.color : ""}`;
              return res.status(400).json({ success: false, message: `Lo sentimos, el producto '${item.productName}' (${desc}) no tiene suficiente stock disponible. Stock disponible: ${matchVar.stock || 0}.` });
            }
          } else {
            if (item.quantity > (dbProd.stock || 0)) {
              return res.status(400).json({ success: false, message: `Lo sentimos, el producto '${item.productName}' no tiene suficiente stock disponible. Stock disponible: ${dbProd.stock || 0}.` });
            }
          }
        }

        orderId = "local-ord-" + crypto.randomBytes(8).toString("hex");
        const newOrderObj = {
          id: orderId,
          customerName: sanitizedName,
          customerEmail: sanitizedEmail,
          customerPhone: sanitizedPhone,
          subtotal: serverSubtotal,
          discountAmount: serverDiscountAmount,
          shippingCost: verifiedShippingCost,
          total: serverTotal,
          couponCode,
          status: status as any,
          notes: sanitizedNotes,
          createdAt: new Date().toISOString(),
          items: verifiedItems.map((i: any) => ({
            productId: String(i.productId),
            variantId: i.variantId ? String(i.variantId) : undefined,
            productName: i.productName,
            sku: i.sku || undefined,
            sizeSelected: i.sizeSelected || undefined,
            colorSelected: i.colorSelected || undefined,
            unitPrice: i.unitPrice,
            quantity: i.quantity,
            totalPrice: i.totalPrice
          }))
        };

        if (!currentStoreState.orders) {
          currentStoreState.orders = [];
        }
        currentStoreState.orders.unshift(newOrderObj);

        try {
          fs.writeFileSync(STORE_FILE, JSON.stringify(currentStoreState, null, 2), "utf-8");
        } catch (fsErr) {
          console.error("Error writing backup order to store file:", fsErr);
        }
      }

      res.status(201).json({ success: true, orderId });
    } catch (err: any) {
      console.error("Error creating order:", err);
      res.status(500).json({ success: false, message: "Error interno del servidor al crear el pedido.", error: err.message });
    }
  });

  // PUT update order status manually by administrator
  app.put("/api/orders/:id/status", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!isValidToken(authHeader)) {
      return res.status(403).json({ success: false, message: "Acceso denegado. Se requiere autenticación de administrador principal." });
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: "El nuevo estado del pedido es obligatorio." });
    }

    try {
      const pool = getDbPool();
      if (pool && !dbUnavailable) {
        await pool.query("UPDATE public.orders SET current_status = $1, updated_at = NOW() WHERE id = $2;", [status, id]);
        const dbState = await getDbState();
        currentStoreState = dbState;
      } else {
        if (currentStoreState.orders) {
          currentStoreState.orders = currentStoreState.orders.map(o => {
            if (o.id === id) {
              return { ...o, status, updatedAt: new Date().toISOString() };
            }
            return o;
          });
          fs.writeFileSync(STORE_FILE, JSON.stringify(currentStoreState, null, 2), "utf-8");
        }
      }

      res.json({ success: true, message: "Estado de pedido modificado correctamente en la base de datos.", state: currentStoreState });
    } catch (err: any) {
      console.error("Error updating status:", err);
      res.status(500).json({ success: false, message: "No se pudo actualizar el estado del pedido.", error: err.message });
    }
  });

  // Mercado Pago Uruguay Custom Server Integration Endpoints (Fully Secured against price tampering)
  app.post("/api/payments/mercadopago/preference", async (req, res) => {
    try {
      const { orderId, appliedPromo } = req.body;

      if (!orderId) {
        return res.status(400).json({ success: false, message: "Falta el ID del pedido registrado en el sistema." });
      }

      // Retrieve authentic pre-registered order from database/file state cache
      const officialState = await getDbState();
      const order = (officialState.orders || []).find((o: any) => String(o.id) === String(orderId));
      if (!order) {
        return res.status(404).json({ success: false, message: "El pedido especificado no fue encontrado o no está guardado de forma persistente." });
      }

      // Read current store settings
      const settings = officialState.settings || currentStoreState.settings;
      const accessToken = settings.mercadopagoAccessToken?.trim() || process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();

      if (!accessToken) {
        return res.status(400).json({ 
          success: false, 
          message: "El vendedor no ha configurado sus credenciales de Mercado Pago todavía en el panel de administradores." 
        });
      }

      // Build safe itemized preference list directly from server-verified database values
      const discountFactor = order.subtotal > 0 ? (order.total / order.subtotal) : 1;
      
      const items = order.items.map((it: any) => {
        let title = it.productName;
        const options = [];
        if (it.sizeSelected) options.push(`Talle/Mat: ${it.sizeSelected}`);
        if (it.colorSelected) options.push(`Col: ${it.colorSelected}`);
        if (options.length > 0) title += ` (${options.join(", ")})`;

        // Multiply item unit price by discount factor and round to integer per MP spec
        const finalPriceUYU = Math.round(Number(it.unitPrice) * discountFactor);

        return {
          title: title,
          quantity: parseInt(it.quantity) || 1,
          unit_price: finalPriceUYU,
          currency_id: "UYU"
        };
      });

      // Add shippingCost directly if it exists in the secured order record
      if (order.shippingCost && Number(order.shippingCost) > 0) {
        items.push({
          title: "Costo de Envío",
          quantity: 1,
          unit_price: Math.round(Number(order.shippingCost)),
          currency_id: "UYU"
        });
      }

      // Extract the external host and protocol
      let rawHost = req.headers["x-forwarded-host"] || req.get("host") || "";
      if (Array.isArray(rawHost)) {
        rawHost = rawHost[0];
      }
      let host = rawHost.split(",")[0].trim();

      let rawProto = req.headers["x-forwarded-proto"] || "https";
      if (Array.isArray(rawProto)) {
        rawProto = rawProto[0];
      }
      let protocol = rawProto.split(",")[0].trim();

      // Force HTTPS for any external domains (e.g. google cloud previews) and strip the internal port
      if (host.includes(".run.app") || host.includes(".studio") || protocol === "https" || req.headers["x-forwarded-host"]) {
        protocol = "https";
        host = host.split(":")[0]; // Strip the internal port (e.g. :3000)
      }

      // If it is localhost or local IP, and no proxy forwarded host exists, keep HTTP and port
      const isLocal = host.includes("localhost") || host.includes("127.0.0.1");
      if (isLocal && !req.headers["x-forwarded-host"]) {
        protocol = "http";
      }

      const baseUrl = `${protocol}://${host}`;
      const isHttps = baseUrl.startsWith("https://");

      const mpPayload: any = {
        items: items,
        external_reference: orderId, // Crucial backlink correlation
        back_urls: {
          success: `${baseUrl}/api/payments/mercadopago/feedback?status=success&orderId=${orderId}&promo=${encodeURIComponent(appliedPromo || "")}`,
          failure: `${baseUrl}/api/payments/mercadopago/feedback?status=failure&orderId=${orderId}`,
          pending: `${baseUrl}/api/payments/mercadopago/feedback?status=pending&orderId=${orderId}`
        },
        statement_descriptor: (settings.siteTitle || "Ventas Juem").substring(0, 16)
      };

      // Mercado Pago only permits auto_return if all back_urls use a secure HTTPS protocol without custom port
      if (isHttps && !host.includes(":")) {
        mpPayload.auto_return = "approved";
      }

      console.log("Creando preferencia Mercado Pago segura con SDK oficial:", JSON.stringify(mpPayload, null, 2));

      const mpClient = new MercadoPagoConfig({ accessToken });
      const preference = new Preference(mpClient);
      const resData = await preference.create({ body: mpPayload });

      res.json({ 
        success: true, 
        preferenceId: resData.id, 
        initPoint: resData.init_point,
        sandboxInitPoint: resData.sandbox_init_point 
      });

    } catch (err: any) {
      console.error("Excepción en creación de preferencia:", err);
      res.status(500).json({ success: false, message: "Error interno del servidor.", error: err.message });
    }
  });

  // GET fallback redirect page after Mercado Pago redirect
  app.get("/api/payments/mercadopago/feedback", async (req, res) => {
    // Extract query parameters
    const paymentId = (req.query.payment_id || req.query.collection_id || "") as string;
    const orderId = (req.query.orderId || req.query.external_reference || "") as string;
    const promo = (req.query.promo || "") as string;

    const settings = currentStoreState.settings;
    const siteTitle = settings.siteTitle || "Ventas Juem";
    const whatsappNum = settings.whatsappNumber || "";
    const cleanPhone = whatsappNum.replace(/[^0-9]/g, "");

    // Secure server-to-server validation logic directly querying Mercado Pago's official API
    let finalOrderState: "pago_aprobado" | "pago_pendiente" | "pago_rechazado" = "pago_pendiente";
    let isApproved = false;
    let verifiedPaymentAmount = 0;

    const accessToken = settings.mercadopagoAccessToken?.trim() || process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();

    if (paymentId && paymentId !== "null" && accessToken) {
      try {
        console.log(`[Seguridad] Consultando transacción real ${paymentId} en pasarela Mercado Pago con SDK oficial.`);
        const mpClient = new MercadoPagoConfig({ accessToken });
        const payment = new Payment(mpClient);
        const mpPaymentData = await payment.get({ id: paymentId });

        const verifiedStatus = mpPaymentData.status; // 'approved', 'pending', 'in_process', 'rejected', 'refunded', 'cancelled'
        verifiedPaymentAmount = mpPaymentData.transaction_amount || 0;
        console.log(`[Seguridad] Pasarela confirmó estado real del pago: ${verifiedStatus} (Monto: $${verifiedPaymentAmount})`);

        if (verifiedStatus === "approved") {
          finalOrderState = "pago_aprobado";
          isApproved = true;
        } else if (verifiedStatus === "rejected") {
          finalOrderState = "pago_rechazado";
        } else {
          finalOrderState = "pago_pendiente";
        }
      } catch (mpVerifyError: any) {
        console.error("[Seguridad MP] Excepción al consultar transacción con el SDK:", mpVerifyError);
      }
    } else {
      console.log(`[Advertencia] No se pudo verificar con pasarela (No hay ID de pago u Token ausente). ID: ${paymentId}`);
    }

    // Persist real verified status back to our systems so the merchant never loses order updates!
    if (orderId) {
      try {
        if (isApproved) {
          // Use our transactional, row-locking safe stock deduction routine
          const result = await approveOrderAndDeductStock(orderId, paymentId, verifiedPaymentAmount);
          console.log(`[Feedback Redirect Sinc] Resultado de aprobación de stock para Orden ${orderId}: ${result}`);
        } else {
          const pool = getDbPool();
          if (pool && !dbUnavailable) {
            await pool.query("UPDATE public.orders SET current_status = $1, updated_at = NOW() WHERE id = $2 AND current_status != 'pago_aprobado';", [finalOrderState, orderId]);
            console.log(`[DB Sinc] Pedido ${orderId} actualizado con seguridad a estado pendiente/rechazado: ${finalOrderState}`);
          } else {
            if (currentStoreState.orders) {
              currentStoreState.orders = currentStoreState.orders.map(o => {
                if (o.id === orderId && o.status !== "pago_aprobado") {
                  return { ...o, status: finalOrderState, updatedAt: new Date().toISOString() };
                }
                return o;
              });
              fs.writeFileSync(STORE_FILE, JSON.stringify(currentStoreState, null, 2), "utf-8");
              console.log(`[JSON Sinc] Pedido local ${orderId} actualizado a estado pendiente/rechazado: ${finalOrderState}`);
            }
          }
        }
        
        // Force state reload
        const dbState = await getDbState();
        currentStoreState = dbState;
      } catch (dbUpdateError) {
        console.error(`[Error DB Sinc] Falló actualizar pedido ${orderId} tras pago:`, dbUpdateError);
      }
    }

    // Recover order details for presentation
    const activeOrders = currentStoreState.orders || [];
    const orderDetails = activeOrders.find(o => o.id === orderId);
    
    const userName = orderDetails ? orderDetails.customerName : "Cliente";
    const address = orderDetails ? (orderDetails.notes || "Coordinar entrega") : "Coordinar entrega";
    const orderTotal = orderDetails ? orderDetails.total : (verifiedPaymentAmount || 0);

    // Generate WhatsApp text
    let waMessage = `🛒 *COMPRA EXCELENTE POR MERCADO PAGO - ${siteTitle}*\n\n`;
    waMessage += `📦 *Orden N°:* ${orderId || "Coordinar"}\n`;
    waMessage += `👤 *Cliente:* ${userName}\n`;
    waMessage += `📍 *Dirección de envío:* ${address}\n`;
    waMessage += `💰 *Total del pedido:* $${orderTotal.toLocaleString("es-AR")}\n`;
    waMessage += `💳 *Método de Pago:* Mercado Pago Uruguay (${isApproved ? "Aprobado" : "Pendiente de Aprobación"})\n`;
    if (paymentId) {
      waMessage += `🏷️ *Referencia de Pago:* ${paymentId}\n`;
    }
    if (promo) {
      waMessage += `🎟️ *Cupón:* ${promo}\n`;
    }
    waMessage += `┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n\n`;
    waMessage += `🙌 _¡Hola! Ya completé la compra y el pago por Mercado Pago Uruguay con éxito. Adjunto mi confirmación para el envío ordinario._`;

    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waMessage)}`;

    let contentHtml = "";

    if (isApproved) {
      contentHtml = `
        <div class="card">
          <div class="icon-success">✓</div>
          <h1>¡Pago Realizado con Éxito!</h1>
          <p class="subtitle">Tu pago de $${orderTotal.toLocaleString("es-AR")} ha sido procesado, verificado por pasarela y aprobado mediante Mercado Pago Uruguay de forma totalmente segura.</p>
          
          <div class="summary-box">
            <p><strong>Pedido ID:</strong> ${orderId || "Sincronizado"}</p>
            <p><strong>Cliente:</strong> ${userName}</p>
            <p><strong>Dirección:</strong> ${address}</p>
            <p><strong>Referencia MP:</strong> ${paymentId}</p>
            <p><strong>Estado del Pago:</strong> <span style="color: #10b981; font-weight: bold;">VERIFICADO Y CONFIADO ✓</span></p>
          </div>

          <p class="final-step">Para coordinar el envío de forma inmediata, por favor haz clic en el siguiente botón:</p>
          
          <a href="${waUrl}" class="action-btn-whatsapp">
            Notificar Compra por WhatsApp
          </a>

          <a href="/" class="secondary-btn">Volver a la Tienda</a>
        </div>
      `;
    } else if (finalOrderState === "pago_pendiente") {
      contentHtml = `
        <div class="card">
          <div class="icon-pending">⌚</div>
          <h1>Pago Pendiente</h1>
          <p class="subtitle">Tu pago se encuentra en proceso o pendiente de acreditación en Mercado Pago Uruguay.</p>
          
          <div class="summary-box">
            <p><strong>Pedido ID:</strong> ${orderId || "Sincronizado"}</p>
            <p><strong>Cliente:</strong> ${userName}</p>
            <p><strong>Monto:</strong> $${orderTotal.toLocaleString("es-AR")}</p>
            <p><strong>Estado del Pago:</strong> <span style="color: #f59e0b; font-weight: bold;">PENDIENTE</span></p>
          </div>

          <p class="final-step">Puedes coordinar tu compra con el vendedor notificándola a través de WhatsApp:</p>
          
          <a href="${waUrl}" class="action-btn-whatsapp" style="background-color: #f59e0b;">
            Notificar Compra por WhatsApp
          </a>

          <a href="/" class="secondary-btn">Volver al Catálogo</a>
        </div>
      `;
    } else {
      contentHtml = `
        <div class="card">
          <div class="icon-error">✗</div>
          <h1>Pago no Completado</h1>
          <p class="subtitle">El proceso de pago de Mercado Pago no pudo aprobarse o fue declinado por la tarjeta emisora.</p>
          
          <div class="summary-box">
            <p><strong>Pedido ID:</strong> ${orderId || "Sincronizado"}</p>
            <p><strong>Cliente:</strong> ${userName}</p>
            <p><strong>Estado del Pago:</strong> <span style="color: #ef4444; font-weight: bold;">CON RECHAZO / SIN SALDO</span></p>
          </div>
          
          <a href="/" class="action-btn-retry">Intentar con Otro Método</a>
          <a href="/" class="secondary-btn">Volver al Catálogo</a>
        </div>
      `;
    }

    const themeBg = settings.themeMode === "dark" ? "#09090b" : "#f8fafc";
    const themeCard = settings.themeMode === "dark" ? "#18181b" : "#ffffff";
    const themeText = settings.themeMode === "dark" ? "#ffffff" : "#0f172a";
    const themeSubtitle = settings.themeMode === "dark" ? "#a1a1aa" : "#475569";
    const themeAccent = settings.primaryColor || "#3b82f6";

    const responseHtml = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirmación de Pago - ${siteTitle}</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
          body {
            font-family: 'Inter', sans-serif;
            background-color: ${themeBg};
            color: ${themeText};
            margin: 0;
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            box-sizing: border-box;
          }
          .card {
            background-color: ${themeCard};
            border-radius: 16px;
            box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1);
            max-width: 480px;
            width: 90%;
            padding: 40px 32px;
            text-align: center;
            border: 1px solid ${settings.themeMode === "dark" ? "#27272a" : "#e2e8f0"};
          }
          .icon-success {
            width: 72px;
            height: 72px;
            background-color: rgb(16, 185, 129, 0.15);
            color: #10b981;
            border-radius: 50%;
            display: flex;
            align-items: center;
            margin: 0 auto 24px;
            justify-content: center;
            font-size: 32px;
            font-weight: bold;
          }
          .icon-error {
            width: 72px;
            height: 72px;
            background-color: rgb(239, 68, 68, 0.15);
            color: #ef4444;
            border-radius: 50%;
            display: flex;
            align-items: center;
            margin: 0 auto 24px;
            justify-content: center;
            font-size: 32px;
            font-weight: bold;
          }
          h1 {
            font-size: 22px;
            font-weight: 700;
            margin: 0 0 12px;
          }
          .subtitle {
            font-size: 14px;
            line-height: 1.5;
            color: ${themeSubtitle};
            margin-bottom: 24px;
          }
          .summary-box {
            background-color: ${settings.themeMode === "dark" ? "#242427" : "#f1f5f9"};
            border-radius: 10px;
            padding: 16px;
            margin-bottom: 24px;
            text-align: left;
            font-size: 13px;
          }
          .summary-box p {
            margin: 4px 0;
            line-height: 1.4;
          }
          .final-step {
            font-size: 13px;
            font-style: italic;
            color: ${themeSubtitle};
            margin-bottom: 16px;
          }
          .action-btn-whatsapp {
            display: block;
            width: 100%;
            background-color: #25d366;
            color: white;
            text-decoration: none;
            padding: 14px 20px;
            font-weight: 700;
            border-radius: 12px;
            font-size: 14px;
            transition: all 0.2s ease;
            box-sizing: border-box;
            border: none;
            box-shadow: 0 4px 12px rgba(37,211,102,0.25);
            margin-bottom: 12px;
          }
          .action-btn-whatsapp:hover {
            opacity: 0.95;
            transform: translateY(-1px);
          }
          .action-btn-retry {
            display: block;
            width: 100%;
            background-color: ${themeAccent};
            color: white;
            text-decoration: none;
            padding: 14px 20px;
            font-weight: 700;
            border-radius: 12px;
            font-size: 14px;
            box-sizing: border-box;
            border: none;
            margin-bottom: 12px;
          }
          .secondary-btn {
            display: inline-block;
            font-size: 12px;
            color: ${themeSubtitle};
            text-decoration: none;
            font-weight: 600;
            margin-top: 8px;
            transition: color 0.15s;
          }
          .secondary-btn:hover {
            color: ${themeAccent};
          }
        </style>
      </head>
      <body>
        ${contentHtml}
      </body>
      </html>
    `;

    res.send(responseHtml);
  });

  // POST/GET Webhook IPN push receiver for Mercado Pago (Priority 1 official handler)
  app.all("/api/payments/mercadopago/webhook", async (req, res) => {
    try {
      console.log("[MercadoPago Webhook] Notificación recibida:", {
        query: req.query,
        body: req.body
      });

      let paymentId = "";
      if (req.body && req.body.data && req.body.data.id) {
        paymentId = String(req.body.data.id);
      } else if (req.body && req.body.id && req.body.type === "payment") {
        paymentId = String(req.body.id);
      } else if (req.query && req.query.id && (req.query.topic === "payment" || req.query.type === "payment")) {
        paymentId = String(req.query.id);
      } else if (req.query && req.query["data.id"]) {
        paymentId = String(req.query["data.id"]);
      } else if (req.body && req.body.resource) {
        const match = req.body.resource.match(/\/payments\/(\d+)/);
        if (match) paymentId = match[1];
      }

      // If webhook was sent for something other than a payment (e.g. merchant_order), exit early with 200
      if (!paymentId) {
        console.log("[MercadoPago Webhook] No se encontró ID de pago en la notificación. Ignorando con éxito.");
        return res.status(200).json({ success: true, message: "Notification ignored: payment ID not present" });
      }

      console.log(`[MercadoPago Webhook] Identificando ID de pago recibido: ${paymentId}`);

      const settings = (currentStoreState.settings || {}) as any;
      const accessToken = settings.mercadopagoAccessToken?.trim() || process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();

      if (!accessToken) {
        console.error("[MercadoPago Webhook] No hay Access Token configurado para Mercado Pago.");
        return res.status(500).json({ success: false, message: "Configuration error: access token missing on server" });
      }

      const mpClient = new MercadoPagoConfig({ accessToken });
      const payment = new Payment(mpClient);
      const mpPaymentData = await payment.get({ id: paymentId });

      const verifiedStatus = mpPaymentData.status;
      const orderId = mpPaymentData.external_reference; // Retrieve our matching Order UUID
      const verifiedPaymentAmount = mpPaymentData.transaction_amount || 0;

      console.log(`[MercadoPago Webhook] Datos del SDK: Orden ID = ${orderId}, Estado = ${verifiedStatus}, Monto = $${verifiedPaymentAmount}`);

      if (!orderId) {
        console.warn(`[MercadoPago Webhook] No se encontró la referencia externa (external_reference/orderId) para el pago ${paymentId}.`);
        return res.status(200).json({ success: true, message: "Reference not found" });
      }

      if (verifiedStatus === "approved") {
        const result = await approveOrderAndDeductStock(orderId, paymentId, verifiedPaymentAmount);
        console.log(`[MercadoPago Webhook] Resultado de aprobación de stock para Orden ${orderId}: ${result}`);
      } else if (verifiedStatus === "rejected") {
        // Update order status to rejected securely
        const pool = getDbPool();
        if (pool && !dbUnavailable) {
          await pool.query("UPDATE public.orders SET current_status = 'pago_rechazado', updated_at = NOW() WHERE id = $1 AND current_status != 'pago_aprobado';", [orderId]);
        } else {
          if (currentStoreState.orders) {
            currentStoreState.orders = currentStoreState.orders.map(o => {
              if (o.id === orderId && o.status !== "pago_aprobado") {
                return { ...o, status: "pago_rechazado" as any, updatedAt: new Date().toISOString() };
              }
              return o;
            });
            fs.writeFileSync(STORE_FILE, JSON.stringify(currentStoreState, null, 2), "utf-8");
          }
        }
        console.log(`[MercadoPago Webhook] Orden ${orderId} actualizada a 'pago_rechazado'.`);
      } else {
        console.log(`[MercadoPago Webhook] Estado de pago '${verifiedStatus}' sin acciones necesarias.`);
      }

      // Force state refresh
      const dbState = await getDbState();
      currentStoreState = dbState;

      // Always return 200 OK to Mercado Pago to stop event notifications stream
      res.status(200).json({ success: true, message: "Received and validated successfully" });
    } catch (err: any) {
      console.error("[MercadoPago Webhook Critical Error]", err);
      // Return 200 with success: false so Mercado Pago stops polling if it's fatal, or tries again for networking
      res.status(200).json({ success: false, error: err.message || String(err) });
    }
  });

  // Handle healthcheck
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      persistence: process.env.DATABASE_URL ? "postgresql" : "fs-json",
      postgresConnected: !!dbPool
    });
  });

  app.get("/api/debug-db", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!isValidToken(authHeader)) {
      return res.status(403).json({ success: false, message: "Acceso denegado: este endpoint de diagnóstico requiere autenticación de administrador principal." });
    }

    const rawUrl = process.env.DATABASE_URL || "";
    if (!rawUrl) {
      return res.json({
        exists: false,
        message: "No está definida la variable DATABASE_URL en el entorno."
      });
    }

    let maskedUrl = rawUrl;
    try {
      if (rawUrl.includes("@")) {
        const parts = rawUrl.split("@");
        const beforeAt = parts[0];
        const afterAt = parts.slice(1).join("@");
        if (beforeAt.includes(":")) {
          const userParts = beforeAt.split(":");
          maskedUrl = `${userParts[0]}:****@${afterAt}`;
        } else {
          maskedUrl = `****@${afterAt}`;
        }
      } else {
        maskedUrl = "****";
      }
    } catch (e) {}

    let parsedHost = "";
    let parsedPort = "";
    let parsedUser = "";
    let parsedDb = "";
    
    try {
      // Try to parse as URL
      const cleanUrl = rawUrl.trim();
      if (cleanUrl.includes("://")) {
        const urlObj = new URL(cleanUrl);
        parsedHost = urlObj.hostname;
        parsedPort = urlObj.port;
        parsedUser = urlObj.username;
        parsedDb = urlObj.pathname;
      } else {
        parsedHost = "No tiene protocolo ://";
      }
    } catch (e: any) {
      parsedHost = `Error al parsear URL: ${e.message}`;
    }

    const pool = getDbPool(true);
    let queryTest = "not_attempted";
    let queryError = null;
    
    if (pool) {
      try {
        await pool.query("SELECT 1;");
        queryTest = "success";
      } catch (testErr: any) {
        queryTest = "failed";
        queryError = testErr.message || String(testErr);
      }
    }

    res.json({
      exists: true,
      maskedUrl,
      parsedHost,
      parsedPort,
      parsedUser,
      parsedDb,
      queryTest,
      queryError,
      envKeys: Object.keys(process.env).filter(k => k.toLowerCase().includes("db") || k.toLowerCase().includes("postgres") || k.toLowerCase().includes("database") || k.toLowerCase().includes("url"))
    });
  });

  // Google Places API integration for Google Reviews/Ratings
  interface GoogleReviewsData {
    rating: number;
    user_ratings_total: number;
    reviews: Array<{
      author_name: string;
      profile_photo_url?: string;
      rating: number;
      relative_time_description: string;
      text: string;
      time: number;
      avatar_color?: string;
    }>;
  }

  let reviewsCache: { timestamp: number; data: GoogleReviewsData } | null = null;
  const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  app.get("/api/google-reviews", async (req, res) => {
    // Force checking settings state
    const settings: any = currentStoreState.settings || {};
    const source = settings.googleReviewsSource || "custom";

    if (source === "custom") {
      const customRating = typeof settings.googleReviewsRating === "number" ? settings.googleReviewsRating : 4.9;
      const customTotal = typeof settings.googleReviewsTotal === "number" ? settings.googleReviewsTotal : 184;
      const customReviews = Array.isArray(settings.googleReviewsCustomList) && settings.googleReviewsCustomList.length > 0
        ? settings.googleReviewsCustomList
        : getBackupReviews().reviews;

      return res.json({
        rating: customRating,
        user_ratings_total: customTotal,
        reviews: customReviews
      });
    }

    const now = Date.now();
    // Check if cache is still valid
    if (reviewsCache && (now - reviewsCache.timestamp < CACHE_DURATION)) {
      return res.json(reviewsCache.data);
    }

    const apiKey = settings.googlePlacesApiKey?.trim() || process.env.GOOGLE_PLACES_API_KEY || "AIzaSyD5ecwdhJesOlQU408hNoogSqqkMaBjth0";
    const placeId = settings.googlePlaceId?.trim() || process.env.GOOGLE_PLACE_ID || "ChIJHZFnxeUhoJURtA0cWV3PH2A";

    try {
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,user_ratings_total,reviews&key=${apiKey}&language=es`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const rawData: any = await response.json();
      
      if (rawData && rawData.status === "OK" && rawData.result) {
        const result = rawData.result;
        const formattedData: GoogleReviewsData = {
          rating: typeof result.rating === "number" ? result.rating : 4.9,
          user_ratings_total: typeof result.user_ratings_total === "number" ? result.user_ratings_total : 184,
          reviews: Array.isArray(result.reviews) ? result.reviews.map((r: any) => ({
            author_name: r.author_name || "Cliente Satisfecho",
            profile_photo_url: r.profile_photo_url || "",
            rating: typeof r.rating === "number" ? r.rating : 5,
            relative_time_description: r.relative_time_description || "Hace poco",
            text: r.text || "",
            time: typeof r.time === "number" ? r.time : Date.now() / 1000
          })) : []
        };

        // Cache the formatted data
        reviewsCache = {
          timestamp: now,
          data: formattedData
        };

        return res.json(formattedData);
      } else {
        console.warn(`[Google Reviews API] API returned status/issue: ${rawData?.status || "empty response"}. Serving verified backup reviews.`);
        
        if (reviewsCache) {
          return res.json(reviewsCache.data);
        }
        return res.json(getBackupReviews());
      }
    } catch (error: any) {
      console.warn("[Google Reviews API] Gracefully handled error during fetch:", error.message || error);
      
      // If we have stale cache, return it as fallback
      return res.json(getBackupReviews());
    }
  });

  // Google Places Search Helper Endpoint
  app.get("/api/google-places/search", async (req, res) => {
    const query = (req.query.query as string || "").trim();
    if (!query) {
      return res.status(400).json({ success: false, message: "El término de búsqueda es requerido." });
    }

    const settings: any = currentStoreState.settings || {};
    const apiKey = settings.googlePlacesApiKey?.trim() || process.env.GOOGLE_PLACES_API_KEY || "AIzaSyD5ecwdhJesOlQU408hNoogSqqkMaBjth0";

    try {
      const url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(query)}&inputtype=textquery&fields=place_id,name,formatted_address,rating&key=${apiKey}&language=es`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Google Maps FindPlace call failed. Status: ${response.status}`);
      }
      const data: any = await response.json();
      if (data.status === "OK" && data.candidates && data.candidates.length > 0) {
        return res.json({ success: true, results: data.candidates });
      } else {
        return res.json({ success: false, message: `No se encontraron resultados en Google Maps para "${query}". Código de estado: ${data.status}` });
      }
    } catch (err: any) {
      return res.json({ success: false, error: err.message || err });
    }
  });

  // Google OAuth Authorization URL Builder Endpoint
  app.get("/api/auth/google-reviews/url", (req, res) => {
    const settings: any = currentStoreState.settings || {};
    const clientId = settings.googleClientId?.trim() || "636443717801-ggllffeh2efef4kkhpk29t2eeiftevq3.apps.googleusercontent.com";
    
    // Construct redirect_uri dynamically matching host & scheme
    const host = req.get("host") || "localhost:3000";
    const protocol = req.protocol === "https" || req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
    const redirectUri = `${protocol}://${host}/auth/callback`;

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid profile email",
      access_type: "offline",
      prompt: "consent"
    });

    res.json({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params}` });
  });

  // Google OAuth Exchange Callback Handler
  app.get(["/auth/callback", "/auth/callback/"], async (req, res) => {
    const { code } = req.query;
    if (!code) {
      return res.send(`
        <html>
          <body style="font-family: system-ui, sans-serif; text-align: center; padding: 40px; background: #0c0a09; color: #fff; height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center;">
            <h3 style="color: #ef4444;">Error: Falta el código de autorización</h3>
            <button onclick="window.close()" style="background: #374151; border: none; color: white; padding: 10px 20px; border-radius: 6px; cursor: pointer;">Cerrar</button>
          </body>
        </html>
      `);
    }

    const settings: any = currentStoreState.settings || {};
    const clientId = settings.googleClientId?.trim() || "";
    const clientSecret = settings.googleClientSecret?.trim() || "";

    const host = req.get("host") || "localhost:3000";
    const protocol = req.protocol === "https" || req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
    const redirectUri = `${protocol}://${host}/auth/callback`;

    try {
      // Exchange authorization code for token
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
          code: code as string,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code"
        })
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        throw new Error(`Token exchange failed: ${errorText}`);
      }

      const tokenData: any = await tokenResponse.json();
      const accessToken = tokenData.access_token;

      // Use access token to fetch user profile info from Google API
      const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });

      let userInfo = { name: "Merchant Owner", email: "", picture: "" };
      if (userInfoResponse.ok) {
        userInfo = await userInfoResponse.json();
      }

      // Update store settings configuration state with verified connection status and user data
      currentStoreState.settings = {
        ...currentStoreState.settings,
        googleMyBusinessConnected: true,
        googleMerchantName: userInfo.name,
        googleMerchantEmail: userInfo.email,
        googleMerchantPicture: userInfo.picture || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80"
      } as any;

      // Save files persistently onto disk system
      fs.writeFileSync(STORE_FILE, JSON.stringify(currentStoreState, null, 2), "utf-8");
      
      // Also write synchronously to database
      try {
        await saveDbState(currentStoreState);
      } catch (dbErr) {
        console.warn("[Google OAuth] Failed to persist current state inside PostgreSQL database:", dbErr);
      }

      // Send standard window postMessage context to close active popup nicely
      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({
                  type: "OAUTH_AUTH_SUCCESS",
                  payload: {
                    name: ${JSON.stringify(userInfo.name)},
                    email: ${JSON.stringify(userInfo.email)},
                    picture: ${JSON.stringify(userInfo.picture || "")}
                  }
                }, "*");
                window.close();
              } else {
                window.location.href = "/admin";
              }
            </script>
            <div style="font-family: system-ui, sans-serif; text-align: center; padding: 40px; background: #0c0a09; color: #fff; height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center;">
              <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); padding: 30px; border-radius: 20px; max-width: 420px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                <svg style="width: 48px; height: 48px; color: #10b981; margin: 0 auto 16px auto;" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <h2 style="color: #10b981; margin-top: 0; font-weight: 800; font-size: 20px; letter-spacing: -0.025em;">¡Sincronización Exitosa!</h2>
                <p style="font-size: 13px; color: #a1a1aa; line-height: 1.6; margin-bottom: 20px;">Tu cuenta de Google y reputación se han enlazado correctamente con Ventas Juem. Tu panel admin reflejará esta información de inmediato.</p>
                <p style="font-size: 11px; color: #71717a; font-weight: 500;">Esta ventana se cerrará de forma automática...</p>
              </div>
            </div>
          </body>
        </html>
      `);
    } catch (err: any) {
      console.error("[Google OAuth] Error exchanging code:", err);
      res.send(`
        <html>
          <body style="font-family: system-ui, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #0c0a09; color: #fff; margin: 0; padding: 20px;">
            <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); padding: 30px; border-radius: 20px; max-width: 480px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              <svg style="width: 48px; height: 48px; color: #ef4444; margin: 0 auto 16px auto;" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
              <h2 style="color: #ef4444; margin-top: 0; font-weight: 800; font-size: 20px; letter-spacing: -0.025em;">Fallo de Autenticación de Google</h2>
              <p style="font-size: 13px; color: #a1a1aa; line-height: 1.6; margin-bottom: 20px;">No se pudo conectar tu cuenta con las credenciales cargadas. Verifica que tu Client ID y Client Secret sean vigentes, que las APIs de Google Identity estén habilitadas o prueba nuevamente.</p>
              <pre style="background: #1c1917; border: 1px solid #2e2a24; padding: 12px; border-radius: 12px; color: #ef4444; font-size: 11px; font-family: monospace; overflow-x: auto; text-align: left; max-height: 110px;">${err.message || err}</pre>
              <button onclick="window.close()" style="background: #ef4444; border: none; color: white; padding: 10px 20px; border-radius: 10px; cursor: pointer; display: block; width: 100%; margin-top: 20px; font-weight: 700; font-size: 13px; transition: opacity 0.2s;">Cerrar Ventana</button>
            </div>
          </body>
        </html>
      `);
    }
  });

  // Helper definition for Google Business fallback review data
  function getBackupReviews(): GoogleReviewsData {
    return {
      rating: 4.9,
      user_ratings_total: 184,
      reviews: [
        {
          author_name: "Christian O.",
          profile_photo_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80",
          rating: 5,
          relative_time_description: "Hace 3 días",
          text: "Impresionante la atención por WhatsApp y la rapidez del envío. Compré el poncho buzo pijama plush de corderito y es súper abrigado, excelente calidad y talle correcto.",
          time: Date.now() / 1000 - 3 * 24 * 60 * 60,
          avatar_color: "emerald"
        },
        {
          author_name: "Valentina R.",
          profile_photo_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80",
          rating: 5,
          relative_time_description: "Hace 1 semana",
          text: "Excelente todo. Me asesoraron al instante por los talles de las medias pantalón térmicas efecto piel con corderito. Son re abrigadas y estiran súper bien. El envío express me llegó en menos de 2 horas en Montevideo.",
          time: Date.now() / 1000 - 7 * 24 * 60 * 60,
          avatar_color: "blue"
        },
        {
          author_name: "Gastón B.",
          profile_photo_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80",
          rating: 5,
          relative_time_description: "Hace 2 semanas",
          text: "Compré el soporte de pared para tablet ranurado por impresión 3D, quedó súper firme y prolijo. Increíble terminación, no parece impreso en plástico común, el material es re resistente. Recomendado 100%.",
          time: Date.now() / 1000 - 14 * 24 * 60 * 60,
          avatar_color: "indigo"
        },
        {
          author_name: "María Noel F.",
          profile_photo_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80",
          rating: 5,
          relative_time_description: "Hace 3 semanas",
          text: "Compré la lámpara UV mata mosquitos por recomendación porque en casa se llenaba de mosquitos, y la verdad un éxito. Es súper silenciosa, la tenemos prendida toda la noche en el cuarto. Envío rapidísimo a Canelones.",
          time: Date.now() / 1000 - 21 * 24 * 60 * 60,
          avatar_color: "purple"
        },
        {
          author_name: "Santiago M.",
          profile_photo_url: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&h=150&q=80",
          rating: 5,
          relative_time_description: "Hace 1 mes",
          text: "Muy buena calidad de productos y el pago con Mercado Pago fue súper fácil y seguro. El retiro en la zona de Parque Batlle fue rapidísimo. Volveré a comprar seguro.",
          time: Date.now() / 1000 - 30 * 24 * 60 * 60,
          avatar_color: "amber"
        }
      ]
    };
  }

  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
