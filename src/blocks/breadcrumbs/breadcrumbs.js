function initBreadcrumbs() {
  const list = document.querySelector('.js-breadcrumbs-list');

  if (!list) return;

  // A long path does not fit in one line: show its end, where the current page is
  const showEnd = () => {
    list.scrollLeft = list.scrollWidth;
  };

  showEnd();

  // The web font changes the text width after it is loaded
  if (document.fonts) {
    document.fonts.ready.then(showEnd);
  }
}

initBreadcrumbs();
