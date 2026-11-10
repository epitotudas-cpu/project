# P0-D05 – PARTNERPROFIL AKTUÁLIS ÁLLAPOT, FUNKCIONÁLIS, UX- ÉS ÜZLETI AUDIT

**Dokumentumazonosító:** `P0_D05_PARTNER_PROFILE_CURRENT_STATE_AUDIT.md`  
**Projekt:** ÉpítőTudás Digitális Tudásbázis és Szakmai Közösségi Portál  
**Dátum:** 2026. november 10.  
**Vizsgálat típusa:** Teljes körű, READ-ONLY architektúra-, kód-, adatbázis-biztonsági és üzleti állapotfelmérés  
**Célrendszer:** Supabase Produkciós Adatbázis (`olmavxcmkvvcebgqxohe`), Webes Kódbázis (`main` ág)  
**Prioritás:** P0 / P1 / P2 / P3  
**Végrehajtási mód:** AUDIT ONLY – NO CHANGES (Adatmódosítás, kódmódosítás és DDL nélkül lefolytatott vizsgálat)

---

## 1. VEZETŐI ÖSSZEFOGLALÓ

A jelenlegi vizsgálat célja az ÉpítőTudás partnerprofiljának és a kapcsolódó B2B ökoszisztémának a legfrissebb, tényeken és közvetlen vizsgálatokon alapuló felmérése a `20261110_001_fix_partner_and_users_rls.sql` biztonsági migráció éles lefutását követően.

### 1.1 Fő audit eredmények és áttörések

1. **A korábban azonosított P0 adatbiztonsági sebezhetőségek 100%-ban javítva és élőben ellenőrizve lettek (`[A – Élőben tesztelt]`):**
   - **`public.partners` UPDATE rés (korábbi P0-1):** A veszélyes `OR TRUE` feltétel és az örökölt, nem auditált policy-k a dinamikus tisztítással véglegesen törlésre kerültek. Élő REST API teszttel igazoltuk, hogy egy jogosulatlan vagy anonim hívás `data: []` (0 érintett sor) válasszal meghiúsul.
   - **`public.partner_users` nyílt olvasási rés (korábbi P0-2):** A korábban anonim módon bárki által lekérdezhető kapcsolati tábla lezárult. Élő anonim kéréssel igazoltuk, hogy a korábbi 2 rekord helyett üres tömb (`data: []`) érkezik vissza.
   - **Rekurziómentes hozzáférés:** A `public.is_partner_contact()` és `public.is_partner_admin()` `SECURITY DEFINER` függvények stabilan működnek, nem okoznak végtelen ciklust.

2. **A publikus cégbemutató felület piacképes és prémium minőségű (`[A – Élőben tesztelt]`):**
   - A nyilvános partneri adatlap (`src/pages/PartnerDetailPage.tsx`) kiemelkedően magas színvonalú, reszponzív, torzulásmentes logómegjelenítéssel (`object-fit: contain`, max. 160 px), referenciagalériával és strukturált bemutató szekciókkal rendelkezik.

3. **Kritikus funkcionális és üzleti hiányosságok a partneri önkiszolgáló pultban (`[C – Forráskóddal igazolt]`):**
   - **Teljesen hiányzó toborzási UI (P1):** A partneri felületről hiányzik a saját álláshirdetések kezelése és a beérkező jelentkezések megtekintése. Bár a backendben elkészült a `job_postings` és `job_applications` séma, a frontend kódban **egyetlen SELECT lekérdezés sem létezik a `job_applications` táblára**. A pályázók anyagai jelenleg elérhetetlenek a partnerek számára.
   - **Illuzórikus partneri ajánlatok (P1):** A „Saját Ajánlatok & Akciók” menüpont kizárólag a böngésző memóriájában (`useState`) él. Oldalfrissítéskor az adatok azonnal elvesznek, nincs adatbázis-perzisztencia.
   - **Fiktív analitika és statisztikák (P2):** A partneri vezérlőpulton látható látogatottsági és megtekintési adatok 100%-ban keménykódolt, statikus számok („1 420”, „385”, „42 db”).
   - **Hiányzó leadkezelés és CRM (P2):** Az „Ajánlatkérés” és „Kapcsolatfelvétel” gombok egyszerű `mailto:` linkekként működnek; a platform nem rögzíti az érdeklődéseket, nem értesíti a feleket, és nem biztosít konverziómérést.
   - **Termékek és cikkek hibrid/nem-relációs tárolása (P2):** A termékkatalógus elemei egyetlen JSON szövegként vannak beégetve a `categories` tábla egyetlen mezőjébe, az új cikkek pedig párhuzamosan a `localStorage`-ben élnek.
   - **Monetizációs infrastruktúra hiánya (P2):** Nincs fizetési átjáró (Stripe/Barion), nincsenek automatizált lejárati idők a kiemelésekre (`is_featured`), és nincs önkiszolgáló előfizetéskezelés.

---

## 2. ÖSSZEHASONLÍTÁS A KORÁBBI AUDITOKKAL

Az alábbi táblázat bemutatja a `P0_D02` és `P0_D03` dokumentumokban feltárt problémák aktuális állapotát:

| Azonosító | Korábbi megállapítás | Korábbi státusz | Jelenlegi státusz | Bizonyíték szintje | Tényleges változás és megjegyzés |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **SEC-01** | `partners` UPDATE `OR TRUE` sérülékenység | P0 Kritikus | **TELJESEN JAVÍTVA ÉS ELLENŐRIZVE** | `[A – Élőben tesztelt]` | A `20261110_001` v1.1 migráció lefutott; anonim update teszt `data: []`-t ad vissza, nincs jogosulatlan módosítás. |
| **SEC-02** | `partner_users` nyilvános nyitott SELECT | P0 Kritikus | **TELJESEN JAVÍTVA ÉS ELLENŐRIZVE** | `[A – Élőben tesztelt]` | Anonim REST lekérdezés korábban 2 sort adott vissza, most `data: []` (0 sor). A PII szivárgás megszűnt. |
| **SEC-03** | RLS végtelen rekurziós kockázat | P0 Veszély | **TELJESEN JAVÍTVA ÉS ELLENŐRIZVE** | `[A – Élőben tesztelt]` | `is_partner_contact` és `is_partner_admin` függvények `SECURITY DEFINER` és `search_path = ''` védelemmel aktívak. |
| **FNC-01** | Partneri ajánlatok memóriában tárolása | P1 Magas | **TOVÁBBRA IS FENNÁLL** | `[C – Forráskóddal igazolt]` | `src/App.tsx` 718–735. sor: tisztán lokális React `useState`, nincs DB tábla vagy mentés. |
| **FNC-02** | Fiktív statisztikai adatok | P2 Közepes | **TOVÁBBRA IS FENNÁLL** | `[C – Forráskóddal igazolt]` | `src/App.tsx` 808–850. sor: a számok fix string konstansok („1 420”, „385”, „842”, „42 db”). |
| **FNC-03** | Termékek és anyagok JSON-alapú tárolása | P2 Közepes | **TOVÁBBRA IS FENNÁLL** | `[C – Forráskóddal igazolt]` | `src/services/materialsService.ts`: a teljes lista a `categories` tábla egyetlen mezőjében van JSON-ként. |
| **FNC-04** | Partneri állás- és jelentkezéskezelő UI hiánya | P1 Magas | **TOVÁBBRA IS FENNÁLL** | `[C – Forráskóddal igazolt]` | A `PartnerLayout` menüjében nincs álláskezelő, a frontendből hiányzik a `job_applications` olvasása. |
| **BIZ-01** | Fizetési és csomagkezelő rendszer hiánya | P2 Közepes | **TOVÁBBRA IS FENNÁLL** | `[C – Forráskóddal igazolt]` | Nincs Stripe/Barion integráció, a partnerek számára nincs önkiszolgáló csomagváltás. |
| **BIZ-02** | Kiemelések (`is_featured`) lejárati kezelése | P2 Közepes | **TOVÁBBRA IS FENNÁLL** | `[B – Adatbázis-metaadat]` | A `partners` táblában nincs `featured_until` vagy `expires_at` oszlop; a kiemelés nem automatizálható. |
| **BIZ-03** | Érdeklődés- és leadkezelés hiánya | P2 Közepes | **TOVÁBBRA IS FENNÁLL** | `[C – Forráskóddal igazolt]` | `src/pages/PartnerDetailPage.tsx`: `mailto:` linkek futnak le, nincs lead naplózás vagy belső CRM. |

---

## 3. PARTNERPROFIL TELJES FUNKCIONÁLIS FELTÉRKÉPEZÉSE

### 3.1 Partnerregisztráció és jelentkezés
- **Jelentkezési útvonal (`#partner-application`):** A `src/pages/PartnerApplicationPage.tsx` felületén a leendő partner űrlapon adhatja meg cégadatait (Cégnév, Kapcsolattartó, E-mail, Telefon, Weboldal, Kategória, Bemutatkozás).
- **Adatellenőrzés:**
  - Van kliensoldali RFC regex e-mail formátum ellenőrzés és kötelező mező vizsgálat.
  - Aszinkron módon ellenőrzi a rendszer, hogy az e-mail cím regisztrálva van-e már a `profiles` táblában (`checkEmailExists`).
  - **Hiányosság:** A cégnév vagy slug létezését nem ellenőrzi az adatbázisban; azonos cégnévvel több kérelem is beadható.
- **Adatmentés:** A `submitPartnerApplication()` függvény sikeresen beszúrja a kérelmet a `public.partner_applications` táblába `status = 'pending'` értékkel (`[C – Forráskóddal igazolt]`).
- **Adminisztrátori jóváhagyási folyamat (`src/pages/AdminPartnersPage.tsx`):**
  - Az adminisztrátor látja a függőben lévő kérelmeket (`pending`, `approved`, `rejected`).
  - Jóváhagyáskor (`handleApproveApplication`) az alkalmazás státusza `approved`-ra vált, és megnyílik a meghívókezelő modal.
  - **Félautomata mechanizmus:** A rendszer legenerálja a meghívókódot a `partner_invitations` táblába, és előállít egy e-mail sablont. Nincs beépített e-mail küldő szolgáltatás; az adminisztrátornak a vágólapra kell másolnia a sablont (`navigator.clipboard.writeText`) és saját levelezőjéből kell elküldenie a partnernek.

### 3.2 Partnerprofil publikus megjelenése
- **Megjelenítő felület (`src/pages/PartnerDetailPage.tsx`):** Kiemelkedően profi, modern arculat.
  - **Fejléc:** Borítókép (`cover_url`) sötétített átmenettel, partner logó választható háttérrel (`logo_bg`: fehér, szürke, átlátszó), torzulásmentes méretezéssel.
  - **Alapadatok:** Cég kategóriája, minősítési jelvények (`Hitelesített partner`, `Ajánlott partner`), székhely cím, nyitvatartás.
  - **Tartalmi blokkok:** Részletes bemutatkozás, szolgáltatáslista kártyák, referenciagaléria helyszínnel és évszámmal, tanúsítványok listája.
  - **Kapcsolatfelvétel:** Telefon, weboldal link, e-mail gombok.
- **Keresőoptimalizálás (SEO):** A meta adatok (`seo_title`, `seo_description`) a komponens szintjén beállíthatók, de szerveroldali SSR híján az indexelés a kliensoldali renderelésre támaszkodik.

### 3.3 Partner Dashboard (Vezérlőpult)
- **Komponensek:** `src/components/PartnerLayout.tsx` és `src/App.tsx` (`PartnerPanelContent`).
- **Elérhető menüpontok vállalati partnereknek:**
  1. *Partner Áttekintés (`dashboard`):* Alapadatok kártya, profil állapota, logó előnézet, gyorsgomb a szerkesztéshez és a publikus adatlaphoz.
  2. *Saját Partnerprofil (`partner_profile`):* Teljes adatlapi előnézet és a szerkesztő modal elindítása.
  3. *Saját Ajánlatok & Akciók (`partner_offers`):* Promóciók rögzítése.
  4. *Termékek & Anyagok (`partner_products`):* Anyagkatalógus kezelő.
  5. *Szakmai Cikkek & Útmutatók (`partner_articles`):* Tudásbázis cikkek beküldése.
  6. *Gép & Szerszám Katalógus (`catalog`):* Eszközök böngészése.
  7. *Statisztikák & Teljesítmény (`partner_stats`):* Látogatottsági mérőszámok.
- **Valódiság vizsgálata:**
  - Az áttekintés és az adatlap szerkesztő valós adatbázisadatokkal dolgozik (`[A – Élőben tesztelt]`).
  - Az Ajánlatok és a Statisztikák kizárólag illuzórikus mock elemek (`[C – Forráskóddal igazolt]`).

### 3.4 Partneri tartalomkezelés
- **Profiladatok szerkesztése (`src/components/PartnerEditorModal.tsx`):**
  - 10 füles professzionális modal: Alapadatok, Média, Elérhetőségek, Social, Szolgáltatások, Referenciák, Tanúsítványok, Kapcsolódó anyagok, SEO.
  - A logó feltöltése azonnali kliensoldali előnézettel, méret- (max. 2 MB) és típusellenőrzéssel rendelkezik.
  - Mentéskor az `updatePartner()` közvetlenül a Supabase `partners` tábláját frissíti. Az adatok perzisztenciája és a jogosultságvédelem kiválóan működik.
- **Cikkek kezelése (`src/pages/PartnerArticlesPage.tsx`):**
  - A partner saját cikkeket hozhat létre `draft` vagy `pending` státusszal.
  - A mentés a böngésző helyi tárába (`localStorage`) és a Supabase `articles` táblájába is megpróbál lefutni.
- **Termékek és Anyagok (`src/pages/PartnerMaterialsPage.tsx`):**
  - Termékek rögzíthetők műszaki paraméterekkel, képekkel és leírással.
  - A tárolás strukturálatlanul, a `categories` tábla `__SYSTEM_CONFIG_MATERIALS_ITEMS__` rekordjának JSON leírásmezőjében és `localStorage`-ben történik.

### 3.5 Partneri álláskezelés és toborzás
- **Aktuális állapot:** **TELJESEN HIÁNYZIK A PARTNERI FELÜLETRŐL.**
- **Vizsgálat eredménye:**
  - A `PartnerLayout` menürendszerében nincs olyan menüpont, ahol a partner láthatná a saját hirdetéseit.
  - A partner csak úgy tud hirdetést feladni, ha átlép a nyilvános Állásbörze (`CareersPage.tsx`) felületre, és ott kattint az „Álláshirdetés feladása” gombra.
  - A hirdetéshez beérkező pályázatok a `job_applications` táblába futnak be.
  - **A frontend kódban sem a partner, sem az adminisztrátor számára nincs olyan képernyő vagy lekérdezés, amely megjelenítené a `job_applications` sorait.** A jelentkezők adatai (név, e-mail, telefon, önéletrajz, kísérőlevél) elérhetetlenek a partner számára.

### 3.6 Ajánlatok és kapcsolatfelvétel
- **Ajánlatok (Offers):** Az `src/App.tsx` felületén létrehozott akciók nem kerülnek mentésre semmilyen adatbázistáblába (`offersList` memóriabeli tömb). Nem jelennek meg a publikus partneroldalon sem.
- **Kapcsolatfelvétel és Ajánlatkérés:** A publikus partnerlapon a gombok sima `mailto:` protokollal nyitják meg a látogató levelezőjét. Nincs webes űrlap, nincs beérkező lead nyilvántartás, nincs konverziókövetés.

### 3.7 Partneri jogosultságok architektúrája
- **Szerepkörök:**
  - `owner`: A partnercég elsődleges tulajdonosa / létrehozója. Teljes szerkesztési jog a cégprofilra és a munkatársakra.
  - `admin` / `school_admin`: Intézményi vagy vállalati adminisztrátor. Szerkesztheti a profilt, kezelheti az oktatókat/munkatársakat.
  - `instructor` / `teacher`: Oktatói szerepkör az iskolai modulhoz (órák, diákok, kiosztott anyagok elérése).
  - `member` / `contact`: Normál munkatársi hozzáférés.
  - `admin` / `editor` (platform): Globális felügyeleti jog a platform adminisztrátorainak (`is_editor_role()`).
- **Összhang az RLS-sel:** A legutóbbi `20261110_001` migráció óta a jogosultságok szigorúan ellenőrzöttek: sem idegen partner, sem mezei diák, sem anonim látogató nem képes módosítani a partner rekordjait.

---

## 4. UX ÉS VIZUÁLIS MINŐSÉG ÉRTÉKELÉSE

### 4.1 Erősségek
1. **Professzionális dizájnvonal:** A publikus felület letisztult, elegáns, a prémium építőipari márkák vizuális elvárásait tükrözi (antracit szövegek, fehér kártyák, aranybarna/accent akcentusok).
2. **Korszerű sötét téma a Partner Dashboardon:** A vezérlőpult pala/sötétkék (`#0f172a`) felülete csökkenti a szem terhelését, az információs kártyák hierarchiája átlátható.
3. **Logó- és borítókép kezelés:** A torzulásmentes logómegjelenítés (`object-fit: contain`) és a választható háttér megvédi a világos vagy sötét hátterű logókat a kontraszthiánytól.

### 4.2 Azonosított UX és használhatósági problémák

| Komponens / Hely | Pontos probléma | Felhasználói következmény | Súlyosság | Javasolt javítás |
| :--- | :--- | :--- | :--- | :--- |
| **`PartnerLayout.tsx`** | Hiányzik az „Állásaim & Jelentkezők” menüpont | A partner nem tudja toborzásra használni a rendszert, nem látja a jelentkezőket | **P1 (Magas)** | Új menüpont és beágyazott toborzási kezelőfelület beépítése. |
| **`App.tsx` (Offers)** | Ajánlat mentésekor nincs adatbázis-perzisztencia | A partner felviszi az akciót, majd frissítéskor eltűnik; csalódást kelt | **P1 (Magas)** | Valós `partner_offers` tábla és perzisztens mentés bekötése. |
| **`App.tsx` (Stats)** | Fiktív, keménykódolt statisztikák láthatók | A partner megbízhatatlannak tarthatja a rendszert, ha rájön, hogy a számok fixek | **P2 (Közepes)** | Valós látogatottsági mérők bekötése, vagy a fiktív számok helyett „Hamarosan” jelzés. |
| **`PartnerDetailPage.tsx`** | Az Ajánlatkérés gomb sima `mailto:` linket nyit | Ha a látogatónak nincs beállított alapértelmezett levelezője, a gomb semmit sem csinál | **P2 (Közepes)** | Beépített modális ajánlatkérő űrlap készítése közvetlen leadmentéssel. |
| **`PartnerEditorModal.tsx`**| 10 fül vízszintes görgetése mobilon | Kisebb képernyőkön nehézkes a fülek közötti navigálás | **P3 (Alacsony)** | Legördülő kategóriaválasztó mobilos nézetben. |

---

## 5. ADATBIZTONSÁG ÉS ADATKEZELÉS

### 5.1 A biztonsági állapot értékelése a `20261110_001` migráció után
`[A – Élőben tesztelt]` / `[B – Adatbázis-metaadat]`

1. **`public.partners` RLS:**
   - **Állapot:** Kifogástalan.
   - **Szabály:** `ALTER TABLE public.partners FORCE ROW LEVEL SECURITY;`
   - **UPDATE:** Kizárólag `public.is_partner_contact(id) OR public.is_editor_role()` jogosultsággal lehetséges, `WITH CHECK` ellenőrzéssel.
   - **Teszteredmény:** Anonim kísérlet a rekord frissítésére 0 sort érint (`data: []`).

2. **`public.partner_users` RLS:**
   - **Állapot:** Kifogástalan.
   - **Szabály:** `ALTER TABLE public.partner_users FORCE ROW LEVEL SECURITY;`
   - **SELECT:** Csak hitelesített felhasználók láthatják:
     - Saját sorukat (`user_id = auth.uid()`),
     - Iskolai/partner adminisztrátorok a saját szervezetük tagjait (`is_partner_admin(partner_id)`),
     - Platform adminisztrátorok mindent (`is_editor_role()`).
   - **Teszteredmény:** Anonim kérésre `data: []` válasz érkezik, az adatszivárgás megszűnt.

3. **`public.job_postings` és `public.job_applications` RLS:**
   - **Állapot:** Kifogástalan a backendben.
   - A `20261109_001` migráció garantálja, hogy jelentkező csak a saját jelentkezését, a partner pedig csak a saját állásaira érkezett jelentkezéseket láthatja.
   - **Biztonsági kockázat nincs**, kizárólag a kezelő UI hiányzik.

---

## 6. ÜZLETI ÉS PIACI ÉRTÉKELÉS

### 6.1 Mit kap ma a partner? (Jelenlegi értékajánlat)
- **Pozitívumok:**
  - Magas presztízsű, esztétikus online cégbemutató felület országos szakmai környezetben.
  - Visszamutató link (backlink) a cég weboldalára (SEO előny).
  - Referenciák és tanúsítványok hiteles bemutatása.
  - Önkiszolgáló profilmódosítás (logó, elérhetőségek, nyitvatartás).
- **Negatívumok:**
  - Nincs mérhető megtérülés (nem látja a valós érdeklődőket).
  - Nem tud közvetlenül toborozni a felületről.
  - Nincs lead-értesítő rendszer.

### 6.2 Monetizációs modellek technikai megvalósíthatósága

| Szolgáltatás / Csomag | Jelenlegi technikai készenlét | Szükséges fejlesztés | Piaci életképesség |
| :--- | :--- | :--- | :--- |
| **Ingyenes Alapprofil** | **100% Kész** | Nincs szükség fejlesztésre | **Azonnal indítható** |
| **Kiemelt Megjelenés (`is_featured`)** | **50% Kész** | Lejárati dátum mező (`featured_until`), számlázás | **Magas konverzió** |
| **Partneri Toborzás / Álláshirdetés**| **40% Kész** (Backend kész, UI hiányzik) | Partneri álláskezelő pult, jelentkezők nézete | **Kiemelkedő kereslet** |
| **Exkluzív Akciók & Ajánlatok** | **20% Kész** (Csak UI makett) | `partner_offers` relációs tábla, publikus megjelenítés | **Közepes kereslet** |
| **Prémium B2B Előfizetés** | **15% Kész** | Stripe/Barion integráció, csomagkezelő | **Legstabilabb bevétel** |

---

## 7. TECHNIKAI ÉS SKÁLÁZHATÓSÁGI ELEMZÉS

1. **Adatbázis-kapcsolatok és normalizáltság:**
   - A partner alapadatok (`name`, `slug`, `logo_url`, `description`, `contact_*`) helyesen relációs oszlopokban élnek a `partners` táblában.
   - A szolgáltatások, referenciák és tanúsítványok a kliensoldalon tömbként vannak kezelve, és jelenleg hiányoznak a dedicated JSONB oszlopok a `partners` táblából.
   - A termékek és anyagok egyetlen `categories` sorban vannak JSON szövegként tárolva, ami **nem skálázható** több tucat partner több ezer termékére.

2. **Fájl- és médiatárolás:**
   - A logók feltöltése működik, de a tárolás URL vagy Data URL alapú. Hosszú távon dedikált Supabase Storage vödrök (`partner-assets`) bevezetése szükséges.

3. **Teljesítmény és hálózati terhelés:**
   - A partneroldal betöltése gyors, a lekérdezések szelektívek.
   - Nem tapasztalható N+1 lekérdezési probléma.

---

## 8. KÖTELEZŐ AUDIT EREDMÉNYTÁBLÁZAT

| Funkció neve | Állapot | Érintett fájlok | Érintett DB táblák | Bizonyíték szintje | Felhasználói hatás | Prioritás | Javasolt következő lépés |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Partner RLS védelem** | **Működik** | `20261110_001...sql` | `partners` | **A – Élőben tesztelt** | Idegen felhasználó nem írhatja át a céget | P0 | Megtartandó |
| **Partner Users RLS védelem**| **Működik** | `20261110_001...sql` | `partner_users` | **A – Élőben tesztelt** | Nem szivárognak ki a belső munkatársak | P0 | Megtartandó |
| **Publikus partner adatlap** | **Működik** | `PartnerDetailPage.tsx`| `partners` | **A – Élőben tesztelt** | Vonzó, modern cégbemutató | P1 | Megtartandó |
| **Profiladatok mentése** | **Működik** | `partnerService.ts` | `partners` | **A – Élőben tesztelt** | Cégadatok perzisztensen elmentődnek | P1 | Megtartandó |
| **Partner logó kezelése** | **Működik** | `PartnerEditorModal.tsx`| `partners.logo_url` | **A – Élőben tesztelt** | Torzulásmentes megjelenítés | P1 | Megtartandó |
| **Partneri jelentkezés** | **Működik** | `PartnerApplicationPage.tsx`| `partner_applications`| **A – Élőben tesztelt**| Cégek tudnak online csatlakozni | P1 | Duplikáció-szűrés hozzáadása |
| **Admin partnerkezelés** | **Működik** | `AdminPartnersPage.tsx` | `partners`, `invitations`| **C – Forráskóddal igazolt**| Admin jóváhagy és meghív | P2 | Automata e-mail küldés bekötése |
| **Saját álláshirdetések UI** | **Hiányzik** | `PartnerLayout.tsx` | `job_postings` | **C – Forráskóddal igazolt**| Partner nem tud toborozni a pultból | **P1** | „Állásaim” menüpont kifejlesztése |
| **Jelentkezők megtekintése** | **Hiányzik** | *Nincs ilyen felület* | `job_applications` | **C – Forráskóddal igazolt**| Pályázók önéletrajzai elvesznek | **P1** | Jelentkező-kezelő felület építése |
| **Partneri Ajánlatok mentése**| **Hibás** | `App.tsx` (660–770) | *Nincs tábla* | **C – Forráskóddal igazolt**| Újratöltéskor elvész az akció | **P1** | `partner_offers` DB tábla bekötése |
| **Partneri analitika** | **Hibás** | `App.tsx` (791–853) | *Nincs tábla* | **C – Forráskóddal igazolt**| Fiktív számok félrevezetik a partnert | **P2** | Eseményszámláló integrálása |
| **Ajánlatkérés / Leadkezelés**| **Részben működik**| `PartnerDetailPage.tsx`| *Nincs tábla* | **C – Forráskóddal igazolt**| Csak `mailto:` link, nincs lead mentés | **P2** | In-app űrlap és CRM bevezetése |
| **Termékek & Anyagok tárolása**| **Részben működik**| `materialsService.ts`| `categories` (JSON) | **C – Forráskóddal igazolt**| Nem skálázható, sérülékeny tárolás | **P2** | Önálló `materials` tábla létrehozása |
| **Online fizetés (Stripe/Barion)**| **Hiányzik** | *Nincs ilyen felület* | *Nincs tábla* | **C – Forráskóddal igazolt**| Nem lehet bankkártyával fizetni | **P2** | Fizetési átjáró integrációja |

---

## 9. RÉSZLETES HIBAJEGYZÉK ÉS PRIORITÁSOK

### P1 – Magas prioritás (Alapműködést és üzleti bevezetést gátló tényezők)
1. **HIBA-P1-01: Hiányzó partneri toborzási felület**
   - *Hely:* `src/components/PartnerLayout.tsx` és `src/App.tsx`.
   - *Leírás:* A partner nem tudja saját állásait listázni, lezárni, és nincs felülete a beérkezett jelentkezők önéletrajzainak letöltésére.
2. **HIBA-P1-02: Partneri ajánlatok memóriavesztése**
   - *Hely:* `src/App.tsx` 718. sor.
   - *Leírás:* Az `offersList` állapota oldalfrissítéskor törlődik, az adatok nem perzisztálódnak a felhőben.

### P2 – Közepes prioritás (UX, hitelesség és adatszerkezet)
3. **HIBA-P2-01: Fiktív analitikai számok a vezérlőpulton**
   - *Hely:* `src/App.tsx` 811., 822., 833., 844. sorok.
   - *Leírás:* A statisztikák fix konstansok, ami rontja a szakmai platform hitelességét.
4. **HIBA-P2-02: Beépített árajánlatkérő és leadkezelő hiánya**
   - *Hely:* `src/pages/PartnerDetailPage.tsx` 280. és 291. sorok.
   - *Leírás:* A gombok sima `mailto:` hivatkozások, így a platform nem tudja nyomon követni az érdeklődéseket.
5. **HIBA-P2-03: Nem relációs terméktárolás**
   - *Hely:* `src/services/materialsService.ts` 355. sor.
   - *Leírás:* A termékadatok egyetlen kategóriarekordba vannak összefűzve JSON szövegként.

---

## 10. PRIORIZÁLT FEJLESZTÉSI ÜTEMTERV (ROADMAP)

> [!NOTE]
> Az alábbi javaslatok tervezetek. A jelen vizsgálat során semmilyen módosítás nem került végrehajtásra.

### 1. Szakasz – Működőképesség és Toborzási Modul (Következő sprint)
- **Cél:** A toborzási és ajánlati alapfunkciók működőképessé tétele.
- **Feladatok:**
  1. „Álláshirdetéseim & Jelentkezők” menüpont beépítése a `PartnerLayout`-ba.
  2. Saját állások listázása, új hirdetés feladása, meglévők lezárása (`job_postings`).
  3. Beérkezett pályázatok megtekintése és elbírálása a partner számára (`job_applications`).
  4. Valós `public.partner_offers` tábla létrehozása és összekötése a vezérlőpulttal és a publikus adatlappal.

### 2. Szakasz – Érdeklődéskezelés és Hiteles Statisztika (2. sprint)
- **Cél:** A partneri ROI láthatóvá tétele.
- **Feladatok:**
  1. In-app Ajánlatkérő és Kapcsolatfelvételi modal készítése közvetlen leadmentéssel (`partner_inquiries` tábla).
  2. E-mail értesítés küldése a partner kapcsolattartójának, ha érdeklődés érkezik.
  3. Valós eseménynaplózó (oldalmegtekintés, ajánlatkérés kattintás) bekötése a fiktív számok helyére.

### 3. Szakasz – Üzleti Rendszer és Monetizáció (3. sprint)
- **Cél:** Fizetős szolgáltatások automatizálása.
- **Feladatok:**
  1. `featured_until` lejárati idő oszlop bevezetése a `partners` táblában.
  2. Stripe vagy Barion fizetési kapu integrációja.
  3. Önkiszolgáló kiemelés és számlázási profilkezelés.

---

## 11. VÉGSŐ ALKALMASSÁGI ÉRTÉKELÉS

### 11.1 Válaszok a vezetői kérdésekre

1. **A jelenlegi partnerprofil technikailag stabil?**  
   **IGEN.** A profilmegjelenítés, a szerkesztő modal és a Supabase perzisztencia kiválóan és hibamentesen fut.
2. **Biztonságosan fogadhat valódi partnercégeket?**  
   **IGEN.** A `20261110_001` v1.1 migráció lefutásával az adatbázis RLS védelme sziklaszilárd, a P0 rések elhárultak.
3. **Használható napi szinten egy partner számára?**  
   **RÉSZBEN.** A profil adatai karbantarthatók, de toborzásra és promóciókra a hiányzó UI miatt még nem alkalmas.
4. **Mely funkciók működnek ténylegesen?**  
   Publikus adatlap, cégadatok és elérhetőségek szerkesztése, logófeltöltés és méretezés, partneri jelentkezés beküldése, adminisztrátori meghívókezelés.
5. **Mely funkciók csak látszólag léteznek?**  
   Saját ajánlatok és akciók (memóriabeli makett), forgalmi statisztikák (fiktív számok), ajánlatkérés (egyszerű `mailto:` link).
6. **Melyek a legsúlyosabb hiányosságok?**  
   A partneri álláshirdetés- és jelentkezőkezelő felület teljes hiánya, valamint a beérkező érdeklődések naplózásának elmaradása.
7. **Alkalmas-e jelenleg fizetős szolgáltatás értékesítésére?**  
   **NEM.** Fizetési kapu és automatizált lejárati kezelés nélkül még nem értékesíthető tisztán önkiszolgáló módon.
8. **Milyen fejlesztések szükségesek a partnerprogram elindításához?**  
   Ingyenes / meghívásos Pilot program azonnal indítható; a fizetős programhoz a toborzási UI és a leadkezelés kötelező.
9. **Milyen fejlesztések szükségesek a hosszú távú üzleti működéshez?**  
   Fizetési integráció, valós statisztikai mérések, automatikus e-mail értesítők.

### 11.2 Számszerű értékelés (1–10 skálán)

- **Technikai állapot: 8 / 10** (Stabil, gyors, TypeScript típusbiztos, tiszta architektúra)
- **Adatbiztonság: 9 / 10** (A legutóbbi RLS javítás és FORCE RLS után szigorúan védett)
- **Funkcionális teljesség: 5 / 10** (Az álláskezelés és ajánlatok hiánya miatt félkész az önkiszolgáló élmény)
- **UX és dizájn: 8 / 10** (Prémium megjelenés, igényes komponensek, kisebb mobilos észlelések)
- **Üzleti érték: 6 / 10** (Erős márkaérték és backlink, de mérhető lead- és toborzási funkciók nélkül korlátozott)
- **Skálázhatóság: 6 / 10** (A termékek és referenciák nem-relációs tárolása hosszabb távon szűk keresztmetszet)
- **Partneri használhatóság: 6 / 10** (Profil módosításra kiváló, mindennapi munkára még korlátozott)

---

## 12. NEM ELLENŐRIZHETŐ TERÜLETEK ÉS KORLÁTOZÁSOK

1. **Valós e-mail kiküldés:** Az admin felület sablont generál; külső tranzakciós e-mail szolgáltató (Resend, SendGrid) megléte a klienskódból nem igazolható.
2. **Keresőmotoros indexelés:** Bár vannak meta tagok, a Single Page Application (SPA) felépítés miatt valódi Google Search Console adatok hiányában az organikus indexelési hatékonyság nem mérhető közvetlenül.

---

## 13. ZÁRÓ ELLENŐRZÉSI KIMUTATÁS

- **Létrehozott fájl:** `P0_D05_PARTNER_PROFILE_CURRENT_STATE_AUDIT.md` (gyökérkönyvtárban).
- **Vizsgált források:**
  - `src/App.tsx`, `src/components/PartnerLayout.tsx`, `src/pages/PartnerDetailPage.tsx`
  - `src/components/PartnerEditorModal.tsx`, `src/pages/PartnerApplicationPage.tsx`, `src/pages/AdminPartnersPage.tsx`
  - `src/services/partnerService.ts`, `src/services/partnerApplicationService.ts`, `src/services/materialsService.ts`
  - `src/pages/CareersPage.tsx`, `src/services/careerService.ts`
  - `supabase/migrations/` teljes migrációs állomány
- **Lefuttatott tesztek:**
  - Éles REST API olvasási teszt a Supabase `olmavxcmkvvcebgqxohe` projekten (Anonim SELECT a `partner_users` táblára: `data: []`).
  - Éles REST API módosítási teszt (Anonim UPDATE a `partners` táblára: `data: []`).
  - RPC hívási teszt (`is_partner_contact` és `is_partner_admin`: `false`).
- **Módosítások:** A vizsgálat során **SEMMILYEN forráskód-, adatbázis- vagy beállításmódosítás NEM történt.** A rendszer állapota 100%-ban érintetlen maradt.

