// ── GitHub Gist Sync ──────────────────────────────────────────────────────────
export const GIST_TOKEN_KEY     = 'noted_gist_token';
export const GIST_ID_KEY        = 'noted_gist_id';
export const GIST_LAST_SYNC_KEY = 'noted_gist_last_sync';
const GIST_FILENAME             = 'noted-sync.json';

function headers(token) {
  return {
    'Authorization':        `Bearer ${token}`,
    'Accept':               'application/vnd.github+json',
    'Content-Type':         'application/json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

export async function pushToGist(entries) {
  const token  = localStorage.getItem(GIST_TOKEN_KEY);
  if (!token) return { ok: false, reason: 'no-token' };

  const gistId = localStorage.getItem(GIST_ID_KEY);
  const body   = JSON.stringify({
    description: 'Noted! — sync backup (do not edit manually)',
    public:      false,
    files: {
      [GIST_FILENAME]: {
        content: JSON.stringify({ synced_at: new Date().toISOString(), entries }, null, 2),
      },
    },
  });

  try {
    const res = await fetch(
      gistId ? `https://api.github.com/gists/${gistId}` : 'https://api.github.com/gists',
      { method: gistId ? 'PATCH' : 'POST', headers: headers(token), body }
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { ok: false, reason: err.message || `HTTP ${res.status}` };
    }
    const data = await res.json();
    if (!gistId) localStorage.setItem(GIST_ID_KEY, data.id);
    localStorage.setItem(GIST_LAST_SYNC_KEY, new Date().toISOString());
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: e.message };
  }
}

export async function pullFromGist() {
  const token  = localStorage.getItem(GIST_TOKEN_KEY);
  const gistId = localStorage.getItem(GIST_ID_KEY);
  if (!token || !gistId) return { ok: false, reason: 'not-configured' };

  try {
    const res = await fetch(`https://api.github.com/gists/${gistId}`, { headers: headers(token) });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { ok: false, reason: err.message || `HTTP ${res.status}` };
    }
    const data    = await res.json();
    const file    = data.files?.[GIST_FILENAME];
    if (!file) return { ok: false, reason: 'file-not-found' };
    const content = JSON.parse(file.content);
    if (!Array.isArray(content.entries)) return { ok: false, reason: 'invalid-format' };
    return { ok: true, entries: content.entries };
  } catch (e) {
    return { ok: false, reason: e.message };
  }
}

export function mergeEntries(local, remote) {
  const map = new Map();
  local.forEach(e => map.set(e.id, e));
  remote.forEach(e => map.set(e.id, e));
  return Array.from(map.values()).sort((a, b) => a.timestamp - b.timestamp);
}

export async function validateToken(token) {
  try {
    const res = await fetch('https://api.github.com/gists?per_page=1', { headers: headers(token) });
    if (res.status === 401) return { ok: false, reason: 'Invalid token' };
    if (res.status === 403) return { ok: false, reason: 'Token missing gist scope' };
    if (!res.ok)            return { ok: false, reason: `HTTP ${res.status}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: e.message };
  }
}

export function fmtLastSync() {
  const raw = localStorage.getItem(GIST_LAST_SYNC_KEY);
  if (!raw) return 'Never';
  const diff = Date.now() - new Date(raw).getTime();
  if (diff < 60_000)    return 'Just now';
  if (diff < 3600_000)  return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86400_000) return `${Math.floor(diff / 3600_000)}h ago`;
  return new Date(raw).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}
