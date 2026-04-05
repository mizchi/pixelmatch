# Diff Clustering & Shift Compensation Design

## Overview

Two related enhancements to pixelmatch's `diff_report()`:
1. **#4 Diff Clustering**: Classify `DiffRegion` into `shift` / `content` / `edge` types
2. **#5 Shift Compensation**: Detect vertical offset via cross-correlation and re-diff with compensation

Both are implemented as extensions to existing `DiffReport` / `DiffRegion` structs.

## #4: Region Classification

### DiffRegion changes

Add `region_type: String` field to `DiffRegion`:

```moonbit
struct DiffRegion {
  x: Int; y: Int; width: Int; height: Int
  diff_pixels: Int
  region_type: String  // "shift" | "content" | "edge"
}
```

### Classification logic

```
if width/height > 3.0 AND width > image_width * 80% → "shift"
else if width <= 2 OR height <= 2                    → "edge"
else                                                  → "content"
```

### DiffReport additions

```moonbit
shift_only: Bool          // true when all regions are "shift"
content_change_count: Int // number of "content" regions
```

### Output format

All existing output formats (`to_json`, `to_compact_with_hints`, `to_text`) include the new fields.

## #5: Shift Compensation

### New types

```moonbit
struct ShiftRegion {
  y_start: Int
  y_end: Int
  shift: Int  // vertical offset in pixels
}
```

### DiffReport additions

```moonbit
global_shift: Int                   // overall vertical offset (px)
shift_regions: Array[ShiftRegion]   // piecewise offset per vertical segment
compensated_diff_count: Int         // diff pixel count after shift compensation
```

### Options addition

```moonbit
struct Options {
  // ... existing fields ...
  detect_shift: Bool  // default false; enables shift detection & compensation
}
```

### Algorithm

1. **Luminance profile**: For each image, compute average luminance per row using existing YIQ Y component: `Y = 0.299*R + 0.587*G + 0.114*B`
2. **Global shift**: Cross-correlate the two 1D profiles (brute-force O(n^2), sufficient for typical page heights 1000-5000px). Find offset with maximum normalized correlation.
3. **Piecewise shift**: Sliding window (100px, 50px overlap) cross-correlation. Merge adjacent windows with same offset into `ShiftRegion` segments.
4. **Compensated diff**: For each ShiftRegion, compare `img1[y_start..y_end]` against `img2[y_start+shift..y_end+shift]` using `pixelmatch`. Sum results as `compensated_diff_count`.

### Cross-correlation formula

```
corr(offset) = sum(profile1[y] * profile2[y + offset]) / sqrt(sum(profile1[y]^2) * sum(profile2[y + offset]^2))
```

Best offset = argmax(corr) within `[-max_shift, max_shift]` where `max_shift = min(height/4, 500)`.

## JSON output example

```json
{
  "width": 1024,
  "height": 2000,
  "diff_count": 18000,
  "compensated_diff_count": 42,
  "global_shift": 30,
  "shift_regions": [
    {"y_start": 0, "y_end": 200, "shift": 0},
    {"y_start": 200, "y_end": 1800, "shift": 30},
    {"y_start": 1800, "y_end": 2000, "shift": 0}
  ],
  "regions": [
    {"region_type": "shift", "x": 0, "y": 200, "width": 1024, "height": 600, "diff_pixels": 15000},
    {"region_type": "content", "x": 100, "y": 50, "width": 200, "height": 70, "diff_pixels": 42}
  ],
  "shift_only": false,
  "content_change_count": 1,
  "match_ratio": 0.991
}
```

## Test strategy

- Existing tests pass without modification (new fields are additive)
- Synthetic images for classification: full-width band (shift), small box (content), thin line (edge)
- Known-offset images for shift compensation: create img2 by shifting img1 down N pixels, verify `global_shift == N` and `compensated_diff_count == 0`
- Piecewise: image with header unchanged + body shifted, verify correct `shift_regions`

## Files to modify

- `src/lib.mbt`: DiffRegion, DiffReport, ShiftRegion structs; classification logic; shift detection functions; diff_report() extension
- `src/lib_test.mbt`: Unit tests for classification and shift compensation
