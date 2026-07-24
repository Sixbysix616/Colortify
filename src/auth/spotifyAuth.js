// Spotify Authorization Code + PKCE flow. No backend, no client secret.

import {
  generateCodeVerifier,
  generateCodeChallenge,
  generateState,
} from "./pkce.js";

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const REDIRECT_URI = import.meta.env.VITE_REDIRECT_URI;
const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize";
const TOKEN_ENDPOINT = "https://accounts.spotify.com/api/token";
const SCOPES = "user-library-read playlist-modify-private";

const VERIFIER_KEY = "colortify_code_verifier";
const STATE_KEY = "colortify_auth_state";
const REFRESH_KEY = "colortify_refresh_token";

// Step 1: build the authorize URL and redirect the browser to Spotify.
export async function beginLogin() {
  if (!CLIENT_ID || !REDIRECT_URI) {
    throw new Error(
      "Missing VITE_SPOTIFY_CLIENT_ID or VITE_REDIRECT_URI. See .env.example."
    );
  }
  const verifier = generateCodeVerifier();
  const challenge = await generateCodeChallenge(verifier);
  const state = generateState();

  sessionStorage.setItem(VERIFIER_KEY, verifier);
  sessionStorage.setItem(STATE_KEY, state);

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: "code",
    redirect_uri: REDIRECT_URI,
    code_challenge_method: "S256",
    code_challenge: challenge,
    state,
    scope: SCOPES,
  });
  window.location.href = `${AUTH_ENDPOINT}?${params.toString()}`;
}

// Step 2: on the callback route, exchange the `code` for tokens.
// Returns { accessToken, expiresIn } or throws.
export async function handleCallback() {
  const url = new URL(window.location.href);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) throw new Error(`Spotify auth error: ${error}`);
  if (!code) throw new Error("No authorization code in callback URL.");

  const storedState = sessionStorage.getItem(STATE_KEY);
  if (!storedState || storedState !== state) {
    throw new Error("State mismatch — possible CSRF. Please log in again.");
  }

  const verifier = sessionStorage.getItem(VERIFIER_KEY);
  if (!verifier) throw new Error("Missing PKCE code verifier. Log in again.");

  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    grant_type: "authorization_code",
    code,
    redirect_uri: REDIRECT_URI,
    code_verifier: verifier,
  });

  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Token exchange failed (${res.status}): ${detail}`);
  }
  const data = await res.json();

  sessionStorage.removeItem(VERIFIER_KEY);
  sessionStorage.removeItem(STATE_KEY);
  if (data.refresh_token) {
    sessionStorage.setItem(REFRESH_KEY, data.refresh_token);
  }

  return { accessToken: data.access_token, expiresIn: data.expires_in };
}

// Optional refresh — used only if a refresh token was stored.
export async function refreshAccessToken() {
  const refreshToken = sessionStorage.getItem(REFRESH_KEY);
  if (!refreshToken) return null;

  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (data.refresh_token) sessionStorage.setItem(REFRESH_KEY, data.refresh_token);
  return { accessToken: data.access_token, expiresIn: data.expires_in };
}

export function logout() {
  sessionStorage.removeItem(REFRESH_KEY);
  sessionStorage.removeItem(VERIFIER_KEY);
  sessionStorage.removeItem(STATE_KEY);
}
