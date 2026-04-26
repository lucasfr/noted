import './style.css';

// ── Constants ────────────────────────────────────────────────────────────────
const STORAGE_KEY = 'noted_entries';
const THEME_KEY   = 'noted_theme';
const PRIVACY_KEY = 'noted_privacy';
const SORT_KEY    = 'noted_sort';
const SYMBOLS = {
  note:  '<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><circle cx="12" cy="12" r="6"/></svg>',
  task:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" width="14" height="14"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>',
  event: '<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z"/></svg>',
  idea:  '<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M12 .75a8.25 8.25 0 00-4.135 15.39c.686.398 1.115 1.008 1.134 1.623a.75.75 0 00.577.706c.352.083.71.148 1.074.195.323.041.6-.218.6-.544v-4.661a6.714 6.714 0 01-.937-.171.75.75 0 11.374-1.453 5.261 5.261 0 002.626 0 .75.75 0 11.374 1.452 6.712 6.712 0 01-.937.172v4.66c0 .327.277.586.6.545.364-.047.722-.112 1.074-.195a.75.75 0 00.577-.706c.02-.615.448-1.225 1.134-1.623A8.25 8.25 0 0012 .75z"/></svg>',
};

// ── State ────────────────────────────────────────────────────────────────────
let selectedType = 'note';
let entries      = [];
let privacyOn    = localStorage.getItem(PRIVACY_KEY) === 'true';
let sortAsc      = localStorage.getItem(SORT_KEY) === 'true';
let editingId    = null;

// ── Theme ────────────────────────────────────────────────────────────────────
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

// ── Privacy mode ─────────────────────────────────────────────────────────────
const BLUR_DELAY = 15000;
let blurTimers   = {};
let blurredIds   = new Set();

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
      ${Object.entries(SYMBOLS).map(([type, sym]) => `
        <button class="entry-type-pill ${type === entry.type ? 'active' : ''}" data-type="${type}">${sym} ${type}</button>
      `).join('')}
    </div>
    <div class="entry-edit-actions">
      <button class="entry-edit-save">Save</button>
      <button class="entry-edit-cancel">Cancel</button>
    </div>`;

  el.dataset.editType = entry.type;

  const ta = body.querySelector('.entry-edit-input');
  ta.style.height = 'auto';
  ta.style.height = Math.min(ta.scrollHeight, 200) + 'px';
  ta.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 200) + 'px';
  });
  ta.focus();
  ta.setSelectionRange(ta.value.length, ta.value.length);

  ta.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commitEdit(id); }
    if (e.key === 'Escape') { cancelEdit(id); }
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
    if (idx !== -1) {
      entries[idx].text = newText;
      entries[idx].type = newType;
      save();
    }
  }

  editingId = null;
  render();
}

function cancelEdit(id) {
  editingId = null;
  render();
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

  const groups = {};
  entries.forEach(e => {
    const k = dayKey(e.timestamp);
    if (!groups[k]) groups[k] = [];
    groups[k].push(e);
  });

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
        <div class="entry-swipe-wrap" data-id="${e.id}">
          <div class="entry-actions">
            <button class="entry-action-edit" data-id="${e.id}">
              <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125"/></svg>
              <span>Edit</span>
            </button>
            <button class="entry-action-delete" data-id="${e.id}">
              <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg>
              <span>Delete</span>
            </button>
          </div>
          <div class="entry" data-type="${e.type}" data-id="${e.id}">
            <span class="entry-time">${fmtTime(e.timestamp)}</span>
            <span class="bullet-sym">${SYMBOLS[e.type]}</span>
            <div class="entry-body">
              <div class="entry-text">${esc(e.text)}</div>
              ${tagsHtml}
            </div>
          </div>
        </div>`;
    }).join('');

    return `<div class="day-group"><div class="day-label">${fmtDay(day[0].timestamp)}</div>${rows}</div>`;
  }).join('');

  container.querySelectorAll('.entry-swipe-wrap').forEach(wrap => {
    const entry   = wrap.querySelector('.entry');
    const actionsW = 140;
    let startX = 0, startY = 0, dx = 0, swiping = false, revealed = false;

    function reveal()  { entry.style.transform = `translateX(-${actionsW}px)`; revealed = true; }
    function collapse(){ entry.style.transform = 'translateX(0)';               revealed = false; }

    entry.addEventListener('pointerdown', e => {
      startX = e.clientX; startY = e.clientY; dx = 0; swiping = false;
      entry.style.transition = 'none';
    });
    entry.addEventListener('pointermove', e => {
      const dX = e.clientX - startX;
      const dY = e.clientY - startY;
      if (!swiping && Math.abs(dX) < 5 && Math.abs(dY) < 5) return;
      if (!swiping) {
        if (Math.abs(dX) < Math.abs(dY)) return;
        swiping = true;
      }
      dx = dX;
      const base = revealed ? -actionsW : 0;
      entry.style.transform = `translateX(${Math.max(-actionsW, Math.min(0, base + dx))}px)`;
    });
    entry.addEventListener('pointerup', e => {
      entry.style.transition = '';
      if (!swiping) {
        if (revealed) { collapse(); return; }
        const textEl = e.target.closest('.entry-text');
        if (textEl) startEdit(wrap.dataset.id);
        return;
      }
      dx < -40 ? reveal() : collapse();
    });
    entry.addEventListener('pointercancel', () => {
      entry.style.transition = '';
      revealed ? reveal() : collapse();
    });
  });

  document.addEventListener('pointerdown', e => {
    if (!e.target.closest('.entry-swipe-wrap')) {
      container.querySelectorAll('.entry').forEach(el => {
        el.style.transition = '';
        el.style.transform = 'translateX(0)';
      });
    }
  }, { capture: true });

  container.querySelectorAll('.entry-action-edit').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.entry-swipe-wrap').querySelector('.entry').style.transform = 'translateX(0)';
      startEdit(btn.dataset.id);
    });
  });

  container.querySelectorAll('.entry-action-delete').forEach(btn => {
    btn.addEventListener('click', () => deleteEntry(btn.dataset.id));
  });

  blurredIds.forEach(id => {
    const el = document.querySelector(`.entry[data-id="${id}"]`);
    if (el) el.querySelectorAll('.entry-text, .tag').forEach(n => n.classList.add('blurring'));
  });

  if (editingId) startEdit(editingId);
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
  const main = document.querySelector('main');
  main.scrollTop = sortAsc ? main.scrollHeight : 0;
  if (privacyOn) scheduleBlur(entries[entries.length - 1].id);
}

function deleteEntry(id) {
  if (editingId === id) editingId = null;
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

// ── About ─────────────────────────────────────────────────────────────────────
const aboutOverlay = document.getElementById('about-overlay');

document.getElementById('logo-btn').addEventListener('click', () => {
  aboutOverlay.classList.add('open');
});

document.getElementById('about-close').addEventListener('click', () => {
  aboutOverlay.classList.remove('open');
});

aboutOverlay.addEventListener('click', e => {
  if (e.target === aboutOverlay) aboutOverlay.classList.remove('open');
});

// ── Speech to text ────────────────────────────────────────────────────────────
const micBtn = document.getElementById('mic-btn');
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
  micBtn.style.display = 'none';
} else {
  const recognition      = new SpeechRecognition();
  recognition.continuous     = false;
  recognition.interimResults = true;
  recognition.lang           = 'en-GB';

  let isListening = false;
  let baseText    = '';

  function startListening() {
    if (isListening) return;
    isListening = true;
    baseText    = textarea.value;
    micBtn.classList.add('mic-active');
    document.getElementById('icon-mic').style.display        = 'none';
    document.getElementById('icon-mic-active').style.display = 'block';
    recognition.start();
  }

  function stopListening() {
    if (!isListening) return;
    recognition.stop();
  }

  recognition.addEventListener('result', e => {
    const transcript = Array.from(e.results).map(r => r[0].transcript).join('');
    textarea.value = baseText + (baseText && transcript ? ' ' : '') + transcript;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  });

  recognition.addEventListener('end', () => {
    isListening = false;
    micBtn.classList.remove('mic-active');
    document.getElementById('icon-mic').style.display        = 'block';
    document.getElementById('icon-mic-active').style.display = 'none';
  });

  recognition.addEventListener('error', e => {
    isListening = false;
    micBtn.classList.remove('mic-active');
    document.getElementById('icon-mic').style.display        = 'block';
    document.getElementById('icon-mic-active').style.display = 'none';
    if (e.error !== 'aborted') showToast('Mic error: ' + e.error);
  });

  micBtn.addEventListener('click', () => {
    if (isListening) stopListening();
    else startListening();
  });
}

// ── Mobile drawer ─────────────────────────────────────────────────────────────
const drawerOverlay = document.getElementById('drawer-overlay');
const hamburgerBtn  = document.getElementById('hamburger-btn');

if (hamburgerBtn && drawerOverlay) {
  hamburgerBtn.addEventListener('click', () => drawerOverlay.classList.add('open'));
  drawerOverlay.addEventListener('click', e => {
    if (e.target === drawerOverlay) drawerOverlay.classList.remove('open');
  });
  document.getElementById('drawer-theme-btn').addEventListener('click', () => {
    document.getElementById('theme-btn').click();
  });
  document.getElementById('drawer-privacy-btn').addEventListener('click', () => {
    document.getElementById('privacy-btn').click();
  });
  document.getElementById('drawer-sort-btn').addEventListener('click', () => {
    document.getElementById('sort-btn').click();
  });
  document.getElementById('drawer-export-btn').addEventListener('click', () => {
    drawerOverlay.classList.remove('open');
    document.getElementById('export-btn').click();
  });
  document.getElementById('drawer-clear-btn').addEventListener('click', () => {
    drawerOverlay.classList.remove('open');
    document.getElementById('clear-btn').click();
  });
}

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
