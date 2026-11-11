import Swiper from 'swiper';
import { Navigation } from 'swiper/modules';

const MAX_DISTANCE = 10; // anything farther is not visible
const MIN_SLIDES = 10; // a seamless loop needs about twice the number of visible slides (5 in the fan)

// The step between the centres of the cards in the fan is 200px, so the 600px boxes overlap by 400px
// Keep in sync with $slide-width-lg in functions-slider.scss and the breakpoints with $screen-md / $screen-lg
const FAN_OVERLAP = -400;

// From md the not active cards (600px) are narrower than their boxes (686px) and stand in the middle of them,
// so the boxes overlap by half of the difference: the visible gap between the cards stays 20px, during a drag too.
// Keep in sync with $slide-width-md and $scale-md in functions-slider.scss
const MD_GAP = 20 - (686 - 600) / 2;

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

// Clones the slides until the loop has enough of them; clones are hidden from assistive technologies.
// No `inert` here: it also makes the slide transparent for the pointer, and dragging on a clone would not work.
// The cards contain nothing focusable, so the clones stay out of the tab order anyway.
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
      wrapper.append(clone);
      count += 1;
    });
  }
}

// The card size and the stacking order follow the position of the slide: the distance from the active slide
// (0 for the active one, 1 for its neighbours, ...) is calculated by Swiper on every frame of a drag or a transition
function updateSlides(swiper) {
  swiper.slides.forEach((slide) => {
    const distance = Math.min(Math.abs(slide.progress), MAX_DISTANCE);

    slide.style.setProperty('--distance', distance.toFixed(3));
    slide.style.zIndex = String(Math.round((MAX_DISTANCE - distance) * 10)); // the closer to the centre, the higher
  });
}

// A click on an arrow (or the snap after a drag) is a CSS transition: Swiper reports no progress while it runs,
// so the actual position of the wrapper is read on every frame until the transition ends
let frame = 0;

function trackTransition(swiper) {
  cancelAnimationFrame(frame);

  const step = () => {
    swiper.updateProgress(swiper.getTranslate());
    frame = requestAnimationFrame(step);
  };

  step();
}

function stopTracking(swiper) {
  cancelAnimationFrame(frame);
  swiper.updateProgress();
}

// Duplicates made by Swiper for the loop must not be announced either (no `inert`: see fillSlides)
function lockDuplicates(swiper) {
  swiper.slides.forEach((slide) => {
    if (slide.classList.contains('swiper-slide-duplicate')) {
      slide.setAttribute('aria-hidden', 'true');
    }
  });
}

function sync(swiper) {
  lockDuplicates(swiper);
  updateSlides(swiper);
}

function initFunctionsSlider(slider) {
  const wrapper = slider.querySelector('.swiper-wrapper');
  const root = slider.closest('.functions-slider');
  const prevEl = root && root.querySelector('.js-functions-slider-prev');
  const nextEl = root && root.querySelector('.js-functions-slider-next');

  if (!wrapper || !prevEl || !nextEl) {
    return;
  }

  fillSlides(wrapper);

  // The browser's own drag of an image takes the pointer away from Swiper and the swipe stops halfway
  slider.addEventListener('dragstart', (event) => event.preventDefault());

  // Swiper applies the breakpoint over the previous one, so every breakpoint repeats the values that differ
  const swiper = new Swiper(slider, {
    modules: [Navigation],
    loop: true,
    // Swiper counts the visible slides by their boxes and ignores the overlap, so it keeps too few in reserve
    loopAdditionalSlides: 2,
    grabCursor: true,
    speed: reducedMotion.matches ? 0 : 700,
    watchSlidesProgress: true,
    slidesPerView: 'auto',
    spaceBetween: 8,
    centeredSlides: false,
    navigation: { prevEl, nextEl },
    breakpoints: {
      768: { spaceBetween: MD_GAP, centeredSlides: false },
      1280: { spaceBetween: FAN_OVERLAP, centeredSlides: true },
    },
    on: {
      init: sync,
      progress: updateSlides,
      transitionStart: trackTransition,
      transitionEnd: stopTracking,
      slidesUpdated: sync,
      loopFix: sync,
      breakpoint: sync,
    },
  });

  reducedMotion.addEventListener('change', () => {
    swiper.params.speed = reducedMotion.matches ? 0 : 700;
  });
}

document.querySelectorAll('.js-functions-slider').forEach(initFunctionsSlider);
