'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

interface UserStats {
  current_streak: number
  longest_streak: number
  total_sessions_logged: number
  total_hours_all_time: number
  total_games_played: number
  badges: string[]
}

const DEFAULT_STATS: UserStats = {
  current_streak: 0,
  longest_streak: 0,
  total_sessions_logged: 0,
  total_hours_all_time: 0,
  total_games_played: 0,
  badges: [],
}

export function useUserStats(targetUserId?: string) {
  const { user } = useAuth()
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)

  const userId = targetUserId || user?.id

  const fetchStats = useCallback(async () => {
    if (!userId) return

    try {
      const { data, error } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      setStats(data || DEFAULT_STATS)
    } catch (error) {
      console.error('Error fetching user stats:', error)
      setStats(DEFAULT_STATS)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (userId) fetchStats()
  }, [userId, fetchStats])

  return { stats, loading, refetch: fetchStats }
}
