import { describe, it, expect, vi, beforeEach } from 'vitest';

const { fromMock, rpcMock, logAuditActionMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
  rpcMock: vi.fn(),
  logAuditActionMock: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: fromMock,
    rpc: rpcMock,
  },
}));

vi.mock('./auditLogService', () => ({
  logAuditAction: logAuditActionMock,
}));

import { createArticle, incrementArticleViews } from './articleService';

describe('articleService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws when createArticle Supabase insert fails', async () => {
    const single = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'duplicate slug' },
    });
    const select = vi.fn().mockReturnValue({ single });
    const insert = vi.fn().mockReturnValue({ select });
    fromMock.mockReturnValue({ insert });

    await expect(createArticle({ title: 'Teszt cikk', slug: 'teszt-cikk' })).rejects.toThrow(
      'duplicate slug'
    );
  });

  it('creates and returns article via .select(*).single()', async () => {
    const row = {
      id: 'art-123',
      title: 'Teszt cikk',
      slug: 'teszt-cikk',
      status: 'draft',
    };
    const single = vi.fn().mockResolvedValue({ data: row, error: null });
    const select = vi.fn().mockReturnValue({ single });
    const insert = vi.fn().mockReturnValue({ select });
    fromMock.mockReturnValue({ insert });

    const created = await createArticle({ title: 'Teszt cikk', slug: 'teszt-cikk' });
    expect(created).toEqual(row);
    expect(logAuditActionMock).toHaveBeenCalledWith(
      'ARTICLE_CREATE',
      'articles',
      expect.stringContaining('Teszt cikk')
    );
  });

  it('increments article views atomically via increment_article_views RPC', async () => {
    rpcMock.mockResolvedValue({ data: 42, error: null });

    const nextViews = await incrementArticleViews('art-123');
    expect(rpcMock).toHaveBeenCalledWith('increment_article_views', {
      article_id_input: 'art-123',
    });
    expect(nextViews).toBe(42);
  });
});

