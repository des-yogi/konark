import Swiper from 'swiper';
import { Autoplay } from 'swiper/modules';

const DEFAULT_DELAY = 5000; // ms, overridden with data-autoplay-delay
const MIN_SLIDES = 12; // a seamless loop needs about twice the largest slidesPerView (6 from 1600px)

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

// Clones the slides until the loop has enough of them; clones are hidden from assistive technologies and the tab order
function fillSlides(wrapper) {
  const originals = Array.from(wrapper.children);

  if (!originals.length) {
    return;
  }

  let count = originals.length;

  while (count < MIN_SLIDES) {
    originals.forEach((slide) => {
      const clone = slide.cloneNode(true);

      clone.setAttribute('aria-hidden', 'true');
      clone.setAttribute('inert', '');
      wrapper.append(clone);
      count += 1;
    });
  }
}

// Duplicates made by Swiper for the loop must not be focusable or announced either
function lockDuplicates(swiper) {
  swiper.slides.forEach((slide) => {
    if (slide.classList.contains('swiper-slide-duplicate')) {
      slide.setAttribute('aria-hidden', 'true');
      slide.setAttribute('inert', '');
    }
  });
}

function initPartnersSlider(slider) {
  const wrapper = slider.querySelector('.swiper-wrapper');

  if (!wrapper) {
    return;
  }

  fillSlides(wrapper);

  const delay = Number.parseInt(slider.dataset.autoplayDelay, 10) || DEFAULT_DELAY;

  const swiper = new Swiper(slider, {
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
    // Swiper applies only the largest matching breakpoint, so every one repeats the common values.
    // Keep in sync with $screen-md / $screen-lg / $screen-xxl
    breakpoints: {
      768: { slidesPerView: 'auto', spaceBetween: 20 },
      1280: { slidesPerView: 5, spaceBetween: 20, centeredSlides: false },
      1600: { slidesPerView: 6, spaceBetween: 20, centeredSlides: false },
    },
    on: {
      init: lockDuplicates,
      slidesUpdated: lockDuplicates,
      loopFix: lockDuplicates,
      breakpoint: lockDuplicates,
    },
  });

  // Autoplay is stopped for users who ask for less motion; manual dragging still works
  const syncAutoplay = () => {
    if (reducedMotion.matches) {
      swiper.autoplay.stop();
    } else {
      swiper.autoplay.start();
    }
  };

  syncAutoplay();
  reducedMotion.addEventListener('change', syncAutoplay);

  // Pause while the keyboard focus is inside; a slide focused outside the visible area is brought into view
  // (otherwise the browser scrolls the clipped container and breaks the layout)
  slider.addEventListener('focusin', (event) => {
    swiper.autoplay.pause();

    const slide = event.target.closest('.swiper-slide');

    if (slide && !slide.classList.contains('swiper-slide-visible')) {
      swiper.slideTo(swiper.slides.indexOf(slide));
    }
  });

  slider.addEventListener('focusout', (event) => {
    if (!slider.contains(event.relatedTarget)) {
      swiper.autoplay.resume();
    }
  });
}

document.querySelectorAll('.js-partners-slider').forEach(initPartnersSlider);
