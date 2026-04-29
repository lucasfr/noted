import {
  SYNC_TOKEN_KEY, SYNC_REPO_KEY, SYNC_LAST_SYNC_KEY,
  validateToken, pushToGist, pullFromGist, mergeEntries, fmtLastSync, syncOnConnect,
} from '../sync/gist.js';
import { entries, setEntries, save } from '../storage.js';
import { showToast } from './modals.js';

// ── Sync status indicator ─────────────────────────────────────────────────────
export function setSyncStatus(state) {
  const el = document.getElementById('sync-indicator');
  if (!el) return;
  el.dataset.syncState = state;
  el.title = {
    idle:    'Sync: not configured',
    syncing: 'Syncing…',
    ok:      `Synced — ${fmtLastSync()}`,
    error:   'Sync failed',
  }[state] || '';
}

// ── Auto-sync hook (called from storage.save) ─────────────────────────────────
let syncTimeout = null;
export function scheduleSyncAfterSave() {
  if (!localStorage.getItem(SYNC_TOKEN_KEY)) return;
  clearTimeout(syncTimeout);
  syncTimeout = setTimeout(async () => {
    setSyncStatus('syncing');
    const result = await pushToGist(entries);
    setSyncStatus(result.ok ? 'ok' : 'error');
    if (!result.ok) console.warn('[noted sync] push failed:', result.reason);
  }, 800);
}

// ── Force immediate sync (⌘S) ─────────────────────────────────────────────────
export async function forceSyncNow() {
  if (!localStorage.getItem(SYNC_TOKEN_KEY)) { showToast('Sync not configured'); return; }
  clearTimeout(syncTimeout);
  setSyncStatus('syncing');
  const result = await pushToGist(entries);
  setSyncStatus(result.ok ? 'ok' : 'error');
  if (result.ok) showToast('Synced ✓');
  else showToast(`Sync failed: ${result.reason}`);
}

// ── Manual pull ───────────────────────────────────────────────────────────────
async function pullAndMerge(renderFn) {
  if (!localStorage.getItem(SYNC_TOKEN_KEY)) { showToast('Configure sync first'); return; }
  setSyncStatus('syncing');
  const result = await pullFromGist();
  if (!result.ok) { setSyncStatus('error'); showToast(`Sync failed: ${result.reason}`); return; }
  setEntries(mergeEntries(entries, result.entries));
  save(showToast);
  renderFn();
  setSyncStatus('ok');
  showToast(`Pulled ${result.entries.length} entries ✓`);
}

// ── Modal ─────────────────────────────────────────────────────────────────────
function injectHTML() {
  const el = document.createElement('div');
  el.id        = 'sync-overlay';
  el.className = 'sync-overlay';
  el.innerHTML = `
    <div class="sync-card">
      <span class="sync-title">GitHub Sync</span>
      <button class="sync-close" id="sync-close">
        <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" width="16" height="16">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>

      <div class="sync-section">
        <p class="sync-desc">
          Your entries sync to a private GitHub repository — only you can see it.
          Any device with the same token stays in sync automatically.
        </p>
        <label class="sync-label" for="sync-token-input">Personal Access Token</label>
        <div class="sync-token-row">
          <input id="sync-token-input" type="password" class="sync-input"
            placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
            autocomplete="off" autocorrect="off" spellcheck="false"/>
          <button class="sync-btn sync-btn-secondary" id="sync-token-reveal">👁</button>
        </div>
        <p class="sync-hint">
          Generate at <a href="https://github.com/settings/tokens/new" target="_blank" rel="noopener">github.com/settings/tokens</a>
          with the <strong>repo</strong> scope. Classic tokens work fine.
        </p>
      </div>

      <div class="sync-section">
        <label class="sync-label">Private repository</label>
        <input id="sync-repo-input" type="text" class="sync-input"
          placeholder="username/repo-name" autocomplete="off" spellcheck="false"/>
        <p class="sync-hint">
          Create a private repo on GitHub first, then paste its name here (e.g. <strong>lucasfr/noted-sync</strong>).
        </p>
      </div>

      <div class="sync-status-row">
        <span class="sync-status-label">Last sync:</span>
        <span id="sync-last-sync-display">—</span>
      </div>

      <div class="sync-actions">
        <button class="sync-btn sync-btn-primary"   id="sync-save-btn">Save &amp; connect</button>
        <button class="sync-btn sync-btn-secondary" id="sync-pull-btn">⬇ Pull from repo</button>
        <button class="sync-btn sync-btn-danger"    id="sync-disconnect-btn">Disconnect</button>
      </div>
    </div>`;
  document.body.appendChild(el);
}

// ── Init ──────────────────────────────────────────────────────────────────────
export function initSyncModal({ renderFn }) {
  injectHTML();

  const overlay    = document.getElementById('sync-overlay');
  const tokenInput = document.getElementById('sync-token-input');
  const repoInput  = document.getElementById('sync-repo-input');
  const lastSyncEl = document.getElementById('sync-last-sync-display');
  const saveBtn    = document.getElementById('sync-save-btn');

  function openModal() {
    tokenInput.value       = localStorage.getItem(SYNC_TOKEN_KEY) || '';
    repoInput.value        = localStorage.getItem(SYNC_REPO_KEY) || '';
    lastSyncEl.textContent = fmtLastSync();
    overlay.classList.add('open');
  }
  function closeModal() { overlay.classList.remove('open'); }

  document.getElementById('sync-btn')?.addEventListener('click', openModal);
  document.getElementById('drawer-sync-btn')?.addEventListener('click', () => {
    document.getElementById('drawer-overlay')?.classList.remove('open');
    openModal();
  });

  document.getElementById('sync-close').addEventListener('click', closeModal);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });

  document.getElementById('sync-token-reveal').addEventListener('click', () => {
    tokenInput.type = tokenInput.type === 'password' ? 'text' : 'password';
  });

  saveBtn.addEventListener('click', async () => {
    const token = tokenInput.value.trim();
    const repo  = repoInput.value.trim();
    if (!token) { showToast('Enter a token first'); return; }
    if (!repo)  { showToast('Enter a repository name'); return; }
    if (!repo.includes('/')) { showToast('Format: username/repo-name'); return; }

    saveBtn.disabled    = true;
    saveBtn.textContent = 'Validating…';
    const valid = await validateToken(token, repo);
    saveBtn.disabled    = false;
    saveBtn.textContent = 'Save & connect';

    if (!valid.ok) { showToast(valid.reason); return; }

    localStorage.setItem(SYNC_TOKEN_KEY, token);
    localStorage.setItem(SYNC_REPO_KEY, repo);

    closeModal();
    showToast('Sync connected ✓');
    setSyncStatus('syncing');
    const result = await syncOnConnect(entries);
    if (result.ok) {
      if (result.merged) {
        setEntries(result.merged);
        save(showToast);
        renderFn();
        showToast(`Merged & synced — ${result.merged.length} entries ✓`);
      } else {
        showToast('First sync complete ✓');
      }
    }
    setSyncStatus(result.ok ? 'ok' : 'error');
    if (!result.ok) showToast(`Sync failed: ${result.reason}`);
  });

  document.getElementById('sync-pull-btn').addEventListener('click', async () => {
    closeModal();
    await pullAndMerge(renderFn);
  });

  document.getElementById('sync-disconnect-btn').addEventListener('click', () => {
    localStorage.removeItem(SYNC_TOKEN_KEY);
    localStorage.removeItem(SYNC_REPO_KEY);
    localStorage.removeItem(SYNC_LAST_SYNC_KEY);
    tokenInput.value = '';
    repoInput.value  = '';
    closeModal();
    setSyncStatus('idle');
    showToast('Sync disconnected');
  });

  setSyncStatus(localStorage.getItem(SYNC_TOKEN_KEY) ? 'ok' : 'idle');
}
