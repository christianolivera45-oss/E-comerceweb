import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { 
  ShoppingBag, 
  Search, 
  Settings2, 
  User as UserIcon, 
  LogOut, 
  Layout, 
  ShieldAlert,
  Menu,
  X,
  Sparkles
} from 'lucide-react';

interface HeaderProps {
  isAdminOpen: boolean;
  setAdminOpen: (open: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  setCartOpen: (open: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  isAdminOpen,
  setAdminOpen,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  setCartOpen
}) => {
  const { 
    user, 
    isAdminUser, 
    loginWithGoogle, 
    logout, 
    settings, 
    cart, 
    isSandbox 
  } = useStore();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <header className="sticky top-0 z-40 bg-white/95 text-gray-900 border-b border-gray-200 backdrop-blur-md">
      {/* Top micro-announcement bar */}
      {settings.promoBannerText && (
        <div className="bg-black text-center py-2 px-4 text-xs font-mono font-medium tracking-wide text-white flex items-center justify-center gap-2">
          <Sparkles size={14} className="animate-spin" style={{ animationDuration: '3s' }} />
          <span>{settings.promoBannerText}</span>
        </div>
      )}

      {/* Main navigation container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          
          {/* Brand Logo & Name */}
          <div 
            onClick={() => {
              setAdminOpen(false);
              setSelectedCategory('all');
              setSearchQuery('');
            }}
            className="flex items-center gap-2.5 cursor-pointer font-sans select-none shrink-0"
          >
            <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-black font-bold text-white text-xl tracking-wider shadow-sm hover:scale-105 transition-transform">
              {settings.title ? settings.title.charAt(0).toUpperCase() : 'T'}
            </div>
            <div className="hidden sm:block">
              <span className="font-bold tracking-tight text-xl text-gray-950">{settings.title || 'Trendify'}</span>
              <span className="block text-[10px] text-gray-500 font-mono tracking-widest uppercase">E-Commerce Live</span>
            </div>
          </div>

          {/* Catalog Search Filter Bar */}
          {!isAdminOpen && (
            <div className="hidden md:flex items-center relative max-w-md w-full">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
                <Search size={18} />
              </div>
              <input
                type="text"
                placeholder="Buscar productos por palabra clave..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-10 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors"
                id="header-search"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 text-gray-400 hover:text-black transition-colors text-xs font-mono"
                >
                  Clear
                </button>
              )}
            </div>
          )}

          {/* Action Tools Panel */}
          <div className="flex items-center gap-3">
            {/* Desktop Admin Access Toggle */}
            {isAdminUser ? (
              <button
                onClick={() => setAdminOpen(!isAdminOpen)}
                className={`hidden md:flex items-center gap-2 rounded-xl py-2 px-4 text-xs font-semibold tracking-tight transition-all duration-200 border ${
                  isAdminOpen 
                    ? 'bg-black hover:bg-zinc-900 border-black text-white shadow-md' 
                    : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-800'
                }`}
                id="admin-panel-toggle"
              >
                {isAdminOpen ? <Layout size={15} /> : <Settings2 size={15} />}
                {isAdminOpen ? 'Ver Tienda' : 'Panel Admin'}
              </button>
            ) : user ? (
              // Signed in, not official admin. Offer sandbox admin bypass for testing/reviewing
              <button
                onClick={() => setAdminOpen(!isAdminOpen)}
                className="hidden md:flex items-center gap-1.5 rounded-xl py-1.5 px-3.5 text-xs font-semibold tracking-tight bg-amber-50 hover:bg-amber-100/80 border border-amber-200 text-amber-700"
                title="Bypass temporal para testear el Panel de Administración"
                id="sandbox-panel-toggle"
              >
                <ShieldAlert size={14} className="text-amber-600 shrink-0" />
                <span>Sandbox Admin</span>
              </button>
            ) : null}

            {/* Shopping Cart Button */}
            <button
              onClick={() => setCartOpen(true)}
              className="relative p-2.5 rounded-xl bg-white hover:bg-gray-50 text-gray-850 border border-gray-200 tracking-tight transition-transform active:scale-95 shadow-sm"
              id="header-cart-button"
            >
              <ShoppingBag size={20} />
              {cartItemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-black text-[10px] font-bold text-white animate-bounce">
                  {cartItemCount}
                </span>
              )}
            </button>

            {/* User Account Menu */}
            <div className="hidden md:flex items-center gap-2 border-l border-gray-250 pl-3">
              {user ? (
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs font-semibold text-gray-955 leading-none max-w-[120px] truncate">
                      {user.displayName || user.email?.split('@')[0]}
                    </p>
                    <p className="text-[10px] text-gray-500 pt-1 font-mono tracking-tight leading-none">
                      {isAdminUser ? 'Admin Oficial' : 'Evaluador'}
                    </p>
                  </div>
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt="Avatar"
                      referrerPolicy="no-referrer"
                      className="h-9 w-9 rounded-xl border border-gray-200 shadow-sm"
                    />
                  ) : (
                    <div className="h-9 w-9 rounded-xl bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-700 uppercase sm:block">
                      {user.email?.charAt(0)}
                    </div>
                  )}
                  <button
                    onClick={logout}
                    className="p-2 rounded-lg bg-gray-50 hover:bg-red-50 hover:text-red-500 border border-gray-200 hover:border-red-100/50 transition-colors"
                    title="Cerrar sesión"
                  >
                    <LogOut size={15} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setAdminOpen(true)}
                  className="flex items-center gap-2 rounded-xl bg-black hover:bg-zinc-950 text-white py-2 px-4 text-xs font-semibold tracking-tight shadow-md transition-all active:scale-95"
                  id="header-login-button"
                >
                  <UserIcon size={14} />
                  <span>Ingresar Admin</span>
                </button>
              )}
            </div>

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-550 hover:text-black hover:bg-gray-100"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 p-4 space-y-4">
          {/* Mobile Search input */}
          {!isAdminOpen && (
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
                <Search size={16} />
              </div>
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border border-gray-250 rounded-lg py-1.5 px-9 text-sm text-gray-905"
                id="mobile-search"
              />
            </div>
          )}

          {/* Quick Category access */}
          {!isAdminOpen && (
            <div className="py-1">
              <p className="text-xs font-mono uppercase tracking-wider text-gray-500 mb-2">Categorías rápidas</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setMobileMenuOpen(false);
                  }}
                  className={`text-xs py-1 px-3 rounded-full transition-colors ${
                    selectedCategory === 'all' ? 'bg-black text-white font-bold' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => {
                    setSelectedCategory('ropa');
                    setMobileMenuOpen(false);
                  }}
                  className={`text-xs py-1 px-3 rounded-full transition-colors ${
                    selectedCategory === 'ropa' ? 'bg-black text-white font-bold' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  Ropa
                </button>
                <button
                  onClick={() => {
                    setSelectedCategory('electronica');
                    setMobileMenuOpen(false);
                  }}
                  className={`text-xs py-1 px-3 rounded-full transition-colors ${
                    selectedCategory === 'electronica' ? 'bg-black text-white font-bold' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  Tecno
                </button>
              </div>
            </div>
          )}

          {/* Admin features */}
          <div className="pt-2 border-t border-gray-200">
            {isAdminUser || user ? (
              <button
                onClick={() => {
                  setAdminOpen(!isAdminOpen);
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 bg-white border border-gray-200 hover:border-black text-gray-900 text-sm font-semibold transition-colors shadow-sm"
              >
                <Settings2 size={16} />
                {isAdminOpen ? 'Ver Catálogo' : 'Panel de Administración'}
              </button>
            ) : (
              <button
                onClick={() => {
                  setAdminOpen(true);
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 bg-black text-white text-sm font-semibold hover:bg-zinc-900 transition-colors"
              >
                <UserIcon size={16} />
                <span>Ingresar Admin</span>
              </button>
            )}

            {user && (
              <div className="mt-3 flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200">
                <div className="flex items-center gap-2">
                  {user.photoURL && (
                    <img src={user.photoURL} alt="User" referrerPolicy="no-referrer" className="h-7 w-7 rounded-lg" />
                  )}
                  <span className="text-xs font-semibold text-gray-800 truncate max-w-[150px]">
                    {user.email}
                  </span>
                </div>
                <button onClick={logout} className="text-red-500 p-1.5 hover:bg-red-50 rounded-lg">
                  <LogOut size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
