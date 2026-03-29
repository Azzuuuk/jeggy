export type NotificationType =
  | 'follow'
  | 'like_list'
  | 'like_session'
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

  try {
    const res = await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, actorId, type, targetId, targetType, message }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      console.error('Notification API error:', data.error || res.status);
    }
  } catch (err) {
    console.error('Failed to create notification:', err);
  }
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
  try {
    const res = await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, actorId: adminId, type, targetId, targetType, message }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      console.error('Admin notification API error:', data.error || res.status);
    }
  } catch (err) {
    console.error('Failed to create admin notification:', err);
  }
}
