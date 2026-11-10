import { OverlayScrollbars } from 'overlayscrollbars';

function initFiltersForm() {
  const form = document.getElementById('filter-form');

  if (!form) return;

  // Custom scrollbars: the whole panel (drawer) and the options lists (sidebar). The theme is defined in mob-nav.scss.
  // CSS decides what actually scrolls, so they are always initialised.
  const scrollbarOptions = { scrollbars: { theme: 'os-theme-mob-nav', autoHide: 'never' } };
  const scroller = form.querySelector('.js-filters-scroll');

  if (scroller) {
    OverlayScrollbars(scroller, scrollbarOptions);
  }

  form.querySelectorAll('.js-filters-options').forEach((list) => {
    OverlayScrollbars(list, scrollbarOptions);
  });

  // Close the open drawer when the viewport grows to the sidebar layout
  const closeBtn = form.querySelector('.js-filters-close');
  const desktop = window.matchMedia('(width >= 1280px)'); // keep in sync with $screen-lg

  if (closeBtn) {
    desktop.addEventListener('change', (e) => {
      if (e.matches && form.classList.contains('show')) closeBtn.click();
    });
  }
}

initFiltersForm();
