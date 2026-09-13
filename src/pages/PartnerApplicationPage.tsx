import { useState } from 'react';
import {
  Building2,
  Send,
  CheckCircle2,
  Globe,
  Phone,
  Mail,
  User,
  ShieldCheck,
  ArrowLeft,
  Sparkles,
  Award,
  Users,
  Check,
  ChevronRight,
  BookOpen,
  TrendingUp,
} from 'lucide-react';
import { submitPartnerApplication } from '../services/partnerApplicationService';
import type { PartnerCategory } from '../services/partnerService';

export default function PartnerApplicationPage() {
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [category, setCategory] = useState<PartnerCategory>('ceg');
  const [description, setDescription] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!companyName.trim() || !contactName.trim() || !email.trim()) {
      setError('Kérjük, töltse ki a kötelező mezőket (Cégnév, Kapcsolattartó neve, E-mail).');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await submitPartnerApplication({
        company_name: companyName.trim(),
        contact_name: contactName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        website_url: websiteUrl.trim(),
        category,
        description: description.trim(),
      });

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Hiba történt a jelentkezés beküldésekor.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden pb-20 selection:bg-amber-500 selection:text-slate-950">
      {/* Ambient Background Lights & Grid Pattern */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/15 via-amber-500/5 to-transparent pointer-events-none z-0" />
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none z-0" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 relative z-10 space-y-8">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between flex-wrap gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-400">
            <a
              href="/"
              className="inline-flex items-center gap-1.5 hover:text-amber-400 transition-colors"
            >
              <ArrowLeft size={14} /> Kezdőlap
            </a>
            <ChevronRight size={12} className="text-gray-600" />
            <span className="text-amber-400 font-bold">Partneri Jelentkezés</span>
          </div>

          <a
            href="/#partnerek"
            className="inline-flex items-center gap-1.5 text-xs font-extrabold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-3.5 py-1.5 rounded-full hover:bg-amber-500/20 transition-all"
          >
            <Building2 size={13} /> Meglévő Partnerek Megtekintése
          </a>
        </div>

        {/* Hero Header Section */}
        <div className="text-center max-w-3xl mx-auto space-y-4 pt-2">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-black uppercase tracking-wider backdrop-blur-md">
            <Sparkles size={14} className="text-amber-400 animate-pulse" />
            2026 ÉPÍTŐIPARI & OKTATÁSI PARTNERI PROGRAM
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
            Partneri &amp; Iskolai <span className="text-amber-400">Csatlakozás</span>
          </h1>

          <p className="text-sm md:text-base text-gray-300 leading-relaxed font-medium max-w-2xl mx-auto">
            Csatlakozzon az ÉpítőTudás szakmai platformjához! Ipari gyártók, kereskedők, generálkivitelezők és szakképző intézmények kiemelt közössége.
          </p>
        </div>

        {/* Success State View */}
        {submitted ? (
          <div className="max-w-2xl mx-auto bg-slate-900/90 border-2 border-emerald-500/40 rounded-3xl p-8 md:p-12 shadow-2xl text-center space-y-6 backdrop-blur-xl animate-fade-in my-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 shadow-lg shadow-emerald-500/10">
              <CheckCircle2 size={44} />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-400">Sikeres Jelentkezés</span>
              <h2 className="text-2xl sm:text-3xl font-black text-white">Köszönjük a jelentkezést!</h2>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-left space-y-2 text-xs text-gray-300 max-w-md mx-auto">
              <p className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-gray-400 font-semibold">Szervezet neve:</span>
                <strong className="text-white font-bold">{companyName}</strong>
              </p>
              <p className="flex justify-between">
                <span className="text-gray-400 font-semibold">Kapcsolattartó e-mail:</span>
                <strong className="text-amber-400 font-bold">{email}</strong>
              </p>
            </div>

            <p className="text-sm text-gray-300 max-w-lg mx-auto leading-relaxed">
              Az ÉpítőTudás adminisztrációja felülvizsgálja a megadott adatokat, és a jóváhagyást követően meghívó e-mailt küldünk a megadott e-mail címre.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href="/"
                className="w-full sm:w-auto px-8 py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl transition-all shadow-lg text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                Vissza a Kezdőlapra
              </a>
              <a
                href="/#partnerek"
                className="w-full sm:w-auto px-6 py-3.5 bg-white/10 hover:bg-white/15 text-white font-bold rounded-xl transition-all text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <Building2 size={16} /> Partnerek Listája
              </a>
            </div>
          </div>
        ) : (
          /* Main 2-Column Content Layout: Left Benefits + Right Form */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-4">
            
            {/* LEFT COLUMN: Why Join & Benefits Showcase */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 backdrop-blur-md shadow-xl">
                <div className="space-y-2 border-b border-white/10 pb-4">
                  <span className="text-xs font-black uppercase tracking-wider text-amber-400">PARTNERI ELŐNYÖK</span>
                  <h3 className="text-xl font-extrabold text-white">Miért érdemes csatlakozni?</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Kiemelt partnerként közvetlen elérést biztosítunk az építőipari szféra döntéshozóihoz és a jövő szakembereihez.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                      <TrendingUp size={20} />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-extrabold text-white">Kiemelt Márkajelenlét</h4>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        Bannerelhelyezések, csempe reklámok és szponzorált szakmai cikkek a platform leglátogatottabb felületein.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                      <BookOpen size={20} />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-extrabold text-white">Oktatási Integráció</h4>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        Közvetlen kapcsolat szakképző centrumokkal, egyetemekkel, oktatókkal és a szakképzésben tanulókkal.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                      <Award size={20} />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-extrabold text-white">Dedikált Partner Profil</h4>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        Egyedi céges adatlap, kapcsolattartó adatok, termékkatalógus elérések és szakmai minősítések.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                      <Users size={20} />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-extrabold text-white">Mérhető Eredmények</h4>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        Transzparens statisztikák a megjelenésekről és kattintásokról a megújult Admin Reklámkezelőben.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Categories Badge Pill Group */}
                <div className="pt-4 border-t border-white/10 space-y-2">
                  <span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider block">Csatlakozó Szervezeti Típusok</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'Generálkivitelezők',
                      'Építőanyag-gyártók',
                      'Tüzépek & Kereskedők',
                      'Oktatási Intézmények',
                      'Szakmai Trénerek',
                      'Támogatók',
                    ].map((cat) => (
                      <span
                        key={cat}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] font-bold text-gray-300"
                      >
                        <Check size={11} className="text-amber-400" /> {cat}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Glassmorphism Application Form */}
            <div className="lg:col-span-7">
              <div className="bg-slate-900/90 border-2 border-amber-500/30 rounded-3xl p-6 sm:p-8 md:p-10 shadow-2xl backdrop-blur-xl space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                      <Building2 size={22} className="text-amber-400" /> Csatlakozási Űrlap
                    </h2>
                    <p className="text-xs text-gray-400 mt-1">
                      Töltse ki az alábbi mezőket a regisztrációs kérelem elküldéséhez.
                    </p>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-1 rounded-full shrink-0 hidden sm:inline-block">
                    Gyors Elbírálás
                  </span>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5 text-xs">
                  {/* Section 1: Szervezet Adatai */}
                  <div className="space-y-3">
                    <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 block flex items-center gap-1.5">
                      <Building2 size={13} /> 1. Szervezet Adatai
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="font-semibold text-gray-300 block">
                          Szervezet / Cég Neve <span className="text-amber-400">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          placeholder="pl. BauMaster Kft. vagy BME Építő Kar"
                          className="w-full bg-slate-950 border border-white/15 text-white rounded-xl px-4 py-3 text-xs md:text-sm font-semibold focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all shadow-inner"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-semibold text-gray-300 block">
                          Szervezet Típusa <span className="text-amber-400">*</span>
                        </label>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value as PartnerCategory)}
                          className="w-full bg-slate-950 border border-white/15 text-white rounded-xl px-4 py-3 text-xs md:text-sm font-semibold focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all cursor-pointer shadow-inner"
                        >
                          <option value="ceg">Generálkivitelező / Kivitelező Cég</option>
                          <option value="gyarto">Építőanyag- vagy Gépgyártó</option>
                          <option value="kereskedo">Kereskedő / Tüzép hálózat</option>
                          <option value="iskola">Oktatási Intézmény / Egyetem</option>
                          <option value="oktato">Oktató Központ / Tréner</option>
                          <option value="tamogato">Szakmai Támogató Szervezet</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Kapcsolattartó Adatai */}
                  <div className="space-y-3 pt-2 border-t border-white/10">
                    <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 block flex items-center gap-1.5">
                      <User size={13} /> 2. Kapcsolattartó Elérhetőségei
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="font-semibold text-gray-300 block">
                          Kapcsolattartó Neve <span className="text-amber-400">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          placeholder="pl. Kovács Péter"
                          className="w-full bg-slate-950 border border-white/15 text-white rounded-xl px-4 py-3 text-xs md:text-sm font-semibold focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all shadow-inner"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-semibold text-gray-300 block">
                          E-mail Cím <span className="text-amber-400">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="peter.kovacs@szervezet.hu"
                          className="w-full bg-slate-950 border border-white/15 text-white rounded-xl px-4 py-3 text-xs md:text-sm font-semibold focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all shadow-inner"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                      <div className="space-y-1.5">
                        <label className="font-semibold text-gray-300 block">
                          Telefonszám <span className="text-gray-500 font-normal">(Opcionális)</span>
                        </label>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+36 30 123 4567"
                          className="w-full bg-slate-950 border border-white/15 text-white rounded-xl px-4 py-3 text-xs md:text-sm font-semibold focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all shadow-inner"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-semibold text-gray-300 block">
                          Weboldal URL <span className="text-gray-500 font-normal">(Opcionális)</span>
                        </label>
                        <input
                          type="url"
                          value={websiteUrl}
                          onChange={(e) => setWebsiteUrl(e.target.value)}
                          placeholder="https://szervezet.hu"
                          className="w-full bg-slate-950 border border-white/15 text-white rounded-xl px-4 py-3 text-xs md:text-sm font-semibold focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all shadow-inner"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Bemutatkozás */}
                  <div className="space-y-1.5 pt-2 border-t border-white/10">
                    <label className="font-semibold text-gray-300 block">
                      Rövid Bemutatkozás / Üzenet az Adminisztrációnak
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Ismertesse röviden a szervezet tevékenységét, kiemelt termékeit vagy a csatlakozási célokat..."
                      rows={4}
                      className="w-full bg-slate-950 border border-white/15 text-white rounded-xl p-4 text-xs md:text-sm font-semibold resize-none focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all shadow-inner"
                    />
                  </div>

                  {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-xs font-bold animate-fade-in">
                      ⚠️ {error}
                    </div>
                  )}

                  <div className="pt-3">
                    <button
                      type="submit"
                      disabled={loading}
                      style={{ backgroundColor: '#FFC400', color: '#000000' }}
                      className="w-full py-4 font-black rounded-2xl shadow-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-sm hover:scale-[1.01]"
                    >
                      {loading ? (
                        'Jelentkezés küldése...'
                      ) : (
                        <>
                          <Send size={18} /> Partneri Jelentkezés Beküldése
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
