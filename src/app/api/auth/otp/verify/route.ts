import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    const { email, otp } = await request.json();

    console.log(`[OTP Verify] Attempting to verify OTP for: ${email}`);

    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and OTP are required' }, { status: 400 });
    }

    // Check Database for OTP
    if (supabaseAdmin!) {
      console.log('[OTP Verify] Checking database...');
      const { data, error } = await supabaseAdmin
        .from('email_verifications')
        .select('*')
        .eq('email', email)
        .eq('otp', otp)
        .single();

      console.log('[OTP Verify] Database query result:', { data, error });

      if (error || !data) {
        console.log('[OTP Verify] ❌ No matching OTP found in DB');
        return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
      }

      // Check expiration
      const expiresAt = new Date(data.expiresAt);
      const now = new Date();

      if (now > expiresAt) {
        console.log('[OTP Verify] OTP expired (DB)');
        // Delete expired OTP
        await supabaseAdmin.from('email_verifications').delete().eq('email', email);

        return NextResponse.json({ error: 'OTP has expired' }, { status: 400 });
      }

      // OTP is valid - delete it
      console.log('[OTP Verify] ✅ OTP verified successfully');
      await supabaseAdmin.from('email_verifications').delete().eq('email', email).eq('otp', otp);

      return NextResponse.json({
        success: true,
        message: 'OTP verified successfully',
      });
    }

    // If no admin client, return error
    return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
  } catch (error) {
    console.error('[OTP Verify] Error:', error);
    return NextResponse.json({ error: 'Failed to verify OTP' }, { status: 500 });
  }
}
