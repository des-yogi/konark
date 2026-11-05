function initPagination() {
  const items = document.querySelectorAll('.pagination__item');

  if (!items.length) return;

  items.forEach((item) => {
    const link = item.querySelector('.pagination__link');

    if (!link) return;

    if (item.classList.contains('active')) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });
}

initPagination();
