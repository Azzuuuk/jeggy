'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, AlertTriangle, ArrowLeft } from 'lucide-react';

type PageState = 'loading' | 'ready' | 'success' | 'expired';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pageState, setPageState] = useState<PageState>('loading');

  const { updatePassword, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    let expiredTimer: ReturnType<typeof setTimeout>;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setPageState('ready');
      }
    });

    // Check if there's already a session (recovery link already processed)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setPageState('ready');
      } else {
        // Give time for the hash to be processed by Supabase
        expiredTimer = setTimeout(() => {
          setPageState((prev) => prev === 'loading' ? 'expired' : prev);
        }, 3000);
      }
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(expiredTimer);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      await updatePassword(password);
      setPageState('success');
      // Sign out so the user must log in with their new password
      await signOut();
      setTimeout(() => router.push('/login?reset=success'), 2500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.toLowerCase().includes('same') || msg.toLowerCase().includes('different')) {
        setError('New password must be different from your current password.');
      } else if (msg.toLowerCase().includes('weak') || msg.toLowerCase().includes('short')) {
        setError('Password is too weak. Use at least 6 characters with a mix of letters and numbers.');
      } else {
        setError(msg || 'Failed to update password. The link may have expired.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (pageState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-8 -mt-14">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-acid border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-muted text-sm">Verifying reset link...</p>
        </div>
      </div>
    );
  }

  // Expired / invalid link
  if (pageState === 'expired') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-8 -mt-14">
        <div className="max-w-md w-full bg-bg-card/80 backdrop-blur-xl border border-border rounded-sm p-6 sm:p-8 text-center">
          <div className="w-16 h-16 bg-danger/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-danger" />
          </div>
          <h1 className="text-2xl font-bold font-[family-name:var(--font-display)] mb-2 text-text-primary">Link expired</h1>
          <p className="text-text-muted text-sm mb-6">
            This password reset link has expired or is invalid. Please request a new one.
          </p>
          <Link
            href="/forgot-password"
            className="inline-block w-full py-3 bg-accent-green hover:bg-accent-green-hover text-black font-bold rounded-sm transition-all duration-300 text-center"
          >
            Request new reset link
          </Link>
          <Link href="/login" className="flex items-center justify-center gap-1.5 text-sm text-text-muted hover:text-accent-green transition-colors mt-4">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  // Success state
  if (pageState === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-8 -mt-14">
        <div className="max-w-md w-full bg-bg-card/80 backdrop-blur-xl border border-border rounded-sm p-6 sm:p-8 text-center">
          <div className="w-16 h-16 bg-accent-green/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-accent-green" />
          </div>
          <h1 className="text-2xl font-bold font-[family-name:var(--font-display)] mb-2 text-text-primary">Password updated</h1>
          <p className="text-text-muted text-sm mb-2">
            Your password has been reset. Redirecting you to log in...
          </p>
          <div className="w-6 h-6 border-2 border-acid border-t-transparent rounded-full animate-spin mx-auto mt-4" />
        </div>
      </div>
    );
  }

  // Ready state — show form
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 -mt-14">
      <div className="max-w-md w-full bg-bg-card/80 backdrop-blur-xl border border-border rounded-sm p-6 sm:p-8">
        <div className="flex justify-center mb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/JeggyLogo.png" alt="Jeggy" className="h-14 w-auto" />
        </div>
        <h1 className="text-2xl font-bold font-[family-name:var(--font-display)] mb-2 text-center text-text-primary">Set new password</h1>
        <p className="text-text-muted text-sm text-center mb-8">
          Choose a strong password for your Jeggy account.
        </p>

        {error && (
          <div className="bg-danger/10 border border-danger text-danger rounded-sm p-3 mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">New password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-bg-card/80 backdrop-blur-xl border border-border rounded-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-green transition-all duration-300"
              placeholder="At least 6 characters"
              required
              minLength={6}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Confirm new password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 bg-bg-card/80 backdrop-blur-xl border border-border rounded-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-green transition-all duration-300"
              placeholder="Repeat your new password"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-accent-green hover:bg-accent-green-hover disabled:opacity-50 text-black font-bold rounded-sm transition-all duration-300"
          >
            {loading ? 'Updating...' : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  );
}
