/**
 * Test script for Supabase services
 *
 * Run with: npx ts-node scripts/test_supabase.ts
 *
 * Note: This script requires proper environment variables to be set.
 * For frontend (Vite) environment variables, you may need to run this
 * in a Node.js context with manually loaded variables.
 */

import { createClient } from '@supabase/supabase-js';

// Load environment variables for Node.js context
// In production, these should come from .env
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase environment variables!');
  console.log('Set SUPABASE_URL and SUPABASE_ANON_KEY before running this script.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testConnection() {
  console.log('🔌 Testing Supabase connection...');
  console.log(`   URL: ${SUPABASE_URL.substring(0, 30)}...`);

  try {
    // Simple health check
    const { error } = await supabase.from('app_users').select('count', { count: 'exact', head: true });

    if (error) {
      throw error;
    }

    console.log('✅ Connection successful!');
    return true;
  } catch (err: any) {
    console.error('❌ Connection failed:', err.message);
    return false;
  }
}

async function testReadOperations() {
  console.log('\n📖 Testing READ operations...');

  // Test app_users read
  try {
    const { data: users, error } = await supabase
      .from('app_users')
      .select('*')
      .limit(5);

    if (error) throw error;
    console.log(`   ✅ app_users: Found ${users?.length || 0} records`);
  } catch (err: any) {
    console.log(`   ❌ app_users: ${err.message}`);
  }

  // Test subscriptions read
  try {
    const { data: subs, error } = await supabase
      .from('subscriptions')
      .select('*')
      .limit(5);

    if (error) throw error;
    console.log(`   ✅ subscriptions: Found ${subs?.length || 0} records`);
  } catch (err: any) {
    console.log(`   ❌ subscriptions: ${err.message}`);
  }

  // Test runs read
  try {
    const { data: runs, error } = await supabase
      .from('runs')
      .select('*')
      .limit(5);

    if (error) throw error;
    console.log(`   ✅ runs: Found ${runs?.length || 0} records`);
  } catch (err: any) {
    console.log(`   ❌ runs: ${err.message}`);
  }

  // Test video_audits read
  try {
    const { data: audits, error } = await supabase
      .from('video_audits')
      .select('*')
      .limit(5);

    if (error) throw error;
    console.log(`   ✅ video_audits: Found ${audits?.length || 0} records`);
  } catch (err: any) {
    console.log(`   ❌ video_audits: ${err.message}`);
  }

  // Test profile_audits read
  try {
    const { data: profiles, error } = await supabase
      .from('profile_audits')
      .select('*')
      .limit(5);

    if (error) throw error;
    console.log(`   ✅ profile_audits: Found ${profiles?.length || 0} records`);
  } catch (err: any) {
    console.log(`   ❌ profile_audits: ${err.message}`);
  }

  // Test video_comments read
  try {
    const { data: comments, error } = await supabase
      .from('video_comments')
      .select('*')
      .limit(5);

    if (error) throw error;
    console.log(`   ✅ video_comments: Found ${comments?.length || 0} records`);
  } catch (err: any) {
    console.log(`   ❌ video_comments: ${err.message}`);
  }
}

async function testRPCFunctions() {
  console.log('\n🔧 Testing RPC functions...');

  // Test current_month_usage
  try {
    const { data, error } = await supabase.rpc('current_month_usage');

    if (error) throw error;
    console.log(`   ✅ current_month_usage: ${JSON.stringify(data)}`);
  } catch (err: any) {
    console.log(`   ⚠️ current_month_usage: ${err.message} (may require auth)`);
  }

  // Test metrics_daily
  try {
    const today = new Date().toISOString().slice(0, 10);
    const lastMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const { data, error } = await supabase.rpc('metrics_daily', {
      from_date: lastMonth,
      to_date: today
    });

    if (error) throw error;
    console.log(`   ✅ metrics_daily: Found ${data?.length || 0} days of data`);
  } catch (err: any) {
    console.log(`   ⚠️ metrics_daily: ${err.message} (may require auth)`);
  }
}

async function printSummary() {
  console.log('\n📊 Database Summary:');

  const tables = ['app_users', 'subscriptions', 'runs', 'video_audits', 'profile_audits', 'video_comments'];

  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) throw error;
      console.log(`   ${table}: ${count || 0} records`);
    } catch (err: any) {
      console.log(`   ${table}: Unable to count (${err.message})`);
    }
  }
}

async function main() {
  console.log('🧪 Supabase Services Test Script\n');
  console.log('================================\n');

  const connected = await testConnection();

  if (!connected) {
    console.log('\n❌ Cannot proceed without a valid connection.');
    process.exit(1);
  }

  await testReadOperations();
  await testRPCFunctions();
  await printSummary();

  console.log('\n================================');
  console.log('✅ Test completed!\n');
}

main().catch(console.error);
