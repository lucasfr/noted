// ── GitHub Private Repo Provider ──────────────────────────────────────────────
// Stores entries as a single JSON file in a private GitHub repo.

export const KEYS = {
  token:    'noted_gist_token',
  repo:     'noted_sync_repo',
  lastSync: 'noted_gist_last_sync',
};

const SYNC_FILE = 'noted-sync.json';

function headers(token) {
  return {
    'Authorization':        `Bearer ${token}`,
    'Accept':               'application/vnd.github+json',
    'Content-Type':         'application/json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

async function getFileSha(token, repo) {
  const res = await fetch(
    `https://api.github.com/repos/${repo}/contents/${SYNC_FILE}`,
    { headers: headers(token) }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data.sha || null;
}

// ── Provider interface ────────────────────────────────────────────────────────

export async function init(config) {
  const { token, repo } = config;
  try {
    const userRes = await fetch('https://api.github.com/user', { headers: headers(token) });
    if (userRes.status === 401) return { ok: false, error: 'Invalid token' };
    if (!userRes.ok)            return { ok: false, error: `HTTP ${userRes.status}` };

    const repoRes = await fetch(`https://api.github.com/repos/${repo}`, { headers: headers(token) });
    if (repoRes.status === 404) return { ok: false, error: `Repo "${repo}" not found — create it on GitHub first` };
    if (repoRes.status === 403) return { ok: false, error: 'Token missing repo scope' };
    if (!repoRes.ok)            return { ok: false, error: `Repo error: HTTP ${repoRes.status}` };

    const repoData = await repoRes.json();
    if (!repoData.private) return { ok: false, error: `Repo "${repo}" is public — use a private repo` };

    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

export async function push(entries) {
  const token = localStorage.getItem(KEYS.token);
  const repo  = localStorage.getItem(KEYS.repo);
  if (!token || !repo) return { ok: false, error: 'not-configured' };

  try {
    const sha = await getFileSha(token, repo);
    const content = btoa(unescape(encodeURIComponent(
      JSON.stringify({ synced_at: new Date().toISOString(), entries }, null, 2)
    )));

    const res = await fetch(
      `https://api.github.com/repos/${repo}/contents/${SYNC_FILE}`,
      {
        method: 'PUT',
        headers: headers(token),
        body: JSON.stringify({ message: 'noted sync', content, ...(sha ? { sha } : {}) }),
      }
    );

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
  const token = localStorage.getItem(KEYS.token);
  const repo  = localStorage.getItem(KEYS.repo);
  if (!token || !repo) return { ok: false, error: 'not-configured' };

  try {
    const res = await fetch(
      `https://api.github.com/repos/${repo}/contents/${SYNC_FILE}`,
      { headers: headers(token) }
    );
    if (res.status === 404) return { ok: false, error: 'File not found — push from another device first' };
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { ok: false, error: err.message || `HTTP ${res.status}` };
    }
    const data    = await res.json();
    const decoded = decodeURIComponent(escape(atob(data.content.replace(/\n/g, ''))));
    const content = JSON.parse(decoded);
    if (!Array.isArray(content.entries)) return { ok: false, error: 'invalid-format' };
    return { ok: true, data: content.entries };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

export async function clear() {
  const token = localStorage.getItem(KEYS.token);
  const repo  = localStorage.getItem(KEYS.repo);
  if (!token || !repo) return { ok: false, error: 'not-configured' };

  try {
    const sha = await getFileSha(token, repo);
    if (!sha) return { ok: true };
    const res = await fetch(
      `https://api.github.com/repos/${repo}/contents/${SYNC_FILE}`,
      {
        method: 'DELETE',
        headers: headers(token),
        body: JSON.stringify({ message: 'noted sync clear', sha }),
      }
    );
    return res.ok ? { ok: true } : { ok: false, error: `HTTP ${res.status}` };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

export const label = 'GitHub';
export const configFields = [
  { key: 'token', label: 'Personal Access Token', type: 'password', placeholder: 'ghp_xxxxxxxxxxxxxxxxxxxx', autocomplete: 'current-password' },
  { key: 'repo',  label: 'Private repository',    type: 'text',     placeholder: 'username/repo-name',      autocomplete: 'off' },
];
export const hint = `Generate a token at <a href="https://github.com/settings/tokens/new" target="_blank" rel="noopener">github.com/settings/tokens</a> with the <strong>repo</strong> scope, then create a private repo to use as storage.`;
