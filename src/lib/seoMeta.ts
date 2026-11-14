const DEFAULT_SITE_DESCRIPTION =
  'Építőipari tudásbázis szakembereknek, tanulóknak és kivitelezőknek. Szakmai fogalmak, technológiák, szakmák, számítások és gyakorlati tudás egy helyen.';
const DEFAULT_OG_IMAGE = 'https://www.epitotudas.hu/site-tile.png?v=20260912_v5';

function setMetaTag(property: string, content: string, isName = false) {
  const selector = isName ? `meta[name="${property}"]` : `meta[property="${property}"]`;
  let element = document.querySelector(selector) as HTMLMetaElement | null;
  if (!element) {
    element = document.createElement('meta');
    if (isName) {
      element.setAttribute('name', property);
    } else {
      element.setAttribute('property', property);
    }
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

function setCanonicalLink(url: string) {
  let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    document.head.appendChild(canonical);
  }
  canonical.setAttribute('href', url);
}

function getCleanCanonicalUrl(url?: string): string {
  const raw = url || window.location.href;
  return raw.split('#')[0] || raw;
}

export function setJsonLdSchema(id: string, schema: Record<string, unknown> | null): void {
  const selector = `script[type="application/ld+json"][data-schema-id="${id}"]`;
  const existing = document.querySelector(selector);
  if (!schema) {
    if (existing && typeof existing.remove === 'function') {
      existing.remove();
    }
    return;
  }
  let script = existing as HTMLScriptElement | null;
  if (!script) {
    script = document.createElement('script') as HTMLScriptElement;
    script.setAttribute('type', 'application/ld+json');
    script.setAttribute('data-schema-id', id);
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(schema);
}

/**
 * Dynamic document title and Open Graph / Twitter meta tag helpers for article pages.
 */
export function updateArticleMetaTags(title: string, description: string, image?: string, url?: string) {
  const currentUrl = getCleanCanonicalUrl(url);
  const pageTitle = `${title} | ÉpítőTudás`;

  document.title = pageTitle;
  setCanonicalLink(currentUrl);

  // Standard Meta
  setMetaTag('description', description, true);

  // Open Graph Meta
  setMetaTag('og:title', pageTitle);
  setMetaTag('og:description', description);
  setMetaTag('og:url', currentUrl);
  setMetaTag('og:type', 'article');
  setMetaTag('og:site_name', 'ÉpítőTudás');
  if (image) setMetaTag('og:image', image);

  // Twitter Meta
  setMetaTag('twitter:card', 'summary_large_image', true);
  setMetaTag('twitter:title', pageTitle, true);
  setMetaTag('twitter:description', description, true);
  if (image) setMetaTag('twitter:image', image, true);

  setJsonLdSchema('page', {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    url: currentUrl,
    ...(image ? { image: [image] } : {}),
    publisher: {
      '@type': 'Organization',
      name: 'ÉpítőTudás',
      url: 'https://www.epitotudas.hu',
    },
  });
}

export function resetDefaultMetaTags(
  title: string,
  description: string = DEFAULT_SITE_DESCRIPTION,
  url?: string
) {
  const currentUrl = getCleanCanonicalUrl(url);
  document.title = title;
  setCanonicalLink(currentUrl);

  setMetaTag('description', description, true);
  setMetaTag('og:title', title);
  setMetaTag('og:description', description);
  setMetaTag('og:url', currentUrl);
  setMetaTag('og:type', 'website');
  setMetaTag('og:site_name', 'ÉpítőTudás');
  setMetaTag('og:image', DEFAULT_OG_IMAGE);
  setMetaTag('twitter:card', 'summary_large_image', true);
  setMetaTag('twitter:title', title, true);
  setMetaTag('twitter:description', description, true);
  setMetaTag('twitter:image', DEFAULT_OG_IMAGE, true);

  setJsonLdSchema('page', {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'ÉpítőTudás',
    url: 'https://www.epitotudas.hu',
    description,
  });
}

