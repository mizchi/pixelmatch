// Scalar row-equality — used on every target except wasm.

///|
/// Element-wise equality check over two `FixedArray[Int]` slices of length
/// `len` starting at offsets `a_off` / `b_off`. Returns `true` iff every
/// pair matches.
fn row_i32_equal(
  a : FixedArray[Int],
  a_off : Int,
  b : FixedArray[Int],
  b_off : Int,
  len : Int,
) -> Bool {
  for i = 0; i < len; i = i + 1 {
    if a[a_off + i] != b[b_off + i] {
      return false
    }
  }
  true
}
