import tkinter as tk
from tkinter import messagebox
from playlist_generator import filter_tracks_by_color

class MainWindow(tk.Tk):
    def __init__(self, tracks):


        super().__init__()
        self.title("Colortify")
        self.geometry("500x300")
        self.tracks = tracks
        self.target_hue = 0.0  

        # Hue Slider
        self.hue_scale = tk.Scale(self, from_=0, to=360, orient=tk.HORIZONTAL,
                                  label="Select Hue", command=self.update_hue_display)
        self.hue_scale.pack(pady=10)

        # Current Color Display
        self.color_display = tk.Label(self, text="Current Color", width=20)
        self.color_display.pack(pady=5)
        self.update_hue_display(self.hue_scale.get())

        # Generate Playlist Button
        self.generate_button = tk.Button(self, text="Generate Playlist", command=self.generate_playlist)
        self.generate_button.pack(pady=20)

    def update_hue_display(self, value):
        """Update the displayed color based on the hue slider"""
        hue = int(value) / 360
        r, g, b = self.hsv_to_rgb(hue, 1, 1)  # full saturation & brightness for preview
        hex_color = f"#{r:02x}{g:02x}{b:02x}"
        self.color_display.config(bg=hex_color)
        self.target_hue = hue

    def hsv_to_rgb(self, h, s, v):
        """Convert HSV [0,1] to RGB 0-255"""
        import colorsys
        r, g, b = colorsys.hsv_to_rgb(h, s, v)
        return int(r*255), int(g*255), int(b*255)

    def generate_playlist(self):
        """Filter tracks by selected color and show a messagebox"""
        matching_tracks = filter_tracks_by_color(self.tracks, self.target_hue)
        if matching_tracks:
            messagebox.showinfo("Playlist Generated", f"{len(matching_tracks)} tracks match your color!")
        else:
            messagebox.showwarning("No Match", "No tracks match the selected color.")
