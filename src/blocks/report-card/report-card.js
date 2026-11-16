// Copy buttons: put the value of data-copy to the clipboard and show a short "copied" message in the status element
const copyButtons = document.querySelectorAll('.js-copy');

if (copyButtons.length) {
  const STATUS_DELAY = 2000;

  copyButtons.forEach((button) => {
    const status = button.parentElement.querySelector('.report-card__status');
    let timer;

    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(button.dataset.copy);
      } catch {
        return;
      }

      if (!status) {
        return;
      }

      status.textContent = button.dataset.copied;
      status.classList.add('report-card__status--visible');

      clearTimeout(timer);
      timer = setTimeout(() => {
        status.classList.remove('report-card__status--visible');
        status.textContent = '';
      }, STATUS_DELAY);
    });
  });
}
