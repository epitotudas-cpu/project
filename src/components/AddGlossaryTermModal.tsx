import { X } from 'lucide-react';
import { useState } from 'react';
import type { GlossaryTermFromJson } from '../lib/glossaryJsonService';
import { useSiteSettings, adjustColorBrightness, getContrastTextColor } from '../services/siteSettingsService';

interface AddGlossaryTermModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (term: Omit<GlossaryTermFromJson, 'id' | 'updatedAt'>) => void;
  categories: string[];
}

export default function AddGlossaryTermModal({
  isOpen,
  onClose,
  onAdd,
  categories,
}: AddGlossaryTermModalProps) {
  const [formData, setFormData] = useState({
    term: '',
    definition: '',
    category: categories[0] || 'Anyagismeret',
    tags: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const siteSettings = useSiteSettings();
  const cardBg = siteSettings.adminCardBgColor || '#111111';
  const cardHighlight = siteSettings.adminCardHighlightColor || '#FFC400';
  const cardBorder = adjustColorBrightness(cardBg, 12);
  const headerBg = adjustColorBrightness(cardBg, 4);
  const inputBg = adjustColorBrightness(cardBg, -6);
  const textColor = getContrastTextColor(cardBg);
  const inputTextColor = getContrastTextColor(inputBg);

  const fieldStyle: React.CSSProperties = {
    backgroundColor: inputBg,
    borderColor: cardBorder,
    color: inputTextColor,
  };
  const labelStyle: React.CSSProperties = {
    color: textColor === '#FFFFFF' ? '#9CA3AF' : '#4B5563',
  };

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.term.trim()) {
      setError('A fogalom neve szükséges');
      return;
    }

    if (!formData.definition.trim()) {
      setError('A definíció szükséges');
      return;
    }

    try {
      setLoading(true);
      const tags = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      onAdd({
        term: formData.term.trim(),
        definition: formData.definition.trim(),
        category: formData.category,
        tags,
      });

      setFormData({
        term: '',
        definition: '',
        category: categories[0] || 'Anyagismeret',
        tags: '',
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hiba történt');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div style={{ backgroundColor: cardBg, borderColor: cardBorder, color: textColor }} className="rounded-xl border w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
        <div style={{ backgroundColor: headerBg, borderColor: cardBorder }} className="sticky top-0 border-b px-6 py-4 flex items-center justify-between">
          <h2 style={{ color: textColor }} className="text-lg font-bold">Új fogalom hozzáadása</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded transition-colors cursor-pointer"
          >
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div>
            <label style={labelStyle} className="block text-sm font-semibold mb-1.5">
              Fogalom neve
            </label>
            <input
              type="text"
              name="term"
              value={formData.term}
              onChange={handleChange}
              placeholder="pl. Betonacél"
              style={fieldStyle}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label style={labelStyle} className="block text-sm font-semibold mb-1.5">
              Definíció
            </label>
            <textarea
              name="definition"
              value={formData.definition}
              onChange={handleChange}
              placeholder="Írja be a fogalom definícióját..."
              rows={4}
              style={fieldStyle}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none transition-colors resize-none"
            />
          </div>

          <div>
            <label style={labelStyle} className="block text-sm font-semibold mb-1.5">
              Kategória
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              style={fieldStyle}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none transition-colors"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle} className="block text-sm font-semibold mb-1.5">
              Címkék (vesszővel elválasztva)
            </label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="pl. beton, vas, szilárdság"
              style={fieldStyle}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none transition-colors"
            />
          </div>

          <div className="flex gap-3 pt-4 border-t" style={{ borderColor: cardBorder }}>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border text-gray-400 hover:text-white rounded-lg transition-colors font-medium cursor-pointer"
              style={{ borderColor: cardBorder }}
            >
              Mégse
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{ backgroundColor: cardHighlight, color: '#000000' }}
              className="flex-1 px-4 py-2 rounded-lg font-bold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-md"
            >
              {loading ? 'Mentés...' : 'Hozzáadás'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
