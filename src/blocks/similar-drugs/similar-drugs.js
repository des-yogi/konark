import Swiper from 'swiper';
import { Navigation } from 'swiper/modules';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function initSimilarDrugs(slider) {
  const root = slider.closest('.similar-drugs');
  const prevEl = root && root.querySelector('.js-similar-drugs-prev');
  const nextEl = root && root.querySelector('.js-similar-drugs-next');

  if (!prevEl || !nextEl) {
    return;
  }

  // The browser's own drag of a link takes the pointer away from Swiper and the swipe stops halfway
  slider.addEventListener('dragstart', (event) => event.preventDefault());

  const swiper = new Swiper(slider, {
    modules: [Navigation],
    slidesPerView: 'auto', // the fixed card widths come from the CSS
    spaceBetween: 20, // keep in sync with $gap in the scss
    grabCursor: true,
    watchSlidesProgress: true, // gives the .swiper-slide-visible class used below
    speed: reducedMotion.matches ? 0 : 400,
    breakpoints: {
      // $screen-xl: exactly 4 cards in the container
      1366: {
        slidesPerView: 4,
      },
    },
    navigation: {
      prevEl,
      nextEl,
    },
  });

  // A card focused by the keyboard outside the visible area is brought into view
  slider.addEventListener('focusin', (event) => {
    const slide = event.target.closest('.swiper-slide');

    if (slide && !slide.classList.contains('swiper-slide-visible')) {
      swiper.slideTo(swiper.slides.indexOf(slide));
    }
  });
}

document.querySelectorAll('.js-similar-drugs').forEach(initSimilarDrugs);
