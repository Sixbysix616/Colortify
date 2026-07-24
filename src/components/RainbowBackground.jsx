import { useEffect, useRef } from "react";
import { BUCKET_ORDER, BUCKET_COLORS } from "../color/bucket.js";

// Bands correspond 1:1 to the color buckets, so the results-state widths can be
// driven by real per-bucket track counts (item 3).
const COLORS = BUCKET_ORDER.map((name) => BUCKET_COLORS[name]);
const N = COLORS.length;

// Per-band oscillation params — different speeds/phases make the bands wave
// independently rather than pulsing in unison.
const SPEEDS = [0.9, 1.15, 0.8, 1.28, 1.02, 1.18, 0.72];
const PHASES = [0, 0.9, 1.7, 2.5, 3.4, 4.1, 5.0];
const WAVE_AMP = 0.65; // how far each band's flex-grow swings around 1
const SETTLE_MS = 1100; // wave -> proportional morph duration

const easeOutCubic = (x) => 1 - Math.pow(1 - x, 3);
const prefersReducedMotion = () =>
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// A single background component with three states driven by the app machine:
//   loggedOut/idle -> static equal stripes
//   loading        -> flowing wave (bands oscillate independently)
//   results        -> smoothly settle into widths proportional to bucket counts
export default function RainbowBackground({ status, counts }) {
  const bandRefs = useRef([]);
  const currentRef = useRef(new Array(N).fill(1)); // live flex-grow values
  const rafRef = useRef(null);

  useEffect(() => {
    const apply = () => {
      for (let i = 0; i < N; i++) {
        const el = bandRefs.current[i];
        if (el) el.style.flexGrow = currentRef.current[i].toFixed(3);
      }
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };

    // ---- Loading: continuous wave ----
    if (status === "loading" && !prefersReducedMotion()) {
      const start = performance.now();
      const loop = (now) => {
        const t = (now - start) / 1000;
        for (let i = 0; i < N; i++) {
          currentRef.current[i] = 1 + WAVE_AMP * Math.sin(t * SPEEDS[i] + PHASES[i]);
        }
        apply();
        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);
      return stop;
    }

    // ---- Results: settle into proportional widths ----
    if (status === "results" && counts) {
      const total = counts.reduce((a, b) => a + b, 0) || 1;
      // Small floor so empty/tiny buckets still show a visible sliver.
      const targets = counts.map((c) => 0.12 + (c / total) * N);
      const from = currentRef.current.slice();

      if (prefersReducedMotion()) {
        currentRef.current = targets;
        apply();
        return stop;
      }

      const start = performance.now();
      const loop = (now) => {
        const p = Math.min(1, (now - start) / SETTLE_MS);
        const e = easeOutCubic(p);
        for (let i = 0; i < N; i++) {
          currentRef.current[i] = from[i] + (targets[i] - from[i]) * e;
        }
        apply();
        if (p < 1) rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);
      return stop;
    }

    // ---- Idle / logged out: static equal stripes ----
    for (let i = 0; i < N; i++) currentRef.current[i] = 1;
    apply();
    return stop;
  }, [status, counts]);

  return (
    <div className="bg-rainbow" aria-hidden="true">
      {COLORS.map((color, i) => (
        <div
          key={i}
          ref={(el) => (bandRefs.current[i] = el)}
          className="bg-band"
          style={{ background: color, flexGrow: 1 }}
        />
      ))}
    </div>
  );
}
