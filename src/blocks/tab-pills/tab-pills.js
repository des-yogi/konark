// Tab pills: the row can be wider than the screen, so the pill that has just become active is scrolled into view.

function initTabPills() {
  const rows = document.querySelectorAll('.js-tab-pills');

  if (!rows.length) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  rows.forEach((row) => {
    // CoreUI fires the event on the activated tab; it bubbles up to the row
    row.addEventListener('shown.coreui.tab', (event) => {
      event.target.scrollIntoView({
        behavior: reducedMotion.matches ? 'auto' : 'smooth',
        block: 'nearest',
        inline: 'nearest',
      });
    });
  });
}

initTabPills();
