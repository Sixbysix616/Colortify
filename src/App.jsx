import { useEffect, useMemo, useState } from "react";
import { beginLogin, handleCallback } from "./auth/spotifyAuth.js";
import { fetchAllLikedSongs } from "./spotify/likedSongs.js";
import { createColorPlaylist } from "./spotify/playlists.js";
import { analyzeTracks } from "./color/extract.js";
import { groupByBucket, BUCKET_ORDER } from "./color/bucket.js";
import LoginScreen from "./components/LoginScreen.jsx";
import ProgressView from "./components/ProgressView.jsx";
import BucketGrid from "./components/BucketGrid.jsx";
import RainbowBackground from "./components/RainbowBackground.jsx";

// Module-level one-time guard for the OAuth callback. Unlike a component ref,
// this survives a full remount within the same page load, so the auth code and
// stored state are consumed exactly once even if React remounts App (e.g.
// StrictMode's dev double-invoke, or an error-triggered re-render).
let callbackHandled = false;

// App states: loggedOut -> loading -> results
export default function App() {
  const [status, setStatus] = useState("loggedOut");
  const [token, setToken] = useState(null);
  const [error, setError] = useState(null);

  const [phase, setPhase] = useState("fetching"); // "fetching" | "analyzing"
  const [progress, setProgress] = useState({ loaded: 0, total: 0 });

  const [groups, setGroups] = useState(null);
  const [playlistState, setPlaylistState] = useState({});

  // Handle the OAuth redirect back to /callback exactly once. The guard is set
  // synchronously (before any await) so a second effect invocation or remount
  // can't re-enter and consume the already-used state/verifier.
  useEffect(() => {
    const isCallback =
      window.location.pathname.startsWith("/callback") &&
      window.location.search.includes("code=");
    if (!isCallback || callbackHandled) return;
    callbackHandled = true;

    (async () => {
      try {
        const { accessToken } = await handleCallback();
        setToken(accessToken);
        // Clean the code/state out of the URL.
        window.history.replaceState({}, document.title, "/");
      } catch (e) {
        setError(e.message);
        setStatus("loggedOut");
      }
    })();
  }, []);

  // Once we have a token, run the full pipeline.
  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    (async () => {
      try {
        setStatus("loading");
        setPhase("fetching");
        const tracks = await fetchAllLikedSongs(token, (loaded, total) => {
          if (!cancelled) setProgress({ loaded, total });
        });

        if (cancelled) return;
        setPhase("analyzing");
        setProgress({ loaded: 0, total: tracks.length });
        const analyzed = await analyzeTracks(tracks, {
          concurrency: 6,
          onProgress: (loaded, total) => {
            if (!cancelled) setProgress({ loaded, total });
          },
        });

        if (cancelled) return;
        setGroups(groupByBucket(analyzed));
        setStatus("results");
      } catch (e) {
        if (!cancelled) {
          setError(e.message);
          setStatus("loggedOut");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  async function handleLogin() {
    setError(null);
    try {
      await beginLogin();
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleCreate(name) {
    const tracks = groups[name];
    if (!tracks?.length) return;
    setPlaylistState((s) => ({ ...s, [name]: { status: "creating" } }));
    try {
      const { url } = await createColorPlaylist(token, {
        colorName: name,
        uris: tracks.map((t) => t.uri),
      });
      setPlaylistState((s) => ({ ...s, [name]: { status: "done", url } }));
    } catch (e) {
      setPlaylistState((s) => ({
        ...s,
        [name]: { status: "error", error: e.message },
      }));
    }
  }

  // Per-bucket counts (in BUCKET_ORDER) drive the results-state band widths.
  const bucketCounts = useMemo(
    () => (groups ? BUCKET_ORDER.map((name) => groups[name]?.length || 0) : null),
    [groups]
  );

  return (
    <div className="app">
      <RainbowBackground status={status} counts={bucketCounts} />
      <div className="app-inner">
        {status === "loggedOut" && (
          <LoginScreen onLogin={handleLogin} error={error} />
        )}
        {status === "loading" && (
          <ProgressView
            phase={phase}
            loaded={progress.loaded}
            total={progress.total}
          />
        )}
        {status === "results" && groups && (
          <BucketGrid
            groups={groups}
            playlistState={playlistState}
            onCreate={handleCreate}
          />
        )}
      </div>
    </div>
  );
}
