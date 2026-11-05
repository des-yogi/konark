const searchModal = document.querySelector('.js-search-modal');

if (searchModal) {
  const searchInput = searchModal.querySelector('.js-search-modal-input');

  if (searchInput) {
    // CoreUI moves the focus to the window itself; put it into the field when the window is shown
    searchModal.addEventListener('shown.coreui.modal', () => {
      searchInput.focus();
    });
  }
}
