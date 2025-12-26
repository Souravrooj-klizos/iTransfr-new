import { supabaseAdmin } from '@/lib/supabaseClient';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    // Trim whitespace from inputs
    const trimmedUsername = username?.toString().trim();
    const trimmedPassword = password?.toString().trim();


    if (!trimmedUsername || !trimmedPassword) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Call the database authentication function
    const { data: authResult, error } = await supabaseAdmin.rpc('authenticate_admin', {
      p_username: trimmedUsername,
      p_password: trimmedPassword,
      p_ip_address:
        request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      p_user_agent: request.headers.get('user-agent') || 'unknown',
    });

    console.log('🔐 Auth result:', {
      success: authResult?.success,
      error: authResult?.error,
      hasSessionToken: !!authResult?.session_token
    });

    if (error) {
      console.error('Admin authentication error:', error);
      return NextResponse.json(
        { error: 'Authentication failed', details: error.message },
        { status: 500 }
      );
    }

    // Check if authentication was successful
    if (!authResult?.success) {
      return NextResponse.json(
        {
          error: authResult?.error || 'Invalid credentials',
          attempts_remaining: authResult?.attempts_remaining,
          locked_until: authResult?.locked_until,
        },
        { status: 401 }
      );
    }

    // Return success with session token
    return NextResponse.json({
      success: true,
      session_token: authResult.session_token,
      admin: authResult.admin,
      expires_at: authResult.expires_at,
      message: 'Login successful',
    });
  } catch (error: any) {
    console.error('Admin login API error:', error);
    return NextResponse.json({ error: 'Login failed', details: error.message }, { status: 500 });
  }
}

