import { useState, useEffect } from 'react';
import {
  Home,
  ChevronRight,
  Clock,
  TrendingUp,
  Star,
  AlertCircle,
  UserCheck,
  Tag,
  BookOpen,
  FileText,
  Calculator,
  Library,
  AlertTriangle,
  CheckSquare,
  Check,
  Lightbulb,
  Bookmark,
  BookmarkCheck,
  ShieldCheck,
  ExternalLink,
  Calendar,
} from 'lucide-react';
import SectionSubNav from '../components/SectionSubNav';
import { getArticleBySlug, getCategories } from '../lib/api';
import { getRelatedArticles, incrementArticleViews } from '../services/articleService';
import CommunityCommentsSection from '../components/CommunityCommentsSection';
import { parseBlocksFromContent, SOURCE_TYPE_MAP } from '../components/EditArticleModal';
import type { Article, Category } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { isItemSaved, toggleSaveItem } from '../services/bookmarkService';
import SocialShareButton, { updateArticleMetaTags } from '../components/SocialShareButton';

interface ArticlePageProps {
  onNavigate: (page: string, params?: { articleSlug?: string }) => void;
  articleSlug?: string | null;
}

function formatDateHu(dateStr?: string | null): string {
  if (!dateStr) return '2026. augusztus 16.';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '2026. augusztus 16.';
    return d.toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return '2026. augusztus 16.';
  }
}

function ArticleContentRenderer({ content }: { content: string }) {
  const { blocks } = parseBlocksFromContent(content);

  if (!blocks || blocks.length === 0) {
    const cleanContent = content ? content.replace(/\[EPITOTUDAS_.*\]$/s, '').trim() : '';
    return (
      <div className="text-gray-800 text-base md:text-lg leading-relaxed whitespace-pre-line space-y-4">
        {cleanContent || 'A cikk tartalma hamarosan elérhető...'}
      </div>
    );
  }

  let headingIdx = 0;

  return (
    <div className="space-y-6 text-gray-800 text-base md:text-lg leading-relaxed">
      {blocks.map((block, index) => {
        switch (block.type) {
          case 'heading': {
            const hId = `heading-${headingIdx++}`;
            if (block.level === 'h3') {
              return (
                <h3 key={block.id || index} id={hId} className="text-xl font-bold text-gray-900 mt-8 mb-3 scroll-mt-24">
                  {block.content}
                </h3>
              );
            }
            if (block.level === 'h4') {
              return (
                <h4 key={block.id || index} id={hId} className="text-lg font-semibold text-gray-900 mt-6 mb-2 scroll-mt-24">
                  {block.content}
                </h4>
              );
            }
            return (
              <h2
                key={block.id || index}
                id={hId}
                className="text-2xl md:text-3xl font-extrabold text-gray-900 mt-10 mb-4 border-b border-gray-200 pb-3 flex items-center gap-2 scroll-mt-24"
              >
                {block.content}
              </h2>
            );
          }

          case 'text': {
            const txt = block.content || '';
            const imgMatch = txt.trim().match(/^!\[([^\]]*)\]\(([^)]+)\)\s*(?:\n\*(.*)\*)?$/);
            if (imgMatch) {
              return (
                <figure key={block.id || index} className="my-8 rounded-3xl overflow-hidden border border-gray-200 shadow-sm bg-gray-50">
                  <img src={imgMatch[2]} alt={imgMatch[1] || ''} className="w-full h-auto max-h-[500px] object-cover" />
                  {imgMatch[3] && (
                    <figcaption className="p-3.5 text-center text-xs text-gray-600 bg-gray-100/80 italic border-t border-gray-200 font-medium">
                      {imgMatch[3]}
                    </figcaption>
                  )}
                </figure>
              );
            }
            return (
              <p key={block.id || index} className="text-gray-800 text-base md:text-lg leading-relaxed my-4 whitespace-pre-line">
                {txt}
              </p>
            );
          }

          case 'image':
            if (!block.imageUrl) return null;
            return (
              <figure key={block.id || index} className="my-8 rounded-3xl overflow-hidden border border-gray-200 shadow-sm bg-gray-50">
                <img src={block.imageUrl} alt={block.imageAlt || ''} className="w-full h-auto max-h-[500px] object-cover" />
                {block.imageCaption && (
                  <figcaption className="p-3.5 text-center text-xs text-gray-600 bg-gray-100/80 italic border-t border-gray-200 font-medium">
                    {block.imageCaption}
                  </figcaption>
                )}
              </figure>
            );

          case 'table':
            if (!block.tableHeaders || block.tableHeaders.length === 0) return null;
            return (
              <div key={block.id || index} className="overflow-x-auto my-8 border border-gray-200 rounded-2xl shadow-xs bg-white">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-primary/5 text-primary font-bold">
                    <tr>
                      {block.tableHeaders.map((header, hIdx) => (
                        <th key={hIdx} className="px-5 py-3.5 text-left font-bold text-gray-900 border-b border-gray-200">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {block.tableRows?.map((row, rIdx) => (
                      <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'}>
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="px-5 py-3.5 text-gray-800 font-medium">
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
              <div key={block.id || index} className="my-8 p-5 rounded-2xl border-l-4 border-amber-500 bg-amber-50/90 text-amber-950 flex items-start gap-4 shadow-2xs">
                <AlertTriangle size={24} className="text-amber-600 shrink-0 mt-0.5" />
                <div className="text-sm md:text-base leading-relaxed font-medium">{block.content}</div>
              </div>
            );

          case 'highlight':
            return (
              <div key={block.id || index} className="my-8 p-6 rounded-2xl border-l-4 border-accent bg-accent/5 text-gray-900 space-y-2 shadow-2xs">
                <div className="font-extrabold text-accent text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Lightbulb size={16} /> [{block.highlightType || 'Szakmai tipp'}] {block.highlightTitle}
                </div>
                <div className="text-sm md:text-base text-gray-800 leading-relaxed">{block.content}</div>
              </div>
            );

          case 'checklist':
            return (
              <div key={block.id || index} className="my-8 bg-gray-50 p-6 rounded-3xl border border-gray-200 shadow-xs space-y-4">
                <div className="font-bold text-gray-900 text-base flex items-center gap-2">
                  <CheckSquare size={18} className="text-accent" /> Minőségellenőrző Ellenőrzőlista
                </div>
                <div className="space-y-2.5">
                  {block.checkItems?.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 text-sm md:text-base text-gray-800 font-medium">
                      <div className="w-5 h-5 rounded-md border border-accent/40 bg-accent/10 flex items-center justify-center text-accent shrink-0">
                        <Check size={14} strokeWidth={3} />
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
              <ul key={block.id || index} className="my-6 space-y-2.5 pl-6 list-disc text-gray-800 text-base md:text-lg leading-relaxed">
                {block.items?.map((item, itemIdx) => (
                  <li key={itemIdx}>{item}</li>
                ))}
              </ul>
            );

          default:
            return (
              <p key={block.id || index} className="text-gray-800 text-base md:text-lg leading-relaxed my-4 whitespace-pre-line">
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
        const slugToFetch = articleSlug || 'gipszkarton-valaszfal-keszitese-lepesrol-lepesre';
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
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
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
    : article.tags && article.tags.length > 0
    ? article.tags
    : ['Gipszkarton', 'Szárazépítés', 'Anyagismeret', 'Kivitelezés'];

  const articleTypeKey = article.article_type || 'hirek';
  const articleTypeLabel =
    articleTypeKey === 'hirek'
      ? 'Hírek'
      : articleTypeKey === 'ujdonsagok'
      ? 'Újdonságok'
      : 'Útmutatók';

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#1e293b]">
      {/* 1. Header Breadcrumb Bar */}
      <div className="bg-primary border-b border-primary-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-400">
            <button onClick={() => onNavigate('home')} className="flex items-center gap-1 hover:text-white transition-colors">
              <Home size={13} /> Főoldal
            </button>
            <ChevronRight size={13} />
            <button onClick={() => onNavigate('category?type=hirek')} className="hover:text-white transition-colors">
              Cikkek
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

      {/* 2. Sub-navigation Ribbon */}
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

      {/* 3. MAIN FULL-WIDTH ARTICLE CONTAINER */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        
        {/* HERO AREA: Full-width Header Banner */}
        <div className="space-y-6 border-b border-gray-200 pb-8">
          <div className="flex flex-wrap items-center gap-3">
            <span className="px-3 py-1 rounded-full text-xs font-black bg-primary/10 text-primary border border-primary/20 uppercase tracking-wider flex items-center gap-1.5">
              {categoryObj && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: categoryObj.color || '#FFC400' }} />}
              {categoryObj ? categoryObj.name : 'ÉpítőTudás Szakcikk'}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-black bg-accent/20 text-accent border border-accent/30 uppercase tracking-wider">
              {articleTypeLabel}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 tracking-tight leading-[1.15]">
            {article.title}
          </h1>

          {article.excerpt && (
            <p className="text-lg md:text-xl text-gray-600 font-medium leading-relaxed max-w-4xl">
              {article.excerpt}
            </p>
          )}

          {/* META BAR: Author, Date, Read time, Views, Actions */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-gray-100 text-xs md:text-sm text-gray-600">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold">
                <UserCheck size={20} />
              </div>
              <div>
                <div className="font-bold text-gray-900 text-sm md:text-base">{article.author || 'ÉpítőTudás Szerkesztőség'}</div>
                <div className="text-xs text-gray-500">Minősített Szakmai Szerző</div>
              </div>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <span className="flex items-center gap-1.5 font-medium"><Calendar size={14} className="text-gray-400" /> {formatDateHu(article.created_at)}</span>
              <span className="flex items-center gap-1.5 font-medium"><Clock size={14} className="text-gray-400" /> {article.read_time || 5} perc olvasás</span>
              <span className="flex items-center gap-1.5 font-medium"><TrendingUp size={14} className="text-gray-400" /> {formatViews(article.views)} megtekintés</span>
              <span className="flex items-center gap-1 font-bold text-amber-500"><Star size={14} fill="currentColor" /> {article.rating.toFixed(1)}</span>
            </div>

            {/* Quick Share & Save */}
            <div className="flex items-center gap-2">
              <SocialShareButton
                title={article.title}
                excerpt={article.excerpt || ''}
                imageUrl={article.featured_image || undefined}
              />
              <button
                onClick={handleToggleBookmark}
                className={`px-4 py-2 rounded-xl border transition-all flex items-center gap-2 text-xs font-extrabold cursor-pointer ${
                  saved
                    ? 'bg-amber-100 border-amber-300 text-amber-900 hover:bg-amber-200'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {saved ? (
                  <>
                    <BookmarkCheck size={16} className="text-amber-700 fill-amber-500" />
                    <span>Elmentve</span>
                  </>
                ) : (
                  <>
                    <Bookmark size={16} />
                    <span>Mentés</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* MAIN ARTICLE BODY (FULL WIDTH) */}
        <div className="space-y-8 w-full">
          
          {/* Featured Image */}
          {article.featured_image && (
            <div className="rounded-3xl overflow-hidden shadow-md border border-gray-200 bg-gray-100 aspect-[16/9] w-full">
              <img
                src={article.featured_image}
                alt={article.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Main Article Content Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 md:p-10 border border-gray-200/90 shadow-xs space-y-8">
            
            <ArticleContentRenderer content={article.content || ''} />

            {/* Downloadable PDF Documents */}
            {article.documents && article.documents.length > 0 && (
              <div className="border-t border-gray-100 pt-8 space-y-4">
                <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                  <FileText size={18} className="text-primary" /> Letölthető Műszaki Dokumentumok &amp; Útmutatók
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {article.documents.map((doc) => (
                    <a
                      key={doc.id}
                      href={doc.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-4 bg-gray-50 hover:bg-accent/10 border border-gray-200 hover:border-accent rounded-2xl flex items-center justify-between transition-all group cursor-pointer shadow-2xs"
                    >
                      <div className="flex items-center gap-3">
                        <FileText size={22} className="text-red-500 shrink-0" />
                        <div>
                          <div className="font-bold text-xs sm:text-sm text-gray-900 group-hover:text-primary">{doc.title}</div>
                          <div className="text-[11px] text-gray-500">{doc.file_size || 'PDF Dokumentum'}</div>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-primary group-hover:underline shrink-0">Letöltés</span>
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
                <div className="border-t border-gray-100 pt-8 space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                      <ShieldCheck size={20} className="text-accent shrink-0" />
                      <span>Forrás és Hitelesség</span>
                    </h3>
                    <span className="text-xs font-bold text-gray-400">
                      {sources.length} ellenőrzött forrás
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
                              <span>Eredeti megnyitása</span>
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
              <div className="border-t border-gray-100 pt-8">
                <div className="bg-primary/5 border border-primary/15 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-accent bg-primary px-2.5 py-1 rounded-md inline-block">
                      Hivatalos Építőipari Partner
                    </span>
                    <h4 className="font-extrabold text-gray-900 text-base">{article.partner_name}</h4>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Ez a szakmai cikk a {article.partner_name} szakmai közreműködésével és jóváhagyásával készült.
                    </p>
                  </div>
                  <button
                    onClick={() => onNavigate('partners')}
                    className="px-4 py-2.5 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-hover transition-colors shrink-0 cursor-pointer shadow-xs"
                  >
                    Partner Profilja
                  </button>
                </div>
              </div>
            )}

            {/* Tags & Keywords */}
            <div className="border-t border-gray-100 pt-6 space-y-3">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <Tag size={14} /> Szakmai Kulcsszavak &amp; Témakörök
              </h3>
              <div className="flex flex-wrap gap-2">
                {articleTags.map((tag, i) => (
                  <span key={i} className="px-3.5 py-1.5 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full border border-gray-200 hover:bg-gray-200 transition-colors">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

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

        {/* BOTTOM SECTION: Full Width Related Articles Grid */}
        {relatedArticles.length > 0 && (
          <div className="pt-10 border-t border-gray-200 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                <BookOpen size={24} className="text-accent" />
                <span>További Kapcsolódó Szakcikkek</span>
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedArticles.map((rel) => (
                <article
                  key={rel.id}
                  onClick={() => onNavigate('article', { articleSlug: rel.slug })}
                  className="bg-white border border-gray-200 hover:border-primary/40 hover:shadow-xl rounded-3xl p-6 transition-all duration-300 group cursor-pointer flex flex-col justify-between space-y-4 shadow-xs"
                >
                  <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-accent bg-accent/10 px-2.5 py-1 rounded-md inline-block">
                      Kapcsolódó tartalom
                    </span>
                    <h3 className="font-extrabold text-gray-900 text-base group-hover:text-primary transition-colors line-clamp-2">
                      {rel.title}
                    </h3>
                    <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed">
                      {rel.excerpt}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs">
                    <span className="text-gray-500 font-medium">{rel.read_time || 5} perc olvasás</span>
                    <span className="text-primary font-black group-hover:underline flex items-center gap-1">
                      Cikk megnyitása <ChevronRight size={14} />
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {/* BOTTOM BACK BUTTON */}
        <div className="pt-6 flex items-center justify-center">
          <button
            onClick={() => onNavigate(`category?type=${articleTypeKey}`)}
            className="px-8 py-4 bg-primary hover:bg-primary-700 text-white font-extrabold text-sm rounded-2xl shadow-md transition-all flex items-center gap-3 hover:gap-4 cursor-pointer"
          >
            <span>← Vissza a {articleTypeLabel} kategóriához</span>
          </button>
        </div>

      </div>
    </div>
  );
}
