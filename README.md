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

# Issues
- When opening a `.png` (or other image format) file, it does **not** check for color compatibility.
That is, if you upload any PNG image, it will just draw it right up, regardless if it was actually a
spritesheet. **FIXME:** Figure out a way to remove any colors that are not in the palette or, even
better, attempt to automatically detect a palette from a given image.
- Sometimes (on page resize?) the background on the right side of the canvas bugs out and you can't
scroll there. It fixes itself if you select another zoom level and then come back. Is this a Chrome
bug? Is this a CSS bug? We may never find out
- The code is kind of a mess. Someone should fix that.
- For some reason, both the color 1 (CL1) and color 2 (CL2) selection boxes grow by a single pixel
when you alternate color 1 is selected, but shrink back again when background (BKG) is selected.
Notice that CL1 grows on its left side, while CL2 grows on its right side:<br>
![GIF animation of the boxes growing / shrinking](https://i.imgur.com/MXnFfLZ.gif)
