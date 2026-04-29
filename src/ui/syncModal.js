import {
  GIST_TOKEN_KEY, GIST_ID_KEY, GIST_LAST_SYNC_KEY,
  validateToken, pushToGist, pullFromGist, mergeEntries, fmtLastSync,
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
  if (!localStorage.getItem(GIST_TOKEN_KEY)) return;
  clearTimeout(syncTimeout);
  syncTimeout = setTimeout(async () => {
    setSyncStatus('syncing');
    const result = await pushToGist(entries);
    setSyncStatus(result.ok ? 'ok' : 'error');
    if (!result.ok) console.warn('[noted sync] push failed:', result.reason);
  }, 800);
}

// ── Manual pull ───────────────────────────────────────────────────────────────
async function pullAndMerge(renderFn) {
  if (!localStorage.getItem(GIST_TOKEN_KEY)) { showToast('Configure sync first'); return; }
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
          Your entries sync to a private GitHub Gist — only you can see it.
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
          with the <strong>gist</strong> scope. Classic tokens work fine.
        </p>
      </div>

      <div class="sync-section">
        <label class="sync-label">Gist ID <span class="sync-optional">(auto-created on first save)</span></label>
        <input id="sync-gist-id-input" type="text" class="sync-input"
          placeholder="Will be filled automatically" autocomplete="off"/>
        <p class="sync-hint">Already have a Noted gist? Paste its ID here to link it.</p>
      </div>

      <div class="sync-status-row">
        <span class="sync-status-label">Last sync:</span>
        <span id="sync-last-sync-display">—</span>
      </div>

      <div class="sync-actions">
        <button class="sync-btn sync-btn-primary"   id="sync-save-btn">Save &amp; connect</button>
        <button class="sync-btn sync-btn-secondary" id="sync-pull-btn">⬇ Pull from Gist</button>
        <button class="sync-btn sync-btn-danger"    id="sync-disconnect-btn">Disconnect</button>
      </div>
    </div>`;
  document.body.appendChild(el);
}

// ── Init ──────────────────────────────────────────────────────────────────────
export function initSyncModal({ renderFn }) {
  injectHTML();

  const overlay       = document.getElementById('sync-overlay');
  const tokenInput    = document.getElementById('sync-token-input');
  const gistIdInput   = document.getElementById('sync-gist-id-input');
  const lastSyncEl    = document.getElementById('sync-last-sync-display');
  const saveBtn       = document.getElementById('sync-save-btn');

  function openModal() {
    tokenInput.value       = localStorage.getItem(GIST_TOKEN_KEY) || '';
    gistIdInput.value      = localStorage.getItem(GIST_ID_KEY) || '';
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
    const token  = tokenInput.value.trim();
    const gistId = gistIdInput.value.trim();
    if (!token) { showToast('Enter a token first'); return; }

    saveBtn.disabled = true;
    saveBtn.textContent = 'Validating…';
    const valid = await validateToken(token);
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save & connect';

    if (!valid.ok) { showToast(`Token error: ${valid.reason}`); return; }

    localStorage.setItem(GIST_TOKEN_KEY, token);
    if (gistId) localStorage.setItem(GIST_ID_KEY, gistId);
    else        localStorage.removeItem(GIST_ID_KEY);

    closeModal();
    showToast('Sync connected ✓');
    setSyncStatus('syncing');
    const result = await pushToGist(entries);
    setSyncStatus(result.ok ? 'ok' : 'error');
    if (result.ok) showToast('First sync complete ✓');
  });

  document.getElementById('sync-pull-btn').addEventListener('click', async () => {
    closeModal();
    await pullAndMerge(renderFn);
  });

  document.getElementById('sync-disconnect-btn').addEventListener('click', () => {
    localStorage.removeItem(GIST_TOKEN_KEY);
    localStorage.removeItem(GIST_ID_KEY);
    localStorage.removeItem(GIST_LAST_SYNC_KEY);
    tokenInput.value  = '';
    gistIdInput.value = '';
    closeModal();
    setSyncStatus('idle');
    showToast('Sync disconnected');
  });

  setSyncStatus(localStorage.getItem(GIST_TOKEN_KEY) ? 'ok' : 'idle');
}
