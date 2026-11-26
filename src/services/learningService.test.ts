import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  writeAppConfigMock,
  readAppConfigMock,
  readAppConfigWithVersionMock,
  writeAppConfigIfUnchangedMock,
  readUserAppStateMock,
  writeUserAppStateMock,
  fromMock,
  getUserMock,
  rpcMock,
} = vi.hoisted(() => ({
  writeAppConfigMock: vi.fn().mockResolvedValue(undefined),
  readAppConfigMock: vi.fn().mockResolvedValue(null),
  readAppConfigWithVersionMock: vi.fn().mockResolvedValue({ value: null, updatedAt: null }),
  writeAppConfigIfUnchangedMock: vi.fn().mockResolvedValue({ conflict: false, updatedAt: '2026-11-14T12:00:00Z' }),
  readUserAppStateMock: vi.fn().mockResolvedValue(null),
  writeUserAppStateMock: vi.fn().mockResolvedValue(undefined),
  fromMock: vi.fn(),
  getUserMock: vi.fn().mockResolvedValue({ data: { user: { id: 'admin-1' } } }),
  rpcMock: vi.fn().mockResolvedValue({ data: null, error: null }),
}));

vi.mock('./appConfigService', () => ({
  writeAppConfig: writeAppConfigMock,
  readAppConfig: readAppConfigMock,
  readAppConfigWithVersion: readAppConfigWithVersionMock,
  writeAppConfigIfUnchanged: writeAppConfigIfUnchangedMock,
  readUserAppState: readUserAppStateMock,
  writeUserAppState: writeUserAppStateMock,
}));

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: fromMock,
    auth: { getUser: getUserMock },
    rpc: rpcMock,
  },
}));

import {
  DEFAULT_QUIZZES,
  saveCourse,
  setCourseStatus,
  deleteCourse,
  getCoursesLocal,
  getCourseBySlug,
  listQuizzes,
  evaluateQuizAttempt,
  addTermToFlashcards,
  updateFlashcardMastery,
  getFlashcardsLocal,
} from './learningService';

describe('learningService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getUserMock.mockResolvedValue({ data: { user: { id: 'admin-1' } } });
    fromMock.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: vi.fn().mockResolvedValue({ data: { role: 'admin' }, error: null }),
            }),
          }),
        };
      }
      return {};
    });
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

  it('manages user flashcards and mastery state', async () => {
    const card = await addTermToFlashcards('user-1', {
      id: 'kt-1',
      term: 'Párazáró fólia',
      definition: 'A belső oldali páraáteresztést gátló réteg.',
    });
    expect(getFlashcardsLocal('user-1').some((c) => c.id === card.id)).toBe(true);

    await updateFlashcardMastery('user-1', card.id, true);
    const updated = getFlashcardsLocal('user-1').find((c) => c.id === card.id);
    expect(updated?.master_level).toBe(1);
  });

  it('does not include correct_options or explanation in DEFAULT_QUIZZES or public listQuizzes', async () => {
    for (const quiz of DEFAULT_QUIZZES) {
      for (const q of quiz.questions) {
        expect(q.correct_options).toBeUndefined();
        expect(q.explanation).toBeUndefined();
      }
    }

    rpcMock.mockResolvedValueOnce({
      data: [
        {
          id: 'quiz-pub',
          title: 'Publikus Teszt',
          slug: 'publikus-teszt',
          description: 'Leírás',
          category_id: 'cat-1',
          category_name: 'Tech',
          difficulty: 'beginner',
          passing_score_percent: 75,
          status: 'published',
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
          questions: [
            {
              id: 'q1',
              question: 'Kérdés?',
              options: ['A', 'B'],
              correct_options: [1],
              explanation: 'Magyarázat',
              points: 10,
            },
          ],
        },
      ],
      error: null,
    });

    const publicQuizzes = await listQuizzes({ status: 'published', scope: 'public' });
    expect(publicQuizzes).toHaveLength(1);
    expect(publicQuizzes[0].questions[0].correct_options).toBeUndefined();
    expect(publicQuizzes[0].questions[0].explanation).toBeUndefined();
  });

  it('evaluates quiz attempts via evaluate_learning_quiz_attempt RPC', async () => {
    const mockEval = {
      quiz_id: 'quiz-1',
      score: 40,
      max_score: 40,
      percentage: 100,
      passed: true,
      passing_score_percent: 75,
      results: [
        {
          question_id: 'q-1',
          is_correct: true,
          correct_options: [1],
          explanation: 'Magyarázat',
          points_earned: 10,
        },
      ],
    };
    rpcMock.mockResolvedValueOnce({ data: mockEval, error: null });

    const res = await evaluateQuizAttempt('quiz-1', { 'q-1': [1] });
    expect(rpcMock).toHaveBeenCalledWith('evaluate_learning_quiz_attempt', {
      p_quiz_id: 'quiz-1',
      p_user_answers: { 'q-1': [1] },
    });
    expect(res.score).toBe(40);
    expect(res.passed).toBe(true);
    expect(res.results[0].correct_options).toEqual([1]);
  });
});
