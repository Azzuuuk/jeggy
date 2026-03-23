'use client';

import Link from 'next/link';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  ctaText?: string;
  ctaLink?: string;
}

export default function EmptyState({ icon, title, description, ctaText, ctaLink }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center py-16">
      {icon && <div className="mb-4 text-text-muted">{icon}</div>}
      <h3 className="text-lg font-semibold text-text-primary mb-2">{title}</h3>
      <p className="text-sm text-text-secondary max-w-md text-center">{description}</p>
      {ctaText && ctaLink && (
        <Link
          href={ctaLink}
          className="mt-6 bg-accent-orange text-black px-5 py-2.5 rounded-sm hover:bg-accent-orange/90 transition-all duration-300 text-sm font-medium"
        >
          {ctaText}
        </Link>
      )}
    </div>
  );
}
