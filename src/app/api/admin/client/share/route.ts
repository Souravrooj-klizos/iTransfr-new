import { sendEmail } from '@/lib/aws-ses';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';
import fs from 'fs';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { z } from 'zod';

// Share form request schema
const shareFormSchema = z.object({
  sessionId: z.string(),
  ownerIndex: z.number().min(0),
  recipientEmail: z.string().email(),
  recipientName: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

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

    // Validate input
    const validationResult = shareFormSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { sessionId, ownerIndex, recipientEmail, recipientName } = validationResult.data;

    // Get the main session data
    const { data: mainSession, error: fetchError } = await supabase
      .from('onboarding_sessions')
      .select('session_data')
      .eq('id', sessionId)
      .single();

    if (fetchError || !mainSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const owners = mainSession.session_data?.owners || [];
    if (!owners[ownerIndex]) {
      return NextResponse.json({ error: 'Owner not found' }, { status: 404 });
    }

    const owner = owners[ownerIndex];

    // Generate unique share token
    const shareToken = crypto.randomBytes(32).toString('hex');

    // Calculate expiry (48 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 48);

    // Create shared session
    const { data: sharedSession, error: shareError } = await supabase
      .from('onboarding_sessions')
      .insert({
        session_data: {
          type: 'shared_form',
          parentSessionId: sessionId,
          ownerIndex,
          ownerData: owner,
          recipientEmail,
          recipientName,
          shareToken,
          createdBy: 'admin',
          creatorId: sessionData.admin.id,
        },
        current_step: 5, // Shared forms start at owner details step
        completed_steps: [],
        is_active: true,
        started_at: new Date().toISOString(),
        last_updated: new Date().toISOString(),
        // Note: expires_at would need to be added to the table schema
      })
      .select('id')
      .single();

    if (shareError) {
      return NextResponse.json(
        { error: 'Failed to create shared form', details: shareError.message },
        { status: 500 }
      );
    }

    // Generate share URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const shareUrl = `${baseUrl}/ownership?token=${shareToken}`;

    // Read email template
    const templatePath = path.join(process.cwd(), 'public', 'iTransfr_Email_Template', 'ownership-information.html');
    let emailHtml = fs.readFileSync(templatePath, 'utf-8');

    // Replace placeholders
    emailHtml = emailHtml.replace('{{first_name}}', recipientName);
    emailHtml = emailHtml.replace('{{ login_link }}', shareUrl); // Template uses login_link key

    // Send email via SES
    try {
      await sendEmail(
        recipientEmail,
        'Action Required: Provide Ownership Information - iTransfr',
        emailHtml
      );
      console.log(`Share email sent to ${recipientEmail}`);
    } catch (emailError) {
      console.error('Failed to send share email:', emailError);
      // We log but don't fail the request, allowing the UI to still show the link
    }

    return NextResponse.json({
      success: true,
      shareToken,
      shareUrl,
      expiresAt: expiresAt.toISOString(),
      message: 'Form shared successfully',
      recipient: {
        email: recipientEmail,
        name: recipientName,
      },
    });
  } catch (error) {
    console.error('Share form API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Endpoint to handle shared form submissions
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { shareToken, updatedOwnerData } = body;

    if (!shareToken || !updatedOwnerData) {
      return NextResponse.json({ error: 'Share token and owner data required' }, { status: 400 });
    }

    // Find the shared session
    const { data: sharedSession, error: findError } = await supabase
      .from('onboarding_sessions')
      .select('session_data, id')
      .eq('session_data->>shareToken', shareToken)
      .eq('session_data->>type', 'shared_form')
      .single();

    if (findError || !sharedSession) {
      return NextResponse.json({ error: 'Invalid or expired share link' }, { status: 404 });
    }

    // Check if expired (48 hours)
    const createdAt = new Date(sharedSession.session_data.started_at);
    const now = new Date();
    const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

    if (hoursDiff > 48) {
      // Clean up expired session
      await supabase
        .from('onboarding_sessions')
        .delete()
        .eq('id', sharedSession.id);

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

    // Clean up shared session
    await supabase
      .from('onboarding_sessions')
      .delete()
      .eq('id', sharedSession.id);

    return NextResponse.json({
      success: true,
      message: 'Owner information updated successfully',
    });
  } catch (error) {
    console.error('Shared form submission error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
