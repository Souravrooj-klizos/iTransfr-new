import { InfinitusPayoutRequest, createPayout, testConnection } from '@/lib/integrations/infinitus';
import { NextResponse } from 'next/server';

/**
 * GET /api/integrations/infinitus/test
 *
 * Test Infinitus API connection
 *
 * Uses the /platform/account endpoint which is a simple way to verify
 * API connectivity and authentication.
 */
export async function GET() {
  try {
    const result = await testConnection();

    if (!result.connected) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to connect to Infinitus',
          baseUrl: result.baseUrl,
          hint: 'Check INFINITUS_API_KEY and INFINITUS_BASE_URL in environment variables. Base URL should be https://sandbox.infinituspay.com/v1 for sandbox.',
          currentConfig: {
            baseUrl: process.env.INFINITUS_BASE_URL,
            apiKeyConfigured: !!process.env.INFINITUS_API_KEY,
            apiSecretConfigured: !!process.env.INFINITUS_API_SECRET,
            simulationMode:
              process.env.INFINITUS_SIMULATION_MODE === 'true' ||
              process.env.NODE_ENV === 'development',
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Infinitus API connection successful',
      data: {
        environment: result.environment,
        baseUrl: result.baseUrl,
        accountInfo: result.accountInfo,
        simulationMode:
          process.env.INFINITUS_SIMULATION_MODE === 'true' ||
          process.env.NODE_ENV === 'development',
        note: 'Payout endpoints may require additional account configuration. The system will fall back to simulation mode if payout endpoints are not available.',
      },
    });
  } catch (error: any) {
    console.error('[Infinitus Test] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Unknown error',
        currentConfig: {
          baseUrl: process.env.INFINITUS_BASE_URL,
          apiKeyConfigured: !!process.env.INFINITUS_API_KEY,
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/integrations/infinitus/test
 *
 * Test payout creation (will use simulation mode if real API not available)
 */
export async function POST() {
  try {
    // Create a test payout request
    const testRequest: InfinitusPayoutRequest = {
      amount: 1.0,
      currency: 'USD',
      recipient: {
        name: 'Test User',
        bankName: 'Test Bank',
        accountNumber: '123456789',
        country: 'US',
        currency: 'USD',
      },
      reference: `TEST-${Date.now()}`,
      description: 'API Test Payout',
    };

    console.log('[Infinitus Test] Testing payout creation...');
    const payout = await createPayout(testRequest);

    const isSimulated = payout.id.startsWith('SIM-');

    return NextResponse.json({
      success: true,
      message: isSimulated
        ? 'Payout created in SIMULATION mode (real payout endpoints not available)'
        : 'Payout created successfully via Infinitus API',
      data: {
        payout,
        isSimulated,
        note: isSimulated
          ? 'The Infinitus sandbox may have limited payout support. Contact Infinitus support to enable full payout functionality.'
          : 'Payout was successfully submitted to Infinitus',
      },
    });
  } catch (error: any) {
    console.error('[Infinitus Test Payout] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
