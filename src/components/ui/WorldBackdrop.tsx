import { useEffect, useState } from 'react';
// The light world-view borders: plenty for a 2048px backdrop and 4x smaller to download
import countriesGeoJSON from '@/assets/geo/countries-low.geojson?url';
import { COUNTRY_COLORS, OCEAN_COLOR } from '@/utils/mapStyle';

/**
 * Renders the world (same pastel palette as the game map) into a PNG once,
 * then reuses it on every menu screen. Cached at module level so navigating
 * between screens never re-fetches or re-draws.
 */
let imagePromise: Promise<string | null> | null = null;

const WIDTH = 2048;
const MAX_LAT = 80;
const mercY = (lat: number) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
const Y_MAX = mercY(MAX_LAT);
const HEIGHT = Math.round((WIDTH * (2 * Y_MAX)) / (2 * Math.PI));

const project = (lng: number, lat: number): [number, number] => {
  const clamped = Math.max(-MAX_LAT, Math.min(MAX_LAT, lat));
  return [((lng + 180) / 360) * WIDTH, ((Y_MAX - mercY(clamped)) / (2 * Y_MAX)) * HEIGHT];
};

function renderWorld(data: GeoJSON.FeatureCollection): Promise<string | null> {
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) return Promise.resolve(null);

  ctx.fillStyle = OCEAN_COLOR;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Graticule every 30°
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 1.5;
  for (let lng = -180; lng <= 180; lng += 30) {
    const [x] = project(lng, 0);
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, HEIGHT);
    ctx.stroke();
  }
  for (let lat = -60; lat <= 60; lat += 30) {
    const [, y] = project(0, lat);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(WIDTH, y);
    ctx.stroke();
  }

  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(91,107,122,0.75)';
  ctx.lineWidth = 1.2;
  const drawPolygon = (rings: number[][][]) => {
    ctx.beginPath();
    for (const ring of rings) {
      ring.forEach(([lng, lat], i) => {
        const [x, y] = project(lng, lat);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
    }
    ctx.fill('evenodd');
    ctx.stroke();
  };

  for (const feature of data.features) {
    const g = feature.geometry;
    ctx.fillStyle = COUNTRY_COLORS[feature.properties?.MAPCOLOR7 as number] ?? COUNTRY_COLORS[1];
    if (g?.type === 'Polygon') drawPolygon(g.coordinates);
    else if (g?.type === 'MultiPolygon') g.coordinates.forEach(drawPolygon);
  }

  return new Promise(resolve =>
    canvas.toBlob(blob => resolve(blob ? URL.createObjectURL(blob) : null), 'image/png')
  );
}

function loadWorldImage(): Promise<string | null> {
  if (!imagePromise) {
    imagePromise = fetch(countriesGeoJSON)
      .then(r => r.json())
      .then(renderWorld)
      .catch(() => null);
  }
  return imagePromise;
}

/**
 * Slowly drifting world map behind menu screens.
 * Three copies side by side scroll left by one copy-width and loop seamlessly
 * (the map wraps at ±180°). Falls back to plain ocean while loading.
 */
export default function WorldBackdrop() {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    loadWorldImage().then(url => {
      if (alive) setSrc(url);
    });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ backgroundColor: OCEAN_COLOR }} aria-hidden="true">
      {src && (
        <div className="absolute inset-y-0 left-0 flex h-full w-max animate-drift">
          {[0, 1, 2].map(i => (
            <img key={i} src={src} alt="" draggable={false} className="h-full w-auto max-w-none select-none" />
          ))}
        </div>
      )}
      {/* Paper wash + vignette so foreground cards read clearly */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(247,240,223,0.82) 0%, rgba(247,240,223,0.45) 40%, rgba(247,240,223,0.1) 70%, rgba(30,42,68,0.3) 100%)',
        }}
      />
    </div>
  );
}
