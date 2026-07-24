# Colortify

Sort your Spotify **liked songs by the dominant color of their album covers**,
preview every color group in the browser, and turn any one color into a private
Spotify playlist on demand. No backend, no database — everything (auth, color
extraction, playlist creation) runs in your browser.

> **Note:** This is a portfolio/demo app running in Spotify **Development Mode**,
> which caps authorization at **25 manually whitelisted users**. If you aren't on
> the allowlist you won't be able to log in — whitelist the account in the
> Spotify dashboard first (or during a live demo).

## How it works

1. Log in with Spotify (**Authorization Code + PKCE**, no client secret).
2. Fetch **all** liked songs (paginated).
3. For each track, extract a dominant color from the ~300px album cover with
   [node-vibrant](https://github.com/Vibrant-Colors/node-vibrant) and map its
   hue + saturation to a bucket: red / orange / yellow / green / blue / purple /
   grayscale.
4. Preview all buckets — swatch, name, track count, cover thumbnails. Nothing is
   written to Spotify yet.
5. Click a color → create one **private** playlist with that bucket's tracks,
   then copy the link or open it in Spotify.

### Bucketing

```js
function hueToBucket(hue, sat) {
  if (sat < 0.15) return "grayscale";
  if (hue < 20 || hue >= 340) return "red";
  if (hue < 50)  return "orange";
  if (hue < 70)  return "yellow";
  if (hue < 170) return "green";
  if (hue < 260) return "blue";
  return "purple";
}
```

Covers are analyzed with a small **concurrency pool (6 in flight)** and cached in
memory so nothing is re-analyzed on re-render.

## Tech stack

Vite · React · node-vibrant (browser build) · plain CSS. No backend.

## Local setup

1. **Spotify Developer Dashboard:** create an app, copy the **Client ID** (PKCE
   needs no secret). Register the redirect URI exactly — Spotify requires the
   loopback IP form for local dev:
   ```
   http://127.0.0.1:5173/callback
   ```
   Add your own account (and any reviewers) to the app's user allowlist.

2. **Env:** copy `.env.example` to `.env` and fill in:
   ```
   VITE_SPOTIFY_CLIENT_ID=<your client id>
   VITE_REDIRECT_URI=http://127.0.0.1:5173/callback
   ```

3. **Run:**
   ```bash
   npm install
   npm run dev
   ```
   Open http://127.0.0.1:5173 (not `localhost` — the redirect URI must match).

## Deploy (Vercel)

1. Push to GitHub, import into Vercel (framework preset: **Vite**).
2. Set `VITE_SPOTIFY_CLIENT_ID` and `VITE_REDIRECT_URI` (the production
   `https://<app>.vercel.app/callback`) in project settings.
3. Add that production callback URL to the Spotify dashboard redirect URIs.
4. Redeploy.

## Design

The background is a fixed **horizontal-stripe rainbow palette** — the whole pitch
is color, so it carries the design. Content sits on translucent panels for
legibility.

---

The old Python `colorthief` prototype (`*.py`, `gui/`) is superseded by this
browser rebuild and kept only for reference.
