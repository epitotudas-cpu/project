import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  },
}));

vi.mock('./appConfigService', () => ({
  readAppConfig: vi.fn().mockResolvedValue(null),
  writeAppConfig: vi.fn().mockResolvedValue(undefined),
}));

import {
  getEducationData,
  listCourses,
  getCourseDetails,
  submitQuizAnswers,
  getUserCertificates,
} from './educationService';

describe('educationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads default education data and lists courses', async () => {
    const data = getEducationData();
    expect(data.courses.length).toBeGreaterThan(0);

    const allCourses = await listCourses();
    expect(allCourses.length).toBeGreaterThan(0);
  });

  it('returns course details with lessons and questions', async () => {
    const allCourses = await listCourses();
    const firstCourse = allCourses[0];
    const details = await getCourseDetails(firstCourse.id);

    expect(details.course.id).toBe(firstCourse.id);
    expect(Array.isArray(details.lessons)).toBe(true);
    expect(Array.isArray(details.questions)).toBe(true);
  });

  it('issues a certificate when quiz score is >= 75% and does not issue below 75%', async () => {
    const allCourses = await listCourses();
    const firstCourse = allCourses[0];
    const details = await getCourseDetails(firstCourse.id);

    const wrongAnswers: Record<string, number> = {};
    details.questions.forEach((q) => {
      wrongAnswers[q.id] = ((q.correct_option_index ?? 0) + 1) % 4;
    });

    const failResult = await submitQuizAnswers('learner-fail', firstCourse.id, wrongAnswers);
    expect(failResult.passed).toBe(false);
    expect(failResult.scorePercentage).toBe(0);
    expect(failResult.certificate).toBeUndefined();

    const correctAnswers: Record<string, number> = {};
    details.questions.forEach((q) => {
      correctAnswers[q.id] = q.correct_option_index ?? 0;
    });

    const passResult = await submitQuizAnswers('learner-pass', firstCourse.id, correctAnswers);
    expect(passResult.passed).toBe(true);
    expect(passResult.scorePercentage).toBe(100);
    expect(passResult.certificate).toBeDefined();

    const certs = await getUserCertificates('learner-pass');
    expect(certs.some((c) => c.course_id === firstCourse.id)).toBe(true);
  });
});

