import { testConnection } from '@/lib/integrations/amlbot';
import { NextResponse } from 'next/server';

/**
 * GET /api/kyc/amlbot-test
 *
 * Test endpoint to verify AMLBot API connection
 * Use this in Postman to verify your API key is working
 *
 * Response:
 * {
 *   "success": true,
 *   "message": "AMLBot API connection successful",
 *   "apiKeyConfigured": true
 * }
 */
export async function GET() {
  try {
    const apiKeyConfigured = !!process.env.AML_BOT_API_KEY;
    const apiKeyPreview = process.env.AML_BOT_API_KEY
      ? process.env.AML_BOT_API_KEY.substring(0, 8) + '...'
      : 'NOT SET';

    if (!apiKeyConfigured) {
      return NextResponse.json(
        {
          success: false,
          message: 'AML_BOT_API_KEY environment variable is not set',
          apiKeyConfigured: false,
          hint: 'Add AML_BOT_API_KEY=your_api_key to your .env file',
        },
        { status: 500 }
      );
    }

    // Test the connection
    const result = await testConnection();

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'AMLBot API connection successful',
        apiKeyConfigured: true,
        apiKeyPreview,
        timestamp: new Date().toISOString(),
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: 'AMLBot API connection failed',
          details: result.details,
          httpStatus: result.status,
          apiKeyConfigured: true,
          apiKeyPreview,
          hint: 'Check if your API key is correct and active in the AMLBot dashboard',
        },
        { status: 401 }
      );
    }
  } catch (error: any) {
    console.error('[AMLBot Test] Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to test AMLBot connection',
        apiKeyConfigured: !!process.env.AML_BOT_API_KEY,
      },
      { status: 500 }
    );
  }
}
