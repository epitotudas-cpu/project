import { useState, useEffect } from 'react';
import { MessageSquare, Star, Send, Heart, Edit3, Trash2, Save } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getComments, addComment, updateComment, deleteComment, toggleFavorite, isFavorite, type Comment } from '../services/communityService';

interface CommunityCommentsSectionProps {
  contentType: 'article' | 'glossary' | 'tool' | 'course';
  contentId: string;
  altContentId?: string;
  title?: string;
}

export default function CommunityCommentsSection({ contentType, contentId, altContentId, title }: CommunityCommentsSectionProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [guestName, setGuestName] = useState('');
  const [newComment, setNewComment] = useState('');
  const [rating, setRating] = useState(5);
  const [isFav, setIsFav] = useState(false);
  const [loading, setLoading] = useState(true);

  // Edit State
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [editCommentRating, setEditCommentRating] = useState(5);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentType, contentId, altContentId]);

  async function loadData() {
    try {
      setLoading(true);
      const data = await getComments(contentType, contentId, altContentId);
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
      : guestName.trim() || 'Vendég Látogató';
    const userId = user?.id || 'guest';

    const created = await addComment(userId, userName, contentType, contentId, newComment, rating);
    setComments((prev) => [created, ...prev.filter((c) => c.id !== created.id)]);
    setNewComment('');
  }

  const handleStartEdit = (c: Comment) => {
    setEditingCommentId(c.id);
    setEditCommentText(c.comment_text);
    setEditCommentRating(c.rating || 5);
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditCommentText('');
  };

  const handleSaveEdit = async (commentId: string) => {
    if (!editCommentText.trim()) return;
    const success = await updateComment(commentId, user?.id, editCommentText, editCommentRating);
    if (success) {
      setComments((prev) =>
        prev.map((item) =>
          item.id === commentId
            ? { ...item, comment_text: editCommentText.trim(), rating: editCommentRating }
            : item
        )
      );
      setEditingCommentId(null);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!window.confirm('Biztosan törölni szeretnéd ezt a hozzászólást?')) return;
    const success = await deleteComment(commentId, user?.id);
    if (success) {
      setComments((prev) => prev.filter((item) => item.id !== commentId));
    }
  };

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

      {/* New Comment Input (Available to Logged in users & Visitors) */}
      <form onSubmit={handleSubmitComment} className="space-y-3">
        {!user && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-[#181818] border border-[#262626] rounded-xl">
            <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
              <span className="text-xs text-gray-400 font-medium whitespace-nowrap">Neved:</span>
              <input
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Pl. Kovács Péter (Építőipari kivitelező)"
                className="w-full bg-[#111] border border-[#333] text-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-accent"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                window.location.hash = '#login';
              }}
              className="text-xs text-accent font-bold hover:underline whitespace-nowrap"
            >
              Vagy jelentkezz be fiókodba ➔
            </button>
          </div>
        )}

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
            className="px-5 py-2.5 bg-accent hover:bg-accent-hover text-black font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Send size={14} /> Küldés
          </button>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-4 pt-2">
        {comments.map((c) => {
          const isOwnComment = Boolean(user && c.user_id && c.user_id === user.id);
          const isEditing = editingCommentId === c.id;

          return (
            <div key={c.id} className="bg-[#161616] border border-[#222] rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">{c.user_name}</span>
                  {isOwnComment && (
                    <span className="text-[10px] bg-accent/20 border border-accent/40 text-accent font-bold px-2 py-0.5 rounded-full">
                      Saját hozzászólás
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {!isEditing && (
                    <div className="flex items-center gap-1">
                      {Array.from({ length: c.rating }).map((_, i) => (
                        <Star key={i} size={12} className="fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  )}

                  {/* Edit & Delete Action Buttons for registered user */}
                  {isOwnComment && !isEditing && (
                    <div className="flex items-center gap-1 ml-2 border-l border-[#333] pl-2">
                      <button
                        onClick={() => handleStartEdit(c)}
                        className="p-1 text-gray-400 hover:text-accent rounded-lg transition-colors cursor-pointer"
                        title="Hozzászólás szerkesztése"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="p-1 text-gray-400 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                        title="Hozzászólás törlése"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Inline Edit Form vs Display Text */}
              {isEditing ? (
                <div className="space-y-3 pt-1 border-t border-[#262626]">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 font-semibold">Módosított Értékelés:</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          type="button"
                          key={star}
                          onClick={() => setEditCommentRating(star)}
                          className="text-amber-400 hover:scale-110 transition-transform"
                        >
                          <Star size={16} className={star <= editCommentRating ? 'fill-amber-400' : 'text-gray-600'} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <textarea
                    rows={2}
                    value={editCommentText}
                    onChange={(e) => setEditCommentText(e.target.value)}
                    className="w-full bg-[#111] border border-[#333] text-white rounded-xl p-3 text-xs focus:outline-none focus:border-accent"
                  />

                  <div className="flex items-center gap-2 justify-end">
                    <button
                      onClick={handleCancelEdit}
                      className="px-3 py-1.5 bg-[#222] hover:bg-[#333] text-gray-300 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                    >
                      Mégse
                    </button>
                    <button
                      onClick={() => handleSaveEdit(c.id)}
                      className="px-3 py-1.5 bg-accent hover:bg-accent-hover text-black font-bold text-xs rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Save size={13} /> Mentés
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-300 leading-relaxed">{c.comment_text}</p>
              )}

              <div className="text-[11px] text-gray-500">{new Date(c.created_at).toLocaleString('hu-HU')}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
