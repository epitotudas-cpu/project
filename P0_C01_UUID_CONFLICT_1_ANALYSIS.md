# P0-C01: UUID KONFLIKTUS 1 KIVIZSGÁLÁSA ÉS JAVÍTÁSI TERV
**Érintett modulok:** Oktatási Kurzusok (`educationService.ts`) vs. Építőipari Szakmák (`tradeService.ts`)  
**Vizsgált UUID:** `00000000-0000-0000-0000-000000000007`  
**Dátum:** 2026-11-08  
**Státusz:** SIKERESEN LEZÁRVA (DONE) – SAFE PATCH ALKALMAZVA ÉS TÍPUSELLENŐRIZVE (0 HIBA)

---

## 1. Tényleges Supabase-rekord és Adatbázis-állapot

A Supabase Cloud adatbázisban a `00000000-0000-0000-0000-000000000007` azonosítójú rekord adatai:

- **Rekord neve (`name`):** `__SYSTEM_CONFIG_TRADES__`
- **Slug (`slug`):** `system-trades-config`
- **Méret:** **63 503 bájt** (~63.5 KB)
- **JSON tartalom típusa:** JSON tömb (`Array<TradeItem>`)
- **Tartalom:** 8 db kidolgozott építőipari szakma (kőműves, ács, burkoló, festő stb.) teljes szakmai leírása, szerszámlistája, munkavédelmi előírásai és képzési kapcsolatai.
- **Biztonsági mentés státusza:** A `categories_backup_2026-11-08T18-13-18.json` állományban hiánytalanul elmentve és SHA-256 ellenőrzőösszeggel hitelesítve.

---

## 2. Érintett Szolgáltatások Működésének Elemzése

### A) `tradeService.ts` (Szakmák kezelője)
- **Konstans:** `SUPABASE_TRADES_ID = '00000000-0000-0000-0000-000000000007'`
- **Olvasás (`fetchTradeItemsFromCloud`):**
  Lekérdezi a `...0007` sort. Ellenőrzi: `data.description.startsWith('[')`. Mivel a felhőben lévő adat tömb, a feltétel **teljesül**, az adatokat hibátlanul betölti a felületre és a `localStorage`-be.
- **Írás (`saveTradeItems`):**
  Upsert művelettel frissíti a `...0007` sort. Mivel a felhős sor az övé, ez a saját adatait tartja karban.

### B) `educationService.ts` (Kurzusok kezelője)
- **Konstans:** `SUPABASE_COURSES_ID = '00000000-0000-0000-0000-000000000007'`
- **Olvasás (`fetchEducationDataFromCloud`):**
  Lekérdezi a `...0007` sort. Ellenőrzi: `data.description.startsWith('{')`.
  **HIBA:** Mivel a sorban a szakmák tömbje (`[`) található, a feltétel **mindig hamis**. A felhőből történő kurzusbetöltés csendben elbukik, a kurzusmodul a lokális `DEFAULT_EDUCATION_DATA` és `localStorage` tartalomból fut.
- **Írás (`saveEducationData`):**
  **KRITIKUS ADATVESZTÉSI KOCKÁZAT:** Ha az adminisztrátor az oktatási felületen mentést végez, az upsert felülírná a `...0007` sort a kurzusok JSON objektumával. Ezzel a felhőben lévő 63.5 KB-os szakma-adatbázis **azonnal megsemmisülne**.

---

## 3. Szabad UUID Címtér Ellenőrzése

A kódbázis és a felhő teljes átvizsgálása alapján az alábbi statikus azonosítók teljesen szabadok:
- `00000000-0000-0000-0000-000000000016` (szabad)
- `00000000-0000-0000-0000-000000000017` (szabad)
- `00000000-0000-0000-0000-000000000018` (szabad)
- `00000000-0000-0000-0000-000000000022` (szabad)
- `00000000-0000-0000-0000-000000000027` (szabad)

---

## 4. Legkisebb Kockázatú Feloldási Terv (SAFE PATCH)

1. **Adatbázis védelme:**
   A felhőbeli `00000000-0000-0000-0000-000000000007` sort és a `tradeService.ts` fájlt **teljesen érintetlenül hagyjuk**. A 63.5 KB szakma-adatbázis így 100%-os biztonságban marad.
2. **Kódjavítás (Pontosan 1 fájl módosítása):**
   A `src/services/educationService.ts` fájlban a kurzusokhoz tartozó `SUPABASE_COURSES_ID` értékét átirányítjuk a szabad:
   `00000000-0000-0000-0000-000000000027` (vagy `...0022`) azonosítóra.
3. **Eredmény:**
   - Megszűnik az ütközés: a kurzusok mentése többé soha nem írhatja felül a szakmákat.
   - A kurzusok a jövőben saját felhős rekordba menthetnek és onnan tölthetnek be.
   - 0 adatvesztés.
4. **Visszaállítási terv (Rollback):**
   Ha bármilyen váratlan regresszió lépne fel, az `educationService.ts` 402. sora azonnal visszaállítható az eredeti értékre.

