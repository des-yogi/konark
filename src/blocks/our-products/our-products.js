// Prev/next buttons for the CSS scroll-snap carousel of the our-products block.
// Swiping and keyboard focus work without this script; it only adds the buttons.
const root = document.querySelector('.js-our-products');

if (root) {
  const list = root.querySelector('.js-our-products-list');
  const prev = root.querySelector('.js-our-products-prev');
  const next = root.querySelector('.js-our-products-next');

  if (list && prev && next) {
    const nav = prev.parentElement;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let ticking = false;

    // One step = the width of a card plus the gap between cards
    const getStep = () => {
      const card = list.firstElementChild;
      const gap = parseFloat(getComputedStyle(list).columnGap) || 0;

      return card ? card.getBoundingClientRect().width + gap : list.clientWidth;
    };

    const scrollByStep = (direction) => {
      list.scrollBy({ left: direction * getStep(), behavior: motion.matches ? 'auto' : 'smooth' });
    };

    const updateButtons = () => {
      const max = list.scrollWidth - list.clientWidth;

      prev.disabled = list.scrollLeft <= 1;
      next.disabled = list.scrollLeft >= max - 1;
    };

    const onScroll = () => {
      if (ticking) {
        return;
      }

      ticking = true;
      requestAnimationFrame(() => {
        updateButtons();
        ticking = false;
      });
    };

    prev.addEventListener('click', () => scrollByStep(-1));
    next.addEventListener('click', () => scrollByStep(1));
    list.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    nav.hidden = false;
    updateButtons();
  }
}
