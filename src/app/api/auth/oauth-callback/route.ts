import { supabaseAdmin } from '@/lib/supabaseClient';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';
  const flow = searchParams.get('flow') ?? 'signup'; // 'login' or 'signup'

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.delete({ name, ...options });
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data?.user) {
      if (!supabaseAdmin) {
        console.error('Supabase admin client not available');
        return NextResponse.redirect(`${origin}/login?error=Configuration Error`);
      }

      // Check if user record exists
      const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('supabaseUserId', data.user.id)
        .single();

      if (flow === 'login') {
        if (!existingUser) {
          // LOGIN FLOW: User must exist.
          // If not pending/existing, this is an unauthorized "signup via login".
          // Delete the OAuth-created user to keep state clean.
          await supabaseAdmin.auth.admin.deleteUser(data.user.id);
          await supabase.auth.signOut();

          return NextResponse.redirect(
            `${origin}/login?error=${encodeURIComponent('Account not found. Please sign up.')}`
          );
        }
        // If user exists, allow.
      } else {
        // SIGNUP FLOW (or default):
        // If user doesn't exist, create them.
        if (!existingUser) {
          const { error: createError } = await supabaseAdmin.from('users').insert({
            supabaseUserId: data.user.id,
            email: data.user.email,
            fullName:
              data.user.user_metadata?.full_name || data.user.user_metadata?.name || 'OAuth User',
            role: 'client',
            status: 'pending_kyc',
          });

          if (createError) {
            console.error('OAuth user creation error:', createError);
            // If creation fails, maybe we should also fail the login?
            // For now logging it and letting them in (they might have issues without profile)
          }
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=Authentication Failed`);
}
