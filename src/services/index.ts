// Central export for all Supabase services
// All database operations should go through these service functions

// Re-export Supabase client for cases where direct access is needed (auth operations)
export { supabase } from '../lib/supabaseClient';

// Export all service modules
export * from './appUsers';
export * from './subscriptions';
export * from './runs';
export * from './videoAudits';
export * from './videoComments';
export * from './profileAudits';

// Export types
export * from './types';

// ============================================
// USAGE GUIDE
// ============================================
//
// Instead of importing supabase directly and writing queries:
//
// ❌ DON'T:
// import { supabase } from '@/lib/supabase';
// const { data } = await supabase.from('video_audits').select('*');
//
// ✅ DO:
// import { getUserVideoAudits } from '@/services';
// const { data } = await getUserVideoAudits(userId);
//
// This provides:
// - Type safety
// - Centralized query logic
// - Easier testing and mocking
// - Consistent error handling
// ============================================
