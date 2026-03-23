import { supabase } from '@/lib/supabase';

export type NotificationType =
  | 'follow'
  | 'like_list'
  | 'comment_list'
  | 'report_resolved'
  | 'content_removed'
  | 'game_request_update'
  | 'admin_warning';

export async function createNotification({
  userId,
  actorId,
  type,
  targetId,
  targetType,
  message,
}: {
  userId: string;
  actorId: string;
  type: NotificationType;
  targetId?: string;
  targetType?: string;
  message: string;
}) {
  if (userId === actorId) return;

  await supabase.from('notifications').insert({
    user_id: userId,
    actor_id: actorId,
    type,
    target_id: targetId || null,
    target_type: targetType || null,
    message,
  });
}

/** Admin notifications bypass the self-check */
export async function createAdminNotification({
  userId,
  adminId,
  type,
  targetId,
  targetType,
  message,
}: {
  userId: string;
  adminId: string;
  type: NotificationType;
  targetId?: string;
  targetType?: string;
  message: string;
}) {
  await supabase.from('notifications').insert({
    user_id: userId,
    actor_id: adminId,
    type,
    target_id: targetId || null,
    target_type: targetType || null,
    message,
  });
}
