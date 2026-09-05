export interface ArticleRedirect {
  id: string;
  oldSlug: string;
  newSlug: string;
  articleId: string;
  createdAt: string;
}

const REDIRECTS_STORAGE_KEY = 'epitotudas_article_redirects_v1';

export function getArticleRedirects(): ArticleRedirect[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(REDIRECTS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveArticleRedirects(redirects: ArticleRedirect[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(REDIRECTS_STORAGE_KEY, JSON.stringify(redirects));
    window.dispatchEvent(new Event('article_redirects_updated'));
  } catch (err) {
    console.warn('Hiba az átirányítások mentésekor:', err);
  }
}

export function addArticleRedirect(oldSlug: string, newSlug: string, articleId: string): ArticleRedirect | null {
  const cleanOld = oldSlug.trim().toLowerCase();
  const cleanNew = newSlug.trim().toLowerCase();

  if (!cleanOld || !cleanNew || cleanOld === cleanNew) return null;

  const current = getArticleRedirects();
  // Filter out duplicate or circular redirects
  const filtered = current.filter((r) => r.oldSlug !== cleanOld);

  const newRedirect: ArticleRedirect = {
    id: `redir-${Date.now()}`,
    oldSlug: cleanOld,
    newSlug: cleanNew,
    articleId,
    createdAt: new Date().toISOString(),
  };

  const updated = [newRedirect, ...filtered];
  saveArticleRedirects(updated);
  return newRedirect;
}

export function resolveRedirect(slug: string): string | null {
  const clean = slug.trim().toLowerCase();
  const list = getArticleRedirects();
  const match = list.find((r) => r.oldSlug === clean);
  return match ? match.newSlug : null;
}
