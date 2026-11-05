function initFieldFile() {
  const inputs = document.querySelectorAll('.field-file__input');

  if (!inputs.length) return;

  inputs.forEach((input) => {
    const field = input.closest('.field-file');
    const label = field ? field.querySelector('.field-file__name-text') : null;

    if (!label) return;

    // Keep the initial (placeholder) content to restore it when the selection is cleared
    const initialNodes = Array.from(label.childNodes, (node) => node.cloneNode(true));

    function getCaption(files) {
      if (files.length === 1) return files[0].name;

      const template = input.dataset.multipleCaption;

      return template
        ? template.replace('{count}', files.length)
        : Array.from(files, (file) => file.name).join(', ');
    }

    function update() {
      const files = input.files;

      if (!files || !files.length) {
        label.replaceChildren(...initialNodes.map((node) => node.cloneNode(true)));
        return;
      }

      const nameEl = document.createElement('span');
      nameEl.className = 'field-file__file-name';
      nameEl.textContent = getCaption(files); // textContent: file names are user input

      label.replaceChildren(nameEl);
    }

    input.addEventListener('change', update);

    // Form reset (e.g. AjaxForm after a successful submit) clears files without "change"
    if (input.form) {
      input.form.addEventListener('reset', () => setTimeout(update, 0));
    }
  });
}

initFieldFile();
