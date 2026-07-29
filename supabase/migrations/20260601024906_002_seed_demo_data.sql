/*
  # Seed Demo Data

  1. Categories
    - 8 építőipari kategória
    
  2. Articles
    - 6 népszerű cikk
    
  3. Glossary Terms
    - 10 fogalom
    
  4. Tools
    - Hilti TE 30 fúrókalapács
*/

-- Insert categories
INSERT INTO categories (name, slug, icon_name, color, description, article_count) VALUES
('Szerkezetépítés', 'szerkezetepites', 'Layers', 'bg-amber-500/10 text-amber-400 border-amber-500/20', 'Beton, vasalás, falazat és tartószerkezetek', 142),
('Alapozás', 'alapozas', 'Home', 'bg-blue-500/10 text-blue-400 border-blue-500/20', 'Alapok, talajmunkák és földerek', 87),
('Villanyszerelés', 'villanyszereles', 'Zap', 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', 'Elektromos rendszerek és biztonság', 203),
('Víz-Gáz-Fűtés', 'viz-gaz-futes', 'Droplets', 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20', 'Vízvezeték, gáz és fűtési rendszerek', 165),
('Burkolás', 'burkolas', 'Wrench', 'bg-orange-500/10 text-orange-400 border-orange-500/20', 'Padlóburkolatok, csempézés és fugázás', 118),
('Tetőfedés', 'tetofedes', 'HardHat', 'bg-red-500/10 text-red-400 border-red-500/20', 'Tetőszerek, fedések és szigetelések', 94),
('Anyagismeret', 'anyagismeret', 'BookOpen', 'bg-green-500/10 text-green-400 border-green-500/20', 'Építőanyagok tulajdonságai és felhasználása', 231),
('Gépészet', 'gepeszet', 'TrendingUp', 'bg-purple-500/10 text-purple-400 border-purple-500/20', 'Gépek, berendezések és karbantartás', 156);

-- Insert articles
INSERT INTO articles (title, slug, excerpt, content, category_id, author, difficulty, read_time, views, rating, rating_count, status, featured_image) VALUES
('Betonozás lépésről lépésre', 'betonozas-lepesrol-lepesre', 
 'Teljes útmutató a betonkeveréstől az utókezelésig. Ismerd meg a betonkészítés lépéseit, az arányokat és a szakmai fortélyokat.',
 '## Betonkészítés alapjai

### 1. Előkészítés
A betonozás előtt alaposan készítsük elő a munkaterületet...

### 2. Zsaluzat
A zsaluzatnak stabilnak és vízállónak kell lennie...

### 3. Armatura
A vasalás elhelyezése kritikus a szerkezet szilárdsága szempontjából...

### 4. Betonozás
A betont rétegenként kell elhelyezni és vibrálni...',
 (SELECT id FROM categories WHERE slug = 'szerkezetepites'),
 'Nagy István', 'advanced', 8, 12400, 4.9, 347, 'published',
 'https://images.pexels.com/photos/585419/pexels-photo-585419.jpeg'),

('Gipszkarton falak építése kezdőknek', 'gipszkarton-falak-epitese-kezdoknek',
 'Útmutató gipszkarton válaszfalak építéséhez. Lépésről lépésre bemutatjuk a keretkészítéstől a véglegesítésig.',
 '## Gipszkarton fal építése

### Szükséges eszközök
- Gipszkarton lapok
- CW és UW profilok
- Csavarok
- Gipsz...

### A keret összeállítása
A fémprofilokból álló váz...',
 (SELECT id FROM categories WHERE slug = 'burkolas'),
 'Kovács János', 'beginner', 6, 9100, 4.7, 215, 'published',
 'https://images.pexels.com/photos/1125136/pexels-photo-1125136.jpeg'),

('Elektromos hálózat tervezése', 'elektromos-halozat-tervezese',
 'Bővített útmutáló otthoni elektromos hálózat tervezéséhez és kivitelezéséhez.',
 '## Elektromos tervezés alapjai

### Biztonsági előírások
Az elektromos munkák mindig szakember felügyelete alatt zajljanak...',
 (SELECT id FROM categories WHERE slug = 'villanyszereles'),
 'Szabó Péter', 'expert', 11, 8800, 4.8, 189, 'published',
 'https://images.pexels.com/photos/1556980/pexels-photo-1556980.jpeg'),

('Alapárok ásása és szintezése', 'alaparok-asasa-szintezese',
 'Professzionális technikák az alapárkok előkészítéséhez.',
 '## Alapárok készítése

### Talajvizsgálat
Mielőtt elkezdenénk, ismernünk kell a talaj összetételét...',
 (SELECT id FROM categories WHERE slug = 'alapozas'),
 'Tóth Ferenc', 'intermediate', 7, 7200, 4.6, 156, 'published',
 'https://images.pexels.com/photos/221761/pexels-photo-221761.jpeg'),

('Tetőfedés zsindely burkolattal', 'tetofedes-zsindely-burkolattal',
 'Modern tetőfedési technikák és anyagok bemutatása.',
 '## Zsindelyes tetőfedés

### Elkészítés
A tető szigetelése és a zsindely elhelyezése...',
 (SELECT id FROM categories WHERE slug = 'tetofedes'),
 'Nagy István', 'advanced', 9, 6500, 4.8, 203, 'published',
 'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg'),

('Csempézés és fugázás mesterfogások', 'csempezes-es-fugazas',
 'Titkok a tökéletes csempézéshez és fugázáshoz.',
 '## Csempézés technikák

### Előkészítés
Felület előkészítése és alapozás...',
 (SELECT id FROM categories WHERE slug = 'burkolas'),
 'Kiss János', 'advanced', 5, 11200, 4.9, 412, 'published',
 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg');

-- Insert glossary terms
INSERT INTO glossary_terms (term, slug, definition, letter, category) VALUES
('Adalékanyag', 'adalekanyag', 'Homok és kavics a betonkeverékben. Ahol 60-75% a tipikus arány. Mérete és összetétele befolyásolja a beton szilárdságát és tartósságát.', 'A', 'anyagismeret'),
('Armatura', 'armatura', 'Vasalás, teherviselő vasak a betonban. A húzóerőket veszi fel, megakadályozza a repedezést.', 'A', 'szerkezetepites'),
('Betonacél', 'betonacel', 'Öntöttvas vagy acél armatura betonba bekötéshez. Jellemzően B60.50 vagy B50.50 besorolású, keresztirányú és hosszanti bordázással.', 'B', 'anyagismeret'),
('C20/25', 'c20-25', 'Beton szilárdsági osztály. 20 MPa cube nyomószilárdság, 25 MPa henger. Közönséges építési munkáknál használt szabványosztály.', 'C', 'anyagismeret'),
('Cement', 'cement', 'Kötőanyag a betonban. Víz hatására hidratál és keményre köt. CEM I a leggyakoribb portlandcement, CEM II a kompozit cement.', 'C', 'anyagismeret'),
('Esztrich', 'esztrich', 'Kiegyenlítő esztrich réteg a padlózat alapjául. Tipikus vastagság 4-8 cm, C20/25 vagy C25/30 szilárdságú.', 'E', 'alapozas'),
('Habarcs', 'habarcs', 'Cement, homok és víz keveréke. M1-M5 jelzés szerint osztályozzák. Téglafalazatnál és vakoláshoz használatos.', 'H', 'anyagismeret'),
('Zsaluzat', 'zsaluzat', 'Ideiglenes vagy maradandó formázat friss beton megtartásához. Leggyakrabban fa vagy acél elemekből.', 'Z', 'szerkezetepites'),
('Panel', 'panel', 'Előregyártott vasbeton elemek. Falak, tetők, padlók összeszerelésére, tipikus panelméretek 3x6m vagy 3x12m.', 'P', 'szerkezetepites'),
('Vasbeton', 'vasbeton', 'Beton armaturával erősítve. Ezzel egyidejűleg nyomásra és húzásra ellenálló szerkezeti anyag.', 'V', 'szerkezetepites');

-- Insert tools
INSERT INTO tools (name, slug, type, brand, description, specs, price, currency, features, rating, rating_count, image_url, status) VALUES
('Hilti TE 30 Fúrókalapács', 'hilti-te-30-furokalapacs', 'Fúrókalapács', 'Hilti',
 'Profi 1600W erőteljes rotary hammer. Beton és falazat fúrásához, demolícióhoz ideális választás.',
 '{"motor": "1600 W", "forgási_sebesség": "0-1000 rpm", "ütéssebesség": "3800 bpm", "max_fúrás_beton": "32 mm", "max_fúrás_fa": "40 mm", "tömeg": "3.8 kg", "hosszúság": "348 mm", "zaj": "95 dB(A)", "rezgés": "<2.5 m/s²"}'::jsonb,
 98500.00, 'HUF',
 ARRAY['1600W erős motor', 'Ütésfrekvencia szabályozás', 'Rezgéscsökkentő rendszer', 'Vákuum-csatlakozás', 'Precíziós ütés mód', 'Aktív töltéskiegyenlítés'],
 4.8, 847, NULL, 'active');

-- Update category article counts
UPDATE categories SET article_count = (SELECT COUNT(*) FROM articles WHERE category_id = categories.id);