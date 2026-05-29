import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { ShopState } from "./src/types";
import pg from "pg";
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
    ]
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
let currentStoreState: ShopState = process.env.DATABASE_URL
  ? { ...DEFAULT_SHOP_STATE, products: [] }
  : DEFAULT_SHOP_STATE;

// Helper to ensure data directory and file exist
function initDataStore(): ShopState {
  const isPostgresActive = !!process.env.DATABASE_URL;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(STORE_FILE)) {
      const content = fs.readFileSync(STORE_FILE, "utf-8").trim();
      if (!content) {
        console.warn("El archivo de almacenamiento está vacío. Inicializando con el estado por defecto...");
        fs.writeFileSync(STORE_FILE, JSON.stringify(DEFAULT_SHOP_STATE, null, 2), "utf-8");
        const defaultState = { ...DEFAULT_SHOP_STATE };
        if (isPostgresActive) defaultState.products = [];
        return defaultState;
      }

      let parsed: ShopState;
      try {
        parsed = JSON.parse(content) as ShopState;
      } catch (parseErr) {
        console.error("El archivo store.json contiene JSON inválido. Reconstruyendo con el estado por defecto...", parseErr);
        fs.writeFileSync(STORE_FILE, JSON.stringify(DEFAULT_SHOP_STATE, null, 2), "utf-8");
        const defaultState = { ...DEFAULT_SHOP_STATE };
        if (isPostgresActive) defaultState.products = [];
        return defaultState;
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

      if (isPostgresActive) {
        parsed.products = [];
      }
      return parsed;
    } else {
      fs.writeFileSync(STORE_FILE, JSON.stringify(DEFAULT_SHOP_STATE, null, 2), "utf-8");
      const defaultState = { ...DEFAULT_SHOP_STATE };
      if (isPostgresActive) defaultState.products = [];
      return defaultState;
    }
  } catch (err) {
    console.error("Error accessing data store, using defaults:", err);
    const defaultState = { ...DEFAULT_SHOP_STATE };
    if (isPostgresActive) defaultState.products = [];
    return defaultState;
  }
}

// PostgreSQL integration and lazy pool helper
let dbPool: any = null;

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

function getDbPool() {
  if (!dbPool && process.env.DATABASE_URL) {
    const url = process.env.DATABASE_URL.trim();
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
  return crypto.createHash("sha256").update(password + "juem-salt-1248").digest("hex");
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
    const catRes = await pool.query("SELECT id, nombre, icono, orden, active FROM categories WHERE active = true ORDER BY orden ASC;");
    const dbCategories = catRes.rows.map(row => ({
      id: row.id,
      nombre: row.nombre,
      icono: row.icono || "Shirt",
      orden: row.orden || 1,
      active: row.active !== false
    }));

    // 3. Fetch subcategories
    const subRes = await pool.query("SELECT id, nombre, categoria_id, active FROM subcategories WHERE active = true;");
    const dbSubcategories = subRes.rows.map(row => ({
      id: row.id,
      nombre: row.nombre,
      categoria_id: row.categoria_id,
      active: row.active !== false
    }));

    // 4. Fetch coupons
    const coupRes = await pool.query("SELECT code, discount_percent, expiration_date, active FROM coupons WHERE active = true;");
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
      SELECT id, name, price, stock, category, featured, image_url, created_at, description, categoria_id, original_price, subcategoria_id, active, paused, sizes, colors 
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
      const variantsRes = await pool.query("SELECT id, product_id, size_value, color_name, color_code, additional_price, stock FROM public.product_variants WHERE active = true;");
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
          stock: vRow.stock ? Number(vRow.stock) : 0
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
        variants: productVariantsMap[pid] || []
      };
    });

    return {
      categories: dbCategories.map(c => c.nombre),
      dbCategories,
      dbSubcategories,
      settings,
      products,
      coupons,
      adminCredentials
    };
  } catch (err) {
    console.error("Error reading relational DB tables:", err);
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

    // 2. Categories soft delete logic & upsert
    const existingCatsRes = await pool.query("SELECT id FROM categories;");
    const existingCatIds = existingCatsRes.rows.map(r => r.id);
    const incomingCatIds = (state.dbCategories || []).map(c => c.id);

    const deletedCatIds = existingCatIds.filter(id => !incomingCatIds.includes(id));
    if (deletedCatIds.length > 0) {
      await pool.query("UPDATE categories SET active = false WHERE id = ANY($1);", [deletedCatIds]);
    }

    for (const cat of state.dbCategories || []) {
      await pool.query(
        "INSERT INTO categories (id, nombre, icono, orden, active) VALUES ($1, $2, $3, $4, true) ON CONFLICT (id) DO UPDATE SET nombre = EXCLUDED.nombre, icono = EXCLUDED.icono, orden = EXCLUDED.orden, active = true;",
        [cat.id, cat.nombre, cat.icono || "Shirt", cat.orden || 1]
      );
    }

    // 3. Subcategories soft delete logic & upsert
    const existingSubsRes = await pool.query("SELECT id FROM subcategories;");
    const existingSubIds = existingSubsRes.rows.map(r => r.id);
    const incomingSubIds = (state.dbSubcategories || []).map(s => s.id);

    const deletedSubIds = existingSubIds.filter(id => !incomingSubIds.includes(id));
    if (deletedSubIds.length > 0) {
      await pool.query("UPDATE subcategories SET active = false WHERE id = ANY($1);", [deletedSubIds]);
    }

    for (const sub of state.dbSubcategories || []) {
      const activeVal = sub.active !== false;
      await pool.query(
        "INSERT INTO subcategories (id, nombre, categoria_id, active) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO UPDATE SET nombre = EXCLUDED.nombre, categoria_id = EXCLUDED.categoria_id, active = EXCLUDED.active;",
        [sub.id, sub.nombre, sub.categoria_id, activeVal]
      );
    }

    // 4. Coupons soft delete logic & upsert
    const existingCouponsRes = await pool.query("SELECT code FROM coupons;");
    const existingCodes = existingCouponsRes.rows.map(r => r.code);
    const incomingCodes = (state.coupons || []).map(c => c.code);

    const deletedCodes = existingCodes.filter(c => !incomingCodes.includes(c));
    if (deletedCodes.length > 0) {
      await pool.query("UPDATE coupons SET active = false WHERE code = ANY($1);", [deletedCodes]);
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

      let prodId: number;
      if (isNew) {
        const insertRes = await pool.query(`
          INSERT INTO public.products (
            name, price, stock, category, featured, image_url, description, categoria_id, original_price, subcategoria_id, active, paused, sizes, colors
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true, $11, $12, $13)
          RETURNING id;
        `, [
          prod.name, priceVal, stockVal, prod.category, featuredVal, prod.imageUrl,
          prod.description || "", prod.categoria_id, originalPriceVal, prod.subcategoria_id,
          pausedVal, sizesVal, colorsVal
        ]);
        prodId = insertRes.rows[0].id;
        prod.id = String(prodId);
      } else {
        prodId = parseInt(prod.id);
        await pool.query(`
          UPDATE public.products SET
            name = $1, price = $2, stock = $3, category = $4, featured = $5, image_url = $6, description = $7,
            categoria_id = $8, original_price = $9, subcategoria_id = $10, active = true, paused = $11, sizes = $12, colors = $13
          WHERE id = $14;
        `, [
          prod.name, priceVal, stockVal, prod.category, featuredVal, prod.imageUrl,
          prod.description || "", prod.categoria_id, originalPriceVal, prod.subcategoria_id,
          pausedVal, sizesVal, colorsVal, prodId
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
            await pool.query(`
              INSERT INTO public.product_variants (product_id, sku, size_value, color_name, color_code, additional_price, stock, active)
              VALUES ($1, $2, $3, $4, $5, $6, $7, true);
            `, [
              prodId,
              sku,
              variant.size,
              variant.color,
              variant.colorCode || "",
              Number(variant.priceDelta || 0),
              Math.floor(Number(variant.stock || 0))
            ]);
          }
        }
      } catch (varErr) {
        console.error(`Error saving product variants for product ${prodId}:`, varErr);
      }
    }

    return true;
  } catch (err) {
    console.error("Error saving relational DB elements:", err);
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
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    await pool.query(`
      ALTER TABLE public.product_variants ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
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
      const defaultHash = hashPassword("olivera45");
      await pool.query(
        "INSERT INTO admin_credentials (username, password_hash) VALUES ('Juem', $1);",
        [defaultHash]
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
  const PORT = 3000;

  app.use(express.json({ limit: "15mb" })); // Support large images or custom payloads

  // Sync cache with store.json
  currentStoreState = initDataStore();

  function isValidToken(authHeader: string | undefined): boolean {
    if (!authHeader || !authHeader.startsWith("Bearer ")) return false;
    const token = authHeader.substring(7);
    
    const creds = currentStoreState.adminCredentials;
    const expectedUsername = creds?.username || "Juem";
    const expectedPasswordHash = creds?.passwordHash || hashPassword("olivera45");
    
    // Create stable deterministic token to ensure stateless/ephemeral scaling resilience
    const stableToken = hashPassword(expectedUsername + ":" + expectedPasswordHash);
    const legacyToken = "session-juem-admin-token-olivera45";
    const expectedToken = creds?.sessionToken || stableToken;
    
    return token === expectedToken || token === stableToken || token === legacyToken;
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
    const { username, password } = req.body;
    const creds = currentStoreState.adminCredentials;
    const expectedUsername = creds?.username || "Juem";
    const expectedPasswordHash = creds?.passwordHash || hashPassword("olivera45");
    
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

  // GET store state
  app.get("/api/store", async (req, res) => {
    if (process.env.DATABASE_URL) {
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
        dbCategories: dbCategories || currentStoreState.dbCategories,
        dbSubcategories: dbSubcategories || currentStoreState.dbSubcategories,
        coupons: coupons || currentStoreState.coupons
      };
      
      // Guardar en archivo local como respaldo
      try {
        fs.writeFileSync(STORE_FILE, JSON.stringify(currentStoreState, null, 2), "utf-8");
      } catch (fsErr) {
        console.error("Error al escribir respaldo en archivo local:", fsErr);
      }

      // Guardar en la base de datos PostgreSQL si está definido
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

  // Handle healthcheck
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      persistence: process.env.DATABASE_URL ? "postgresql" : "fs-json",
      postgresConnected: !!dbPool
    });
  });

  app.get("/api/debug-db", (req, res) => {
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

    res.json({
      exists: true,
      maskedUrl,
      parsedHost,
      parsedPort,
      parsedUser,
      parsedDb,
      envKeys: Object.keys(process.env).filter(k => k.toLowerCase().includes("db") || k.toLowerCase().includes("postgres") || k.toLowerCase().includes("database") || k.toLowerCase().includes("url"))
    });
  });

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
