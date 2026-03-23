'use client';

import { useState } from 'react';
import { Heart } from 'lucide-react';
import { ListComment } from '@/lib/types';

interface CommentCardProps {
  comment: ListComment;
}

export default function CommentCard({ comment }: CommentCardProps) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(comment.likes);

  const handleLike = () => {
    setLiked((prev) => !prev);
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1));
  };

  return (
    <div className="flex gap-3 p-4 rounded-sm hover:bg-bg-elevated/50 transition-colors">
      <div className="w-9 h-9 rounded-full bg-bg-elevated border border-border flex items-center justify-center text-sm font-semibold text-text-primary flex-shrink-0">
        {comment.username.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-text-primary">{comment.username}</span>
          <span className="text-xs text-text-muted">
            {new Date(comment.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>
        <p className="text-sm text-text-secondary mt-1">{comment.text}</p>
        <button
          onClick={handleLike}
          className={`flex items-center gap-1.5 mt-2 text-xs transition-colors ${
            liked ? 'text-accent-orange' : 'text-text-muted hover:text-accent-orange'
          }`}
        >
          <Heart size={13} className={liked ? 'fill-accent-orange' : ''} />
          {likeCount > 0 && likeCount}
        </button>
      </div>
    </div>
  );
}
