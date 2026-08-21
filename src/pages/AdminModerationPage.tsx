import { useState, useEffect } from 'react';
import { CheckCircle2, Clock, CheckSquare, Eye, Archive } from 'lucide-react';
import {
  listContentByLifecycleStatus,
  transitionContentStatus,
  getStatusLabel,
  type ContentLifecycleMetadata,
  type ContentLifecycleStatus,
} from '../services/contentLifecycleService';
import { useSiteSettings, adjustColorBrightness, getContrastTextColor } from '../services/siteSettingsService';

export default function AdminModerationPage() {
  const [items, setItems] = useState<ContentLifecycleMetadata[]>([]);
  const [activeFilter, setActiveFilter] = useState<ContentLifecycleStatus | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const siteSettings = useSiteSettings();
  const cardBg = siteSettings.adminCardBgColor || '#111111';
  const cardHighlight = siteSettings.adminCardHighlightColor || '#FFC400';
  const cardBorder = adjustColorBrightness(cardBg, 12);
  const inputBg = adjustColorBrightness(cardBg, -4);
  const textColor = getContrastTextColor(cardBg);

  useEffect(() => {
    loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter]);

  async function loadItems() {
    try {
      setLoading(true);
      const data = await listContentByLifecycleStatus(activeFilter === 'all' ? undefined : activeFilter);
      setItems([...data]);
    } finally {
      setLoading(false);
    }
  }

  async function handleTransition(id: string, newStatus: ContentLifecycleStatus) {
    await transitionContentStatus(id, newStatus);
    setMessage(`Állapot sikeresen módosítva: ${getStatusLabel(newStatus)}`);
    await loadItems();
    setTimeout(() => setMessage(null), 3000);
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-400">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-r-transparent mb-2" style={{ borderColor: `${cardHighlight} transparent ${cardHighlight} ${cardHighlight}` }} />
        <div>Tartalom életciklus lista betöltése...</div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6" style={{ color: textColor }}>
      <div style={{ borderColor: cardBorder }} className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div>
          <h1 style={{ color: textColor }} className="text-2xl font-bold flex items-center gap-3">
            <CheckSquare style={{ color: cardHighlight }} size={26} />
            Tartalom Életciklus &amp; Moderációs Workflow
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Egységes 6-lépcsős életciklus állapotgép (Piszkozat &rarr; Beküldve &rarr; Ellenőrzés &rarr; Jóváhagyva &rarr; Publikálva &rarr; Archiválva)
          </p>
        </div>
        <span style={{ backgroundColor: `${cardHighlight}15`, borderColor: `${cardHighlight}30`, color: cardHighlight }} className="text-xs border font-bold px-3 py-1.5 rounded-lg self-start">
          {items.length} Tartalom Folyamatban
        </span>
      </div>

      {message && (
        <div style={{ backgroundColor: `${cardHighlight}15`, borderColor: `${cardHighlight}30`, color: cardHighlight }} className="p-4 border text-sm rounded-xl font-medium">
          {message}
        </div>
      )}

      {/* Workflow Status Filter Bar */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'draft', 'submitted', 'review', 'approved', 'published', 'archived'] as const).map((st) => (
          <button
            key={st}
            onClick={() => setActiveFilter(st)}
            style={
              activeFilter === st
                ? { backgroundColor: cardHighlight, color: '#000000' }
                : { backgroundColor: inputBg, borderColor: cardBorder, color: textColor }
            }
            className={`px-3 py-1.5 border rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeFilter === st ? 'font-bold' : 'hover:opacity-90'
            }`}
          >
            {st === 'all' ? 'Összes Állapot' : getStatusLabel(st)}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={item.id}
            style={{ backgroundColor: cardBg, borderColor: cardBorder }}
            className="border rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-lg"
          >
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <span style={{ backgroundColor: inputBg, borderColor: cardBorder, color: cardHighlight }} className="text-xs uppercase font-bold px-2.5 py-0.5 rounded border">
                  {item.contentType}
                </span>
                <span style={{ backgroundColor: inputBg, borderColor: cardBorder, color: textColor }} className="text-xs font-semibold px-2.5 py-0.5 rounded border">
                  Verzió: v{item.version}
                </span>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded ${
                  item.status === 'published'
                    ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                    : item.status === 'approved'
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                    : item.status === 'review'
                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    : item.status === 'submitted'
                    ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                    : item.status === 'archived'
                    ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                    : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                }`}>
                  {getStatusLabel(item.status)}
                </span>
              </div>
              <h2 style={{ color: textColor }} className="text-lg font-bold">{item.title}</h2>
              {item.excerpt && <p className="text-sm text-gray-400">{item.excerpt}</p>}
              <div className="flex items-center gap-4 text-xs text-gray-500 pt-1 flex-wrap">
                <span>Szerző: <strong style={{ color: textColor }}>{item.author}</strong></span>
                <span className="flex items-center gap-1"><Clock size={12} /> {new Date(item.submittedAt).toLocaleString('hu-HU')}</span>
                {item.approvedBy && (
                  <span>Jóváhagyó: <strong style={{ color: cardHighlight }}>{item.approvedBy}</strong></span>
                )}
              </div>
            </div>

            {/* Interactive Workflow Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              {item.status === 'submitted' && (
                <button
                  onClick={() => handleTransition(item.id, 'review')}
                  className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer hover:bg-blue-500/20"
                >
                  <Eye size={14} /> Ellenőrzésre
                </button>
              )}
              {(item.status === 'submitted' || item.status === 'review') && (
                <button
                  onClick={() => handleTransition(item.id, 'approved')}
                  className="px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer hover:bg-cyan-500/20"
                >
                  <CheckCircle2 size={14} /> Jóváhagyás
                </button>
              )}
              {(item.status === 'approved' || item.status === 'review') && (
                <button
                  onClick={() => handleTransition(item.id, 'published')}
                  style={{ backgroundColor: cardHighlight, color: '#000000' }}
                  className="px-3 py-1.5 font-bold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer hover:opacity-90 shadow-md"
                >
                  <CheckCircle2 size={14} /> Publikálás
                </button>
              )}
              {item.status !== 'archived' && (
                <button
                  onClick={() => handleTransition(item.id, 'archived')}
                  className="px-3 py-1.5 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer hover:bg-red-500/20"
                >
                  <Archive size={14} /> Archiválás
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

