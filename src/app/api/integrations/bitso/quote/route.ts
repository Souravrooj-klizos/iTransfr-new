import { getExchangeRate, requestQuote } from '@/lib/integrations/bitso';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/integrations/bitso/quote
 *
 * Request a conversion quote from Bitso
 * Quote is valid for 30 seconds
 *
 * Body:
 * {
 *   "fromCurrency": "USD",
 *   "toCurrency": "MXN",
 *   "amount": 1000,
 *   "type": "spend" | "receive" (optional, default: spend)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fromCurrency, toCurrency, amount, type = 'spend' } = body;

    // Validation
    if (!fromCurrency) {
      return NextResponse.json(
        {
          success: false,
          error: 'fromCurrency is required',
        },
        { status: 400 }
      );
    }

    if (!toCurrency) {
      return NextResponse.json(
        {
          success: false,
          error: 'toCurrency is required',
        },
        { status: 400 }
      );
    }

    if (!amount || amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Valid amount is required',
        },
        { status: 400 }
      );
    }

    console.log('[Bitso Quote] Request:', { fromCurrency, toCurrency, amount, type });

    // Get quote from Bitso
    const quote = await requestQuote(fromCurrency, toCurrency, amount, type);

    // Calculate expiry
    const expiresAt = new Date(quote.expires);
    const expiresIn = Math.max(0, Math.floor((quote.expires - Date.now()) / 1000));

    return NextResponse.json({
      success: true,
      quote: {
        id: quote.id,
        fromCurrency: quote.from_currency.toUpperCase(),
        toCurrency: quote.to_currency.toUpperCase(),
        fromAmount: quote.from_amount,
        toAmount: quote.to_amount,
        rate: quote.rate,
        plainRate: quote.plain_rate,
        rateCurrency: quote.rate_currency.toUpperCase(),
        book: quote.book,
        slippage: quote.estimated_slippage,
        expiresAt: expiresAt.toISOString(),
        expiresInSeconds: expiresIn,
        createdAt: new Date(quote.created).toISOString(),
      },
      message: `Quote valid for ${expiresIn} seconds. Use quote ID to execute.`,
    });
  } catch (error: any) {
    console.error('[Bitso Quote] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to get quote',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/integrations/bitso/quote?from=USD&to=MXN&amount=1000
 *
 * Quick exchange rate lookup
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fromCurrency = searchParams.get('from') || 'USD';
    const toCurrency = searchParams.get('to') || 'MXN';
    const amount = parseFloat(searchParams.get('amount') || '1000');

    const rateInfo = await getExchangeRate(fromCurrency, toCurrency, amount);

    return NextResponse.json({
      success: true,
      rate: {
        from: fromCurrency.toUpperCase(),
        to: toCurrency.toUpperCase(),
        rate: rateInfo.rate,
        amount: amount,
        converted: rateInfo.toAmount,
        quoteId: rateInfo.quoteId,
        expiresAt: rateInfo.expiresAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error('[Bitso Rate] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to get exchange rate',
      },
      { status: 500 }
    );
  }
}
