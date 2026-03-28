'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Suspense } from 'react';

function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');

    async function handleCallback() {
      // PKCE flow: exchange the code for a session first
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          console.error('Code exchange failed:', error.message);
          router.replace('/login?error=expired');
          return;
        }
      }

      // Now listen for auth state to determine what to do
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        // No session even after code exchange, wait a moment for hash-based flow
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (event === 'PASSWORD_RECOVERY') {
            subscription.unsubscribe();
            router.replace('/reset-password');
            return;
          }
          if (event === 'SIGNED_IN' && session?.user) {
            subscription.unsubscribe();
            await handleSignedIn(session.user);
          }
        });

        // Timeout fallback
        setTimeout(() => {
          subscription.unsubscribe();
          router.replace('/login');
        }, 5000);
        return;
      }

      // Session exists after code exchange; check if it's a recovery
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
        if (event === 'PASSWORD_RECOVERY') {
          subscription.unsubscribe();
          router.replace('/reset-password');
        }
      });

      // Check the session type from the URL or Supabase event
      // If the session was established from a recovery code, Supabase fires PASSWORD_RECOVERY
      // Give it a moment to fire, then treat as normal sign-in
      setTimeout(async () => {
        subscription.unsubscribe();
        // If we're still here, it was a normal sign-in (not recovery)
        await handleSignedIn(session.user);
      }, 1000);
    }

    async function handleSignedIn(user: { id: string; email?: string; user_metadata?: Record<string, string> }) {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id, avatar_url')
        .eq('id', user.id)
        .maybeSingle();

      if (!existingProfile) {
        const email = user.email || '';
        const username = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '') || `user_${user.id.slice(0, 8)}`;
        const displayName = user.user_metadata?.full_name || user.user_metadata?.name || username;
        const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || null;

        await supabase.from('profiles').insert({
          id: user.id,
          username,
          display_name: displayName,
          avatar_url: avatarUrl,
        });

        router.replace('/onboarding');
      } else {
        if (!existingProfile.avatar_url) {
          const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || null;
          if (avatarUrl) {
            await supabase.from('profiles').update({ avatar_url: avatarUrl }).eq('id', user.id);
          }
        }
        router.replace('/home');
      }
    }

    handleCallback();
  }, [router, searchParams]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-acid border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-acid border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <AuthCallbackInner />
    </Suspense>
  );
}
