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
  actorUsername,
  actorDisplayName,
  type,
  listId,
  listTitle,
  gameId,
  gameName,
}: {
  userId: string;
  actorId: string;
  actorUsername: string;
  actorDisplayName?: string;
  type: NotificationType;
  listId?: string;
  listTitle?: string;
  gameId?: string;
  gameName?: string;
}) {
  if (userId === actorId) return;

  try {
    const res = await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, actorId, actorUsername, actorDisplayName, type, listId, listTitle, gameId, gameName }),
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
  adminUsername,
  type,
  listId,
  listTitle,
  gameId,
  gameName,
}: {
  userId: string;
  adminId: string;
  adminUsername: string;
  type: NotificationType;
  listId?: string;
  listTitle?: string;
  gameId?: string;
  gameName?: string;
}) {
  try {
    const res = await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, actorId: adminId, actorUsername: adminUsername, type, listId, listTitle, gameId, gameName }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      console.error('Admin notification API error:', data.error || res.status);
    }
  } catch (err) {
    console.error('Failed to create admin notification:', err);
  }
}
