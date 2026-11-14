import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  writeAppConfigMock,
  readAppConfigMock,
  readAppConfigWithVersionMock,
  writeAppConfigIfUnchangedMock,
  fromMock,
} = vi.hoisted(() => ({
  writeAppConfigMock: vi.fn().mockResolvedValue(undefined),
  readAppConfigMock: vi.fn().mockResolvedValue(null),
  readAppConfigWithVersionMock: vi.fn().mockResolvedValue({ value: null, updatedAt: null }),
  writeAppConfigIfUnchangedMock: vi.fn().mockResolvedValue({ conflict: false, updatedAt: '2026-11-14T12:00:00Z' }),
  fromMock: vi.fn(),
}));

vi.mock('./appConfigService', () => ({
  writeAppConfig: writeAppConfigMock,
  readAppConfig: readAppConfigMock,
  readAppConfigWithVersion: readAppConfigWithVersionMock,
  writeAppConfigIfUnchanged: writeAppConfigIfUnchangedMock,
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
    readAppConfigWithVersionMock.mockResolvedValue({ value: null, updatedAt: null });
    writeAppConfigIfUnchangedMock.mockResolvedValue({ conflict: false, updatedAt: '2026-11-14T12:00:00Z' });
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

  it('retries with fresh cloud list on CAS conflict so concurrent edits do not lose other courses', async () => {
    const otherCourse = {
      id: 'course-other',
      title: 'Másik Szerkesztő Tananyaga',
      slug: 'masik-tananyag',
      status: 'published',
      updated_at: '2026-11-14T11:55:00Z',
    };

    // Attempt 1 sees empty cloud, gets conflict; Attempt 2 sees otherCourse
    readAppConfigWithVersionMock
      .mockResolvedValueOnce({ value: [], updatedAt: 'v1' })
      .mockResolvedValueOnce({ value: [otherCourse], updatedAt: 'v2' });

    writeAppConfigIfUnchangedMock
      .mockResolvedValueOnce({ conflict: true, updatedAt: null })
      .mockResolvedValueOnce({ conflict: false, updatedAt: 'v3' });

    const created = await saveCourse({
      id: 'course-mine',
      title: 'Saját Új Tananyag',
      slug: 'sajat-uj-tananyag',
      status: 'draft',
    });

    expect(created.id).toBe('course-mine');
    expect(writeAppConfigIfUnchangedMock).toHaveBeenCalledTimes(2);
    const savedList = writeAppConfigIfUnchangedMock.mock.calls[1][1] as Array<{ id: string }>;
    expect(savedList.some((c) => c.id === 'course-other')).toBe(true);
    expect(savedList.some((c) => c.id === 'course-mine')).toBe(true);
  });

  it('rejects stale same-item overwrite when cloud copy has newer updated_at', async () => {
    readAppConfigWithVersionMock.mockResolvedValueOnce({
      value: [
        {
          id: 'course-1',
          title: 'Frissebb Szerver Verzió',
          updated_at: '2026-11-14T12:00:00Z',
        },
      ],
      updatedAt: 'v2',
    });

    await expect(
      saveCourse({
        id: 'course-1',
        title: 'Régi Kliens Verzió',
        updated_at: '2026-11-14T11:00:00Z',
      })
    ).rejects.toThrow('időközben más módosította');
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
