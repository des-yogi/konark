import Swiper from 'swiper';
import { Navigation, Thumbs } from 'swiper/modules';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const POSTER_URL = 'https://i.ytimg.com/vi/';
const STUB_WIDTH = 120; // YouTube answers a missing maxresdefault with a 120px stub

// Accepts a watch / youtu.be / embed link or the bare 11-character id
function getVideoId(value = '') {
  const match = value.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/);

  return match ? match[1] : value.trim();
}

// Adds the YouTube poster unless the markup already has its own picture:
// maxresdefault does not exist for every video, then hqdefault is taken (object-fit: cover cuts its black bars)
function addPoster(holder, id) {
  if (!id || holder.querySelector('img')) {
    return;
  }

  const img = new Image();
  let size = 'maxresdefault';

  const fallback = () => {
    if (size === 'maxresdefault') {
      size = 'hqdefault';
      img.src = `${POSTER_URL}${id}/${size}.jpg`;
    }
  };

  img.className = 'product-video__img';
  img.alt = '';
  img.width = 1280;
  img.height = 720;
  img.loading = 'lazy';
  img.decoding = 'async';
  img.addEventListener('error', fallback);
  img.addEventListener('load', () => {
    if (img.naturalWidth <= STUB_WIDTH) {
      fallback();
    }
  });
  img.src = `${POSTER_URL}${id}/${size}.jpg`;
  holder.prepend(img);
}

// The iframe is created on click, so the page does not load the player until it is needed
function play(button) {
  const slide = button.closest('.swiper-slide');
  const iframe = document.createElement('iframe');
  const params = new URLSearchParams({ autoplay: '1', rel: '0', playsinline: '1' });

  iframe.className = 'product-video__iframe';
  iframe.src = `https://www.youtube-nocookie.com/embed/${getVideoId(button.dataset.video)}?${params}`;
  iframe.title = button.dataset.title || '';
  // The attributes of the current YouTube embed code; without the referrer policy the player may refuse to start (error 153)
  iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
  iframe.referrerPolicy = 'strict-origin-when-cross-origin';
  iframe.allowFullscreen = true;

  button.inert = true; // the iframe covers the button, so it must leave the tab order
  slide.append(iframe);
  requestAnimationFrame(() => iframe.focus());
}

// Back to the poster: removing the iframe stops the video and frees the memory
function stop(slide) {
  const iframe = slide.querySelector('.product-video__iframe');

  if (!iframe) {
    return;
  }

  iframe.remove();
  slide.querySelector('.js-product-video-play').inert = false;
}

function initProductVideo(player) {
  const root = player.closest('.product-video');
  const thumbsEl = root && root.querySelector('.js-product-video-thumbs');
  const prevEl = root && root.querySelector('.js-product-video-prev');
  const nextEl = root && root.querySelector('.js-product-video-next');

  if (!thumbsEl || !prevEl || !nextEl) {
    return;
  }

  const buttons = Array.from(player.querySelectorAll('.js-product-video-play'));
  const thumbs = Array.from(thumbsEl.querySelectorAll('.product-video__thumb-media'));

  buttons.forEach((button, index) => {
    const id = getVideoId(button.dataset.video);

    addPoster(button, id);

    if (thumbs[index]) {
      addPoster(thumbs[index], id);
    }

    button.addEventListener('click', () => play(button));
  });

  const thumbButtons = Array.from(thumbsEl.querySelectorAll('.product-video__thumb-btn'));
  const speed = () => (reducedMotion.matches ? 0 : 300);

  // The thumbnails are a slider of their own; Swiper keeps it in step with the main one.
  // Keep in sync with $screen-md / $screen-lg
  const thumbsSwiper = new Swiper(thumbsEl, {
    slidesPerView: 3,
    spaceBetween: 4,
    watchSlidesProgress: true,
    speed: speed(),
    breakpoints: {
      768: { spaceBetween: 20 },
      1280: { spaceBetween: 4 },
    },
  });

  const syncCurrent = (swiper) => {
    thumbButtons.forEach((thumbButton, index) => {
      if (index === swiper.activeIndex) {
        thumbButton.setAttribute('aria-current', 'true');
      } else {
        thumbButton.removeAttribute('aria-current');
      }
    });
  };

  const swiper = new Swiper(player, {
    modules: [Navigation, Thumbs],
    slidesPerView: 'auto',
    spaceBetween: 16,
    speed: speed(),
    navigation: { prevEl, nextEl },
    thumbs: { swiper: thumbsSwiper },
    on: {
      init: syncCurrent,
      slideChange(instance) {
        syncCurrent(instance);
        instance.slides.forEach((slide, index) => {
          if (index !== instance.activeIndex) {
            stop(slide);
          }
        });
      },
    },
  });

  // A slide focused with the keyboard is brought into view by Swiper: the browser's own scrolling of the clipped container
  // is undone, otherwise it would shift the slides twice
  player.addEventListener('focusin', (event) => {
    const slide = event.target.closest('.swiper-slide');

    player.scrollLeft = 0;

    if (slide) {
      swiper.slideTo(swiper.slides.indexOf(slide));
    }
  });

  // Swiper reacts to a pointer click on a thumbnail only; Enter and Space on the button come as a plain click
  thumbButtons.forEach((thumbButton, index) => {
    thumbButton.addEventListener('click', () => swiper.slideTo(index));
  });

  reducedMotion.addEventListener('change', () => {
    swiper.params.speed = speed();
    thumbsSwiper.params.speed = speed();
  });
}

document.querySelectorAll('.js-product-video').forEach(initProductVideo);
