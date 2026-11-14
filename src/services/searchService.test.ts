import { describe, expect, it, vi, beforeEach } from 'vitest';

function createQueryBuilder(result: { data: unknown[]; error: null }) {
  const builder = {
    select: () => builder,
    ilike: () => builder,
    or: () => builder,
    order: () => builder,
    limit: () => Promise.resolve(result),
  };
  return builder;
}

const mockFrom = vi.fn((table: string) => {
  if (table === 'articles') {
    return createQueryBuilder({
      data: [{ id: 'art-1', title: 'Betonozási útmutató', slug: 'betonozasi-utmutato', status: 'published' }],
      error: null,
    });
  }
  if (table === 'categories') {
    return createQueryBuilder({
      data: [{ id: 'cat-1', name: 'Beton és zsaluzat', slug: 'beton-es-zsaluzat' }],
      error: null,
    });
  }
  if (table === 'glossary_terms') {
    return createQueryBuilder({
      data: [{ id: 'gl-1', term: 'Betonacél', slug: 'betonacel', category: 'Szerkezet' }],
      error: null,
    });
  }
  if (table === 'tools') {
    return createQueryBuilder({
      data: [{ id: 'tool-1', name: 'Betonkeverő', slug: 'betonkevero', type: 'Gép' }],
      error: null,
    });
  }
  if (table === 'profiles') {
    return createQueryBuilder({
      data: [{ id: 'usr-1', email: 'beton@example.com', full_name: 'Beton Mester' }],
      error: null,
    });
  }
  return createQueryBuilder({ data: [], error: null });
});

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: (table: string) => mockFrom(table),
  },
}));

vi.mock('./bookService', () => ({
  fetchBooksFromCloud: vi.fn().mockResolvedValue([
    { id: 'book-1', title: 'Betonszerkezetek kézikönyve', author: 'Dr. Kovács Béla', description: 'Alapok', category: 'Statika' },
  ]),
  getBooks: vi.fn().mockReturnValue([]),
}));

import { searchAll, PREDEFINED_CALCULATORS } from './searchService';

describe('searchService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('aggregates database, cloud book, calculator, and material results for a query', async () => {
    const res = await searchAll('beton', 5);

    expect(res.articles).toHaveLength(1);
    expect(res.categories).toHaveLength(1);
    expect(res.glossary).toHaveLength(1);
    expect(res.tools.length).toBeGreaterThanOrEqual(1);
    expect(res.books).toHaveLength(1);
    expect(res.users).toHaveLength(1);
    expect(res.calculators.some((c) => c.id === 'calc-concrete')).toBe(true);
    expect(PREDEFINED_CALCULATORS.length).toBeGreaterThan(0);
  });

  it('respects the limit parameter on calculators and books', async () => {
    const res = await searchAll('beton', 1);
    expect(res.books.length).toBeLessThanOrEqual(1);
    expect(res.calculators.length).toBeLessThanOrEqual(1);
    expect(res.materials.length).toBeLessThanOrEqual(1);
  });
});

