# gui/main_window.py
import tkinter as tk
from tkinter import messagebox
from playlist_generator import filter_tracks_by_color
import colorsys

#Predefined color presets with their HSV values

COLOR_PRESETS = {
    "Red": (0.0, 1, 1),
    "Orange": (0.08, 1, 1),
    "Yellow": (0.16, 1, 1),
    "Green": (0.33, 1, 1),
    "Cyan": (0.5, 1, 1),
    "Blue": (0.66, 1, 1),
    "Purple": (0.78, 1, 1),
    "White": (0, 0, 1),
    "Gray": (0, 0, 0.5),
    "Black": (0, 0, 0)
}



class MainWindow(tk.Tk):
    def __init__(self, tracks):
        super().__init__()
        self.title("Colortify")
        self.geometry("500x400")
        self.tracks = tracks
        self.target_hue = 0.0 

 
        self.color_buttons_frame = tk.Frame(self)
        self.color_buttons_frame.pack(pady=10)
        for name, hsv in COLOR_PRESETS.items():
            r, g, b = self.hsv_to_rgb(*hsv)
            hex_color = f"#{r:02x}{g:02x}{b:02x}"
            btn = tk.Button(self.color_buttons_frame, bg=hex_color, width=6, height=2,
                            command=lambda n=name: self.on_color_selected(n))
            btn.pack(side=tk.LEFT, padx=2)

      
        self.color_display = tk.Label(self, text="Selected Color", width=20, height=2, bg="#ff0000")
        self.color_display.pack(pady=10)


        self.generate_button = tk.Button(self, text="Generate Playlist", command=self.generate_playlist)
        self.generate_button.pack(pady=20)

    def hsv_to_rgb(self, h, s, v):
        """Convert HSV [0,1] to RGB 0-255"""
        r, g, b = colorsys.hsv_to_rgb(h, s, v)
        return int(r*255), int(g*255), int(b*255)

    def on_color_selected(self, color_name):
        """Called when user selects a color from the palette"""
        h, s, v = COLOR_PRESETS[color_name]  
        self.target_hue = h
        self.target_saturation = s
        self.target_value = v

        r, g, b = colorsys.hsv_to_rgb(h, s, v)
        r, g, b = int(r*255), int(g*255), int(b*255)
        hex_color = f"#{r:02x}{g:02x}{b:02x}"
        self.color_display.config(bg=hex_color)

    def generate_playlist(self):
        """Filter tracks based on selected color and show result"""
        matching_tracks = filter_tracks_by_color(self.tracks, self.target_hue)
        if matching_tracks:
            messagebox.showinfo("Playlist Generated", f"{len(matching_tracks)} tracks match your color!")
        else:
            messagebox.showwarning("No Match", "No tracks match the selected color.")
