import os
import requests
from spotipy import Spotify
from spotipy.oauth2 import SpotifyOAuth
from colorthief import ColorThief
import colorsys

# -----------------------------
# Profile
# -----------------------------
CLIENT_ID = "2d5501e894f64519add41c55e365db36"
CLIENT_SECRET = "6a70277ad2354cf88735f09e67cad3b1"
REDIRECT_URI = "http://127.0.0.1:8888/callback"
SCOPE = "user-library-read"

# 红色 HSV
TARGET_HUE = 0.0        # 红色在HSV中0或1
HUE_TOLERANCE = 0.05    # 色相容差
MIN_SATURATION = 0.4    # 饱和度阈值
MIN_VALUE = 0.2        # 明度阈值

# -----------------------------
# Spotify API
# -----------------------------
sp = Spotify(auth_manager=SpotifyOAuth(
    client_id=CLIENT_ID,
    client_secret=CLIENT_SECRET,
    redirect_uri=REDIRECT_URI,
    scope=SCOPE,
    show_dialog=True
))

# -----------------------------
# Get all saved tracks
# -----------------------------
results = sp.current_user_saved_tracks(limit=50)
all_tracks = results['items']

while results['next']:
    results = sp.next(results)
    all_tracks.extend(results['items'])

# -----------------------------
# Helper functions
# -----------------------------
def rgb_to_hsv(rgb):
    r, g, b = [x/255 for x in rgb]
    return colorsys.rgb_to_hsv(r, g, b)

def select_brightest_color_hsv(palette):
    # Select the brightest color based on brightness × saturation
    scores = []
    for c in palette:
        h, s, v = rgb_to_hsv(c)
        score = s * v
        scores.append((score, c))
    scores.sort(reverse=True)
    return scores[0][1]

# -----------------------------
# Analyze colors
# -----------------------------
matching_tracks = 0

for idx, item in enumerate(all_tracks):
    track = item['track']
    name = track['name']
    artist = track['artists'][0]['name']
    album_cover_url = track['album']['images'][0]['url']

    # Download the temporary cover
    temp_file = "temp_cover.jpg"
    response = requests.get(album_cover_url)
    with open(temp_file, "wb") as f:
        f.write(response.content)

    # Grab top 3 colors
    color_thief = ColorThief(temp_file)
    palette = color_thief.get_palette(color_count=3)
    bright_color = select_brightest_color_hsv(palette)

    # Delete the temporary image
    os.remove(temp_file)

    # Convert to HSV
    h, s, v = rgb_to_hsv(bright_color)

    print(f"{idx+1}. {name} - {artist} | Brightest Color RGB: {bright_color}, HSV: ({h:.2f}, {s:.2f}, {v:.2f}) | Palette: {palette}")

    # Check if it matches target HSV
    hue_diff = min(abs(h - TARGET_HUE), abs(h - 1 + TARGET_HUE))  
    if hue_diff <= HUE_TOLERANCE and s >= MIN_SATURATION and v >= MIN_VALUE:
        matching_tracks += 1

print(f"\nNumber of tracks matching the target color: {matching_tracks} / {len(all_tracks)}")
