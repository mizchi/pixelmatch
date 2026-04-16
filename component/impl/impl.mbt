///|
fn bytes_to_image(data : Array[Byte], width : UInt, height : UInt) -> @pm.Image {
  let w = width.reinterpret_as_int()
  let h = height.reinterpret_as_int()
  let expected = w * h * 4
  if data.length() != expected {
    abort(
      "bytes_to_image: expected " +
      expected.to_string() +
      " bytes, got " +
      data.length().to_string(),
    )
  }
  let pixels : Array[@pm.Color] = Array::new(capacity=w * h)
  let mut i = 0
  while i + 3 < data.length() {
    pixels.push(
      @pm.Color::rgba(
        data[i].to_int(),
        data[i + 1].to_int(),
        data[i + 2].to_int(),
        data[i + 3].to_int(),
      ),
    )
    i += 4
  }
  @pm.Image::from_pixels(w, h, pixels)
}

///|
fn image_to_bytes(img : @pm.Image) -> Array[Byte] {
  let len = img.data.length()
  let data : Array[Byte] = Array::new(capacity=len)
  for i in 0..<len {
    data.push(img.data[i].to_byte())
  }
  data
}

///|
fn make_pm_opts(
  threshold : Double,
  include_aa : Bool,
  alpha : Double,
  diff_mask : Bool,
  detect_shift~ : Bool = false,
) -> @pm.Options {
  {
    threshold,
    include_aa,
    alpha,
    aa_color: @pm.Color::rgba(255, 255, 0, 255),
    diff_color: @pm.Color::rgba(255, 0, 0, 255),
    diff_color_alt: None,
    diff_mask,
    detect_shift,
  }
}

///|
fn pixelmatch(
  img1_data : Array[Byte],
  img2_data : Array[Byte],
  width : UInt,
  height : UInt,
  include_output : Bool,
  threshold : Double,
  include_aa : Bool,
  alpha : Double,
  diff_mask : Bool,
) -> MatchResult {
  let img1 = bytes_to_image(img1_data, width, height)
  let img2 = bytes_to_image(img2_data, width, height)
  let opts = make_pm_opts(threshold, include_aa, alpha, diff_mask)
  if include_output {
    let w = width.reinterpret_as_int()
    let h = height.reinterpret_as_int()
    let out = @pm.Image::new(w, h)
    let diff_count = @pm.pixelmatch(img1, img2, Some(out), opts)
    {
      diff_count: diff_count.reinterpret_as_uint(),
      output: Some(image_to_bytes(out)),
    }
  } else {
    let diff_count = @pm.pixelmatch(img1, img2, None, opts)
    { diff_count: diff_count.reinterpret_as_uint(), output: None }
  }
}

///|
fn pixelmatch_simple(
  img1_data : Array[Byte],
  img2_data : Array[Byte],
  width : UInt,
  height : UInt,
  threshold : Double,
) -> UInt {
  let img1 = bytes_to_image(img1_data, width, height)
  let img2 = bytes_to_image(img2_data, width, height)
  @pm.pixelmatch_simple(img1, img2, threshold).reinterpret_as_uint()
}

///|
fn diff_report(
  img1_data : Array[Byte],
  img2_data : Array[Byte],
  width : UInt,
  height : UInt,
  threshold : Double,
  include_aa : Bool,
  alpha : Double,
  diff_mask : Bool,
  grid_size : UInt,
  detect_shift : Bool,
) -> String {
  let img1 = bytes_to_image(img1_data, width, height)
  let img2 = bytes_to_image(img2_data, width, height)
  let opts = make_pm_opts(threshold, include_aa, alpha, diff_mask, detect_shift~)
  let gs = grid_size.reinterpret_as_int()
  let report = @pm.diff_report(img1, img2, opts, grid_size=gs)
  report.to_json()
}

///|
fn match_ratio(
  img1_data : Array[Byte],
  img2_data : Array[Byte],
  width : UInt,
  height : UInt,
  threshold : Double,
  include_aa : Bool,
  alpha : Double,
  diff_mask : Bool,
) -> Double {
  let img1 = bytes_to_image(img1_data, width, height)
  let img2 = bytes_to_image(img2_data, width, height)
  let opts = make_pm_opts(threshold, include_aa, alpha, diff_mask)
  @pm.match_ratio(img1, img2, opts)
}
