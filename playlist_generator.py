
# Module for generating playlists based on color analysis
from color_analysis import analyze_track_color

def filter_tracks_by_color(tracks, target_hue):
    """
    Filter tracks whose album cover matches the target hue
    Returns list of matching tracks and color info
    """
    matching_tracks = []

    for track_item in tracks:
        track_data = track_item['track']
        match, palette, bright_color = analyze_track_color(track_data, target_hue)
        if match:
            matching_tracks.append({
                "track": track_data,
                "palette": palette,
                "bright_color": bright_color
            })

    return matching_tracks

def print_matching_tracks_info(matching_tracks):
    """Print track name, artist, and brightest color info"""
    for idx, item in enumerate(matching_tracks):
        track = item['track']
        name = track['name']
        artist = track['artists'][0]['name']
        bright_color = item['bright_color']
        palette = item['palette']
        print(f"{idx+1}. {name} - {artist} | Brightest Color RGB: {bright_color} | Palette: {palette}")
