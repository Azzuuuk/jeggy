import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Create a notification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, actorId, actorUsername, actorDisplayName, type, listId, listTitle, gameId, gameName } = body;

    if (!userId || !actorId || !type || !actorUsername) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (userId === actorId) {
      return NextResponse.json({ success: true });
    }

    const { error } = await supabaseAdmin.from('notifications').insert({
      user_id: userId,
      actor_id: actorId,
      actor_username: actorUsername,
      actor_display_name: actorDisplayName || null,
      type,
      list_id: listId || null,
      list_title: listTitle || null,
      game_id: gameId || null,
      game_name: gameName || null,
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
      .select('id, user_id, actor_id, actor_username, actor_display_name, type, list_id, list_title, game_id, game_name, read, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Notification fetch error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ notifications: data || [] });
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
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);

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
