import { createBrowserClient } from '@supabase/ssr';

type BrowserClient = ReturnType<typeof createBrowserClient>;

// Singleton browser client. createBrowserClient internally tries to dedupe
// based on storage, but the realtime subclient is created per instance —
// so calling createClient() 30+ times throughout the app spawned 30+ realtime
// websockets racing to open/close, especially during React Strict Mode
// double-mounting in dev. One module-level instance fixes that.
let _client: BrowserClient | undefined;

export function createClient(): BrowserClient {
  if (typeof window === 'undefined') {
    // SSR: don't cache across requests — give a fresh client.
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  if (!_client) {
    _client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // @supabase/ssr reads sessions from cookies but does NOT auto-push the
    // JWT into the realtime client. Without this, any page that subscribes
    // to postgres_changes (booking detail, chat, etc.) joins as anon and
    // RLS silently drops every event. Bind once on first init.
    _client.auth.getSession().then(({ data: { session } }) => {
      if (session?.access_token) {
        _client!.realtime.setAuth(session.access_token);
      }
    });
    _client.auth.onAuthStateChange((_event, session) => {
      if (session?.access_token) {
        _client!.realtime.setAuth(session.access_token);
      }
    });
  }
  return _client;
}
