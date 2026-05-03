import { entries } from '../storage.js';
import { getTags } from '../render.js';

// ── Collect all known tags from entries, most-recent first ───────────────────
function getKnownTags() {
  const seen = new Map(); // tag -> latest timestamp
  for (const e of entries) {
    for (const t of getTags(e.text)) {
      const key = t.toLowerCase();
      if (!seen.has(key) || e.timestamp > seen.get(key)) seen.set(key, e.timestamp);
    }
  }
  return [...seen.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([t]) => t);
}

// ── Find the hashtag fragment being typed at the cursor ──────────────────────
function getHashFragment(textarea) {
  const val    = textarea.value;
  const cursor = textarea.selectionStart;
  const before = val.slice(0, cursor);
  const match  = before.match(/#(\w*)$/);
  return match ? match[1] : null; // null = not in a hashtag
}

// ── Init autocomplete for a textarea ────────────────────────────────────────
export function initHashtagAutocomplete(textarea) {
  const dropdown = document.createElement('ul');
  dropdown.className = 'hashtag-dropdown';
  dropdown.setAttribute('role', 'listbox');
  textarea.closest('.input-island').appendChild(dropdown);

  let activeIdx = -1;

  function hide() {
    dropdown.style.display = 'none';
    dropdown.innerHTML = '';
    activeIdx = -1;
  }

  function show(matches) {
    dropdown.innerHTML = matches
      .map(t => `<li role="option" data-tag="${t}" class="hashtag-option">#${t}</li>`)
      .join('');
    dropdown.style.display = 'block';
    activeIdx = -1;
  }

  function applyActive() {
    dropdown.querySelectorAll('.hashtag-option').forEach((li, i) => {
      li.classList.toggle('active', i === activeIdx);
    });
  }

  function complete(tag) {
    const val    = textarea.value;
    const cursor = textarea.selectionStart;
    const before = val.slice(0, cursor);
    const after  = val.slice(cursor);
    const replaced = before.replace(/#(\w*)$/, `#${tag}`);
    textarea.value = replaced + after;
    textarea.selectionStart = textarea.selectionEnd = replaced.length;
    textarea.dispatchEvent(new Event('input'));
    hide();
    textarea.focus();
  }

  // ── Input: show/hide dropdown ────────────────────────────────────────────
  textarea.addEventListener('input', () => {
    const fragment = getHashFragment(textarea);
    if (fragment === null) { hide(); return; }

    const known   = getKnownTags();
    const matches = known.filter(t => t.startsWith(fragment.toLowerCase()) && t !== fragment.toLowerCase());
    if (!matches.length) { hide(); return; }
    show(matches.slice(0, 6));
  });

  // ── Keyboard nav: arrows, enter, tab, escape ─────────────────────────────
  textarea.addEventListener('keydown', e => {
    if (dropdown.style.display === 'none') return;
    const items = dropdown.querySelectorAll('.hashtag-option');
    if (!items.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeIdx = Math.min(activeIdx + 1, items.length - 1);
      applyActive();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeIdx = Math.max(activeIdx - 1, -1);
      applyActive();
    } else if ((e.key === 'Enter' || e.key === 'Tab') && activeIdx >= 0) {
      e.preventDefault();
      complete(items[activeIdx].dataset.tag);
    } else if (e.key === 'Escape') {
      hide();
    }
  });

  // ── Mouse: click to complete ─────────────────────────────────────────────
  dropdown.addEventListener('mousedown', e => {
    const li = e.target.closest('.hashtag-option');
    if (!li) return;
    e.preventDefault(); // prevent textarea blur before completion
    complete(li.dataset.tag);
  });

  // ── Hide on blur ─────────────────────────────────────────────────────────
  textarea.addEventListener('blur', () => setTimeout(hide, 100));
}
