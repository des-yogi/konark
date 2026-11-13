// Contact form: the submit button is locked until the consent is checked;
// the phone field has an input mask (+380 XX XXX XX XX) and an error message on blur.
// There are no texts in the script: the message comes from the data-msg-invalid attribute of the field,
// so the CMS can output it in any language.

const PHONE_PREFIX = '380'; // keep in sync with the placeholder and the message in the markup
const PHONE_DIGITS = 12; // 380 + 9 digits

// Keeps only digits and completes the country code: 067... -> 38067..., 80... -> 380...
function normalizePhone(raw) {
  let digits = raw.replace(/\D/g, '');

  if (digits && !digits.startsWith(PHONE_PREFIX) && !PHONE_PREFIX.startsWith(digits)) {
    if (digits.startsWith('80') || '80'.startsWith(digits)) {
      digits = `3${digits}`;
    } else if (digits.startsWith('0')) {
      digits = `38${digits}`;
    } else {
      digits = PHONE_PREFIX + digits;
    }
  }

  return digits.slice(0, PHONE_DIGITS);
}

// 380671234567 -> +380 67 123 45 67 (the group is added only when it has digits)
function formatPhone(digits) {
  if (!digits) return '';

  const rest = digits.slice(3);
  const groups = [rest.slice(0, 2), rest.slice(2, 5), rest.slice(5, 7), rest.slice(7, 9)].filter(Boolean);

  return [`+${digits.slice(0, 3)}`, ...groups].join(' ');
}

// Reformats the value and keeps the caret after the same digit
function applyMask(input) {
  const { value, selectionStart } = input;
  const atEnd = selectionStart === value.length;
  const digitsBefore = value.slice(0, selectionStart).replace(/\D/g, '').length;

  input.value = formatPhone(normalizePhone(value));

  let caret = input.value.length;

  if (!atEnd) {
    let count = 0;

    for (caret = 0; caret < input.value.length && count < digitsBefore; caret++) {
      if (/\d/.test(input.value[caret])) count++;
    }
  }

  input.setSelectionRange(caret, caret);
}

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

function initPhone(form) {
  const input = form.querySelector('.js-contact-us-phone');

  if (!input) return;

  const field = input.closest('.field-text');
  const help = field ? field.querySelector('.field-text__help-text') : null;
  const message = input.dataset.msgInvalid || '';
  const isInvalid = () => input.value !== '' && input.value.replace(/\D/g, '').length !== PHONE_DIGITS;

  function showError(on) {
    if (field) field.classList.toggle('field-text--error', on);
    if (help) help.textContent = on ? message : '';

    if (on) {
      input.setAttribute('aria-invalid', 'true');
    } else {
      input.removeAttribute('aria-invalid');
    }
  }

  input.addEventListener('input', () => {
    applyMask(input);

    // The same message stops the submit of an incomplete number
    input.setCustomValidity(isInvalid() ? message : '');

    if (!isInvalid()) showError(false);
  });

  input.addEventListener('blur', () => showError(isInvalid()));
}

function initContactUs() {
  const form = document.querySelector('.js-contact-us');

  if (!form) return;

  initConsent(form);
  initPhone(form);
}

initContactUs();
