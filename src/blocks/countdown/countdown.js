function initCountdowns() {
  const countdowns = document.querySelectorAll('.countdown');

  if (!countdowns.length) return;

  const pad = (n) => String(n).padStart(2, '0');

  function getTimeRemaining(deadline) {
    const total = Math.max(0, deadline - Date.now()); // never negative

    return {
      total,
      days: Math.floor(total / 86400000),
      hours: Math.floor((total / 3600000) % 24),
      minutes: Math.floor((total / 60000) % 60),
      seconds: Math.floor((total / 1000) % 60),
    };
  }

  function setText(el, value) {
    if (el) el.textContent = value;
  }

  function initClock(clock, deadline) {
    const daysEl = clock.querySelector('.days');
    const hoursEl = clock.querySelector('.hours');
    const minutesEl = clock.querySelector('.minutes');
    const secondsEl = clock.querySelector('.seconds');
    const innerEl = clock.querySelector('.countdown__inner');
    const messageEl = clock.querySelector('.countdown__deadline-message');
    let timerId = null;

    // Returns false when the deadline has passed
    function update() {
      const t = getTimeRemaining(deadline);

      setText(daysEl, t.days);
      setText(hoursEl, pad(t.hours));
      setText(minutesEl, pad(t.minutes));
      setText(secondsEl, pad(t.seconds));

      if (t.total === 0) {
        clearInterval(timerId);
        if (innerEl) innerEl.classList.add('hidden');
        if (messageEl) messageEl.classList.add('visible');
        return false;
      }

      return true;
    }

    // Start ticking only if the deadline is still ahead
    if (update()) {
      timerId = setInterval(update, 1000);
    }
  }

  countdowns.forEach((clock) => {
    const deadline = Date.parse(clock.dataset.deadline || '');

    // Empty or unparsable date → skip this timer instead of rendering NaN
    if (Number.isNaN(deadline)) return;

    initClock(clock, deadline);
  });
}

initCountdowns();

/**
 * Based on https://denis-creative.com/jstimer/
 * Supports multiple timers on a page, each with its own data-deadline.
 *
 * Use ISO 8601 with an explicit offset (parsed identically in all browsers):
 *   data-deadline="2026-12-31T18:59:00+03:00"
 *   data-deadline="2026-12-31"  (midnight UTC)
 */
