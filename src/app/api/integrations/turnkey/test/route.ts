import { testConnection } from '@/lib/integrations/turnkey';
import { NextResponse } from 'next/server';

/**
 * GET /api/integrations/turnkey/test
 *
 * Test Turnkey API connection
 */
export async function GET() {
  try {
    const result = await testConnection();

    if (!result.connected) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to connect to Turnkey',
          hint: 'Check TURNKEY_ORGANIZATION_ID, TURNKEY_API_PUBLIC_KEY, and TURNKEY_API_PRIVATE_KEY',
          devModeHint: 'For development, set TURNKEY_DEV_MODE=true in .env to use mock wallets',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.devMode
        ? 'Turnkey DEV MODE - using mock wallets'
        : 'Turnkey API connection successful',
      data: {
        organizationId: result.organizationId,
        walletCount: result.walletCount,
        devMode: result.devMode || false,
      },
    });
  } catch (error: any) {
    console.error('[Turnkey Test] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Unknown error',
        devModeHint: 'For development, set TURNKEY_DEV_MODE=true in .env to use mock wallets',
      },
      { status: 500 }
    );
  }
}
