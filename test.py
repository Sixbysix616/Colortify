import spotipy
from spotipy.oauth2 import SpotifyOAuth

sp = spotipy.Spotify(auth_manager=SpotifyOAuth(
    client_id="2d5501e894f64519add41c55e365db36",
    client_secret="6a70277ad2354cf88735f09e67cad3b1",
    redirect_uri="http://127.0.0.1:8889/callback",
    scope="user-library-read"
))

results = sp.current_user_saved_tracks(limit=5)
for idx, item in enumerate(results['items']):
    track = item['track']
    print(f"{idx+1}. {track['name']} - {track['artists'][0]['name']}")
