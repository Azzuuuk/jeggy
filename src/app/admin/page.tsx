'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Shield, Users, AlertTriangle, FileText, Gamepad2, Star, ListOrdered, Clock, BarChart3 } from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalGames: 0,
    totalRatings: 0,
    totalReviews: 0,
    totalLists: 0,
    totalSessions: 0,
    reportsCount: 0,
    gameRequestsCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!adminLoading && !isAdmin) router.push('/');
  }, [isAdmin, adminLoading, router]);

  useEffect(() => {
    if (isAdmin) fetchStats();
  }, [isAdmin]);

  const fetchStats = async () => {
    try {
      const [users, games, ratings, reviews, lists, sessions, reports, gameRequests] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('games').select('*', { count: 'exact', head: true }),
        supabase.from('user_games').select('*', { count: 'exact', head: true }).not('rating', 'is', null),
        supabase.from('user_games').select('*', { count: 'exact', head: true }).not('review', 'is', null),
        supabase.from('lists').select('*', { count: 'exact', head: true }),
        supabase.from('gaming_sessions').select('*', { count: 'exact', head: true }),
        supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('game_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      ]);

      setStats({
        totalUsers: users.count || 0,
        totalGames: games.count || 0,
        totalRatings: ratings.count || 0,
        totalReviews: reviews.count || 0,
        totalLists: lists.count || 0,
        totalSessions: sessions.count || 0,
        reportsCount: reports.count || 0,
        gameRequestsCount: gameRequests.count || 0,
      });
    } catch (err) {
      console.error('Admin stats error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (adminLoading || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-green" />
      </div>
    );
  }

  const statCards = [
    { val: stats.totalUsers, label: 'Total Users', color: 'text-accent-green', icon: Users },
    { val: stats.totalGames, label: 'Total Games', color: 'text-blue-400', icon: Gamepad2 },
    { val: stats.totalRatings, label: 'Total Ratings', color: 'text-accent-orange', icon: Star },
    { val: stats.totalReviews, label: 'Total Reviews', color: 'text-purple-400', icon: FileText },
    { val: stats.totalLists, label: 'Total Lists', color: 'text-accent-teal', icon: ListOrdered },
    { val: stats.totalSessions, label: 'Gaming Sessions', color: 'text-yellow-400', icon: Clock },
  ];

  const quickActions = [
    { href: '/admin/users', icon: Users, title: 'Manage Users', desc: 'View, ban, or manage user accounts', borderHover: 'hover:border-accent-green' },
    { href: '/admin/reports', icon: AlertTriangle, title: 'Review Reports', desc: 'Handle content reports and moderation', borderHover: 'hover:border-red-400', badge: stats.reportsCount },
    { href: '/admin/content', icon: FileText, title: 'Manage Content', desc: 'Review and moderate reviews & lists', borderHover: 'hover:border-blue-400' },
    { href: '/admin/game-requests', icon: Gamepad2, title: 'Game Requests', desc: 'Review and approve user-requested games', borderHover: 'hover:border-accent-teal', badge: stats.gameRequestsCount },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield size={28} className="text-accent-green" />
          <h1 className="text-3xl font-bold text-text-primary">Admin Dashboard</h1>
        </div>
        <p className="text-text-muted text-sm">Manage the Jeggy platform</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-10">
        {statCards.map((s) => (
          <div key={s.label} className="bg-bg-card border border-border rounded-sm p-5 hover:border-border-light transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <s.icon size={16} className={s.color} />
              <span className="text-xs uppercase tracking-wider text-text-muted">{s.label}</span>
            </div>
            <p className={`text-3xl font-bold ${s.color}`}>
              {loading ? '...' : s.val.toLocaleString()}
            </p>
          </div>
        ))}
        {/* Reports card with special styling */}
        <div className={`bg-bg-card border rounded-sm p-5 transition-colors ${
          stats.reportsCount > 0 ? 'border-red-500/50 hover:border-red-400' : 'border-border hover:border-border-light'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-red-400" />
            <span className="text-xs uppercase tracking-wider text-text-muted">Pending Reports</span>
          </div>
          <p className="text-3xl font-bold text-red-400">
            {loading ? '...' : stats.reportsCount}
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
        <BarChart3 size={18} className="text-text-muted" /> Quick Actions
      </h2>
      <div className="grid md:grid-cols-3 gap-4">
        {quickActions.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className={`bg-bg-card border border-border ${a.borderHover} rounded-sm p-6 transition-colors group`}
          >
            <a.icon size={28} className="text-text-muted group-hover:text-text-primary transition-colors mb-3" />
            <h3 className="text-lg font-bold text-text-primary mb-1">{a.title}</h3>
            <p className="text-sm text-text-muted">{a.desc}</p>
            {a.badge != null && a.badge > 0 && (
              <span className="mt-3 inline-block px-3 py-1 bg-red-500 rounded-full text-xs font-bold text-white">
                {a.badge} pending
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
