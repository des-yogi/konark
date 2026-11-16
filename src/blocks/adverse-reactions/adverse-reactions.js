// Adverse reactions: the parallax of the capsules. The pointer position over the area is written
// to the custom properties --x / --y (-1..1); the capsules move and turn from them in CSS.
// Only for a real mouse and when the motion is not reduced; touch devices stay static.
function initCapsules() {
  const area = document.querySelector('.js-capsules');

  if (!area) {
    return;
  }

  const motionQuery = window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');

  const reset = () => {
    area.style.setProperty('--x', 0);
    area.style.setProperty('--y', 0);
  };

  area.addEventListener('pointermove', (event) => {
    if (!motionQuery.matches) {
      return;
    }

    const rect = area.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = ((event.clientY - rect.top) / rect.height) * 2 - 1;

    area.style.setProperty('--x', Math.max(-1, Math.min(1, x)).toFixed(3));
    area.style.setProperty('--y', Math.max(-1, Math.min(1, y)).toFixed(3));
  });

  area.addEventListener('pointerleave', reset);
}

initCapsules();
