# pixelmatch

Fast pixel-level image comparison library for MoonBit/WASM.

Port of [mapbox/pixelmatch](https://github.com/mapbox/pixelmatch) to MoonBit.

## Features

- YIQ color space for perceptual color difference
- Anti-aliasing detection
- Configurable threshold
- Diff image generation
- Simple and fast API

## Installation

```bash
moon add mizchi/pixelmatch
```

## Usage

```moonbit
let img1 = @pixelmatch.Image::new(100, 100)
let img2 = @pixelmatch.Image::new(100, 100)

// Fill images with pixel data...

// Simple comparison
let diff_count = @pixelmatch.pixelmatch_simple(img1, img2, 0.1)

// Full comparison with options
let options = @pixelmatch.Options::default()
let output = @pixelmatch.Image::new(100, 100)
let diff_count = @pixelmatch.pixelmatch(img1, img2, Some(output), options)

// Get match ratio (0.0 to 1.0)
let ratio = @pixelmatch.match_ratio(img1, img2, options)
```

## API

### `pixelmatch(img1, img2, output?, options) -> Int`

Compare two images and return the number of different pixels.

### `pixelmatch_simple(img1, img2, threshold) -> Int`

Simple comparison without anti-aliasing detection.

### `match_ratio(img1, img2, options) -> Double`

Calculate match ratio (0.0 = completely different, 1.0 = identical).

### Options

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `threshold` | `Double` | `0.1` | Matching threshold (0-1). Smaller = more sensitive |
| `include_aa` | `Bool` | `false` | Include anti-aliased pixels in diff count |
| `alpha` | `Double` | `0.1` | Blending factor for unchanged pixels |
| `aa_color` | `Color` | Yellow | Color for anti-aliased pixels in diff |
| `diff_color` | `Color` | Red | Color for different pixels in diff |
| `diff_mask` | `Bool` | `false` | Only draw changed pixels |

## License

Apache-2.0
