# main.py
from gui.main_window import MainWindow
from spotify_client import get_all_saved_tracks
from spotify_client import get_spotify_client
sp = get_spotify_client()
tracks = get_all_saved_tracks(sp)

if __name__ == "__main__": 
    app = MainWindow(tracks)
    app.mainloop()
