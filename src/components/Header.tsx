import { useState, useEffect, useRef } from 'react';
import { Search, Menu, X, User, LogOut, ChevronDown, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getSiteSettings, type SiteSettings } from '../services/siteSettingsService';

interface HeaderProps {
  onNavigate: (page: string) => void;
  currentPage: string;
}

const navStructure = [
  {
    label: 'Főoldal',
    page: 'home',
  },
  {
    label: 'Tudástár',
    page: 'tudastar',
    subItems: [
      { label: 'Cikkek & Útmutatók', page: 'category' },
      { label: 'Fogalomtár & Szótár', page: 'glossary' },
      { label: 'Számítások & Kalkulátorok', page: 'calculations' },
      { label: 'Szakmai Könyvek', page: 'books' },
    ],
  },
  {
    label: 'Eszközök',
    page: 'tool',
    subItems: [
      { label: 'Gép & Szerszám Katalógus', page: 'tool' },
      { label: 'Szoftverek', page: 'software' },
      { label: 'Eszközválasztó Modul', page: 'valaszto' },
    ],
  },
  {
    label: 'Pályák',
    page: 'paths',
    subItems: [
      { label: 'Építőipari Szakmák', page: 'paths' },
      { label: 'Tanulási Útvonalak', page: 'paths' },
      { label: 'Képzések & Kurzusok', page: 'courses' },
      { label: 'Karrier & Állások', page: 'careers' },
    ],
  },
  {
    label: 'Rólunk',
    page: 'about',
    subItems: [
      { label: 'Küldetésünk & Rólunk', page: 'about' },
      { label: 'Partnereink', page: 'partners' },
      { label: 'Impresszum & Kapcsolat', page: 'impressum' },
    ],
  },
];

export default function Header({ onNavigate, currentPage }: HeaderProps) {
  const { user, profile, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(() => getSiteSettings());

  const handleMouseEnter = (pageKey: string) => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setActiveDropdown(pageKey);
  };

  const handleMouseLeave = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    closeTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 200);
  };

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    function handleSettingsChange() {
      setSiteSettings(getSiteSettings());
    }
    window.addEventListener('site-settings-changed', handleSettingsChange);
    return () => window.removeEventListener('site-settings-changed', handleSettingsChange);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
        setActiveDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setUserMenuOpen(false);
    setMobileOpen(false);
    await signOut();
    onNavigate('home');
  };

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Fiók';
  const isAdmin = profile?.role === 'admin' || profile?.role === 'editor';

  const isNavItemActive = (itemPage: string, subItems?: Array<{ page: string }>) => {
    if (currentPage === itemPage) return true;
    if (itemPage === 'tudastar' && ['category', 'article', 'glossary', 'calculations', 'books'].includes(currentPage)) return true;
    if (itemPage === 'tool' && ['software', 'valaszto'].includes(currentPage)) return true;
    if (itemPage === 'paths' && ['courses', 'careers'].includes(currentPage)) return true;
    if (itemPage === 'about' && ['partners', 'impressum', 'privacy', 'terms', 'cookies', 'jogi'].includes(currentPage)) return true;
    if (subItems?.some((sub) => sub.page === currentPage)) return true;
    return false;
  };

  return (
    <header className="bg-primary border-b border-primary-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4 md:flex-nowrap">
        {/* Logo */}
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2 shrink-0 group"
        >
          <img
            src={siteSettings.logoUrl || '/logo.png'}
            alt={`${siteSettings.siteTitle} logó`}
            className="h-8 md:h-10 w-auto object-contain transition-transform group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/logo.png';
            }}
          />
          <span className="text-lg font-bold tracking-tight md:text-xl flex items-center">
            {siteSettings.siteTitle === 'ÉpítőTudás' ? (
              <>
                <span className="text-white">Építő</span>
                <span className="text-accent">Tudás</span>
              </>
            ) : (
              <span className="text-white">{siteSettings.siteTitle}</span>
            )}
          </span>
        </button>

        {/* Right side: nav + actions */}
        <div className="flex items-center gap-3 md:gap-6 min-w-0 grow justify-end">
          {/* Desktop Nav */}
          <nav className="hidden xl:flex items-center gap-1 min-w-0 relative" ref={dropdownRef}>
            {navStructure.map((item) => {
              const active = isNavItemActive(item.page, item.subItems);
              const hasSub = item.subItems && item.subItems.length > 0;
              const isOpen = activeDropdown === item.page;

              return (
                <div
                  key={item.page}
                  className="relative group py-1"
                  onMouseEnter={() => hasSub && handleMouseEnter(item.page)}
                  onMouseLeave={() => hasSub && handleMouseLeave()}
                >
                  <button
                    onClick={() => {
                      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
                      onNavigate(item.page);
                      setActiveDropdown(null);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs lg:text-sm font-semibold transition-colors duration-150 whitespace-nowrap flex items-center gap-1 ${
                      active
                        ? 'text-accent bg-accent/10 font-bold border border-accent/20'
                        : 'text-gray-300 group-hover:text-white group-hover:bg-white/5'
                    }`}
                  >
                    <span>{item.label}</span>
                    {hasSub && (
                      <ChevronDown
                        size={13}
                        className={`transition-transform duration-200 opacity-70 group-hover:rotate-180 group-hover:text-accent ${
                          isOpen ? 'rotate-180 text-accent' : ''
                        }`}
                      />
                    )}
                  </button>

                  {/* Dropdown Menu Wrapper (Always rendered for smooth CSS transition & unbroken hover zone) */}
                  {hasSub && (
                    <div
                      className={`absolute left-0 top-full pt-1.5 z-50 transition-all duration-150 ease-out ${
                        isOpen
                          ? 'opacity-100 pointer-events-auto translate-y-0'
                          : 'opacity-0 pointer-events-none -translate-y-1 group-hover:opacity-100 group-hover:pointer-events-auto group-hover:translate-y-0'
                      }`}
                      onMouseEnter={() => handleMouseEnter(item.page)}
                      onMouseLeave={handleMouseLeave}
                    >
                      {/* Invisible Hover Bridge spanning gap to trigger button */}
                      <div className="absolute -top-3 left-0 right-0 h-4 bg-transparent" />

                      <div className="w-56 bg-[#111] border border-[#222] rounded-xl shadow-2xl overflow-hidden py-1">
                        {item.subItems.map((sub) => {
                          const isSubActive = currentPage === sub.page;
                          return (
                            <button
                              key={sub.label}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
                                setActiveDropdown(null);
                                onNavigate(sub.page);
                              }}
                              className={`w-full px-4 py-2 text-left text-xs font-semibold flex items-center justify-between transition-colors ${
                                isSubActive
                                  ? 'text-accent bg-accent/10 font-bold'
                                  : 'text-gray-300 hover:text-white hover:bg-white/5'
                              }`}
                            >
                              <span>{sub.label}</span>
                              {isSubActive && <span className="w-1.5 h-1.5 rounded-full bg-accent" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className={`p-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-all ${
                searchOpen ? 'bg-accent/20 text-accent border border-accent/30' : ''
              }`}
              title="Kereső megnyitása"
            >
              <Search size={18} />
            </button>

            {isAdmin && (
              <button
                onClick={() => onNavigate('admin')}
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-accent hover:bg-accent-hover text-black text-xs lg:text-sm font-bold rounded-lg transition-all whitespace-nowrap"
              >
                <Settings size={14} />
                Admin panel
              </button>
            )}

            {user ? (
              /* Logged-in: user dropdown */
              <div className="relative hidden md:block" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-gray-600 text-gray-300 text-sm font-medium hover:bg-white/5 transition-all"
                >
                  <div className="w-6 h-6 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center flex-shrink-0">
                    <User size={12} className="text-accent" />
                  </div>
                  <span className="max-w-[110px] truncate">{displayName}</span>
                  <ChevronDown
                    size={14}
                    className={`text-gray-400 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-[#111] border border-[#1E1E1E] rounded-xl shadow-2xl overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-[#1E1E1E]">
                      <p className="text-white text-sm font-semibold truncate">{displayName}</p>
                      <p className="text-gray-500 text-xs truncate mt-0.5">{user.email}</p>
                    </div>
                    <button
                      onClick={() => { setUserMenuOpen(false); onNavigate('profile'); }}
                      className="w-full px-4 py-2.5 text-left text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2"
                    >
                      <User size={14} className="text-accent" />
                      Profilom & Beállítások
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => { setUserMenuOpen(false); onNavigate('admin'); }}
                        className="w-full px-4 py-2.5 text-left text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2"
                      >
                        <Settings size={14} className="text-accent" />
                        Admin panel
                      </button>
                    )}
                    <div className="border-t border-[#1E1E1E]">
                      <button
                        onClick={handleSignOut}
                        className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2"
                      >
                        <LogOut size={14} />
                        Kijelentkezés
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Logged-out: login/register buttons */
              <>
                <button
                  onClick={() => onNavigate('login')}
                  className="hidden md:flex px-3.5 py-1.5 border border-gray-600 text-gray-300 text-xs lg:text-sm font-medium rounded-lg hover:bg-white/5 transition-all whitespace-nowrap"
                >
                  Bejelentkezés
                </button>
                <button
                  onClick={() => onNavigate('register')}
                  className="hidden md:flex px-3.5 py-1.5 bg-accent hover:bg-accent-hover text-black text-xs lg:text-sm font-bold rounded-lg transition-all whitespace-nowrap"
                >
                  Regisztráció
                </button>
              </>
            )}

            <button
              className="xl:hidden p-2 text-gray-300 hover:text-white"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Search bar dropdown */}
      {searchOpen && (
        <div className="bg-[#0B0F19] border-t border-b border-accent/20 px-4 sm:px-6 lg:px-8 py-3.5 shadow-2xl">
          <div className="relative max-w-7xl mx-auto flex items-center gap-3">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-accent"
              />
              <input
                autoFocus
                type="text"
                placeholder="Keress cikket, szakkifejezést, szerszámot vagy partnert..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setSearchOpen(false);
                    onNavigate('glossary');
                  }
                }}
                className="w-full bg-[#141A29] border border-[#222E45] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-accent transition-colors"
              />
            </div>
            <button
              onClick={() => setSearchOpen(false)}
              className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              title="Kereső bezárása"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="xl:hidden bg-primary-800 border-t border-primary-700 divide-y divide-primary-700/60">
          {navStructure.map((item) => {
            const active = isNavItemActive(item.page, item.subItems);
            return (
              <div key={item.page} className="py-1">
                <button
                  onClick={() => {
                    onNavigate(item.page);
                    setMobileOpen(false);
                  }}
                  className={`w-full text-left px-6 py-2.5 text-sm font-bold flex items-center justify-between ${
                    active ? 'text-accent bg-accent/10' : 'text-white hover:bg-white/5'
                  } transition-all`}
                >
                  <span>{item.label}</span>
                </button>

                {item.subItems && (
                  <div className="pl-8 pr-6 pb-2 space-y-1">
                    {item.subItems.map((sub) => (
                      <button
                        key={sub.label}
                        onClick={() => {
                          onNavigate(sub.page);
                          setMobileOpen(false);
                        }}
                        className={`w-full text-left py-1.5 px-3 rounded-lg text-xs ${
                          currentPage === sub.page
                            ? 'text-accent font-bold bg-accent/10'
                            : 'text-gray-300 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        • {sub.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          <div className="px-6 py-3 space-y-2">
            {user ? (
              <>
                <div className="px-3 py-2 bg-primary-700/50 rounded-lg">
                  <p className="text-white text-sm font-semibold truncate">{displayName}</p>
                  <p className="text-gray-400 text-xs truncate">{user.email}</p>
                </div>
                <button
                  onClick={() => { onNavigate('profile'); setMobileOpen(false); }}
                  className="w-full py-2 border border-gray-600 text-gray-300 text-sm font-medium rounded-md flex items-center justify-center gap-2"
                >
                  <Settings size={14} /> Fiók beállítások
                </button>
                {isAdmin && (
                  <button
                    onClick={() => { onNavigate('admin'); setMobileOpen(false); }}
                    className="w-full py-2 border border-accent/30 text-accent text-sm font-medium rounded-md"
                  >
                    Admin panel
                  </button>
                )}
                <button
                  onClick={handleSignOut}
                  className="w-full py-2 border border-red-500/30 text-red-400 text-sm font-medium rounded-md"
                >
                  Kijelentkezés
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => { onNavigate('login'); setMobileOpen(false); }}
                  className="w-full py-2 border border-gray-600 text-gray-300 text-sm font-medium rounded-md"
                >
                  Bejelentkezés
                </button>
                <button
                  onClick={() => { onNavigate('register'); setMobileOpen(false); }}
                  className="w-full py-2 bg-accent hover:bg-accent-hover text-black text-sm font-semibold rounded-md transition-colors"
                >
                  Regisztráció
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
