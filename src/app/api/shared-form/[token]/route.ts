import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: { token: string } }) {
  try {
    const supabase = await createClient();
    const shareToken = params.token;

    if (!shareToken) {
      return NextResponse.json({ error: 'Share token required' }, { status: 400 });
    }

    // Find the shared session
    const { data: sharedSession, error: findError } = await supabase
      .from('onboarding_sessions')
      .select('session_data, id, created_at')
      .eq('session_data->>shareToken', shareToken)
      .eq('session_data->>type', 'shared_form')
      .single();

    if (findError || !sharedSession) {
      return NextResponse.json({ error: 'Invalid or expired share link' }, { status: 404 });
    }

    // Check if expired (48 hours)
    const createdAt = new Date(sharedSession.created_at);
    const now = new Date();
    const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

    if (hoursDiff > 48) {
      // Clean up expired session
      await supabase.from('onboarding_sessions').delete().eq('id', sharedSession.id);

      return NextResponse.json({ error: 'Share link has expired' }, { status: 410 });
    }

    const { ownerIndex, ownerData, recipientEmail, recipientName } = sharedSession.session_data;

    return NextResponse.json({
      success: true,
      ownerIndex,
      ownerData,
      recipientEmail,
      recipientName,
      expiresIn: Math.max(0, 48 - hoursDiff),
      message: 'Share link is valid',
    });
  } catch (error) {
    console.error('Shared form GET error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: { params: { token: string } }) {
  try {
    const supabase = await createClient();
    const shareToken = params.token;
    const body = await request.json();

    if (!shareToken) {
      return NextResponse.json({ error: 'Share token required' }, { status: 400 });
    }

    const { updatedOwnerData } = body;

    if (!updatedOwnerData) {
      return NextResponse.json({ error: 'Owner data required' }, { status: 400 });
    }

    // Find the shared session
    const { data: sharedSession, error: findError } = await supabase
      .from('onboarding_sessions')
      .select('session_data, id, created_at')
      .eq('session_data->>shareToken', shareToken)
      .eq('session_data->>type', 'shared_form')
      .single();

    if (findError || !sharedSession) {
      return NextResponse.json({ error: 'Invalid or expired share link' }, { status: 404 });
    }

    // Check if expired (48 hours)
    const createdAt = new Date(sharedSession.created_at);
    const now = new Date();
    const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

    if (hoursDiff > 48) {
      // Clean up expired session
      await supabase.from('onboarding_sessions').delete().eq('id', sharedSession.id);

      return NextResponse.json({ error: 'Share link has expired' }, { status: 410 });
    }

    const { parentSessionId, ownerIndex } = sharedSession.session_data;

    // Get parent session
    const { data: parentSession, error: parentError } = await supabase
      .from('onboarding_sessions')
      .select('session_data')
      .eq('id', parentSessionId)
      .single();

    if (parentError || !parentSession) {
      return NextResponse.json({ error: 'Parent session not found' }, { status: 404 });
    }

    // Update the owner data in parent session
    const owners = parentSession.session_data?.owners || [];
    if (ownerIndex >= owners.length) {
      return NextResponse.json({ error: 'Invalid owner index' }, { status: 400 });
    }

    owners[ownerIndex] = { ...owners[ownerIndex], ...updatedOwnerData };

    const { error: updateError } = await supabase
      .from('onboarding_sessions')
      .update({
        session_data: {
          ...parentSession.session_data,
          owners,
        },
        last_updated: new Date().toISOString(),
      })
      .eq('id', parentSessionId);

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update owner data', details: updateError.message },
        { status: 500 }
      );
    }

    // Log the shared form submission
    await supabase.from('audit_log').insert({
      action: 'shared_form_submitted',
      entityType: 'onboarding_session',
      entityId: parentSessionId,
      newValues: {
        shareToken,
        ownerIndex,
        submittedBy: 'external_user',
      },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      userAgent: request.headers.get('user-agent'),
      createdAt: new Date().toISOString(),
    });

    // Clean up shared session
    await supabase.from('onboarding_sessions').delete().eq('id', sharedSession.id);

    return NextResponse.json({
      success: true,
      message: 'Owner information updated successfully. Thank you for completing the form.',
    });
  } catch (error) {
    console.error('Shared form POST error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
