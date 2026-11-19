import Modal from '@coreui/coreui/js/src/modal.js';

const COOKIE_NAME = 'konark_access_gate'; // keep in sync with the inline script in _include/page_head.html
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days, in seconds

function initAccessGate() {
  const root = document.documentElement;
  const gate = document.querySelector('.js-access-gate');

  if (!gate || !root.hasAttribute('data-access-gate')) return;

  // The choice is already saved: the window stays closed
  if (document.cookie.split('; ').includes(`${COOKIE_NAME}=1`)) {
    root.classList.remove('is-gate-pending');
    return;
  }

  const confirmBtn = gate.querySelector('.js-access-gate-confirm');
  const declineLink = gate.querySelector('.js-access-gate-decline');

  if (!confirmBtn || !declineLink) return;

  // backdrop: static and keyboard: false come from the data attributes of the window
  const modal = Modal.getOrCreateInstance(gate);

  confirmBtn.addEventListener('click', () => {
    document.cookie = `${COOKIE_NAME}=1; max-age=${COOKIE_MAX_AGE}; path=/; SameSite=Lax`;
    root.classList.remove('is-gate-pending');
    modal.hide();
  });

  // replace(): the restricted page does not stay in the history, Back does not return to it
  declineLink.addEventListener('click', (event) => {
    event.preventDefault();
    window.location.replace(declineLink.href);
  });

  modal.show();
}

initAccessGate();
