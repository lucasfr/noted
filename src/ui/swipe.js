export function initSwipe(container, { startEdit, deleteEntry }) {
  container.querySelectorAll('.entry-swipe-wrap').forEach(wrap => {
    const entry    = wrap.querySelector('.entry');
    const actionsW = 140;
    let startX = 0, startY = 0, dx = 0, swiping = false, revealed = false;

    function reveal()   { entry.style.transform = `translateX(-${actionsW}px)`; revealed = true; }
    function collapse() { entry.style.transform = 'translateX(0)';               revealed = false; }

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

  // Collapse all swipes when tapping outside
  document.addEventListener('pointerdown', e => {
    if (!e.target.closest('.entry-swipe-wrap')) {
      container.querySelectorAll('.entry').forEach(el => {
        el.style.transition = '';
        el.style.transform  = 'translateX(0)';
      });
    }
  }, { capture: true });
}
