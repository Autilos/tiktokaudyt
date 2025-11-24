import { supabase } from './supabase';

export async function getCurrentPlanAndUsage() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: subs } = await supabase
    .from('subscriptions')
    .select('plan, limit_events, status, price_pln')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .maybeSingle();

  const { data: usageData } = await supabase.rpc('current_month_usage');
  const usage = usageData?.[0] || { events: 0, usd: 0 };

  return {
    user,
    plan: subs?.plan ?? 'free',
    limit: subs?.limit_events ?? 30,
    price: subs?.price_pln ?? 0,
    usage
  };
}

export async function getOverview(days = 60) {
  const to = new Date();
  const from = new Date(to.getTime() - days * 24 * 3600 * 1000);

  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  const { data: daily } = await supabase.rpc('metrics_daily', {
    from_date: fmt(from),
    to_date: fmt(to)
  });

  const { data: byMode } = await supabase.rpc('metrics_by_mode', {
    from_date: fmt(from),
    to_date: fmt(to)
  });

  return { daily: daily ?? [], byMode: byMode ?? [] };
}

export async function getRuns(from?: string, to?: string, limit = 500) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  let query = supabase
    .from('runs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (from) query = query.gte('created_at', from);
  if (to) query = query.lte('created_at', to);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}
