require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function runSQL() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    const sql = fs.readFileSync('database/create_client_function.sql', 'utf8');
    console.log('Executing SQL...');

    const { data, error } = await supabase.rpc('exec_sql', { sql });

    if (error) {
      console.error('Error executing SQL:', error);
    } else {
      console.log('SQL executed successfully:', data);
    }
  } catch (err) {
    console.error('Failed to run SQL:', err);
  }
}

runSQL();
