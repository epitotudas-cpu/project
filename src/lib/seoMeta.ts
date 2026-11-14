/**
 * Dynamic document title and Open Graph / Twitter meta tag helpers for article pages.
 */
export function updateArticleMetaTags(title: string, description: string, image?: string, url?: string) {
  const currentUrl = url || window.location.href;
  const pageTitle = `${title} | ÉpítőTudás`;

  document.title = pageTitle;

  const setMeta = (property: string, content: string, isName = false) => {
    const selector = isName ? `meta[name="${property}"]` : `meta[property="${property}"]`;
    let element = document.querySelector(selector) as HTMLMetaElement;
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
  };

  // Standard Meta
  setMeta('description', description, true);

  // Open Graph Meta
  setMeta('og:title', pageTitle);
  setMeta('og:description', description);
  setMeta('og:url', currentUrl);
  setMeta('og:type', 'article');
  setMeta('og:site_name', 'ÉpítőTudás');
  if (image) setMeta('og:image', image);

  // Twitter Meta
  setMeta('twitter:card', 'summary_large_image', true);
  setMeta('twitter:title', pageTitle, true);
  setMeta('twitter:description', description, true);
  if (image) setMeta('twitter:image', image, true);
}

