# Module for Spotify API authentication and fetching user tracks
from spotipy import Spotify
from spotipy.oauth2 import SpotifyOAuth
from config import CLIENT_ID, CLIENT_SECRET, REDIRECT_URI, SCOPE

def get_spotify_client():
    """Authenticate and return a Spotify client"""
    sp = Spotify(auth_manager=SpotifyOAuth(
        client_id=CLIENT_ID,
        client_secret=CLIENT_SECRET,
        redirect_uri=REDIRECT_URI,
        scope=SCOPE,
        show_dialog=True
    ))
    return sp

def get_all_saved_tracks(sp, limit=50):
    """Fetch all saved tracks from the user's library"""
    results = sp.current_user_saved_tracks(limit=limit)
    all_tracks = results['items']

    while results['next']:
        results = sp.next(results)
        all_tracks.extend(results['items'])

    return all_tracks
