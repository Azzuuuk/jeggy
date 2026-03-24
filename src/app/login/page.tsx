'use client';

import { useState, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const { signIn, signInWithGoogle, resendConfirmation } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const resetSuccess = searchParams.get('reset') === 'success';

  const handleGoogleSignIn = async () => {
    setError('');
    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setShowResend(false);
    setResendSuccess(false);
    setLoading(true);

    try {
      await signIn(email, password);
      router.push('/home');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      const lower = msg.toLowerCase();

      if (lower.includes('email not confirmed') || lower.includes('not confirmed')) {
        setError('Your email address hasn\'t been confirmed yet. Please check your inbox.');
        setShowResend(true);
      } else if (lower.includes('invalid') || lower.includes('credentials')) {
        setError('Invalid email or password. Please try again.');
      } else if (lower.includes('network') || lower.includes('fetch')) {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError(msg || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setResendSuccess(false);
    try {
      await resendConfirmation(email);
      setResendSuccess(true);
    } catch {
      setError('Failed to resend confirmation email. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 -mt-14">
      <div className="max-w-md w-full bg-bg-card/80 backdrop-blur-xl border border-border rounded-sm p-8">
        <div className="flex justify-center mb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/JeggyLogo.png" alt="Jeggy" className="h-14 w-auto" />
        </div>
        <h1 className="text-3xl font-bold font-[family-name:var(--font-display)] mb-2 text-center text-text-primary">Welcome Back</h1>
        <p className="text-text-muted text-sm text-center mb-8">Log in to your Jeggy account</p>

        {resetSuccess && (
          <div className="bg-accent-green/10 border border-accent-green/30 text-accent-green rounded-sm p-3 mb-4 text-sm flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            Password reset successfully. Please log in with your new password.
          </div>
        )}

        {error && (
          <div className="bg-danger/10 border border-danger text-danger rounded-sm p-3 mb-4 text-sm">
            {error}
          </div>
        )}

        {resendSuccess && (
          <div className="bg-accent-green/10 border border-accent-green/30 text-accent-green rounded-sm p-3 mb-4 text-sm flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            Confirmation email resent! Check your inbox.
          </div>
        )}

        {showResend && !resendSuccess && (
          <button
            onClick={handleResend}
            disabled={resendLoading}
            className="w-full py-2.5 mb-4 bg-bg-elevated hover:bg-border border border-border disabled:opacity-50 text-text-secondary text-sm font-medium rounded-sm transition-all duration-300"
          >
            {resendLoading ? 'Sending...' : 'Resend confirmation email'}
          </button>
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
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-text-secondary">Password</label>
              <Link href="/forgot-password" className="text-xs text-text-muted hover:text-accent-green transition-colors">
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-bg-card/80 backdrop-blur-xl border border-border rounded-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-green transition-all duration-300"
              placeholder="Your password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-accent-green hover:bg-accent-green-hover disabled:opacity-50 text-black font-bold rounded-sm transition-all duration-300"
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
          <div className="relative flex justify-center text-xs"><span className="bg-bg-card px-3 text-text-muted">or</span></div>
        </div>

        <button
          onClick={handleGoogleSignIn}
          className="w-full py-3 bg-white hover:bg-gray-100 text-gray-800 font-medium rounded-sm transition-all duration-300 flex items-center justify-center gap-3"
        >
          <svg width="18" height="18" viewBox="0 0 18 18"><path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/><path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/></svg>
          Continue with Google
        </button>

        <p className="mt-6 text-center text-text-muted text-sm">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-accent-green hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent-green border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
