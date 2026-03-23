function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}k`;
  return n.toString();
}

interface CommunityStatsProps {
  totalRatings: number;
  likesCount?: number;
  reviewsCount?: number;
  listsCount?: number;
  rankings?: { category: string; rank: number }[];
}

export default function CommunityStats({
  totalRatings,
  likesCount,
  reviewsCount,
  listsCount,
  rankings,
}: CommunityStatsProps) {
  const stats = [
    { emoji: '📊', value: formatCount(totalRatings), label: 'ratings' },
    likesCount !== undefined && { emoji: '❤️', value: formatCount(likesCount), label: 'liked' },
    reviewsCount !== undefined && { emoji: '✍️', value: formatCount(reviewsCount), label: 'reviews' },
    listsCount !== undefined && { emoji: '📋', value: formatCount(listsCount), label: 'lists' },
  ].filter(Boolean) as { emoji: string; value: string; label: string }[];

  return (
    <div className="py-8 border-y border-border">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-text-secondary">
        {stats.map((stat, i) => (
          <span key={stat.label} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-text-muted mr-2">·</span>}
            <span>{stat.emoji}</span>
            <span className="font-medium text-text-primary">{stat.value}</span>
            <span>{stat.label}</span>
          </span>
        ))}
      </div>

      {rankings && rankings.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1">
          {rankings.map((r, i) => (
            <span key={r.category} className="text-sm">
              <span
                className="font-medium"
                style={{ color: r.rank === 1 ? '#CCFF00' : r.rank <= 3 ? '#6366F1' : '#888888' }}
              >
                🏆 #{r.rank} on {r.category}
              </span>
              {i < rankings.length - 1 && (
                <span className="text-text-muted"> · </span>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
