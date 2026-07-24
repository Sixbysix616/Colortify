// Thin fetch wrapper: attaches the bearer token, parses JSON, surfaces errors,
// and handles 429 rate-limit retries.

const API_BASE = "https://api.spotify.com/v1";

export async function spotifyFetch(token, path, options = {}) {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;

  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });

    if (res.status === 429) {
      const retryAfter = Number(res.headers.get("Retry-After") || "1");
      await new Promise((r) => setTimeout(r, (retryAfter + 0.5) * 1000));
      continue;
    }

    if (!res.ok) {
      const detail = await res.text();
      throw new Error(`Spotify API ${res.status} on ${path}: ${detail}`);
    }

    if (res.status === 204) return null;
    return res.json();
  }
  throw new Error(`Spotify API repeatedly rate-limited on ${path}`);
}
