import { BUCKET_ORDER } from "../color/bucket.js";
import BucketCard from "./BucketCard.jsx";

export default function BucketGrid({ groups, playlistState, onCreate }) {
  const visible = BUCKET_ORDER.filter((name) => groups[name]?.length > 0);
  const totalTracks = visible.reduce((n, name) => n + groups[name].length, 0);

  return (
    <div className="panel results">
      <div className="results-head">
        <h2 className="title-sm">Your colors</h2>
        <p className="results-sub">
          {totalTracks} tracks sorted into {visible.length} color groups. Click a
          color to create a private playlist.
        </p>
      </div>
      <div className="grid">
        {visible.map((name) => (
          <BucketCard
            key={name}
            name={name}
            tracks={groups[name]}
            state={playlistState[name]}
            onCreate={onCreate}
          />
        ))}
      </div>
    </div>
  );
}
