'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { getRatingColor, getRatingLabel } from './ColorCodedRating';

interface RatingInputHalfProps {
  value: number | null;
  onChange: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = { sm: 16, md: 24, lg: 32 } as const;

export default function RatingInputHalf({ value, onChange, size = 'md' }: RatingInputHalfProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const starSize = sizeMap[size];
  const display = hovered ?? value;

  return (
    <div className="flex flex-col gap-1.5">
      <div
        className="flex items-center gap-0.5"
        onMouseLeave={() => setHovered(null)}
      >
        {Array.from({ length: 10 }, (_, i) => {
          const starIndex = i + 1;
          const halfVal = starIndex - 0.5;
          const fullVal = starIndex;

          const filled = display !== null && display >= fullVal;
          const halfFilled = display !== null && !filled && display >= halfVal;

          return (
            <div
              key={i}
              className="relative cursor-pointer transition-transform hover:scale-110"
              style={{ width: starSize, height: starSize }}
            >
              {/* Background (empty) star */}
              <Star
                size={starSize}
                className="absolute inset-0 text-border"
              />

              {/* Half-filled star */}
              {halfFilled && (
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: '50%' }}
                >
                  <Star
                    size={starSize}
                    className="text-accent-orange fill-accent-orange"
                  />
                </div>
              )}

              {/* Full-filled star */}
              {filled && (
                <Star
                  size={starSize}
                  className="absolute inset-0 text-accent-orange fill-accent-orange"
                />
              )}

              {/* Left click zone */}
              <div
                className="absolute inset-y-0 left-0 w-1/2 z-10"
                onMouseEnter={() => setHovered(halfVal)}
                onClick={() => onChange(halfVal)}
              />
              {/* Right click zone */}
              <div
                className="absolute inset-y-0 right-0 w-1/2 z-10"
                onMouseEnter={() => setHovered(fullVal)}
                onClick={() => onChange(fullVal)}
              />
            </div>
          );
        })}
      </div>

      {display !== null && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">{display.toFixed(1)}</span>
          {value !== null && (
            <span className="text-xs font-medium" style={{ color: getRatingColor(value) }}>
              You rated this {value}/10 · {getRatingLabel(value)}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
