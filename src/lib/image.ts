export const ARTICLE_DEFAULT_IMAGE = '/article-default.jpg';

export function resolveImageUrl(url: string | null | undefined, fallback?: string): string {
  if (url && url.trim()) {
    return url.trim();
  }
  return fallback ?? ARTICLE_DEFAULT_IMAGE;
}

export function isExternalUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}
