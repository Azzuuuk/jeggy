'use client';

import { useState, useEffect } from 'react';
import { Star, Heart, Search, Check, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { SupabaseGame } from '@/lib/types';
import Modal from './Modal';
import RatingInputHalf from './RatingInputHalf';

interface QuickLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  game?: { id: number; name: string; cover_url?: string | null; slug?: string };
}

export default function QuickLogModal({ isOpen, onClose, game: initialGame }: QuickLogModalProps) {
  const { user } = useAuth();
  const [selectedGame, setSelectedGame] = useState<SupabaseGame | null>(null);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SupabaseGame[]>([]);
  const [searching, setSearching] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [gameStatus, setGameStatus] = useState('played');
  const [datePlayed, setDatePlayed] = useState(() => new Date().toISOString().split('T')[0]);
  const [platform, setPlatform] = useState('PC');
  const [review, setReview] = useState('');
  const [liked, setLiked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Load initial game if provided
  useEffect(() => {
    if (!initialGame) return;
    const load = async () => {
      const { data } = await supabase
        .from('games')
        .select('id, name, slug, cover_url, average_rating')
        .eq('id', initialGame.id)
        .single();
      if (data) setSelectedGame(data as SupabaseGame);
    };
    load();
  }, [initialGame]);

  // Reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedGame(initialGame ? null : null);
      setQuery('');
      setSearchResults([]);
      setRating(null);
      setGameStatus('played');
      setDatePlayed(new Date().toISOString().split('T')[0]);
      setPlatform('PC');
      setReview('');
      setLiked(false);
      setSaved(false);
    }
  }, [isOpen, initialGame]);

  // Debounced Supabase search
  useEffect(() => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('games')
        .select('id, name, slug, cover_url, average_rating')
        .ilike('name', `%${query}%`)
        .limit(8);
      setSearchResults((data || []) as SupabaseGame[]);
      setSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSave = async () => {
    if (!user || !selectedGame) return;
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        user_id: user.id,
        game_id: selectedGame.id.toString(),
        status: gameStatus,
        updated_at: new Date().toISOString(),
      };
      if (rating !== null) payload.rating = rating;
      if (review.trim()) payload.review = review.trim();
      if (platform) payload.platform = platform;
      if (datePlayed) payload.date_played = datePlayed;
      payload.liked = liked;

      const { error } = await supabase
        .from('user_games')
        .upsert(payload, { onConflict: 'user_id,game_id' });

      if (error) throw error;
      setSaved(true);
      setTimeout(() => {
        onClose();
        window.location.reload();
      }, 600);
    } catch (err: any) {
      console.error('Error saving:', err?.message || err?.code || JSON.stringify(err));
      alert('Failed to save: ' + (err?.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const renderGameSearch = () => (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
        <input
          type="text"
          placeholder="Search for a game..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-bg-card/80 backdrop-blur-xl border border-border rounded-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-orange transition-all duration-300"
          autoFocus
        />
        {searching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-accent-green border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      <div>
        <p className="text-sm text-text-secondary mb-3">
          {query.trim() ? 'Results' : 'Type to search games'}
        </p>
        {searchResults.length > 0 && (
          <div className="grid grid-cols-4 gap-3">
            {searchResults.map((g) => (
              <button key={g.id} onClick={() => setSelectedGame(g)} className="group text-left">
                <div className="aspect-[3/4] rounded-sm overflow-hidden border border-border group-hover:border-accent-orange transition-all duration-300 mb-1.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={g.cover_url || '/placeholder.jpg'} alt={g.name} className="w-full h-full object-cover" />
                </div>
                <p className="text-xs text-text-secondary group-hover:text-text-primary transition-all duration-300 truncate">
                  {g.name}
                </p>
              </button>
            ))}
          </div>
        )}
        {query.trim() && !searching && searchResults.length === 0 && (
          <p className="text-sm text-text-muted text-center py-8">No games found</p>
        )}
      </div>
    </div>
  );

  const renderLogForm = () => {
    if (!selectedGame) return null;

    return (
      <div className="space-y-5">
        {/* Game info header */}
        <div className="flex gap-4">
          <div className="w-[85px] h-[120px] flex-shrink-0 rounded-sm overflow-hidden border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={selectedGame.cover_url || '/placeholder.jpg'} alt={selectedGame.name} className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col justify-center">
            <h3 className="text-xl font-bold text-text-primary">{selectedGame.name}</h3>
            <p className="text-sm text-text-secondary mt-0.5">
              {selectedGame.developers?.join(', ')}
            </p>
            {!initialGame && (
              <button onClick={() => setSelectedGame(null)} className="text-xs text-accent-teal hover:underline mt-2 self-start">
                Change game
              </button>
            )}
          </div>
        </div>

        {/* Status selector */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">Status</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'playing', label: 'Playing', icon: '▶', color: 'border-teal-500 bg-teal-500/15 text-teal-400' },
              { value: 'played', label: 'Played', icon: '✓', color: 'border-green-500 bg-green-500/15 text-green-400' },
              { value: 'completed', label: 'Completed', icon: '★', color: 'border-accent-teal bg-accent-teal/15 text-accent-teal' },
              { value: '100_percent', label: '100%', icon: '✦', color: 'border-yellow-500 bg-yellow-500/15 text-yellow-400' },
              { value: 'want_to_play', label: 'Want to Play', icon: '+', color: 'border-orange-500 bg-orange-500/15 text-orange-400' },
              { value: 'dropped', label: 'Dropped', icon: '✕', color: 'border-red-500 bg-red-500/15 text-red-400' },
            ].map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setGameStatus(opt.value)}
                className={`px-2 py-2 rounded-sm border text-xs font-medium transition-all ${
                  gameStatus === opt.value
                    ? opt.color
                    : 'border-border text-text-muted hover:border-border-light hover:text-text-secondary'
                }`}
              >
                <span className="mr-1">{opt.icon}</span> {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Date played */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Date played</label>
          <input
            type="date"
            value={datePlayed}
            onChange={(e) => setDatePlayed(e.target.value)}
            className="w-full bg-bg-card/80 backdrop-blur-xl border border-border rounded-sm px-3 py-2 text-text-primary focus:outline-none focus:border-accent-orange transition-all duration-300"
          />
        </div>

        {/* Rating - uses RatingInputHalf (0.5–10 half-star increments) */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Rating</label>
          <RatingInputHalf value={rating} onChange={setRating} size="md" />
        </div>

        {/* Platform */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Platform</label>
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="w-full bg-bg-card/80 backdrop-blur-xl border border-border rounded-sm px-3 py-2 text-text-primary focus:outline-none focus:border-accent-orange transition-all duration-300"
          >
            <option value="PC">PC</option>
            <option value="PlayStation 5">PlayStation 5</option>
            <option value="Xbox Series X|S">Xbox Series X|S</option>
            <option value="Nintendo Switch">Nintendo Switch</option>
            <option value="Mobile">Mobile</option>
          </select>
        </div>

        {/* Review */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            Review <span className="text-text-muted font-normal">(optional)</span>
          </label>
          <textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="What did you think?"
            rows={3}
            className="w-full bg-bg-card/80 backdrop-blur-xl border border-border rounded-sm px-3 py-2 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-orange transition-all duration-300 resize-none"
          />
        </div>

        {/* Like */}
        <button type="button" onClick={() => setLiked(!liked)} className="flex items-center gap-2 group">
          <Heart
            className={`w-5 h-5 transition-all duration-300 ${liked ? 'text-red-500 fill-red-500' : 'text-text-muted group-hover:text-red-400'}`}
          />
          <span className={`text-sm ${liked ? 'text-text-primary' : 'text-text-secondary'}`}>
            Like this game
          </span>
        </button>

        {/* Save */}
        <div className="flex justify-end pt-2">
          <button
            onClick={handleSave}
            disabled={saving || saved}
            className="bg-accent-green hover:bg-accent-green/90 disabled:opacity-70 text-black font-semibold px-8 py-3 rounded-sm transition-all duration-300 flex items-center gap-2"
          >
            {saved ? (
              <>
                <Check size={18} />
                Saved!
              </>
            ) : saving ? (
              'Saving...'
            ) : (
              'Save'
            )}
          </button>
        </div>
      </div>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="I played..." maxWidth="max-w-xl">
      {selectedGame ? renderLogForm() : renderGameSearch()}
    </Modal>
  );
}
