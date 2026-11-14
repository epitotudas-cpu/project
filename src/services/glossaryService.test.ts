import { describe, it, expect, vi, beforeEach } from 'vitest';

const { fromMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
}));

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: fromMock,
  },
}));

import { listGlossaryTerms, searchGlossary } from './glossaryService';

describe('glossaryService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('applies query limit when listing glossary terms', async () => {
    const limit = vi.fn().mockResolvedValue({ data: [{ id: 't1', term: 'Beton' }], error: null });
    const order = vi.fn().mockReturnValue({ limit });
    const select = vi.fn().mockReturnValue({ order });
    fromMock.mockReturnValue({ select });

    const res = await listGlossaryTerms(123);
    expect(fromMock).toHaveBeenCalledWith('glossary_terms');
    expect(limit).toHaveBeenCalledWith(123);
    expect(res).toHaveLength(1);
  });

  it('returns empty arrays immediately when searchGlossary input sanitizes to empty', async () => {
    const res = await searchGlossary('(),{}*"\'\\');
    expect(res).toEqual({
      technicalTerms: [],
      jargonTerms: [],
      linkedOfficialTerms: [],
    });
    expect(fromMock).not.toHaveBeenCalled();
  });

  it('sanitizes PostgREST metacharacters and separates technical vs jargon terms in searchGlossary', async () => {
    const limit = vi.fn().mockResolvedValue({
      data: [
        { id: '1', term: 'Zsalu', entry_type: 'technical_term' },
        { id: '2', term: 'Zsaludeszka', entry_type: 'industry_term', official_term_id: '1' },
      ],
      error: null,
    });
    const order = vi.fn().mockReturnValue({ limit });
    const or = vi.fn().mockReturnValue({ order });
    const inMock = vi.fn().mockResolvedValue({
      data: [{ id: '1', term: 'Zsalu', entry_type: 'technical_term' }],
      error: null,
    });
    const select = vi.fn().mockImplementation(() => ({
      or,
      in: inMock,
    }));
    fromMock.mockReturnValue({ select });

    const res = await searchGlossary('zsalu,(test)');
    expect(or).toHaveBeenCalledWith(
      expect.stringContaining('term.ilike.%zsalu  test%')
    );
    expect(limit).toHaveBeenCalledWith(100);
    expect(res.technicalTerms).toHaveLength(1);
    expect(res.jargonTerms).toHaveLength(1);
    expect(res.linkedOfficialTerms).toHaveLength(1);
  });
});

