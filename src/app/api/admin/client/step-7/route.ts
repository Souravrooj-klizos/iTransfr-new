import { createClient } from '@/lib/supabase/server';
import { validateRequiredDocuments } from '@/lib/validations/client';
import { step7Schema } from '@/lib/validations/client-steps';
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

    const { sessionId, ...stepData } = await request.json();

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    // 2. Validate input
    const validationResult = step7Schema.safeParse(stepData);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // 3. Document Validation (Requires Session for AccountType)
    // We fetch session here just for validation.
    const supabase = await createClient();
    const { data: existingSession, error: fetchError } = await supabase
      .from('onboarding_sessions')
      .select('session_data')
      .eq('id', sessionId)
      .single();

    if (fetchError || !existingSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const accountType = existingSession.session_data?.accountType || 'business';

    if (!validateRequiredDocuments(accountType, data.documents)) {
      return NextResponse.json(
        { error: `Missing required documents for ${accountType} account` },
        { status: 400 }
      );
    }

    // 4. Save via Service
    const result = await processGenericStep(sessionId, 7, { documents: data.documents });

    // 5. Trigger Document Verification (Non-blocking)
    let verificationStatus = null;
    try {
      // Check if country supports document verification
      const country = existingSession.session_data?.businessInfo?.country;
      const supportedCountries = ['US', 'AE', 'HK', 'BR', 'CA', 'SA'];

      if (country && supportedCountries.includes(country)) {
        // Trigger verification in background (fire and forget)
        fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/admin/client/verify-documents`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            cookie: request.headers.get('cookie') || '',
          },
          body: JSON.stringify({ sessionId }),
        }).catch(err => {
          console.warn('Background verification trigger failed:', err);
        });

        verificationStatus = {
          initiated: true,
          message: 'Document verification started',
        };
      } else {
        verificationStatus = {
          initiated: false,
          message: 'Document verification not required for this country',
        };
      }
    } catch (verificationError) {
      console.warn('Document verification trigger error:', verificationError);
      verificationStatus = {
        initiated: false,
        error: 'Verification could not be initiated',
      };
    }

    // 6. Calculate Document Summary
    const documentSummary = {
        total: data.documents.length,
        byType: data.documents.reduce((acc: Record<string, number>, doc: any) => {
          acc[doc.type] = (acc[doc.type] || 0) + 1;
          return acc;
        }, {}),
    };

    return NextResponse.json({
      ...result,
      message: 'Documents uploaded successfully',
      documentSummary,
      verification: verificationStatus,
    });

  } catch (error) {
    console.error('Step 7 API error:', error);
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
      data: session.session_data?.documents || [],
    });
  } catch (error) {
    console.error('Step 7 GET API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
