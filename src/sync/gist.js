// ── GitHub Private Repo Sync ──────────────────────────────────────────────────
// Stores entries as a single file in a private GitHub repo.
// The file is deleted and recreated on every push — keeps history minimal.
// Token needs 'repo' scope. User creates the private repo once manually.

export const SYNC_TOKEN_KEY     = 'noted_gist_token';   // reuse same key so existing tokens persist
export const SYNC_REPO_KEY      = 'noted_sync_repo';    // e.g. "lucasfr/noted-sync"
export const SYNC_LAST_SYNC_KEY = 'noted_gist_last_sync';
const SYNC_FILE                 = 'noted-sync.json';

function headers(token) {
  return {
    'Authorization':        `Bearer ${token}`,
    'Accept':               'application/vnd.github+json',
    'Content-Type':         'application/json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

// ── Get current file SHA (needed to delete/update) ───────────────────────────
async function getFileSha(token, repo) {
  const res = await fetch(
    `https://api.github.com/repos/${repo}/contents/${SYNC_FILE}`,
    { headers: headers(token) }
  );
  if (res.status === 404) return null;
  if (!res.ok) return null;
  const data = await res.json();
  return data.sha || null;
}

// ── Push: pull → merge → write (prevents overwriting remote changes) ─────────
export async function pushToGist(localEntries) {
  const token = localStorage.getItem(SYNC_TOKEN_KEY);
  const repo  = localStorage.getItem(SYNC_REPO_KEY);
  if (!token || !repo) return { ok: false, reason: 'not-configured' };

  try {
    // Always pull first so we never clobber remote changes
    const sha = await getFileSha(token, repo);
    let entriesToWrite = localEntries;

    if (sha) {
      const pullResult = await pullFromGist();
      if (pullResult.ok) {
        entriesToWrite = mergeEntries(localEntries, pullResult.entries);
      }
    }

    const content = btoa(unescape(encodeURIComponent(
      JSON.stringify({ synced_at: new Date().toISOString(), entries: entriesToWrite }, null, 2)
    )));

    const body = JSON.stringify({
      message: 'noted sync',
      content,
      ...(sha ? { sha } : {}),
    });

    const res = await fetch(
      `https://api.github.com/repos/${repo}/contents/${SYNC_FILE}`,
      { method: 'PUT', headers: headers(token), body }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { ok: false, reason: err.message || `HTTP ${res.status}` };
    }

    localStorage.setItem(SYNC_LAST_SYNC_KEY, new Date().toISOString());
    return { ok: true, merged: entriesToWrite };
  } catch (e) {
    return { ok: false, reason: e.message };
  }
}

// ── Pull ──────────────────────────────────────────────────────────────────────
export async function pullFromGist() {
  const token = localStorage.getItem(SYNC_TOKEN_KEY);
  const repo  = localStorage.getItem(SYNC_REPO_KEY);
  if (!token || !repo) return { ok: false, reason: 'not-configured' };

  try {
    const res = await fetch(
      `https://api.github.com/repos/${repo}/contents/${SYNC_FILE}`,
      { headers: headers(token) }
    );
    if (res.status === 404) return { ok: false, reason: 'File not found — push from another device first' };
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { ok: false, reason: err.message || `HTTP ${res.status}` };
    }
    const data    = await res.json();
    const decoded = decodeURIComponent(escape(atob(data.content.replace(/\n/g, ''))));
    const content = JSON.parse(decoded);
    if (!Array.isArray(content.entries)) return { ok: false, reason: 'invalid-format' };
    return { ok: true, entries: content.entries };
  } catch (e) {
    return { ok: false, reason: e.message };
  }
}

// ── Merge: union by id, newer updatedAt wins on conflict ────────────────────
// Falls back to timestamp for entries created before updatedAt was introduced.
export function mergeEntries(local, remote) {
  const map      = new Map();
  const lastSync  = localStorage.getItem(SYNC_LAST_SYNC_KEY);

  // Seed with local
  local.forEach(e => map.set(e.id, e));

  // Remote: only add/overwrite under safe conditions
  remote.forEach(e => {
    const existing = map.get(e.id);
    if (!existing) {
      // Entry is absent locally. Only restore it if it was created AFTER the
      // last sync — meaning it's a genuine new entry from another device.
      // If it predates (or matches) the last sync, we deleted it locally.
      if (!lastSync || (e.timestamp > new Date(lastSync).getTime())) {
        map.set(e.id, e);
      }
    } else {
      const localTs  = existing.updatedAt  || existing.timestamp;
      const remoteTs = e.updatedAt         || e.timestamp;
      if (remoteTs > localTs) map.set(e.id, e);
    }
  });

  return Array.from(map.values()).sort((a, b) => a.timestamp - b.timestamp);
}

// ── Startup sync: pull → merge → push (silent, runs on every app load) ─────────
export async function pullOnStartup(localEntries) {
  const token = localStorage.getItem(SYNC_TOKEN_KEY);
  const repo  = localStorage.getItem(SYNC_REPO_KEY);
  if (!token || !repo) return { ok: false, reason: 'not-configured' };

  const pullResult = await pullFromGist();
  if (!pullResult.ok) return { ok: false, reason: pullResult.reason };

  const merged = mergeEntries(localEntries, pullResult.entries);

  // Only push if merge added anything new from remote
  const hasNew = merged.length !== localEntries.length ||
    merged.some((e, i) => e.updatedAt !== localEntries[i]?.updatedAt);

  if (hasNew) {
    await pushToGist(merged);
  }

  return { ok: true, merged, hasNew };
}

// ── First-connect sync: pull → merge → push ───────────────────────────────────
// Used when the user first configures sync on a device that already has entries.
// Ensures no data is lost in either direction.
export async function syncOnConnect(localEntries) {
  const pullResult = await pullFromGist();

  // If repo is empty (first ever device), just push
  if (!pullResult.ok) {
    return pushToGist(localEntries);
  }

  // Merge both sides and push the result
  const merged = mergeEntries(localEntries, pullResult.entries);
  return { ...(await pushToGist(merged)), merged };
}

// ── Validate token has repo scope ─────────────────────────────────────────────
export async function validateToken(token, repo) {
  try {
    // Check token is valid
    const userRes = await fetch('https://api.github.com/user', { headers: headers(token) });
    if (userRes.status === 401) return { ok: false, reason: 'Invalid token' };
    if (!userRes.ok)            return { ok: false, reason: `HTTP ${userRes.status}` };

    // Check repo exists and is accessible
    const repoRes = await fetch(`https://api.github.com/repos/${repo}`, { headers: headers(token) });
    if (repoRes.status === 404) return { ok: false, reason: `Repo "${repo}" not found — create it on GitHub first` };
    if (repoRes.status === 403) return { ok: false, reason: 'Token missing repo scope' };
    if (!repoRes.ok)            return { ok: false, reason: `Repo error: HTTP ${repoRes.status}` };

    const repoData = await repoRes.json();
    if (!repoData.private) return { ok: false, reason: `Repo "${repo}" is public — use a private repo` };

    return { ok: true };
  } catch (e) {
    return { ok: false, reason: e.message };
  }
}

// ── Format last sync time ─────────────────────────────────────────────────────
export function fmtLastSync() {
  const raw = localStorage.getItem(SYNC_LAST_SYNC_KEY);
  if (!raw) return 'Never';
  const diff = Date.now() - new Date(raw).getTime();
  if (diff < 60_000)    return 'Just now';
  if (diff < 3600_000)  return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86400_000) return `${Math.floor(diff / 3600_000)}h ago`;
  return new Date(raw).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}
