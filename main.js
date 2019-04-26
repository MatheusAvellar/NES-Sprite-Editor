/* Intialization */

// Editor data
const mapping = ["background", "color1", "color2", "color3"]

const palette = {
  background: { // rgb(124,124,124)
    r: 124, g: 124, b: 124,
    nes: "0x00"
  },
  color1: { // rgb(248,56,0)
    r: 248, g: 56, b: 0,
    nes: "0x16"
  },
  color2: { // rgb(252,160,68)
    r: 252, g: 160, b: 68,
    nes: "0x27"
  },
  color3: { // rgb(172,124,0)
    r: 172, g: 124, b: 0,
    nes: "0x18"
  }
};

function toRGB(obj) {
  return `rgb(${obj.r},${obj.g},${obj.b})`;
}

// Canvases
let SCALE = 20;
const WIDTH = 128;
const HEIGHT = 256;

const canvas = document.getElementById("editor");
const spriteCanvas = document.createElement("canvas");

const ctx = canvas.getContext("2d");
const spriteCtx = spriteCanvas.getContext("2d");

canvas.width = WIDTH * SCALE;
canvas.height = HEIGHT * SCALE;
spriteCanvas.width = WIDTH;
spriteCanvas.height = HEIGHT;

// Disable any upscaling blurring effects
// (must be done *after* setting the sizes)
function disableSmoothing() {
  ctx.imageSmoothingEnabled = false;
  spriteCtx.imageSmoothingEnabled = false;
}
disableSmoothing();

// Fill canvas with "background" color from palette
ctx.fillStyle = toRGB(palette.background);
ctx.fillRect(0, 0, canvas.width, canvas.height);

var spriteRomData = null;

var imageData = ctx.getImageData(0, 0, spriteCanvas.width, spriteCanvas.height);

var selectedPalette = "background";
var selectedColor = null;
var selectedNes = null;

// Preview
const preview = document.getElementById("preview");
preview.width = WIDTH;
preview.height = HEIGHT;

/* Events */
let showGridLines = true;
function toggleGrid(evt) {
  showGridLines = !showGridLines;
  paintCanvas();
}
document.getElementById("grid").onchange = toggleGrid;


// Upload .chr or image
document.getElementById("nesfile").addEventListener("change", readBlob, false);
document.getElementById("imgfile").addEventListener("change", readImage, false);

// Download as image
document.getElementById("image").addEventListener("click", function() {
  let image;

  // If grid lines are toggled...
  if(showGridLines) {
    // Disable grid lines
    showGridLines = false;

    // Use unscaled (1:1) canvas size before downloading
    // TODO: Add a zoom() functionality to replace this
    canvas.width = WIDTH;
    canvas.height = HEIGHT;

    // Repaint canvas (without grid and at 1:1 scale)
    paintCanvas(1);

    // Store canvas image (to be downloaded)
    image = canvas.toDataURL("image/png");

    // Reset grid line setting
    showGridLines = true;

    // Restore the canvas' original (scaled) size
    canvas.width = WIDTH * SCALE;
    canvas.height = HEIGHT * SCALE;

    // Repaint canvas (now with grid and zoom again)
    paintCanvas();
  } else {
    // Use unscaled (1:1) canvas size before downloading
    // TODO: Add a zoom() functionality to replace this
    canvas.width = WIDTH;
    canvas.height = HEIGHT;

    // Repaint canvas (without grid and at 1:1 scale)
    paintCanvas(1);

    // Store canvas image (to be downloaded)
    image = canvas.toDataURL("image/png");

    // Restore the canvas' original (scaled) size
    canvas.width = WIDTH * SCALE;
    canvas.height = HEIGHT * SCALE;

    // Repaint canvas (now with grid and zoom again)
    paintCanvas();
  }

  const name = document.getElementById("nesfilename").value || "sprite";
  download(name, image, "image/png");
});

// Download as .chr
document.getElementById("nes").addEventListener("click", function() {
  const name = document.getElementById("nesfilename").value || "sprite";
  spriteRomData = canvasToNES(imageData);
  download(name + ".chr", spriteRomData, "octect/stream");
});

// Reset canvas
document.getElementById("new").addEventListener("click", function() {
  spriteRomData = new Uint8Array(512*16);
  NEStoCanvas(spriteRomData);
});

const zoom = document.getElementsByClassName("zoom");
for(const el of zoom) {
  el.addEventListener("click", toggleZoom);
}
function toggleZoom() {
  SCALE = this.dataset.value || 10;
  paintCanvas();
}

const selectable = document.getElementsByClassName("selectable");
for(const el of selectable) {
  el.addEventListener("mouseup", handlePaletteChange);
}
function handlePaletteChange(evt) {
  if(evt.target.dataset.palette) {
    selectedPalette = evt.target.dataset.palette;
  }

  if(evt.target.dataset.nes) {
    selectedColor = evt.target.style.backgroundColor;
    selectedNes = evt.target.dataset.nes;

    for(const i in palette) {
      // If color has already been selected, don't select it
      if(palette[i].nes == selectedNes) {
        selectedColor = null;
        selectedNes = null;
        return;
      }
    }
  }

  if(selectedColor && selectedPalette) {
    const color = selectedColor.match(/(\d{1,3})\,\s*(\d{1,3})\,\s*(\d{1,3})/);
    swapPalettes(
      selectedPalette, [
        color[1], color[2], color[3]
      ],
      selectedNes
    );

    selectedColor = null;
    selectedNes = null;
  }
  updatePalette();
}

// Handle hotkeys
window.addEventListener("keydown", function(evt) {
  if(evt.keyCode < 49 || evt.keyCode > 52) return;

  if(evt.keyCode == 49) selectedPalette = "background";
  if(evt.keyCode == 50) selectedPalette = "color1";
  if(evt.keyCode == 51) selectedPalette = "color2";
  if(evt.keyCode == 52) selectedPalette = "color3";

  updatePalette();
});

function swapPalettes(sel, color, nes_id) {
  // Save the current state of the ROM before switching palettes
  spriteRomData = canvasToNES(imageData);

  // Effectively swap palette
  palette[sel].r = +color[0] || 0;
  palette[sel].g = +color[1] || 0;
  palette[sel].b = +color[2] || 0;
  palette[sel].nes = nes_id;

  // Draw the ROM with the new palette data
  NEStoCanvas(spriteRomData);

  updatePalette();
}

function setElementColor(elementId, r, g, b) {
  document.getElementById(elementId).style.backgroundColor = "rgb("+r+","+g+","+b+")";
}

function getColorLuminance(color) {
  return (color.r * 0.2126) + (color.g * 0.7152) + (color.b * 0.0722);
}

function getWhiteOrBlack(color) {
  return getColorLuminance(color) > 64 ? "black" : "white";
}

const palette_input = document.getElementById("palette-input");

palette_input.onblur = function palette_blurred(e) {
  userPalette(e.target);
}

palette_input.onkeyup = function palette_keyup(e) {
  if(e.keyCode == 13)
    userPalette(e.target);
}

function userPalette(pal_el) {
  const pal = pal_el.value.replace(/\s+|[^$,0-9A-Fa-f]/g, "");

  if(pal.length != 15
  || pal.split(",").length != 4
  || pal.split("$").length != 5) {
    pal_el.value = "$0F,$16,$27,$18";
    return;
  }

  const new_pal = pal.split(",$");     // ["$0F","16","27","18"]
  new_pal[0] = new_pal[0].slice(1);    // ["0F","16","27","18"]

  const reference = [
    "background",
    "color1",
    "color2",
    "color3"
  ];

  for(let i = 0; i < 4; i++) {
    const new_nes = "0x" + new_pal[i];
    const current_color = document.querySelector("[data-nes='" + new_nes + "']");
    const color = current_color.style.background.match(/(\d{1,3})\,\s*(\d{1,3})\,\s*(\d{1,3})/);

    swapPalettes(reference[i], [
      color[1],
      color[2],
      color[3]
    ], new_nes);
  }
}

function updatePalette() {
  var bgColor = palette.background;
  var c1 = palette.color1;
  var c2 = palette.color2;
  var c3 = palette.color3;

  const _b0 = document.getElementById("background");
  const _c1 = document.getElementById("color1");
  const _c2 = document.getElementById("color2");
  const _c3 = document.getElementById("color3");

  setElementColor("background", bgColor.r, bgColor.g, bgColor.b);
  setElementColor("color1", c1.r, c1.g, c1.b);
  setElementColor("color2", c2.r, c2.g, c2.b);
  setElementColor("color3", c3.r, c3.g, c3.b);

  _b0.style.color = getWhiteOrBlack(bgColor);
  _c1.style.color = getWhiteOrBlack(c1);
  _c2.style.color = getWhiteOrBlack(c2);
  _c3.style.color = getWhiteOrBlack(c3);

  _b0.removeAttribute("data-selected");
  _c1.removeAttribute("data-selected");
  _c2.removeAttribute("data-selected");
  _c3.removeAttribute("data-selected");

  document.getElementById(selectedPalette).setAttribute("data-selected", "");

  palette_input.value = [bgColor.nes, c1.nes, c2.nes, c3.nes].join(',').replace(/0x/g, '$');
}
updatePalette();

function getXY(evt) {
  let x = Math.floor(evt.offsetX / SCALE);
  let y = Math.floor(evt.offsetY / SCALE);

  // Return only positive coordinates
  if(x < 0) x = 0;
  if(y < 0) y = 0;

  return {
    x: x,
    y: y
  };
}

canvas.addEventListener("mousemove", function(evt) {
  var coords = getXY(evt);
  document.getElementById("coord").innerText = "Pixel (" + coords.x + ", " + coords.y + ")";

  var ycoord = Math.floor((coords.y/8)) * 16;
  var tile = Math.floor((coords.x) / 8 + ycoord).toString(16).toUpperCase();
  if(tile.length < 2) {
    tile = "0" + tile;
  }

  document.getElementById("tile").innerText = "Tile $" + tile;
  if(_isMouseDown) {
    handleDrawTool(evt);
  }
  paintCanvas();
  drawCurrentPixelSelected(coords.x, coords.y);
});

canvas.addEventListener("mousedown", down);
canvas.addEventListener("mouseup", up);

var _isMouseDown = false;
function down(evt) {
  _isMouseDown = true;
  handleDrawTool(evt);
}
function up(evt) {
  _isMouseDown = false;
}

function handleDrawTool(evt) {
  var coords = getXY(evt);
  putPixel(coords.x, coords.y, palette, selectedPalette, imageData);
  paintCanvas();
  updatePreview();
}

// Drawing utilities
function getCanvasImageOffset(x,y,imageData) {
  return (x  + imageData.width * y) * 4;
}

function putPixel(x, y, palette, paletteColor, imageData) {
  var canvasImageOffset = getCanvasImageOffset(x,y,imageData);
  var color = palette[paletteColor];
  imageData.data[canvasImageOffset + 0] = color.r;
  imageData.data[canvasImageOffset + 1] = color.g;
  imageData.data[canvasImageOffset + 2] = color.b;
}

function getPixel(x, y, imageData) {
  var canvasImageOffset = getCanvasImageOffset(x,y,imageData);
  var color = {
    r: imageData.data[canvasImageOffset + 0],
    g: imageData.data[canvasImageOffset + 1],
    b: imageData.data[canvasImageOffset + 2]
  };

  if(!color) {
    throw new Error("Invalid pixel (" + x + ", " + y + ")");
  }

  return color;
}

function drawSpriteBorderGridLines() {
  const sWidth = canvas.width / 16;
  const sHeight = canvas.height / 32;

  // If background palette is too bright,
  // draw black gridlines instead of white ones
  if(palette.background.nes == "0x20"
  || palette.background.nes == "0x30") {
    ctx.fillStyle = "#000";
    ctx.strokeStyle = "#000";
  } else {
    ctx.fillStyle = "#fff";
    ctx.strokeStyle = "#fff";
  }
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);
  ctx.lineDashOffset = 2;
  for(let x = 0; x < 15; x++) {
    ctx.beginPath()
    ctx.moveTo(x * sWidth + sWidth, 0);
    ctx.lineTo(x * sWidth + sWidth, canvas.height);
    ctx.stroke();
  }
  for(let y = 0; y < 31; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * sHeight + sHeight)
    ctx.lineTo(canvas.width, y * sHeight + sHeight)
    ctx.stroke();
  }
}

function drawCurrentPixelSelected(x, y) {
  const pWidth = canvas.width / 128;
  const pHeight = canvas.height / 256;

  // If background palette is too bright,
  // draw a black box instead of a white one
  if(palette.background.nes == "0x20"
  || palette.background.nes == "0x30") {
    ctx.fillStyle = "#000";
    ctx.strokeStyle = "#000";
  } else {
    ctx.fillStyle = "#fff";
    ctx.strokeStyle = "#fff";
  }
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);
  ctx.lineDashOffset = 2;
  ctx.beginPath()
  ctx.strokeRect(x * SCALE, y * SCALE, pWidth, pHeight);
  ctx.stroke();
}

function paintCanvas(scale) {
  // If no custom scale has been defined, use default
  if(!scale)
    scale = SCALE;

  const scaled_W = WIDTH * scale;
  const scaled_H = HEIGHT * scale;

  resizeCanvas(scaled_W, scaled_H);

  spriteCtx.putImageData(imageData, 0, 0);
  ctx.drawImage(spriteCanvas, 0, 0, scaled_W, scaled_H);

  if(showGridLines)
    drawSpriteBorderGridLines();
}

function updatePreview() {
  resizeCanvas(WIDTH, HEIGHT);
  spriteCtx.putImageData(imageData, 0, 0);
  ctx.drawImage(spriteCanvas, 0, 0, WIDTH, HEIGHT);
  preview.src = canvas.toDataURL("image/png");
  resizeCanvas(WIDTH*SCALE, HEIGHT*SCALE);

  paintCanvas();
}

function resizeCanvas(w,h) {
  if(canvas.width == w && canvas.height != h)
    return;

  canvas.width = w;
  canvas.height = h;
  disableSmoothing(/* yes, again */);
}

function rgbColorToPaletteTuple(color, palette) {
  if(!color) {
    throw new Error("Invalid color for current palette! - " + colorKey(color));
  }
  function colorKey(color) {
    return color.r + "+"+ color.g + "+" + color.b;
  }
  var paletteHash = {};
  paletteHash[colorKey(palette.background)] = [0x0, 0x0];
  paletteHash[colorKey(palette.color1)] = [0x1, 0x0];
  paletteHash[colorKey(palette.color2)] = [0x0, 0x1];
  paletteHash[colorKey(palette.color3)] = [0x1, 0x1];

  var result = paletteHash[colorKey(color)] || [0, 0];

  return result;
}

/// Translate raw NES binary to a canvas
function NEStoCanvas(byteArray) {
  var xpos = 0;
  var ypos = 0;
  // every sprite is 16 bytes
  // 1 byte is 8 pixels
  // byte n and byte n+8 control the color of that pixel
  //  (0,0) background
  //  (1,0) color 1
  //  (0,1) color 2
  //  (1,1) color 3
  for(var b = 0; b < byteArray.length; b+=16) {
    ypos = Math.floor(b/HEIGHT) * 8
    // draw sprite
    for(var i = 0; i < 8; i++) {
      for(var j = 7; j >= 0; j--) {
        var mask = 0x1;

        var channel1 = byteArray[b + i];

        var channel2 = byteArray[b + i + 8];

        var color = ((channel1 >>> j) & mask) + (((channel2 >>> j) & mask) << 1)

        putPixel(xpos + (7 - j), ypos + i, palette, mapping[color], imageData);
      }
    }
    xpos = (xpos + 8) % WIDTH;
  }

  paintCanvas();
  updatePreview();
}

// Translate raw canvas pixles to NES Binary
function canvasToNES(imageData) {
  // move 16 byte sprite and 512 sprites
  var byteArray = new Uint8Array(512 * 16);

  // tuple buffer
  var tupleBuffer = new Array(imageData.width * imageData.height);

  for(var y = 0; y < imageData.height; y++) {
    for(var x = 0; x < imageData.width; x++) {
      // extract which color it is from imageData
      var color = getPixel(x, y, imageData);

      // find the palette color
      var paletteTuple = rgbColorToPaletteTuple(color, palette);

      // write it to the tupleBuffer
      tupleBuffer[x + imageData.width * y] = paletteTuple;
    }
  }

  // tuple buffer has imageData.width * imageData.heigh pixels, so divide that by 16 for sprites
  var xtotal = 0;
  var ytotal = 0;
  for(var i = 0; i < byteArray.length; i+=8) {
    ytotal = Math.floor(i/HEIGHT) * 8;

    for(var y = ytotal; y < (ytotal + 8); y++) {
      // do each row channel
      var byteChannel1 = 0x00;
      var byteChannel2 = 0x00;

      // complete row calculation
      for(var x = xtotal; x < (xtotal + 8); x++) {
        var tup = tupleBuffer[x + y * imageData.width];
        byteChannel1 = (byteChannel1 << 1 | tup[0]);
        byteChannel2 = (byteChannel2 << 1 | tup[1]);
      }
      // write calc'd row channels to appropriate byte locations
      byteArray[i] = byteChannel1;
      byteArray[i+8] = byteChannel2
      i++;
    }

    xtotal = (xtotal + 8) % WIDTH;
  }

  return byteArray;
}


// Download utilities
function download(filename, byteArray, type) {
  // Convert to a blob
  const blob = new Blob([byteArray], {type: type});

  // Get blob URL
  const url = (type == "octect/stream")
    ? window.URL.createObjectURL(blob)
    : byteArray;

  // Create and click on download "button"
  const pom = document.createElement("a");
  pom.setAttribute("href", url);
  pom.setAttribute("download", filename);
  pom.click();
  pom.remove();
}

// Upload utilities
function readBlob() {
  const files = document.getElementById("nesfile").files;
  if(!files.length) return;

  const reader = new FileReader();

  // If we use onloadend, we need to check the readyState.
  reader.onloadend = function(evt) {
    if(evt.target.readyState == FileReader.DONE) { // DONE == 2
      spriteRomData = new Uint8Array(evt.target.result);
      NEStoCanvas(spriteRomData);
    }
  };

  reader.readAsArrayBuffer(files[0]);

  // Reset input (so that the same file may be reuploaded if need be)
  this.value = "";
}

function readImage() {
  /* TODO: Fix palette issues
  /* As of right now, when you upload an image, it just throws it in the canvas,
   * regardless of the colors in it; Unless the image is using the exact same
   * palette as you have selected, it's bound to cause some problems.
   */
  const files = document.getElementById("imgfile").files;
  if(!files.length) return;

  const img = new Image();
  img.onload = function() {
    spriteCtx.drawImage(img,0,0);
    imageData = spriteCtx.getImageData(0, 0, spriteCanvas.width, spriteCanvas.height);
  }
  img.src = URL.createObjectURL(files[0]);

  // Reset input (so that the same file may be reuploaded if need be)
  this.value = "";
}

// Load up default sprite sheet
// const xhr = new XMLHttpRequest();
// xhr.open("GET", "main.chr")
// xhr.responseType = "arraybuffer";

// xhr.addEventListener("load", function(evt) {
//   if(xhr.status >= 400) {
//     // Failed to retrieve "main.chr"
//     console.warn(xhr.status + " - " + xhr.statusText);
//     spriteRomData = new Uint8Array(0);
//   } else {
//     spriteRomData = new Uint8Array(xhr.response);
//   }
//   NEStoCanvas(spriteRomData);
// });

// xhr.send();