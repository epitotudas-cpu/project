import { useState, useMemo } from 'react';
import {
  Calculator,
  ChevronRight,
  FileText,
  BookOpen,
  Library,
  Layers,
  Home,
  Zap,
  CheckCircle2,
  AlertCircle,
  Copy,
  Printer,
  Sparkles,
  Info,
  RotateCcw,
  Check,
  Building,
  Maximize2,
} from 'lucide-react';
import SectionSubNav from '../components/SectionSubNav';

interface CalculationsPageProps {
  onNavigate: (page: string) => void;
}

type CalculatorTab = 'concrete' | 'masonry' | 'insulation' | 'tiling' | 'drywall' | 'roofing';

export default function CalculationsPage({ onNavigate }: CalculationsPageProps) {
  const [activeTab, setActiveTab] = useState<CalculatorTab>('concrete');
  const [copied, setCopied] = useState(false);

  // --------------------------------------------------------------------------
  // 1. BETON & ZSALUZAT STATE (Alapértelmezetten 0 értékek)
  // --------------------------------------------------------------------------
  const [concreteShape, setConcreteShape] = useState<'slab' | 'strip' | 'column'>('slab');
  const [cLength, setCLength] = useState<number>(0);
  const [cWidth, setCWidth] = useState<number>(0);
  const [cHeight, setCHeight] = useState<number>(0); // meters
  const [cCount, setCCount] = useState<number>(0); // for columns
  const [cGrade, setCGrade] = useState<'C12' | 'C16' | 'C20' | 'C25' | 'C30'>('C20');
  const [cWaste, setCWaste] = useState<number>(0); // %

  const concreteCalc = useMemo(() => {
    let netVol = 0;
    let formArea = 0;

    if (cLength > 0 && cWidth > 0 && cHeight > 0) {
      if (concreteShape === 'slab') {
        netVol = cLength * cWidth * cHeight;
        formArea = 2 * (cLength + cWidth) * cHeight;
      } else if (concreteShape === 'strip') {
        netVol = cLength * cWidth * cHeight;
        formArea = 2 * cLength * cHeight;
      } else {
        // column
        netVol = cLength * cWidth * cHeight * (cCount || 1);
        formArea = 2 * (cLength + cWidth) * cHeight * (cCount || 1);
      }
    }

    const grossVol = netVol * (1 + (cWaste || 0) / 100);

    const cementRatioMap = { C12: 230, C16: 270, C20: 320, C25: 360, C30: 400 };
    const cementKgPerM3 = cementRatioMap[cGrade];
    const totalCementKg = grossVol > 0 ? Math.ceil(grossVol * cementKgPerM3) : 0;
    const cementBags25kg = Math.ceil(totalCementKg / 25);

    const soderTons = grossVol > 0 ? Number((grossVol * 1.85).toFixed(2)) : 0;
    const soderM3 = grossVol > 0 ? Number((grossVol * 1.15).toFixed(2)) : 0;
    const waterLiters = totalCementKg > 0 ? Math.ceil(totalCementKg * 0.55) : 0;

    const rebarRatio = concreteShape === 'column' ? 110 : concreteShape === 'strip' ? 80 : 65;
    const rebarKg = grossVol > 0 ? Math.ceil(grossVol * rebarRatio) : 0;

    return {
      netVol: Number(netVol.toFixed(2)),
      grossVol: Number(grossVol.toFixed(2)),
      formArea: Number(formArea.toFixed(2)),
      cementBags25kg,
      totalCementKg,
      soderTons,
      soderM3,
      waterLiters,
      rebarKg,
    };
  }, [concreteShape, cLength, cWidth, cHeight, cCount, cGrade, cWaste]);

  // --------------------------------------------------------------------------
  // 2. FALAZÓANYAG & HABARCS STATE (Alapértelmezetten 0 értékek)
  // --------------------------------------------------------------------------
  const [brickType, setBrickType] = useState<'pth30' | 'pth44' | 'ytong30' | 'b30' | 'zsaluko30'>('pth30');
  const [wLength, setWLength] = useState<number>(0);
  const [wHeight, setWHeight] = useState<number>(0);
  const [wDeduction, setWDeduction] = useState<number>(0); // m2 windows/doors
  const [wWaste, setWWaste] = useState<number>(0);

  const masonryCalc = useMemo(() => {
    const grossArea = wLength * wHeight;
    const netArea = Math.max(0, grossArea - wDeduction);

    const specs = {
      pth30: { name: 'Porotherm 30 N+F', pcsM2: 16, palletPcs: 80, mortarL: 24, isZsaluko: false },
      pth44: { name: 'Porotherm 44 Thermo Profi', pcsM2: 16, palletPcs: 60, mortarL: 35, isZsaluko: false },
      ytong30: { name: 'Ytong A+ 30 cm', pcsM2: 6.67, palletPcs: 40, mortarL: 5, isZsaluko: false },
      b30: { name: 'Hagyományos B30 tégla', pcsM2: 36, palletPcs: 240, mortarL: 45, isZsaluko: false },
      zsaluko30: { name: 'Zsalukő 30 cm (50x30x23 cm)', pcsM2: 8.7, palletPcs: 40, mortarL: 0, isZsaluko: true },
    }[brickType];

    const netPcs = netArea * specs.pcsM2;
    const grossPcs = netPcs > 0 ? Math.ceil(netPcs * (1 + (wWaste || 0) / 100)) : 0;
    const pallets = grossPcs > 0 ? Math.ceil(grossPcs / specs.palletPcs) : 0;

    let mortarBags = 0;
    let zsalukoConcreteM3 = 0;

    if (netArea > 0) {
      if (specs.isZsaluko) {
        zsalukoConcreteM3 = Number((netArea * 0.19).toFixed(2));
      } else {
        const totalMortarLiters = netArea * specs.mortarL;
        mortarBags = Math.ceil(totalMortarLiters / 16);
      }
    }

    return {
      netArea: Number(netArea.toFixed(2)),
      grossPcs,
      pallets,
      mortarBags,
      zsalukoConcreteM3,
      brickName: specs.name,
      isZsaluko: specs.isZsaluko,
    };
  }, [brickType, wLength, wHeight, wDeduction, wWaste]);

  // --------------------------------------------------------------------------
  // 3. HŐSZIGETELÉS & U-ÉRTÉK STATE (Alapértelmezetten 0 értékek)
  // --------------------------------------------------------------------------
  const [wallBase, setWallBase] = useState<'b30' | 'pth30' | 'concrete'>('pth30');
  const [insulationMat, setInsulationMat] = useState<'eps' | 'grafit' | 'kozetgyapot' | 'xps' | 'pir'>('grafit');
  const [insulationCm, setInsulationCm] = useState<number>(0);
  const [insArea, setInsArea] = useState<number>(0); // m2

  const insulationCalc = useMemo(() => {
    const baseWallSpecs = {
      b30: { name: 'B30 Téglafal (30 cm)', R: 0.60 },
      pth30: { name: 'Porotherm 30 N+F (30 cm)', R: 1.12 },
      concrete: { name: 'Vasbeton fal (20 cm)', R: 0.12 },
    }[wallBase];

    const matSpecs = {
      eps: { name: 'EPS 80 Fehér polisztirol', lambda: 0.039 },
      grafit: { name: 'Grafitos EPS 80 polisztirol', lambda: 0.031 },
      kozetgyapot: { name: 'Kőzetgyapot homlokzati tábla', lambda: 0.035 },
      xps: { name: 'XPS lábazati zártcellás hab', lambda: 0.034 },
      pir: { name: 'PIR keményhab tábla', lambda: 0.022 },
    }[insulationMat];

    const R_insulation = insulationCm > 0 ? (insulationCm / 100) / matSpecs.lambda : 0;
    const R_total = baseWallSpecs.R + R_insulation + 0.17;
    const uValue = Number((1 / R_total).toFixed(3));

    const passesKNE = uValue <= 0.24;

    const adhesiveBags = insArea > 0 ? Math.ceil((insArea * 9) / 25) : 0;
    const meshM2 = insArea > 0 ? Math.ceil(insArea * 1.1) : 0;
    const boardPcs = insArea > 0 ? Math.ceil(insArea * 2) : 0;

    return {
      baseName: baseWallSpecs.name,
      matName: matSpecs.name,
      uValue,
      passesKNE,
      adhesiveBags,
      meshM2,
      boardPcs,
    };
  }, [wallBase, insulationMat, insulationCm, insArea]);

  // --------------------------------------------------------------------------
  // 4. VAKOLAT, ESZTRICH & BURKOLAT STATE (Alapértelmezetten 0 értékek)
  // --------------------------------------------------------------------------
  const [tilingType, setTilingType] = useState<'tile' | 'screed' | 'plaster'>('tile');
  const [tArea, setTArea] = useState<number>(0); // m2
  const [tTileSize, setTTileSize] = useState<'30x30' | '60x60' | '30x60'>('60x60');
  const [tThicknessMm, setTThicknessMm] = useState<number>(0); // for screed/plaster mm
  const [tWaste, setTWaste] = useState<number>(0);

  const tilingCalc = useMemo(() => {
    let tilesM2 = 0;
    let adhesiveBags = 0;
    let groutKg = 0;
    let screedBags = 0;
    let primerLiters = 0;

    if (tArea > 0) {
      if (tilingType === 'tile') {
        tilesM2 = Math.ceil(tArea * (1 + (tWaste || 0) / 100));
        const kgPerM2 = tTileSize === '60x60' ? 4.8 : 3.8;
        adhesiveBags = Math.ceil((tArea * kgPerM2) / 25);
        groutKg = Math.ceil(tArea * 0.4);
      } else {
        const totalDryKg = tArea * (tThicknessMm / 10) * 19;
        screedBags = Math.ceil(totalDryKg / 25);
      }

      primerLiters = Math.ceil(tArea * 0.15);
    }

    return {
      tilesM2,
      adhesiveBags,
      groutKg,
      screedBags,
      primerLiters,
    };
  }, [tilingType, tArea, tTileSize, tThicknessMm, tWaste]);

  // --------------------------------------------------------------------------
  // 5. GIPSZKARTON & SZÁRAZÉPÍTÉSZET STATE (Alapértelmezetten 0 értékek)
  // --------------------------------------------------------------------------
  const [dwType, setDwType] = useState<'wall1' | 'wall2' | 'ceiling'>('wall1');
  const [dwArea, setDwArea] = useState<number>(0); // m2
  const [dwBoardType, setDwBoardType] = useState<'rb' | 'rbi' | 'rf'>('rb');

  const drywallCalc = useMemo(() => {
    const boardSizeM2 = 2.4;
    const layers = dwType === 'wall2' ? 2 : 1;
    const boardCount = dwArea > 0 ? Math.ceil((dwArea * layers * 1.05) / boardSizeM2) : 0;

    const mainProfileFm = dwArea > 0 ? Math.ceil(dwArea * 2.8) : 0;
    const perimeterProfileFm = dwArea > 0 ? Math.ceil(Math.sqrt(dwArea) * 4 * 1.2) : 0;

    const jointFillerKg = dwArea > 0 ? Math.ceil(dwArea * layers * 0.5) : 0;
    const screwsPcs = dwArea > 0 ? Math.ceil(dwArea * layers * 18) : 0;
    const tapeM = dwArea > 0 ? Math.ceil(dwArea * 1.5) : 0;

    const boardNames = {
      rb: 'Normál RB Gipszkarton (12.5mm)',
      rbi: 'Impregnált RBI Vízálló (12.5mm)',
      rf: 'Tűzgátló RF Rózsaszín (12.5mm)',
    }[dwBoardType];

    return {
      boardCount,
      boardNames,
      mainProfileFm,
      perimeterProfileFm,
      jointFillerKg,
      screwsPcs,
      tapeM,
    };
  }, [dwType, dwArea, dwBoardType]);

  // --------------------------------------------------------------------------
  // 6. TETŐFEDÉS & CSERÉP STATE (Alapértelmezetten 0 értékek)
  // --------------------------------------------------------------------------
  const [roofFootprint, setRoofFootprint] = useState<number>(0); // m2 ground footprint
  const [roofAngle, setRoofAngle] = useState<number>(0); // degrees
  const [tileType, setTileType] = useState<'ceramic' | 'concrete' | 'sheet'>('ceramic');

  const roofingCalc = useMemo(() => {
    let actualRoofArea = 0;
    let totalTiles = 0;
    let battenFm = 0;
    let membraneM2 = 0;
    let ridgeTiles = 0;

    if (roofFootprint > 0) {
      const rad = (roofAngle * Math.PI) / 180;
      const pitchMultiplier = 1 / Math.cos(rad);
      actualRoofArea = Number((roofFootprint * pitchMultiplier * 1.1).toFixed(1));

      const tilePcsPerM2 = tileType === 'ceramic' ? 10.5 : tileType === 'concrete' ? 9.8 : 1;
      totalTiles = Math.ceil(actualRoofArea * tilePcsPerM2 * 1.06);

      battenFm = Math.ceil(actualRoofArea * 3.2);
      membraneM2 = Math.ceil(actualRoofArea * 1.15);
      ridgeTiles = Math.ceil(Math.sqrt(roofFootprint) * 1.4 * 3);
    }

    return {
      actualRoofArea,
      totalTiles,
      battenFm,
      membraneM2,
      ridgeTiles,
    };
  }, [roofFootprint, roofAngle, tileType]);

  // --------------------------------------------------------------------------
  // SUMMARY TEXT GENERATOR & COPY ACTION
  // --------------------------------------------------------------------------
  const getActiveSummaryText = () => {
    let text = `=== ÉPÍTŐTUDÁS SZÁMÍTÁSI ÖSSZEGZŐ ===\nModul: `;
    if (activeTab === 'concrete') {
      text += `Beton & Zsaluzat Kalkulátor\n`;
      text += `- Típus / Alak: ${concreteShape}\n`;
      text += `- Nettó térfogat: ${concreteCalc.netVol} m³\n`;
      text += `- Bruttó betonigény (${cWaste}% ráhagyással): ${concreteCalc.grossVol} m³\n`;
      text += `- Beton minőség: ${cGrade}\n`;
      text += `- Cement szükséglet: ${concreteCalc.cementBags25kg} zsák (25 kg/zsák - össz: ${concreteCalc.totalCementKg} kg)\n`;
      text += `- Sóder szükséglet: ${concreteCalc.soderTons} tonna (~${concreteCalc.soderM3} m³)\n`;
      text += `- Becsült betonacél: ${concreteCalc.rebarKg} kg\n`;
      text += `- Zsaluzási felület: ${concreteCalc.formArea} m²\n`;
    } else if (activeTab === 'masonry') {
      text += `Falazóanyag & Habarcs Kalkulátor\n`;
      text += `- Téglatípus: ${masonryCalc.brickName}\n`;
      text += `- Nettó falfelület: ${masonryCalc.netArea} m²\n`;
      text += `- Szükséges téglaszám (${wWaste}% vágási veszteséggel): ${masonryCalc.grossPcs} db\n`;
      text += `- Kerekített raklapszám: ${masonryCalc.pallets} raklap\n`;
      if (masonryCalc.isZsaluko) {
        text += `- Kiöntőbeton szükséglet: ${masonryCalc.zsalukoConcreteM3} m³\n`;
      } else {
        text += `- Falazóhabarcs (25kg zsák): ${masonryCalc.mortarBags} zsák\n`;
      }
    } else if (activeTab === 'insulation') {
      text += `Hőszigetelés & U-érték Energetikai Kalkulátor\n`;
      text += `- Meglévő szerkezet: ${insulationCalc.baseName}\n`;
      text += `- Hőszigetelés: ${insulationCalc.matName} (${insulationCm} cm)\n`;
      text += `- Eredő hőátbocsátási tényező (U-érték): ${insulationCalc.uValue} W/m²K\n`;
      text += `- KNE 7/2006 Energetikai Minősítés: ${insulationCalc.passesKNE ? 'MEGFELELT (U <= 0.24 W/m²K)' : 'NEM FELELT MEG (Vastagabb szigetelés javasolt!)'}\n`;
      text += `- Hőszigetelő táblák száma: ${insulationCalc.boardPcs} db\n`;
      text += `- Ragasztó- és beágyazó habarcs: ${insulationCalc.adhesiveBags} zsák (25 kg/zsák)\n`;
      text += `- Üvegszövet háló: ${insulationCalc.meshM2} m²\n`;
    } else if (activeTab === 'tiling') {
      text += `Vakolat, Esztrich & Burkolat Kalkulátor\n`;
      if (tilingType === 'tile') {
        text += `- Burkolólap igény (${tWaste}% vágási veszteséggel): ${tilingCalc.tilesM2} m²\n`;
        text += `- Csemperagasztó: ${tilingCalc.adhesiveBags} zsák (25 kg/zsák)\n`;
        text += `- Fugázó anyag: ${tilingCalc.groutKg} kg\n`;
      } else {
        text += `- Szárazesztrich / Vakolat habarcs: ${tilingCalc.screedBags} zsák (25 kg/zsák)\n`;
      }
      text += `- Mélyalapozó: ${tilingCalc.primerLiters} liter\n`;
    } else if (activeTab === 'drywall') {
      text += `Gipszkarton Kalkulátor\n`;
      text += `- Karton típus: ${drywallCalc.boardNames}\n`;
      text += `- Táblaszám (120x200cm): ${drywallCalc.boardCount} db\n`;
      text += `- Főprofilok (CW/CD): ${drywallCalc.mainProfileFm} fm\n`;
      text += `- Keretprofilok (UW/UD): ${drywallCalc.perimeterProfileFm} fm\n`;
      text += `- Hézagoló gipsz: ${drywallCalc.jointFillerKg} kg\n`;
      text += `- Rögzítőcsavarok: ${drywallCalc.screwsPcs} db\n`;
    } else if (activeTab === 'roofing') {
      text += `Tetőfedés & Cserép Kalkulátor\n`;
      text += `- Valós tetőfelület (${roofAngle}° dőlésszöggel): ${roofingCalc.actualRoofArea} m²\n`;
      text += `- Szükséges cserepek / lemez: ${roofingCalc.totalTiles} db\n`;
      text += `- Kúpcserép: ${roofingCalc.ridgeTiles} db\n`;
      text += `- Tetőléc szükséglet: ${roofingCalc.battenFm} fm\n`;
      text += `- Páraáteresztő tetőfólia: ${roofingCalc.membraneM2} m²\n`;
    }

    text += `\nGenerálva az ÉpítőTudás Építőipari Számítási Moduljával (${new Date().toLocaleDateString('hu-HU')})`;
    return text;
  };

  const handleCopySummary = () => {
    navigator.clipboard.writeText(getActiveSummaryText());
    setCopied(true);
    setTimeout(() => setCopied(false), 3500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-[#f8fafc] text-[#1e293b] min-h-screen pb-20">
      {/* Hero Header */}
      <div className="bg-primary text-white border-b border-primary-700 py-10 px-4 sm:px-6 lg:px-8">
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
              onClick={() => onNavigate('tudastar')}
              className="hover:text-white transition-colors"
            >
              Tudástár
            </button>
            <ChevronRight size={13} />
            <span className="text-gray-200 font-medium">Számítások</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-accent/20 border border-accent/40 text-accent font-bold text-xs rounded-full">
                <Sparkles size={13} /> Profi Építőipari Számítási Központ
              </span>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                Interaktív Építőipari Számítások &amp; Kalkulátorok
              </h1>
              <p className="text-gray-300 text-sm md:text-base max-w-3xl leading-relaxed">
                Prezíz anyagszükséglet-számítások, zsaluzási és betonszükséglet kalkulációk, U-érték energetikai ellenőrzés a magyar szabványoknak megfelelően.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleCopySummary}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-accent hover:bg-accent-hover text-primary font-bold text-xs rounded-xl shadow-lg transition-all transform active:scale-95"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Másolva a vágólapra!' : 'Anyagkiírás Másolása'}
              </button>
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-medium text-xs rounded-xl border border-white/20 transition-all"
                title="Nyomtatás vagy PDF mentése"
              >
                <Printer size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-navigation */}
      <SectionSubNav
        ariaLabel="Tudástár navigáció"
        onNavigate={onNavigate}
        items={[
          {
            label: 'Cikkek',
            page: 'category',
            icon: <FileText size={14} className="text-accent" />,
            active: false,
          },
          {
            label: 'Fogalomtár',
            page: 'glossary',
            icon: <BookOpen size={14} className="text-accent" />,
            active: false,
          },
          {
            label: 'Számítások',
            page: 'calculations',
            icon: <Calculator size={14} className="text-accent" />,
            active: true,
          },
          {
            label: 'Szakmai könyvek',
            page: 'books',
            icon: <Library size={14} className="text-accent" />,
            active: false,
          },
        ]}
      />

      {/* Calculator Tab Selector */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 bg-white p-2 rounded-2xl border border-gray-200 shadow-sm">
          {[
            { id: 'concrete', label: 'Beton & Zsaluzat', icon: <Building size={16} /> },
            { id: 'masonry', label: 'Falazás & Tégla', icon: <Home size={16} /> },
            { id: 'insulation', label: 'Hőszigetelés (U)', icon: <Zap size={16} /> },
            { id: 'tiling', label: 'Burkolat & Vakolat', icon: <Layers size={16} /> },
            { id: 'drywall', label: 'Gipszkarton', icon: <Maximize2 size={16} /> },
            { id: 'roofing', label: 'Tető & Cserép', icon: <Home size={16} /> },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as CalculatorTab)}
                className={`flex items-center justify-center gap-2 px-3 py-3 rounded-xl font-bold text-xs transition-all ${
                  isActive
                    ? 'bg-primary text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Interactive Calculation Panel */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: INPUT CONTROLS (7 Cols) */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-gray-200 p-6 md:p-8 shadow-sm space-y-6">
            
            {/* ---------------------------------------------------------------- */}
            {/* 1. BETON & ZSALUZAT TAB */}
            {/* ---------------------------------------------------------------- */}
            {activeTab === 'concrete' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center font-bold">
                      <Building size={20} />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-gray-900">Betonszükséglet &amp; Zsaluzási Kalkulátor</h2>
                      <p className="text-xs text-gray-500">Sávalapok, lemezek, pillérek és födémek méretezése</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setCLength(0); setCWidth(0); setCHeight(0); setCCount(0); setCWaste(0); }}
                    className="text-xs text-gray-400 hover:text-primary flex items-center gap-1"
                    title="Alaphelyzet"
                  >
                    <RotateCcw size={12} /> Visszaállítás (0)
                  </button>
                </div>

                {/* Concrete Shape Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Szerkezet Típusa</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'slab', label: 'Lemezalap / Födém' },
                      { id: 'strip', label: 'Sávalap' },
                      { id: 'column', label: 'Pillér / Gerenda' },
                    ].map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setConcreteShape(s.id as any)}
                        className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                          concreteShape === s.id
                            ? 'bg-primary text-white border-primary shadow-sm'
                            : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dimension Sliders / Numeric Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">Hosszúság (méter)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={cLength || ''}
                      placeholder="0"
                      onChange={(e) => setCLength(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold text-gray-900 focus:outline-none focus:border-accent"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">Szélesség (méter)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={cWidth || ''}
                      placeholder="0"
                      onChange={(e) => setCWidth(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold text-gray-900 focus:outline-none focus:border-accent"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">Magasság / Vastagság (m)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="5"
                      value={cHeight || ''}
                      placeholder="0"
                      onChange={(e) => setCHeight(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold text-gray-900 focus:outline-none focus:border-accent"
                    />
                  </div>
                </div>

                {concreteShape === 'column' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">Pillérek Darabszáma</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={cCount || ''}
                      placeholder="0"
                      onChange={(e) => setCCount(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold text-gray-900 focus:outline-none focus:border-accent"
                    />
                  </div>
                )}

                {/* Grade and Waste Margin */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">Beton Minőségi Osztály</label>
                    <select
                      value={cGrade}
                      onChange={(e) => setCGrade(e.target.value as any)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold text-gray-900 focus:outline-none focus:border-accent"
                    >
                      <option value="C12">C12/15 (Szerelőbeton / Aljzat)</option>
                      <option value="C16">C16/20 (Sávalap / Kerítésalap)</option>
                      <option value="C20">C20/25 (Szerkezeti / Födém / NORMÁL)</option>
                      <option value="C25">C25/30 (Vízzáró lemezalap)</option>
                      <option value="C30">C30/37 (Nagy teherbírású ipari)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">Tömörödési Ráhagyás (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={cWaste || ''}
                      placeholder="0"
                      onChange={(e) => setCWaste(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold text-gray-900 focus:outline-none focus:border-accent"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ---------------------------------------------------------------- */}
            {/* 2. FALAZÓANYAG & HABARCS TAB */}
            {/* ---------------------------------------------------------------- */}
            {activeTab === 'masonry' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center font-bold">
                      <Home size={20} />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-gray-900">Falazóanyag &amp; Habarcs Kalkulátor</h2>
                      <p className="text-xs text-gray-500">Téglák, zsalukövek, nyílászáró levonások és habarcsigény</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setWLength(0); setWHeight(0); setWDeduction(0); setWWaste(0); }}
                    className="text-xs text-gray-400 hover:text-primary flex items-center gap-1"
                    title="Alaphelyzet"
                  >
                    <RotateCcw size={12} /> Visszaállítás (0)
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Tégla / Blokkelem Típusa</label>
                  <select
                    value={brickType}
                    onChange={(e) => setBrickType(e.target.value as any)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-bold text-gray-900 focus:outline-none focus:border-accent"
                  >
                    <option value="pth30">Porotherm 30 N+F (30x25x23.8 cm)</option>
                    <option value="pth44">Porotherm 44 Thermo Profi (44 cm csiszolt)</option>
                    <option value="ytong30">Ytong A+ 30 cm Pórusbeton</option>
                    <option value="b30">Hagyományos B30 Tégla</option>
                    <option value="zsaluko30">Zsalukő 30 cm (50x30x23 cm betonblokk)</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">Fal Hosszúság (m)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={wLength || ''}
                      placeholder="0"
                      onChange={(e) => setWLength(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold text-gray-900 focus:outline-none focus:border-accent"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">Fal Magasság (m)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={wHeight || ''}
                      placeholder="0"
                      onChange={(e) => setWHeight(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold text-gray-900 focus:outline-none focus:border-accent"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">Ajtók / Ablakok (m² levonás)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={wDeduction || ''}
                      placeholder="0"
                      onChange={(e) => setWDeduction(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold text-gray-900 focus:outline-none focus:border-accent"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700">Vágási Veszteség Ráhagyás (%)</label>
                  <input
                    type="number"
                    min="0"
                    value={wWaste || ''}
                    placeholder="0"
                    onChange={(e) => setWWaste(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold text-gray-900 focus:outline-none focus:border-accent"
                  />
                </div>
              </div>
            )}

            {/* ---------------------------------------------------------------- */}
            {/* 3. HŐSZIGETELÉS & U-ÉRTÉK TAB */}
            {/* ---------------------------------------------------------------- */}
            {activeTab === 'insulation' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center font-bold">
                      <Zap size={20} />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-gray-900">Hőszigetelés &amp; U-érték Energetikai Kalkulátor</h2>
                      <p className="text-xs text-gray-500">TN/KNE szabvány ellenőrzés és anyagkiírás</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setInsulationCm(0); setInsArea(0); }}
                    className="text-xs text-gray-400 hover:text-primary flex items-center gap-1"
                    title="Alaphelyzet"
                  >
                    <RotateCcw size={12} /> Visszaállítás (0)
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">Meglévő Falazat / Szerkezet</label>
                    <select
                      value={wallBase}
                      onChange={(e) => setWallBase(e.target.value as any)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold text-gray-900"
                    >
                      <option value="pth30">Porotherm 30 N+F téglafal</option>
                      <option value="b30">B30 Hagyományos téglafal</option>
                      <option value="concrete">Vasbeton fal (20 cm)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">Hőszigetelő Anyag Típusa</label>
                    <select
                      value={insulationMat}
                      onChange={(e) => setInsulationMat(e.target.value as any)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold text-gray-900"
                    >
                      <option value="grafit">Grafitos EPS 80 (λ = 0.031 W/mK)</option>
                      <option value="eps">EPS 80 Fehér Polisztirol (λ = 0.039 W/mK)</option>
                      <option value="kozetgyapot">Kőzetgyapot Homlokzati (λ = 0.035 W/mK)</option>
                      <option value="xps">XPS Lábazati Lap (λ = 0.034 W/mK)</option>
                      <option value="pir">PIR Keményhab Tábla (λ = 0.022 W/mK)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">Hőszigetelés Vastagsága (cm)</label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      max="40"
                      value={insulationCm || ''}
                      placeholder="0"
                      onChange={(e) => setInsulationCm(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold text-gray-900"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">Szigetelendő Felület (m²)</label>
                    <input
                      type="number"
                      min="0"
                      value={insArea || ''}
                      placeholder="0"
                      onChange={(e) => setInsArea(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold text-gray-900"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ---------------------------------------------------------------- */}
            {/* 4. BURKOLAT & VAKOLAT TAB */}
            {/* ---------------------------------------------------------------- */}
            {activeTab === 'tiling' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center font-bold">
                      <Layers size={20} />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-gray-900">Vakolat, Esztrich &amp; Hidegburkolat Kalkulátor</h2>
                      <p className="text-xs text-gray-500">Csemperagasztó, fugázó, esztrich zsákos kiszerelések</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setTArea(0); setTThicknessMm(0); setTWaste(0); }}
                    className="text-xs text-gray-400 hover:text-primary flex items-center gap-1"
                    title="Alaphelyzet"
                  >
                    <RotateCcw size={12} /> Visszaállítás (0)
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">Munkálat Típusa</label>
                    <select
                      value={tilingType}
                      onChange={(e) => setTilingType(e.target.value as any)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold text-gray-900"
                    >
                      <option value="tile">Hidegburkolás (Csempe / Járólap)</option>
                      <option value="screed">Esztrich Aljzatbeton / Vakolás</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">Alapterület / Falfelület (m²)</label>
                    <input
                      type="number"
                      min="0"
                      value={tArea || ''}
                      placeholder="0"
                      onChange={(e) => setTArea(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold text-gray-900"
                    />
                  </div>
                </div>

                {tilingType === 'tile' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700">Lap Méret</label>
                      <select
                        value={tTileSize}
                        onChange={(e) => setTTileSize(e.target.value as any)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold text-gray-900"
                      >
                        <option value="60x60">60 x 60 cm (Gres lap)</option>
                        <option value="30x60">30 x 60 cm (Csempe)</option>
                        <option value="30x30">30 x 30 cm (Kerámia)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700">Vágási Veszteség (%)</label>
                      <input
                        type="number"
                        min="0"
                        value={tWaste || ''}
                        placeholder="0"
                        onChange={(e) => setTWaste(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold text-gray-900"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">Rétegvastagság (milliméter)</label>
                    <input
                      type="number"
                      min="0"
                      value={tThicknessMm || ''}
                      placeholder="0"
                      onChange={(e) => setTThicknessMm(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold text-gray-900"
                    />
                  </div>
                )}
              </div>
            )}

            {/* ---------------------------------------------------------------- */}
            {/* 5. GIPSZKARTON TAB */}
            {/* ---------------------------------------------------------------- */}
            {activeTab === 'drywall' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-teal-600 flex items-center justify-center font-bold">
                      <Maximize2 size={20} />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-gray-900">Gipszkarton &amp; Szárazépítészet Kalkulátor</h2>
                      <p className="text-xs text-gray-500">Profilok (CW/UW/CD/UD), gipszkarton táblák és csavarok</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setDwArea(0); }}
                    className="text-xs text-gray-400 hover:text-primary flex items-center gap-1"
                    title="Alaphelyzet"
                  >
                    <RotateCcw size={12} /> Visszaállítás (0)
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">Szerkezet Típusa</label>
                    <select
                      value={dwType}
                      onChange={(e) => setDwType(e.target.value as any)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold text-gray-900"
                    >
                      <option value="wall1">Előtétfal / Válaszfal (1 réteg)</option>
                      <option value="wall2">Válaszfal (2 réteg duplázott)</option>
                      <option value="ceiling">Álmennyezet szerkezet</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">Karton Lap Típusa</label>
                    <select
                      value={dwBoardType}
                      onChange={(e) => setDwBoardType(e.target.value as any)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold text-gray-900"
                    >
                      <option value="rb">Normál RB (Szürke)</option>
                      <option value="rbi">Impregnált RBI Vízálló (Zöld)</option>
                      <option value="rf">Tűzgátló RF (Rózsaszín)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">Felület (m²)</label>
                    <input
                      type="number"
                      min="0"
                      value={dwArea || ''}
                      placeholder="0"
                      onChange={(e) => setDwArea(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold text-gray-900"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ---------------------------------------------------------------- */}
            {/* 6. TETŐFEDÉS TAB */}
            {/* ---------------------------------------------------------------- */}
            {activeTab === 'roofing' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center font-bold">
                      <Home size={20} />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-gray-900">Tetőfedés &amp; Cserép Kalkulátor</h2>
                      <p className="text-xs text-gray-500">Dőlésszög korrekció, tetőléc és páraáteresztő fólia</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setRoofFootprint(0); setRoofAngle(0); }}
                    className="text-xs text-gray-400 hover:text-primary flex items-center gap-1"
                    title="Alaphelyzet"
                  >
                    <RotateCcw size={12} /> Visszaállítás (0)
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">Alapterület (m² alapterület)</label>
                    <input
                      type="number"
                      min="0"
                      value={roofFootprint || ''}
                      placeholder="0"
                      onChange={(e) => setRoofFootprint(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold text-gray-900"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">Tető Dőlésszög (Fok °)</label>
                    <input
                      type="number"
                      min="0"
                      max="65"
                      value={roofAngle || ''}
                      placeholder="0"
                      onChange={(e) => setRoofAngle(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold text-gray-900"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">Fedés Típusa</label>
                    <select
                      value={tileType}
                      onChange={(e) => setTileType(e.target.value as any)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold text-gray-900"
                    >
                      <option value="ceramic">Kerámia Cserép (~10.5 db/m²)</option>
                      <option value="concrete">Beton Cserép (~9.8 db/m²)</option>
                      <option value="sheet">Cserepeslemez / Zsindely</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Standard Warning / Info note */}
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl flex items-start gap-3 text-xs text-gray-600">
              <Info size={18} className="text-accent shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                A számítások a magyar építőipari gyakorlat és gyártói normatáblázatok alapján készülnek. Kivitelezés előtt kérjük, konzultáljon a felelős műszaki vezetővel vagy építész tervezővel!
              </p>
            </div>
          </div>

          {/* RIGHT COLUMN: LIVE CALCULATION RESULTS & MATERIAL SUMMARY (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-primary text-white rounded-3xl p-6 md:p-8 shadow-xl border border-primary-700 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                <Calculator size={140} />
              </div>

              <div className="space-y-6 relative z-10">
                <div className="flex items-center justify-between border-b border-primary-700 pb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-accent flex items-center gap-1.5">
                    <Sparkles size={14} /> Számított Anyagszükséglet
                  </span>
                  <span className="text-[11px] bg-white/10 text-gray-300 px-2.5 py-1 rounded-full font-mono">
                    ÉpítőTudás Engine
                  </span>
                </div>

                {/* 1. BETON RESULTS */}
                {activeTab === 'concrete' && (
                  <div className="space-y-4">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-1">
                      <span className="text-xs text-gray-400 font-medium">Bruttó Betonigény ({cWaste}% veszteséggel)</span>
                      <div className="text-3xl font-black text-accent">{concreteCalc.grossVol} m³</div>
                      <p className="text-[11px] text-gray-300">Nettó térfogat: {concreteCalc.netVol} m³</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-white/5 p-3 rounded-xl space-y-0.5 border border-white/5">
                        <span className="text-gray-400">Cement (25kg zsák)</span>
                        <div className="text-base font-bold text-white">{concreteCalc.cementBags25kg} zsák</div>
                        <span className="text-[10px] text-gray-400">({concreteCalc.totalCementKg} kg)</span>
                      </div>
                      <div className="bg-white/5 p-3 rounded-xl space-y-0.5 border border-white/5">
                        <span className="text-gray-400">Sóder szükséglet</span>
                        <div className="text-base font-bold text-white">{concreteCalc.soderTons} t</div>
                        <span className="text-[10px] text-gray-400">(~{concreteCalc.soderM3} m³)</span>
                      </div>
                      <div className="bg-white/5 p-3 rounded-xl space-y-0.5 border border-white/5">
                        <span className="text-gray-400">Becsült Betonacél</span>
                        <div className="text-base font-bold text-accent">{concreteCalc.rebarKg} kg</div>
                      </div>
                      <div className="bg-white/5 p-3 rounded-xl space-y-0.5 border border-white/5">
                        <span className="text-gray-400">Zsalufelület</span>
                        <div className="text-base font-bold text-white">{concreteCalc.formArea} m²</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. MASONRY RESULTS */}
                {activeTab === 'masonry' && (
                  <div className="space-y-4">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-1">
                      <span className="text-xs text-gray-400 font-medium">Tégla / Blokkelem Igény</span>
                      <div className="text-3xl font-black text-accent">{masonryCalc.grossPcs} db</div>
                      <p className="text-[11px] text-gray-300">Nettó falfelület: {masonryCalc.netArea} m²</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-white/5 p-3 rounded-xl space-y-0.5 border border-white/5">
                        <span className="text-gray-400">Raklapszám</span>
                        <div className="text-base font-bold text-white">{masonryCalc.pallets} raklap</div>
                      </div>
                      {masonryCalc.isZsaluko ? (
                        <div className="bg-white/5 p-3 rounded-xl space-y-0.5 border border-white/5">
                          <span className="text-gray-400">Kiöntőbeton</span>
                          <div className="text-base font-bold text-accent">{masonryCalc.zsalukoConcreteM3} m³</div>
                        </div>
                      ) : (
                        <div className="bg-white/5 p-3 rounded-xl space-y-0.5 border border-white/5">
                          <span className="text-gray-400">Falazóhabarcs (25kg)</span>
                          <div className="text-base font-bold text-accent">{masonryCalc.mortarBags} zsák</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 3. INSULATION RESULTS */}
                {activeTab === 'insulation' && (
                  <div className="space-y-4">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400 font-medium">Eredő U-érték</span>
                        {insulationCm === 0 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-gray-500/20 text-gray-300 px-2 py-0.5 rounded-full border border-gray-500/40">
                            Nincs hőszigetelés megadva
                          </span>
                        ) : insulationCalc.passesKNE ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/40">
                            <CheckCircle2 size={12} /> MEGFELELT (KNE TNM)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full border border-red-500/40">
                            <AlertCircle size={12} /> NEM FELEL MEG
                          </span>
                        )}
                      </div>
                      <div className="text-3xl font-black text-accent">{insulationCalc.uValue} W/m²K</div>
                      <p className="text-[11px] text-gray-300">Magyar KNE energetikai küszöbérték: ≤ 0.24 W/m²K</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-white/5 p-3 rounded-xl space-y-0.5 border border-white/5">
                        <span className="text-gray-400">Hőszigetelő Táblák</span>
                        <div className="text-base font-bold text-white">{insulationCalc.boardPcs} db</div>
                      </div>
                      <div className="bg-white/5 p-3 rounded-xl space-y-0.5 border border-white/5">
                        <span className="text-gray-400">Ragasztó (25kg)</span>
                        <div className="text-base font-bold text-accent">{insulationCalc.adhesiveBags} zsák</div>
                      </div>
                      <div className="bg-white/5 col-span-2 p-3 rounded-xl space-y-0.5 border border-white/5">
                        <span className="text-gray-400">Üvegszövet Háló</span>
                        <div className="text-base font-bold text-white">{insulationCalc.meshM2} m² (10% átlapolással)</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. TILING RESULTS */}
                {activeTab === 'tiling' && (
                  <div className="space-y-4">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-1">
                      <span className="text-xs text-gray-400 font-medium">Burkoló / Habarcs Anyagmennyiség</span>
                      {tilingType === 'tile' ? (
                        <div className="text-3xl font-black text-accent">{tilingCalc.tilesM2} m²</div>
                      ) : (
                        <div className="text-3xl font-black text-accent">{tilingCalc.screedBags} zsák</div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      {tilingType === 'tile' ? (
                        <>
                          <div className="bg-white/5 p-3 rounded-xl space-y-0.5 border border-white/5">
                            <span className="text-gray-400">Csemperagasztó (25kg)</span>
                            <div className="text-base font-bold text-white">{tilingCalc.adhesiveBags} zsák</div>
                          </div>
                          <div className="bg-white/5 p-3 rounded-xl space-y-0.5 border border-white/5">
                            <span className="text-gray-400">Fugázó Por</span>
                            <div className="text-base font-bold text-accent">{tilingCalc.groutKg} kg</div>
                          </div>
                        </>
                      ) : (
                        <div className="bg-white/5 p-3 rounded-xl space-y-0.5 border border-white/5">
                          <span className="text-gray-400">Szárazesztrich (25kg)</span>
                          <div className="text-base font-bold text-white">{tilingCalc.screedBags} zsák</div>
                        </div>
                      )}
                      <div className="bg-white/5 p-3 rounded-xl space-y-0.5 border border-white/5">
                        <span className="text-gray-400">Mélyalapozó</span>
                        <div className="text-base font-bold text-white">{tilingCalc.primerLiters} liter</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. DRYWALL RESULTS */}
                {activeTab === 'drywall' && (
                  <div className="space-y-4">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-1">
                      <span className="text-xs text-gray-400 font-medium">Gipszkarton Táblák (120x200 cm)</span>
                      <div className="text-3xl font-black text-accent">{drywallCalc.boardCount} db</div>
                      <p className="text-[11px] text-gray-300">{drywallCalc.boardNames}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-white/5 p-3 rounded-xl space-y-0.5 border border-white/5">
                        <span className="text-gray-400">CW / CD Főprofilok</span>
                        <div className="text-base font-bold text-white">{drywallCalc.mainProfileFm} fm</div>
                      </div>
                      <div className="bg-white/5 p-3 rounded-xl space-y-0.5 border border-white/5">
                        <span className="text-gray-400">UW / UD Profilok</span>
                        <div className="text-base font-bold text-white">{drywallCalc.perimeterProfileFm} fm</div>
                      </div>
                      <div className="bg-white/5 p-3 rounded-xl space-y-0.5 border border-white/5">
                        <span className="text-gray-400">Hézagoló Gipsz</span>
                        <div className="text-base font-bold text-accent">{drywallCalc.jointFillerKg} kg</div>
                      </div>
                      <div className="bg-white/5 p-3 rounded-xl space-y-0.5 border border-white/5">
                        <span className="text-gray-400">Gipszkarton Csavar</span>
                        <div className="text-base font-bold text-white">{drywallCalc.screwsPcs} db</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 6. ROOFING RESULTS */}
                {activeTab === 'roofing' && (
                  <div className="space-y-4">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-1">
                      <span className="text-xs text-gray-400 font-medium">Valós Ferde Tetőfelület</span>
                      <div className="text-3xl font-black text-accent">{roofingCalc.actualRoofArea} m²</div>
                      <p className="text-[11px] text-gray-300">Dőlésszög: {roofAngle}° | Alapterület: {roofFootprint} m²</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-white/5 p-3 rounded-xl space-y-0.5 border border-white/5">
                        <span className="text-gray-400">Cserép Szükséglet</span>
                        <div className="text-base font-bold text-white">{roofingCalc.totalTiles} db</div>
                      </div>
                      <div className="bg-white/5 p-3 rounded-xl space-y-0.5 border border-white/5">
                        <span className="text-gray-400">Kúpcserép</span>
                        <div className="text-base font-bold text-white">{roofingCalc.ridgeTiles} db</div>
                      </div>
                      <div className="bg-white/5 p-3 rounded-xl space-y-0.5 border border-white/5">
                        <span className="text-gray-400">Tetőléc</span>
                        <div className="text-base font-bold text-accent">{roofingCalc.battenFm} fm</div>
                      </div>
                      <div className="bg-white/5 p-3 rounded-xl space-y-0.5 border border-white/5">
                        <span className="text-gray-400">Páraáteresztő Fólia</span>
                        <div className="text-base font-bold text-white">{roofingCalc.membraneM2} m²</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-2">
                  <button
                    onClick={handleCopySummary}
                    className="w-full py-3 bg-accent hover:bg-accent-hover text-primary font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95"
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    {copied ? 'Teljes Számítás Másolva!' : 'Anyaglista Kimásolása Hozzávalókkal'}
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
