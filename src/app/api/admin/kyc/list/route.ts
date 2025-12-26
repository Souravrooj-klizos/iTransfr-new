import { supabaseAdmin } from '@/lib/supabaseClient';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Get user from cookies (session-based auth)
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
      console.log('[KYC List] No user found in session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[KYC List] User:', user.id, user.email);

    // Check if user is admin (exists in admin_profiles)
    const { data: adminProfile, error: adminError } = await supabaseAdmin
      .from('admin_profiles')
      .select('id, role')
      .eq('id', user.id)
      .single();

    console.log('[KYC List] Admin check:', { adminProfile, adminError });

    if (!adminProfile) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Get all KYC records with client info
    const { data: kycRecords, error } = await supabaseAdmin
      .from('kyc_records')
      .select(
        `
                *,
                client_profiles:userId (
                    id,
                    first_name,
                    last_name,
                    company_name,
                    country
                ),
                kyc_documents (*)
            `
      )
      .order('createdAt', { ascending: false });

    if (error) throw error;

    console.log('[KYC List] Found records:', kycRecords?.length);

    return NextResponse.json({
      success: true,
      data: kycRecords,
      pagination: {
        page: 1,
        limit: 100, // fetching all for now as pagination not fully implemented in DB query
        total: kycRecords?.length || 0,
        totalPages: 1,
      },
    });
  } catch (error: any) {
    console.error('Error fetching KYC records:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch KYC records' },
      { status: 500 }
    );
  }
}
