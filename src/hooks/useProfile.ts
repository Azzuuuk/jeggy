'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  platforms: string[] | null;
  mount_rushmore_games: string[] | null;
  mount_rushmore_tagline: string | null;
  gamertags: {
    psn?: string;
    xbox?: string;
    nintendo?: string;
    steam?: string;
  } | null;
  created_at: string;
  updated_at: string;
}

export function useProfile(usernameOrId?: string) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    const target = usernameOrId || user?.id;
    if (!target) {
      setLoading(false);
      return;
    }

    try {
      // Only show loading on initial fetch, not refetches (avoids unmounting child components)
      if (!profile) setLoading(true);
      setError(null);

      // Try by username first, then by id
      let result = await supabase
        .from('profiles')
        .select('*')
        .eq('username', target)
        .maybeSingle();

      if (!result.data && !result.error) {
        result = await supabase
          .from('profiles')
          .select('*')
          .eq('id', target)
          .maybeSingle();
      }

      if (result.error) throw result.error;
      setProfile(result.data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch profile';
      console.error('Error fetching profile:', message);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [usernameOrId, user?.id]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = async (updates: Partial<Profile>) => {
    const profileId = profile?.id || user?.id;
    if (!profileId) return { success: false, error: 'No profile ID' };

    try {
      const { checkClientRateLimit } = await import('@/lib/ratelimit-client');
      const rl = await checkClientRateLimit('updateProfile', profileId);
      if (!rl.success) return { success: false, error: rl.message || 'Rate limit exceeded' };
      const { data, error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', profileId)
        .select()
        .single();

      if (error) throw error;
      setProfile(data);
      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update profile';
      console.error('Error updating profile:', message);
      return { success: false, error: message };
    }
  };

  return { profile, loading, error, updateProfile, refetch: fetchProfile };
}
