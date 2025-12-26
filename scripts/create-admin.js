/**
 * Create Initial Admin User
 *
 * This script creates the first admin user for the system.
 * Run this after setting up the database schema.
 *
 * Usage:
 * node scripts/create-admin.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL environment variable is required!');
  process.exit(1);
}

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required!');
  console.error('');
  console.error('📝 Make sure your .env.local file contains:');
  console.error('SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here');
  console.error('');
  console.error(
    'Get the service role key from: Supabase Dashboard → Settings → API → service_role secret'
  );
  process.exit(1);
}

console.log('✅ Environment variables loaded successfully');
console.log('📍 Supabase URL:', supabaseUrl);
console.log('🔑 Service Role Key loaded:', supabaseServiceKey.substring(0, 20) + '...');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Admin credentials - CHANGE THESE!
const ADMIN_CONFIG = {
  firstName: 'Super',
  lastName: 'Admin',
  email: 'admin@itransfr.com',
  username: 'admin',
  password: 'SecurePass123!',
};

async function createInitialAdmin() {
  try {
    console.log('🚀 Creating initial admin user...');
    console.log('Admin Email:', ADMIN_CONFIG.email);
    console.log('Admin Username:', ADMIN_CONFIG.username);

    // Check if admin already exists
    console.log('📋 Checking for existing admin...');
    const { data: existingAdmin, error: checkError } = await supabase
      .from('admin_credentials')
      .select('username')
      .eq('username', ADMIN_CONFIG.username)
      .single();

    if (existingAdmin) {
      console.log('⚠️  Admin user already exists!');
      console.log('Username:', existingAdmin.username);
      console.log('If you need to reset the password, update the database directly.');
      return;
    }

    // Create the admin user using the database function
    console.log('👤 Creating admin profile and credentials...');
    const { data: adminId, error: createError } = await supabase.rpc('create_initial_admin', {
      p_first_name: ADMIN_CONFIG.firstName,
      p_last_name: ADMIN_CONFIG.lastName,
      p_email: ADMIN_CONFIG.email,
      p_username: ADMIN_CONFIG.username,
      p_password: ADMIN_CONFIG.password,
    });

    if (createError) {
      throw createError;
    }

    if (!adminId) {
      throw new Error('Failed to create admin - no ID returned');
    }

    console.log('✅ Admin user created successfully!');
    console.log('Admin ID:', adminId);
    console.log('');
    console.log('🔐 Login Credentials:');
    console.log('Username:', ADMIN_CONFIG.username);
    console.log('Password:', ADMIN_CONFIG.password);
    console.log('');
    console.log('⚠️  IMPORTANT: Change the default password immediately after first login!');
    console.log('📧 Email:', ADMIN_CONFIG.email);
    console.log('');
    console.log('🔗 You can now log in at: /admin-login');
  } catch (error) {
    console.error('❌ Failed to create admin user:');
    console.error(error);

    if (error.message?.includes('admin_roles')) {
      console.log('');
      console.log("💡 This might be because the admin auth schema hasn't been run yet.");
      console.log('Run the ADMIN_AUTH_SCHEMA.sql first:');
      console.log('psql $DATABASE_URL -f database/ADMIN_AUTH_SCHEMA.sql');
    }

    process.exit(1);
  }
}

// Run the script
createInitialAdmin().catch(error => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});
