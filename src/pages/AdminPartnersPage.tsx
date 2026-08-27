import { useState, useEffect } from 'react';
import {
  Building2,
  CheckCircle2,
  ExternalLink,
  Plus,
  Globe,
  Edit2,
  Trash2,
  Mail,
  Copy,
  Check,
  KeyRound,
  XCircle,
} from 'lucide-react';
import {
  listPartners,
  createPartner,
  updatePartner,
  deletePartner,
  getCategoryLabel,
  type PartnerCategory,
} from '../services/partnerService';
import {
  createInvitation,
  listInvitations,
  revokeInvitation,
  generateEmailTemplate,
  type PartnerInvitation,
} from '../services/partnerInvitationService';
import type { Partner } from '../lib/supabase';
import { useSiteSettings, adjustColorBrightness, getContrastTextColor } from '../services/siteSettingsService';

interface AdminPartnersPageProps {
  initialSearchQuery?: string;
}

export default function AdminPartnersPage({ initialSearchQuery }: AdminPartnersPageProps = {}) {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [invitations, setInvitations] = useState<PartnerInvitation[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'partners' | 'invitations'>('partners');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery || '');

  // Partner Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<PartnerCategory>('gyarto');
  const [description, setDescription] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [isVerified, setIsVerified] = useState(true);

  // Invite Modal State
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [invitePartnerId, setInvitePartnerId] = useState<string>('');
  const [contactName, setContactName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [expiresInDays, setExpiresInDays] = useState<number>(14);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  // Generated Invitation Template State
  const [createdInviteCode, setCreatedInviteCode] = useState<string | null>(null);
  const [createdTemplate, setCreatedTemplate] = useState<{ subject: string; body: string; inviteLink: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (initialSearchQuery !== undefined) {
      setSearchQuery(initialSearchQuery);
    }
  }, [initialSearchQuery]);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory]);

  async function loadData() {
    try {
      setLoading(true);
      const [partnerData, inviteData] = await Promise.all([
        listPartners(activeCategory === 'all' ? undefined : activeCategory),
        listInvitations(),
      ]);
      setPartners(partnerData);
      setInvitations(inviteData);
      if (partnerData.length > 0) {
        if (!invitePartnerId || !partnerData.some((p) => p.id === invitePartnerId)) {
          setInvitePartnerId(partnerData[0].id);
        }
      }
    } finally {
      setLoading(false);
    }
  }

  const filteredPartners = partners.filter((p) => {
    return (
      !searchQuery.trim() ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description ?? '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  useEffect(() => {
    if (searchQuery && filteredPartners.length > 0) {
      const timer = setTimeout(() => {
        const el = document.getElementById(`admin-partner-${filteredPartners[0].id}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('ring-4', 'ring-amber-400', 'transition-all');
          setTimeout(() => {
            el.classList.remove('ring-4', 'ring-amber-400');
          }, 2500);
        }
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [searchQuery, filteredPartners]);

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

    try {
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
      loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Hiba történt a partner mentésekor.');
    }
  }

  async function handleDeletePartner(id: string) {
    if (!window.confirm('Biztosan törölni szeretnéd ezt a partner szervezetet?')) return;
    try {
      await deletePartner(id);
      loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'A törlés nem sikerült.');
    }
  }

  // Handle Invitation Creation
  function openCreateInviteModal() {
    if (partners.length > 0) {
      if (!invitePartnerId || !partners.some((p) => p.id === invitePartnerId)) {
        setInvitePartnerId(partners[0].id);
      }
    }
    setContactName('');
    setInviteEmail('');
    setExpiresInDays(14);
    setInviteError(null);
    setCreatedInviteCode(null);
    setCreatedTemplate(null);
    setCopied(false);
    setShowInviteModal(true);
  }

  async function handleCreateInvitation(e: React.FormEvent) {
    e.preventDefault();
    if (!invitePartnerId || !inviteEmail.trim()) {
      setInviteError('Kérjük, válasszon szervezetet és adja meg a meghívott e-mail címét.');
      return;
    }

    setInviteLoading(true);
    setInviteError(null);

    try {
      const selectedPartner = partners.find((p) => p.id === invitePartnerId);
      const inv = await createInvitation(invitePartnerId, inviteEmail.trim(), expiresInDays);
      const template = generateEmailTemplate(
        selectedPartner?.name || 'Szervezet',
        inv.code,
        inv.email,
        inv.expires_at
      );

      setCreatedInviteCode(inv.code);
      setCreatedTemplate(template);
      await loadData();
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Hiba történt a meghívó létrehozásakor.');
    } finally {
      setInviteLoading(false);
    }
  }

  async function handleRevokeInvitation(id: string) {
    if (!window.confirm('Biztosan vissza szeretnéd vonni ezt a meghívót?')) return;
    try {
      await revokeInvitation(id);
      loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'A visszavonás nem sikerült.');
    }
  }

  function handleCopyTemplate() {
    if (!createdTemplate) return;
    const textToCopy = `Tárgy: ${createdTemplate.subject}\n\n${createdTemplate.body}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  }

  const siteSettings = useSiteSettings();
  const cardBg = siteSettings.adminCardBgColor || '#111111';
  const cardHighlight = siteSettings.adminCardHighlightColor || '#FFC400';
  const cardBorder = adjustColorBrightness(cardBg, 12);
  const inputBg = adjustColorBrightness(cardBg, -4);
  const textColor = getContrastTextColor(cardBg);
  const inputTextColor = getContrastTextColor(inputBg);

  return (
    <div className="p-6 md:p-8 space-y-6" style={{ color: textColor }}>
      {/* Header */}
      <div style={{ borderColor: cardBorder }} className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div>
          <h1 style={{ color: textColor }} className="text-2xl font-bold flex items-center gap-3">
            <Building2 style={{ color: cardHighlight }} size={26} />
            Partner és Iskola Szervezetek Kezelője
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Gyártók, kereskedők, kivitelező cégek és oktatási intézmények, valamint biztonsági meghívók kezelése.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={openCreateInviteModal}
            style={{ backgroundColor: `${cardHighlight}20`, borderColor: cardHighlight, color: cardHighlight }}
            className="flex items-center gap-2 border font-bold px-4 py-2.5 rounded-xl transition-colors shadow-sm cursor-pointer hover:bg-amber-400/30 text-sm"
          >
            <Mail size={16} />
            Új Meghívó Létrehozása
          </button>

          <button
            onClick={openCreateModal}
            style={{ backgroundColor: cardHighlight, color: '#000000' }}
            className="flex items-center gap-2 font-bold px-4 py-2.5 rounded-xl transition-colors shadow-md cursor-pointer hover:opacity-90 text-sm"
          >
            <Plus size={16} />
            Új Szervezet Hozzáadása
          </button>
        </div>
      </div>

      {/* Tabs / Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Main Tab (Szervezetek vs Meghívók) */}
        <div className="flex items-center gap-2 bg-black/40 p-1 rounded-xl border" style={{ borderColor: cardBorder }}>
          <button
            onClick={() => setActiveTab('partners')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'partners'
                ? 'bg-amber-400 text-black shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Szervezetek ({partners.length})
          </button>
          <button
            onClick={() => setActiveTab('invitations')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'invitations'
                ? 'bg-amber-400 text-black shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Meghívók ({invitations.length})
          </button>
        </div>

        {/* Category Filters */}
        {activeTab === 'partners' && (
          <div className="flex flex-wrap gap-1.5 text-xs">
            {[
              { id: 'all', label: 'Összes' },
              { id: 'gyarto', label: 'Gyártó' },
              { id: 'kereskedo', label: 'Kereskedő' },
              { id: 'ceg', label: 'Kivitelező Cég' },
              { id: 'iskola', label: 'Oktatási Intézmény' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                style={{
                  backgroundColor: activeCategory === cat.id ? `${cardHighlight}25` : cardBg,
                  borderColor: activeCategory === cat.id ? cardHighlight : cardBorder,
                  color: activeCategory === cat.id ? cardHighlight : '#9CA3AF',
                }}
                className="border font-medium px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                {cat.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* TAB 1: PARTNERS LIST */}
      {activeTab === 'partners' && (
        <>
          {loading ? (
            <div className="p-8 text-center text-gray-400">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-r-transparent mb-2" style={{ borderColor: `${cardHighlight} transparent ${cardHighlight} ${cardHighlight}` }} />
              <div>Szervezetek betöltése...</div>
            </div>
          ) : filteredPartners.length === 0 ? (
            <div style={{ backgroundColor: cardBg, borderColor: cardBorder }} className="p-12 text-center border rounded-2xl text-gray-400 space-y-2">
              <Building2 size={40} className="mx-auto text-gray-600 mb-2" />
              <p className="font-semibold text-base text-gray-300">Nincs találat a keresett kategóriában.</p>
              <p className="text-xs">Hozzon létre új szervezeteket a fenti gomb segítségével.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPartners.map((partner) => (
                <div
                  id={`admin-partner-${partner.id}`}
                  key={partner.id}
                  style={{ backgroundColor: cardBg, borderColor: cardBorder }}
                  className="border rounded-2xl p-5 space-y-4 shadow-lg hover:border-amber-400/50 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span style={{ backgroundColor: `${cardHighlight}15`, borderColor: `${cardHighlight}30`, color: cardHighlight }} className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border">
                            {getCategoryLabel(partner.category)}
                          </span>
                          {partner.is_verified && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
                              <CheckCircle2 size={10} /> Verified
                            </span>
                          )}
                        </div>
                        <h2 style={{ color: textColor }} className="text-lg font-bold leading-tight">{partner.name}</h2>
                      </div>
                    </div>

                    <p className="text-xs text-gray-400 line-clamp-3 leading-relaxed">
                      {partner.description || 'Nincs megadva leírás.'}
                    </p>

                    {partner.website_url && (
                      <a
                        href={partner.website_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:underline font-medium"
                      >
                        <Globe size={13} />
                        <span>{partner.website_url.replace(/^https?:\/\//, '')}</span>
                        <ExternalLink size={11} />
                      </a>
                    )}
                  </div>

                  <div style={{ borderColor: cardBorder }} className="pt-3 border-t flex items-center justify-between text-xs">
                    <span className="text-gray-500">ID: {partner.id.substring(0, 8)}...</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(partner)}
                        className="p-1.5 text-gray-400 hover:text-amber-400 hover:bg-amber-400/10 rounded-lg transition-colors cursor-pointer"
                        title="Szerkesztés"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => handleDeletePartner(partner.id)}
                        className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors cursor-pointer"
                        title="Törlés"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* TAB 2: INVITATIONS LIST */}
      {activeTab === 'invitations' && (
        <div style={{ backgroundColor: cardBg, borderColor: cardBorder }} className="border rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: cardBorder }}>
            <h2 className="text-sm font-bold flex items-center gap-2" style={{ color: textColor }}>
              <KeyRound size={18} style={{ color: cardHighlight }} />
              Aktív és Felhasznált Szervezeti Meghívók ({invitations.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead style={{ backgroundColor: inputBg, color: textColor, borderColor: cardBorder }} className="border-b uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="p-3.5">Kód</th>
                  <th className="p-3.5">Szervezet</th>
                  <th className="p-3.5">Címzett E-mail</th>
                  <th className="p-3.5">Státusz</th>
                  <th className="p-3.5">Lejárat</th>
                  <th className="p-3.5 text-right">Művelet</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: cardBorder }}>
                {invitations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-400">
                      Még nem hoztál létre egyetlen meghívót sem.
                    </td>
                  </tr>
                ) : (
                  invitations.map((inv) => {
                    const isExpired = new Date(inv.expires_at) < new Date();
                    return (
                      <tr key={inv.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-amber-400">{inv.code}</td>
                        <td className="p-3.5 font-semibold" style={{ color: textColor }}>{inv.partner_name}</td>
                        <td className="p-3.5 text-gray-300">{inv.email}</td>
                        <td className="p-3.5">
                          {inv.status === 'used' ? (
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded">
                              Felhasználva
                            </span>
                          ) : inv.status === 'revoked' ? (
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 rounded">
                              Visszavonva
                            </span>
                          ) : isExpired ? (
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-gray-500/20 text-gray-400 border border-gray-500/30 rounded">
                              Lejárt
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded">
                              Aktív
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-gray-400">
                          {new Date(inv.expires_at).toLocaleDateString('hu-HU')}
                        </td>
                        <td className="p-3.5 text-right">
                          {inv.status === 'active' && !isExpired && (
                            <button
                              onClick={() => handleRevokeInvitation(inv.id)}
                              className="text-red-400 hover:text-red-300 font-semibold inline-flex items-center gap-1 cursor-pointer"
                            >
                              <XCircle size={14} /> Visszavonás
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE / EDIT PARTNER MODAL */}
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
                <label className="font-semibold block mb-1">Szervezet Neve <span className="text-red-400">*</span></label>
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
                <label className="font-semibold block mb-1">Kategória</label>
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
                <label className="font-semibold block mb-1">Leírás</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Rövid összefoglaló a szervezetről..."
                  style={{ backgroundColor: inputBg, borderColor: cardBorder, color: inputTextColor }}
                  className="w-full border rounded-xl px-3 py-2 text-sm h-20 resize-none focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Weboldal URL</label>
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

      {/* CREATE INVITATION MODAL */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div style={{ backgroundColor: cardBg, borderColor: cardBorder, color: textColor }} className="border rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div style={{ borderColor: cardBorder }} className="flex items-center justify-between border-b pb-3">
              <h2 style={{ color: textColor }} className="text-lg font-bold flex items-center gap-2">
                <Mail size={20} className="text-amber-400" />
                Új Szervezeti Meghívó Generálása
              </h2>
              <button onClick={() => setShowInviteModal(false)} className="text-gray-400 hover:text-white cursor-pointer">✕</button>
            </div>

            {!createdInviteCode ? (
              <form onSubmit={handleCreateInvitation} className="space-y-4 text-xs">
                <div>
                  <label className="font-semibold block mb-1">Cél Szervezet <span className="text-red-400">*</span></label>
                  <select
                    value={invitePartnerId}
                    onChange={(e) => setInvitePartnerId(e.target.value)}
                    style={{ backgroundColor: inputBg, borderColor: cardBorder, color: inputTextColor }}
                    className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none transition-colors"
                  >
                    {partners.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({getCategoryLabel(p.category)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold block mb-1">Kapcsolattartó Neve</label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Kovács János"
                    style={{ backgroundColor: inputBg, borderColor: cardBorder, color: inputTextColor }}
                    className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Meghívott Kapcsolattartó E-mail Címe <span className="text-red-400">*</span></label>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="kapcsolattarto@szervezet.hu"
                    style={{ backgroundColor: inputBg, borderColor: cardBorder, color: inputTextColor }}
                    className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none transition-colors"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">A meghívókódot kizárólag erről az e-mail címről lehet majd beváltani.</p>
                </div>

                <div>
                  <label className="font-semibold block mb-1">Érvényesség (Napok)</label>
                  <select
                    value={expiresInDays}
                    onChange={(e) => setExpiresInDays(Number(e.target.value))}
                    style={{ backgroundColor: inputBg, borderColor: cardBorder, color: inputTextColor }}
                    className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none transition-colors"
                  >
                    <option value={7}>7 nap</option>
                    <option value={14}>14 nap</option>
                    <option value={30}>30 nap</option>
                  </select>
                </div>

                {inviteError && (
                  <p className="text-xs text-red-400 font-medium">{inviteError}</p>
                )}

                <div style={{ borderColor: cardBorder }} className="flex justify-end gap-3 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    style={{ backgroundColor: inputBg, borderColor: cardBorder, color: textColor }}
                    className="px-4 py-2 border font-semibold rounded-xl cursor-pointer hover:opacity-90"
                  >
                    Mégse
                  </button>
                  <button
                    type="submit"
                    disabled={inviteLoading}
                    style={{ backgroundColor: cardHighlight, color: '#000000' }}
                    className="px-5 py-2 font-bold rounded-xl cursor-pointer hover:opacity-90 shadow-md disabled:opacity-50"
                  >
                    {inviteLoading ? 'Generálás...' : 'Meghívó Létrehozása'}
                  </button>
                </div>
              </form>
            ) : (
              /* Success / Generated Template Display */
              <div className="space-y-4 text-xs">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-1">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold">
                    <CheckCircle2 size={16} /> Meghívókód Sikeresen Létrehozva!
                  </div>
                  <div className="text-lg font-mono font-black text-amber-400 pt-1 tracking-wider">
                    {createdInviteCode}
                  </div>
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-gray-300">Személyre Szabott E-mail Sablon:</label>
                  <textarea
                    readOnly
                    rows={8}
                    value={`Tárgy: ${createdTemplate?.subject}\n\n${createdTemplate?.body}`}
                    style={{ backgroundColor: inputBg, borderColor: cardBorder, color: inputTextColor }}
                    className="w-full border rounded-xl p-3 text-xs font-mono resize-none focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={handleCopyTemplate}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-amber-400 text-black font-bold rounded-xl hover:bg-amber-300 transition-colors cursor-pointer shadow"
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    {copied ? 'Sablon Másolva!' : 'Sablon + Kód Másolása'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="px-4 py-2 bg-gray-700 text-white font-semibold rounded-xl hover:bg-gray-600 transition-colors cursor-pointer"
                  >
                    Bezárás
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
