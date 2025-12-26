import { supabaseAdmin } from '@/lib/supabaseClient';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // 1. Get total clients count
    const { count: totalClients } = await supabaseAdmin
      .from('client_profiles')
      .select('*', { count: 'exact', head: true });

    // 2. Get KYC stats (all records to count statuses)
    const { data: kycStats } = await supabaseAdmin.from('kyc_records').select('status');

    // 3. Get Transaction stats (all records to count statuses)
    const { data: txStats } = await supabaseAdmin.from('transactions').select('status');

    // Calculate counts
    const pendingKYC = kycStats?.filter(k => k.status === 'pending').length || 0;
    const approvedKYC = kycStats?.filter(k => k.status === 'approved').length || 0;
    const rejectedKYC = kycStats?.filter(k => k.status === 'rejected').length || 0;

    const pendingTransactions =
      txStats?.filter(t => t.status === 'PENDING' || t.status === 'DEPOSIT_REQUESTED').length || 0;
    const completedTransactions =
      txStats?.filter(t => t.status === 'COMPLETED' || t.status === 'PAYOUT_COMPLETED').length || 0;

    // 4. Get Recent KYC (for list)
    const { data: recentKYC } = await supabaseAdmin
      .from('kyc_records')
      .select('id, "userId", status, "createdAt"')
      .order('"createdAt"', { ascending: false })
      .limit(5);

    // Get client info separately
    const clientIds = recentKYC?.map(k => k.userId) || [];
    const { data: clients } = await supabaseAdmin
      .from('client_profiles')
      .select('id, first_name, last_name, company_name')
      .in('id', clientIds);

    // Combine the data
    const recentKYCWithClients = recentKYC?.map(kyc => ({
      ...kyc,
      client_profiles: clients?.find(c => c.id === kyc.userId) || null,
    }));

    // 5. Get Recent Transactions (for activity feed)
    const { data: recentTxs } = await supabaseAdmin
      .from('transactions')
      .select('id, type, status, amount, currency, "createdAt", "userId"')
      .order('"createdAt"', { ascending: false })
      .limit(5);

    // Get client info for transactions
    const txClientIds = recentTxs?.map(t => t.userId) || [];
    const { data: txClients } = await supabaseAdmin
      .from('client_profiles')
      .select('id, first_name, company_name')
      .in('id', txClientIds);

    // Combine transaction data with client info
    const recentTxsWithClients = recentTxs?.map(tx => ({
      ...tx,
      client_profiles: txClients?.find(c => c.id === tx.userId) || null,
    }));

    // 6. Build Activity Feed
    const activities = [
      ...(recentKYCWithClients?.map(k => ({
        id: k.id,
        type: 'kyc',
        title: `KYC ${k.status.charAt(0).toUpperCase() + k.status.slice(1)}`,
        subtitle: k.client_profiles?.company_name || 'New Client',
        time: k.createdAt,
        status: k.status,
        color:
          k.status === 'approved'
            ? 'text-green-600'
            : k.status === 'rejected'
              ? 'text-red-600'
              : 'text-blue-600',
        bg:
          k.status === 'approved'
            ? 'bg-green-100'
            : k.status === 'rejected'
              ? 'bg-red-100'
              : 'bg-blue-100',
        iconType: 'kyc',
      })) || []),
      ...(recentTxsWithClients?.map(t => ({
        id: t.id,
        type: 'transaction',
        title: `${t.type.toUpperCase()} ${t.amount} ${t.currency}`,
        subtitle: t.client_profiles?.company_name || 'Client',
        time: t.createdAt,
        status: t.status,
        color: 'text-blue-600', // Default color
        bg: 'bg-blue-100',
        iconType: t.type,
      })) || []),
    ]
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 10);

    // 7. Build Alerts
    const alerts = [];
    if (pendingKYC > 0) {
      alerts.push({
        type: 'kyc_pending',
        text: `KYC Pending (${pendingKYC})`,
        action: 'Review KYC',
        link: '/admin/kyc-review',
        priority: 'high',
      });
    }
    if (pendingTransactions > 0) {
      alerts.push({
        type: 'tx_pending',
        text: `Transactions Waiting (${pendingTransactions})`,
        action: 'View All',
        link: '/admin/transactions',
        priority: 'medium',
      });
    }
    // Add a generic 'All Clear' or simulated alerts if empty to avoid empty state looking broken during demo
    if (alerts.length === 0) {
      alerts.push({
        type: 'info',
        text: 'System All Clear',
        action: 'View Logs',
        link: '/admin/logs',
        priority: 'low',
      });
    }

    return NextResponse.json({
      stats: {
        totalClients: totalClients || 0,
        pendingKYC,
        approvedKYC,
        rejectedKYC,
        pendingTransactions,
        completedTransactions,
      },
      recentKYC: recentKYCWithClients || [],
      activities,
      alerts,
    });
  } catch (error: any) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
