import { executeQuote, executeSwap, getConversionStatus } from '@/lib/integrations/bitso';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/integrations/bitso/execute
 *
 * Execute a conversion quote or full swap
 *
 * Option 1 - Execute existing quote:
 * {
 *   "quoteId": "zmAfx2rvNnv1Jn0Q",
 *   "transactionId": "optional-uuid" // Links to our transactions table
 * }
 *
 * Option 2 - Full swap (get quote + execute):
 * {
 *   "fromCurrency": "USD",
 *   "toCurrency": "MXN",
 *   "amount": 1000,
 *   "transactionId": "optional-uuid"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { quoteId, fromCurrency, toCurrency, amount, transactionId } = body;

    let conversion;
    let quote;

    if (quoteId) {
      // Execute existing quote
      console.log('[Bitso Execute] Executing quote:', quoteId);
      conversion = await executeQuote(quoteId);
    } else if (fromCurrency && toCurrency && amount) {
      // Full swap
      console.log('[Bitso Execute] Full swap:', { fromCurrency, toCurrency, amount });
      const result = await executeSwap(fromCurrency, toCurrency, amount);
      quote = result.quote;
      conversion = result.conversion;
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Either quoteId OR (fromCurrency, toCurrency, amount) is required',
        },
        { status: 400 }
      );
    }

    // Save to fx_orders table if transactionId provided
    if (transactionId && supabaseAdmin) {
      try {
        const { error: fxError } = await supabaseAdmin.from('fx_orders').insert({
          transactionId: transactionId,
          fromCurrency: conversion.from_currency.toUpperCase(),
          toCurrency: conversion.to_currency.toUpperCase(),
          fromAmount: conversion.from_amount,
          toAmount: conversion.to_amount,
          exchangeRate: conversion.rate,
          bitsoOrderId: conversion.id,
          bitsoQuoteId: quote?.id || quoteId,
          status: conversion.status,
          executedAt: new Date().toISOString(),
        });

        if (fxError) {
          console.error('[Bitso Execute] Failed to save fx_order:', fxError);
        } else {
          console.log('[Bitso Execute] FX order saved for transaction:', transactionId);
        }

        // Update transaction status
        await supabaseAdmin
          .from('transactions')
          .update({
            status: 'SWAP_COMPLETED',
            metadata: {
              bitsoConversionId: conversion.id,
              bitsoRate: conversion.rate,
              swapCompletedAt: new Date().toISOString(),
            },
          })
          .eq('id', transactionId);
      } catch (dbError) {
        console.error('[Bitso Execute] Database error:', dbError);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Conversion executed successfully',
      conversion: {
        id: conversion.id,
        status: conversion.status,
        fromCurrency: conversion.from_currency.toUpperCase(),
        toCurrency: conversion.to_currency.toUpperCase(),
        fromAmount: conversion.from_amount,
        toAmount: conversion.to_amount,
        rate: conversion.rate,
        executedAt: conversion.executed_at
          ? new Date(conversion.executed_at).toISOString()
          : new Date().toISOString(),
      },
      ...(quote && {
        quote: {
          id: quote.id,
          rate: quote.rate,
        },
      }),
      ...(transactionId && { transactionId }),
    });
  } catch (error: any) {
    console.error('[Bitso Execute] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to execute conversion',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/integrations/bitso/execute?id=conversionId
 *
 * Get conversion status
 */
export async function GET(request: NextRequest) {
  try {
    const conversionId = request.nextUrl.searchParams.get('id');

    if (!conversionId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Conversion ID is required',
        },
        { status: 400 }
      );
    }

    const conversion = await getConversionStatus(conversionId);

    return NextResponse.json({
      success: true,
      conversion: {
        id: conversion.id,
        status: conversion.status,
        fromCurrency: conversion.from_currency.toUpperCase(),
        toCurrency: conversion.to_currency.toUpperCase(),
        fromAmount: conversion.from_amount,
        toAmount: conversion.to_amount,
        rate: conversion.rate,
      },
    });
  } catch (error: any) {
    console.error('[Bitso Status] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to get conversion status',
      },
      { status: 500 }
    );
  }
}
