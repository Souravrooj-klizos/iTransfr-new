const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAdmin() {
  console.log('🔍 Checking admin setup...\n');

  try {
    // Check if admin_profiles table exists and has data
    const { data: profiles, error: profilesError } = await supabase
      .from('admin_profiles')
      .select('*');

    if (profilesError) {
      console.error('❌ Admin profiles table error:', profilesError.message);
      return;
    }

    console.log('✅ Admin profiles:', profiles?.length || 0, 'found');
    if (profiles && profiles.length > 0) {
      console.log('👤 Admin user:', {
        id: profiles[0].id,
        first_name: profiles[0].first_name,
        last_name: profiles[0].last_name,
        email: profiles[0].email,
        role: profiles[0].role,
      });
    }

    // Check admin_credentials
    const { data: creds, error: credsError } = await supabase
      .from('admin_credentials')
      .select('username, is_active, login_attempts');

    if (credsError) {
      console.error('❌ Admin credentials error:', credsError.message);
      return;
    }

    console.log('🔐 Admin credentials:', creds?.length || 0, 'found');
    if (creds && creds.length > 0) {
      console.log('👤 Credential:', {
        username: creds[0].username,
        is_active: creds[0].is_active,
        login_attempts: creds[0].login_attempts,
      });
    }

    // Test authentication function
    console.log('\n🔐 Testing authentication...');
    const { data: authTest, error: authError } = await supabase.rpc('authenticate_admin', {
      p_username: 'admin',
      p_password: 'SecurePass123!',
      p_ip_address: '127.0.0.1',
      p_user_agent: 'test',
    });

    if (authError) {
      console.error('❌ Auth function error:', authError.message);
    } else {
      console.log('✅ Auth result:', {
        success: authTest?.success,
        error: authTest?.error,
      });
    }
  } catch (error) {
    console.error('❌ Check failed:', error.message);
  }
}

checkAdmin();
