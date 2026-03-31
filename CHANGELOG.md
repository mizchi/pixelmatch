# Changelog

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
