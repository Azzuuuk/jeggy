'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { createNotification } from '@/lib/notifications'

export function useFollow(targetUserId: string | undefined) {
  const { user } = useAuth()
  const [isFollowing, setIsFollowing] = useState(false)
  const [followerCount, setFollowerCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    if (!targetUserId) { setLoading(false); return }

    try {
      const [
        { count: followers },
        { count: following },
      ] = await Promise.all([
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', targetUserId),
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', targetUserId),
      ])

      setFollowerCount(followers || 0)
      setFollowingCount(following || 0)

      if (user && user.id !== targetUserId) {
        const { data } = await supabase
          .from('follows')
          .select('id')
          .eq('follower_id', user.id)
          .eq('following_id', targetUserId)
          .maybeSingle()
        setIsFollowing(!!data)
      }
    } catch (err) {
      console.error('useFollow error:', err)
    } finally {
      setLoading(false)
    }
  }, [targetUserId, user])

  useEffect(() => { fetchData() }, [fetchData])

  const toggleFollow = async () => {
    if (!user || !targetUserId || user.id === targetUserId) return

    try {
      if (!isFollowing) {
        const { checkClientRateLimit } = await import('@/lib/ratelimit-client')
        const rl = await checkClientRateLimit('followUser', user.id)
        if (!rl.success) { alert(rl.message); return }
      }
      if (isFollowing) {
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', targetUserId)
        if (error) throw error
        setIsFollowing(false)
        setFollowerCount(prev => Math.max(0, prev - 1))
      } else {
        const { error } = await supabase
          .from('follows')
          .insert({ follower_id: user.id, following_id: targetUserId })
        if (error) throw error
        setIsFollowing(true)
        setFollowerCount(prev => prev + 1)

        // Get actor username for notification message
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', user.id)
          .single()
        const username = profile?.username || 'Someone'
        createNotification({
          userId: targetUserId,
          actorId: user.id,
          type: 'follow',
          message: `${username} started following you`,
        })
      }
    } catch (err) {
      console.error('Follow toggle error:', err)
    }
  }

  return { isFollowing, followerCount, followingCount, loading, toggleFollow }
}
