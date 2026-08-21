import { useState, useEffect } from 'react';
import { Building2, CheckCircle2, ExternalLink, Plus, Globe, Edit2, Trash2 } from 'lucide-react';
import {
  listPartners,
  createPartner,
  updatePartner,
  deletePartner,
  getCategoryLabel,
  type PartnerCategory,
} from '../services/partnerService';
import type { Partner } from '../lib/supabase';
import { useSiteSettings, adjustColorBrightness, getContrastTextColor } from '../services/siteSettingsService';

export default function AdminPartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState<PartnerCategory>('gyarto');
  const [description, setDescription] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [isVerified, setIsVerified] = useState(true);

  useEffect(() => {
    loadPartners();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory]);

  async function loadPartners() {
    try {
      setLoading(true);
      const data = await listPartners(activeCategory === 'all' ? undefined : activeCategory);
      setPartners(data);
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingPartner(null);
    setName('');
    setCategory('gyarto');
    setDescription('');
    setWebsiteUrl('');
    setIsVerified(true);
    setShowModal(true);
  }

  function openEditModal(p: Partner) {
    setEditingPartner(p);
    setName(p.name);
    setCategory(p.category as PartnerCategory);
    setDescription(p.description || '');
    setWebsiteUrl(p.website_url || '');
    setIsVerified(Boolean(p.is_verified));
    setShowModal(true);
  }

  async function handleSavePartner(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingPartner) {
      await updatePartner(editingPartner.id, {
        name,
        category,
        description,
        website_url: websiteUrl,
        is_verified: isVerified,
      });
    } else {
      await createPartner({
        name,
        category,
        description,
        website_url: websiteUrl,
      });
    }

    setShowModal(false);
    await loadPartners();
  }

  async function handleDeletePartner(id: string, partnerName: string) {
    if (!confirm(`Biztosan törölni szeretnéd a(z) "${partnerName}" partnert?`)) return;
    await deletePartner(id);
    await loadPartners();
  }

  const siteSettings = useSiteSettings();
  const cardBg = siteSettings.adminCardBgColor || '#111111';
  const cardHighlight = siteSettings.adminCardHighlightColor || '#FFC400';
  const cardBorder = adjustColorBrightness(cardBg, 12);
  const headerBg = adjustColorBrightness(cardBg, 4);
  const inputBg = adjustColorBrightness(cardBg, -4);
  const textColor = getContrastTextColor(cardBg);
  const inputTextColor = getContrastTextColor(inputBg);

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-400">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-r-transparent mb-2" style={{ borderColor: `${cardHighlight} transparent ${cardHighlight} ${cardHighlight}` }} />
        <div>Partnerek betöltése...</div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6" style={{ color: textColor }}>
      <div style={{ borderColor: cardBorder }} className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div>
          <h1 style={{ color: textColor }} className="text-2xl font-bold flex items-center gap-3">
            <Building2 style={{ color: cardHighlight }} size={26} />
            Partner Kezelő Modul &amp; Intézményi Ökoszisztéma
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Gyártók, Kereskedők, Cégek, Iskolák, Oktatási Központok és Támogatók profiljai
          </p>
        </div>
        <div className="flex items-center gap-3 self-start">
          <span style={{ backgroundColor: `${cardHighlight}15`, borderColor: `${cardHighlight}30`, color: cardHighlight }} className="text-xs border font-bold px-3 py-2 rounded-xl">
            {partners.length} Aktív Szervezet
          </span>
          <button
            onClick={openCreateModal}
            style={{ backgroundColor: cardHighlight, color: '#000000' }}
            className="px-4 py-2 font-bold text-xs rounded-xl flex items-center gap-2 transition-colors cursor-pointer hover:opacity-90 shadow-md"
          >
            <Plus size={16} /> Új Partner Hozzáadása
          </button>
        </div>
      </div>

      {/* Category Filter Bar */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'gyarto', 'kereskedo', 'ceg', 'iskola', 'oktato', 'tamogato'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            style={
              activeCategory === cat
                ? { backgroundColor: cardHighlight, color: '#000000' }
                : { backgroundColor: inputBg, borderColor: cardBorder, color: textColor }
            }
            className={`px-3.5 py-1.5 border rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeCategory === cat ? 'font-bold' : 'hover:opacity-90'
            }`}
          >
            {cat === 'all' ? 'Összes Szervezet' : getCategoryLabel(cat)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {partners.map((partner) => (
          <div key={partner.id} style={{ backgroundColor: cardBg, borderColor: cardBorder }} className="border rounded-xl p-6 space-y-4 flex flex-col justify-between transition-colors shadow-lg">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span style={{ backgroundColor: `${cardHighlight}15`, borderColor: `${cardHighlight}30`, color: cardHighlight }} className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded border">
                  {getCategoryLabel(partner.category)}
                </span>
                
                <div className="flex items-center gap-2">
                  {partner.is_verified && (
                    <span className="text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded flex items-center gap-1">
                      <CheckCircle2 size={12} /> Minősített
                    </span>
                  )}
                  <button
                    onClick={() => openEditModal(partner)}
                    style={{ backgroundColor: inputBg, borderColor: cardBorder, color: textColor }}
                    className="p-1.5 border rounded-lg transition-colors cursor-pointer hover:opacity-90"
                    title="Partner szerkesztése"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDeletePartner(partner.id, partner.name)}
                    className="p-1.5 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors cursor-pointer"
                    title="Partner törlése"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <h2 style={{ color: textColor }} className="text-lg font-bold">{partner.name}</h2>
              {partner.description && (
                <p className="text-sm text-gray-400 leading-relaxed line-clamp-3">{partner.description}</p>
              )}
            </div>

            <div style={{ borderColor: cardBorder }} className="pt-3 border-t flex items-center justify-between">
              {partner.website_url ? (
                <a
                  href={partner.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: cardHighlight }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold hover:underline"
                >
                  <Globe size={14} /> Weboldal <ExternalLink size={12} />
                </a>
              ) : (
                <span className="text-xs text-gray-500">Nincs weboldal megadva</span>
              )}
              
              <button
                onClick={() => openEditModal(partner)}
                className="text-xs font-bold text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                Szerkesztés ➔
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Partner Modal (Create / Edit) */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div style={{ backgroundColor: cardBg, borderColor: cardBorder, color: textColor }} className="border rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div style={{ borderColor: cardBorder }} className="flex items-center justify-between border-b pb-3">
              <h2 style={{ color: textColor }} className="text-lg font-bold">
                {editingPartner ? 'Partner Szervezet Szerkesztése' : 'Új Partner Szervezet Hozzáadása'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSavePartner} className="space-y-4 text-xs">
              <div>
                <label style={{ color: textColor === '#FFFFFF' ? '#9CA3AF' : '#4B5563' }} className="font-semibold block mb-1">Szervezet Neve <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="pl. Mapei Kft."
                  style={{ backgroundColor: inputBg, borderColor: cardBorder, color: inputTextColor }}
                  className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label style={{ color: textColor === '#FFFFFF' ? '#9CA3AF' : '#4B5563' }} className="font-semibold block mb-1">Kategória</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as PartnerCategory)}
                  style={{ backgroundColor: inputBg, borderColor: cardBorder, color: inputTextColor }}
                  className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none transition-colors"
                >
                  <option value="gyarto">Gyártó</option>
                  <option value="kereskedo">Kereskedő</option>
                  <option value="ceg">Cég / Kivitelező</option>
                  <option value="iskola">Oktatási Intézmény</option>
                  <option value="oktato">Oktatási Központ</option>
                  <option value="tamogato">Támogató Szervezet</option>
                </select>
              </div>

              <div>
                <label style={{ color: textColor === '#FFFFFF' ? '#9CA3AF' : '#4B5563' }} className="font-semibold block mb-1">Leírás</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Rövid összefoglaló a szervezetről..."
                  style={{ backgroundColor: inputBg, borderColor: cardBorder, color: inputTextColor }}
                  className="w-full border rounded-xl px-3 py-2 text-sm h-20 resize-none focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label style={{ color: textColor === '#FFFFFF' ? '#9CA3AF' : '#4B5563' }} className="font-semibold block mb-1">Weboldal URL</label>
                <input
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://..."
                  style={{ backgroundColor: inputBg, borderColor: cardBorder, color: inputTextColor }}
                  className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none transition-colors"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isVerifiedCheckbox"
                  checked={isVerified}
                  onChange={(e) => setIsVerified(e.target.checked)}
                  className="rounded cursor-pointer"
                />
                <label htmlFor="isVerifiedCheckbox" className="font-medium cursor-pointer" style={{ color: textColor }}>
                  Minősített partner státusz (Verified badge)
                </label>
              </div>

              <div style={{ borderColor: cardBorder }} className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ backgroundColor: inputBg, borderColor: cardBorder, color: textColor }}
                  className="px-4 py-2 border font-semibold rounded-xl cursor-pointer hover:opacity-90"
                >
                  Mégse
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: cardHighlight, color: '#000000' }}
                  className="px-4 py-2 font-bold rounded-xl cursor-pointer hover:opacity-90 shadow-md"
                >
                  {editingPartner ? 'Változtatások Mentése' : 'Mentés & Hozzáadás'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

