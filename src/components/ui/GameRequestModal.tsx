'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { X, Send, Gamepad2 } from 'lucide-react';

interface GameRequestModalProps {
  searchQuery?: string;
  onClose: () => void;
}

const PLATFORM_OPTIONS = [
  'PC', 'PlayStation 5', 'PlayStation 4', 'Xbox Series X|S',
  'Xbox One', 'Nintendo Switch', 'iOS', 'Android', 'Mac', 'Linux',
];

export default function GameRequestModal({ searchQuery, onClose }: GameRequestModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    game_name: searchQuery || '',
    developer: '',
    release_year: '',
    platforms: [] as string[],
    description: '',
    external_links: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.game_name.trim()) return;

    setLoading(true);
    try {
      const { checkClientRateLimit } = await import('@/lib/ratelimit-client');
      const rl = await checkClientRateLimit('requestGame', user.id);
      if (!rl.success) { alert(rl.message); setLoading(false); return; }

      const linksArray = formData.external_links
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);

      const { error } = await supabase.from('game_requests').insert({
        requester_id: user.id,
        game_name: formData.game_name.trim(),
        developer: formData.developer.trim() || null,
        release_year: formData.release_year ? parseInt(formData.release_year) : null,
        platforms: formData.platforms.length > 0 ? formData.platforms : null,
        description: formData.description.trim() || null,
        external_links: linksArray.length > 0 ? linksArray : null,
        status: 'pending',
      });

      if (error) throw error;
      setSubmitted(true);
      setTimeout(onClose, 2000);
    } catch (err) {
      console.error('Game request error:', err);
      alert('Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  const togglePlatform = (platform: string) => {
    setFormData((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter((p) => p !== platform)
        : [...prev.platforms, platform],
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-bg-card/95 backdrop-blur-xl border border-border rounded-sm max-w-lg w-full p-6 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {submitted ? (
          <div className="text-center py-10">
            <Gamepad2 size={40} className="mx-auto text-accent-green mb-4" />
            <h3 className="text-xl font-bold text-text-primary font-[family-name:var(--font-display)]">Request Submitted!</h3>
            <p className="text-sm text-text-muted mt-2">We&apos;ll review it and add the game soon.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-text-primary font-[family-name:var(--font-display)]">Request a Game</h2>
              <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-all duration-300">
                <X size={18} />
              </button>
            </div>

            <p className="text-sm text-text-muted mb-5">
              Can&apos;t find the game you&apos;re looking for? Tell us about it and we&apos;ll add it to our database.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Game Name */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5">
                  Game Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.game_name}
                  onChange={(e) => setFormData({ ...formData, game_name: e.target.value })}
                  placeholder="e.g., Hollow Knight"
                  className="w-full px-3 py-2.5 bg-bg-primary border border-border rounded-sm text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-green transition-all duration-300"
                  required
                />
              </div>

              {/* Developer */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5">Developer</label>
                <input
                  type="text"
                  value={formData.developer}
                  onChange={(e) => setFormData({ ...formData, developer: e.target.value })}
                  placeholder="e.g., Team Cherry"
                  className="w-full px-3 py-2.5 bg-bg-primary border border-border rounded-sm text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-green transition-all duration-300"
                />
              </div>

              {/* Release Year */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5">Release Year</label>
                <input
                  type="number"
                  value={formData.release_year}
                  onChange={(e) => setFormData({ ...formData, release_year: e.target.value })}
                  placeholder="e.g., 2017"
                  min="1970"
                  max={new Date().getFullYear() + 2}
                  className="w-full px-3 py-2.5 bg-bg-primary border border-border rounded-sm text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-green transition-all duration-300"
                />
              </div>

              {/* Platforms */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5">Platforms</label>
                <div className="flex flex-wrap gap-1.5">
                  {PLATFORM_OPTIONS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => togglePlatform(p)}
                      className={`px-2.5 py-1.5 rounded-sm text-xs font-medium transition-all duration-300 border ${
                        formData.platforms.includes(p)
                          ? 'bg-accent-green/15 border-accent-green/40 text-accent-green'
                          : 'bg-bg-primary border-border text-text-muted hover:text-text-secondary hover:border-border-light'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the game..."
                  className="w-full px-3 py-2.5 bg-bg-primary border border-border rounded-sm text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-green min-h-[64px] resize-none transition-all duration-300"
                  maxLength={500}
                />
              </div>

              {/* Links */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5">Links</label>
                <textarea
                  value={formData.external_links}
                  onChange={(e) => setFormData({ ...formData, external_links: e.target.value })}
                  placeholder="Steam, Epic, or official website (one per line)"
                  className="w-full px-3 py-2.5 bg-bg-primary border border-border rounded-sm text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-green min-h-[56px] resize-none transition-all duration-300"
                />
                <p className="text-[10px] text-text-muted mt-1">One URL per line</p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 bg-bg-elevated border border-border rounded-sm text-sm font-medium text-text-muted hover:text-text-primary transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !formData.game_name.trim()}
                  className="flex-1 py-2.5 bg-accent-green text-black rounded-sm text-sm font-semibold hover:bg-accent-green-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 inline-flex items-center justify-center gap-1.5"
                >
                  <Send size={13} />
                  {loading ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
