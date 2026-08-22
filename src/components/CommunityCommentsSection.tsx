import { useState, useEffect } from 'react';
import { MessageSquare, Star, Send, Heart } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getComments, addComment, toggleFavorite, isFavorite, type Comment } from '../services/communityService';

interface CommunityCommentsSectionProps {
  contentType: 'article' | 'glossary' | 'tool' | 'course';
  contentId: string;
  title?: string;
}

export default function CommunityCommentsSection({ contentType, contentId, title }: CommunityCommentsSectionProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [rating, setRating] = useState(5);
  const [isFav, setIsFav] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentType, contentId]);

  async function loadData() {
    try {
      setLoading(true);
      const data = await getComments(contentType, contentId);
      setComments(data);

      if (user) {
        const favStatus = await isFavorite(user.id, contentType, contentId);
        setIsFav(favStatus);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim()) return;

    const userName = user
      ? user.user_metadata?.full_name || user.email?.split('@')[0] || 'Szakmai Felhasználó'
      : 'Vendég Látogató';
    const userId = user?.id || 'guest';

    const created = await addComment(userId, userName, contentType, contentId, newComment, rating);
    setComments((prev) => [created, ...prev.filter((c) => c.id !== created.id)]);
    setNewComment('');
  }

  async function handleToggleFav() {
    if (!user) return;
    const nextStatus = await toggleFavorite(user.id, contentType, contentId);
    setIsFav(nextStatus);
  }

  if (loading) {
    return <div className="py-4 text-xs text-gray-500">Hozzászólások betöltése...</div>;
  }

  return (
    <div className="bg-[#111] border border-[#1E1E1E] rounded-2xl p-6 space-y-6 mt-8">
      <div className="flex items-center justify-between border-b border-[#1E1E1E] pb-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <MessageSquare className="text-accent" size={20} />
            Szakmai Megjegyzések & Hozzászólások ({comments.length})
          </h3>
          {title && <p className="text-xs text-gray-500 mt-0.5">{title}</p>}
        </div>

        {user && (
          <button
            onClick={handleToggleFav}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-colors ${
              isFav
                ? 'bg-red-500/10 border-red-500/30 text-red-400'
                : 'bg-[#1A1A1A] border-[#2A2A2A] text-gray-400 hover:text-white'
            }`}
          >
            <Heart size={14} className={isFav ? 'fill-red-400 text-red-400' : ''} />
            {isFav ? 'Mentve a Kedvencekbe' : 'Mentés Kedvencek közé'}
          </button>
        )}
      </div>

      {/* New Comment Input */}
      {user ? (
        <form onSubmit={handleSubmitComment} className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-semibold">Értékelés:</span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  className="text-amber-400 hover:scale-110 transition-transform"
                >
                  <Star size={16} className={star <= rating ? 'fill-amber-400' : 'text-gray-600'} />
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              required
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Írj szakmai észrevételt vagy tapasztalatot..."
              className="flex-1 bg-[#161616] border border-[#222] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-accent"
            />
            <button
              type="submit"
              className="px-5 py-2.5 bg-accent hover:bg-accent-hover text-black font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <Send size={14} /> Küldés
            </button>
          </div>
        </form>
      ) : (
        <div className="p-4 bg-[#161616] border border-[#222] rounded-xl text-xs text-gray-400 text-center">
          Hozzászólás írásához jelentkezz be fiókodba!
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4 pt-2">
        {comments.map((c) => (
          <div key={c.id} className="bg-[#161616] border border-[#222] rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">{c.user_name}</span>
              <div className="flex items-center gap-1">
                {Array.from({ length: c.rating }).map((_, i) => (
                  <Star key={i} size={12} className="fill-amber-400 text-amber-400" />
                ))}
              </div>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed">{c.comment_text}</p>
            <div className="text-[11px] text-gray-500">{new Date(c.created_at).toLocaleString('hu-HU')}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
