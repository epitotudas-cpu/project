import { useState } from 'react';
import { Building2, Send, CheckCircle2, Globe, Phone, Mail, User, ShieldCheck, ArrowLeft } from 'lucide-react';
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
    <div className="min-h-screen bg-[#0A0A0A] text-white py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center">
      <div className="w-full max-w-2xl space-y-6">
        {/* Back Link */}
        <div>
          <a
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-amber-400 transition-colors"
          >
            <ArrowLeft size={14} /> Vissza a Kezdőlapra
          </a>
        </div>

        {/* Header */}
        <div className="bg-[#111] border border-[#222] rounded-3xl p-8 shadow-2xl text-center space-y-3 relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-2">
            <Building2 size={28} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Partneri és Iskolai Csatlakozási Jelentkezés
          </h1>
          <p className="text-sm text-gray-400 max-w-lg mx-auto leading-relaxed">
            Csatlakozzon az ÉpítőTudás v2 szakmai hálózatához! Töltse ki az alábbi űrlapot, és csapatunk felveszi Önnel a kapcsolatot.
          </p>
        </div>

        {/* Success Card */}
        {submitted ? (
          <div className="bg-[#111] border border-emerald-500/30 rounded-3xl p-8 shadow-2xl text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mb-2">
              <CheckCircle2 size={36} />
            </div>
            <h2 className="text-xl font-bold text-emerald-400">Jelentkezés Sikeresen Elküldve!</h2>
            <p className="text-sm text-gray-300 max-w-md mx-auto leading-relaxed">
              Köszönjük a jelentkezést! Az ÉpítőTudás adminisztrátorai áttekintik a megadott adatokat, és a megerősítés után meghívó e-mailt küldenek a megadott e-mail címre.
            </p>
            <div className="pt-4">
              <a
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 text-black font-bold rounded-xl hover:bg-amber-400 transition-colors shadow-lg text-sm"
              >
                Vissza a Kezdőlapra
              </a>
            </div>
          </div>
        ) : (
          /* Form Card */
          <div className="bg-[#111] border border-[#222] rounded-3xl p-8 shadow-2xl space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-gray-300 block mb-1.5 flex items-center gap-1.5">
                    <Building2 size={13} className="text-amber-400" />
                    Szervezet Neve <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="pl. BauMaster Kft. vagy BME Építő Kar"
                    className="w-full bg-[#181818] border border-[#333] text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>

                <div>
                  <label className="font-semibold text-gray-300 block mb-1.5 flex items-center gap-1.5">
                    <ShieldCheck size={13} className="text-amber-400" />
                    Szervezet Típusa <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as PartnerCategory)}
                    className="w-full bg-[#181818] border border-[#333] text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-amber-400 transition-colors"
                  >
                    <option value="ceg">Kivitelező Cég / Generálkivitelező</option>
                    <option value="gyarto">Építőanyag-gyártó</option>
                    <option value="kereskedo">Kereskedő / Tüzép</option>
                    <option value="iskola">Oktatási Intézmény / Egyetem</option>
                    <option value="oktato">Oktató Központ / Tréner</option>
                    <option value="tamogato">Szakmai Támogató Szervezet</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-gray-300 block mb-1.5 flex items-center gap-1.5">
                    <User size={13} className="text-amber-400" />
                    Kapcsolattartó Neve <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="pl. Kovács Péter"
                    className="w-full bg-[#181818] border border-[#333] text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>

                <div>
                  <label className="font-semibold text-gray-300 block mb-1.5 flex items-center gap-1.5">
                    <Mail size={13} className="text-amber-400" />
                    Kapcsolattartó E-mail Címe <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="peter.kovacs@szervezet.hu"
                    className="w-full bg-[#181818] border border-[#333] text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-gray-300 block mb-1.5 flex items-center gap-1.5">
                    <Phone size={13} className="text-gray-400" />
                    Telefonszám (Opcionális)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+36 30 123 4567"
                    className="w-full bg-[#181818] border border-[#333] text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>

                <div>
                  <label className="font-semibold text-gray-300 block mb-1.5 flex items-center gap-1.5">
                    <Globe size={13} className="text-gray-400" />
                    Weboldal URL (Opcionális)
                  </label>
                  <input
                    type="url"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-[#181818] border border-[#333] text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-gray-300 block mb-1.5">
                  Rövid Bemutatkozás / Üzenet az Adminisztrátornak
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ismertesse röviden a szervezet tevékenységét és a csatlakozás célját..."
                  rows={4}
                  className="w-full bg-[#181818] border border-[#333] text-white rounded-xl p-3.5 text-sm resize-none focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-medium">
                  {error}
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-sm"
                >
                  {loading ? (
                    'Jelentkezés küldése...'
                  ) : (
                    <>
                      <Send size={16} /> Partneri Jelentkezés Beküldése
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
