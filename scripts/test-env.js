// Test script to verify environment variables are loaded
require('dotenv').config({ path: '.env.local' });

console.log('🔍 Testing Environment Variables');
console.log('================================');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
console.log(
  'SUPABASE_SERVICE_ROLE_KEY:',
  serviceRoleKey ? '✅ Set (length: ' + serviceRoleKey.length + ')' : '❌ Missing'
);

if (serviceRoleKey) {
  console.log('Service Role Key starts with:', serviceRoleKey.substring(0, 50) + '...');

  // Check if it contains "service_role"
  const decoded = Buffer.from(serviceRoleKey.split('.')[1], 'base64').toString();
  console.log('Contains "service_role":', decoded.includes('service_role') ? '✅ Yes' : '❌ No');
}

console.log('================================');
console.log('If both are ✅, environment is configured correctly!');
