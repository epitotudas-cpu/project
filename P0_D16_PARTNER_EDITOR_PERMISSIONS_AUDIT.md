# P0-D16 – PARTNER SZERKESZTŐFELÜLET JOGOSULTSÁGI ÉS FUNKCIONÁLIS AUDIT

**Projekt:** ÉpítőTudás  
**Modul:** Partnerkezelés / Partner Szerkesztése (`PartnerEditorModal`)  
**Dátum:** 2026-11-11  
**Munkamód:** Szigorú READ-ONLY audit (nem történt forráskód-módosítás, nincs SQL/migráció, nincs Git-művelet)  

---

## 1. Vezetői összefoglaló

A vizsgálat feltárta, hogy a jelenlegi rendszerben a **Partner Szerkesztése** ablak (`src/components/PartnerEditorModal.tsx`) egyetlen közös felületként szolgál mind az adminisztrátorok (`AdminPartnersPage.tsx`), mind a bejelentkezett partnerek (`App.tsx`) számára. 

**Kritikus audit megállapítások:**
1. **Nincs felületi szerepkör-szétválasztás [BIZONYÍTOTT]:** A `PartnerEditorModal` semmilyen jogosultsági propot (pl. `isAdmin`) nem kap. Egy bejelentkezett partner a Partner Paneljén pontosan ugyanazokat a mezőket és kapcsolókat látja és szerkesztheti, mint a platform főadminisztrátora.
2. **Kritikus platformbeállítások partneri módosíthatósága [BIZONYÍTOTT]:** A partner saját maga módosíthatja az alábbi mezőket:
   - `category` (Partner kategória átállítása, pl. kivitelezőből gyártóvá vagy iskolává)
   - `partner_type` (Szabad szöveges altípus, amely korábban a 78-as Építőknél a téves besorolást okozta)
   - `status` (Publikálás és elrejtés: `published`, `draft`, `inactive`)
   - `is_verified` (Minősített Partner jelvény önkényes bekapcsolása)
   - `is_featured` (Főoldali kiemelt partneri státusz önkényes bekapcsolása)
   - `slug` (Az egyedi webcím átírása és újragenerálása)
3. **Adatbázis és RLS aszimmetria [BIZONYÍTOTT]:** 
   - A Supabase `partners` tábla RLS szabálya (`Partner contacts update partners`) sor-szintű ellenőrzést végez (`public.is_partner_contact(id)`). Mivel nincs oszlopszintű tiltás vagy BEFORE UPDATE trigger, az adatbázis RLS motorja **minden olyan oszlop módosítását engedélyezi a partnernek, amit a frontend beküld** (pl. `is_verified = true`, `category = 'iskola'`).
   - A mezők egy része (`status`, `is_featured`, `services`, `references`, `certificates`, `related_content`, `seo_*`) nem létezik relációs oszlopként a `public.partners` táblában, hanem kizárólag a böngésző `localStorage` gyorsítótárában tárolódik (`storedPartners`).
4. **Biztonságos kétfájlos SAFE PATCH megvalósíthatósága [BIZONYÍTOTT]:** A felületi szétválasztás és a mentési payload-szűrés pontosan **2 meglévő forrásfájlban** (`PartnerEditorModal.tsx` és `AdminPartnersPage.tsx`) maradéktalanul, router- és séma-változtatás nélkül megvalósítható.

---

## 2. A jelenlegi szerkesztőfelület teljes mezőlistája és adatbázis-leképezése

A `PartnerEditorModal.tsx` 9 fület (TabKey) tartalmaz. Az alábbi táblázat tételesen bemutatja az összes mezőt, azok tárolási helyét és jelenlegi hozzáférését:

| Fül / Mező neve | Komponens state | Mentési kulcs (`updatePayload`) | Adatbázis mező (`public.partners`) | Partner szerkesztheti most? | Admin szerkesztheti most? | Tervezett jogosultság |
| :--- | :--- | :--- | :--- | :---: | :---: | :--- |
| **TAB 1: ALAPADATOK** | | | | | | |
| Szervezet neve | `name` | `name` | `name` (TEXT NOT NULL) | **IGEN** | **IGEN** | Partner & Admin |
| Hivatalos cégnév | `officialName` | `official_name` | `official_name` (TEXT) | **IGEN** | **IGEN** | Partner & Admin |
| Egyedi URL azonosító (slug) | `slug` | `slug` | `slug` (TEXT UNIQUE NOT NULL) | **IGEN** ⚠️ | **IGEN** | **Kizárólag Admin** |
| Partner Kategória | `category` | `category` | `category` (TEXT NOT NULL) | **IGEN** ⚠️ | **IGEN** | **Kizárólag Admin** |
| Partner Típusa | `partnerType` | `partner_type` | `partner_type` (TEXT) | **IGEN** ⚠️ | **IGEN** | **Megszüntetendő / Redundáns** |
| Státusz | `status` | `status` (nem DB) | *Nincs DB oszlop (localStorage)* | **IGEN** ⚠️ | **IGEN** | **Kizárólag Admin** |
| Rövid bemutatkozás | `description` | `description` | `description` (TEXT) | **IGEN** | **IGEN** | Partner & Admin |
| Részletes bemutatkozás | `detailedDescription` | `detailed_description`| `detailed_description` (TEXT) | **IGEN** | **IGEN** | Partner & Admin |
| Minősített Partner | `isVerified` | `is_verified` | `is_verified` (BOOLEAN DEFAULT true) | **IGEN** ⚠️ | **IGEN** | **Kizárólag Admin** |
| Kiemelt Partner | `isFeatured` | `is_featured` (nem DB) | *Nincs DB oszlop (localStorage)* | **IGEN** ⚠️ | **IGEN** | **Kizárólag Admin** |
| **TAB 2: MEGJELENÉS ÉS MÉDIA** | | | | | | |
| Partner Logó (fájl / URL) | `logoUrl` | `logo_url` | `logo_url` (TEXT) | **IGEN** | **IGEN** | Partner & Admin |
| Logó háttérszín | `logoBg` | `logo_bg` (nem DB) | *Nincs DB oszlop (localStorage)* | **IGEN** | **IGEN** | Partner & Admin |
| Borítókép (URL) | `coverUrl` | `cover_url` | `cover_url` (TEXT) | **IGEN** | **IGEN** | Partner & Admin |
| **TAB 3: ELÉRHETŐSÉGEK** | | | | | | |
| Kapcsolattartó neve | `contactPersonName` | `contact_person_name` | `contact_person_name` (TEXT) | **IGEN** | **IGEN** | Partner & Admin |
| Kapcsolattartó beosztása | `contactPersonTitle`| `contact_person_title`| `contact_person_title` (TEXT) | **IGEN** | **IGEN** | Partner & Admin |
| Nyilvános E-mail | `contactEmail` | `contact_email` | `contact_email` (TEXT) | **IGEN** | **IGEN** | Partner & Admin |
| Nyilvános Telefonszám | `contactPhone` | `contact_phone` | `contact_phone` (TEXT) | **IGEN** | **IGEN** | Partner & Admin |
| Hivatalos Weboldal | `websiteUrl` | `website_url` | `website_url` (TEXT) | **IGEN** | **IGEN** | Partner & Admin |
| Ajánlatkérő E-mail | `inquiryEmail` | `inquiry_email` | `inquiry_email` (TEXT) | **IGEN** | **IGEN** | Partner & Admin |
| Székhely / Telephely Cím | `address` | `address` | `address` (TEXT) | **IGEN** | **IGEN** | Partner & Admin |
| Irányítószám | `zipCode` | `zip_code` | `zip_code` (TEXT) | **IGEN** | **IGEN** | Partner & Admin |
| Település | `city` | `city` | `city` (TEXT) | **IGEN** | **IGEN** | Partner & Admin |
| Vármegye / Régió | `county` | `county` | `county` (TEXT) | **IGEN** | **IGEN** | Partner & Admin |
| Működési Terület | `operatingArea` | `operating_area` (nem DB)| *Nincs DB oszlop (localStorage)* | **IGEN** | **IGEN** | Partner & Admin |
| Nyitvatartás | `businessHours` | `business_hours` | `business_hours` (TEXT) | **IGEN** | **IGEN** | Partner & Admin |
| **TAB 4: KÖZÖSSÉGI FELÜLETEK** | | | | | | |
| Facebook URL | `socialFacebook` | `social_facebook` (nem DB)| *Nincs DB oszlop (localStorage)* | **IGEN** | **IGEN** | Partner & Admin |
| LinkedIn URL | `socialLinkedin` | `social_linkedin` (nem DB)| *Nincs DB oszlop (localStorage)* | **IGEN** | **IGEN** | Partner & Admin |
| Instagram URL | `socialInstagram` | `social_instagram` (nem DB)| *Nincs DB oszlop (localStorage)* | **IGEN** | **IGEN** | Partner & Admin |
| YouTube URL | `socialYoutube` | `social_youtube` (nem DB)| *Nincs DB oszlop (localStorage)* | **IGEN** | **IGEN** | Partner & Admin |
| **TAB 5: SZOLGÁLTATÁSOK** | `services` | `services` (nem DB) | *Nincs DB oszlop (localStorage)* | **IGEN** | **IGEN** | Partner & Admin |
| **TAB 6: REFERENCIÁK** | `references` | `references` (nem DB) | *Nincs DB oszlop (localStorage)* | **IGEN** | **IGEN** | Partner & Admin |
| **TAB 7: TANÚSÍTVÁNYOK** | `certificates` | `certificates` (nem DB)| *Nincs DB oszlop (localStorage)* | **IGEN** | **IGEN** | Partner & Admin |
| **TAB 8: KAPCSOLÓDÓ TARTALMAK**| `relatedContent`| `related_content` (nem DB)| *Nincs DB oszlop (localStorage)* | **IGEN** | **IGEN** | Partner & Admin |
| **TAB 9: SEO ÉS PUBLIKÁLÁS** | | | | | | |
| SEO Cím (Title tag) | `seoTitle` | `seo_title` (nem DB) | *Nincs DB oszlop (localStorage)* | **IGEN** | **IGEN** | Partner & Admin |
| SEO Meta Leírás | `seoDescription` | `seo_description` (nem DB)| *Nincs DB oszlop (localStorage)* | **IGEN** | **IGEN** | Partner & Admin |
| Keresőmotorok indexelhetik | `isIndexable` | `is_indexable` (nem DB)| *Nincs DB oszlop (localStorage)* | **IGEN** | **IGEN** | Partner & Admin |

---

## 3. A mentési folyamat és jogosultsági védelem elemzése

### 3.1. Mentési útvonal (`handleSubmit` és `updatePartner`) [BIZONYÍTOTT]
1. A felhasználó (akár partner, akár admin) a modális ablakban a **Mentés** gombra kattint.
2. A `PartnerEditorModal.tsx` 282–325. sora összeállítja a `payload` objektumot, amelybe az összes fenti mezőt beleteszi.
3. Meghívódik az `onSave(payload)` függvény:
   - Partner esetén (`src/App.tsx:662–675`): `await updatePartner(effectivePartner.id, { ...effectivePartner, ...data })`.
   - Admin esetén (`src/pages/AdminPartnersPage.tsx:1223`): `await handleSaveRichPartner(data)` → `await updatePartner(...)` vagy `createPartner(...)`.
4. A `src/services/partnerService.ts:549–585` `updatePartner` függvénye kiszűri az adatbázis-oszlopokat és elküldi a Supabase felé:
   ```typescript
   const { data: updateRes, error: updateErr } = await supabase
     .from('partners')
     .update(updatePayload)
     .eq('id', id)
     .select('*');
   ```

### 3.2. Létezik-e RLS szintű oszlopvédelem? [BIZONYÍTOTT]
- **NINCS.** A Supabase RLS policy (`supabase/migrations/20261110_001_fix_partner_and_users_rls.sql:78`):
  ```sql
  CREATE POLICY "Partner contacts update partners"
  ON public.partners FOR UPDATE TO authenticated
  USING (public.is_partner_contact(id) OR public.is_editor_role())
  WITH CHECK (public.is_partner_contact(id) OR public.is_editor_role());
  ```
- Az RLS kizárólag azt ellenőrzi, hogy a bejelentkezett felhasználó hozzá van-e rendelve az adott partnerhez a `partner_users` táblában. Ha igen, **bármely oszlopot frissítheti** (pl. `is_verified`, `category`, `slug`).
- **Következtetés:** A szerkesztőfelület jelenleg semmilyen technikai korlátot nem támaszt az ellen, hogy egy kivitelező partner adminisztrátorrá minősítse magát, kategóriát váltson, vagy bepipálja a "Minősített Partner" jelvényt.

---

## 4. Külön vizsgálandó problémák

### 4.1. Partner kategória és Partner típusa közötti redundancia [BIZONYÍTOTT]
- **A két mező szerepe:**
  - `category`: A platform hivatalos besorolása (`gyarto`, `kereskedo`, `ceg`, `iskola`, `oktato`, `tamogato`). Ez határozza meg a szűrőket, a jogosultságokat és a navigációt (`isSchoolCategory`).
  - `partner_type`: Eredetileg egy szabad szöveges mező, amely a `20260920_001` migrációban kapott egy hibás `DEFAULT 'Oktatási Intézmény'` kényszert.
- **A hiba forrása a 78-as Építők Kft.-nél:**
  A 78-as Építők Kft. rekordjának létrehozásakor a `category` helyesen `'ceg'` lett. Azonban az adatbázis alapértelmezett értéke miatt a `partner_type` automatikusan `'Oktatási Intézmény'` lett. Mivel a felület és a korábbi logika a `partner_type`-ot tekintette felülbíráló értéknek, a partner tévesen iskolai adminisztrátori felületet kapott.
- **Megállapítás:** A `partner_type` szabad szöveges beviteli mező teljesen redundáns a `category` mezővel szemben, félrevezető és adatintegritási kockázatot hordoz.
- **Megoldás:** A `category` mezőnek kell lennie az egyetlen hiteles besorolási forrásnak (single source of truth). A szerkesztőfelületről a `partner_type` input mezőt el kell távolítani.

### 4.2. Státusz és publikálás (`status`) [BIZONYÍTOTT]
- Jelenleg a partner a `basic` tabon maga választhatja ki a státuszt (`published`, `draft`, `inactive`).
- Egy partnernek nem szabad lehetőséget adni arra, hogy a platform ellenőrzése nélkül saját magát élesítse (`published`), vagy inaktiválja a partnerségi szerződést (`inactive`).
- A státusz kezelése kizárólag platformadminisztrátori jogkör.

### 4.3. Minősített (`is_verified`) és Kiemelt (`is_featured`) Partner [BIZONYÍTOTT]
- `is_verified`: Az adatbázisban tárolt boolean érték. A nyilvános kártyákon és adatlapon a zöld `[Minősített Partner]` pajzsot jeleníti meg. Jelenleg a partner egyetlen kattintással bepipálhatja magának.
- `is_featured`: A főoldali kiemelt listázást vezérli.
- **Megállapítás:** Mindkét státusz üzleti és bizalmi értékkel bír (platform általi felülvizsgálat vagy prémium partnerség). Partner általi önkényes bekapcsolásuk üzleti és hitelességi kockázat. Kizárólag adminisztrátor kezelheti őket.

### 4.4. Egyedi URL azonosító (`slug`) [BIZONYÍTOTT]
- A `slug` az oldal URL-címét határozza meg (`/partnerek/[slug]`).
- Ha a partner átírja a slugot, a korábbi hivatkozások, megosztott linkek és keresőmotoros indexek azonnal 404-es hibára futnak.
- A slug módosítását kizárólag adminisztrátor végezheti indokolt esetben.

---

## 5. Javasolt jogosultsági modell és felületi struktúra

A feladat követelményeinek megfelelően a felületet két logikai profilra kell osztani egyetlen közös komponensen belül a `isAdmin` prop segítségével:

### A. Partner Saját Profiljának Szerkesztése (`isAdmin = false`)
A partner kizárólag a saját cégadatait és szakmai referenciáit kezelheti.
- **Elrejtendő / Zárolt mezők a partner elől:**
  - `category` (Csak olvasható címkeként jelenik meg: pl. *Kategória: Kivitelező Cég*)
  - `partner_type` (Nem jelenik meg)
  - `slug` (Csak olvasható információs mező, átírási lehetőség nélkül)
  - `status` (Nem jelenik meg)
  - `is_verified` (Nem jelenik meg)
  - `is_featured` (Nem jelenik meg)
- **Szerkeszthető mezők (Megmarad):**
  - Szervezet neve, hivatalos cégnév, bemutatkozások (rövid és részletes)
  - Logó és borítókép kezelése (feltöltés, háttér)
  - Kapcsolattartási és címadatok, nyitvatartás, ajánlatkérő e-mail
  - Közösségi média linkek
  - Szolgáltatások, referenciák, tanúsítványok, kapcsolódó anyagok
  - Saját profil SEO adatai (meta leírás)

### B. Adminisztrátori Partnerkezelés (`isAdmin = true`)
Az ÉpítőTudás adminisztrátora a teljes adatlapon felül kezeli a platformszintű döntéseket:
- Partner jóváhagyása és kategóriába sorolása (`category` select)
- Publikálási státusz felügyelete (`status` select: Published / Draft / Inactive)
- Minősített partner jelvény megadása (`is_verified` checkbox)
- Főoldali kiemelés (`is_featured` checkbox)
- Slug karbantartása vagy javítása

---

## 6. A kétfájlos SAFE PATCH megvalósíthatósági elemzése

A feladat 7. pontja előírja: a későbbi javításnak **legfeljebb 1–2 forrásfájlban** kell megvalósulnia, router-, séma- és RLS-módosítás nélkül.

### Pontosan melyik 2 fájl módosítása szükséges és elegendő?
1. **Fájl 1: `src/components/PartnerEditorModal.tsx`**
   - Hozzáadunk egy opcionális `isAdmin?: boolean` propot (alapértelmezés: `false`).
   - A `basic` fülön a platformszintű mezőket (`status`, `is_verified`, `is_featured`, slug generáló gomb) feltételhez kötjük: `{isAdmin && ( ... )}`.
   - A `category` mezőt partner módban (`!isAdmin`) nem szerkeszthető `<select>`-ként, hanem letisztult információs szövegként jelenítjük meg (`getCategoryLabel(category)`).
   - A redundáns `partner_type` beviteli mezőt eltávolítjuk.
   - **Mentési védelem a komponensen belül:** A `handleSubmit` függvényben, ha `!isAdmin`, a mentési `payload`-ból kifejezetten kihagyjuk vagy felülbírálhatatlanná tesszük a védett kulcsokat:
     ```typescript
     if (!isAdmin && partner) {
       payload.category = partner.category;
       payload.slug = partner.slug;
       payload.is_verified = partner.is_verified;
       // partner_type mezőt nem küldünk
     }
     ```
     Ez garantálja, hogy még manipulált frontend esetén sem küldhet be a partner védett adatokat.
2. **Fájl 2: `src/pages/AdminPartnersPage.tsx`**
   - A `PartnerEditorModal` hívásakor explicit átadjuk az adminisztrátori propot:
     ```tsx
     <PartnerEditorModal
       partner={editingPartner}
       isOpen={showEditorModal}
       onClose={() => setShowEditorModal(false)}
       onSave={handleSaveRichPartner}
       isAdmin={true}
     />
     ```
   - (A partner felületén az `src/App.tsx`-ben az `isAdmin` prop elhagyható, mivel az alapértelmezett érték `false`, így ott nem is kötelező a fájl módosítása, de ellenőrizhető).

### Megvalósíthatósági értékelés:
- **Megállapítás [BIZONYÍTOTT]:** A feladat maradéktalanul, biztonságosan és tisztán megvalósítható a fenti **2 forrásfájlban** (NO REFACTOR, SAFE PATCH).
- A navigáció és a router érintetlen marad.
- Az adatbázis sémája és adatai nem változnak.

---

## 7. Jogosultsági és funkcionális tesztterv (A későbbi jóváhagyás utáni ellenőrzéshez)

| # | Teszteset leírása | Elvárt viselkedés partneri nézetben (`isAdmin=false`) | Elvárt viselkedés adminisztrátori nézetben (`isAdmin=true`) |
|---|---|---|---|
| 1. | **Kategória mező láthatósága** | Csak olvasható címke („Kivitelező Cég”), nem módosítható legördülő. | Teljesen szerkeszthető `<select>` mező (Gyártó, Kereskedő, Cég, Iskola stb.). |
| 2. | **Partner Típusa mező** | Nem jelenik meg szabad szöveges mező. | Nem jelenik meg / vagy csak admin által látható. |
| 3. | **Minősített Partner jelvény** | A checkbox rejtve van, a partner nem tudja bekapcsolni magának. | Checkbox elérhető, admin döntés alapján be/kikapcsolható. |
| 4. | **Kiemelt Partner jelölő** | A checkbox rejtve van, nem aktiválható önkényesen. | Checkbox elérhető, adminisztrátor kezelheti. |
| 5. | **Publikálási státusz** | Nem jelenik meg a státuszválasztó, partner nem tud piszkozatot élesíteni. | Státuszválasztó megjelenik (`published`, `draft`, `inactive`). |
| 6. | **Egyedi URL (slug)** | A mező zárolt / csak olvasható, az „Újragenerálás” gomb rejtve van. | A slug szerkeszthető, újragenerálás gomb aktív. |
| 7. | **Cégadatok és referenciák** | Név, cím, telefon, logó, leírás, referenciák szabadon menthetők. | Szintén teljes körűen szerkeszthető. |
| 8. | **Mentési adatvédelem** | A hálózati kérésben az `is_verified` és `category` értéke nem változik. | Minden mező a módosított formában mentődik. |

---

## 8. Megállapítások besorolási táblázata

| Megállapítás | Besorolás | Indoklás |
| :--- | :--- | :--- |
| A `PartnerEditorModal` jelenleg közös az admin és a partner számára | **BIZONYÍTOTT** | `App.tsx:658` és `AdminPartnersPage.tsx:1219` kódvizsgálata alapján. |
| A partner jelenleg felületen módosíthatja az `is_verified`, `is_featured`, `category`, `status` mezőket | **BIZONYÍTOTT** | `PartnerEditorModal.tsx:486–578` kódvizsgálata alapján. |
| A Supabase RLS nem tartalmaz oszlopszintű tiltást a partneri UPDATE-re | **BIZONYÍTOTT** | `20261110_001_fix_partner_and_users_rls.sql:78` RLS definíciója alapján. |
| A `status`, `is_featured`, `services` mezők nincsenek a `public.partners` DB oszlopai között | **BIZONYÍTOTT** | Migrációs sémák és `partnerService.ts:549–571` kódvizsgálata alapján. |
| A `partner_type` szabad szöveges mező redundáns a `category` kategóriával | **BIZONYÍTOTT** | 78-as Építők Kft. esete és `PartnerEditorModal.tsx` űrlapvizsgálat alapján. |
| A jogosultsági szétválasztás megvalósítható legfeljebb 2 forrásfájlban | **BIZONYÍTOTT** | `PartnerEditorModal.tsx` és `AdminPartnersPage.tsx` interface-vizsgálata alapján. |

---
*A P0-D16 audit vizsgálata lezárult. Semmilyen forráskód-módosítás, adatbázis-módosítás vagy Git-művelet nem történt.*

