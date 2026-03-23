'use client';

import { Star } from 'lucide-react';

interface RatingStarsProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  interactive?: boolean;
  onRate?: (rating: number) => void;
}

export default function RatingStars({
  rating,
  maxRating = 10,
  size = 'md',
  showValue = true,
  interactive = false,
  onRate,
}: RatingStarsProps) {
  const starCount = 5;
  const normalizedRating = (rating / maxRating) * starCount;

  const sizeMap = {
    sm: { star: 14, text: 'text-xs' },
    md: { star: 18, text: 'text-sm' },
    lg: { star: 24, text: 'text-lg' },
  };

  const { star: starSize, text: textSize } = sizeMap[size];

  const getRatingColor = (val: number) => {
    if (val >= 8) return 'text-green-500';
    if (val >= 6) return 'text-accent-orange';
    return 'text-red-500';
  };

  const handleStarClick = (starIndex: number) => {
    if (interactive && onRate) {
      const newRating = ((starIndex + 1) / starCount) * maxRating;
      onRate(Math.round(newRating));
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: starCount }).map((_, i) => {
          const fillPercentage = Math.min(1, Math.max(0, normalizedRating - i));
          return (
            <button
              key={i}
              type="button"
              disabled={!interactive}
              onClick={() => handleStarClick(i)}
              className={`relative ${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform disabled:opacity-100`}
              aria-label={`${i + 1} of ${starCount} stars`}
            >
              <Star
                size={starSize}
                className="text-border"
                fill="currentColor"
              />
              {fillPercentage > 0 && (
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${fillPercentage * 100}%` }}
                >
                  <Star
                    size={starSize}
                    className="text-accent-orange"
                    fill="currentColor"
                  />
                </div>
              )}
            </button>
          );
        })}
      </div>
      {showValue && (
        <span className={`${textSize} font-bold ${getRatingColor(rating)} ml-1`}>
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}
