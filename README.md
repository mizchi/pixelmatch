# pixelmatch

Fast pixel-level image comparison library for MoonBit/WASM.

Port of [mapbox/pixelmatch](https://github.com/mapbox/pixelmatch) to MoonBit.

## Features

- YIQ color space for perceptual color difference
- Anti-aliasing detection
- Configurable threshold
- Diff image generation
- **AI-friendly diff reports** (text/JSON output)
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

// Generate AI-friendly diff report
let report = @pixelmatch.diff_report(img1, img2, options)
println(report.to_text())  // Human/AI readable text
println(report.to_json())  // Structured JSON
```

## AI-Friendly Diff Report

The `diff_report` function generates a comprehensive report optimized for AI consumption:

```
=== Diff Report ===
Summary:
  Image size: 100x100
  Total pixels: 10000
  Different pixels: 25
  Anti-aliased pixels: 3
  Match ratio: 99%

Verdict: NEARLY_IDENTICAL (minor differences)

Heatmap (10x10 grid):
  0123456789
0 ..........
1 ..░░......
2 ..▒▓......
3 ..░.......
4 ..........

Diff Regions (1):
  [0] pos=(20,10) size=15x25 pixels=25
```

### DiffReport Fields

| Field | Type | Description |
|-------|------|-------------|
| `diff_count` | `Int` | Number of different pixels |
| `aa_count` | `Int` | Number of anti-aliased pixels |
| `match_ratio` | `Double` | 0.0 to 1.0 similarity |
| `grid` | `Array[Array[Int]]` | Heatmap grid cells |
| `regions` | `Array[DiffRegion]` | Bounding boxes of diff areas |

## API

### `pixelmatch(img1, img2, output?, options) -> Int`

Compare two images and return the number of different pixels.

### `pixelmatch_simple(img1, img2, threshold) -> Int`

Simple comparison without anti-aliasing detection.

### `match_ratio(img1, img2, options) -> Double`

Calculate match ratio (0.0 = completely different, 1.0 = identical).

### `diff_report(img1, img2, options, grid_size~) -> DiffReport`

Generate comprehensive diff report with statistics, heatmap, and regions.

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
