import { swaggerSpec } from '@/lib/swagger';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Return the Swagger specification as JSON
    return NextResponse.json(swaggerSpec);
  } catch (error) {
    console.error('Error generating swagger spec:', error);
    return NextResponse.json(
      { error: 'Failed to generate API documentation' },
      { status: 500 }
    );
  }
}
