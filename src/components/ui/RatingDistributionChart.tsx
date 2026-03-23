'use client';

import { useEffect, useState } from 'react';
import ColorCodedRating, { getRatingColor } from './ColorCodedRating';

interface RatingDistributionChartProps {
  distribution: number[];
  averageRating: number;
  totalRatings: number;
}

function tierColorForStar(star: number): string {
  return getRatingColor(star);
}

export default function RatingDistributionChart({
  distribution,
  averageRating,
  totalRatings,
}: RatingDistributionChartProps) {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setAnimate(true), 50);
    return () => clearTimeout(id);
  }, []);

  const total = distribution.reduce((a, b) => a + b, 0);

  return (
    <div className="flex gap-8">
      {/* Left: overall rating */}
      <div className="flex shrink-0 flex-col justify-center">
        <ColorCodedRating
          rating={averageRating}
          size="lg"
          showLabel
          totalRatings={totalRatings}
        />
      </div>

      {/* Right: bar chart */}
      <div className="flex flex-1 flex-col gap-1.5">
        {Array.from({ length: 10 }, (_, i) => {
          const star = 10 - i;
          const count = distribution[star - 1] ?? 0;
          const pct = total > 0 ? (count / total) * 100 : 0;

          return (
            <div key={star} className="flex items-center gap-2">
              <span className="w-8 text-right text-xs text-text-muted">{star}★</span>
              <div className="flex-1 rounded-none bg-bg-elevated h-2.5">
                <div
                  className="rounded-none h-2.5"
                  style={{
                    width: animate ? `${pct}%` : '0%',
                    backgroundColor: tierColorForStar(star),
                    transition: 'width 500ms ease-out',
                  }}
                />
              </div>
              <span className="w-8 text-[11px] text-text-muted">
                {Math.round(pct)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
