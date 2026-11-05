import { OverlayScrollbars } from 'overlayscrollbars';

function initMobNav() {
  const panel = document.getElementById('mob-nav');

  if (!panel) return;

  // Custom scrollbar for the menu list (themed in mob-nav.scss)
  const scroller = panel.querySelector('.mob-nav__scroll');

  if (scroller) {
    OverlayScrollbars(scroller, {
      scrollbars: { theme: 'os-theme-mob-nav', autoHide: 'never' },
    });
  }

  // Close the open drawer when the viewport grows to the desktop layout
  const closeBtn = panel.querySelector('.mob-nav__close');
  const desktop = window.matchMedia('(width >= 1366px)'); // keep in sync with $menu-desktop-width

  if (closeBtn) {
    desktop.addEventListener('change', (e) => {
      if (e.matches && panel.classList.contains('show')) closeBtn.click();
    });
  }
}

initMobNav();
