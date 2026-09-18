import { createClient } from '@supabase/supabase-js';
export default async (req) => {
  if (req.httpMethod !== 'GET') return { statusCode: 405, body: 'Method Not Allowed' };
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  if (!(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL) || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { statusCode: 503, body: JSON.stringify({ error: 'Billing backend is not configured.' }) };
  }
  const admin = createClient((process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL), process.env.SUPABASE_SERVICE_ROLE_KEY);
  const token = auth.slice(7);
  const { data: { user }, error: ue } = await admin.auth.getUser(token);
  if (ue || !user) return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  const { data: s, error } = await admin.from('subscriptions').select('*').eq('user_id', user.id).maybeSingle();
  if (error) return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  const { data: u } = await admin.from('usage_counters').select('*').eq('user_id', user.id).maybeSingle();

  let plan = s?.plan || 'trial';
  let status = s?.status || 'active';
  const trialEnd = s?.trial_end || null;
  const currentPeriodEnd = s?.current_period_end || null;

  // Auto-expire trial when past trial_end
  if (plan === 'trial' && trialEnd) {
    const end = new Date(trialEnd).getTime();
    if (Number.isFinite(end) && Date.now() > end) {
      plan = 'expired';
      status = 'expired';
      // Optionally update DB (fire-and-forget)
      void admin.from('subscriptions').update({ plan: 'expired', status: 'expired' }).eq('user_id', user.id);
    }
  }
  // Also expire paid if period ended
  if (plan === 'pro' && currentPeriodEnd) {
    const end = new Date(currentPeriodEnd).getTime();
    if (Number.isFinite(end) && Date.now() > end) {
      plan = 'expired';
      status = 'expired';
      void admin.from('subscriptions').update({ plan: 'expired', status: 'expired' }).eq('user_id', user.id);
    }
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private, no-store' },
    body: JSON.stringify({
      plan,
      status,
      trialStart: s?.trial_start || null,
      trialEnd,
      currentPeriodEnd,
      reportsGenerated: u?.reports_generated || 0,
      dataProcessedBytes: u?.data_processed_bytes || 0,
      storageBytes: u?.storage_bytes || 0
    })
  };
};
