// Public Supabase browser configuration. The anon key is intentionally public;
// never return SUPABASE_SERVICE_ROLE_KEY from this function.
export default async () => {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
  return Response.json({ supabaseUrl, supabaseAnonKey }, { headers: { 'Cache-Control': 'public, max-age=300' } });
};
