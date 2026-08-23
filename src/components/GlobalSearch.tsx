import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Loader2, FileText, FolderTree, BookOpen, Wrench, BookMarked, Users, X } from 'lucide-react';
import { searchAll } from '../services/searchService';
import type { AdminView } from './AdminSidebar';

interface GlobalSearchProps {
  onNavigateView: (view: AdminView, searchQuery?: string) => void;
}

interface ResultItem {
  id: string;
  label: string;
  sublabel?: string;
}

interface ResultGroup {
  view: AdminView;
  title: string;
  icon: typeof FileText;
  items: ResultItem[];
}

interface ArticleRow { id: string; title: string; status: string }
interface CategoryRow { id: string; name: string }
interface GlossaryRow { id: string; term: string; category: string | null }
interface ToolRow { id: string; name: string; type: string | null }
interface BookRow { id: string; title: string; author: string | null }
interface UserRow { id: string; email: string | null; full_name: string | null }

export default function GlobalSearch({ onNavigateView }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState<ResultGroup[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  const runSearch = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const { articles, categories, glossary, tools, books, users } = await searchAll(q, 5);

      const next: ResultGroup[] = [];
      const artsData = articles as ArticleRow[];
      if (artsData.length) {
        next.push({
          view: 'articles',
          title: 'Cikkek',
          icon: FileText,
          items: artsData.map((a) => ({ id: a.id, label: a.title, sublabel: a.status })),
        });
      }
      const booksData = books as BookRow[];
      if (booksData.length) {
        next.push({
          view: 'books',
          title: 'Szakkönyvek',
          icon: BookMarked,
          items: booksData.map((b) => ({ id: b.id, label: b.title, sublabel: b.author ?? undefined })),
        });
      }
      const catsData = categories as CategoryRow[];
      if (catsData.length) {
        next.push({
          view: 'categories',
          title: 'Kategóriák',
          icon: FolderTree,
          items: catsData.map((c) => ({ id: c.id, label: c.name })),
        });
      }
      const glossData = glossary as GlossaryRow[];
      if (glossData.length) {
        next.push({
          view: 'glossary',
          title: 'Fogalmak',
          icon: BookOpen,
          items: glossData.map((g) => ({ id: g.id, label: g.term, sublabel: g.category ?? undefined })),
        });
      }
      const toolsData = tools as ToolRow[];
      if (toolsData.length) {
        next.push({
          view: 'tools',
          title: 'Eszközök',
          icon: Wrench,
          items: toolsData.map((t) => ({ id: t.id, label: t.name, sublabel: t.type ?? undefined })),
        });
      }
      const usersData = users as UserRow[];
      if (usersData.length) {
        next.push({
          view: 'users',
          title: 'Felhasználók',
          icon: Users,
          items: usersData.map((u) => ({ id: u.id, label: u.full_name || u.email || 'Felhasználó', sublabel: u.email ?? undefined })),
        });
      }
      setGroups(next);
    } catch {
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounced.length < 2) {
      setGroups([]);
      setActiveIndex(-1);
      return;
    }
    runSearch(debounced);
  }, [debounced, runSearch]);

  const flatCount = groups.reduce((sum, g) => sum + g.items.length, 0);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  function select(view: AdminView, searchParam?: string) {
    onNavigateView(view, searchParam || debounced);
    setOpen(false);
    setQuery('');
    setDebounced('');
    setGroups([]);
    setActiveIndex(-1);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open || flatCount === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, flatCount - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      let idx = activeIndex;
      if (idx === -1) {
        if (flatCount > 0) {
          idx = 0;
        } else {
          return;
        }
      }
      for (const g of groups) {
        if (idx < g.items.length) {
          select(g.view, g.items[idx].label);
          return;
        }
        idx -= g.items.length;
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  let runningIndex = -1;

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Keresés cikkek, könyvek, fogalmak, eszközök..."
          className="w-full bg-[#0A0A0A] border border-[#1E1E1E] rounded-lg pl-9 pr-9 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#FFC400]/50 transition-colors"
        />
        {loading && (
          <Loader2 size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 animate-spin" />
        )}
        {!loading && query && (
          <button
            onClick={() => {
              setQuery('');
              setDebounced('');
              setGroups([]);
              setActiveIndex(-1);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {open && debounced.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#111] border border-[#1E1E1E] rounded-xl shadow-2xl overflow-hidden z-50 max-h-[70vh] overflow-y-auto">
          {loading && flatCount === 0 && (
            <div className="px-4 py-8 flex flex-col items-center gap-2">
              <Loader2 size={18} className="text-gray-600 animate-spin" />
              <p className="text-xs text-gray-600">Keresés...</p>
            </div>
          )}

          {!loading && flatCount === 0 && (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-gray-500">Nincs találat a „{debounced}” keresésre.</p>
            </div>
          )}

          {!loading &&
            groups.map((g) => (
              <div key={g.view} className="border-b border-[#1E1E1E]/60 last:border-b-0">
                <div className="px-4 py-2 flex items-center gap-2 bg-[#0D0D0D] sticky top-0 z-10">
                  <g.icon size={13} className="text-[#FFC400]" />
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">{g.title}</span>
                  <span className="text-xs text-gray-600 ml-auto">{g.items.length}</span>
                </div>
                {g.items.map((item) => {
                  runningIndex += 1;
                  const idx = runningIndex;
                  const active = idx === activeIndex;
                  return (
                    <button
                      key={`${g.view}-${item.id}`}
                      onClick={() => select(g.view, item.label)}
                      onMouseEnter={() => setActiveIndex(idx)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors cursor-pointer ${
                        active ? 'bg-[#FFC400]/10' : 'hover:bg-[#1E1E1E]/40'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm truncate ${active ? 'text-white font-bold' : 'text-gray-300'}`}>{item.label}</p>
                        {item.sublabel && (
                          <p className="text-xs text-gray-500 truncate capitalize">{item.sublabel}</p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}

          {!loading && flatCount > 0 && (
            <button
              onClick={() => select(groups[0].view, groups[0].items[0]?.label)}
              className="w-full px-4 py-2.5 text-left text-xs text-gray-400 border-t border-[#1E1E1E] hover:text-amber-400 hover:bg-[#1E1E1E]/30 transition-colors cursor-pointer font-bold"
            >
              Enter → Ugrás az első találathoz ({groups[0].items[0]?.label})
            </button>
          )}
        </div>
      )}
    </div>
  );
}
