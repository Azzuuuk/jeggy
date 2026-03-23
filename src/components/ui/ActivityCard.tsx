'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Heart, MessageSquare, Star, ArrowRight } from 'lucide-react';
import { FeedActivity } from '@/lib/types';
import { getGameById } from '@/lib/mockData';

function timeAgo(timestamp: string): string {
  const now = new Date();
  const date = new Date(timestamp);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w ago`;
}

export default function ActivityCard({ activity }: { activity: FeedActivity }) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(activity.likes);

  const handleLike = () => {
    setLiked(!liked);
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1));
  };

  const avatar = (
    <div className="w-10 h-10 rounded-full bg-bg-elevated border border-border flex items-center justify-center flex-shrink-0">
      <span className="text-sm font-bold text-accent-orange">
        {activity.username.charAt(0).toUpperCase()}
      </span>
    </div>
  );

  const timestamp = (
    <span className="text-xs text-text-muted whitespace-nowrap">
      {timeAgo(activity.timestamp)}
    </span>
  );

  const gameCover = activity.gameCover && (
    <div className="w-12 h-16 rounded overflow-hidden bg-bg-elevated flex-shrink-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={activity.gameCover}
        alt={activity.gameTitle || ''}
        className="w-full h-full object-cover"
        loading="lazy"
      />
    </div>
  );

  const gameLink = activity.gameId && activity.gameTitle && (
    <Link href={`/games/${activity.gameId}`} className="font-semibold text-text-primary hover:text-accent-orange transition-colors">
      {activity.gameTitle}
    </Link>
  );

  const actions = (
    <div className="flex items-center gap-4 mt-3">
      <button onClick={handleLike} className="flex items-center gap-1.5 text-text-muted hover:text-accent-orange transition-colors">
        <Heart className={`w-4 h-4 ${liked ? 'fill-accent-orange text-accent-orange' : ''}`} />
        <span className="text-xs">{likeCount}</span>
      </button>
      {activity.type !== 'status' && (
        <button className="flex items-center gap-1.5 text-text-muted hover:text-accent-teal transition-colors">
          <MessageSquare className="w-4 h-4" />
          <span className="text-xs">{activity.comments}</span>
        </button>
      )}
    </div>
  );

  const usernameLink = (
    <Link href="#" className="font-semibold text-accent-teal hover:underline">
      @{activity.username}
    </Link>
  );

  const renderRating = () => (
    <div className="flex items-start gap-3">
      {avatar}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm text-text-secondary">
            {usernameLink} rated {gameLink}{' '}
            <span className="inline-flex items-center gap-0.5 text-accent-orange font-medium">
              <Star className="w-3.5 h-3.5 fill-accent-orange" />
              {activity.rating}
            </span>
          </p>
          {timestamp}
        </div>
        {activity.reviewSnippet && (
          <p className="text-sm text-text-secondary italic mt-1">{activity.reviewSnippet}</p>
        )}
        <div className="mt-2">{gameCover}</div>
        {actions}
      </div>
    </div>
  );

  const renderReview = () => (
    <div className="flex items-start gap-3">
      {avatar}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm text-text-secondary">
            {usernameLink} reviewed {gameLink}{' '}
            <span className="inline-flex items-center gap-0.5 text-accent-orange font-medium">
              <Star className="w-3.5 h-3.5 fill-accent-orange" />
              {activity.rating}
            </span>
          </p>
          {timestamp}
        </div>
        {activity.reviewSnippet && (
          <p className="text-sm text-text-secondary italic mt-1">
            {activity.reviewSnippet}{' '}
            <Link href={`/games/${activity.gameId}`} className="text-accent-orange hover:underline not-italic">
              Read more <ArrowRight className="w-3 h-3 inline" />
            </Link>
          </p>
        )}
        <div className="mt-2">{gameCover}</div>
        {actions}
      </div>
    </div>
  );

  const renderList = () => (
    <div className="flex items-start gap-3">
      {avatar}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm text-text-secondary">
            {usernameLink} created a new list
          </p>
          {timestamp}
        </div>
        {activity.listCovers && activity.listCovers.length > 0 && (
          <div className="grid grid-cols-2 gap-1 w-fit mt-2">
            {activity.listCovers.slice(0, 4).map((cover, i) => (
              <div key={i} className="w-20 h-20 rounded overflow-hidden bg-bg-elevated">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={cover} alt="" className="w-full h-full object-cover" loading="lazy" />
              </div>
            ))}
          </div>
        )}
        <p className="mt-2 text-sm">
          <span className="font-bold text-text-primary">{activity.listTitle}</span>
          <span className="text-text-muted ml-2">
            {activity.listGameCount} games ·{' '}
            <Link href={`/lists/${activity.listId}`} className="text-accent-orange hover:underline">
              View List <ArrowRight className="w-3 h-3 inline" />
            </Link>
          </span>
        </p>
        {actions}
      </div>
    </div>
  );

  const renderStatus = () => {
    const statusColor =
      activity.status === 'Currently Playing'
        ? 'text-success'
        : activity.status === 'Want to Play'
          ? 'text-accent-orange'
          : activity.status === 'Dropped'
            ? 'text-danger'
            : 'text-text-primary';

    return (
      <div className="flex items-start gap-3">
        {avatar}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm text-text-secondary">
              {usernameLink} is now <span className={statusColor + ' font-medium'}>{activity.status === 'Currently Playing' ? 'playing' : activity.status?.toLowerCase()}</span>{' '}
              {gameLink}
            </p>
            {timestamp}
          </div>
          <div className="mt-2">{gameCover}</div>
          {actions}
        </div>
      </div>
    );
  };

  const renderMilestone = () => {
    const milestoneGameCovers = (activity.milestoneGames || [])
      .slice(0, 4)
      .map((id) => getGameById(id))
      .filter(Boolean);

    return (
      <div className="flex items-start gap-3">
        {avatar}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm text-text-secondary">
              {usernameLink} just played their {activity.milestoneCount}th game! 🎉
            </p>
            {timestamp}
          </div>
          {milestoneGameCovers.length > 0 && (
            <div className="flex gap-2 mt-2">
              {milestoneGameCovers.map((game) => (
                <div key={game!.id} className="w-10 h-14 rounded overflow-hidden bg-bg-elevated">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={game!.coverImage} alt={game!.title} className="w-full h-full object-cover" loading="lazy" />
                </div>
              ))}
            </div>
          )}
          {actions}
        </div>
      </div>
    );
  };

  const content = () => {
    switch (activity.type) {
      case 'rating': return renderRating();
      case 'review': return renderReview();
      case 'list': return renderList();
      case 'status': return renderStatus();
      case 'milestone': return renderMilestone();
      default: return null;
    }
  };

  return (
    <div className="bg-bg-card/80 backdrop-blur-xl rounded-sm border border-border p-4 hover:border-border-light transition-all duration-500">
      {content()}
    </div>
  );
}
