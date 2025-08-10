// Test Supabase connection and setup
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

console.log('Testing Supabase connection...');
console.log('URL:', supabaseUrl);
console.log('Key available:', !!supabaseServiceKey);

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testConnection() {
  try {
    // Test basic connection
    console.log('\n1. Testing basic connection...');
    const { data: tables, error: tablesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (tablesError) {
      console.error('Tables error:', tablesError);
    } else {
      console.log('✓ Connection successful, profiles table exists');
    }

    // Test auth functionality
    console.log('\n2. Testing auth functionality...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: 'test@example.com',
      password: 'testpass123'
    });
    
    if (authError) {
      console.error('Auth error:', authError);
    } else {
      console.log('✓ Auth signup test successful');
    }

    // Check if profile was created automatically
    if (authData.user) {
      console.log('\n3. Checking if profile was created...');
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id);
      
      if (profileError) {
        console.error('Profile error:', profileError);
      } else if (profile && profile.length > 0) {
        console.log('✓ Profile created automatically:', profile[0]);
      } else {
        console.log('⚠ Profile not found - trigger might not be working');
      }
    }

  } catch (error) {
    console.error('Connection test failed:', error);
  }
}

testConnection();