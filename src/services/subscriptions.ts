import { supabase } from '../lib/supabaseClient';
import type { Subscription, ServiceResponse } from './types';

/**
 * Get active subscription for user
 */
export async function getActiveSubscription(userId: string): Promise<ServiceResponse<Subscription>> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .maybeSingle();

  return { data, error };
}

/**
 * Get user's plan and limits
 */
export async function getUserPlanAndLimits(userId: string) {
  const { data: sub } = await getActiveSubscription(userId);

  return {
    plan: sub?.plan || 'free',
    limitEvents: sub?.limit_events || 30,
    pricePln: sub?.price_pln || 0,
    status: sub?.status || 'inactive'
  };
}

/**
 * Create new subscription
 */
export async function createSubscription(
  userId: string,
  plan: Subscription['plan'] = 'free',
  limitEvents = 30,
  pricePln = 0
): Promise<ServiceResponse<Subscription>> {
  const { data, error } = await supabase
    .from('subscriptions')
    .insert({
      user_id: userId,
      plan,
      limit_events: limitEvents,
      price_pln: pricePln,
      status: 'active'
    })
    .select()
    .single();

  return { data, error };
}

/**
 * Update subscription
 */
export async function updateSubscription(
  subscriptionId: string,
  updates: Partial<Pick<Subscription, 'plan' | 'limit_events' | 'price_pln' | 'status'>>
): Promise<ServiceResponse<Subscription>> {
  const { data, error } = await supabase
    .from('subscriptions')
    .update(updates)
    .eq('id', subscriptionId)
    .select()
    .single();

  return { data, error };
}

/**
 * Update subscription by user ID
 */
export async function updateUserSubscription(
  userId: string,
  updates: Partial<Pick<Subscription, 'plan' | 'limit_events' | 'price_pln' | 'status'>>
): Promise<ServiceResponse<Subscription>> {
  const { data, error } = await supabase
    .from('subscriptions')
    .update(updates)
    .eq('user_id', userId)
    .eq('status', 'active')
    .select()
    .single();

  return { data, error };
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(subscriptionId: string): Promise<ServiceResponse<Subscription>> {
  return updateSubscription(subscriptionId, { status: 'cancelled' });
}

/**
 * Get all subscriptions for user (including inactive)
 */
export async function getUserSubscriptions(userId: string): Promise<ServiceResponse<Subscription[]>> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  return { data: data || [], error };
}

/**
 * Check if user has unlimited plan
 */
export async function hasUnlimitedPlan(userId: string): Promise<boolean> {
  const { data: sub } = await getActiveSubscription(userId);
  return sub?.plan === 'unlimited';
}
