'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Flag, X } from 'lucide-react';

interface ReportButtonProps {
  type: 'user' | 'review' | 'list' | 'session';
  targetId: string;
  targetUserId?: string;
  className?: string;
}

export function ReportButton({ type, targetId, targetUserId, className = '' }: ReportButtonProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState('spam');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { checkClientRateLimit } = await import('@/lib/ratelimit-client');
      const rl = await checkClientRateLimit('createReport', user.id);
      if (!rl.success) { alert(rl.message); setSubmitting(false); return; }
      const reportData: Record<string, unknown> = {
        reporter_id: user.id,
        report_type: type,
        reason,
        description: description.trim() || null,
        status: 'pending',
      };

      if (type === 'user') reportData.reported_user_id = targetId;
      else if (type === 'review') {
        reportData.reported_review_id = targetId;
        if (targetUserId) reportData.reported_user_id = targetUserId;
      } else if (type === 'list') {
        reportData.reported_list_id = targetId;
        if (targetUserId) reportData.reported_user_id = targetUserId;
      } else if (type === 'session') {
        reportData.reported_session_id = targetId;
        if (targetUserId) reportData.reported_user_id = targetUserId;
      }

      const { error } = await supabase.from('reports').insert(reportData);
      if (error) throw error;

      setSubmitted(true);
      setTimeout(() => { setIsOpen(false); setSubmitted(false); setDescription(''); }, 1500);
    } catch (err) {
      console.error('Report error:', err);
      alert('Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center gap-1 text-text-muted hover:text-red-400 transition-all duration-300 ${className}`}
        title="Report"
      >
        <Flag size={13} />
        <span className="text-xs">Report</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setIsOpen(false)}>
          <div
            className="bg-bg-card/90 backdrop-blur-xl border border-border rounded-sm max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {submitted ? (
              <div className="text-center py-6">
                <Flag size={32} className="mx-auto text-accent-green mb-3" />
                <p className="font-semibold text-text-primary">Report submitted</p>
                <p className="text-sm text-text-muted mt-1">Our team will review it shortly.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-bold text-text-primary">Report {type}</h2>
                  <button onClick={() => setIsOpen(false)} className="text-text-muted hover:text-text-primary transition-all duration-300">
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">Reason</label>
                    <select
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-full px-3 py-2 bg-bg-card/80 backdrop-blur-xl border border-border rounded-sm text-sm text-text-primary focus:outline-none focus:border-accent-green transition-all duration-300"
                      required
                    >
                      <option value="spam">Spam</option>
                      <option value="harassment">Harassment</option>
                      <option value="offensive_content">Offensive Content</option>
                      <option value="inappropriate_username">Inappropriate Username</option>
                      <option value="fake_account">Fake Account</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
                      Additional Details (Optional)
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Provide more context..."
                      className="w-full px-3 py-2 bg-bg-card/80 backdrop-blur-xl border border-border rounded-sm text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-green min-h-[80px] resize-none"
                      maxLength={500}
                    />
                    <p className="text-[10px] text-text-muted mt-1 text-right">{description.length}/500</p>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="flex-1 py-2 bg-bg-elevated border border-border rounded-sm text-sm font-medium text-text-muted hover:text-text-primary transition-all duration-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 py-2 bg-red-500/15 text-red-400 hover:bg-red-500/25 disabled:opacity-50 rounded-sm text-sm font-semibold transition-all duration-300"
                    >
                      {submitting ? 'Submitting...' : 'Submit Report'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
