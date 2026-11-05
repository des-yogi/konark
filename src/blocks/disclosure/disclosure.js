/**
 * Disclosure: a button with [data-disclosure] shows/hides the panel it controls (aria-controls).
 * Used by the main menu submenus and the language switcher; the visuals live in the blocks' CSS ([aria-expanded='true']).
 *
 * Markup:
 *   <div class="wrapper">
 *     <button data-disclosure aria-expanded="false" aria-controls="panel-id">…</button>
 *     <div id="panel-id">…</div>
 *   </div>
 *
 * Rules:
 * - A click on the button toggles its panel; only one disclosure is open at a time.
 * - A click or keyboard focus outside the wrapper (the button's parent element) closes the panel.
 * - Esc closes the panel and returns focus to the button if the focus was inside the wrapper.
 */
function initDisclosure() {
  const SELECTOR = '[data-disclosure]';

  function getOpenButtons() {
    return document.querySelectorAll(SELECTOR + '[aria-expanded="true"]');
  }

  // Closes every open disclosure whose wrapper does not contain the target
  function closeOutside(target) {
    getOpenButtons().forEach(function (button) {
      if (!button.parentElement.contains(target)) {
        button.setAttribute('aria-expanded', 'false');
      }
    });
  }

  document.addEventListener('click', function (e) {
    const button = e.target.closest(SELECTOR);

    if (!button) {
      closeOutside(e.target);
      return;
    }

    const isOpen = button.getAttribute('aria-expanded') === 'true';

    closeOutside(button); // closes the other disclosures
    button.setAttribute('aria-expanded', String(!isOpen));
  });

  document.addEventListener('focusin', function (e) {
    closeOutside(e.target);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;

    getOpenButtons().forEach(function (button) {
      const hadFocus = button.parentElement.contains(document.activeElement);

      button.setAttribute('aria-expanded', 'false');

      if (hadFocus) button.focus();
    });
  });
}

initDisclosure();
