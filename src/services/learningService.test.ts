import { describe, it, expect, vi, beforeEach } from 'vitest';

const { writeAppConfigMock, readAppConfigMock, fromMock } = vi.hoisted(() => ({
  writeAppConfigMock: vi.fn().mockResolvedValue(undefined),
  readAppConfigMock: vi.fn().mockResolvedValue(null),
  fromMock: vi.fn(),
}));

vi.mock('./appConfigService', () => ({
  writeAppConfig: writeAppConfigMock,
  readAppConfig: readAppConfigMock,
}));

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: fromMock,
  },
}));

import {
  saveCourse,
  setCourseStatus,
  deleteCourse,
  getCoursesLocal,
  getCourseBySlug,
  addTermToFlashcards,
  updateFlashcardMastery,
  getFlashcardsLocal,
} from './learningService';

describe('learningService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const store: Record<string, string> = {};
    vi.stubGlobal('window', {
      localStorage: {
        getItem: (k: string) => store[k] ?? null,
        setItem: (k: string, v: string) => { store[k] = v; },
      },
      dispatchEvent: vi.fn(),
    });
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => { store[k] = v; },
    });
  });

  it('creates, updates status (pending/rejected), and deletes a course', async () => {
    const created = await saveCourse({
      title: 'Homlokzati hőszigetelés alapok',
      slug: 'homlokzati-hoszigeteles-alapok',
      status: 'draft',
      partner_id: 'p-1',
    });

    expect(created.title).toBe('Homlokzati hőszigetelés alapok');
    expect(getCoursesLocal().some((c) => c.id === created.id)).toBe(true);

    await setCourseStatus(created.id, 'rejected', 'Hiányzó forrásmegjelölés');
    const rejected = getCoursesLocal().find((c) => c.id === created.id);
    expect(rejected?.status).toBe('rejected');
    expect(rejected?.rejection_note).toBe('Hiányzó forrásmegjelölés');

    await deleteCourse(created.id);
    expect(getCoursesLocal().some((c) => c.id === created.id)).toBe(false);
  });

  it('returns null from getCourseBySlug when slug is unknown', async () => {
    const missing = await getCourseBySlug('nem-letezo-tananyag-999');
    expect(missing).toBeNull();
  });

  it('manages user flashcards and mastery state', () => {
    const card = addTermToFlashcards('user-1', {
      id: 'kt-1',
      term: 'Párazáró fólia',
      definition: 'A belső oldali páraáteresztést gátló réteg.',
    });
    expect(getFlashcardsLocal('user-1').some((c) => c.id === card.id)).toBe(true);

    updateFlashcardMastery('user-1', card.id, true);
    const updated = getFlashcardsLocal('user-1').find((c) => c.id === card.id);
    expect(updated?.master_level).toBe(1);
  });
});
