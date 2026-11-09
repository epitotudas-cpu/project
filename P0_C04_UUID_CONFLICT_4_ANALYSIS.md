# P0-C04: UUID KONFLIKTUS 4 KIVIZSGÁLÁSA ÉS JAVÍTÁSI TERV
**Érintett modulok:** Szakkönyv Kategóriák (`bookService.ts`) vs. Hirdetési Kreatívok (`bannerCreativeService.ts`)  
**Vizsgált UUID:** `00000000-0000-0000-0000-000000000013`  
**Dátum:** 2026-11-08  
**Státusz:** SIKERESEN LEZÁRVA (DONE) – SAFE PATCH ALKALMAZVA ÉS TÍPUSELLENŐRIZVE (0 HIBA)

---

## 1. Tényleges Supabase-rekord és Adatbázis-állapot

A Supabase Cloud adatbázisban a `00000000-0000-0000-0000-000000000013` azonosítójú rekord adatai:

- **Rekord neve (`name`):** `__SYSTEM_CONFIG_AD_CREATIVES__`
- **Slug (`slug`):** `system-ad-creatives-config`
- **Méret:** 2 bájt (`[]`)
- **JSON tartalom típusa:** JSON tömb
- **Gazda modul:** `bannerCreativeService.ts`
- **Biztonsági mentés státusza:** A `categories_backup_2026-11-08T18-13-18.json` állományban hiánytalanul elmentve és hitelesítve.

---

## 2. Érintett Szolgáltatások Működésének Elemzése

### A) `bannerCreativeService.ts` (Hirdetési kreatívok kezelője)
- **Konstans:** `SUPABASE_SYSTEM_ID = '00000000-0000-0000-0000-000000000013'`
- **Olvasás:** Lekérdezi a `...0013` sort. Mivel a felhőben az `__SYSTEM_CONFIG_AD_CREATIVES__` tömb szerepel, a struktúra megegyezik.
- **Írás:** Upsert művelettel a saját `...0013` sorát frissíti.

### B) `bookService.ts` (Szakkönyvtár kezelője)
- **Konstans:** `SUPABASE_BOOKS_CATEGORIES_ID = '00000000-0000-0000-0000-000000000013'`
  *(Megjegyzés: a könyvek maguk a `...0012` sorban vannak, ami nem ütközik).*
- **Olvasás:** Lekérdezi a `...0013` sort. Mindkét modul JSON-tömböt vár, így az olvasáskor a könyvkategóriák helyett üres hirdetési tömböt lát.
- **Írás (`saveBookCategories`):**
  **ÜTKÖZÉSI KOCKÁZAT:** Ha egy adminisztrátor könyvkategóriát ment, az felülírja a `...0013` sort `__SYSTEM_CONFIG_BOOK_CATEGORIES__` néven, kitörölve a hirdetési kreatívokat. Fordított esetben a hirdetésmentés törli a könyvkategóriákat.

---

## 3. Legkisebb Kockázatú Feloldási Terv (SAFE PATCH)

1. **Adatbázis és Hirdetések védelme:**
   A felhőbeli `00000000-0000-0000-0000-000000000013` sort és a `bannerCreativeService.ts` fájlt **teljesen érintetlenül hagyjuk**.
2. **Kódjavítás (Pontosan 1 fájlban 1 sor módosítása):**
   A `src/services/bookService.ts:1330` sorban a könyvkategóriák konstansát átirányítjuk a szabad:
   `const SUPABASE_BOOKS_CATEGORIES_ID = '00000000-0000-0000-0000-000000000025';` azonosítóra.
3. **Eredmény:**
   - Megszűnik a negyedik, utolsó UUID-ütközés is a rendszerben.
   - Mind a könyvkategóriák, mind a hirdetési kreatívok önálló felhős sorral rendelkeznek.
   - 0 adatvesztés az éles adatbázisban.

