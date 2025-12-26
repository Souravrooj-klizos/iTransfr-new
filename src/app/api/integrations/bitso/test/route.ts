import { getAvailableBooks, testConnection } from '@/lib/integrations/bitso';
import { NextResponse } from 'next/server';

/**
 * GET /api/integrations/bitso/test
 *
 * Test Bitso API connection and return account balances
 */
export async function GET() {
  try {
    const result = await testConnection();

    if (!result.connected) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to connect to Bitso',
          hint: 'Check BITSO_API_KEY and BITSO_API_SECRET in environment variables',
        },
        { status: 500 }
      );
    }

    // Get available books (public endpoint)
    let books: string[] = [];
    try {
      const booksData = await getAvailableBooks();
      books = booksData.map((b: any) => b.book);
    } catch (e) {
      // Non-critical, continue
    }

    return NextResponse.json({
      success: true,
      message: 'Bitso API connection successful',
      data: {
        balances: result.balances?.map(b => ({
          currency: b.currency.toUpperCase(),
          available: b.available,
          total: b.total,
        })),
        supportedBooks: books.slice(0, 10), // Show first 10
      },
    });
  } catch (error: any) {
    console.error('[Bitso Test] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
