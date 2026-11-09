# P0-B01: BIZTONSÁGI MENTÉS ÉS VISSZAÁLLÍTÁSI PROTOKOLL – VÉGREHAJTÁSI JELENTÉS
**Projekt:** ÉpítőTudás  
**Végrehajtás dátuma:** 2026-11-08T19:13:18+01:00  
**Státusz:** SIKERESEN LEZÁRVA (DONE)  
**Mód:** SZIGORÚAN READ-ONLY AZ ÉLES ADATBÁZISON (0 írási/módosítási művelet az éles Supabase-en)

---

## 1. Összefoglaló és Célkitűzés

A `P0-B01` feladat célja a Supabase Cloud adatbázisban tárolt `public.categories` tábla teljes, ellenőrzött, bit-szintű biztonsági mentésének elkészítése volt még bárminemű javítási (UUID feloldási, sémamódosítási vagy kódjavítási) lépés előtt.

A feladat eredményeként a 22 meglévő rekord (köztük a közel 297 KB-os fogalomtári és a 270 KB-os portálbeállítási JSON konfiguráció) független, időbélyegzett JSON állományba került lementésre, kriptográfiai ellenőrzőösszeggel ellátva, valamint a visszaállíthatóság egy izolált in-memory szimulációban 100%-os egyezéssel hitelesítésre került.

---

## 2. Végrehajtás adatai és metaadatok

| Paraméter | Érték |
| :--- | :--- |
| **Forrás REST végpont** | `https://olmavxcmkvvcebgqxohe.supabase.co/rest/v1/categories?select=*&order=id.asc` |
| **Lekérdezési mód** | HTTP GET (READ-ONLY) |
| **HTTP Válaszkód** | `200 OK` (476 ms) |
| **Content-Range fejléc** | `0-21/22` (összesen 22 rekord az adatbázisban) |
| **Letöltött rekordok száma** | **22 db** |
| **Mentési fájl helye** | `c:\Users\User\Documents\epitotudas\project\backups\categories_backup_2026-11-08T18-13-18.json` |
| **Adatméret (JSON tömb)** | 682 517 bájt |
| **Teljes fájlméret (metaadatokkal)** | 683 914 bájt |
| **SHA-256 ellenőrzőösszeg** | `32ae5624c7d971fd5fb6686dcc37307935435d69c93c6d39cd8b94f13a8d6934` |

---

## 3. Kiemelt konfigurációs rekordok integritás-ellenőrzése

A lemezről történt azonnali visszaolvasás során ellenőriztük a 4 kritikus ütközésben érintett konfigurációs rekord jelenlétét és épségét:

| UUID | Név / Funkció | Méret | Státusz |
| :--- | :--- | :--- | :--- |
| `00000000-0000-0000-0000-000000000001` | `__SYSTEM_CONFIG_SITE_SETTINGS__` | 270 294 bájt | **Ép, hiánytalanul mentve** |
| `00000000-0000-0000-0000-000000000007` | `__SYSTEM_CONFIG_TRADES__` | 63 503 bájt | **Ép, hiánytalanul mentve** |
| `00000000-0000-0000-0000-000000000008` | `__SYSTEM_CONFIG_ABOUT_SETTINGS__` | 1 923 bájt | **Ép, hiánytalanul mentve** |
| `00000000-0000-0000-0000-000000000009` | `__SYSTEM_CONFIG_GLOSSARY_CATEGORY_SETTINGS__` | 297 187 bájt | **Ép, hiánytalanul mentve** |

---

## 4. Izolált Sandbox Visszaállítási Teszt Eredménye

A mentés biztonsági értékét az adja, ha a visszaállítás bizonyítottan működik anélkül, hogy az éles adatbázist kitennénk bármilyen kockázatnak:
- **Szimulációs környezet:** Független in-memory JavaScript Mock DB / SQL engine (0 db hálózati kérés, 0 db éles adatbázis-művelet).
- **Tesztelt művelet:** A mentett JSON állomány beolvasása, rekordok szétbontása, mock táblába történő visszaállítása mind a 18 oszlopra (`id`, `name`, `slug`, `icon_name`, `color`, `description`, `article_count`, `created_at`, `updated_at`, `image_url`, `banner_url`, `featured`, `sort_order`, `seo_title`, `seo_description`, `image_fit`, `image_position`, `image_zoom`).
- **Bit-szintű összehasonlítás:** `mock_record` vs `original_record`.
- **Eredmény:** **22 / 22 rekord (100%) bit-pontosan megegyezik.**

---

## 5. Szükség esetén alkalmazandó visszaállítási protokoll (Disaster Recovery)

Amennyiben a jövőbeli javítások vagy műveletek során adatvesztés vagy nem kívánt felülírás történne, a visszaállítás menete:

1. **Mentési fájl azonosítása:**
   `c:\Users\User\Documents\epitotudas\project\backups\categories_backup_2026-11-08T18-13-18.json`
2. **Ellenőrzőösszeg validálása:**
   ```powershell
   Get-FileHash -Algorithm SHA256 "c:\Users\User\Documents\epitotudas\project\backups\categories_backup_2026-11-08T18-13-18.json"
   # Elvárt: 32ae5624c7d971fd5fb6686dcc37307935435d69c93c6d39cd8b94f13a8d6934
   ```
3. **Egyedi rekord visszaállítása (példa Node.js REST hívással):**
   A mentési JSON `data` tömbjéből kiválasztott objektum közvetlenül beküldhető a Supabase REST API `PATCH` vagy `POST (upsert)` végpontjára a service_role kulccsal.

---

## 6. Státusz és Következő Lépések

A `P0-B01` feladat ezzel **SIKERESEN LEZÁRULT**.
A projekt immár rendelkezik hitelesített, visszaállítható biztonsági mentéssel, így a P0 prioritás további (függetlenül futtatható) ágai biztonságosan megkezdhetők:

1. **P0-D01**: Az `AuthContext.tsx:77` TypeScript (`TS2551`) és RPC `.catch()` hiba minimális, biztonságos javítása.
2. **P0-C01**: Az első izolált UUID Safe Patch (`...0007`) részletes tervének elkészítése és jóváhagyatása.
3. **P0-E01–E05**: READ-ONLY biztonsági felülvizsgálatok (RLS, API kulcsok, storage vödrök auditja).

