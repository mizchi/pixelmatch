# pixelmatch

**Pixelmatch for Humans and AI** - Fast pixel-level image comparison library for MoonBit/WASM.

Port of [mapbox/pixelmatch](https://github.com/mapbox/pixelmatch) to MoonBit.

## Features

- YIQ color space for perceptual color difference
- Anti-aliasing detection
- Configurable threshold
- Diff image generation
- **AI-friendly diff reports** with automatic shape hints
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
println(report.to_compact())             // Minimal tokens for AI
println(report.to_compact_with_hints())  // With shape hints (recommended)
println(report.to_text())                // Verbose for humans
println(report.to_json())                // Structured JSON
```

## AI-Friendly Diff Report

### Compact Format

The `to_compact()` method generates a minimal-token format optimized for AI:

```
diff:100/2500(96%match)
..........
.XX.......
.XX.......
..........
..........
..........
..........
..........
..........
..........
regions:5,5,10x10
```

**Format:**
- Line 1: `diff:count/total(match%)`
- Lines 2-11: 10x10 binary heatmap (`.` = no diff, `X` = diff)
- Last line: `regions:x,y,WxH;...` (semicolon-separated)

### Shape Hints

The `to_compact_with_hints()` method adds automatic shape detection:

```
diff:952/2500(61%match)
..........
..XXXXXX..
.XXXXXXXX.
.XXXXXXXX.
.XXX..XXX.
.XXX...XXX
.XXXX.XXX.
.XXXXXXXX.
..XXXXXX..
..........
regions:5,5,41x41
hints:HAS_HOLE: shape may have empty center (ring/donut/frame)
```

**Available hints:**

| Hint | Description |
|------|-------------|
| `HAS_HOLE` | Shape has empty center (ring, donut, frame) |
| `IS_BORDER` | Changes only on edges (frame pattern) |
| `DIRECTIONAL` | Asymmetric shape (top/bottom/left/right heavy) |
| `MULTI_REGION` | Multiple separate diff areas |
| `REPEATING` | Similar-sized regions (grid/checkerboard) |

### Format Comparison

| Format | Tokens | Use case |
|--------|--------|----------|
| `to_compact()` | ~80 | AI agents, automated pipelines |
| `to_compact_with_hints()` | ~100 | AI with complex shapes |
| `to_text()` | ~400 | Human review, debugging |
| `to_json()` | ~300 | Programmatic access |

## AI Interpretation Accuracy

### Simple Patterns (10x10 grid)

| Pattern | Accuracy |
|---------|----------|
| Identical images | ◎ |
| Rectangle added/removed | ◎ |
| Border/frame | ◎ |
| Circle in center | ◎ |
| Horizontal/vertical line | ◎ |
| Scattered dots | ◎ |
| Half image changed | ◎ |
| Diagonal stripe | ◎ |

**Result: 90% accuracy**

### Complex Patterns

| Pattern | Without Hints | With Hints |
|---------|---------------|------------|
| Donut/Ring | ○ "notched rectangle" | ◎ (HAS_HOLE) |
| Arrow | ○ "wedge" | ◎ (DIRECTIONAL) |
| Checkerboard | △ "stripes" | ◎ (REPEATING) |
| Border/Frame | ○ | ◎ (IS_BORDER) |

**Result: 60% → 95% accuracy with hints**

### High-Resolution Mode

For complex shapes, use `grid_size=20`:

```moonbit
let report = diff_report(img1, img2, options, grid_size=20)
```

| Resolution | Tokens | Accuracy |
|------------|--------|----------|
| 10x10 | ~80 | 60% (complex) |
| 20x20 | ~320 | 80% (complex) |
| 10x10 + hints | ~100 | 95% (complex) |

**Recommendation:** Use `to_compact_with_hints()` for best accuracy/token ratio.

## Performance

### `pixelmatch_fast` — Unified API (200x200, Apple M5)

| Scenario | JS (V8) | WASM | Native (C FFI) |
|---|---|---|---|
| Identical | 313µs | **225µs** | **15µs** |
| 5% diff | 307µs | **235µs** | **17µs** |
| All different | 312µs | 394µs | **54µs** |
| 500x500 identical | 1880µs | **1430µs** | **93µs** |

### All Implementations (200x200, identical, Apple M5)

| Implementation | JS (V8) | WASM | Native |
|---|---|---|---|
| `pixelmatch_simple` | 451µs | 402µs | 1190µs |
| `pixelmatch_simple_prefilter` | 313µs | 225µs | 281µs |
| `pixelmatch_native` (C FFI) | N/A | N/A | **15µs** |

### E2E Pipeline with PNG (200x200, `mizchi/image`, Apple M5)

| Step | JS (V8) | WASM |
|---|---|---|
| PNG decode | 18.6ms | 7.4ms |
| `pixelmatch_fast` | 1.1ms | **0.24ms** |
| PNG encode | 29.4ms | 12.5ms |
| **Full pipeline** | **95ms** | **31ms** |

PNG encode/decode dominates the pipeline (97% on WASM, 99% on JS). Optimizing the codec (e.g., native zlib C FFI) has far more impact than pixelmatch itself in E2E scenarios.

### Rust Benchmark (1920x1080, 5% diff, Apple M5)

| Implementation | Time | vs CPU baseline |
|---|---|---|
| CPU simple | 2326µs | 1.0x |
| CPU prefilter | 2338µs | 1.0x |
| Rayon (10 threads) | 550µs | 4.2x |
| Rayon + prefilter | 400µs | **5.8x** |
| GPU (wgpu, incl. transfer) | 4182µs | 0.6x |

### GPU vs CPU Crossover (Apple M5, wgpu/Metal)

GPU compute becomes faster than Rayon+prefilter **only when buffers are already on GPU** (no upload cost). With per-frame upload, CPU always wins.

| Scenario | GPU wins at | Notes |
|---|---|---|
| **Dispatch only, 5% diff** | **~4MP (2048x2048)** | GPU 1354µs vs Rayon 2682µs |
| **Dispatch only, 100% diff** | **~8MP (3840x2160)** | GPU 1286µs vs Rayon 1834µs |
| **Dispatch only, 0% diff** | Never | Prefilter's memcmp skips identical rows; GPU can't |
| **With upload** | Never | Transfer overhead (>10ms at 4K) negates compute gains |

Detailed crossover (5% diff, dispatch only vs Rayon+prefilter):

```
size          pixels   rayon+pf   gpu_dispatch
256x256       0.07MP       55µs       1329µs   ← Rayon 24x faster
1024x1024     1.05MP      306µs       1350µs   ← Rayon 4.4x faster
1920x1080     2.07MP      674µs       1355µs   ← Rayon 2.0x faster
2048x2048     4.19MP     2682µs       1354µs   ← GPU wins (2.0x)
3840x2160     8.29MP     2179µs       1510µs   ← GPU wins (1.4x)
4000x4000    16.00MP     3988µs       2790µs   ← GPU wins (1.4x)
```

### GPU Readback Overhead

The crossover above assumes **diff count only** (4-byte atomic counter readback). If you need a per-pixel diff heatmap, the readback cost changes drastically:

| Size | Pixels | Heatmap readback | Diff-count readback | Overhead |
|---|---|---|---|---|
| 1920x1080 | 2.07MP | 8MB | 4B | **+1.7ms** |
| 3840x2160 | 8.29MP | 32MB | 4B | **+6.5ms** |

Effective GPU time with heatmap readback (dispatch only, prealloc):

```
1920x1080:  dispatch 1.35ms + heatmap readback 1.7ms = ~3.0ms  (vs Rayon 674µs → Rayon wins)
3840x2160:  dispatch 1.51ms + heatmap readback 6.5ms = ~8.0ms  (vs Rayon 2179µs → Rayon wins)
```

**Heatmap readback erases GPU's compute advantage at all tested sizes.** Practical strategies:

1. **Two-stage pipeline**: GPU dispatch for fast diff-count triage (4B readback). Only generate heatmaps on CPU (Rayon) for the few pairs with diff > 0. In typical VRT, 90%+ of pairs are identical.
2. **GPU-side rendering**: Keep heatmap on GPU as a texture and render directly (WebGPU in browser). Zero readback cost.
3. **Partial readback**: Read back only a grid summary (e.g., 64x36 block counts = 9KB) instead of per-pixel data.

### Key Findings

- **Use `pixelmatch_fast`** — automatically picks the best implementation per target
- **WASM is the fastest portable target** — 1.5-2.5x faster than JS across all benchmarks
- **Native C FFI is 15-30x faster than WASM** for pixelmatch itself (15µs vs 225µs @200x200 identical)
- **E2E bottleneck is PNG codec**, not pixelmatch — encode/decode is 97%+ of pipeline time on WASM
- **Row prefilter** skips identical rows with fast memcmp — up to 25x for nearly-identical images
- **Rust Rayon + prefilter** is the fastest CPU option at 5.8x over single-threaded
- **GPU (wgpu)** wins at 4MP+ with pre-allocated buffers for diff-count only, but heatmap readback negates the advantage
- **Best batch VRT architecture**: GPU for triage (diff/no-diff), CPU Rayon for heatmap on flagged pairs

Run benchmarks: `just bench` (MoonBit) / `just bench-rs` (Rust)

## API

### `pixelmatch(img1, img2, output?, options) -> Int`

Compare two images and return the number of different pixels.

### `pixelmatch_simple(img1, img2, threshold) -> Int`

Simple comparison without anti-aliasing detection.

### `pixelmatch_fast(img1, img2, threshold) -> Int`

**Recommended for most use cases.** Unified API that dispatches to the fastest implementation per target:
- **Native**: C FFI with hardware memcmp + LLVM auto-vectorized YIQ delta
- **JS/WASM**: Row-level prefilter (memcmp-style skip)

### `pixelmatch_simple_prefilter(img1, img2, threshold) -> Int`

Simple comparison with row-level prefilter. Skips identical rows using fast comparison.

### `pixelmatch_native(img1, img2, threshold) -> Int` (native target only)

C FFI optimized comparison. Called internally by `pixelmatch_fast` on native target.

### `match_ratio(img1, img2, options) -> Double`

Calculate match ratio (0.0 = completely different, 1.0 = identical).

### `diff_report(img1, img2, options, grid_size~) -> DiffReport`

Generate comprehensive diff report with statistics, heatmap, and regions.

### DiffReport Methods

| Method | Description |
|--------|-------------|
| `to_compact()` | Minimal binary heatmap |
| `to_compact_with_hints()` | With automatic shape hints |
| `to_text()` | Verbose human-readable |
| `to_json()` | Structured JSON |

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
