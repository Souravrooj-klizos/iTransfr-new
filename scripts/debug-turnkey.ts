import * as dotenv from 'dotenv';
import { createWallet, testConnection } from '../src/lib/integrations/turnkey';
dotenv.config();

async function main() {
  console.log('Testing Turnkey Connection...');

  // Test base connection
  const connection = await testConnection();
  console.log('Connection Result:', connection);

  if (!connection.connected) {
    console.error('❌ Failed to connect to Turnkey. Check credentials.');
    process.exit(1);
  }

  // Try to create a dummy wallet to verify write access
  try {
    console.log('Attempting to create a test wallet...');
    const testUserId = `test-user-${Date.now()}`;
    const wallet = await createWallet({
      walletName: `Debug Wallet ${testUserId}`,
      userId: testUserId,
    });
    console.log('✅ Wallet Created Successfully:', wallet);
  } catch (error: any) {
    console.error('❌ Failed to create wallet:', error.message);
    if (error.response) {
      console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

main();
