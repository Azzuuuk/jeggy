import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Create a notification
export async function POST(request: NextRequest) {
  try {
    const { userId, actorId, type, targetId, targetType, message } = await request.json();

    if (!userId || !actorId || !type || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (userId === actorId) {
      return NextResponse.json({ success: true });
    }

    const { error } = await supabaseAdmin.from('notifications').insert({
      user_id: userId,
      actor_id: actorId,
      type,
      target_id: targetId || null,
      target_type: targetType || null,
      message,
    });

    if (error) {
      console.error('Notification insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Notification API error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// Fetch notifications for a user
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('notifications')
      .select('id, user_id, actor_id, type, target_id, target_type, message, is_read, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Notification fetch error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Enrich with actor usernames
    if (data && data.length > 0) {
      const actorIds = [...new Set(data.map(n => n.actor_id))];
      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('id, username')
        .in('id', actorIds);

      const usernameMap: Record<string, string> = {};
      profiles?.forEach(p => { usernameMap[p.id] = p.username; });

      const enriched = data.map(n => ({
        ...n,
        actor_username: usernameMap[n.actor_id] || 'Someone',
      }));

      return NextResponse.json({ notifications: enriched });
    }

    return NextResponse.json({ notifications: [] });
  } catch (err) {
    console.error('Notification GET error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// Mark notifications as read
export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('Notification mark-read error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Notification PATCH error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
