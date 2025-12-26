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

    // Validate the session
    const { data: validationResult, error } = await supabaseAdmin.rpc('validate_admin_session', {
      p_session_token: session_token
    });

    if (error) {
      console.error('Session validation error:', error);
      return NextResponse.json(
        { error: 'Session validation failed', details: error.message },
        { status: 500 }
      );
    }

    if (!validationResult?.valid) {
      return NextResponse.json(
        {
          valid: false,
          error: validationResult?.error || 'Invalid session'
        },
        { status: 401 }
      );
    }

    // Return valid session with admin data
    return NextResponse.json({
      valid: true,
      admin: validationResult.admin
    });

  } catch (error: any) {
    console.error('Session validation API error:', error);
    return NextResponse.json(
      { error: 'Session validation failed', details: error.message },
      { status: 500 }
    );
  }
}

