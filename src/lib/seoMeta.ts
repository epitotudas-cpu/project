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

/**
 * Dynamic document title and Open Graph / Twitter meta tag helpers for article pages.
 */
export function updateArticleMetaTags(title: string, description: string, image?: string, url?: string) {
  const currentUrl = url || window.location.href;
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
}

export function resetDefaultMetaTags(
  title: string,
  description: string = DEFAULT_SITE_DESCRIPTION,
  url?: string
) {
  const currentUrl = url || window.location.href;
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
}

