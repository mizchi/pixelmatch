///|
/// Native-only: C memcmp-based row equality check (zero-copy)
#borrow(a, b)
extern "C" fn c_row_equal(
  a : FixedArray[Int],
  b : FixedArray[Int],
  offset : Int,
  len : Int,
) -> Int = "c_row_equal"

///|
/// Native-only: C-optimized row diff count with YIQ delta (zero-copy)
#borrow(data1, data2)
extern "C" fn c_row_diff_count(
  data1 : FixedArray[Int],
  data2 : FixedArray[Int],
  row_start : Int,
  width : Int,
  max_delta : Double,
) -> Int = "c_row_diff_count"

///|
/// Native-optimized pixelmatch using C memcmp + C YIQ delta.
/// Zero-copy: FixedArray[Int] is passed directly as int32_t* to C.
///|
/// Fastest available simple comparison for this target.
/// On native: C FFI with hardware memcmp + LLVM auto-vectorized YIQ delta.
/// On JS/WASM: falls back to pixelmatch_simple_prefilter (defined in lib_nonjs.mbt).
pub fn pixelmatch_fast(
  img1 : Image,
  img2 : Image,
  threshold : Double,
) -> Int {
  pixelmatch_native(img1, img2, threshold)
}

///|
pub fn pixelmatch_native(
  img1 : Image,
  img2 : Image,
  threshold : Double,
) -> Int {
  if img1.width != img2.width || img1.height != img2.height {
    abort("Image dimensions must match")
  }
  let max_delta = 35215.0 * threshold * threshold * threshold * threshold
  let width = img1.width
  let height = img1.height
  let data1 = img1.data
  let data2 = img2.data
  let mut diff_count = 0
  for y in 0..<height {
    let row_start = y * width * 4
    let row_len = width * 4
    if c_row_equal(data1, data2, row_start, row_len) == 1 {
      continue
    }
    diff_count += c_row_diff_count(data1, data2, row_start, width, max_delta)
  }
  diff_count
}
