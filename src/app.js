import './style.css';

import { entries, setEntries, load, save, THEME_KEY, PRIVACY_KEY, SORT_KEY, BLUR_DELAY_KEY, SYMBOLS } from './storage.js';
import { render, dayKey, fmtDay } from './render.js';
import { initSwipe }       from './ui/swipe.js';
import { initSpeech }      from './ui/speech.js';
import { showToast, showConfirm, initExportModal, initShortcutsModal, initAboutModal, initClearBtn } from './ui/modals.js';
import { initOnboarding }  from './ui/onboarding.js';

// ── App state ─────────────────────────────────────────────────────────────────
let selectedType = 'note';
let privacyOn    = localStorage.getItem(PRIVACY_KEY) === 'true';
let sortAsc      = localStorage.getItem(SORT_KEY) === 'true';
let editingId    = null;
let searchQuery  = '';
let blurTimers   = {};
let blurredIds   = new Set();

// ── Render wrapper ────────────────────────────────────────────────────────────
function doRender({ scrollToNew = false } = {}) {
  const scroller    = document.scrollingElement || document.documentElement;
  const savedScroll = scrollToNew ? null : scroller.scrollTop;

  render({
    searchQuery,
    sortAsc,
    editingId,
    blurredIds,
    startEdit,
    deleteEntry,
    toggleDone,
    onDayDelete,
  });

  const container = document.getElementById('entries-container');
  initSwipe(container, { startEdit, deleteEntry });

  if (scrollToNew) {
    scroller.scrollTop = sortAsc ? scroller.scrollHeight : 0;
  } else if (savedScroll !== null) {
    scroller.scrollTop = savedScroll;
  }
}

// ── Theme ─────────────────────────────────────────────────────────────────────
const systemDark = window.matchMedia('(prefers-color-scheme: dark)');

function applyTheme(dark) {
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  const colour = dark ? '#1A2330' : '#E8EDF2';
  document.querySelectorAll('meta[name="theme-color"]').forEach(m => m.content = colour);
}

function updateThemeIcon() {
  const saved = localStorage.getItem(THEME_KEY);
  document.getElementById('icon-auto').style.display = !saved            ? 'block' : 'none';
  document.getElementById('icon-sun').style.display  = saved === 'light' ? 'block' : 'none';
  document.getElementById('icon-moon').style.display = saved === 'dark'  ? 'block' : 'none';
  const dAuto = document.getElementById('d-icon-auto');
  if (dAuto) {
    dAuto.style.display = !saved ? 'block' : 'none';
    document.getElementById('d-icon-sun').style.display  = saved === 'light' ? 'block' : 'none';
    document.getElementById('d-icon-moon').style.display = saved === 'dark'  ? 'block' : 'none';
    const lbl = document.getElementById('drawer-theme-label');
    if (lbl) lbl.textContent = !saved ? 'Auto' : saved === 'light' ? 'Light' : 'Dark';
  }
}

function resolveTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  applyTheme(saved ? saved === 'dark' : systemDark.matches);
  updateThemeIcon();
}

document.getElementById('theme-btn').addEventListener('click', () => {
  const saved = localStorage.getItem(THEME_KEY);
  if (!saved)                 localStorage.setItem(THEME_KEY, 'light');
  else if (saved === 'light') localStorage.setItem(THEME_KEY, 'dark');
  else                        localStorage.removeItem(THEME_KEY);
  resolveTheme();
});

systemDark.addEventListener('change', () => {
  if (!localStorage.getItem(THEME_KEY)) resolveTheme();
});

resolveTheme();

// ── Privacy ───────────────────────────────────────────────────────────────────
const BLUR_DELAY_OPTIONS = [5000, 10000, 15000, 30000, 60000];
let blurDelay = parseInt(localStorage.getItem(BLUR_DELAY_KEY)) || 15000;

function getBlurDelay() { return blurDelay; }

const blurDelaySelect = document.getElementById('blur-delay-select');
const privacyPopover  = document.getElementById('privacy-popover');
const popoverSelect   = document.getElementById('privacy-popover-select');

function applyBlurDelayUI() {
  if (blurDelaySelect) blurDelaySelect.value = blurDelay;
  if (popoverSelect)   popoverSelect.value   = blurDelay;
  const row = document.getElementById('blur-delay-row');
  if (row) row.style.display = privacyOn ? 'flex' : 'none';
}

function openPrivacyPopover() {
  if (!privacyPopover) return;
  if (popoverSelect) popoverSelect.value = blurDelay;
  privacyPopover.style.display = 'flex';
}

function closePrivacyPopover() {
  if (privacyPopover) privacyPopover.style.display = 'none';
}

if (blurDelaySelect) {
  blurDelaySelect.addEventListener('change', () => {
    blurDelay = parseInt(blurDelaySelect.value);
    localStorage.setItem(BLUR_DELAY_KEY, blurDelay);
    if (popoverSelect) popoverSelect.value = blurDelay;
  });
}

if (popoverSelect) {
  popoverSelect.addEventListener('change', () => {
    blurDelay = parseInt(popoverSelect.value);
    localStorage.setItem(BLUR_DELAY_KEY, blurDelay);
    if (blurDelaySelect) blurDelaySelect.value = blurDelay;
    closePrivacyPopover();
  });
}

// Right-click on desktop
document.getElementById('privacy-btn').addEventListener('contextmenu', e => {
  e.preventDefault();
  openPrivacyPopover();
});

// Long-press on mobile
let longPressTimer = null;
document.getElementById('privacy-btn').addEventListener('pointerdown', () => {
  longPressTimer = setTimeout(() => { openPrivacyPopover(); }, 500);
});
document.getElementById('privacy-btn').addEventListener('pointerup',   () => clearTimeout(longPressTimer));
document.getElementById('privacy-btn').addEventListener('pointerleave', () => clearTimeout(longPressTimer));

// Close on outside click
document.addEventListener('pointerdown', e => {
  if (privacyPopover && privacyPopover.style.display !== 'none') {
    if (!privacyPopover.contains(e.target) && e.target.id !== 'privacy-btn') {
      closePrivacyPopover();
    }
  }
});

function applyPrivacyUI() {
  document.getElementById('icon-eye').style.display       = privacyOn ? 'none'  : 'block';
  document.getElementById('icon-eye-slash').style.display = privacyOn ? 'block' : 'none';
  const dEye = document.getElementById('d-icon-eye');
  if (dEye) {
    dEye.style.display = privacyOn ? 'none' : 'block';
    document.getElementById('d-icon-eye-slash').style.display = privacyOn ? 'block' : 'none';
    const btn = document.getElementById('drawer-privacy-btn');
    if (btn) btn.classList.toggle('active', privacyOn);
  }
}

function scheduleBlur(id) {
  if (!privacyOn) return;
  clearTimeout(blurTimers[id]);
  blurTimers[id] = setTimeout(() => {
    const el = document.querySelector(`.entry[data-id="${id}"]`);
    if (el) el.querySelectorAll('.entry-text, .tag').forEach(n => n.classList.add('blurring'));
    blurredIds.add(id);
  }, getBlurDelay());
}

document.getElementById('privacy-btn').addEventListener('click', () => {
  privacyOn = !privacyOn;
  localStorage.setItem(PRIVACY_KEY, privacyOn);
  applyPrivacyUI();
  applyBlurDelayUI();
  if (privacyOn) {
    entries.forEach(e => scheduleBlur(e.id));
  } else {
    Object.values(blurTimers).forEach(clearTimeout);
    blurTimers = {};
    blurredIds.clear();
    document.querySelectorAll('.entry-text.blurring, .tag.blurring').forEach(n => n.classList.remove('blurring'));
  }
});

applyPrivacyUI();
applyBlurDelayUI();

// ── Sort ───────────────────────────────────────────────────────────────────
function applySortUI() {
  document.getElementById('icon-sort-new').style.display = sortAsc ? 'none'  : 'block';
  document.getElementById('icon-sort-old').style.display = sortAsc ? 'block' : 'none';
  const dSortNew = document.getElementById('d-icon-sort-new');
  if (dSortNew) {
    dSortNew.style.display = sortAsc ? 'none' : 'block';
    document.getElementById('d-icon-sort-old').style.display = sortAsc ? 'block' : 'none';
    const btn = document.getElementById('drawer-sort-btn');
    if (btn) btn.classList.toggle('active', sortAsc);
    const lbl = document.getElementById('drawer-sort-label');
    if (lbl) lbl.textContent = sortAsc ? 'Oldest first' : 'Newest first';
  }
}

document.getElementById('sort-btn').addEventListener('click', () => {
  sortAsc = !sortAsc;
  localStorage.setItem(SORT_KEY, sortAsc);
  applySortUI();
  doRender();
});

applySortUI();

// ── Inline editing ────────────────────────────────────────────────────────────
function startEdit(id) {
  if (editingId) commitEdit(editingId);
  editingId = id;

  const entry = entries.find(e => e.id === id);
  if (!entry) return;
  const el = document.querySelector(`.entry[data-id="${id}"]`);
  if (!el) return;

  el.classList.add('editing');
  const body = el.querySelector('.entry-body');
  body.innerHTML = `
    <textarea class="entry-edit-input" rows="1">${entry.text}</textarea>
    <div class="entry-edit-types">
      ${Object.entries(SYMBOLS).map(([type, sym]) =>
        `<button class="entry-type-pill ${type === entry.type ? 'active' : ''}" data-type="${type}">${sym} ${type}</button>`
      ).join('')}
    </div>
    <div class="entry-edit-actions">
      <button class="entry-edit-save">Save</button>
      <button class="entry-edit-cancel">Cancel</button>
    </div>`;

  el.dataset.editType = entry.type;

  const ta = body.querySelector('.entry-edit-input');
  ta.style.height = 'auto';
  ta.style.height = Math.min(ta.scrollHeight, 200) + 'px';
  ta.addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 200) + 'px';
  });
  ta.focus();
  ta.setSelectionRange(ta.value.length, ta.value.length);
  ta.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commitEdit(id); }
    if (e.key === 'Escape') cancelEdit(id);
  });

  body.querySelectorAll('.entry-type-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      body.querySelectorAll('.entry-type-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      el.dataset.editType = pill.dataset.type;
    });
  });

  body.querySelector('.entry-edit-save').addEventListener('click', () => commitEdit(id));
  body.querySelector('.entry-edit-cancel').addEventListener('click', () => cancelEdit(id));
}

function commitEdit(id) {
  const el = document.querySelector(`.entry[data-id="${id}"]`);
  if (!el) { editingId = null; return; }
  const ta      = el.querySelector('.entry-edit-input');
  const newText = ta ? ta.value.trim() : null;
  const newType = el.dataset.editType;
  if (newText) {
    const idx = entries.findIndex(e => e.id === id);
    if (idx !== -1) { entries[idx].text = newText; entries[idx].type = newType; save(showToast); }
  }
  editingId = null;
  doRender();
}

function cancelEdit(id) {
  editingId = null;
  doRender();
}

// ── Actions ───────────────────────────────────────────────────────────────────
function addEntry(text) {
  text = text.trim();
  if (!text) return;
  if (navigator.vibrate) navigator.vibrate(8);
  entries.push({ id: crypto.randomUUID(), timestamp: Date.now(), type: selectedType, text });
  save(showToast);
  doRender({ scrollToNew: true });
  if (privacyOn) scheduleBlur(entries[entries.length - 1].id);
}

function toggleDone(id) {
  const idx = entries.findIndex(e => e.id === id);
  if (idx === -1) return;
  entries[idx].done = !entries[idx].done;
  entries[idx].doneAt = entries[idx].done ? Date.now() : null;
  if (navigator.vibrate) navigator.vibrate(6);
  save(showToast);
  doRender();
}

function deleteEntry(id) {
  if (editingId === id) editingId = null;
  setEntries(entries.filter(e => e.id !== id));
  blurredIds.delete(id);
  clearTimeout(blurTimers[id]);
  delete blurTimers[id];
  save(showToast);
  doRender();
}

function onDayDelete(key, label) {
  const n = entries.filter(e => dayKey(e.timestamp) === key).length;
  showConfirm(
    `Delete all ${n} entr${n === 1 ? 'y' : 'ies'} from ${label}?`,
    () => {
      setEntries(entries.filter(e => dayKey(e.timestamp) !== key));
      save(showToast);
      doRender();
      showToast('Day deleted');
    }
  );
}

// ── Type selector ─────────────────────────────────────────────────────────────
document.getElementById('type-selector').addEventListener('click', e => {
  const btn = e.target.closest('.type-btn');
  if (!btn) return;
  selectedType = btn.dataset.type;
  document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
});

// ── Textarea ──────────────────────────────────────────────────────────────────
const textarea = document.getElementById('entry-input');

textarea.addEventListener('input', function () {
  this.style.height = 'auto';
  this.style.height = Math.min(this.scrollHeight, 120) + 'px';
});

textarea.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    addEntry(textarea.value);
    textarea.value = '';
    textarea.style.height = 'auto';
  }
});

document.getElementById('submit-btn').addEventListener('click', () => {
  addEntry(textarea.value);
  textarea.value = '';
  textarea.style.height = 'auto';
  textarea.focus();
  collapseIsland();
});

// ── Island collapse ─────────────────────────────────────────────────────────
const island = document.querySelector('.input-island');

function expandIsland() {
  island.classList.remove('collapsed');
  textarea.removeAttribute('aria-hidden');
  textarea.removeAttribute('tabindex');
  textarea.focus();
}

function collapseIsland() {
  if (textarea.value.trim()) return;
  textarea.blur();
  textarea.setAttribute('aria-hidden', 'true');
  textarea.setAttribute('tabindex', '-1');
  island.classList.add('collapsed');
}

textarea.setAttribute('aria-hidden', 'true');
textarea.setAttribute('tabindex', '-1');
island.classList.add('collapsed');
island.addEventListener('click', e => {
  if (island.classList.contains('collapsed')) { e.stopPropagation(); expandIsland(); }
});
document.addEventListener('pointerdown', e => {
  if (!e.target.closest('.input-island')) collapseIsland();
});

// ── Search ────────────────────────────────────────────────────────────────────
const searchBar   = document.getElementById('search-bar');
const searchInput = document.getElementById('search-input');

function openSearch()  { searchBar.style.display = 'flex'; searchInput.focus(); }
function closeSearch() {
  searchBar.style.display = 'none';
  searchQuery = '';
  searchInput.value = '';
  doRender();
}

document.getElementById('search-btn').addEventListener('click', openSearch);
document.getElementById('search-close').addEventListener('click', closeSearch);
searchInput.addEventListener('input', () => { searchQuery = searchInput.value.toLowerCase().trim(); doRender(); });
searchInput.addEventListener('keydown', e => { if (e.key === 'Escape') closeSearch(); });

// ── Mobile drawer ─────────────────────────────────────────────────────────────
const drawerOverlay = document.getElementById('drawer-overlay');
const hamburgerBtn  = document.getElementById('hamburger-btn');

if (hamburgerBtn && drawerOverlay) {
  hamburgerBtn.addEventListener('click', () => drawerOverlay.classList.add('open'));
  drawerOverlay.addEventListener('click', e => {
    if (e.target === drawerOverlay) drawerOverlay.classList.remove('open');
  });
  document.getElementById('drawer-theme-btn').addEventListener('click',    () => document.getElementById('theme-btn').click());
  document.getElementById('drawer-privacy-btn').addEventListener('click',  () => document.getElementById('privacy-btn').click());
  document.getElementById('drawer-sort-btn').addEventListener('click',     () => document.getElementById('sort-btn').click());
  document.getElementById('drawer-search-btn').addEventListener('click',   () => { drawerOverlay.classList.remove('open'); openSearch(); });
  document.getElementById('drawer-shortcuts-btn').addEventListener('click',() => { drawerOverlay.classList.remove('open'); document.getElementById('shortcuts-btn').click(); });
  document.getElementById('drawer-export-btn').addEventListener('click',   () => { drawerOverlay.classList.remove('open'); document.getElementById('export-btn').click(); });
  document.getElementById('drawer-clear-btn').addEventListener('click',    () => { drawerOverlay.classList.remove('open'); document.getElementById('clear-btn').click(); });
}

// ── Modals & features ─────────────────────────────────────────────────────────
const shortcutsOverlay = initShortcutsModal();
initAboutModal();
initExportModal({ render: doRender });
initClearBtn({ render: doRender });
initOnboarding();
initSpeech({ getTextarea: () => textarea, showToast });

// ── Keyboard shortcuts ────────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  const mod    = e.metaKey || e.ctrlKey;
  const tag    = document.activeElement.tagName;
  const typing = (tag === 'TEXTAREA' || tag === 'INPUT' || document.activeElement.isContentEditable)
               && document.activeElement !== document.body;

  if (e.key === 'Escape') {
    if (shortcutsOverlay.classList.contains('open'))                               { shortcutsOverlay.classList.remove('open'); return; }
    if (document.getElementById('onboarding-overlay').classList.contains('open')) { document.getElementById('ob-skip').click(); return; }
    if (document.getElementById('about-overlay').classList.contains('open'))      { document.getElementById('about-close').click(); return; }
    if (document.getElementById('modal-overlay').classList.contains('open'))      { document.getElementById('modal-close').click(); return; }
    if (document.getElementById('drawer-overlay').classList.contains('open'))     { drawerOverlay.classList.remove('open'); return; }
    if (editingId) { cancelEdit(editingId); return; }
  }

  if (typing) return;

  if (e.key === '?')        { e.preventDefault(); shortcutsOverlay.classList.toggle('open'); return; }
  if (mod && e.key === 'f') { e.preventDefault(); openSearch(); return; }
  if (mod && e.key === 'd') { e.preventDefault(); document.getElementById('theme-btn').click(); }
  if (mod && e.key === 'p') { e.preventDefault(); document.getElementById('privacy-btn').click(); }
  if (mod && e.key === 'e') { e.preventDefault(); document.getElementById('export-btn').click(); }
  if (mod && e.key === '/') { e.preventDefault(); textarea.focus(); }
  if (mod && e.key === 'm') { e.preventDefault(); document.getElementById('mic-btn').click(); }
  if (mod && e.key === 'i') { e.preventDefault(); document.getElementById('logo-btn').click(); }

  if (e.key === '1') { e.preventDefault(); document.querySelector('.type-btn[data-type="note"]').click();  textarea.focus(); }
  if (e.key === '2') { e.preventDefault(); document.querySelector('.type-btn[data-type="task"]').click();  textarea.focus(); }
  if (e.key === '3') { e.preventDefault(); document.querySelector('.type-btn[data-type="event"]').click(); textarea.focus(); }
  if (e.key === '4') { e.preventDefault(); document.querySelector('.type-btn[data-type="idea"]').click();  textarea.focus(); }
});

// ── Header date ───────────────────────────────────────────────────────────────
document.getElementById('header-date').textContent = new Date().toLocaleDateString('en-GB', {
  weekday: 'short', day: 'numeric', month: 'short',
});

// ── Force reflow on load to fix sticky input position on iOS PWA ─────────────────
window.addEventListener('load', () => {
  setTimeout(() => {
    window.scrollTo(0, 1);
    window.scrollTo(0, 0);
  }, 100);
});

// ── Init ──────────────────────────────────────────────────────────────────────
load();
if (privacyOn) entries.forEach(e => blurredIds.add(e.id));
doRender();
