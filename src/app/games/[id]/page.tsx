'use client';

import { useState, useEffect, useCallback } from 'react';
import { use } from 'react';
import { notFound, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { SupabaseGame } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import ColorCodedRating from '@/components/ui/ColorCodedRating';
import RatingInputHalf from '@/components/ui/RatingInputHalf';
import { Clock, Users, Bookmark, Play, Check, X, Share2, PenLine, ChevronDown, Heart, Image as ImageIcon, Trophy, Award, BarChart3, MessageCircle, ListPlus, Star, Timer } from 'lucide-react';
import { createActivity, removeActivities } from '@/lib/activities';
import dynamic from 'next/dynamic';
import { ReportButton } from '@/components/ReportButton';

const LogSessionModal = dynamic(() => import('@/components/ui/LogSessionModal'), { ssr: false });
const SubmitCompletionTimeModal = dynamic(() => import('@/components/SubmitCompletionTimeModal'), { ssr: false });

interface GamePageProps {
  params: Promise<{ id: string }>;
}

type GameStatus = 'Played' | 'Playing' | 'Completed' | 'Want to Play' | 'Dropped' | '100% Completed';

// Map display labels to DB values
const statusToDb: Record<GameStatus, string> = {
  'Played': 'played',
  'Playing': 'playing',
  'Completed': 'completed',
  'Want to Play': 'want_to_play',
  'Dropped': 'dropped',
  '100% Completed': '100_percent',
};
const dbToStatus: Record<string, GameStatus> = Object.fromEntries(
  Object.entries(statusToDb).map(([k, v]) => [v, k as GameStatus])
);

const statusOptions: { label: GameStatus; icon: React.ReactNode; color: string }[] = [
  { label: 'Playing', icon: <Play size={14} />, color: 'bg-accent-teal/15 text-accent-teal border-accent-teal/30' },
  { label: 'Played', icon: <Check size={14} />, color: 'bg-green-500/15 text-green-400 border-green-500/30' },
  { label: 'Completed', icon: <Trophy size={14} />, color: 'bg-accent-teal/15 text-accent-teal border-accent-teal/30' },
  { label: '100% Completed', icon: <Award size={14} />, color: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
  { label: 'Want to Play', icon: <Bookmark size={14} />, color: 'bg-accent-orange/15 text-accent-orange border-accent-orange/30' },
  { label: 'Dropped', icon: <X size={14} />, color: 'bg-red-500/15 text-red-400 border-red-500/30' },
];

export default function GamePage({ params }: GamePageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();

  const [game, setGame] = useState<SupabaseGame | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [status, setStatus] = useState<GameStatus | null>(null);
  const [liked, setLiked] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [reviews, setReviews] = useState<{ id: string; username: string; user_id: string; rating: number | null; review: string; created_at: string }[]>([]);
  const [logSessionOpen, setLogSessionOpen] = useState(false);
  const [totalHours, setTotalHours] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isEditingReview, setIsEditingReview] = useState(false);
  const [userReview, setUserReview] = useState<string | null>(null);
  const [communityTimes, setCommunityTimes] = useState<{
    main_avg: number | null; main_count: number;
    main_extra_avg: number | null; main_extra_count: number;
    completionist_avg: number | null; completionist_count: number;
  } | null>(null);
  const [userCompletionTime, setUserCompletionTime] = useState<{
    id: string; completion_type: string;
    main_story_hours: number | null; main_extra_hours: number | null; completionist_hours: number | null;
    platform: string | null; notes: string | null;
  } | null>(null);
  const [showSubmitTime, setShowSubmitTime] = useState(false);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [ratingDistribution, setRatingDistribution] = useState<Record<number, number>>({});

  const fetchGame = useCallback(async () => {
    // Try by slug first, then by numeric ID
    let query = supabase.from('games').select('*');
    const numericId = parseInt(id);
    if (!isNaN(numericId)) {
      query = query.or(`slug.eq.${id},id.eq.${numericId}`);
    } else {
      query = query.eq('slug', id);
    }

    const { data, error } = await query.limit(1).single();
    if (error || !data) {
      setLoading(false);
      return;
    }
    setGame(data);
    setLoading(false);
  }, [id]);

  const fetchUserGame = useCallback(async () => {
    if (!user || !game) return;
    const { data } = await supabase
      .from('user_games')
      .select('rating, status, liked, review')
      .eq('user_id', user.id)
      .eq('game_id', game.id.toString())
      .maybeSingle();

    if (data) {
      setUserRating(data.rating);
      setStatus(data.status ? dbToStatus[data.status] || null : null);
      setLiked(data.liked || false);
      setUserReview(data.review || null);
      if (data.review) setReviewText(data.review);
    }
  }, [user, game]);

  useEffect(() => { fetchGame(); }, [fetchGame]);
  useEffect(() => { fetchUserGame(); }, [fetchUserGame]);

  // Fetch public reviews for this game
  const fetchReviews = useCallback(async () => {
    if (!game) return;
    const { data } = await supabase
      .from('user_games')
      .select('id, rating, review, created_at, user_id')
      .eq('game_id', game.id.toString())
      .not('review', 'is', null)
      .order('created_at', { ascending: false })
      .limit(20);

    if (data && data.length > 0) {
      const filtered = data.filter((r: any) => r.review && r.review.trim());
      // Fetch usernames
      const userIds = [...new Set(filtered.map((r: any) => r.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', userIds);
      const profileMap = new Map((profiles || []).map((p: any) => [p.id, p.username]));

      setReviews(
        filtered.map((r: any) => ({
          id: r.id,
          username: profileMap.get(r.user_id) || 'Anonymous',
          user_id: r.user_id,
          rating: r.rating,
          review: r.review,
          created_at: r.created_at,
        })),
      );
    } else {
      setReviews([]);
    }
  }, [game]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const fetchTotalHours = useCallback(async () => {
    if (!user || !game) return;
    const { data } = await supabase
      .from('gaming_sessions')
      .select('hours_played')
      .eq('user_id', user.id)
      .eq('game_id', game.id.toString());
    if (data) {
      setTotalHours(data.reduce((sum, s) => sum + parseFloat(s.hours_played.toString()), 0));
    }
  }, [user, game]);

  useEffect(() => { fetchTotalHours(); }, [fetchTotalHours]);

  const fetchCommunityTimes = useCallback(async () => {
    if (!game) return;
    try {
      const { data, error } = await supabase
        .from('user_completion_times')
        .select('main_story_hours, main_extra_hours, completionist_hours')
        .eq('game_id', game.id.toString());
      if (error) throw error;
      const mainTimes = data?.filter(t => t.main_story_hours).map(t => parseFloat(t.main_story_hours)) || [];
      const mainExtraTimes = data?.filter(t => t.main_extra_hours).map(t => parseFloat(t.main_extra_hours)) || [];
      const completionistTimes = data?.filter(t => t.completionist_hours).map(t => parseFloat(t.completionist_hours)) || [];
      const avg = (arr: number[]) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length * 10) / 10 : null;
      setCommunityTimes({
        main_avg: avg(mainTimes), main_count: mainTimes.length,
        main_extra_avg: avg(mainExtraTimes), main_extra_count: mainExtraTimes.length,
        completionist_avg: avg(completionistTimes), completionist_count: completionistTimes.length,
      });
    } catch (error) { console.error('Error fetching community times:', error); }
  }, [game]);

  const fetchUserCompletionTime = useCallback(async () => {
    if (!user || !game) return;
    try {
      const { data, error } = await supabase
        .from('user_completion_times')
        .select('id, completion_type, main_story_hours, main_extra_hours, completionist_hours, platform, notes')
        .eq('user_id', user.id)
        .eq('game_id', game.id.toString())
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      setUserCompletionTime(data);
    } catch (error) { console.error('Error fetching user completion time:', error); }
  }, [user, game]);

  useEffect(() => { fetchCommunityTimes(); }, [fetchCommunityTimes]);
  useEffect(() => { fetchUserCompletionTime(); }, [fetchUserCompletionTime]);

  // Fetch status counts for Community Activity section
  const fetchStatusCounts = useCallback(async () => {
    if (!game) return;
    const { data } = await supabase
      .from('user_games')
      .select('status')
      .eq('game_id', game.id.toString())
      .not('status', 'is', null);
    if (data) {
      const counts: Record<string, number> = {};
      data.forEach((row: { status: string }) => {
        counts[row.status] = (counts[row.status] || 0) + 1;
      });
      setStatusCounts(counts);
    }
  }, [game]);

  // Fetch rating distribution for bar chart
  const fetchRatingDistribution = useCallback(async () => {
    if (!game) return;
    const { data } = await supabase
      .from('user_games')
      .select('rating')
      .eq('game_id', game.id.toString())
      .not('rating', 'is', null);
    if (data) {
      const dist: Record<number, number> = {};
      data.forEach((row: { rating: number }) => {
        const rounded = Math.round(row.rating);
        dist[rounded] = (dist[rounded] || 0) + 1;
      });
      setRatingDistribution(dist);
    }
  }, [game]);

  useEffect(() => { fetchStatusCounts(); }, [fetchStatusCounts]);
  useEffect(() => { fetchRatingDistribution(); }, [fetchRatingDistribution]);

  const upsertUserGame = async (updates: Record<string, unknown>) => {
    if (!user || !game) {
      router.push('/login');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_games')
        .upsert({
          user_id: user.id,
          game_id: game.id.toString(),
          ...updates,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,game_id' });
      if (error) throw error;

      // Log activity
      if (updates.rating) {
        createActivity({
          userId: user.id,
          activityType: 'rated_game',
          gameId: game.id.toString(),
          gameName: game.name,
          gameCoverUrl: game.cover_url,
          rating: updates.rating as number,
        });
      }
      if (updates.review) {
        createActivity({
          userId: user.id,
          activityType: 'reviewed_game',
          gameId: game.id.toString(),
          gameName: game.name,
          gameCoverUrl: game.cover_url,
          review: updates.review as string,
        });
      }
      if (updates.status === 'playing') {
        createActivity({
          userId: user.id,
          activityType: 'started_playing',
          gameId: game.id.toString(),
          gameName: game.name,
          gameCoverUrl: game.cover_url,
        });
      } else if (updates.status === 'completed' || updates.status === '100_percent') {
        createActivity({
          userId: user.id,
          activityType: 'completed_game',
          gameId: game.id.toString(),
          gameName: game.name,
          gameCoverUrl: game.cover_url,
        });
      }

      // Bayesian average: blend IGDB seed (35 virtual votes) with real user ratings
      if (updates.rating !== undefined) {
        const VIRTUAL_VOTES = 35;
        const igdbSeed = game.igdb_rating ? game.igdb_rating / 10 : 0;
        const { data: allRatings } = await supabase
          .from('user_games')
          .select('rating')
          .eq('game_id', game.id.toString())
          .not('rating', 'is', null)
          .gt('rating', 0);
        const realCount = allRatings?.length || 0;
        const realSum = allRatings?.reduce((sum, r) => sum + r.rating, 0) || 0;
        const bayesian = igdbSeed > 0
          ? (VIRTUAL_VOTES * igdbSeed + realSum) / (VIRTUAL_VOTES + realCount)
          : realCount > 0 ? realSum / realCount : 0;
        await supabase
          .from('games')
          .update({ average_rating: parseFloat(bayesian.toFixed(1)), total_ratings: realCount })
          .eq('id', game.id);
      }

      setTimeout(() => { fetchGame(); fetchReviews(); }, 500);
    } catch (err) {
      console.error('Error saving:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleRate = (rating: number) => {
    setUserRating(rating);
    upsertUserGame({ rating });
  };

  const handleStatusChange = (newStatus: GameStatus) => {
    const value = status === newStatus ? null : newStatus;
    setStatus(value);
    setShowStatusDropdown(false);
    upsertUserGame({ status: value ? statusToDb[value] : null });
  };

  const handleLike = () => {
    const newLiked = !liked;
    setLiked(newLiked);
    upsertUserGame({ liked: newLiked });
  };

  const handleRemoveRating = async () => {
    setUserRating(null);
    await upsertUserGame({ rating: null });
    // Clean up: delete row if nothing meaningful remains
    if (!user || !game) return;
    const { data: row } = await supabase
      .from('user_games')
      .select('status, review, liked')
      .eq('user_id', user.id)
      .eq('game_id', game.id.toString())
      .single();
    if (row && !row.status && !row.review && !row.liked) {
      await supabase
        .from('user_games')
        .delete()
        .eq('user_id', user.id)
        .eq('game_id', game.id.toString());
    }
  };

  const handleSaveReview = async () => {
    if (!user || !game) return;
    setSaving(true);
    try {
      const { checkClientRateLimit } = await import('@/lib/ratelimit-client');
      const rl = await checkClientRateLimit('createReview', user.id);
      if (!rl.success) { alert(rl.message); setSaving(false); return; }
      const text = reviewText.trim() || null;
      const { error } = await supabase
        .from('user_games')
        .upsert({
          user_id: user.id,
          game_id: game.id.toString(),
          review: text,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,game_id' });
      if (error) throw error;
      setUserReview(text);
      setIsEditingReview(false);
      if (text) {
        createActivity({
          userId: user.id,
          activityType: 'reviewed_game',
          gameId: game.id.toString(),
          gameName: game.name,
          gameCoverUrl: game.cover_url,
          review: text,
        });
      } else {
        removeActivities({ userId: user.id, gameId: game.id.toString(), activityType: 'reviewed_game' });
      }
      setTimeout(() => fetchReviews(), 500);
    } catch (err) {
      console.error('Error saving review:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-acid border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!game) { notFound(); }

  return (
    <div className="min-h-screen">
      {/* Fixed blurred cover background */}
      <div className="fixed inset-0 -z-10">
        {game.cover_url && (
          <div
            className="absolute inset-0 bg-cover bg-center scale-110"
            style={{ backgroundImage: `url(${game.cover_url})`, filter: 'blur(40px)' }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/85 to-[#0e1217]" />
        {/* Accent glow overlay */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(204,255,0,0.06)_0%,transparent_70%)] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(99,102,241,0.07)_0%,transparent_70%)] pointer-events-none" />
      </div>

      <div className="relative z-10">
        {/* Hero Section */}
        <section className="relative">
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-8">
            <div className="flex flex-col sm:flex-row gap-6 lg:gap-10">
              {/* Cover */}
              <div className="flex-shrink-0 mx-auto sm:mx-0">
                <div className="w-[220px] sm:w-[250px] lg:w-[280px] rounded-sm overflow-hidden shadow-2xl shadow-black/60 ring-1 ring-white/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={game.cover_url || '/placeholder-cover.jpg'}
                    alt={game.name}
                    className="w-full aspect-[3/4] object-cover"
                  />
                </div>
                {/* Hero Stats Grid — desktop: below poster */}
                <div className="hidden sm:grid grid-cols-2 gap-3 mt-4">
                  {[
                    { val: game.average_rating > 0 ? game.average_rating.toFixed(1) : '—', label: 'Avg Rating', color: 'text-accent-orange' },
                    { val: game.total_ratings.toLocaleString(), label: 'Ratings', color: 'text-text-primary' },
                    { val: game.total_reviews.toLocaleString(), label: 'Reviews', color: 'text-accent-green' },
                    { val: game.total_likes.toLocaleString(), label: 'Likes', color: 'text-red-400' },
                  ].map((s) => (
                    <div key={s.label} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-sm px-3 py-3 text-center">
                      <p className={`text-lg font-bold font-[family-name:var(--font-mono)] ${s.color}`}>{s.val}</p>
                      <p className="text-[10px] text-text-muted mt-0.5 uppercase tracking-wider">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Info column */}
              <div className="flex-1 min-w-0 space-y-4">
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-white font-[family-name:var(--font-display)] tracking-tight">{game.name}</h1>
                  <p className="text-text-secondary mt-1.5">
                    {game.developers?.join(', ') || 'Unknown Developer'}
                    {game.publishers?.length > 0 && ` · ${game.publishers.join(', ')}`}
                    {game.release_year && ` · ${game.release_year}`}
                  </p>
                </div>

                {/* Platform + Genre pills */}
                <div className="flex flex-wrap gap-2">
                  {game.platforms?.slice(0, 6).map(p => (
                    <span key={p} className="px-2.5 py-1 text-xs rounded-md bg-bg-elevated/80 text-text-secondary border border-border">
                      {p}
                    </span>
                  ))}
                  {game.genres?.map(g => (
                    <span key={g} className="px-2.5 py-1 text-xs rounded-md bg-bg-card border border-border text-text-secondary hover:border-accent-teal hover:text-accent-teal transition-all duration-300 cursor-pointer">
                      {g}
                    </span>
                  ))}
                </div>

                {/* Rating display */}
                {game.average_rating > 0 ? (
                  <ColorCodedRating
                    rating={game.average_rating}
                    size="lg"
                    showLabel
                    showBar
                    totalRatings={game.total_ratings}
                  />
                ) : (
                  <p className="text-text-muted text-sm">No ratings yet — be the first!</p>
                )}

                {/* Game modes */}
                {game.game_modes && game.game_modes.length > 0 && (
                  <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
                    {game.game_modes.map(mode => (
                      <div key={mode} className="flex items-center gap-1.5 text-text-secondary">
                        <Users size={13} className="text-text-muted" />
                        <span>{mode}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Rating input */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs text-text-muted uppercase tracking-wider">
                      {user ? 'Rate this game' : 'Sign in to rate'}
                    </p>
                    {user && userRating != null && (
                      <button
                        onClick={handleRemoveRating}
                        className="text-xs text-red-400 hover:text-red-300 transition-all duration-300"
                      >
                        Remove rating
                      </button>
                    )}
                  </div>
                  {user ? (
                    <RatingInputHalf value={userRating} onChange={handleRate} size="md" />
                  ) : (
                    <Link href="/login" className="text-accent-green text-sm hover:underline">
                      Log in to rate &rarr;
                    </Link>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-3 flex-wrap">
                  {/* Status dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => user ? setShowStatusDropdown(!showStatusDropdown) : router.push('/login')}
                      disabled={saving}
                      className={`flex items-center gap-2 px-3 py-2 text-xs rounded-sm border transition-all duration-300 ${
                        status
                          ? statusOptions.find(s => s.label === status)?.color || 'border-border text-text-secondary'
                          : 'border-border text-text-secondary hover:border-border-light'
                      }`}
                    >
                      {status ? statusOptions.find(s => s.label === status)?.icon : <Bookmark size={14} />}
                      {status || 'Game Status'}
                      <ChevronDown size={12} />
                    </button>
                    {showStatusDropdown && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowStatusDropdown(false)} />
                        <div className="absolute top-full mt-1 left-0 z-20 w-48 bg-bg-card/95 backdrop-blur-xl border border-border rounded-sm shadow-xl overflow-hidden">
                          {statusOptions.map(opt => (
                            <button
                              key={opt.label}
                              onClick={() => handleStatusChange(opt.label)}
                              className={`w-full flex items-center gap-2 px-3 py-2.5 text-xs transition-all duration-300 ${
                                status === opt.label ? opt.color : 'text-text-secondary hover:bg-bg-elevated'
                              }`}
                            >
                              {opt.icon}
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Like button */}
                  <button
                    onClick={() => user ? handleLike() : router.push('/login')}
                    disabled={saving}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs rounded-md border transition-all duration-300 ${
                      liked
                        ? 'bg-red-500/15 text-red-400 border-red-500/30'
                        : 'border-border text-text-secondary hover:border-border-light'
                    }`}
                  >
                    <Heart size={14} fill={liked ? 'currentColor' : 'none'} />
                    {liked ? 'Liked' : 'Like'}
                  </button>

                  {/* Log Session */}
                  <button
                    onClick={() => user ? setLogSessionOpen(true) : router.push('/login')}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-md border border-accent-teal/30 bg-accent-teal/10 text-accent-teal hover:bg-accent-teal/20 transition-all duration-300"
                  >
                    <Clock size={14} />
                    Log Session
                  </button>

                  <button className="flex items-center justify-center px-2 py-2 text-xs rounded-md border border-border text-text-muted hover:text-text-primary hover:border-border-light transition-all duration-300">
                    <Share2 size={14} />
                  </button>
                </div>

                {/* Total hours played */}
                {totalHours > 0 && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-accent-teal/5 border border-accent-teal/20 rounded-sm w-fit">
                    <Clock size={14} className="text-accent-teal" />
                    <span className="text-sm font-bold text-accent-teal font-[family-name:var(--font-mono)]">{totalHours.toFixed(1)}h</span>
                    <span className="text-xs text-text-muted">played by you</span>
                  </div>
                )}

                {/* Write Review */}
                {user && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-xs text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                        <PenLine size={12} />
                        Your Review
                      </p>
                      {!isEditingReview && userReview && (
                        <button
                          onClick={() => setIsEditingReview(true)}
                          className="text-xs text-accent-green hover:text-accent-green/80 transition-all duration-300"
                        >
                          Edit
                        </button>
                      )}
                    </div>
                    {isEditingReview || !userReview ? (
                      <div>
                        <textarea
                          value={reviewText}
                          onChange={(e) => setReviewText(e.target.value)}
                          placeholder="Share your thoughts about this game..."
                          className="w-full px-3 py-2.5 bg-bg-primary border border-border rounded-sm text-sm text-text-primary focus:outline-none focus:border-accent-green transition-all duration-300 min-h-[80px] resize-none"
                          maxLength={2000}
                        />
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs text-text-muted">{reviewText.length}/2000</p>
                          <div className="flex gap-2">
                            {userReview && (
                              <button
                                onClick={() => { setReviewText(userReview); setIsEditingReview(false); }}
                                className="px-3 py-1.5 text-xs rounded-md border border-border text-text-secondary hover:text-text-primary transition-all duration-300"
                              >
                                Cancel
                              </button>
                            )}
                            <button
                              onClick={handleSaveReview}
                              disabled={saving}
                              className="px-3 py-1.5 text-xs rounded-md bg-accent-green hover:bg-accent-green-hover text-black font-semibold transition-all duration-300 disabled:opacity-50"
                            >
                              {saving ? 'Saving...' : 'Save Review'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-bg-primary border border-border rounded-sm p-3">
                        <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">{userReview}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {/* Hero Stats — mobile only */}
          <div className="sm:hidden py-6">
            <div className="grid grid-cols-4 gap-2">
              {[
                { val: game.average_rating > 0 ? game.average_rating.toFixed(1) : '—', label: 'Rating', color: 'text-accent-orange' },
                { val: game.total_ratings.toLocaleString(), label: 'Ratings', color: 'text-text-primary' },
                { val: game.total_reviews.toLocaleString(), label: 'Reviews', color: 'text-accent-green' },
                { val: game.total_likes.toLocaleString(), label: 'Likes', color: 'text-red-400' },
              ].map((s) => (
                <div key={s.label} className="bg-bg-card/80 backdrop-blur-xl border border-border rounded-sm px-2 py-3 text-center">
                  <p className={`text-sm font-bold font-[family-name:var(--font-mono)] ${s.color}`}>{s.val}</p>
                  <p className="text-[10px] text-text-muted mt-0.5 uppercase tracking-wider">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* About */}
          {game.summary && (
            <section className="py-8 border-t border-border">
              <h2 className="text-lg font-bold text-text-primary mb-3 font-[family-name:var(--font-display)]">About</h2>
              <p className="text-sm text-text-secondary leading-relaxed">{game.summary}</p>
              {game.storyline && (
                <details className="mt-4">
                  <summary className="text-xs text-accent-orange cursor-pointer hover:underline">
                    Read storyline
                  </summary>
                  <p className="text-sm text-text-secondary leading-relaxed mt-3">{game.storyline}</p>
                </details>
              )}
            </section>
          )}

          {/* Community Activity */}
          {(Object.keys(statusCounts).length > 0 || Object.keys(ratingDistribution).length > 0 || game.time_to_beat_main || game.time_to_beat_completionist || communityTimes?.main_count || communityTimes?.completionist_count) && (
            <section className="py-8 border-t border-border section-glow-top">
              <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2 font-[family-name:var(--font-display)]">
                <BarChart3 size={16} className="text-text-muted" /> Community Activity
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Status Breakdown */}
                {Object.keys(statusCounts).length > 0 && (
                  <div className="bg-bg-card/80 backdrop-blur-xl border border-border rounded-sm p-5">
                    <h3 className="text-[11px] font-semibold text-text-muted mb-4 uppercase tracking-wider">Status</h3>
                    <div className="space-y-3">
                      {[
                        { key: 'playing', label: 'Playing', icon: <Play size={13} />, color: 'text-accent-teal' },
                        { key: 'played', label: 'Played', icon: <Check size={13} />, color: 'text-text-primary' },
                        { key: 'completed', label: 'Completed', icon: <Trophy size={13} />, color: 'text-accent-orange' },
                        { key: 'want_to_play', label: 'Want to Play', icon: <Bookmark size={13} />, color: 'text-blue-400' },
                        { key: 'dropped', label: 'Dropped', icon: <X size={13} />, color: 'text-text-muted' },
                      ].map(s => (
                        <div key={s.key} className="flex items-center justify-between">
                          <span className="flex items-center gap-2 text-sm text-text-secondary">
                            <span className={s.color}>{s.icon}</span> {s.label}
                          </span>
                          <span className={`text-sm font-bold font-[family-name:var(--font-mono)] ${s.color}`}>
                            {(statusCounts[s.key] || 0).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Rating Distribution */}
                {Object.keys(ratingDistribution).length > 0 && (
                  <div className="bg-bg-card/80 backdrop-blur-xl border border-border rounded-sm p-5">
                    <h3 className="text-[11px] font-semibold text-text-muted mb-4 uppercase tracking-wider">Rating Distribution</h3>
                    <div className="space-y-1.5">
                      {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map(score => {
                        const count = ratingDistribution[score] || 0;
                        const maxCount = Math.max(...Object.values(ratingDistribution), 1);
                        const percentage = (count / maxCount) * 100;
                        return (
                          <div key={score} className="flex items-center gap-2">
                            <span className="text-xs font-bold font-[family-name:var(--font-mono)] text-text-muted w-4 text-right">{score}</span>
                            <div className="flex-1 bg-bg-primary rounded-full h-2 overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-accent-orange to-accent-orange/40 rounded-none transition-all"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-xs font-[family-name:var(--font-mono)] text-text-muted w-8 text-right">{count.toLocaleString()}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Time to Beat + Submit */}
                {(game.time_to_beat_main || game.time_to_beat_completionist || communityTimes?.main_count || communityTimes?.completionist_count) && (
                  <div className="bg-bg-card/80 backdrop-blur-xl border border-border rounded-sm p-5">
                    <h3 className="text-[11px] font-semibold text-text-muted mb-4 uppercase tracking-wider">Time to Beat</h3>
                    <div className="space-y-4">
                      {game.time_to_beat_main && (
                        <div>
                          <p className="text-xs text-text-muted mb-1">Main Story</p>
                          <p className="text-2xl font-bold font-[family-name:var(--font-mono)] text-accent-green">{game.time_to_beat_main}h</p>
                        </div>
                      )}
                      {communityTimes?.main_avg && (
                        <div>
                          <p className="text-xs text-text-muted mb-1">Community Average</p>
                          <p className="text-xl font-bold font-[family-name:var(--font-mono)] text-blue-400">{communityTimes.main_avg}h</p>
                          <p className="text-[10px] text-text-muted">{communityTimes.main_count} reports</p>
                        </div>
                      )}
                      {game.time_to_beat_completionist && (
                        <div>
                          <p className="text-xs text-text-muted mb-1">100% Completion</p>
                          <p className="text-xl font-bold font-[family-name:var(--font-mono)] text-accent-orange">{game.time_to_beat_completionist}h</p>
                        </div>
                      )}
                    </div>
                    {user && (
                      <div className="mt-4 pt-4 border-t border-border">
                        {userCompletionTime ? (
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-medium text-text-primary">Your time</p>
                              <p className="text-[11px] text-text-muted mt-0.5">
                                {userCompletionTime.completion_type === 'main' && `Main Story: ${userCompletionTime.main_story_hours}h`}
                                {userCompletionTime.completion_type === 'main_extra' && `Main + Extras: ${userCompletionTime.main_extra_hours}h`}
                                {userCompletionTime.completion_type === 'completionist' && `100%: ${userCompletionTime.completionist_hours}h`}
                              </p>
                            </div>
                            <button
                              onClick={() => setShowSubmitTime(true)}
                              className="px-2.5 py-1 text-[11px] font-medium rounded-md bg-accent-teal/15 border border-accent-teal/30 text-accent-teal hover:bg-accent-teal/25 transition-all duration-300"
                            >
                              Edit
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setShowSubmitTime(true)}
                            className="w-full py-2 bg-bg-primary border border-border rounded-sm text-xs font-medium text-text-muted hover:text-accent-teal hover:border-accent-teal/30 transition-all duration-300 flex items-center justify-center gap-1.5"
                          >
                            <Timer size={12} /> Add Your Time
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Details */}
          <section className="py-8 border-t border-border">
            <h2 className="text-lg font-bold text-text-primary mb-4 font-[family-name:var(--font-display)]">Details</h2>
            <div className="bg-bg-card/80 backdrop-blur-xl rounded-sm border border-border p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
                {game.developers?.length > 0 && (
                  <div className="flex items-start gap-3">
                    <span className="text-text-muted mt-0.5"><PenLine size={14} /></span>
                    <div>
                      <p className="text-[11px] text-text-muted uppercase tracking-wider">Developer</p>
                      <p className="text-sm text-text-primary mt-0.5">{game.developers.join(', ')}</p>
                    </div>
                  </div>
                )}
                {game.publishers?.length > 0 && (
                  <div className="flex items-start gap-3">
                    <span className="text-text-muted mt-0.5"><Bookmark size={14} /></span>
                    <div>
                      <p className="text-[11px] text-text-muted uppercase tracking-wider">Publisher</p>
                      <p className="text-sm text-text-primary mt-0.5">{game.publishers.join(', ')}</p>
                    </div>
                  </div>
                )}
                {game.release_year && (
                  <div className="flex items-start gap-3">
                    <span className="text-text-muted mt-0.5"><Clock size={14} /></span>
                    <div>
                      <p className="text-[11px] text-text-muted uppercase tracking-wider">Release Year</p>
                      <p className="text-sm text-text-primary mt-0.5">{game.release_year}</p>
                    </div>
                  </div>
                )}
                {game.platforms?.length > 0 && (
                  <div className="flex items-start gap-3">
                    <span className="text-text-muted mt-0.5"><Play size={14} /></span>
                    <div>
                      <p className="text-[11px] text-text-muted uppercase tracking-wider">Platforms</p>
                      <p className="text-sm text-text-primary mt-0.5">{game.platforms.join(', ')}</p>
                    </div>
                  </div>
                )}
                {game.game_modes?.length > 0 && (
                  <div className="flex items-start gap-3">
                    <span className="text-text-muted mt-0.5"><Users size={14} /></span>
                    <div>
                      <p className="text-[11px] text-text-muted uppercase tracking-wider">Game Modes</p>
                      <p className="text-sm text-text-primary mt-0.5">{game.game_modes.join(', ')}</p>
                    </div>
                  </div>
                )}
                {game.themes?.length > 0 && (
                  <div className="flex items-start gap-3">
                    <span className="text-text-muted mt-0.5"><Bookmark size={14} /></span>
                    <div>
                      <p className="text-[11px] text-text-muted uppercase tracking-wider">Themes</p>
                      <p className="text-sm text-text-primary mt-0.5">{game.themes.join(', ')}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Screenshots */}
          {game.screenshots && game.screenshots.length > 0 && (
            <section className="py-8 border-t border-border">
              <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2 font-[family-name:var(--font-display)]">
                <ImageIcon size={16} /> Screenshots
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {game.screenshots.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setLightboxImg(src)}
                    className="rounded-sm overflow-hidden bg-bg-card/80 backdrop-blur-xl border border-border hover:border-accent-orange/50 transition-all duration-300 group"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt={`${game.name} screenshot ${i + 1}`}
                      className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Reviews */}
          <section className="py-8 border-t border-border section-glow-top">
            <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2 font-[family-name:var(--font-display)]">
              <PenLine size={18} className="text-text-muted" /> Reviews
              {reviews.length > 0 && (
                <span className="bg-bg-card border border-border text-text-muted text-xs font-bold px-2 py-0.5 rounded-full">
                  {reviews.length}
                </span>
              )}
            </h2>

            {reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((r, i) => (
                  <div key={i} className="bg-bg-card/80 backdrop-blur-xl border border-border rounded-sm p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Link
                        href={`/profile/${r.username}`}
                        className="flex items-center gap-2 group"
                      >
                        <div className="w-7 h-7 rounded-full bg-accent-green flex items-center justify-center text-xs font-bold text-black flex-shrink-0">
                          {r.username.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-text-primary group-hover:text-accent-orange transition-all duration-300">
                          {r.username}
                        </span>
                      </Link>
                      <div className="flex items-center gap-2">
                        {r.rating != null && (
                          <span className="text-sm font-bold font-[family-name:var(--font-mono)] text-accent-orange flex items-center gap-1"><Star size={13} className="fill-accent-orange" /> {r.rating}/10</span>
                        )}
                        <span className="text-xs text-text-muted">
                          {new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <ReportButton type="review" targetId={r.id} targetUserId={r.user_id} />
                      </div>
                    </div>
                    <p className="text-sm text-text-secondary leading-relaxed">{r.review}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-text-muted text-center py-6">
                No reviews yet — be the first to review this game!
              </p>
            )}
          </section>
        </div>
      </div>

      {/* Log Session Modal */}
      {game && (
        <LogSessionModal
          isOpen={logSessionOpen}
          onClose={() => setLogSessionOpen(false)}
          gameId={game.id.toString()}
          gameName={game.name}
          gameCover={game.cover_url || undefined}
          onLogged={() => { fetchTotalHours(); }}
        />
      )}

      {/* Submit Completion Time Modal */}
      {showSubmitTime && game && (
        <SubmitCompletionTimeModal
          gameId={game.id.toString()}
          gameName={game.name}
          existingTime={userCompletionTime}
          onClose={() => setShowSubmitTime(false)}
          onSuccess={() => { fetchCommunityTimes(); fetchUserCompletionTime(); }}
        />
      )}

      {/* Lightbox */}
      {lightboxImg && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setLightboxImg(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightboxImg} alt="Screenshot" className="max-w-full max-h-full rounded-sm" />
        </div>
      )}
    </div>
  );
}
