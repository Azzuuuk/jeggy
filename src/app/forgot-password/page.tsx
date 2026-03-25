'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { ArrowLeft, Mail } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await resetPassword(email);
      setSubmitted(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message.toLowerCase() : '';
      if (msg.includes('rate') || msg.includes('too many')) {
        setError('Too many requests. Please wait a moment and try again.');
      } else {
        // Always show success to prevent email enumeration
        setSubmitted(true);
      }
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-8 -mt-14">
        <div className="max-w-md w-full bg-bg-card/80 backdrop-blur-xl border border-border rounded-sm p-6 sm:p-8 text-center">
          <div className="w-16 h-16 bg-accent-green/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-accent-green" />
          </div>
          <h1 className="text-2xl font-bold font-[family-name:var(--font-display)] mb-2 text-text-primary">Check your email</h1>
          <p className="text-text-muted text-sm mb-6">
            If an account exists for <span className="text-text-primary font-medium">{email}</span>, we&apos;ve sent password reset instructions.
          </p>
          <p className="text-text-muted text-xs mb-6">
            Didn&apos;t receive it? Check your spam folder, or wait a minute and try again.
          </p>
          <button
            onClick={() => { setSubmitted(false); setEmail(''); }}
            className="w-full py-3 bg-bg-elevated hover:bg-border border border-border text-text-primary font-medium rounded-sm transition-all duration-300 mb-3"
          >
            Try a different email
          </button>
          <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-accent-green transition-colors mt-2">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 -mt-14">
      <div className="max-w-md w-full bg-bg-card/80 backdrop-blur-xl border border-border rounded-sm p-6 sm:p-8">
        <div className="flex justify-center mb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/JeggyLogo.png" alt="Jeggy" className="h-14 w-auto" />
        </div>
        <h1 className="text-2xl font-bold font-[family-name:var(--font-display)] mb-2 text-center text-text-primary">Reset your password</h1>
        <p className="text-text-muted text-sm text-center mb-8">
          Enter your email and we&apos;ll send you a link to reset your password.
        </p>

        {error && (
          <div className="bg-danger/10 border border-danger text-danger rounded-sm p-3 mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-bg-card/80 backdrop-blur-xl border border-border rounded-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-green transition-all duration-300"
              placeholder="you@example.com"
              required
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-accent-green hover:bg-accent-green-hover disabled:opacity-50 text-black font-bold rounded-sm transition-all duration-300"
          >
            {loading ? 'Sending...' : 'Send reset link'}
          </button>
        </form>

        <Link href="/login" className="flex items-center justify-center gap-1.5 text-sm text-text-muted hover:text-accent-green transition-colors mt-6">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to login
        </Link>
      </div>
    </div>
  );
}
