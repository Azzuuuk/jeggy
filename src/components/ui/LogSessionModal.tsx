'use client';

import { useState } from 'react';
import { X, Clock, Calendar, Monitor, MessageSquare } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface LogSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameId: string;
  gameName: string;
  gameCover?: string;
  onLogged?: () => void;
}

const PLATFORMS = ['PC', 'PlayStation 5', 'PlayStation 4', 'Xbox Series X|S', 'Xbox One', 'Nintendo Switch', 'Mobile', 'Steam Deck'];

export default function LogSessionModal({ isOpen, onClose, gameId, gameName, gameCover, onLogged }: LogSessionModalProps) {
  const { user } = useAuth();
  const [hours, setHours] = useState('1');
  const [sessionNote, setSessionNote] = useState('');
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [platform, setPlatform] = useState('PC');
  const [isPublic, setIsPublic] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const hoursPlayed = parseFloat(hours);
    if (isNaN(hoursPlayed) || hoursPlayed <= 0 || hoursPlayed > 24) return;

    setSaving(true);
    try {
      const { checkClientRateLimit } = await import('@/lib/ratelimit-client');
      const rl = await checkClientRateLimit('createSession', user.id);
      if (!rl.success) { alert(rl.message); setSaving(false); return; }

      const { error } = await supabase
        .from('gaming_sessions')
        .insert({
          user_id: user.id,
          game_id: gameId,
          hours_played: hoursPlayed,
          session_date: sessionDate,
          session_note: sessionNote.trim() || null,
          platform,
          is_public: isPublic,
        });

      if (error) throw error;

      setSaved(true);
      setTimeout(() => {
        setHours('1');
        setSessionNote('');
        setPlatform('PC');
        setSessionDate(new Date().toISOString().split('T')[0]);
        setSaved(false);
        onClose();
        onLogged?.();
      }, 1200);
    } catch (err) {
      console.error('Error logging session:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-bg-card/90 backdrop-blur-xl border border-border rounded-sm max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-lg font-bold text-text-primary">Log Session</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-all duration-300">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Game display */}
          <div className="flex items-center gap-3 bg-bg-primary border border-border rounded-sm p-3">
            {gameCover && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={gameCover} alt={gameName} className="w-12 h-16 object-cover rounded" />
            )}
            <div className="min-w-0">
              <p className="font-semibold text-text-primary truncate">{gameName}</p>
              <p className="text-xs text-text-muted">Logging play session</p>
            </div>
          </div>

          {/* Hours */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-text-primary mb-2">
              <Clock size={14} className="text-accent-teal" />
              Hours Played
            </label>
            <input
              type="number"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              step="0.5"
              min="0.5"
              max="24"
              required
              className="w-full px-4 py-2.5 bg-bg-card/80 backdrop-blur-xl border border-border rounded-sm text-text-primary focus:outline-none focus:border-accent-green transition-all duration-300"
            />
            <p className="text-xs text-text-muted mt-1">0.5 – 24 hours</p>
          </div>

          {/* Date */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-text-primary mb-2">
              <Calendar size={14} className="text-accent-teal" />
              Session Date
            </label>
            <input
              type="date"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2.5 bg-bg-card/80 backdrop-blur-xl border border-border rounded-sm text-text-primary focus:outline-none focus:border-accent-green transition-all duration-300"
            />
          </div>

          {/* Platform */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-text-primary mb-2">
              <Monitor size={14} className="text-accent-teal" />
              Platform
            </label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full px-4 py-2.5 bg-bg-card/80 backdrop-blur-xl border border-border rounded-sm text-text-primary focus:outline-none focus:border-accent-green transition-all duration-300"
            >
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Note */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-text-primary mb-2">
              <MessageSquare size={14} className="text-accent-teal" />
              Session Note <span className="text-text-muted font-normal">(optional)</span>
            </label>
            <textarea
              value={sessionNote}
              onChange={(e) => setSessionNote(e.target.value)}
              placeholder="What did you do? Any achievements? Rage quits? 😄"
              className="w-full px-4 py-2.5 bg-bg-card/80 backdrop-blur-xl border border-border rounded-sm text-text-primary focus:outline-none focus:border-accent-green transition-all duration-300 min-h-[80px] resize-none"
              maxLength={500}
            />
            <p className="text-xs text-text-muted mt-1 text-right">{sessionNote.length}/500</p>
          </div>

          {/* Public toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="w-4 h-4 rounded border-border accent-accent-green"
            />
            <span className="text-sm text-text-secondary">Share publicly (appears in feed &amp; diary)</span>
          </label>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-bg-elevated text-text-secondary rounded-sm text-sm font-medium hover:text-text-primary transition-all duration-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || saved}
              className={`flex-1 py-2.5 rounded-sm text-sm font-bold transition-all duration-300 ${saved ? 'bg-accent-green text-black' : 'bg-accent-green hover:bg-accent-green-hover disabled:opacity-50 text-black'}`}
            >
              {saved ? '✓ Logged!' : saving ? 'Logging...' : `Log ${hours}h`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
