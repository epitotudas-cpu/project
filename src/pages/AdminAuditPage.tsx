import { useState, useEffect } from 'react';
import { Activity, Clock } from 'lucide-react';
import { getAuditLogs, type AuditLog } from '../services/adminService';
import { useSiteSettings, adjustColorBrightness, getContrastTextColor } from '../services/siteSettingsService';

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
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
        const data = await getAuditLogs();
        setLogs(data);
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
        <div>Audit napló betöltése...</div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6" style={{ color: textColor }}>
      <div style={{ borderColor: cardBorder }} className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div>
          <h1 style={{ color: textColor }} className="text-2xl font-bold flex items-center gap-3">
            <Activity style={{ color: cardHighlight }} size={26} />
            Audit Napló &amp; Műveleti Előzmények
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Adminisztrátori műveletek és biztonsági események naplója
          </p>
        </div>
        <span style={{ backgroundColor: `${cardHighlight}15`, borderColor: `${cardHighlight}30`, color: cardHighlight }} className="text-xs border font-bold px-3 py-1.5 rounded-lg self-start">
          {logs.length} Esemény
        </span>
      </div>

      <div style={{ backgroundColor: cardBg, borderColor: cardBorder }} className="border rounded-xl overflow-hidden shadow-lg">
        <div style={{ borderColor: cardBorder }} className="divide-y">
          {logs.map((log) => (
            <div key={log.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <span style={{ backgroundColor: `${cardHighlight}15`, borderColor: `${cardHighlight}30`, color: cardHighlight }} className="text-xs font-bold uppercase px-2 py-0.5 rounded border">
                    {log.action}
                  </span>
                  <span className="text-xs text-gray-400">Modul: {log.targetModule}</span>
                </div>
                <div style={{ color: textColor }} className="text-sm font-medium">{log.details}</div>
                <div className="text-xs text-gray-500">Felhasználó: {log.actorEmail}</div>
              </div>
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <Clock size={12} /> {new Date(log.timestamp).toLocaleString('hu-HU')}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
