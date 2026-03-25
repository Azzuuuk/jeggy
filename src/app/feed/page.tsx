'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { Globe, Users, Star, ListOrdered, Gamepad2, Rss, MessageSquare, Trophy, Play } from 'lucide-react';

type FeedTab = 'public' | 'friends';
type FilterType = 'all' | 'ratings' | 'lists' | 'status';

interface Activity {
  id: string;
  user_id: string;
  activity_type: string;
  game_id: string | null;
  game_name: string | null;
  game_cover_url: string | null;
  rating: number | null;
  review: string | null;
  list_id: string | null;
  list_title: string | null;
  created_at: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  likes_count?: number;
}

const filters: { key: FilterType; label: string; icon: React.ReactNode }[] = [
  { key: 'all', label: 'All', icon: <Rss className="w-3.5 h-3.5" /> },
  { key: 'ratings', label: 'Ratings & Reviews', icon: <Star className="w-3.5 h-3.5" /> },
  { key: 'lists', label: 'Lists', icon: <ListOrdered className="w-3.5 h-3.5" /> },
  { key: 'status', label: 'Status Updates', icon: <Gamepad2 className="w-3.5 h-3.5" /> },
];

const ACTIVITY_TYPE_FILTER: Record<FilterType, string[]> = {
  all: [],
  ratings: ['rated_game', 'reviewed_game'],
  lists: ['created_list'],
  status: ['started_playing', 'completed_game'],
};

function getRatingColor(rating: number) {
  if (rating >= 9) return 'text-yellow-400';
  if (rating >= 7) return 'text-accent-green';
  if (rating >= 5) return 'text-accent-teal';
  return 'text-text-muted';
}

function getActivityVerb(type: string) {
  switch (type) {
    case 'rated_game': return 'rated';
    case 'reviewed_game': return 'reviewed';
    case 'created_list': return 'created a list';
    case 'started_playing': return 'started playing';
    case 'completed_game': return 'completed';
    default: return 'did something with';
  }
}

function getActivityIcon(type: string) {
  switch (type) {
    case 'rated_game': return <Star size={12} className="text-accent-orange fill-accent-orange" />;
    case 'reviewed_game': return <MessageSquare size={12} className="text-accent-teal" />;
    case 'created_list': return <ListOrdered size={12} className="text-accent-teal" />;
    case 'started_playing': return <Play size={12} className="text-accent-green" />;
    case 'completed_game': return <Trophy size={12} className="text-yellow-400" />;
    default: return <Gamepad2 size={12} className="text-text-muted" />;
  }
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function FeedPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<FeedTab>('public');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');

  useEffect(() => {
    fetchFeed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, tab, filter]);

  const fetchFeed = async () => {
    setLoading(true);
    try {
      if (tab === 'friends') {
        await fetchFriendsFeed();
      } else {
        await fetchPublicFeed();
      }
    } catch (err) {
      console.error('Feed error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPublicFeed = async () => {
    let query = supabase
      .from('activities')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    const types = ACTIVITY_TYPE_FILTER[filter];
    if (types.length > 0) {
      query = query.in('activity_type', types);
    }

    const { data: actData, error } = await query;
    if (error) throw error;
    if (!actData?.length) { setActivities([]); return; }

    await enrichActivities(actData);
  };

  const fetchFriendsFeed = async () => {
    if (!user) { setActivities([]); return; }

    const { data: followingData } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id);

    const followingIds = followingData?.map((f) => f.following_id) || [];
    if (followingIds.length === 0) { setActivities([]); return; }

    let query = supabase
      .from('activities')
      .select('*')
      .in('user_id', followingIds)
      .order('created_at', { ascending: false })
      .limit(50);

    const types = ACTIVITY_TYPE_FILTER[filter];
    if (types.length > 0) {
      query = query.in('activity_type', types);
    }

    const { data: actData, error } = await query;
    if (error) throw error;
    if (!actData?.length) { setActivities([]); return; }

    await enrichActivities(actData);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const enrichActivities = async (actData: any[]) => {
    const userIds = [...new Set(actData.map((a) => a.user_id as string))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .in('id', userIds);

    const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

    // Filter out review activities where the review has been deleted
    const reviewActivities = actData.filter(a => a.activity_type === 'reviewed_game' && a.game_id);
    let deletedReviewKeys = new Set<string>();
    if (reviewActivities.length > 0) {
      const pairs = reviewActivities.map(a => ({ uid: a.user_id, gid: a.game_id }));
      const uniqueUsers = [...new Set(pairs.map(p => p.uid))];
      const uniqueGames = [...new Set(pairs.map(p => p.gid))];
      const { data: userGames } = await supabase
        .from('user_games')
        .select('user_id, game_id, review')
        .in('user_id', uniqueUsers)
        .in('game_id', uniqueGames);
      const existingReviews = new Set((userGames || []).filter(ug => ug.review).map(ug => `${ug.user_id}:${ug.game_id}`));
      deletedReviewKeys = new Set(
        reviewActivities
          .filter(a => !existingReviews.has(`${a.user_id}:${a.game_id}`))
          .map(a => a.id)
      );
    }

    setActivities(
      actData
        .filter(a => !deletedReviewKeys.has(a.id))
        .map((a) => ({
          ...(a as Activity),
          username: profileMap.get(a.user_id as string)?.username || 'unknown',
          display_name: profileMap.get(a.user_id as string)?.display_name || null,
          avatar_url: profileMap.get(a.user_id as string)?.avatar_url || null,
        })),
    );
  };

  return (
    <div className="min-h-screen relative">
      {/* Ambient atmosphere */}
      <div className="ambient-orb w-[450px] h-[450px] -top-32 right-0 bg-[radial-gradient(circle,rgba(204,255,0,0.08)_0%,transparent_70%)]" />
      <div className="ambient-orb w-[350px] h-[350px] top-[400px] -left-32 bg-[radial-gradient(circle,rgba(99,102,241,0.08)_0%,transparent_70%)]" />

      {/* Header */}
      <div className="max-w-3xl mx-auto px-4 pt-8 pb-4">
        <h1 className="text-2xl font-bold font-[family-name:var(--font-display)] text-text-primary flex items-center gap-2"><Rss size={22} className="text-accent-orange" /> Feed</h1>
        <p className="text-sm text-text-secondary mt-1">Stay in the loop with the gaming community</p>
      </div>

      {/* Tab Toggle */}
      {user && (
      <div className="max-w-3xl mx-auto px-4 mb-4">
        <div className="flex bg-bg-card/80 backdrop-blur-xl border border-border rounded-sm p-1">
          <button
            onClick={() => setTab('public')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-semibold transition-all duration-300 ${
              tab === 'public'
                ? 'bg-accent-orange/15 text-accent-orange'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <Globe size={16} />
            Public
          </button>
          <button
            onClick={() => setTab('friends')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-semibold transition-all duration-300 ${
              tab === 'friends'
                ? 'bg-accent-green/15 text-accent-green'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <Users size={16} />
            Friends
          </button>
        </div>
      </div>
      )}

      {/* Filter Pills */}
      <div className="max-w-3xl mx-auto px-4 mb-6">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-sm border transition-all duration-300 whitespace-nowrap ${
                filter === f.key
                  ? 'bg-accent-orange/15 border-accent-orange text-accent-orange'
                  : 'border-border text-text-muted hover:text-text-primary hover:border-border-light'
              }`}
            >
              {f.icon}
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Activity Stream */}
      <div className="max-w-3xl mx-auto px-4 pb-24">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-acid border-t-transparent rounded-full animate-spin" />
          </div>
        ) : activities.length > 0 ? (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="bg-bg-card/80 backdrop-blur-xl border border-border rounded-sm p-5 hover:border-border-light transition-all duration-300"
              >
                {/* Header */}
                <div className="flex items-start gap-3 mb-3">
                  <Link
                    href={`/profile/${activity.username}`}
                    className="flex-shrink-0"
                  >
                    {activity.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={activity.avatar_url} alt={activity.username} className="w-9 h-9 rounded-full object-cover" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent-green to-accent-teal flex items-center justify-center text-sm font-bold text-white">
                        {(activity.display_name || activity.username).charAt(0).toUpperCase()}
                      </div>
                    )}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <Link href={`/profile/${activity.username}`} className="font-semibold text-text-primary hover:text-accent-green transition-all duration-300">
                        {activity.display_name || activity.username}
                      </Link>
                      <span className="text-text-muted"> {getActivityVerb(activity.activity_type)} </span>
                      {activity.game_name && (
                        <span className="font-medium text-text-primary">{activity.game_name}</span>
                      )}
                      {activity.list_title && !activity.game_name && (
                        <span className="font-medium text-text-primary">{activity.list_title}</span>
                      )}
                    </p>
                    <span className="text-xs text-text-muted flex items-center gap-1">{getActivityIcon(activity.activity_type)} {timeAgo(activity.created_at)}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="flex gap-4 ml-12">
                  {activity.game_cover_url && (
                    <Link href={`/games/${activity.game_id}`} className="flex-shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={activity.game_cover_url}
                        alt={activity.game_name || ''}
                        className="w-16 h-22 object-cover rounded"
                      />
                    </Link>
                  )}
                  <div className="flex-1 min-w-0">
                    {activity.rating && (
                      <div className={`text-2xl font-bold font-[family-name:var(--font-mono)] ${getRatingColor(activity.rating)}`}>
                        {activity.rating}/10
                      </div>
                    )}
                    {activity.review && (
                      <p className="text-sm text-text-secondary mt-1 line-clamp-3">{activity.review}</p>
                    )}
                    {activity.list_id && activity.list_title && (
                      <Link
                        href={`/lists/${activity.list_id}`}
                        className="inline-flex items-center gap-2 mt-1 px-3 py-1.5 bg-bg-elevated border border-border rounded-sm text-sm text-text-primary hover:border-accent-orange/40 transition-all duration-300"
                      >
                        <ListOrdered size={14} className="text-accent-teal inline" /> {activity.list_title}
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-bg-card/80 backdrop-blur-xl border border-border rounded-sm">
            {tab === 'friends' ? (
              <>
                <Users className="w-12 h-12 text-text-muted mx-auto mb-4" />
                <h3 className="text-xl font-bold font-[family-name:var(--font-display)] text-text-primary mb-2">
                  {!user ? 'Sign in to see your friends feed' : 'Your friends feed is empty'}
                </h3>
                <p className="text-text-secondary text-sm mb-6">
                  {!user ? 'Connect with gamers you know' : 'Follow gamers to see their activity here'}
                </p>
                <Link
                  href={user ? '/discover' : '/login'}
                  className="inline-block px-6 py-2.5 bg-accent-green hover:opacity-90 text-black rounded-sm font-medium text-sm transition-opacity"
                >
                  {user ? 'Discover Gamers' : 'Sign In'}
                </Link>
              </>
            ) : (
              <>
                <Rss className="w-12 h-12 text-text-muted mx-auto mb-4" />
                <h3 className="text-xl font-bold font-[family-name:var(--font-display)] text-text-primary mb-2">No activity yet</h3>
                <p className="text-text-secondary text-sm mb-6">Be the first to rate a game and kick things off!</p>
                <Link
                  href="/games"
                  className="inline-block px-6 py-2.5 bg-accent-green hover:opacity-90 text-black rounded-sm font-medium text-sm transition-opacity"
                >
                  Browse Games
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
