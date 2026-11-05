const header = document.querySelector('.js-page-header');

if (header) {
  // Scroll threshold in px: defaults to the header height, override via data-scroll-offset
  const getOffset = () => Number(header.dataset.scrollOffset) || header.offsetHeight;

  const update = () => {
    header.classList.toggle('page-header--scrolled', window.scrollY > getOffset());
  };

  update(); // handle restored scroll position on reload
  window.addEventListener('scroll', update, { passive: true });
}
