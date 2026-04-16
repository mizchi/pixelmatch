# Changelog

## 0.6.0

### New Features

- **JS build for npm** (`@mizchi/pixelmatch`): MoonBit compiled to ESM JavaScript with TypeScript types, camelCase API, and Canvas `ImageData` support.
- **WASM component fix**: Workaround for MoonBit compiler codegen bug + updated `wasm-tools` pipeline (`embed` + `new`).
- **Cross-validation**: 27/27 test cases produce byte-identical results with mapbox/pixelmatch v7.1.0.

### Bug Fixes

- **threshold calculation**: `35215 * t^4` → `35215 * t^2` (matching mapbox/pixelmatch)
- **color_delta alpha blending**: white background → position-dependent checkerboard background
- **color_delta sign convention**: `y < 0 → -delta` → `y > 0 → -delta`
- **blend_gray formula**: `Y * alpha` → `255 + (Y - 255) * alpha * a / 255`
- **is_antialiased**: added zeroes counter with early exit for >2 identical neighbors
- **has_many_siblings**: ±3 tolerance → exact RGBA match with boundary head start
- **flood fill**: check visited/diff_map before push (prevents 4x memory bloat)
- **Image::from_pixels**: validate pixel count instead of silent zero-fill
- **Image::new**: guard against integer overflow and negative dimensions

## 0.4.0 (unreleased)

### Breaking Changes

- **`Image.data` type changed from `Array[Int]` to `FixedArray[Int]`**
  - Enables zero-copy C FFI on native target (56x speedup)
  - `FixedArray` provides contiguous memory layout without RC overhead
  - Migration: replace `Array::make(size, 0)` with `FixedArray::make(size, 0)` when constructing Image data manually

### New Features

- `pixelmatch_simple_prefilter(img1, img2, threshold)` - Row-level memcmp prefilter that skips identical rows. Up to 25x faster for nearly-identical images (typical VRT scenario).
- `pixelmatch_native(img1, img2, threshold)` - Native-only C FFI implementation with hardware memcmp + LLVM auto-vectorized YIQ delta. 56-86x faster than pure MoonBit on identical images.
- Rust benchmark suite (`bench_rs/`) comparing CPU, CPU+prefilter, Rayon, Rayon+prefilter, GPU (wgpu), and GPU batch approaches.
- CI benchmark matrix (macOS + Linux) for continuous performance tracking.

### Performance (200x200 identical images, Apple M5)

| Implementation | Time | vs baseline |
|---|---|---|
| Native simple (MoonBit) | 1450µs | 1.0x |
| JS simple (V8) | 311µs | 4.7x |
| WASM prefilter | 208µs | 7.0x |
| Native prefilter (MoonBit) | 263µs | 5.5x |
| **Native C-FFI (zero-copy)** | **16.78µs** | **86.4x** |
