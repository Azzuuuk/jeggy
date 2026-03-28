'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

interface SignUpResult {
  needsConfirmation: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isRecovery: boolean;
  signUp: (email: string, password: string, username: string) => Promise<SignUpResult>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  resendConfirmation: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    // Detect recovery flow from URL hash BEFORE Supabase processes it
    // Supabase sends: https://jeggy.app/#access_token=...&type=recovery
    const hash = window.location.hash;
    const isRecoveryFlow = hash.includes('type=recovery');

    if (isRecoveryFlow) {
      setIsRecovery(true);
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (isRecoveryFlow && event === 'SIGNED_IN')) {
        setIsRecovery(true);
        setUser(session?.user ?? null);
        setLoading(false);
        window.location.replace('/reset-password');
        return;
      }

      setUser(session?.user ?? null);
    });

    // Only resolve session for non-recovery flows
    if (!isRecoveryFlow) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user ?? null);
        setLoading(false);
      });
    }

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, username: string): Promise<SignUpResult> => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;

    // Supabase returns a user with identities=[] when email already exists (no error thrown)
    if (data.user && data.user.identities?.length === 0) {
      throw new Error('An account with this email already exists. Please log in instead.');
    }

    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        username,
        display_name: username,
      });
      if (profileError) throw profileError;
    }

    // If email confirmation is enabled, session will be null
    const needsConfirmation = !data.session;
    return { needsConfirmation };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    setIsRecovery(false);
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setIsRecovery(false);
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    });
    if (error) throw error;
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  };

  const resendConfirmation = async (email: string) => {
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    if (error) throw error;
  };

  // During recovery, expose user as null to the rest of the app so Navbar/routes treat as unauthenticated
  const exposedUser = isRecovery ? null : user;

  return (
    <AuthContext.Provider value={{
      user: exposedUser, loading, isRecovery, signUp, signIn, signInWithGoogle, signOut,
      resetPassword, updatePassword, resendConfirmation,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
