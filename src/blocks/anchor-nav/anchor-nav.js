// Anchor nav: marks the link of the section that is being read (the `active` class).
// The active section is the last one whose top has passed the line under the fixed header.

function initAnchorNav() {
  const nav = document.querySelector('.js-anchor-nav');

  if (!nav) return;

  const items = [...nav.querySelectorAll('a[href^="#"]')]
    .map((link) => ({ link, section: document.querySelector(link.hash) }))
    .filter((item) => item.section);

  if (!items.length) return;

  const pageStyle = getComputedStyle(document.documentElement);
  let current = null;
  let waiting = false;

  const update = () => {
    waiting = false;

    // The line is the place where a section heading lands after a click on a link:
    // the fixed header (scroll-padding-top of the page) + the gap (scroll-margin-top of the section).
    // This way the offset for the fixed header is set in CSS only and is not duplicated here.
    const line =
      (parseFloat(pageStyle.scrollPaddingTop) || 0) +
      (parseFloat(getComputedStyle(items[0].section).scrollMarginTop) || 0);

    let active = items[0];

    items.forEach((item) => {
      if (item.section.getBoundingClientRect().top <= line + 1) active = item;
    });

    // At the very end of the page the last short sections cannot reach the line
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 1) {
      active = items[items.length - 1];
    }

    if (active === current) return;

    current = active;
    items.forEach((item) => item.link.classList.toggle('active', item === active));
  };

  const requestUpdate = () => {
    if (waiting) return;

    waiting = true;
    requestAnimationFrame(update);
  };

  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate);
  update();
}

initAnchorNav();
