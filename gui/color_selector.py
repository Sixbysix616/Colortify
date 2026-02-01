# Module for color selection panel (categorical)
import tkinter as tk

COLOR_OPTIONS = [
    ("Red", "red"),
    ("Orange", "orange"),
    ("Yellow", "yellow"),
    ("Green", "green"),
    ("Cyan", "cyan"),
    ("Blue", "blue"),
    ("Purple", "purple"),
    ("Black", "black"),
    ("Gray", "gray"),
    ("White", "white"),
]

class ColorSelector(tk.Frame):
    """Color category selector using buttons"""

    def __init__(self, master=None, callback=None):
        super().__init__(master)
        self.callback = callback
        self.selected_color = tk.StringVar()
        self.create_widgets()

    def create_widgets(self):
        title = tk.Label(self, text="Select Target Color")
        title.pack(pady=5)

        grid = tk.Frame(self)
        grid.pack()

        for idx, (label, value) in enumerate(COLOR_OPTIONS):
            btn = tk.Radiobutton(
                grid,
                text=label,
                value=value,
                variable=self.selected_color,
                indicatoron=False,
                width=10,
                command=self.on_select
            )
            btn.grid(row=idx // 4, column=idx % 4, padx=5, pady=5)

        # Default selection
        self.selected_color.set("red")
        self.on_select()

    def on_select(self):
        if self.callback:
            self.callback(self.selected_color.get())
