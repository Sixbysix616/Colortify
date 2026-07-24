// PKCE helpers for the Authorization Code + PKCE flow (no client secret).

function base64UrlEncode(bytes) {
  let str = "";
  for (const b of new Uint8Array(bytes)) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Random high-entropy string, 43–128 chars per the PKCE spec.
export function generateCodeVerifier(length = 64) {
  const charset =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  const values = crypto.getRandomValues(new Uint8Array(length));
  let out = "";
  for (const v of values) out += charset[v % charset.length];
  return out;
}

// challenge = BASE64URL(SHA256(verifier))
export async function generateCodeChallenge(verifier) {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(digest);
}

// Random string for the OAuth `state` param (CSRF protection).
export function generateState(length = 16) {
  return base64UrlEncode(crypto.getRandomValues(new Uint8Array(length))).slice(
    0,
    length
  );
}
