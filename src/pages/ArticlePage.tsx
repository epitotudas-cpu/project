import { useState, useEffect } from 'react';
import { Home, ChevronRight, Clock, TrendingUp, Star, AlertCircle, UserCheck, Tag, BookOpen, FileText, Calculator, Library } from 'lucide-react';
import SectionSubNav from '../components/SectionSubNav';
import { getArticleBySlug, getCategories } from '../lib/api';
import { getRelatedArticles } from '../services/articleService';
import CommunityCommentsSection from '../components/CommunityCommentsSection';
import type { Article, Category } from '../lib/supabase';

interface ArticlePageProps {
  onNavigate: (page: string, params?: { articleSlug?: string }) => void;
  articleSlug?: string | null;
}

export default function ArticlePage({ onNavigate, articleSlug }: ArticlePageProps) {
  const [article, setArticle] = useState<Article | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const [categoryObj, setCategoryObj] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const slugToFetch = articleSlug || 'betonozas-lepesrol-lepesre';
        const [articleData, categoriesData] = await Promise.all([
          getArticleBySlug(slugToFetch),
          getCategories(),
        ]);
        setArticle(articleData);
        if (articleData) {
          const cat = categoriesData.find((c) => c.id === articleData.category_id || c.slug === articleData.category_id);
          setCategoryObj(cat || null);

          const related = await getRelatedArticles(articleData.id, articleData.category_id, 3);
          setRelatedArticles(related);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Hiba történt');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [articleSlug]);

  const formatViews = (views: number) => {
    if (views >= 1000) return `${(views/1000).toFixed(1)}K`;
    return views.toString();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-accent border-r-transparent" />
          <p className="mt-4 text-gray-500 text-sm">Betöltés...</p>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md mx-auto px-4">
          <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
          <h2 className="text-lg font-bold text-gray-900 mb-2">Hiba történt</h2>
          <p className="text-gray-600 text-sm mb-4">{error || 'Cikk nem található'}</p>
          <button onClick={() => onNavigate('home')} className="px-4 py-2 bg-accent text-white font-semibold rounded-lg">
            Vissza a főoldalra
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header Breadcrumb */}
      <div className="bg-primary border-b border-primary-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <button onClick={() => onNavigate('home')} className="flex items-center gap-1 hover:text-white">
              <Home size={13} /> Főoldal
            </button>
            <ChevronRight size={13} />
            <button onClick={() => onNavigate('category')} className="hover:text-white flex items-center gap-1.5">
              {categoryObj && (
                <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: categoryObj.color || '#FFC400' }} />
              )}
              {categoryObj ? categoryObj.name : 'Kategóriák'}
            </button>
            <ChevronRight size={13} />
            <span className="text-gray-300 font-medium truncate max-w-xs">{article.title}</span>
          </div>
        </div>
      </div>

      {/* Sub-navigation */}
      <SectionSubNav
        ariaLabel="Tudástár navigáció"
        onNavigate={onNavigate}
        items={[
          {
            label: 'Cikkek',
            page: 'category',
            icon: <FileText size={14} className="text-accent" />,
            active: true,
          },
          {
            label: 'Fogalomtár',
            page: 'glossary',
            icon: <BookOpen size={14} className="text-accent" />,
            active: false,
          },
          {
            label: 'Számítások',
            page: 'calculations',
            icon: <Calculator size={14} className="text-accent" />,
            active: false,
          },
          {
            label: 'Szakmai könyvek',
            page: 'books',
            icon: <Library size={14} className="text-accent" />,
            active: false,
          },
        ]}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Featured Image */}
        <div className="rounded-2xl overflow-hidden h-72 md:h-96 shadow-lg border border-gray-200">
          <img
            src={article.featured_image || '/article-default.jpg'}
            alt={article.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Title & Article Meta */}
        <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="inline-block rounded-md bg-accent/10 text-accent font-bold text-xs px-3 py-1 uppercase tracking-wider">
              {article.difficulty ? `Szint: ${article.difficulty}` : 'Szakmai Útmutató'}
            </span>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1"><Clock size={13} /> {article.read_time} perc olvasás</span>
              <span className="flex items-center gap-1"><TrendingUp size={13} /> {formatViews(article.views)} megtekintés</span>
              <span className="flex items-center gap-1 text-amber-500 font-semibold"><Star size={13} fill="currentColor" /> {article.rating.toFixed(1)}</span>
            </div>
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight">{article.title}</h1>
          <p className="text-gray-600 text-base leading-relaxed">{article.excerpt}</p>

          {/* Author Badge */}
          <div className="flex items-center gap-3 pt-3 border-t border-gray-100 text-sm">
            <div className="w-10 h-10 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent font-bold">
              <UserCheck size={18} />
            </div>
            <div>
              <div className="font-bold text-gray-900">{article.author || 'ÉpítőTudás Szerkesztőség'}</div>
              <div className="text-xs text-gray-500">Minősített Szakmai Szerző</div>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm space-y-6">
          <h2 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
            <BookOpen size={20} className="text-accent" /> Részletes Leírás & Útmutató
          </h2>
          <div className="text-gray-700 text-base leading-relaxed whitespace-pre-line">
            {article.content || 'A cikk tartalma hamarosan elérhető...'}
          </div>

          {/* Tags */}
          <div className="pt-6 border-t border-gray-100 flex items-center gap-2 flex-wrap">
            <Tag size={16} className="text-gray-400" />
            {['Betonozás', 'Alapozás', 'Szilárdság', 'Szabványok'].map((tag) => (
              <span key={tag} className="text-xs bg-gray-100 border border-gray-200 text-gray-700 font-medium px-2.5 py-1 rounded-md">
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* Related Articles Section */}
        {relatedArticles.length > 0 && (
          <div className="space-y-4 pt-4">
            <h2 className="text-2xl font-bold text-gray-900">Kapcsolódó Cikkek</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {relatedArticles.map((rel) => (
                <div
                  key={rel.id}
                  onClick={() => onNavigate('article', { articleSlug: rel.slug })}
                  className="cursor-pointer bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
                >
                  <h3 className="font-bold text-gray-900 text-sm mb-2 line-clamp-2">{rel.title}</h3>
                  <p className="text-xs text-gray-500 line-clamp-2 mb-3">{rel.excerpt}</p>
                  <span className="text-xs text-accent font-semibold flex items-center gap-1">
                    Olvasás <ChevronRight size={12} />
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Community Comments & Ratings Section */}
        {article && (
          <CommunityCommentsSection
            contentType="article"
            contentId={article.id}
            title={article.title}
          />
        )}
      </div>
    </div>
  );
}
