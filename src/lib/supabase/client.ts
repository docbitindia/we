import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env, isSupabaseConfigured, setRuntimeSupabaseConfig } from '../../config/env';

const configurationError = () => new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, or configure the Netlify public-config function.');

const missingConfigClient = new Proxy({} as SupabaseClient, {
  get() { throw configurationError(); }
});

export let supabase: SupabaseClient = isSupabaseConfigured()
  ? createClient(env.supabaseUrl, env.supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, flowType: 'implicit' }
    })
  : missingConfigClient;

let initPromise: Promise<boolean> | null = null;

export async function initializeSupabase(): Promise<boolean> {
  if (isSupabaseConfigured() && supabase !== missingConfigClient) return true;
  if (initPromise) return initPromise;
  initPromise = (async () => {
    try {
      const response = await fetch('/.netlify/functions/public-config', { headers: { Accept: 'application/json' } });
      if (!response.ok) return false;
      const data = await response.json();
      const url = typeof data?.supabaseUrl === 'string' ? data.supabaseUrl : '';
      const anonKey = typeof data?.supabaseAnonKey === 'string' ? data.supabaseAnonKey : '';
      if (!url || !anonKey) return false;
      setRuntimeSupabaseConfig(url, anonKey);
      supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, flowType: 'implicit' }
      });
      return true;
    } catch { return false; }
  })();
  return initPromise;
}

export type AuthSession = {
  idToken: string;
  accessToken: string;
  refreshToken: string;
  localId: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  expiresAt: number;
};

export function toAuthSession(session: any): AuthSession | null {
  if (!session?.access_token || !session.user) return null;
  const user = session.user;
  return {
    idToken: session.access_token,
    accessToken: session.access_token,
    refreshToken: session.refresh_token || '',
    localId: user.id,
    email: user.email || '',
    displayName: user.user_metadata?.full_name || user.user_metadata?.name || undefined,
    photoURL: user.user_metadata?.avatar_url || user.user_metadata?.picture || undefined,
    expiresAt: (session.expires_at || 0) * 1000
  };
}

export function readOAuthHash(): { accessToken: string; refreshToken: string; expiresAt: number } | null {
  if (typeof window === 'undefined' || !window.location.hash) return null;
  const raw = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash;
  const params = new URLSearchParams(raw);
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  if (!accessToken || !refreshToken) return null;
  return { accessToken, refreshToken, expiresAt: Number(params.get('expires_at') || 0) };
}

export function readOAuthError(): string | null {
  if (typeof window === 'undefined' || !window.location.hash) return null;
  const raw = window.location.hash.slice(1);
  const params = new URLSearchParams(raw);
  return params.get('error_description') || params.get('error') || null;
}

export function clearOAuthHash(): void {
  if (typeof window === 'undefined' || !window.location.hash) return;
  window.history.replaceState(window.history.state, document.title, `${window.location.pathname}${window.location.search}`);
}
