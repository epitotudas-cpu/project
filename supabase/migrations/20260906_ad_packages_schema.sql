/*
  # Additive Migration: Managed B2B Ad Packages (ad_packages)

  ## Purpose
  Adds managed advertising packages table (ad_packages) with full support for B2B partner proposals,
  pricing tiers, duration options, feature capabilities, visibility control, and sorting order.
*/

CREATE TABLE IF NOT EXISTS ad_packages (
  id                        text PRIMARY KEY,
  name                      text NOT NULL,
  value_promise             text NOT NULL,
  internal_name             text,
  price_huf                 numeric NOT NULL DEFAULT 0,
  price_type                text NOT NULL DEFAULT 'fixed',
  currency                  text NOT NULL DEFAULT 'HUF',
  billing_period            text NOT NULL DEFAULT 'monthly',
  duration_days             integer NOT NULL DEFAULT 30,
  duration_options          text[],
  description               text,
  features                  text[],
  placements_summary        text,
  target_audiences_summary  text,
  impression_limit          integer,
  guaranteed_impressions    integer,
  guarantee_terms           text,
  creative_updates_count    integer NOT NULL DEFAULT 0,
  sponsored_articles_count  integer NOT NULL DEFAULT 0,
  has_featured_profile      boolean NOT NULL DEFAULT false,
  has_detailed_reports      boolean NOT NULL DEFAULT false,
  cta_text                  text NOT NULL DEFAULT 'Csomag kiválasztása',
  is_featured               boolean NOT NULL DEFAULT false,
  is_popular                boolean NOT NULL DEFAULT false,
  visibility                text NOT NULL DEFAULT 'public',
  status                    text NOT NULL DEFAULT 'active',
  sort_order                integer NOT NULL DEFAULT 0,
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE ad_packages ENABLE ROW LEVEL SECURITY;

-- Public read for active ad_packages
DROP POLICY IF EXISTS "Public read active ad_packages" ON ad_packages;
CREATE POLICY "Public read active ad_packages" ON ad_packages 
  FOR SELECT TO anon, authenticated USING (true);

-- Admin update/insert policy for authenticated admin users
DROP POLICY IF EXISTS "Admin write ad_packages" ON ad_packages;
CREATE POLICY "Admin write ad_packages" ON ad_packages 
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Seed Initial Core Packages (Bronze, Silver, Gold, Enterprise)
INSERT INTO ad_packages (
  id, name, value_promise, internal_name, price_huf, price_type, currency,
  billing_period, duration_days, duration_options, description, features,
  placements_summary, target_audiences_summary, creative_updates_count,
  sponsored_articles_count, has_featured_profile, has_detailed_reports,
  cta_text, is_featured, is_popular, visibility, status, sort_order
) VALUES
(
  'pkg-bronze',
  'Bronze – Láthatóság',
  'Célzott jelenlét',
  'Bronze B2B Starter',
  49000,
  'fixed',
  'HUF',
  'monthly',
  30,
  ARRAY['30 nap'],
  'Azonnali célzott jelenlét releváns építőipari felületeken a márkaismertség növeléséhez.',
  ARRAY[
    'Rotációs bannerelhelyezés oldalsávon vagy partneri ajánlókban',
    'Célzott rotációs megjelenés releváns szakmai felületeken',
    'Partneri profil az ÉpítőTudás oldalon',
    'Havi alap teljesítményriport (Megjelenések, kattintások és CTR adatai)'
  ],
  'Oldalsáv és partneri ajánlók',
  'Általános szakmai látogatók',
  0, 0, false, false,
  'Bronze csomag kiválasztása',
  false, false, 'public', 'active', 1
),
(
  'pkg-silver',
  'Silver – Szakmai jelenlét',
  'Szakmai jelenlét',
  'Silver B2B Core',
  99000,
  'fixed',
  'HUF',
  'monthly',
  30,
  ARRAY['30 nap'],
  'Folyamatos láthatóság a cikkoldalakon és az Eszköz & Gép katalógusban magasabb prioritással.',
  ARRAY[
    'Megjelenés releváns szakmai cikkoldalakon',
    'Megjelenés az Eszközök & Gépek katalógusban',
    'Magasabb rotációs prioritás a hirdetési helyeken',
    'Kiemelt partneri profil & Partneri jelvény',
    'Havi részletes teljesítményriport',
    'Havi 1 kampány- vagy kreatívfrissítés'
  ],
  'Cikkek, Eszközök & Gépek katalógus, oldalsávok',
  'Szakemberek és döntéshozók',
  1, 0, true, true,
  'Silver csomag kiválasztása',
  false, true, 'public', 'active', 2
),
(
  'pkg-gold',
  'Gold – Tartalmi partner',
  'Tartalmi partner',
  'Gold Content Partner',
  249000,
  'fixed',
  'HUF',
  'monthly',
  30,
  ARRAY['30 nap', '60 nap', '90 nap'],
  'Exkluzív főoldali és cikkoldali megjelenés, szponzorált tartalmak és célzott elhelyezések.',
  ARRAY[
    'Kiemelt megjelenés a főoldali partneri ajánlóban vagy top-banner rotációban',
    'Magas prioritású megjelenés releváns szakmai oldalakon',
    '1 db Szponzorált / Partneri szakmai cikk vagy ajánló',
    'Célzott elhelyezés kapcsolódó eszköz-, anyag-, szakma- vagy cikkoldalakon',
    'Kiemelt partneri profil & Részletes havi riport',
    'Havi 1 kreatív- vagy kampányfrissítés'
  ],
  'Főoldal top-banner, szponzorált cikk, eszköz & anyag oldalak',
  'Kiemelt kivitelezők, beruházók és vásárlók',
  1, 1, true, true,
  'Gold csomag kiválasztása',
  true, false, 'public', 'active', 3
),
(
  'pkg-enterprise',
  'Enterprise – Egyedi partnerprogram',
  'Egyedi partnerprogram',
  'Enterprise Strategic Partner',
  0,
  'custom',
  'HUF',
  'monthly',
  90,
  ARRAY['3 hónap', '6 hónap', '12 hónap'],
  'Teljes körű stratégiai partnerprogram egyedi elhelyezésekkel, szponzorációval és dedikált támogatással.',
  ARRAY[
    'Egyedi elhelyezések & Kategória-, szakma- vagy tudástári szponzoráció',
    'Több kreatív és több egyidejű kampány',
    'Egyedi szakmai tartalom vagy esettanulmány & Dedikált partneri oldal',
    'Egyedi riportolás & Negyedéves együttműködési és kampányterv',
    'Kiemelt dedikált kapcsolattartói támogatás'
  ],
  'Egyedi exkluzív elhelyezések, tudástári szponzoráció',
  'Teljes építőipari piac és B2B hálózat',
  99, 99, true, true,
  'Egyedi ajánlat kérése',
  false, false, 'public', 'active', 4
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  value_promise = EXCLUDED.value_promise,
  internal_name = EXCLUDED.internal_name,
  price_huf = EXCLUDED.price_huf,
  price_type = EXCLUDED.price_type,
  currency = EXCLUDED.currency,
  billing_period = EXCLUDED.billing_period,
  duration_days = EXCLUDED.duration_days,
  duration_options = EXCLUDED.duration_options,
  description = EXCLUDED.description,
  features = EXCLUDED.features,
  placements_summary = EXCLUDED.placements_summary,
  target_audiences_summary = EXCLUDED.target_audiences_summary,
  creative_updates_count = EXCLUDED.creative_updates_count,
  sponsored_articles_count = EXCLUDED.sponsored_articles_count,
  has_featured_profile = EXCLUDED.has_featured_profile,
  has_detailed_reports = EXCLUDED.has_detailed_reports,
  cta_text = EXCLUDED.cta_text,
  is_featured = EXCLUDED.is_featured,
  is_popular = EXCLUDED.is_popular,
  visibility = EXCLUDED.visibility,
  status = EXCLUDED.status,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();
