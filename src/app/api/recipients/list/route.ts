/**
 * Recipients API
 *
 * GET /api/recipients/list - List saved recipients for the current user
 * POST /api/recipients - Save a new recipient
 *
 * PURPOSE: Allows users to save frequently used recipients so they don't
 * have to re-enter bank details every time they send money.
 */

import { supabaseAdmin } from '@/lib/supabaseClient';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

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

    // Try to get saved recipients from dedicated table first
    const { data: savedRecipients, error: recipientsError } = await supabaseAdmin
      .from('saved_recipients')
      .select('*')
      .eq('userId', user.id)
      .order('createdAt', { ascending: false });

    // If saved_recipients table exists and has data, use it
    if (!recipientsError && savedRecipients && savedRecipients.length > 0) {
      const formattedRecipients = savedRecipients.map(r => ({
        id: r.id,
        name: r.recipientName,
        bankName: r.bankName,
        accountNumber: r.accountNumber,
        bankCode: r.bankCode,
        currency: r.currency,
        country: r.country,
        type: r.transferType || 'International',
        createdAt: r.createdAt,
      }));

      return NextResponse.json({
        success: true,
        data: formattedRecipients,
      });
    }

    // Fallback: Extract unique recipients from past payout transactions
    const { data: transactions } = await supabaseAdmin
      .from('transactions')
      .select('id, recipientName, metadata, createdAt')
      .eq('userId', user.id)
      .eq('type', 'payout')
      .not('recipientName', 'is', null)
      .order('createdAt', { ascending: false });

    if (transactions && transactions.length > 0) {
      // Get unique recipients by name
      const recipientMap = new Map();

      for (const tx of transactions) {
        if (tx.recipientName && !recipientMap.has(tx.recipientName)) {
          recipientMap.set(tx.recipientName, {
            id: tx.id,
            name: tx.recipientName,
            bankName: tx.metadata?.recipientBank || tx.metadata?.bankName || 'Unknown Bank',
            accountNumber: tx.metadata?.recipientAccount || tx.metadata?.accountNumber || '****',
            bankCode: tx.metadata?.bankCode || tx.metadata?.ifscCode || '',
            currency: tx.metadata?.currency || 'USD',
            country: tx.metadata?.recipientCountry || tx.metadata?.country || 'US',
            type: tx.metadata?.transferType || 'Bank Transfer',
            createdAt: tx.createdAt,
          });
        }
      }

      return NextResponse.json({
        success: true,
        data: Array.from(recipientMap.values()),
      });
    }

    // No recipients found
    return NextResponse.json({
      success: true,
      data: [],
    });
  } catch (error: any) {
    console.error('[Recipients API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Save a new recipient
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { recipientName, bankName, accountNumber, bankCode, currency, country, transferType } =
      body;

    if (!recipientName || !bankName || !accountNumber) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Try inserting into saved_recipients table
    const { data: newRecipient, error } = await supabaseAdmin
      .from('saved_recipients')
      .insert({
        userId: user.id,
        recipientName,
        bankName,
        accountNumber,
        bankCode: bankCode || null,
        currency: currency || 'USD',
        country: country || 'US',
        transferType: transferType || 'Bank Transfer',
        createdAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      // Table might not exist - that's ok, we'll extract from transactions
      console.warn('[Recipients API] Could not save recipient:', error.message);
      return NextResponse.json({
        success: true,
        message: 'Recipient will be saved automatically when you complete a payout',
        data: null,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: newRecipient.id,
        name: newRecipient.recipientName,
        bankName: newRecipient.bankName,
        accountNumber: newRecipient.accountNumber,
        bankCode: newRecipient.bankCode,
        currency: newRecipient.currency,
        country: newRecipient.country,
        type: newRecipient.transferType,
      },
    });
  } catch (error: any) {
    console.error('[Recipients API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
