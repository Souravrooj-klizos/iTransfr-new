import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export interface AdminAuthResult {
  isValid: boolean;
  admin?: any;
  errorResponse?: NextResponse;
}

/**
 * Validates the admin session from Cookie or Authorization header.
 * Returns either the admin data or an error response (NextResponse).
 */
export async function validateAdminRequest(request: NextRequest): Promise<AdminAuthResult> {
  const supabase = await createClient();

  // 1. Try cookie first
  let sessionToken = request.cookies.get('admin_session_token')?.value;

  // 2. Fallback to Authorization header
  if (!sessionToken) {
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      sessionToken = authHeader.substring(7);
    }
  }

  if (!sessionToken) {
    return {
      isValid: false,
      errorResponse: NextResponse.json({ error: 'Admin authentication required' }, { status: 401 }),
    };
  }

  // 3. RPC Validation
  const { data: adminSessionData, error: sessionError } = await supabase.rpc(
    'validate_admin_session',
    { p_session_token: sessionToken }
  );

  if (sessionError || !adminSessionData?.valid) {
    return {
      isValid: false,
      errorResponse: NextResponse.json({ error: 'Invalid admin session' }, { status: 401 }),
    };
  }

  return { isValid: true, admin: adminSessionData.admin };
}
