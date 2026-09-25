# Beer Run

A pixel-art bike game prototype: ride down an unpaved road with 3 crates of
beer strapped to the back, evade bumps and holes, and try not to lose your
whole delivery.

Built in **Godot 4.3**. Godot exports natively to HTML5/WebAssembly, so this
is straightforward to put online (itch.io, GitHub Pages, your own server) —
see "Playing it online" below.

## Status: base scene + crate-fall animation

This first pass covers exactly two things, per the current plan:

1. **Base scene** — a bike with a rider on it. The bike has a procedural
   wobble (bounce + tilt + a little noise, standing in for riding over a
   bumpy road). The rider isn't rigidly glued to the bike: it trails the
   bike's motion with a slight delay and a small independent wobble of its
   own, so it reads as a rider *reacting* to the bike rather than a sticker
   on top of it.
2. **Crate fall/topple/spill animation** — 3 crates sit on the rear rack,
   each wobbling like the rider (same lag-follow trick, slightly out of
   phase from each other so they don't move in lockstep). When a crate is
   knocked off, real physics takes over: it tumbles through the air, hits
   the ground, topples over on impact, and its bottles spill out and roll
   away — all driven by Godot's 2D physics engine (`RigidBody2D`), not
   hand-animated frames.

There's no obstacle/dodge gameplay yet (no lanes, no actual bumps/holes to
steer around). `Game.tscn` is a test harness: press **Space** to simulate
hitting an obstacle and knock the next crate off, so you can see the fall
animation without the real gameplay built yet. Press **R** to restart once
all 3 crates are gone ("game over").

All art in `assets/sprites/` is placeholder pixel art I generated
programmatically (flat-color blocky shapes) so the project is playable and
proportioned. Swap these out for your own pixel art — same filenames, same
canvas sizes, and it'll drop right in:

| File | Size (px) |
|---|---|
| `bike.png` | 48×24 |
| `rider.png` | 20×28 |
| `crate.png` | 16×16 |
| `bottle.png` | 8×16 |
| `road_tile.png` | 64×40 (tiles horizontally) |

The project renders everything at native pixel size with nearest-neighbor
filtering (no blur) and a 3x camera zoom, so pixel art stays crisp — see
`project.godot` (`textures/canvas_textures/default_texture_filter=0`) and
the `Camera2D` in `Game.tscn` (`zoom = Vector2(3, 3)`).

## Project layout

```
beer-run/
  project.godot
  icon.svg
  scenes/
    Game.tscn      # test harness: bike, rider, 3 crates, ground, HUD
    Bike.tscn      # wobbling bike
    Rider.tscn      # lag-follows the bike
    Crate.tscn      # wobbles while mounted, falls/topples/spills when knocked off
    Bottle.tscn     # small physics prop that spills out of a fallen crate
  scripts/
    bike.gd          # procedural bob/tilt/noise wobble
    lag_follow.gd     # generic "trail a target's transform with delay + own wobble"
    crate.gd          # mounted follow -> knock_off() -> physics fall -> spill bottles
    road_scroll.gd    # infinite-scrolling dirt road backdrop (cosmetic only, for now)
    game.gd           # wires it all together + test input + HUD
  assets/sprites/    # placeholder pixel art (replace with your own)
```

## How the crate-fall animation actually works

No animation frames are hand-drawn for the fall. Instead:

- While mounted, `Crate.tscn` is a **frozen** `RigidBody2D` (`freeze = true`)
  that has its transform driven manually every frame — same lag-follow math
  as the rider, so it wobbles convincingly on the rack without being
  simulated by physics yet.
- `knock_off()` unfreezes it, reparents it into the world, and gives it a
  small random impulse (a little sideways kick + upward pop + spin) so it
  looks like it actually bounced off the rack instead of just falling
  straight down.
- Gravity and collision with the ground (`Ground`, in the `"ground"` group)
  do the rest: the crate falls, and however it lands and topples is just
  physics — friction and a low bounce value (tuned via a `PhysicsMaterial`)
  keep it from bouncing around forever.
- The moment the crate's `body_entered` signal reports contact with
  something in the `"ground"` group, it spawns a handful of `Bottle.tscn`
  instances at marker positions inside the crate (`BottleSlots`), each with
  a small random impulse so they scatter and roll — also pure physics, no
  hand animation.

This means the fall always looks a little different each time, and it'll
react correctly to *whatever* the crate happens to hit later (a rock, a
ditch, another crate) once real obstacles exist — no animation states to
maintain by hand.

## Opening and running it

This container doesn't have the Godot editor installed, so none of this has
been run/tested inside Godot itself — only the project structure and syntax
have been hand-verified against the Godot 4 formats.

1. Install [Godot 4.3+](https://godotengine.org/download) (the standard
   build, no .NET/C# needed — everything here is GDScript).
2. Open Godot, choose **Import**, and select
   `beer-run/project.godot`.
3. Press **F5** (or the Play button) to run `Game.tscn`.
4. Press **Space** repeatedly to watch crates get knocked off one at a time.

If anything fails to parse (unlikely, but this was written by hand without
the editor to check it), the error in Godot's output panel will point at
the exact `.tscn`/`.gd` file and line — it's plain text, easy to fix.

## Playing it online

Godot's Web export produces an HTML5/WASM build you can host anywhere
static files work (GitHub Pages, itch.io, S3, etc.):

1. In Godot: **Editor → Manage Export Templates** → install templates
   matching your Godot version (one-time download).
2. **Project → Export... → Add... → Web**.
3. Set an export path like `builds/web/index.html` and click **Export
   Project**.
4. Upload the contents of `builds/web/` to any static host. For itch.io:
   zip that folder and upload it as an HTML5 game.

`builds/` and `.godot/` are already git-ignored so exported builds and
editor cache don't get committed.

## Suggested next steps

- The actual obstacle course: a lane-based or height-field road with real
  bumps/holes to swerve around, wired to call `crate.knock_off()` on a hit
  (the hook already exists — `Game.gd`'s `_knock_off_next_crate()` is a
  stand-in for "player hit something").
- Steering input for the bike (currently the bike only idles in place).
- Tie the fallen crates/bottles into the scrolling world so they don't stay
  behind at a fixed point once the world starts actually scrolling forward.
- Replace the placeholder sprites with your own pixel art.
