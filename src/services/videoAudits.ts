import { supabase } from '../lib/supabaseClient';
import type { VideoAudit, ServiceResponse, PaginatedResponse } from './types';

/**
 * Get video audits for user
 */
export async function getUserVideoAudits(
  userId: string,
  options?: {
    limit?: number;
    offset?: number;
    orderBy?: 'created_at' | 'engagement_rate' | 'views';
    orderDirection?: 'asc' | 'desc';
  }
): Promise<PaginatedResponse<VideoAudit>> {
  const orderBy = options?.orderBy || 'created_at';
  const orderDirection = options?.orderDirection === 'asc';

  let query = supabase
    .from('video_audits')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order(orderBy, { ascending: orderDirection });

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
 * Get single video audit by ID
 */
export async function getVideoAudit(auditId: string): Promise<ServiceResponse<VideoAudit>> {
  const { data, error } = await supabase
    .from('video_audits')
    .select('*')
    .eq('id', auditId)
    .single();

  return { data, error };
}

/**
 * Get video audit by video URL
 */
export async function getVideoAuditByUrl(
  userId: string,
  videoUrl: string
): Promise<ServiceResponse<VideoAudit>> {
  const { data, error } = await supabase
    .from('video_audits')
    .select('*')
    .eq('user_id', userId)
    .eq('video_url', videoUrl)
    .order('created_at', { ascending: false })
    .maybeSingle();

  return { data, error };
}

/**
 * Create new video audit
 */
export async function createVideoAudit(
  audit: Omit<VideoAudit, 'id' | 'created_at'>
): Promise<ServiceResponse<VideoAudit>> {
  const { data, error } = await supabase
    .from('video_audits')
    .insert(audit)
    .select()
    .single();

  return { data, error };
}

/**
 * Update video audit
 */
export async function updateVideoAudit(
  auditId: string,
  updates: Partial<VideoAudit>
): Promise<ServiceResponse<VideoAudit>> {
  const { data, error } = await supabase
    .from('video_audits')
    .update(updates)
    .eq('id', auditId)
    .select()
    .single();

  return { data, error };
}

/**
 * Get video audits count for user
 */
export async function getUserVideoAuditsCount(userId: string): Promise<number> {
  const { count } = await supabase
    .from('video_audits')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  return count || 0;
}

/**
 * Get video audits by author username
 */
export async function getVideoAuditsByAuthor(
  userId: string,
  authorUsername: string,
  limit = 50
): Promise<ServiceResponse<VideoAudit[]>> {
  const { data, error } = await supabase
    .from('video_audits')
    .select('*')
    .eq('user_id', userId)
    .eq('author_username', authorUsername)
    .order('created_at', { ascending: false })
    .limit(limit);

  return { data: data || [], error };
}

/**
 * Get recent video audits
 */
export async function getRecentVideoAudits(
  userId: string,
  limit = 10
): Promise<ServiceResponse<VideoAudit[]>> {
  const { data, error } = await supabase
    .from('video_audits')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  return { data: data || [], error };
}

/**
 * Get all video audits (admin only)
 */
export async function getAllVideoAudits(limit = 100): Promise<ServiceResponse<VideoAudit[]>> {
  const { data, error } = await supabase
    .from('video_audits')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  return { data: data || [], error };
}

/**
 * Get video audits with high engagement
 */
export async function getHighEngagementAudits(
  userId: string,
  minEngagementRate = 10,
  limit = 20
): Promise<ServiceResponse<VideoAudit[]>> {
  const { data, error } = await supabase
    .from('video_audits')
    .select('*')
    .eq('user_id', userId)
    .gte('engagement_rate', minEngagementRate)
    .order('engagement_rate', { ascending: false })
    .limit(limit);

  return { data: data || [], error };
}
