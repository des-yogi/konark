(function () {
  const toTopBtn = document.getElementById('toTop');

  // Safe init: the block may be absent on some pages (MPA)
  if (!toTopBtn) return;

  const SHOW_OFFSET = 600; // px scrolled before the button appears
  const VISIBLE_CLASS = 'to-top--visible';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  let isVisible = false;
  let isTicking = false;

  // Toggle the class only when the state actually changes
  function updateVisibility() {
    isTicking = false;

    const shouldShow = window.scrollY >= SHOW_OFFSET;
    if (shouldShow === isVisible) return;

    isVisible = shouldShow;
    toTopBtn.classList.toggle(VISIBLE_CLASS, shouldShow);
  }

  // Throttle scroll handling to one check per animation frame
  function onScroll() {
    if (isTicking) return;
    isTicking = true;
    requestAnimationFrame(updateVisibility);
  }

  function onClick(e) {
    e.preventDefault();
    window.scrollTo({
      top: 0,
      behavior: reduceMotion.matches ? 'instant' : 'smooth'
    });
  }

  toTopBtn.addEventListener('click', onClick);
  window.addEventListener('scroll', onScroll, { passive: true });

  // Initial state (page may be restored in a scrolled position)
  updateVisibility();
})();
