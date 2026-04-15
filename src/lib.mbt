///|
/// Pixelmatch - Fast pixel-level image comparison library
/// Port of mapbox/pixelmatch to MoonBit

///|
/// RGBA color representation
pub(all) struct Color {
  r : Int
  g : Int
  b : Int
  a : Int
} derive(Debug, Eq)

///|
pub impl Show for Color with output(self, logger) {
  logger.write_string("Color(r=")
  logger.write_string(self.r.to_string())
  logger.write_string(", g=")
  logger.write_string(self.g.to_string())
  logger.write_string(", b=")
  logger.write_string(self.b.to_string())
  logger.write_string(", a=")
  logger.write_string(self.a.to_string())
  logger.write_string(")")
}

///|
pub fn Color::rgba(r : Int, g : Int, b : Int, a : Int) -> Color {
  { r, g, b, a }
}

///|
pub fn Color::rgb(r : Int, g : Int, b : Int) -> Color {
  { r, g, b, a: 255 }
}

///|
/// Image data (RGBA pixels in row-major order)
pub(all) struct Image {
  width : Int
  height : Int
  data : FixedArray[Int] // [r, g, b, a, r, g, b, a, ...]
}

///|
pub fn Image::new(width : Int, height : Int) -> Image {
  if width < 0 || height < 0 {
    abort("Image dimensions must be non-negative")
  }
  // Guard against integer overflow: width * height * 4 must fit in Int
  let pixels = width.to_int64() * height.to_int64()
  if pixels * 4L > 2147483647L {
    abort("Image too large: dimensions would overflow")
  }
  let size = width * height * 4
  { width, height, data: FixedArray::make(size, 0) }
}

///|
pub fn Image::from_pixels(
  width : Int,
  height : Int,
  pixels : Array[Color],
) -> Image {
  let expected = width * height
  if pixels.length() != expected {
    abort(
      "Image::from_pixels: expected " +
      expected.to_string() +
      " pixels, got " +
      pixels.length().to_string(),
    )
  }
  let data = FixedArray::make(expected * 4, 0)
  for i, pixel in pixels {
    let base = i * 4
    data[base] = pixel.r
    data[base + 1] = pixel.g
    data[base + 2] = pixel.b
    data[base + 3] = pixel.a
  }
  { width, height, data }
}

///|
pub fn Image::get_pixel(self : Image, x : Int, y : Int) -> Color {
  let idx = (y * self.width + x) * 4
  {
    r: self.data[idx],
    g: self.data[idx + 1],
    b: self.data[idx + 2],
    a: self.data[idx + 3],
  }
}

///|
pub fn Image::set_pixel(self : Image, x : Int, y : Int, c : Color) -> Unit {
  let idx = (y * self.width + x) * 4
  self.data[idx] = c.r
  self.data[idx + 1] = c.g
  self.data[idx + 2] = c.b
  self.data[idx + 3] = c.a
}

///|
/// Pixelmatch options
pub(all) struct Options {
  /// Matching threshold (0 to 1). Smaller = more sensitive.
  threshold : Double
  /// Include anti-aliased pixels in diff
  include_aa : Bool
  /// Blending factor of unchanged pixels (0 to 1)
  alpha : Double
  /// Color of anti-aliased pixels in diff
  aa_color : Color
  /// Color of different pixels in diff
  diff_color : Color
  /// Detect dark on light differences
  diff_color_alt : Color?
  /// Mask mode - draw only changed pixels
  diff_mask : Bool
  detect_shift : Bool
}

///|
pub fn Options::default() -> Options {
  {
    threshold: 0.1,
    include_aa: false,
    alpha: 0.1,
    aa_color: Color::rgba(255, 255, 0, 255), // Yellow
    diff_color: Color::rgba(255, 0, 0, 255), // Red
    diff_color_alt: None,
    diff_mask: false,
    detect_shift: false,
  }
}

///|
/// Compare two images and return the number of different pixels
/// Optionally writes diff image to output
pub fn pixelmatch(
  img1 : Image,
  img2 : Image,
  output : Image?,
  options : Options,
) -> Int {
  if img1.width != img2.width || img1.height != img2.height {
    abort("Image dimensions must match")
  }
  match output {
    Some(out) =>
      if out.width != img1.width || out.height != img1.height {
        abort("Output image dimensions must match input images")
      }
    None => ()
  }
  let width = img1.width
  let height = img1.height
  // Maximum delta based on threshold
  // 35215 is the maximum possible delta (see YIQ calculation)
  let max_delta = 35215.0 *
    options.threshold *
    options.threshold *
    options.threshold *
    options.threshold
  let mut diff_count = 0
  for y in 0..<height {
    for x in 0..<width {
      let delta = color_delta_at(img1, img2, x, y, false)
      if delta.abs() > max_delta {
        // Check for anti-aliasing
        if !options.include_aa &&
          (is_antialiased(img1, img2, x, y) || is_antialiased(img2, img1, x, y)) {
          // Anti-aliased pixel
          match output {
            Some(out) =>
              if !options.diff_mask {
                out.set_pixel(x, y, options.aa_color)
              }
            None => ()
          }
        } else {
          // Different pixel
          diff_count += 1
          match output {
            Some(out) => {
              let color = if delta < 0.0 {
                options.diff_color_alt.unwrap_or(options.diff_color)
              } else {
                options.diff_color
              }
              out.set_pixel(x, y, color)
            }
            None => ()
          }
        }
      } else {
        // Similar pixel - draw blended grayscale
        match output {
          Some(out) =>
            if !options.diff_mask {
              let gray = blend_gray(img1, x, y, options.alpha)
              out.set_pixel(x, y, gray)
            }
          None => ()
        }
      }
    }
  }
  diff_count
}

///|
/// Calculate color delta between two pixels using YIQ color space
/// Optimized: inline alpha blending
fn color_delta(
  r1 : Int,
  g1 : Int,
  b1 : Int,
  a1 : Int,
  r2 : Int,
  g2 : Int,
  b2 : Int,
  a2 : Int,
  y_only : Bool,
) -> Double {
  // Handle alpha - need to blend both when either is non-opaque or they differ
  let (rf1, gf1, bf1, rf2, gf2, bf2) : (
    Double,
    Double,
    Double,
    Double,
    Double,
    Double,
  ) = if a1 == a2 && a1 == 255 {
    (
      r1.to_double(),
      g1.to_double(),
      b1.to_double(),
      r2.to_double(),
      g2.to_double(),
      b2.to_double(),
    )
  } else {
    let alpha1 = a1.to_double() / 255.0
    let white1 = 255.0 * (1.0 - alpha1)
    let alpha2 = a2.to_double() / 255.0
    let white2 = 255.0 * (1.0 - alpha2)
    (
      r1.to_double() * alpha1 + white1,
      g1.to_double() * alpha1 + white1,
      b1.to_double() * alpha1 + white1,
      r2.to_double() * alpha2 + white2,
      g2.to_double() * alpha2 + white2,
      b2.to_double() * alpha2 + white2,
    )
  }
  // Calculate YIQ components
  let dr = rf1 - rf2
  let dg = gf1 - gf2
  let db = bf1 - bf2
  // Y (luminance)
  let y = 0.29889531 * dr + 0.58662247 * dg + 0.11448223 * db
  if y_only {
    return y
  }
  // I and Q (chrominance)
  let i = 0.59597799 * dr - 0.27417610 * dg - 0.32180189 * db
  let q = 0.21147017 * dr - 0.52261711 * dg + 0.31114694 * db
  // Weighted delta (sign indicates lightening/darkening)
  let delta = 0.5053 * y * y + 0.299 * i * i + 0.1957 * q * q
  if y < 0.0 {
    -delta
  } else {
    delta
  }
}

///|
fn color_delta_at(
  img1 : Image,
  img2 : Image,
  x : Int,
  y : Int,
  y_only : Bool,
) -> Double {
  let idx = (y * img1.width + x) * 4
  color_delta(
    img1.data[idx],
    img1.data[idx + 1],
    img1.data[idx + 2],
    img1.data[idx + 3],
    img2.data[idx],
    img2.data[idx + 1],
    img2.data[idx + 2],
    img2.data[idx + 3],
    y_only,
  )
}

///|
/// Compute luminance delta between two positions in the same image (Y only)
fn luminance_delta_between(
  data : FixedArray[Int],
  width : Int,
  x1 : Int,
  y1 : Int,
  x2 : Int,
  y2 : Int,
) -> Double {
  let idx1 = (y1 * width + x1) * 4
  let idx2 = (y2 * width + x2) * 4
  color_delta(
    data[idx1],
    data[idx1 + 1],
    data[idx1 + 2],
    data[idx1 + 3],
    data[idx2],
    data[idx2 + 1],
    data[idx2 + 2],
    data[idx2 + 3],
    true,
  )
}

///|
/// Check if a pixel is anti-aliased
fn is_antialiased(img1 : Image, img2 : Image, x : Int, y : Int) -> Bool {
  let width = img1.width
  let height = img1.height
  let data1 = img1.data
  // Find min/max luminance delta between center pixel and neighbors
  let mut min_delta = 0.0
  let mut max_delta = 0.0
  let mut min_x = x
  let mut min_y = y
  let mut max_x = x
  let mut max_y = y
  // Check 8 neighbors — compare center (x,y) vs neighbor (nx,ny) in img1
  for dy in -1..<=1 {
    for dx in -1..<=1 {
      if dx == 0 && dy == 0 {
        continue
      }
      let nx = x + dx
      let ny = y + dy
      if nx < 0 || nx >= width || ny < 0 || ny >= height {
        continue
      }
      let delta = luminance_delta_between(data1, width, x, y, nx, ny)
      if delta == 0.0 {
        continue
      }
      if delta < min_delta {
        min_delta = delta
        min_x = nx
        min_y = ny
      }
      if delta > max_delta {
        max_delta = delta
        max_x = nx
        max_y = ny
      }
    }
  }
  // No contrast difference
  if min_delta == 0.0 && max_delta == 0.0 {
    return false
  }
  // Check if darkest/brightest neighbor has 3+ equal siblings in both images
  (
    has_many_siblings(img1, min_x, min_y) &&
    has_many_siblings(img2, min_x, min_y)
  ) ||
  (
    has_many_siblings(img1, max_x, max_y) &&
    has_many_siblings(img2, max_x, max_y)
  )
}

///|
/// Check if pixel has 3+ siblings with similar color
/// Fully unrolled to avoid array allocation
fn has_many_siblings(img : Image, x : Int, y : Int) -> Bool {
  let width = img.width
  let height = img.height
  let data = img.data
  let mut count = 0
  let idx = (y * width + x) * 4
  let r = data[idx]
  let g = data[idx + 1]
  let b = data[idx + 2]
  let a = data[idx + 3]
  let x0 = x > 0
  let x1 = x < width - 1
  let y0 = y > 0
  let y1 = y < height - 1
  // (-1,-1)
  if x0 && y0 {
    let n = ((y - 1) * width + x - 1) * 4
    if (data[n] - r).abs() < 3 && (data[n + 1] - g).abs() < 3 && (data[n + 2] - b).abs() < 3 && (data[n + 3] - a).abs() < 3 {
      count += 1
    }
  }
  // (0,-1)
  if y0 {
    let n = ((y - 1) * width + x) * 4
    if (data[n] - r).abs() < 3 && (data[n + 1] - g).abs() < 3 && (data[n + 2] - b).abs() < 3 && (data[n + 3] - a).abs() < 3 {
      count += 1
      if count >= 3 { return true }
    }
  }
  // (1,-1)
  if x1 && y0 {
    let n = ((y - 1) * width + x + 1) * 4
    if (data[n] - r).abs() < 3 && (data[n + 1] - g).abs() < 3 && (data[n + 2] - b).abs() < 3 && (data[n + 3] - a).abs() < 3 {
      count += 1
      if count >= 3 { return true }
    }
  }
  // (-1,0)
  if x0 {
    let n = (y * width + x - 1) * 4
    if (data[n] - r).abs() < 3 && (data[n + 1] - g).abs() < 3 && (data[n + 2] - b).abs() < 3 && (data[n + 3] - a).abs() < 3 {
      count += 1
      if count >= 3 { return true }
    }
  }
  // (1,0)
  if x1 {
    let n = (y * width + x + 1) * 4
    if (data[n] - r).abs() < 3 && (data[n + 1] - g).abs() < 3 && (data[n + 2] - b).abs() < 3 && (data[n + 3] - a).abs() < 3 {
      count += 1
      if count >= 3 { return true }
    }
  }
  // (-1,1)
  if x0 && y1 {
    let n = ((y + 1) * width + x - 1) * 4
    if (data[n] - r).abs() < 3 && (data[n + 1] - g).abs() < 3 && (data[n + 2] - b).abs() < 3 && (data[n + 3] - a).abs() < 3 {
      count += 1
      if count >= 3 { return true }
    }
  }
  // (0,1)
  if y1 {
    let n = ((y + 1) * width + x) * 4
    if (data[n] - r).abs() < 3 && (data[n + 1] - g).abs() < 3 && (data[n + 2] - b).abs() < 3 && (data[n + 3] - a).abs() < 3 {
      count += 1
      if count >= 3 { return true }
    }
  }
  // (1,1)
  if x1 && y1 {
    let n = ((y + 1) * width + x + 1) * 4
    if (data[n] - r).abs() < 3 && (data[n + 1] - g).abs() < 3 && (data[n + 2] - b).abs() < 3 && (data[n + 3] - a).abs() < 3 {
      count += 1
      if count >= 3 { return true }
    }
  }
  false
}

///|
/// Create a grayscale pixel blended with alpha
fn blend_gray(img : Image, x : Int, y : Int, alpha : Double) -> Color {
  let idx = (y * img.width + x) * 4
  let r = img.data[idx].to_double()
  let g = img.data[idx + 1].to_double()
  let b = img.data[idx + 2].to_double()
  // Luminance
  let lum = (0.299 * r + 0.587 * g + 0.114 * b).to_int()
  let blended = (lum.to_double() * alpha).to_int()
  Color::rgba(blended, blended, blended, 255)
}

///|
/// Inline color delta calculation for maximum performance
/// Returns absolute delta value (always positive)
fn color_delta_inline(
  data1 : FixedArray[Int],
  data2 : FixedArray[Int],
  base : Int,
) -> Double {
  let r1 = data1[base]
  let g1 = data1[base + 1]
  let b1 = data1[base + 2]
  let a1 = data1[base + 3]
  let r2 = data2[base]
  let g2 = data2[base + 1]
  let b2 = data2[base + 2]
  let a2 = data2[base + 3]
  // Early exit for identical pixels
  if r1 == r2 && g1 == g2 && b1 == b2 && a1 == a2 {
    return 0.0
  }
  // Fast path: both fully opaque (most common case)
  let (rf1, gf1, bf1, rf2, gf2, bf2) : (
    Double,
    Double,
    Double,
    Double,
    Double,
    Double,
  ) = if a1 == a2 && a1 == 255 {
    (
      r1.to_double(),
      g1.to_double(),
      b1.to_double(),
      r2.to_double(),
      g2.to_double(),
      b2.to_double(),
    )
  } else {
    // Need to blend both with white
    let alpha1 = a1.to_double() / 255.0
    let white1 = 255.0 * (1.0 - alpha1)
    let alpha2 = a2.to_double() / 255.0
    let white2 = 255.0 * (1.0 - alpha2)
    (
      r1.to_double() * alpha1 + white1,
      g1.to_double() * alpha1 + white1,
      b1.to_double() * alpha1 + white1,
      r2.to_double() * alpha2 + white2,
      g2.to_double() * alpha2 + white2,
      b2.to_double() * alpha2 + white2,
    )
  }
  let dr = rf1 - rf2
  let dg = gf1 - gf2
  let db = bf1 - bf2
  let y = 0.29889531 * dr + 0.58662247 * dg + 0.11448223 * db
  let i = 0.59597799 * dr - 0.27417610 * dg - 0.32180189 * db
  let q = 0.21147017 * dr - 0.52261711 * dg + 0.31114694 * db
  0.5053 * y * y + 0.299 * i * i + 0.1957 * q * q
}

///|
/// Simple comparison without anti-aliasing detection
/// Returns the number of different pixels
/// Optimized: inline delta calculation, minimize function calls
pub fn pixelmatch_simple(img1 : Image, img2 : Image, threshold : Double) -> Int {
  if img1.width != img2.width || img1.height != img2.height {
    abort("Image dimensions must match")
  }
  let max_delta = 35215.0 * threshold * threshold * threshold * threshold
  let mut diff_count = 0
  let len = img1.data.length() / 4
  let data1 = img1.data
  let data2 = img2.data
  for i in 0..<len {
    let base = i * 4
    let delta = color_delta_inline(data1, data2, base)
    if delta > max_delta {
      diff_count += 1
    }
  }
  diff_count
}

///|
/// Simple comparison with row-level prefilter optimization.
/// Skips entire rows where all pixels are identical (common in VRT screenshots).
/// Falls back to per-pixel delta for rows with differences.
pub fn pixelmatch_simple_prefilter(
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
    let row_end = row_start + width * 4
    // Fast path: check if entire row is identical
    let mut row_identical = true
    for i = row_start; i < row_end; i = i + 1 {
      if data1[i] != data2[i] {
        row_identical = false
        break
      }
    }
    if row_identical {
      continue
    }
    // Slow path: compute per-pixel delta for this row
    for x in 0..<width {
      let base = row_start + x * 4
      let delta = color_delta_inline(data1, data2, base)
      if delta > max_delta {
        diff_count += 1
      }
    }
  }
  diff_count
}

///|
/// Calculate match ratio (0.0 = completely different, 1.0 = identical)
pub fn match_ratio(img1 : Image, img2 : Image, options : Options) -> Double {
  let total = img1.width * img1.height
  if total == 0 {
    return 1.0
  }
  let diff = pixelmatch(img1, img2, None, options)
  1.0 - diff.to_double() / total.to_double()
}

// ============================================================================
// AI-friendly Diff Report
// ============================================================================

///|
/// Bounding box for a diff region
pub(all) struct DiffRegion {
  x : Int
  y : Int
  width : Int
  height : Int
  diff_pixels : Int
  region_type : String // "shift" | "content" | "edge"
}

///|
/// Comprehensive diff report for AI consumption
pub(all) struct DiffReport {
  // Basic statistics
  width : Int
  height : Int
  total_pixels : Int
  diff_count : Int
  aa_count : Int
  match_ratio : Double
  // Grid heatmap (cell values = diff count in that cell)
  grid : Array[Array[Int]]
  grid_cols : Int
  grid_rows : Int
  // Diff regions (bounding boxes of clustered differences)
  regions : Array[DiffRegion]
  // Classification summary
  shift_only : Bool
  content_change_count : Int
  // Shift compensation
  global_shift : Int
  shift_regions : Array[ShiftRegion]
  compensated_diff_count : Int
}

///|
pub(all) struct ShiftRegion {
  y_start : Int
  y_end : Int
  shift : Int
}

///|
/// Compute average luminance (Y channel) per row
pub fn luminance_profile(img : Image) -> FixedArray[Double] {
  let profile : FixedArray[Double] = FixedArray::make(img.height, 0.0)
  let data = img.data
  let width = img.width
  let inv_width = 1.0 / width.to_double()
  for y in 0..<img.height {
    let mut sum = 0.0
    let row_base = y * width * 4
    for x in 0..<width {
      let base = row_base + x * 4
      let r = data[base].to_double()
      let g = data[base + 1].to_double()
      let b = data[base + 2].to_double()
      sum += 0.299 * r + 0.587 * g + 0.114 * b
    }
    profile[y] = sum * inv_width
  }
  profile
}

///|
/// Compute normalized cross-correlation at a specific offset
fn cross_correlate_at(
  profile1 : FixedArray[Double],
  off1 : Int,
  profile2 : FixedArray[Double],
  off2 : Int,
  len1 : Int,
  len2 : Int,
  offset : Int,
) -> Double {
  let mut sum_xy = 0.0
  let mut sum_xx = 0.0
  let mut sum_yy = 0.0
  let start = if offset > 0 { offset } else { 0 }
  let n = if len1 < len2 { len1 } else { len2 }
  let end = if offset > 0 { n } else { n + offset }
  for i in start..<end {
    let j = i - offset
    let x = profile1[off1 + j]
    let y = profile2[off2 + i]
    sum_xy += x * y
    sum_xx += x * x
    sum_yy += y * y
  }
  let denom = (sum_xx * sum_yy).sqrt()
  if denom > 0.0 { sum_xy / denom } else { 0.0 }
}

///|
/// Detect global vertical shift via two-phase cross-correlation
/// Phase 1: coarse search with stride, Phase 2: refine around best
/// Returns offset (positive = img2 shifted down relative to img1)
pub fn detect_global_shift(
  profile1 : FixedArray[Double],
  profile2 : FixedArray[Double],
  max_shift : Int,
) -> Int {
  let n = profile1.length()
  if n != profile2.length() || n == 0 {
    return 0
  }
  let limit = if max_shift < n / 4 { max_shift } else { n / 4 }
  // For small ranges, do a direct scan
  if limit <= 16 {
    let mut best_corr = -1.0
    let mut best_offset = 0
    let mut offset = -limit
    while offset <= limit {
      let corr = cross_correlate_at(profile1, 0, profile2, 0, n, n, offset)
      if corr > best_corr {
        best_corr = corr
        best_offset = offset
      }
      offset += 1
    }
    return best_offset
  }
  // Phase 1: coarse search with stride
  let stride = if limit > 64 { limit / 16 } else { 4 }
  let mut best_corr = -1.0
  let mut coarse_best = 0
  let mut offset = -limit
  while offset <= limit {
    let corr = cross_correlate_at(profile1, 0, profile2, 0, n, n, offset)
    if corr > best_corr {
      best_corr = corr
      coarse_best = offset
    }
    offset += stride
  }
  // Phase 2: refine within ±stride of coarse best
  let refine_lo = if coarse_best - stride > -limit {
    coarse_best - stride
  } else {
    -limit
  }
  let refine_hi = if coarse_best + stride < limit {
    coarse_best + stride
  } else {
    limit
  }
  let mut best_offset = coarse_best
  offset = refine_lo
  while offset <= refine_hi {
    let corr = cross_correlate_at(profile1, 0, profile2, 0, n, n, offset)
    if corr > best_corr {
      best_corr = corr
      best_offset = offset
    }
    offset += 1
  }
  best_offset
}

///|
/// Detect shift for a window slice of the profiles (no array copy)
fn detect_window_shift(
  profile1 : FixedArray[Double],
  profile2 : FixedArray[Double],
  offset : Int,
  len : Int,
  max_shift : Int,
) -> Int {
  let limit = if max_shift < len / 4 { max_shift } else { len / 4 }
  let mut best_corr = -1.0
  let mut best_offset = 0
  // For windows, limit is usually small enough for direct scan
  if limit <= 16 {
    let mut off = -limit
    while off <= limit {
      let corr = cross_correlate_at(profile1, offset, profile2, offset, len, len, off)
      if corr > best_corr {
        best_corr = corr
        best_offset = off
      }
      off += 1
    }
    return best_offset
  }
  // Two-phase for larger limits
  let stride = if limit > 64 { limit / 16 } else { 4 }
  let mut coarse_best = 0
  let mut off = -limit
  while off <= limit {
    let corr = cross_correlate_at(profile1, offset, profile2, offset, len, len, off)
    if corr > best_corr {
      best_corr = corr
      coarse_best = off
    }
    off += stride
  }
  let refine_lo = if coarse_best - stride > -limit { coarse_best - stride } else { -limit }
  let refine_hi = if coarse_best + stride < limit { coarse_best + stride } else { limit }
  best_offset = coarse_best
  off = refine_lo
  while off <= refine_hi {
    let corr = cross_correlate_at(profile1, offset, profile2, offset, len, len, off)
    if corr > best_corr {
      best_corr = corr
      best_offset = off
    }
    off += 1
  }
  best_offset
}

///|
/// Detect piecewise vertical shifts using sliding window cross-correlation
pub fn detect_piecewise_shift(
  profile1 : FixedArray[Double],
  profile2 : FixedArray[Double],
  max_shift : Int,
  window_size~ : Int = 100,
) -> Array[ShiftRegion] {
  let n = profile1.length()
  if n == 0 {
    return []
  }
  let step = window_size / 2
  let step = if step < 1 { 1 } else { step }
  let window_shifts : Array[(Int, Int, Int)] = []
  let mut y = 0
  while y < n {
    let end = if y + window_size > n { n } else { y + window_size }
    let len = end - y
    if len < 4 {
      break
    }
    let shift = detect_window_shift(profile1, profile2, y, len, max_shift)
    window_shifts.push((y, end, shift))
    y += step
  }
  if window_shifts.length() == 0 {
    return [{ y_start: 0, y_end: n, shift: 0 }]
  }
  let regions : Array[ShiftRegion] = []
  let (first_start, first_end, first_shift) = window_shifts[0]
  let mut current_start = first_start
  let mut current_end = first_end
  let mut current_shift = first_shift
  for i in 1..<window_shifts.length() {
    let (_, w_end, w_shift) = window_shifts[i]
    if w_shift == current_shift {
      current_end = w_end
    } else {
      regions.push({ y_start: current_start, y_end: current_end, shift: current_shift })
      current_start = current_end
      current_end = w_end
      current_shift = w_shift
    }
  }
  regions.push({ y_start: current_start, y_end: current_end, shift: current_shift })
  regions
}

///|
fn color_delta_inline2(
  data1 : FixedArray[Int],
  base1 : Int,
  data2 : FixedArray[Int],
  base2 : Int,
) -> Double {
  let r1 = data1[base1]
  let g1 = data1[base1 + 1]
  let b1 = data1[base1 + 2]
  let a1 = data1[base1 + 3]
  let r2 = data2[base2]
  let g2 = data2[base2 + 1]
  let b2 = data2[base2 + 2]
  let a2 = data2[base2 + 3]
  // Early exit for identical pixels
  if r1 == r2 && g1 == g2 && b1 == b2 && a1 == a2 {
    return 0.0
  }
  let (rf1, gf1, bf1, rf2, gf2, bf2) : (Double, Double, Double, Double, Double, Double) = if a1 == a2 &&
    a1 == 255 {
    (
      r1.to_double(), g1.to_double(), b1.to_double(),
      r2.to_double(), g2.to_double(), b2.to_double(),
    )
  } else {
    let alpha1 = a1.to_double() / 255.0
    let white1 = 255.0 * (1.0 - alpha1)
    let alpha2 = a2.to_double() / 255.0
    let white2 = 255.0 * (1.0 - alpha2)
    (
      r1.to_double() * alpha1 + white1, g1.to_double() * alpha1 + white1,
      b1.to_double() * alpha1 + white1, r2.to_double() * alpha2 + white2,
      g2.to_double() * alpha2 + white2, b2.to_double() * alpha2 + white2,
    )
  }
  let dr = rf1 - rf2
  let dg = gf1 - gf2
  let db = bf1 - bf2
  let y = 0.29889531 * dr + 0.58662247 * dg + 0.11448223 * db
  let i = 0.59597799 * dr - 0.27417610 * dg - 0.32180189 * db
  let q = 0.21147017 * dr - 0.52261711 * dg + 0.31114694 * db
  0.5053 * y * y + 0.299 * i * i + 0.1957 * q * q
}

///|
pub fn compensated_diff(
  img1 : Image,
  img2 : Image,
  shift_regions : Array[ShiftRegion],
  threshold : Double,
) -> Int {
  if img1.width != img2.width || img1.height != img2.height {
    abort("Image dimensions must match")
  }
  let width = img1.width
  let height = img1.height
  let max_delta = 35215.0 * threshold * threshold * threshold * threshold
  let data1 = img1.data
  let data2 = img2.data
  let mut count = 0
  for region in shift_regions {
    for y in region.y_start..<region.y_end {
      let src_y = y - region.shift
      if src_y < 0 || src_y >= height {
        count += width
        continue
      }
      let row1 = src_y * width * 4
      let row2 = y * width * 4
      // Row prefilter: skip if rows are identical after shift
      let row_len = width * 4
      let mut row_identical = true
      for i in 0..<row_len {
        if data1[row1 + i] != data2[row2 + i] {
          row_identical = false
          break
        }
      }
      if row_identical {
        continue
      }
      for x in 0..<width {
        let base1 = row1 + x * 4
        let base2 = row2 + x * 4
        let delta = color_delta_inline2(data1, base1, data2, base2)
        if delta > max_delta {
          count += 1
        }
      }
    }
  }
  count
}

///|
/// Generate a comprehensive diff report
/// Optimized: pre-allocate arrays, cache references
pub fn diff_report(
  img1 : Image,
  img2 : Image,
  options : Options,
  grid_size? : Int = 10,
) -> DiffReport {
  if img1.width != img2.width || img1.height != img2.height {
    abort("Image dimensions must match")
  }
  let width = img1.width
  let height = img1.height
  let total_pixels = width * height
  let max_delta = 35215.0 *
    options.threshold *
    options.threshold *
    options.threshold *
    options.threshold
  // Initialize grid - pre-allocate
  let grid_cols = if width < grid_size { 1 } else { grid_size }
  let grid_rows = if height < grid_size { 1 } else { grid_size }
  let cell_w = width / grid_cols
  let cell_h = height / grid_rows
  let grid : Array[Array[Int]] = Array::make(grid_rows, [])
  for i in 0..<grid_rows {
    grid[i] = Array::make(grid_cols, 0)
  }
  // Collect diff pixels - use flat array for diff_map
  let mut diff_count = 0
  let mut aa_count = 0
  let diff_map : FixedArray[Bool] = FixedArray::make(width * height, false)
  let data1 = img1.data
  let data2 = img2.data
  for y in 0..<height {
    let row_offset = y * width
    let row_start = row_offset * 4
    let row_end = row_start + width * 4
    // Row prefilter: skip identical rows entirely
    let mut row_identical = true
    for i = row_start; i < row_end; i = i + 1 {
      if data1[i] != data2[i] {
        row_identical = false
        break
      }
    }
    if row_identical {
      continue
    }
    for x in 0..<width {
      let base = (row_offset + x) * 4
      let delta = color_delta_inline(data1, data2, base)
      if delta > max_delta {
        if !options.include_aa &&
          (is_antialiased(img1, img2, x, y) || is_antialiased(img2, img1, x, y)) {
          aa_count += 1
        } else {
          diff_count += 1
          diff_map[row_offset + x] = true
          // Update grid
          let gx = if cell_w > 0 { x / cell_w } else { 0 }
          let gy = if cell_h > 0 { y / cell_h } else { 0 }
          let gx = if gx >= grid_cols { grid_cols - 1 } else { gx }
          let gy = if gy >= grid_rows { grid_rows - 1 } else { gy }
          grid[gy][gx] += 1
        }
      }
    }
  }
  // Find connected regions using simple bounding box detection
  let regions = find_diff_regions_flat(diff_map, width, height)
  let match_ratio = if total_pixels > 0 {
    1.0 - diff_count.to_double() / total_pixels.to_double()
  } else {
    1.0
  }
  // Compute classification summary
  let mut content_change_count = 0
  let mut has_non_shift = false
  for region in regions {
    if region.region_type == "content" {
      content_change_count += 1
      has_non_shift = true
    } else if region.region_type == "edge" {
      has_non_shift = true
    }
  }
  let shift_only = regions.length() > 0 && !has_non_shift
  let (global_shift, shift_regions, compensated_diff_count) = if options.detect_shift &&
    height > 4 {
    let p1 = luminance_profile(img1)
    let p2 = luminance_profile(img2)
    let max_shift_val = if height / 4 < 500 { height / 4 } else { 500 }
    let gs = detect_global_shift(p1, p2, max_shift_val)
    let sr = detect_piecewise_shift(p1, p2, max_shift_val, window_size=100)
    let cd = compensated_diff(img1, img2, sr, options.threshold)
    (gs, sr, cd)
  } else {
    (0, ([] : Array[ShiftRegion]), 0)
  }
  {
    width,
    height,
    total_pixels,
    diff_count,
    aa_count,
    match_ratio,
    grid,
    grid_cols,
    grid_rows,
    regions,
    shift_only,
    content_change_count,
    global_shift,
    shift_regions,
    compensated_diff_count,
  }
}

///|
/// Classify a diff region as "shift", "content", or "edge"
fn classify_region(region : DiffRegion, image_width : Int) -> String {
  if region.height <= 2 || region.width <= 2 {
    "edge"
  } else if region.width.to_double() / region.height.to_double() > 3.0 &&
    region.width > image_width * 80 / 100 {
    "shift"
  } else {
    "content"
  }
}

///|
/// Find bounding boxes of diff regions using connected component labeling
/// Optimized: use flat arrays, check bounds before push
fn find_diff_regions_flat(
  diff_map : FixedArray[Bool],
  width : Int,
  height : Int,
) -> Array[DiffRegion] {
  let size = width * height
  let visited : FixedArray[Bool] = FixedArray::make(size, false)
  let regions : Array[DiffRegion] = []
  for y in 0..<height {
    for x in 0..<width {
      let idx = y * width + x
      if diff_map[idx] && !visited[idx] {
        // Found unvisited diff pixel, flood fill to find region
        let mut min_x = x
        let mut max_x = x
        let mut min_y = y
        let mut max_y = y
        let mut pixel_count = 0
        // Simple flood fill using stack - pre-check bounds before push
        let stack : Array[Int] = [idx]
        while stack.length() > 0 {
          let cidx = stack.pop().unwrap()
          if visited[cidx] || !diff_map[cidx] {
            continue
          }
          visited[cidx] = true
          pixel_count += 1
          let cx = cidx % width
          let cy = cidx / width
          if cx < min_x {
            min_x = cx
          }
          if cx > max_x {
            max_x = cx
          }
          if cy < min_y {
            min_y = cy
          }
          if cy > max_y {
            max_y = cy
          }
          // Add neighbors: check visited and diff_map before push to avoid
          // pushing the same pixel multiple times (up to 4x per pixel)
          if cx > 0 {
            let n = cidx - 1
            if !visited[n] && diff_map[n] {
              stack.push(n)
            }
          }
          if cx < width - 1 {
            let n = cidx + 1
            if !visited[n] && diff_map[n] {
              stack.push(n)
            }
          }
          if cy > 0 {
            let n = cidx - width
            if !visited[n] && diff_map[n] {
              stack.push(n)
            }
          }
          if cy < height - 1 {
            let n = cidx + width
            if !visited[n] && diff_map[n] {
              stack.push(n)
            }
          }
        }
        if pixel_count > 0 {
          let region : DiffRegion = {
            x: min_x,
            y: min_y,
            width: max_x - min_x + 1,
            height: max_y - min_y + 1,
            diff_pixels: pixel_count,
            region_type: "",
          }
          regions.push(
            { ..region, region_type: classify_region(region, width) },
          )
        }
      }
    }
  }
  regions
}

///|
/// Convert DiffReport to AI-readable text format
pub fn DiffReport::to_text(self : DiffReport) -> String {
  let mut s = "=== Diff Report ===\n"
  // Summary
  s += "Summary:\n"
  s += "  Image size: " +
    self.width.to_string() +
    "x" +
    self.height.to_string() +
    "\n"
  s += "  Total pixels: " + self.total_pixels.to_string() + "\n"
  s += "  Different pixels: " + self.diff_count.to_string() + "\n"
  s += "  Anti-aliased pixels: " + self.aa_count.to_string() + "\n"
  let pct = (self.match_ratio * 100.0).to_int()
  s += "  Match ratio: " + pct.to_string() + "%\n"
  // Verdict
  s += "\nVerdict: "
  if self.diff_count == 0 {
    s += "IDENTICAL\n"
  } else if self.match_ratio > 0.99 {
    s += "NEARLY_IDENTICAL (minor differences)\n"
  } else if self.match_ratio > 0.95 {
    s += "SIMILAR (small differences)\n"
  } else if self.match_ratio > 0.8 {
    s += "DIFFERENT (moderate differences)\n"
  } else {
    s += "VERY_DIFFERENT (major differences)\n"
  }
  // Grid heatmap
  s += "\nHeatmap (" +
    self.grid_cols.to_string() +
    "x" +
    self.grid_rows.to_string() +
    " grid):\n"
  // Find max for normalization
  let mut max_val = 1
  for row in self.grid {
    for val in row {
      if val > max_val {
        max_val = val
      }
    }
  }
  // Header
  s += "  "
  for i in 0..<self.grid_cols {
    s += (i % 10).to_string()
  }
  s += "\n"
  // Rows
  for row_idx, row in self.grid {
    s += (row_idx % 10).to_string() + " "
    for val in row {
      let intensity = val.to_double() / max_val.to_double()
      let ch = if val == 0 {
        "."
      } else if intensity < 0.25 {
        "░"
      } else if intensity < 0.5 {
        "▒"
      } else if intensity < 0.75 {
        "▓"
      } else {
        "█"
      }
      s += ch
    }
    s += "\n"
  }
  // Regions
  if self.regions.length() > 0 {
    s += "\nDiff Regions (" + self.regions.length().to_string() + "):\n"
    for i, region in self.regions {
      s += "  [" + i.to_string() + "] "
      s += "type=" + region.region_type + " "
      s += "pos=(" + region.x.to_string() + "," + region.y.to_string() + ") "
      s += "size=" +
        region.width.to_string() +
        "x" +
        region.height.to_string() +
        " "
      s += "pixels=" + region.diff_pixels.to_string() + "\n"
    }
  }
  // Classification
  s += "\nClassification:\n"
  let shift_only_str = if self.shift_only { "true" } else { "false" }
  s += "  Shift only: " + shift_only_str + "\n"
  s += "  Content changes: " + self.content_change_count.to_string() + "\n"
  if self.global_shift != 0 || self.shift_regions.length() > 0 {
    s += "\nShift Analysis:\n"
    s += "  Global shift: " + self.global_shift.to_string() + "px\n"
    s += "  Compensated diff: " + self.compensated_diff_count.to_string() + " pixels\n"
    if self.shift_regions.length() > 0 {
      s += "  Shift regions:\n"
      for sr in self.shift_regions {
        s += "    y=[" + sr.y_start.to_string() + ".." + sr.y_end.to_string() + "] shift=" + sr.shift.to_string() + "px\n"
      }
    }
  }
  s
}

///|
/// Convert DiffReport to compact AI format
/// Minimal tokens, maximum spatial information
pub fn DiffReport::to_compact(self : DiffReport) -> String {
  let mut s = ""
  // One-line summary
  let pct = (self.match_ratio * 100.0).to_int()
  s += "diff:" +
    self.diff_count.to_string() +
    "/" +
    self.total_pixels.to_string() +
    "(" +
    pct.to_string() +
    "%match)\n"
  // Binary heatmap - single chars, no spaces
  for row in self.grid {
    for val in row {
      s += if val == 0 { "." } else { "X" }
    }
    s += "\n"
  }
  // Compact regions: type:x,y,w,h format
  if self.regions.length() > 0 {
    s += "regions:"
    for i, r in self.regions {
      if i > 0 {
        s += ";"
      }
      s += r.region_type +
        ":" +
        r.x.to_string() +
        "," +
        r.y.to_string() +
        "," +
        r.width.to_string() +
        "x" +
        r.height.to_string()
    }
    s += "\n"
  }
  s
}

///|
/// Analyze grid pattern to detect shape hints
fn detect_shape_hints(
  grid : Array[Array[Int]],
  regions : Array[DiffRegion],
) -> Array[String] {
  let hints : Array[String] = []
  let rows = grid.length()
  let cols = if rows > 0 { grid[0].length() } else { 0 }
  if rows == 0 || cols == 0 {
    return hints
  }
  // Check for hole (ring/donut): diff on edges but gap in middle
  // Check inner gap (center area has significantly less diff than edges)
  // Use smaller center region (middle 20%) for better hole detection
  let center_start_r = rows * 2 / 5
  let center_end_r = rows * 3 / 5
  let center_start_c = cols * 2 / 5
  let center_end_c = cols * 3 / 5
  let mut center_weight = 0
  let mut edge_weight = 0
  let mut total_weight = 0
  for r in 0..<rows {
    for c in 0..<cols {
      let v = grid[r][c]
      total_weight += v
      if r >= center_start_r &&
        r < center_end_r &&
        c >= center_start_c &&
        c < center_end_c {
        center_weight += v
      } else {
        edge_weight += v
      }
    }
  }
  // If edges have significantly more diff than center, likely has a hole
  // Use ratio < 0.2 for smaller center region
  let has_hole = edge_weight > 0 &&
    center_weight.to_double() / total_weight.to_double() < 0.05
  if has_hole && regions.length() == 1 {
    hints.push("HAS_HOLE: shape may have empty center (ring/donut/frame)")
  }
  // Check for border/frame pattern
  let mut is_border = true
  let rows_inner = rows - 1
  let cols_inner = cols - 1
  for r in 1..<rows_inner {
    for c in 1..<cols_inner {
      if grid[r][c] > 0 {
        // Check if it's only on edges
        let on_edge = r < 2 || r >= rows - 2 || c < 2 || c >= cols - 2
        if !on_edge {
          is_border = false
        }
      }
    }
  }
  if is_border && (grid[0][0] > 0 || grid[0][cols - 1] > 0) {
    hints.push("IS_BORDER: changes only on edges (frame pattern)")
  }
  // Check for directional shape (asymmetric)
  let mut top_weight = 0
  let mut bottom_weight = 0
  let mut left_weight = 0
  let mut right_weight = 0
  for r in 0..<rows {
    for c in 0..<cols {
      let v = grid[r][c]
      if r < rows / 2 {
        top_weight += v
      } else {
        bottom_weight += v
      }
      if c < cols / 2 {
        left_weight += v
      } else {
        right_weight += v
      }
    }
  }
  let vertical_ratio = if bottom_weight > 0 {
    top_weight.to_double() / bottom_weight.to_double()
  } else {
    0.0
  }
  let horizontal_ratio = if right_weight > 0 {
    left_weight.to_double() / right_weight.to_double()
  } else {
    0.0
  }
  // Only add directional hints if there's a significant imbalance
  // Use 1.08 threshold (8% asymmetry), but only show the most prominent direction
  // Prefer vertical direction when asymmetries are equal (arrows typically point up/down)
  let v_asymmetry = if vertical_ratio > 1.0 {
    vertical_ratio
  } else {
    1.0 / vertical_ratio
  }
  let h_asymmetry = if horizontal_ratio > 1.0 {
    horizontal_ratio
  } else {
    1.0 / horizontal_ratio
  }
  // Only show directional hint for the dominant axis, and only if significant
  if v_asymmetry >= 1.08 &&
    v_asymmetry >= h_asymmetry &&
    top_weight + bottom_weight > 0 {
    let dir = if vertical_ratio >= 1.08 {
      "top-heavy (pointing up?)"
    } else {
      "bottom-heavy (pointing down?)"
    }
    hints.push("DIRECTIONAL: " + dir)
  } else if h_asymmetry >= 1.08 && left_weight + right_weight > 0 {
    let dir = if horizontal_ratio >= 1.08 {
      "left-heavy (pointing left?)"
    } else {
      "right-heavy (pointing right?)"
    }
    hints.push("DIRECTIONAL: " + dir)
  }
  // Check for multiple separate regions
  if regions.length() > 3 {
    hints.push(
      "MULTI_REGION: " +
      regions.length().to_string() +
      " separate areas (scattered or pattern)",
    )
  }
  // Check for repeating pattern (checkerboard-like)
  if regions.length() > 5 {
    let first = regions[0]
    let mut same_size = true
    for i in 1..<regions.length() {
      let r = regions[i]
      if (r.width - first.width).abs() > 2 ||
        (r.height - first.height).abs() > 2 {
        same_size = false
      }
    }
    if same_size {
      hints.push("REPEATING: similar-sized regions (grid/checkerboard pattern)")
    }
  }
  hints
}

///|
/// Convert DiffReport to compact format with shape hints
/// Adds contextual hints to help AI interpretation
pub fn DiffReport::to_compact_with_hints(self : DiffReport) -> String {
  let mut s = self.to_compact()
  let hints = detect_shape_hints(self.grid, self.regions)
  if hints.length() > 0 {
    s += "hints:"
    for i, hint in hints {
      if i > 0 {
        s += ";"
      }
      s += hint
    }
    s += "\n"
  }
  s
}

///|
/// Convert DiffReport to JSON string
pub fn DiffReport::to_json(self : DiffReport) -> String {
  let mut s = "{\n"
  s += "  \"width\": " + self.width.to_string() + ",\n"
  s += "  \"height\": " + self.height.to_string() + ",\n"
  s += "  \"total_pixels\": " + self.total_pixels.to_string() + ",\n"
  s += "  \"diff_count\": " + self.diff_count.to_string() + ",\n"
  s += "  \"aa_count\": " + self.aa_count.to_string() + ",\n"
  s += "  \"match_ratio\": " + self.match_ratio.to_string() + ",\n"
  // Grid
  s += "  \"grid\": [\n"
  for row_idx, row in self.grid {
    s += "    ["
    for col_idx, val in row {
      s += val.to_string()
      if col_idx < row.length() - 1 {
        s += ", "
      }
    }
    s += "]"
    if row_idx < self.grid.length() - 1 {
      s += ","
    }
    s += "\n"
  }
  s += "  ],\n"
  // Regions
  s += "  \"regions\": [\n"
  for i, region in self.regions {
    s += "    {\"x\": " + region.x.to_string()
    s += ", \"y\": " + region.y.to_string()
    s += ", \"width\": " + region.width.to_string()
    s += ", \"height\": " + region.height.to_string()
    s += ", \"diff_pixels\": " + region.diff_pixels.to_string()
    s += ", \"region_type\": \"" + region.region_type + "\"}"
    if i < self.regions.length() - 1 {
      s += ","
    }
    s += "\n"
  }
  s += "  ],\n"
  let shift_only_str = if self.shift_only { "true" } else { "false" }
  s += "  \"shift_only\": " + shift_only_str + ",\n"
  s += "  \"content_change_count\": " +
    self.content_change_count.to_string() +
    ",\n"
  s += "  \"global_shift\": " + self.global_shift.to_string() + ",\n"
  s += "  \"compensated_diff_count\": " + self.compensated_diff_count.to_string() + ",\n"
  s += "  \"shift_regions\": [\n"
  for i, sr in self.shift_regions {
    s += "    {\"y_start\": " + sr.y_start.to_string()
    s += ", \"y_end\": " + sr.y_end.to_string()
    s += ", \"shift\": " + sr.shift.to_string() + "}"
    if i < self.shift_regions.length() - 1 {
      s += ","
    }
    s += "\n"
  }
  s += "  ]\n"
  s += "}"
  s
}
