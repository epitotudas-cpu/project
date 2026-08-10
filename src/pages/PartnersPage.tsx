import { useState, useEffect, useMemo } from 'react';
import { Building2, Search, ExternalLink, ShieldCheck, ArrowLeft, Mail, Target, Globe, BookOpen, FileText } from 'lucide-react';
import { listPartners, getCategoryLabel, type PartnerCategory } from '../services/partnerService';
import type { Partner } from '../lib/supabase';
import SectionSubNav from '../components/SectionSubNav';

interface PartnersPageProps {
  onNavigate: (page: string) => void;
}

export default function PartnersPage({ onNavigate }: PartnersPageProps) {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    async function loadPartners() {
      try {
        setLoading(true);
        const data = await listPartners();
        setPartners(data);
      } catch (err) {
        console.error('Hiba a partnerek betöltésekor:', err);
      } finally {
        setLoading(false);
      }
    }
    loadPartners();
  }, []);

  const categories: PartnerCategory[] = ['gyarto', 'kereskedo', 'ceg', 'iskola', 'oktato', 'tamogato'];

  const filteredPartners = useMemo(() => {
    return partners.filter((p) => {
      const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        getCategoryLabel(p.category).toLowerCase().includes(q);

      return matchCat && matchQuery;
    });
  }, [partners, selectedCategory, searchQuery]);

  return (
    <div className="bg-background min-h-screen pb-16">
      {/* Hero Header */}
      <div className="bg-primary text-white border-b border-primary-700 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-4">
          <button
            onClick={() => onNavigate('home')}
            className="inline-flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-accent transition-colors"
          >
            <ArrowLeft size={14} /> Vissza a főoldalra
          </button>

          <div className="flex items-center gap-3">
            <div className="p-3 bg-accent/10 border border-accent/20 rounded-2xl text-accent">
              <Building2 size={28} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Építőipari Partnereink &amp; Támogatóink</h1>
              <p className="text-gray-400 text-sm mt-1">
                Kiemelt ipari gyártók, építőanyag kereskedők, generálkivitelezők és oktatási partnerintézmények
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Standardized Secondary Sub-navigation Bar */}
      <SectionSubNav
        ariaLabel="Rólunk navigáció"
        onNavigate={onNavigate}
        items={[
          {
            label: 'Célunk',
            page: 'about',
            icon: <Target size={14} className="text-accent" />,
            active: false,
          },
          {
            label: 'ÉpítőTudás',
            page: 'about',
            icon: <Globe size={14} className="text-accent" />,
            active: false,
          },
          {
            label: 'Partnerek',
            page: 'partners',
            icon: <Building2 size={14} className="text-accent" />,
            active: true,
          },
          {
            label: 'Ajánlott források',
            page: 'about',
            icon: <BookOpen size={14} className="text-accent" />,
            active: false,
          },
          {
            label: 'Kapcsolat & Impresszum',
            page: 'impressum',
            icon: <FileText size={14} className="text-accent" />,
            active: false,
          },
        ]}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Search & Category Filter Bar */}
        <div className="space-y-4">
          <div className="relative max-w-2xl">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Keress partner neve vagy tevékenysége szerint..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-gray-200 focus:border-accent rounded-xl pl-11 pr-4 py-3.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-accent/30 text-sm font-medium"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-xl font-bold text-xs transition-all ${
                selectedCategory === 'all'
                  ? 'bg-accent text-black shadow-md'
                  : 'bg-white border border-gray-200 text-gray-700 hover:border-accent/40'
              }`}
            >
              Összes Partner ({partners.length})
            </button>

            {categories.map((cat) => {
              const count = partners.filter((p) => p.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl font-bold text-xs transition-all ${
                    selectedCategory === cat
                      ? 'bg-accent text-black shadow-md'
                      : 'bg-white border border-gray-200 text-gray-700 hover:border-accent/40'
                  }`}
                >
                  {getCategoryLabel(cat)} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-12 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-accent border-r-transparent" />
            <p className="text-gray-500 text-sm mt-3">Partnerek betöltése...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredPartners.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center max-w-lg mx-auto space-y-3">
            <Building2 size={40} className="mx-auto text-gray-300" />
            <h3 className="text-lg font-bold text-gray-900">Nem található partner</h3>
            <p className="text-sm text-gray-500">Próbáld meg megváltoztatni a keresési kifejezést vagy a szűrőket.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="px-4 py-2 bg-accent text-black text-xs font-bold rounded-xl hover:bg-accent-hover transition-colors"
            >
              Szűrők törlése
            </button>
          </div>
        )}

        {/* Partners Grid */}
        {!loading && filteredPartners.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPartners.map((partner) => (
              <a
                key={partner.id}
                href={partner.website_url || '#'}
                target={partner.website_url ? '_blank' : '_self'}
                rel="noopener noreferrer"
                className="group bg-white border border-gray-200 hover:border-accent rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-lg">
                      {getCategoryLabel(partner.category)}
                    </span>

                    {partner.is_verified && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        <ShieldCheck size={12} /> Minősített Partner
                      </span>
                    )}
                  </div>

                  <div>
                    <h2 className="text-lg font-bold text-gray-900 group-hover:text-primary transition-colors flex items-center gap-1.5">
                      {partner.name}
                      {partner.website_url && (
                        <ExternalLink size={14} className="text-gray-400 group-hover:text-accent transition-colors" />
                      )}
                    </h2>

                    {partner.description && (
                      <p className="text-sm text-gray-600 leading-relaxed mt-2 line-clamp-3">
                        {partner.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-primary group-hover:text-accent group-hover:translate-x-0.5 transition-transform">
                  <span>Hivatalos weboldal megnyitása</span>
                  <ExternalLink size={14} />
                </div>
              </a>
            ))}
          </div>
        )}

        {/* Partnership CTA Banner */}
        <div className="bg-primary rounded-2xl p-8 md:p-10 text-white flex flex-col md:flex-row items-center justify-between gap-6 border border-primary-700">
          <div className="space-y-2 text-center md:text-left">
            <h3 className="text-xl font-bold text-white">Szeretnél Ön is az ÉpítőTudás hivatalos partnerévé válni?</h3>
            <p className="text-sm text-gray-300 max-w-2xl">
              Csatlakozz építőipari gyártóként, forgalmazóként vagy szakképző intézményként a nemzeti tudásplatformhóz!
            </p>
          </div>

          <a
            href="mailto:partner@epitotudas.hu"
            className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-black font-bold text-sm rounded-xl hover:bg-accent-hover transition-colors shrink-0"
          >
            <Mail size={16} /> Kapcsolatfelvétel Partnereknek
          </a>
        </div>
      </div>
    </div>
  );
}
