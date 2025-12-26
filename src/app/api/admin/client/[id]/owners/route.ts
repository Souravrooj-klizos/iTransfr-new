import { validateAdminRequest } from '@/lib/auth-utils';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/admin/client/[id]/owners
 * Get all representatives/owners for a client
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await validateAdminRequest(request);
    if (!auth.isValid) {
      return auth.errorResponse!;
    }

    const { id: clientId } = await params;

    if (!clientId) {
      return NextResponse.json(
        { success: false, error: 'Client ID is required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Get all owners for this client
    const { data: owners, error } = await supabase
      .from('beneficial_owners')
      .select('*')
      .eq('clientId', clientId)
      // Fallback if schema uses clientId
      // .eq('clientId', clientId)
      .order('ownership_percentage', { ascending: false });

    if (error) {
      console.error('Error fetching representatives:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch representatives' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      owners: owners || [],
      count: owners?.length || 0,
    });
  } catch (error: any) {
    console.error('[Client Owners API] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
