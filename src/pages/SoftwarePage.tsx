import { useMemo, useState } from 'react';
import {
  ChevronRight,
  Laptop,
  ArrowRight,
  CheckCircle2,
  Wrench,
  Sparkles,
  Layers,
  Library,
  Search,
  ExternalLink,
  Calculator,
  Compass,
  ClipboardCheck,
} from 'lucide-react';
import SectionSubNav from '../components/SectionSubNav';

interface SoftwarePageProps {
  onNavigate: (page: string) => void;
}

type SoftwareCategory = 'all' | 'bim_cad' | 'koltsegvetes' | 'statika' | 'projekt';

interface SoftwareEntry {
  id: string;
  name: string;
  vendor: string;
  category: Exclude<SoftwareCategory, 'all'>;
  categoryLabel: string;
  license: string;
  platform: string;
  summary: string;
  highlights: string[];
  targetRoles: string[];
  websiteUrl: string;
}

const SOFTWARE_CATALOG: SoftwareEntry[] = [
  {
    id: 'archicad',
    name: 'Graphisoft Archicad',
    vendor: 'Graphisoft',
    category: 'bim_cad',
    categoryLabel: 'BIM & CAD Tervezés',
    license: 'Előfizetés / Oktatási licenc',
    platform: 'Windows, macOS',
    summary:
      'Magyar fejlesztésű, nemzetközileg piacvezető OpenBIM építészeti tervezőszoftver 3D modellalapú dokumentációval és mennyiségszámítással.',
    highlights: [
      'Valós idejű 2D/3D tervdokumentáció',
      'Natív IFC és OpenBIM együttműködés',
      'Beépített konszignáció és mennyiségi kimutatás',
    ],
    targetRoles: ['Építész tervező', 'BIM menedzser', 'Tanuló'],
    websiteUrl: 'https://graphisoft.com/solutions/archicad',
  },
  {
    id: 'autocad',
    name: 'Autodesk AutoCAD',
    vendor: 'Autodesk',
    category: 'bim_cad',
    categoryLabel: 'BIM & CAD Tervezés',
    license: 'Előfizetés / Oktatási licenc',
    platform: 'Windows, macOS, Web',
    summary:
      'Ipari szabványnak számító 2D és 3D CAD rajzolóprogram kiviteli tervekhez, csomóponti részletrajzokhoz és műszaki dokumentációkhoz.',
    highlights: [
      'Univerzális DWG/DXF fájlformátum',
      'Precíz 2D szerkesztés és rétegkezelés',
      'Széleskörű szakági bővítmény-támogatás',
    ],
    targetRoles: ['Tervező', 'Kivitelező', 'Műszaki előkészítő'],
    websiteUrl: 'https://www.autodesk.com/products/autocad/overview',
  },
  {
    id: 'revit',
    name: 'Autodesk Revit',
    vendor: 'Autodesk',
    category: 'bim_cad',
    categoryLabel: 'BIM & CAD Tervezés',
    license: 'Előfizetés / Oktatási licenc',
    platform: 'Windows',
    summary:
      'Multidiszciplináris BIM tervezőkörnyezet építész, tartószerkezeti és épületgépészeti (MEP) szakágak összehangolt modellezéséhez.',
    highlights: [
      'Paraméteres családok és ütközésvizsgálat',
      'Szakági modellek közös koordinációja',
      'Automatizált tervlap- és anyaglisták',
    ],
    targetRoles: ['BIM tervező', 'Épületgépész', 'Tartószerkezeti tervező'],
    websiteUrl: 'https://www.autodesk.com/products/revit/overview',
  },
  {
    id: 'terc-vip',
    name: 'TERC V.I.P. / ÉTDR Költségvetés',
    vendor: 'TERC Kft.',
    category: 'koltsegvetes',
    categoryLabel: 'Költségvetés & Árazás',
    license: 'Kereskedelmi licenc',
    platform: 'Windows',
    summary:
      'A magyar építőipar egyik legelterjedtebb költségvetés-készítő és árelemző rendszere, ÖN-normagyűjteménnyel és naprakész anyagár-adatbázissal.',
    highlights: [
      'Beépített ÖN költségvetési normarendszer',
      'Árazatlan és árazott kiírások exportálása',
      'Kivitelezői ajánlatok gyors összehasonlítása',
    ],
    targetRoles: ['Árajánlat-készítő', 'Műszaki ellenőr', 'Beruházó'],
    websiteUrl: 'https://www.terc.hu/',
  },
  {
    id: 'axisvm',
    name: 'AxisVM',
    vendor: 'Inter-CAD Kft.',
    category: 'statika',
    categoryLabel: 'Statika & Műszaki Számítás',
    license: 'Moduláris licenc / Oktatási verzió',
    platform: 'Windows',
    summary:
      'Magyar fejlesztésű végeselemes (FEM) statikai és dinamikai méretezőszoftver Eurocode-szabvány szerinti vasbeton, acél és fa szerkezetekhez.',
    highlights: [
      'Eurocode (MSZ EN) szerinti méretezés',
      '3D végeselemes modell és szeizmikus analízis',
      'Kétirányú BIM kapcsolat Archicad/Revit felé',
    ],
    targetRoles: ['Statikus tervező', 'Tartószerkezeti mérnök'],
    websiteUrl: 'https://axisvm.eu/',
  },
  {
    id: 'planradar',
    name: 'PlanRadar',
    vendor: 'PlanRadar GmbH',
    category: 'projekt',
    categoryLabel: 'Projekt & Építésvezetés',
    license: 'SaaS előfizetés',
    platform: 'Web, iOS, Android',
    summary:
      'Digitális építési napló, hibafelvételi és kivitelezés-követő platform, amely az alaprajzokon rögzíti a feladatokat, fotókat és átadási jegyzőkönyveket.',
    highlights: [
      'Alaprajzhoz kötött hibajegyek és fotódokumentáció',
      'Offline mobilhasználat az építési területen',
      'Automatikus PDF átadási és műszaki ellenőr riportok',
    ],
    targetRoles: ['Építésvezető', 'Műszaki ellenőr', 'Fővállalkozó'],
    websiteUrl: 'https://www.planradar.com/hu/',
  },
  {
    id: 'dalux',
    name: 'Dalux Field & BIM Viewer',
    vendor: 'Dalux',
    category: 'projekt',
    categoryLabel: 'Projekt & Építésvezetés',
    license: 'Ingyenes Viewer / Pro előfizetés',
    platform: 'Web, iOS, Android',
    summary:
      'Helyszíni BIM modell-megjelenítő és minőségbiztosítási alkalmazás, amellyel a kivitelezők tableten tekinthetik meg a 3D terveket és metszeteket.',
    highlights: [
      'Gyors 3D BIM / IFC modell-nézegető mobilon',
      'AR (kiterjesztett valóság) tervvetítés a helyszínen',
      'Minőségbiztosítási és munkavédelmi ellenőrzőlisták',
    ],
    targetRoles: ['Kivitelező', 'Építésvezető', 'BIM koordinátor'],
    websiteUrl: 'https://www.dalux.com/',
  },
  {
    id: 'sketchup',
    name: 'SketchUp Pro',
    vendor: 'Trimble',
    category: 'bim_cad',
    categoryLabel: 'BIM & CAD Tervezés',
    license: 'Előfizetés / Oktatási',
    platform: 'Windows, macOS, Web',
    summary:
      'Gyors és intuitív 3D látvány- és tömegmodellező eszköz belsőépítészeti, kertépítészeti és koncepciótervek bemutatásához.',
    highlights: [
      'Gyors tanulási görbe és 3D Warehouse könyvtár',
      'Méretezett 2D Layout kimenetek',
      'Látványtervező render bővítmények (V-Ray, Enscape)',
    ],
    targetRoles: ['Belsőépítész', 'Asztalos', 'Kivitelező'],
    websiteUrl: 'https://www.sketchup.com/',
  },
];

const CATEGORY_TABS: Array<{ id: SoftwareCategory; label: string; icon: typeof Laptop }> = [
  { id: 'all', label: 'Összes szoftver', icon: Laptop },
  { id: 'bim_cad', label: 'BIM & CAD', icon: Compass },
  { id: 'koltsegvetes', label: 'Költségvetés', icon: Calculator },
  { id: 'statika', label: 'Statika', icon: Layers },
  { id: 'projekt', label: 'Építésvezetés', icon: ClipboardCheck },
];

export default function SoftwarePage({ onNavigate }: SoftwarePageProps) {
  const [selectedCategory, setSelectedCategory] = useState<SoftwareCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSoftware = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return SOFTWARE_CATALOG.filter((item) => {
      const matchCat = selectedCategory === 'all' || item.category === selectedCategory;
      const matchQuery =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.vendor.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.highlights.some((h) => h.toLowerCase().includes(q)) ||
        item.targetRoles.some((r) => r.toLowerCase().includes(q));
      return matchCat && matchQuery;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <div className="bg-[#f5f5f5] text-[#202628] min-h-screen pb-16">
      {/* Hero Header */}
      <div className="bg-primary text-white border-b border-primary-700 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <button
              onClick={() => onNavigate('home')}
              className="hover:text-white transition-colors flex items-center gap-1"
            >
              Főoldal
            </button>
            <ChevronRight size={13} />
            <button
              onClick={() => onNavigate('tool')}
              className="hover:text-white transition-colors"
            >
              Eszközök
            </button>
            <ChevronRight size={13} />
            <span className="text-gray-200 font-medium">Szoftverek</span>
          </div>

          <div className="space-y-2">
            <span className="inline-block px-3 py-1 bg-accent/20 border border-accent/40 text-accent font-semibold text-xs rounded-full">
              Digitális Eszközök
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Építőipari Szoftverek &amp; Digitális Alkalmazások
            </h1>
            <p className="text-gray-300 text-sm md:text-base max-w-3xl leading-relaxed">
              BIM tervezőszoftverek, CAD modellezők, költségvetés-készítő alkalmazások, statikai programok és építésvezetési eszközök áttekintő katalógusa.
            </p>
          </div>
        </div>
      </div>

      {/* Standardized Secondary Sub-navigation Bar */}
      <SectionSubNav
        ariaLabel="Eszközök navigáció"
        onNavigate={onNavigate}
        items={[
          {
            label: 'Gép & Szerszám Katalógus',
            page: 'tool',
            icon: <Wrench size={14} className="text-accent" />,
            active: false,
          },
          {
            label: 'Anyagok',
            page: 'materials',
            icon: <Layers size={14} className="text-accent" />,
            active: false,
          },
          {
            label: 'Szoftverek',
            page: 'software',
            icon: <Laptop size={14} className="text-accent" />,
            active: true,
          },
          {
            label: 'Eszközválasztó',
            page: 'valaszto',
            icon: <Sparkles size={14} className="text-accent" />,
            active: false,
          },
          {
            label: 'Szakmai Könyvek',
            page: 'books',
            icon: <Library size={14} className="text-accent" />,
            active: false,
          },
        ]}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        {/* Search & Filter Controls */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {CATEGORY_TABS.map((tab) => {
                const Icon = tab.icon;
                const active = selectedCategory === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSelectedCategory(tab.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      active
                        ? 'bg-primary text-white shadow-sm'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Icon size={14} className={active ? 'text-accent' : 'text-gray-500'} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="relative w-full md:w-72">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Keresés szoftverre, funkcióra..."
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
              />
            </div>
          </div>
        </div>

        {/* Results */}
        {filteredSoftware.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-200 p-10 text-center space-y-3 shadow-sm">
            <Laptop size={32} className="mx-auto text-gray-300" />
            <h2 className="text-lg font-extrabold text-gray-900">Nincs a keresésnek megfelelő szoftver</h2>
            <p className="text-xs text-gray-500">Próbáljon más kulcsszót vagy állítsa vissza a kategóriaszűrőt.</p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
              }}
              className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-600 transition-colors cursor-pointer"
            >
              Szűrők törlése
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredSoftware.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm hover:border-accent/60 transition-all flex flex-col justify-between space-y-5"
              >
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="px-3 py-1 bg-accent/15 border border-accent/30 text-amber-800 text-[11px] font-extrabold rounded-full">
                      {item.categoryLabel}
                    </span>
                    <span className="text-[11px] font-semibold text-gray-500">{item.platform}</span>
                  </div>

                  <div>
                    <h2 className="text-xl font-extrabold text-gray-900">{item.name}</h2>
                    <p className="text-xs font-semibold text-gray-500">
                      Fejlesztő: {item.vendor} • {item.license}
                    </p>
                  </div>

                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{item.summary}</p>

                  <ul className="space-y-1.5 pt-1">
                    {item.highlights.map((h) => (
                      <li key={h} className="flex items-start gap-2 text-xs text-gray-700">
                        <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-1.5">
                    {item.targetRoles.map((role) => (
                      <span
                        key={role}
                        className="px-2.5 py-0.5 bg-gray-100 text-gray-700 text-[11px] font-semibold rounded-lg"
                      >
                        {role}
                      </span>
                    ))}
                  </div>

                  <a
                    href={item.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-600 text-white text-xs font-bold rounded-xl transition-colors"
                  >
                    Hivatalos oldal <ExternalLink size={13} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="pt-2 flex justify-center">
          <button
            onClick={() => onNavigate('tool')}
            className="px-5 py-3 bg-white border border-gray-200 text-gray-800 text-xs font-bold rounded-xl hover:bg-gray-50 transition-colors inline-flex items-center gap-2 cursor-pointer shadow-2xs"
          >
            Vissza a Gép &amp; Szerszám Katalógushoz <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
