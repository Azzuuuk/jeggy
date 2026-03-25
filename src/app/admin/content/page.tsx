'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAdmin } from '@/hooks/useAdmin';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { createAdminNotification } from '@/lib/notifications';
import { removeActivities } from '@/lib/activities';
import Link from 'next/link';
import { ArrowLeft, FileText, PenLine, ListOrdered, Clock, Trash2, AlertTriangle, Search, ChevronLeft, ChevronRight } from 'lucide-react';

type ContentTab = 'reviews' | 'lists' | 'sessions';

interface ReviewRow {
  id: string;
  user_id: string;
  game_id: string;
  review: string;
  rating: number | null;
  created_at: string;
  username: string;
  game_name: string;
}

interface ListRow {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  is_public: boolean;
  created_at: string;
  username: string;
  game_count: number;
}

interface SessionRow {
  id: string;
  user_id: string;
  game_id: string;
  hours_played: number;
  session_note: string | null;
  session_date: string;
  created_at: string;
  username: string;
  game_name: string;
}

const PAGE_SIZE = 20;

export default function AdminContentPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [tab, setTab] = useState<ContentTab>('reviews');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [lists, setLists] = useState<ListRow[]>([]);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Warning modal
  const [warningTarget, setWarningTarget] = useState<{ userId: string; username: string; contentType: string } | null>(null);
  const [warningMessage, setWarningMessage] = useState('');

  useEffect(() => {
    if (!adminLoading && !isAdmin) router.push('/');
  }, [isAdmin, adminLoading, router]);

  useEffect(() => {
    setPage(0);
  }, [tab, search]);

  const fetchContent = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    try {
      setFetchError(null);
      if (tab === 'reviews') {
        // Fetch reviews
        let query = supabase
          .from('user_games')
          .select('id, user_id, game_id, review, rating, created_at', { count: 'exact' })
          .not('review', 'is', null)
          .order('created_at', { ascending: false })
          .range(from, to);

        const { data, count, error } = await query;
        if (error) throw error;
        setTotalCount(count || 0);

        if (data && data.length > 0) {
          // Get usernames + game names
          const userIds = [...new Set(data.map(r => r.user_id))];
          const gameIds = [...new Set(data.map(r => r.game_id))];

          const [profilesRes, gamesRes] = await Promise.all([
            supabase.from('profiles').select('id, username').in('id', userIds),
            supabase.from('games').select('id, name').in('id', gameIds),
          ]);

          const userMap = new Map((profilesRes.data || []).map(p => [p.id, p.username]));
          const gameMap = new Map((gamesRes.data || []).map(g => [String(g.id), g.name]));

          setReviews(data.map(r => ({
            ...r,
            username: userMap.get(r.user_id) || 'Unknown',
            game_name: gameMap.get(String(r.game_id)) || 'Unknown Game',
          })));
        } else {
          setReviews([]);
        }
      } else if (tab === 'lists') {
        const { data, count, error } = await supabase
          .from('lists')
          .select('id, user_id, title, description, is_public, game_ids, created_at', { count: 'exact' })
          .order('created_at', { ascending: false })
          .range(from, to);
        if (error) throw error;
        setTotalCount(count || 0);

        if (data && data.length > 0) {
          const userIds = [...new Set(data.map(l => l.user_id))];
          const { data: profiles } = await supabase.from('profiles').select('id, username').in('id', userIds);
          const userMap = new Map((profiles || []).map(p => [p.id, p.username]));

          setLists(data.map(l => ({
            ...l,
            username: userMap.get(l.user_id) || 'Unknown',
            game_count: l.game_ids?.length || 0,
          })));
        } else {
          setLists([]);
        }
      } else if (tab === 'sessions') {
        const { data, count, error } = await supabase
          .from('gaming_sessions')
          .select('id, user_id, game_id, session_date, hours_played, session_note, platform, created_at', { count: 'exact' })
          .order('created_at', { ascending: false })
          .range(from, to);
        
        if (error) {
          console.error('Sessions query error:', error.message, error.code);
          setSessions([]);
          setTotalCount(0);
          setFetchError(`Unable to load sessions: ${error.message}. You may need to add an admin RLS policy for gaming_sessions.`);
          return;
        }
        setFetchError(null);
        setTotalCount(count || 0);

        if (data && data.length > 0) {
          const userIds = [...new Set(data.map(s => s.user_id))];
          const { data: profiles } = await supabase.from('profiles').select('id, username').in('id', userIds);
          const userMap = new Map((profiles || []).map(p => [p.id, p.username]));

          const gameIds = [...new Set(data.map(s => String(s.game_id)))];
          const gameMap = new Map<string, string>();
          if (gameIds.length > 0) {
            const { data: games } = await supabase.from('games').select('id, name').in('id', gameIds);
            (games || []).forEach(g => gameMap.set(String(g.id), g.name));
          }

          setSessions(data.map(s => ({
            id: s.id,
            user_id: s.user_id,
            game_id: s.game_id,
            hours_played: s.hours_played,
            session_note: s.session_note || null,
            session_date: s.session_date,
            created_at: s.created_at,
            username: userMap.get(s.user_id) || 'Unknown',
            game_name: gameMap.get(String(s.game_id)) || 'Unknown Game',
          })));
        } else {
          setSessions([]);
        }
      }
    } catch (err: any) {
      console.error('Error fetching content:', err?.message || err?.code || JSON.stringify(err));
    } finally {
      setLoading(false);
    }
  }, [isAdmin, tab, page]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const removeReview = async (reviewId: string, userId: string, username: string) => {
    if (!user || !confirm(`Remove review by @${username}? This will notify the user.`)) return;
    try {
      // Get game_id before clearing, so we can clean up the feed activity
      const { data: ug } = await supabase.from('user_games').select('game_id').eq('id', reviewId).single();
      await supabase.from('user_games').update({ review: null }).eq('id', reviewId);
      // Remove the reviewed_game activity from the feed
      if (ug?.game_id) {
        await removeActivities({ userId, gameId: ug.game_id, activityType: 'reviewed_game' });
      }
      await createAdminNotification({
        userId,
        adminId: user.id,
        type: 'content_removed',
        message: 'Your review was removed by a moderator for violating community guidelines.',
      });
      fetchContent();
    } catch (err) {
      console.error('Error removing review:', err);
    }
  };

  const removeList = async (listId: string, userId: string, username: string, listTitle: string) => {
    if (!user || !confirm(`Delete list "${listTitle}" by @${username}? This will notify the user.`)) return;
    try {
      await supabase.from('lists').delete().eq('id', listId);
      await removeActivities({ userId, listId, activityType: 'created_list' });
      await createAdminNotification({
        userId,
        adminId: user.id,
        type: 'content_removed',
        message: `Your list "${listTitle}" was removed by a moderator for violating community guidelines.`,
      });
      fetchContent();
    } catch (err) {
      console.error('Error removing list:', err);
    }
  };

  const removeSession = async (sessionId: string, userId: string, username: string) => {
    if (!user || !confirm(`Delete diary session by @${username}? This will notify the user.`)) return;
    try {
      // Get game_id before deleting so we can clean up the feed
      const { data: session } = await supabase.from('gaming_sessions').select('game_id').eq('id', sessionId).single();
      await supabase.from('gaming_sessions').delete().eq('id', sessionId);
      if (session?.game_id) {
        await removeActivities({ userId, gameId: session.game_id, activityType: 'logged_session' });
      }
      await createAdminNotification({
        userId,
        adminId: user.id,
        type: 'content_removed',
        message: 'Your diary session was removed by a moderator for violating community guidelines.',
      });
      fetchContent();
    } catch (err) {
      console.error('Error removing session:', err);
    }
  };

  const sendWarning = async () => {
    if (!user || !warningTarget || !warningMessage.trim()) return;
    try {
      await createAdminNotification({
        userId: warningTarget.userId,
        adminId: user.id,
        type: 'admin_warning',
        message: warningMessage.trim(),
      });
      setWarningTarget(null);
      setWarningMessage('');
      alert('Warning sent');
    } catch (err) {
      console.error('Error sending warning:', err);
    }
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // Filter by search (client-side for current page)
  const filteredReviews = search
    ? reviews.filter(r => r.username.toLowerCase().includes(search.toLowerCase()) || r.review.toLowerCase().includes(search.toLowerCase()) || r.game_name.toLowerCase().includes(search.toLowerCase()))
    : reviews;
  const filteredLists = search
    ? lists.filter(l => l.username.toLowerCase().includes(search.toLowerCase()) || l.title.toLowerCase().includes(search.toLowerCase()))
    : lists;
  const filteredSessions = search
    ? sessions.filter(s => s.username.toLowerCase().includes(search.toLowerCase()) || s.game_name.toLowerCase().includes(search.toLowerCase()))
    : sessions;

  if (adminLoading || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-acid" />
      </div>
    );
  }

  const tabs: { key: ContentTab; label: string; icon: typeof PenLine }[] = [
    { key: 'reviews', label: 'Reviews', icon: PenLine },
    { key: 'lists', label: 'Lists', icon: ListOrdered },
    { key: 'sessions', label: 'Diary Sessions', icon: Clock },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <Link href="/admin" className="inline-flex items-center gap-1.5 text-accent-green hover:opacity-80 text-sm mb-4 transition-opacity">
        <ArrowLeft size={14} /> Back to Dashboard
      </Link>
      <div className="flex items-center gap-3 mb-1">
        <FileText size={24} className="text-blue-400" />
        <h1 className="text-3xl font-bold text-text-primary font-[family-name:var(--font-display)]">Manage Content</h1>
      </div>
      <p className="text-text-muted text-sm mb-6">Browse, review, and moderate all user-generated content</p>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by username, content, or game..."
          className="w-full pl-10 pr-4 py-3 bg-bg-card border border-border rounded-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-green transition-colors text-sm"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`pb-3 px-1 text-sm font-semibold transition-colors inline-flex items-center gap-1.5 ${
              tab === t.key
                ? 'text-text-primary border-b-2 border-blue-400'
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-acid" />
        </div>
      ) : (
        <>
          {/* Reviews Tab */}
          {tab === 'reviews' && (
            <div className="space-y-3">
              {filteredReviews.length === 0 ? (
                <div className="text-center py-12 text-text-muted">No reviews found</div>
              ) : filteredReviews.map((r) => (
                <div key={r.id} className="bg-bg-card border border-border rounded-sm p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Link href={`/profile/${r.username}`} className="text-sm font-semibold text-accent-green hover:opacity-80">@{r.username}</Link>
                        <span className="text-xs text-text-muted">on</span>
                        <Link href={`/games/${r.game_id}`} className="text-sm font-semibold text-text-primary hover:text-accent-orange transition-colors">{r.game_name}</Link>
                        {r.rating != null && (
                          <span className="text-xs font-bold text-accent-orange">{r.rating}/10</span>
                        )}
                        <span className="text-xs text-text-muted ml-auto flex-shrink-0">{new Date(r.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-text-secondary leading-relaxed line-clamp-3">{r.review}</p>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => setWarningTarget({ userId: r.user_id, username: r.username, contentType: 'review' })}
                        className="p-1.5 text-amber-400 hover:bg-amber-500/15 rounded-sm transition-colors"
                        title="Warn user"
                      >
                        <AlertTriangle size={14} />
                      </button>
                      <button
                        onClick={() => removeReview(r.id, r.user_id, r.username)}
                        className="p-1.5 text-red-400 hover:bg-red-500/15 rounded-sm transition-colors"
                        title="Remove review"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Lists Tab */}
          {tab === 'lists' && (
            <div className="space-y-3">
              {filteredLists.length === 0 ? (
                <div className="text-center py-12 text-text-muted">No lists found</div>
              ) : filteredLists.map((l) => (
                <div key={l.id} className="bg-bg-card border border-border rounded-sm p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Link href={`/lists/${l.id}`} className="text-sm font-bold text-text-primary hover:text-accent-orange transition-colors">{l.title}</Link>
                        <span className="text-xs text-text-muted">by</span>
                        <Link href={`/profile/${l.username}`} className="text-sm font-semibold text-accent-green hover:opacity-80">@{l.username}</Link>
                        <span className="text-xs text-text-muted">• {l.game_count} games</span>
                        {!l.is_public && <span className="text-[10px] bg-bg-elevated px-1.5 py-0.5 rounded text-text-muted font-bold">PRIVATE</span>}
                        <span className="text-xs text-text-muted ml-auto flex-shrink-0">{new Date(l.created_at).toLocaleDateString()}</span>
                      </div>
                      {l.description && <p className="text-sm text-text-secondary line-clamp-2">{l.description}</p>}
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => setWarningTarget({ userId: l.user_id, username: l.username, contentType: 'list' })}
                        className="p-1.5 text-amber-400 hover:bg-amber-500/15 rounded-sm transition-colors"
                        title="Warn user"
                      >
                        <AlertTriangle size={14} />
                      </button>
                      <button
                        onClick={() => removeList(l.id, l.user_id, l.username, l.title)}
                        className="p-1.5 text-red-400 hover:bg-red-500/15 rounded-sm transition-colors"
                        title="Remove list"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Sessions Tab */}
          {tab === 'sessions' && (
            <div className="space-y-3">
              {fetchError ? (
                <div className="bg-red-500/10 border border-red-500/30 rounded-sm p-4 text-center">
                  <AlertTriangle size={24} className="mx-auto text-red-400 mb-2" />
                  <p className="text-sm text-red-400 mb-2">{fetchError}</p>
                  <code className="text-xs text-text-muted block bg-bg-primary rounded p-2 mt-2 text-left">
                    {`CREATE POLICY "Admins can view all sessions" ON gaming_sessions FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));`}
                  </code>
                </div>
              ) : filteredSessions.length === 0 ? (
                <div className="text-center py-12 text-text-muted">No diary sessions found</div>
              ) : filteredSessions.map((s) => (
                <div key={s.id} className="bg-bg-card border border-border rounded-sm p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Link href={`/profile/${s.username}`} className="text-sm font-semibold text-accent-green hover:opacity-80">@{s.username}</Link>
                        <span className="text-xs text-text-muted">played</span>
                        <Link href={`/games/${s.game_id}`} className="text-sm font-semibold text-text-primary hover:text-accent-orange transition-colors">{s.game_name}</Link>
                        <span className="text-xs font-bold text-accent-teal">{s.hours_played}h</span>
                        <span className="text-xs text-text-muted ml-auto flex-shrink-0">{s.session_date}</span>
                      </div>
                      {s.session_note && <p className="text-sm text-text-secondary line-clamp-2">{s.session_note}</p>}
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => setWarningTarget({ userId: s.user_id, username: s.username, contentType: 'session' })}
                        className="p-1.5 text-amber-400 hover:bg-amber-500/15 rounded-sm transition-colors"
                        title="Warn user"
                      >
                        <AlertTriangle size={14} />
                      </button>
                      <button
                        onClick={() => removeSession(s.id, s.user_id, s.username)}
                        className="p-1.5 text-red-400 hover:bg-red-500/15 rounded-sm transition-colors"
                        title="Remove session"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-6 pt-6 border-t border-border">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="p-2 text-text-muted hover:text-text-primary disabled:opacity-30 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm text-text-muted">
                Page {page + 1} of {totalPages} ({totalCount} total)
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="p-2 text-text-muted hover:text-text-primary disabled:opacity-30 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}

      {/* Warning Modal */}
      {warningTarget && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setWarningTarget(null)}>
          <div className="bg-bg-card/95 backdrop-blur-xl border border-border rounded-sm max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={18} className="text-amber-400" />
              <h3 className="text-lg font-bold text-text-primary">Warn @{warningTarget.username}</h3>
            </div>
            <p className="text-sm text-text-muted mb-4">
              This will send a notification to the user. Use this to issue warnings about inappropriate content.
            </p>
            <textarea
              value={warningMessage}
              onChange={(e) => setWarningMessage(e.target.value)}
              placeholder="e.g., Your recent review contains language that violates our community guidelines. Please keep content respectful."
              className="w-full px-3 py-2 bg-bg-primary border border-border rounded-sm text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-amber-400 min-h-[100px] resize-none mb-4"
              maxLength={500}
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setWarningTarget(null); setWarningMessage(''); }}
                className="flex-1 py-2.5 bg-bg-elevated border border-border rounded-sm text-sm font-medium text-text-muted hover:text-text-primary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={sendWarning}
                disabled={!warningMessage.trim()}
                className="flex-1 py-2.5 bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 disabled:opacity-50 rounded-sm text-sm font-semibold transition-colors"
              >
                Send Warning
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
