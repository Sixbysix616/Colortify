import { useState } from "react";
import { BUCKET_COLORS } from "../color/bucket.js";

export default function BucketCard({ name, tracks, state, onCreate }) {
  const [copied, setCopied] = useState(false);
  const color = BUCKET_COLORS[name];
  const thumbs = tracks.slice(0, 6);

  async function copyLink() {
    if (!state?.url) return;
    await navigator.clipboard.writeText(state.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const status = state?.status || "idle";

  return (
    <div className="card" style={{ "--swatch": color }}>
      <div className="card-swatch" style={{ background: color }}>
        <span className="card-name">{name}</span>
        <span className="card-count">{tracks.length} tracks</span>
      </div>

      <div className="card-thumbs">
        {thumbs.map((t) =>
          t.thumbUrl ? (
            <img
              key={t.uri}
              src={t.thumbUrl}
              alt=""
              loading="lazy"
              className="thumb"
            />
          ) : null
        )}
      </div>

      <div className="card-actions">
        {status === "idle" && (
          <button className="btn btn-swatch" onClick={() => onCreate(name)}>
            Create playlist
          </button>
        )}

        {status === "creating" && (
          <button className="btn btn-swatch" disabled>
            Creating…
          </button>
        )}

        {status === "error" && (
          <>
            <p className="error">{state.error}</p>
            <button className="btn btn-swatch" onClick={() => onCreate(name)}>
              Retry
            </button>
          </>
        )}

        {status === "done" && (
          <div className="card-links">
            <button className="btn btn-swatch" onClick={copyLink}>
              {copied ? "Copied!" : "Copy link"}
            </button>
            <a
              className="btn btn-outline"
              href={state.url}
              target="_blank"
              rel="noreferrer"
            >
              Open in Spotify
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
