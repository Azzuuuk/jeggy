'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { use } from 'react';
import {
  enhancedUserProfile,
  getGameById,
  reviews,
  journalEntries,
} from '@/lib/mockData';
import Link from 'next/link';
import { Star, PenLine, Search, X, Play, Check, Trophy, Award, Bookmark, UserPlus, UserCheck, Calendar, Gamepad2, ListOrdered, MessageCircle, Clock, BarChart3, ChevronLeft, ChevronRight } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import AnimatedCounter from '@/components/ui/AnimatedCounter';
import GameCard from '@/components/ui/GameCard';
import { GameStatus } from '@/lib/types';
import { useFollow } from '@/hooks/useFollow';
import { getRatingColor } from '@/components/ui/ColorCodedRating';
import RatingDistributionChart from '@/components/ui/RatingDistributionChart';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useProfileStats } from '@/hooks/useProfileStats';
import dynamic from 'next/dynamic';
import { ReportButton } from '@/components/ReportButton';

const EditProfileModal = dynamic(() => import('@/components/ui/EditProfileModal'), { ssr: false });
const ProfileEnhancements = dynamic(() => import('@/components/ProfileEnhancements'), { ssr: false });

interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

const TABS = ['Games', 'Lists', 'Reviews'] as const;
type Tab = (typeof TABS)[number];

const FILTERS = ['All', 'Playing', 'Played', 'Completed', '100% Completed', 'Want to Play', 'Dropped'] as const;

// Map display labels to DB values
const profileStatusToDb: Record<string, string> = {
  'Played': 'played',
  'Playing': 'playing',
  'Completed': 'completed',
  '100% Completed': '100_percent',
  'Want to Play': 'want_to_play',
  'Dropped': 'dropped',
};
const profileDbToStatus: Record<string, string> = Object.fromEntries(
  Object.entries(profileStatusToDb).map(([k, v]) => [v, k])
);

// Visual config for each status shelf
const STATUS_SHELF_CONFIG = [
  { dbValue: 'playing', label: 'Currently Playing', icon: <Play size={14} className="text-teal-400" />, iconBg: 'bg-teal-500/15', ringColor: 'ring-teal-500/30', barColor: 'bg-teal-500', lineColor: 'bg-teal-500/20' },
  { dbValue: 'completed', label: 'Completed', icon: <Trophy size={14} className="text-accent-teal" />, iconBg: 'bg-accent-teal/15', ringColor: 'ring-accent-teal/30', barColor: 'bg-accent-teal', lineColor: 'bg-accent-teal/20' },
  { dbValue: '100_percent', label: '100% Completed', icon: <Award size={14} className="text-yellow-400" />, iconBg: 'bg-yellow-500/15', ringColor: 'ring-yellow-500/30', barColor: 'bg-yellow-500', lineColor: 'bg-yellow-500/20' },
  { dbValue: 'played', label: 'Played', icon: <Check size={14} className="text-green-400" />, iconBg: 'bg-green-500/15', ringColor: 'ring-green-500/30', barColor: 'bg-green-500', lineColor: 'bg-green-500/20' },
  { dbValue: 'want_to_play', label: 'Want to Play', icon: <Bookmark size={14} className="text-orange-400" />, iconBg: 'bg-orange-500/15', ringColor: 'ring-orange-500/30', barColor: 'bg-orange-500', lineColor: 'bg-orange-500/20' },
  { dbValue: 'dropped', label: 'Dropped', icon: <X size={14} className="text-red-400" />, iconBg: 'bg-red-500/15', ringColor: 'ring-red-500/30', barColor: 'bg-red-500', lineColor: 'bg-red-500/20' },
];

function renderStars(rating: number) {
  const scaled = rating / 2;
  const full = Math.floor(scaled);
  const half = scaled - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <span className="inline-flex items-center gap-px">
      {Array.from({ length: full }, (_, i) => (
        <Star key={`f${i}`} className="w-3 h-3 fill-accent-orange text-accent-orange" />
      ))}
      {half && (
        <span className="relative w-3 h-3">
          <Star className="w-3 h-3 text-text-muted absolute inset-0" />
          <span className="absolute inset-0 overflow-hidden w-[50%]">
            <Star className="w-3 h-3 fill-accent-orange text-accent-orange" />
          </span>
        </span>
      )}
      {Array.from({ length: empty }, (_, i) => (
        <Star key={`e${i}`} className="w-3 h-3 text-text-muted" />
      ))}
    </span>
  );
}

export default function ProfilePage({ params }: ProfilePageProps) {
  const { username } = use(params);
  const { user } = useAuth();
  const { profile: supabaseProfile, loading: profileLoading, updateProfile } = useProfile(username);
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Determine if this is a real Supabase user or the mock user
  const isMockUser = !profileLoading && !supabaseProfile && username === enhancedUserProfile.username;
  const isRealUser = !!supabaseProfile;
  const isOwnProfile = !!user && supabaseProfile?.id === user.id;

  // Only show loading spinner on initial load (no profile yet)
  if (profileLoading && !supabaseProfile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-accent-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Real Supabase user profile
  if (isRealUser) {
    return <RealProfile
      profile={supabaseProfile}
      isOwnProfile={isOwnProfile}
      editModalOpen={editModalOpen}
      setEditModalOpen={setEditModalOpen}
      updateProfile={updateProfile}
    />;
  }

  // Fall back to mock profile for demo
  if (isMockUser) {
    return <MockProfile username={username} />;
  }

  // Not found
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-text-primary mb-2">User not found</h1>
        <p className="text-text-muted text-sm">No profile exists for @{username}</p>
      </div>
    </div>
  );
}

/* =========== REAL SUPABASE PROFILE =========== */

import { Profile } from '@/hooks/useProfile';
import { ProfileStats } from '@/hooks/useProfileStats';
import { supabase } from '@/lib/supabase';
import { SupabaseGame } from '@/lib/types';

interface UserGameWithGame {
  rating: number | null;
  status: string | null;
  liked: boolean;
  created_at: string;
  game: SupabaseGame | null;
}

function RealProfile({
  profile,
  isOwnProfile,
  editModalOpen,
  setEditModalOpen,
  updateProfile,
}: {
  profile: Profile;
  isOwnProfile: boolean;
  editModalOpen: boolean;
  setEditModalOpen: (open: boolean) => void;
  updateProfile: (updates: Partial<Profile>) => Promise<{ success: boolean; error?: string }>;
}) {
  const { stats, refetch: refetchStats } = useProfileStats(profile.id);
  const { isFollowing, followerCount, followingCount, loading: followLoading, toggleFollow } = useFollow(profile.id);
  const [activeTab, setActiveTab] = useState<Tab>('Games');
  const [shareCopied, setShareCopied] = useState(false);
  const [userGames, setUserGames] = useState<UserGameWithGame[]>([]);
  const [gamesLoading, setGamesLoading] = useState(true);
  const [gamesFilter, setGamesFilter] = useState<string>('All');
  const [userLists, setUserLists] = useState<{ id: string; title: string; description: string | null; game_ids: string[]; ranking_style: string; created_at: string }[]>([]);
  const [listsLoading, setListsLoading] = useState(false);
  const [rushmoreGames, setRushmoreGames] = useState<SupabaseGame[]>([]);
  const [editingRushmore, setEditingRushmore] = useState(false);
  const [rushmoreSearch, setRushmoreSearch] = useState('');
  const [rushmoreResults, setRushmoreResults] = useState<SupabaseGame[]>([]);
  const [userReviews, setUserReviews] = useState<{ game: SupabaseGame | null; rating: number | null; review: string; created_at: string }[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [totalHoursPlayed, setTotalHoursPlayed] = useState(0);
  const [followersModalOpen, setFollowersModalOpen] = useState(false);
  const [followingModalOpen, setFollowingModalOpen] = useState(false);
  const [followersList, setFollowersList] = useState<{id: string; username: string; display_name: string | null; avatar_url: string | null}[]>([]);
  const [followingList, setFollowingList] = useState<{id: string; username: string; display_name: string | null; avatar_url: string | null}[]>([]);
  const [hoursModalOpen, setHoursModalOpen] = useState(false);
  const [hoursBreakdown, setHoursBreakdown] = useState<{game_name: string; game_slug: string; cover_url: string | null; hours: number}[]>([]);
  const [hoursView, setHoursView] = useState<'games' | 'calendar'>('games');
  const [calendarData, setCalendarData] = useState<{date: string; hours: number}[]>([]);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [monthlyTotals, setMonthlyTotals] = useState<{month: string; hours: number}[]>([]);
  const [showMonthlyTotals, setShowMonthlyTotals] = useState(false);
  const [ratedGamesModalOpen, setRatedGamesModalOpen] = useState(false);

  const displayName = profile.display_name || profile.username;
  const initials = displayName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  // Fetch user's rated/tracked games
  useEffect(() => {
    const fetchUserGames = async () => {
      try {
        setGamesLoading(true);
        const { data: ugData, error: ugError } = await supabase
          .from('user_games')
          .select('rating, status, liked, created_at, game_id')
          .eq('user_id', profile.id)
          .or('rating.not.is.null,status.not.is.null,liked.eq.true')
          .order('created_at', { ascending: false });

        if (ugError || !ugData || ugData.length === 0) {
          setUserGames([]);
          setGamesLoading(false);
          return;
        }

        // Fetch game details
        const gameIds = ugData.map(ug => parseInt(ug.game_id));
        const { data: gamesData } = await supabase
          .from('games')
          .select('id, name, slug, cover_url, average_rating, genres, platforms, release_year')
          .in('id', gameIds);

        const merged = ugData.map(ug => ({
          ...ug,
          game: (gamesData?.find(g => g.id === parseInt(ug.game_id)) || null) as SupabaseGame | null,
        })) as UserGameWithGame[];

        setUserGames(merged);
      } catch {
        console.error('Error fetching user games');
      } finally {
        setGamesLoading(false);
      }
    };

    fetchUserGames();
  }, [profile.id]);

  // Fetch total hours played
  useEffect(() => {
    const fetchHours = async () => {
      const { data } = await supabase
        .from('gaming_sessions')
        .select('hours_played')
        .eq('user_id', profile.id);
      if (data) {
        setTotalHoursPlayed(Math.round(data.reduce((sum, s) => sum + parseFloat(s.hours_played.toString()), 0)));
      }
    };
    fetchHours();
  }, [profile.id]);

  // Fetch Mount Rushmore game details
  useEffect(() => {
    if (!profile.mount_rushmore_games?.length) {
      setRushmoreGames([]);
      return;
    }
    const fetchRushmore = async () => {
      const ids = profile.mount_rushmore_games!.map((id) => parseInt(id));
      const { data } = await supabase.from('games').select('id, name, slug, cover_url, average_rating, genres, platforms, release_year').in('id', ids);
      if (data) {
        // Preserve order
        const map = new Map(data.map((g) => [g.id, g]));
        setRushmoreGames(ids.map((id) => map.get(id)).filter(Boolean) as SupabaseGame[]);
      }
    };
    fetchRushmore();
  }, [profile.mount_rushmore_games]);

  // Search for Mount Rushmore games
  useEffect(() => {
    if (rushmoreSearch.length < 2) {
      setRushmoreResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      const { data } = await supabase.from('games').select('id, name, slug, cover_url, average_rating, genres, platforms, release_year').ilike('name', `%${rushmoreSearch}%`).limit(6);
      setRushmoreResults((data || []) as SupabaseGame[]);
    }, 300);
    return () => clearTimeout(timer);
  }, [rushmoreSearch]);

  const addToRushmore = async (game: SupabaseGame) => {
    const current = profile.mount_rushmore_games || [];
    if (current.includes(game.id.toString()) || current.length >= 4) return;
    const updated = [...current, game.id.toString()];
    await updateProfile({ mount_rushmore_games: updated } as any);
    setRushmoreGames((prev) => [...prev, game]);
    setRushmoreSearch('');
    setRushmoreResults([]);
  };

  const removeFromRushmore = async (gameId: number) => {
    const current = profile.mount_rushmore_games || [];
    const updated = current.filter((id) => id !== gameId.toString());
    await updateProfile({ mount_rushmore_games: updated } as any);
    setRushmoreGames((prev) => prev.filter((g) => g.id !== gameId));
  };

  const openFollowersModal = useCallback(async () => {
    setFollowersModalOpen(true);
    const { data } = await supabase
      .from('follows')
      .select('follower_id, profiles!follows_follower_id_fkey(id, username, display_name, avatar_url)')
      .eq('following_id', profile.id);
    if (data) {
      setFollowersList(data.map((d: any) => d.profiles).filter(Boolean));
    }
  }, [profile.id]);

  const openFollowingModal = useCallback(async () => {
    setFollowingModalOpen(true);
    const { data } = await supabase
      .from('follows')
      .select('following_id, profiles!follows_following_id_fkey(id, username, display_name, avatar_url)')
      .eq('follower_id', profile.id);
    if (data) {
      setFollowingList(data.map((d: any) => d.profiles).filter(Boolean));
    }
  }, [profile.id]);

  const openHoursModal = useCallback(async () => {
    setHoursModalOpen(true);
    // Fetch all sessions for both views
    const { data } = await supabase
      .from('gaming_sessions')
      .select('hours_played, game_id, session_date')
      .eq('user_id', profile.id)
      .order('session_date', { ascending: false });
    if (data && data.length > 0) {
      // Games breakdown
      const grouped: Record<string, number> = {};
      data.forEach((s: any) => {
        grouped[s.game_id] = (grouped[s.game_id] || 0) + parseFloat(s.hours_played.toString());
      });
      const gameIds = Object.keys(grouped).map(Number);
      const { data: games } = await supabase.from('games').select('id, name, slug, cover_url').in('id', gameIds);
      const gamesMap = new Map((games || []).map((g: any) => [g.id, g]));
      const breakdown = gameIds
        .map((id) => {
          const g = gamesMap.get(id);
          return g ? { game_name: g.name, game_slug: g.slug, cover_url: g.cover_url, hours: Math.round(grouped[id]) } : null;
        })
        .filter(Boolean)
        .sort((a: any, b: any) => b.hours - a.hours) as {game_name: string; game_slug: string; cover_url: string | null; hours: number}[];
      setHoursBreakdown(breakdown);

      // Calendar data — aggregate hours by date
      const byDate: Record<string, number> = {};
      const byMonth: Record<string, number> = {};
      data.forEach((s: any) => {
        const date = s.session_date?.split('T')[0] || '';
        if (date) {
          byDate[date] = (byDate[date] || 0) + parseFloat(s.hours_played.toString());
          const month = date.slice(0, 7); // YYYY-MM
          byMonth[month] = (byMonth[month] || 0) + parseFloat(s.hours_played.toString());
        }
      });
      setCalendarData(Object.entries(byDate).map(([date, hours]) => ({ date, hours: Math.round(hours * 10) / 10 })));
      setMonthlyTotals(
        Object.entries(byMonth)
          .sort(([a], [b]) => b.localeCompare(a))
          .map(([month, hours]) => ({ month, hours: Math.round(hours * 10) / 10 }))
      );
    }
  }, [profile.id]);

  const scrollToTabs = useCallback(() => {
    document.getElementById('profile-tabs')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const handleStatClick = useCallback((label: string) => {
    if (label === 'Games') { setActiveTab('Games'); scrollToTabs(); }
    else if (label === 'Reviews') { setActiveTab('Reviews'); scrollToTabs(); }
    else if (label === 'Lists') { setActiveTab('Lists'); scrollToTabs(); }
    else if (label === 'Avg Rating') { setRatedGamesModalOpen(true); }
    else if (label === 'Hours') { openHoursModal(); }
  }, [scrollToTabs, openHoursModal]);

  const ratedGames = useMemo(() => {
    return userGames
      .filter((g) => g.rating != null && g.rating > 0)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0));
  }, [userGames]);

  // Fetch user's lists
  useEffect(() => {
    if (activeTab !== 'Lists') return;
    const fetchLists = async () => {
      setListsLoading(true);
      try {
        const { data } = await supabase
          .from('lists')
          .select('id, title, description, game_ids, ranking_style, created_at')
          .eq('user_id', profile.id)
          .order('created_at', { ascending: false });
        setUserLists(data || []);
      } catch {
        console.error('Error fetching user lists');
      } finally {
        setListsLoading(false);
      }
    };
    fetchLists();
  }, [profile.id, activeTab]);

  // Fetch user's reviews
  useEffect(() => {
    if (activeTab !== 'Reviews') return;
    const fetchReviews = async () => {
      setReviewsLoading(true);
      try {
        const { data: ugData } = await supabase
          .from('user_games')
          .select('rating, review, created_at, game_id')
          .eq('user_id', profile.id)
          .not('review', 'is', null)
          .order('created_at', { ascending: false });

        if (!ugData || ugData.length === 0) {
          setUserReviews([]);
          setReviewsLoading(false);
          return;
        }

        const gameIds = ugData.map((ug) => parseInt(ug.game_id));
        const { data: gamesData } = await supabase.from('games').select('id, name, slug, cover_url, average_rating, genres, platforms, release_year').in('id', gameIds);

        setUserReviews(
          ugData
            .filter((ug) => ug.review && ug.review.trim())
            .map((ug) => ({
              game: (gamesData?.find((g) => g.id === parseInt(ug.game_id)) || null) as SupabaseGame | null,
              rating: ug.rating,
              review: ug.review,
              created_at: ug.created_at,
            })),
        );
      } catch {
        console.error('Error fetching user reviews');
      } finally {
        setReviewsLoading(false);
      }
    };
    fetchReviews();
  }, [profile.id, activeTab]);

  const filteredUserGames = gamesFilter === 'All'
    ? userGames
    : userGames.filter(ug => ug.status === profileStatusToDb[gamesFilter]);

  return (
    <>
      {/* Banner with Mount Rushmore background */}
      <div className="relative min-h-[320px] sm:min-h-[400px]">
        {/* Mount Rushmore background images */}
        {rushmoreGames.length > 0 ? (
          <>
            <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 overflow-hidden">
              {rushmoreGames.slice(0, 4).map((g) => (
                <div key={g.id} className="bg-cover bg-center" style={{ backgroundImage: `url(${g.cover_url || ''})` }} />
              ))}
            </div>
            <div className="absolute inset-0" style={{ backdropFilter: 'blur(16px)' }} />
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/50 to-bg-primary" />
            {/* Extended fade below the banner to blend into page */}
            <div className="absolute -bottom-24 left-0 right-0 h-24 bg-gradient-to-b from-bg-primary to-transparent" />
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-b from-bg-elevated/80 via-bg-card/60 to-bg-primary" />
            <div className="absolute -bottom-24 left-0 right-0 h-24 bg-gradient-to-b from-bg-primary to-transparent" />
          </>
        )}

        {/* Profile content overlaid on banner */}
        <div className="relative z-10 flex flex-col items-center justify-center min-h-[320px] sm:min-h-[400px] text-center px-4 py-8">
          {profile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatar_url} alt={displayName} className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover ring-4 ring-white/20" />
          ) : (
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-accent-green flex items-center justify-center text-2xl font-bold text-black ring-4 ring-white/20">
              {initials}
            </div>
          )}
          <h1 className="text-3xl sm:text-4xl font-bold text-text-primary mt-4 font-[family-name:var(--font-display)]">{displayName}</h1>
          <p className="text-text-muted text-sm">@{profile.username}</p>
          {profile.bio && (
            <p className="text-text-secondary text-sm mt-2 max-w-md line-clamp-2">{profile.bio}</p>
          )}

          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 mt-3 text-xs text-text-muted">
            <span className="flex items-center gap-1"><Calendar size={12} /> Joined {new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}</span>
            {profile.platforms && profile.platforms.length > 0 && (
              <>
                <span>·</span>
                <span className="flex items-center gap-1.5">
                  <Gamepad2 size={12} /> {profile.platforms.map((p) => (
                    <span key={p} className="px-1.5 py-0.5 rounded bg-bg-elevated border border-border text-text-muted">{p}</span>
                  ))}
                </span>
              </>
            )}
          </div>

          {/* Follower counts */}
          <div className="flex items-center justify-center gap-5 mt-3 text-sm">
            <span className="cursor-pointer hover:opacity-80 transition-opacity" onClick={openFollowersModal}><span className="font-bold text-text-primary">{followerCount}</span> <span className="text-text-muted hover:underline">followers</span></span>
            <span className="text-border">·</span>
            <span className="cursor-pointer hover:opacity-80 transition-opacity" onClick={openFollowingModal}><span className="font-bold text-text-primary">{followingCount}</span> <span className="text-text-muted hover:underline">following</span></span>
          </div>

          {/* Gamertags */}
          {profile.gamertags && Object.values(profile.gamertags).some(v => v) && (
            <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
              {profile.gamertags.psn && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-400">
                  <Gamepad2 size={11} /> PSN: {profile.gamertags.psn}
                </span>
              )}
              {profile.gamertags.xbox && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-green-500/10 border border-green-500/20 text-[11px] text-green-400">
                  <Gamepad2 size={11} /> Xbox: {profile.gamertags.xbox}
                </span>
              )}
              {profile.gamertags.nintendo && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-red-500/10 border border-red-500/20 text-[11px] text-red-400">
                  <Gamepad2 size={11} /> Nintendo: {profile.gamertags.nintendo}
                </span>
              )}
              {profile.gamertags.steam && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-text-muted/10 border border-text-muted/20 text-[11px] text-text-secondary">
                  <Gamepad2 size={11} /> Steam: {profile.gamertags.steam}
                </span>
              )}
            </div>
          )}

          <div className="flex items-center gap-3 mt-4">
            {isOwnProfile ? (
              <button
                onClick={() => setEditModalOpen(true)}
                className="bg-accent-green text-black px-5 py-2 rounded-sm font-medium text-sm hover:opacity-90 transition-opacity flex items-center gap-2"
              >
                <PenLine size={14} />
                Edit Profile
              </button>
            ) : (
              <button
                onClick={toggleFollow}
                disabled={followLoading}
                className={`px-5 py-2 rounded-sm font-medium text-sm transition-all duration-300 flex items-center gap-2 ${
                  isFollowing
                    ? 'bg-bg-elevated border border-border text-text-secondary hover:text-red-400 hover:border-red-400/40'
                    : 'bg-accent-green text-black hover:opacity-90'
                }`}
              >
                {isFollowing ? <><UserCheck size={14} /> Following</> : <><UserPlus size={14} /> Follow</>}
              </button>
            )}
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                setShareCopied(true);
                setTimeout(() => setShareCopied(false), 2000);
              }}
              className="border border-border text-text-secondary px-4 py-2 rounded-sm text-sm hover:text-text-primary hover:border-border transition-all duration-300"
            >
              {shareCopied ? 'Link copied!' : 'Share Profile'}
            </button>
            {!isOwnProfile && (
              <ReportButton type="user" targetId={profile.id} className="border border-border px-3 py-2 rounded-sm" />
            )}          </div>
        </div>
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pb-16">
        {/* Ambient atmosphere */}
        <div className="ambient-orb w-[450px] h-[450px] -top-20 -right-32 bg-[radial-gradient(circle,rgba(204,255,0,0.08)_0%,transparent_70%)]" />
        <div className="ambient-orb w-[350px] h-[350px] top-[600px] -left-40 bg-[radial-gradient(circle,rgba(99,102,241,0.08)_0%,transparent_70%)]" />

        {/* Stats Bar */}
        <div className="bg-bg-card/80 backdrop-blur-xl border-y border-border mt-8 py-5">
          <div className="grid grid-cols-5 gap-4 text-center">
            {[
              { val: stats.gamesPlayed, label: 'Games', color: 'text-text-primary', decimals: 0 },
              { val: stats.reviewsWritten, label: 'Reviews', color: 'text-text-primary', decimals: 0 },
              { val: stats.avgRating, label: 'Avg Rating', color: 'text-accent-orange', decimals: 1 },
              { val: stats.listsCreated, label: 'Lists', color: 'text-text-primary', decimals: 0 },
              { val: totalHoursPlayed, label: 'Hours', color: 'text-accent-teal', decimals: 0 },
            ].map((s) => (
              <div key={s.label} className="stat-hover cursor-pointer hover:bg-bg-elevated/50 rounded-sm transition-all duration-300" onClick={() => handleStatClick(s.label)}>
                <p className={`text-xl font-bold font-[family-name:var(--font-mono)] ${s.color}`}>
                  <AnimatedCounter end={s.val} decimals={s.decimals} />
                </p>
                <p className="text-xs uppercase tracking-wider text-text-muted mt-1 font-[family-name:var(--font-mono)] hover:underline">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Profile Enhancements: DNA, Personality, Compatibility, Hot Takes */}
        <ProfileEnhancements userId={profile.id} isOwnProfile={isOwnProfile} />

        {/* Mount Rushmore Section */}
        {(isOwnProfile || rushmoreGames.length > 0) && (
          <div className="mt-10 mb-4">
            <div className="bg-bg-card/60 backdrop-blur-xl border border-border rounded-sm p-5 sm:p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-sm bg-accent-orange/15 flex items-center justify-center">
                    <Trophy size={18} className="text-accent-orange" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-text-primary font-[family-name:var(--font-display)]">Gaming Mount Rushmore</h2>
                    <p className="text-xs text-text-muted">Top 4 all-time favorites</p>
                  </div>
                </div>
                {isOwnProfile && (
                  <button
                    onClick={() => setEditingRushmore(!editingRushmore)}
                    className="text-xs px-3 py-1.5 rounded-sm border border-border text-text-muted hover:text-text-primary hover:border-border-light transition-all duration-300"
                  >
                    {editingRushmore ? 'Done' : rushmoreGames.length > 0 ? 'Edit' : 'Set Up'}
                  </button>
                )}
              </div>

              {editingRushmore && isOwnProfile && (profile.mount_rushmore_games?.length || 0) < 4 && (
                <div className="relative mb-5">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="text"
                    value={rushmoreSearch}
                    onChange={(e) => setRushmoreSearch(e.target.value)}
                    placeholder="Search games to add..."
                    className="w-full pl-9 pr-4 py-2 bg-bg-elevated border border-border rounded-sm text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-orange"
                  />
                  {rushmoreResults.length > 0 && (
                    <div className="absolute z-20 left-0 right-0 mt-1 bg-bg-card/80 backdrop-blur-xl border border-border rounded-sm shadow-xl max-h-48 overflow-y-auto">
                      {rushmoreResults.map((g) => (
                        <button
                          key={g.id}
                          onClick={() => addToRushmore(g)}
                          disabled={(profile.mount_rushmore_games || []).includes(g.id.toString())}
                          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-bg-elevated text-left text-sm disabled:opacity-40"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={g.cover_url || '/placeholder.jpg'} alt={g.name} className="w-8 h-11 rounded object-cover flex-shrink-0" />
                          <span className="truncate text-text-primary">{g.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {rushmoreGames.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {rushmoreGames.map((game, index) => (
                    <div key={game.id} className="relative group">
                      <Link href={`/games/${game.slug}`}>
                        <div className="relative aspect-[2/3] rounded-sm overflow-hidden bg-bg-elevated ring-1 ring-border group-hover:ring-accent-orange/60 transition-all duration-300">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={game.cover_url || '/placeholder.jpg'}
                            alt={game.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute top-2 left-2 w-7 h-7 bg-gradient-to-br from-accent-orange to-yellow-500 rounded-full flex items-center justify-center font-bold text-xs text-black shadow-lg">
                            {index + 1}
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="absolute bottom-2.5 left-2.5 right-2.5">
                              <p className="font-semibold text-xs line-clamp-2 text-white">{game.name}</p>
                            </div>
                          </div>
                        </div>
                      </Link>
                      <p className="text-xs font-medium text-text-primary truncate mt-1.5 text-center group-hover:text-accent-orange transition-colors duration-300">
                        {game.name}
                      </p>
                      {editingRushmore && isOwnProfile && (
                        <button
                          onClick={() => removeFromRushmore(game.id)}
                          className="absolute top-1 right-1 p-1 bg-red-500/80 hover:bg-red-500 rounded text-white opacity-0 group-hover:opacity-100 transition-opacity z-20"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : isOwnProfile ? (
                <div className="border-2 border-dashed border-border rounded-sm py-8 text-center">
                  <p className="text-text-muted text-sm">Set your top 4 games to showcase on your profile</p>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div id="profile-tabs" className="flex gap-0 border-b border-border mt-10 mb-8">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm uppercase tracking-wider transition-all duration-300 ${
                activeTab === tab
                  ? 'text-text-primary font-semibold border-b-2 border-accent-orange'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Games Tab */}
        {activeTab === 'Games' && (
          <>
            {/* Status filter pills with counts */}
            <div className="flex flex-wrap gap-2 mb-6">
              {FILTERS.map((filter) => {
                const count = filter === 'All'
                  ? userGames.length
                  : userGames.filter(ug => ug.status === profileStatusToDb[filter]).length;
                return (
                  <button
                    key={filter}
                    onClick={() => setGamesFilter(filter)}
                    className={`px-3 py-1.5 text-xs rounded-md border transition-all duration-300 flex items-center gap-1.5 ${
                      gamesFilter === filter
                        ? 'bg-accent-orange/15 border-accent-orange text-accent-orange'
                        : 'border-border text-text-muted hover:text-text-primary hover:border-border-light'
                    }`}
                  >
                    {filter}
                    {count > 0 && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-sm ${
                        gamesFilter === filter ? 'bg-accent-orange/20' : 'bg-bg-elevated'
                      }`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {gamesLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="aspect-[2/3] bg-bg-elevated rounded-sm" />
                    <div className="h-4 bg-bg-elevated rounded mt-2 w-3/4" />
                  </div>
                ))}
              </div>
            ) : userGames.length > 0 ? (
              gamesFilter === 'All' ? (
                /* ─── SHELF VIEW: grouped by status ─── */
                <div className="space-y-12">
                  {STATUS_SHELF_CONFIG.map(shelf => {
                    const games = userGames.filter(ug => ug.status === shelf.dbValue);
                    if (games.length === 0) return null;
                    return (
                      <div key={shelf.dbValue}>
                        {/* Shelf header */}
                        <div className="flex items-center gap-3 mb-4">
                          <div className={`w-8 h-8 rounded-sm flex items-center justify-center ${shelf.iconBg}`}>
                            {shelf.icon}
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                              {shelf.label}
                              <span className="text-xs font-normal text-text-muted bg-bg-elevated px-2 py-0.5 rounded-sm">
                                {games.length}
                              </span>
                            </h3>
                          </div>
                          <div className={`flex-1 h-px ${shelf.lineColor}`} />
                        </div>

                        {/* Horizontal scroll shelf */}
                        <div className="relative">
                          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                            {games.map(({ game, rating }) => (
                              game && (
                                <Link key={game.id} href={`/games/${game.slug}`} className="flex-shrink-0 w-[120px] group">
                                  <div className={`relative aspect-[2/3] rounded-sm overflow-hidden bg-bg-elevated ring-1 ${shelf.ringColor} group-hover:ring-2 transition-all duration-300 group-hover:scale-105`}>
                                    {game.cover_url ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img src={game.cover_url} alt={game.name} className="w-full h-full object-cover" loading="lazy" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-text-muted text-xs">No Cover</div>
                                    )}
                                    {rating != null && rating > 0 && (
                                      <div className="absolute top-1.5 right-1.5 bg-black/80 backdrop-blur-sm rounded px-1 py-0.5">
                                        <span className="text-[10px] font-bold" style={{ color: getRatingColor(rating) }}>
                                          ★ {rating}
                                        </span>
                                      </div>
                                    )}
                                    {/* Status accent bar at bottom */}
                                    <div className={`absolute bottom-0 left-0 right-0 h-1 ${shelf.barColor}`} />
                                  </div>
                                  <p className="text-xs text-text-primary truncate mt-1.5 text-center">{game.name}</p>
                                </Link>
                              )
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Uncategorized (null status — just rated/liked without status) */}
                  {(() => {
                    const uncategorized = userGames.filter(ug => !ug.status);
                    if (uncategorized.length === 0) return null;
                    return (
                      <div>
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-8 h-8 rounded-sm flex items-center justify-center bg-gray-600/20">
                            <ListOrdered size={14} className="text-text-muted" />
                          </div>
                          <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                            Uncategorized
                            <span className="text-xs font-normal text-text-muted bg-bg-elevated px-2 py-0.5 rounded-sm">
                              {uncategorized.length}
                            </span>
                          </h3>
                          <div className="flex-1 h-px bg-border" />
                        </div>
                        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                          {uncategorized.map(({ game, rating }) => (
                            game && (
                              <Link key={game.id} href={`/games/${game.slug}`} className="flex-shrink-0 w-[120px] group">
                                <div className="relative aspect-[2/3] rounded-sm overflow-hidden bg-bg-elevated ring-1 ring-border group-hover:ring-2 group-hover:ring-text-muted transition-all duration-300 group-hover:scale-105">
                                  {game.cover_url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={game.cover_url} alt={game.name} className="w-full h-full object-cover" loading="lazy" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-text-muted text-xs">No Cover</div>
                                  )}
                                  {rating != null && rating > 0 && (
                                    <div className="absolute top-1.5 right-1.5 bg-black/80 backdrop-blur-sm rounded px-1 py-0.5">
                                      <span className="text-[10px] font-bold" style={{ color: getRatingColor(rating) }}>★ {rating}</span>
                                    </div>
                                  )}
                                </div>
                                <p className="text-xs text-text-primary truncate mt-1.5 text-center">{game.name}</p>
                              </Link>
                            )
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                /* ─── FILTERED GRID VIEW ─── */
                filteredUserGames.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {filteredUserGames.map(({ game, rating, status: gameStatus }) => (
                      game && (
                        <Link key={game.id} href={`/games/${game.slug}`} className="group">
                          <div className="relative aspect-[2/3] bg-bg-elevated rounded-sm overflow-hidden group-hover:scale-105 transition-transform duration-300">
                            {game.cover_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={game.cover_url} alt={game.name} className="w-full h-full object-cover" loading="lazy" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-text-muted text-xs">No Cover</div>
                            )}
                            {rating != null && rating > 0 && (
                              <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-sm rounded px-1.5 py-0.5">
                                <span className="text-xs font-bold" style={{ color: getRatingColor(rating) }}>
                                  <Star size={10} className="inline text-accent-orange fill-accent-orange" /> {rating}
                                </span>
                              </div>
                            )}
                            {gameStatus && (
                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 pt-6">
                                <span className="text-[10px] uppercase tracking-wider text-text-muted">
                                  {profileDbToStatus[gameStatus] || gameStatus}
                                </span>
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-text-primary truncate mt-1.5">{game.name}</p>
                        </Link>
                      )
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Gamepad2 size={32} className="mx-auto text-text-muted mb-2" />
                    <p className="text-text-muted text-sm">
                      {isOwnProfile
                        ? gamesFilter === 'Playing' ? 'Not currently playing any games'
                          : gamesFilter === 'Completed' ? 'No 100% completions yet — time to grind!'
                          : gamesFilter === 'Want to Play' ? 'Your wishlist is empty'
                          : gamesFilter === 'Dropped' ? 'No rage quits recorded'
                          : 'No games with this status yet'
                        : `No ${gamesFilter.toLowerCase()} games yet`}
                    </p>
                  </div>
                )
              )
            ) : (
              <div className="text-center py-16">
                <Gamepad2 size={48} className="mx-auto text-text-muted mb-4" />
                <h3 className="text-xl font-bold text-text-primary mb-2">No games yet</h3>
                <p className="text-text-muted text-sm mb-6">
                  {isOwnProfile
                    ? 'Start rating games to build your profile!'
                    : 'This user hasn\u2019t added any games yet.'}
                </p>
                {isOwnProfile && (
                  <Link
                    href="/games"
                    className="inline-block px-6 py-3 bg-accent-green hover:bg-accent-green-hover text-black rounded-sm font-semibold transition-all duration-300"
                  >
                    Browse Games
                  </Link>
                )}
              </div>
            )}
          </>
        )}

        {/* Lists tab */}
        {activeTab === 'Lists' && (
          listsLoading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-2 border-accent-green border-t-transparent rounded-full animate-spin" />
            </div>
          ) : userLists.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {userLists.map((list) => (
                <Link
                  key={list.id}
                  href={`/lists/${list.id}`}
                  className="bg-bg-card/80 backdrop-blur-xl border border-border rounded-sm p-5 hover:border-accent-orange/50 transition-all duration-300"
                >
                  <h4 className="text-sm font-semibold text-text-primary">{list.title}</h4>
                  {list.description && (
                    <p className="text-xs text-text-muted mt-1 line-clamp-2">{list.description}</p>
                  )}
                  <div className="flex items-center justify-between mt-3 text-xs text-text-muted">
                    <span>{list.game_ids?.length || 0} games · {list.ranking_style}</span>
                    <span>{new Date(list.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <ListOrdered size={48} className="mx-auto text-text-muted mb-4" />
              <h3 className="text-xl font-bold text-text-primary mb-2">No lists created</h3>
              <p className="text-text-muted text-sm mb-4">
                {isOwnProfile ? 'Create your first game list!' : 'This user hasn\u2019t created any lists yet.'}
              </p>
              {isOwnProfile && (
                <Link href="/lists/create" className="inline-block px-6 py-3 bg-accent-orange hover:bg-accent-orange/90 text-black rounded-sm font-semibold transition-all duration-300">
                  Create List
                </Link>
              )}
            </div>
          )
        )}

        {/* Reviews tab */}
        {activeTab === 'Reviews' && (
          reviewsLoading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-2 border-accent-green border-t-transparent rounded-full animate-spin" />
            </div>
          ) : userReviews.length > 0 ? (
            <div className="space-y-4">
              {userReviews.map((r, i) => (
                <div key={i} className="bg-bg-card/80 backdrop-blur-xl border border-border rounded-sm p-5">
                  <div className="flex items-start gap-4">
                    {r.game && (
                      <Link href={`/games/${r.game.slug}`} className="flex-shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={r.game.cover_url || '/placeholder.jpg'}
                          alt={r.game.name}
                          className="w-14 h-20 object-cover rounded hover:ring-2 ring-accent-orange transition-all"
                        />
                      </Link>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <Link
                          href={`/games/${r.game?.slug || ''}`}
                          className="text-sm font-bold text-text-primary hover:text-accent-orange transition-all duration-300 truncate"
                        >
                          {r.game?.name || 'Unknown Game'}
                        </Link>
                        <span className="text-xs text-text-muted flex-shrink-0 ml-2">
                          {new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                      {r.rating != null && (
                        <div className="flex items-center gap-1 mb-2">
                          {renderStars(r.rating)}
                          <span className="text-xs text-accent-orange font-medium ml-1">{r.rating}/10</span>
                        </div>
                      )}
                      <p className="text-sm text-text-secondary leading-relaxed">{r.review}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <MessageCircle size={48} className="mx-auto text-text-muted mb-4" />
              <h3 className="text-xl font-bold text-text-primary mb-2">No reviews written</h3>
              <p className="text-text-muted text-sm">
                {isOwnProfile ? 'Write a review on any game page!' : 'This user hasn\u2019t written any reviews yet.'}
              </p>
            </div>
          )
        )}

      </div>

      {/* Edit Profile Modal */}
      {isOwnProfile && (
        <EditProfileModal
          profile={profile}
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          onSave={updateProfile}
        />
      )}

      {/* Followers Modal */}
      <Modal isOpen={followersModalOpen} onClose={() => setFollowersModalOpen(false)} title="Followers">
        {followersList.length === 0 ? (
          <p className="text-text-muted text-sm text-center py-8">No followers yet</p>
        ) : (
          <div className="space-y-3">
            {followersList.map((u) => (
              <Link key={u.id} href={`/profile/${u.username}`} onClick={() => setFollowersModalOpen(false)} className="flex items-center gap-3 p-2 rounded-sm hover:bg-bg-elevated transition-all duration-300">
                {u.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={u.avatar_url} alt={u.username} className="w-9 h-9 rounded-full object-cover" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-bg-elevated border border-border flex items-center justify-center text-xs font-bold text-text-muted">
                    {(u.display_name || u.username).charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-text-primary">{u.display_name || u.username}</p>
                  <p className="text-xs text-text-muted">@{u.username}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Modal>

      {/* Following Modal */}
      <Modal isOpen={followingModalOpen} onClose={() => setFollowingModalOpen(false)} title="Following">
        {followingList.length === 0 ? (
          <p className="text-text-muted text-sm text-center py-8">Not following anyone yet</p>
        ) : (
          <div className="space-y-3">
            {followingList.map((u) => (
              <Link key={u.id} href={`/profile/${u.username}`} onClick={() => setFollowingModalOpen(false)} className="flex items-center gap-3 p-2 rounded-sm hover:bg-bg-elevated transition-all duration-300">
                {u.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={u.avatar_url} alt={u.username} className="w-9 h-9 rounded-full object-cover" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-bg-elevated border border-border flex items-center justify-center text-xs font-bold text-text-muted">
                    {(u.display_name || u.username).charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-text-primary">{u.display_name || u.username}</p>
                  <p className="text-xs text-text-muted">@{u.username}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Modal>

      {/* Hours Breakdown Modal */}
      <Modal isOpen={hoursModalOpen} onClose={() => { setHoursModalOpen(false); setHoursView('games'); setShowMonthlyTotals(false); }} title="Hours Breakdown">
        {/* View toggle */}
        <div className="flex bg-bg-primary border border-border rounded-sm p-1 mb-4">
          <button
            onClick={() => setHoursView('games')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-sm text-xs font-semibold transition-all duration-300 ${
              hoursView === 'games' ? 'bg-accent-orange text-black' : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            <Gamepad2 size={13} /> By Games
          </button>
          <button
            onClick={() => setHoursView('calendar')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-sm text-xs font-semibold transition-all duration-300 ${
              hoursView === 'calendar' ? 'bg-accent-orange text-black' : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            <Calendar size={13} /> By Calendar
          </button>
        </div>

        {hoursView === 'games' ? (
          /* Games view */
          hoursBreakdown.length === 0 ? (
            <p className="text-text-muted text-sm text-center py-8">No gaming sessions logged yet</p>
          ) : (
            <div className="space-y-2">
              {hoursBreakdown.map((g) => (
                <Link key={g.game_slug} href={`/games/${g.game_slug}`} onClick={() => setHoursModalOpen(false)} className="flex items-center gap-3 p-2 rounded-sm hover:bg-bg-elevated transition-all duration-300">
                  {g.cover_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={g.cover_url} alt={g.game_name} className="w-10 h-14 rounded object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-14 rounded bg-bg-elevated border border-border flex items-center justify-center flex-shrink-0">
                      <Gamepad2 size={16} className="text-text-muted" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{g.game_name}</p>
                  </div>
                  <div className="flex items-center gap-1 text-accent-teal flex-shrink-0">
                    <Clock size={14} />
                    <span className="text-sm font-bold font-[family-name:var(--font-mono)]">{g.hours}h</span>
                  </div>
                </Link>
              ))}
            </div>
          )
        ) : (
          /* Calendar view */
          calendarData.length === 0 ? (
            <p className="text-text-muted text-sm text-center py-8">No gaming sessions logged yet</p>
          ) : (
            <div>
              {/* Week graph for selected month */}
              {(() => {
                const year = calendarMonth.getFullYear();
                const month = calendarMonth.getMonth();
                const daysInMonth = new Date(year, month + 1, 0).getDate();
                const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
                const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

                // Build daily data for the month
                const dailyHours: { day: number; date: string; hours: number }[] = [];
                for (let d = 1; d <= daysInMonth; d++) {
                  const dateStr = `${monthStr}-${String(d).padStart(2, '0')}`;
                  const match = calendarData.find(c => c.date === dateStr);
                  dailyHours.push({ day: d, date: dateStr, hours: match?.hours || 0 });
                }
                const maxHours = Math.max(...dailyHours.map(d => d.hours), 1);

                // Group into weeks (Mon-Sun)
                const firstDayOfMonth = new Date(year, month, 1).getDay();
                const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; // Monday-based
                const weeks: (typeof dailyHours[0] | null)[][] = [];
                let currentWeek: (typeof dailyHours[0] | null)[] = Array(startOffset).fill(null);
                dailyHours.forEach(d => {
                  currentWeek.push(d);
                  if (currentWeek.length === 7) {
                    weeks.push(currentWeek);
                    currentWeek = [];
                  }
                });
                if (currentWeek.length > 0) {
                  while (currentWeek.length < 7) currentWeek.push(null);
                  weeks.push(currentWeek);
                }

                const monthTotal = dailyHours.reduce((sum, d) => sum + d.hours, 0);
                const monthLabel = new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

                return (
                  <>
                    {/* Month nav */}
                    <div className="flex items-center justify-between mb-4">
                      <button
                        onClick={() => setCalendarMonth(new Date(year, month - 1))}
                        className="p-1.5 rounded-sm hover:bg-bg-elevated transition-all duration-300 text-text-muted hover:text-text-primary"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <div className="text-center">
                        <p className="text-sm font-semibold text-text-primary font-[family-name:var(--font-display)]">{monthLabel}</p>
                        <p className="text-xs text-accent-teal font-[family-name:var(--font-mono)]">{Math.round(monthTotal * 10) / 10}h total</p>
                      </div>
                      <button
                        onClick={() => setCalendarMonth(new Date(year, month + 1))}
                        className="p-1.5 rounded-sm hover:bg-bg-elevated transition-all duration-300 text-text-muted hover:text-text-primary"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>

                    {/* Day headers */}
                    <div className="grid grid-cols-7 gap-1 mb-1">
                      {dayNames.map(d => (
                        <div key={d} className="text-[10px] text-text-muted text-center font-[family-name:var(--font-mono)]">{d}</div>
                      ))}
                    </div>

                    {/* Weekly bar chart rows */}
                    <div className="space-y-1">
                      {weeks.map((week, wi) => (
                        <div key={wi} className="grid grid-cols-7 gap-1">
                          {week.map((day, di) => (
                            <div key={di} className="flex flex-col items-center">
                              {day ? (
                                <div className="w-full group relative">
                                  <div className="w-full h-10 bg-bg-elevated rounded-sm flex items-end justify-center overflow-hidden">
                                    {day.hours > 0 && (
                                      <div
                                        className="w-full bg-gradient-to-t from-accent-teal to-accent-teal/60 rounded-sm transition-all duration-300"
                                        style={{ height: `${Math.max((day.hours / maxHours) * 100, 8)}%` }}
                                      />
                                    )}
                                  </div>
                                  <p className={`text-[9px] text-center mt-0.5 font-[family-name:var(--font-mono)] ${day.hours > 0 ? 'text-text-secondary' : 'text-text-muted/50'}`}>
                                    {day.day}
                                  </p>
                                  {day.hours > 0 && (
                                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-bg-elevated border border-border rounded-sm px-1.5 py-0.5 text-[10px] text-accent-teal font-[family-name:var(--font-mono)] opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                                      {day.hours}h
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="w-full h-10" />
                              )}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>

                    {/* Monthly totals toggle */}
                    <button
                      onClick={() => setShowMonthlyTotals(!showMonthlyTotals)}
                      className="w-full mt-4 py-2.5 text-xs font-semibold text-text-muted hover:text-text-primary border border-border rounded-sm hover:bg-bg-elevated transition-all duration-300 flex items-center justify-center gap-1.5"
                    >
                      <BarChart3 size={13} />
                      {showMonthlyTotals ? 'Hide' : 'Show'} Monthly Totals
                    </button>

                    {showMonthlyTotals && monthlyTotals.length > 0 && (
                      <div className="mt-3 space-y-1.5">
                        {monthlyTotals.map(mt => {
                          const maxMonthHours = Math.max(...monthlyTotals.map(m => m.hours), 1);
                          const pct = (mt.hours / maxMonthHours) * 100;
                          const label = new Date(mt.month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                          return (
                            <div key={mt.month} className="flex items-center gap-2">
                              <span className="text-[11px] text-text-muted w-16 text-right font-[family-name:var(--font-mono)]">{label}</span>
                              <div className="flex-1 h-2 bg-bg-elevated rounded-none overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-accent-teal to-accent-orange rounded-none transition-all duration-500" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="text-[11px] font-bold text-accent-teal w-10 text-right font-[family-name:var(--font-mono)]">{mt.hours}h</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )
        )}
      </Modal>

      {/* Rated Games Modal */}
      <Modal isOpen={ratedGamesModalOpen} onClose={() => setRatedGamesModalOpen(false)} title="Rated Games">
        {ratedGames.length === 0 ? (
          <p className="text-text-muted text-sm text-center py-8">No rated games yet</p>
        ) : (
          <div className="space-y-2">
            {ratedGames.map((ug) => (
              <Link key={ug.game?.id || ug.created_at} href={ug.game?.slug ? `/games/${ug.game.slug}` : '#'} onClick={() => setRatedGamesModalOpen(false)} className="flex items-center gap-3 p-2 rounded-sm hover:bg-bg-elevated transition-all duration-300">
                {ug.game?.cover_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={ug.game.cover_url} alt={ug.game.name} className="w-10 h-14 rounded object-cover flex-shrink-0" />
                ) : (
                  <div className="w-10 h-14 rounded bg-bg-elevated border border-border flex items-center justify-center flex-shrink-0">
                    <Gamepad2 size={16} className="text-text-muted" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{ug.game?.name || 'Unknown Game'}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {renderStars(ug.rating!)}
                  <span className="text-xs text-accent-orange font-medium ml-1">{ug.rating}/10</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Modal>
    </>
  );
}

/* =========== MOCK PROFILE (demo data) =========== */

function MockProfile({ username }: { username: string }) {
  const profile = enhancedUserProfile;
  const [activeTab, setActiveTab] = useState<Tab>('Games');
  const [gamesFilter, setGamesFilter] = useState<GameStatus | 'All'>('All');
  const [shareCopied, setShareCopied] = useState(false);

  const userReviewData = reviews.filter((r) => r.userId === profile.id);
  const totalRatings = profile.ratingDistribution.reduce((a, b) => a + b.count, 0);
  const maxPlatformCount = Math.max(...profile.gamesByPlatform.map((p) => p.count));
  const maxGenreCount = Math.max(...profile.gamesByGenre.map((g) => g.count));
  const maxMonthly = Math.max(...profile.monthlyActivity.map((m) => m.count));

  const filteredGames = profile.userGames.filter(
    (ug) => gamesFilter === 'All' || ug.status === gamesFilter,
  );

  const userJournal = journalEntries
    .filter((j) => j.userId === profile.id)
    .sort((a, b) => b.datePlayed.localeCompare(a.datePlayed));

  const journalByMonth: Record<string, typeof userJournal> = {};
  userJournal.forEach((entry) => {
    const d = new Date(entry.datePlayed + 'T00:00:00');
    const key = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();
    (journalByMonth[key] ??= []).push(entry);
  });

  const initials = profile.displayName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2);

  const topFourCovers = profile.topFourGames
    .map((id) => getGameById(id))
    .filter(Boolean)
    .map((g) => g!.coverImage);

  return (
    <>
      {/* Banner with overlaid profile content */}
      <div className="relative min-h-[320px] sm:min-h-[400px]">
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 overflow-hidden">
          {topFourCovers.map((cover, i) => (
            <div key={i} className="overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={cover} alt="" className="w-full h-full object-cover" aria-hidden="true" />
            </div>
          ))}
        </div>
        <div className="absolute inset-0" style={{ backdropFilter: 'blur(12px)' }} />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/60 to-bg-primary" />

        <div className="relative z-10 flex flex-col items-center justify-center min-h-[320px] sm:min-h-[400px] text-center px-4 py-8">
          {profile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatar_url} alt={profile.displayName} className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover ring-4 ring-white/20" />
          ) : (
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-accent-green flex items-center justify-center text-2xl font-bold text-black ring-4 ring-white/20">
              {initials}
            </div>
          )}
          <h1 className="text-3xl sm:text-4xl font-bold text-text-primary mt-4 font-[family-name:var(--font-display)]">{profile.displayName}</h1>
          <p className="text-text-muted text-sm">@{profile.username}</p>
          <p className="text-text-secondary text-sm mt-2 max-w-md line-clamp-2">{profile.bio}</p>

          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 mt-3 text-xs text-text-muted">
            <span className="flex items-center gap-1"><Calendar size={12} /> Joined {new Date(profile.memberSince).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}</span>
            <span>·</span>
            <span className="flex items-center gap-1.5">
              <Gamepad2 size={12} /> {profile.platforms.map((p) => (
                <span key={p} className="px-1.5 py-0.5 rounded bg-bg-elevated border border-border text-text-muted">{p}</span>
              ))}
            </span>
          </div>

          <div className="flex items-center gap-3 mt-2 text-sm">
            <span><span className="font-semibold text-text-primary">{profile.stats.followers}</span> <span className="text-text-muted">followers</span></span>
            <span className="text-text-muted">·</span>
            <span><span className="font-semibold text-text-primary">{profile.stats.following}</span> <span className="text-text-muted">following</span></span>
          </div>

          <div className="flex items-center gap-3 mt-4">
            <button className="bg-accent-green text-black px-5 py-2 rounded-sm font-medium text-sm hover:opacity-90 transition-opacity">
              Follow
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                setShareCopied(true);
                setTimeout(() => setShareCopied(false), 2000);
              }}
              className="border border-border text-text-secondary px-4 py-2 rounded-sm text-sm hover:text-text-primary hover:border-border transition-all duration-300"
            >
              {shareCopied ? 'Link copied!' : 'Share Profile'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-16">
        {/* Stats Bar */}
        <div className="bg-bg-card/80 backdrop-blur-xl border-y border-border mt-8 py-5">
          <div className="grid grid-cols-4 gap-4 text-center">
            {[
              { val: profile.stats.gamesPlayed, label: 'Games', color: 'text-text-primary', decimals: 0 },
              { val: profile.stats.reviewsWritten, label: 'Reviews', color: 'text-text-primary', decimals: 0 },
              { val: profile.stats.avgRating, label: 'Avg Rating', color: 'text-accent-orange', decimals: 1 },
              { val: profile.stats.listsCreated, label: 'Lists', color: 'text-text-primary', decimals: 0 },
            ].map((s) => (
              <div key={s.label} className="stat-hover cursor-default">
                <p className={`text-xl font-bold font-[family-name:var(--font-mono)] ${s.color}`}>
                  <AnimatedCounter end={s.val} decimals={s.decimals} />
                </p>
                <p className="text-xs uppercase tracking-wider text-text-muted mt-1 font-[family-name:var(--font-mono)]">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Top 4 Favorite Games */}
        <div className="mt-10">
          <h3 className="text-xs uppercase tracking-widest font-semibold text-text-muted mb-4 font-[family-name:var(--font-mono)]">🏔️ My Gaming Mount Rushmore</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {profile.topFourGames.map((gid) => {
              const g = getGameById(gid);
              if (!g) return null;
              return (
                <Link key={gid} href={`/games/${gid}`} className="group relative aspect-[2/3] rounded-sm overflow-hidden bg-bg-elevated">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={g.coverImage} alt={g.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                    <div>
                      <span className="text-sm font-semibold text-white leading-tight block">{g.title}</span>
                      {(() => {
                        const userEntry = profile.userGames.find((ug) => ug.gameId === g.id);
                        const userRating = userEntry?.userRating;
                        return userRating ? (
                          <span className="text-xs font-bold mt-1 inline-flex items-center gap-0.5" style={{ color: getRatingColor(userRating) }}><Star size={10} className="fill-current" /> {userRating}/10</span>
                        ) : null;
                      })()}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
          <p className="text-text-muted text-sm italic mt-3 text-center">These games define my taste</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 border-b border-border mt-10 mb-8">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm uppercase tracking-wider transition-all duration-300 ${
                activeTab === tab
                  ? 'text-text-primary font-semibold border-b-2 border-accent-orange'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* === GAMES Tab === */}
        {activeTab === 'Games' && (
          <div>
            <div className="flex flex-wrap gap-2 mb-6">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => setGamesFilter(f)}
                  className={`px-3 py-1.5 text-xs rounded-md border transition-all duration-300 ${
                    gamesFilter === f
                      ? 'bg-accent-orange/15 border-accent-orange text-accent-orange'
                      : 'border-border text-text-muted hover:text-text-primary hover:border-border'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredGames.map((ug) => {
                const g = getGameById(ug.gameId);
                if (!g) return null;
                return (
                  <div key={ug.gameId} className="relative">
                    <GameCard game={g} size="sm" showTitle={true} showRating />
                    {ug.userRating && (
                      <div className="absolute top-2 left-2 bg-bg-primary/90 backdrop-blur-sm rounded px-1.5 py-0.5 flex items-center gap-1">
                        <Star size={10} className="text-accent-orange fill-accent-orange" />
                        <span className="text-xs font-bold text-accent-orange">{ug.userRating}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {filteredGames.length === 0 && (
              <div className="bg-bg-card/80 backdrop-blur-xl rounded-sm border border-border p-10 text-center">
                <p className="text-text-secondary text-sm">No games in this category.</p>
              </div>
            )}
          </div>
        )}

        {/* === LISTS Tab === */}
        {activeTab === 'Lists' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {profile.lists.length === 0 && (
              <div className="col-span-full bg-bg-card/80 backdrop-blur-xl rounded-sm border border-border p-10 text-center">
                <p className="text-text-secondary text-sm">No lists created yet.</p>
              </div>
            )}
            {profile.lists.map((list) => (
              <div key={list.id} className="bg-bg-card/80 backdrop-blur-xl rounded-sm border border-border p-5 hover:border-border transition-all duration-300 cursor-pointer">
                <h4 className="text-sm font-semibold text-text-primary">{list.name}</h4>
                <p className="text-xs text-text-muted mt-1 line-clamp-2">{list.description}</p>
                <div className="flex items-center justify-between mt-3 text-xs text-text-muted">
                  <span>{list.gameIds.length} games</span>
                  <span>{new Date(list.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* === REVIEWS Tab === */}
        {activeTab === 'Reviews' && (
          <div className="space-y-4">
            {userReviewData.length > 0 ? (
              userReviewData.map((r) => {
                const g = getGameById(r.gameId);
                return (
                  <div key={r.id} className="bg-bg-card/80 backdrop-blur-xl rounded-sm border border-border p-5">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="text-sm font-semibold text-text-primary">{g?.title ?? 'Unknown Game'}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          {renderStars(r.rating)}
                          <span className="text-xs text-text-muted">{r.rating}/10</span>
                        </div>
                      </div>
                      <span className="text-xs text-text-muted flex-shrink-0">
                        {new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-sm text-text-secondary leading-relaxed">{r.reviewText}</p>
                  </div>
                );
              })
            ) : (
              <div className="bg-bg-card/80 backdrop-blur-xl rounded-sm border border-border p-10 text-center">
                <p className="text-text-secondary text-sm">No reviews written yet.</p>
              </div>
            )}
          </div>
        )}

      </div>
    </>
  );
}
