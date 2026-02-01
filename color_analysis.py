# Module for analyzing album cover colors
from colorthief import ColorThief
import colorsys
import os
import requests
from config import HUE_TOLERANCE, MIN_SATURATION, MIN_VALUE

def rgb_to_hsv(rgb):
    r, g, b = [x/255 for x in rgb]
    return colorsys.rgb_to_hsv(r, g, b)

def select_brightest_color_hsv(palette):
    """Select the brightest color in the palette based on brightness × saturation"""
    scores = []
    for c in palette:
        h, s, v = rgb_to_hsv(c)
        scores.append((s*v, c))
    scores.sort(reverse=True)
    return scores[0][1]

def analyze_track_color(track, target_hue, color_count=3):
    """Analyze the album cover color of a track and check if it matches the target hue or is gray/black/white"""
    if 'album' not in track or not track['album']['images']:
        return False, [], (0,0,0)
    album_cover_url = track['album']['images'][0]['url']
    print(track['album']['images'][0]['url'])

    # Download temporary cover image
    temp_file = "temp_cover.jpg"
    response = requests.get(album_cover_url)
    with open(temp_file, "wb") as f:
        f.write(response.content)

    # Get color palette
    color_thief = ColorThief(temp_file)
    palette = color_thief.get_palette(color_count=color_count)

    match = False

    # Check each color in palette
    for color in palette:
        h, s, v = rgb_to_hsv(color)

        # 1. Gray/black/white detection: very low saturation
        if s < 0.1 and v > 0.05:  # allow for black/white/gray
            match = True
            break

        # 2. Bright color detection
        if s >= MIN_SATURATION and v >= MIN_VALUE:
            hue_diff = min(abs(h - target_hue), abs(h - 1 + target_hue))
            if hue_diff <= HUE_TOLERANCE:
                match = True
                break

    # Also get the brightest color for reference
    bright_color = select_brightest_color_hsv(palette)

    # Remove temporary file
    os.remove(temp_file)

    return match, palette, bright_color
