import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    const { session_token } = await request.json();

    if (!session_token) {
      return NextResponse.json(
        { error: 'Session token is required' },
        { status: 400 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Invalidate the session
    const { data, error } = await supabaseAdmin
      .from('admin_sessions')
      .update({ is_active: false })
      .eq('session_token', session_token)
      .select();

    if (error) {
      console.error('Session invalidation error:', error);
      // Don't fail the logout even if there's an error
    }

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error: any) {
    console.error('Admin logout API error:', error);
    // Always return success for logout to avoid client issues
    return NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });
  }
}

