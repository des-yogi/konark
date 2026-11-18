// File field: shows the name of the chosen file and checks its type (accept) and size (data-max-size, bytes).
// There are no texts in the script: the messages come from data-msg-type / data-msg-size of the input,
// so the CMS can output them in any language; an empty required field gets the browser message.

function initFieldFile(input) {
  const field = input.closest('.field-file');
  const value = field ? field.querySelector('.field-file__value') : null;
  const help = field ? field.querySelector('.field-file__help-text') : null;

  if (!value) return;

  // The initial texts are restored when the file is removed or the error is gone
  const buttonText = value.textContent;
  const hint = help ? help.textContent : '';
  const maxSize = Number(input.dataset.maxSize) || 0;
  const accepted = input.accept
    .split(',')
    .map((rule) => rule.trim().toLowerCase())
    .filter(Boolean);

  // ".pdf" is checked by the file name, "application/pdf" by the MIME type
  const isAccepted = (file) =>
    !accepted.length ||
    accepted.some((rule) => (rule.startsWith('.') ? file.name.toLowerCase().endsWith(rule) : file.type === rule));

  function getError(file) {
    if (!isAccepted(file)) return input.dataset.msgType || '';
    if (maxSize && file.size > maxSize) return input.dataset.msgSize || '';

    return '';
  }

  function render(message) {
    const file = input.files && input.files[0];

    field.classList.toggle('field-file--selected', Boolean(file));
    field.classList.toggle('field-file--error', Boolean(message));
    value.textContent = file ? file.name : buttonText; // textContent: the file name is user input

    if (help) help.textContent = message || hint;

    if (message) {
      input.setAttribute('aria-invalid', 'true');
    } else {
      input.removeAttribute('aria-invalid');
    }
  }

  function update() {
    const file = input.files && input.files[0];
    const message = file ? getError(file) : '';

    // The same message stops the submit of a wrong file
    input.setCustomValidity(message);
    render(message);
  }

  input.addEventListener('change', update);

  // Submit with an empty required field (or a wrong file): show the message in the field too
  input.addEventListener('invalid', () => render(input.validationMessage));

  // Form reset (e.g. AjaxForm after a successful submit) clears the files without "change"
  if (input.form) {
    input.form.addEventListener('reset', () => setTimeout(update, 0));
  }
}

function initFieldFiles() {
  document.querySelectorAll('.field-file__input').forEach(initFieldFile);
}

initFieldFiles();
