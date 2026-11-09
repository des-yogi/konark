/**
 * Главный JS-файл проекта (точка входа)
 * Минимальная инициализация: lazy-bg, theme switcher
 * (no-js → js и начальная тема выставляются inline-скриптом в _include/page_head.html)
 * Подключение сторонних библиотек (например, CoreUI) и кастомных скриптов блоков
 */

// =============================================================================
//  Подключение и конфигурация скриптов CoreUI в версии Bootstrap
//  Конфигурация стилей производится в отдельном файле src/scss/_coreui-custom.scss
// =============================================================================
// При сборке бандла esbuild сборщик сам находит и подключает @popperjs/core",
// поэтому его не надо импортировать вручную!
// Если подключение через внешний скрипт <script src="js/popper.min.js"></script>
// надо вручную импортировать как указано ниже.
import * as Popper from '@popperjs/core';
//window.Popper = Popper; // Делаем Popper доступным для CoreUI
//import "@popperjs/core"; // CoreUI 5.6.1 требует Popper.js для некоторых компонентов (dropdown, tooltip, popover), но только в случае программного управления ими (требуется проверка). Если используются только декларативные атрибуты, можно не подключать и не беспокоиться о Popper.js, модули сами подтянут нужные им зависимости.

// import '@coreui/coreui/js/src/dropdown.js';
import '@coreui/coreui/js/src/modal.js';
import '@coreui/coreui/js/src/collapse.js';
import '@coreui/coreui/js/src/tab.js';
// import '@coreui/coreui/js/src/navigation.js';
import '@coreui/coreui/js/src/offcanvas.js';
// import Popover from '@coreui/coreui/js/src/popover.js';
import Tooltip from '@coreui/coreui/js/src/tooltip.js';
// import '@coreui/coreui/js/src/scrollspy.js';
// import '@coreui/coreui/js/src/alert.js';
// import '@coreui/coreui/js/src/button.js';
// import '@coreui/coreui/js/src/carousel.js';
// import '@coreui/coreui/js/src/sidebar.js';
// import Toast from '@coreui/coreui/js/src/toast.js';
// import '@coreui/coreui/js/src/chip.js';
// import '@coreui/coreui/js/src/chip-input.js';

// =============================================================================
//  Enable popovers everywhere (by data-coreui-toggle="popover" attribute)
// =============================================================================
// const popoverTriggerList = document.querySelectorAll('[data-coreui-toggle="popover"]')
// const popoverList = [...popoverTriggerList].map(popoverTriggerEl => new Popover(popoverTriggerEl))

// =============================================================================
//  Enable Bootstrap tooltips
// =============================================================================
// const tooltipTriggerList = document.querySelectorAll('[data-coreui-toggle="tooltip"]')
// const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new Tooltip(tooltipTriggerEl))

// =============================================================================
//  Toasts are opt-in for performance reasons, so you must initialize them yourself.
// =============================================================================
// const toastTrigger = document.getElementById('liveToastBtn')
// const toastLiveExample = document.getElementById('liveToast')

// if (toastTrigger) {
//   const toastCoreUI = Toast.getOrCreateInstance(toastLiveExample)
//   toastTrigger.addEventListener('click', () => {
//     toastCoreUI.show()
//   })
// }

// =============================================================================
//  1. Замена класса no-js → js
//     Перенесено в inline-скрипт в _include/page_head.html (до загрузки CSS)
// =============================================================================

// =============================================================================
//  2. Фикс 100vh на мобилках
//     Удалён: используйте в CSS svh / dvh / lvh (например, min-height: 100svh)
// =============================================================================

// =============================================================================
//  3. Lazy-загрузка фоновых изображений (data-bg-webp / data-bg)
//     data-bg-webp has priority (WebP is supported by all current browsers),
//     data-bg is used when only one format is provided.
//     The background is applied only after the image is decoded (no half-loaded flash).
//     Loaded elements get the data-bg-loaded attribute — a hook for optional CSS.
// =============================================================================

const LAZY_BG_SELECTOR = '[data-bg], [data-bg-webp]';
let lazyBgObserver = null;

function loadBackground(element) {
  const src = element.dataset.bgWebp || element.dataset.bg;

  element.removeAttribute('data-bg-webp');
  element.removeAttribute('data-bg');

  if (!src) return;

  const img = new Image();
  img.src = src;

  img.decode()
    .catch(function () {
      // Decode can fail (e.g. broken image) — let the browser handle it as a normal background
    })
    .then(function () {
      element.style.backgroundImage = 'url("' + src.replace(/"/g, '\\"') + '")';
      element.setAttribute('data-bg-loaded', '');
    });
}

// root: document (on page load) or a container with newly inserted content (e.g. after HTMX swap)
function initLazyBackgrounds(root) {
  const scope = root || document;
  const elements = Array.from(scope.querySelectorAll(LAZY_BG_SELECTOR));

  // The inserted root itself may carry data-bg (htmx:load passes the new element)
  if (scope !== document && scope.matches(LAZY_BG_SELECTOR)) {
    elements.push(scope);
  }

  if (!elements.length) return;

  if (!lazyBgObserver) {
    lazyBgObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;

        observer.unobserve(entry.target);
        loadBackground(entry.target);
      });
    }, { rootMargin: '200px 0px' }); // start loading a bit before the element enters the viewport
  }

  elements.forEach(function (el) {
    lazyBgObserver.observe(el);
  });
}

// HTMX: lazy backgrounds in content inserted by HTMX (uncomment if the page uses HTMX)
// document.addEventListener('htmx:load', function (e) {
//   initLazyBackgrounds(e.detail.elt);
// });

// =============================================================================
//  4. Theme Switcher (переключатель светлой/тёмной темы)
// =============================================================================

/**
 * Theme switcher.
 *
 * Rules:
 * - No saved choice → follow the system theme (and react to its changes live).
 * - User clicks the toggle → the choice is saved to localStorage and always applied
 *   until it is changed again or localStorage is cleared.
 * - All open tabs stay in sync (storage event), including back/forward cache restores.
 *
 * Requirements:
 * - Inline script in _include/page_head.html sets the initial data-theme before CSS loads.
 * - Toggle button with id="toggle-theme" (optional on a page).
 * - CSS: .page.theme-transition * { transition: ... } (see page.scss).
 */
function initThemeSwitcher() {
  const STORAGE_KEY = 'theme'; // keep in sync with the inline script in page_head.html
  const TRANSITION_MS = 350;
  const root = document.documentElement;
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let transitionTimer;

  // Returns 'dark' | 'light' | null; never throws (storage may be blocked)
  function readSaved() {
    try {
      const value = localStorage.getItem(STORAGE_KEY);
      return value === 'dark' || value === 'light' ? value : null;
    } catch (e) {
      return null;
    }
  }

  function save(theme) {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (e) {
      // Storage is blocked: the theme still switches, it just won't persist
    }
  }

  function getSystemTheme() {
    return systemDark.matches ? 'dark' : 'light';
  }

  function setTheme(theme, smooth) {
    if (root.getAttribute('data-theme') === theme) return;

    if (smooth && !reduceMotion.matches) {
      clearTimeout(transitionTimer);
      root.classList.add('theme-transition');
      transitionTimer = setTimeout(function () {
        root.classList.remove('theme-transition');
      }, TRANSITION_MS);
    }

    root.setAttribute('data-theme', theme);
  }

  // Saved choice wins, otherwise the system theme
  function syncTheme(smooth) {
    setTheme(readSaved() || getSystemTheme(), smooth);
  }

  // Safety net: in case the inline head script is missing on a page
  syncTheme(false);

  const toggleBtns = document.querySelectorAll('.js-theme-toggle');
  toggleBtns.forEach(function (toggleBtn) {
    toggleBtn.addEventListener('click', function () {
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      setTheme(next, true);
      save(next);
    });
  });

  // System theme changed: follow it only if the user hasn't chosen manually
  systemDark.addEventListener('change', function () {
    if (!readSaved()) {
      setTheme(getSystemTheme(), true);
    }
  });

  // Another tab changed or cleared storage (e.key is null after localStorage.clear())
  window.addEventListener('storage', function (e) {
    if (e.key === STORAGE_KEY || e.key === null) {
      syncTheme(true);
    }
  });

  // Page restored from back/forward cache may hold a stale theme
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) {
      syncTheme(false);
    }
  });
}

// =============================================================================
//  5. Инициализация
// =============================================================================

function initGlobal() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initLazyBackgrounds();
    });
  } else {
    initLazyBackgrounds();
  }

  initThemeSwitcher();
}

initGlobal();


// =============================================================================
//  Fancybox UI
// =============================================================================
//import { Fancybox } from "@fancyapps/ui/dist/fancybox/";
//Fancybox.bind("[data-fancybox]", {
  // Your custom options
//});

// =============================================================================
//  Swiper.js
// =============================================================================
//import Swiper from 'swiper';
//import { Navigation, Pagination, Scrollbar } from 'swiper/modules'; // Подсключение помодульно
// Подключение бандла Swiper со ВСЕМИ модулями
// import Swiper from 'swiper/bundle';

// init Swiper:
// const swiperTest = new Swiper('.swiper', {
//   modules: [Navigation, Pagination, Scrollbar],
//   // Optional parameters
//   spaceBetween: 20,
//   slidesPerView: 1,
//   loop: true,

//   // If we need pagination
//   pagination: {
//     el: '.swiper-pagination',
//   },
//   // Navigation arrows
//   navigation: {
//     nextEl: '.swiper-button-next',
//     prevEl: '.swiper-button-prev',
//   },
//   // And if we need scrollbar
//   scrollbar: {
//     el: '.swiper-scrollbar',
//   },
// });


// =============================================================================
//  Сниппеты-напоминалки (закомментированы)
// =============================================================================

// --- DOMContentLoaded без jQuery (современный вариант) ---
// function ready(fn) {
//   if (document.readyState !== 'loading') {
//     fn();
//   } else {
//     document.addEventListener('DOMContentLoaded', fn);
//   }
// }
//
// ready(function () {
//   // code
// });

// --- Изоляция без jQuery (IIFE) ---
// (function () {
//   // code
// }());

// --- Выполнить код только на определённой ширине ---
// if (window.matchMedia('(width >= 1366px)').matches) {
//   // код для экранов >= 1366px
// }
