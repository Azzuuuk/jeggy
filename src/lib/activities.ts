import { supabase } from './supabase'

export type ActivityType =
  | 'rated_game'
  | 'reviewed_game'
  | 'created_list'
  | 'started_playing'
  | 'completed_game'
  | 'logged_session'

interface CreateActivityParams {
  userId: string
  activityType: ActivityType
  gameId?: string
  gameName?: string
  gameCoverUrl?: string | null
  rating?: number
  review?: string
  listId?: string
  listTitle?: string
  metadata?: Record<string, unknown>
}

export async function createActivity(params: CreateActivityParams) {
  try {
    // Remove previous activity of the same type for the same user+game/list
    // so the feed only shows the latest (e.g., updated rating replaces old one)
    if (params.gameId) {
      await supabase
        .from('activities')
        .delete()
        .eq('user_id', params.userId)
        .eq('activity_type', params.activityType)
        .eq('game_id', params.gameId)
    } else if (params.listId) {
      await supabase
        .from('activities')
        .delete()
        .eq('user_id', params.userId)
        .eq('activity_type', params.activityType)
        .eq('list_id', params.listId)
    }

    const { error } = await supabase
      .from('activities')
      .insert({
        user_id: params.userId,
        activity_type: params.activityType,
        game_id: params.gameId || null,
        game_name: params.gameName || null,
        game_cover_url: params.gameCoverUrl || null,
        rating: params.rating || null,
        review: params.review || null,
        list_id: params.listId || null,
        list_title: params.listTitle || null,
        metadata: params.metadata || null,
      })

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('Error creating activity:', error)
    return { success: false, error }
  }
}

/** Remove all feed activities for a specific user+game+type (used by admin moderation) */
export async function removeActivities(filters: {
  userId: string
  gameId?: string
  listId?: string
  activityType?: ActivityType
}) {
  try {
    let query = supabase.from('activities').delete().eq('user_id', filters.userId)
    if (filters.gameId) query = query.eq('game_id', filters.gameId)
    if (filters.listId) query = query.eq('list_id', filters.listId)
    if (filters.activityType) query = query.eq('activity_type', filters.activityType)
    await query
  } catch (error) {
    console.error('Error removing activities:', error)
  }
}
