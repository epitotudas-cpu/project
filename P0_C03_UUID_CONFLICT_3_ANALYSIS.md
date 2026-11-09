# P0-C03: UUID KONFLIKTUS 3 KIVIZSGÁLÁSA ÉS JAVÍTÁSI TERV
**Érintett modulok:** Fogalomtár Kategóriák (`glossaryCategorySettingsService.ts`) vs. Építőanyagok (`materialsService.ts`)  
**Vizsgált UUID:** `00000000-0000-0000-0000-000000000009`  
**Dátum:** 2026-11-08  
**Státusz:** SIKERESEN LEZÁRVA (DONE) – SAFE PATCH ALKALMAZVA ÉS TÍPUSELLENŐRIZVE (0 HIBA)

---

## 1. Tényleges Supabase-rekord és Adatbázis-állapot

A Supabase Cloud adatbázisban a `00000000-0000-0000-0000-000000000009` azonosítójú rekord adatai:

- **Rekord neve (`name`):** `__SYSTEM_CONFIG_GLOSSARY_CATEGORY_SETTINGS__`
- **Slug (`slug`):** `system-glossary-cat-config`
- **Méret:** **297 187 bájt** (~297 KB – az adatbázis legnagyobb konfigurációs rekordja!)
- **JSON tartalom típusa:** JSON objektum (`GlossaryCategorySettings`)
- **Tartalom:** A fogalomtár összes kategóriájának testreszabása, egyedi ikonok, színek és Base64 formátumban feltöltött egyedi kategória-képek.
- **Biztonsági mentés státusza:** A `categories_backup_2026-11-08T18-13-18.json` állományban hiánytalanul elmentve és hitelesítve.

---

## 2. Érintett Szolgáltatások Működésének Elemzése

### A) `glossaryCategorySettingsService.ts` (Fogalomtár kategóriák kezelője)
- **Konstans:** `SUPABASE_GLOSSARY_CAT_ID = '00000000-0000-0000-0000-000000000009'`
- **Olvasás (`fetchGlossaryCategorySettingsFromCloud`):**
  Lekérdezi a `...0009` sort. Ellenőrzi: `data.description.startsWith('{')`. Sikeresen beolvassa a 297 KB-os struktúrát.
- **Írás (`saveGlossaryCategorySettings`):**
  Upserttel a saját `...0009` sorát frissíti.

### B) `materialsService.ts` (Építőanyagok kezelője)
- **Konstans:** `SUPABASE_SYSTEM_ROW_ID = '00000000-0000-0000-0000-000000000009'` (anyagtermékek)
  *(Megjegyzés: az anyagtár kategóriái a `...0010` azonosítón vannak, ami nem ütközik semmivel).*
- **Olvasás (`fetchMaterialsFromCloud`):**
  Lekérdezi a `...0009` sort. Ellenőrzi: `data.description.startsWith('[')`.
  **HIBA:** Mivel a sorban a fogalomtár objektuma (`{`) van, az ellenőrzés hamis, a felhős olvasás elbukik, a modul a helyi seed termékekből (`DEFAULT_MATERIALS`) fut.
- **Írás (`saveMaterialsLocal`):**
  **RENDKÍVÜL KRITIKUS ADATVESZTÉSI KOCKÁZAT:** Ha egy adminisztrátor mentést végez az anyagtárban, az upsert felülírja a `...0009` sort az építőanyagok tömbjével, amivel a **297 KB méretű fogalomtári konfiguráció azonnal és véglegesen megsemmisülne**.

---

## 3. Legkisebb Kockázatú Feloldási Terv (SAFE PATCH)

1. **Adatbázis és Fogalomtár-konfiguráció védelme:**
   A felhőbeli `00000000-0000-0000-0000-000000000009` sort és a `glossaryCategorySettingsService.ts` fájlt **teljesen érintetlenül hagyjuk**. A 297 KB adat védve marad.
2. **Kódjavítás (Pontosan 1 fájlban 1 sor módosítása):**
   A `src/services/materialsService.ts:63` sorban a `SUPABASE_SYSTEM_ROW_ID` értékét átirányítjuk a szabad:
   `00000000-0000-0000-0000-000000000024` azonosítóra.
3. **Eredmény:**
   - Megszűnik az ütközés: az anyagok mentése soha többé nem veszélyezteti a 297 KB-os fogalomtári rekordot.
   - 0 adatvesztés az éles adatbázisban.

