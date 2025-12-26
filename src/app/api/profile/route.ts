import { supabaseAdmin } from '@/lib/supabaseClient';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
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

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Fetch profile
    const { data: profile, error } = await supabaseAdmin
      .from('client_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error || !profile) {
      // fallback if profile missing (shouldn't happen for valid users)
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Map to UserProfile interface expected by frontend
    const userProfile = {
      fullName: `${profile.first_name} ${profile.last_name}`,
      email: user.email, // Email often in auth.users, sometimes in profile
      companyName: profile.company_name,
      mobileNumber: profile.contact_number || '', // Assuming column name
      address: profile.address || '',
      timezone: profile.timezone || 'UTC',
      language: profile.language || 'English',
      role: 'Admin', // Default or fetch from roles table
      permissions: ['View', 'Edit'], // Mock permissions for now
    };

    return NextResponse.json({
      success: true,
      data: userProfile,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  // Implement update logic if needed
  return NextResponse.json({ success: true, message: 'Update not implemented yet' });
}
