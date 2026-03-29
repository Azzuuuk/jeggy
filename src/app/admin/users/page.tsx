'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdmin } from '@/hooks/useAdmin';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { ArrowLeft, Search, Shield, Ban, CheckCircle, AlertTriangle, X } from 'lucide-react';
import { createAdminNotification } from '@/lib/notifications';

interface UserRow {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  is_admin: boolean;
  is_banned: boolean;
  created_at: string;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [warningTarget, setWarningTarget] = useState<{ id: string; username: string } | null>(null);
  const [warningMessage, setWarningMessage] = useState('');

  useEffect(() => {
    if (!adminLoading && !isAdmin) router.push('/');
  }, [isAdmin, adminLoading, router]);

  useEffect(() => {
    if (isAdmin) fetchUsers();
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, bio, is_admin, is_banned, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setUsers((data as UserRow[]) || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleBan = async (userId: string, username: string, currentlyBanned: boolean) => {
    const action = currentlyBanned ? 'unban' : 'ban';
    if (!confirm(`Are you sure you want to ${action} @${username}?`)) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_banned: !currentlyBanned })
        .eq('id', userId);
      if (error) throw error;
      fetchUsers();
    } catch (err) {
      console.error(`Error ${action}ning user:`, err);
    }
  };

  const sendWarning = async () => {
    if (!user || !warningTarget || !warningMessage.trim()) return;
    try {
      await createAdminNotification({
        userId: warningTarget.id,
        adminId: user.id,
        adminUsername: 'Jeggy Admin',
        type: 'admin_warning',
      });
      setWarningTarget(null);
      setWarningMessage('');
      alert(`Warning sent to @${warningTarget.username}`);
    } catch (err) {
      console.error('Error sending warning:', err);
    }
  };

  const filtered = users.filter(
    (u) =>
      u.username?.toLowerCase().includes(search.toLowerCase()) ||
      u.display_name?.toLowerCase().includes(search.toLowerCase()),
  );

  if (adminLoading || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-acid" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <Link href="/admin" className="inline-flex items-center gap-1.5 text-accent-green hover:opacity-80 text-sm mb-4 transition-opacity">
        <ArrowLeft size={14} /> Back to Dashboard
      </Link>
      <h1 className="text-3xl font-bold text-text-primary mb-6">Manage Users</h1>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search users..."
          className="w-full pl-10 pr-4 py-3 bg-bg-card border border-border rounded-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-green transition-colors"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-acid" />
        </div>
      ) : (
        <div className="bg-bg-card border border-border rounded-sm overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block">
            <table className="w-full">
              <thead className="bg-bg-primary border-b border-border">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">User</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">Joined</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-text-muted">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-bg-elevated/50 transition-colors">
                    <td className="px-6 py-4">
                      <Link href={`/profile/${u.username}`} className="hover:text-accent-green transition-colors">
                        <p className="font-semibold text-text-primary">{u.display_name || u.username}</p>
                        <p className="text-xs text-text-muted">@{u.username}</p>
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-text-muted">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      {u.is_admin ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-accent-green/15 text-accent-green rounded text-xs font-bold">
                          <Shield size={10} /> ADMIN
                        </span>
                      ) : u.is_banned ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-500/15 text-red-400 rounded text-xs font-bold">
                          <Ban size={10} /> BANNED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-bg-elevated text-text-muted rounded text-xs font-bold">
                          <CheckCircle size={10} /> ACTIVE
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {!u.is_admin && (
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={() => { setWarningTarget({ id: u.id, username: u.username }); setWarningMessage(''); }}
                            className="px-3 py-1.5 rounded-sm text-xs font-semibold transition-colors bg-amber-500/15 text-amber-400 hover:bg-amber-500/25"
                            title="Send warning"
                          >
                            Warn
                          </button>
                          <button
                            onClick={() => toggleBan(u.id, u.username, u.is_banned)}
                            className={`px-3 py-1.5 rounded-sm text-xs font-semibold transition-colors ${
                              u.is_banned
                                ? 'bg-accent-green/15 text-accent-green hover:bg-accent-green/25'
                                : 'bg-red-500/15 text-red-400 hover:bg-red-500/25'
                            }`}
                          >
                            {u.is_banned ? 'Unban' : 'Ban'}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-border">
            {filtered.map((u) => (
              <div key={u.id} className="p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <Link href={`/profile/${u.username}`} className="hover:text-accent-green transition-colors">
                    <p className="font-semibold text-text-primary text-sm truncate">{u.display_name || u.username}</p>
                    <p className="text-xs text-text-muted">@{u.username}</p>
                  </Link>
                  <div className="mt-1">
                    {u.is_admin ? (
                      <span className="text-[10px] font-bold text-accent-green">ADMIN</span>
                    ) : u.is_banned ? (
                      <span className="text-[10px] font-bold text-red-400">BANNED</span>
                    ) : (
                      <span className="text-[10px] font-bold text-text-muted">ACTIVE</span>
                    )}
                  </div>
                </div>
                {!u.is_admin && (
                  <div className="flex gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => { setWarningTarget({ id: u.id, username: u.username }); setWarningMessage(''); }}
                      className="px-3 py-1.5 rounded-sm text-xs font-semibold bg-amber-500/15 text-amber-400"
                    >
                      Warn
                    </button>
                    <button
                      onClick={() => toggleBan(u.id, u.username, u.is_banned)}
                      className={`px-3 py-1.5 rounded-sm text-xs font-semibold flex-shrink-0 ${
                        u.is_banned
                          ? 'bg-accent-green/15 text-accent-green'
                          : 'bg-red-500/15 text-red-400'
                      }`}
                    >
                      {u.is_banned ? 'Unban' : 'Ban'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-12 text-text-muted">No users found</div>
          )}
        </div>
      )}

      {/* Warning Modal */}
      {warningTarget && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setWarningTarget(null)}>
          <div className="bg-bg-card/95 backdrop-blur-xl border border-border rounded-sm max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className="text-amber-400" />
                <h3 className="text-lg font-bold text-text-primary">Warn @{warningTarget.username}</h3>
              </div>
              <button onClick={() => setWarningTarget(null)} className="text-text-muted hover:text-text-primary"><X size={16} /></button>
            </div>
            <p className="text-sm text-text-muted mb-4">
              Send a warning notification to this user. They&apos;ll see it in their notification bell.
            </p>
            <textarea
              value={warningMessage}
              onChange={(e) => setWarningMessage(e.target.value)}
              placeholder="Describe the issue, e.g., Your recent activity violates our community guidelines. Repeated violations may result in a ban."
              className="w-full px-3 py-2 bg-bg-primary border border-border rounded-sm text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-amber-400 min-h-[100px] resize-none mb-4"
              maxLength={500}
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setWarningTarget(null); setWarningMessage(''); }}
                className="flex-1 py-2.5 bg-bg-elevated border border-border rounded-sm text-sm font-medium text-text-muted hover:text-text-primary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={sendWarning}
                disabled={!warningMessage.trim()}
                className="flex-1 py-2.5 bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 disabled:opacity-50 rounded-sm text-sm font-semibold transition-colors"
              >
                Send Warning
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
