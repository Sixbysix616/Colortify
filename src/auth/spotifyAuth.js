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

// The PKCE verifier and OAuth state must survive the full-page redirect to
// Spotify and back. sessionStorage is technically per-tab and usually survives
// same-tab navigations, but it can be dropped across the redirect in some
// browsers/privacy modes, which surfaces as an intermittent "state mismatch".
// localStorage is durable across the handshake; we always clear these values
// immediately once consumed, so nothing lingers.
const handshakeStore = window.localStorage;

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

  // Persist the verifier and state BEFORE redirecting. A fresh login always
  // overwrites any stale values, so a previously abandoned attempt can't leak
  // an old state into this one.
  handshakeStore.setItem(VERIFIER_KEY, verifier);
  handshakeStore.setItem(STATE_KEY, state);

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
  const returnedState = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) throw new Error(`Spotify auth error: ${error}`);
  if (!code) throw new Error("No authorization code in callback URL.");

  // Read and immediately consume the handshake values: whatever happens next,
  // this state/verifier pair is used exactly once and cannot interfere with a
  // later attempt.
  const storedState = handshakeStore.getItem(STATE_KEY);
  const verifier = handshakeStore.getItem(VERIFIER_KEY);
  handshakeStore.removeItem(STATE_KEY);
  handshakeStore.removeItem(VERIFIER_KEY);

  if (!storedState || storedState !== returnedState) {
    throw new Error("State mismatch — possible CSRF. Please log in again.");
  }
  if (!verifier) {
    throw new Error("Missing PKCE code verifier. Please log in again.");
  }

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
  handshakeStore.removeItem(VERIFIER_KEY);
  handshakeStore.removeItem(STATE_KEY);
}
