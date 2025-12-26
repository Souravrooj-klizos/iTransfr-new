import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Check if user exists in admin_profiles
    console.log('[Admin Verify] Checking userId:', userId);

    const { data: adminProfile, error } = await supabaseAdmin
      .from('admin_profiles')
      .select('id, role')
      .eq('id', userId)
      .single();

    console.log('[Admin Verify] Query result:', { adminProfile, error });

    if (error || !adminProfile) {
      console.log('[Admin Verify] ❌ User NOT found in admin_profiles');
      return NextResponse.json({
        isAdmin: false,
        message: 'User is not an administrator',
        debug: { error: error?.message, userId },
      });
    }

    console.log('[Admin Verify] ✅ User IS admin:', adminProfile.role);

    return NextResponse.json({
      isAdmin: true,
      role: adminProfile.role,
    });
  } catch (error: any) {
    console.error('Admin verify error:', error);
    return NextResponse.json({ error: error.message || 'Verification failed' }, { status: 500 });
  }
}
