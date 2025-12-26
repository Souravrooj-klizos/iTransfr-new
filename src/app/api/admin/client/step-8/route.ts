import { validateAdminRequest } from '@/lib/auth-utils';
import { createClient } from '@/lib/supabase/server';
import { step8Schema } from '@/lib/validations/client-steps';
import { submitOnboarding } from '@/services/onboarding-service';
import { NextRequest, NextResponse } from 'next/server';

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
    const validationResult = step8Schema.safeParse(stepData);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // 3. Submit via Service
    const result = await submitOnboarding(
      sessionId,
      data,
      auth.admin.id,
      'admin',
      {
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      }
    );

    return NextResponse.json(result);

  } catch (error) {
    console.error('Step 8 API error:', error);
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

    // Check if all steps are completed
    const requiredSteps = [1, 2, 3, 4, 5, 6, 7];
    const completedSteps = session.session_data?.completed_steps || [];
    const allStepsCompleted = requiredSteps.every(step => completedSteps.includes(step));

    return NextResponse.json({
      success: true,
      sessionId,
      step: session.current_step,
      completedSteps: session.completed_steps,
      canSubmit: allStepsCompleted,
      data: {
        confirmAccuracy: false,
        agreeToTerms: false,
      },
      summary: allStepsCompleted
        ? {
            accountType: session.session_data?.accountType,
            businessName: session.session_data?.businessInfo?.businessName,
            ownerCount: session.session_data?.owners?.length || 0,
            documentCount: session.session_data?.documents?.length || 0,
            hasPEPRisks: session.session_data?.pepScreening
              ? session.session_data.pepScreening.isPEPSeniorOfficial ||
                session.session_data.pepScreening.isPEPPoliticalParty ||
                session.session_data.pepScreening.isPEPFamilyMember ||
                session.session_data.pepScreening.isPEPCloseAssociate
              : false,
          }
        : null,
    });
  } catch (error) {
    console.error('Step 8 GET API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
