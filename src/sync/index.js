// ── Sync Manager ──────────────────────────────────────────────────────────────
// Provider-agnostic sync orchestration.
// Providers live in ./providers/ and each export: init, push, pull, clear,
// label, configFields, hint, and KEYS.

import * as github   from './providers/github.js';
import * as supabase from './providers/supabase.js';

export const PROVIDERS = { github, supabase };
export const PROVIDER_KEY  = 'noted_sync_provider';
export const SYNC_TIMER_KEY = 'noted_sync_interval';

// Default sync interval: 5 minutes
export const DEFAULT_INTERVAL = 5 * 60 * 1000;

// ── Active provider ───────────────────────────────────────────────────────────

export function getActiveProvider() {
  const id = localStorage.getItem(PROVIDER_KEY);
  return id ? PROVIDERS[id] : null;
}

export function getActiveProviderId() {
  return localStorage.getItem(PROVIDER_KEY) || null;
}

export function isConfigured() {
  const provider = getActiveProvider();
  if (!provider) return false;
  return provider.configFields.every(f => !!localStorage.getItem(provider.KEYS[f.key]));
}

// ── Merge logic (shared across providers) ────────────────────────────────────
// Union by id, newer updatedAt wins on conflict.
// Entries absent locally that predate the last sync are treated as deleted.
export function mergeEntries(local, remote, lastSyncKey) {
  const map      = new Map();
  const lastSync = localStorage.getItem(lastSyncKey);

  local.forEach(e => map.set(e.id, e));

  remote.forEach(e => {
    const existing = map.get(e.id);
    if (!existing) {
      const wasSyncedBefore   = !!lastSync;
      const localHasEntries   = local.length > 0;
      const entryPredatesSync = lastSync && e.timestamp <= new Date(lastSync).getTime();
      const likelyDeleted     = wasSyncedBefore && localHasEntries && entryPredatesSync;
      if (!likelyDeleted) map.set(e.id, e);
    } else {
      const localTs  = existing.updatedAt || existing.timestamp;
      const remoteTs = e.updatedAt        || e.timestamp;
      if (remoteTs > localTs) map.set(e.id, e);
    }
  });

  return Array.from(map.values()).sort((a, b) => a.timestamp - b.timestamp);
}

// ── Core sync operations ──────────────────────────────────────────────────────

export async function syncPush(localEntries) {
  const provider = getActiveProvider();
  if (!provider) return { ok: false, error: 'not-configured' };

  // Pull first to avoid clobbering remote changes
  const pullResult = await provider.pull();
  let toWrite = localEntries;

  if (pullResult.ok && pullResult.data) {
    toWrite = mergeEntries(localEntries, pullResult.data, provider.KEYS.lastSync);
  }

  const result = await provider.push(toWrite);
  return { ...result, merged: toWrite };
}

export async function syncPull(localEntries) {
  const provider = getActiveProvider();
  if (!provider) return { ok: false, error: 'not-configured' };

  const result = await provider.pull();
  if (!result.ok) return result;

  const merged = mergeEntries(localEntries, result.data, provider.KEYS.lastSync);
  return { ok: true, data: merged };
}

// First connect: bidirectional merge then push
export async function syncOnConnect(localEntries) {
  const provider = getActiveProvider();
  if (!provider) return { ok: false, error: 'not-configured' };

  const pullResult = await provider.pull();
  if (!pullResult.ok) {
    // Remote is empty — just push
    return provider.push(localEntries).then(r => ({ ...r, merged: localEntries }));
  }

  const merged = mergeEntries(localEntries, pullResult.data, provider.KEYS.lastSync);
  const pushResult = await provider.push(merged);
  return { ...pushResult, merged };
}

// Startup pull: silent, runs on every load
export async function pullOnStartup(localEntries) {
  if (!isConfigured()) return { ok: false, error: 'not-configured' };
  const provider = getActiveProvider();

  const pullResult = await provider.pull();
  if (!pullResult.ok) return pullResult;

  const merged = mergeEntries(localEntries, pullResult.data, provider.KEYS.lastSync);
  const hasNew = merged.length !== localEntries.length ||
    merged.some((e, i) => (e.updatedAt || e.timestamp) !== (localEntries[i]?.updatedAt || localEntries[i]?.timestamp));

  if (hasNew) await provider.push(merged);

  return { ok: true, merged, hasNew };
}

// ── Last sync display ─────────────────────────────────────────────────────────
export function fmtLastSync() {
  const provider = getActiveProvider();
  if (!provider) return 'Never';
  const raw = localStorage.getItem(provider.KEYS.lastSync);
  if (!raw) return 'Never';
  const diff = Date.now() - new Date(raw).getTime();
  if (diff < 60_000)    return 'Just now';
  if (diff < 3600_000)  return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86400_000) return `${Math.floor(diff / 3600_000)}h ago`;
  return new Date(raw).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}
