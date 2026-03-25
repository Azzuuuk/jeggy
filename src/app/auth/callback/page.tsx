'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        router.replace('/reset-password');
        return;
      }

      if (event === 'SIGNED_IN' && session?.user) {
        const user = session.user;

        // Check if profile exists
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id, avatar_url')
          .eq('id', user.id)
          .maybeSingle();

        if (!existingProfile) {
          // First-time Google user — create profile with Google avatar
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
          // Backfill Google avatar if profile has none
          if (!existingProfile.avatar_url) {
            const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || null;
            if (avatarUrl) {
              await supabase.from('profiles').update({ avatar_url: avatarUrl }).eq('id', user.id);
            }
          }
          router.replace('/home');
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-acid border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
