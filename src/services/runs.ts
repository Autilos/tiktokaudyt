import { supabase } from '../lib/supabaseClient';
import type { Run, ServiceResponse, PaginatedResponse } from './types';

/**
 * Get runs for current user
 */
export async function getUserRuns(
  userId: string,
  options?: {
    from?: string;
    to?: string;
    limit?: number;
    offset?: number;
    status?: Run['status'];
  }
): Promise<PaginatedResponse<Run>> {
  let query = supabase
    .from('runs')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (options?.from) {
    query = query.gte('created_at', options.from);
  }
  if (options?.to) {
    query = query.lte('created_at', options.to);
  }
  if (options?.status) {
    query = query.eq('status', options.status);
  }
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
 * Get single run by ID
 */
export async function getRun(runId: string): Promise<ServiceResponse<Run>> {
  const { data, error } = await supabase
    .from('runs')
    .select('*')
    .eq('id', runId)
    .single();

  return { data, error };
}

/**
 * Create new run
 */
export async function createRun(run: Omit<Run, 'id' | 'created_at'>): Promise<ServiceResponse<Run>> {
  const { data, error } = await supabase
    .from('runs')
    .insert(run)
    .select()
    .single();

  return { data, error };
}

/**
 * Update run status
 */
export async function updateRunStatus(
  runId: string,
  status: Run['status'],
  errorMessage?: string
): Promise<ServiceResponse<Run>> {
  const updates: Partial<Run> = { status };
  if (errorMessage) {
    updates.error_message = errorMessage;
  }

  const { data, error } = await supabase
    .from('runs')
    .update(updates)
    .eq('id', runId)
    .select()
    .single();

  return { data, error };
}

/**
 * Update run results count
 */
export async function updateRunResults(
  runId: string,
  resultsCount: number,
  costUsd?: number
): Promise<ServiceResponse<Run>> {
  const updates: Partial<Run> = {
    results_count: resultsCount,
    status: 'completed'
  };
  if (costUsd !== undefined) {
    updates.cost_usd = costUsd;
  }

  const { data, error } = await supabase
    .from('runs')
    .update(updates)
    .eq('id', runId)
    .select()
    .single();

  return { data, error };
}

/**
 * Get total runs count for user
 */
export async function getUserRunsCount(userId: string): Promise<number> {
  const { count } = await supabase
    .from('runs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  return count || 0;
}

/**
 * Get runs by mode
 */
export async function getRunsByMode(
  userId: string,
  mode: Run['mode'],
  limit = 50
): Promise<ServiceResponse<Run[]>> {
  const { data, error } = await supabase
    .from('runs')
    .select('*')
    .eq('user_id', userId)
    .eq('mode', mode)
    .order('created_at', { ascending: false })
    .limit(limit);

  return { data: data || [], error };
}

/**
 * Get all runs (admin only)
 */
export async function getAllRuns(limit = 100): Promise<ServiceResponse<Run[]>> {
  const { data, error } = await supabase
    .from('runs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  return { data: data || [], error };
}
