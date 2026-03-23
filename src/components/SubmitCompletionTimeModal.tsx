'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { X, Clock, Timer } from 'lucide-react';

interface SubmitCompletionTimeModalProps {
  gameId: string;
  gameName: string;
  existingTime?: {
    id: string;
    completion_type: string;
    main_story_hours: number | null;
    main_extra_hours: number | null;
    completionist_hours: number | null;
    platform: string | null;
    notes: string | null;
  } | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function SubmitCompletionTimeModal({
  gameId,
  gameName,
  existingTime,
  onClose,
  onSuccess,
}: SubmitCompletionTimeModalProps) {
  const { user } = useAuth();
  const [completionType, setCompletionType] = useState(existingTime?.completion_type || 'main');
  const [hours, setHours] = useState(
    existingTime?.main_story_hours?.toString() ||
    existingTime?.main_extra_hours?.toString() ||
    existingTime?.completionist_hours?.toString() ||
    ''
  );
  const [platform, setPlatform] = useState(existingTime?.platform || '');
  const [notes, setNotes] = useState(existingTime?.notes || '');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const hoursNum = parseFloat(hours);
    if (isNaN(hoursNum) || hoursNum <= 0 || hoursNum > 10000) return;

    setSubmitting(true);
    try {
      const timeData = {
        user_id: user.id,
        game_id: gameId,
        completion_type: completionType,
        platform: platform.trim() || null,
        notes: notes.trim() || null,
        main_story_hours: completionType === 'main' ? hoursNum : null,
        main_extra_hours: completionType === 'main_extra' ? hoursNum : null,
        completionist_hours: completionType === 'completionist' ? hoursNum : null,
      };

      if (existingTime) {
        const { error } = await supabase
          .from('user_completion_times')
          .update(timeData)
          .eq('id', existingTime.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_completion_times')
          .insert(timeData);
        if (error) throw error;
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error submitting completion time:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-bg-card/90 backdrop-blur-xl border border-border rounded-sm max-w-lg w-full p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
            <Timer size={18} className="text-accent-teal" />
            Submit Completion Time
          </h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-all duration-300">
            <X size={18} />
          </button>
        </div>

        <p className="text-sm font-medium text-text-primary mb-1">{gameName}</p>
        <p className="text-xs text-text-muted mb-5">Help the community by sharing how long it took you to beat this game</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-text-muted uppercase tracking-wider mb-1.5">Completion Type</label>
            <select
              value={completionType}
              onChange={(e) => setCompletionType(e.target.value)}
              className="w-full px-3 py-2 bg-bg-card/80 backdrop-blur-xl border border-border rounded-sm text-sm text-text-primary focus:outline-none focus:border-accent-green transition-all duration-300"
            >
              <option value="main">Main Story Only</option>
              <option value="main_extra">Main + Extras</option>
              <option value="completionist">100% Completion</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-text-muted uppercase tracking-wider mb-1.5">
              Hours to Complete <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="10000"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="e.g., 25.5"
                className="w-full pl-9 pr-3 py-2 bg-bg-card/80 backdrop-blur-xl border border-border rounded-sm text-sm text-text-primary focus:outline-none focus:border-accent-green transition-all duration-300"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-text-muted uppercase tracking-wider mb-1.5">Platform (Optional)</label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full px-3 py-2 bg-bg-card/80 backdrop-blur-xl border border-border rounded-sm text-sm text-text-primary focus:outline-none focus:border-accent-green transition-all duration-300"
            >
              <option value="">Select platform...</option>
              <option value="PC">PC</option>
              <option value="PlayStation 5">PlayStation 5</option>
              <option value="PlayStation 4">PlayStation 4</option>
              <option value="Xbox Series X|S">Xbox Series X|S</option>
              <option value="Xbox One">Xbox One</option>
              <option value="Nintendo Switch">Nintendo Switch</option>
              <option value="Steam Deck">Steam Deck</option>
              <option value="Mobile">Mobile</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-text-muted uppercase tracking-wider mb-1.5">Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Difficulty, playstyle, etc."
              className="w-full px-3 py-2 bg-bg-card/80 backdrop-blur-xl border border-border rounded-sm text-sm text-text-primary focus:outline-none focus:border-accent-green transition-all duration-300 min-h-[80px] resize-none"
              maxLength={300}
            />
            <p className="text-[10px] text-text-muted mt-1">{notes.length}/300</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-bg-primary border border-border rounded-sm text-sm font-medium text-text-muted hover:text-text-primary hover:border-border-light transition-all duration-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !hours}
              className="flex-1 py-2.5 bg-accent-green/15 border border-accent-green/30 text-accent-green rounded-sm text-sm font-medium hover:bg-accent-green/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300"
            >
              {submitting ? 'Submitting...' : existingTime ? 'Update Time' : 'Submit Time'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
