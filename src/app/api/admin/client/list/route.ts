import { validateAdminRequest } from '@/lib/auth-utils';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // 1. Validate Admin
    const auth = await validateAdminRequest(request);
    if (!auth.isValid) {
      return auth.errorResponse!;
    }

    // 2. Parse Query Parameters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    const type = searchParams.get('type') || 'all';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const offset = (page - 1) * limit;

    const supabase = createAdminClient();

    // 3. Fetch Data (Bypassing RLS via Admin Client)
    const [sessionsResult, profilesResult] = await Promise.all([
      supabase
        .from('onboarding_sessions')
        .select('*')
        .eq('is_active', true)
        .order('last_updated', { ascending: false }),
      supabase
        .from('client_profiles')
        .select('*, kyc_records(status), beneficial_owners(count)')
        .order('"createdAt"', { ascending: false }),
    ]);

    if (sessionsResult.error) {
      console.error('Sessions fetch error:', sessionsResult.error);
    }
    if (profilesResult.error) {
      console.error('Profiles fetch error:', profilesResult.error);
    }

    const sessions = sessionsResult.data || [];
    const profiles = profilesResult.data || [];

    // 4. Map Data
    const mappedSessions = sessions.map((session: any) => {
      const data = session.session_data || {};
      const owners = data.owners || [];
      const primaryOwner = owners.find((o: any) => o.type === 'person') || owners[0] || {};
      const business = data.businessInfo || {};

      return {
        id: session.id,
        first_name: primaryOwner.firstName || 'New',
        last_name: primaryOwner.lastName || 'Client',
        company_name: business.businessName || 'Draft Application',
        email: primaryOwner.email || 'Pending...',
        mobile: primaryOwner.phone || '',
        country: business.country || data.accountType || '',
        city: business.address?.city || '',
        status: 'onboarding',
        account_type: data.accountType || null,
        onboarding_step: session.current_step || 1,
        onboarding_completed: false,
        createdAt: session.started_at || session.last_updated,
        kyc_status: 'not_started',
        owner_count: owners.length,
      };
    });

    const mappedProfiles = profiles.map((client: any) => ({
      ...client,
      status: client.status || 'pending_kyc',
      onboarding_step: 8,
      onboarding_completed: true,
      kyc_status: client.kyc_records?.[0]?.status || 'not_started',
      owner_count: client.beneficial_owners?.[0]?.count || 0,
    }));

    // 5. Merge and Apply Filters
    let allClients = [...mappedSessions, ...mappedProfiles];

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      allClients = allClients.filter(
        client =>
          client.first_name?.toLowerCase().includes(searchLower) ||
          client.last_name?.toLowerCase().includes(searchLower) ||
          client.company_name?.toLowerCase().includes(searchLower) ||
          client.email?.toLowerCase().includes(searchLower) ||
          client.id?.toLowerCase().includes(searchLower)
      );
    }

    // Apply status filter
    if (status !== 'all') {
      if (status === 'onboarding') {
        allClients = allClients.filter(client => !client.onboarding_completed);
      } else if (status === 'active') {
        allClients = allClients.filter(client => client.status === 'active');
      } else if (status === 'pending_kyc') {
        allClients = allClients.filter(client => client.status === 'pending_kyc');
      } else if (status === 'suspended') {
        allClients = allClients.filter(client => client.status === 'suspended');
      }
    }

    // Apply type filter
    if (type !== 'all') {
      if (type === 'onboarding') {
        allClients = allClients.filter(client => !client.onboarding_completed);
      } else if (type === 'active') {
        allClients = allClients.filter(client => client.status === 'active');
      }
    }

    // 6. Sort by creation date (newest first)
    allClients.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // 7. Apply Pagination
    const total = allClients.length;
    const paginatedClients = allClients.slice(offset, offset + limit);
    const totalPages = Math.ceil(total / limit);

    // 8. Return Paginated Response
    return NextResponse.json({
      clients: paginatedClients,
      total,
      page,
      limit,
      totalPages,
    });
  } catch (error) {
    console.error('List clients error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
