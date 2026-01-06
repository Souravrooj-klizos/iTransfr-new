import { createClient } from '@/lib/supabase/server';
import { step6Schema } from '@/lib/validations/client-steps';
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
    const validationResult = step6Schema.safeParse(stepData);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // 3. Save via Service
    const result = await processGenericStep(sessionId, 6, { pepResponses: data.pepResponses });

    // 4. Calculate Risk Assessment (Controller specific logic)
    const pepResponses = data.pepResponses || {};
    const riskAssessment = {
        hasHighRisk: pepResponses['pep_government'] === true ||
                    pepResponses['pep_political'] === true ||
                    pepResponses['pep_family'] === true ||
                    pepResponses['pep_associate'] === true,
        requiresReview: pepResponses['pep_government'] === true ||
                       pepResponses['pep_political'] === true,
    };

    return NextResponse.json({
      ...result,
      message: 'PEP screening completed successfully',
      riskAssessment,
    });

  } catch (error) {
    console.error('Step 6 API error:', error);
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

    const { data: sessionData, error: sessionError } = await supabase.rpc(
      'validate_admin_session',
      { p_session_token: sessionToken }
    );

    if (sessionError || !sessionData?.valid) {
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
      data: session.session_data?.pepResponses || {},
    });
  } catch (error) {
    console.error('Step 6 GET API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
