///|
/// Fastest available simple comparison for this target.
/// On JS/WASM: uses row-level prefilter (memcmp-style skip).
/// On native: replaced by C FFI implementation (lib_native.mbt).
pub fn pixelmatch_fast(
  img1 : Image,
  img2 : Image,
  threshold : Double,
) -> Int {
  pixelmatch_simple_prefilter(img1, img2, threshold)
}
