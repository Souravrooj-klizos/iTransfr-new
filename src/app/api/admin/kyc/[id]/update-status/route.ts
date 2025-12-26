import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabaseClient';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, notes } = body;

    if (!['approved', 'rejected', 'under_review'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Get user from cookies
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: adminProfile } = await supabaseAdmin
      .from('admin_profiles')
      .select('id, role')
      .eq('id', user.id)
      .single();

    if (!adminProfile) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Update KYC record
    const { data, error } = await supabaseAdmin
      .from('kyc_records')
      .update({
        status,
        notes: notes || [],
        reviewedBy: user.id,
        reviewedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // If approved, update client profile status to 'active'
    if (status === 'approved') {
      await supabaseAdmin
        .from('client_profiles')
        .update({ status: 'active' })
        .eq('id', data.userId);

      console.log('✅ KYC approved - Client profile activated');
    }

    console.log(`✅ KYC status updated to: ${status}`);

    return NextResponse.json({ success: true, kycRecord: data });
  } catch (error: any) {
    console.error('Error updating KYC status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update KYC status' },
      { status: 500 }
    );
  }
}
