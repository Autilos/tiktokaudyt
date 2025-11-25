import { supabase } from '../lib/supabaseClient';
import type { AppUser, ServiceResponse } from './types';

/**
 * Get app user by user_id (Supabase Auth ID)
 */
export async function getAppUser(userId: string): Promise<ServiceResponse<AppUser>> {
  const { data, error } = await supabase
    .from('app_users')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  return { data, error };
}

/**
 * Get app user role
 */
export async function getAppUserRole(userId: string): Promise<'user' | 'admin' | null> {
  const { data } = await supabase
    .from('app_users')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle();

  return data?.role || null;
}

/**
 * Check if user is admin
 */
export async function isAdmin(userId: string): Promise<boolean> {
  const role = await getAppUserRole(userId);
  return role === 'admin';
}

/**
 * Create new app user
 */
export async function createAppUser(
  userId: string,
  email: string,
  role: 'user' | 'admin' = 'user'
): Promise<ServiceResponse<AppUser>> {
  const { data, error } = await supabase
    .from('app_users')
    .insert({
      user_id: userId,
      email,
      role
    })
    .select()
    .single();

  return { data, error };
}

/**
 * Update app user
 */
export async function updateAppUser(
  userId: string,
  updates: Partial<Pick<AppUser, 'email' | 'role'>>
): Promise<ServiceResponse<AppUser>> {
  const { data, error } = await supabase
    .from('app_users')
    .update(updates)
    .eq('user_id', userId)
    .select()
    .single();

  return { data, error };
}

/**
 * Get all app users (admin only)
 */
export async function getAllAppUsers(limit = 100): Promise<ServiceResponse<AppUser[]>> {
  const { data, error } = await supabase
    .from('app_users')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  return { data: data || [], error };
}

/**
 * Get app users with their subscriptions (admin only)
 */
export async function getAppUsersWithSubscriptions(): Promise<ServiceResponse<(AppUser & { subscription?: any })[]>> {
  const { data: users, error: usersError } = await supabase
    .from('app_users')
    .select('*')
    .order('created_at', { ascending: false });

  if (usersError) {
    return { data: [], error: usersError };
  }

  // Get subscriptions for each user
  const usersWithSubs = await Promise.all(
    (users || []).map(async (user) => {
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.user_id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .maybeSingle();

      return { ...user, subscription: sub };
    })
  );

  return { data: usersWithSubs, error: null };
}
