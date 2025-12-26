import { validateAdminRequest } from '@/lib/auth-utils';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // 1. Validate Admin Auth
    const auth = await validateAdminRequest(request);
    if (!auth.isValid) {
      return auth.errorResponse!;
    }

    const sessionId = request.nextUrl.searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    const supabase = await createClient();

    // 2. Get session progress
    const { data: session, error: fetchError } = await supabase
      .from('onboarding_sessions')
      .select('current_step, completed_steps, is_active')
      .eq('id', sessionId)
      .single();

    if (fetchError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const totalSteps = 8;
    const completedCount = session.completed_steps?.length || 0;
    const progressPercentage = Math.round((completedCount / totalSteps) * 100);

    return NextResponse.json({
      success: true,
      sessionId,
      currentStep: session.current_step,
      completedSteps: session.completed_steps || [],
      totalSteps,
      progressPercentage,
      isActive: session.is_active,
    });
  } catch (error) {
    console.error('Progress API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
