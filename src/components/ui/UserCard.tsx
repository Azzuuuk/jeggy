'use client';

import { Star } from 'lucide-react';
import { DiscoverUser } from '@/lib/types';
import { getGameById } from '@/lib/mockData';

interface UserCardProps {
  user: DiscoverUser;
  onFollowToggle?: (userId: string) => void;
}

export default function UserCard({ user, onFollowToggle }: UserCardProps) {
  const topGames = user.topGames.slice(0, 3).map((id) => getGameById(id)).filter(Boolean);

  return (
    <div className="bg-bg-card/80 backdrop-blur-xl rounded-sm border border-border p-5 hover:border-border-light transition-all duration-500">
      {/* Avatar */}
      <div className="flex justify-center">
        <div className="w-14 h-14 rounded-sm bg-accent-orange/20 flex items-center justify-center">
          <span className="text-xl font-bold text-accent-orange">
            {user.username.charAt(0).toUpperCase()}
          </span>
        </div>
      </div>

      {/* Name */}
      <p className="text-base font-semibold text-text-primary text-center mt-3">{user.username}</p>
      <p className="text-xs text-text-muted text-center">@{user.handle}</p>

      {/* Bio */}
      {user.bio && (
        <p className="text-sm text-text-secondary text-center mt-2 truncate">{user.bio}</p>
      )}

      {/* Stats */}
      <div className="flex justify-center gap-4 mt-3">
        <div className="text-center">
          <span className="text-sm font-medium text-text-primary">{user.stats.gamesPlayed}</span>
          <p className="text-xs text-text-muted">games</p>
        </div>
        <div className="text-center">
          <span className="text-sm font-medium text-text-primary inline-flex items-center gap-0.5">
            <Star className="w-3 h-3 fill-accent-orange text-accent-orange" />
            {user.stats.avgRating.toFixed(1)}
          </span>
          <p className="text-xs text-text-muted">avg</p>
        </div>
        <div className="text-center">
          <span className="text-sm font-medium text-text-primary">{user.stats.followers}</span>
          <p className="text-xs text-text-muted">followers</p>
        </div>
      </div>

      {/* Top Games */}
      {topGames.length > 0 && (
        <div className="flex justify-center gap-2 mt-3">
          {topGames.map((game) => (
            <div key={game!.id} className="w-10 h-14 rounded overflow-hidden bg-bg-elevated">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={game!.coverImage} alt={game!.title} className="w-full h-full object-cover" loading="lazy" />
            </div>
          ))}
        </div>
      )}

      {/* Compatibility */}
      {user.compatibility != null && (
        <div className="flex justify-center mt-3">
          <span className="text-xs bg-accent-orange/15 text-accent-orange rounded-full px-3 py-1">
            {user.compatibility}% match
          </span>
        </div>
      )}

      {/* Follow Button */}
      <button
        onClick={() => onFollowToggle?.(user.id)}
        className={`w-full mt-4 px-4 py-2 rounded-sm text-sm font-medium transition-all duration-300 ${
          user.isFollowing
            ? 'bg-bg-elevated text-text-muted border border-border hover:border-red-500/50 hover:text-red-400'
            : 'bg-accent-orange text-black hover:bg-accent-orange/90'
        }`}
      >
        {user.isFollowing ? 'Following' : 'Follow'}
      </button>
    </div>
  );
}
