// Product gallery: thumbnails switch the main photo (a fade), the main photo can be zoomed.
// Zoom: where the device really hovers - by hover (the photo follows the pointer), elsewhere - by tap (the photo is scrolled with the finger).
// The enlarged file is data-zoom of the frame (of the thumbnail for the other photos); the ratio is --zoom-scale in the scss,
// data-scale on the root overrides it. Enter / Space toggle the zoom, Escape closes it, arrows move the photo.

const SWAP_DURATION = 150; // ms, fade-out and fade-in of the main photo (a half of $transition-time)
const HOVER_DELAY = 500; // ms, the pointer has to rest over the photo before the zoom starts
const ARROW_STEP = 10; // % of the photo per press of an arrow key (zoom by hover)
const ARROWS = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };

// Keep in sync with $zoom-hover in product-gallery.scss
const hoverZoom = window.matchMedia('(hover: hover) and (pointer: fine)');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const clamp = (value) => Math.min(100, Math.max(0, value));

function initProductGallery(root) {
  const viewport = root.querySelector('.js-product-gallery-viewport');
  const source = viewport && viewport.querySelector('source');
  const img = viewport && viewport.querySelector('img');
  const thumbs = root.querySelectorAll('.js-product-gallery-thumb');

  if (!viewport || !source || !img) {
    return;
  }

  const ratio = parseFloat(root.dataset.scale);

  if (ratio > 1) {
    root.style.setProperty('--zoom-scale', String(ratio));
  }

  let zoomed = false;
  let hoverTimer = 0;
  let swapId = 0;
  let pointer = 'mouse'; // the type of the last pointer: a click does not tell it everywhere
  let origin = { x: 50, y: 50 };

  // The position of a point inside the photo box, % (the layout box: it does not depend on the zoom by hover)
  function pointInPhoto(clientX, clientY) {
    const rect = viewport.getBoundingClientRect();

    return {
      x: clamp(((clientX - rect.left - img.offsetLeft) / img.offsetWidth) * 100),
      y: clamp(((clientY - rect.top - img.offsetTop) / img.offsetHeight) * 100),
    };
  }

  function setOrigin(x, y) {
    origin = { x, y };
    viewport.style.setProperty('--zoom-x', `${x}%`);
    viewport.style.setProperty('--zoom-y', `${y}%`);
  }

  // The enlarged file replaces the photo at the first zoom; until it is loaded the usual photo is scaled
  function loadZoom() {
    const url = viewport.dataset.zoom;

    if (!url || viewport.dataset.zoomRequested === url) {
      return;
    }

    viewport.dataset.zoomRequested = url;

    const loader = new Image();

    loader.src = url;
    loader.decode()
      .then(() => {
        if (viewport.dataset.zoom === url) {
          source.srcset = url;
          img.src = url;
        }
      })
      .catch(() => {});
  }

  function setZoom(on) {
    if (on && !viewport.dataset.zoom) {
      return;
    }

    zoomed = on;
    viewport.classList.toggle('product-gallery__viewport--zoomed', on);
    viewport.setAttribute('aria-pressed', String(on));

    if (on) {
      loadZoom();
    }
  }

  function zoomAt(clientX, clientY) {
    const point = pointInPhoto(clientX, clientY);

    setZoom(true);

    if (!zoomed) {
      return;
    }

    if (hoverZoom.matches) {
      setOrigin(point.x, point.y);
      return;
    }

    // Zoom by tap: the photo is wider than the frame now, scroll it so that the tapped point stays under the finger
    const rect = img.getBoundingClientRect();

    viewport.scrollLeft += rect.left + (point.x / 100) * rect.width - clientX;
    viewport.scrollTop += rect.top + (point.y / 100) * rect.height - clientY;
  }

  // The browser's own drag of an image would take the pointer away
  viewport.addEventListener('dragstart', (event) => event.preventDefault());
  viewport.addEventListener('pointerdown', (event) => {
    pointer = event.pointerType;
  });

  viewport.addEventListener('pointerenter', (event) => {
    if (!hoverZoom.matches || event.pointerType === 'touch') {
      return;
    }

    const point = pointInPhoto(event.clientX, event.clientY);

    setOrigin(point.x, point.y);
    hoverTimer = setTimeout(() => setZoom(true), HOVER_DELAY);
  });

  viewport.addEventListener('pointermove', (event) => {
    if (!hoverZoom.matches || event.pointerType === 'touch') {
      return;
    }

    const point = pointInPhoto(event.clientX, event.clientY);

    setOrigin(point.x, point.y);
  });

  viewport.addEventListener('pointerleave', (event) => {
    if (hoverZoom.matches && event.pointerType !== 'touch') {
      clearTimeout(hoverTimer);
      setZoom(false);
    }
  });

  viewport.addEventListener('click', (event) => {
    // By a mouse the zoom is already on (hover), a click must not switch it off
    if (hoverZoom.matches && pointer !== 'touch') {
      return;
    }

    if (zoomed) {
      setZoom(false);
    } else {
      zoomAt(event.clientX, event.clientY);
    }
  });

  viewport.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();

      if (zoomed) {
        setZoom(false);
      } else {
        const rect = viewport.getBoundingClientRect();

        zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2);
      }

      return;
    }

    if (!zoomed) {
      return;
    }

    if (event.key === 'Escape') {
      setZoom(false);
    } else if (hoverZoom.matches && ARROWS[event.key]) {
      // By hover there is no scrolling, so the arrows move the origin of the zoom (by a tap the frame scrolls by itself)
      const [dx, dy] = ARROWS[event.key];

      event.preventDefault();
      setOrigin(clamp(origin.x + dx * ARROW_STEP), clamp(origin.y + dy * ARROW_STEP));
    }
  });

  viewport.addEventListener('blur', () => setZoom(false));

  // The new photo is loaded and decoded while the old one fades out, then it fades in
  async function showPhoto(thumb) {
    const thumbSource = thumb.querySelector('source');
    const thumbImg = thumb.querySelector('img');

    if (!thumbSource || !thumbImg || thumb.getAttribute('aria-pressed') === 'true') {
      return;
    }

    swapId += 1;

    const id = swapId;
    const duration = reducedMotion.matches ? 0 : SWAP_DURATION;

    setZoom(false);
    thumbs.forEach((item) => item.setAttribute('aria-pressed', String(item === thumb)));

    const fadeOut = img.animate({ opacity: 0, scale: 0.96 }, { duration, easing: 'ease', fill: 'forwards' });
    const loader = new Image();

    loader.src = thumbImg.currentSrc || thumbImg.src;
    await Promise.all([fadeOut.finished, loader.decode().catch(() => {})]);

    if (id !== swapId) {
      return;
    }

    source.srcset = thumbSource.srcset;
    img.src = thumbImg.getAttribute('src');
    viewport.dataset.zoom = thumb.dataset.zoom || '';
    delete viewport.dataset.zoomRequested;

    if (!viewport.dataset.zoom) {
      viewport.removeAttribute('data-zoom');
    }

    const fadeIn = img.animate(
      { opacity: [0, 1], scale: [0.96, 1] },
      { duration, easing: 'ease' },
    );

    // Everything older (also the fade-outs of the clicks that were overtaken) is removed, the base style is the visible photo
    img.getAnimations().forEach((animation) => {
      if (animation !== fadeIn) {
        animation.cancel();
      }
    });
  }

  thumbs.forEach((thumb) => {
    thumb.addEventListener('click', () => showPhoto(thumb));
  });
}

document.querySelectorAll('.js-product-gallery').forEach(initProductGallery);
