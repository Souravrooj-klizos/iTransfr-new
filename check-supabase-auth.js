#!/usr/bin/env node

/**
 * Supabase Authentication Check Script
 *
 * This script verifies if your Supabase credentials are properly configured and authenticated.
 * Run with: node check-supabase-auth.js
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Try to load .env.local first, then .env
const envLocalResult = dotenv.config({ path: '.env.local' });
const envResult = dotenv.config({ path: '.env' });

console.log('🔧 Environment Loading Debug:');
console.log(`   .env.local loaded: ${envLocalResult.error ? '❌ Failed' : '✅ Success'}`);
console.log(`   .env loaded: ${envResult.error ? '❌ Failed' : '✅ Success'}`);

// Check if files actually exist and have content
const fs = require('fs');
if (fs.existsSync('.env.local')) {
  const envLocalContent = fs.readFileSync('.env.local', 'utf8');
  console.log(`   .env.local file exists: ✅ (${envLocalContent.length} characters)`);
  console.log(`   .env.local content preview: "${envLocalContent.substring(0, 50)}..."`);
} else {
  console.log('   .env.local file exists: ❌ Not found');
}

if (fs.existsSync('.env')) {
  const envContent = fs.readFileSync('.env', 'utf8');
  console.log(`   .env file exists: ✅ (${envContent.length} characters)`);
  console.log(`   .env content preview: "${envContent.substring(0, 50)}..."`);
} else {
  console.log('   .env file exists: ❌ Not found');
}
console.log('');

async function checkSupabaseAuth() {
  console.log('🔍 Checking Supabase Authentication...\n');

  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const databaseUrl = process.env.DATABASE_URL;

  console.log('📋 Environment Variables Check:');
  console.log(`   NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✅ Set' : '❌ Missing'}`);
  console.log(`   NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseAnonKey ? '✅ Set' : '❌ Missing'}`);
  console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey ? '✅ Set' : '❌ Missing'}`);
  console.log(`   DATABASE_URL: ${databaseUrl ? '✅ Set' : '❌ Missing'}\n`);

  if (!databaseUrl) {
    console.log('❌ DATABASE_URL is missing! This is required for Prisma.');
    console.log('   Please check your .env.local file and ensure DATABASE_URL is set correctly.\n');
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    console.log('❌ Required environment variables are missing!');
    console.log(
      '   Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env file'
    );
    process.exit(1);
  }

  // Test connection with anon key
  try {
    console.log('🔗 Testing connection with anonymous key...');
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Try to get health status or basic info
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.log('❌ Anonymous key authentication failed:');
      console.log(`   Error: ${error.message}`);
    } else {
      console.log('✅ Anonymous key authentication successful!');
    }
  } catch (error) {
    console.log('❌ Connection test failed:');
    console.log(`   Error: ${error.message}`);
  }

  // Test connection with service role key if available
  if (supabaseServiceKey) {
    try {
      console.log('\n🔗 Testing connection with service role key...');
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });

      // Try to list users (service role should have admin access)
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1 });

      if (error) {
        console.log('❌ Service role key authentication failed:');
        console.log(`   Error: ${error.message}`);
      } else {
        console.log('✅ Service role key authentication successful!');
        console.log(`   Users in project: ${data.users.length} (showing first page)`);
      }
    } catch (error) {
      console.log('❌ Service role connection test failed:');
      console.log(`   Error: ${error.message}`);
    }
  }

  // Test database connection if service role is available
  if (supabaseServiceKey) {
    try {
      console.log('\n🗄️  Testing database connection...');
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

      // Try to query a simple table (this will fail if no tables exist, but tests connection)
      const { data, error } = await supabaseAdmin.from('_supabase_tables').select('*').limit(1);

      if (error) {
        // This error is expected if the table doesn't exist, but connection works
        if (error.code === 'PGRST116') {
          console.log('✅ Database connection successful!');
          console.log('   Note: Table query failed (expected if no custom tables exist)');
        } else {
          console.log('❌ Database connection failed:');
          console.log(`   Error: ${error.message}`);
        }
      } else {
        console.log('✅ Database connection successful!');
      }
    } catch (error) {
      console.log('❌ Database connection test failed:');
      console.log(`   Error: ${error.message}`);
    }
  }

  console.log('\n📝 Next Steps:');
  console.log('   1. If anonymous key fails: Check your Supabase project settings');
  console.log('   2. If service role fails: Verify your service role key in Supabase dashboard');
  console.log('   3. If database fails: Ensure your database is properly configured');

  console.log('\n🔗 Supabase Dashboard: https://supabase.com/dashboard');
  console.log('   Go to Settings > API to verify your keys\n');
}

checkSupabaseAuth().catch(console.error);
