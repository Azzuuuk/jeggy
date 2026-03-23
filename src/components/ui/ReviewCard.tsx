'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Star, ThumbsUp, ChevronDown, ChevronUp, Flag } from 'lucide-react';
import { Review, Platform } from '@/lib/types';

interface ReviewCardProps {
  review: Review;
}

const platformShort: Record<string, string> = {
  'PC': 'PC',
  'PS5': 'PS5',
  'Xbox Series X': 'Xbox',
  'Switch': 'Switch',
  'Mobile': 'Mobile',
};

export default function ReviewCard({ review }: ReviewCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [helpful, setHelpful] = useState(review.helpfulVotes);
  const [voted, setVoted] = useState(false);

  const isLong = review.reviewText.length > 280;
  const displayText = isLong && !expanded
    ? review.reviewText.slice(0, 280) + '...'
    : review.reviewText;

  const handleHelpful = () => {
    if (!voted) {
      setHelpful(h => h + 1);
      setVoted(true);
    }
  };

  return (
    <div className="bg-bg-card/80 backdrop-blur-xl rounded-sm border border-border p-5 hover:border-border-light transition-all duration-500">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-3">
          <Link
            href={`/profile/${review.handle}`}
            className="w-10 h-10 rounded-full bg-bg-elevated border border-border flex items-center justify-center text-sm font-semibold text-accent-orange hover:border-accent-orange transition-colors"
          >
            {review.username.charAt(0)}
          </Link>
          <div>
            <Link href={`/profile/${review.handle}`} className="text-sm font-medium text-text-primary hover:text-accent-orange transition-colors">
              {review.username}
            </Link>
            <p className="text-xs text-text-muted">@{review.handle}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-[11px] px-2 py-0.5 rounded bg-bg-elevated border border-border text-text-muted">
            {platformShort[review.platform] || review.platform}
          </span>
          <div className="flex items-center gap-1">
            <Star size={14} className="text-accent-orange fill-accent-orange" />
            <span className={`text-sm font-bold ${
              review.rating >= 8 ? 'text-green-500' :
              review.rating >= 6 ? 'text-accent-orange' : 'text-red-500'
            }`}>
              {review.rating}
            </span>
          </div>
        </div>
      </div>

      <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-line">{displayText}</p>

      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 mt-2 text-xs text-accent-orange hover:text-accent-orange-hover transition-colors"
        >
          {expanded ? <><ChevronUp size={12} /> Show less</> : <><ChevronDown size={12} /> Read more</>}
        </button>
      )}

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
        <div className="flex items-center gap-4">
          <button
            onClick={handleHelpful}
            className={`flex items-center gap-1.5 text-xs transition-colors ${
              voted ? 'text-accent-orange' : 'text-text-muted hover:text-accent-orange'
            }`}
          >
            <ThumbsUp size={12} />
            {helpful > 0 ? `${helpful} found this helpful` : 'Helpful'}
          </button>
          <button className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary transition-colors">
            <Flag size={12} />
            Report
          </button>
        </div>
        <span className="text-xs text-text-muted">
          {new Date(review.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
        </span>
      </div>
    </div>
  );
}
