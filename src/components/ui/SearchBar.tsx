'use client';

import { Search, X } from 'lucide-react';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface SearchBarProps {
  compact?: boolean;
  defaultValue?: string;
}

export default function SearchBar({ compact = false, defaultValue = '' }: SearchBarProps) {
  const [query, setQuery] = useState(defaultValue);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      inputRef.current?.blur();
    }
  };

  const clearSearch = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <div
        className={`flex items-center rounded-sm transition-all duration-200 ${
          focused
            ? 'bg-bg-elevated border-accent-orange ring-1 ring-accent-orange/30'
            : 'bg-bg-card border-border hover:border-border-light'
        } border ${compact ? 'h-9' : 'h-11'}`}
      >
        <Search
          size={compact ? 16 : 18}
          className={`ml-3 flex-shrink-0 transition-colors ${
            focused ? 'text-accent-orange' : 'text-text-muted'
          }`}
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Search games, developers, genres..."
          className={`flex-1 bg-transparent border-none outline-none px-3 text-text-primary placeholder:text-text-muted ${
            compact ? 'text-sm' : 'text-sm'
          }`}
          aria-label="Search games"
        />
        {query && (
          <button
            type="button"
            onClick={clearSearch}
            className="mr-2 p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-primary transition-colors"
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </form>
  );
}
