'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdmin } from '@/hooks/useAdmin';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { createAdminNotification } from '@/lib/notifications';
import { removeActivities } from '@/lib/activities';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, XCircle, AlertTriangle, Clock, Trash2, Eye, ShieldCheck } from 'lucide-react';

interface Report {
  id: string;
  reporter_id: string;
  reported_user_id: string | null;
  reported_review_id: string | null;
  reported_list_id: string | null;
  reported_session_id: string | null;
  report_type: string;
  reason: string;
  description: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  resolved_at: string | null;
  reporter: { username: string; display_name: string | null } | null;
  reported_user: { username: string; display_name: string | null } | null;
}

interface ContentPreview {
  text: string;
  ownerId: string;
  ownerUsername: string;
  label: string;
}

const REASON_LABELS: Record<string, string> = {
  spam: 'Spam',
  harassment: 'Harassment',
  offensive_content: 'Offensive Content',
  inappropriate_username: 'Inappropriate Username',
  fake_account: 'Fake Account',
  other: 'Other',
};

export default function AdminReportsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');

  useEffect(() => {
    if (!adminLoading && !isAdmin) router.push('/');
  }, [isAdmin, adminLoading, router]);

  useEffect(() => {
    if (isAdmin) fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, filter]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('reports')
        .select(`
          *,
          reporter:profiles!reports_reporter_id_fkey(username, display_name),
          reported_user:profiles!reports_reported_user_id_fkey(username, display_name)
        `)
        .order('created_at', { ascending: false });

      if (filter === 'pending') query = query.eq('status', 'pending');

      const { data, error } = await query;
      if (error) throw error;
      setReports((data as Report[]) || []);
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  /** Dismiss report (keep content, notify reporter) */
  const dismissReport = async (reportId: string, reporterId: string, adminNotes: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('reports')
        .update({ status: 'dismissed', resolved_at: new Date().toISOString(), admin_notes: adminNotes })
        .eq('id', reportId);
      if (error) throw error;

      await createAdminNotification({
        userId: reporterId,
        adminId: user.id,
        type: 'report_resolved',
        message: 'Your report was reviewed. No violation was found — the content will remain.',
      });

      fetchReports();
    } catch (err) {
      console.error('Error dismissing report:', err);
    }
  };

  /** Remove reported content + resolve report + notify both parties */
  const removeContentAndResolve = async (report: Report, adminNotes: string) => {
    if (!user) return;
    try {
      let contentOwnerId: string | null = null;
      let contentLabel = '';

      // Delete the reported content
      if (report.report_type === 'review' && report.reported_review_id) {
        const { data } = await supabase.from('user_games').select('user_id, game_id').eq('id', report.reported_review_id).single();
        if (data) {
          contentOwnerId = data.user_id;
          await supabase.from('user_games').update({ review: null }).eq('id', report.reported_review_id);
          await removeActivities({ userId: data.user_id, gameId: data.game_id, activityType: 'reviewed_game' });
          contentLabel = 'review';
        }
      } else if (report.report_type === 'list' && report.reported_list_id) {
        const { data } = await supabase.from('lists').select('user_id, title').eq('id', report.reported_list_id).single();
        if (data) {
          contentOwnerId = data.user_id;
          contentLabel = `list "${data.title}"`;
          await supabase.from('lists').delete().eq('id', report.reported_list_id);
          await removeActivities({ userId: data.user_id, listId: report.reported_list_id, activityType: 'created_list' });
        }
      } else if (report.report_type === 'session' && report.reported_session_id) {
        const { data } = await supabase.from('gaming_sessions').select('user_id, game_id').eq('id', report.reported_session_id).single();
        if (data) {
          contentOwnerId = data.user_id;
          contentLabel = 'diary session';
          await supabase.from('gaming_sessions').delete().eq('id', report.reported_session_id);
          await removeActivities({ userId: data.user_id, gameId: data.game_id, activityType: 'logged_session' });
        }
      } else if (report.report_type === 'user' && report.reported_user_id) {
        contentOwnerId = report.reported_user_id;
        contentLabel = 'profile';
      }

      // Mark report as resolved
      const { error } = await supabase
        .from('reports')
        .update({ status: 'action_taken', resolved_at: new Date().toISOString(), admin_notes: adminNotes })
        .eq('id', report.id);
      if (error) throw error;

      // Notify the reporter
      await createAdminNotification({
        userId: report.reporter_id,
        adminId: user.id,
        type: 'report_resolved',
        message: `Your report was reviewed. The ${contentLabel || 'content'} has been removed. Thanks for helping keep Jeggy clean!`,
      });

      // Notify the content owner
      if (contentOwnerId && contentOwnerId !== report.reporter_id) {
        await createAdminNotification({
          userId: contentOwnerId,
          adminId: user.id,
          type: 'content_removed',
          message: `Your ${contentLabel || 'content'} was removed for violating community guidelines. Reason: ${REASON_LABELS[report.reason] || report.reason}.`,
        });
      }

      fetchReports();
    } catch (err) {
      console.error('Error removing content:', err);
    }
  };

  if (adminLoading || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-green" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <Link href="/admin" className="inline-flex items-center gap-1.5 text-accent-green hover:opacity-80 text-sm mb-4 transition-opacity">
        <ArrowLeft size={14} /> Back to Dashboard
      </Link>
      <h1 className="text-3xl font-bold text-text-primary mb-6">Review Reports</h1>

      {/* Filter Tabs */}
      <div className="flex gap-4 mb-6 border-b border-border">
        {(['pending', 'all'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`pb-3 px-1 text-sm font-semibold transition-colors ${
              filter === f
                ? 'text-text-primary border-b-2 border-red-400'
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            {f === 'pending' ? 'Pending' : 'All Reports'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-green" />
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-16 bg-bg-card border border-border rounded-sm">
          <CheckCircle size={48} className="mx-auto text-accent-green mb-4" />
          <h3 className="text-xl font-bold text-text-primary mb-1">No reports to review</h3>
          <p className="text-text-muted text-sm">All caught up!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((r) => (
            <ReportCard
              key={r.id}
              report={r}
              onDismiss={dismissReport}
              onRemove={removeContentAndResolve}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ReportCard({
  report,
  onDismiss,
  onRemove,
}: {
  report: Report;
  onDismiss: (id: string, reporterId: string, notes: string) => void;
  onRemove: (report: Report, notes: string) => void;
}) {
  const [adminNotes, setAdminNotes] = useState('');
  const [showResolve, setShowResolve] = useState(false);
  const [contentPreview, setContentPreview] = useState<ContentPreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [acting, setActing] = useState(false);

  const statusIcon = report.status === 'pending' ? <Clock size={12} /> :
    report.status === 'action_taken' ? <CheckCircle size={12} /> : <XCircle size={12} />;

  const statusColor = report.status === 'pending' ? 'bg-amber-500/15 text-amber-400' :
    report.status === 'action_taken' ? 'bg-accent-green/15 text-accent-green' : 'bg-bg-elevated text-text-muted';

  const fetchPreview = async () => {
    setLoadingPreview(true);
    try {
      if (report.report_type === 'review' && report.reported_review_id) {
        const { data } = await supabase.from('user_games').select('review, user_id').eq('id', report.reported_review_id).single();
        if (data) {
          const { data: profile } = await supabase.from('profiles').select('username').eq('id', data.user_id).single();
          setContentPreview({
            text: data.review || '[Review deleted]',
            ownerId: data.user_id,
            ownerUsername: profile?.username || 'Unknown',
            label: 'Review',
          });
        }
      } else if (report.report_type === 'list' && report.reported_list_id) {
        const { data } = await supabase.from('lists').select('title, description, user_id').eq('id', report.reported_list_id).single();
        if (data) {
          const { data: profile } = await supabase.from('profiles').select('username').eq('id', data.user_id).single();
          setContentPreview({
            text: `${data.title}${data.description ? ': ' + data.description : ''}`,
            ownerId: data.user_id,
            ownerUsername: profile?.username || 'Unknown',
            label: 'List',
          });
        }
      } else if (report.report_type === 'session' && report.reported_session_id) {
        const { data } = await supabase.from('gaming_sessions').select('session_note, user_id, hours_played').eq('id', report.reported_session_id).single();
        if (data) {
          const { data: profile } = await supabase.from('profiles').select('username').eq('id', data.user_id).single();
          setContentPreview({
            text: data.session_note || `${data.hours_played}h session (no notes)`,
            ownerId: data.user_id,
            ownerUsername: profile?.username || 'Unknown',
            label: 'Diary Session',
          });
        }
      }
    } catch (err) {
      console.error('Error fetching preview:', err);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleExpand = () => {
    const next = !showResolve;
    setShowResolve(next);
    if (next && !contentPreview) fetchPreview();
  };

  const handleDismiss = async () => {
    setActing(true);
    await onDismiss(report.id, report.reporter_id, adminNotes);
    setActing(false);
    setShowResolve(false);
  };

  const handleRemove = async () => {
    if (!confirm('This will permanently delete the reported content. Continue?')) return;
    setActing(true);
    await onRemove(report, adminNotes);
    setActing(false);
    setShowResolve(false);
  };

  const hasRemovableContent = report.report_type !== 'user';

  return (
    <div className="bg-bg-card border border-border rounded-sm p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold ${statusColor}`}>
              {statusIcon} {report.status.replace('_', ' ').toUpperCase()}
            </span>
            <span className="px-2 py-0.5 bg-accent-orange/15 text-accent-orange rounded text-xs font-bold uppercase">
              {report.report_type}
            </span>
            <span className="text-xs text-text-muted">{new Date(report.created_at).toLocaleString()}</span>
          </div>

          <div className="text-sm space-y-1">
            <p>
              <span className="text-text-muted">Reported by </span>
              <Link href={`/profile/${report.reporter?.username}`} className="text-accent-green hover:opacity-80 font-medium">
                @{report.reporter?.username}
              </Link>
            </p>
            {report.reported_user && (
              <p>
                <span className="text-text-muted">Against </span>
                <Link href={`/profile/${report.reported_user.username}`} className="text-red-400 hover:opacity-80 font-medium">
                  @{report.reported_user.username}
                </Link>
              </p>
            )}
            <p>
              <span className="text-text-muted">Reason: </span>
              <span className="font-medium text-text-primary">{REASON_LABELS[report.reason] || report.reason}</span>
            </p>
            {report.description && (
              <p className="text-text-secondary mt-1">{report.description}</p>
            )}
          </div>
        </div>

        {report.status === 'pending' && (
          <button
            onClick={handleExpand}
            className="px-3 py-1.5 bg-bg-elevated border border-border rounded-sm text-xs font-semibold text-text-muted hover:text-text-primary transition-colors flex-shrink-0"
          >
            Resolve
          </button>
        )}
      </div>

      {showResolve && report.status === 'pending' && (
        <div className="mt-4 pt-4 border-t border-border space-y-4">
          {/* Content Preview */}
          {loadingPreview ? (
            <div className="bg-bg-primary border border-border rounded-sm p-4 text-center">
              <div className="w-5 h-5 border-2 border-accent-green border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-text-muted mt-2">Loading content...</p>
            </div>
          ) : contentPreview ? (
            <div className="bg-bg-primary border border-border rounded-sm p-4">
              <div className="flex items-center gap-2 mb-2">
                <Eye size={12} className="text-text-muted" />
                <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">{contentPreview.label} by @{contentPreview.ownerUsername}</span>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed line-clamp-4">{contentPreview.text}</p>
            </div>
          ) : report.report_type === 'user' ? (
            <div className="bg-bg-primary border border-border rounded-sm p-4">
              <p className="text-xs text-text-muted">User report — manage via <Link href="/admin/users" className="text-accent-green hover:opacity-80">Users page</Link></p>
            </div>
          ) : null}

          {/* Admin Notes */}
          <textarea
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            placeholder="Admin notes (optional)..."
            className="w-full px-3 py-2 bg-bg-primary border border-border rounded-sm text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-green min-h-[64px] resize-none"
          />

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {hasRemovableContent && (
              <button
                onClick={handleRemove}
                disabled={acting}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-500/15 text-red-400 hover:bg-red-500/25 disabled:opacity-50 rounded-sm text-xs font-semibold transition-colors"
              >
                <Trash2 size={12} /> Remove Content & Resolve
              </button>
            )}
            <button
              onClick={handleDismiss}
              disabled={acting}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-bg-elevated text-text-muted hover:text-text-primary disabled:opacity-50 rounded-sm text-xs font-semibold transition-colors"
            >
              <ShieldCheck size={12} /> Dismiss (Keep Content)
            </button>
          </div>
        </div>
      )}

      {report.admin_notes && report.status !== 'pending' && (
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-xs text-text-muted">Admin notes: <span className="text-text-secondary">{report.admin_notes}</span></p>
        </div>
      )}
    </div>
  );
}
