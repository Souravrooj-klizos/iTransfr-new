import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    const { email, password, firstName, lastName, companyName, mobile, countryCode } =
      await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: `${firstName} ${lastName}`,
      },
    });

    if (authError) {
      console.error('Signup error:', authError);
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    // Create client profile
    if (authData.user) {
      const { error: profileError } = await supabaseAdmin.from('client_profiles').insert({
        id: authData.user.id,
        first_name: firstName,
        last_name: lastName,
        company_name: companyName || null,
        mobile: mobile || null,
        country_code: countryCode || null,
        status: 'pending_kyc',
      });

      if (profileError) {
        console.error('Profile creation error:', profileError);
      } else {
        console.log('✅ Client profile created successfully');
      }
    }

    return NextResponse.json({
      success: true,
      user: authData.user,
    });
  } catch (error) {
    console.error('Error in signup:', error);
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
  }
}
