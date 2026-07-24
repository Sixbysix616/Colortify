export default function ProgressView({ phase, loaded, total }) {
  const pct = total > 0 ? Math.round((loaded / total) * 100) : 0;
  const label =
    phase === "fetching"
      ? `Fetching liked songs… ${loaded}${total ? ` / ${total}` : ""}`
      : `Analyzed ${loaded} / ${total} covers`;

  return (
    <div className="panel progress">
      <h2 className="title-sm">Working…</h2>
      <p className="progress-label">{label}</p>
      <div className="progress-track">
        <div className="progress-bar" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
