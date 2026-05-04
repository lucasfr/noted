import { entries, SYMBOLS } from './storage.js';

// ── Formatting helpers ───────────────────────────────────────────────────────
export function fmtTime(ts) {
  return new Date(ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

export function dayKey(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function fmtDay(ts) {
  const d         = new Date(ts);
  const today     = new Date();
  if (d.toDateString() === today.toDateString()) return 'Today';
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
}

export function getTags(text) {
  return [...text.matchAll(/#(\w+)/g)].map(m => m[1]);
}

export function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ── Render ───────────────────────────────────────────────────────────────────
export function render({ searchQuery, sortAsc, editingId, blurredIds, startEdit, deleteEntry, toggleDone, onDayDelete }) {
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
          <div class="empty-suits">
            <span>♣&#xFE0F;</span>
            <span>♥&#xFE0F;</span>
            <span>♠&#xFE0F;</span>
            <span>♦&#xFE0F;</span>
          </div>
        </div>
      </div>`;
    return;
  }

  const filtered = searchQuery
    ? entries.filter(e =>
        e.text.toLowerCase().includes(searchQuery) ||
        getTags(e.text).some(t => t.toLowerCase().includes(searchQuery.replace('#', ''))))
    : entries;

  if (!filtered.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-card">
          <div class="empty-icon">
            <svg fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/>
            </svg>
          </div>
          <p class="empty-title">No results</p>
          <p class="empty-sub">No entries match "${esc(searchQuery)}"</p>
        </div>
      </div>`;
    return;
  }

  const groups = {};
  filtered.forEach(e => {
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
        ? `<div class="entry-tags">${tags.map(t => `<span class="tag">#${esc(t)}</span>`).join('')}</div>`
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
          <div class="entry-hover-actions">
            <button class="entry-hover-btn" data-action="edit" data-id="${e.id}" title="Edit">
              <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125"/></svg>
              <span>Edit</span>
            </button>
            <button class="entry-hover-btn delete" data-action="delete" data-id="${e.id}" title="Delete">
              <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg>
              <span>Delete</span>
            </button>
          </div>
          <div class="entry" data-type="${e.type}" data-id="${e.id}" ${e.done ? 'data-done="true"' : ''}>
            <span class="entry-time">${fmtTime(e.timestamp)}${e.type === 'task' && e.done && e.doneAt ? `<span class="done-time"> ✓ ${fmtTime(e.doneAt)}</span>` : ''}</span>
            ${e.type === 'task'
              ? `<span class="bullet-sym">${SYMBOLS[e.type]}</span><button class="task-checkbox ${e.done ? 'checked' : ''}" data-id="${e.id}" aria-label="Toggle done">
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 8l3.5 3.5L13 4.5"/></svg>
                </button>`
              : `<span class="bullet-sym">${SYMBOLS[e.type]}</span>`}
            <div class="entry-body">
              <div class="entry-text">${esc(e.text)}</div>
              ${tagsHtml}
            </div>
          </div>
        </div>`;
    }).join('');

    return `<div class="day-group" data-day="${dayKey(day[0].timestamp)}">
      <div class="day-label">
        ${fmtDay(day[0].timestamp)}
        <span class="day-count">${day.length}</span>
        <button class="day-delete-btn" data-day="${dayKey(day[0].timestamp)}" title="Delete this day">
          <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg>
        </button>
      </div>
      ${rows}
    </div>`;
  }).join('');

  // ── Event listeners ──────────────────────────────────────────────────────
  container.querySelectorAll('.day-delete-btn').forEach(btn => {
    btn.addEventListener('click', () => onDayDelete(btn.dataset.day, fmtDay(day_ts_for(btn.dataset.day, filtered))));
  });

  container.querySelectorAll('.entry-action-edit').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.entry-swipe-wrap').querySelector('.entry').style.transform = 'translateX(0)';
      startEdit(btn.dataset.id);
    });
  });

  container.querySelectorAll('.entry-action-delete').forEach(btn => {
    btn.addEventListener('click', () => deleteEntry(btn.dataset.id));
  });

  container.querySelectorAll('.entry-hover-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.action === 'edit') startEdit(btn.dataset.id);
      else deleteEntry(btn.dataset.id);
    });
  });

  container.querySelectorAll('.task-checkbox').forEach(btn => {
    btn.addEventListener('click', e => { e.stopPropagation(); toggleDone(btn.dataset.id); });
  });

  // Re-apply blur
  blurredIds.forEach(id => {
    const el = document.querySelector(`.entry[data-id="${id}"]`);
    if (el) el.querySelectorAll('.entry-text, .tag').forEach(n => n.classList.add('blurring'));
  });

  if (editingId) startEdit(editingId);
}

function day_ts_for(key, filtered) {
  const e = filtered.find(e => dayKey(e.timestamp) === key);
  return e ? e.timestamp : Date.now();
}
