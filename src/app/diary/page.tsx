'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Clock, Heart, Calendar, Monitor, BookOpen, Users, Search as SearchIcon, Gamepad2 } from 'lucide-react';
import { ReportButton } from '@/components/ReportButton';
import { createNotification } from '@/lib/notifications';

interface GameInfo {
  id: number;
  name: string;
  slug: string;
  cover_url: string | null;
}

interface SessionData {
  id: string;
  user_id: string;
  game_id: string;
  hours_played: number;
  session_date: string;
  session_note: string | null;
  platform: string | null;
  is_public: boolean;
  likes_count: number;
  created_at: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  game?: GameInfo;
  liked_by_me?: boolean;
}

type DiaryFilter = 'all' | 'following' | 'mine';

export default function DiaryPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<DiaryFilter>('all');

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('gaming_sessions')
        .select('id, user_id, game_id, session_date, hours_played, session_note, platform, likes_count, is_public, created_at')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(50);

      if (filter === 'mine' && user) {
        query = supabase
          .from('gaming_sessions')
          .select('id, user_id, game_id, session_date, hours_played, session_note, platform, likes_count, is_public, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50);
      } else if (filter === 'following' && user) {
        const { data: followingData } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', user.id);
        const followingIds = followingData?.map((f) => f.following_id) || [];
        if (followingIds.length === 0) {
          setSessions([]);
          setLoading(false);
          return;
        }
        query = supabase
          .from('gaming_sessions')
          .select('id, user_id, game_id, session_date, hours_played, session_note, platform, likes_count, is_public, created_at')
          .eq('is_public', true)
          .in('user_id', followingIds)
          .order('created_at', { ascending: false })
          .limit(50);
      }

      const { data, error } = await query;
      if (error) throw error;
      if (!data || data.length === 0) {
        setSessions([]);
        setLoading(false);
        return;
      }

      // Fetch profiles
      const userIds = [...new Set(data.map((s) => s.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', userIds);
      const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

      // Fetch games
      const gameIds = [...new Set(data.map((s) => parseInt(s.game_id)))].filter((id) => !isNaN(id));
      const { data: games } = await supabase
        .from('games')
        .select('id, name, slug, cover_url')
        .in('id', gameIds);
      const gameMap = new Map(games?.map((g) => [g.id.toString(), g]) || []);

      // Check likes by current user
      let myLikes = new Set<string>();
      if (user) {
        const sessionIds = data.map((s) => s.id);
        const { data: likesData } = await supabase
          .from('session_likes')
          .select('session_id')
          .eq('user_id', user.id)
          .in('session_id', sessionIds);
        myLikes = new Set(likesData?.map((l) => l.session_id) || []);
      }

      const enriched: SessionData[] = data.map((s) => {
        const prof = profileMap.get(s.user_id);
        return {
          ...s,
          username: prof?.username || 'unknown',
          display_name: prof?.display_name || null,
          avatar_url: prof?.avatar_url || null,
          game: gameMap.get(s.game_id) || undefined,
          liked_by_me: myLikes.has(s.id),
        };
      });

      setSessions(enriched);
    } catch (err) {
      console.error('Diary fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [filter, user]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleLike = async (sessionId: string, isLiked: boolean) => {
    if (!user) return;
    const session = sessions.find(s => s.id === sessionId);

    // Optimistic update
    setSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId
          ? { ...s, liked_by_me: !isLiked, likes_count: Math.max(0, (s.likes_count || 0) + (isLiked ? -1 : 1)) }
          : s,
      ),
    );

    try {
      if (isLiked) {
        const res = await fetch('/api/session-likes', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, sessionId }),
        });
        const data = await res.json();
        if (res.ok && data.likes_count !== undefined) {
          setSessions((prev) =>
            prev.map((s) => s.id === sessionId ? { ...s, likes_count: data.likes_count } : s)
          );
        }
      } else {
        const res = await fetch('/api/session-likes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, sessionId }),
        });
        const data = await res.json();
        if (res.ok && data.likes_count !== undefined) {
          setSessions((prev) =>
            prev.map((s) => s.id === sessionId ? { ...s, likes_count: data.likes_count } : s)
          );
        }

        // Send notification to session owner
        if (session && session.user_id !== user.id) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', user.id)
            .single();
          const username = profile?.username || 'Someone';
          const gameName = session.game?.name || 'a game';
          createNotification({
            userId: session.user_id,
            actorId: user.id,
            type: 'like_session',
            targetId: sessionId,
            targetType: 'session',
            message: `${username} liked your ${gameName} session`,
          });
        }
      }
    } catch {
      fetchSessions();
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const filters: { key: DiaryFilter; label: string }[] = [
    { key: 'all', label: 'All Sessions' },
    { key: 'following', label: 'Following' },
    { key: 'mine', label: 'My Sessions' },
  ];

  return (
    <div className="min-h-screen relative">
      {/* Ambient atmosphere */}
      <div className="ambient-orb w-[400px] h-[400px] -top-32 -right-24 bg-[radial-gradient(circle,rgba(99,102,241,0.08)_0%,transparent_70%)]" />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 pb-16">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen size={24} className="text-accent-teal" />
            <h1 className="text-2xl sm:text-3xl font-bold font-[family-name:var(--font-display)] text-text-primary">Gaming Diary</h1>
          </div>
          <p className="text-sm text-text-secondary">See what gamers are grinding right now</p>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 mb-8 border-b border-border">
          {filters.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 pb-3 text-sm font-semibold transition-all duration-300 relative ${
                filter === tab.key ? 'text-text-primary' : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              {tab.label}
              {filter === tab.key && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-teal rounded-t" />
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-acid border-t-transparent rounded-full animate-spin" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-16 bg-bg-card/80 backdrop-blur-xl border border-border rounded-sm">
            <div className="mb-4">
              {filter === 'mine' ? <BookOpen size={48} className="mx-auto text-text-muted" /> : filter === 'following' ? <Users size={48} className="mx-auto text-text-muted" /> : <Gamepad2 size={48} className="mx-auto text-text-muted" />}
            </div>
            <h3 className="text-xl font-bold font-[family-name:var(--font-display)] text-text-primary mb-2">
              {filter === 'mine'
                ? 'Your diary is empty. Time to log some hours!'
                : filter === 'following'
                  ? "Follow some gamers to see what they're playing"
                  : "No one's logged sessions yet. Be the first!"}
            </h3>
            <p className="text-sm text-text-secondary mb-6">
              {filter === 'mine'
                ? 'Log your gaming sessions to track your playtime and share your journey'
                : 'Discover active gamers and follow them to see their gaming activity'}
            </p>
            <Link
              href={filter === 'mine' ? '/games' : '/discover'}
              className="inline-block px-6 py-2.5 bg-accent-green hover:opacity-90 text-black rounded-sm font-medium text-sm transition-opacity"
            >
              {filter === 'mine' ? 'Browse Games' : 'Discover Gamers'}
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="bg-bg-card/80 backdrop-blur-xl border border-border rounded-sm p-5 hover:border-border-light transition-all duration-300"
              >
                {/* Header */}
                <div className="flex items-start gap-3 mb-4">
                  <Link
                    href={`/profile/${session.username}`}
                    className="w-9 h-9 rounded-full bg-gradient-to-br from-accent-green to-accent-teal flex items-center justify-center text-sm font-bold text-white flex-shrink-0 overflow-hidden"
                  >
                    {session.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={session.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      (session.display_name || session.username).charAt(0).toUpperCase()
                    )}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap text-sm">
                      <Link
                        href={`/profile/${session.username}`}
                        className="font-semibold text-text-primary hover:text-accent-green transition-all duration-300"
                      >
                        {session.display_name || session.username}
                      </Link>
                      <span className="text-text-muted">played for</span>
                      <span className="font-bold font-[family-name:var(--font-mono)] text-accent-teal">{session.hours_played}h</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-text-muted mt-0.5">
                      <span>{timeAgo(session.created_at)}</span>
                      {session.platform && (
                        <>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <Monitor size={10} />
                            {session.platform}
                          </span>
                        </>
                      )}
                      {session.session_date && (
                        <>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <Calendar size={10} />
                            {new Date(session.session_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Game card */}
                {session.game && (
                  <Link
                    href={`/games/${session.game.slug}`}
                    className="flex items-center gap-3 bg-bg-primary border border-border hover:border-border-light rounded-sm p-3 mb-3 transition-all duration-300 group"
                  >
                    {session.game.cover_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={session.game.cover_url}
                        alt={session.game.name}
                        className="w-12 h-16 object-cover rounded"
                      />
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold text-text-primary group-hover:text-accent-green transition-all duration-300 truncate">
                        {session.game.name}
                      </p>
                      <p className="text-xs text-text-muted flex items-center gap-1">
                        <Clock size={10} />
                        {session.hours_played}h this session
                      </p>
                    </div>
                  </Link>
                )}

                {/* Note */}
                {session.session_note && (
                  <p className="text-sm text-text-secondary leading-relaxed mb-3 italic">
                    &ldquo;{session.session_note}&rdquo;
                  </p>
                )}

                {/* Like + Report */}
                <div className="flex items-center gap-4 text-sm">
                  <button
                    onClick={() => user && handleLike(session.id, !!session.liked_by_me)}
                    disabled={!user}
                    className={`flex items-center gap-1.5 transition-all duration-300 ${
                      session.liked_by_me ? 'text-red-400' : 'text-text-muted hover:text-red-400'
                    }`}
                  >
                    <Heart size={14} fill={session.liked_by_me ? 'currentColor' : 'none'} />
                    <span>{session.likes_count || 0}</span>
                  </button>
                  {user && user.id !== session.user_id && (
                    <ReportButton type="session" targetId={session.id} targetUserId={session.user_id} className="text-xs" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
