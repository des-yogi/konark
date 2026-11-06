import Swiper from 'swiper';
import { Autoplay } from 'swiper/modules';

const DEFAULT_DELAY = 5000; // ms, overridden with data-autoplay-delay

// The carousel works below lg only; from lg the cards sit in a CSS grid. Keep in sync with $screen-lg
const desktop = window.matchMedia('(width >= 1280px)');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

// Duplicates made by Swiper for the loop must not be focusable or announced
function lockDuplicates(swiper) {
  swiper.slides.forEach((slide) => {
    if (slide.classList.contains('swiper-slide-duplicate')) {
      slide.setAttribute('aria-hidden', 'true');
      slide.setAttribute('inert', '');
    }
  });
}

function initPartnerGroup(slider) {
  const delay = Number.parseInt(slider.dataset.autoplayDelay, 10) || DEFAULT_DELAY;
  let swiper = null;

  // Autoplay is stopped for users who ask for less motion; manual dragging still works
  const syncAutoplay = () => {
    if (!swiper) {
      return;
    }

    if (reducedMotion.matches) {
      swiper.autoplay.stop();
    } else {
      swiper.autoplay.start();
    }
  };

  // Pause while the keyboard focus is inside; a slide focused outside the visible area is brought into view
  // (otherwise the browser scrolls the clipped container and breaks the layout)
  const onFocusIn = (event) => {
    swiper.autoplay.pause();

    const slide = event.target.closest('.swiper-slide');

    if (slide && !slide.classList.contains('swiper-slide-visible')) {
      swiper.slideTo(swiper.slides.indexOf(slide));
    }
  };

  const onFocusOut = (event) => {
    if (!slider.contains(event.relatedTarget)) {
      swiper.autoplay.resume();
    }
  };

  const mount = () => {
    swiper = new Swiper(slider, {
      modules: [Autoplay],
      loop: true,
      grabCursor: true,
      speed: 600,
      slidesPerView: 'auto',
      spaceBetween: 16,
      centeredSlides: true,
      watchSlidesProgress: true,
      autoplay: {
        delay,
        disableOnInteraction: false,
        pauseOnMouseEnter: true,
      },
      on: {
        init: lockDuplicates,
        slidesUpdated: lockDuplicates,
        loopFix: lockDuplicates,
      },
    });

    syncAutoplay();
    slider.addEventListener('focusin', onFocusIn);
    slider.addEventListener('focusout', onFocusOut);
  };

  // Removes the loop duplicates and the inline styles, so the CSS grid gets the clean list
  const unmount = () => {
    slider.removeEventListener('focusin', onFocusIn);
    slider.removeEventListener('focusout', onFocusOut);
    swiper.destroy(true, true);
    swiper = null;
  };

  const sync = () => {
    if (desktop.matches) {
      if (swiper) {
        unmount();
      }
    } else if (!swiper) {
      mount();
    }
  };

  desktop.addEventListener('change', sync);
  reducedMotion.addEventListener('change', syncAutoplay);
  sync();
}

document.querySelectorAll('.js-partner-group').forEach(initPartnerGroup);
