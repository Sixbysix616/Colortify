// node-vibrant extraction with a small concurrency pool.

import { Vibrant } from "node-vibrant/browser";

// RGB [0-255] -> HSL with hue in degrees [0,360), sat & light in [0,1].
function rgbToHsl([r, g, b]) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
    }
    h *= 60;
  }
  return { h, s, l };
}

// Pick the most representative swatch from a node-vibrant palette.
function pickSwatch(palette) {
  return (
    palette.Vibrant ||
    palette.Muted ||
    palette.DarkVibrant ||
    palette.LightVibrant ||
    palette.DarkMuted ||
    palette.LightMuted ||
    null
  );
}

// Analyze one cover URL -> { hue, sat, swatchHex } or null on failure/no swatch.
async function analyzeCover(url) {
  if (!url) return null;
  try {
    const palette = await Vibrant.from(url).getPalette();
    const swatch = pickSwatch(palette);
    if (!swatch) return null;
    const { h, s } = rgbToHsl(swatch.rgb);
    return { hue: h, sat: s, swatchHex: swatch.hex };
  } catch {
    return null; // image failed to load / decode
  }
}

// Analyze all tracks with a bounded concurrency pool.
// onProgress(done, total) fires as each track finishes.
// Returns tracks augmented with { hue, sat, swatchHex } (skipped ones dropped).
export async function analyzeTracks(tracks, { concurrency = 6, onProgress } = {}) {
  const results = [];
  let done = 0;
  let cursor = 0;

  async function worker() {
    while (cursor < tracks.length) {
      const index = cursor++;
      const track = tracks[index];
      const color = await analyzeCover(track.coverUrl);
      done++;
      if (onProgress) onProgress(done, tracks.length);
      if (color) results.push({ ...track, ...color });
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, tracks.length) }, () =>
    worker()
  );
  await Promise.all(workers);

  return results;
}
