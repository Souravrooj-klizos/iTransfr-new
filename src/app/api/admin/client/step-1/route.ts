import { validateAdminRequest } from '@/lib/auth-utils';
import { createClient } from '@/lib/supabase/server'; // Kept for GET method if needed
import { processStep1 } from '@/services/onboarding-service';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schema for Step 1: Account Type Selection
const step1Schema = z.object({
  accountType: z.enum(['personal', 'business', 'fintech'], {
    errorMap: () => ({ message: 'Account type must be personal, business, or fintech' }),
  }),
  sessionId: z.string().optional(), // For continuing existing session
});

export async function POST(request: NextRequest) {
  try {
    // 1. Validate Admin Auth (Reusable Helper)
    const auth = await validateAdminRequest(request);
    if (!auth.isValid) {
      return auth.errorResponse!;
    }

    const body = await request.json();

    // 2. Validate Input
    const validationResult = step1Schema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { accountType, sessionId } = validationResult.data;

    // 3. Process Logic (Shared Service)
    // Pass 'admin' as creator role and the admin's ID
    const result = await processStep1(accountType, sessionId, auth.admin.id, 'admin');

    return NextResponse.json(result);

  } catch (error) {
    console.error('Step 1 API error:', error);
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

    // Validate admin session
    const sessionToken = request.cookies.get('admin_session_token')?.value;
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
      data: session.session_data,
    });
  } catch (error) {
    console.error('Step 1 GET API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
