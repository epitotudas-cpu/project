import { useState, useEffect, useRef } from 'react';
import { Search, Menu, X, User, LogOut, ChevronDown, Settings, GraduationCap, Bookmark, Clock, HelpCircle, Sliders } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSiteSettings, getDynamicImageUrl } from '../services/siteSettingsService';
import { useNavigationItems, getStructuredNav } from '../services/navigationService';

interface HeaderProps {
  onNavigate: (page: string) => void;
  currentPage: string;
}

export default function Header({ onNavigate, currentPage }: HeaderProps) {
  const { user, profile, signOut } = useAuth();
  const rawNavItems = useNavigationItems();
  const navStructure = getStructuredNav(rawNavItems, false);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [expandedMobileSection, setExpandedMobileSection] = useState<string | null>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const siteSettings = useSiteSettings();

  useEffect(() => {
    if (mobileOpen) {
      const activeNav = navStructure.find((item) => isNavItemActive(item.page, item.subItems));
      if (activeNav && activeNav.subItems?.length) {
        setExpandedMobileSection(activeNav.page);
      } else {
        setExpandedMobileSection(null);
      }
    }
  }, [mobileOpen, currentPage]);

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
            src={getDynamicImageUrl(siteSettings.logoUrl, '/logo.png', siteSettings.iconsUpdatedAt)}
            alt={`${siteSettings.siteTitle} logó`}
            width={200}
            height={40}
            decoding="async"
            className="h-8 md:h-10 max-h-10 max-w-[220px] w-auto object-contain transition-transform group-hover:scale-105 shrink-0"
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
                    className={`px-3 py-1.5 rounded-lg text-xs lg:text-sm font-semibold transition-colors duration-150 whitespace-nowrap flex items-center gap-1 ${active
                        ? 'text-accent bg-accent/10 font-bold border border-accent/20'
                        : 'text-gray-300 group-hover:text-white group-hover:bg-white/5'
                      }`}
                  >
                    <span>{item.label}</span>
                    {hasSub && (
                      <ChevronDown
                        size={13}
                        className={`transition-transform duration-200 opacity-70 group-hover:rotate-180 group-hover:text-accent ${isOpen ? 'rotate-180 text-accent' : ''
                          }`}
                      />
                    )}
                  </button>

                  {/* Dropdown Menu Wrapper (Always rendered for smooth CSS transition & unbroken hover zone) */}
                  {hasSub && (
                    <div
                      className={`absolute left-0 top-full pt-1.5 z-50 transition-all duration-150 ease-out ${isOpen
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
                              className={`w-full px-4 py-2 text-left text-xs font-semibold flex items-center justify-between transition-colors ${isSubActive
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
              className={`p-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-all ${searchOpen ? 'bg-accent/20 text-accent border border-accent/30' : ''
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
                  <div className="absolute right-0 mt-2 w-56 bg-[#111] border border-[#1E1E1E] rounded-xl shadow-2xl overflow-hidden z-50 divide-y divide-[#1E1E1E]/60 text-xs">
                    <div className="px-4 py-3 bg-[#161616]">
                      <p className="text-white text-xs font-bold truncate">{displayName}</p>
                      <p className="text-gray-500 text-[11px] truncate mt-0.5">{user.email}</p>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => { setUserMenuOpen(false); onNavigate('profile?tab=overview'); }}
                        className="w-full px-4 py-2 text-left text-gray-300 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2.5 font-medium"
                      >
                        <User size={14} className="text-accent shrink-0" />
                        Fiókom
                      </button>

                      <button
                        onClick={() => { setUserMenuOpen(false); onNavigate('profile?tab=learning'); }}
                        className="w-full px-4 py-2 text-left text-gray-300 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2.5 font-medium"
                      >
                        <GraduationCap size={14} className="text-blue-400 shrink-0" />
                        Tanulásom
                      </button>

                      <button
                        onClick={() => { setUserMenuOpen(false); onNavigate('profile?tab=saved'); }}
                        className="w-full px-4 py-2 text-left text-gray-300 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2.5 font-medium"
                      >
                        <Bookmark size={14} className="text-purple-400 shrink-0" />
                        Mentéseim
                      </button>

                      <button
                        onClick={() => { setUserMenuOpen(false); onNavigate('profile?tab=history'); }}
                        className="w-full px-4 py-2 text-left text-gray-300 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2.5 font-medium"
                      >
                        <Clock size={14} className="text-amber-400 shrink-0" />
                        Előzményeim
                      </button>

                      <button
                        onClick={() => { setUserMenuOpen(false); onNavigate('profile?tab=settings'); }}
                        className="w-full px-4 py-2 text-left text-gray-300 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2.5 font-medium"
                      >
                        <Sliders size={14} className="text-emerald-400 shrink-0" />
                        Beállítások
                      </button>

                      <button
                        onClick={() => { setUserMenuOpen(false); onNavigate('profile?tab=help'); }}
                        className="w-full px-4 py-2 text-left text-gray-300 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2.5 font-medium"
                      >
                        <HelpCircle size={14} className="text-sky-400 shrink-0" />
                        Segítség
                      </button>
                    </div>

                    {isAdmin && (
                      <div className="py-1">
                        <button
                          onClick={() => { setUserMenuOpen(false); onNavigate('admin'); }}
                          className="w-full px-4 py-2 text-left text-gray-300 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2.5 font-bold"
                        >
                          <Settings size={14} className="text-accent shrink-0" />
                          Admin panel
                        </button>
                      </div>
                    )}

                    <div className="py-1">
                      <button
                        onClick={handleSignOut}
                        className="w-full px-4 py-2 text-left text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2.5 font-bold"
                      >
                        <LogOut size={14} className="shrink-0" />
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
              aria-label={mobileOpen ? "Navigációs menü bezárása" : "Navigációs menü megnyitása"}
              title={mobileOpen ? "Menü bezárása" : "Menü megnyitása"}
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

      {/* Mobile menu (100% Touch Compatible Scrollable Container + Accordion) */}
      {mobileOpen && (
        <div className="xl:hidden bg-primary-800 border-t border-primary-700 max-h-[calc(100vh-64px)] max-h-[calc(100dvh-64px)] overflow-y-auto divide-y divide-primary-700/60 shadow-2xl -webkit-overflow-scrolling-touch pb-12 animate-fadeIn">
          {navStructure.map((item) => {
            const active = isNavItemActive(item.page, item.subItems);
            const hasSub = item.subItems && item.subItems.length > 0;
            const isExpanded = expandedMobileSection === item.page;

            return (
              <div key={item.page} className="py-1">
                {/* Main Row: Tapping row toggles accordion if subitems exist, or navigates if no subitems */}
                <button
                  onClick={() => {
                    if (hasSub) {
                      setExpandedMobileSection(isExpanded ? null : item.page);
                    } else {
                      onNavigate(item.page);
                      setMobileOpen(false);
                    }
                  }}
                  className={`w-full text-left px-6 py-3.5 text-sm font-bold flex items-center justify-between min-h-[48px] active:bg-white/10 ${active ? 'text-accent bg-accent/10' : 'text-white hover:bg-white/5'
                    } transition-all cursor-pointer`}
                >
                  <span>{item.label}</span>
                  {hasSub && (
                    <div className="p-1 min-w-[36px] min-h-[36px] flex items-center justify-center">
                      <ChevronDown
                        size={18}
                        className={`transition-transform duration-300 ${isExpanded ? 'rotate-180 text-accent' : 'text-gray-400'
                          }`}
                      />
                    </div>
                  )}
                </button>

                {/* Accordion Submenu (Seamless Indented Tree List) */}
                {hasSub && (
                  <div
                    className={`transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                      }`}
                  >
                    <div className="ml-7 my-1 pl-4 pr-4 border-l-2 border-accent/40 space-y-0.5 py-1">
                      {/* Hub Overview Page Link */}
                      <button
                        onClick={() => {
                          onNavigate(item.page);
                          setMobileOpen(false);
                        }}
                        className={`w-full text-left py-2.5 px-3 rounded-lg text-xs font-bold min-h-[44px] flex items-center justify-between active:bg-white/10 ${currentPage === item.page
                            ? 'text-accent font-bold bg-accent/15'
                            : 'text-gray-200 hover:text-white hover:bg-white/5'
                          } transition-colors`}
                      >
                        <span>Összes {item.label.toLowerCase()} megtekintése</span>
                        <span className="text-accent font-bold">→</span>
                      </button>

                      {/* Subnav items */}
                      {item.subItems!.map((sub) => {
                        const isSubActive = currentPage === sub.page;
                        return (
                          <button
                            key={sub.label}
                            onClick={() => {
                              onNavigate(sub.page);
                              setMobileOpen(false);
                            }}
                            className={`w-full text-left py-2.5 px-3 rounded-lg text-xs font-semibold min-h-[44px] flex items-center gap-2.5 active:bg-white/10 ${isSubActive
                                ? 'text-accent font-bold bg-accent/15'
                                : 'text-gray-300 hover:text-white hover:bg-white/5'
                              } transition-colors`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isSubActive ? 'bg-accent' : 'bg-gray-500'}`} />
                            <span>{sub.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Auth & Account Quick Actions */}
          <div className="px-6 py-5 space-y-3">
            {user ? (
              <>
                <div className="px-4 py-3 bg-primary-700/60 border border-primary-600 rounded-xl">
                  <p className="text-white text-sm font-semibold truncate">{displayName}</p>
                  <p className="text-gray-400 text-xs truncate mt-0.5">{user.email}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => { onNavigate('profile?tab=overview'); setMobileOpen(false); }}
                    className="py-2.5 px-3 border border-gray-600 text-gray-200 text-xs font-bold rounded-xl flex items-center justify-center gap-2 min-h-[44px] active:bg-white/10 cursor-pointer"
                  >
                    <User size={14} className="text-accent" /> Fiókom
                  </button>
                  <button
                    onClick={() => { onNavigate('profile?tab=learning'); setMobileOpen(false); }}
                    className="py-2.5 px-3 border border-gray-600 text-gray-200 text-xs font-bold rounded-xl flex items-center justify-center gap-2 min-h-[44px] active:bg-white/10 cursor-pointer"
                  >
                    <GraduationCap size={14} className="text-blue-400" /> Tanulásom
                  </button>
                  <button
                    onClick={() => { onNavigate('profile?tab=saved'); setMobileOpen(false); }}
                    className="py-2.5 px-3 border border-gray-600 text-gray-200 text-xs font-bold rounded-xl flex items-center justify-center gap-2 min-h-[44px] active:bg-white/10 cursor-pointer"
                  >
                    <Bookmark size={14} className="text-purple-400" /> Mentéseim
                  </button>
                  <button
                    onClick={() => { onNavigate('profile?tab=settings'); setMobileOpen(false); }}
                    className="py-2.5 px-3 border border-gray-600 text-gray-200 text-xs font-bold rounded-xl flex items-center justify-center gap-2 min-h-[44px] active:bg-white/10 cursor-pointer"
                  >
                    <Sliders size={14} className="text-emerald-400" /> Beállítások
                  </button>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => { onNavigate('admin'); setMobileOpen(false); }}
                    className="w-full py-3 border border-accent/40 text-accent font-bold text-sm rounded-xl min-h-[48px] active:bg-accent/10"
                  >
                    Admin panel
                  </button>
                )}
                <button
                  onClick={handleSignOut}
                  className="w-full py-3 border border-red-500/40 text-red-400 font-medium text-sm rounded-xl min-h-[48px] active:bg-red-500/10"
                >
                  Kijelentkezés
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => { onNavigate('login'); setMobileOpen(false); }}
                  className="w-full py-3 border border-gray-500 text-gray-200 text-sm font-bold rounded-xl text-center min-h-[48px] active:bg-white/10"
                >
                  Bejelentkezés
                </button>
                <button
                  onClick={() => { onNavigate('register'); setMobileOpen(false); }}
                  className="w-full py-3 bg-accent hover:bg-accent-hover text-black text-sm font-extrabold rounded-xl text-center min-h-[48px] active:scale-95 transition-transform"
                >
                  Regisztráció
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
