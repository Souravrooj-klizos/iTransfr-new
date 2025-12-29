import { supabaseAdmin } from '@/lib/supabaseClient';
import { sendOTPEmail } from '@/services/email';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Generate 5-digit OTP
    const otp = Math.floor(10000 + Math.random() * 90000).toString();

    // Set expiration to 10 minutes from now
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    console.log(`[OTP] Generated for ${email}: ${otp}`);

    // Check if service role key is configured
    console.log(`[OTP] supabaseAdmin available: ${supabaseAdmin !== null}`);

    // Store in Database
    if (supabaseAdmin) {
      try {
        // First, delete any existing OTPs for this email
        await supabaseAdmin.from('email_verifications').delete().eq('email', email);

        // Insert new OTP
        const { error: dbError } = await supabaseAdmin.from('email_verifications').insert({
          email,
          otp,
          expiresAt: expiresAt.toISOString(),
        });

        if (dbError) {
          console.error('[OTP] Database error:', dbError);
        } else {
          console.log('[OTP] ✅ Successfully stored in database (via Admin client)');
        }
      } catch (dbErr) {
        console.error('[OTP] Database exception:', dbErr);
      }
    } else {
      console.error(
        '[OTP] ❌ supabaseAdmin is NULL - Check SUPABASE_SERVICE_ROLE_KEY in .env.local'
      );
    }

    // Send OTP via email using the proper template
    try {
      const result = await sendOTPEmail(email, otp);
      if (result.success) {
        console.log('[OTP] Email sent successfully via template');
      } else {
        console.error('[OTP] Email send error:', result.error);
      }
    } catch (emailError) {
      console.error('[OTP] Email send error:', emailError);
    }

    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully',
    });
  } catch (error) {
    console.error('[OTP] Error in OTP send:', error);
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 });
  }
}
