'use client';

import { use, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { SupabaseGame } from '@/lib/types';
import { createNotification } from '@/lib/notifications';
import { Share2, Gamepad2, Calendar, Heart, MessageCircle, Send, Trash2, Star } from 'lucide-react';
import { ReportButton } from '@/components/ReportButton';

type Tier = 'S' | 'A' | 'B' | 'C' | 'D';

interface ListData {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  game_ids: string[];
  ranking_style: 'numbered' | 'tiered';
  tiers: Record<Tier, string[]> | null;
  is_public: boolean;
  created_at: string;
  likes_count: number;
  creator_username: string;
}

interface Comment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  username: string;
}

// TierMaker-style colors: warm→cool gradient
const TIER_COLORS: Record<Tier, string> = {
  S: '#ff7f7f',
  A: '#ffbf7f',
  B: '#ffdf7f',
  C: '#ffff7f',
  D: '#bfff7f',
};

interface ListDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function ListDetailPage({ params }: ListDetailPageProps) {
  const { id } = use(params);
  const { user } = useAuth();

  const [list, setList] = useState<ListData | null>(null);
  const [games, setGames] = useState<SupabaseGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Like state
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [likeLoading, setLikeLoading] = useState(false);

  // Comments state
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const { data: listData, error: listError } = await supabase
          .from('lists')
          .select('*, profiles!lists_user_id_fkey(username)')
          .eq('id', id)
          .single();

        if (listError || !listData) {
          setLoading(false);
          return;
        }

        const parsed: ListData = {
          ...listData,
          likes_count: listData.likes_count || 0,
          creator_username: (listData.profiles as any)?.username ?? 'unknown',
        };
        setList(parsed);
        setLikesCount(parsed.likes_count);

        if (parsed.game_ids?.length) {
          const numericIds = parsed.game_ids.map((gid) => parseInt(gid));
          const { data: gamesData } = await supabase
            .from('games')
            .select('id, name, slug, cover_url, average_rating, genres, platforms, release_year, developers')
            .in('id', numericIds);

          const gamesMap = new Map((gamesData || []).map((g) => [g.id, g]));
          setGames(numericIds.map((nid) => gamesMap.get(nid)).filter(Boolean) as SupabaseGame[]);
        }
      } catch (err) {
        console.error('Error fetching list:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  // Check if user already liked
  useEffect(() => {
    if (!user) return;
    supabase
      .from('list_likes')
      .select('id')
      .eq('list_id', id)
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => setLiked(!!data));
  }, [id, user]);

  // Fetch comments
  const fetchComments = useCallback(async () => {
    const { data: commentsData } = await supabase
      .from('list_comments')
      .select('id, user_id, content, created_at')
      .eq('list_id', id)
      .order('created_at', { ascending: true });

    if (!commentsData?.length) {
      setComments([]);
      return;
    }

    // Fetch usernames
    const userIds = [...new Set(commentsData.map((c) => c.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username')
      .in('id', userIds);

    const usernameMap = new Map((profiles || []).map((p) => [p.id, p.username]));

    setComments(
      commentsData.map((c) => ({
        ...c,
        username: usernameMap.get(c.user_id) || 'unknown',
      }))
    );
  }, [id]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleLike = async () => {
    if (!user || likeLoading) return;
    setLikeLoading(true);
    try {
      if (liked) {
        await supabase.from('list_likes').delete().eq('list_id', id).eq('user_id', user.id);
        setLiked(false);
        setLikesCount((c) => Math.max(0, c - 1));
      } else {
        await supabase.from('list_likes').insert({ list_id: id, user_id: user.id });
        setLiked(true);
        setLikesCount((c) => c + 1);

        // Notify list owner
        if (list && list.user_id !== user.id) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', user.id)
            .single();
          const username = profile?.username || 'Someone';
          createNotification({
            userId: list.user_id,
            actorId: user.id,
            type: 'like_list',
            targetId: id,
            targetType: 'list',
            message: `${username} liked your list "${list.title}"`,
          });
        }
      }
    } catch (err) {
      console.error('Like error:', err);
    } finally {
      setLikeLoading(false);
    }
  };

  const handleComment = async () => {
    if (!user || !newComment.trim() || commentLoading) return;
    setCommentLoading(true);
    try {
      const { checkClientRateLimit } = await import('@/lib/ratelimit-client');
      const rl = await checkClientRateLimit('createComment', user.id);
      if (!rl.success) { alert(rl.message); setCommentLoading(false); return; }
      const { error } = await supabase.from('list_comments').insert({
        list_id: id,
        user_id: user.id,
        content: newComment.trim(),
      });
      if (error) throw error;
      setNewComment('');
      await fetchComments();

      // Notify list owner
      if (list && list.user_id !== user.id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', user.id)
          .single();
        const username = profile?.username || 'Someone';
        createNotification({
          userId: list.user_id,
          actorId: user.id,
          type: 'comment_list',
          targetId: id,
          targetType: 'list',
          message: `${username} commented on your list "${list.title}"`,
        });
      }
    } catch (err) {
      console.error('Comment error:', err);
    } finally {
      setCommentLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await supabase.from('list_comments').delete().eq('id', commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err) {
      console.error('Delete comment error:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-accent-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!list) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h1 className="text-3xl font-bold font-[family-name:var(--font-display)] text-text-primary">List Not Found</h1>
        <Link href="/lists" className="text-accent-green hover:underline">
          Browse Lists
        </Link>
      </div>
    );
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  // Group games by tier for tiered lists
  const gamesByTier =
    list.ranking_style === 'tiered' && list.tiers
      ? (['S', 'A', 'B', 'C', 'D'] as Tier[]).reduce((acc, t) => {
          const ids = list.tiers?.[t] || [];
          acc[t] = games.filter((g) => ids.includes(g.id.toString()));
          return acc;
        }, {} as Record<Tier, SupabaseGame[]>)
      : null;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
              list.ranking_style === 'tiered'
                ? 'bg-yellow-500/15 text-yellow-400'
                : 'bg-accent-green/15 text-accent-green'
            }`}>
              {list.ranking_style === 'tiered' ? 'Tier List' : 'Ranked List'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-[family-name:var(--font-display)] text-text-primary">{list.title}</h1>
          {list.description && <p className="text-text-secondary mt-2">{list.description}</p>}

          <div className="flex items-center gap-3 mt-4 flex-wrap">
            <div className="w-10 h-10 rounded-full bg-accent-orange flex items-center justify-center text-black font-bold text-sm flex-shrink-0">
              {list.creator_username.charAt(0).toUpperCase()}
            </div>
            <Link
              href={`/profile/${list.creator_username}`}
              className="text-sm font-semibold text-text-primary hover:text-accent-orange transition-all duration-300"
            >
              {list.creator_username}
            </Link>
            <div className="flex items-center gap-1 text-text-muted text-xs">
              <Calendar size={13} />
              <span>{formatDate(list.created_at)}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-4 text-sm text-text-muted">
            <div className="flex items-center gap-1.5">
              <Gamepad2 size={15} />
              <span>{games.length} games</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={handleLike}
              disabled={!user || likeLoading}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-sm text-sm font-medium transition-all ${
                liked
                  ? 'bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25'
                  : 'border border-border text-text-muted hover:border-red-500/40 hover:text-red-400'
              } ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Heart size={15} className={liked ? 'fill-current' : ''} />
              {likesCount}
            </button>
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-4 py-2 rounded-sm border border-border text-text-muted text-sm font-medium hover:border-text-muted transition-all duration-300"
            >
              <Share2 size={15} />
              {copied ? 'Copied!' : 'Share'}
            </button>
            {user && list.user_id !== user.id && (
              <ReportButton type="list" targetId={list.id} targetUserId={list.user_id} className="px-3 py-2 border border-border rounded-sm" />
            )}
          </div>
        </div>
      </div>

      {/* Games */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        {list.ranking_style === 'tiered' && gamesByTier ? (
          /* ============================================ */
          /* TIERMAKER-STYLE TIER LIST                    */
          /* ============================================ */
          <div className="border border-[#1a1a1a] rounded-sm overflow-hidden">
            {(['S', 'A', 'B', 'C', 'D'] as Tier[]).map((tier) => {
              const tierGames = gamesByTier[tier];
              const color = TIER_COLORS[tier];
              return (
                <div key={tier} className="flex border-b border-[#1a1a1a] last:border-b-0 min-h-[100px]">
                  {/* Tier label — bold square block */}
                  <div
                    className="w-[88px] sm:w-[100px] flex-shrink-0 flex items-center justify-center"
                    style={{ backgroundColor: color }}
                  >
                    <span className="text-4xl sm:text-5xl font-black text-black/80 select-none">{tier}</span>
                  </div>
                  {/* Games — tightly packed, flex-wrap, dark bg */}
                  <div className="flex-1 bg-[#1a1a2e] flex flex-wrap items-start content-start gap-[3px] p-[3px]">
                    {tierGames.length > 0 ? (
                      tierGames.map((game) => (
                      <Link
                        key={game.id}
                        href={`/games/${game.slug}`}
                        className="block relative group"
                        title={game.name}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={game.cover_url || '/placeholder.jpg'}
                          alt={game.name}
                          className="w-[72px] h-[96px] sm:w-[88px] sm:h-[117px] object-cover group-hover:brightness-125 transition-all"
                        />
                        {/* Tooltip on hover */}
                        <div className="absolute bottom-0 left-0 right-0 bg-black/80 text-[10px] text-white text-center py-0.5 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                          {game.name}
                        </div>
                      </Link>
                    ))
                    ) : (
                      <div className="flex items-center justify-center w-full text-text-muted/40 text-xs italic py-6">
                        — empty —
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ============================================ */
          /* NUMBERED LIST DISPLAY                        */
          /* ============================================ */
          <div className="space-y-3">
            {games.map((game, index) => (
              <Link
                key={game.id}
                href={`/games/${game.slug}`}
                className="flex items-center gap-4 bg-bg-card/80 backdrop-blur-xl border border-border hover:border-border-light rounded-sm p-4 transition-all duration-300 group"
              >
                <div className="text-2xl font-bold font-[family-name:var(--font-mono)] text-text-muted w-12 text-center flex-shrink-0">
                  #{index + 1}
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={game.cover_url || '/placeholder.jpg'}
                  alt={game.name}
                  className="w-14 h-20 object-cover rounded flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold font-[family-name:var(--font-display)] text-text-primary group-hover:text-accent-green transition-all duration-300 truncate">
                    {game.name}
                  </h3>
                  <p className="text-xs text-text-muted mt-0.5 truncate">
                    {game.developers?.join(', ')}
                  </p>
                  {game.average_rating > 0 && (
                    <p className="text-sm text-accent-orange mt-1 flex items-center gap-1">
                      <Star size={12} className="fill-accent-orange" /> {game.average_rating.toFixed(1)}/10
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* ============================================ */}
        {/* COMMENTS SECTION                             */}
        {/* ============================================ */}
        <div className="mt-12 border-t border-border pt-8">
          <div className="flex items-center gap-2 mb-6">
            <MessageCircle size={20} className="text-text-muted" />
            <h2 className="text-xl font-bold font-[family-name:var(--font-display)] text-text-primary">Comments</h2>
            <span className="bg-bg-card border border-border text-text-muted text-xs font-bold font-[family-name:var(--font-mono)] px-2 py-0.5 rounded-sm">
              {comments.length}
            </span>
          </div>

          {/* New comment form */}
          {user ? (
            <div className="flex gap-3 mb-6">
              <div className="w-9 h-9 rounded-full bg-accent-orange flex items-center justify-center text-black text-xs font-bold flex-shrink-0">
                {user.email?.charAt(0).toUpperCase() || '?'}
              </div>
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleComment()}
                  placeholder="Add a comment..."
                  maxLength={1000}
                  className="flex-1 px-4 py-2 bg-bg-card/80 backdrop-blur-xl border border-border rounded-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-orange text-sm"
                />
                <button
                  onClick={handleComment}
                  disabled={!newComment.trim() || commentLoading}
                  className="px-3 py-2 bg-accent-orange hover:bg-accent-orange/90 disabled:bg-bg-elevated disabled:text-text-muted text-black rounded-sm transition-all duration-300"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-text-muted mb-6">
              <Link href="/login" className="text-accent-orange hover:underline">Sign in</Link> to leave a comment.
            </p>
          )}

          {/* Comments list */}
          {comments.length > 0 ? (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-bg-elevated flex items-center justify-center text-text-muted text-xs font-bold flex-shrink-0">
                    {comment.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/profile/${comment.username}`}
                        className="text-sm font-semibold text-text-primary hover:text-accent-orange transition-all duration-300"
                      >
                        {comment.username}
                      </Link>
                      <span className="text-xs text-text-muted">{formatDate(comment.created_at)}</span>
                      {user?.id === comment.user_id && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-text-muted hover:text-red-400 transition-all duration-300 ml-auto"
                          title="Delete comment"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-text-secondary mt-0.5">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-muted text-center py-6">No comments yet. Be the first!</p>
          )}
        </div>
      </div>
    </div>
  );
}
