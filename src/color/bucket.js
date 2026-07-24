// Hue/saturation -> color bucket, plus grouping helpers.

export const BUCKET_ORDER = [
  "red",
  "orange",
  "yellow",
  "green",
  "blue",
  "purple",
  "grayscale",
];

// A representative display color for each bucket (used for swatches/cards).
export const BUCKET_COLORS = {
  red: "#e53935",
  orange: "#fb8c00",
  yellow: "#fdd835",
  green: "#43a047",
  blue: "#1e88e5",
  purple: "#8e24aa",
  grayscale: "#9e9e9e",
};

// hue in degrees [0,360), sat in [0,1]
export function hueToBucket(hue, sat) {
  if (sat < 0.15) return "grayscale"; // black / white / gray covers
  if (hue < 20 || hue >= 340) return "red";
  if (hue < 50) return "orange";
  if (hue < 70) return "yellow";
  if (hue < 170) return "green";
  if (hue < 260) return "blue";
  return "purple";
}

// Group analyzed tracks into { bucketName: [track, ...] }.
// Each track is expected to carry { hue, sat } from extraction.
export function groupByBucket(analyzed) {
  const groups = {};
  for (const name of BUCKET_ORDER) groups[name] = [];

  for (const track of analyzed) {
    if (track.hue == null || track.sat == null) continue;
    const bucket = hueToBucket(track.hue, track.sat);
    groups[bucket].push(track);
  }

  // Stretch goal: order within a bucket by hue for a color gradient.
  for (const name of BUCKET_ORDER) {
    groups[name].sort((a, b) => a.hue - b.hue);
  }

  return groups;
}
