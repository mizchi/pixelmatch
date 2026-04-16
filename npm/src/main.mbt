///|
/// Convert JS Uint8Array (as FixedArray[Int]) to pixelmatch Image
fn to_image(
  data : FixedArray[Int],
  width : Int,
  height : Int,
) -> @pm.Image {
  let expected = width * height * 4
  if data.length() != expected {
    abort(
      "pixelmatch: expected " +
      expected.to_string() +
      " pixel values (width=" +
      width.to_string() +
      " * height=" +
      height.to_string() +
      " * 4), got " +
      data.length().to_string(),
    )
  }
  { width, height, data }
}

///|
/// pixelmatch with full options, returns JSON string
/// JS wrapper will parse the result
pub fn pixelmatch_js(
  img1_data : FixedArray[Int],
  img2_data : FixedArray[Int],
  width : Int,
  height : Int,
  include_output : Bool,
  threshold : Double,
  include_aa : Bool,
  alpha : Double,
  diff_mask : Bool,
) -> String {
  let img1 = to_image(img1_data, width, height)
  let img2 = to_image(img2_data, width, height)
  let opts : @pm.Options = {
    threshold,
    include_aa,
    alpha,
    aa_color: @pm.Color::rgba(255, 255, 0, 255),
    diff_color: @pm.Color::rgba(255, 0, 0, 255),
    diff_color_alt: None,
    diff_mask,
    detect_shift: false,
  }
  if include_output {
    let out = @pm.Image::new(width, height)
    let diff_count = @pm.pixelmatch(img1, img2, Some(out), opts)
    // Return JSON: {"diffCount": N, "output": [r,g,b,a,...]}
    let mut s = "{\"diffCount\":" + diff_count.to_string() + ",\"output\":["
    for i in 0..<out.data.length() {
      if i > 0 {
        s += ","
      }
      s += out.data[i].to_string()
    }
    s += "]}"
    s
  } else {
    let diff_count = @pm.pixelmatch(img1, img2, None, opts)
    "{\"diffCount\":" + diff_count.to_string() + "}"
  }
}

///|
/// Simple pixelmatch - returns diff count directly
pub fn pixelmatch_simple_js(
  img1_data : FixedArray[Int],
  img2_data : FixedArray[Int],
  width : Int,
  height : Int,
  threshold : Double,
) -> Int {
  let img1 = to_image(img1_data, width, height)
  let img2 = to_image(img2_data, width, height)
  @pm.pixelmatch_simple(img1, img2, threshold)
}

///|
/// Match ratio - returns similarity score
pub fn match_ratio_js(
  img1_data : FixedArray[Int],
  img2_data : FixedArray[Int],
  width : Int,
  height : Int,
  threshold : Double,
  include_aa : Bool,
  alpha : Double,
  diff_mask : Bool,
) -> Double {
  let img1 = to_image(img1_data, width, height)
  let img2 = to_image(img2_data, width, height)
  let opts : @pm.Options = {
    threshold,
    include_aa,
    alpha,
    aa_color: @pm.Color::rgba(255, 255, 0, 255),
    diff_color: @pm.Color::rgba(255, 0, 0, 255),
    diff_color_alt: None,
    diff_mask,
    detect_shift: false,
  }
  @pm.match_ratio(img1, img2, opts)
}

///|
/// Diff report - returns JSON string
pub fn diff_report_js(
  img1_data : FixedArray[Int],
  img2_data : FixedArray[Int],
  width : Int,
  height : Int,
  threshold : Double,
  include_aa : Bool,
  alpha : Double,
  diff_mask : Bool,
  grid_size : Int,
  detect_shift : Bool,
) -> String {
  let img1 = to_image(img1_data, width, height)
  let img2 = to_image(img2_data, width, height)
  let opts : @pm.Options = {
    threshold,
    include_aa,
    alpha,
    aa_color: @pm.Color::rgba(255, 255, 0, 255),
    diff_color: @pm.Color::rgba(255, 0, 0, 255),
    diff_color_alt: None,
    diff_mask,
    detect_shift,
  }
  let report = @pm.diff_report(img1, img2, opts, grid_size~)
  report.to_json()
}

///|
fn main {
  ()
}
