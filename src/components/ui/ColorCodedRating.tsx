'use client';

export function getRatingColor(rating: number): string {
  if (rating >= 9.0) return '#CCFF00';
  if (rating >= 8.0) return '#a8d900';
  if (rating >= 7.0) return '#6366F1';
  if (rating >= 6.0) return '#818cf8';
  if (rating >= 5.0) return '#555555';
  return '#ef4444';
}

export function getRatingLabel(rating: number): string {
  if (rating >= 9.0) return 'Masterpiece';
  if (rating >= 8.0) return 'Excellent';
  if (rating >= 7.0) return 'Great';
  if (rating >= 6.0) return 'Good';
  if (rating >= 5.0) return 'Average';
  return 'Below Average';
}

interface ColorCodedRatingProps {
  rating: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showBar?: boolean;
  totalRatings?: number;
}

const sizeConfig = {
  sm: { rating: 'text-lg', label: 'text-xs', barHeight: 'h-1.5' },
  md: { rating: 'text-3xl', label: 'text-sm', barHeight: 'h-2' },
  lg: { rating: 'text-5xl', label: 'text-base', barHeight: 'h-2' },
} as const;

function formatRatingCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  return n.toLocaleString();
}

export default function ColorCodedRating({
  rating,
  size = 'md',
  showLabel = true,
  showBar = false,
  totalRatings,
}: ColorCodedRatingProps) {
  const color = getRatingColor(rating);
  const label = getRatingLabel(rating);
  const s = sizeConfig[size];
  const pct = Math.min((rating / 10) * 100, 100);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline gap-2">
        <span className={`${s.rating} font-bold leading-none font-[family-name:var(--font-mono)]`} style={{ color }}>
          {rating.toFixed(1)}
        </span>
        {showLabel && (
          <span className={`${s.label} font-medium text-text-secondary`}>{label}</span>
        )}
      </div>

      {showBar && (
        <div className="flex items-center gap-2">
          <div className={`flex-1 rounded-none bg-bg-elevated ${s.barHeight}`}>
            <div
              className={`rounded-none ${s.barHeight}`}
              style={{ width: `${pct}%`, backgroundColor: color }}
            />
          </div>
          {totalRatings !== undefined && (
            <span className="text-xs text-text-muted whitespace-nowrap">
              {formatRatingCount(totalRatings)} ratings
            </span>
          )}
        </div>
      )}

      {!showBar && totalRatings !== undefined && (
        <span className="text-xs text-text-muted">
          {formatRatingCount(totalRatings)} ratings
        </span>
      )}
    </div>
  );
}
