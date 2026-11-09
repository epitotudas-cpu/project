# P0-C02: UUID KONFLIKTUS 2 KIVIZSGÁLÁSA ÉS JAVÍTÁSI TERV
**Érintett modulok:** Rólunk Oldal Beállításai (`aboutService.ts`) vs. Tudástár Elemek (`knowledgeHubService.ts`)  
**Vizsgált UUID:** `00000000-0000-0000-0000-000000000008`  
**Dátum:** 2026-11-08  
**Státusz:** SIKERESEN LEZÁRVA (DONE) – SAFE PATCH ALKALMAZVA ÉS TÍPUSELLENŐRIZVE (0 HIBA)

---

## 1. Tényleges Supabase-rekord és Adatbázis-állapot

A Supabase Cloud adatbázisban a `00000000-0000-0000-0000-000000000008` azonosítójú rekord adatai:

- **Rekord neve (`name`):** `__SYSTEM_CONFIG_ABOUT_SETTINGS__`
- **Slug (`slug`):** `system-about-config`
- **Méret:** **1 923 bájt** (~1.9 KB)
- **JSON tartalom típusa:** JSON objektum (`AboutSettings`)
- **Tartalom:** A Rólunk oldal egyedi szövegei, szekciócímei, küldetés, jövőkép, a 4 alappillér és források beállításai.
- **Biztonsági mentés státusza:** A `categories_backup_2026-11-08T18-13-18.json` állományban hiánytalanul elmentve és hitelesítve.

---

## 2. Érintett Szolgáltatások Működésének Elemzése

### A) `aboutService.ts` (Rólunk oldal kezelője)
- **Konstans:** `SUPABASE_ABOUT_ID = '00000000-0000-0000-0000-000000000008'`
- **Olvasás (`fetchAboutSettingsFromCloud`):**
  Lekérdezi a `...0008` sort. Ellenőrzi: `data.description.startsWith('{')`. Mivel a felhős sor objektum, a feltétel **teljesül**, az oldal beállításait sikeresen betölti.
- **Írás (`saveAboutSettings`):**
  Upsert művelettel a saját `...0008` sorát frissíti.

### B) `knowledgeHubService.ts` (Tudástár kezelője)
- **Konstans:** `SUPABASE_SYSTEM_ROW_ID = '00000000-0000-0000-0000-000000000008'`
- **Olvasás (`fetchKnowledgeItemsFromCloud`):**
  Lekérdezi a `...0008` sort. Ellenőrzi: `data.description.startsWith('[')`.
  **HIBA:** Mivel a sorban a Rólunk beállítások objektuma (`{`) van, a feltétel **hamis**. A felhőből történő Tudástár-olvasás csendben elbukik, a modul a helyi seed adatokból (`DEFAULT_KNOWLEDGE_ITEMS`) fut.
- **Írás (`saveKnowledgeItemsLocal`):**
  **KRITIKUS ADATVESZTÉSI KOCKÁZAT:** Ha az adminisztrátor mentést végez a Tudástárban, az upsert felülírja a `...0008` sort a tudástár tömbjével, és a **Rólunk oldal felhőbeli beállításai azonnal megsemmisülnek**.

---

## 3. Legkisebb Kockázatú Feloldási Terv (SAFE PATCH)

1. **Adatbázis és Rólunk beállítások védelme:**
   A felhőbeli `00000000-0000-0000-0000-000000000008` sort és az `aboutService.ts` fájlt **teljesen érintetlenül hagyjuk**.
2. **Kódjavítás (Pontosan 1 fájl, 1 sor módosítása):**
   A `src/services/knowledgeHubService.ts:46` sorban a `SUPABASE_SYSTEM_ROW_ID` értékét átirányítjuk a szabad:
   `00000000-0000-0000-0000-000000000023` azonosítóra.
3. **Eredmény:**
   - Megszűnik az ütközés: a Tudástár mentése nem veszélyezteti a Rólunk oldalt.
   - 0 adatvesztés az éles adatbázisban.

