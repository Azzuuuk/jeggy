'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';

interface RatingInputProps {
  value: number | null;
  onChange: (rating: number | null) => void;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
}

export default function RatingInput({ value, onChange, maxRating = 10, size = 'md' }: RatingInputProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  const sizes = { sm: 16, md: 22, lg: 28 };
  const starSize = sizes[size];
  const displayRating = hovered ?? value ?? 0;

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: maxRating }).map((_, i) => {
        const starValue = i + 1;
        const isFilled = starValue <= displayRating;
        return (
          <button
            key={i}
            type="button"
            onMouseEnter={() => setHovered(starValue)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => onChange(value === starValue ? null : starValue)}
            className="transition-transform hover:scale-125 focus:outline-none"
            aria-label={`Rate ${starValue} out of ${maxRating}`}
          >
            <Star
              size={starSize}
              className={`transition-all duration-300 ${
                isFilled ? 'text-accent-orange fill-accent-orange' : 'text-border hover:text-border-light'
              }`}
            />
          </button>
        );
      })}
      {(value || hovered) && (
        <span className="ml-2 text-lg font-bold text-accent-orange">
          {displayRating}
        </span>
      )}
    </div>
  );
}
