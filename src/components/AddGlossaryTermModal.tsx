import { X } from 'lucide-react';
import { useState } from 'react';
import type { GlossaryTermFromJson } from '../lib/glossaryJsonService';

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
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-[#0D0D0D] rounded-xl border border-[#1E1E1E] w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-[#0D0D0D] border-b border-[#1E1E1E] px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Új fogalom hozzáadása</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#1E1E1E] rounded transition-colors"
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
            <label className="block text-sm font-semibold text-gray-300 mb-1.5">
              Fogalom neve
            </label>
            <input
              type="text"
              name="term"
              value={formData.term}
              onChange={handleChange}
              placeholder="pl. Betonacél"
              className="w-full bg-[#111] border border-[#1E1E1E] rounded-lg px-3 py-2 text-gray-300 focus:border-[#FFC400] focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-1.5">
              Definíció
            </label>
            <textarea
              name="definition"
              value={formData.definition}
              onChange={handleChange}
              placeholder="Írja be a fogalom definícióját..."
              rows={4}
              className="w-full bg-[#111] border border-[#1E1E1E] rounded-lg px-3 py-2 text-gray-300 focus:border-[#FFC400] focus:outline-none transition-colors resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-1.5">
              Kategória
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full bg-[#111] border border-[#1E1E1E] rounded-lg px-3 py-2 text-gray-300 focus:border-[#FFC400] focus:outline-none transition-colors"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-1.5">
              Címkék (vesszővel elválasztva)
            </label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="pl. beton, vas, szilárdság"
              className="w-full bg-[#111] border border-[#1E1E1E] rounded-lg px-3 py-2 text-gray-300 focus:border-[#FFC400] focus:outline-none transition-colors"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-[#1E1E1E] rounded-lg text-gray-300 hover:bg-[#1E1E1E] transition-colors font-medium"
            >
              Mégse
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-[#FFC400] text-black rounded-lg font-bold hover:bg-[#E6B000] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Mentés...' : 'Hozzáadás'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
