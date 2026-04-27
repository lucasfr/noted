// ── Island collapse (mobile) ──────────────────────────────────────────────────
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

if (window.innerWidth <= 600) {
  textarea.setAttribute('aria-hidden', 'true');
  textarea.setAttribute('tabindex', '-1');
  island.classList.add('collapsed');
  island.addEventListener('click', e => {
    if (island.classList.contains('collapsed')) { e.stopPropagation(); expandIsland(); }
  });
  document.addEventListener('pointerdown', e => {
    if (!e.target.closest('.input-island')) collapseIsland();
  });
}