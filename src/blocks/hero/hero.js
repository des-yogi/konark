// Hero 3D emblem loader (part of script.min.js, a few lines only).
// Three.js and the scene live in a separate module (hero-emblem.js → build/js/hero-emblem.min.js),
// loaded with import() after the page load event, when the browser is idle.
// With JS the poster is hidden by CSS: the 3D emblem fades in instead of it.
// The poster is shown (--static) only when 3D is off: reduced motion, data saver,
// no WebGL 2 (Three.js needs it), or any loading error. Without JS the poster is always visible.

const IDLE_TIMEOUT = 2000; // ms: the latest start after the load event, even if the browser stays busy
const STATIC_CLASS = 'hero__emblem--static'; // keep in sync with hero-emblem.js

function initHeroEmblem() {
  const emblem = document.querySelector('.js-hero-emblem');

  if (!emblem) return;

  const showPoster = () => emblem.classList.add(STATIC_CLASS);
  const { module: moduleUrl, model: modelUrl } = emblem.dataset;

  if (
    !moduleUrl
    || !modelUrl
    || window.matchMedia('(prefers-reduced-motion: reduce)').matches
    || navigator.connection?.saveData
    || !('WebGL2RenderingContext' in window)
  ) {
    showPoster();
    return;
  }

  const start = () => {
    // Paths are resolved against the page, like the image paths in the markup.
    // A variable (not a string literal) in import(): esbuild leaves it alone and does not bundle the module
    const url = new URL(moduleUrl, document.baseURI).href;

    import(url)
      .then(({ initEmblem }) => initEmblem(emblem, new URL(modelUrl, document.baseURI).href))
      .catch((error) => {
        console.warn('Hero emblem: 3D is off, the poster is shown.', error);
        showPoster();
      });
  };

  const scheduleStart = () => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(start, { timeout: IDLE_TIMEOUT });
    } else {
      setTimeout(start, 200); // Safari has no requestIdleCallback
    }
  };

  if (document.readyState === 'complete') {
    scheduleStart();
  } else {
    window.addEventListener('load', scheduleStart, { once: true });
  }
}

initHeroEmblem();
