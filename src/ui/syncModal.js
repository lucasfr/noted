import {
  PROVIDERS, PROVIDER_KEY, DEFAULT_INTERVAL, SYNC_TIMER_KEY,
  isConfigured, getActiveProvider, getActiveProviderId,
  syncPush, syncPull, syncOnConnect, pullOnStartup, fmtLastSync,
} from '../sync/index.js';
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

// ── Auto-sync on save ─────────────────────────────────────────────────────────
let syncTimeout = null;
let _renderFn   = null;

export function scheduleSyncAfterSave() {
  if (!isConfigured()) return;
  clearTimeout(syncTimeout);
  syncTimeout = setTimeout(() => _doSync(), 800);
}

// ── Periodic timer ────────────────────────────────────────────────────────────
let timerInterval = null;

function startTimer() {
  clearInterval(timerInterval);
  const ms = parseInt(localStorage.getItem(SYNC_TIMER_KEY)) || DEFAULT_INTERVAL;
  timerInterval = setInterval(() => _doSync(), ms);
}

function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
}

// ── Core sync ─────────────────────────────────────────────────────────────────
async function _doSync() {
  if (!isConfigured()) return;
  setSyncStatus('syncing');
  const result = await syncPush(entries);
  if (result.ok && result.merged && result.merged.length !== entries.length) {
    setEntries(result.merged);
    save(showToast);
    _renderFn?.();
  }
  setSyncStatus(result.ok ? 'ok' : 'error');
  if (!result.ok) console.warn('[noted sync] push failed:', result.error);
}

// ── Force immediate sync (⌘S) ─────────────────────────────────────────────────
export async function forceSyncNow() {
  if (!isConfigured()) { showToast('Sync not configured'); return; }
  clearTimeout(syncTimeout);
  setSyncStatus('syncing');
  const result = await syncPush(entries);
  if (result.ok && result.merged && result.merged.length !== entries.length) {
    setEntries(result.merged);
    save(showToast);
    _renderFn?.();
  }
  setSyncStatus(result.ok ? 'ok' : 'error');
  if (result.ok) showToast('Synced ✓');
  else showToast(`Sync failed: ${result.error}`);
}

// ── Manual pull ───────────────────────────────────────────────────────────────
async function pullAndMerge() {
  if (!isConfigured()) { showToast('Configure sync first'); return; }
  setSyncStatus('syncing');
  const result = await syncPull(entries);
  if (!result.ok) { setSyncStatus('error'); showToast(`Sync failed: ${result.error}`); return; }
  setEntries(result.data);
  save(showToast);
  _renderFn?.();
  setSyncStatus('ok');
  showToast(`Pulled ${result.data.length} entries ✓`);
}

// ── HTML injection ────────────────────────────────────────────────────────────
function injectHTML() {
  const intervalOptions = [
    { value: 60_000,      label: '1 minute' },
    { value: 5 * 60_000,  label: '5 minutes' },
    { value: 15 * 60_000, label: '15 minutes' },
    { value: 30 * 60_000, label: '30 minutes' },
  ];

  const el = document.createElement('div');
  el.id        = 'sync-overlay';
  el.className = 'sync-overlay';
  el.innerHTML = `
    <div class="sync-card">
      <span class="sync-title">Sync</span>
      <button class="sync-close" id="sync-close">
        <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" width="16" height="16">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>

      <div class="sync-section">
        <label class="sync-label" for="sync-provider-select">Provider</label>
        <select id="sync-provider-select" class="sync-input">
          <option value="">— choose —</option>
          ${Object.entries(PROVIDERS).map(([id, p]) =>
            `<option value="${id}">${p.label}</option>`
          ).join('')}
        </select>
      </div>

      <div id="sync-fields-container"></div>

      <div id="sync-hint-container" class="sync-hint" style="display:none"></div>

      <div class="sync-section">
        <label class="sync-label" for="sync-interval-select">Auto-sync interval</label>
        <select id="sync-interval-select" class="sync-input">
          ${intervalOptions.map(o =>
            `<option value="${o.value}">${o.label}</option>`
          ).join('')}
        </select>
        <p class="sync-hint">Sync also runs on every save and on app open/close.</p>
      </div>

      <div class="sync-status-row">
        <span class="sync-status-label">Last sync:</span>
        <span id="sync-last-sync-display">—</span>
      </div>

      <p class="sync-hint sync-password-hint">
        Your browser or password manager can save these credentials.
      </p>

      <div class="sync-actions">
        <button class="sync-btn sync-btn-primary"   id="sync-save-btn">Save &amp; connect</button>
        <button class="sync-btn sync-btn-secondary" id="sync-force-btn">↑ Force sync</button>
        <button class="sync-btn sync-btn-secondary" id="sync-pull-btn">⬇ Pull remote</button>
        <button class="sync-btn sync-btn-danger"    id="sync-disconnect-btn">Disconnect</button>
      </div>
    </div>`;
  document.body.appendChild(el);
}

// ── Render provider config fields ─────────────────────────────────────────────
function renderProviderFields(providerId) {
  const container  = document.getElementById('sync-fields-container');
  const hintEl     = document.getElementById('sync-hint-container');
  container.innerHTML = '';

  if (!providerId || !PROVIDERS[providerId]) {
    hintEl.style.display = 'none';
    return;
  }

  const provider = PROVIDERS[providerId];

  provider.configFields.forEach(field => {
    const section = document.createElement('div');
    section.className = 'sync-section';
    section.innerHTML = `
      <label class="sync-label" for="sync-field-${field.key}">${field.label}</label>
      <div class="sync-token-row">
        <input
          id="sync-field-${field.key}"
          type="${field.type}"
          class="sync-input"
          placeholder="${field.placeholder}"
          autocomplete="${field.autocomplete || 'off'}"
          autocorrect="off"
          spellcheck="false"
          value="${localStorage.getItem(provider.KEYS[field.key]) || ''}"
        />
        ${field.type === 'password' ? `<button class="sync-btn sync-btn-secondary sync-reveal-btn" data-target="sync-field-${field.key}">👁</button>` : ''}
      </div>`;
    container.appendChild(section);
  });

  // Reveal toggles
  container.querySelectorAll('.sync-reveal-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = document.getElementById(btn.dataset.target);
      if (input) input.type = input.type === 'password' ? 'text' : 'password';
    });
  });

  hintEl.innerHTML     = provider.hint || '';
  hintEl.style.display = provider.hint ? 'block' : 'none';
}

// ── Read current field values ─────────────────────────────────────────────────
function readFieldValues(providerId) {
  const provider = PROVIDERS[providerId];
  if (!provider) return {};
  const config = {};
  provider.configFields.forEach(f => {
    const input = document.getElementById(`sync-field-${f.key}`);
    if (input) config[f.key] = input.value.trim();
  });
  return config;
}

// ── Save config to localStorage ───────────────────────────────────────────────
function persistConfig(providerId, config) {
  const provider = PROVIDERS[providerId];
  provider.configFields.forEach(f => {
    if (config[f.key]) localStorage.setItem(provider.KEYS[f.key], config[f.key]);
  });
  localStorage.setItem(PROVIDER_KEY, providerId);
}

// ── Clear all provider configs ────────────────────────────────────────────────
function clearAllConfigs() {
  Object.values(PROVIDERS).forEach(p => {
    p.configFields.forEach(f => localStorage.removeItem(p.KEYS[f.key]));
    if (p.KEYS.lastSync) localStorage.removeItem(p.KEYS.lastSync);
    if (p.KEYS.session)  localStorage.removeItem(p.KEYS.session);
  });
  localStorage.removeItem(PROVIDER_KEY);
}

// ── Init ──────────────────────────────────────────────────────────────────────
export function initSyncModal({ renderFn }) {
  _renderFn = renderFn;
  injectHTML();

  const overlay        = document.getElementById('sync-overlay');
  const providerSelect = document.getElementById('sync-provider-select');
  const intervalSelect = document.getElementById('sync-interval-select');
  const lastSyncEl     = document.getElementById('sync-last-sync-display');
  const saveBtn        = document.getElementById('sync-save-btn');

  function updateGating() {
    const connected = isConfigured();
    document.getElementById('sync-force-btn').disabled      = !connected;
    document.getElementById('sync-pull-btn').disabled       = !connected;
    document.getElementById('sync-disconnect-btn').disabled = !connected;
  }

  function openModal() {
    const activeId = getActiveProviderId();
    providerSelect.value         = activeId || '';
    intervalSelect.value         = localStorage.getItem(SYNC_TIMER_KEY) || DEFAULT_INTERVAL;
    lastSyncEl.textContent       = fmtLastSync();
    renderProviderFields(activeId);
    updateGating();
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

  providerSelect.addEventListener('change', () => {
    renderProviderFields(providerSelect.value);
  });

  intervalSelect.addEventListener('change', () => {
    localStorage.setItem(SYNC_TIMER_KEY, intervalSelect.value);
    if (isConfigured()) startTimer();
  });

  saveBtn.addEventListener('click', async () => {
    const providerId = providerSelect.value;
    if (!providerId) { showToast('Choose a provider first'); return; }

    const config   = readFieldValues(providerId);
    const provider = PROVIDERS[providerId];
    const missing  = provider.configFields.find(f => !config[f.key]);
    if (missing) { showToast(`Enter your ${missing.label}`); return; }

    saveBtn.disabled    = true;
    saveBtn.textContent = 'Validating…';
    const valid = await provider.init(config);
    saveBtn.disabled    = false;
    saveBtn.textContent = 'Save & connect';

    if (!valid.ok) { showToast(valid.error); return; }

    persistConfig(providerId, config);

    closeModal();
    showToast('Sync connected ✓');
    startTimer();
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
    if (!result.ok) showToast(`Sync failed: ${result.error}`);
    updateGating();
  });

  document.getElementById('sync-force-btn').addEventListener('click', async () => {
    closeModal();
    await forceSyncNow();
  });

  document.getElementById('sync-pull-btn').addEventListener('click', async () => {
    closeModal();
    await pullAndMerge();
  });

  document.getElementById('sync-disconnect-btn').addEventListener('click', () => {
    clearAllConfigs();
    stopTimer();
    closeModal();
    setSyncStatus('idle');
    showToast('Sync disconnected');
    updateGating();
  });

  // Initialise status and timer
  setSyncStatus(isConfigured() ? 'ok' : 'idle');
  if (isConfigured()) startTimer();

  // Sync on visibility change (open/close)
  document.addEventListener('visibilitychange', () => {
    if (!isConfigured()) return;
    if (document.visibilityState === 'hidden') _doSync();
    if (document.visibilityState === 'visible') {
      setSyncStatus('syncing');
      pullOnStartup(entries).then(result => {
        if (result.ok && result.hasNew) {
          setEntries(result.merged);
          save(showToast);
          renderFn();
        }
        setSyncStatus(result.ok ? 'ok' : 'error');
        if (!result.ok) console.warn('[noted sync] visibility pull failed:', result.error);
      });
    }
  });

  // Startup pull
  if (isConfigured()) {
    setSyncStatus('syncing');
    pullOnStartup(entries).then(result => {
      if (result.ok) {
        if (result.hasNew) {
          setEntries(result.merged);
          save(showToast);
          renderFn();
        }
        setSyncStatus('ok');
      } else {
        setSyncStatus('error');
        console.warn('[noted sync] startup pull failed:', result.error);
      }
    });
  }
}
