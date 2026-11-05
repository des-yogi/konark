function initPieCharts() {
  const charts = document.querySelectorAll('.pie-chart');

  if (!charts.length) return;

  const SVG_NS = 'http://www.w3.org/2000/svg';

  function createSvgEl(tag, attrs) {
    const el = document.createElementNS(SVG_NS, tag);

    Object.keys(attrs).forEach((name) => el.setAttribute(name, attrs[name]));

    return el;
  }

  charts.forEach((chart) => {
    const label = chart.textContent.trim();
    const value = parseFloat(label);

    if (Number.isNaN(value)) return; // nothing to draw

    const size = parseFloat(chart.dataset.size) || 100;
    const border = parseFloat(chart.dataset.border) || 20;
    const center = size / 2;
    const radius = center - border / 2;
    const circumference = 2 * Math.PI * radius;
    const percent = Math.min(Math.max(value, 0), 100); // clamp to 0..100
    const dash = (circumference * percent) / 100;

    const svg = createSvgEl('svg', {
      class: 'pie-chart__svg',
      viewBox: '0 0 ' + size + ' ' + size,
      width: size,
      height: size,
    });

    const title = createSvgEl('title', {});
    title.textContent = label;

    const circleBack = createSvgEl('circle', {
      class: 'pie-chart__circle-back',
      r: center,
      cx: center,
      cy: center,
    });

    const circle = createSvgEl('circle', {
      class: 'pie-chart__circle',
      r: radius,
      cx: center,
      cy: center,
      'stroke-dasharray': dash + ' ' + circumference,
    });

    // Inline style: CSS "stroke-width" in pie-chart.scss would override the attribute
    // and break the radius math, which is based on data-border
    circle.style.strokeWidth = border;

    const descr = document.createElement('span');
    descr.className = 'pie-chart__descr';
    descr.textContent = label;

    svg.append(title, circleBack, circle);
    chart.replaceChildren(svg, descr);
  });
}

initPieCharts();
