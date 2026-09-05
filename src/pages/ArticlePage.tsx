import { useState, useEffect } from 'react';
import { Home, ChevronRight, Clock, TrendingUp, Star, AlertCircle, UserCheck, Tag, BookOpen, FileText, Calculator, Library, AlertTriangle, CheckSquare, Check, Lightbulb, Bookmark, BookmarkCheck, ShieldCheck, ExternalLink } from 'lucide-react';
import SectionSubNav from '../components/SectionSubNav';
import { getArticleBySlug, getCategories } from '../lib/api';
import { getRelatedArticles, incrementArticleViews } from '../services/articleService';
import CommunityCommentsSection from '../components/CommunityCommentsSection';
import { parseBlocksFromContent, SOURCE_TYPE_MAP } from '../components/EditArticleModal';
import type { Article, Category } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { isItemSaved, toggleSaveItem } from '../services/bookmarkService';
import SocialShareButton, { updateArticleMetaTags } from '../components/SocialShareButton';
import AuthPromptModal from '../components/AuthPromptModal';

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
  const { user } = useAuth();
  const [article, setArticle] = useState<Article | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const [categoryObj, setCategoryObj] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    if (article) {
      setSaved(isItemSaved(user?.id, article.id, 'article'));
    } else {
      setSaved(false);
    }
  }, [article, user]);

  const handleToggleBookmark = () => {
    if (!article) return;
    const res = toggleSaveItem(user?.id, {
      itemId: article.id,
      itemType: 'article',
      title: article.title,
      subtitle: categoryObj?.name || article.author || 'ÉpítőTudás',
      description: article.excerpt || undefined,
      slug: article.slug,
      imageUrl: article.featured_image || undefined,
      readTime: article.read_time,
    });
    setSaved(res.isSaved);
  };

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
          updateArticleMetaTags(
            articleData.title,
            articleData.excerpt || 'ÉpítőTudás szakmai cikk és útmutató',
            articleData.featured_image || undefined
          );

          const cat = categoriesData.find((c) => c.id === articleData.category_id || c.slug === articleData.category_id);
          setCategoryObj(cat || null);

          try {
            sessionStorage.setItem('epitotudas_article_type', articleData.article_type || 'hirek');
          } catch {
            // ignore
          }

          const related = await getRelatedArticles(articleData.id, articleData.category_id, 3);
          setRelatedArticles(related);

          // Increment view count in Supabase / DB
          incrementArticleViews(articleData.id).then((newViews) => {
            if (newViews > 0) {
              setArticle((prev) => (prev ? { ...prev, views: newViews } : prev));
            }
          });
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
          <button onClick={() => onNavigate('category?type=hirek')} className="px-4 py-2 bg-accent text-white font-semibold rounded-lg">
            Vissza a cikkekhez
          </button>
        </div>
      </div>
    );
  }

  const { seo } = parseBlocksFromContent(article.content || '');
  const articleTags = seo.primaryKeyword
    ? [seo.primaryKeyword, ...(seo.relatedKeywords?.split(',').map((k) => k.trim()) || [])]
    : ['Gipszkarton', 'Szárazépítés', 'Anyagismeret', 'Kivitelezés'];

  const articleTypeKey = article.article_type || 'hirek';
  const articleTypeLabel =
    articleTypeKey === 'hirek'
      ? 'Hírek'
      : articleTypeKey === 'ujdonsagok'
      ? 'Újdonságok'
      : 'Útmutatók';

  return (
    <div className="min-h-screen bg-background">
      {/* Header Breadcrumb */}
      <div className="bg-primary border-b border-primary-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <button onClick={() => onNavigate('home')} className="flex items-center gap-1 hover:text-white transition-colors">
              <Home size={13} /> Főoldal
            </button>
            <ChevronRight size={13} />
            <button onClick={() => onNavigate('category?type=hirek')} className="hover:text-white transition-colors">
              Cikkek &amp; Útmutatók
            </button>
            <ChevronRight size={13} />
            <button onClick={() => onNavigate(`category?type=${articleTypeKey}`)} className="hover:text-white transition-colors">
              {articleTypeLabel}
            </button>
            <ChevronRight size={13} />
            <span className="text-gray-300 font-medium truncate max-w-xs md:max-w-md">{article.title}</span>
          </div>
        </div>
      </div>

      {/* Sub-navigation */}
      <SectionSubNav
        ariaLabel="Tudástár navigáció"
        onNavigate={onNavigate}
        items={[
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

          {/* Author Badge & Bookmark button */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-100 text-sm flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent font-bold">
                <UserCheck size={18} />
              </div>
              <div>
                <div className="font-bold text-gray-900">{article.author || 'ÉpítőTudás Szerkesztőség'}</div>
                <div className="text-xs text-gray-500">Minősített Szakmai Szerző</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <SocialShareButton
                title={article.title}
                excerpt={article.excerpt || ''}
                imageUrl={article.featured_image || undefined}
              />

              <button
                onClick={handleToggleBookmark}
                className={`px-4 py-2.5 rounded-xl border transition-all flex items-center gap-2 text-xs font-extrabold cursor-pointer ${
                  saved
                    ? 'bg-amber-100 border-amber-300 text-amber-900 hover:bg-amber-200 shadow-2xs'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
                title={saved ? 'Mentés eltávolítása' : 'Cikk elmentése a mentéseim közé'}
              >
                {saved ? (
                  <>
                    <BookmarkCheck size={16} className="text-amber-700 fill-amber-500" />
                    <span>Cikk elmentve</span>
                  </>
                ) : (
                  <>
                    <Bookmark size={16} />
                    <span>Cikk mentése</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Content Body with Table of Contents & Attachments */}
        <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm space-y-6">
          {/* Table of Contents (Tartalomjegyzék) */}
          {(() => {
            const { blocks } = parseBlocksFromContent(article.content || '');
            const headings = blocks.filter((b) => b.type === 'heading' && b.content);
            if (headings.length < 2) return null;
            return (
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 space-y-2 mb-6">
                <span className="font-extrabold text-xs text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen size={14} className="text-accent" /> Tartalomjegyzék
                </span>
                <ul className="space-y-1.5 pl-2 text-xs font-semibold text-gray-700">
                  {headings.map((h, i) => (
                    <li key={h.id || i} className={h.level === 'h3' ? 'pl-4 text-gray-600 font-normal' : ''}>
                      <a href={`#heading-${i}`} className="hover:text-primary hover:underline flex items-center gap-1.5">
                        <span className="text-accent text-[10px]">●</span> {h.content}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })()}

          <h2 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
            <BookOpen size={20} className="text-accent" /> Részletes Leírás &amp; Útmutató
          </h2>
          
          <ArticleContentRenderer content={article.content || ''} />

          {/* Downloadable PDF Documents */}
          {article.documents && article.documents.length > 0 && (
            <div className="border-t border-gray-100 pt-6 space-y-3">
              <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                <FileText size={16} className="text-primary" /> Letölthető Műszaki Dokumentumok &amp; Útmutatók
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {article.documents.map((doc) => (
                  <a
                    key={doc.id}
                    href={doc.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3.5 bg-gray-50 hover:bg-accent/10 border border-gray-200 rounded-xl flex items-center justify-between transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <FileText size={18} className="text-red-500 shrink-0" />
                      <div>
                        <div className="font-bold text-xs text-gray-900 group-hover:text-primary">{doc.title}</div>
                        <div className="text-[10px] text-gray-500">{doc.file_size || 'PDF Dokumentum'}</div>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-primary group-hover:underline">Letöltés</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Forrás és Hitelesség Section */}
          {(() => {
            const { sources } = parseBlocksFromContent(article.content || '');
            if (!sources || sources.length === 0) return null;
            return (
              <div className="border-t border-gray-100 pt-6 space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                    <ShieldCheck size={18} className="text-accent shrink-0" />
                    <span>Forrás és Hitelesség</span>
                  </h3>
                  <span className="text-[11px] font-bold text-gray-400">
                    {sources.length} hivatkozott forrás
                  </span>
                </div>

                <div className="space-y-3">
                  {sources.map((src, idx) => {
                    const info = SOURCE_TYPE_MAP[src.sourceType] || { label: 'Szakmai forrás', icon: '📚' };
                    return (
                      <div
                        key={src.id || idx}
                        className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs hover:border-gray-300 transition-colors"
                      >
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap text-xs">
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-primary/10 text-primary-950 border border-primary/20 flex items-center gap-1">
                              <span>{info.icon}</span>
                              <span>{info.label}</span>
                            </span>
                            {src.status && (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300">
                                Állapot: {src.status}
                              </span>
                            )}
                            {src.checkDate && (
                              <span className="text-[11px] text-gray-500 font-semibold">
                                Ellenőrizve: {src.checkDate}
                              </span>
                            )}
                          </div>

                          <h4 className="text-sm font-bold text-gray-900 leading-snug">
                            {src.sourceName}
                          </h4>
                        </div>

                        {src.url && (
                          <a
                            href={src.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-primary hover:bg-primary-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all inline-flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                          >
                            <span>Forrás megnyitása</span>
                            <ExternalLink size={13} />
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Partner Attribution Card */}
          {article.partner_name && (
            <div className="border-t border-gray-100 pt-6">
              <div className="bg-primary/5 border border-primary/15 rounded-2xl p-5 flex items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-accent bg-primary px-2 py-0.5 rounded">
                    Hivatalos Építőipari Partner
                  </span>
                  <h4 className="font-extrabold text-gray-900 text-sm mt-1">{article.partner_name}</h4>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Ez a szakmai tartalom a {article.partner_name} hivatalos közreműködésével készült.
                  </p>
                </div>
                <button
                  onClick={() => onNavigate('partners')}
                  className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-hover transition-colors shrink-0 cursor-pointer"
                >
                  Partner Profilja
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Article Tags */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <Tag size={13} /> Szakmai Kulcsszavak &amp; Témakörök
          </h3>
          <div className="flex flex-wrap gap-2">
            {articleTags.map((tag, i) => (
              <span key={i} className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full border border-gray-200">
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <div className="space-y-4">
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
            altContentId={article.slug}
            title={article.title}
          />
        )}
      </div>

      <AuthPromptModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onNavigate={onNavigate}
        contentType="article"
        contentTitle={article?.title}
        returnPage="article"
      />
    </div>
  );
}
