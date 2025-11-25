import { supabase } from '../lib/supabaseClient';
import type { ProfileAudit, ServiceResponse, PaginatedResponse } from './types';

/**
 * Get profile audits for user
 */
export async function getUserProfileAudits(
  userId: string,
  options?: {
    limit?: number;
    offset?: number;
  }
): Promise<PaginatedResponse<ProfileAudit>> {
  let query = supabase
    .from('profile_audits')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (options?.limit) {
    query = query.limit(options.limit);
  }
  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
  }

  const { data, count, error } = await query;

  return {
    data: data || [],
    count: count || 0,
    error
  };
}

/**
 * Get single profile audit by ID
 */
export async function getProfileAudit(auditId: string): Promise<ServiceResponse<ProfileAudit>> {
  const { data, error } = await supabase
    .from('profile_audits')
    .select('*')
    .eq('id', auditId)
    .single();

  return { data, error };
}

/**
 * Get profile audit by username
 */
export async function getProfileAuditByUsername(
  userId: string,
  username: string
): Promise<ServiceResponse<ProfileAudit>> {
  const { data, error } = await supabase
    .from('profile_audits')
    .select('*')
    .eq('user_id', userId)
    .eq('profile_username', username)
    .order('created_at', { ascending: false })
    .maybeSingle();

  return { data, error };
}

/**
 * Create new profile audit
 */
export async function createProfileAudit(
  audit: Omit<ProfileAudit, 'id' | 'created_at'>
): Promise<ServiceResponse<ProfileAudit>> {
  const { data, error } = await supabase
    .from('profile_audits')
    .insert(audit)
    .select()
    .single();

  return { data, error };
}

/**
 * Update profile audit
 */
export async function updateProfileAudit(
  auditId: string,
  updates: Partial<ProfileAudit>
): Promise<ServiceResponse<ProfileAudit>> {
  const { data, error } = await supabase
    .from('profile_audits')
    .update(updates)
    .eq('id', auditId)
    .select()
    .single();

  return { data, error };
}

/**
 * Get profile audits count for user
 */
export async function getUserProfileAuditsCount(userId: string): Promise<number> {
  const { count } = await supabase
    .from('profile_audits')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  return count || 0;
}

/**
 * Get recent profile audits (partial data for listings)
 */
export async function getRecentProfileAudits(
  userId: string,
  limit = 5
): Promise<ServiceResponse<Partial<ProfileAudit>[]>> {
  const { data, error } = await supabase
    .from('profile_audits')
    .select('id, created_at, profile_username, audit_data')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  return { data: data || [], error };
}

/**
 * Get all profile audits (admin only)
 */
export async function getAllProfileAudits(limit = 100): Promise<ServiceResponse<ProfileAudit[]>> {
  const { data, error } = await supabase
    .from('profile_audits')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  return { data: data || [], error };
}

/**
 * Get profile audits count (admin only)
 */
export async function getTotalProfileAuditsCount(): Promise<number> {
  const { count } = await supabase
    .from('profile_audits')
    .select('*', { count: 'exact', head: true });

  return count || 0;
}
