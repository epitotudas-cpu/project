import { useEffect, useState } from 'react';
import { FileText, FolderTree, BookOpen, Wrench, Users, ArrowRight, AlertCircle, RefreshCw } from 'lucide-react';
import * as articleService from '../services/articleService';
import * as categoryService from '../services/categoryService';
import * as glossaryService from '../services/glossaryService';
import * as toolService from '../services/toolService';
import * as userService from '../services/userService';
import { useSiteSettings, adjustColorBrightness } from '../services/siteSettingsService';
import type { AdminView } from '../components/AdminSidebar';

interface AdminDashboardProps {
  userEmail: string | null;
  onNavigateView: (view: AdminView) => void;
}

type StatKey = 'articles' | 'categories' | 'glossary' | 'tools' | 'users';

const STAT_CARDS: {
  key: StatKey;
  label: string;
  icon: typeof FileText;
  view: AdminView;
}[] = [
  { key: 'articles', label: 'Cikkek', icon: FileText, view: 'articles' },
  { key: 'categories', label: 'Kategóriák', icon: FolderTree, view: 'categories' },
  { key: 'glossary', label: 'Fogalmak', icon: BookOpen, view: 'glossary' },
  { key: 'tools', label: 'Eszközök', icon: Wrench, view: 'tools' },
  { key: 'users', label: 'Felhasználók', icon: Users, view: 'dashboard' },
];

export default function AdminDashboard({ userEmail, onNavigateView }: AdminDashboardProps) {
  const [counts, setCounts] = useState<Record<StatKey, number | null>>({
    articles: null,
    categories: null,
    glossary: null,
    tools: null,
    users: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const siteSettings = useSiteSettings();
  const cardBg = siteSettings.adminCardBgColor || '#111111';
  const cardHighlight = siteSettings.adminCardHighlightColor || '#FFC400';
  const cardBorder = adjustColorBrightness(cardBg, 12);
  const innerCardBg = adjustColorBrightness(cardBg, 6);

  async function loadCounts() {
    setLoading(true);
    setError(null);
    try {
      const COUNT_FOR: Record<StatKey, () => Promise<number>> = {
        articles: articleService.countArticles,
        categories: categoryService.countCategories,
        glossary: glossaryService.countGlossaryTerms,
        tools: toolService.countTools,
        users: userService.countUsers,
      };
      const keys: StatKey[] = ['articles', 'categories', 'glossary', 'tools', 'users'];
      const results = await Promise.all(
        keys.map(async (key): Promise<readonly [StatKey, number]> => {
          const count = await COUNT_FOR[key]();
          return [key, count] as const;
        })
      );
      const next = { ...counts };
      for (const [key, count] of results) {
        next[key] = count;
      }
      setCounts(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hiba történt a statisztikák betöltésekor.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="p-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-white">Áttekintés</h1>
          <p className="text-sm text-gray-400 mt-1">
            Üdvözöljük{userEmail ? `, ${userEmail}` : ''}! Itt látja a tartalmak összesítését.
          </p>
        </div>
        {!loading && (
          <button
            onClick={loadCounts}
            style={{ backgroundColor: innerCardBg, borderColor: cardBorder }}
            className="inline-flex items-center gap-2 px-3 py-2 border text-gray-300 text-sm font-bold rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <RefreshCw size={14} /> Frissítés
          </button>
        )}
      </div>

      {error && (
        <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3">
          <AlertCircle size={18} className="text-red-400 flex-shrink-0" />
          <p className="text-red-400 text-sm flex-1">{error}</p>
          <button
            onClick={loadCounts}
            className="text-red-400 text-sm font-bold hover:text-red-300"
          >
            Újrapróbálás
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mt-8">
        {STAT_CARDS.map(({ key, label, icon: Icon, view }) => {
          const value = counts[key];
          const isLoading = loading || value === null;
          return (
            <div
              key={key}
              style={{ backgroundColor: cardBg, borderColor: cardBorder }}
              className="border rounded-xl p-5 hover:border-white/20 transition-all flex flex-col shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400 font-medium">{label}</span>
                <Icon size={18} style={{ color: cardHighlight }} />
              </div>
              <div className="mt-3 h-10 flex items-end">
                {isLoading ? (
                  <div className="h-7 w-16 bg-white/10 rounded animate-pulse" />
                ) : (
                  <p className="text-3xl font-black text-white">{value}</p>
                )}
              </div>
              <button
                disabled={isLoading}
                onClick={() => onNavigateView(view)}
                style={{ color: cardHighlight }}
                className="mt-4 inline-flex items-center gap-1 text-xs font-bold hover:underline disabled:opacity-40 disabled:cursor-not-allowed transition-colors self-start cursor-pointer"
              >
                Megnyitás <ArrowRight size={12} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Moderation & Platform Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Moderation Widget */}
        <div style={{ backgroundColor: cardBg, borderColor: cardBorder }} className="border rounded-xl p-6 space-y-4 shadow-md">
          <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: cardBorder }}>
            <div>
              <h2 className="text-lg font-bold text-white">Moderációs Várólista</h2>
              <p className="text-xs text-gray-400">Jóváhagyásra váró tartalmak</p>
            </div>
            <button
              onClick={() => onNavigateView('moderation')}
              style={{ color: cardHighlight }}
              className="text-xs font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              Várólista megnyitása <ArrowRight size={12} />
            </button>
          </div>

          <div className="space-y-3">
            <div style={{ backgroundColor: innerCardBg, borderColor: cardBorder }} className="p-3.5 rounded-lg border flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-white">Monolitikus vasbeton szerkezetek zsaluzási technológiái</div>
                <div className="text-xs text-gray-400">Cikk • Kovács Péter</div>
              </div>
              <span
                style={{
                  color: cardHighlight,
                  backgroundColor: `${cardHighlight}1F`,
                  borderColor: `${cardHighlight}40`,
                }}
                className="text-xs font-bold px-2.5 py-1 rounded border"
              >
                Várakozik
              </span>
            </div>
            <div style={{ backgroundColor: innerCardBg, borderColor: cardBorder }} className="p-3.5 rounded-lg border flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-white">Öntömörödő beton (SCC)</div>
                <div className="text-xs text-gray-400">Fogalom • Tóth Balázs</div>
              </div>
              <span
                style={{
                  color: cardHighlight,
                  backgroundColor: `${cardHighlight}1F`,
                  borderColor: `${cardHighlight}40`,
                }}
                className="text-xs font-bold px-2.5 py-1 rounded border"
              >
                Várakozik
              </span>
            </div>
          </div>
        </div>

        {/* Quick Platform Actions */}
        <div style={{ backgroundColor: cardBg, borderColor: cardBorder }} className="border rounded-xl p-6 space-y-4 shadow-md">
          <div className="border-b pb-4" style={{ borderColor: cardBorder }}>
            <h2 className="text-lg font-bold text-white">Gyors Platform Műveletek</h2>
            <p className="text-xs text-gray-400">Modulok közvetlen elérése</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onNavigateView('roles')}
              style={{ backgroundColor: innerCardBg, borderColor: cardBorder }}
              className="p-3.5 border hover:border-white/30 rounded-xl text-left transition-colors cursor-pointer"
            >
              <div className="text-xs font-bold uppercase mb-1" style={{ color: cardHighlight }}>RBAC</div>
              <div className="text-sm font-bold text-white">Jogosultságok</div>
            </button>
            <button
              onClick={() => onNavigateView('partners')}
              style={{ backgroundColor: innerCardBg, borderColor: cardBorder }}
              className="p-3.5 border hover:border-white/30 rounded-xl text-left transition-colors cursor-pointer"
            >
              <div className="text-xs font-bold uppercase mb-1" style={{ color: cardHighlight }}>Partnerek</div>
              <div className="text-sm font-bold text-white">Partner Kezelés</div>
            </button>
            <button
              onClick={() => onNavigateView('ads')}
              style={{ backgroundColor: innerCardBg, borderColor: cardBorder }}
              className="p-3.5 border hover:border-white/30 rounded-xl text-left transition-colors cursor-pointer"
            >
              <div className="text-xs font-bold uppercase mb-1" style={{ color: cardHighlight }}>Hirdetés</div>
              <div className="text-sm font-bold text-white">Reklámhelyek</div>
            </button>
            <button
              onClick={() => onNavigateView('audit')}
              style={{ backgroundColor: innerCardBg, borderColor: cardBorder }}
              className="p-3.5 border hover:border-white/30 rounded-xl text-left transition-colors cursor-pointer"
            >
              <div className="text-xs font-bold uppercase mb-1" style={{ color: cardHighlight }}>Biztonság</div>
              <div className="text-sm font-bold text-white">Audit Napló</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
