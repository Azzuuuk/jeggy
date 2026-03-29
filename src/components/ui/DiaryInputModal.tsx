'use client';

import { useState, useEffect } from 'react';
import { X, Clock, Calendar, Monitor, MessageSquare, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { SupabaseGame } from '@/lib/types';

interface DiaryInputModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PLATFORMS = ['PC', 'PlayStation 5', 'PlayStation 4', 'Xbox Series X|S', 'Xbox One', 'Nintendo Switch', 'Mobile', 'Steam Deck'];

export default function DiaryInputModal({ isOpen, onClose }: DiaryInputModalProps) {
  const { user } = useAuth();
  const [selectedGame, setSelectedGame] = useState<SupabaseGame | null>(null);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SupabaseGame[]>([]);
  const [searching, setSearching] = useState(false);
  const [hours, setHours] = useState('1');
  const [sessionNote, setSessionNote] = useState('');
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [platform, setPlatform] = useState('PC');
  const [isPublic, setIsPublic] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSelectedGame(null);
      setQuery('');
      setSearchResults([]);
      setHours('1');
      setSessionNote('');
      setPlatform('PC');
      setSessionDate(new Date().toISOString().split('T')[0]);
      setIsPublic(true);
    }
  }, [isOpen]);

  useEffect(() => {
    if (query.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    const timer = setTimeout(async () => {
      const { data } = await supabase.from('games').select('id, name, slug, cover_url, average_rating').ilike('name', `%${query}%`).limit(6);
      setSearchResults((data || []) as SupabaseGame[]);
      setSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedGame) return;

    const hoursPlayed = parseFloat(hours);
    if (isNaN(hoursPlayed) || hoursPlayed <= 0 || hoursPlayed > 24) return;

    setSaving(true);
    try {
      const { checkClientRateLimit } = await import('@/lib/ratelimit-client');
      const rl = await checkClientRateLimit('createSession', user.id);
      if (!rl.success) { alert(rl.message); setSaving(false); return; }

      const insertData: Record<string, unknown> = {
        user_id: user.id,
        game_id: selectedGame.id.toString(),
        hours_played: hoursPlayed,
        session_date: sessionDate,
        session_note: sessionNote.trim() || null,
        platform,
        is_public: isPublic,
      };

      // Include optional enrichment columns (may not exist on all schemas)
      if (selectedGame.name) insertData.game_name = selectedGame.name;
      if (selectedGame.cover_url) insertData.game_cover_url = selectedGame.cover_url;

      const { error } = await supabase
        .from('gaming_sessions')
        .insert(insertData);

      if (error) {
        // If column doesn't exist, retry without enrichment columns
        if (error.message?.includes('column') || error.code === '42703') {
          const { error: retryError } = await supabase
            .from('gaming_sessions')
            .insert({
              user_id: user.id,
              game_id: selectedGame.id.toString(),
              hours_played: hoursPlayed,
              session_date: sessionDate,
              session_note: sessionNote.trim() || null,
              platform,
              is_public: isPublic,
            });
          if (retryError) throw retryError;
        } else {
          throw error;
        }
      }
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : (err as { message?: string })?.message || 'Unknown error';
      console.error('Error logging session:', msg);
      alert(`Failed to log session: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-bg-card/90 backdrop-blur-xl border border-border rounded-sm max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-lg font-bold text-text-primary">Log Diary Entry</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-all duration-300">
            <X size={20} />
          </button>
        </div>

        {!selectedGame ? (
          <div className="p-5 space-y-4">
            <p className="text-sm text-text-secondary">Which game did you play?</p>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
              <input
                type="text"
                placeholder="Search for a game..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-bg-card/80 backdrop-blur-xl border border-border rounded-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-teal transition-all duration-300"
                autoFocus
              />
              {searching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-acid border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            {searchResults.length > 0 && (
              <div className="space-y-1">
                {searchResults.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setSelectedGame(g)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-sm hover:bg-bg-elevated transition-all duration-300 text-left"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={g.cover_url || '/placeholder.jpg'} alt={g.name} className="w-10 h-14 object-cover rounded flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-text-primary truncate">{g.name}</p>
                      <p className="text-xs text-text-muted truncate">{g.developers?.join(', ')}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {query.trim() && !searching && searchResults.length === 0 && (
              <p className="text-sm text-text-muted text-center py-6">No games found</p>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-5">
            {/* Selected game */}
            <div className="flex items-center gap-3 bg-bg-primary border border-border rounded-sm p-3">
              {selectedGame.cover_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={selectedGame.cover_url} alt={selectedGame.name} className="w-12 h-16 object-cover rounded" />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-text-primary truncate">{selectedGame.name}</p>
                <p className="text-xs text-text-muted">Logging diary entry</p>
              </div>
              <button type="button" onClick={() => setSelectedGame(null)} className="text-xs text-accent-teal hover:underline flex-shrink-0">
                Change
              </button>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-text-primary mb-2">
                <Clock size={14} className="text-accent-teal" /> Hours Played
              </label>
              <input type="number" value={hours} onChange={(e) => setHours(e.target.value)} step="0.5" min="0.5" max="24" required
                className="w-full px-4 py-2.5 bg-bg-card/80 backdrop-blur-xl border border-border rounded-sm text-text-primary focus:outline-none focus:border-accent-green transition-all duration-300" />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-text-primary mb-2">
                <Calendar size={14} className="text-accent-teal" /> Date
              </label>
              <input type="date" value={sessionDate} onChange={(e) => setSessionDate(e.target.value)} max={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2.5 bg-bg-card/80 backdrop-blur-xl border border-border rounded-sm text-text-primary focus:outline-none focus:border-accent-green transition-all duration-300" />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-text-primary mb-2">
                <Monitor size={14} className="text-accent-teal" /> Platform
              </label>
              <select value={platform} onChange={(e) => setPlatform(e.target.value)}
                className="w-full px-4 py-2.5 bg-bg-card/80 backdrop-blur-xl border border-border rounded-sm text-text-primary focus:outline-none focus:border-accent-green transition-all duration-300">
                {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-text-primary mb-2">
                <MessageSquare size={14} className="text-accent-teal" /> Note <span className="text-text-muted font-normal">(optional)</span>
              </label>
              <textarea value={sessionNote} onChange={(e) => setSessionNote(e.target.value)}
                placeholder="What did you do? Any achievements? Rage quits? 😄"
                className="w-full px-4 py-2.5 bg-bg-card/80 backdrop-blur-xl border border-border rounded-sm text-text-primary focus:outline-none focus:border-accent-green transition-all duration-300 min-h-[80px] resize-none"
                maxLength={500} />
              <p className="text-xs text-text-muted mt-1 text-right">{sessionNote.length}/500</p>
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)}
                className="w-4 h-4 rounded border-border accent-accent-green" />
              <span className="text-sm text-text-secondary">Share publicly</span>
            </label>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose}
                className="flex-1 py-2.5 bg-bg-elevated text-text-secondary rounded-sm text-sm font-medium hover:text-text-primary transition-all duration-300">
                Cancel
              </button>
              <button type="submit" disabled={saving}
                className="flex-1 py-2.5 bg-accent-green hover:bg-accent-green-hover disabled:opacity-50 text-black rounded-sm text-sm font-bold transition-all duration-300">
                {saving ? 'Logging...' : `Log ${hours}h`}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
