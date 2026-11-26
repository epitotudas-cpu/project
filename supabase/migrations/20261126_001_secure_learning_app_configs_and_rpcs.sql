/*
# Security Migration: Secure Learning `app_configs`, Idempotent Seed, Scoped Read RPCs, and Mode-A Quiz Evaluation

1. Business Decision (Mode A - Practice Quiz):
   - Anonymous and authenticated users may practice published quizzes with unlimited retakes.
   - `correct_options` and `explanation` MUST NOT be exposed before submission (neither in JS bundles nor in public APIs).
   - After submission, `evaluate_learning_quiz_attempt` returns score, pass status, `correct_options`, and `explanation`.

2. Atomic Transition & Seed:
   - Idempotently seeds `__SYSTEM_CONFIG_LEARNING_COURSES__` and `__SYSTEM_CONFIG_LEARNING_QUIZZES__`
     (`ON CONFLICT (key) DO NOTHING`) so existing admin/partner content is never overwritten.
   - Removes both learning keys from `"Public read app_configs"` in the same transaction so seeded answer keys
     are never exposed via public REST APIs.

3. Admin / Editor Direct Access:
   - Direct `app_configs` read/write access for `admin` and `editor` roles remains intentionally preserved
     via `"Admins and editors read all app_configs"`, `"Admins manage all app_configs"`, and
     `"Editors manage non-security app_configs"`.

4. Scoped `SECURITY DEFINER` RPCs (`SET search_path = public, pg_temp`):
   - `get_published_learning_courses()` -> `anon, authenticated` (only `status = 'published'`, strips `rejection_note`)
   - `get_published_learning_quizzes()` -> `anon, authenticated` (only `status = 'published'`, strips `rejection_note`, `correct_options`, `explanation`)
   - `evaluate_learning_quiz_attempt(text, jsonb)` -> `anon, authenticated` (only `status = 'published'`, strict JSONB & range validation)
   - `get_my_learning_items(text)` -> `authenticated` (strictly scoped via `auth.uid()` + `public.partner_users`)
*/

BEGIN;

-- ============================================================================
-- 1. Idempotent seed for learning courses and quizzes (never overwrites existing)
-- ============================================================================
INSERT INTO public.app_configs (key, value, updated_at)
VALUES (
  '__SYSTEM_CONFIG_LEARNING_COURSES__',
  $seed_courses$[
    {
      "id": "course-1",
      "title": "Gipszkartonozás és Szárazépítési Alapismeretek",
      "slug": "gipszkartonozas-es-szarazepitesi-alapismeretek",
      "excerpt": "Átfogó oktatási tananyag a szárazépítészet alapjairól: UW/CW profilozás, lapválasztás, akusztika és glettelési szabványok.",
      "content": "Ez a tananyag lépésről lépésre vezeti be a tanulót a modern gipszkartonozási technológiákba és munkavédelmi előírásokba.",
      "category_id": "cat-1",
      "category_name": "Építési technológiák",
      "subcategory_name": "Szárazépítés",
      "topic": "Válaszfalak & Szerkezetépítés",
      "difficulty": "beginner",
      "audience": "everyone",
      "estimated_time_minutes": 45,
      "featured_image": "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1200&q=80",
      "documents": [
        {
          "id": "cdoc-1",
          "title": "Szarazepitesi_Normagyujtemeny.pdf",
          "file_url": "/docs/szarazepites_norma.pdf",
          "doc_type": "szabvany",
          "file_size": "1.8 MB"
        }
      ],
      "video_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      "tags": ["szárazépítés", "gipszkarton", "profilok", "akusztika", "glettelés"],
      "author": "ÉpítőTudás Oktatási Csapat",
      "partner_id": "p-1",
      "partner_name": "Leier Hungária Kft.",
      "status": "published",
      "rejection_note": null,
      "created_at": "2026-01-01T00:00:00.000Z",
      "updated_at": "2026-01-01T00:00:00.000Z",
      "key_terms": [
        {
          "id": "kt-1",
          "term": "UW Profil",
          "definition": "Vízszintes vezetőprofil padlóra és mennyezetre a válaszfal nyomvonalának kijelöléséhez.",
          "explanation": "Mindig rezgéscsillapító PE akusztikai szalaggal kell rögzíteni az aljzatra.",
          "example": "UW 75/40/0.6 profil padlórögzítése 60 cm-es dübeltávolsággal."
        },
        {
          "id": "kt-2",
          "term": "CW Profil",
          "definition": "Függőleges tartóprofil, amelyet az UW profilokba csúsztatva állítunk be 600 mm kiosztással.",
          "explanation": "A CW profilokat nem szabad mereven hozzácsavarozni az UW profilhoz a hőtágulás és szerkezeti dilatáció miatt.",
          "example": "CW 75 függőleges profil rögzítése 15 mm dilatációs hézaggal a födémnél."
        },
        {
          "id": "kt-3",
          "term": "Impregnált Gipszkarton (RBI)",
          "definition": "Zöld színű, pára- és vízálló adalékolással készült gipszkarton lap nedves helyiségekbe.",
          "explanation": "Fürdőszobákban és konyhákban használandó, de közvetlen vízterhelésnél kenhető vízszigetelést is igényel.",
          "example": "12.5 mm vastag RBI zöld kartonlap fürdőszobai válaszfalhoz."
        }
      ],
      "chapters": [
        {
          "id": "chap-1",
          "title": "1. Fejezet: Profilozás és vázszerkezet kitűzése",
          "summary": "A pontos lézeres nyomvonal kijelölése és a keretprofilok rögzítése.",
          "content": "A szárazépítészeti munkák első és legfontosabb lépése a pontos lézeres kitűzés. A padlóra, oldalfalakra és mennyezetre felrajzolt vonal adja meg a leendő válaszfal síkját.\n\n### UW és CW profilok feladata:\n- **UW profil**: Padló és mennyezeti vízszintes tartó.\n- **CW profil**: Függőleges vázprofil 600 mm tengelytávolsággal.\n\n> **🛑 BIZTONSÁG**: Profilvágáznál lemezvágó ollót használjunk, és mindig viseljünk munkavédelmi kesztyűt!",
          "estimated_minutes": 15,
          "key_terms": [
            {
              "id": "kt-1",
              "term": "UW Profil",
              "definition": "Vízszintes vezetőprofil padlóra és mennyezetre a válaszfal nyomvonalának kijelöléséhez.",
              "explanation": "Mindig rezgéscsillapító PE akusztikai szalaggal kell rögzíteni az aljzatra."
            }
          ]
        },
        {
          "id": "chap-2",
          "title": "2. Fejezet: Szigetelés és lapozás szabályai",
          "summary": "Hang- és hőszigetelő gyapot elhelyezése, valamint az eltolt kartonozási szabály.",
          "content": "A vázszerkezet felállítása után helyezzük be a 75 mm vastag ásványgyapot szigetelést.\n\n### Eltolt kartonozás szabálya:\nA kétoldali kartonlapok függőleges és vízszintes illesztései ne essenek egy vonalba! A másik oldalon 60 cm eltolással indítsuk a lapokat.\n\n> **[Szakmai tipp] CSAVAROZÁSI TÁVOLSÁG**: A gipszkarton csavarokat (TN 25) max. 25 cm-enként kell behajtani.",
          "estimated_minutes": 15,
          "key_terms": [
            {
              "id": "kt-3",
              "term": "Impregnált Gipszkarton (RBI)",
              "definition": "Zöld színű, pára- és vízálló adalékolással készült gipszkarton lap nedves helyiségekbe."
            }
          ]
        },
        {
          "id": "chap-3",
          "title": "3. Fejezet: Hézagolás és Q1-Q4 glettelési felületi minőségek",
          "summary": "A hézagerősítő papírszalag beágyazása és a felületi minőségi szintek elérése.",
          "content": "A lapozást követően a hézagokat üvegszálas vagy papír hézagerősítő szalaggal kell megerősíteni a repedések elkerülése érdekében.\n\n| Minőségi Szint | Megnevezés | Felhasználási Terület |\n| --- | --- | --- |\n| Q1 | Alap hézagolás | Burkolólapok vagy csempe alá |\n| Q2 | Standard glettelés | Strukturált tapéta vagy közepes festés alá |\n| Q3 | Speciális glettelés | Finom festés és sima felületű tapéták alá |\n| Q4 | Prémium teljes glettelés | Selyemfényű festékek és fényes súrolófényes felületek alá |",
          "estimated_minutes": 15
        }
      ]
    },
    {
      "id": "course-2",
      "title": "Építőipari Munkavédelem és Állványozási Biztonság",
      "slug": "epitoipari-munkavedelem-es-allvanyozasi-biztonsag",
      "excerpt": "Kötelező munkavédelmi ismeretek magasban végzett munkához, egyéni védőeszközök használatához és a leesés elleni védelemhez.",
      "content": "A munkabiztonsági előírások betartása az építkezésen az életvédelem és a balesetmentes kivitelezés alapja.",
      "category_id": "cat-2",
      "category_name": "Munkavédelem",
      "subcategory_name": "Magasban végzett munka",
      "topic": "Munkabiztonság & Életvédelem",
      "difficulty": "beginner",
      "audience": "everyone",
      "estimated_time_minutes": 30,
      "featured_image": "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80",
      "documents": [],
      "video_url": null,
      "tags": ["munkavédelem", "állványozás", "sisak", "biztonság", "magasban végzett munka"],
      "author": "Munkavédelmi Szakhatósági Csapat",
      "partner_id": "p-3",
      "partner_name": "BME Építőmérnöki Kar",
      "status": "published",
      "rejection_note": null,
      "created_at": "2026-01-01T00:00:00.000Z",
      "updated_at": "2026-01-01T00:00:00.000Z",
      "key_terms": [
        {
          "id": "kt-mv-1",
          "term": "Leesés Elleni Védőeszköz (MEV)",
          "definition": "Teljes testheveder és energiaelnyelő kantár, amely 2 méter feletti munkavégzésnél kötelező.",
          "explanation": "Az állványozás és tetőfedés során a kikötési pont teherbírásának legalább 12 kN-nak kell lennie."
        }
      ],
      "chapters": [
        {
          "id": "chap-mv-1",
          "title": "1. Fejezet: Magasban végzett munka és egyéni védőeszközök",
          "summary": "Védősisak, védőlábbeli és biztonsági heveder alkalmazása.",
          "content": "A 2 métert meghaladó szintkülönbség esetén kötelező a leesés elleni védelem kiépítése vagy egyéni védőeszköz (teljes testheveder) használata.",
          "estimated_minutes": 15
        },
        {
          "id": "chap-mv-2",
          "title": "2. Fejezet: Építési állványok átvétele és ellenőrzése",
          "summary": "Állványtáblák ellenőrzése, védőkorlátok és bokalécek rögzítése.",
          "content": "Minden homlokzati állványt az első használat előtt munkavédelmi szakembernek ellenőriznie kell és zöld jelzőtáblával ki kell helyeznie az átvételt.",
          "estimated_minutes": 15
        }
      ]
    }
  ]$seed_courses$::jsonb,
  now()
)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.app_configs (key, value, updated_at)
VALUES (
  '__SYSTEM_CONFIG_LEARNING_QUIZZES__',
  $seed_quizzes$[
    {
      "id": "quiz-1",
      "title": "Gipszkartonozási és Szárazépítési Teszt",
      "slug": "gipszkartonozasi-es-szarazepitesi-teszt",
      "description": "Teszteld tudásodat az UW/CW profilokról, gipszkarton lapok típusairól és a glettelési felületi minőségekről!",
      "category_id": "cat-1",
      "category_name": "Építési technológiák",
      "course_id": "course-1",
      "course_title": "Gipszkartonozás és Szárazépítési Alapismeretek",
      "difficulty": "beginner",
      "passing_score_percent": 75,
      "time_limit_minutes": 10,
      "status": "published",
      "partner_id": "p-1",
      "partner_name": "Leier Hungária Kft.",
      "created_at": "2026-01-01T00:00:00.000Z",
      "updated_at": "2026-01-01T00:00:00.000Z",
      "questions": [
        {
          "id": "q-1",
          "question": "Milyen profil képezi a gipszkarton válaszfalak vízszintes vezetőkeretét a padlón és a mennyezeten?",
          "question_type": "single",
          "options": ["CW profil", "UW profil", "UA profil", "CD profil"],
          "correct_options": [1],
          "explanation": "Az UW (U-Profil Wand) a padlóra és mennyezetre rögzített vízszintes vezetőprofil. A CW profilokat ebbe csúsztatjuk be függőlegesen.",
          "points": 10
        },
        {
          "id": "q-2",
          "question": "Szabad-e a függőleges CW profilokat mereven hozzácsavarozni az UW padlóprofilhoz?",
          "question_type": "boolean",
          "options": ["Igen, kötelező mereven csavarozni.", "Nem, a CW profilnak hőtágulási dilatáció miatt mozognia kell az UW profilban."],
          "correct_options": [1],
          "explanation": "Helyes! A CW profilokat nem szabad mereven hozzácsavarozni az UW kerethez, mert az épületmozgások miatt feszültség és falrepedés keletkezne.",
          "points": 10
        },
        {
          "id": "q-3",
          "question": "Melyik gipszkarton lap alkalmas fürdőszobai, párás helyiségek burkolására?",
          "question_type": "single",
          "options": ["Fehér színű normál (RB) lap", "Zöld színű impregnált (RBI) lap", "Rózsaszín tűzgátló (RF) lap", "Kék akusztikai lap"],
          "correct_options": [1],
          "explanation": "A zöld színű impregnált (RBI) gipszkarton lap pára- és vízálló adalékolással készül, így fürdőszobákban és vizes helyiségekben ez az előírt burkolat.",
          "points": 10
        },
        {
          "id": "q-4",
          "question": "Melyik felületi minőségi szint (Q1-Q4) képviseli a prémium, súrolófényben is tökéletesen sima teljes glettelést?",
          "question_type": "single",
          "options": ["Q1", "Q2", "Q3", "Q4"],
          "correct_options": [3],
          "explanation": "A Q4 a legmagasabb prémium glettelési fokozat, ahol a teljes gipszkarton felületet finom glettanyággal simítják el a selyemfényű festékekhez.",
          "points": 10
        }
      ]
    }
  ]$seed_quizzes$::jsonb,
  now()
)
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- 2. Remove learning keys from public app_configs read policy
-- ============================================================================
DROP POLICY IF EXISTS "Public read app_configs" ON public.app_configs;
CREATE POLICY "Public read app_configs"
ON public.app_configs
FOR SELECT
TO anon, authenticated
USING (
  key IN (
    '__SYSTEM_CONFIG_NAV_STRUCTURE__',
    '__SYSTEM_CONFIG_SITE_SETTINGS__',
    '__SYSTEM_CONFIG_HERO_STATE__',
    '__SYSTEM_CONFIG_ABOUT_SETTINGS__',
    '__SYSTEM_CONFIG_LEGAL_DOCS__',
    '__SYSTEM_CONFIG_IMPRESSUM__',
    '__SYSTEM_CONFIG_CALCULATOR_PRICES__',
    '__SYSTEM_CONFIG_TRADES__',
    '__SYSTEM_CONFIG_BOOKS__',
    '__SYSTEM_CONFIG_BOOK_CATEGORIES__',
    '__SYSTEM_CONFIG_MATERIAL_CATEGORIES__',
    '__SYSTEM_CONFIG_SOFTWARE_CATALOG__',
    '__SYSTEM_CONFIG_GLOSSARY_CATEGORY_SETTINGS__',
    '__SYSTEM_CONFIG_AD_FALLBACK_VIDEO__',
    '__SYSTEM_CONFIG_AD_TILE_SETTINGS__',
    '__SYSTEM_CONFIG_AD_CAMPAIGNS__',
    '__SYSTEM_CONFIG_AD_CREATIVES__',
    '__SYSTEM_CONFIG_KNOWLEDGE_HUB_ITEMS__',
    '__SYSTEM_CONFIG_COURSES__',
    '__SYSTEM_CONFIG_ARTICLE_ORDER__',
    '__SYSTEM_CONFIG_ARTICLE_SETTINGS__',
    '__SYSTEM_CONFIG_ARTICLE_REDIRECTS__'
  )
);

-- ============================================================================
-- 3. Scoped SECURITY DEFINER RPCs for learning content & quiz evaluation
-- ============================================================================

-- 3.1 Public published courses
CREATE OR REPLACE FUNCTION public.get_published_learning_courses()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_raw JSONB;
  v_res JSONB;
BEGIN
  SELECT value INTO v_raw
  FROM public.app_configs
  WHERE key = '__SYSTEM_CONFIG_LEARNING_COURSES__';

  IF v_raw IS NULL OR jsonb_typeof(v_raw) <> 'array' THEN
    RETURN '[]'::jsonb;
  END IF;

  SELECT COALESCE(jsonb_agg(elem - 'rejection_note'), '[]'::jsonb)
  INTO v_res
  FROM jsonb_array_elements(v_raw) AS elem
  WHERE (elem->>'status') = 'published';

  RETURN v_res;
END;
$$;

REVOKE ALL ON FUNCTION public.get_published_learning_courses() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_published_learning_courses() TO anon, authenticated;

-- 3.2 Public published quizzes (answer keys & explanations stripped)
CREATE OR REPLACE FUNCTION public.get_published_learning_quizzes()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_raw JSONB;
  v_res JSONB;
BEGIN
  SELECT value INTO v_raw
  FROM public.app_configs
  WHERE key = '__SYSTEM_CONFIG_LEARNING_QUIZZES__';

  IF v_raw IS NULL OR jsonb_typeof(v_raw) <> 'array' THEN
    RETURN '[]'::jsonb;
  END IF;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_set(
        elem - 'rejection_note',
        '{questions}',
        COALESCE(
          (
            SELECT jsonb_agg(q - 'correct_options' - 'explanation')
            FROM jsonb_array_elements(
              CASE
                WHEN jsonb_typeof(elem->'questions') = 'array' THEN elem->'questions'
                ELSE '[]'::jsonb
              END
            ) AS q
          ),
          '[]'::jsonb
        ),
        true
      )
    ),
    '[]'::jsonb
  )
  INTO v_res
  FROM jsonb_array_elements(v_raw) AS elem
  WHERE (elem->>'status') = 'published';

  RETURN v_res;
END;
$$;

REVOKE ALL ON FUNCTION public.get_published_learning_quizzes() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_published_learning_quizzes() TO anon, authenticated;

-- 3.3 Mode-A Quiz Attempt Evaluator (published quizzes only; validates inputs & returns key after submit)
CREATE OR REPLACE FUNCTION public.evaluate_learning_quiz_attempt(
  p_quiz_id TEXT,
  p_user_answers JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_raw JSONB;
  v_quiz JSONB;
  v_q JSONB;
  v_q_id TEXT;
  v_options_len INTEGER;
  v_points INTEGER;
  v_user_json JSONB;
  v_user_arr INTEGER[];
  v_correct_arr INTEGER[];
  v_is_correct BOOLEAN;
  v_score INTEGER := 0;
  v_max_score INTEGER := 0;
  v_percentage INTEGER := 0;
  v_pass_percent INTEGER := 75;
  v_results JSONB := '[]'::jsonb;
BEGIN
  IF p_quiz_id IS NULL OR trim(p_quiz_id) = '' THEN
    RAISE EXCEPTION 'A kvíz azonosítója kötelező.';
  END IF;

  IF p_user_answers IS NULL OR jsonb_typeof(p_user_answers) <> 'object' THEN
    RAISE EXCEPTION 'Érvénytelen válaszformátum.';
  END IF;

  SELECT value INTO v_raw
  FROM public.app_configs
  WHERE key = '__SYSTEM_CONFIG_LEARNING_QUIZZES__';

  IF v_raw IS NULL OR jsonb_typeof(v_raw) <> 'array' THEN
    RAISE EXCEPTION 'A kvíz nem található vagy nem publikált.';
  END IF;

  SELECT elem INTO v_quiz
  FROM jsonb_array_elements(v_raw) AS elem
  WHERE ((elem->>'id') = p_quiz_id OR (elem->>'slug') = p_quiz_id)
    AND (elem->>'status') = 'published'
  LIMIT 1;

  IF v_quiz IS NULL THEN
    RAISE EXCEPTION 'A kvíz nem található vagy nem publikált.';
  END IF;

  IF jsonb_typeof(v_quiz->'questions') = 'array' THEN
    FOR v_q IN SELECT * FROM jsonb_array_elements(v_quiz->'questions')
    LOOP
      v_q_id := v_q->>'id';
      v_options_len := CASE
        WHEN jsonb_typeof(v_q->'options') = 'array' THEN jsonb_array_length(v_q->'options')
        ELSE 0
      END;
      v_points := CASE
        WHEN (v_q->>'points') ~ '^\d+$' THEN (v_q->>'points')::INTEGER
        ELSE 10
      END;
      IF v_points < 0 THEN
        v_points := 0;
      END IF;

      v_user_json := p_user_answers -> v_q_id;
      IF v_user_json IS NOT NULL AND jsonb_typeof(v_user_json) = 'array' THEN
        SELECT COALESCE(array_agg(DISTINCT (ans::text)::INTEGER ORDER BY (ans::text)::INTEGER), ARRAY[]::INTEGER[])
        INTO v_user_arr
        FROM jsonb_array_elements(v_user_json) AS ans
        WHERE jsonb_typeof(ans) = 'number'
          AND ans::text ~ '^\d+$'
          AND (ans::text)::INTEGER >= 0
          AND (ans::text)::INTEGER < v_options_len;
      ELSE
        v_user_arr := ARRAY[]::INTEGER[];
      END IF;

      IF jsonb_typeof(v_q->'correct_options') = 'array' THEN
        SELECT COALESCE(array_agg(DISTINCT (ans::text)::INTEGER ORDER BY (ans::text)::INTEGER), ARRAY[]::INTEGER[])
        INTO v_correct_arr
        FROM jsonb_array_elements(v_q->'correct_options') AS ans
        WHERE jsonb_typeof(ans) = 'number'
          AND ans::text ~ '^\d+$'
          AND (ans::text)::INTEGER >= 0
          AND (ans::text)::INTEGER < v_options_len;
      ELSE
        v_correct_arr := ARRAY[]::INTEGER[];
      END IF;

      v_is_correct := (cardinality(v_correct_arr) > 0 AND v_user_arr = v_correct_arr);
      v_max_score := v_max_score + v_points;
      IF v_is_correct THEN
        v_score := v_score + v_points;
      END IF;

      v_results := v_results || jsonb_build_array(
        jsonb_build_object(
          'question_id', v_q_id,
          'is_correct', v_is_correct,
          'correct_options', COALESCE(to_jsonb(v_correct_arr), '[]'::jsonb),
          'explanation', v_q->'explanation',
          'points_earned', CASE WHEN v_is_correct THEN v_points ELSE 0 END
        )
      );
    END LOOP;
  END IF;

  IF v_max_score > 0 THEN
    v_percentage := round((v_score::NUMERIC / v_max_score::NUMERIC) * 100)::INTEGER;
  ELSE
    v_percentage := 0;
  END IF;

  v_pass_percent := CASE
    WHEN (v_quiz->>'passing_score_percent') ~ '^\d+$' THEN (v_quiz->>'passing_score_percent')::INTEGER
    ELSE 75
  END;

  RETURN jsonb_build_object(
    'quiz_id', v_quiz->>'id',
    'score', v_score,
    'max_score', v_max_score,
    'percentage', v_percentage,
    'passed', v_percentage >= v_pass_percent,
    'passing_score_percent', v_pass_percent,
    'results', v_results
  );
END;
$$;

REVOKE ALL ON FUNCTION public.evaluate_learning_quiz_attempt(TEXT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.evaluate_learning_quiz_attempt(TEXT, JSONB) TO anon, authenticated;

-- 3.4 Partner-scoped learning items read RPC (strictly auth.uid() + public.partner_users)
CREATE OR REPLACE FUNCTION public.get_my_learning_items(p_config_key TEXT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid UUID;
  v_raw JSONB;
  v_res JSONB;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Hitelesítés szükséges.';
  END IF;

  IF p_config_key NOT IN ('__SYSTEM_CONFIG_LEARNING_COURSES__', '__SYSTEM_CONFIG_LEARNING_QUIZZES__') THEN
    RAISE EXCEPTION 'Érvénytelen konfigurációs kulcs: %', p_config_key;
  END IF;

  SELECT value INTO v_raw
  FROM public.app_configs
  WHERE key = p_config_key;

  IF v_raw IS NULL OR jsonb_typeof(v_raw) <> 'array' THEN
    RETURN '[]'::jsonb;
  END IF;

  SELECT COALESCE(jsonb_agg(elem), '[]'::jsonb)
  INTO v_res
  FROM jsonb_array_elements(v_raw) AS elem
  WHERE NULLIF(trim(coalesce(elem->>'partner_id', '')), '') IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.partner_users pu
      WHERE pu.user_id = v_uid
        AND pu.partner_id::text = NULLIF(trim(coalesce(elem->>'partner_id', '')), '')
    );

  RETURN v_res;
END;
$$;

REVOKE ALL ON FUNCTION public.get_my_learning_items(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_learning_items(TEXT) TO authenticated;

COMMIT;
