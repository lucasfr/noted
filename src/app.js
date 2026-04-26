import './style.css';

// ── Constants ────────────────────────────────────────────────────────────────
const STORAGE_KEY = 'noted_entries';
const THEME_KEY   = 'noted_theme';
const PRIVACY_KEY = 'noted_privacy';
const SORT_KEY    = 'noted_sort';
const SYMBOLS     = { note: '·', task: '○', event: '◇', idea: '★' };

// ── State ────────────────────────────────────────────────────────────────────
let selectedType = 'note';
let entries      = [];
let privacyOn    = localStorage.getItem(PRIVACY_KEY) === 'true';
let sortAsc      = localStorage.getItem(SORT_KEY) === 'true'; // false = newest first (default)

// ── Theme ────────────────────────────────────────────────────────────────────
const systemDark = window.matchMedia('(prefers-color-scheme: dark)');

function applyTheme(dark) {
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  document.querySelector('meta[name="theme-color"]').content = dark ? '#1A2330' : '#E8EDF2';
}

function updateThemeIcon() {
  const saved = localStorage.getItem(THEME_KEY);
  document.getElementById('icon-auto').style.display = !saved            ? 'block' : 'none';
  document.getElementById('icon-sun').style.display  = saved === 'light' ? 'block' : 'none';
  document.getElementById('icon-moon').style.display = saved === 'dark'  ? 'block' : 'none';
}

function resolveTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  applyTheme(saved ? saved === 'dark' : systemDark.matches);
  updateThemeIcon();
}

// Cycle: auto → light → dark → auto
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

// ── Privacy mode ─────────────────────────────────────────────────────────────
const BLUR_DELAY = 15000;
let blurTimers   = {};
let blurredIds   = new Set();

function applyPrivacyUI() {
  document.getElementById('icon-eye').style.display       = privacyOn ? 'none'  : 'block';
  document.getElementById('icon-eye-slash').style.display = privacyOn ? 'block' : 'none';
}

function scheduleBlur(id) {
  if (!privacyOn) return;
  clearTimeout(blurTimers[id]);
  blurTimers[id] = setTimeout(() => {
    const el = document.querySelector(`.entry[data-id="${id}"]`);
    if (el) el.querySelectorAll('.entry-text, .tag').forEach(n => n.classList.add('blurring'));
    blurredIds.add(id);
  }, BLUR_DELAY);
}

document.getElementById('privacy-btn').addEventListener('click', () => {
  privacyOn = !privacyOn;
  localStorage.setItem(PRIVACY_KEY, privacyOn);
  applyPrivacyUI();
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

// ── Sort order ────────────────────────────────────────────────────────────────
function applySortUI() {
  document.getElementById('icon-sort-new').style.display = sortAsc ? 'none'  : 'block';
  document.getElementById('icon-sort-old').style.display = sortAsc ? 'block' : 'none';
}

document.getElementById('sort-btn').addEventListener('click', () => {
  sortAsc = !sortAsc;
  localStorage.setItem(SORT_KEY, sortAsc);
  applySortUI();
  render();
});

applySortUI();

// ── Storage ──────────────────────────────────────────────────────────────────
function load() {
  try { entries = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { entries = []; }
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

// ── Formatting helpers ───────────────────────────────────────────────────────
function fmtTime(ts) {
  return new Date(ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function dayKey(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function fmtDay(ts) {
  const d     = new Date(ts);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return 'Today';
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
}

function getTags(text) {
  return [...text.matchAll(/#(\w+)/g)].map(m => m[1]);
}

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ── Render ───────────────────────────────────────────────────────────────────
function render() {
  const container = document.getElementById('entries-container');

  if (!entries.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-card">
          <div class="empty-icon">
            <svg fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0118 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"/>
            </svg>
          </div>
          <p class="empty-title">Nothing noted yet</p>
          <p class="empty-sub">Capture notes, tasks, events and ideas.<br>Everything gets a timestamp automatically.</p>
        </div>
      </div>`;
    return;
  }

  // Group entries by day
  const groups = {};
  entries.forEach(e => {
    const k = dayKey(e.timestamp);
    if (!groups[k]) groups[k] = [];
    groups[k].push(e);
  });

  // Sort day groups and entries within each group according to sortAsc
  const sortedGroups = Object.entries(groups)
    .sort(([a], [b]) => sortAsc ? a.localeCompare(b) : b.localeCompare(a));

  container.innerHTML = sortedGroups.map(([, day]) => {
    day.sort((a, b) => sortAsc ? a.timestamp - b.timestamp : b.timestamp - a.timestamp);

    const rows = day.map(e => {
      const tags     = getTags(e.text);
      const tagsHtml = tags.length
        ? `<div class="entry-tags">${tags.map(t => `<span class="tag">#${t}</span>`).join('')}</div>`
        : '';
      return `
        <div class="entry" data-type="${e.type}" data-id="${e.id}">
          <span class="entry-time">${fmtTime(e.timestamp)}</span>
          <span class="bullet-sym">${SYMBOLS[e.type]}</span>
          <div class="entry-body">
            <div class="entry-text">${esc(e.text)}</div>
            ${tagsHtml}
          </div>
          <button class="entry-delete" data-id="${e.id}" title="Delete">
            <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>`;
    }).join('');

    return `<div class="day-group"><div class="day-label">${fmtDay(day[0].timestamp)}</div>${rows}</div>`;
  }).join('');

  container.querySelectorAll('.entry-delete').forEach(btn => {
    btn.addEventListener('click', () => deleteEntry(btn.dataset.id));
  });

  // Re-apply blur to entries that were already blurred before this render
  blurredIds.forEach(id => {
    const el = document.querySelector(`.entry[data-id="${id}"]`);
    if (el) el.querySelectorAll('.entry-text, .tag').forEach(n => n.classList.add('blurring'));
  });
}

// ── Actions ──────────────────────────────────────────────────────────────────
function addEntry(text) {
  text = text.trim();
  if (!text) return;

  entries.push({
    id:        crypto.randomUUID(),
    timestamp: Date.now(),
    type:      selectedType,
    text,
  });

  save();
  render();
  // Scroll to bottom when oldest-first, top when newest-first
  const main = document.querySelector('main');
  main.scrollTop = sortAsc ? main.scrollHeight : 0;
  if (privacyOn) scheduleBlur(entries[entries.length - 1].id);
}

function deleteEntry(id) {
  entries = entries.filter(e => e.id !== id);
  blurredIds.delete(id);
  clearTimeout(blurTimers[id]);
  delete blurTimers[id];
  save();
  render();
}

// ── Export ───────────────────────────────────────────────────────────────────
function buildExport() {
  const days = {};
  entries.forEach(e => {
    const k = dayKey(e.timestamp);
    if (!days[k]) days[k] = [];
    days[k].push({
      time:      fmtTime(e.timestamp),
      timestamp: e.timestamp,
      type:      e.type,
      text:      e.text,
      tags:      getTags(e.text),
    });
  });
  return {
    exported_at: new Date().toISOString(),
    app:         'noted',
    version:     '1.0.0',
    note:        'Paste into Claude: "Convert this Noted JSON into an Obsidian Daily Note in markdown"',
    days,
  };
}

// ── Toast ────────────────────────────────────────────────────────────────────
function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2400);
}

// ── Type selector ────────────────────────────────────────────────────────────
document.getElementById('type-selector').addEventListener('click', e => {
  const btn = e.target.closest('.type-btn');
  if (!btn) return;
  selectedType = btn.dataset.type;
  document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
});

// ── Textarea ─────────────────────────────────────────────────────────────────
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
});

// ── Export modal ─────────────────────────────────────────────────────────────
const modalOverlay = document.getElementById('modal-overlay');

document.getElementById('export-btn').addEventListener('click', () => {
  document.getElementById('export-preview').textContent = JSON.stringify(buildExport(), null, 2);
  modalOverlay.classList.add('open');
});

document.getElementById('modal-close').addEventListener('click', () => {
  modalOverlay.classList.remove('open');
});

modalOverlay.addEventListener('click', e => {
  if (e.target === modalOverlay) modalOverlay.classList.remove('open');
});

document.getElementById('modal-copy').addEventListener('click', () => {
  navigator.clipboard.writeText(JSON.stringify(buildExport(), null, 2)).then(() => {
    showToast('Copied ✓');
    modalOverlay.classList.remove('open');
  });
});

document.getElementById('modal-download').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(buildExport(), null, 2)], { type: 'application/json' });
  const a    = Object.assign(document.createElement('a'), {
    href:     URL.createObjectURL(blob),
    download: `noted-${dayKey(Date.now())}.json`,
  });
  a.click();
  URL.revokeObjectURL(a.href);
  showToast('Downloaded ✓');
  modalOverlay.classList.remove('open');
});

// ── Clear today ───────────────────────────────────────────────────────────────
document.getElementById('clear-btn').addEventListener('click', () => {
  const todayKey = dayKey(Date.now());
  const n = entries.filter(e => dayKey(e.timestamp) === todayKey).length;
  if (!n) { showToast('Nothing to clear'); return; }
  if (confirm(`Clear ${n} entr${n === 1 ? 'y' : 'ies'} from today?`)) {
    entries = entries.filter(e => dayKey(e.timestamp) !== todayKey);
    save();
    render();
    showToast('Today cleared');
  }
});

// ── Header date ───────────────────────────────────────────────────────────────
document.getElementById('header-date').textContent = new Date().toLocaleDateString('en-GB', {
  weekday: 'short', day: 'numeric', month: 'short',
});

// ── Init ──────────────────────────────────────────────────────────────────────
load();
render();
if (privacyOn) {
  entries.forEach(e => {
    blurredIds.add(e.id);
    const el = document.querySelector(`.entry[data-id="${e.id}"]`);
    if (el) el.querySelectorAll('.entry-text, .tag').forEach(n => n.classList.add('blurring'));
  });
}
