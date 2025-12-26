import { createSupabaseServerClient } from '@/lib/supabaseServer';

// Local type definitions instead of Prisma
export type UserRole = 'client' | 'admin' | 'super_admin';
export type UserStatus = 'pending_kyc' | 'active' | 'suspended';

export interface AppUser {
  id: string;
  supabaseUserId: string;
  email: string;
  fullName: string;
  companyName?: string | null;
  role: UserRole;
  status: UserStatus;
}

export async function getUserFromRequest(): Promise<AppUser | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user: supabaseUser },
      error,
    } = await supabase.auth.getUser();

    if (error || !supabaseUser) {
      return null;
    }

    // Get user profile from client_profiles table
    const { data: profile } = await supabase
      .from('client_profiles')
      .select('*')
      .eq('id', supabaseUser.id)
      .single();

    if (!profile) {
      // Return basic user info if no profile found
      return {
        id: supabaseUser.id,
        supabaseUserId: supabaseUser.id,
        email: supabaseUser.email || '',
        fullName: supabaseUser.user_metadata?.full_name || supabaseUser.email || 'User',
        companyName: supabaseUser.user_metadata?.company_name,
        role: 'client',
        status: 'pending_kyc',
      };
    }

    return {
      id: profile.id,
      supabaseUserId: supabaseUser.id,
      email: supabaseUser.email || '',
      fullName: `${profile.first_name} ${profile.last_name}`,
      companyName: profile.company_name,
      role: 'client',
      status: profile.status as UserStatus,
    };
  } catch (error) {
    console.error('Error getting user from request:', error);
    return null;
  }
}
