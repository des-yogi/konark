function initAgreementCheckbox() {
  const checkboxes = document.querySelectorAll('input[name="agreement"]');

  if (!checkboxes.length) return;

  checkboxes.forEach((checkbox) => {
    const form = checkbox.form;

    if (!form) return;

    // A <button> without a type inside a form is a submit button too
    const submitBtns = form.querySelectorAll(
      'button:not([type]), button[type="submit"], input[type="submit"]'
    );

    if (!submitBtns.length) return;

    const sync = () => {
      submitBtns.forEach((btn) => {
        btn.disabled = !checkbox.checked;
      });
    };

    checkbox.addEventListener('change', sync);

    // On form reset the checkbox returns to its default state only after the event
    form.addEventListener('reset', () => setTimeout(sync, 0));

    // Initial state: the button must match the checkbox right after page load
    sync();
  });
}

initAgreementCheckbox();
