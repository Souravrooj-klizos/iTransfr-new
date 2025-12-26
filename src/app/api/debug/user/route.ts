import { supabaseAdmin } from '@/lib/supabaseClient';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/debug/user?id=xxx
 *
 * Debug endpoint to check user data
 * ⚠️ DEVELOPMENT ONLY
 */
export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');

    if (!userId) {
      // List all client profiles
      const { data: profiles } = await supabaseAdmin.from('client_profiles').select('*').limit(10);

      return NextResponse.json({
        message: 'No userId provided. Here are existing profiles:',
        profiles: profiles || [],
        hint: 'Use one of these IDs in your request',
      });
    }

    // Check client_profiles
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('client_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    // Check kyc_records
    const { data: kyc } = await supabaseAdmin
      .from('kyc_records')
      .select('*')
      .eq('userId', userId)
      .single();

    // Check auth.users (if accessible)
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);

    return NextResponse.json({
      userId,
      found: {
        inClientProfiles: !!profile,
        inKycRecords: !!kyc,
        inAuthUsers: !!authUser?.user,
      },
      clientProfile: profile || null,
      kycRecord: kyc || null,
      authUser: authUser?.user
        ? {
            id: authUser.user.id,
            email: authUser.user.email,
            created_at: authUser.user.created_at,
          }
        : null,
      error: profileError?.message,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
