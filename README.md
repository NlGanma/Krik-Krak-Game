# A room before morning

A local, first-person Three.js scene of a small rented guest room in Haiti, 1992.

## Run

```sh
npm install
npm run dev
```

Open http://localhost:5173. Move with WASD. Click the scene for mouse look; Escape releases the pointer. Drag to look if pointer lock is unavailable, or on touch screens. Left/right arrows turn; up/down arrows walk. Press Space to jump onto the bed, suitcase, chair seat, and tables; combine it with WASD to move between them. You can jump again after landing and fall naturally when walking off an edge. H opens the controls panel. The viewpoint is approximately 1.05 metres above the floor. Ten seconds in, someone outside starts pounding on the door and shouting *Krik!*; the door shakes, the bolt rattles and plaster falls. Reach the light switch beside the door and press E to put the light out: the room falls to a candle's glow from the lamp and the knocking and the voice fade away over two seconds, after which they are gone; bring the light back sooner and they return. If ten seconds pass without that, the bolt tears out, the door slams open and it is game over; Start again resets the room. The visitor returns ten seconds after each visit. E does nothing else. Sound is optional and starts only when enabled; the night ambience, the knocking and the shout are all synthesized in the browser with Web Audio (no recordings). Touch movement controls appear on narrow screens.

`npm run build` produces the static production files in `dist/`.

The room combines custom geometry with downloaded Poly Haven CC0 models and 2K PBR materials. All models and material maps are stored locally in `public/assets/`; see ASSET-CREDITS.md for sources. Typography uses Google Fonts with local system fallbacks. No API keys are required.

Rendering uses static geometry batches and cached shadows, a mirror capped at ten updates per second, and adaptive pixel density. Run `node --test tests/*.test.js` for the jump, bedding, door-pounding and siege checks.
