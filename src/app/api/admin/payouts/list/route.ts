import { supabaseAdmin } from '@/lib/supabaseClient';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const { data: payouts, error } = await supabaseAdmin
      .from('payout_requests')
      .select(
        `
        *,
        transactions:transactionId (
          userId,
          referenceNumber,
          client_profiles:userId (
            first_name,
            last_name,
            company_name
          )
        )
      `
      )
      .order('createdAt', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ data: payouts || [] });
  } catch (error: any) {
    console.error('Error fetching payouts:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch payouts' },
      { status: 500 }
    );
  }
}
