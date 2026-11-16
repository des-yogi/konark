// Contact form: the submit button is locked until the consent is checked.
// The phone mask is the common script field-text/field-text.js (class js-phone-mask).

function initConsent(form) {
  const consent = form.querySelector('.js-contact-us-consent');
  const submit = form.querySelector('.js-contact-us-submit');

  if (!consent || !submit) return;

  const sync = () => {
    submit.disabled = !consent.checked;
  };

  consent.addEventListener('change', sync);
  window.addEventListener('pageshow', sync); // the browser may restore the checkbox state after the load
  sync();
}

function initContactUs() {
  const form = document.querySelector('.js-contact-us');

  if (!form) return;

  initConsent(form);
}

initContactUs();
