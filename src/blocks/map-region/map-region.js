/* global am5, am5map, am5geodata_worldLow, am5geodata_lang_UK */

// World map with highlighted countries and their cities. amCharts 5 is loaded only when the block
// gets close to the viewport, so the library costs nothing to pages that are not scrolled that far.

const AMCHARTS_URL = 'https://cdn.amcharts.com/lib/5/';
const LOAD_MARGIN = '300px'; // start loading this far before the block enters the viewport
const THEME_DELAY = 350; // ms, the theme switch animates the tokens: keep in sync with $transition-time (+ margin)
const CITY_RADIUS = 2; // px, the hub dot is twice as big

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

function createMap(el) {
  const items = JSON.parse(el.querySelector('.js-map-region-data').textContent);
  const countryIds = items.map((item) => item.country);

  const root = am5.Root.new(el.querySelector('.js-map-region-canvas'));

  // Decorative map: no panning, no zooming, the page scrolls freely over it
  const chart = root.container.children.push(am5map.MapChart.new(root, {
    panX: 'none',
    panY: 'none',
    wheelX: 'none',
    wheelY: 'none',
    pinchZoom: false,
    projection: am5map.geoEqualEarth(),
  }));

  // Land: all countries in one color without borders. Without Antarctica the map fits the inhabited world.
  const landSeries = chart.series.push(am5map.MapPolygonSeries.new(root, {
    geoJSON: am5geodata_worldLow,
    geodataNames: isUkrainian ? am5geodata_lang_UK : undefined,
    exclude: ['AQ'],
  }));

  landSeries.mapPolygons.template.setAll({ strokeOpacity: 0 });

  // One tooltip for countries and cities, colored from the tokens in applyColors()
  const tooltip = am5.Tooltip.new(root, { getFillFromSprite: false, autoTextColor: false });

  tooltip.label.setAll({
    fontFamily: getComputedStyle(el).fontFamily,
    fontSize: 14,
    fontWeight: '600',
  });

  // Cities: a plain dot, the hub one twice as big
  const citySeries = chart.series.push(am5map.MapPointSeries.new(root, {}));
  const dots = [];

  citySeries.bullets.push((bulletRoot, series, dataItem) => {
    const { isHub } = dataItem.dataContext;
    const radius = isHub ? CITY_RADIUS * 2 : CITY_RADIUS;
    const dot = am5.Circle.new(root, { radius, tooltip, tooltipText: '{title}', tooltipY: -radius });

    dots.push({ dot, isHub });

    return am5.Bullet.new(root, { sprite: dot });
  });

  // data-cities="false" hides all the city dots, the countries stay highlighted
  if (el.dataset.cities !== 'false') {
    citySeries.data.setAll(items.map((item) => ({
      title: item.title,
      isHub: Boolean(item.hub),
      geometry: { type: 'Point', coordinates: [item.lon, item.lat] },
    })));
  }

  // Colors come from the CSS tokens, so the map follows the theme
  const applyColors = () => {
    const styles = getComputedStyle(el);
    const land = readColor(styles, '--map-land');
    const country = readColor(styles, '--map-country');
    const countryStroke = readColor(styles, '--map-country-stroke');
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

    dots.forEach(({ dot, isHub }) => {
      const { color, opacity } = isHub ? hubPoint : point;

      dot.setAll({ fill: color, fillOpacity: opacity });
    });

    tooltip.get('background').setAll({ fill: tooltipBg.color, fillOpacity: tooltipBg.opacity, strokeOpacity: 0 });
    tooltip.label.set('fill', tooltipText.color);
  };

  // Only the highlighted countries react to the pointer and show their names
  landSeries.events.once('datavalidated', () => {
    countryIds.forEach((id) => {
      landSeries.getDataItemById(id)?.get('mapPolygon').setAll({ interactive: true, tooltip, tooltipText: '{name}' });
    });

    applyColors();
  });

  // The dots are made after the countries: color them too
  citySeries.events.once('datavalidated', applyColors);

  // Theme switch: read the tokens again when their transition is over
  new MutationObserver(() => setTimeout(applyColors, THEME_DELAY))
    .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
}

function initMapRegion(el) {
  const loader = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) {
      return;
    }

    loader.disconnect();
    loadLibs().then(() => createMap(el));
  }, { rootMargin: LOAD_MARGIN });

  loader.observe(el);
}

document.querySelectorAll('.js-map-region').forEach(initMapRegion);
