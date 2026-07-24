# Colortify

![Colortify demo](./demo.gif)

**Live app: [https://colortify.vercel.app/](https://colortify.vercel.app/)**

Sort your Spotify **liked songs by the dominant color of their album covers**,
preview every color group in the browser, and turn any one color into a private
Spotify playlist on demand. Everything — login, color extraction, and playlist
creation — runs entirely in your browser.

> ⚠️ **You can't log in with your own account.** The app uses Spotify's
> Developer API in **Development Mode**, which only works for a small list of
> **whitelisted users (currently 5 members)**. Only the developer can edit that
> allowlist, so other people can't sign in and try it themselves right now. The
> app is fully functional, though — the **GIF above shows it working end to
> end**.

## What it does

1. Log in with Spotify (**Authorization Code + PKCE**, no backend, no client secret).
2. Fetch **all** of your liked songs.
3. For each track, extract a dominant color from the album cover with
   [node-vibrant](https://github.com/Vibrant-Colors/node-vibrant) and map its
   hue + saturation to a color bucket: red / orange / yellow / green / blue /
   purple / grayscale.
4. Preview all the buckets at once — swatch, color name, track count, and cover
   thumbnails. Nothing is written to Spotify yet.
5. Click a color → the app creates one **private** playlist with that bucket's
   tracks, then gives you a link to copy or open in Spotify.

The background is a rainbow of horizontal stripes that flows like a wave while
your library is being analyzed, then settles so each color band's width reflects
how many of your tracks landed in that color.

### Color bucketing

Each cover's dominant color is converted to HSL and sorted by hue and saturation:

```js
function hueToBucket(hue, sat) {
  if (sat < 0.15) return "grayscale"; // black / white / gray covers
  if (hue < 20 || hue >= 340) return "red";
  if (hue < 50)  return "orange";
  if (hue < 70)  return "yellow";
  if (hue < 170) return "green";
  if (hue < 260) return "blue";
  return "purple";
}
```

## Tech stack

Vite · React · node-vibrant (browser build) · plain CSS. No backend, no database.
