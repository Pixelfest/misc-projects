# Pixel Fest

A web app for drawing low-resolution pixel art and animations, one pixel at a time, and exporting them as animated WebP.

## Language

**Project**:
The whole document: a canvas size, an ordered list of **Frames**, and a loop setting. Can be saved to disk and loaded on another machine, or kept in a **Library**.
_Avoid_: file, document, drawing

**Library**:
A named-by-link collection of **Projects** kept in cloud storage, with no owner, account or personal information attached. Whoever holds the **Library link** can read, change and delete everything in it.
_Avoid_: account, workspace, vault, cloud folder

**Library link**:
The secret URL that opens a **Library**. It contains a random UUID and is the only credential: there is no login and no recovery, so a lost link means a lost **Library**. Keeping it safe is the user's responsibility.
_Avoid_: share link, id, key, token

**Canvas size**:
The width and height in pixels shared by every **Frame** in a **Project**, each between 1 and 128. Chosen at creation, resizable later by cropping or padding.
_Avoid_: resolution, dimensions

**Frame**:
One image in the animation, with a **Duration**.
_Avoid_: slide, cel, image

**Duration**:
How long a **Frame** is shown, in milliseconds. Defaults to 100 ms.
_Avoid_: delay, timing

**Pixel**:
One cell of a **Frame**, holding an RGBA color. A fully transparent pixel is "undrawn" and shows a checkerboard in the editor.
_Avoid_: dot, cell

**Reference frame**:
A **Frame** shown semi-transparently beneath the **Frame** being edited, as a drawing aid (classic onion skin). Any **Frame** can be chosen. Editor-only: never exported.
_Avoid_: example frame, ghost, onion skin

**Palette**:
The set of the 8 most-used colors in the **Project**, derived automatically from the **Pixels**. It is a shortcut, not a restriction: any color can be drawn.
_Avoid_: color bar, swatches

**Active color**:
The RGBA color the drawing tools currently paint with, set by the color picker, a hex code, a transparency slider, or by picking from the **Palette** or the image.
_Avoid_: current color, brush color

**Selection**:
A rectangular area of a **Frame**. Its contents can be moved, copied, pasted (also into other **Frames**), or deleted.
_Avoid_: marquee, lasso

**Timeline**:
The panel listing the **Frames** with their thumbnails and **Durations**.
_Avoid_: animation pane, film strip

**Export**:
Rendering a **Project** to an animated WebP with transparency. WebP is the only export format.
_Avoid_: save (saving means writing the **Project** itself to disk)
