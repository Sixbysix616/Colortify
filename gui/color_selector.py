# Module for color selection slider
import tkinter as tk

class ColorSelector(tk.Frame):
    """HSV Hue slider for selecting target color"""
    def __init__(self, master=None, callback=None):
        super().__init__(master)
        self.callback = callback
        self.pack()
        self.create_widgets()

    def create_widgets(self):
        self.label = tk.Label(self, text="Select Hue (0-360):")
        self.label.pack()

        self.hue_slider = tk.Scale(self, from_=0, to=360, orient=tk.HORIZONTAL,
                                   length=300, command=self.on_change)
        self.hue_slider.pack()

    def on_change(self, val):
        hue = int(val) / 360  # normalize to 0-1
        if self.callback:
            self.callback(hue)
