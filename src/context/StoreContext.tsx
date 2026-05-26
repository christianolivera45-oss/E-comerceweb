import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  db, 
  auth, 
  googleProvider, 
  OperationType, 
  handleFirestoreError 
} from '../firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';
import { signInWithPopup, signOut, onAuthStateChanged, User, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { Product, Category, Promotion, Settings, CartItem } from '../types';
import { 
  INITIAL_CATEGORIES, 
  INITIAL_PRODUCTS, 
  INITIAL_SETTINGS, 
  INITIAL_PROMOTIONS 
} from '../initialData';

interface StoreContextType {
  // Database status
  isOnline: boolean;
  isSandbox: boolean;
  loading: boolean;
  
  // Auth state
  user: User | null;
  isAdminUser: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithCredentials: (username: string, pass: string) => Promise<boolean>;
  logout: () => Promise<void>;
  authError: string | null;
  setAuthError: (error: string | null) => void;

  // CMS state
  settings: Settings;
  saveSettings: (newSettings: Settings) => Promise<void>;

  // Products
  products: Product[];
  saveProduct: (product: Product) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;

  // Categories
  categories: Category[];
  saveCategory: (category: Category) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;

  // Promotions
  promotions: Promotion[];
  savePromotion: (promo: Promotion) => Promise<void>;
  deletePromotion: (promoId: string) => Promise<void>;

  // Shopping Cart
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  appliedPromo: Promotion | null;
  applyPromoCode: (code: string) => boolean;
  cartTotal: number;
  cartSubtotal: number;
  cartDiscount: number;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within a StoreProvider');
  return context;
};

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [isSandbox, setIsSandbox] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  
  // Auth states
  const [user, setUser] = useState<User | null>(null);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Entities state
  const [settings, setSettings] = useState<Settings>(INITIAL_SETTINGS);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [promotions, setPromotions] = useState<Promotion[]>(INITIAL_PROMOTIONS);

  // Cart state
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('store_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [appliedPromo, setAppliedPromo] = useState<Promotion | null>(null);

  // Save cart to localStorage
  useEffect(() => {
    localStorage.setItem('store_cart', JSON.stringify(cart));
  }, [cart]);

  // Auth Sync Listener
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const isBootstrapAdmin = currentUser.email === 'justiciaotec@gmail.com' && currentUser.emailVerified;
        const isCustomCredentialsAdmin = currentUser.email === 'juem@olivera45.com';
        
        if (isBootstrapAdmin || isCustomCredentialsAdmin) {
          setIsAdminUser(true);
          if (isCustomCredentialsAdmin) {
            localStorage.setItem('admin_logged_in', 'true');
          }
        } else {
          // Check database admins collection
          try {
            const adminDoc = await getDoc(doc(db, 'admins', currentUser.uid));
            if (adminDoc.exists()) {
              setIsAdminUser(true);
            } else {
              setIsAdminUser(false);
            }
          } catch (e) {
            setIsAdminUser(false);
          }
        }
      } else {
        // No current Firebase authenticated user. Check local credential login state
        const isCustomLoggedIn = localStorage.getItem('admin_logged_in') === 'true';
        if (isCustomLoggedIn) {
          setIsAdminUser(true);
          setUser({
            uid: 'admin_juem',
            email: 'juem@olivera45.com',
            displayName: 'Juem',
            emailVerified: true
          } as any);
        } else {
          setIsAdminUser(false);
          setUser(null);
        }
      }
    });
    return unsubAuth;
  }, []);

  // Sync Products, Categories, Settings and Promos from Firestore
  useEffect(() => {
    let unsubSettings: () => void = () => {};
    let unsubProducts: () => void = () => {};
    let unsubCategories: () => void = () => {};
    let unsubPromotions: () => void = () => {};

    const syncDatabase = async () => {
      try {
        setLoading(true);

        // 1. Check/Fetch Settings with fallback
        unsubSettings = onSnapshot(doc(db, 'settings', 'main-settings'), (snapshot) => {
          if (snapshot.exists()) {
            setSettings(snapshot.data() as Settings);
          } else {
            // Create main settings model if it doesn't exist
            setSettings(INITIAL_SETTINGS);
            // Non-blocking initialization - only if admin is active
            if (localStorage.getItem('admin_logged_in') === 'true') {
              setDoc(doc(db, 'settings', 'main-settings'), INITIAL_SETTINGS).catch(() => {});
            }
          }
          setIsOnline(true);
          setIsSandbox(false);
        }, (error) => {
          console.warn("Firestore settings read failed. Activating local sandbox configuration.", error);
          setIsSandbox(true);
          // Try loading from localStorage custom store if any
          const savedSettings = localStorage.getItem('sandbox_settings');
          if (savedSettings) setSettings(JSON.parse(savedSettings));
        });

        // 2. Fetch Products
        unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
          const fetchedProducts: Product[] = [];
          snapshot.forEach((docSnap) => {
            fetchedProducts.push({ id: docSnap.id, ...docSnap.data() } as Product);
          });
          
          if (fetchedProducts.length > 0) {
            // Sort by order/date or name
            setProducts(fetchedProducts);
          } else {
            // Empty products list in Firestore: init with defaults
            setProducts(INITIAL_PRODUCTS);
            // Non-blocking upload helper for testing cloud store
            if (localStorage.getItem('admin_logged_in') === 'true') {
              INITIAL_PRODUCTS.forEach(p => {
                setDoc(doc(db, 'products', p.id), {
                  ...p,
                  createdAt: serverTimestamp(),
                  updatedAt: serverTimestamp()
                }).catch(() => {});
              });
            }
          }
        }, (error) => {
          setIsSandbox(true);
          const savedProducts = localStorage.getItem('sandbox_products');
          if (savedProducts) setProducts(JSON.parse(savedProducts));
        });

        // 3. Fetch Categories
        unsubCategories = onSnapshot(collection(db, 'categories'), (snapshot) => {
          const fetchedCats: Category[] = [];
          snapshot.forEach((docSnap) => {
            fetchedCats.push({ id: docSnap.id, ...docSnap.data() } as Category);
          });
          if (fetchedCats.length > 0) {
            setCategories(fetchedCats);
          } else {
            setCategories(INITIAL_CATEGORIES);
            if (localStorage.getItem('admin_logged_in') === 'true') {
              INITIAL_CATEGORIES.forEach(c => {
                setDoc(doc(db, 'categories', c.id), c).catch(() => {});
              });
            }
          }
        }, (error) => {
          setIsSandbox(true);
          const savedCats = localStorage.getItem('sandbox_categories');
          if (savedCats) setCategories(JSON.parse(savedCats));
        });

        // 4. Fetch Promotions
        unsubPromotions = onSnapshot(collection(db, 'promotions'), (snapshot) => {
          const fetchedPromos: Promotion[] = [];
          snapshot.forEach((docSnap) => {
            fetchedPromos.push({ id: docSnap.id, ...docSnap.data() } as Promotion);
          });
          if (fetchedPromos.length > 0) {
            setPromotions(fetchedPromos);
          } else {
            setPromotions(INITIAL_PROMOTIONS);
            if (localStorage.getItem('admin_logged_in') === 'true') {
              INITIAL_PROMOTIONS.forEach(p => {
                setDoc(doc(db, 'promotions', p.id), p).catch(() => {});
              });
            }
          }
        }, (error) => {
          setIsSandbox(true);
          const savedPromos = localStorage.getItem('sandbox_promotions');
          if (savedPromos) setPromotions(JSON.parse(savedPromos));
        });

        setLoading(false);
      } catch (err) {
        console.error("Database connection failure:", err);
        setIsSandbox(true);
        setLoading(false);
      }
    };

    syncDatabase();

    return () => {
      unsubSettings();
      unsubProducts();
      unsubCategories();
      unsubPromotions();
    };
  }, []);

  // Login & Logout
  const loginWithGoogle = async () => {
    try {
      setAuthError(null);
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error("Popup Auth failed:", error);
      const errMsg = error?.message || String(error);
      setAuthError(errMsg);
    }
  };

  const loginWithCredentials = async (username: string, pass: string): Promise<boolean> => {
    if (username === 'Juem' && pass === 'olivera45') {
      localStorage.setItem('admin_logged_in', 'true');
      setIsAdminUser(true);
      setUser({
        uid: 'admin_juem',
        email: 'juem@olivera45.com',
        displayName: 'Juem',
        emailVerified: true
      } as any);
      setAuthError(null);

      // Now attempt Firebase Auth synchronization so writes are securely authorized on the backend
      try {
        await signInWithEmailAndPassword(auth, 'juem@olivera45.com', 'olivera45');
      } catch (err: any) {
        if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || (err.message && err.message.includes('user-not-found'))) {
          // Attempt registering the user first-time on the fly
          try {
            await createUserWithEmailAndPassword(auth, 'juem@olivera45.com', 'olivera45');
          } catch (createErr: any) {
            console.warn("Firebase credentials registration failed, proceeding offline:", createErr);
            if (createErr.code === 'auth/operation-not-allowed') {
              console.error("Habilite inicio de sesión por Correo/Contraseña en la consola de Firebase.");
            }
          }
        } else {
          console.warn("Firebase credentials login failed, proceeding with local fallback session:", err);
          if (err.code === 'auth/operation-not-allowed') {
            console.error("Habilite inicio de sesión por Correo/Contraseña en la consola de Firebase.");
          }
        }
      }
      return true;
    }
    return false;
  };

  const logout = async () => {
    try {
      localStorage.removeItem('admin_logged_in');
      setIsAdminUser(false);
      setUser(null);
      await signOut(auth);
    } catch (error) {
      console.error("Signout failed:", error);
    }
  };

  // CMS Settings Writers
  const saveSettings = async (newSettings: Settings) => {
    if (!isSandbox) {
      const path = 'settings/main-settings';
      try {
        await setDoc(doc(db, 'settings', 'main-settings'), {
          ...newSettings,
          updatedAt: serverTimestamp()
        });
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, path);
      }
    } else {
      // Offline/Sandbox storage
      setSettings(newSettings);
      localStorage.setItem('sandbox_settings', JSON.stringify(newSettings));
    }
  };

  // Product Writers
  const saveProduct = async (product: Product) => {
    if (!isSandbox) {
      const path = `products/${product.id}`;
      try {
        const isEdit = products.some(p => p.id === product.id);
        const ref = doc(db, 'products', product.id);
        const cleanProduct = { ...product };
        delete cleanProduct.id; // Avoid duplicate ID field inside doc body

        if (isEdit) {
          await updateDoc(ref, {
            ...cleanProduct,
            updatedAt: serverTimestamp()
          });
        } else {
          await setDoc(ref, {
            ...cleanProduct,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        }
      } catch (e) {
        handleFirestoreError(e, isSandbox ? OperationType.WRITE : OperationType.UPDATE, path);
      }
    } else {
      let updatedProducts = [...products];
      const matchIndex = products.findIndex(p => p.id === product.id);
      if (matchIndex > -1) {
        updatedProducts[matchIndex] = product;
      } else {
        updatedProducts.push(product);
      }
      setProducts(updatedProducts);
      localStorage.setItem('sandbox_products', JSON.stringify(updatedProducts));
    }
  };

  const deleteProduct = async (productId: string) => {
    const path = `products/${productId}`;
    if (!isSandbox) {
      try {
        await deleteDoc(doc(db, 'products', productId));
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, path);
      }
    } else {
      const filtered = products.filter(p => p.id !== productId);
      setProducts(filtered);
      localStorage.setItem('sandbox_products', JSON.stringify(filtered));
    }
  };

  // Category Writers
  const saveCategory = async (category: Category) => {
    const path = `categories/${category.id}`;
    if (!isSandbox) {
      try {
        await setDoc(doc(db, 'categories', category.id), {
          name: category.name,
          imageUrl: category.imageUrl || ''
        });
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, path);
      }
    } else {
      let updatedCats = [...categories];
      const matchIndex = categories.findIndex(c => c.id === category.id);
      if (matchIndex > -1) {
        updatedCats[matchIndex] = category;
      } else {
        updatedCats.push(category);
      }
      setCategories(updatedCats);
      localStorage.setItem('sandbox_categories', JSON.stringify(updatedCats));
    }
  };

  const deleteCategory = async (categoryId: string) => {
    const path = `categories/${categoryId}`;
    if (!isSandbox) {
      try {
        await deleteDoc(doc(db, 'categories', categoryId));
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, path);
      }
    } else {
      const filtered = categories.filter(c => c.id !== categoryId);
      setCategories(filtered);
      localStorage.setItem('sandbox_categories', JSON.stringify(filtered));
    }
  };

  // Promotion Writers
  const savePromotion = async (promo: Promotion) => {
    const path = `promotions/${promo.id}`;
    if (!isSandbox) {
      try {
        await setDoc(doc(db, 'promotions', promo.id), promo);
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, path);
      }
    } else {
      let updatedPromos = [...promotions];
      const matchIndex = promotions.findIndex(p => p.id === promo.id);
      if (matchIndex > -1) {
        updatedPromos[matchIndex] = promo;
      } else {
        updatedPromos.push(promo);
      }
      setPromotions(updatedPromos);
      localStorage.setItem('sandbox_promotions', JSON.stringify(updatedPromos));
    }
  };

  const deletePromotion = async (promoId: string) => {
    const path = `promotions/${promoId}`;
    if (!isSandbox) {
      try {
        await deleteDoc(doc(db, 'promotions', promoId));
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, path);
      }
    } else {
      const filtered = promotions.filter(p => p.id !== promoId);
      setPromotions(filtered);
      localStorage.setItem('sandbox_promotions', JSON.stringify(filtered));
    }
  };

  // Cart Management Action Handlers
  const addToCart = (product: Product, quantity = 1) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.product.id === product.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: Math.min(item.quantity + quantity, product.stock) }
            : item
        );
      }
      return [...prevCart, { product, quantity: Math.min(quantity, product.stock) }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.product.id === productId
          ? { ...item, quantity: Math.min(quantity, item.product.stock) }
          : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
    setAppliedPromo(null);
  };

  const applyPromoCode = (code: string): boolean => {
    const codeUpper = code.trim().toUpperCase();
    const match = promotions.find((p) => p.active && p.code.toUpperCase() === codeUpper);
    if (match) {
      setAppliedPromo(match);
      return true;
    }
    return false;
  };

  // Totals calculations
  const cartSubtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const cartDiscount = appliedPromo 
    ? Math.round(cartSubtotal * (appliedPromo.discountPercent / 100)) 
    : 0;
  const cartTotal = cartSubtotal - cartDiscount;

  return (
    <StoreContext.Provider value={{
      isOnline,
      isSandbox,
      loading,
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
      deletePromotion,
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      appliedPromo,
      applyPromoCode,
      cartTotal,
      cartSubtotal,
      cartDiscount
    }}>
      {children}
    </StoreContext.Provider>
  );
};
