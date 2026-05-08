# Desktop Pet 🐾

A cute floating desktop pet built with Electron. The pet walks across the bottom of your screen, shows motivational messages, and takes little naps — all above your other windows.

---

## File Tree

```
desktop-pet/
├── main.js              # Electron main process – window creation, IPC handlers, context menu
├── preload.js           # Secure contextBridge API exposed to renderer
├── index.html           # App shell (frameless transparent window)
├── renderer.js          # Pet behaviour: walking, messages, sleep, drag
├── styles.css           # Transparent UI styling + Pixelify Sans font
├── package.json         # npm / electron-builder config
├── make_assets.py       # Script to regenerate placeholder sprites (Pillow)
├── assets/
│   ├── stand-still-1.png   # Walking frame A
│   ├── stand-still-2.png   # Walking frame B (blink)
│   ├── look-up.png         # Message pose
│   ├── sleep.png           # Sleep pose
│   ├── message.png         # Speech bubble graphic
│   └── zzz.png             # Zzz icon
└── fonts/
    ├── PixelifySans-Regular.ttf
    └── PixelifySans-Bold.ttf
```

---

## Behaviour Summary

| State    | Trigger                        | Duration   | Priority |
|----------|--------------------------------|------------|----------|
| Walking  | Default / after any other state | Continuous | Low      |
| Message  | Every N seconds (default 30s)  | 5 seconds  | Medium   |
| Sleep    | Every 2 minutes                | 1 minute   | High     |

- **Walking**: pet alternates between `stand-still-1` and `stand-still-2` every 15 s, walks left/right across the full screen width, flips direction at screen edges.
- **Message**: pet stops, shows `look-up.png` + `message.png` bubble with a random motivational line. Click-to-show also works.
- **Sleep**: highest priority — suppresses messages while sleeping. Shows `sleep.png` + animated ZZZ.

---

## Run Commands

```bash
npm install       # install dependencies
npm start         # run in development (opens the pet window)
npm run dist      # build distributable
```

---

## Dist Artifact Paths

| Platform | Path |
|----------|------|
| macOS    | `dist/DesktopPet-1.0.0.dmg` |
| Windows  | `dist/DesktopPet Setup 1.0.0.exe` |
| Linux    | `dist/DesktopPet-1.0.0.AppImage` |

---

## Customisation Guide

### Sizes (in `renderer.js`)

| Constant        | Default | Effect                         |
|-----------------|---------|--------------------------------|
| `PET_SIZE`      | `150`   | Width & height of the pet image |
| `BUBBLE_W`      | `220`   | Width of the speech bubble     |
| `BUBBLE_H`      | `130`   | Height of the speech bubble    |
| `ZZZ_SIZE`      | `52`    | Size of the Zzz icon           |
| `BUBBLE_FONT_SIZE` | `13` | Font size inside the bubble    |

### Text layout inside bubble (insets from bubble image edge)

| Constant              | Default |
|-----------------------|---------|
| `BUBBLE_TEXT_TOP`     | `20`    |
| `BUBBLE_TEXT_LEFT`    | `18`    |
| `BUBBLE_TEXT_RIGHT`   | `18`    |
| `BUBBLE_TEXT_BOTTOM`  | `32`    |

### Timing

| Constant          | Default    | Effect                      |
|-------------------|------------|-----------------------------|
| `STAND_SWAP_MS`   | `15000`    | Frame alternation interval  |
| `MESSAGE_HOLD_MS` | `5000`     | How long bubble stays up    |
| `SLEEP_HOLD_MS`   | `60000`    | Sleep duration (1 min)      |
| `SLEEP_EVERY_MS`  | `120000`   | Sleep trigger interval (2 min) |
| `WALK_SPEED`      | `1.2`      | Pixels moved per rAF tick   |

### Messages

Edit the `MESSAGES` array near the top of `renderer.js`.

### Assets

Drop new PNG files (transparent background) into `assets/` using the exact names listed above. Run `python3 make_assets.py` at any time to regenerate the placeholder sprites for any **missing** files only — existing files are never overwritten.

### Font

Replace `fonts/PixelifySans-Regular.ttf` (and `Bold.ttf`) with any TTF and update the `@font-face` `font-family` name in `styles.css`.

---

## Right-Click Menu

Right-click the pet to:

- **Hide for 1 hour** — temporarily hides the window
- **Message frequency** → 15 s / 30 s / 60 s / Off
- **Quit**
