import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { userId, actorId, type, targetId, targetType, message } = await request.json();

    if (!userId || !actorId || !type || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Don't notify yourself
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
