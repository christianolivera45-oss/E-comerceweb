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
    siteTitle: "Apex Outlet",
    siteSubtitle: "Moda, tecnología y accesorios con envío a todo el país.",
    bannerTitle: "Colección Exclusiva de Primavera",
    bannerSubtitle: "Descubre las últimas tendencias con descuentos de hasta el 40%.",
    bannerImageUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=80",
    whatsappNumber: "5491123456789", // Default dummy format, editable
    primaryColor: "#3b82f6", // Indigo/Blue
    accentColor: "#10b981", // Emerald
    themeMode: "dark",
    promotionBannerText: "🚚 ¡ENVÍO GRATUITO en compras superiores a $50! Código: APEX50",
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
        return DEFAULT_SHOP_STATE;
      }

      let parsed: ShopState;
      try {
        parsed = JSON.parse(content) as ShopState;
      } catch (parseErr) {
        console.error("El archivo store.json contiene JSON inválido. Reconstruyendo con el estado por defecto...", parseErr);
        fs.writeFileSync(STORE_FILE, JSON.stringify(DEFAULT_SHOP_STATE, null, 2), "utf-8");
        return DEFAULT_SHOP_STATE;
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
      return DEFAULT_SHOP_STATE;
    }
  } catch (err) {
    console.error("Error accessing data store, using defaults:", err);
    return DEFAULT_SHOP_STATE;
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
    // Crear tabla de configuración global si no existe
    await pool.query(`
      CREATE TABLE IF NOT EXISTS shop_state (
        id VARCHAR(50) PRIMARY KEY,
        state JSONB NOT NULL
      );
    `);

    // Intentar leer el estado guardado
    const res = await pool.query("SELECT state FROM shop_state WHERE id = 'latest';");
    if (res.rows.length > 0) {
      console.log("Estado cargado con éxito desde PostgreSQL.");
      writeDiagnosticReport("No error - Loaded successfully");
      return res.rows[0].state as ShopState;
    } else {
      // Si la tabla está vacía, inicializamos con el estado predeterminado
      console.log("La base de datos PostgreSQL está vacía. Inicializando con el estado inicial...");
      await pool.query(
          "INSERT INTO shop_state (id, state) VALUES ('latest', $1) ON CONFLICT (id) DO UPDATE SET state = EXCLUDED.state;",
          [JSON.stringify(DEFAULT_SHOP_STATE)]
      );
      writeDiagnosticReport("No error - Initialized successfully");
      return DEFAULT_SHOP_STATE;
    }
  } catch (err: any) {
    console.error("Error al inicializar la base de datos PostgreSQL:", err);
    writeDiagnosticReport(err.message || String(err));
    return null;
  }
}

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "juem-salt-1248").digest("hex");
}

async function savePostgresStore(state: ShopState): Promise<boolean> {
  const pool = getDbPool();
  if (!pool) return false;

  try {
    await pool.query(
      "INSERT INTO shop_state (id, state) VALUES ('latest', $1) ON CONFLICT (id) DO UPDATE SET state = EXCLUDED.state;",
      [JSON.stringify(state)]
    );
    console.log("Estado guardado con éxito en PostgreSQL.");
    return true;
  } catch (err) {
    console.error("Error al guardar estado en PostgreSQL:", err);
    return false;
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "15mb" })); // Support large images or custom payloads

  // In-memory cache synced with store.json
  let currentStoreState = initDataStore();

  function isValidToken(authHeader: string | undefined): boolean {
    if (!authHeader || !authHeader.startsWith("Bearer ")) return false;
    const token = authHeader.substring(7);
    
    const creds = currentStoreState.adminCredentials;
    const expectedToken = creds?.sessionToken || "session-juem-admin-token-olivera45";
    
    // Fallback logic for basic backward compatibility with first session
    if (!creds && token === "session-juem-admin-token-olivera45") {
      return true;
    }
    
    return token === expectedToken;
  }

  // Cargar estado de Postgres si DATABASE_URL está definido
  if (process.env.DATABASE_URL) {
    try {
      const pgState = await initPostgresStore();
      if (pgState) {
        currentStoreState = pgState;
        console.log("Estado sincronizado con base de datos PostgreSQL.");
      }
    } catch (pgError) {
      console.error("No se pudo cargar de Postgres en el inicio, usando cache local:", pgError);
    }
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
            await savePostgresStore(currentStoreState);
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
        await savePostgresStore(currentStoreState);
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
  app.get("/api/store", (req, res) => {
    res.json(currentStoreState);
  });

  // POST update store state
  app.post("/api/store", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!isValidToken(authHeader)) {
      return res.status(403).json({ success: false, message: "Acceso no autorizado." });
    }

    const { products, categories, settings, dbCategories, dbSubcategories } = req.body;
    if (!products || !categories || !settings) {
      return res.status(400).json({ success: false, message: "Datos incompletos." });
    }

    try {
      currentStoreState = { 
        products, 
        categories, 
        settings,
        dbCategories: dbCategories || currentStoreState.dbCategories,
        dbSubcategories: dbSubcategories || currentStoreState.dbSubcategories
      };
      
      // Guardar en archivo local como respaldo
      try {
        fs.writeFileSync(STORE_FILE, JSON.stringify(currentStoreState, null, 2), "utf-8");
      } catch (fsErr) {
        console.error("Error al escribir respaldo en archivo local:", fsErr);
      }

      // Guardar en la base de datos PostgreSQL si está definido
      if (process.env.DATABASE_URL) {
        await savePostgresStore(currentStoreState);
      }

      res.json({ success: true, message: "Cambios guardados con éxito en el servidor." });
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
