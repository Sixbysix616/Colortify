// Fetch ALL of the user's liked songs, following pagination to the end.

import { spotifyFetch } from "./api.js";

// onProgress(loadedCount, totalCount) is called as pages arrive.
export async function fetchAllLikedSongs(token, onProgress) {
  const tracks = [];
  let next = "/me/tracks?limit=50";
  let total = null;

  while (next) {
    const page = await spotifyFetch(token, next);
    if (total === null) total = page.total;

    for (const item of page.items) {
      const t = item.track;
      if (!t) continue; // e.g. removed/unavailable tracks
      const images = t.album?.images || [];
      tracks.push({
        uri: t.uri,
        name: t.name,
        artist: (t.artists || []).map((a) => a.name).join(", "),
        // ~300px image (images[1]) for extraction; fall back sensibly.
        coverUrl: images[1]?.url || images[0]?.url || null,
        thumbUrl: images[2]?.url || images[1]?.url || images[0]?.url || null,
      });
    }

    if (onProgress) onProgress(tracks.length, total ?? tracks.length);
    next = page.next; // absolute URL or null
  }

  return tracks;
}
