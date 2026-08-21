import { useState, useEffect } from 'react';
import { Shield } from 'lucide-react';
import { listRoles } from '../services/roleService';
import type { Role } from '../lib/supabase';
import { useSiteSettings, adjustColorBrightness, getContrastTextColor } from '../services/siteSettingsService';

export default function AdminRolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  const siteSettings = useSiteSettings();
  const cardBg = siteSettings.adminCardBgColor || '#111111';
  const cardHighlight = siteSettings.adminCardHighlightColor || '#FFC400';
  const cardBorder = adjustColorBrightness(cardBg, 12);
  const textColor = getContrastTextColor(cardBg);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await listRoles();
        setRoles(data);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-400">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-r-transparent mb-2" style={{ borderColor: `${cardHighlight} transparent ${cardHighlight} ${cardHighlight}` }} />
        <div>Szerepkörök betöltése...</div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6" style={{ color: textColor }}>
      <div style={{ borderColor: cardBorder }} className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div>
          <h1 style={{ color: textColor }} className="text-2xl font-bold flex items-center gap-3">
            <Shield style={{ color: cardHighlight }} size={26} />
            Jogosultságkezelés (v2 RBAC Szerepkörök)
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Rendszer- és egyedi szerepkörök áttekintése
          </p>
        </div>
        <span style={{ backgroundColor: `${cardHighlight}15`, borderColor: `${cardHighlight}30`, color: cardHighlight }} className="text-xs border font-bold px-3 py-1.5 rounded-lg self-start">
          {roles.length} Regisztrált Szerepkör
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles.map((role) => (
          <div key={role.id} style={{ backgroundColor: cardBg, borderColor: cardBorder }} className="border rounded-xl p-6 space-y-3 shadow-lg">
            <div className="flex items-center justify-between">
              <span style={{ backgroundColor: `${cardHighlight}15`, borderColor: `${cardHighlight}30`, color: cardHighlight }} className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded border">
                {role.slug}
              </span>
              <span className="text-xs text-gray-400">
                {role.is_system ? 'Rendszer' : 'Egyedi'}
              </span>
            </div>
            <h2 style={{ color: textColor }} className="text-lg font-bold">{role.name}</h2>
            <p className="text-sm text-gray-400 leading-relaxed">{role.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
