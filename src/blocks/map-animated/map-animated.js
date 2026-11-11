/* global am5, am5map, am5geodata_worldLow, am5geodata_lang_UK */

// Map with animated routes into and out of the hub. amCharts 5 is loaded only when the block
// gets close to the viewport, so the library costs nothing to pages that are not scrolled that far.

const AMCHARTS_URL = 'https://cdn.amcharts.com/lib/5/';
const LOAD_MARGIN = '300px'; // start loading this far before the block enters the viewport
const THEME_DELAY = 350; // ms, the theme switch animates the tokens: keep in sync with $transition-time (+ margin)

// Defaults, overridden with data-* attributes of the same name:
// timings in ms (draw, hold, gap, stagger, pulse); margin — the view shows the cities
// plus this share of their spread on every side (0.3 = 30%)
const DEFAULTS = { draw: 1600, hold: 300, gap: 500, stagger: 40, pulse: 3200, margin: 0.3 };

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

// Country names in the tooltips: Ukrainian on the Ukrainian pages, English (built into the geodata) elsewhere
const isUkrainian = document.documentElement.lang.startsWith('uk');

let libsPromise = null;

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');

    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.append(script);
  });
}

// The core goes first: the map module and the geodata need it. Loaded once for all maps on the page.
function loadLibs() {
  libsPromise ??= loadScript(`${AMCHARTS_URL}index.js`).then(() => Promise.all([
    loadScript(`${AMCHARTS_URL}map.js`),
    loadScript(`${AMCHARTS_URL}geodata/worldLow.js`),
    isUkrainian && loadScript(`${AMCHARTS_URL}geodata/lang/UK.js`),
  ]));

  return libsPromise;
}

// Reads a color token and turns it into an amCharts color + opacity.
// The canvas normalizes any CSS color to '#rrggbb' or 'rgba(r, g, b, a)'.
const probe = document.createElement('canvas').getContext('2d');

function readColor(styles, name) {
  probe.fillStyle = '#000';
  probe.fillStyle = styles.getPropertyValue(name).trim();

  const value = probe.fillStyle;

  if (value.startsWith('#')) {
    return { color: am5.color(value), opacity: 1 };
  }

  const [r, g, b, a] = value.match(/[\d.]+/g).map(Number);

  return { color: am5.color((r << 16) | (g << 8) | b), opacity: a };
}

function readSettings(el) {
  const settings = {};

  Object.keys(DEFAULTS).forEach((key) => {
    const value = Number.parseFloat(el.dataset[key]);

    settings[key] = Number.isNaN(value) ? DEFAULTS[key] : value;
  });

  settings.animate = el.dataset.animate !== 'false' && !reducedMotion.matches;

  return settings;
}

// Mercator stretches the map to the north, so the vertical margin is measured on the projected map,
// not in degrees: otherwise the northern margin comes out bigger and the cities sit low in the frame
const toMercatorY = (lat) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
const fromMercatorY = (y) => (Math.atan(Math.exp(y)) * 360) / Math.PI - 90;

// The view: a rectangle around all the cities, with the same margin on every side
function getBounds(cities, margin) {
  const lons = cities.map((city) => city.lon);
  const ys = cities.map((city) => toMercatorY(city.lat));
  const dLon = (Math.max(...lons) - Math.min(...lons)) * margin;
  const dY = (Math.max(...ys) - Math.min(...ys)) * margin;

  return am5map.getGeoRectangle(
    Math.min(fromMercatorY(Math.max(...ys) + dY), 85),
    Math.max(...lons) + dLon,
    Math.max(fromMercatorY(Math.min(...ys) - dY), -85),
    Math.min(...lons) - dLon,
  );
}

function createMap(el) {
  const data = JSON.parse(el.querySelector('.js-map-animated-data').textContent);
  const settings = readSettings(el);
  const hub = { ...data.hub, id: 'hub', isHub: true };
  const routes = data.routes.map((route, index) => ({ ...route, id: `city-${index}` }));
  const cities = [hub, ...routes];
  const countryIds = [...new Set(cities.map((city) => city.country))];

  const root = am5.Root.new(el.querySelector('.js-map-animated-canvas'));

  // Decorative map: no panning, no zooming, the page scrolls freely over it
  const chart = root.container.children.push(am5map.MapChart.new(root, {
    panX: 'none',
    panY: 'none',
    wheelX: 'none',
    wheelY: 'none',
    pinchZoom: false,
    projection: am5map.geoMercator(),
  }));

  // Land: all countries in one color without borders. The view is set by the frame below, not by the land.
  const landSeries = chart.series.push(am5map.MapPolygonSeries.new(root, {
    geoJSON: am5geodata_worldLow,
    geodataNames: isUkrainian ? am5geodata_lang_UK : undefined,
    exclude: ['AQ'],
    affectsBounds: false,
  }));

  landSeries.mapPolygons.template.setAll({ strokeOpacity: 0 });

  // One tooltip for countries and cities, colored from the tokens in applyColors()
  const tooltip = am5.Tooltip.new(root, { getFillFromSprite: false, autoTextColor: false });

  tooltip.label.setAll({
    fontFamily: getComputedStyle(el).fontFamily,
    fontSize: 14,
    fontWeight: '600',
  });

  // Invisible frame around the cities: the chart fits it on every resize
  const frameSeries = chart.series.push(am5map.MapPolygonSeries.new(root, {}));

  frameSeries.mapPolygons.template.setAll({ fillOpacity: 0, strokeOpacity: 0 });
  frameSeries.data.push({ geometry: getBounds(cities, settings.margin) });

  // Invisible guide lines (hub ↔ city) that the visible lines are drawn along
  const guideSeries = chart.series.push(am5map.MapLineSeries.new(root, { affectsBounds: false }));

  guideSeries.mapLines.template.setAll({ strokeOpacity: 0 });

  // Visible lines between two moving points on each guide line
  const lineSeries = chart.series.push(am5map.MapLineSeries.new(root, { affectsBounds: false }));

  // Moving points: the tail and the head (the arrow) of each visible line
  const headSeries = chart.series.push(am5map.MapPointSeries.new(root, {}));
  const arrows = new Map(); // route id -> arrow sprite

  headSeries.bullets.push((bulletRoot, series, dataItem) => {
    // The tail needs a bullet too (an empty one): amCharts works out a point's position on the line through its bullet
    if (dataItem.dataContext.role !== 'head') {
      return am5.Bullet.new(root, { sprite: am5.Circle.new(root, { radius: 0 }) });
    }

    const arrow = am5.Triangle.new(root, { width: 8, height: 7, opacity: settings.animate ? 0 : 1 });

    arrows.set(dataItem.dataContext.routeId, arrow);

    // The last arrow is made: everything the animation needs is in place
    if (arrows.size === routes.length) {
      applyColors();

      if (settings.animate) {
        startAnimation();
      }
    }

    return am5.Bullet.new(root, { sprite: arrow });
  });

  // Cities: a dot with a pulse ring under it
  const citySeries = chart.series.push(am5map.MapPointSeries.new(root, {}));
  const dots = [];

  citySeries.bullets.push((bulletRoot, series, dataItem) => {
    const radius = dataItem.dataContext.isHub ? 7 : 6;
    const container = am5.Container.new(root, {});
    const pulse = container.children.push(am5.Circle.new(root, { radius, opacity: 0 }));
    const dot = container.children.push(am5.Circle.new(root, { radius, tooltip, tooltipText: '{title}', tooltipY: -radius }));

    dots.push({ dot, pulse, isHub: dataItem.dataContext.isHub });

    return am5.Bullet.new(root, { sprite: container });
  });

  citySeries.data.setAll(cities.map((city) => ({
    id: city.id,
    isHub: city.isHub,
    title: city.title,
    geometry: { type: 'Point', coordinates: [city.lon, city.lat] },
  })));

  // "out": from the hub to the city, "in": from the city to the hub
  guideSeries.set('pointSeries', citySeries);
  guideSeries.data.setAll(routes.map((route) => ({
    id: route.id,
    pointIds: route.direction === 'in' ? [route.id, 'hub'] : ['hub', route.id],
  })));

  // The moving points need the guide lines already laid out, otherwise they stay at 0°, 0°
  guideSeries.events.once('datavalidated', () => {
    const startPosition = settings.animate ? 0 : 1; // without animation the lines are drawn in full

    headSeries.data.setAll(routes.flatMap((route) => [
      { id: `${route.id}-tail`, lineId: route.id, positionOnLine: 0, role: 'tail' },
      { id: `${route.id}-head`, lineId: route.id, positionOnLine: startPosition, role: 'head', routeId: route.id, autoRotate: true, autoRotateAngle: 90 },
    ]));

    lineSeries.set('pointSeries', headSeries);
    lineSeries.data.setAll(routes.map((route) => ({ pointIds: [`${route.id}-tail`, `${route.id}-head`] })));
  });

  // Colors come from the CSS tokens, so the map follows the theme
  const applyColors = () => {
    const styles = getComputedStyle(el);
    const land = readColor(styles, '--map-land');
    const country = readColor(styles, '--map-country');
    const countryStroke = readColor(styles, '--map-country-stroke');
    const line = readColor(styles, '--map-line');
    const point = readColor(styles, '--map-point');
    const hubPoint = readColor(styles, '--map-hub');
    const tooltipBg = readColor(styles, '--map-tooltip-bg');
    const tooltipText = readColor(styles, '--map-tooltip-text');

    landSeries.mapPolygons.template.setAll({ fill: land.color, fillOpacity: land.opacity });

    countryIds.forEach((id) => {
      landSeries.getDataItemById(id)?.get('mapPolygon').setAll({
        fill: country.color,
        fillOpacity: country.opacity,
        stroke: countryStroke.color,
        strokeOpacity: countryStroke.opacity,
      });
    });

    lineSeries.mapLines.template.setAll({ stroke: line.color, strokeOpacity: line.opacity });
    arrows.forEach((arrow) => arrow.setAll({ fill: line.color, fillOpacity: line.opacity }));

    dots.forEach(({ dot, pulse, isHub }) => {
      const { color, opacity } = isHub ? hubPoint : point;

      dot.setAll({ fill: color, fillOpacity: opacity });
      pulse.set('fill', color);
    });

    tooltip.get('background').setAll({ fill: tooltipBg.color, fillOpacity: tooltipBg.opacity, strokeOpacity: 0 });
    tooltip.label.set('fill', tooltipText.color);
  };

  // ---------- Animation ----------

  const animations = []; // endless pulse animations, paused off screen
  let parked = []; // route loops waiting for the map to come back on screen
  let visible = true;

  const next = (fn) => (visible ? fn() : parked.push(fn));
  const wait = (ms, fn) => setTimeout(() => next(fn), ms);
  const easing = am5.ease.inOut(am5.ease.cubic);

  // One cycle: the head draws the line from start to end, holds, then the tail follows it to the end
  const runRoute = (route) => {
    const tail = headSeries.getDataItemById(`${route.id}-tail`);
    const head = headSeries.getDataItemById(`${route.id}-head`);
    const arrow = arrows.get(route.id);

    const draw = () => {
      tail.set('positionOnLine', 0);
      head.set('positionOnLine', 0);
      arrow.set('opacity', 1);

      head.animate({ key: 'positionOnLine', from: 0, to: 1, duration: settings.draw, easing })
        .events.once('stopped', () => wait(settings.hold, retract));
    };

    const retract = () => {
      tail.animate({ key: 'positionOnLine', from: 0, to: 1, duration: settings.draw, easing })
        .events.once('stopped', () => {
          arrow.set('opacity', 0);
          wait(settings.gap, draw);
        });
    };

    draw();
  };

  const startAnimation = () => {
    routes.forEach((route, index) => wait(index * settings.stagger, () => runRoute(route)));

    dots.forEach(({ pulse }) => {
      animations.push(
        pulse.animate({ key: 'scale', from: 1, to: 3.2, duration: settings.pulse, easing: am5.ease.out(am5.ease.cubic), loops: Infinity }),
        pulse.animate({ key: 'opacity', from: 0.65, to: 0, duration: settings.pulse, loops: Infinity }),
      );
    });
  };

  // The routes finish the current step and wait; the pulses stop at once
  const setVisible = (value) => {
    visible = value;

    animations.forEach((animation) => (visible ? animation.play() : animation.pause()));

    if (visible) {
      const fns = parked;

      parked = [];
      fns.forEach((fn) => fn());
    }
  };

  // The countries are ready earlier than the arrows: color them at once.
  // Only the highlighted countries react to the pointer and show their names.
  landSeries.events.once('datavalidated', () => {
    countryIds.forEach((id) => {
      landSeries.getDataItemById(id)?.get('mapPolygon').setAll({ interactive: true, tooltip, tooltipText: '{name}' });
    });

    applyColors();
  });

  // Theme switch: read the tokens again when their transition is over
  new MutationObserver(() => setTimeout(applyColors, THEME_DELAY))
    .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  return { setVisible };
}

function initMapAnimated(el) {
  // Loads the library near the viewport; afterwards pauses the animation while the map is off screen
  const loader = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) {
      return;
    }

    loader.disconnect();

    loadLibs().then(() => {
      const map = createMap(el);

      new IntersectionObserver(([visibleEntry]) => map.setVisible(visibleEntry.isIntersecting)).observe(el);
    });
  }, { rootMargin: LOAD_MARGIN });

  loader.observe(el);
}

document.querySelectorAll('.js-map-animated').forEach(initMapAnimated);
