import { useState, useEffect } from 'react';
import { Home, ChevronRight, Clock, TrendingUp, Star, AlertCircle, UserCheck, Tag, BookOpen, FileText, Calculator, Library, AlertTriangle, CheckSquare, Check, Lightbulb } from 'lucide-react';
import SectionSubNav from '../components/SectionSubNav';
import { getArticleBySlug, getCategories } from '../lib/api';
import { getRelatedArticles } from '../services/articleService';
import CommunityCommentsSection from '../components/CommunityCommentsSection';
import { parseBlocksFromContent } from '../components/EditArticleModal';
import type { Article, Category } from '../lib/supabase';

interface ArticlePageProps {
  onNavigate: (page: string, params?: { articleSlug?: string }) => void;
  articleSlug?: string | null;
}

function ArticleContentRenderer({ content }: { content: string }) {
  const { blocks } = parseBlocksFromContent(content);

  if (!blocks || blocks.length === 0) {
    const cleanContent = content ? content.replace(/\[EPITOTUDAS_.*\]$/s, '').trim() : '';
    return (
      <div className="text-gray-700 text-base leading-relaxed whitespace-pre-line">
        {cleanContent || 'A cikk tartalma hamarosan elérhető...'}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {blocks.map((block, index) => {
        switch (block.type) {
          case 'heading': {
            if (block.level === 'h3') {
              return <h3 key={block.id || index} className="text-xl font-bold text-gray-800 mt-6 mb-3">{block.content}</h3>;
            }
            if (block.level === 'h4') {
              return <h4 key={block.id || index} className="text-lg font-semibold text-gray-800 mt-4 mb-2">{block.content}</h4>;
            }
            return <h2 key={block.id || index} className="text-2xl font-extrabold text-gray-900 mt-8 mb-4 border-b border-gray-100 pb-2">{block.content}</h2>;
          }

          case 'text': {
            const txt = block.content || '';
            const imgMatch = txt.trim().match(/^!\[([^\]]*)\]\(([^)]+)\)\s*(?:\n\*(.*)\*)?$/);
            if (imgMatch) {
              return (
                <figure key={block.id || index} className="my-6 rounded-2xl overflow-hidden border border-gray-200 shadow-md">
                  <img src={imgMatch[2]} alt={imgMatch[1] || ''} className="w-full h-auto max-h-96 object-cover" />
                  {imgMatch[3] && (
                    <figcaption className="p-3 text-center text-xs text-gray-500 bg-gray-50 italic border-t border-gray-100">
                      {imgMatch[3]}
                    </figcaption>
                  )}
                </figure>
              );
            }
            return (
              <p key={block.id || index} className="text-gray-700 text-base leading-relaxed my-3 whitespace-pre-line">
                {txt}
              </p>
            );
          }

          case 'image':
            if (!block.imageUrl) return null;
            return (
              <figure key={block.id || index} className="my-6 rounded-2xl overflow-hidden border border-gray-200 shadow-md">
                <img src={block.imageUrl} alt={block.imageAlt || ''} className="w-full h-auto max-h-96 object-cover" />
                {block.imageCaption && (
                  <figcaption className="p-3 text-center text-xs text-gray-500 bg-gray-50 italic border-t border-gray-100">
                    {block.imageCaption}
                  </figcaption>
                )}
              </figure>
            );

          case 'table':
            if (!block.tableHeaders || block.tableHeaders.length === 0) return null;
            return (
              <div key={block.id || index} className="overflow-x-auto my-6 border border-gray-200 rounded-xl shadow-sm">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-primary/5 text-primary font-bold">
                    <tr>
                      {block.tableHeaders.map((header, hIdx) => (
                        <th key={hIdx} className="px-4 py-3 text-left font-bold text-gray-900 border-b border-gray-200">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {block.tableRows?.map((row, rIdx) => (
                      <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="px-4 py-3 text-gray-700 font-medium">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );

          case 'warning':
            return (
              <div key={block.id || index} className="my-6 p-4 rounded-xl border-l-4 border-amber-500 bg-amber-50/90 text-amber-950 flex items-start gap-3 shadow-sm">
                <AlertTriangle size={22} className="text-amber-600 shrink-0 mt-0.5" />
                <div className="text-sm leading-relaxed font-medium">{block.content}</div>
              </div>
            );

          case 'highlight':
            return (
              <div key={block.id || index} className="my-6 p-4 rounded-xl border-l-4 border-accent bg-accent/5 text-gray-900 space-y-1 shadow-sm">
                <div className="font-bold text-accent text-xs uppercase tracking-wide flex items-center gap-1.5">
                  <Lightbulb size={14} /> [{block.highlightType || 'Szakmai tipp'}] {block.highlightTitle}
                </div>
                <div className="text-sm text-gray-700 leading-relaxed">{block.content}</div>
              </div>
            );

          case 'checklist':
            return (
              <div key={block.id || index} className="my-6 bg-gray-50 p-5 rounded-2xl border border-gray-200 shadow-sm space-y-3">
                <div className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <CheckSquare size={16} className="text-accent" /> Minőségellenőrző Ellenőrzőlista
                </div>
                <div className="space-y-2">
                  {block.checkItems?.map((item) => (
                    <div key={item.id} className="flex items-center gap-2.5 text-sm text-gray-800">
                      <div className="w-5 h-5 rounded border border-accent/40 bg-accent/10 flex items-center justify-center text-accent shrink-0">
                        <Check size={13} strokeWidth={3} />
                      </div>
                      <span>{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            );

          case 'list':
          case 'numbered_list':
            return (
              <ul key={block.id || index} className="my-4 space-y-2 pl-5 list-disc text-gray-700 text-base leading-relaxed">
                {block.items?.map((item, itemIdx) => (
                  <li key={itemIdx}>{item}</li>
                ))}
              </ul>
            );

          default:
            return (
              <p key={block.id || index} className="text-gray-700 text-base leading-relaxed my-3 whitespace-pre-line">
                {block.content}
              </p>
            );
        }
      })}
    </div>
  );
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
        const slugToFetch = articleSlug || 'gipszkarton-lapok-tipusai-melyiket-mikor-hasznaljuk';
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

  const { seo } = parseBlocksFromContent(article.content || '');
  const articleTags = seo.primaryKeyword
    ? [seo.primaryKeyword, ...(seo.relatedKeywords?.split(',').map((k) => k.trim()) || [])]
    : ['Gipszkarton', 'Szárazépítés', 'Anyagismeret', 'Kivitelezés'];

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
        <div className="rounded-2xl overflow-hidden h-72 md:h-96 shadow-lg border border-gray-200 bg-gray-100">
          <img
            src={article.featured_image || 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=1200&q=80'}
            alt={article.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Title & Article Meta */}
        <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="inline-block rounded-md bg-accent/10 text-accent font-bold text-xs px-3 py-1 uppercase tracking-wider">
              Szakmai Útmutató
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
          
          <ArticleContentRenderer content={article.content || ''} />

          {/* Tags */}
          <div className="pt-6 border-t border-gray-100 flex items-center gap-2 flex-wrap">
            <Tag size={16} className="text-gray-400" />
            {articleTags.map((tag) => (
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
