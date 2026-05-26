// SIMD row-equality — wasm target only.
//
// Element-wise compare over two `FixedArray[Int]` slices via inline-WAT
// v128: 4 i32 / iter through `v128.load + i32x4.eq + i8x16.bitmask`.
// Branchless mismatch accumulation (no inline-WAT `if/return` — the
// Dwarfsm parser handles those unreliably).
//
// On `pixelmatch_simple_prefilter` benches this gives roughly 5–6× over
// the scalar walk (e.g. 200×200 identical: 195 µs → 34 µs).

///|
/// True iff `a[a_off..a_off+len]` == `b[b_off..b_off+len]` element-wise.
fn row_i32_equal(
  a : FixedArray[Int],
  a_off : Int,
  b : FixedArray[Int],
  b_off : Int,
  len : Int,
) -> Bool {
  row_i32_equal_v128(a, a_off * 4, b, b_off * 4, len) != 0
}

///|
/// Returns 1 iff equal, 0 iff differs anywhere.
///
/// Params: 0 = a base, 1 = a byte offset, 2 = b base, 3 = b byte offset,
/// 4 = `len` (i32 element count).
/// Locals: 5 = vec_end (= len & ~3), 6 = i, 7 = mismatch flag (0/1).
#borrow(a, b)
fn row_i32_equal_v128(
  a : FixedArray[Int],
  a_byte_off : Int,
  b : FixedArray[Int],
  b_byte_off : Int,
  len : Int,
) -> Int =
  #|(func (param i32) (param i32) (param i32) (param i32) (param i32) (result i32) (local i32) (local i32) (local i32) local.get 4 i32.const 2 i32.shr_s i32.const 2 i32.shl local.set 5 block loop local.get 6 local.get 5 i32.ge_s br_if 1 local.get 7 local.get 0 local.get 1 i32.add local.get 6 i32.const 2 i32.shl i32.add v128.load local.get 2 local.get 3 i32.add local.get 6 i32.const 2 i32.shl i32.add v128.load i32x4.eq i8x16.bitmask i32.const 65535 i32.ne i32.or local.set 7 local.get 6 i32.const 4 i32.add local.set 6 br 0 end end block loop local.get 6 local.get 4 i32.ge_s br_if 1 local.get 7 local.get 0 local.get 1 i32.add local.get 6 i32.const 2 i32.shl i32.add i32.load local.get 2 local.get 3 i32.add local.get 6 i32.const 2 i32.shl i32.add i32.load i32.ne i32.or local.set 7 local.get 6 i32.const 1 i32.add local.set 6 br 0 end end local.get 7 i32.eqz)
