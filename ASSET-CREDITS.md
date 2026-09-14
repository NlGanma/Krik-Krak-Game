# Local asset sources

The following Poly Haven assets are downloaded into `public/assets/`. Poly Haven releases these assets under CC0. The game loads the local files; no asset CDN requests are needed at runtime.

| Asset | Use |
| --- | --- |
| [Throw Pillows 01](https://polyhaven.com/a/throw_pillows_01) — Serhii Khromov | One sculpted pillow, resized for a single bed and given a plain cotton cover; original normal/roughness detail retained. |
| [Painted Wooden Chair 02](https://polyhaven.com/a/painted_wooden_chair_02) | Worn guest-room chair, glTF model and 2K PBR maps. |
| [Jug 01](https://polyhaven.com/a/jug_01) | Ceramic washstand pitcher, glTF model and 2K PBR maps. |
| [Vintage Suitcase](https://polyhaven.com/a/vintage_suitcase) | One closed travel case, glTF model and 2K PBR maps. |
| [White Plaster 02](https://polyhaven.com/a/white_plaster_02) | Whitewashed walls, 2K color, normal and roughness maps. |
| [Wooden Planks](https://polyhaven.com/a/wooden_planks) | Furniture and door wood, 2K color, normal and roughness maps. |
| [Concrete Floor Worn 001](https://polyhaven.com/a/concrete_floor_worn_001) | Worn cement floor, 2K color, normal and roughness maps. |

The room, hurricane lamp, bed frame, draped sheet and blanket, hanging mosquito net, crucifix, basin, shutters, towel, matchbox, and small fittings are custom geometry. The net and bedding use subdivided surfaces rather than flat boxes. The net moves subtly; the lamp is the main warm light. A small mirror reflects the actual room.

The furniture and room are an artistic interpretation of the supplied setting, not a reconstruction of a documented house.

Run `python3 scripts/download-assets.py` to restore missing original downloads. Exact source URLs and license labels are also recorded in `public/assets/credits.json`.
