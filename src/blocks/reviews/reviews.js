import Swiper from 'swiper';
import { Navigation } from 'swiper/modules';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

// Statistics: the CMS gives only the number of reviews for every rating (data-count on the rows),
// the total, the shares of the bars and the average rating are counted here
function initStats(root) {
  const rows = [...root.querySelectorAll('.js-reviews-bar')];
  const score = root.querySelector('.js-reviews-score');
  const stars = root.querySelector('.js-reviews-stars');
  const totalEl = root.querySelector('.js-reviews-total');

  if (!rows.length) {
    return;
  }

  const counts = rows.map((row) => Number(row.dataset.count) || 0);
  const total = counts.reduce((sum, count) => sum + count, 0);
  const points = rows.reduce((sum, row, i) => sum + Number(row.dataset.stars) * counts[i], 0);
  const rating = total ? Math.round((points / total) * 10) / 10 : 0;

  // "1 відгук / 2 відгуки / 5 відгуків": the plural form of the page language, the words come from the section
  const plural = new Intl.PluralRules(document.documentElement.lang || 'uk');
  const withWord = (count) => `${count} ${root.dataset[plural.select(count)] || root.dataset.many}`;

  rows.forEach((row, i) => {
    const countEl = row.querySelector('.js-reviews-bar-count');

    row.style.setProperty('--share', `${total ? (counts[i] / total) * 100 : 0}%`);

    if (countEl) {
      countEl.textContent = withWord(counts[i]);
    }
  });

  if (score) {
    score.textContent = rating.toFixed(1);
  }

  if (stars) {
    stars.style.setProperty('--rating', rating);
  }

  if (totalEl) {
    totalEl.textContent = withWord(total);
  }
}

function initSlider(root) {
  const slider = root.querySelector('.js-reviews-slider');
  const prevEl = root.querySelector('.js-reviews-prev');
  const nextEl = root.querySelector('.js-reviews-next');

  if (!slider || !prevEl || !nextEl) {
    return;
  }

  new Swiper(slider, {
    modules: [Navigation],
    slidesPerView: 1,
    spaceBetween: 20,
    grabCursor: true,
    speed: reducedMotion.matches ? 0 : 400,
    breakpoints: {
      // $screen-md
      768: {
        slidesPerView: 2,
      },
      // $screen-lg
      1280: {
        slidesPerView: 3,
      },
    },
    navigation: {
      prevEl,
      nextEl,
    },
  });
}

document.querySelectorAll('.js-reviews').forEach((root) => {
  initStats(root);
  initSlider(root);
});
