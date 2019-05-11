# NES Sprite Editor

A simple web editor for NES sprites.

<p align="center">
  <img src="https://i.imgur.com/CMIer9V.png"/>
</p>

# Functionalities
This *awesome* editor lets you:
- Select from a wide variety of 60 unique* colors
- Open `.chr` files
- Save `.chr` files
- **BETA**: Open `.png` (and other image formats) files
- Save `.png` files

*Not all colors are actually unique: $0D, $1D, $(0-3)E and $(0-3)F all encode black (#000), although
$0D is a "blacker than black" color which can cause some weird effects on some TVs. See
[this thread](https://web.archive.org/web/20180817072753/https://forums.nesdev.com/viewtopic.php?f=2&t=15734)
for more info.

# TODO
- Style the file uploaders
- Add drag'n'drop functionality so any file dragged anywhere on the page is used as a spritesheet
- Confirm dialogs for "New spritesheet" and other destructive actions
- Draggable selections
- Keyboard shortcuts: Copy / Paste / Cut (`Ctrl+C`/`Ctrl+V`/`Ctrl+X`), Undo (`Ctrl+Z`) and Redo
(`Ctrl+Shift+Z`) cancelling selection (`Esc`), perhaps forcing a square selection (`Shift`)

# Issues
- When opening a `.png` (or other image format) file, it does **not** check for color compatibility.
That is, if you upload any PNG image, it will just draw it right up, regardless if it was actually a
spritesheet. **FIXME:** Figure out a way to remove any colors that are not in the palette or, even
better, attempt to automatically detect a palette from a given image.
- Sometimes (on page resize?) the background on the right side of the canvas bugs out and you can't
scroll there. It fixes itself if you select another zoom level and then come back. Is this a Chrome
bug? Is this a CSS bug? We may never find out
- The code is kind of a mess. Someone should fix that.
- I can't get the SVGs to be `#fff` when they're in the tool picker and `#c0c0c0` when they're being
used as a cursor; having multiple identical SVG files with different colors seems dumb
- If you set two different palettes to be the same color (e.g. `$3E` and `$3F` which, although have
different codes, are both `#000`) the editor will not keep track of what pixels were what color. This
is an easy way of accidentally losing information: setting the background to be the same color as the
foreground will merge both, and there is no coming back