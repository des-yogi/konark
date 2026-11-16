import { OverlayScrollbars } from 'overlayscrollbars';

function initApplicantModals() {
  const modals = document.querySelectorAll('.js-applicant-modal');

  modals.forEach((modal) => {
    const scroller = modal.querySelector('.js-applicant-modal-scroll');

    if (!scroller) return;

    // Custom scrollbar for the table area (the theme is defined in mob-nav.scss)
    const scrollbars = OverlayScrollbars(scroller, {
      scrollbars: { theme: 'os-theme-mob-nav', autoHide: 'never' },
    });

    // The window is hidden (display: none) at init time, so the sizes are refreshed when it is shown
    modal.addEventListener('shown.coreui.modal', () => {
      scrollbars.update(true);
    });
  });
}

initApplicantModals();
