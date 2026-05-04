// ── Supabase Provider ─────────────────────────────────────────────────────────
// Stores entries in a Supabase table using anonymous auth.
// Each user's data is isolated by their anon session uid via RLS.
//
// Required table schema:
//
//   create table entries (
//     id text primary key,
//     data jsonb not null,
//     updated_at timestamptz default now()
//   );
//   alter table entries enable row level security;
//   create policy "owner only" on entries
//     using (auth.uid()::text = (data->>'userId'));
//
// Auth: Supabase anonymous sign-in (no email required).
// The session is persisted in localStorage under 'noted_supabase_session'.

export const KEYS = {
  url:      'noted_supabase_url',
  anonKey:  'noted_supabase_anon_key',
  session:  'noted_supabase_session',
  lastSync: 'noted_supabase_last_sync',
};

function apiHeaders(anonKey, accessToken) {
  return {
    'Content-Type':  'application/json',
    'apikey':        anonKey,
    'Authorization': `Bearer ${accessToken}`,
    'Prefer':        'resolution=merge-duplicates',
  };
}

// ── Session management ────────────────────────────────────────────────────────

async function getOrCreateSession(url, anonKey) {
  const stored = localStorage.getItem(KEYS.session);
  if (stored) {
    try {
      const session = JSON.parse(stored);
      // Refresh if expiring within 5 minutes
      if (session.expires_at && Date.now() / 1000 < session.expires_at - 300) {
        return { ok: true, accessToken: session.access_token, userId: session.user.id };
      }
    } catch { /* fall through to sign in */ }
  }

  try {
    const res = await fetch(`${url}/auth/v1/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': anonKey },
      body: JSON.stringify({}), // anonymous sign-in
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { ok: false, error: err.error_description || err.msg || `HTTP ${res.status}` };
    }
    const data = await res.json();
    localStorage.setItem(KEYS.session, JSON.stringify(data));
    return { ok: true, accessToken: data.access_token, userId: data.user.id };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

// ── Provider interface ────────────────────────────────────────────────────────

export async function init(config) {
  const { url, anonKey } = config;
  if (!url || !anonKey) return { ok: false, error: 'URL and anon key are required' };

  try {
    // Validate by querying the entries table with the anon key
    const res = await fetch(`${url}/rest/v1/entries?limit=1`, {
      headers: { 'apikey': anonKey, 'Authorization': `Bearer ${anonKey}` },
    });
    if (res.status === 401) return { ok: false, error: 'Invalid anon key' };
    if (res.status === 404) return { ok: false, error: 'Table "entries" not found — did you run the setup SQL?' };
    if (!res.ok) return { ok: false, error: `Could not reach Supabase: HTTP ${res.status}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: `Could not reach Supabase: ${e.message}` };
  }
}

export async function push(entries) {
  const url     = localStorage.getItem(KEYS.url);
  const anonKey = localStorage.getItem(KEYS.anonKey);
  if (!url || !anonKey) return { ok: false, error: 'not-configured' };

  const session = await getOrCreateSession(url, anonKey);
  if (!session.ok) return { ok: false, error: session.error };

  try {
    // Upsert all entries — Supabase handles merge by primary key
    const rows = entries.map(e => ({
      id:         e.id,
      data:       { ...e, userId: session.userId },
      updated_at: new Date(e.updatedAt || e.timestamp).toISOString(),
    }));

    const res = await fetch(`${url}/rest/v1/entries`, {
      method:  'POST',
      headers: apiHeaders(anonKey, session.accessToken),
      body:    JSON.stringify(rows),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { ok: false, error: err.message || `HTTP ${res.status}` };
    }

    localStorage.setItem(KEYS.lastSync, new Date().toISOString());
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

export async function pull() {
  const url     = localStorage.getItem(KEYS.url);
  const anonKey = localStorage.getItem(KEYS.anonKey);
  if (!url || !anonKey) return { ok: false, error: 'not-configured' };

  const session = await getOrCreateSession(url, anonKey);
  if (!session.ok) return { ok: false, error: session.error };

  try {
    const res = await fetch(`${url}/rest/v1/entries?select=data&order=updated_at.asc`, {
      headers: {
        'apikey':        anonKey,
        'Authorization': `Bearer ${session.accessToken}`,
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { ok: false, error: err.message || `HTTP ${res.status}` };
    }

    const rows = await res.json();
    const entries = rows.map(r => r.data);
    return { ok: true, data: entries };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

export async function clear() {
  const url     = localStorage.getItem(KEYS.url);
  const anonKey = localStorage.getItem(KEYS.anonKey);
  if (!url || !anonKey) return { ok: false, error: 'not-configured' };

  const session = await getOrCreateSession(url, anonKey);
  if (!session.ok) return { ok: false, error: session.error };

  try {
    const res = await fetch(`${url}/rest/v1/entries?id=neq.null`, {
      method:  'DELETE',
      headers: {
        'apikey':        anonKey,
        'Authorization': `Bearer ${session.accessToken}`,
      },
    });
    return res.ok ? { ok: true } : { ok: false, error: `HTTP ${res.status}` };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

export const label = 'Supabase';
export const configFields = [
  { key: 'url',     label: 'Project URL',  type: 'url',      placeholder: 'https://xxxx.supabase.co', autocomplete: 'url' },
  { key: 'anonKey', label: 'Anon key',     type: 'password', placeholder: 'eyJhbGc…',                 autocomplete: 'current-password' },
];
export const hint = `Create a free project at <a href="https://supabase.com" target="_blank" rel="noopener">supabase.com</a>, then find your URL and anon key under Project Settings → API. <a href="https://github.com/lucasfr/noted#supabase-sync" target="_blank" rel="noopener">Setup guide →</a>`;
