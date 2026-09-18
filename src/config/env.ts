export interface PublicEnv {
  supabaseUrl: string;
  supabaseAnonKey: string;
  siteUrl: string;
}

export const env: PublicEnv = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL ?? '',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? '',
  siteUrl: (import.meta.env.VITE_SITE_URL ?? 'https://docbit.in').replace(/\/+$/, '')
};

export function setRuntimeSupabaseConfig(supabaseUrl: string, supabaseAnonKey: string): void {
  if (supabaseUrl) env.supabaseUrl = supabaseUrl.replace(/\/+$/, '');
  if (supabaseAnonKey) env.supabaseAnonKey = supabaseAnonKey;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(env.supabaseUrl && env.supabaseAnonKey);
}

export const supabaseConfigured = isSupabaseConfigured();

export function getAuthRedirectUrl(path = '/auth/callback'): string {
  if (typeof window !== 'undefined' && window.location.origin) {
    return `${window.location.origin}${path}`;
  }
  return `${env.siteUrl}${path}`;
}

export function missingSupabaseVariables(): string[] {
  return [
    !env.supabaseUrl ? 'VITE_SUPABASE_URL' : '',
    !env.supabaseAnonKey ? 'VITE_SUPABASE_ANON_KEY' : ''
  ].filter(Boolean);
}
