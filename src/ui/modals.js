import { entries, setEntries, save } from '../storage.js';
import { fmtTime, dayKey, fmtDay, getTags } from '../render.js';

// ── Shared helpers ────────────────────────────────────────────────────────────
function closeOnBackdrop(overlay, cls) {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.classList.remove(cls);
  });
}

// ── Toast ────────────────────────────────────────────────────────────────────
export function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2400);
}

// ── Export modal ─────────────────────────────────────────────────────────────
function buildMarkdown() {
  const SYM = { note: '♣', task: '♠', event: '♥', idea: '♦' };
  return Object.entries(
    entries.reduce((acc, e) => {
      const k = dayKey(e.timestamp);
      if (!acc[k]) acc[k] = [];
      acc[k].push(e);
      return acc;
    }, {})
  ).sort(([a], [b]) => a.localeCompare(b))
   .map(([, day]) => {
     const heading = `## ${fmtDay(day[0].timestamp)}`;
     const lines   = day.map(e => {
       const strike = e.done ? '~~' : '';
       return `- ${SYM[e.type]} ${strike}${e.text}${strike} _(${fmtTime(e.timestamp)})_`;
     });
     return [heading, ...lines].join('\n');
   }).join('\n\n');
}

function buildExport() {
  const days = {};
  entries.forEach(e => {
    const k = dayKey(e.timestamp);
    if (!days[k]) days[k] = [];
    days[k].push({
      id:        e.id,
      time:      fmtTime(e.timestamp),
      timestamp: e.timestamp,
      type:      e.type,
      text:      e.text,
      tags:      getTags(e.text),
      done:      e.done || false,
    });
  });
  return {
    exported_at: new Date().toISOString(),
    app:         'noted',
    version:     '1.0.0',
    note:        'Export your entries and take them into your permanent notes app.',
    days,
  };
}

export function initExportModal({ render }) {
  const overlay = document.getElementById('modal-overlay');

  document.getElementById('export-btn').addEventListener('click', () => {
    document.getElementById('export-preview').textContent = JSON.stringify(buildExport(), null, 2);
    overlay.classList.add('open');
  });

  document.getElementById('modal-close').addEventListener('click', () => overlay.classList.remove('open'));
  closeOnBackdrop(overlay, 'open');

  document.getElementById('modal-copy').addEventListener('click', () => {
    navigator.clipboard.writeText(JSON.stringify(buildExport(), null, 2)).then(() => {
      showToast('Copied ✓');
      overlay.classList.remove('open');
    });
  });

  document.getElementById('modal-copy-md').addEventListener('click', () => {
    navigator.clipboard.writeText(buildMarkdown()).then(() => {
      showToast('Copied as Markdown ✓');
      overlay.classList.remove('open');
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
    overlay.classList.remove('open');
  });

  document.getElementById('modal-import-input').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data   = JSON.parse(ev.target.result);
        let imported = [];
        if (Array.isArray(data)) {
          imported = data;
        } else if (data.days) {
          Object.values(data.days).forEach(day => {
            day.forEach(entry => {
              imported.push({
                id:        entry.id        || crypto.randomUUID(),
                timestamp: entry.timestamp || Date.now(),
                type:      entry.type      || 'note',
                text:      entry.text      || '',
                done:      entry.done      || false,
              });
            });
          });
        }
        if (!imported.length) { showToast('No entries found in file'); return; }
        const existingIds = new Set(entries.map(entry => entry.id));
        const fresh       = imported.filter(entry => !existingIds.has(entry.id));
        setEntries([...entries, ...fresh].sort((a, b) => a.timestamp - b.timestamp));
        save(showToast);
        render();
        overlay.classList.remove('open');
        showToast(`Imported ${fresh.length} entr${fresh.length === 1 ? 'y' : 'ies'} ✓`);
      } catch {
        showToast('Invalid JSON file');
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  });
}

// ── Shortcuts modal ──────────────────────────────────────────────────────────
export function initShortcutsModal() {
  const overlay = document.getElementById('shortcuts-overlay');
  document.getElementById('shortcuts-btn').addEventListener('click', () => overlay.classList.toggle('open'));
  document.getElementById('shortcuts-close').addEventListener('click', () => overlay.classList.remove('open'));
  closeOnBackdrop(overlay, 'open');
  return overlay;
}

// ── About modal ──────────────────────────────────────────────────────────────
export function initAboutModal() {
  const overlay = document.getElementById('about-overlay');
  document.getElementById('logo-btn').addEventListener('click', () => overlay.classList.add('open'));
  document.getElementById('about-close').addEventListener('click', () => overlay.classList.remove('open'));
  closeOnBackdrop(overlay, 'open');
  return overlay;
}

// ── Clear all ────────────────────────────────────────────────────────────────
export function initClearBtn({ render }) {
  document.getElementById('clear-btn').addEventListener('click', () => {
    const n = entries.length;
    if (!n) { showToast('Nothing to clear'); return; }
    if (confirm(`Delete all ${n} entr${n === 1 ? 'y' : 'ies'}? This cannot be undone.`)) {
      setEntries([]);
      save(showToast);
      render();
      showToast('All entries deleted');
    }
  });
}
