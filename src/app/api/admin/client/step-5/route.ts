import { createClient } from '@/lib/supabase/server';
import { step5Schema } from '@/lib/validations/client-steps';
import { NextRequest, NextResponse } from 'next/server';

import { validateAdminRequest } from '@/lib/auth-utils';
import { processGenericStep } from '@/services/onboarding-service';
// ... imports ...

export async function POST(request: NextRequest) {
  try {
    // 1. Validate Admin Auth
    const auth = await validateAdminRequest(request);
    if (!auth.isValid) {
      return auth.errorResponse!;
    }

    const body = await request.json();
    const { sessionId, ...stepData } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    // 2. Validate input
    const validationResult = step5Schema.safeParse(stepData);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // 3. Save via Service (Note: data.owners is likely an array)
    const result = await processGenericStep(sessionId, 5, { owners: data.owners });

    return NextResponse.json({
      ...result,
      message: 'Owners and representatives saved successfully',
    });

  } catch (error) {
    console.error('Step 5 API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const sessionId = request.nextUrl.searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    // Validate admin session - try cookie first, then Authorization header
    let sessionToken = request.cookies.get('admin_session_token')?.value;

    // Fallback to Authorization header (for Postman/testing)
    if (!sessionToken) {
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        sessionToken = authHeader.substring(7); // Remove 'Bearer ' prefix
      }
    }

    if (!sessionToken) {
      return NextResponse.json({ error: 'Admin authentication required' }, { status: 401 });
    }

    const { data: adminSessionData, error: sessionError } = await supabase.rpc(
      'validate_admin_session',
      { p_session_token: sessionToken }
    );

    if (sessionError || !adminSessionData?.valid) {
      return NextResponse.json({ error: 'Invalid admin session' }, { status: 401 });
    }

    // Get session data
    const { data: session, error: fetchError } = await supabase
      .from('onboarding_sessions')
      .select('session_data, current_step, completed_steps')
      .eq('id', sessionId)
      .single();

    if (fetchError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      sessionId,
      step: session.current_step,
      completedSteps: session.completed_steps,
      data: session.session_data?.owners || [],
    });
  } catch (error) {
    console.error('Step 5 GET API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
