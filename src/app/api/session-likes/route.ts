import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Like a session
export async function POST(request: NextRequest) {
  try {
    const { userId, sessionId } = await request.json();
    if (!userId || !sessionId) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // Check if already liked
    const { data: existing } = await supabaseAdmin
      .from('session_likes')
      .select('id')
      .eq('user_id', userId)
      .eq('session_id', sessionId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ success: true, alreadyLiked: true });
    }

    // Insert like
    const { error: likeErr } = await supabaseAdmin
      .from('session_likes')
      .insert({ user_id: userId, session_id: sessionId });

    if (likeErr) {
      console.error('Session like insert error:', likeErr);
      return NextResponse.json({ error: likeErr.message }, { status: 500 });
    }

    // Update likes_count on gaming_sessions
    const { count } = await supabaseAdmin
      .from('session_likes')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId);

    await supabaseAdmin
      .from('gaming_sessions')
      .update({ likes_count: count || 0 })
      .eq('id', sessionId);

    return NextResponse.json({ success: true, likes_count: count || 0 });
  } catch (err) {
    console.error('Session like API error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// Unlike a session
export async function DELETE(request: NextRequest) {
  try {
    const { userId, sessionId } = await request.json();
    if (!userId || !sessionId) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const { error: delErr } = await supabaseAdmin
      .from('session_likes')
      .delete()
      .eq('user_id', userId)
      .eq('session_id', sessionId);

    if (delErr) {
      console.error('Session unlike error:', delErr);
      return NextResponse.json({ error: delErr.message }, { status: 500 });
    }

    // Update likes_count on gaming_sessions
    const { count } = await supabaseAdmin
      .from('session_likes')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId);

    await supabaseAdmin
      .from('gaming_sessions')
      .update({ likes_count: count || 0 })
      .eq('id', sessionId);

    return NextResponse.json({ success: true, likes_count: count || 0 });
  } catch (err) {
    console.error('Session unlike API error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
