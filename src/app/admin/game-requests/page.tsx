'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAdmin } from '@/hooks/useAdmin';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, XCircle, Clock, Gamepad2, ExternalLink, Globe } from 'lucide-react';
import { createAdminNotification } from '@/lib/notifications';

interface GameRequest {
  id: string;
  created_at: string;
  requester_id: string;
  game_name: string;
  developer: string | null;
  release_year: number | null;
  platforms: string[] | null;
  description: string | null;
  external_links: string[] | null;
  status: string;
  admin_notes: string | null;
  requester: { username: string; display_name: string | null } | null;
}

export default function AdminGameRequestsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [requests, setRequests] = useState<GameRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');

  useEffect(() => {
    if (!adminLoading && !isAdmin) router.push('/');
  }, [isAdmin, adminLoading, router]);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('game_requests')
        .select(`
          *,
          requester:profiles!game_requests_requester_id_fkey(username, display_name)
        `)
        .order('created_at', { ascending: false });

      if (filter === 'pending') query = query.eq('status', 'pending');

      const { data, error } = await query;
      if (error) throw error;
      setRequests((data as GameRequest[]) || []);
    } catch (err) {
      console.error('Error fetching game requests:', err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    if (isAdmin) fetchRequests();
  }, [isAdmin, fetchRequests]);

  const updateStatus = async (request: GameRequest, status: 'approved' | 'rejected', notes: string) => {
    try {
      const { error } = await supabase
        .from('game_requests')
        .update({
          status,
          admin_notes: notes || null,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
        })
        .eq('id', request.id);
      if (error) throw error;

      // Notify the requester
      if (user && request.requester_id) {
        const message = status === 'approved'
          ? `Great news! Your request for "${request.game_name}" has been approved and will be added to Jeggy soon.`
          : `Your game request for "${request.game_name}" could not be added at this time.${notes ? ' Note: ' + notes : ''}`;

        await createAdminNotification({
          userId: request.requester_id,
          adminId: user.id,
          type: 'game_request_update',
          message,
        });
      }

      fetchRequests();
    } catch (err) {
      console.error('Error updating request:', err);
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
      <div className="flex items-center gap-3 mb-1">
        <Gamepad2 size={24} className="text-accent-teal" />
        <h1 className="text-3xl font-bold text-text-primary font-[family-name:var(--font-display)]">Game Requests</h1>
      </div>
      <p className="text-text-muted text-sm mb-6">Review and approve user-submitted game requests</p>

      {/* Filter Tabs */}
      <div className="flex gap-4 mb-6 border-b border-border">
        {(['pending', 'all'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`pb-3 px-1 text-sm font-semibold transition-colors ${
              filter === f
                ? 'text-text-primary border-b-2 border-accent-teal'
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            {f === 'pending' ? 'Pending' : 'All Requests'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-green" />
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-16 bg-bg-card border border-border rounded-sm">
          <CheckCircle size={48} className="mx-auto text-accent-green mb-4" />
          <h3 className="text-xl font-bold text-text-primary mb-1">No requests to review</h3>
          <p className="text-text-muted text-sm">
            {filter === 'pending' ? 'All caught up!' : 'No game requests found'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((r) => (
            <RequestCard key={r.id} request={r} onUpdate={updateStatus} />
          ))}
        </div>
      )}
    </div>
  );
}

function RequestCard({ request, onUpdate }: { request: GameRequest; onUpdate: (request: GameRequest, status: 'approved' | 'rejected', notes: string) => void }) {
  const [adminNotes, setAdminNotes] = useState('');
  const [showResolve, setShowResolve] = useState(false);

  const statusIcon = request.status === 'pending' ? <Clock size={12} /> :
    request.status === 'approved' || request.status === 'added' ? <CheckCircle size={12} /> : <XCircle size={12} />;

  const statusColor = request.status === 'pending' ? 'bg-amber-500/15 text-amber-400' :
    request.status === 'approved' || request.status === 'added' ? 'bg-accent-green/15 text-accent-green' : 'bg-bg-elevated text-text-muted';

  return (
    <div className="bg-bg-card border border-border rounded-sm p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold ${statusColor}`}>
              {statusIcon} {request.status.toUpperCase()}
            </span>
            <span className="text-xs text-text-muted">{new Date(request.created_at).toLocaleString()}</span>
          </div>

          <h3 className="text-lg font-bold text-text-primary font-[family-name:var(--font-display)]">{request.game_name}</h3>

          <div className="text-sm space-y-1">
            {request.requester && (
              <p>
                <span className="text-text-muted">Requested by </span>
                <Link href={`/profile/${request.requester.username}`} className="text-accent-green hover:opacity-80 font-medium">
                  @{request.requester.username}
                </Link>
              </p>
            )}
            {request.developer && (
              <p><span className="text-text-muted">Developer: </span><span className="text-text-primary">{request.developer}</span></p>
            )}
            {request.release_year && (
              <p><span className="text-text-muted">Year: </span><span className="text-text-primary">{request.release_year}</span></p>
            )}
            {request.platforms && request.platforms.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {request.platforms.map((p) => (
                  <span key={p} className="px-2 py-0.5 bg-bg-elevated border border-border rounded text-[11px] text-text-secondary">{p}</span>
                ))}
              </div>
            )}
          </div>

          {request.description && (
            <div className="bg-bg-primary border border-border rounded-sm p-3 mt-2">
              <p className="text-xs text-text-muted mb-1">Description:</p>
              <p className="text-sm text-text-secondary">{request.description}</p>
            </div>
          )}

          {request.external_links && request.external_links.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {request.external_links.map((link, i) => (
                <a
                  key={i}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-accent-teal hover:opacity-80 transition-opacity"
                >
                  <Globe size={11} /> {new URL(link).hostname}
                  <ExternalLink size={10} />
                </a>
              ))}
            </div>
          )}
        </div>

        {request.status === 'pending' && (
          <button
            onClick={() => setShowResolve(!showResolve)}
            className="px-3 py-1.5 bg-bg-elevated border border-border rounded-sm text-xs font-semibold text-text-muted hover:text-text-primary transition-colors flex-shrink-0"
          >
            Review
          </button>
        )}
      </div>

      {showResolve && request.status === 'pending' && (
        <div className="mt-4 pt-4 border-t border-border">
          <textarea
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            placeholder="Admin notes (optional) — e.g., Added via IGDB ID 12345"
            className="w-full px-3 py-2 bg-bg-primary border border-border rounded-sm text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-green min-h-[64px] mb-3 resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={() => onUpdate(request, 'approved', adminNotes)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent-green/15 text-accent-green hover:bg-accent-green/25 rounded-sm text-xs font-semibold transition-colors"
            >
              <CheckCircle size={12} /> Approve
            </button>
            <button
              onClick={() => onUpdate(request, 'rejected', adminNotes)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-bg-elevated text-text-muted hover:text-text-primary rounded-sm text-xs font-semibold transition-colors"
            >
              <XCircle size={12} /> Reject
            </button>
          </div>
        </div>
      )}

      {request.admin_notes && request.status !== 'pending' && (
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-xs text-text-muted">Admin notes: <span className="text-text-secondary">{request.admin_notes}</span></p>
        </div>
      )}
    </div>
  );
}
