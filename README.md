# Hà Giang Pedal Odyssey: Chinh Phục Tứ Đại Đỉnh Đèo

Standalone 3D cycling adventure set in the Vietnamese Hà Giang highlands.

## Play

GitHub Pages demo: https://tnhminh.github.io/ha-giang-pedal-odyssey/

Open `index.html` directly for the offline zero-CORS build.

## Features

- Mako Hero child rider on a real bicycle GLB asset.
- Stylized Hà Giang mountain route with Bắc Sum, Quản Bạ, Yên Minh, Đồng Văn, Mã Pí Lèng and Tu Sản landmarks.
- Real GLB environment assets: bicycle, character, Vietnamese house, forest, pine, cliffs, rocks and mountain flowers.
- Cycling stamina, speed, steering, braking, jumping and bell feedback.
- Vietnamese road guide posts, mountain fog, lighting, HUD and procedural Web Audio.
- All runtime assets embedded in the standalone `index.html` artifact.

## Controls

- `W` / `Arrow Up`: pedal
- `S` / `Arrow Down`: brake
- `A/D` or left/right arrows: steer
- `Space`: jump
- `H` or `C`: bell

## Structure

```text
index.html                 standalone release artifact
assets-manifest.json       asset-first manifest
assets/models/             source GLB models
build/template.html        HTML source template
build/game_core.js         Three.js game logic
build/embedded_assets.json embedded GLB data
vendor/                    local Three.js, GLTFLoader and SkeletonUtils
```

## Verification

- JavaScript syntax checked with `node --check`.
- Asset-first gate passed with `ASSET_FIRST_APPROVED`.
- Browser smoke test verified 8/8 assets, Mako Hero, Start, pedal input and gameplay state.
- Live deployment is published through GitHub Pages.

The models are retained from the local asset inventory; review original license and attribution metadata before commercial redistribution.
