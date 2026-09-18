# DocBit India — Authentication Setup

## Netlify environment variables

Recommended in Netlify:

### Public/browser configuration
- `VITE_SUPABASE_URL` — optional when the public-config Function is configured; recommended for local/Vite fallback.
- `VITE_SUPABASE_ANON_KEY` — optional when the public-config Function is configured; recommended for local/Vite fallback.
- `VITE_SITE_URL` — optional; production defaults to `https://docbit.in`.

### Server configuration
- `SUPABASE_SERVICE_ROLE_KEY` — required by account/billing Functions.
- `SUPABASE_URL` — supported as the server-side project URL fallback. It is never returned as a secret; only the public Supabase project URL is returned by `public-config`.
- `SUPABASE_ANON_KEY` — optional fallback for `public-config` if `VITE_SUPABASE_ANON_KEY` is not present.

Never put `SUPABASE_SERVICE_ROLE_KEY` in any `VITE_*` variable. The public-config Function must never return the service-role key.

## Google OAuth

The application redirects Google authentication to:

- Production: `https://docbit.in/auth/callback`
- Netlify deploy: `https://<site>.netlify.app/auth/callback`
- Local Netlify Dev: `http://localhost:8888/auth/callback`

Add the exact URLs you intend to use to Supabase Dashboard → Authentication → URL Configuration → Redirect URLs.

Enable Google under Authentication → Providers → Google and use Supabase's generated callback URL in the Google OAuth client configuration.

## Authentication flow

1. User selects Google or submits email/password.
2. Supabase creates/restores the authenticated session.
3. Google returns to `/auth/callback`.
4. The client consumes the OAuth URL fragment and immediately removes tokens from the browser URL.
5. The session is persisted by Supabase.
6. The application ensures a `profiles` row exists and synchronizes the Google name/photo when available.
7. The user is redirected to `/workspace`.

The callback is deliberately separate from the signup page. This prevents an OAuth response from being mistaken for a fresh signup form submission.

## Local development

```bash
npm install
npm run netlify:dev
```

This runs Vite through Netlify Dev so `/.netlify/functions/*` is available locally. If the Vite public variables are absent, the application can obtain the public Supabase configuration from `/.netlify/functions/public-config`.

## Existing Supabase database

Database migrations are intentionally not included in this application ZIP. The production Supabase database is managed separately. The application expects the existing `public.profiles` table and authentication configuration to already exist.
