import { describe, expect, it } from 'vitest';
import { resetDefaultMetaTags, updateArticleMetaTags } from './seoMeta';

function createMockDocument() {
  const tags = new Map<string, Record<string, string>>();
  return {
    title: '',
    head: {
      appendChild: () => {},
    },
    querySelector: (selector: string) => {
      const existing = tags.get(selector);
      if (!existing) return null;
      return {
        setAttribute: (key: string, val: string) => {
          existing[key] = val;
        },
        getAttribute: (key: string) => existing[key],
      };
    },
    createElement: (tag: string) => {
      const attrs: Record<string, string> = {};
      return {
        tagName: tag.toUpperCase(),
        setAttribute: (key: string, val: string) => {
          attrs[key] = val;
          if (tag === 'link' && attrs.rel === 'canonical') {
            tags.set('link[rel="canonical"]', attrs);
          } else if (tag === 'meta' && attrs.name) {
            tags.set(`meta[name="${attrs.name}"]`, attrs);
          } else if (tag === 'meta' && attrs.property) {
            tags.set(`meta[property="${attrs.property}"]`, attrs);
          }
        },
        getAttribute: (key: string) => attrs[key],
      };
    },
    _tags: tags,
  };
}

describe('seoMeta', () => {
  it('sets article meta tags and canonical URL, then resets to default', () => {
    const mockDoc = createMockDocument();
    const prevDoc = globalThis.document;
    const prevWin = globalThis.window;

    Object.defineProperty(globalThis, 'document', { value: mockDoc, configurable: true });
    Object.defineProperty(globalThis, 'window', {
      value: { location: { href: 'https://www.epitotudas.hu/#article?slug=beton' } },
      configurable: true,
    });

    try {
      updateArticleMetaTags('Betonozás', 'Gyakorlati útmutató', 'https://www.epitotudas.hu/img.jpg');
      expect(mockDoc.title).toBe('Betonozás | ÉpítőTudás');
      expect(mockDoc._tags.get('meta[property="og:type"]')?.content).toBe('article');
      expect(mockDoc._tags.get('link[rel="canonical"]')?.href).toBe(
        'https://www.epitotudas.hu/#article?slug=beton'
      );

      resetDefaultMetaTags('ÉpítőTudás', undefined, 'https://www.epitotudas.hu/');
      expect(mockDoc.title).toBe('ÉpítőTudás');
      expect(mockDoc._tags.get('meta[property="og:type"]')?.content).toBe('website');
      expect(mockDoc._tags.get('meta[property="og:image"]')?.content).toBe(
        'https://www.epitotudas.hu/site-tile.png?v=20260912_v5'
      );
      expect(mockDoc._tags.get('link[rel="canonical"]')?.href).toBe('https://www.epitotudas.hu/');
    } finally {
      Object.defineProperty(globalThis, 'document', { value: prevDoc, configurable: true });
      Object.defineProperty(globalThis, 'window', { value: prevWin, configurable: true });
    }
  });
});

