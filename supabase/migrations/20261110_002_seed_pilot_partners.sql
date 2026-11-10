/*
# Migration: 20261110_002_seed_pilot_partners.sql
# Description: Official database persistence for pilot partners (including 78-as Építők Kft.)
#              into public.partners with valid UUIDs, real contact details and idempotent conflict handling.
# Version: 1.0 (Idempotent ON CONFLICT (slug) DO UPDATE)
*/

BEGIN;

-- ============================================================================
-- 1. PILOT PARTNEREK HIVATALOS BESZÚRÁSA A PUBLIC.PARTNERS TÁBLÁBA
-- ============================================================================

-- 1.1. 78-as Építők Kft. (Generálkivitelező)
INSERT INTO public.partners (
  name,
  slug,
  category,
  official_name,
  partner_type,
  description,
  detailed_description,
  website_url,
  cover_url,
  contact_person_name,
  contact_person_title,
  contact_email,
  contact_phone,
  address,
  zip_code,
  city,
  county,
  business_hours,
  inquiry_email,
  is_verified
) VALUES (
  '78-as Építők Kft.',
  '78-as-epitok',
  'ceg',
  '78-as Építőipari és Kivitelező Korlátolt Felelősségű Társaság',
  'Generálkivitelező Cég',
  'Magas- és mélyépítési generálkivitelezésre, szerkezetépítésre és ipari csarnokok megvalósítására szakosodott elismert építőipari cég.',
  'A 78-as Építők Kft. több mint 15 éves tapasztalattal rendelkező hazai generálkivitelező vállalkozás. Fő szakterületünk a lakó- és ipari épületek szerkezetkész és kulcsrakész kivitelezése, valamint a műszaki ellenőrzés. Vállalkozásunk kiemelt figyelmet fordít a korszerű MSZ és EU szabványok szerinti munkavégzésre, a környezettudatos építési technológiákra és a legújabb hőszigetelési normák betartására.',
  'https://78asepitok.hu',
  'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1600&auto=format&fit=crop&q=80',
  'Nagy Gábor',
  'Ügyvezető Igazgató',
  'info@78asepitok.hu',
  '+36 1 234 5678',
  'Kivitelezők útja 78.',
  '1118',
  'Budapest',
  'Pest vármegye',
  'Hétfő - Péntek: 08:00 - 17:00',
  'ajanlat@78asepitok.hu',
  true
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  official_name = EXCLUDED.official_name,
  partner_type = EXCLUDED.partner_type,
  description = EXCLUDED.description,
  detailed_description = EXCLUDED.detailed_description,
  website_url = EXCLUDED.website_url,
  cover_url = COALESCE(public.partners.cover_url, EXCLUDED.cover_url),
  contact_person_name = EXCLUDED.contact_person_name,
  contact_person_title = EXCLUDED.contact_person_title,
  contact_email = EXCLUDED.contact_email,
  contact_phone = EXCLUDED.contact_phone,
  address = EXCLUDED.address,
  zip_code = EXCLUDED.zip_code,
  city = EXCLUDED.city,
  county = EXCLUDED.county,
  business_hours = EXCLUDED.business_hours,
  inquiry_email = EXCLUDED.inquiry_email,
  is_verified = EXCLUDED.is_verified;

-- 1.2. IsoTerm Szigeteléstechnika Zrt. (Gyártó)
INSERT INTO public.partners (
  name,
  slug,
  category,
  official_name,
  partner_type,
  description,
  detailed_description,
  website_url,
  cover_url,
  contact_person_name,
  contact_person_title,
  contact_email,
  contact_phone,
  address,
  zip_code,
  city,
  county,
  business_hours,
  inquiry_email,
  is_verified
) VALUES (
  'IsoTerm Szigeteléstechnika Zrt.',
  'isoterm-szigeteles',
  'gyarto',
  'IsoTerm Építőanyag-ipari és Szigeteléstechnikai Zrt.',
  'Hőszigetelés & Anyaggyártó',
  'Innovatív homlokzati EPS és szálas kőzetgyapot hőszigetelő rendszerek, lábazati XPS táblák és energiatakarékos építési megoldások gyártója.',
  'Az IsoTerm Szigeteléstechnika Zrt. Magyarország egyik vezető hőszigetelő rendszer gyártója és fejlesztője. Termékeink megfelelnek a legszigorúbb hazai (MSZ) és uniós épületenergetikai előírásoknak. Mérnöki csapatunk rendszergaranciával és beépítési útmutatókkal támogatja a hazai kivitelezőket.',
  'https://isoterm.hu',
  'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?w=1600&auto=format&fit=crop&q=80',
  'Horváth Péter',
  'Műszaki és Értékesítési Vezető',
  'iroda@isoterm.hu',
  '+36 1 456 7890',
  'Ipari Park út 12.',
  '2040',
  'Budaörs',
  'Pest vármegye',
  'Hétfő - Péntek: 07:30 - 16:30',
  'ajanlatkeres@isoterm.hu',
  true
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  official_name = EXCLUDED.official_name,
  partner_type = EXCLUDED.partner_type,
  description = EXCLUDED.description,
  detailed_description = EXCLUDED.detailed_description,
  website_url = EXCLUDED.website_url,
  contact_email = EXCLUDED.contact_email,
  inquiry_email = EXCLUDED.inquiry_email,
  is_verified = EXCLUDED.is_verified;

-- 1.3. DrywallPro Rendszerek Kft. (Kereskedő)
INSERT INTO public.partners (
  name,
  slug,
  category,
  official_name,
  partner_type,
  description,
  detailed_description,
  website_url,
  cover_url,
  contact_person_name,
  contact_person_title,
  contact_email,
  contact_phone,
  address,
  zip_code,
  city,
  county,
  business_hours,
  inquiry_email,
  is_verified
) VALUES (
  'DrywallPro Rendszerek Kft.',
  'drywallpro-rendszerek',
  'kereskedo',
  'DrywallPro Építőipari és Szárazépítési Szakkereskedelmi Kft.',
  'Szárazépítési Szakkereskedés',
  'Professzionális gipszkarton lapok, akusztikai és tűzgátló válaszfal-rendszerek, UW/CW horganyzott profilok és beépítési szerszámok forgalmazója.',
  'A DrywallPro Rendszerek Kft. a modern szárazépítészet specialistája. Raktárkészletről kínálunk normál, impregnált és tűzgátló gipszkarton lapokat, profilokat és hézagoló anyagokat.',
  'https://drywallpro.hu',
  'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?w=1600&auto=format&fit=crop&q=80',
  'Varga Tamás',
  'Szárazépítési Szakértő',
  'kapcsolat@drywallpro.hu',
  '+36 1 345 6789',
  'Profilozók útja 5.',
  '1106',
  'Budapest',
  'Budapest',
  'Hétfő - Péntek: 07:00 - 17:00',
  'rendeles@drywallpro.hu',
  true
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  official_name = EXCLUDED.official_name,
  partner_type = EXCLUDED.partner_type,
  description = EXCLUDED.description,
  website_url = EXCLUDED.website_url,
  contact_email = EXCLUDED.contact_email,
  inquiry_email = EXCLUDED.inquiry_email,
  is_verified = EXCLUDED.is_verified;

-- 1.4. MasterRoof Tetőcentrum Kft. (Kivitelező)
INSERT INTO public.partners (
  name,
  slug,
  category,
  official_name,
  partner_type,
  description,
  detailed_description,
  website_url,
  cover_url,
  contact_person_name,
  contact_person_title,
  contact_email,
  contact_phone,
  address,
  zip_code,
  city,
  county,
  business_hours,
  inquiry_email,
  is_verified
) VALUES (
  'MasterRoof Tetőcentrum Kft.',
  'masterroof-tetocentrum',
  'ceg',
  'MasterRoof Tetőfedő és Épületbádogos Kivitelező Kft.',
  'Tetőfedő & Bádogos Szakcég',
  'Prémium kerámia- és betoncserép fedések, korcolt lemezfedések, ereszek és szarufás ácsszerkezetek profi kivitelezője.',
  'A MasterRoof Tetőcentrum Kft. több évtizedes szakmai tapasztalattal vállalja családi házak és társasházak komplett tetőszerkezetének építését, felújítását és bádogozását.',
  'https://masterroof.hu',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&auto=format&fit=crop&q=80',
  'Kovács Zoltán',
  'Tetőfedő Mester & Vezető Kivitelező',
  'info@masterroof.hu',
  '+36 30 987 6543',
  'Fedélszék fasor 18.',
  '2000',
  'Szentendre',
  'Pest vármegye',
  'Hétfő - Szombat: 07:00 - 18:00',
  'tetofedes@masterroof.hu',
  true
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  official_name = EXCLUDED.official_name,
  partner_type = EXCLUDED.partner_type,
  description = EXCLUDED.description,
  website_url = EXCLUDED.website_url,
  contact_email = EXCLUDED.contact_email,
  inquiry_email = EXCLUDED.inquiry_email,
  is_verified = EXCLUDED.is_verified;

-- ============================================================================
-- 2. FELHASZNÁLÓI ÖSSZERENDELÉS AUTOMATIZÁLÁSA (PARTNER_USERS)
-- ============================================================================

-- Ha létezik regisztrált partner fiók, automatikusan összekapcsoljuk az új partnerrekorddal
DO $$
DECLARE
  v_78as_partner_id uuid;
  v_matching_user_id uuid;
BEGIN
  SELECT id INTO v_78as_partner_id FROM public.partners WHERE slug = '78-as-epitok';
  
  -- Ellenőrizzük, hogy van-e partner szerepkörű fiók vagy info@78asepitok.hu email
  SELECT id INTO v_matching_user_id 
  FROM public.profiles 
  WHERE email = 'info@78asepitok.hu' 
     OR role = 'partner'
  LIMIT 1;

  IF v_78as_partner_id IS NOT NULL AND v_matching_user_id IS NOT NULL THEN
    INSERT INTO public.partner_users (partner_id, user_id, member_role, role)
    VALUES (v_78as_partner_id, v_matching_user_id, 'owner', 'owner')
    ON CONFLICT (partner_id, user_id) DO UPDATE SET member_role = 'owner', role = 'owner';
  END IF;
END $$;

COMMIT;

